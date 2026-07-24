import { createContext,useState } from "react";
export const FriendsContext = createContext();

export default function FriendsProvider({children})
{
    const [friends,setFriends] = useState(["Ahmad" , "Saad"])
    return(
        <FriendsContext.Provider value={{friends,setFriends}}>
            {children}
        </FriendsContext.Provider>
    )
}