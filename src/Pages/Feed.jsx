import { useContext, useState, useEffect } from "react"
import '../Styles/Post.css'
import { FriendsContext } from "../Context/FriendsProvider.jsx"
import { AiFillLike, AiOutlineLike } from 'react-icons/ai'
import { FiEdit2, FiTrash2, FiMessageCircle, FiShare } from 'react-icons/fi'
import { GetAllFeedPosts, LikePost, UnlikePost } from '../Services/post.js'
import { AddComment, UpdateComment, DeleteComment } from '../Services/comments.js'

export default function Feed() {
    const [addComments, setAddComments] = useState('')
    const [NoPost, setNoPost] = useState(true);
    const { friends } = useContext(FriendsContext);

    const [shareIndex, setShareIndex] = useState(null)
    const [post, setPosts] = useState([]);
    
    // Comment edit state
    const [editCommentId, setEditCommentId] = useState(null);
    const [editCommentContent, setEditCommentContent] = useState("");

    const currentUserId = parseInt(localStorage.getItem("current_user_id") || "0");

    useEffect(() => {
        const getPosts = async () => {
            try {
                const res = await GetAllFeedPosts();
                if (res) {
                    const formattedPosts = res.map(p => ({
                        ...p,
                        likes: p.likes || [],
                        comments: p.comments || [],
                        showComments: false
                    }));
                    setPosts(formattedPosts);
                    if (formattedPosts.length > 0) {
                        setNoPost(false);
                    }
                }
            }
            catch (error) {
                console.error("Error in getting feed posts", error);
            }
        }
        getPosts();
    }, [])

    const handleAdd = async (index, post_id) => {
        if (!addComments.trim()) return;

        try {
            const addCommentRes = await AddComment({ content: addComments, post_id: post_id });

            setPosts(post.map((p, i) =>
                i === index ? {
                    ...p,
                    comments: [...p.comments, addCommentRes]
                }
                    : p
            ))
            setAddComments('')
        }
        catch (error) {
            console.error("Error in adding comment", error);
        }
    }

    const handleShowComment = (index) => {
        setPosts(post.map((p, i) =>
            i === index ? {
                ...p,
                showComments: !p.showComments
            }
                : p
        ))
    }

    const handleLike = async (index, postId) => {
        try {
            const likeRes = await LikePost(postId);
            if (likeRes) {
                setPosts(post.map((p, i) =>
                    i === index ? {
                        ...p,
                        likes: [...p.likes, likeRes]
                    }
                    : p
                ));
            }
        } catch (error) {
            console.error("Error in liking post", error);
        }
    }

    const handleUnLike = async (index, postId) => {
        try {
            await UnlikePost(postId);
            setPosts(post.map((p, i) => 
                i === index ? { 
                    ...p, 
                    likes: p.likes.filter(l => l.user_id !== currentUserId) 
                } 
                : p
            ));
        } catch (error) {
            console.error("Error in unliking post", error);
        }
    }

    const handleDel = async (postIndex, commentId) => {
        try {
            await DeleteComment(commentId);
            setPosts(post.map((p, i) =>
                i === postIndex ? { ...p, comments: p.comments.filter(c => c.id !== commentId) }
                : p
            ));
        } catch (error) {
            console.error("Error in deleting comment", error);
        }
    }

    const handleEditCommentSubmit = async (postIndex, commentId) => {
        if (!editCommentContent.trim()) return;
        try {
            await UpdateComment({ id: commentId, content: editCommentContent });
            setPosts(post.map((p, i) =>
                i === postIndex ? {
                    ...p,
                    comments: p.comments.map(c => c.id === commentId ? { ...c, content: editCommentContent } : c)
                } : p
            ));
            setEditCommentId(null);
        } catch (error) {
            console.error("Error in updating comment", error);
        }
    }

    return (
        <>
            <div style={{ marginTop: "20px" }}></div>
            {NoPost && (
                <div className="no-post">
                    <h1>No Posts in Feed Yet</h1>
                </div>
            )}

            <div className="post">
                {post.map((p, index) => (
                    <div key={index} className="post-container">
                        <div className="post-header">
                            <div>
                                <h1>{p.title}</h1>
                                <small style={{ color: "#666", fontSize: "14px" }}>
                                    Posted by: {p.user ? p.user.name : "Unknown"}
                                </small>
                            </div>
                        </div>
                        <p>{p.content}</p>
                        
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
                            <button className={shareIndex === index ? "cancel-share-btn" : "share-btn"} onClick={() => setShareIndex(shareIndex === index ? null : index)}>
                                <FiShare /> Share
                            </button>

                            {shareIndex === index && (
                                <div className="share-container-parent">
                                    <h1>Friends List</h1>
                                    {friends.map((f, fIdx) => (
                                        <div key={fIdx} className="share-container">
                                            <p>{f.name}</p>
                                            <button onClick={() => {
                                                alert(`Post shared with ${f.name}!`);
                                                setShareIndex(null);
                                            }}>send</button>
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
                                        name="addComments"
                                        value={addComments}
                                        onChange={(e) => setAddComments(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdd(index, p.id)}
                                    />
                                    <button className="add-comment-btn" onClick={() => handleAdd(index, p.id)}>Post</button>
                                </div>
                                <div className="comments-list">
                                    {p.comments.map((c) => (
                                        <div key={c.id} className="comment-wrapper">
                                            {editCommentId === c.id ? (
                                                <div style={{display: 'flex', gap: '10px', width: '100%'}}>
                                                    <input 
                                                        type="text" 
                                                        value={editCommentContent} 
                                                        onChange={(e) => setEditCommentContent(e.target.value)}
                                                        style={{flex: 1}}
                                                    />
                                                    <button onClick={() => handleEditCommentSubmit(index, c.id)} style={{padding: '5px', fontSize: '12px'}}>Save</button>
                                                    <button onClick={() => setEditCommentId(null)} style={{padding: '5px', fontSize: '12px', background: '#ccc'}}>Cancel</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="comment"><strong>{c.user ? c.user.name : "Unknown"}</strong>{c.content}</p>
                                                    {c.user && c.user.id === currentUserId && (
                                                        <div style={{display: 'flex', gap: '12px', marginTop: '6px', paddingLeft: '4px'}}>
                                                            <button onClick={() => { setEditCommentId(c.id); setEditCommentContent(c.content); }} style={{background: 'none', color: 'var(--text-muted)', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px'}}><FiEdit2 /> Edit</button>
                                                            <button onClick={() => handleDel(index, c.id)} style={{background: 'none', color: 'var(--destructive)', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px'}}><FiTrash2 /> Delete</button>
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
        </>
    )
}
