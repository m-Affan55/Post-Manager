/**
 * WebSocket client for real-time chat.
 *
 * - Computes WS URL from API_BASE_URL (http→ws, https→wss).
 * - Sends auth frame immediately on open.
 * - Exposes onMessage(callback) for components to subscribe.
 * - Auto-reconnects with exponential backoff (1s → 2s → 4s → max 30s).
 */

import { API_BASE_URL } from "../config.js";

class ChatWebSocket {
    constructor() {
        this._ws = null;
        this._listeners = new Set();
        this._reconnectDelay = 1000;
        this._maxReconnectDelay = 30000;
        this._shouldReconnect = false;
        this._reconnectTimer = null;
    }

    /**
     * Compute the WebSocket URL from the REST API base URL.
     */
    _getWsUrl() {
        const url = API_BASE_URL.replace(/^http/, "ws");
        return `${url.replace(/\/+$/, "")}/ws/chat`;
    }

    /**
     * Connect to the WebSocket server.
     * Sends the auth frame immediately after the connection opens.
     */
    connect() {
        const token = localStorage.getItem("token");
        if (!token) return;

        // If already connected or currently trying to connect, don't restart it
        if (this._ws && (this._ws.readyState === WebSocket.OPEN || this._ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        this._shouldReconnect = true;
        this._cleanup();

        try {
            this._ws = new WebSocket(this._getWsUrl());
        } catch (e) {
            console.error("WebSocket connection failed:", e);
            this._scheduleReconnect();
            return;
        }

        this._ws.onopen = () => {
            // Send auth frame as the first message
            this._ws.send(JSON.stringify({ type: "auth", token }));
            // Reset backoff on successful connection
            this._reconnectDelay = 1000;
        };

        this._ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Notify all subscribed components
                for (const listener of this._listeners) {
                    listener(data);
                }
            } catch (e) {
                console.error("Failed to parse WS message:", e);
            }
        };

        this._ws.onclose = (event) => {
            if (this._shouldReconnect && event.code !== 4003) {
                this._scheduleReconnect();
            }
        };

        this._ws.onerror = () => {
            // onclose will fire after onerror — reconnect happens there
        };
    }

    /**
     * Schedule a reconnection with exponential backoff.
     */
    _scheduleReconnect() {
        if (this._reconnectTimer) return;
        this._reconnectTimer = setTimeout(() => {
            this._reconnectTimer = null;
            this.connect();
        }, this._reconnectDelay);
        // Exponential backoff: 1s → 2s → 4s → 8s → ... → max 30s
        this._reconnectDelay = Math.min(this._reconnectDelay * 2, this._maxReconnectDelay);
    }

    /**
     * Clean up existing connection without triggering reconnect.
     */
    _cleanup() {
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
        if (this._ws) {
            this._ws.onclose = null;
            this._ws.onerror = null;
            this._ws.onmessage = null;
            try {
                this._ws.close();
            } catch (e) { /* ignore */ }
            this._ws = null;
        }
    }

    /**
     * Disconnect and stop reconnecting.
     */
    disconnect() {
        this._shouldReconnect = false;
        this._cleanup();
        this._listeners.clear();
    }

    /**
     * Subscribe to incoming messages.
     * Returns an unsubscribe function.
     */
    onMessage(callback) {
        this._listeners.add(callback);
        return () => this._listeners.delete(callback);
    }

    /**
     * Check if the WebSocket is currently connected and open.
     */
    isConnected() {
        return this._ws && this._ws.readyState === WebSocket.OPEN;
    }
}

// Singleton instance
const chatWs = new ChatWebSocket();
export default chatWs;
