// src/context/AuthContext.tsx
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { auth, googleProvider } from "../services/Firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser,
} from "firebase/auth";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  hasAccess: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 30 days in milliseconds
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (err) {
        console.error("Firebase persistence error:", err);
      }
      
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          const lastLogin = localStorage.getItem("lastLoginTime");
          const now = Date.now();

          if (lastLogin && now - parseInt(lastLogin, 10) > THIRTY_DAYS_MS) {
            // Token expired based on our custom 30-day rule
            signOut(auth);
            setCurrentUser(null);
            setHasAccess(false);
            localStorage.removeItem("lastLoginTime");
          } else {
            setCurrentUser(user);
            setHasAccess(true);
            if (!lastLogin) {
              localStorage.setItem("lastLoginTime", now.toString());
            }
          }
        } else {
          setCurrentUser(null);
          setHasAccess(false);
          localStorage.removeItem("lastLoginTime");
        }
        setLoading(false);
      });
      return unsubscribe;
    };
    
    // We need to capture the unsubscribe function to clean up, but since setupAuth is async,
    // we handle cleanup differently.
    let unsubscribeFn: () => void;
    setupAuth().then((unsub) => {
      unsubscribeFn = unsub;
    });

    return () => {
      if (unsubscribeFn) unsubscribeFn();
    };
  }, []);

  const updateLoginTime = () => {
    localStorage.setItem("lastLoginTime", Date.now().toString());
  };

  const register = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
    updateLoginTime();
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    updateLoginTime();
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
    updateLoginTime();
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("lastLoginTime");
  };

  if (loading) return null; // or a loading spinner

  return (
    <AuthContext.Provider
      value={{ currentUser, hasAccess, login, register, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}