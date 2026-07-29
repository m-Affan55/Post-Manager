import { useContext, useState } from "react"
import '../Styles/Post.css'
import {FriendsContext} from "../Context/FriendsProvider.jsx"
import {AiFillLike,AiOutlineLike} from 'react-icons/ai'
import {CreatePost, GetAllUserPosts} from '../Services/post.js'
import { useEffect } from "react"

export default function Post() {
    const [addComments, setAddComments] = useState('')
    const [ISAddActive,setIsAddActive] = useState(false)
    const [addPost,setAddPost] = useState({
        title: "",
        content: "",
        comments: [],
        showComments: false,
        likes: 0
    })
    const {friends} = useContext(FriendsContext);
    
    const [shareIndex,setShareIndex] = useState(null)

    const [post, setPosts] = useState([]);
    useEffect(()=>{
        const getPosts = async ()=>
            {
                try{
                    const res = await  GetAllUserPosts();
                    console.log(res);
                }
                catch(error)
                {
                    console.error("Error in getting posts",error);
                }
        }
        getPosts(); 
    },[]) 
    
    const handleAdd = (index) => {
        if (!addComments.trim()) return;
        setPosts(post.map((p, i) =>
            i === index ? { ...p,
                comments: [...p.comments, addComments]
            }
            : p 
        ))
        setAddComments('')
    }
  
    const handleShowComment = (index) => {
        setPosts(post.map((p, i) =>
            i === index ? { ...p,
                showComments : !p.showComments
            }
            : p
        ))
    }

    const handleDel = (index)=>{
      setPosts(post.map((p, i)=>(
        
        i === index ? { ...p, comments: p.comments.slice(0,-1) }
        : p
      )))
    }

    const handleChange = (e)=>{
      setAddPost({...addPost, [e.target.name]: e.target.value})
    }
    const handleAddPost = async ()=>{
      if (!addPost.title.trim() || !addPost.content.trim())
        {
          alert("please add the all fields")
          return
        };

        try{
            const addpostRes = await CreatePost(addPost);
            console.log(addpostRes);
            setPosts([...post, addpostRes])
        }
        catch(error)
        {
            console.error("Error in creating post",error);
        }
    

      setAddPost({ title: "", content: "", comments: [], showComments: false })
      setIsAddActive(false)

    }
    const handleLike = (index)=>
    {
        setPosts(post.map((p, i) =>
            i === index ? { ...p,
                likes: p.likes + 1
            }
            : p
        ))
    }
    const handleUnLike = (index)=>{
        setPosts(post.map((p,i)=>i == index ? {...p,likes: p.likes - 1} : p))
    }

    return (
      <>
      
      <div className="add-post-container-parent">

        <button className={!ISAddActive ? "add-post-btn" : "cancel-btn"} onClick={()=>setIsAddActive(!ISAddActive)}>{!ISAddActive ? "Add Post" : "Cancel"}</button>
        { ISAddActive && (<div className="add-container">
            <input type="text" placeholder="Title" name="title" value={addPost.title} onChange={handleChange}></input>
            {/* <input type="text" placeholder="Content" name="content" value={addPost.content} onChange={handleChange}></input> */}
            <textarea placeholder="Content" rows={6} name="content" value={addPost.content} onChange={handleChange}></textarea>
            <button onClick={handleAddPost}>Post</button>
        </div>
      )}
      </div>

      { !ISAddActive && (
        <div className="post">
            {post.map((p, index) => (
                <div key={index} className="post-container">
                    <h1>{p.title}</h1>
                    <p>{p.content}</p>
                    <div className="like-container">
                        {p.likes ==0 ? <AiOutlineLike size={24} onClick={()=>handleLike(index)}/> : <AiFillLike size={24} onClick={()=>handleUnLike(index)}/>}
                        <p>{p.likes}</p>
                    </div>
                    <div className="post-buttons">
                    
                    <button className="toggle-comments-btn" onClick={() => handleShowComment(index)}>
                        {p.showComments ? "Hide Comments" : "Show Comments"}
                    </button>
                    <button className={shareIndex === index ? "cancel-share-btn" : "share-btn"} onClick={()=> setShareIndex(shareIndex === index ? null : index
                        
                    )}>Share</button>
                    {shareIndex === index && (
                        <div className="share-container-parent">
                        <h1>Friends List</h1>
                        {friends.map((f)=>(
                            <div className="share-container">
                            <p>{f}</p>
                            <button onClick={()=>setShareIndex(null)}>send</button>
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
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd(index)}
                                />
                                <button className="add-comment-btn" onClick={() => handleAdd(index)}>Post</button>
                            </div>
                            <div className="comments-list">
                                {p.comments.map((c, cIndex) => (
                                    <div key={cIndex} className="comment-wrapper">
                                        <p className="comment">{c}</p>
                                        <button className="delete-comment-btn" onClick={() => handleDel(index)}>Delete</button>
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