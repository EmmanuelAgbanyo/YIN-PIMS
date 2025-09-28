import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5Rg36NEaFq5y_Dqeb9LyaLYvZzHkjcw0",
  authDomain: "pims-29fff.firebaseapp.com",
  databaseURL: "https://pims-29fff-default-rtdb.firebaseio.com",
  projectId: "pims-29fff",
  storageBucket: "pims-29fff.firebasestorage.app",
  messagingSenderId: "179549392501",
  appId: "1:179549392501:web:be8cd771b14c2e9cc3f23c",
  measurementId: "G-2YKV4T4460"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const analytics = getAnalytics(app);
