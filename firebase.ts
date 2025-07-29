// firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getAuth } from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCPulh5k-rtB6yUYRsh9hVmLOAJam6H_Nk",
  authDomain: "fithealthproject-ba957.firebaseapp.com",
  projectId: "fithealthproject-ba957",
  storageBucket: "fithealthproject-ba957.appspot.com",
  messagingSenderId: "763892779791",
  appId: "1:763892779791:web:92b4e9b1e51a3c6e0d8c7a",
  measurementId: "G-1L2B4250V2",
};

// Initialize Firebase app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const FIREBASE_APP = app;
export const FIRESTORE_DB = getFirestore(app);
export const FIREBASE_AUTH = getAuth(app);
export const functions = getFunctions(app);