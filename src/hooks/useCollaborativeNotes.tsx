import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { CollaborativeNote } from '../types';
import { FirestoreService } from '../services/firebase/firestore.service';
import { useAuth } from './useAuth';
import { useCouple } from './useCouple';

interface CollaborativeNotesContextType {
  notes: CollaborativeNote[];
  isLoading: boolean;
  error: string | null;
  addNote: (note: Partial<CollaborativeNote>) => Promise<void>;
  updateNote: (noteId: string, updates: Partial<CollaborativeNote>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  refreshNotes: () => void;
  clearError: () => void;
}

const CollaborativeNotesContext = createContext<CollaborativeNotesContextType | undefined>(undefined);

export const CollaborativeNotesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [notes, setNotes] = useState<CollaborativeNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Écouter les notes en temps réel
  useEffect(() => {
    if (!couple || !user) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Se désabonner de l'ancienne subscription
    if (unsubscribe) {
      unsubscribe();
    }

    // S'abonner aux notes collaboratives
    const newUnsubscribe = FirestoreService.subscribeToCollaborativeNotes(
      couple.id,
      (newNotes) => {
        setNotes(newNotes);
        setIsLoading(false);
      }
    );

    setUnsubscribe(() => newUnsubscribe);

    return () => {
      newUnsubscribe();
    };
  }, [couple?.id, user?.uid]);

  // Ajouter une note
  const addNote = async (note: Partial<CollaborativeNote>) => {
    if (!couple || !user) throw new Error('Couple ou utilisateur non disponible');

    try {
      setError(null);
      await FirestoreService.createCollaborativeNote(couple.id, {
        ...note,
        createdBy: user.uid,
        lastEditedBy: user.uid,
        content: note.content || '',
      } as any);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Mettre à jour une note
  const updateNote = async (noteId: string, updates: Partial<CollaborativeNote>) => {
    if (!couple || !user) throw new Error('Couple ou utilisateur non disponible');

    try {
      setError(null);
      await FirestoreService.updateCollaborativeNote(couple.id, noteId, {
        ...updates,
        lastEditedBy: user.uid,
      });
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Supprimer une note
  const deleteNote = async (noteId: string) => {
    if (!couple) throw new Error('Couple non disponible');

    try {
      setError(null);
      await FirestoreService.deleteCollaborativeNote(couple.id, noteId);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Forcer la mise à jour
  const refreshNotes = () => {
    if (couple && user) {
      if (unsubscribe) {
        unsubscribe();
      }
      const newUnsubscribe = FirestoreService.subscribeToCollaborativeNotes(
        couple.id,
        (newNotes) => {
          setNotes(newNotes);
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
    notes,
    isLoading,
    error,
    addNote,
    updateNote,
    deleteNote,
    refreshNotes,
    clearError,
  };

  return <CollaborativeNotesContext.Provider value={value}>{children}</CollaborativeNotesContext.Provider>;
};

export const useCollaborativeNotes = () => {
  const context = useContext(CollaborativeNotesContext);
  if (context === undefined) {
    throw new Error('useCollaborativeNotes must be used within a CollaborativeNotesProvider');
  }
  return context;
};

