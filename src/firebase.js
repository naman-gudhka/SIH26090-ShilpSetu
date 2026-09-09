import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBwDBbc0TNyNUcmR3Xm33LrOtGL3n_k1Nc",
  authDomain: "shilpsetu-sih26090.firebaseapp.com",
  projectId: "shilpsetu-sih26090",
  storageBucket: "shilpsetu-sih26090.firebasestorage.app",
  messagingSenderId: "436432657954",
  appId: "1:436432657954:web:3330d2a5bff76426edf47b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);