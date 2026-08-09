"""
Redis-backed WebSocket connection manager for real-time chat.

Key design decisions:
- _connections maps user_id -> set[WebSocket] for multi-tab/multi-device support.
- Subscriber uses redis_client.pubsub() (dedicated connection from pool).
- Shared redis client is used ONLY for PUBLISH calls (normal command, safe to share).
- JWT validation is pure CPU (no DB hit) — user_id comes from the token payload.
"""

import os
import json
import asyncio
import logging

from fastapi import WebSocket, WebSocketDisconnect
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self._redis = None
        # user_id -> set of active WebSocket connections (multi-tab support)
        self._connections: dict[int, set[WebSocket]] = {}
        # user_id -> (asyncio.Task for listener, PubSub instance)
        self._pubsub_tasks: dict[int, tuple[asyncio.Task, object]] = {}

    def set_redis(self, redis_client):
        """Store the shared redis client for PUBLISH calls only."""
        self._redis = redis_client

    async def connect(self, websocket: WebSocket, user_id: int):
        """Register a WebSocket and subscribe to Redis if first connection for this user."""
        if user_id not in self._connections:
            self._connections[user_id] = set()
        self._connections[user_id].add(websocket)

        # First connection for this user on this replica — subscribe to Redis
        if user_id not in self._pubsub_tasks:
            pubsub = self._redis.pubsub()
            await pubsub.subscribe(f"chat:{user_id}")
            task = asyncio.create_task(self._redis_listener(user_id, pubsub))
            self._pubsub_tasks[user_id] = (task, pubsub)
            logger.info(f"User {user_id} subscribed to chat channel")

    async def disconnect(self, websocket: WebSocket, user_id: int):
        """Remove a WebSocket and unsubscribe from Redis if no connections remain."""
        if user_id in self._connections:
            self._connections[user_id].discard(websocket)
            # If no more connections for this user, clean up Redis subscription
            if not self._connections[user_id]:
                del self._connections[user_id]
                if user_id in self._pubsub_tasks:
                    task, pubsub = self._pubsub_tasks.pop(user_id)
                    task.cancel()
                    try:
                        await pubsub.unsubscribe(f"chat:{user_id}")
                        await pubsub.close()
                    except Exception:
                        pass  # Best effort cleanup
                    logger.info(f"User {user_id} unsubscribed from chat channel")

    async def publish(self, sender_id: int, receiver_id: int, message_dict: dict):
        """
        Publish a message to both sender and receiver Redis channels.
        Sender echo enables multi-tab sync for the sender's other open tabs.
        message_dict must be a plain JSON-safe dict (no ORM objects, no datetimes).
        """
        if not self._redis:
            logger.warning("Redis client not set, cannot publish")
            return
        payload = json.dumps(message_dict)
        await self._redis.publish(f"chat:{receiver_id}", payload)
        await self._redis.publish(f"chat:{sender_id}", payload)

    async def _redis_listener(self, user_id: int, pubsub):
        """
        Listen on a dedicated pubsub connection and fan out messages
        to all WebSocket connections for this user.
        """
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = message["data"]
                    # Fan out to all open tabs/devices for this user
                    dead_sockets = set()
                    for ws in self._connections.get(user_id, set()):
                        try:
                            await ws.send_text(data)
                        except Exception:
                            dead_sockets.add(ws)
                    # Clean up any broken connections
                    for ws in dead_sockets:
                        self._connections.get(user_id, set()).discard(ws)
        except asyncio.CancelledError:
            pass  # Normal shutdown
        except Exception as e:
            logger.error(f"Redis listener error for user {user_id}: {e}")


# Singleton instance
manager = ConnectionManager()


async def ws_chat(websocket: WebSocket):
    """
    WebSocket endpoint for real-time chat.
    
    Auth flow: client must send {"type": "auth", "token": "..."} within 5 seconds.
    After auth, the connection is kept alive. All message writes go through REST endpoints.
    The WS is server→client push only.
    """
    await websocket.accept()

    # 5-second auth timeout — prevents unauthenticated resource exhaustion (DoS vector)
    try:
        auth_msg = await asyncio.wait_for(websocket.receive_json(), timeout=5.0)
    except asyncio.TimeoutError:
        await websocket.close(code=4001, reason="Auth timeout")
        return
    except WebSocketDisconnect:
        return
    except Exception:
        await websocket.close(code=4001, reason="Auth timeout")
        return

    # JWT validation — pure CPU, no DB hit (user_id is in the token payload)
    token = auth_msg.get("token")
    if not token:
        await websocket.close(code=4003, reason="No token provided")
        return

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise ValueError("No sub claim")
        user_id = int(user_id_str)
    except (JWTError, ValueError, TypeError):
        await websocket.close(code=4003, reason="Invalid token")
        return

    # Auth successful — register connection
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keepalive only — all message writes go through REST
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket, user_id)
