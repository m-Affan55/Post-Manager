import { Base_url, getAuthToken } from "./post"

export async function getAllFriends()
{
    try{
        const response = await fetch(`${Base_url}/get-friends`,{
            method : 'GET',
            headers : getAuthToken()
        });
        if(!response.ok)
        {
            throw new Error("Error in getting friends") 
        }
        const data = await response.json();
        return data;
        
    }
    catch(error)
        {
            console.error("Error in getting friends",error);
        }      
}

export async function getAllRequests()
{
    try{
        const response = await fetch(`${Base_url}/get-requests`,{
            method : 'GET',
            headers : getAuthToken()
        });
        if(!response.ok)
        {
            throw new Error("Error in getting requests") 
        }
        const data = await response.json();
        return data;
        
    }
    catch(error)
        {
            console.error("Error in getting requests",error);
        }      
}

export async function findPeople(name)
{
    try{
        const response = await fetch(`${Base_url}/find-people`,{
            method : 'GET',
            headers : getAuthToken()
        });
        if(!response.ok)
        {
            throw new Error("Error in finding people") 
        }
        const data = await response.json();
        return data;
        
    }
    catch(error)
        {
            console.error("Error in finding people",error);
        }      
}