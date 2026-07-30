const Base_url = "http://localhost:8000/comments";
const getAuthToken=()=>{
    const token = localStorage.getItem("token");
    return {
        'Content-Type' : 'application/json',
        'Authorization  ' : `Bearer ${token}`
    }
}

export async function AddComment(comment){
    try{
        const response = fetch(`${Base_url}`,{
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


export async function GetAllComments(post_id){
    try{
        const response = await fetch(`${Base_url}/${post_id}`,{
            method : 'GET',
            headers : getAuthToken(),
        });
        if(!response.ok)
        {
            throw new Error("Error while getting Comments")
        }
        const data = await response.json();
        return data;
    }
    catch(error)
    {
        console.error("Error in getting Comments",error);
    }
}

export async function UpdateComment(comment){
    try{
        const response = await fetch(`${Base_url}/${comment.id}`,{
            method : 'PUT',
            headers : getAuthToken(),
            body : JSON.stringify(comment)
        });
        if(!response.ok)
        {
            throw new Error("Error in updating comment") 
        } 
    }
    catch(error)
        {
            console.error("Error in updating comment",error);
        }   
    }

export async function DeleteComment(comment_id){
    try{
        const response = await fetch(`${Base_url}/${comment_id}`,{
            method : 'DELETE',
            headers : getAuthToken(),
        });
        if(!response.ok)
        {
            throw new Error("Error in deleting comment") 
        } 
    }
    catch(error)
        {
            console.error("Error in deleting comment",error);
        }   
    }