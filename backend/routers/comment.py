from sys import prefix
from django import db
from fastapi import APIRouter, Depends, HTTPException, status
from dependencies import get_db
from sqlalchemy.orm import Session
from models import Comment,Post
from schemas import CommentCreate,CommentResponse,CommentUpdate
from routers.auth import get_current_user
router = APIRouter(prefix='/comments',tags=['comments'])
@router.get("/{post_id}", response_model=list[CommentResponse])
def get_comments(post_id: int , db:Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.post_id == post_id).all()
    return comments

@router.post("/{post_id}", Response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(comment: CommentCreate,post_id: int , current_user: int = Depends(get_current_user),db:Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post: 
        raise HTTPException(status_code=404 , detail="Post not found")
    new_comment = Comment(content = comment.content , user_id = current_user, post_id=post.id)
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@router.delete("/{comment_id}",status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(comment_id : int, current_user: int = Depends(get_current_user), db: Session = Depends(get_db)):
    comment = db.query(Comment).filter(comment_id == Comment.id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found") 
    if comment.user_id != current_user:
        raise HTTPException(status_code=403 , detail="You are not allowed to delete someone else's comment")
    db.delete(comment)
    db.commit()
    return 

@router.put("/{comment_id}", response_model=CommentResponse)
def update_comment(comment:CommentUpdate,comment_id : int ,  current_user: int = Depends(get_current_user), db: Session = Depends(get_db)):
    comment_exists = db.query(Comment).filter(comment_id == Comment.id).first()
    if not comment_exists:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment_exists.user_id != current_user:
        raise HTTPException(status_code=403 , detail="You are not allowed to edit someone else's comment")
    comment_exists.content = comment.content
    db.commit()
    db.refresh(comment_exists)
    return comment_exists
    