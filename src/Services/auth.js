const Base_Url = `http://localhost:8000/users`;


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
            throw new Error("Error in signup") 
        }
        const data = await response.json();
        return data;
        
    }
    catch(error)
        {
            console.error("Error in signup",error);
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
            throw new Error("Error in Login") 
        }
        const data = await response.json();
        localStorage.setItem("token",data.token);
        return data;
        
    }
    catch(error)
        {
            console.error("Error in Login",error);
        }      
}