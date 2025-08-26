Développe une application mobile complète appelée "Kindred" - une messagerie ultra-privée conçue exclusivement pour les couples. L'application doit être sécurisée, intime et offrir des fonctionnalités uniques pour renforcer la relation.

## CONFIGURATION FIREBASE EXISTANTE
```typescript
// Configuration Firebase déjà créée - À UTILISER OBLIGATOIREMENT
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

// Services Firebase activés : Authentication (email), Firestore, Storage
```

## STACK TECHNIQUE OBLIGATOIRE
- React Native avec Expo (SDK 51 ou dernière version stable)
- Expo Go pour la visualisation
- Firebase (Authentication, Firestore, Storage)
- TypeScript pour la robustesse du code
- React Navigation 6
- Expo SecureStore pour le stockage sécurisé
- React Native Reanimated 3 pour les animations

## INSTRUCTIONS CRITIQUES POUR ÉVITER LES ERREURS

### 1. SETUP INITIAL - COMMANDES EXACTES
```bash
# Création du projet
npx create-expo-app kindred-app --template blank-typescript
cd kindred-app

# Installation des dépendances - UTILISER EXACTEMENT CES COMMANDES
npx expo install firebase
npx expo install @react-native-async-storage/async-storage
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npx expo install react-native-gesture-handler react-native-reanimated
npx expo install react-native-svg
npx expo install expo-linear-gradient
npx expo install expo-blur
npx expo install expo-secure-store
npx expo install expo-image-picker
npx expo install expo-crypto
npx expo install expo-device
npx expo install expo-notifications
npx expo install expo-file-system
npx expo install expo-media-library
npx expo install expo-av
npx expo install expo-haptics
npx expo install expo-image-manipulator
npx expo install date-fns
npx expo install react-native-uuid
```

### 2. RÈGLES ABSOLUES
- **TOUJOURS** utiliser `npx expo install` au lieu de `npm install`
- **NE JAMAIS** utiliser de packages nécessitant un lien natif non supporté par Expo Go
- **VÉRIFIER** la compatibilité avec Expo SDK avant tout ajout de package
- **UTILISER** les API Expo intégrées (ex: expo-camera, pas react-native-camera)
- **TESTER** sur Expo Go après chaque fonctionnalité majeure

### 3. STRUCTURE COMPLÈTE DU PROJET
```
kindred-app/
├── App.tsx
├── app.json
├── babel.config.js
├── tsconfig.json
├── .gitignore
├── src/
│   ├── config/
│   │   └── firebase.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── user.types.ts
│   │   ├── couple.types.ts
│   │   ├── message.types.ts
│   │   ├── journal.types.ts
│   │   └── navigation.types.ts
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── layout.ts
│   │   ├── config.ts
│   │   └── themes.ts
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   └── linking.ts
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── SplashScreen.tsx
│   │   │   ├── OnboardingScreen.tsx
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignUpScreen.tsx
│   │   │   ├── ForgotPasswordScreen.tsx
│   │   │   ├── EmailVerificationScreen.tsx
│   │   │   ├── CouplingScreen.tsx
│   │   │   └── PinSetupScreen.tsx
│   │   ├── main/
│   │   │   ├── home/
│   │   │   │   └── HomeScreen.tsx
│   │   │   ├── messages/
│   │   │   │   ├── MessagesScreen.tsx
│   │   │   │   ├── ChatScreen.tsx
│   │   │   │   └── TopicSettingsScreen.tsx
│   │   │   ├── calendar/
│   │   │   │   ├── CalendarScreen.tsx
│   │   │   │   └── EventDetailsScreen.tsx
│   │   │   ├── journal/
│   │   │   │   ├── JournalScreen.tsx
│   │   │   │   ├── JournalEntryScreen.tsx
│   │   │   │   └── CreateEntryScreen.tsx
│   │   │   ├── budget/
│   │   │   │   ├── BudgetScreen.tsx
│   │   │   │   ├── AddExpenseScreen.tsx
│   │   │   │   └── BudgetStatsScreen.tsx
│   │   │   ├── vault/
│   │   │   │   ├── VaultScreen.tsx
│   │   │   │   └── VaultPinScreen.tsx
│   │   │   └── capsules/
│   │   │       ├── CapsulesScreen.tsx
│   │   │       └── CreateCapsuleScreen.tsx
│   │   └── settings/
│   │       ├── SettingsScreen.tsx
│   │       ├── ProfileScreen.tsx
│   │       ├── SecurityScreen.tsx
│   │       └── AboutScreen.tsx
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── chat/
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── TopicSelector.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   ├── MessageReactions.tsx
│   │   │   └── VoiceRecorder.tsx
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx
│   │   │   ├── EventCard.tsx
│   │   │   └── DatePicker.tsx
│   │   ├── journal/
│   │   │   ├── JournalCard.tsx
│   │   │   ├── PhotoGrid.tsx
│   │   │   └── MoodSelector.tsx
│   │   └── animations/
│   │       ├── HeartAnimation.tsx
│   │       ├── ConfettiAnimation.tsx
│   │       └── LoadingAnimation.tsx
│   ├── services/
│   │   ├── firebase/
│   │   │   ├── auth.service.ts
│   │   │   ├── firestore.service.ts
│   │   │   ├── storage.service.ts
│   │   │   ├── realtime.service.ts
│   │   │   └── functions.service.ts
│   │   ├── encryption/
│   │   │   ├── crypto.service.ts
│   │   │   └── keychain.service.ts
│   │   ├── notifications/
│   │   │   └── notification.service.ts
│   │   └── media/
│   │       ├── image.service.ts
│   │       └── audio.service.ts
│   ├── store/
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── CoupleContext.tsx
│   │   │   ├── ThemeContext.tsx
│   │   │   └── NotificationContext.tsx
│   │   └── reducers/
│   │       └── app.reducer.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCouple.ts
│   │   ├── useMessages.ts
│   │   ├── useEncryption.ts
│   │   ├── useFirestore.ts
│   │   └── useNotifications.ts
│   └── utils/
│       ├── validators.ts
│       ├── formatters.ts
│       ├── helpers.ts
│       ├── constants.ts
│       └── errors.ts
└── assets/
    ├── images/
    │   ├── logo.png
    │   ├── onboarding/
    │   └── icons/
    ├── animations/
    │   └── lottie/
    └── sounds/
        └── notifications/
```

## FICHIERS DE CONFIGURATION ESSENTIELS

### app.json
```json
{
  "expo": {
    "name": "Kindred",
    "slug": "kindred-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#EC4899"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.kindred.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Kindred a besoin d'accéder à votre caméra pour partager des photos avec votre partenaire.",
        "NSPhotoLibraryUsageDescription": "Kindred a besoin d'accéder à vos photos pour créer des souvenirs ensemble.",
        "NSMicrophoneUsageDescription": "Kindred a besoin du microphone pour enregistrer des messages vocaux."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#EC4899"
      },
      "package": "com.kindred.app",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "RECORD_AUDIO",
        "NOTIFICATIONS"
      ]
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#EC4899",
          "sounds": ["./assets/sounds/notifications/"]
        }
      ],
      "expo-image-picker",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ]
  }
}
```

### tsconfig.json
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@screens/*": ["src/screens/*"],
      "@services/*": ["src/services/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],
      "@constants/*": ["src/constants/*"],
      "@assets/*": ["assets/*"]
    }
  }
}
```

### babel.config.js
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@types': './src/types',
            '@constants': './src/constants',
            '@assets': './assets'
          }
        }
      ]
    ]
  };
};
```

## IMPLÉMENTATION DÉTAILLÉE

### 1. Configuration Firebase (src/config/firebase.ts)
```typescript
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence 
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDJBryUj7fi-TseV03z-FCKfHZXwQ6PB4M",
  authDomain: "kindred-app-8aa97.firebaseapp.com",
  databaseURL: "https://kindred-app-8aa97-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "kindred-app-8aa97",
  storageBucket: "kindred-app-8aa97.firebasestorage.app",
  messagingSenderId: "1040300198202",
  appId: "1:1040300198202:web:39842ac5d02c51544ae803"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize other services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);
export const functions = getFunctions(app, 'europe-west1');

// Connect to emulators in development
if (__DEV__) {
  // Uncomment to use emulators
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectStorageEmulator(storage, 'localhost', 9199);
  // connectDatabaseEmulator(realtimeDb, 'localhost', 9000);
  // connectFunctionsEmulator(functions, 'localhost', 5001);
}

export default app;
```

### 2. Types (src/types/index.ts)
```typescript
import { Timestamp } from 'firebase/firestore';

// User types
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  photoURL?: string;
  createdAt: string;
  isEmailVerified: boolean;
  coupledWith: string | null;
  lastSeen?: Timestamp;
  settings?: UserSettings;
}

export interface UserSettings {
  notifications: NotificationSettings;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export interface NotificationSettings {
  messages: boolean;
  calendar: boolean;
  capsules: boolean;
  dailyReminder: boolean;
  reminderTime?: string;
}

// Couple types
export interface Couple {
  id: string;
  users: string[];
  pin: string; // Hashed
  startDate: Timestamp;
  createdAt: Timestamp;
  topics: string[];
  settings?: CoupleSettings;
  stats?: CoupleStats;
}

export interface CoupleSettings {
  vaultAutoDelete: number; // hours
  currencySymbol: string;
  timezone: string;
}

export interface CoupleStats {
  messageCount: number;
  daysTogether: number;
  currentStreak: number;
  longestStreak: number;
  lastInteraction: Timestamp;
}

// Message types
export interface Message {
  id: string;
  content: string;
  senderId: string;
  topic: string;
  timestamp: Timestamp;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  mediaUrl?: string;
  read: boolean;
  reactions?: MessageReaction[];
  replyTo?: string;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  timestamp: Timestamp;
}

// Journal types
export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  authorId: string;
  date: Timestamp;
  media: string[];
  mood?: string;
  tags?: string[];
  location?: Location;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

// Calendar types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Timestamp;
  endDate?: Timestamp;
  allDay: boolean;
  location?: string;
  reminder?: ReminderType[];
  recurring?: RecurringType;
  createdBy: string;
  createdAt: Timestamp;
}

export type ReminderType = '15min' | '30min' | '1hour' | '1day' | '1week';
export type RecurringType = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Budget types
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Timestamp;
  paidBy: string;
  splitType: 'equal' | 'custom';
  splitDetails?: SplitDetail[];
  receipt?: string;
  createdAt: Timestamp;
}

export interface SplitDetail {
  userId: string;
  amount: number;
}

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget?: number;
}

// Vault types
export interface VaultItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  uploadedBy: string;
  uploadedAt: Timestamp;
  expiresAt: Timestamp;
}

// Capsule types
export interface TimeCapsule {
  id: string;
  message: string;
  media?: string[];
  createdBy: string;
  createdAt: Timestamp;
  openDate: Timestamp;
  isOpen: boolean;
  openedAt?: Timestamp;
}
```

### 3. Palette de couleurs (src/constants/colors.ts)
```typescript
export const colors = {
  // Primary colors
  primary: '#EC4899',      // Pink-500
  primaryDark: '#DB2777',  // Pink-600
  primaryLight: '#F9A8D4', // Pink-300
  
  // Secondary colors
  secondary: '#A855F7',    // Purple-500
  secondaryDark: '#9333EA', // Purple-600
  secondaryLight: '#C084FC', // Purple-400
  
  // Accent colors
  accent: '#F472B6',       // Pink-400
  
  // Base colors
  background: '#FAFAFA',   // Gray-50
  surface: '#FFFFFF',
  surfaceVariant: '#F3F4F6', // Gray-100
  
  // Text colors
  text: '#1F2937',         // Gray-800
  textSecondary: '#6B7280', // Gray-500
  textLight: '#9CA3AF',     // Gray-400
  textOnPrimary: '#FFFFFF',
  
  // Semantic colors
  error: '#EF4444',        // Red-500
  errorLight: '#FCA5A5',   // Red-300
  success: '#10B981',      // Emerald-500
  successLight: '#6EE7B7', // Emerald-300
  warning: '#F59E0B',      // Amber-500
  warningLight: '#FCD34D', // Amber-300
  info: '#3B82F6',         // Blue-500
  infoLight: '#93C5FD',    // Blue-300
  
  // Gradients
  gradient: ['#EC4899', '#A855F7'],
  gradientDark: ['#DB2777', '#9333EA'],
  
  // Shadows
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  // Special
  overlay: 'rgba(0, 0, 0, 0.5)',
  divider: '#E5E7EB',      // Gray-200
  disabled: '#D1D5DB',     // Gray-300
};

// Theme variations
export const lightTheme = {
  ...colors,
};

export const darkTheme = {
  ...colors,
  background: '#111827',    // Gray-900
  surface: '#1F2937',       // Gray-800
  surfaceVariant: '#374151', // Gray-700
  text: '#F9FAFB',          // Gray-50
  textSecondary: '#D1D5DB', // Gray-300
  textLight: '#9CA3AF',     // Gray-400
  divider: '#374151',       // Gray-700
};
```

### 4. Service d'authentification (src/services/firebase/auth.service.ts)
```typescript
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { UserProfile } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AuthService {
  // Clés AsyncStorage
  private static readonly STORAGE_KEYS = {
    USER_PROFILE: '@kindred/user_profile',
    COUPLE_ID: '@kindred/couple_id',
    PIN_HASH: '@kindred/pin_hash',
  };

  // Inscription
  static async signUp(
    email: string, 
    password: string, 
    firstName: string
  ): Promise<User> {
    try {
      // Créer le compte
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        email, 
        password
      );
      const user = userCredential.user;

      // Mettre à jour le profil
      await updateProfile(user, {
        displayName: firstName,
      });

      // Créer le document utilisateur dans Firestore
      const userProfile: Partial<UserProfile> = {
        email,
        firstName,
        createdAt: new Date().toISOString(),
        isEmailVerified: false,
        coupledWith: null,
        settings: {
          notifications: {
            messages: true,
            calendar: true,
            capsules: true,
            dailyReminder: false,
          },
          theme: 'auto',
          language: 'fr',
        },
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      // Envoyer l'email de vérification
      await sendEmailVerification(user, {
        url: 'https://kindred-app-8aa97.firebaseapp.com/verify',
        handleCodeInApp: false,
      });

      // Sauvegarder en local
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.USER_PROFILE,
        JSON.stringify({ id: user.uid, ...userProfile })
      );

      return user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Connexion
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        email, 
        password
      );
      
      // Récupérer et sauvegarder le profil
      const profile = await this.getUserProfile(userCredential.user.uid);
      if (profile) {
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.USER_PROFILE,
          JSON.stringify(profile)
        );
        
        if (profile.coupledWith) {
          await AsyncStorage.setItem(
            this.STORAGE_KEYS.COUPLE_ID,
            profile.coupledWith
          );
        }
      }

      // Mettre à jour lastSeen
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        lastSeen: serverTimestamp(),
      });

      return userCredential.user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Déconnexion
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
      // Nettoyer le stockage local
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.USER_PROFILE,
        this.STORAGE_KEYS.COUPLE_ID,
        this.STORAGE_KEYS.PIN_HASH,
      ]);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Réinitialisation du mot de passe
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: 'https://kindred-app-8aa97.firebaseapp.com/login',
        handleCodeInApp: false,
      });
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Observer l'état d'authentification
  static onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Récupérer le profil utilisateur
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docSnap = await getDoc(doc(db, 'users', userId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Vérifier si l'email est vérifié
  static async checkEmailVerification(): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    await user.reload();
    
    if (user.emailVerified) {
      // Mettre à jour dans Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        isEmailVerified: true,
      });
      return true;
    }
    
    return false;
  }

  // Renvoyer l'email de vérification
  static async resendVerificationEmail(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    await sendEmailVerification(user, {
      url: 'https://kindred-app-8aa97.firebaseapp.com/verify',
      handleCodeInApp: false,
    });
  }

  // Changer le mot de passe
  static async changePassword(
    currentPassword: string, 
    newPassword: string
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('Utilisateur non connecté');

    // Ré-authentifier l'utilisateur
    const credential = EmailAuthProvider.credential(
      user.email, 
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);

    // Changer le mot de passe
    await updatePassword(user, newPassword);
  }

  // Récupérer le profil local
  static async getLocalProfile(): Promise<UserProfile | null> {
    try {
      const profileStr = await AsyncStorage.getItem(
        this.STORAGE_KEYS.USER_PROFILE
      );
      return profileStr ? JSON.parse(profileStr) : null;
    } catch (error) {
      return null;
    }
  }

  // Récupérer l'ID du couple local
  static async getLocalCoupleId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.STORAGE_KEYS.COUPLE_ID);
    } catch (error) {
      return null;
    }
  }

  // Gestion des erreurs
  private static handleAuthError(error: any): Error {
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'Cette adresse email est déjà utilisée',
      'auth/invalid-email': 'Adresse email invalide',
      'auth/operation-not-allowed': 'Opération non autorisée',
      'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères',
      'auth/user-disabled': 'Ce compte a été désactivé',
      'auth/user-not-found': 'Aucun compte trouvé avec cette adresse email',
      'auth/wrong-password': 'Mot de passe incorrect',
      'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard',
      'auth/network-request-failed': 'Erreur de connexion. Vérifiez votre connexion internet',
    };

    const message = errorMessages[error.code] || 'Une erreur est survenue';
    return new Error(message);
  }
}
```

### 5. Service Firestore (src/services/firebase/firestore.service.ts)
```typescript
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
  Message, 
  Couple, 
  JournalEntry, 
  CalendarEvent, 
  Transaction,
  TimeCapsule,
  UserProfile 
} from '../../types';
import { EncryptionService } from '../encryption/crypto.service';

export class FirestoreService {
  // === COUPLE MANAGEMENT ===
  
  // Créer un couple
  static async createCouple(
    userId1: string, 
    userId2: string, 
    pin: string
  ): Promise<string> {
    try {
      // Hasher le PIN
      const hashedPin = await EncryptionService.hashPin(pin);
      
      const coupleData: Partial<Couple> = {
        users: [userId1, userId2],
        pin: hashedPin,
        startDate: serverTimestamp() as Timestamp,
        createdAt: serverTimestamp() as Timestamp,
        topics: ['général', 'voyage', 'budget', 'surprises'],
        settings: {
          vaultAutoDelete: 24,
          currencySymbol: '€',
          timezone: 'Europe/Paris',
        },
        stats: {
          messageCount: 0,
          daysTogether: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastInteraction: serverTimestamp() as Timestamp,
        },
      };

      const coupleRef = await addDoc(collection(db, 'couples'), coupleData);
      
      // Mettre à jour les profils utilisateurs
      await Promise.all([
        updateDoc(doc(db, 'users', userId1), { coupledWith: coupleRef.id }),
        updateDoc(doc(db, 'users', userId2), { coupledWith: coupleRef.id })
      ]);

      return coupleRef.id;
    } catch (error) {
      console.error('Error creating couple:', error);
      throw new Error('Impossible de créer le couple');
    }
  }

  // Rejoindre un couple existant
  static async joinCouple(
    userId: string, 
    inviteCode: string, 
    pin: string
  ): Promise<string> {
    try {
      // Chercher le couple par code d'invitation
      const q = query(
        collection(db, 'invites'), 
        where('code', '==', inviteCode),
        where('used', '==', false),
        where('expiresAt', '>', new Date())
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        throw new Error('Code d\'invitation invalide ou expiré');
      }

      const invite = snapshot.docs[0];
      const inviteData = invite.data();
      const coupleId = inviteData.coupleId;

      // Vérifier le PIN
      const couple = await this.getCouple(coupleId);
      const isValidPin = await EncryptionService.verifyPin(pin, couple.pin);
      if (!isValidPin) {
        throw new Error('Code PIN incorrect');
      }

      // Ajouter l'utilisateur au couple
      await updateDoc(doc(db, 'couples', coupleId), {
        users: [...couple.users, userId]
      });

      // Mettre à jour le profil utilisateur
      await updateDoc(doc(db, 'users', userId), { 
        coupledWith: coupleId 
      });

      // Marquer l'invitation comme utilisée
      await updateDoc(doc(db, 'invites', invite.id), { 
        used: true,
        usedBy: userId,
        usedAt: serverTimestamp()
      });

      return coupleId;
    } catch (error: any) {
      console.error('Error joining couple:', error);
      throw new Error(error.message || 'Impossible de rejoindre le couple');
    }
  }

  // Récupérer les infos du couple
  static async getCouple(coupleId: string): Promise<Couple> {
    const docSnap = await getDoc(doc(db, 'couples', coupleId));
    if (!docSnap.exists()) {
      throw new Error('Couple non trouvé');
    }
    return { id: docSnap.id, ...docSnap.data() } as Couple;
  }

  // === MESSAGES ===

  // Envoyer un message
  static async sendMessage(
    coupleId: string,
    senderId: string,
    content: string,
    topic: string = 'général',
    type: Message['type'] = 'text',
    mediaUrl?: string,
    replyTo?: string
  ): Promise<string> {
    try {
      // Chiffrer le contenu si c'est du texte
      const encryptedContent = type === 'text' 
        ? await EncryptionService.encryptMessage(content)
        : content;

      const messageData: Partial<Message> = {
        content: encryptedContent,
        senderId,
        topic,
        timestamp: serverTimestamp() as Timestamp,
        type,
        mediaUrl,
        read: false,
        reactions: [],
        replyTo
      };

      const messageRef = await addDoc(
        collection(db, 'couples', coupleId, 'messages'),
        messageData
      );

      // Mettre à jour les stats
      await this.updateCoupleStats(coupleId, 'message');

      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Impossible d\'envoyer le message');
    }
  }

  // Écouter les messages en temps réel
  static subscribeToMessages(
    coupleId: string,
    topic: string | null,
    callback: (messages: Message[]) => void,
    limitCount: number = 50
  ): Unsubscribe {
    let q;
    
    if (topic) {
      q = query(
        collection(db, 'couples', coupleId, 'messages'),
        where('topic', '==', topic),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, 'couples', coupleId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    }

    return onSnapshot(q, async (snapshot) => {
      const messages = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          // Déchiffrer le contenu si c'est du texte
          if (data.type === 'text') {
            data.content = await EncryptionService.decryptMessage(data.content);
          }
          return { id: doc.id, ...data } as Message;
        })
      );
      
      callback(messages.reverse());
    });
  }

  // Marquer comme lu
  static async markAsRead(
    coupleId: string, 
    messageId: string
  ): Promise<void> {
    await updateDoc(
      doc(db, 'couples', coupleId, 'messages', messageId),
      { read: true }
    );
  }

  // Ajouter une réaction
  static async addReaction(
    coupleId: string,
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    const messageRef = doc(db, 'couples', coupleId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) return;
    
    const reactions = messageDoc.data().reactions || [];
    const existingReaction = reactions.find(
      (r: any) => r.userId === userId
    );
    
    if (existingReaction) {
      // Remplacer la réaction existante
      existingReaction.emoji = emoji;
      existingReaction.timestamp = serverTimestamp();
    } else {
      // Ajouter une nouvelle réaction
      reactions.push({
        userId,
        emoji,
        timestamp: serverTimestamp()
      });
    }
    
    await updateDoc(messageRef, { reactions });
  }

  // === JOURNAL ===

  // Ajouter une entrée au journal
  static async addJournalEntry(
    coupleId: string,
    title: string,
    content: string,
    authorId: string,
    media: string[] = [],
    mood?: string,
    tags?: string[]
  ): Promise<string> {
    try {
      const entryData: Partial<JournalEntry> = {
        title,
        content,
        authorId,
        media,
        mood,
        tags,
        date: serverTimestamp() as Timestamp,
        createdAt: serverTimestamp() as Timestamp
      };

      const entryRef = await addDoc(
        collection(db, 'couples', coupleId, 'journal'),
        entryData
      );

      return entryRef.id;
    } catch (error) {
      console.error('Error adding journal entry:', error);
      throw new Error('Impossible d\'ajouter l\'entrée au journal');
    }
  }

  // Récupérer les entrées du journal
  static async getJournalEntries(
    coupleId: string,
    limitCount: number = 20,
    startAfterDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{ entries: JournalEntry[], lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
    let q = query(
      collection(db, 'couples', coupleId, 'journal'),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    if (startAfterDoc) {
      q = query(
        collection(db, 'couples', coupleId, 'journal'),
        orderBy('date', 'desc'),
        startAfter(startAfterDoc),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as JournalEntry));

    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

    return { entries, lastDoc };
  }

  // === CALENDRIER ===

  // Créer un événement
  static async createEvent(
    coupleId: string,
    event: Omit<CalendarEvent, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const eventData = {
        ...event,
        createdAt: serverTimestamp()
      };

      const eventRef = await addDoc(
        collection(db, 'couples', coupleId, 'events'),
        eventData
      );

      // Programmer les rappels si nécessaire
      if (event.reminder && event.reminder.length > 0) {
        // TODO: Implémenter avec Cloud Functions
      }

      return eventRef.id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Impossible de créer l\'événement');
    }
  }

  // Récupérer les événements d'un mois
  static async getMonthEvents(
    coupleId: string,
    year: number,
    month: number
  ): Promise<CalendarEvent[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const q = query(
      collection(db, 'couples', coupleId, 'events'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CalendarEvent));
  }

  // === BUDGET ===

  // Ajouter une transaction
  static async addTransaction(
    coupleId: string,
    transaction: Omit<Transaction, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const transactionData = {
        ...transaction,
        createdAt: serverTimestamp()
      };

      const transactionRef = await addDoc(
        collection(db, 'couples', coupleId, 'transactions'),
        transactionData
      );

      return transactionRef.id;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw new Error('Impossible d\'ajouter la transaction');
    }
  }

  // Récupérer les transactions d'un mois
  static async getMonthTransactions(
    coupleId: string,
    year: number,
    month: number
  ): Promise<Transaction[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const q = query(
      collection(db, 'couples', coupleId, 'transactions'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Transaction));
  }

  // === CAPSULES TEMPORELLES ===

  // Créer une capsule
  static async createCapsule(
    coupleId: string,
    message: string,
    openDate: Date,
    createdBy: string,
    media?: string[]
  ): Promise<string> {
    try {
      const capsuleData: Partial<TimeCapsule> = {
        message: await EncryptionService.encryptMessage(message),
        media,
        createdBy,
        createdAt: serverTimestamp() as Timestamp,
        openDate: Timestamp.fromDate(openDate),
        isOpen: false
      };

      const capsuleRef = await addDoc(
        collection(db, 'couples', coupleId, 'capsules'),
        capsuleData
      );

      // Programmer l'ouverture avec Cloud Functions
      // TODO: Implémenter Cloud Function

      return capsuleRef.id;
    } catch (error) {
      console.error('Error creating capsule:', error);
      throw new Error('Impossible de créer la capsule');
    }
  }

  // Récupérer les capsules
  static async getCapsules(
    coupleId: string,
    includeOpen: boolean = true
  ): Promise<TimeCapsule[]> {
    let q;
    
    if (includeOpen) {
      q = query(
        collection(db, 'couples', coupleId, 'capsules'),
        orderBy('openDate', 'asc')
      );
    } else {
      q = query(
        collection(db, 'couples', coupleId, 'capsules'),
        where('isOpen', '==', false),
        orderBy('openDate', 'asc')
      );
    }

    const snapshot = await getDocs(q);
    const capsules = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        if (data.isOpen && data.message) {
          data.message = await EncryptionService.decryptMessage(data.message);
        }
        return { id: doc.id, ...data } as TimeCapsule;
      })
    );

    return capsules;
  }

  // Ouvrir une capsule
  static async openCapsule(
    coupleId: string,
    capsuleId: string
  ): Promise<void> {
    const now = new Date();
    const capsuleRef = doc(db, 'couples', coupleId, 'capsules', capsuleId);
    const capsuleDoc = await getDoc(capsuleRef);
    
    if (!capsuleDoc.exists()) return;
    
    const capsule = capsuleDoc.data();
    const openDate = capsule.openDate.toDate();
    
    if (now >= openDate && !capsule.isOpen) {
      await updateDoc(capsuleRef, {
        isOpen: true,
        openedAt: serverTimestamp()
      });
    }
  }

  // === UTILITAIRES ===

  // Mettre à jour les statistiques du couple
  private static async updateCoupleStats(
    coupleId: string,
    action: 'message' | 'interaction'
  ): Promise<void> {
    try {
      const coupleRef = doc(db, 'couples', coupleId);
      const coupleDoc = await getDoc(coupleRef);
      
      if (!coupleDoc.exists()) return;
      
      const stats = coupleDoc.data().stats || {};
      const lastInteraction = stats.lastInteraction?.toDate() || new Date(0);
      const now = new Date();
      
      // Calculer le streak
      const hoursSinceLastInteraction = 
        (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60);
      
      let currentStreak = stats.currentStreak || 0;
      if (hoursSinceLastInteraction < 48) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      
      const updates: any = {
        'stats.lastInteraction': serverTimestamp(),
        'stats.currentStreak': currentStreak,
        'stats.longestStreak': Math.max(
          currentStreak, 
          stats.longestStreak || 0
        )
      };
      
      if (action === 'message') {
        updates['stats.messageCount'] = (stats.messageCount || 0) + 1;
      }
      
      await updateDoc(coupleRef, updates);
    } catch (error) {
      console.error('Error updating couple stats:', error);
    }
  }

  // Générer un code d'invitation
  static async generateInviteCode(coupleId: string): Promise<string> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await addDoc(collection(db, 'invites'), {
      code,
      coupleId,
      used: false,
      createdAt: serverTimestamp(),
      expiresAt
    });

    return code;
  }
}
```

### 6. Service de chiffrement (src/services/encryption/crypto.service.ts)
```typescript
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

export class EncryptionService {
  private static readonly ENCRYPTION_KEY = 'kindred_encryption_key';
  private static readonly SALT = 'kindred_salt_2025';

  // Générer une clé de chiffrement pour le couple
  static async generateCoupleKey(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return btoa(String.fromCharCode(...new Uint8Array(randomBytes)));
  }

  // Sauvegarder la clé de chiffrement
  static async saveCoupleKey(coupleId: string, key: string): Promise<void> {
    await SecureStore.setItemAsync(`${this.ENCRYPTION_KEY}_${coupleId}`, key);
  }

  // Récupérer la clé de chiffrement
  static async getCoupleKey(coupleId: string): Promise<string | null> {
    return await SecureStore.getItemAsync(`${this.ENCRYPTION_KEY}_${coupleId}`);
  }

  // Chiffrer un message
  static async encryptMessage(message: string): Promise<string> {
    try {
      // Pour la démo, on retourne le message tel quel
      // En production, utiliser une vraie méthode de chiffrement
      return btoa(unescape(encodeURIComponent(message)));
    } catch (error) {
      console.error('Encryption error:', error);
      return message;
    }
  }

  // Déchiffrer un message
  static async decryptMessage(encryptedMessage: string): Promise<string> {
    try {
      // Pour la démo, on retourne le message décodé
      // En production, utiliser une vraie méthode de déchiffrement
      return decodeURIComponent(escape(atob(encryptedMessage)));
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedMessage;
    }
  }

  // Hasher un PIN
  static async hashPin(pin: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pin + this.SALT,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    return digest;
  }

  // Vérifier un PIN
  static async verifyPin(pin: string, hashedPin: string): Promise<boolean> {
    const pinHash = await this.hashPin(pin);
    return pinHash === hashedPin;
  }

  // Sauvegarder le PIN localement (hashé)
  static async saveLocalPin(pin: string): Promise<void> {
    const hashedPin = await this.hashPin(pin);
    await SecureStore.setItemAsync('kindred_local_pin', hashedPin);
  }

  // Vérifier le PIN local
  static async verifyLocalPin(pin: string): Promise<boolean> {
    try {
      const savedHashedPin = await SecureStore.getItemAsync('kindred_local_pin');
      if (!savedHashedPin) return false;
      
      const inputHashedPin = await this.hashPin(pin);
      return inputHashedPin === savedHashedPin;
    } catch (error) {
      return false;
    }
  }

  // Chiffrer un fichier (pour le coffre sensible)
  static async encryptFile(fileUri: string): Promise<string> {
    // Pour la démo, on retourne l'URI tel quel
    // En production, implémenter le chiffrement de fichier
    return fileUri;
  }

  // Déchiffrer un fichier
  static async decryptFile(encryptedUri: string): Promise<string> {
    // Pour la démo, on retourne l'URI tel quel
    // En production, implémenter le déchiffrement de fichier
    return encryptedUri;
  }
}
```

### 7. Service de stockage (src/services/firebase/storage.service.ts)
```typescript
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  UploadTaskSnapshot
} from 'firebase/storage';
import { storage } from '../../config/firebase';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

export class StorageService {
  // Upload d'image avec compression et progression
  static async uploadImage(
    uri: string,
    path: string,
    options?: {
      maxWidth?: number;
      quality?: number;
      onProgress?: (progress: number) => void;
    }
  ): Promise<string> {
    try {
      const { maxWidth = 1080, quality = 0.8, onProgress } = options || {};

      // Compresser l'image
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: maxWidth } }],
        { 
          compress: quality, 
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );

      // Convertir en blob
      const response = await fetch(manipResult.uri);
      const blob = await response.blob();

      // Créer la référence
      const storageRef = ref(storage, path);

      // Upload avec progression
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(new Error('Erreur lors de l\'upload'));
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Impossible d\'uploader l\'image');
    }
  }

  // Upload vidéo
  static async uploadVideo(
    uri: string,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Sur iOS, nous devons copier le fichier d'abord
      let videoUri = uri;
      if (Platform.OS === 'ios') {
        const fileName = uri.split('/').pop();
        const newPath = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.copyAsync({
          from: uri,
          to: newPath
        });
        videoUri = newPath;
      }

      // Lire le fichier
      const response = await fetch(videoUri);
      const blob = await response.blob();

      // Upload
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(progress);
          },
          (error) => {
            console.error('Upload video error:', error);
            reject(new Error('Erreur lors de l\'upload de la vidéo'));
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Nettoyer le fichier temporaire sur iOS
            if (Platform.OS === 'ios' && videoUri !== uri) {
              await FileSystem.deleteAsync(videoUri, { idempotent: true });
            }
            
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      throw new Error('Impossible d\'uploader la vidéo');
    }
  }

  // Upload audio
  static async uploadAudio(
    uri: string,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(progress);
          },
          (error) => {
            console.error('Upload audio error:', error);
            reject(new Error('Erreur lors de l\'upload audio'));
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw new Error('Impossible d\'uploader l\'audio');
    }
  }

  // Upload pour le coffre sensible avec TTL
  static async uploadSensitiveMedia(
    uri: string,
    coupleId: string,
    userId: string,
    type: 'image' | 'video' = 'image'
  ): Promise<{ url: string; deleteAt: Date; path: string }> {
    try {
      const timestamp = Date.now();
      const extension = type === 'image' ? 'jpg' : 'mp4';
      const path = `vault/${coupleId}/${userId}/${timestamp}.${extension}`;

      let url: string;
      if (type === 'image') {
        url = await this.uploadImage(uri, path, {
          maxWidth: 800,
          quality: 0.7
        });
      } else {
        url = await this.uploadVideo(uri, path);
      }

      // Calculer la date de suppression (24h)
      const deleteAt = new Date(timestamp + 24 * 60 * 60 * 1000);

      return { url, deleteAt, path };
    } catch (error) {
      console.error('Error uploading sensitive media:', error);
      throw new Error('Impossible d\'uploader le média');
    }
  }

  // Supprimer un fichier
  static async deleteFile(path: string): Promise<void> {
    try {
      const fileRef = ref(storage, path);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Ne pas throw si le fichier n'existe pas
    }
  }

  // Obtenir l'URL de téléchargement
  static async getDownloadURL(path: string): Promise<string> {
    try {
      const fileRef = ref(storage, path);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw new Error('Impossible de récupérer l\'URL');
    }
  }

  // Générer un chemin unique
  static generatePath(
    type: 'message' | 'journal' | 'vault' | 'avatar' | 'budget',
    coupleId: string,
    userId: string,
    extension: string
  ): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${type}/${coupleId}/${userId}/${timestamp}_${random}.${extension}`;
  }
}
```

### 8. Hook useAuth (src/hooks/useAuth.ts)
```typescript
import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { AuthService } from '../services/firebase/auth.service';
import { UserProfile } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isEmailVerified: boolean;
  signUp: (email: string, password: string, firstName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        setIsEmailVerified(firebaseUser.emailVerified);
        
        // Charger le profil
        const userProfile = await AuthService.getUserProfile(firebaseUser.uid);
        setProfile(userProfile);
        
        // Sauvegarder localement
        if (userProfile) {
          await AsyncStorage.setItem(
            '@kindred/user_profile',
            JSON.stringify(userProfile)
          );
        }
      } else {
        setProfile(null);
        setIsEmailVerified(false);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, firstName: string) => {
    try {
      await AuthService.signUp(email, password, firstName);
    } catch (error) {
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await AuthService.signIn(email, password);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AuthService.signOut();
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await AuthService.resetPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const checkEmailVerification = async () => {
    const verified = await AuthService.checkEmailVerification();
    setIsEmailVerified(verified);
    return verified;
  };

  const resendVerificationEmail = async () => {
    await AuthService.resendVerificationEmail();
  };

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await AuthService.getUserProfile(user.uid);
      setProfile(userProfile);
    }
  };

  const value = {
    user,
    profile,
    isLoading,
    isEmailVerified,
    signUp,
    signIn,
    signOut,
    resetPassword,
    checkEmailVerification,
    resendVerificationEmail,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 9. App.tsx principal
```typescript
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';

import { AuthProvider } from './src/hooks/useAuth';
import { ThemeProvider } from './src/store/contexts/ThemeContext';
import { CoupleProvider } from './src/store/contexts/CoupleContext';
import { NotificationProvider } from './src/store/contexts/NotificationContext';
import RootNavigator from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Garder le splash screen visible
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    // Cacher le splash screen après le chargement
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };
    
    setTimeout(hideSplash, 2000);
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <ThemeProvider>
              <CoupleProvider>
                <NotificationProvider>
                  <NavigationContainer>
                    <RootNavigator />
                    <StatusBar style="auto" />
                  </NavigationContainer>
                </NotificationProvider>
              </CoupleProvider>
            </ThemeProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
```

## SÉCURITÉ FIRESTORE RULES

### firestore.rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Fonction helper : vérifier si l'utilisateur fait partie du couple
    function isInCouple(coupleId) {
      return request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/couples/$(coupleId)).data.users;
    }
    
    // Fonction helper : vérifier si c'est le propriétaire
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    // Utilisateurs
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if false; // Jamais supprimer un utilisateur
    }
    
    // Couples
    match /couples/{coupleId} {
      allow read: if isInCouple(coupleId);
      allow create: if request.auth != null;
      allow update: if isInCouple(coupleId);
      allow delete: if false; // Jamais supprimer un couple
      
      // Messages
      match /messages/{messageId} {
        allow read: if isInCouple(coupleId);
        allow create: if isInCouple(coupleId) && 
          request.resource.data.senderId == request.auth.uid;
        allow update: if isInCouple(coupleId) && 
          resource.data.senderId == request.auth.uid;
        allow delete: if false; // Jamais supprimer de messages
      }
      
      // Journal
      match /journal/{entryId} {
        allow read: if isInCouple(coupleId);
        allow create: if isInCouple(coupleId);
        allow update: if isInCouple(coupleId) && 
          resource.data.authorId == request.auth.uid;
        allow delete: if false; // Pas de suppression
      }
      
      // Événements calendrier
      match /events/{eventId} {
        allow read: if isInCouple(coupleId);
        allow create: if isInCouple(coupleId);
        allow update: if isInCouple(coupleId);
        allow delete: if isInCouple(coupleId) && 
          resource.data.createdBy == request.auth.uid;
      }
      
      // Transactions budget
      match /transactions/{transactionId} {
        allow read: if isInCouple(coupleId);
        allow create: if isInCouple(coupleId);
        allow update: if isInCouple(coupleId);
        allow delete: if false; // Pas de suppression pour l'historique
      }
      
      // Capsules temporelles
      match /capsules/{capsuleId} {
        allow read: if isInCouple(coupleId);
        allow create: if isInCouple(coupleId);
        allow update: if isInCouple(coupleId) && 
          resource.data.isOpen == false; // Pas de modification après ouverture
        allow delete: if false; // Jamais supprimer
      }
      
      // Coffre sensible
      match /vault/{itemId} {
        allow read: if isInCouple(coupleId);
        allow create: if isInCouple(coupleId);
        allow update: if false; // Pas de modification
        allow delete: if isInCouple(coupleId); // Suppression automatique après 24h
      }
    }
    
    // Invitations
    match /invites/{inviteId} {
      allow read: if true; // Public pour vérifier le code
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        resource.data.used == false;
      allow delete: if false;
    }
  }
}
```

## INSTRUCTIONS FINALES

### Ordre de développement recommandé :

**Jour 1 : Base et authentification**
1. Initialiser le projet avec les dépendances
2. Configurer Firebase
3. Implémenter l'authentification complète
4. Créer les écrans de connexion/inscription

**Jour 2 : Jumelage et structure**
1. Système de jumelage des couples
2. Configuration du PIN commun
3. Navigation principale
4. Contexts et hooks

**Jour 3 : Messagerie**
1. Interface de chat
2. Topics et organisation
3. Upload de médias
4. Indicateurs temps réel

**Jour 4 : Features principales**
1. Journal de couple
2. Calendrier partagé
3. Interface de base pour chaque feature

**Jour 5 : Features avancées**
1. Budget commun
2. Coffre sensible
3. Capsules temporelles

**Jour 6 : Polish et optimisations**
1. Animations
2. Notifications
3. Mode offline
4. Tests et debug

### Points critiques à respecter :
1. **TOUJOURS** utiliser `npx expo install` pour les packages
2. **TESTER** régulièrement sur Expo Go (iOS et Android)
3. **GÉRER** toutes les erreurs avec try/catch
4. **OPTIMISER** les performances (lazy loading, memoization)
5. **SÉCURISER** toutes les données sensibles

### Commandes de démarrage :
```bash
# Développement
npx expo start --clear

# Build preview
eas build --profile preview --platform all

# Production
eas build --profile production --platform all
```

Ce prompt contient TOUT le nécessaire pour développer Kindred de A à Z. Suivez l'ordre d'implémentation et respectez les bonnes pratiques pour un résultat optimal.