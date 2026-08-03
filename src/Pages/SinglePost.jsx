import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GetPost, LikePost, UnlikePost } from '../Services/post.js';
import { AddComment } from '../Services/comments.js';
import { FriendsContext } from '../Context/FriendsProvider.jsx';
import { AiFillLike, AiOutlineLike } from 'react-icons/ai';
import { FiMessageCircle } from 'react-icons/fi';
import '../Styles/Post.css';

export default function SinglePost() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [commentInput, setCommentInput] = useState('');
    const currentUserId = parseInt(localStorage.getItem('current_user_id') || '0');

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
                                <div className="comment">
                                    <div className="comment-header">
                                        <div className="avatar-circle">{c.user && c.user.name ? [...c.user.name][0] : "U"}</div>
                                        <strong>{c.user ? c.user.name : "Unknown"}</strong>
                                    </div>
                                    <div>{c.content}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
