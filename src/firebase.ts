import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCY8XH-yA5XI-viYhZx1-ibg9XdlKAKo-o",
  authDomain: "zenpath-1c0e2.firebaseapp.com",
  projectId: "zenpath-1c0e2",
  storageBucket: "zenpath-1c0e2.firebasestorage.app",
  messagingSenderId: "729918156811",
  appId: "1:729918156811:web:ed6b7fda48c3121e44970e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;