import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GetPost, LikePost, UnlikePost } from '../Services/post.js';
import { AddComment, UpdateComment, DeleteComment } from '../Services/comments.js';
import { FriendsContext } from '../Context/FriendsProvider.jsx';
import { AiFillLike, AiOutlineLike } from 'react-icons/ai';
import { FiEdit2, FiTrash2, FiMessageCircle } from 'react-icons/fi';
import '../Styles/Post.css';

export default function SinglePost() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [commentInput, setCommentInput] = useState('');
    const currentUserId = parseInt(localStorage.getItem('current_user_id') || '0');

    // FEAT-5: Comment editing state
    const [editCommentId, setEditCommentId] = useState(null);
    const [editCommentContent, setEditCommentContent] = useState('');

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const data = await GetPost(id);
                setPost({ ...data, showComments: true }); // default show comments
            } catch (err) {
                setError(err.message || 'Failed to load post');
            } finally {
                setIsLoading(false);
            }
        };
        fetchPost();
    }, [id]);

    const handleLike = async () => {
        try {
            const likeRes = await LikePost(post.id);
            if (likeRes) {
                setPost({ ...post, likes: [...post.likes, likeRes] });
            }
        } catch (err) {
            alert(`Could not like post: ${err.message}`);
        }
    };

    const handleUnlike = async () => {
        try {
            await UnlikePost(post.id);
            setPost({ ...post, likes: post.likes.filter(l => l.user_id !== currentUserId) });
        } catch (err) {
            alert(`Could not unlike post: ${err.message}`);
        }
    };

    const handleAddComment = async () => {
        if (!commentInput.trim()) return;
        try {
            const addCommentRes = await AddComment({ content: commentInput, post_id: post.id });
            setPost({ ...post, comments: [...post.comments, addCommentRes] });
            setCommentInput('');
        } catch (err) {
            alert(`Could not post comment: ${err.message}`);
        }
    };

    // FEAT-5: Delete comment handler
    const handleDeleteComment = async (commentId) => {
        try {
            await DeleteComment(commentId);
            setPost({ ...post, comments: post.comments.filter(c => c.id !== commentId) });
        } catch (err) {
            alert(`Could not delete comment: ${err.message}`);
        }
    };

    // FEAT-5: Edit comment submit handler
    const handleEditCommentSubmit = async (commentId) => {
        if (!editCommentContent.trim()) return;
        try {
            const updated = await UpdateComment({ id: commentId, content: editCommentContent });
            if (updated) {
                setPost({
                    ...post,
                    comments: post.comments.map(c =>
                        c.id === commentId ? { ...c, content: editCommentContent } : c
                    )
                });
            }
            setEditCommentId(null);
        } catch (err) {
            alert(`Could not update comment: ${err.message}`);
        }
    };

    if (isLoading) {
        return (
            <div className="skeleton-loader" style={{ padding: '20px' }}>
                <div className="skeleton-card">
                    <div className="skeleton-header"><div className="skeleton-title"></div></div>
                    <div className="skeleton-body"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="no-post"><h1 style={{ color: 'var(--destructive)' }}>{error}</h1></div>;
    }

    if (!post) return null;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--card-bg)', cursor: 'pointer' }}>
                ← Back
            </button>
            <div className="post-container">
                <div className="post-header">
                    <h1>{post.title}</h1>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>By {post.user?.name}</span>
                </div>
                <p>{post.content}</p>
                
                <div className="like-container">
                    {post.likes.some(l => l.user_id === currentUserId) ? (
                        <AiFillLike size={24} onClick={handleUnlike} style={{ cursor: 'pointer', color: 'var(--primary)' }} />
                    ) : (
                        <AiOutlineLike size={24} onClick={handleLike} style={{ cursor: 'pointer', color: 'var(--primary)' }} />
                    )}
                    <p>{post.likes.length}</p>
                </div>

                <div className="comment-section" style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                    <div className="comment-input-group">
                        <input
                            type="text"
                            placeholder="Add a comment..."
                            value={commentInput}
                            onChange={e => setCommentInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                        />
                        <button className="add-comment-btn" onClick={handleAddComment}>Post</button>
                    </div>
                    
                    <div className="comments-list">
                        {post.comments.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No comments yet.</p>}
                        {post.comments.map(c => (
                            <div key={c.id} className="comment-wrapper">
                                {/* FEAT-5: Inline comment editing */}
                                {editCommentId === c.id ? (
                                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                        <input
                                            type="text"
                                            value={editCommentContent}
                                            onChange={e => setEditCommentContent(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleEditCommentSubmit(c.id)}
                                            style={{ flex: 1 }}
                                        />
                                        <button onClick={() => handleEditCommentSubmit(c.id)} style={{ padding: '5px', fontSize: '12px' }}>Save</button>
                                        <button onClick={() => setEditCommentId(null)} style={{ padding: '5px', fontSize: '12px', background: '#ccc' }}>Cancel</button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="comment">
                                            <div className="comment-header">
                                                <div className="avatar-circle">{c.user && c.user.name ? [...c.user.name][0] : "U"}</div>
                                                <strong>{c.user ? c.user.name : "Unknown"}</strong>
                                            </div>
                                            <div>{c.content}</div>
                                        </div>
                                        {/* FEAT-5: Edit/Delete buttons for comment owner */}
                                        {c.user && c.user.id === currentUserId && (
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', paddingLeft: '4px' }}>
                                                <button onClick={() => { setEditCommentId(c.id); setEditCommentContent(c.content); }} style={{ background: 'none', color: 'var(--text-muted)', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><FiEdit2 /> Edit</button>
                                                <button onClick={() => handleDeleteComment(c.id)} style={{ background: 'none', color: 'var(--destructive)', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><FiTrash2 /> Delete</button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
