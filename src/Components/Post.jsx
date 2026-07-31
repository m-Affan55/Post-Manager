import { useContext, useState } from "react"
import '../Styles/Post.css'
import { FriendsContext } from "../Context/FriendsProvider.jsx"
import { AiFillLike, AiOutlineLike } from 'react-icons/ai'
import { FiEdit2, FiTrash2, FiMessageCircle, FiShare } from 'react-icons/fi'
import { IoMdArrowBack } from 'react-icons/io'
import { useLocation } from 'react-router-dom'
import { CreatePost, GetAllUserPosts, DeletePost, UpdatePost, LikePost, UnlikePost } from '../Services/post.js'
import { useEffect } from "react"
import { AddComment, UpdateComment, DeleteComment } from '../Services/comments.js'
import { getUserName } from '../Services/auth.js'
export default function Post() {
    const location = useLocation();
    const [addComments, setAddComments] = useState('')
    const [ISAddActive, setIsAddActive] = useState(false)
    const [addPost, setAddPost] = useState({
        title: "",
        content: "",
        comments: [],
        showComments: false,
        likes: 0
    })
    const [NoPost, setNoPost] = useState(true);
    const [editPostId, setEditPostId] = useState(null);
    const [editPostData, setEditPostData] = useState({ title: "", content: "" });
    const { friends } = useContext(FriendsContext);

    const [shareIndex, setShareIndex] = useState(null)
    
    // Comment edit state
    const [editCommentId, setEditCommentId] = useState(null);
    const [editCommentContent, setEditCommentContent] = useState("");

    const currentUserId = parseInt(localStorage.getItem("current_user_id") || "0");

    const [post, setPosts] = useState([]);

    const [username, setusername] = useState("");

    // Reset add post state when clicking Home in navbar
    useEffect(() => {
        setIsAddActive(false);
    }, [location.key]);

    useEffect(()=>{
        const UserName = async () => {
            try {
                const res = await getUserName();
                if (res) {
                    setusername(res.name);
                }
            }
            catch (error) {
                console.error("Error in getting user name", error);
            }
        }
        UserName();
    },[])
    useEffect(() => {
        const getPosts = async () => {
            try {
                const res = await GetAllUserPosts();
                if (res) {
                    // Add frontend properties to each post from the database
                    const formattedPosts = res.map(p => ({
                        ...p,
                        likes: p.likes || [],
                        comments: p.comments || [],
                        showComments: false
                    }));
                    console.log(formattedPosts)
                    setPosts(formattedPosts);
                    if (formattedPosts.length > 0) {
                        setNoPost(false);
                    }
                }
            }
            catch (error) {
                console.error("Error in getting posts", error);
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

    const handleChange = (e) => {
        setAddPost({ ...addPost, [e.target.name]: e.target.value })
    }
    const handleAddPost = async () => {
        if (!addPost.title.trim() || !addPost.content.trim()) {
            alert("please add the all fields")
            return
        };

        try {
            const addpostRes = await CreatePost(addPost);
            console.log(addpostRes);
            if (addpostRes) {
                setPosts([...post, { ...addpostRes, showComments: false }]);
            }
        }
        catch (error) {
            console.error("Error in creating post", error);
        }


        setAddPost({ title: "", content: "", comments: [], showComments: false })
        setIsAddActive(false)
        setNoPost(false);

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
    const handleDelPost = async (id) => {
        try {
            await DeletePost(id);
            setPosts(post.filter((p) => p.id !== id));
        }
        catch (error) {
            console.error("Error in deleting post", error);
        }
    }

    const handleEditClick = (p) => {
        setEditPostId(p.id);
        setEditPostData({ title: p.title, content: p.content });
    }

    const handleEditChange = (e) => {
        setEditPostData({ ...editPostData, [e.target.name]: e.target.value });
    }

    const handleSaveEdit = async (p) => {

        const updated_post = {
            id: p.id,
            title: editPostData.title,
            content: editPostData.content
        };

        try {
            await UpdatePost(updated_post);
            setPosts(post.map(postItem =>
                postItem.id === p.id
                    ? { ...postItem, title: editPostData.title, content: editPostData.content }
                    : postItem
            ));
            setEditPostId(null);
        }
        catch (error) {
            console.error("Error in updating post", error);
        }
    }

    return (
        <>

            <div className="add-post-container-parent">

                <button className={!ISAddActive ? "add-post-btn" : "cancel-btn"} onClick={() => setIsAddActive(!ISAddActive)}>
                    {!ISAddActive ? "Add Post" : <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}><IoMdArrowBack /> Back</span>}
                </button>
                {ISAddActive && (<div className="add-container">
                    <input type="text" placeholder="Title" name="title" value={addPost.title} onChange={handleChange}></input>
                    <textarea placeholder="Content" rows={6} name="content" value={addPost.content} onChange={handleChange}></textarea>
                    <button onClick={handleAddPost}>Post</button>
                </div>
                )}
            </div>
                {!ISAddActive && (
                    <div>
            <div className="user-greeting">
            <h1>Hey! {username}</h1>
            </div>
                <div className="user-post-header">
                <h1>Your Posts</h1>
            </div>
            </div>)}
            {NoPost && !ISAddActive && (
                <div className="no-post">
                    <h1>No Post Yet</h1>
                </div>
            )}
            

            {!ISAddActive && (
                <div className="post">
                    {post.map((p, index) => (
                        <div key={index} className="post-container">
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
                                            <button className="delete-post-btn" onClick={() => setEditPostId(null)}>Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="update-post-btn" onClick={() => handleEditClick(p)}><FiEdit2 /> Update</button>
                                            <button className="delete-post-btn" onClick={() => handleDelPost(p.id)}><FiTrash2 /> Delete</button>
                                        </>
                                    )}
                                </div>
                            </div>
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
                                <button className={shareIndex === index ? "cancel-share-btn" : "share-btn"} onClick={() => setShareIndex(shareIndex === index ? null : index)}>
                                    <FiShare /> Share
                                </button>

                                {shareIndex === index && (
                                    <div className="share-container-parent">
                                        <h1>Friends List</h1>
                                        {friends.map((f) => (
                                            <div className="share-container" key={f.id}>
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
                </div>)}
        </>
    )
}