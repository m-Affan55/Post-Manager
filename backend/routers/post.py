from fastapi import APIRouter, Depends, HTTPException, Query, Response, status, BackgroundTasks
from fastapi_cache.decorator import cache
from fastapi_cache import FastAPICache
from dependencies import get_db
from sqlalchemy.orm import Session
from schemas import PostResponse, PostCreate
from routers.auth import get_current_user
from sqlalchemy.orm import joinedload
from sqlalchemy import func
import models

router = APIRouter(prefix="/posts", tags=["Posts"])


def _get_post_or_404(post_id: int, db: Session, eager_load: bool = False) -> models.Post:
    query = db.query(models.Post).filter(models.Post.id == post_id)
    if eager_load:
        query = query.options(
            joinedload(models.Post.likes),
            joinedload(models.Post.comments),
            joinedload(models.Post.user),
        )
    post = query.first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.get("", response_model=list[PostResponse])
def get_all_posts(
    # skip/limit give us pagination: "skip the first N results, give me the next M"
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Max records to return"),
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    posts = (
        db.query(models.Post)
        .options(
            joinedload(models.Post.likes),
            joinedload(models.Post.comments),
            joinedload(models.Post.user),
        )
        .filter(models.Post.user_id == current_user)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return posts


@router.get("/feed", response_model=list[PostResponse])
@cache(namespace="feed")
def get_feed_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    posts = (
        db.query(models.Post)
        .options(
            joinedload(models.Post.likes),
            joinedload(models.Post.comments),
            joinedload(models.Post.user),
        )
        .outerjoin(models.Like, models.Like.post_id == models.Post.id)
        .group_by(models.Post.id)
        .order_by(func.count(models.Like.id).desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return posts


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post: PostCreate,
    background_tasks: BackgroundTasks,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_post = models.Post(title=post.title, content=post.content, user_id=current_user)
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    background_tasks.add_task(FastAPICache.clear, namespace="feed")
    return new_post


@router.put("/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int,
    post: PostCreate,
    background_tasks: BackgroundTasks,
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
    background_tasks.add_task(FastAPICache.clear, namespace="feed")
    return existing_post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    background_tasks: BackgroundTasks,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_post = _get_post_or_404(post_id, db)
    if existing_post.user_id != current_user:
        raise HTTPException(status_code=403, detail="Not authorised to delete this post")
    db.delete(existing_post)
    db.commit()
    background_tasks.add_task(FastAPICache.clear, namespace="feed")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{post_id}", response_model=PostResponse)
def get_post(
    post_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_post = _get_post_or_404(post_id, db, eager_load=True)
    if existing_post.user_id != current_user:
        # Check if they are friends
        friendship = db.query(models.Friendship).filter(
            (
                ((models.Friendship.user_id == current_user) & (models.Friendship.friend_id == existing_post.user_id)) |
                ((models.Friendship.user_id == existing_post.user_id) & (models.Friendship.friend_id == current_user))
            ),
            models.Friendship.status == "accepted"
        ).first()
        if not friendship:
            raise HTTPException(status_code=403, detail="Not authorised to view this post")
    return existing_post


@router.post("/{post_id}/like", status_code=status.HTTP_201_CREATED)
def like_post(
    post_id: int,
    background_tasks: BackgroundTasks,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = _get_post_or_404(post_id, db)  # raises 404 if post doesn't exist
    existing_like = db.query(models.Like).filter(
        models.Like.post_id == post_id, models.Like.user_id == current_user
    ).first()
    if existing_like:
        raise HTTPException(status_code=400, detail="Post already liked")

    new_like = models.Like(user_id=current_user, post_id=post_id)
    db.add(new_like)
    
    # FEAT-7: Create notification for post owner (don't notify yourself)
    if post.user_id != current_user:
        notification = models.Notification(
            user_id=post.user_id,
            sender_id=current_user,
            post_id=post_id,
            message="liked your post"
        )
        db.add(notification)
    
    db.commit()
    db.refresh(new_like)
    background_tasks.add_task(FastAPICache.clear, namespace="feed")
    return new_like



@router.delete("/{post_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def unlike_post(
    post_id: int,
    background_tasks: BackgroundTasks,
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
    background_tasks.add_task(FastAPICache.clear, namespace="feed")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/{post_id}/share/{friend_id}", response_model=dict)
async def share_post(
    post_id: int,
    friend_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from starlette.concurrency import run_in_threadpool
    from ws_manager import manager
    from schemas import MessageResponse

    def _do_share():
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
            
        # Create notification + chat message in one atomic commit
        notification = models.Notification(
            user_id=friend_id,
            sender_id=current_user,
            post_id=post_id,
            message=f"shared a post with you"
        )
        db.add(notification)

        convo_id = models.make_conversation_id(current_user, friend_id)
        message = models.Message(
            conversation_id=convo_id,
            sender_id=current_user,
            post_id=post_id,
        )
        db.add(message)
        db.commit()  # Single atomic commit — both or neither

        # Eager-load + serialize INSIDE threadpool — no lazy-loads on event loop
        message = (
            db.query(models.Message)
            .options(
                joinedload(models.Message.sender),
                joinedload(models.Message.post),
            )
            .filter(models.Message.id == message.id)
            .one()
        )
        return MessageResponse.model_validate(message).model_dump(mode="json")

    msg_dict = await run_in_threadpool(_do_share)
    # Publish to both channels for real-time delivery
    await manager.publish(current_user, friend_id, msg_dict)
    return {"message": "Post shared successfully"}

