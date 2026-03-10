// src/services/Firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvP15awrxJjVPj9TjuRtsgJud3F95BVZU",
  authDomain: "react-4f889.firebaseapp.com",
  projectId: "react-4f889",
  storageBucket: "react-4f889.firebasestorage.app",
  messagingSenderId: "120193257603",
  appId: "1:120193257603:web:47cba460f876cc5c0d0bb6",
  measurementId: "G-GLZW8EDVM8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app); // ✅ Correct way