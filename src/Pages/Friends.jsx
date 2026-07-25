import { FriendsContext } from "../Context/FriendsProvider.jsx";
import { useContext, useState } from "react";
import "../Styles/Friends.css";
function Friends() {
    const [searchFriend, setSearchFriend] = useState("");
    const { friends, setFriends } = useContext(FriendsContext);
    const [SearchFriendsList, setSearchFriendsList] = useState([...friends]);
    const [toggleFriendSection, setToggleFriendSection] = useState(false);

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
            <button onClick={()=>setToggleFriendSection(false)}>Your Connections ({friends.length})</button>
            <button onClick={()=>setToggleFriendSection(true)}>Find People</button>
            </div>
            {toggleFriendSection ? (
                <div>
                <input type="text" placeholder="Find People"/>
                </div>
            )
            :
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
        }
        </div>
    )
}
export default Friends;