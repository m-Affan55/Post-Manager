import { useContext, useState } from "react"
import '../Styles/Post.css'
import {FriendsContext} from "../Context/FriendsProvider.jsx"

export default function Post() {
    const [addComments, setAddComments] = useState('')
    const [ISAddActive,setIsAddActive] = useState(false)
    const [addPost,setAddPost] = useState({
        title: "",
        content: "",
        comments: [],
        showComments: false
    })
    const {friends} = useContext(FriendsContext);
    
    const [shareIndex,setShareIndex] = useState(null)

    const [post, setPosts] = useState([{
        title: "Introduction to React", 
        content : "React is a declarative, efficient, and flexible JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called components.",
        comments : ["Great explanation!", "Helped me a lot, thanks."],
        showComments : false
    },
    {
        title: "Styling in React", 
        content : "There are many ways to style React components. You can use traditional CSS, CSS modules, CSS-in-JS libraries like styled-components, or utility-first frameworks like Tailwind CSS.",
        comments : ["I prefer Tailwind!", "CSS modules are my go-to."],
        showComments : false
    }]) 
    
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
    const handleAddPost = ()=>{
      if (!addPost.title.trim() || !addPost.content.trim())
        {
          alert("please add the all fields")
          return
        };

      setPosts([...post, addPost])

      setAddPost({ title: "", content: "", comments: [], showComments: false })
      setIsAddActive(false)

    }

    return (
      <>
      
      <div className="add-post-container-parent">

        <button className={!ISAddActive ? "add-post-btn" : "cancel-btn"} onClick={()=>setIsAddActive(!ISAddActive)}>{!ISAddActive ? "Add Post" : "Cancel"}</button>
        { ISAddActive && (<div className="add-container">
            <input type="text" placeholder="Title" name="title" value={addPost.title} onChange={handleChange}></input>
            <input type="text" placeholder="Content" name="content" value={addPost.content} onChange={handleChange}></input>
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
                    <div className="post-buttons">
                    
                    <button className="toggle-comments-btn" onClick={() => handleShowComment(index)}>
                        {p.showComments ? "Hide Comments" : "Show Comments"}
                    </button>
                    <button className="toggle-comments-btn" onClick={()=> setShareIndex(shareIndex === index ? null : index)}>Share</button>
                    {shareIndex === index && (
                        <div className="share-container-parent">
                        <h1>Friends List</h1>
                        {friends.map((f)=>(
                            <div className="share-container">
                            <p>{f}</p>
                            <button>send</button>
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