from fastapi import APIRouter, Depends , HTTPException, Response, status
from dependencies import get_db
from sqlalchemy.orm import Session
from schemas import PostResponse, PostCreate
from routers.auth import get_current_user
import models
router = APIRouter(prefix="/posts" ,tags=["Posts"])

@router.get("/", response_model=list[PostResponse])
def get_all_posts(current_user: int = Depends(get_current_user), db:Session = Depends(get_db)):
    posts = db.query(models.Post).filter(models.Post.user_id == current_user).all()
    return posts

@router.get("/feed", response_model=list[PostResponse])
def get_feed_posts(current_user: int = Depends(get_current_user), db:Session = Depends(get_db)):
    posts = db.query(models.Post).all()
    # Sort posts by engagement: number of likes + number of comments
    posts.sort(key=lambda p: len(p.likes) + len(p.comments), reverse=True)
    return posts

@router.post("/", response_model=PostResponse)
def create_post(post : PostCreate, current_user: int = Depends(get_current_user), db:Session = Depends(get_db)):
    new_Post = models.Post(title=post.title, content=post.content, user_id=current_user)
    db.add(new_Post)
    db.commit() 
    db.refresh(new_Post)
    return new_Post

@router.put("/{post_id}", response_model=PostResponse)
def update_post(post: PostCreate,post_id: int,current_user : int = Depends(get_current_user), db: Session = Depends(get_db)):
    existing_post = db.query(models.Post).filter(models.Post.id == post_id , models.Post.user_id == current_user).first()
    if not existing_post: 
        raise HTTPException(status_code=404, detail="Post not found")
    existing_post.title = post.title
    existing_post.content = post.content
    db.commit()
    db.refresh(existing_post)
    return existing_post

@router.delete("/{post_id}")
def delete_post( post_id: int ,current_user : int = Depends(get_current_user), db: Session = Depends(get_db)):
    existing_post = db.query(models.Post).filter(models.Post.id == post_id , models.Post.user_id == current_user).first()
    if not existing_post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(existing_post)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/{post_id}", response_model = PostResponse)
def get_post(post_id : int ,current_user: int = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.user_id == current_user ,  models.Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.post("/{post_id}/like", status_code=status.HTTP_201_CREATED)
def like_post(post_id: int, current_user: int = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    existing_like = db.query(models.Like).filter(models.Like.post_id == post_id, models.Like.user_id == current_user).first()
    if existing_like:
        raise HTTPException(status_code=400, detail="Post already liked")
        
    new_like = models.Like(user_id=current_user, post_id=post_id)
    db.add(new_like)
    db.commit()
    db.refresh(new_like)
    return new_like

@router.delete("/{post_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def unlike_post(post_id: int, current_user: int = Depends(get_current_user), db: Session = Depends(get_db)):
    existing_like = db.query(models.Like).filter(models.Like.post_id == post_id, models.Like.user_id == current_user).first()
    if not existing_like:
        raise HTTPException(status_code=404, detail="Like not found")
        
    db.delete(existing_like)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)




