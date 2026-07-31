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
