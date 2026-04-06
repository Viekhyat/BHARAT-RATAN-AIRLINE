import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { adminAuth, adminDb } from '../lib/adminFirebase';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '../types/index';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  setUser: () => { },
  setIsAdmin: () => { }
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from cache (the "catch") for instant availability
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('auth_cache');
    return cached ? JSON.parse(cached) : null;
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('is_admin_cache') === 'true';
  });
  const [loading, setLoading] = useState(() => {
    // If we have a cached user, we can skip the initial loading screen for immediate UI
    return !localStorage.getItem('auth_cache');
  });

  // Sync caches whenever state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_cache', JSON.stringify(user));
      localStorage.setItem('is_admin_cache', isAdmin.toString());
    } else {
      localStorage.removeItem('auth_cache');
      localStorage.removeItem('is_admin_cache');
    }
  }, [user, isAdmin]);

  useEffect(() => {
    let passengerResolved = false;
    let adminResolved = false;

    const finalize = () => {
      if (passengerResolved && adminResolved) {
        setLoading(false);
      }
    };

    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    const unsubPassenger = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Pre-emptively set some basic user data so Dashboard doesn't boot the user
          const basicUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Member',
            role: 'user'
          };
          setUser(basicUser);

          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data() as User;
            const updatedUser = { ...userData, uid: firebaseUser.uid };
            setUser(updatedUser);
            setIsAdmin(userData.role === 'admin');
            localStorage.setItem('auth_cache', JSON.stringify(updatedUser));
            localStorage.setItem('is_admin_cache', (userData.role === 'admin').toString());
          }
        } else if (!adminAuth.currentUser) {
          setUser(null);
          setIsAdmin(false);
          localStorage.removeItem('auth_cache');
          localStorage.removeItem('is_admin_cache');
        }
      } catch (e) {
        console.error("Passenger Auth Sync Error:", e);
        // On error (like permission denied), we keep the 'basicUser' set above
      } finally {
        passengerResolved = true;
        finalize();
      }
    });

    const unsubAdmin = onAuthStateChanged(adminAuth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const basicAdmin: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'Staff',
            role: 'admin'
          };
          setUser(basicAdmin);
          setIsAdmin(true);

          const userRef = doc(adminDb, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data() as User;
            const updatedUser = { ...userData, uid: firebaseUser.uid };
            setUser(updatedUser);
            setIsAdmin(true);
            localStorage.setItem('auth_cache', JSON.stringify(updatedUser));
            localStorage.setItem('is_admin_cache', 'true');
          }
        } else if (!auth.currentUser) {
          setUser(null);
          setIsAdmin(false);
          localStorage.removeItem('auth_cache');
          localStorage.removeItem('is_admin_cache');
        }
      } catch (e) {
        console.error("Admin Auth Sync Error:", e);
      } finally {
        adminResolved = true;
        finalize();
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      unsubPassenger();
      unsubAdmin();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, setUser, setIsAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
