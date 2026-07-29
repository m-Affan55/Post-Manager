from fastapi import APIRouter, Depends , HTTPException
from dependencies import get_db
from sqlalchemy.orm import Session
from schemas import PostResponse, PostCreate
import models
router = APIRouter(prefix="/users" ,tags=["Posts"])

@router.get("/{user_id}/posts", response_model=list[PostResponse])
def get_all_posts(user_id:int , db:Session = Depends(get_db)):
    posts = db.query(models.Post).filter(models.Post.user_id == user_id).all()
    if posts is None:
        raise HTTPException(status_code=404, detail="Posts not found")
    return posts

@router.post("/{user_id}/posts", response_model=PostResponse)
def create_post(post : PostCreate, user_id : int , db:Session = Depends(get_db)):
    new_Post = models.Post(title=post.title, content=post.content, user_id=user_id)
    db.add(new_Post)
    db.commit() 
    db.refresh(new_Post)
    return new_Post

@router.put("/{user_id}/posts/{post_id}", response_model=PostResponse)
def update_post(post: PostCreate, user_id: int , post_id: int, db: Session = Depends(get_db)):
    existing_post = db.query(models.Post).filter(models.Post.id == post_id , models.Post.user_id == user_id).first()
    if not existing_post: 
        raise HTTPException(status_code=404, detail="Post not found")
    existing_post.title = post.title
    existing_post.content = post.content
    db.commit()
    db.refresh(existing_post)
    return existing_post

@router.delete("/{user_id}/posts/{post_id}")
def delete_post(user_id : int , post_id: int , db: Session = Depends(get_db)):
    existing_post = db.query(models.Post).filter(models.Post.id == post_id , models.Post.user_id == user_id).first()
    if not existing_post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(existing_post)
    db.commit()
    return {"message" : "Post deleted successfully"}

@router.get("/{user_id}/posts/{post_id}", response_model = PostResponse)
def get_post(user_id : int , post_id : int , db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.user_id == user_id ,  models.Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post




