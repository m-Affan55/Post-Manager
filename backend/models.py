# here we define our models

from sqlalchemy import Column, Integer, String,ForeignKey
from sqlalchemy.orm import DeclarativeBase,relationship
class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String, unique=True)
    password = Column(String)
    posts = relationship("Post", back_populates="user")
    comments = relationship("Comment", back_populates="user")


class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String , nullable=False)
    content = Column(String, nullable=False)
    likes = Column(Integer, default = 0)
    user = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post")

class Comment(Base):
    __tablename__= "comments"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    post_id = Column(Integer, ForeignKey("posts.id"))
    content = Column(String)
    post = relationship("Post", back_populates="comments")
    user = relationship("User", back_populates="comments")


class Friendship(Base):
    __tablename__ = "friendships"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    friend_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending")
    requester = relationship("User", foreign_keys=[user_id])
    addressee = relationship("User", foreign_keys=[friend_id])