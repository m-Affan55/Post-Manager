# here we will write pydantic code
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    name: str
    password: str
    email: EmailStr

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PostCreate(BaseModel):
    title: str
    content: str

class CommentCreate(BaseModel):
    post_id: int
    content: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

class PostResponse(BaseModel):
    id: int
    title: str
    content: str

class CommentResponse(BaseModel):
    id: int
    content: str
    post_id: int
