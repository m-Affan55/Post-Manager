export const Base_url = `http://localhost:8000/posts`;
export const getAuthToken=()=>{
    
    const token = localStorage.getItem("token");
    return {
        'Content-Type' : 'application/json',
        'Authorization' : `Bearer ${token}`
    }
}
export async function GetAllUserPosts(){
    try{
        const response = await fetch(`${Base_url}`,{
            method : 'GET',
            headers : getAuthToken(),
        });
        if(!response.ok)
        {
            throw new Error("Error while getting Posts")
        }
        const data = await response.json();
        return data;
    }
    catch(error)
    {
        console.error("Error in getting Posts",error);
    }
}

export async function GetAllFeedPosts(){
    try{
        const response = await fetch(`${Base_url}/feed`,{
            method : 'GET',
            headers : getAuthToken(),
        });
        if(!response.ok)
        {
            throw new Error("Error while getting Feed Posts")
        }
        const data = await response.json();
        return data;
    }
    catch(error)
    {
        console.error("Error in getting Feed Posts",error);
    }
}

export async function CreatePost(post){
    try{
        const response = await fetch(`${Base_url}`,{
            method : 'POST',
            headers : getAuthToken(),
            body : JSON.stringify(post)
        });
        if(!response.ok)
        {
            throw new Error("Error in creating post") 
        }
        const data = await response.json();
        return data;
        
    }
    catch(error)
        {
            console.error("Error in creating post",error);
        }      
}

export async function UpdatePost(post){
    try{
        const response = await fetch(`${Base_url}/${post.id}`,{
            method : 'PUT',
            headers : getAuthToken(),
            body : JSON.stringify({title : post.title , content : post.content})
        });

        if(!response.ok)
        {
            throw new Error("Error in updating post") 
        }
        const data = await response.json();
        return data;
        
    }
    catch(error)
        {
            console.error("Error in updating post",error);
        }      
}

export async function DeletePost(postId){
    try{
        const response = await fetch(`${Base_url}/${postId}`,{
            method : 'DELETE',
            headers : getAuthToken(),
            body : JSON.stringify(postId)
        });

        if(!response.ok)
        {
            throw new Error("Error in deleting post") 
        }
        if (response.status == 204)
        {
            return true;
        }
        return await response.json();
        
    }
    catch(error)
        {
            console.error("Error in deleting post",error);
        }      
}

export async function LikePost(postId){
    try{
        const response = await fetch(`${Base_url}/${postId}/like`,{
            method : 'POST',
            headers : getAuthToken(),
        });

        if(!response.ok)
        {
            throw new Error("Error in liking post") 
        }
        return await response.json();
        
    }
    catch(error)
        {
            console.error("Error in liking post",error);
        }      
}

export async function UnlikePost(postId){
    try{
        const response = await fetch(`${Base_url}/${postId}/like`,{
            method : 'DELETE',
            headers : getAuthToken(),
        });

        if(!response.ok)
        {
            throw new Error("Error in unliking post") 
        }
        if (response.status == 204)
        {
            return true;
        }
        return await response.json();
        
    }
    catch(error)
        {
            console.error("Error in unliking post",error);
        }      
}

