from fastapi import APIRouter, Depends, HTTPException, Response, status
from dependencies import get_db
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from schemas import FriendRequestResponse
from routers.auth import get_current_user
import models

router = APIRouter(prefix="/friends", tags=["Friendships"])

@router.post("/request/{user_id}", response_model=FriendRequestResponse)
def send_friend_request(user_id: int, current_user: int = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_id == current_user:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")
    
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    existing_request = db.query(models.Friendship).filter(
        or_(
            and_(models.Friendship.user_id == current_user, models.Friendship.friend_id == user_id),
            and_(models.Friendship.user_id == user_id, models.Friendship.friend_id == current_user)
        )
    ).first()
    
    if existing_request:
        raise HTTPException(status_code=400, detail="Friendship or pending request already exists")
        
    new_request = models.Friendship(user_id=current_user, friend_id=user_id, status="pending")
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

@router.get("/requests", response_model=list[FriendRequestResponse])
def get_friend_requests(current_user: int = Depends(get_current_user), db: Session = Depends(get_db)):
    requests = db.query(models.Friendship).filter(
        models.Friendship.friend_id == current_user, 
        models.Friendship.status == "pending"
    ).all()
    return requests

@router.put("/{friendship_id}/accept", response_model=FriendRequestResponse)
def accept_friend_request(friendship_id: int, current_user: int = Depends(get_current_user), db: Session = Depends(get_db)):
    friendship = db.query(models.Friendship).filter(
        models.Friendship.id == friendship_id,
        models.Friendship.friend_id == current_user,
        models.Friendship.status == "pending"
    ).first()
    
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found or not yours to accept")
        
    friendship.status = "accepted"
    db.commit()
    db.refresh(friendship)
    return friendship

@router.delete("/{friendship_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
def reject_or_remove_friend(friendship_id: int, current_user: int = Depends(get_current_user), db: Session = Depends(get_db)):
    friendship = db.query(models.Friendship).filter(
        models.Friendship.id == friendship_id,
        or_(models.Friendship.user_id == current_user, models.Friendship.friend_id == current_user)
    ).first()
    
    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship record not found")
        
    db.delete(friendship)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/", response_model=list[FriendRequestResponse])
def get_all_friends(current_user: int = Depends(get_current_user), db: Session = Depends(get_db)):
    friends = db.query(models.Friendship).filter(
        or_(models.Friendship.user_id == current_user, models.Friendship.friend_id == current_user),
        models.Friendship.status == "accepted"
    ).all()
    return friends