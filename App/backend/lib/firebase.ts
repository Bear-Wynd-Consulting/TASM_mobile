// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, User } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-KFmkBJqL_jFJ6i-bXrR8tUY9yBPhBbQ",
  authDomain: "scholar-chat-4mbxw.firebaseapp.com",
  projectId: "scholar-chat-4mbxw",
  storageBucket: "scholar-chat-4mbxw.firebasestorage.app",
  messagingSenderId: "532399480743",
  appId: "1:532399480743:web:7ca90688c550d490106082"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase Auth instance and EXPORT it
export const auth = getAuth(app);

//Sign-in for users


export type FirebaseUser = User