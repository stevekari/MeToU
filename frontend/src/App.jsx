import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
// import { usePresenceSocket } from './hooks/usePresenceSocket'; // <-- comment this
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import FriendsList from './pages/FriendsList';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Footer from './components/Footer';

function RequireAuth({ isAuthenticated, children }) {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, loginUser, logout, updateStoredUser, isAuthenticated } = useAuth();

  // usePresenceSocket(user); // <-- COMMENT THIS LINE - stops the ws://localhost:10000 403 spam

  return (
    <div className="app-shell">
      <Navbar user={user} onLogout={logout} />
      <main className="app-main">
        <Routes>
          <Route path="/login" element={isAuthenticated? <Navigate to="/friends" replace /> : <Login onLogin={loginUser} />} />
          <Route path="/register" element={isAuthenticated? <Navigate to="/friends" replace /> : <Register onLogin={loginUser} />} />
          <Route path="/friends" element={<RequireAuth isAuthenticated={isAuthenticated}><FriendsList /></RequireAuth>} />
          <Route path="/chat/:conversationId" element={<RequireAuth isAuthenticated={isAuthenticated}><Chat currentUserId={user?.userId} /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth isAuthenticated={isAuthenticated}><Settings user={user} onProfileUpdate={updateStoredUser} /></RequireAuth>} />
          <Route path="*" element={<Navigate to={isAuthenticated? '/friends' : '/login'} replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}