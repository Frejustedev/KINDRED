import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { NotificationService } from '../services/notifications/notification.service';
import { useAuth } from './useAuth';

interface NotificationsContextType {
  isNotificationsEnabled: boolean;
  notificationToken: string | null;
  requestPermissions: () => Promise<boolean>;
  saveNotificationToken: () => Promise<void>;
  clearBadge: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [notificationToken, setNotificationToken] = useState<string | null>(null);

  // Configurer les notifications au démarrage
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Configurer le service de notifications
        const configured = await NotificationService.configure();
        if (configured) {
          setIsNotificationsEnabled(true);
          
          // Obtenir le token de notification
          const token = await NotificationService.getToken();
          if (token) {
            setNotificationToken(token);
          }
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();
  }, []);

  // Sauvegarder le token quand l'utilisateur se connecte
  useEffect(() => {
    const saveToken = async () => {
      if (user && notificationToken) {
        try {
          await NotificationService.saveUserNotificationToken(user.uid, notificationToken);
        } catch (error) {
          console.error('Error saving notification token:', error);
        }
      }
    };

    saveToken();
  }, [user, notificationToken]);

  // Écouter les notifications reçues
  useEffect(() => {
    const notificationListener = NotificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification reçue:', notification);
        
        // Gérer les différents types de notifications
        const { type, coupleId, topic } = notification.request.content.data || {};
        
        if (type === 'message') {
          // Navigation vers le chat si nécessaire
          console.log('Nouveau message reçu pour le couple:', coupleId, 'topic:', topic);
        }
      }
    );

    // Écouter les notifications ouvertes
    const responseListener = NotificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification ouverte:', response);
        
        // Gérer la navigation basée sur le type de notification
        const { type, coupleId, topic } = response.notification.request.content.data || {};
        
        if (type === 'message') {
          // Navigation vers le chat
          console.log('Navigation vers le chat pour le couple:', coupleId, 'topic:', topic);
        }
      }
    );

    return () => {
      NotificationService.removeNotificationSubscription(notificationListener);
      NotificationService.removeNotificationSubscription(responseListener);
    };
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const granted = await NotificationService.requestPermissions();
      setIsNotificationsEnabled(granted);
      
      if (granted) {
        const token = await NotificationService.getToken();
        if (token) {
          setNotificationToken(token);
        }
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  const saveNotificationToken = async (): Promise<void> => {
    if (user && notificationToken) {
      await NotificationService.saveUserNotificationToken(user.uid, notificationToken);
    }
  };

  const clearBadge = async (): Promise<void> => {
    try {
      await NotificationService.setBadgeCount(0);
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  };

  const value = {
    isNotificationsEnabled,
    notificationToken,
    requestPermissions,
    saveNotificationToken,
    clearBadge,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
