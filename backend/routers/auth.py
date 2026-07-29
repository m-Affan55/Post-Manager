import os
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer
from fastapi import HTTPException, Depends
from jose import jwt, JWTError
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
print("SECRET_KEY:", SECRET_KEY)
print("ALGORITHM:", ALGORITHM)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int (payload.get("sub"))
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")