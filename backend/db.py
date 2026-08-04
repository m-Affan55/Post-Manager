#here we write db connection set up
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres:123Abc@localhost:5432/post_website_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
