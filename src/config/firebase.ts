import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDJBryUj7fi-TseV03z-FCKfHZXwQ6PB4M",
  authDomain: "kindred-app-8aa97.firebaseapp.com",
  databaseURL: "https://kindred-app-8aa97-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "kindred-app-8aa97",
  storageBucket: "kindred-app-8aa97.firebasestorage.app",
  messagingSenderId: "1040300198202",
  appId: "1:1040300198202:web:39842ac5d02c51544ae803",
  measurementId: "G-2E3W5HHB2Q"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth with React Native persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // Si l'auth est déjà initialisé, utiliser getAuth
  auth = getAuth(app);
}

export { auth };

// Initialize other services
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
