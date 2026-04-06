import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Administrative API Configuration (Separated for Staff/Admin)
const adminFirebaseConfig = {
    apiKey: import.meta.env.VITE_ADMIN_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_ADMIN_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_ADMIN_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_ADMIN_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_ADMIN_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_ADMIN_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_ADMIN_FIREBASE_MEASUREMENT_ID
};

// Initialize secondary instance
const adminApp = initializeApp(adminFirebaseConfig, "admin-system");

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

export default adminApp;
