import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { ActivityLogService } from '../services/activity/activity-log.service';
import { useAuth } from './useAuth';
import { useCouple } from './useCouple';
import { ActivityLog, ActivityType } from '../types';

interface ActivityLogsContextType {
  activityLogs: ActivityLog[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  createActivityLog: (activityType: ActivityType, description: string, details?: { [key: string]: any }) => Promise<string>;
  markAsRead: (logId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteActivityLog: (logId: string) => Promise<void>;
  refreshActivityLogs: () => Promise<void>;
  clearError: () => void;
}

const ActivityLogsContext = createContext<ActivityLogsContextType | undefined>(undefined);

export const ActivityLogsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { couple } = useCouple();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Charger les logs d'activité
  const loadActivityLogs = async () => {
    if (!couple?.id) {
      setActivityLogs([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const logsData = await ActivityLogService.getCoupleActivityLogs(couple.id);
      setActivityLogs(logsData);
    } catch (error: any) {
      console.error('Error loading activity logs:', error);
      setError(error.message);
      setActivityLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Écouter les changements des logs d'activité en temps réel
  const subscribeToActivityLogs = () => {
    if (!couple?.id) return;

    try {
      const unsubscribe = ActivityLogService.subscribeToActivityLogs(
        couple.id,
        (logsData) => {
          setActivityLogs(logsData);
          setError(null);
        },
        (error) => {
          console.error('Error in activity logs subscription:', error);
          setError(error.message);
        }
      );

      setUnsubscribe(() => unsubscribe);
    } catch (error: any) {
      console.error('Error setting up activity logs subscription:', error);
      setError(error.message);
    }
  };

  // Créer un nouveau log d'activité
  const createActivityLog = async (
    activityType: ActivityType,
    description: string,
    details?: { [key: string]: any }
  ): Promise<string> => {
    if (!couple?.id || !user?.uid || !profile?.firstName) {
      throw new Error('Informations utilisateur manquantes');
    }

    try {
      setError(null);
      const logId = await ActivityLogService.createActivityLog(
        couple.id,
        user.uid,
        profile.firstName,
        activityType,
        description,
        details
      );
      return logId;
    } catch (error: any) {
      console.error('Error creating activity log:', error);
      setError(error.message);
      throw error;
    }
  };

  // Marquer un log comme lu
  const markAsRead = async (logId: string): Promise<void> => {
    try {
      setError(null);
      await ActivityLogService.markAsRead(logId);
    } catch (error: any) {
      console.error('Error marking activity log as read:', error);
      setError(error.message);
      throw error;
    }
  };

  // Marquer tous les logs comme lus
  const markAllAsRead = async (): Promise<void> => {
    if (!couple?.id) return;

    try {
      setError(null);
      await ActivityLogService.markAllAsRead(couple.id);
    } catch (error: any) {
      console.error('Error marking all activity logs as read:', error);
      setError(error.message);
      throw error;
    }
  };

  // Supprimer un log d'activité
  const deleteActivityLog = async (logId: string): Promise<void> => {
    try {
      setError(null);
      await ActivityLogService.deleteActivityLog(logId);
    } catch (error: any) {
      console.error('Error deleting activity log:', error);
      setError(error.message);
      throw error;
    }
  };

  // Rafraîchir les logs d'activité
  const refreshActivityLogs = async () => {
    await loadActivityLogs();
  };

  // Effacer l'erreur
  const clearError = () => {
    setError(null);
  };

  // Calculer le nombre de logs non lus
  const unreadCount = activityLogs.filter(log => !log.isRead).length;

  // Charger les logs d'activité quand le couple change
  useEffect(() => {
    loadActivityLogs();
  }, [couple?.id]);

  // Écouter les changements en temps réel
  useEffect(() => {
    subscribeToActivityLogs();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [couple?.id]);

  const value = {
    activityLogs,
    isLoading,
    error,
    unreadCount,
    createActivityLog,
    markAsRead,
    markAllAsRead,
    deleteActivityLog,
    refreshActivityLogs,
    clearError,
  };

  return (
    <ActivityLogsContext.Provider value={value}>
      {children}
    </ActivityLogsContext.Provider>
  );
};

export const useActivityLogs = () => {
  const context = useContext(ActivityLogsContext);
  if (context === undefined) {
    throw new Error('useActivityLogs must be used within an ActivityLogsProvider');
  }
  return context;
};
