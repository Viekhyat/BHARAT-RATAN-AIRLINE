import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Administrative API Configuration (Separated for Staff/Admin)
const adminFirebaseConfig = {
    apiKey: "AIzaSyC1n4LNJy90vO-_83u5b2UaaIE_VRgva0A",
    authDomain: "airline-admin.firebaseapp.com",
    projectId: "airline-admin",
    storageBucket: "airline-admin.firebasestorage.app",
    messagingSenderId: "768888585724",
    appId: "1:768888585724:web:b86bd7eef04a4ce112c679",
    measurementId: "G-1SJBPC5G7D"
};

// Initialize secondary instance
const adminApp = initializeApp(adminFirebaseConfig, "admin-system");

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

export default adminApp;
