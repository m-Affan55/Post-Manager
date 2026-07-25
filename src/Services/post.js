export const Base_url = `https://localhost:3000/api/auth`;
export const getAuthToken=()=>{
    
    const token = localStorage.getItem("token");
    return {
        'Content-Type' : 'application/json',
        'Authorization' : `Bearer ${token}`
    }
}
export async function CreatePost(post){
    try{
        const response = await fetch(`${Base_url}/create-post`,{
            method : 'POST',
            headers : getAuthToken(),
            body : JSON.stringify({post})
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
        const response = fetch(`${Base_url}/update-post`,{
            method : 'PUT',
            headers : getAuthToken(),
            body : JSON.stringify(post)
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
        const response = fetch(`${Base_url}/delete-post`,{
            method : 'DELETE',
            headers : getAuthToken(),
            body : JSON.stringify(postId)
        });

        if(!response.ok)
        {
            throw new Error("Error in deleting post") 
        }
        const data = await response.json();
        return data;
        
    }
    catch(error)
        {
            console.error("Error in deleting post",error);
        }      
}

export async function AddComment(comment){
    try{
        const response = fetch(`${Base_url}/add-comment`,{
            method : 'POST',
            headers : getAuthToken(),
            body : JSON.stringify(comment)
        });

        if(!response.ok)
        {
            throw new Error("Error in adding comment") 
        }
        const data = await response.json();
        return data;
        
    }
    catch(error)
        {
            console.error("Error in adding comment",error);
        }      
}
