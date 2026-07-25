import { FriendsContext } from "../Context/FriendsProvider.jsx";
import { useContext, useState } from "react";
import "../Styles/Friends.css";

function Friends() {
    const [searchFriend, setSearchFriend] = useState("");
    const { friends, setFriends } = useContext(FriendsContext);
    const {requests,setRequests}=useContext(FriendsContext)
    const [SearchFriendsList, setSearchFriendsList] = useState([...friends]);
    const [toggleFriendSection, setToggleFriendSection] = useState('yourConnections');

    function SearchHandler(e) {
        const query = e.target.value;
        setSearchFriend(query);
        setSearchFriendsList(friends.filter((f) => (f.toLowerCase().includes(query.toLowerCase()))));
    }

    function hanleRemove(name) {
        const newFriends = friends.filter((f) => (f !== name));
        setFriends(newFriends);
        setSearchFriendsList(newFriends);
    }
    return (
        <div className="friends-container">

        



            <div className="friend-section">
            <button onClick={()=>setToggleFriendSection('yourConnections')}>Your Connections ({friends.length})</button>
            <button onClick={()=>setToggleFriendSection('find-people')}>Find People</button>
            <button onClick={()=>setToggleFriendSection('requests')}>Requests</button>
            </div>
            {toggleFriendSection === 'find-people' && (
                <div>
                <input type="text" placeholder="Find People"/>
                </div>
            )
            }
            {toggleFriendSection === 'yourConnections' &&(
            <>
            <input type="text" placeholder="Search Friends" value={searchFriend} onChange={SearchHandler} />
            <h1>All Friends</h1>
            {SearchFriendsList.map((f, idx) => (
                <div className="friend-item">
                    <p key={idx}>{f}</p>
                    <button className="remove-btn" onClick={()=>hanleRemove(f)}>UnFollow</button>
                </div>
            ))}

            </>
            )}

            {toggleFriendSection === 'requests' && (
                <div style={{width: "100%"}}>
                {requests.map((r,idx)=>(
                    <div className="friend-item" key={idx}>
                        <p>{r}</p>
                        <div className="request-actions">
                            <button className="remove-btn">Accept</button>
                            <button className="remove-btn">Reject</button>
                        </div>
                    </div>
                ))}
                </div>
            )}
        
        </div>
    )
}
export default Friends;