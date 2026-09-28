import { useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useDispatch } from 'react-redux';
import { addMessage, setConversations } from './store/slices/chatSlice';
import { getMyConversations } from './api/conversationApi';
import api from './api/axios';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import FriendsList from './pages/FriendsList';
import Network from './pages/Network';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Calls from './pages/Calls';
import Settings from './pages/Settings';
import Footer from './components/Footer';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import ToastContainer from './components/ToastContainer';
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
  const { toast } = useToast();
  const handleMessage = useCallback((message) => {
    if (String(message.senderId) !== String(user?.userId)) {
      dispatch(addMessage({ conversationId: message.conversationId, message }));
    }
  }, [dispatch, user?.userId]);
  const { incomingCall, dismissCall, declineCall } = useIncomingCallNotifications(user?.userId, handleMessage, toast);

  useEffect(() => {
    if (!user) return;
    getMyConversations().then((conversations) => dispatch(setConversations(conversations))).catch(() => {});
  }, [dispatch, user]);
  const isCallChatOpen = incomingCall && location.pathname === `/chat/${incomingCall.conversationId}`;

  if (!incomingCall || isCallChatOpen) return null;

  const acceptCall = () => {
    navigate(`/chat/${incomingCall.conversationId}`, {
      state: { friend: incomingCall.friend, incomingCall, autoAccept: true },
    });
    dismissCall();
  };

  return <IncomingCallPopup call={incomingCall} onAccept={acceptCall} onDecline={declineCall} />;
}

export default function App() {
  const { user, loginUser, logout, updateStoredUser, isAuthenticated } = useAuth();

  // Pre-warm backend on initial mount (wakes up Render instance)
  useEffect(() => {
    api.get('/auth/health').catch(() => {});
  }, []);

  return (
    <LanguageProvider>
      <ToastProvider>
        <div className="app-shell">
          <ToastContainer />
          <Navbar user={user} onLogout={logout} />
          <IncomingCallManager user={user} />
          <main className="app-main">
            <Routes>
              <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={loginUser} />} />
              <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register onLogin={loginUser} />} />
              <Route path="/" element={<RequireAuth isAuthenticated={isAuthenticated}><Feed user={user} /></RequireAuth>} />
              <Route path="/feed" element={<RequireAuth isAuthenticated={isAuthenticated}><Feed user={user} /></RequireAuth>} />
              <Route path="/friends" element={<RequireAuth isAuthenticated={isAuthenticated}><FriendsList /></RequireAuth>} />
              <Route path="/calls" element={<RequireAuth isAuthenticated={isAuthenticated}><Calls currentUserId={user?.userId || user?.id} /></RequireAuth>} />
              <Route path="/network" element={<RequireAuth isAuthenticated={isAuthenticated}><Network currentUserId={user?.userId || user?.id} /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth isAuthenticated={isAuthenticated}><Profile user={user} onProfileUpdate={updateStoredUser} /></RequireAuth>} />
              <Route path="/profile/:userId" element={<RequireAuth isAuthenticated={isAuthenticated}><Profile user={user} onProfileUpdate={updateStoredUser} /></RequireAuth>} />
              <Route path="/chat/:conversationId" element={<RequireAuth isAuthenticated={isAuthenticated}><Chat currentUserId={user?.userId || user?.id} /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth isAuthenticated={isAuthenticated}><Settings user={user} onProfileUpdate={updateStoredUser} /></RequireAuth>} />
              <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
            </Routes>
          </main>
          {isAuthenticated && <MobileBottomNav user={user} />}
          <Footer />
          <PWAInstallPrompt />
        </div>
      </ToastProvider>
    </LanguageProvider>
  );
}