from fastapi import APIRouter, Depends , HTTPException
from dependencies import get_db
from sqlalchemy.orm import Session
from schemas import UserCreate, UserResponse , UserLogin
from models import User
from passlib.context import CryptContext
from jose import jwt
router = APIRouter(prefix="/users" ,tags=["Users"])


bycrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
@router.post("/register" , response_model=UserResponse)
def create_user( user : UserCreate , db: Session = Depends(get_db)):
    email_exits = db.query(User).filter(User.email == user.email).first()
    if email_exits is not None:
        raise HTTPException(status_code=400, detail="Email already exists")
    new_user = User(name=user.name, email=user.email, password=bycrypt_context.hash(user.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=UserResponse)
def login_user(user : UserLogin, db : Session =  Depends(get_db)):
    current_user = db.query(User).filter(user.email == User.email).first() 
    if current_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if(bycrypt_context.verify(user.password , current_user.password)):
        return {"message" : "Login successful"}
    return {"message" : "Invalid credentials"}


