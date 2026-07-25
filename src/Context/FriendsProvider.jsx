import { createContext,useState } from "react";
export const FriendsContext = createContext();

export default function FriendsProvider({children})
{
    const [friends,setFriends] = useState(["Ahmad" , "Saad"])
    const [requests,setRequests] = useState(["Daniyal", "Talha"])
    
    return(
        <FriendsContext.Provider value={{friends,setFriends,requests,setRequests}}>
            {children}
        </FriendsContext.Provider>
    )
}