import * as firebaseApp from "firebase/app";
import { getDatabase } from "firebase/database";
import * as firebaseAnalytics from "firebase/analytics";

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
// Fix: Use initializeApp from the imported namespace to correct the "no exported member" error.
const app = firebaseApp.initializeApp(firebaseConfig);
export const db = getDatabase(app);
// Fix: Use getAnalytics from the imported namespace to correct the "no exported member" error.
export const analytics = firebaseAnalytics.getAnalytics(app);