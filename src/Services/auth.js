const Base_Url = `http://localhost:8000/users`;
import { getAuthToken } from "./post";

export async function Signup(name , email , password){
    try{
        const response = await fetch(`${Base_Url}/register`,
            {
                method : 'POST',
                headers : {
                    'Content-Type' : 'application/json'
                },
                body : JSON.stringify({name , email , password
                })
            }
        );
        if(!response.ok)
        {
            const errData = await response.json();
            throw new Error(errData.detail || "Error in signup");
        }
        const data = await response.json();
        return data;
        
    }
    catch(error)
        {
            console.error("Error in signup",error);
            throw error;
        }      
}

export async function loginUser(email , password){
    try{
        const response = await fetch(`${Base_Url}/login`,{
            method : "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify({email , password})
        });
        if(!response.ok)
        {
            const errData = await response.json();
            throw new Error(errData.detail || "Error in Login");
        }
        const data = await response.json();
        localStorage.setItem("token",data.token);
        return data;
        
    }
    catch(error)
        {
            console.error("Error in Login",error);
            throw error;
        }      
}
export async function getUserName(){
    try{
        const response = await fetch(`${Base_Url}/me`,{
            method : 'GET',
            headers : getAuthToken(),
        });
        if(!response.ok)
        {
            throw new Error("Error while getting User Name")
        }
        const data = await response.json();
        return data;
    }
    catch(error)
    {
        console.error("Error in getting User Name",error);
    }
}