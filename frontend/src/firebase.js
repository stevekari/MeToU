// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDOH0x6KxtJxjKqG7_GpbhliKFfHzs9JSY",
  authDomain: "giochat-7ff08.firebaseapp.com",
  projectId: "giochat-7ff08",
  storageBucket: "giochat-7ff08.firebasestorage.app",
  messagingSenderId: "384987121915",
  appId: "1:384987121915:web:02e89d0bb9858c4301c85e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Trigger Google Sign-In popup with Firebase and format user credential for backend auth
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();

    return {
      idToken,
      email: user.email,
      displayName: user.displayName,
      photoUrl: user.photoURL,
      firebaseUid: user.uid
    };
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed before completing.');
    }
    if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in cancelled.');
    }
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized in Firebase Console (Authentication > Settings > Authorized domains).');
    }
    throw error;
  }
}

export default app;

