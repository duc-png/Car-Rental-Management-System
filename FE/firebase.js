// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCqFiDXlQKLDIegsNZC-fO68bKfbBqtUGs",
    authDomain: "online-chat-74464.firebaseapp.com",
    projectId: "online-chat-74464",
    databaseURL: "https://online-chat-74464-default-rtdb.asia-southeast1.firebasedatabase.app",
    storageBucket: "online-chat-74464.firebasestorage.app",
    messagingSenderId: "428209712548",
    appId: "1:428209712548:web:f944f9e587fff76b9ea531",
    measurementId: "G-Z404WGQGHJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const database = getDatabase(app);

export { app, analytics, database };
