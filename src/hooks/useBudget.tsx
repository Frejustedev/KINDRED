import { useState, useEffect, useContext, createContext, ReactNode, useCallback } from 'react';
import { Transaction } from '../types';
import { FirestoreService } from '../services/firebase/firestore.service';
import { useAuth } from './useAuth';
import { useCouple } from './useCouple';

interface BudgetContextType {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  addTransaction: (transaction: Partial<Transaction>) => Promise<void>;
  updateTransaction: (transactionId: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  refreshTransactions: () => void;
  customCategories: string[];
  addCategory: (category: string) => Promise<void>;
  updateCategory: (oldCategory: string, newCategory: string) => Promise<void>;
  deleteCategory: (category: string) => Promise<void>;
  clearError: () => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Écouter les transactions en temps réel
  useEffect(() => {
    if (!couple || !user) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Se désabonner de l'ancienne subscription
    if (unsubscribe) {
      unsubscribe();
    }

    // S'abonner aux transactions du mois actuel
    const currentDate = new Date();
    const newUnsubscribe = FirestoreService.subscribeToTransactions(
      couple.id,
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      (newTransactions) => {
        setTransactions(newTransactions);
        setIsLoading(false);
      }
    );

    setUnsubscribe(() => newUnsubscribe);

    return () => {
      newUnsubscribe();
    };
  }, [couple?.id, user?.uid]);

  // Charger les catégories personnalisées
  useEffect(() => {
    const loadCustomCategories = async () => {
      if (!couple) return;

      try {
        const categories = await FirestoreService.getCustomCategories(couple.id);
        setCustomCategories(categories);
      } catch (error) {
        console.error('Error loading custom categories:', error);
      }
    };

    loadCustomCategories();
  }, [couple?.id]);

  // Ajouter une transaction
  const addTransaction = async (transaction: Partial<Transaction>) => {
    if (!couple || !user) throw new Error('Couple ou utilisateur non disponible');

    try {
      setError(null);
      await FirestoreService.addTransaction(
        couple.id,
        {
          ...transaction,
          paidBy: user.uid,
          splitType: 'equal' as const,
          date: transaction.date || new Date(),
        } as any
      );
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Mettre à jour une transaction
  const updateTransaction = async (transactionId: string, updates: Partial<Transaction>) => {
    if (!couple) throw new Error('Couple non disponible');

    try {
      setError(null);
      await FirestoreService.updateTransaction(couple.id, transactionId, updates);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Supprimer une transaction
  const deleteTransaction = async (transactionId: string) => {
    if (!couple) throw new Error('Couple non disponible');

    try {
      setError(null);
      await FirestoreService.deleteTransaction(couple.id, transactionId);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Forcer la mise à jour
  const refreshTransactions = () => {
    if (couple && user) {
      const currentDate = new Date();
      // Déclencher une nouvelle écoute
      if (unsubscribe) {
        unsubscribe();
      }
      const newUnsubscribe = FirestoreService.subscribeToTransactions(
        couple.id,
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        (newTransactions) => {
          setTransactions(newTransactions);
          setIsLoading(false);
        }
      );
      setUnsubscribe(() => newUnsubscribe);
    }
  };

  // Ajouter une catégorie personnalisée
  const addCategory = async (category: string) => {
    if (!couple) throw new Error('Couple non disponible');

    try {
      setError(null);
      await FirestoreService.addCustomCategory(couple.id, category);
      setCustomCategories(prev => [...prev, category]);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Mettre à jour une catégorie
  const updateCategory = async (oldCategory: string, newCategory: string) => {
    if (!couple) throw new Error('Couple non disponible');

    try {
      setError(null);
      await FirestoreService.updateCategory(couple.id, oldCategory, newCategory);
      setCustomCategories(prev => prev.map(cat => cat === oldCategory ? newCategory : cat));
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Supprimer une catégorie
  const deleteCategory = async (category: string) => {
    if (!couple) throw new Error('Couple non disponible');

    try {
      setError(null);
      await FirestoreService.deleteCategory(couple.id, category);
      setCustomCategories(prev => prev.filter(cat => cat !== category));
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Effacer l'erreur
  const clearError = () => {
    setError(null);
  };

  const value = {
    transactions,
    isLoading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refreshTransactions,
    customCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    clearError,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};

