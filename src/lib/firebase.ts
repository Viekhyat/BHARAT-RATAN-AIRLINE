import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your Firebase configuration
// You can find these values in your Firebase Console -> Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyAqv5XyR3qjGkDoXaTJUEFxFkhiyqH-wLA",
  authDomain: "airline-c5b92.firebaseapp.com",
  projectId: "airline-c5b92",
  storageBucket: "airline-c5b92.firebasestorage.app",
  messagingSenderId: "669821709966",
  appId: "1:669821709966:web:cd57e2113aede34122e3df",
  measurementId: "G-B9N58DL5V7"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export default app;
