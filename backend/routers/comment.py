from sys import prefix
from fastapi import APIRouter, Depends, HTTPException
from models import CommentResponse
from dependencies import get_db
from sqlalchemy.orm import Session
from models import Comment,Post
from schemas import CommentCreate,CommentResponse
from routers.auth import get_current_user
router = APIRouter(prefix='/comments',tags=['comments'])
@router.get("/{post_id}", response_model=list[CommentResponse])
def get_comments(post_id: int , db:Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.post_id == post_id).all()
    return comments

@router.post("/{post_id}")
def add_comment(comment: CommentCreate,post_id: int , current_user: int = Depends(get_current_user),db:Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post: 
        raise HTTPException(status_code=404 , detail="Post not found")
    new_comment = Comment(content = comment.content , user_id = current_user, post_id=post.id)
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

    