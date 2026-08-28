import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser } from '../lib/firebase.ts';
import { UserProfile } from '../types.ts';

interface AuthContextType {
  user: User | null;
  dbProfile: UserProfile | null;
  token: string | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  fetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbProfile, setDbProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setDbProfile(null);
      return;
    }

    try {
      const idToken = await auth.currentUser.getIdToken();
      setToken(idToken);
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setDbProfile(data.user);
      }
    } catch (err) {
      console.error('Failed to sync user profile:', err);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    if (!auth.currentUser) return null;
    const refreshed = await auth.currentUser.getIdToken(true);
    setToken(refreshed);
    return refreshed;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          const res = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setDbProfile(data.user);
          }
        } catch (e) {
          console.error('Error during initial auth profile fetch:', e);
        }
      } else {
        setToken(null);
        setDbProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      await fetchUserProfile();
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await logoutUser();
      setUser(null);
      setToken(null);
      setDbProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        dbProfile,
        token,
        loading,
        signIn,
        signOut,
        refreshToken,
        fetchUserProfile,
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
