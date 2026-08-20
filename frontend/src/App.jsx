import { useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useDispatch } from 'react-redux';
import { addMessage, setConversations } from './store/slices/chatSlice';
import { getMyConversations } from './api/conversationApi';
// import { usePresenceSocket } from './hooks/usePresenceSocket'; // <-- comment this
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import FriendsList from './pages/FriendsList';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Footer from './components/Footer';
import { LanguageProvider } from './contexts/LanguageContext';
import { useIncomingCallNotifications } from './hooks/useIncomingCallNotifications';
import IncomingCallPopup from './components/IncomingCallPopup';

function RequireAuth({ isAuthenticated, children }) {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function IncomingCallManager({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleMessage = useCallback((message) => {
    if (String(message.senderId) !== String(user?.userId)) {
      dispatch(addMessage({ conversationId: message.conversationId, message }));
    }
  }, [dispatch, user?.userId]);
  const { incomingCall, dismissCall, declineCall } = useIncomingCallNotifications(user?.userId, handleMessage);

  useEffect(() => {
    if (!user) return;
    getMyConversations().then((conversations) => dispatch(setConversations(conversations))).catch(() => {});
  }, [dispatch, user]);
  const isCallChatOpen = incomingCall && location.pathname === `/chat/${incomingCall.conversationId}`;

  if (!incomingCall || isCallChatOpen) return null;

  const acceptCall = () => {
    navigate(`/chat/${incomingCall.conversationId}`, {
      state: { friend: incomingCall.friend, incomingCall },
    });
    dismissCall();
  };

  return <IncomingCallPopup call={incomingCall} onAccept={acceptCall} onDecline={declineCall} />;
}

export default function App() {
  const { user, loginUser, logout, updateStoredUser, isAuthenticated } = useAuth();

  // usePresenceSocket(user); // <-- COMMENT THIS LINE - stops the ws://localhost:10000 403 spam

  return (
    <LanguageProvider>
      <div className="app-shell">
        <Navbar user={user} onLogout={logout} />
        <IncomingCallManager user={user} />
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
    </LanguageProvider>
  );
}