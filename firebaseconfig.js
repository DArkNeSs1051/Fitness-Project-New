// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCPulh5k-rtB6yUYRsh9hVmLOAJam6H_Nk", 
  authDomain: "fithealthproject-ba957.firebaseapp.com",
  projectId: "fithealthproject-ba957",
  storageBucket: "fithealthproject-ba957.firebasestorage.app",
  messagingSenderId: "763892779791",
  appId: "1:763892779791:web:92b4e9b1e51a3c6e0d8c7a",
  measurementId: "G-1L2B4250V2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);