from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from dependencies import get_db
from sqlalchemy.orm import Session
from schemas import PostResponse, PostCreate
from routers.auth import get_current_user
import models

router = APIRouter(prefix="/posts", tags=["Posts"])


def _get_post_or_404(post_id: int, db: Session) -> models.Post:
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.get("/", response_model=list[PostResponse])
def get_all_posts(
    # skip/limit give us pagination: "skip the first N results, give me the next M"
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Max records to return"),
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    posts = (
        db.query(models.Post)
        .filter(models.Post.user_id == current_user)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return posts


@router.get("/feed", response_model=list[PostResponse])
def get_feed_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # We still do the engagement sort, but only on the current PAGE of results.
    # A proper solution would push this sort into SQL (future work).
    posts = db.query(models.Post).offset(skip).limit(limit).all()
    posts.sort(key=lambda p: len(p.likes) + len(p.comments), reverse=True)
    return posts


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post: PostCreate,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_post = models.Post(title=post.title, content=post.content, user_id=current_user)
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post


@router.put("/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int,
    post: PostCreate,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Step 1: Does the post exist at all? → 404
    existing_post = _get_post_or_404(post_id, db)
    # Step 2: Does it belong to the current user? → 403
    # These are two separate checks so the status codes are semantically correct.
    if existing_post.user_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorised to edit this post")

    existing_post.title = post.title
    existing_post.content = post.content
    db.commit()
    db.refresh(existing_post)
    return existing_post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_post = _get_post_or_404(post_id, db)
    if existing_post.user_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorised to delete this post")
    db.delete(existing_post)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{post_id}", response_model=PostResponse)
def get_post(
    post_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_post = _get_post_or_404(post_id, db)
    if existing_post.user_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorised to view this post")
    return existing_post


@router.post("/{post_id}/like", status_code=status.HTTP_201_CREATED)
def like_post(
    post_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_post_or_404(post_id, db)  # raises 404 if post doesn't exist
    existing_like = db.query(models.Like).filter(
        models.Like.post_id == post_id, models.Like.user_id == current_user
    ).first()
    if existing_like:
        raise HTTPException(status_code=400, detail="Post already liked")

    new_like = models.Like(user_id=current_user, post_id=post_id)
    db.add(new_like)
    db.commit()
    db.refresh(new_like)
    return new_like


@router.delete("/{post_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def unlike_post(
    post_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_like = db.query(models.Like).filter(
        models.Like.post_id == post_id, models.Like.user_id == current_user
    ).first()
    if not existing_like:
        raise HTTPException(status_code=404, detail="Like not found")
    db.delete(existing_like)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/{post_id}/share/{friend_id}", response_model=models.Notification.__name__ if False else dict)
def share_post(
    post_id: int,
    friend_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if post exists
    post = _get_post_or_404(post_id, db)
    
    # Check if they are friends (either requester or addressee)
    friendship = db.query(models.Friendship).filter(
        (
            ((models.Friendship.user_id == current_user) & (models.Friendship.friend_id == friend_id)) |
            ((models.Friendship.user_id == friend_id) & (models.Friendship.friend_id == current_user))
        ),
        models.Friendship.status == "accepted"
    ).first()
    
    if not friendship:
        raise HTTPException(status_code=403, detail="You can only share posts with your friends")
        
    # Create notification
    notification = models.Notification(
        user_id=friend_id,
        sender_id=current_user,
        post_id=post_id,
        message=f"shared a post with you"
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return {"message": "Post shared successfully"}
