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
  signUp: (email: string, password: string, firstName: string, lastName: string, age: number, country: string, language: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  forceAuthPersistence: () => Promise<void>;
  getAuthPersistenceStatus: () => Promise<{
    isActive: boolean;
    hasLocalProfile: boolean;
    hasCurrentUser: boolean;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Initialiser l'état d'authentification au démarrage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing DEEP authentication...');
        
        // 1. Initialiser la persistance d'authentification profonde
        await AuthService.initializeAuthPersistence();
        
        // 2. Vérifier si l'utilisateur est déjà connecté (mode conservateur)
        const { user: currentUser, profile: currentProfile } = await AuthService.checkAuthState();
        
        if (currentUser && currentProfile) {
          // Utilisateur déjà connecté, mettre à jour l'état immédiatement
          setUser(currentUser);
          setProfile(currentProfile);
          setIsEmailVerified(currentUser.emailVerified);
          console.log('✅ User authenticated with deep persistence, state restored');
        } else {
          // Pas d'utilisateur trouvé même avec la récupération profonde
          console.log('❌ No user found even with deep recovery, waiting for Firebase auth state...');
          
          // Vérifier si une reconnexion est nécessaire (méthode de fallback)
          const persistenceStatus = await AuthService.getAuthPersistenceStatus();
          if (persistenceStatus.needsReconnect) {
            console.log('🔄 Attempting fallback reconnection...');
            await AuthService.forceAuthPersistence();
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error initializing deep auth:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Maintenance périodique automatique de la persistance profonde
  useEffect(() => {
    const performPeriodicMaintenance = async () => {
      try {
        // Vérifier si une maintenance est nécessaire (toutes les 24h)
        const maintenanceMetadataStr = await AsyncStorage.getItem('@kindred/maintenance_metadata');
        let needsMaintenance = true;
        
        if (maintenanceMetadataStr) {
          const maintenanceData = JSON.parse(maintenanceMetadataStr);
          const timeSinceLastMaintenance = Date.now() - maintenanceData.lastMaintenance;
          const maintenanceInterval = 24 * 60 * 60 * 1000; // 24 heures
          
          needsMaintenance = timeSinceLastMaintenance > maintenanceInterval;
        }
        
        if (needsMaintenance && user) {
          console.log('🔧 Performing scheduled deep persistence maintenance...');
          // Effectuer la maintenance en arrière-plan sans bloquer
          AuthService.performDeepPersistenceMaintenance().catch(error => {
            console.error('Background maintenance error:', error);
          });
        }
      } catch (error) {
        console.error('Error during periodic maintenance:', error);
      }
    };

    // Effectuer la maintenance 5 minutes après l'initialisation
    const maintenanceTimer = setTimeout(performPeriodicMaintenance, 5 * 60 * 1000);
    
    // Nettoyer le timer au démontage
    return () => clearTimeout(maintenanceTimer);
  }, [user]);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
      
      setUser(firebaseUser);
      
      if (firebaseUser) {
        setIsEmailVerified(firebaseUser.emailVerified);
        
        try {
          // Charger le profil depuis Firestore
          const userProfile = await AuthService.getUserProfile(firebaseUser.uid);
          setProfile(userProfile);
          
          // Sauvegarder localement pour la persistance
          if (userProfile) {
            await AsyncStorage.setItem(
              '@kindred/user_profile',
              JSON.stringify(userProfile)
            );
            console.log('User profile saved locally');
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          // En cas d'erreur, essayer de charger le profil local
          const localProfile = await AuthService.getLocalProfile();
          if (localProfile) {
            setProfile(localProfile);
          }
        }
      } else {
        // Utilisateur déconnecté
        setProfile(null);
        setIsEmailVerified(false);
        
        // Nettoyer les données locales
        try {
          await AsyncStorage.removeItem('@kindred/user_profile');
          await AsyncStorage.removeItem('@kindred/couple_id');
          console.log('Local data cleared');
        } catch (error) {
          console.error('Error clearing local data:', error);
        }
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string, age: number, country: string, language: string) => {
    try {
      await AuthService.signUp(email, password, firstName, lastName, age, country, language);
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
      console.log('🔄 Rafraîchissement du profil utilisateur depuis Firebase...');
      const userProfile = await AuthService.getUserProfile(user.uid);
      setProfile(userProfile);
      
      // Mettre à jour le cache local avec le nouveau profil
      if (userProfile) {
        await AsyncStorage.setItem(
          '@kindred/user_profile',
          JSON.stringify(userProfile)
        );
        console.log('💾 Profil utilisateur mis à jour dans le cache local');
      } else {
        await AsyncStorage.removeItem('@kindred/user_profile');
        console.log('🗑️ Profil utilisateur supprimé du cache local');
      }
    }
  };

  const forceAuthPersistence = async () => {
    await AuthService.forceAuthPersistence();
  };

  const getAuthPersistenceStatus = async () => {
    return await AuthService.getAuthPersistenceStatus();
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
    refreshProfile,
    forceAuthPersistence,
    getAuthPersistenceStatus
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
