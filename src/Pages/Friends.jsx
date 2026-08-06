import { FriendsContext } from "../Context/FriendsProvider.jsx";
import { useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../Styles/Friends.css";
import { findPeople, getAllFriends, getAllRequests, getSentRequests, sendRequest, acceptRequest, rejectRequest } from "../Services/Friends";

function Friends() {
    const location = useLocation();
    const { refreshFriends } = useContext(FriendsContext);
    const [searchFriend, setSearchFriend] = useState("");
    const [allUsers, setAllUsers] = useState([]);
    
    // We can use local state for this page to ensure it's always fresh when opened
    const [localFriends, setLocalFriends] = useState([]);
    const [localRequests, setLocalRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState({}); // Maps userId -> friendshipId

    const [SearchFriendsList, setSearchFriendsList] = useState([]);
    const [toggleFriendSection, setToggleFriendSection] = useState(location.state?.tab || 'yourConnections');

    // FEAT-13: Loading and error states for initial data fetch
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const currentUserId = parseInt(localStorage.getItem("current_user_id") || "0");

    useEffect(() => {
        if (location.state?.tab) {
            setToggleFriendSection(location.state.tab);
        }
    }, [location.state]);

    // FEAT-1: Helper to get the OTHER person's name from a friendship record
    function getFriendName(friendship) {
        if (friendship.requester && friendship.requester.id === currentUserId) {
            return friendship.addressee ? friendship.addressee.name : "Friend";
        }
        return friendship.requester ? friendship.requester.name : "Friend";
    }

    // FEAT-3: Helper to get the OTHER person's ID from a friendship record
    function getFriendId(friendship) {
        if (friendship.requester && friendship.requester.id === currentUserId) {
            return friendship.addressee ? friendship.addressee.id : null;
        }
        return friendship.requester ? friendship.requester.id : null;
    }

    // FEAT-13: Fetch initial data with proper error handling
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            setLoadError("");
            try {
                const [usersRes, friendsRes, reqsRes, sentReqsRes] = await Promise.all([
                    findPeople(),
                    getAllFriends(),
                    getAllRequests(),
                    getSentRequests()
                ]);

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
                    setLocalFriends(friendsRes);
                    setSearchFriendsList(friendsRes);
                }
            } catch (error) {
                console.error("Failed to load friends data:", error);
                setLoadError("Failed to load friends data. Please refresh the page.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // FEAT-2: Filter connections using the correct friend name
    function SearchHandler(e) {
        const query = e.target.value;
        setSearchFriend(query);
        setSearchFriendsList(localFriends.filter((f) => {
            const friendName = getFriendName(f);
            return friendName.toLowerCase().includes(query.toLowerCase());
        }));
    }

    // FEAT-12: Add confirmation before unfollowing
    async function handleRemove(id) {
        if (!window.confirm("Are you sure you want to unfriend this person?")) return;
        try {
            await rejectRequest(id);
            const newFriends = localFriends.filter((f) => f.id !== id);
            setLocalFriends(newFriends);
            setSearchFriendsList(newFriends);
            await refreshFriends();
        } catch (error) {
            alert(`Could not remove friend: ${error.message}`);
        }
    }

    async function handleSendRequest(userId) {
        try {
            const response = await sendRequest(userId);
            // Save the friendship ID so we can cancel it later if needed
            if (response && response.id) {
                setSentRequests(prev => ({ ...prev, [userId]: response.id }));
            }
        } catch (error) {
            alert(`Could not send request: ${error.message}`);
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
            alert(`Could not cancel request: ${error.message}`);
        }
    }

    async function handleAccept(id) {
        try {
            await acceptRequest(id);
            setLocalRequests(localRequests.filter(r => r.id !== id));
            // Guard: getAllFriends() can return undefined on network error.
            // Without the check, setLocalFriends(undefined) → next .map() crashes the page.
            const friendsRes = await getAllFriends();
            if (friendsRes) {
                setLocalFriends(friendsRes);
                setSearchFriendsList(friendsRes);
            }
            if (refreshFriends) await refreshFriends();
        } catch (error) {
            alert(`Could not accept request: ${error.message}`);
        }
    }

    // FEAT-12: Add confirmation before rejecting
    async function handleReject(id) {
        if (!window.confirm("Are you sure you want to reject this friend request?")) return;
        try {
            await rejectRequest(id);
            setLocalRequests(localRequests.filter(r => r.id !== id));
        } catch (error) {
            alert(`Could not reject request: ${error.message}`);
        }
    }

    // FEAT-3: Filter Find People — exclude already-friended, pending requests, and sent requests
    const friendIds = new Set(localFriends.map(f => getFriendId(f)).filter(Boolean));
    const receivedRequestIds = new Set(localRequests.map(r => r.requester ? r.requester.id : null).filter(Boolean));
    const sentRequestIds = new Set(Object.keys(sentRequests).map(Number));

    const filteredUsers = allUsers.filter(u =>
        !friendIds.has(u.id) &&
        !receivedRequestIds.has(u.id) &&
        !sentRequestIds.has(u.id) &&
        u.name.toLowerCase().includes(searchFriend.toLowerCase())
    );

    // FEAT-13: Loading skeleton
    if (isLoading) {
        return (
            <div className="friends-container">
                <div className="friend-section">
                    <button className="active">Your Connections</button>
                    <button>Find People</button>
                    <button>Requests</button>
                </div>
                <div style={{ width: "100%", textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                    Loading friends data…
                </div>
            </div>
        );
    }

    // FEAT-13: Error state
    if (loadError) {
        return (
            <div className="friends-container">
                <div style={{ width: "100%", textAlign: "center", padding: "40px 0", color: "var(--destructive)" }}>
                    <h2>{loadError}</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="friends-container">
            <div className="friend-section">
                <button
                    className={toggleFriendSection === 'yourConnections' ? 'active' : ''}
                    onClick={() => setToggleFriendSection('yourConnections')}
                >
                    Your Connections ({localFriends.length})
                </button>
                <button
                    className={toggleFriendSection === 'find-people' ? 'active' : ''}
                    onClick={() => setToggleFriendSection('find-people')}
                >
                    Find People
                </button>
                <button
                    className={toggleFriendSection === 'requests' ? 'active' : ''}
                    onClick={() => setToggleFriendSection('requests')}
                >
                    Requests ({localRequests.length})
                </button>
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
                            <div className="friend-item" key={u.id} style={{ animationDelay: `${idx * 0.05}s` }}>
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
                    {localFriends.length === 0 && !searchFriend && (
                        <p style={{textAlign: "center", marginTop: "20px", color: "var(--text-muted)"}}>No friends yet. Go to "Find People" to add some!</p>
                    )}
                    {searchFriend && SearchFriendsList.length === 0 && (
                        <p style={{textAlign: "center", marginTop: "20px", color: "var(--text-muted)"}}>No friend found.</p>
                    )}
                    {SearchFriendsList.map((f, idx) => {
                        // FEAT-1: Display the name of the OTHER person in the friendship
                        const friendName = getFriendName(f);
                        return (
                            <div className="friend-item" key={f.id || idx} style={{ animationDelay: `${idx * 0.05}s` }}>
                                <p>{friendName}</p>
                                <button className="remove-btn" onClick={() => handleRemove(f.id)}>UnFollow</button>
                            </div>
                        );
                    })}
                </div>
            )}

            {toggleFriendSection === 'requests' && (
                <div style={{width: "100%"}}>
                    {localRequests.length === 0 && (
                        <p style={{textAlign: "center", marginTop: "20px", color: "var(--text-muted)"}}>No pending friend requests.</p>
                    )}
                    {localRequests.map((r, idx) => (
                        <div className="friend-item" key={r.id || idx} style={{ animationDelay: `${idx * 0.05}s` }}>
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