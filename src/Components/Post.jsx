import { useContext, useState } from "react"
import '../Styles/Post.css'
import { FriendsContext } from "../Context/FriendsProvider.jsx"
import { AiFillLike, AiOutlineLike } from 'react-icons/ai'
import { CreatePost, GetAllUserPosts, DeletePost, UpdatePost } from '../Services/post.js'
import { useEffect } from "react"
import { AddComment, UpdateComment, DeleteComment } from '../Services/comments.js'

export default function Post() {
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

    const [post, setPosts] = useState([]);
    useEffect(() => {
        const getPosts = async () => {
            try {
                const res = await GetAllUserPosts();
                if (res) {
                    // Add frontend properties to each post from the database
                    const formattedPosts = res.map(p => ({
                        ...p,
                        likes: p.likes || 0,
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

    const handleDel = (index) => {
        setPosts(post.map((p, i) => (

            i === index ? { ...p, comments: p.comments.slice(0, -1) }
                : p
        )))
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
                setPosts([...post, addpostRes])
            }
        }
        catch (error) {
            console.error("Error in creating post", error);
        }


        setAddPost({ title: "", content: "", comments: [], showComments: false })
        setIsAddActive(false)
        setNoPost(false);

    }
    const handleLike = (index) => {
        setPosts(post.map((p, i) =>
            i === index ? {
                ...p,
                likes: p.likes + 1
            }
                : p
        ))
    }
    const handleUnLike = (index) => {
        setPosts(post.map((p, i) => i == index ? { ...p, likes: p.likes - 1 } : p))
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

                <button className={!ISAddActive ? "add-post-btn" : "cancel-btn"} onClick={() => setIsAddActive(!ISAddActive)}>{!ISAddActive ? "Add Post" : "Cancel"}</button>
                {ISAddActive && (<div className="add-container">
                    <input type="text" placeholder="Title" name="title" value={addPost.title} onChange={handleChange}></input>
                    <textarea placeholder="Content" rows={6} name="content" value={addPost.content} onChange={handleChange}></textarea>
                    <button onClick={handleAddPost}>Post</button>
                </div>
                )}
            </div>

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
                                            <button className="update-post-btn" onClick={() => handleEditClick(p)}>Update</button>
                                            <button className="delete-post-btn" onClick={() => handleDelPost(p.id)}>Delete</button>
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
                                {p.likes == 0 ? <AiOutlineLike size={24} onClick={() => handleLike(index)} /> : <AiFillLike size={24} onClick={() => handleUnLike(index)} />}
                                <p>{p.likes}</p>
                            </div>
                            <div className="post-buttons">

                                <button className="toggle-comments-btn" onClick={() => handleShowComment(index)}>
                                    {p.showComments ? "Hide Comments" : "Show Comments"}
                                </button>
                                <button className={shareIndex === index ? "cancel-share-btn" : "share-btn"} onClick={() => setShareIndex(shareIndex === index ? null : index

                                )}>Share</button>

                                {shareIndex === index && (
                                    <div className="share-container-parent">
                                        <h1>Friends List</h1>
                                        {friends.map((f) => (
                                            <div className="share-container">
                                                <p>{f}</p>
                                                <button onClick={() => setShareIndex(null)}>send</button>
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
                                                <p className="comment">{c.content}</p>
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