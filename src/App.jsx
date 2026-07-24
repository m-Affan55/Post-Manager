import Post from './Components/Post.jsx'
import FriendsProvider from './Context/FriendsProvider.jsx';
export default function App()
{
  return (
    <>
    <FriendsProvider>
    <Post/>
    </FriendsProvider>
    </>
    
  );
};