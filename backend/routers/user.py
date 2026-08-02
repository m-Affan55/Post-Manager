from fastapi import APIRouter, Depends, HTTPException, Request
from dependencies import get_db
from sqlalchemy.orm import Session
from schemas import UserCreate, UserResponse, UserLogin
from models import User
from passlib.context import CryptContext
from routers.auth import get_current_user, create_access_token
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/users", tags=["Users"])

bycrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/register", response_model=UserResponse, status_code=201)
# Rate limit: max 5 registration attempts per minute per IP.
# Prevents account-flooding / scraping attacks.
@limiter.limit("5/minute")
def create_user(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    email_exits = db.query(User).filter(User.email == user.email).first()
    if email_exits is not None:
        raise HTTPException(status_code=400, detail="Email already exists")
    new_user = User(name=user.name, email=user.email, password=bycrypt_context.hash(user.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=dict)
# Rate limit: max 10 login attempts per minute per IP.
# Prevents brute-force password attacks on the login endpoint.
@limiter.limit("10/minute")
def login_user(request: Request, user: UserLogin, db: Session = Depends(get_db)):
    # Same error for wrong email AND wrong password — prevents user enumeration.
    INVALID_CREDENTIALS = HTTPException(status_code=401, detail="Invalid email or password")

    current_user = db.query(User).filter(User.email == user.email).first()
    if current_user is None:
        raise INVALID_CREDENTIALS

    if not bycrypt_context.verify(user.password, current_user.password):
        raise INVALID_CREDENTIALS

    token = create_access_token({"sub": str(current_user.id)})
    return {"token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: int = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/", response_model=list[UserResponse])
def get_all_users(current_user: int = Depends(get_current_user), db: Session = Depends(get_db)):
    users = db.query(User).filter(User.id != current_user).all()
    return users