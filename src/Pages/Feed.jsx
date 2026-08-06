import { useContext, useState, useEffect, useCallback, useRef } from "react"
import { useLocation } from "react-router-dom"
import '../Styles/Post.css'
import { FriendsContext } from "../Context/FriendsProvider.jsx"
import { AiFillLike, AiOutlineLike } from 'react-icons/ai'
import { FiEdit2, FiTrash2, FiMessageCircle, FiShare } from 'react-icons/fi'
import { GetAllFeedPosts, LikePost, UnlikePost, SharePost, DeletePost, UpdatePost } from '../Services/post.js'
import { AddComment, UpdateComment, DeleteComment } from '../Services/comments.js'

const PAGE_SIZE = 20;

export default function Feed() {
    const location = useLocation();
    const hasScrolledRef = useRef(false);

    // Per-post comment inputs: { [postId]: "draft text" }
    const [commentInputs, setCommentInputs] = useState({});

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const { friends } = useContext(FriendsContext);
    const [shareIndex, setShareIndex] = useState(null);
    const [post, setPosts] = useState([]);

    // Pagination state
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const [editCommentId, setEditCommentId] = useState(null);
    const [editCommentContent, setEditCommentContent] = useState("");

    // FEAT-4: Post editing state for own posts in feed
    const [editPostId, setEditPostId] = useState(null);
    const [editPostData, setEditPostData] = useState({ title: "", content: "" });
    const [editError, setEditError] = useState("");

    const currentUserId = parseInt(localStorage.getItem("current_user_id") || "0");

    // Fetch the first page on mount
    useEffect(() => {
        const getPosts = async () => {
            setIsLoading(true);
            setLoadError("");
            try {
                const res = await GetAllFeedPosts(0, PAGE_SIZE);
                const formatted = res.map(p => ({
                    ...p,
                    likes: p.likes || [],
                    comments: p.comments || [],
                    showComments: false
                }));
                setPosts(formatted);
                setSkip(PAGE_SIZE);
                // If the API returned fewer items than the page size, there are no more pages
                setHasMore(res.length === PAGE_SIZE);
            } catch (error) {
                setLoadError("Failed to load feed. Please refresh the page.");
            } finally {
                setIsLoading(false);
            }
        };
        getPosts();
    }, []);

    // Load the next page (appended to the existing list)
    const loadMore = async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const res = await GetAllFeedPosts(skip, PAGE_SIZE);
            const formatted = res.map(p => ({
                ...p,
                likes: p.likes || [],
                comments: p.comments || [],
                showComments: false
            }));
            setPosts(prev => [...prev, ...formatted]);
            setSkip(prev => prev + PAGE_SIZE);
            setHasMore(res.length === PAGE_SIZE);
        } catch (error) {
            alert(`Could not load more posts: ${error.message}`);
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Auto-scroll to shared post
    useEffect(() => {
        if (!hasScrolledRef.current && location.state?.highlightPostId && post.length > 0) {
            const element = document.getElementById(`post-${location.state.highlightPostId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.style.transition = 'box-shadow 0.5s ease-in-out';
                element.style.boxShadow = '0 0 15px 5px var(--primary)';
                setTimeout(() => {
                    element.style.boxShadow = 'none';
                }, 2000);
                hasScrolledRef.current = true;
            }
        }
    }, [post, location.state]);

    // ── Comment handlers ───────────────────────────────────────────────────────
    const handleAdd = async (index, post_id) => {
        const commentText = (commentInputs[post_id] || "").trim();
        if (!commentText) return;
        try {
            const addCommentRes = await AddComment({ content: commentText, post_id });
            setPosts(post.map((p, i) =>
                i === index ? { ...p, comments: [...p.comments, addCommentRes] } : p
            ));
            setCommentInputs(prev => ({ ...prev, [post_id]: "" }));
        } catch (error) {
            alert(`Could not post comment: ${error.message}`);
        }
    };

    const handleShowComment = (index) => {
        setPosts(post.map((p, i) =>
            i === index ? { ...p, showComments: !p.showComments } : p
        ));
    };

    const handleLike = async (index, postId) => {
        try {
            const likeRes = await LikePost(postId);
            if (likeRes) {
                setPosts(post.map((p, i) =>
                    i === index ? { ...p, likes: [...p.likes, likeRes] } : p
                ));
            }
        } catch (error) {
            alert(`Could not like post: ${error.message}`);
        }
    };

    const handleUnLike = async (index, postId) => {
        try {
            await UnlikePost(postId);
            setPosts(post.map((p, i) =>
                i === index ? { ...p, likes: p.likes.filter(l => l.user_id !== currentUserId) } : p
            ));
        } catch (error) {
            alert(`Could not unlike post: ${error.message}`);
        }
    };

    const handleDel = async (postIndex, commentId) => {
        try {
            await DeleteComment(commentId);
            setPosts(post.map((p, i) =>
                i === postIndex ? { ...p, comments: p.comments.filter(c => c.id !== commentId) } : p
            ));
        } catch (error) {
            alert(`Could not delete comment: ${error.message}`);
        }
    };

    const handleEditCommentSubmit = async (postIndex, commentId) => {
        if (!editCommentContent.trim()) return;
        try {
            const updated = await UpdateComment({ id: commentId, content: editCommentContent });
            if (updated) {
                setPosts(post.map((p, i) =>
                    i === postIndex ? {
                        ...p,
                        comments: p.comments.map(c => c.id === commentId ? { ...c, content: editCommentContent } : c)
                    } : p
                ));
            }
            setEditCommentId(null);
        } catch (error) {
            alert(`Could not update comment: ${error.message}`);
        }
    };

    const handleSharePost = async (postId, friendId, friendName) => {
        try {
            await SharePost(postId, friendId);
            alert(`Post shared with ${friendName}!`);
            setShareIndex(null);
        } catch (error) {
            alert(`Could not share post: ${error.message}`);
        }
    };

    // FEAT-4: Delete own post from feed
    const handleDelPost = async (id) => {
        if (!window.confirm("Delete this post? This cannot be undone.")) return;
        try {
            await DeletePost(id);
            setPosts(post.filter(p => p.id !== id));
            if (editPostId === id) setEditPostId(null);
        } catch (error) {
            alert(`Could not delete post: ${error.message}`);
        }
    };

    // FEAT-4: Edit own post handlers
    const handleEditClick = (p) => {
        setEditPostId(p.id);
        setEditPostData({ title: p.title, content: p.content });
        setEditError("");
    };

    const handleEditChange = (e) => {
        setEditPostData({ ...editPostData, [e.target.name]: e.target.value });
    };

    const handleSaveEdit = async (p) => {
        if (!editPostData.title.trim() || !editPostData.content.trim()) {
            setEditError("Title and content cannot be empty.");
            return;
        }
        setEditError("");
        try {
            await UpdatePost({ id: p.id, title: editPostData.title, content: editPostData.content });
            setPosts(post.map(postItem =>
                postItem.id === p.id
                    ? { ...postItem, title: editPostData.title, content: editPostData.content }
                    : postItem
            ));
            setEditPostId(null);
        } catch (error) {
            setEditError(`Save failed: ${error.message}`);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            <div style={{ marginTop: "20px" }}></div>

            {/* Distinct error state */}
            {loadError && (
                <div className="no-post">
                    <h1 style={{ color: 'var(--destructive)' }}>{loadError}</h1>
                </div>
            )}

            {/* Skeleton while initial load is in progress */}
            {isLoading && (
                <div className="skeleton-loader">
                    {[1, 2, 3].map(n => (
                        <div key={n} className="skeleton-card">
                            <div className="skeleton-header">
                                <div className="skeleton-title"></div>
                                <div className="skeleton-meta"></div>
                            </div>
                            <div className="skeleton-body"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state: loading done, no error, no posts */}
            {!isLoading && !loadError && post.length === 0 && (
                <div className="no-post">
                    <h1>No Posts in Feed Yet</h1>
                </div>
            )}

            {post.length > 0 && (
                <div className="post">
                    {post.map((p, index) => (
                        <div key={p.id} id={`post-${p.id}`} className="post-container" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="post-header">
                                <div>
                                    {/* FEAT-4: Inline edit title when editing own post */}
                                    {editPostId === p.id ? (
                                        <input type="text" name="title" value={editPostData.title} onChange={handleEditChange} className="edit-title-input" />
                                    ) : (
                                        <h1>{p.title}</h1>
                                    )}
                                    <div className="post-meta">
                                        <div className="avatar-circle">{p.user && p.user.name ? [...p.user.name][0] : "U"}</div>
                                        <small>Posted by: {p.user ? p.user.name : "Unknown"}</small>
                                    </div>
                                </div>
                                {/* FEAT-4: Show Edit/Delete buttons only for own posts */}
                                {p.user && p.user.id === currentUserId && (
                                    <div className="post-header-buttons">
                                        {editPostId === p.id ? (
                                            <>
                                                <button className="update-post-btn" onClick={() => handleSaveEdit(p)}>Save</button>
                                                <button className="delete-post-btn" onClick={() => { setEditPostId(null); setEditError(""); }}>Cancel</button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="update-post-btn" onClick={() => handleEditClick(p)}><FiEdit2 /> Update</button>
                                                <button className="delete-post-btn" onClick={() => handleDelPost(p.id)}><FiTrash2 /> Delete</button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* FEAT-4: Inline edit error */}
                            {editPostId === p.id && editError && (
                                <p style={{ color: 'var(--destructive)', fontSize: '0.85rem', margin: '0 0 8px' }}>{editError}</p>
                            )}

                            {/* FEAT-4: Inline edit content or display */}
                            {editPostId === p.id ? (
                                <textarea name="content" value={editPostData.content} onChange={handleEditChange} className="edit-content-input" rows={4} />
                            ) : (
                                <p>{p.content}</p>
                            )}

                            <div className="like-container">
                                {p.likes.some(l => l.user_id === currentUserId) ? (
                                    <AiFillLike size={24} onClick={() => handleUnLike(index, p.id)} />
                                ) : (
                                    <AiOutlineLike size={24} onClick={() => handleLike(index, p.id)} />
                                )}
                                <p>{p.likes.length}</p>
                            </div>

                            <div className="post-buttons">
                                <button className="toggle-comments-btn" onClick={() => handleShowComment(index)}>
                                    <FiMessageCircle /> {p.showComments ? "Hide Comments" : "Show Comments"}
                                </button>
                                <button
                                    className={shareIndex === index ? "cancel-share-btn" : "share-btn"}
                                    onClick={() => setShareIndex(shareIndex === index ? null : index)}
                                >
                                    <FiShare /> Share
                                </button>

                                {shareIndex === index && (
                                    <div className="share-container-parent">
                                        <h1>Friends List</h1>
                                        {friends.length === 0 && (
                                            <p style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No friends yet.</p>
                                        )}
                                        {friends.map((f, fIdx) => (
                                            <div key={fIdx} className="share-container">
                                                <p>{f.name}</p>
                                                <button onClick={() => handleSharePost(p.id, f.id, f.name)}>Send</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {p.showComments && (
                                <div className="comment-section">
                                    <div className="comment-input-group">
                                        <input
                                            type="text"
                                            placeholder="Add a comment..."
                                            value={commentInputs[p.id] || ""}
                                            onChange={e => setCommentInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                                            onKeyDown={e => e.key === 'Enter' && handleAdd(index, p.id)}
                                        />
                                        <button className="add-comment-btn" onClick={() => handleAdd(index, p.id)}>Post</button>
                                    </div>
                                    <div className="comments-list">
                                        {p.comments.map(c => (
                                            <div key={c.id} className="comment-wrapper">
                                                {editCommentId === c.id ? (
                                                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                                        <input
                                                            type="text"
                                                            value={editCommentContent}
                                                            onChange={e => setEditCommentContent(e.target.value)}
                                                            style={{ flex: 1 }}
                                                        />
                                                        <button onClick={() => handleEditCommentSubmit(index, c.id)} style={{ padding: '5px', fontSize: '12px' }}>Save</button>
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
                                                        {c.user && c.user.id === currentUserId && (
                                                            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', paddingLeft: '4px' }}>
                                                                <button onClick={() => { setEditCommentId(c.id); setEditCommentContent(c.content); }} style={{ background: 'none', color: 'var(--text-muted)', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><FiEdit2 /> Edit</button>
                                                                <button onClick={() => handleDel(index, c.id)} style={{ background: 'none', color: 'var(--destructive)', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><FiTrash2 /> Delete</button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Load More button — only shown if there might be more posts */}
                    {hasMore && (
                        <button
                            onClick={loadMore}
                            disabled={isLoadingMore}
                            style={{
                                margin: '16px auto 40px',
                                display: 'block',
                                padding: '12px 32px',
                                background: 'var(--secondary-bg)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-main)',
                                cursor: isLoadingMore ? 'wait' : 'pointer',
                                fontFamily: 'inherit',
                                fontWeight: 500,
                            }}
                        >
                            {isLoadingMore ? "Loading…" : "Load More Posts"}
                        </button>
                    )}

                    {!hasMore && post.length > 0 && (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0 40px', fontSize: '0.9rem' }}>
                            You've reached the end of the feed.
                        </p>
                    )}
                </div>
            )}
        </>
    );
}
