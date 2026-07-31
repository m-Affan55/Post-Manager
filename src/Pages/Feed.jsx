import { useContext, useState, useEffect } from "react"
import '../Styles/Post.css'
import { FriendsContext } from "../Context/FriendsProvider.jsx"
import { AiFillLike, AiOutlineLike } from 'react-icons/ai'
import { GetAllFeedPosts } from '../Services/post.js'
import { AddComment } from '../Services/comments.js'

export default function Feed() {
    const [addComments, setAddComments] = useState('')
    const [NoPost, setNoPost] = useState(true);
    const { friends } = useContext(FriendsContext);

    const [shareIndex, setShareIndex] = useState(null)
    const [post, setPosts] = useState([]);

    useEffect(() => {
        const getPosts = async () => {
            try {
                const res = await GetAllFeedPosts();
                if (res) {
                    const formattedPosts = res.map(p => ({
                        ...p,
                        likes: p.likes || 0,
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
                                    {friends.map((f, fIdx) => (
                                        <div key={fIdx} className="share-container">
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
            </div>
        </>
    )
}
