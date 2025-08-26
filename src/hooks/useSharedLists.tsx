import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { SharedList } from '../types';
import { FirestoreService } from '../services/firebase/firestore.service';
import { useAuth } from './useAuth';
import { useCouple } from './useCouple';

interface SharedListsContextType {
  lists: SharedList[];
  isLoading: boolean;
  error: string | null;
  addList: (list: Partial<SharedList>) => Promise<void>;
  updateList: (listId: string, updates: Partial<SharedList>) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  refreshLists: () => void;
  clearError: () => void;
}

const SharedListsContext = createContext<SharedListsContextType | undefined>(undefined);

export const SharedListsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [lists, setLists] = useState<SharedList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Écouter les listes en temps réel
  useEffect(() => {
    if (!couple || !user) {
      setLists([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Se désabonner de l'ancienne subscription
    if (unsubscribe) {
      unsubscribe();
    }

    // S'abonner aux listes partagées
    const newUnsubscribe = FirestoreService.subscribeToSharedLists(
      couple.id,
      (newLists) => {
        setLists(newLists);
        setIsLoading(false);
      }
    );

    setUnsubscribe(() => newUnsubscribe);

    return () => {
      newUnsubscribe();
    };
  }, [couple?.id, user?.uid]);

  // Ajouter une liste
  const addList = async (list: Partial<SharedList>) => {
    if (!couple || !user) throw new Error('Couple ou utilisateur non disponible');

    try {
      setError(null);
      await FirestoreService.createSharedList(couple.id, {
        ...list,
        createdBy: user.uid,
        items: list.items || [],
      } as any);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Mettre à jour une liste
  const updateList = async (listId: string, updates: Partial<SharedList>) => {
    if (!couple) throw new Error('Couple non disponible');

    try {
      setError(null);
      await FirestoreService.updateSharedList(couple.id, listId, updates);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Supprimer une liste
  const deleteList = async (listId: string) => {
    if (!couple) throw new Error('Couple non disponible');

    try {
      setError(null);
      await FirestoreService.deleteSharedList(couple.id, listId);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Forcer la mise à jour
  const refreshLists = () => {
    if (couple && user) {
      if (unsubscribe) {
        unsubscribe();
      }
      const newUnsubscribe = FirestoreService.subscribeToSharedLists(
        couple.id,
        (newLists) => {
          setLists(newLists);
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
    lists,
    isLoading,
    error,
    addList,
    updateList,
    deleteList,
    refreshLists,
    clearError,
  };

  return <SharedListsContext.Provider value={value}>{children}</SharedListsContext.Provider>;
};

export const useSharedLists = () => {
  const context = useContext(SharedListsContext);
  if (context === undefined) {
    throw new Error('useSharedLists must be used within a SharedListsProvider');
  }
  return context;
};

