import { createContext, useState, useEffect } from "react";
import { getAllFriends } from "../Services/Friends";
import { getUserName } from "../Services/auth";

export const FriendsContext = createContext();

export default function FriendsProvider({ children }) {
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);

    const fetchFriendsData = async () => {
        try {
            const currentUser = await getUserName();
            const friendsData = await getAllFriends();
            
            if (currentUser && friendsData) {
                const formattedFriends = friendsData.map(f => {
                    if (f.requester.id === currentUser.id) {
                        return { friendship_id: f.id, ...f.addressee };
                    } else {
                        return { friendship_id: f.id, ...f.requester };
                    }
                });
                setFriends(formattedFriends);
            }
        } catch (error) {
            console.error("Failed to fetch friends for context", error);
        }
    };

    useEffect(() => {
        if (localStorage.getItem("token")) {
            fetchFriendsData();
        }
    }, []);

    return (
        <FriendsContext.Provider value={{ friends, setFriends, requests, setRequests, refreshFriends: fetchFriendsData }}>
            {children}
        </FriendsContext.Provider>
    );
}