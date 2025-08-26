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
        console.log('Initializing authentication...');
        
        // Initialiser la persistance d'authentification
        await AuthService.initializeAuthPersistence();
        
        // Vérifier si l'utilisateur est déjà connecté
        const { user: currentUser, profile: currentProfile } = await AuthService.checkAuthState();
        
        if (currentUser && currentProfile) {
          // Utilisateur déjà connecté, mettre à jour l'état immédiatement
          setUser(currentUser);
          setProfile(currentProfile);
          setIsEmailVerified(currentUser.emailVerified);
          console.log('User already authenticated, state restored');
        } else {
          // Charger le profil local en attendant la vérification Firebase
          const localProfile = await AuthService.getLocalProfile();
          if (localProfile) {
            setProfile(localProfile);
            console.log('Local profile loaded during initialization');
            
            // Vérifier si une reconnexion est nécessaire
            const persistenceStatus = await AuthService.getAuthPersistenceStatus();
            if (persistenceStatus.needsReconnect) {
              console.log('Attempting to reconnect user...');
              await AuthService.forceAuthPersistence();
            }
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

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
      const userProfile = await AuthService.getUserProfile(user.uid);
      setProfile(userProfile);
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
