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
  createCouple: (partnerEmail: string, pin: string) => Promise<string>;
  joinCouple: (inviteCode: string, pin: string) => Promise<string>;
  leaveCouple: () => Promise<void>;
  generateInviteCode: () => Promise<string>;
  refreshCouple: () => Promise<void>;
  clearError: () => void;
}

const CoupleContext = createContext<CoupleContextType | undefined>(undefined);

export const CoupleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<UserProfile | null>(null);
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

  // Rejoindre un couple
  const joinCouple = async (inviteCode: string, pin: string): Promise<string> => {
    console.log('joinCouple called with inviteCode:', inviteCode);
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      setIsLoading(true);
      setError(null);

      console.log('Calling FirestoreService.joinCouple...');
      const coupleId = await FirestoreService.joinCouple(user.uid, inviteCode, pin);
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
  const leaveCouple = async () => {
    if (!user || !couple) throw new Error('Aucun couple actif');

    try {
      setIsLoading(true);
      setError(null);

      await FirestoreService.leaveCouple(user.uid, couple.id);
      
      // Réinitialiser les données du couple
      setCouple(null);
      setPartnerInfo(null);
      
    } catch (error: any) {
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

  // Effacer l'erreur
  const clearError = () => {
    setError(null);
  };

  // Charger le couple quand l'utilisateur change
  useEffect(() => {
    subscribeToCouple();
    
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
    createCouple,
    joinCouple,
    leaveCouple,
    generateInviteCode,
    refreshCouple,
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
