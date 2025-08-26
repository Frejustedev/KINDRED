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
  updatePassword,
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  getReactNativePersistence
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
    AUTH_PERSISTENCE: '@kindred/auth_persistence',
  };

  // Initialiser la persistance d'authentification
  static async initializeAuthPersistence(): Promise<void> {
    try {
      // Configurer la persistance React Native avec AsyncStorage
      await setPersistence(auth, getReactNativePersistence(AsyncStorage));
      console.log('Auth persistence initialized - React Native persistence with AsyncStorage');
      
      // Marquer que la persistance est initialisée
      await AsyncStorage.setItem(this.STORAGE_KEYS.AUTH_PERSISTENCE, 'true');
      
      // Sauvegarder les métadonnées de persistance
      await AsyncStorage.setItem('@kindred/auth_persistence_metadata', JSON.stringify({
        initialized: true,
        timestamp: new Date().toISOString(),
        type: 'react_native_persistence'
      }));
    } catch (error) {
      console.error('Error initializing auth persistence:', error);
      // Fallback vers la persistance par défaut
      try {
        await setPersistence(auth, browserLocalPersistence);
        console.log('Fallback to browser local persistence');
      } catch (fallbackError) {
        console.error('Fallback persistence failed:', fallbackError);
      }
    }
  }

  // Vérifier si l'utilisateur est déjà connecté
  static async checkAuthState(): Promise<{ user: User | null; profile: UserProfile | null }> {
    try {
      // Vérifier d'abord la persistance locale
      const persistenceStatus = await this.getAuthPersistenceStatus();
      console.log('Persistence status:', persistenceStatus);
      
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        console.log('User already authenticated:', currentUser.email);
        
        // Charger le profil utilisateur
        const profile = await this.getUserProfile(currentUser.uid);
        
        // Sauvegarder en local si pas déjà fait
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
          
          // Sauvegarder les métadonnées de session
          await AsyncStorage.setItem('@kindred/session_metadata', JSON.stringify({
            lastLogin: new Date().toISOString(),
            userId: currentUser.uid,
            email: currentUser.email,
            emailVerified: currentUser.emailVerified
          }));
        }
        
        return { user: currentUser, profile };
      }
      
      // Si pas d'utilisateur Firebase mais profil local, essayer de restaurer
      if (persistenceStatus.hasLocalProfile && !currentUser) {
        console.log('Attempting to restore session from local storage');
        const localProfile = await this.getLocalProfile();
        if (localProfile) {
          // Marquer pour reconnexion automatique
          await AsyncStorage.setItem('@kindred/needs_reconnect', 'true');
          return { user: null, profile: localProfile };
        }
      }
      
      return { user: null, profile: null };
    } catch (error) {
      console.error('Error checking auth state:', error);
      return { user: null, profile: null };
    }
  }

  // Inscription
  static async signUp(
    email: string, 
    password: string, 
    firstName: string,
    lastName: string,
    age: number,
    country: string,
    language: string
  ): Promise<User> {
    try {
      // S'assurer que la persistance est initialisée
      await this.initializeAuthPersistence();
      
      // Créer le compte
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        email, 
        password
      );
      const user = userCredential.user;

      // Mettre à jour le profil
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      // Créer le document utilisateur dans Firestore
      const userProfile: Partial<UserProfile> = {
        email,
        firstName,
        lastName,
        age,
        country,
        language,
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
          language: language,
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
      // S'assurer que la persistance est initialisée
      await this.initializeAuthPersistence();
      
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
        this.STORAGE_KEYS.AUTH_PERSISTENCE,
        '@kindred/session_metadata',
        '@kindred/needs_reconnect',
        '@kindred/reconnecting',
        '@kindred/auth_persistence_metadata',
      ]);
      
      console.log('User signed out and local storage cleaned');
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Forcer la persistance de l'authentification
  static async forceAuthPersistence(): Promise<void> {
    try {
      await this.initializeAuthPersistence();
      
      // Vérifier si une reconnexion est nécessaire
      const needsReconnect = await AsyncStorage.getItem('@kindred/needs_reconnect');
      if (needsReconnect === 'true') {
        console.log('Attempting automatic reconnection...');
        await this.attemptAutoReconnect();
      }
      
      console.log('Auth persistence forced');
    } catch (error) {
      console.error('Error forcing auth persistence:', error);
    }
  }

  // Tenter une reconnexion automatique
  static async attemptAutoReconnect(): Promise<void> {
    try {
      const sessionMetadata = await AsyncStorage.getItem('@kindred/session_metadata');
      if (sessionMetadata) {
        const session = JSON.parse(sessionMetadata);
        console.log('Found session metadata, attempting reconnection for:', session.email);
        
        // Marquer que la reconnexion est en cours
        await AsyncStorage.setItem('@kindred/reconnecting', 'true');
        
        // La reconnexion se fera automatiquement via Firebase Auth
        // qui va restaurer la session depuis AsyncStorage
      }
    } catch (error) {
      console.error('Error attempting auto reconnect:', error);
    } finally {
      // Nettoyer les flags de reconnexion
      await AsyncStorage.removeItem('@kindred/needs_reconnect');
      await AsyncStorage.removeItem('@kindred/reconnecting');
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

  // Vérifier si la persistance d'authentification est active
  static async isAuthPersistenceActive(): Promise<boolean> {
    try {
      const persistence = await AsyncStorage.getItem(this.STORAGE_KEYS.AUTH_PERSISTENCE);
      return persistence === 'true';
    } catch (error) {
      return false;
    }
  }

  // Obtenir le statut de persistance d'authentification
  static async getAuthPersistenceStatus(): Promise<{
    isActive: boolean;
    hasLocalProfile: boolean;
    hasCurrentUser: boolean;
    hasSessionMetadata: boolean;
    needsReconnect: boolean;
    lastLogin?: string;
  }> {
    try {
      const isActive = await this.isAuthPersistenceActive();
      const hasLocalProfile = !!(await this.getLocalProfile());
      const hasCurrentUser = !!auth.currentUser;
      
      // Vérifier les métadonnées de session
      const sessionMetadata = await AsyncStorage.getItem('@kindred/session_metadata');
      const hasSessionMetadata = !!sessionMetadata;
      
      // Vérifier si une reconnexion est nécessaire
      const needsReconnect = await AsyncStorage.getItem('@kindred/needs_reconnect') === 'true';
      
      let lastLogin: string | undefined;
      if (sessionMetadata) {
        try {
          const session = JSON.parse(sessionMetadata);
          lastLogin = session.lastLogin;
        } catch (e) {
          console.error('Error parsing session metadata:', e);
        }
      }
      
      return {
        isActive,
        hasLocalProfile,
        hasCurrentUser,
        hasSessionMetadata,
        needsReconnect,
        lastLogin,
      };
    } catch (error) {
      return {
        isActive: false,
        hasLocalProfile: false,
        hasCurrentUser: false,
        hasSessionMetadata: false,
        needsReconnect: false,
      };
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
