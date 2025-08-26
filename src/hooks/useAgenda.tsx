import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { AgendaEvent } from '../types';
import { FirestoreService } from '../services/firebase/firestore.service';
import { useAuth } from './useAuth';
import { useCouple } from './useCouple';

interface AgendaContextType {
  events: AgendaEvent[];
  isLoading: boolean;
  error: string | null;
  addEvent: (event: Partial<AgendaEvent>) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<AgendaEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  refreshEvents: () => void;
  clearError: () => void;
}

const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

export const AgendaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Écouter les événements en temps réel
  useEffect(() => {
    if (!couple || !user) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Se désabonner de l'ancienne subscription
    if (unsubscribe) {
      unsubscribe();
    }

    // S'abonner aux événements
    const newUnsubscribe = FirestoreService.subscribeToEvents(
      couple.id,
      (newEvents) => {
        setEvents(newEvents);
        setIsLoading(false);
      }
    );

    setUnsubscribe(() => newUnsubscribe);

    return () => {
      newUnsubscribe();
    };
  }, [couple?.id, user?.uid]);

  // Ajouter un événement
  const addEvent = async (event: Partial<AgendaEvent>) => {
    if (!couple || !user) throw new Error('Couple ou utilisateur non disponible');

    try {
      setError(null);
      await FirestoreService.createAgendaEvent(couple.id, {
        ...event,
        createdBy: user.uid,
      } as any);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Mettre à jour un événement
  const updateEvent = async (eventId: string, updates: Partial<AgendaEvent>) => {
    if (!couple) throw new Error('Couple non disponible');

    try {
      setError(null);
      await FirestoreService.updateAgendaEvent(couple.id, eventId, updates);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Supprimer un événement
  const deleteEvent = async (eventId: string) => {
    if (!couple) throw new Error('Couple non disponible');

    try {
      setError(null);
      await FirestoreService.deleteAgendaEvent(couple.id, eventId);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Forcer la mise à jour
  const refreshEvents = () => {
    if (couple && user) {
      if (unsubscribe) {
        unsubscribe();
      }
      const newUnsubscribe = FirestoreService.subscribeToEvents(
        couple.id,
        (newEvents) => {
          setEvents(newEvents);
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
    events,
    isLoading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
    clearError,
  };

  return <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>;
};

export const useAgenda = () => {
  const context = useContext(AgendaContext);
  if (context === undefined) {
    throw new Error('useAgenda must be used within an AgendaProvider');
  }
  return context;
};
