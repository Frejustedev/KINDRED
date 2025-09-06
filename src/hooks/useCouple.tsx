import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { FirestoreService } from '../services/firebase/firestore.service';
import { useAuth } from './useAuth';
import { Couple, UserProfile } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CoupleContextType {
  couple: Couple | null;
  isLoading: boolean;
  error: string | null;
  partnerInfo: UserProfile | null;
  pendingInvitations: any[];
  createCouple: (partnerEmail: string, pin: string) => Promise<string>;
  joinCouple: (partnerEmailOrCode: string, pin: string) => Promise<string>;
  acceptInvitation: (invitationId: string) => Promise<string>;
  rejectInvitation: (invitationId: string) => Promise<void>;
  leaveCouple: () => Promise<void>;
  dissolveCouple: () => Promise<void>;
  generateInviteCode: () => Promise<string>;
  refreshCouple: () => Promise<void>;
  loadPendingInvitations: () => Promise<void>;
  clearError: () => void;
}

const CoupleContext = createContext<CoupleContextType | undefined>(undefined);

export const CoupleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<UserProfile | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Charger les données du couple
  const loadCouple = async () => {
    console.log('loadCouple called');
    console.log('user:', user?.uid);
    console.log('profile?.coupledWith:', profile?.coupledWith);
    
    if (!user || !profile?.coupledWith) {
      console.log('No user or no couple ID, setting couple to null');
      setCouple(null);
      setPartnerInfo(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Loading couple data for ID:', profile.coupledWith);
      const coupleData = await FirestoreService.getCouple(profile.coupledWith);
      console.log('Couple data loaded:', coupleData);
      
      // Vérifier si le couple est actif (pas quitté/dissous)
      if (coupleData && (coupleData.status === 'left' || coupleData.users.length === 0)) {
        console.log('🚫 Couple dissous ou quitté - ne pas charger');
        setCouple(null);
        setPartnerInfo(null);
        setError(null);
        return;
      }
      
      setCouple(coupleData);
      
      // Charger les informations du partenaire
      const partnerData = await FirestoreService.getPartnerInfo(profile.coupledWith!, user.uid);
      console.log('Partner data loaded:', partnerData);
      setPartnerInfo(partnerData);
      
      setError(null);
    } catch (error: any) {
      console.error('Error loading couple:', error);
      setError(error.message);
      setCouple(null);
      setPartnerInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Écouter les changements du couple en temps réel
  const subscribeToCouple = () => {
    if (!user || !profile?.coupledWith) {
      setCouple(null);
      setIsLoading(false);
      return;
    }

    // Se désabonner de l'ancienne subscription
    if (unsubscribe) {
      unsubscribe();
    }

    // S'abonner aux changements du couple
    const newUnsubscribe = FirestoreService.subscribeToCouple(
      profile.coupledWith,
      async (coupleData) => {
        console.log('Couple data updated:', coupleData);
        setCouple(coupleData);
        
        // Charger les informations du partenaire
        const partnerData = await FirestoreService.getPartnerInfo(profile.coupledWith!, user.uid);
        console.log('Partner data updated:', partnerData);
        setPartnerInfo(partnerData);
        
        setIsLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error subscribing to couple:', error);
        setError(error.message);
        setIsLoading(false);
      }
    );

    setUnsubscribe(() => newUnsubscribe);
  };

  // Créer un couple
  const createCouple = async (partnerEmail: string, pin: string) => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      setIsLoading(true);
      setError(null);

      // Créer le couple avec l'email du partenaire
      const coupleId = await FirestoreService.createCouple(user.uid, partnerEmail, pin);
      
      // Recharger les données du couple
      await loadCouple();
      
      // Retourner le coupleId (plus besoin de code d'invitation car le couple est créé directement)
      return coupleId;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Rejoindre un couple (détection automatique email vs code)
  const joinCouple = async (partnerEmailOrCode: string, pin: string): Promise<string> => {
    console.log('joinCouple called with:', partnerEmailOrCode);
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      setIsLoading(true);
      setError(null);

      // Détecter si c'est un email ou un code d'invitation
      const isEmail = partnerEmailOrCode.includes('@');
      
      let coupleId: string;
      if (isEmail) {
        console.log('Joining couple by partner email...');
        coupleId = await FirestoreService.joinCoupleByEmail(user.uid, partnerEmailOrCode, pin);
      } else {
        console.log('Joining couple by invite code...');
        coupleId = await FirestoreService.joinCouple(user.uid, partnerEmailOrCode, pin);
      }
      
      console.log('Couple joined successfully, coupleId:', coupleId);
      
      // Charger directement les données du couple
      console.log('Loading couple data...');
      const coupleData = await FirestoreService.getCouple(coupleId);
      console.log('Couple data loaded:', coupleData);
      setCouple(coupleData);
      setError(null);
      
      // Forcer le rafraîchissement du profil utilisateur
      console.log('Refreshing user profile...');
      // Note: refreshProfile sera appelé automatiquement par useAuth
      
      return coupleId;
    } catch (error: any) {
      console.error('Error in joinCouple:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Quitter un couple
  const leaveCouple = async (): Promise<void> => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      setIsLoading(true);
      setError(null);

      console.log('🚪 Début du processus de départ du couple...');
      await FirestoreService.leaveCouple(user.uid);
      
      console.log('🔄 Rafraîchissement du profil utilisateur...');
      // CRUCIAL: Rafraîchir le profil utilisateur pour récupérer coupledWith: null
      await refreshProfile();
      
      // Attendre un peu pour que Firebase propage les changements
      console.log('⏳ Attente de la propagation des changements...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Double vérification du profil
      console.log('🔍 Double vérification du profil...');
      await refreshProfile();
      
      // Réinitialiser les données du couple
      setCouple(null);
      setPartnerInfo(null);
      
      // Effacer TOUTES les données locales liées au couple
      await AsyncStorage.removeItem('coupleData');
      await AsyncStorage.removeItem('@kindred/couple_id');
      await AsyncStorage.removeItem('@kindred/user_profile');
      console.log('🗑️ Cache local complètement nettoyé');
      
      console.log('✅ Couple quitté avec succès - profil utilisateur mis à jour');
      
    } catch (error: any) {
      console.error('Error leaving couple:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Dissoudre complètement un couple
  const dissolveCouple = async (): Promise<void> => {
    if (!user || !couple) throw new Error('Aucun couple actif');

    try {
      setIsLoading(true);
      setError(null);

      await FirestoreService.dissolveCouple(user.uid, couple.id);
      
      // Réinitialiser les données du couple
      setCouple(null);
      setPartnerInfo(null);
      
      // Effacer les données locales
      await AsyncStorage.removeItem('coupleData');
      
      console.log('✅ Couple dissous avec succès');
      
    } catch (error: any) {
      console.error('Error dissolving couple:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Générer un code d'invitation
  const generateInviteCode = async (): Promise<string> => {
    if (!couple) throw new Error('Aucun couple actif');

    try {
      return await FirestoreService.generateInviteCode(couple.id);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Rafraîchir les données du couple
  const refreshCouple = async () => {
    await loadCouple();
  };

  // Charger les invitations en attente
  const loadPendingInvitations = async () => {
    if (!user) return;
    
    try {
      const invitations = await FirestoreService.getPendingInvitations(user.uid);
      setPendingInvitations(invitations);
    } catch (error) {
      console.error('Error loading pending invitations:', error);
    }
  };

  // Accepter une invitation
  const acceptInvitation = async (invitationId: string): Promise<string> => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      setIsLoading(true);
      setError(null);

      const coupleId = await FirestoreService.acceptCoupleInvitation(user.uid, invitationId);
      
      // Recharger les données
      await loadCouple();
      await loadPendingInvitations();
      
      return coupleId;
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Refuser une invitation
  const rejectInvitation = async (invitationId: string): Promise<void> => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      setIsLoading(true);
      setError(null);

      await FirestoreService.rejectCoupleInvitation(user.uid, invitationId);
      
      // Recharger les invitations
      await loadPendingInvitations();
    } catch (error: any) {
      console.error('Error rejecting invitation:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Effacer l'erreur
  const clearError = () => {
    setError(null);
  };

  // Charger le couple et les invitations quand l'utilisateur change
  useEffect(() => {
    subscribeToCouple();
    loadPendingInvitations();
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, profile?.coupledWith]);

  const value = {
    couple,
    isLoading,
    error,
    partnerInfo,
    pendingInvitations,
    createCouple,
    joinCouple,
    acceptInvitation,
    rejectInvitation,
    leaveCouple,
    dissolveCouple,
    generateInviteCode,
    refreshCouple,
    loadPendingInvitations,
    clearError,
  };

  return <CoupleContext.Provider value={value}>{children}</CoupleContext.Provider>;
};

export const useCouple = () => {
  const context = useContext(CoupleContext);
  if (context === undefined) {
    throw new Error('useCouple must be used within a CoupleProvider');
  }
  return context;
};
