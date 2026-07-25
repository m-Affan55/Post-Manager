import Post from './Components/Post.jsx'
import FriendsProvider from './Context/FriendsProvider.jsx';
import Friends from './Pages/Friends.jsx';
export default function App()
{
  return (
    <>
    <FriendsProvider>
    <Post/>
    <Friends/>
    </FriendsProvider>
    </>
    
  );
};