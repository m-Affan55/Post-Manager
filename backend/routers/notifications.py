from fastapi import APIRouter, Depends, HTTPException, Query, status
from dependencies import get_db
from sqlalchemy.orm import Session
from schemas import NotificationResponse
from routers.auth import get_current_user
import models

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=list[NotificationResponse])
def get_notifications(
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifications = (
        db.query(models.Notification)
        .filter(models.Notification.user_id == current_user)
        .order_by(models.Notification.id.desc())
        .all()
    )
    return notifications

@router.put("/{notification_id}/read", response_model=NotificationResponse)
def read_notification(
    notification_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.is_read = 1
    db.commit()
    db.refresh(notification)
    return notification

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    db.delete(notification)
    db.commit()
    return
