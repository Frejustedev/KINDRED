import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { MilestoneService } from '../services/couple/milestone.service';
import { useAuth } from './useAuth';
import { useCouple } from './useCouple';
import { CoupleMilestone, MilestoneType } from '../types';
import { Timestamp } from 'firebase/firestore';

interface MilestonesContextType {
  milestones: CoupleMilestone[];
  isLoading: boolean;
  error: string | null;
  createMilestone: (milestone: Omit<CoupleMilestone, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMilestone: (milestoneId: string, updates: Partial<CoupleMilestone>) => Promise<void>;
  deleteMilestone: (milestoneId: string) => Promise<void>;
  getUpcomingMilestones: (days?: number) => Promise<CoupleMilestone[]>;
  getDaysSince: (milestoneDate: Timestamp) => number;
  getDaysUntil: (milestoneDate: Timestamp) => number;
  getTimeSince: (milestoneDate: Timestamp, unit: 'days' | 'weeks' | 'months' | 'years') => { value: number; unit: string };
  getTimeUntil: (milestoneDate: Timestamp, unit: 'days' | 'weeks' | 'months' | 'years') => { value: number; unit: string };
  refreshMilestones: () => Promise<void>;
  clearError: () => void;
}

const MilestonesContext = createContext<MilestonesContextType | undefined>(undefined);

export const MilestonesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [milestones, setMilestones] = useState<CoupleMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Charger les dates marquantes
  const loadMilestones = async () => {
    console.log('loadMilestones called, couple?.id:', couple?.id);
    if (!couple?.id) {
      console.log('No couple ID, setting milestones to empty');
      setMilestones([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('Calling MilestoneService.getCoupleMilestones with coupleId:', couple.id);
      const milestonesData = await MilestoneService.getCoupleMilestones(couple.id);
      console.log('Milestones loaded successfully:', milestonesData.length, 'milestones');
      setMilestones(milestonesData);
    } catch (error: any) {
      console.error('Error loading milestones:', error);
      setError(error.message);
      setMilestones([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Écouter les changements des dates marquantes en temps réel
  const subscribeToMilestones = () => {
    if (!couple?.id) return;

    try {
      const unsubscribe = MilestoneService.subscribeToMilestones(
        couple.id,
        (milestonesData) => {
          setMilestones(milestonesData);
          setError(null);
        },
        (error) => {
          console.error('Error in milestone subscription:', error);
          setError(error.message);
        }
      );

      setUnsubscribe(() => unsubscribe);
    } catch (error: any) {
      console.error('Error setting up milestone subscription:', error);
      setError(error.message);
    }
  };

  // Créer une nouvelle date marquante
  const createMilestone = async (
    milestone: Omit<CoupleMilestone, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (!couple?.id) throw new Error('Aucun couple actif');

    try {
      setError(null);
      const milestoneId = await MilestoneService.createMilestone(couple.id, milestone);
      return milestoneId;
    } catch (error: any) {
      console.error('Error creating milestone:', error);
      setError(error.message);
      throw error;
    }
  };

  // Mettre à jour une date marquante
  const updateMilestone = async (
    milestoneId: string,
    updates: Partial<CoupleMilestone>
  ): Promise<void> => {
    try {
      setError(null);
      await MilestoneService.updateMilestone(milestoneId, updates);
    } catch (error: any) {
      console.error('Error updating milestone:', error);
      setError(error.message);
      throw error;
    }
  };

  // Supprimer une date marquante
  const deleteMilestone = async (milestoneId: string): Promise<void> => {
    try {
      setError(null);
      await MilestoneService.deleteMilestone(milestoneId);
    } catch (error: any) {
      console.error('Error deleting milestone:', error);
      setError(error.message);
      throw error;
    }
  };

  // Obtenir les dates marquantes à venir
  const getUpcomingMilestones = async (days: number = 30): Promise<CoupleMilestone[]> => {
    if (!couple?.id) throw new Error('Aucun couple actif');

    try {
      return await MilestoneService.getUpcomingMilestones(couple.id, days);
    } catch (error: any) {
      console.error('Error getting upcoming milestones:', error);
      throw error;
    }
  };

  // Calculer le nombre de jours depuis une date marquante
  const getDaysSince = (milestoneDate: Timestamp): number => {
    return MilestoneService.getDaysSince(milestoneDate);
  };

  // Calculer le nombre de jours jusqu'à une date marquante
  const getDaysUntil = (milestoneDate: Timestamp): number => {
    return MilestoneService.getDaysUntil(milestoneDate);
  };

  // Calculer le temps écoulé depuis une date marquante avec différentes unités
  const getTimeSince = (milestoneDate: Timestamp, unit: 'days' | 'weeks' | 'months' | 'years'): { value: number; unit: string } => {
    const daysSince = getDaysSince(milestoneDate);
    
    switch (unit) {
      case 'days':
        return { value: daysSince, unit: 'jour' + (daysSince > 1 ? 's' : '') };
      case 'weeks':
        const weeksSince = Math.floor(daysSince / 7);
        return { value: weeksSince, unit: 'semaine' + (weeksSince > 1 ? 's' : '') };
      case 'months':
        const monthsSince = Math.floor(daysSince / 30.44); // Moyenne des jours par mois
        return { value: monthsSince, unit: 'mois' };
      case 'years':
        const yearsSince = Math.floor(daysSince / 365.25); // Année bissextile
        return { value: yearsSince, unit: 'année' + (yearsSince > 1 ? 's' : '') };
      default:
        return { value: daysSince, unit: 'jour' + (daysSince > 1 ? 's' : '') };
    }
  };

  // Calculer le temps jusqu'à une date marquante avec différentes unités
  const getTimeUntil = (milestoneDate: Timestamp, unit: 'days' | 'weeks' | 'months' | 'years'): { value: number; unit: string } => {
    const daysUntil = getDaysUntil(milestoneDate);
    
    switch (unit) {
      case 'days':
        return { value: daysUntil, unit: 'jour' + (daysUntil > 1 ? 's' : '') };
      case 'weeks':
        const weeksUntil = Math.floor(daysUntil / 7);
        return { value: weeksUntil, unit: 'semaine' + (weeksUntil > 1 ? 's' : '') };
      case 'months':
        const monthsUntil = Math.floor(daysUntil / 30.44);
        return { value: monthsUntil, unit: 'mois' };
      case 'years':
        const yearsUntil = Math.floor(daysUntil / 365.25);
        return { value: yearsUntil, unit: 'année' + (yearsUntil > 1 ? 's' : '') };
      default:
        return { value: daysUntil, unit: 'jour' + (daysUntil > 1 ? 's' : '') };
    }
  };

  // Rafraîchir les dates marquantes
  const refreshMilestones = async () => {
    await loadMilestones();
  };

  // Effacer l'erreur
  const clearError = () => {
    setError(null);
  };

  // Charger les dates marquantes quand le couple change
  useEffect(() => {
    loadMilestones();
  }, [couple?.id]);

  // Écouter les changements en temps réel
  useEffect(() => {
    subscribeToMilestones();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [couple?.id]);

  const value = {
    milestones,
    isLoading,
    error,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    getUpcomingMilestones,
    getDaysSince,
    getDaysUntil,
    getTimeSince,
    getTimeUntil,
    refreshMilestones,
    clearError,
  };

  return (
    <MilestonesContext.Provider value={value}>
      {children}
    </MilestonesContext.Provider>
  );
};

export const useMilestones = () => {
  const context = useContext(MilestonesContext);
  if (context === undefined) {
    throw new Error('useMilestones must be used within a MilestonesProvider');
  }
  return context;
};
