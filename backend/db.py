#here we write db connection set up
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import os

from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file

# If DATABASE_URL is set (like in Docker), use it.
# Otherwise, construct it from individual environment variables.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD")
    db_name = os.getenv("POSTGRES_DB", "post_website_db")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    
    if not password:
        raise ValueError("POSTGRES_PASSWORD environment variable must be set")
        
    DATABASE_URL = f"postgresql://{user}:{password}@{host}:{port}/{db_name}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
