import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from db import engine
from models import Base
from routers import post, user, comment, friends, notifications
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis

load_dotenv()

Base.metadata.create_all(bind=engine)

# Connect slowapi rate limiter to Redis
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
limiter = Limiter(key_func=get_remote_address, storage_uri=redis_url)

app = FastAPI()

@app.on_event("startup")
async def startup():
    redis = aioredis.from_url(redis_url, encoding="utf8", decode_responses=True)
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")

# Register the limiter and its error handler on the app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Read comma-separated origins from .env — no localhost hardcoded in source.
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(post.router)
app.include_router(comment.router)
app.include_router(friends.router)
app.include_router(notifications.router)


@app.get("/")
def root():
    return {"message": "PostApp API is running"}
