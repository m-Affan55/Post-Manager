#here we write db connection set up
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///post.db"
engine = create_engine(DATABASE_URL,
    connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)