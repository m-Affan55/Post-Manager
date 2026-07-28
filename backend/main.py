from fastapi import FastAPI
from db import engine
from models import Base


Base.metadata.create_all(bind=engine)
app = FastAPI()

@app.get('/')
def root():
    return {"message": "Hello World"}
