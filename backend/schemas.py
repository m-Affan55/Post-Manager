from pydantic import BaseModel, EmailStr, field_validator, Field
import re


class UserCreate(BaseModel):
    # min_length=1 rejects empty strings; max_length=100 prevents absurdly long names.
    name: str = Field(min_length=1, max_length=100)
    password: str
    email: EmailStr

    @field_validator('name')
    @classmethod
    def strip_name(cls, v: str) -> str:
        """Remove leading/trailing whitespace so '   ' cannot pass min_length=1."""
        v = v.strip()
        if not v:
            raise ValueError('Name cannot be blank')
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
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
    # Whitespace-only titles are rejected by min_length after stripping.
    title: str = Field(min_length=1, max_length=300)
    content: str = Field(min_length=1, max_length=10000)

    @field_validator('title', 'content')
    @classmethod
    def strip_and_check(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('Field cannot be blank or whitespace only')
        return v


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)

    @field_validator('content')
    @classmethod
    def strip_content(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('Comment cannot be blank')
        return v


class CommentUpdate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)

    @field_validator('content')
    @classmethod
    def strip_content(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('Comment cannot be blank')
        return v


# ── Response models (read from DB → sent to client) ──────────────────────────
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


class FriendRequestResponse(BaseModel):
    id: int
    user_id: int
    friend_id: int
    status: str
    requester: UserResponse
    addressee: UserResponse

    class Config:
        from_attributes = True
