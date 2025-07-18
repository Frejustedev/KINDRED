import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC6nxBs8cEFMLc98FbuURdx7tYQ3luENsE",
  authDomain: "kindred-568fa.firebaseapp.com",
  projectId: "kindred-568fa",
  storageBucket: "kindred-568fa.firebasestorage.app",
  messagingSenderId: "903071002240",
  appId: "1:903071002240:web:382f23465e5f2a3e550065",
  measurementId: "G-TEJL7FHSQ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app; 