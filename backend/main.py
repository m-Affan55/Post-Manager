from fastapi import FastAPI
from db import engine
from models import Base
from routers import post ,auth , user

Base.metadata.create_all(bind=engine)
app = FastAPI()
app.include_router(user.router)
app.include_router(post.router)
app.include_router(auth.router)

@app.get('/')
def root():
    return {"message": "Hello World"}
