import { useContext, useState, useEffect } from "react"
import '../Styles/Post.css'
import { FriendsContext } from "../Context/FriendsProvider.jsx"
import { AiFillLike, AiOutlineLike } from 'react-icons/ai'
import { FiEdit2, FiTrash2, FiMessageCircle, FiShare } from 'react-icons/fi'
import { IoMdArrowBack } from 'react-icons/io'
import { useLocation } from 'react-router-dom'
import { CreatePost, GetAllUserPosts, DeletePost, UpdatePost, LikePost, UnlikePost } from '../Services/post.js'
import { AddComment, UpdateComment, DeleteComment } from '../Services/comments.js'
import { getUserName } from '../Services/auth.js'

export default function Post() {
    const location = useLocation();

    // Per-post comment inputs: { [postId]: "draft text" }
    // Fixes the bug where one shared string was shared across ALL posts.
    const [commentInputs, setCommentInputs] = useState({});

    const [ISAddActive, setIsAddActive] = useState(false)
    const [addPost, setAddPost] = useState({ title: "", content: "" })

    // isLoading: true  → skeleton visible (waiting for API)
    // isLoading: false + posts.length === 0 → empty state
    // isLoading: false + posts.length > 0  → show posts
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    // isSubmitting prevents double-click duplicate post creation
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [editPostId, setEditPostId] = useState(null);
    const [editPostData, setEditPostData] = useState({ title: "", content: "" });
    const [editError, setEditError] = useState("");

    const { friends } = useContext(FriendsContext);
    const [shareIndex, setShareIndex] = useState(null)

    const [editCommentId, setEditCommentId] = useState(null);
    const [editCommentContent, setEditCommentContent] = useState("");

    const currentUserId = parseInt(localStorage.getItem("current_user_id") || "0");
    const [post, setPosts] = useState([]);
    const [username, setusername] = useState("");

    useEffect(() => {
        setIsAddActive(false);
    }, [location.key]);

    useEffect(() => {
        const fetchUsername = async () => {
            try {
                const res = await getUserName();
                if (res) setusername(res.name);
            } catch (error) {
                console.error("Could not load username", error);
            }
        };
        fetchUsername();
    }, []);

    useEffect(() => {
        const getPosts = async () => {
            setIsLoading(true);
            setLoadError("");
            try {
                const res = await GetAllUserPosts();
                const formattedPosts = res.map(p => ({
                    ...p,
                    likes: p.likes || [],
                    comments: p.comments || [],
                    showComments: false
                }));
                setPosts(formattedPosts);
            } catch (error) {
                // Service re-throws now, so we catch it here and tell the user.
                setLoadError("Failed to load your posts. Please refresh the page.");
            } finally {
                setIsLoading(false);
            }
        };
        getPosts();
    }, []);

    // ── Comment handlers ───────────────────────────────────────────────────────
    const handleAdd = async (index, post_id) => {
        const commentText = (commentInputs[post_id] || "").trim();
        if (!commentText) return;

        try {
            const addCommentRes = await AddComment({ content: commentText, post_id });
            setPosts(post.map((p, i) =>
                i === index ? { ...p, comments: [...p.comments, addCommentRes] } : p
            ));
            // Clear only THIS post's input, not everyone else's
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

    // ── Post handlers ──────────────────────────────────────────────────────────
    const handleChange = (e) => {
        setAddPost({ ...addPost, [e.target.name]: e.target.value });
    };

    const handleAddPost = async () => {
        if (!addPost.title.trim() || !addPost.content.trim()) {
            alert("Please fill in both Title and Content.");
            return;
        }
        // Prevent double-click: disable the button immediately
        setIsSubmitting(true);
        try {
            const addpostRes = await CreatePost({ title: addPost.title, content: addPost.content });
            if (addpostRes) {
                setPosts(prev => [...prev, { ...addpostRes, showComments: false }]);
                // Only clear and close the form on confirmed success
                setAddPost({ title: "", content: "" });
                setIsAddActive(false);
            }
        } catch (error) {
            // Form stays open with content intact so the user can retry
            alert(`Could not create post: ${error.message}`);
        } finally {
            setIsSubmitting(false); // re-enable the button
        }
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

    const handleDelPost = async (id) => {
        if (!window.confirm("Delete this post? This cannot be undone.")) return;
        try {
            await DeletePost(id);
            setPosts(post.filter(p => p.id !== id));
            if (editPostId === id) setEditPostId(null); // cancel edit if open
        } catch (error) {
            alert(`Could not delete post: ${error.message}`);
        }
    };

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
            <div className="home-header">
                {!ISAddActive && (
                    <div className="home-header-content">
                        <h1>Welcome back, {username} — What's on your mind today?</h1>
                        <button className="add-post-btn" onClick={() => setIsAddActive(true)}>
                            Add Post / Start Writing
                        </button>
                    </div>
                )}

                {ISAddActive && (
                    <div className="add-post-container-parent">
                        <button className="cancel-btn" onClick={() => setIsAddActive(false)}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><IoMdArrowBack /> Back</span>
                        </button>
                        <div className="add-container">
                            <input type="text" placeholder="Title" name="title" value={addPost.title} onChange={handleChange} />
                            <textarea placeholder="Content" rows={6} name="content" value={addPost.content} onChange={handleChange} />
                            {/* disabled while isSubmitting prevents duplicate submissions */}
                            <button onClick={handleAddPost} disabled={isSubmitting}>
                                {isSubmitting ? "Posting…" : "Post"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {!ISAddActive && (
                <div className="user-post-header">
                    <h2>Your Posts</h2>
                </div>
            )}

            {/* Distinct error state — not mixed up with the empty state */}
            {loadError && !ISAddActive && (
                <div className="no-post">
                    <h1 style={{ color: 'var(--destructive)' }}>{loadError}</h1>
                </div>
            )}

            {/* Skeleton: shown while loading is true and there's no error */}
            {isLoading && !ISAddActive && (
                <div className="skeleton-loader">
                    {[1, 2].map(n => (
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

            {/* Empty state: loading finished, no error, but truly no posts */}
            {!isLoading && !loadError && post.length === 0 && !ISAddActive && (
                <div className="no-post">
                    <h1>No Posts Yet</h1>
                </div>
            )}

            {!ISAddActive && post.length > 0 && (
                <div className="post">
                    {post.map((p, index) => (
                        // key={p.id} instead of key={index}: stable IDs prevent React
                        // from misidentifying cards when items are deleted/reordered.
                        <div key={p.id} className="post-container" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="post-header">
                                {editPostId === p.id ? (
                                    <input type="text" name="title" value={editPostData.title} onChange={handleEditChange} className="edit-title-input" />
                                ) : (
                                    <h1>{p.title}</h1>
                                )}
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
                            </div>

                            {/* Inline edit error */}
                            {editPostId === p.id && editError && (
                                <p style={{ color: 'var(--destructive)', fontSize: '0.85rem', margin: '0 0 8px' }}>{editError}</p>
                            )}

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
                                        {friends.map(f => (
                                            <div className="share-container" key={f.id}>
                                                <p>{f.name}</p>
                                                <button onClick={() => { alert(`Post shared with ${f.name}!`); setShareIndex(null); }}>Send</button>
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
                </div>
            )}
        </>
    );
}