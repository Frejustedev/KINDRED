import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { TimeCapsule } from '../types';
import { FirestoreService } from '../services/firebase/firestore.service';
import { useAuth } from './useAuth';
import { useCouple } from './useCouple';

interface TimeCapsuleContextType {
  capsules: TimeCapsule[];
  isLoading: boolean;
  error: string | null;
  addCapsule: (capsule: Partial<TimeCapsule>) => Promise<void>;
  updateCapsule: (capsuleId: string, updates: Partial<TimeCapsule>) => Promise<void>;
  deleteCapsule: (capsuleId: string) => Promise<void>;
  openCapsule: (capsuleId: string) => Promise<void>;
  refreshCapsules: () => void;
  clearError: () => void;
}

const TimeCapsuleContext = createContext<TimeCapsuleContextType | undefined>(undefined);

export const TimeCapsuleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Écouter les capsules en temps réel
  useEffect(() => {
    if (!couple || !user) {
      setCapsules([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Se désabonner de l'ancienne subscription
    if (unsubscribe) {
      unsubscribe();
    }

    // S'abonner aux capsules temporelles
    const newUnsubscribe = FirestoreService.subscribeToTimeCapsules(
      couple.id,
      (newCapsules) => {
        setCapsules(newCapsules);
        setIsLoading(false);
      }
    );

    setUnsubscribe(() => newUnsubscribe);

    return () => {
      newUnsubscribe();
    };
  }, [couple?.id, user?.uid]);

  // Ajouter une capsule
  const addCapsule = async (capsule: Partial<TimeCapsule>) => {
    if (!couple || !user) throw new Error('Couple ou utilisateur non disponible');

    try {
      setError(null);
      await FirestoreService.createCapsule(
        couple.id, 
        capsule.message || '', 
        capsule.openDate?.toDate() || new Date(), 
        user.uid,
        capsule.media
      );
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Mettre à jour une capsule
  const updateCapsule = async (capsuleId: string, updates: Partial<TimeCapsule>) => {
    if (!couple) throw new Error('Couple non disponible');

    try {
      setError(null);
      await FirestoreService.updateCapsule(couple.id, capsuleId, updates);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Supprimer une capsule
  const deleteCapsule = async (capsuleId: string) => {
    if (!couple) throw new Error('Couple non disponible');

    try {
      setError(null);
      await FirestoreService.deleteCapsule(couple.id, capsuleId);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Ouvrir une capsule
  const openCapsule = async (capsuleId: string) => {
    if (!couple) throw new Error('Couple non disponible');

    try {
      setError(null);
      await FirestoreService.openCapsule(couple.id, capsuleId);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Forcer la mise à jour
  const refreshCapsules = () => {
    if (couple && user) {
      if (unsubscribe) {
        unsubscribe();
      }
      const newUnsubscribe = FirestoreService.subscribeToTimeCapsules(
        couple.id,
        (newCapsules) => {
          setCapsules(newCapsules);
          setIsLoading(false);
        }
      );
      setUnsubscribe(() => newUnsubscribe);
    }
  };

  // Effacer l'erreur
  const clearError = () => {
    setError(null);
  };

  const value = {
    capsules,
    isLoading,
    error,
    addCapsule,
    updateCapsule,
    deleteCapsule,
    openCapsule,
    refreshCapsules,
    clearError,
  };

  return <TimeCapsuleContext.Provider value={value}>{children}</TimeCapsuleContext.Provider>;
};

export const useTimeCapsules = () => {
  const context = useContext(TimeCapsuleContext);
  if (context === undefined) {
    throw new Error('useTimeCapsules must be used within a TimeCapsuleProvider');
  }
  return context;
};
