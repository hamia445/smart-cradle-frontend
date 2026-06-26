import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // 👈 Ye line add ki hai

const firebaseConfig = {
  apiKey: "AIzaSyDDnix83k-8KmQnly5F8ovJJvsd3qQQzEc",
  authDomain: "smartcradle-b4798.firebaseapp.com",
databaseURL: "https://smartcradle-b4798-default-rtdb.firebaseio.com/", 
  projectId: "smartcradle-b4798",
  storageBucket: "smartcradle-b4798.appspot.com",
  messagingSenderId: "583828214934",
  appId: "1:583828214934:web:33bb48eb2d9a79938ddeb7",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app); // 👈 Isay export karna lazmi hai