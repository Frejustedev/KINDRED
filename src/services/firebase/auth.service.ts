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
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import type { Auth } from 'firebase/auth';
import { UserProfile } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AuthService {
  // Clés AsyncStorage pour persistance profonde
  private static readonly STORAGE_KEYS = {
    USER_PROFILE: '@kindred/user_profile',
    COUPLE_ID: '@kindred/couple_id',
    PIN_HASH: '@kindred/pin_hash',
    AUTH_PERSISTENCE: '@kindred/auth_persistence',
    // Nouvelles clés pour persistance profonde
    AUTH_TOKEN_CACHE: '@kindred/auth_token_cache',
    USER_CREDENTIALS_BACKUP: '@kindred/user_credentials_backup',
    SESSION_METADATA: '@kindred/session_metadata',
    OFFLINE_AUTH_DATA: '@kindred/offline_auth_data',
    AUTH_RECOVERY_DATA: '@kindred/auth_recovery_data',
    LAST_SUCCESSFUL_AUTH: '@kindred/last_successful_auth',
    AUTH_FAILURE_COUNT: '@kindred/auth_failure_count',
    DEEP_PERSISTENCE_VERSION: '@kindred/deep_persistence_v2',
  };

  // Initialiser la persistance d'authentification PROFONDE
  static async initializeAuthPersistence(): Promise<void> {
    try {
      console.log('🔐 Initializing DEEP auth persistence...');
      
      // 1. Marquer la persistance comme initialisée
      await AsyncStorage.setItem(this.STORAGE_KEYS.AUTH_PERSISTENCE, 'true');
      
      // 2. Initialiser les métadonnées de session
      const sessionMetadata = {
        initialized: true,
        timestamp: new Date().toISOString(),
        version: '2.0',
        deepPersistenceEnabled: true,
        lastInitialization: Date.now(),
        deviceId: await this.getOrCreateDeviceId(),
        appVersion: '1.01',
        persistenceLevel: 'DEEP'
      };
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.SESSION_METADATA, JSON.stringify(sessionMetadata));
      
      // 3. Initialiser le compteur d'échecs d'authentification
      const existingFailureCount = await AsyncStorage.getItem(this.STORAGE_KEYS.AUTH_FAILURE_COUNT);
      if (!existingFailureCount) {
        await AsyncStorage.setItem(this.STORAGE_KEYS.AUTH_FAILURE_COUNT, '0');
      }
      
      // 4. Marquer la version de persistance profonde
      await AsyncStorage.setItem(this.STORAGE_KEYS.DEEP_PERSISTENCE_VERSION, '2.0');
      
      console.log('✅ Deep auth persistence initialized successfully');
      
    } catch (error) {
      console.error('❌ Error initializing deep auth persistence:', error);
      throw error;
    }
  }

  // Générer ou récupérer un ID d'appareil unique
  private static async getOrCreateDeviceId(): Promise<string> {
    try {
      const existingDeviceId = await AsyncStorage.getItem('@kindred/device_id');
      if (existingDeviceId) {
        return existingDeviceId;
      }
      
      // Générer un nouvel ID d'appareil
      const deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      await AsyncStorage.setItem('@kindred/device_id', deviceId);
      return deviceId;
    } catch (error) {
      console.error('Error generating device ID:', error);
      return `fallback_${Date.now()}`;
    }
  }

  // Récupération d'authentification profonde (URGENCE UNIQUEMENT)
  static async attemptEmergencyAuthRecovery(): Promise<{ user: User | null; profile: UserProfile | null }> {
    try {
      console.log('🔄 Attempting deep auth recovery...');
      
      // 1. Vérifier les données de récupération
      const recoveryDataStr = await AsyncStorage.getItem(this.STORAGE_KEYS.AUTH_RECOVERY_DATA);
      if (!recoveryDataStr) {
        console.log('❌ No recovery data found');
        return { user: null, profile: null };
      }
      
      const recoveryData = JSON.parse(recoveryDataStr);
      
      // 2. Vérifier si les données ne sont pas expirées (30 jours)
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours
      if (Date.now() - recoveryData.timestamp > maxAge) {
        console.log('❌ Recovery data expired');
        await AsyncStorage.removeItem(this.STORAGE_KEYS.AUTH_RECOVERY_DATA);
        return { user: null, profile: null };
      }
      
      // 3. Vérifier les données d'authentification hors ligne
      const offlineDataStr = await AsyncStorage.getItem(this.STORAGE_KEYS.OFFLINE_AUTH_DATA);
      if (offlineDataStr) {
        const offlineData = JSON.parse(offlineDataStr);
        
        if (offlineData.canAuthOffline && Date.now() < offlineData.validUntil) {
          console.log('✅ Using offline auth data for recovery');
          
          // Simuler un objet User basique
          const mockUser = {
            uid: offlineData.userSnapshot.uid,
            email: offlineData.userSnapshot.email,
            emailVerified: offlineData.userSnapshot.emailVerified,
          } as User;
          
          return {
            user: mockUser,
            profile: offlineData.profileSnapshot
          };
        }
      }
      
      // 4. Tentative de récupération via Firebase
      const currentUser = auth.currentUser;
      if (currentUser && recoveryData.userId === currentUser.uid) {
        console.log('✅ Firebase user still available');
        
        try {
          // Recharger le profil depuis Firestore
          const freshProfile = await this.getUserProfile(currentUser.uid);
          if (freshProfile) {
            await this.saveDeepAuthData(currentUser, freshProfile);
            return { user: currentUser, profile: freshProfile };
          }
        } catch (error) {
          console.error('Error reloading profile during recovery:', error);
        }
        
        // Utiliser le profil de sauvegarde si le rechargement échoue
        return { user: currentUser, profile: recoveryData.profileBackup };
      }
      
      console.log('❌ Deep auth recovery failed');
      return { user: null, profile: null };
      
    } catch (error) {
      console.error('❌ Error during deep auth recovery:', error);
      return { user: null, profile: null };
    }
  }

  // Vérifier si l'utilisateur est déjà connecté avec récupération profonde
  static async checkAuthState(): Promise<{ user: User | null; profile: UserProfile | null }> {
    try {
      console.log('🔍 Checking auth state with deep persistence...');
      
      // 1. Vérifier d'abord Firebase
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        console.log('✅ Firebase user found:', currentUser.email);
        
        try {
          // Charger le profil utilisateur depuis Firestore
          const profile = await this.getUserProfile(currentUser.uid);
          
          if (profile) {
            // Sauvegarder avec persistance profonde
            await this.saveDeepAuthData(currentUser, profile);
            return { user: currentUser, profile };
          }
        } catch (error) {
          console.error('Error loading profile from Firestore:', error);
          
          // Essayer de récupérer depuis le cache local
          const cachedProfileStr = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_PROFILE);
          if (cachedProfileStr) {
            const cachedProfile = JSON.parse(cachedProfileStr);
            console.log('📱 Using cached profile as fallback');
            return { user: currentUser, profile: cachedProfile };
          }
        }
        
        return { user: currentUser, profile: null };
      }
      
      // 2. Pas d'utilisateur Firebase - ATTENDRE au lieu de forcer la récupération
      console.log('⏳ No Firebase user found, waiting for Firebase auth state...');
      
      // Retourner null et laisser Firebase gérer l'authentification
      console.log('🔄 Returning null, letting Firebase handle auth naturally');
      
      return { user: null, profile: null };
    } catch (error) {
      console.error('Error checking auth state:', error);
      return { user: null, profile: null };
    }
  }

  // Fonction d'urgence pour récupération en cas de problème critique
  static async forceEmergencyRecovery(): Promise<{ user: User | null; profile: UserProfile | null }> {
    try {
      console.log('🚨 EMERGENCY RECOVERY ACTIVATED');
      
      // Attendre un peu pour laisser Firebase se stabiliser
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Vérifier à nouveau Firebase
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log('✅ Firebase user found after wait:', currentUser.email);
        const profile = await this.getUserProfile(currentUser.uid);
        if (profile) {
          await this.saveDeepAuthData(currentUser, profile);
          return { user: currentUser, profile };
        }
      }
      
      // En dernier recours, utiliser la récupération profonde
      return await this.attemptEmergencyAuthRecovery();
      
    } catch (error) {
      console.error('❌ Emergency recovery failed:', error);
      return { user: null, profile: null };
    }
  }

  // Maintenance automatique de la persistance profonde
  static async performDeepPersistenceMaintenance(): Promise<void> {
    try {
      console.log('🔧 Performing deep persistence maintenance...');
      
      // 1. Nettoyer les données expirées
      await this.cleanExpiredAuthData();
      
      // 2. Valider l'intégrité des données
      await this.validateAuthDataIntegrity();
      
      // 3. Optimiser le stockage
      await this.optimizeAuthStorage();
      
      // 4. Mettre à jour les métadonnées
      await this.updateMaintenanceMetadata();
      
      console.log('✅ Deep persistence maintenance completed');
      
    } catch (error) {
      console.error('❌ Error during maintenance:', error);
    }
  }

  // Nettoyer les données expirées
  private static async cleanExpiredAuthData(): Promise<void> {
    try {
      // Vérifier et nettoyer le cache de tokens
      const tokenCacheStr = await AsyncStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN_CACHE);
      if (tokenCacheStr) {
        const tokenCache = JSON.parse(tokenCacheStr);
        if (Date.now() > tokenCache.expiresAt) {
          await AsyncStorage.removeItem(this.STORAGE_KEYS.AUTH_TOKEN_CACHE);
          console.log('🗑️ Expired token cache cleaned');
        }
      }
      
      // Vérifier et nettoyer les données hors ligne
      const offlineDataStr = await AsyncStorage.getItem(this.STORAGE_KEYS.OFFLINE_AUTH_DATA);
      if (offlineDataStr) {
        const offlineData = JSON.parse(offlineDataStr);
        if (Date.now() > offlineData.validUntil) {
          await AsyncStorage.removeItem(this.STORAGE_KEYS.OFFLINE_AUTH_DATA);
          console.log('🗑️ Expired offline auth data cleaned');
        }
      }
      
      // Vérifier et nettoyer les données de récupération anciennes
      const recoveryDataStr = await AsyncStorage.getItem(this.STORAGE_KEYS.AUTH_RECOVERY_DATA);
      if (recoveryDataStr) {
        const recoveryData = JSON.parse(recoveryDataStr);
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours
        if (Date.now() - recoveryData.timestamp > maxAge) {
          await AsyncStorage.removeItem(this.STORAGE_KEYS.AUTH_RECOVERY_DATA);
          console.log('🗑️ Expired recovery data cleaned');
        }
      }
      
    } catch (error) {
      console.error('Error cleaning expired data:', error);
    }
  }

  // Valider l'intégrité des données d'authentification
  private static async validateAuthDataIntegrity(): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      // Vérifier la cohérence entre les différents caches
      const profileStr = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_PROFILE);
      const recoveryStr = await AsyncStorage.getItem(this.STORAGE_KEYS.AUTH_RECOVERY_DATA);
      const tokenStr = await AsyncStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN_CACHE);
      
      if (profileStr && recoveryStr && tokenStr) {
        const profile = JSON.parse(profileStr);
        const recovery = JSON.parse(recoveryStr);
        const token = JSON.parse(tokenStr);
        
        // Vérifier que les UIDs correspondent
        if (profile.id !== recovery.userId || recovery.userId !== token.uid || token.uid !== currentUser.uid) {
          console.log('⚠️ Data integrity issue detected, refreshing...');
          await this.saveDeepAuthData(currentUser, profile);
        }
      }
      
    } catch (error) {
      console.error('Error validating data integrity:', error);
    }
  }

  // Optimiser le stockage d'authentification
  private static async optimizeAuthStorage(): Promise<void> {
    try {
      // Réduire le compteur d'échecs s'il est élevé et qu'il n'y a pas eu d'échec récent
      const failureCountStr = await AsyncStorage.getItem(this.STORAGE_KEYS.AUTH_FAILURE_COUNT);
      if (failureCountStr) {
        const failureCount = parseInt(failureCountStr, 10);
        if (failureCount > 0) {
          const lastSuccessStr = await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_SUCCESSFUL_AUTH);
          if (lastSuccessStr) {
            const lastSuccess = JSON.parse(lastSuccessStr);
            const timeSinceSuccess = Date.now() - lastSuccess.timestamp;
            
            // Si plus de 24h sans échec, réduire le compteur
            if (timeSinceSuccess > 24 * 60 * 60 * 1000) {
              const newCount = Math.max(0, failureCount - 1);
              await AsyncStorage.setItem(this.STORAGE_KEYS.AUTH_FAILURE_COUNT, newCount.toString());
              console.log(`📉 Reduced failure count from ${failureCount} to ${newCount}`);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error optimizing storage:', error);
    }
  }

  // Mettre à jour les métadonnées de maintenance
  private static async updateMaintenanceMetadata(): Promise<void> {
    try {
      const maintenanceData = {
        lastMaintenance: Date.now(),
        maintenanceVersion: '2.0',
        performedBy: 'deep_persistence_system',
        nextScheduledMaintenance: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 jours
      };
      
      await AsyncStorage.setItem('@kindred/maintenance_metadata', JSON.stringify(maintenanceData));
      
    } catch (error) {
      console.error('Error updating maintenance metadata:', error);
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
        email: email.toLowerCase(), // Stocker l'email en minuscules
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

      // Sauvegarder en local avec persistance profonde
      const completeProfile: UserProfile = { 
        id: user.uid, 
        ...userProfile,
        email: email.toLowerCase() // S'assurer que l'email est défini
      } as UserProfile;
      await this.saveDeepAuthData(user, completeProfile);

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
      
      // Récupérer et sauvegarder le profil avec persistance profonde
      const profile = await this.getUserProfile(userCredential.user.uid);
      if (profile) {
        await this.saveDeepAuthData(userCredential.user, profile);
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

  // Sauvegarder les données d'authentification avec persistance profonde
  private static async saveDeepAuthData(user: User, profile: UserProfile): Promise<void> {
    try {
      console.log('💾 Saving deep auth data...');
      
      // 1. Sauvegarder le profil utilisateur (méthode standard)
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(profile)
      );
      
      // 2. Sauvegarder l'ID du couple si présent
      if (profile.coupledWith) {
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.COUPLE_ID,
          profile.coupledWith
        );
      }
      
      // 3. Créer un cache de token d'authentification
      const authTokenCache = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: Date.now(),
        lastRefresh: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 jours
      };
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.AUTH_TOKEN_CACHE,
        JSON.stringify(authTokenCache)
      );
      
      // 4. Sauvegarder les données de récupération d'authentification
      const authRecoveryData = {
        userId: user.uid,
        email: user.email,
        profileBackup: profile,
        timestamp: Date.now(),
        deviceId: await this.getOrCreateDeviceId(),
        appVersion: '1.01',
        authMethod: 'email_password'
      };
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.AUTH_RECOVERY_DATA,
        JSON.stringify(authRecoveryData)
      );
      
      // 5. Marquer la dernière authentification réussie
      const lastSuccessfulAuth = {
        timestamp: Date.now(),
        userId: user.uid,
        method: 'signIn',
        deviceId: await this.getOrCreateDeviceId()
      };
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.LAST_SUCCESSFUL_AUTH,
        JSON.stringify(lastSuccessfulAuth)
      );
      
      // 6. Réinitialiser le compteur d'échecs
      await AsyncStorage.setItem(this.STORAGE_KEYS.AUTH_FAILURE_COUNT, '0');
      
      // 7. Créer des données d'authentification hors ligne
      const offlineAuthData = {
        canAuthOffline: true,
        lastOnlineAuth: Date.now(),
        profileSnapshot: profile,
        userSnapshot: {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified
        },
        validUntil: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 jours
      };
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.OFFLINE_AUTH_DATA,
        JSON.stringify(offlineAuthData)
      );
      
      console.log('✅ Deep auth data saved successfully');
      
    } catch (error) {
      console.error('❌ Error saving deep auth data:', error);
      throw error;
    }
  }

  // Déconnexion
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
      
      // Nettoyer TOUTES les données de persistance profonde
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.USER_PROFILE,
        this.STORAGE_KEYS.COUPLE_ID,
        this.STORAGE_KEYS.PIN_HASH,
        this.STORAGE_KEYS.AUTH_PERSISTENCE,
        this.STORAGE_KEYS.AUTH_TOKEN_CACHE,
        this.STORAGE_KEYS.USER_CREDENTIALS_BACKUP,
        this.STORAGE_KEYS.SESSION_METADATA,
        this.STORAGE_KEYS.OFFLINE_AUTH_DATA,
        this.STORAGE_KEYS.AUTH_RECOVERY_DATA,
        this.STORAGE_KEYS.LAST_SUCCESSFUL_AUTH,
        this.STORAGE_KEYS.AUTH_FAILURE_COUNT,
        this.STORAGE_KEYS.DEEP_PERSISTENCE_VERSION,
        '@kindred/session_metadata',
        '@kindred/needs_reconnect',
        '@kindred/reconnecting',
        '@kindred/auth_persistence_metadata',
        '@kindred/device_id', // Garder l'ID d'appareil pour les futures connexions
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
