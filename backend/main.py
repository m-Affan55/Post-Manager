from fastapi import FastAPI
from db import engine
from models import Base
from routers import post , user
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)
app = FastAPI()
origins= ["http://localhost:5173","http://localhost:5174"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(user.router)
app.include_router(post.router)

@app.get('/')
def root():
    return {"message": "Hello World"}
