import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirestoreService } from '../firebase/firestore.service';

export class NotificationService {
  private static readonly STORAGE_KEY = '@kindred/notification_token';

  // Configuration des notifications
  static async configure() {
    // Configurer le handler de notifications (SDK 53+)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        // Remplace shouldShowAlert déprécié par les nouveaux indicateurs iOS
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Demander les permissions
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Permissions de notification non accordées');
        return false;
      }
    }

    return true;
  }

  // Obtenir le token de notification
  static async getToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) return null;

      // Désactiver les notifications push dans Expo Go pour éviter les erreurs
      console.log('Notifications push désactivées en mode développement');
      return null;

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'kindred-app-8aa97', // Project ID Firebase
      });

      // Sauvegarder le token
      await AsyncStorage.setItem(this.STORAGE_KEY, token.data);
      
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // Envoyer une notification locale
  static async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: trigger || null, // Immédiat si pas de trigger
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw new Error('Impossible de programmer la notification');
    }
  }

  // Notification de message reçu
  static async notifyNewMessage(
    senderName: string,
    messagePreview: string,
    coupleId: string,
    topic?: string
  ): Promise<void> {
    try {
      await this.scheduleLocalNotificationWithCustomSound(
        `💬 ${senderName}`,
        messagePreview,
        { 
          type: 'message', 
          coupleId,
          topic: topic || 'général',
          timestamp: new Date().toISOString()
        },
        null, // Notification immédiate
        'notification.wav' // Son personnalisé
      );
    } catch (error) {
      console.error('Error notifying new message:', error);
    }
  }

  // Notification avec son personnalisé
  static async scheduleLocalNotificationWithCustomSound(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput,
    sound?: string
  ): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: sound || 'notification.wav', // Son personnalisé par défaut
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 250, 250, 250], // Vibration personnalisée
        },
        trigger: trigger || null,
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling notification with custom sound:', error);
      throw new Error('Impossible de programmer la notification');
    }
  }

  // Notification d'événement à venir
  static async scheduleEventReminder(
    eventTitle: string,
    eventDate: Date,
    reminderMinutes: number = 15
  ): Promise<string> {
    try {
      const triggerDate = new Date(eventDate.getTime() - reminderMinutes * 60 * 1000);
      
      return await this.scheduleLocalNotification(
        '📅 Rappel événement',
        `${eventTitle} dans ${reminderMinutes} minutes`,
        { type: 'event_reminder', eventTitle },
        {
          type: 'date' as any,
          date: triggerDate,
        }
      );
    } catch (error) {
      console.error('Error scheduling event reminder:', error);
      throw error;
    }
  }

  // Notification de capsule temporelle
  static async scheduleCapsuleNotification(
    capsuleId: string,
    openDate: Date
  ): Promise<string> {
    try {
      return await this.scheduleLocalNotification(
        '⏰ Capsule temporelle',
        'Une capsule temporelle est prête à être ouverte !',
        { type: 'capsule', capsuleId },
        {
          type: 'date' as any,
          date: openDate,
        }
      );
    } catch (error) {
      console.error('Error scheduling capsule notification:', error);
      throw error;
    }
  }

  // Notification de rappel quotidien
  static async scheduleDailyReminder(
    hour: number = 20,
    minute: number = 0
  ): Promise<string> {
    try {
      return await this.scheduleLocalNotification(
        '💕 Rappel quotidien',
        'Prenez le temps de partager un moment avec votre partenaire',
        { type: 'daily_reminder' },
        {
          type: 'calendar' as any,
          hour,
          minute,
          repeats: true,
        }
      );
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
      throw error;
    }
  }

  // Annuler le rappel quotidien
  static async cancelDailyReminder(): Promise<void> {
    try {
      // Récupérer toutes les notifications programmées
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      // Trouver et annuler les rappels quotidiens
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.type === 'daily_reminder') {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error canceling daily reminder:', error);
      throw error;
    }
  }

  // Annuler une notification
  static async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  // Annuler toutes les notifications
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  // Obtenir les notifications programmées
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Configurer les badges
  static async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  // Effacer le badge
  static async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  }

  // Obtenir le nombre de badges
  static async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  // Écouter les notifications reçues
  static addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Écouter les notifications ouvertes
  static addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Supprimer un listener
  static removeNotificationSubscription(
    subscription: Notifications.Subscription
  ): void {
    subscription.remove();
  }

  // Vérifier si les notifications sont activées
  static async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  // Demander les permissions de notification
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Envoyer une notification push via Firebase
  static async sendPushNotification(
    targetUserId: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      // Récupérer le token de notification de l'utilisateur cible
      const userToken = await this.getUserNotificationToken(targetUserId);
      
      if (!userToken) {
        console.log('Token de notification non trouvé pour l\'utilisateur:', targetUserId);
        return;
      }

      // Envoyer la notification via Firebase Cloud Messaging
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${process.env.EXPO_PUBLIC_FCM_SERVER_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userToken,
          notification: {
            title,
            body,
            sound: 'notification.wav',
            badge: 1,
          },
          data: {
            ...data,
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          },
          priority: 'high',
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur FCM: ${response.status}`);
      }

      console.log('Notification push envoyée avec succès');
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Récupérer le token de notification d'un utilisateur
  private static async getUserNotificationToken(userId: string): Promise<string | null> {
    try {
      return await FirestoreService.getNotificationToken(userId);
    } catch (error) {
      console.error('Error getting user notification token:', error);
      return null;
    }
  }

  // Sauvegarder le token de notification d'un utilisateur
  static async saveUserNotificationToken(userId: string, token: string): Promise<void> {
    try {
      const deviceInfo = {
        platform: Platform.OS,
        version: Platform.Version.toString(),
      };
      
      await FirestoreService.saveNotificationToken(userId, token, deviceInfo);
      console.log('Token de notification sauvegardé pour l\'utilisateur:', userId);
    } catch (error) {
      console.error('Error saving user notification token:', error);
    }
  }
}
