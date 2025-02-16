// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyDBnzw9oLjEeQKgntZByvog8PMwQY8x9iI",
  authDomain: "anveshak-fe72b.firebaseapp.com",
  projectId: "anveshak-fe72b",
  storageBucket: "anveshak-fe72b.appspot.com",
  messagingSenderId: "1015148401370",
  appId: "1:1015148401370:android:73db07d66d768824a54be3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };