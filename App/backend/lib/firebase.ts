// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, User } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

//todo: process.env
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase Auth instance and EXPORT it
export const auth = getAuth(app);

//Sign-in for users


export type FirebaseUser = User
