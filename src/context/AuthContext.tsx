import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, OWNER_EMAIL } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        const emailLower = currentUser.email.toLowerCase().trim();
        const isOwnerEmail = emailLower === OWNER_EMAIL.toLowerCase().trim();

        // STRICT SECURITY (Requirement 8 & 9):
        // Never grant administrator privileges based only on an email address entered during
        // unverified registration. Must have verified email (e.g. from Google Sign-In)
        // or exist as an explicitly authorized admin in the Firestore 'admins' collection.
        const isVerifiedOwner = isOwnerEmail && currentUser.emailVerified === true;

        let isAdminInFirestore = false;
        try {
          const adminDocRef = doc(db, 'admins', currentUser.uid);
          const snap = await getDoc(adminDocRef);
          if (snap.exists()) {
            isAdminInFirestore = true;
          }
        } catch {
          isAdminInFirestore = false;
        }

        const effectiveAdmin = isVerifiedOwner || isAdminInFirestore;
        setIsOwner(isVerifiedOwner);
        setIsAdmin(effectiveAdmin);
      } else {
        setIsAdmin(false);
        setIsOwner(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in with Google';
      if (msg.includes('auth/operation-not-allowed')) {
        setAuthError(
          'Google Sign-In is disabled in Firebase. Please enable the Google provider in Firebase Console → Authentication → Sign-in method.'
        );
      } else if (msg.includes('auth/unauthorized-domain')) {
        setAuthError(
          'This domain is not authorized in Firebase. Add this domain under Firebase Console → Authentication → Settings → Authorized domains.'
        );
      } else if (msg.includes('auth/popup-closed-by-user')) {
        setAuthError('Sign in popup was closed before completing.');
      } else if (msg.includes('auth/popup-blocked')) {
        setAuthError('Popup was blocked by your browser. Please allow popups for this site.');
      } else {
        setAuthError(msg);
      }
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      if (msg.includes('auth/operation-not-allowed')) {
        setAuthError(
          'Email/Password sign-in is disabled in Firebase. Please enable Email/Password under Firebase Console → Authentication → Sign-in method.'
        );
      } else if (
        msg.includes('auth/user-not-found') ||
        msg.includes('auth/wrong-password') ||
        msg.includes('auth/invalid-credential')
      ) {
        setAuthError('Invalid email or password. Please verify your credentials or register a new account.');
      } else if (msg.includes('auth/too-many-requests')) {
        setAuthError('Too many failed attempts. Please wait a few moments or reset your password.');
      } else if (msg.includes('auth/invalid-email')) {
        setAuthError('Please enter a valid email address.');
      } else {
        setAuthError(msg);
      }
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create account';
      if (msg.includes('auth/operation-not-allowed')) {
        setAuthError(
          'Email/Password registration is disabled in Firebase. Please enable Email/Password in Firebase Console → Authentication → Sign-in method.'
        );
      } else if (msg.includes('auth/email-already-in-use')) {
        setAuthError('This email is already registered. Please sign in instead.');
      } else if (msg.includes('auth/weak-password')) {
        setAuthError('Password is too weak. Please use at least 6 characters.');
      } else if (msg.includes('auth/invalid-email')) {
        setAuthError('Please enter a valid email address.');
      } else {
        setAuthError(msg);
      }
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send password reset email';
      if (msg.includes('auth/operation-not-allowed')) {
        setAuthError(
          'Email/Password provider is disabled in Firebase. Enable it under Firebase Console → Authentication → Sign-in method.'
        );
      } else if (msg.includes('auth/user-not-found')) {
        setAuthError('No account found with this email address.');
      } else if (msg.includes('auth/invalid-email')) {
        setAuthError('Please enter a valid email address.');
      } else {
        setAuthError(msg);
      }
      throw err;
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
      setIsAdmin(false);
      setIsOwner(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign out';
      setAuthError(msg);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isOwner,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
