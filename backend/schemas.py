from pydantic import BaseModel, EmailStr, validator
import re

class UserCreate(BaseModel):
    name: str
    password: str
    email: EmailStr

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PostCreate(BaseModel):
    title: str
    content: str

class CommentCreate(BaseModel):
    content: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

class CommentResponse(BaseModel):
    id: int
    content: str
    post_id: int
    user: UserResponse
    class Config:
        from_attributes = True

class LikeResponse(BaseModel):
    id: int
    user_id: int
    post_id: int
    class Config:
        from_attributes = True

class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    likes: list[LikeResponse] = []
    user: UserResponse
    comments: list[CommentResponse] = []
    class Config:
        from_attributes = True

class CommentUpdate(BaseModel):
    content: str

class FriendRequestResponse(BaseModel):
    id: int
    user_id: int
    friend_id: int
    status: str
    requester: UserResponse
    addressee: UserResponse
    class Config:
        from_attributes = True
