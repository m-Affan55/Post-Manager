from fastapi import FastAPI
from db import engine
from models import Base
from routers import post 


Base.metadata.create_all(bind=engine)
app = FastAPI()
app.include_router(post.router)

@app.get('/')
def root():
    return {"message": "Hello World"}
