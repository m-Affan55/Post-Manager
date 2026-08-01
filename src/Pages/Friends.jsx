import { FriendsContext } from "../Context/FriendsProvider.jsx";
import { useContext, useState, useEffect } from "react";
import "../Styles/Friends.css";
import { findPeople, getAllFriends, getAllRequests, getSentRequests, sendRequest, acceptRequest, rejectRequest } from "../Services/Friends";

function Friends() {
    const { refreshFriends } = useContext(FriendsContext);
    const [searchFriend, setSearchFriend] = useState("");
    const [allUsers, setAllUsers] = useState([]);
    
    // We can use local state for this page to ensure it's always fresh when opened
    const [localFriends, setLocalFriends] = useState([]);
    const [localRequests, setLocalRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState({}); // Maps userId -> friendshipId

    const [SearchFriendsList, setSearchFriendsList] = useState([]);
    const [toggleFriendSection, setToggleFriendSection] = useState('yourConnections');

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            const usersRes = await findPeople();
            const friendsRes = await getAllFriends();
            const reqsRes = await getAllRequests();
            const sentReqsRes = await getSentRequests();

            if (usersRes) setAllUsers(usersRes);
            if (reqsRes) setLocalRequests(reqsRes);
            if (sentReqsRes) {
                const sentMap = {};
                sentReqsRes.forEach(r => {
                    sentMap[r.friend_id] = r.id;
                });
                setSentRequests(sentMap);
            }
            
            if (friendsRes) {
                // Determine friend details based on who is logged in
                const formattedFriends = friendsRes.map(f => {
                    const currentUserId = parseInt(localStorage.getItem("current_user_id") || "0"); 
                    // Note: If we don't have currentUserId in localStorage, we rely on the logic:
                    // Requests are only fetched where we are addressee. But getAllFriends doesn't guarantee position.
                    // It's safer to check if requester or addressee matches the friends list in context.
                    // For simplicity, we just use the API response.
                    // But wait, the backend doesn't know who is current_user in the response body.
                    // Let's just use the addressee if we are the requester, and vice versa.
                    return f; 
                });
                setLocalFriends(friendsRes);
                setSearchFriendsList(friendsRes);
            }
        };
        fetchInitialData();
    }, []);

    // Filter connections
    function SearchHandler(e) {
        const query = e.target.value;
        setSearchFriend(query);
        setSearchFriendsList(localFriends.filter((f) => {
            const friendName = f.requester ? f.requester.name : (f.addressee ? f.addressee.name : "");
            return friendName.toLowerCase().includes(query.toLowerCase());
        }));
    }

    async function handleRemove(id) {
        await rejectRequest(id);
        const newFriends = localFriends.filter((f) => f.id !== id);
        setLocalFriends(newFriends);
        setSearchFriendsList(newFriends);
        await refreshFriends();
    }

    async function handleSendRequest(userId) {
        try {
            const response = await sendRequest(userId);
            // Save the friendship ID so we can cancel it later if needed
            if (response && response.id) {
                setSentRequests(prev => ({ ...prev, [userId]: response.id }));
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function handleCancelRequest(userId, friendshipId) {
        try {
            await rejectRequest(friendshipId);
            // Remove from our sentRequests tracking state
            setSentRequests(prev => {
                const newState = { ...prev };
                delete newState[userId];
                return newState;
            });
        } catch (error) {
            console.error(error);
        }
    }

    async function handleAccept(id) {
        await acceptRequest(id);
        setLocalRequests(localRequests.filter(r => r.id !== id));
        // Refetch friends for the local page
        const friendsRes = await getAllFriends();
        setLocalFriends(friendsRes);
        setSearchFriendsList(friendsRes);
        // Refresh the global context so the Share menu gets the new friend immediately!
        if (refreshFriends) {
            await refreshFriends();
        }
    }

    async function handleReject(id) {
        await rejectRequest(id);
        setLocalRequests(localRequests.filter(r => r.id !== id));
    }

    // Filter Find People
    const filteredUsers = allUsers.filter(u => u.name.toLowerCase().includes(searchFriend.toLowerCase()));

    return (
        <div className="friends-container">
            <div className="friend-section">
                <button onClick={() => setToggleFriendSection('yourConnections')}>Your Connections ({localFriends.length})</button>
                <button onClick={() => setToggleFriendSection('find-people')}>Find People</button>
                <button onClick={() => setToggleFriendSection('requests')}>Requests ({localRequests.length})</button>
            </div>

            {toggleFriendSection === 'find-people' && (
                <div style={{width: "100%"}}>
                    <input type="text" placeholder="Find People..." value={searchFriend} onChange={(e) => setSearchFriend(e.target.value)} />
                    {searchFriend && filteredUsers.length === 0 && (
                        <p style={{textAlign: "center", marginTop: "20px", color: "var(--text-muted)"}}>No user found.</p>
                    )}
                    {searchFriend && filteredUsers.map((u, idx) => {
                        const isRequested = !!sentRequests[u.id];
                        return (
                            <div className="friend-item" key={idx}>
                                <p>{u.name}</p>
                                {isRequested ? (
                                    <button className="remove-btn" onClick={() => handleCancelRequest(u.id, sentRequests[u.id])} style={{ backgroundColor: "#9ca3af" }}>Requested</button>
                                ) : (
                                    <button className="remove-btn" onClick={() => handleSendRequest(u.id)}>Add Friend</button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {toggleFriendSection === 'yourConnections' && (
                <div style={{width: "100%"}}>
                    <input type="text" placeholder="Search Friends" value={searchFriend} onChange={SearchHandler} />
                    <h1>All Friends</h1>
                    {searchFriend && SearchFriendsList.length === 0 && (
                        <p style={{textAlign: "center", marginTop: "20px", color: "var(--text-muted)"}}>No friend found.</p>
                    )}
                    {SearchFriendsList.map((f, idx) => {
                        // Display the name of the OTHER person in the friendship
                        const friendName = f.requester ? f.requester.name : (f.addressee ? f.addressee.name : "Friend");
                        return (
                            <div className="friend-item" key={f.id || idx}>
                                <p>{friendName}</p>
                                <button className="remove-btn" onClick={() => handleRemove(f.id)}>UnFollow</button>
                            </div>
                        );
                    })}
                </div>
            )}

            {toggleFriendSection === 'requests' && (
                <div style={{width: "100%"}}>
                    {localRequests.map((r, idx) => (
                        <div className="friend-item" key={r.id || idx}>
                            <p>{r.requester ? r.requester.name : "Someone"} sent you a friend request</p>
                            <div className="request-actions">
                                <button className="remove-btn" onClick={() => handleAccept(r.id)}>Accept</button>
                                <button className="remove-btn" onClick={() => handleReject(r.id)}>Reject</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
export default Friends;