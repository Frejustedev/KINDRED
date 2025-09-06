import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  limit, 
  onSnapshot,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ActivityLog, ActivityType } from '../../types';
import { NotificationService } from '../notifications/notification.service';

const COLLECTION = 'ActivityLogs';

export class ActivityLogService {
  // Créer un nouveau log d'activité
  static async createActivityLog(
    coupleId: string,
    userId: string,
    userName: string,
    activityType: ActivityType,
    description: string,
    details?: { [key: string]: any }
  ): Promise<string> {
    try {
      const activityLog: Omit<ActivityLog, 'id'> = {
        coupleId,
        userId,
        userName,
        activityType,
        description,
        details,
        timestamp: Timestamp.now(),
        isRead: false,
        notificationSent: false,
      };

      const docRef = await addDoc(collection(db, COLLECTION), activityLog);
      
      // Envoyer une notification au partenaire
      await this.sendActivityNotification(coupleId, userId, activityType, description);
      
      // Marquer comme notification envoyée
      await updateDoc(doc(db, COLLECTION, docRef.id), {
        notificationSent: true
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating activity log:', error);
      throw error;
    }
  }

  // Récupérer tous les logs d'activité d'un couple
  static async getCoupleActivityLogs(coupleId: string, limitCount: number = 50): Promise<ActivityLog[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('coupleId', '==', coupleId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const logs: ActivityLog[] = [];

      querySnapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data()
        } as ActivityLog);
      });

      return logs;
    } catch (error) {
      console.error('Error getting couple activity logs:', error);
      throw error;
    }
  }

  // Écouter les logs d'activité en temps réel
  static subscribeToActivityLogs(
    coupleId: string,
    onUpdate: (logs: ActivityLog[]) => void,
    onError: (error: Error) => void,
    limitCount: number = 50
  ): () => void {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('coupleId', '==', coupleId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const logs: ActivityLog[] = [];
          querySnapshot.forEach((doc) => {
            logs.push({
              id: doc.id,
              ...doc.data()
            } as ActivityLog);
          });
          onUpdate(logs);
        },
        (error) => {
          console.error('Error in activity logs subscription:', error);
          onError(error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up activity logs subscription:', error);
      onError(error as Error);
      return () => {};
    }
  }

  // Marquer un log comme lu
  static async markAsRead(logId: string): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTION, logId), {
        isRead: true
      });
    } catch (error) {
      console.error('Error marking activity log as read:', error);
      throw error;
    }
  }

  // Marquer tous les logs d'un couple comme lus
  static async markAllAsRead(coupleId: string): Promise<void> {
    try {
      const logs = await this.getCoupleActivityLogs(coupleId, 1000);
      const unreadLogs = logs.filter(log => !log.isRead);
      
      const updatePromises = unreadLogs.map(log => 
        updateDoc(doc(db, COLLECTION, log.id), { isRead: true })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all activity logs as read:', error);
      throw error;
    }
  }

  // Supprimer un log d'activité
  static async deleteActivityLog(logId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION, logId));
    } catch (error) {
      console.error('Error deleting activity log:', error);
      throw error;
    }
  }

  // Supprimer tous les logs d'un couple (nettoyage)
  static async deleteCoupleActivityLogs(coupleId: string): Promise<void> {
    try {
      const logs = await this.getCoupleActivityLogs(coupleId, 1000);
      const deletePromises = logs.map(log => 
        deleteDoc(doc(db, COLLECTION, log.id))
      );
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting couple activity logs:', error);
      throw error;
    }
  }

  // Envoyer une notification pour une activité
  private static async sendActivityNotification(
    coupleId: string,
    userId: string,
    activityType: ActivityType,
    description: string
  ): Promise<void> {
    try {
      // Récupérer les informations du couple pour envoyer la notification au partenaire
      // Cette logique dépendra de votre structure de données
      
      const notificationTitle = this.getNotificationTitle(activityType);
      const notificationBody = description;

      await NotificationService.scheduleLocalNotification(
        notificationTitle,
        notificationBody,
        {
          type: 'activity_log',
          activityType,
          coupleId,
          userId
        },
        {
          date: new Date(Date.now() + 1000), // Notification immédiate
          type: 'date' as any
        }
      );
    } catch (error) {
      console.error('Error sending activity notification:', error);
      // Ne pas faire échouer la création du log si la notification échoue
    }
  }

  // Obtenir le titre de notification selon le type d'activité
  private static getNotificationTitle(activityType: ActivityType): string {
    const titles: Record<ActivityType, string> = {
      milestone_created: 'Nouvelle date marquante',
      milestone_updated: 'Date marquante modifiée',
      milestone_deleted: 'Date marquante supprimée',
      message_sent: 'Nouveau message',
      message_received: 'Message reçu',
      agenda_event_created: 'Nouvel événement',
      agenda_event_updated: 'Événement modifié',
      agenda_event_deleted: 'Événement supprimé',
      budget_transaction_added: 'Nouvelle transaction',
      budget_transaction_updated: 'Transaction modifiée',
      budget_transaction_deleted: 'Transaction supprimée',
      capsule_created: 'Nouvelle capsule temporelle',
      capsule_opened: 'Capsule ouverte',
      list_created: 'Nouvelle liste',
      list_item_added: 'Élément ajouté',
      list_item_completed: 'Élément terminé',
      list_item_deleted: 'Élément supprimé',
      note_created: 'Nouvelle note',
      note_updated: 'Note modifiée',
      note_deleted: 'Note supprimée',
      profile_updated: 'Profil mis à jour',
      settings_changed: 'Paramètres modifiés',
      couple_joined: 'Nouveau membre',
      couple_left: 'Membre parti',
      couple_dissolved: 'Couple dissous',
      couple_invitation_sent: 'Invitation envoyée',
      couple_invitation_accepted: 'Invitation acceptée',
      couple_invitation_rejected: 'Invitation refusée',
      login: 'Connexion',
      logout: 'Déconnexion'
    };

    return titles[activityType] || 'Nouvelle activité';
  }

  // Méthodes utilitaires pour créer des logs spécifiques
  static async logMilestoneCreated(
    coupleId: string,
    userId: string,
    userName: string,
    milestoneTitle: string
  ): Promise<string> {
    return this.createActivityLog(
      coupleId,
      userId,
      userName,
      'milestone_created',
      `${userName} a créé une nouvelle date marquante : ${milestoneTitle}`,
      { milestoneTitle }
    );
  }

  static async logMilestoneUpdated(
    coupleId: string,
    userId: string,
    userName: string,
    milestoneTitle: string
  ): Promise<string> {
    return this.createActivityLog(
      coupleId,
      userId,
      userName,
      'milestone_updated',
      `${userName} a modifié la date marquante : ${milestoneTitle}`,
      { milestoneTitle }
    );
  }

  static async logMilestoneDeleted(
    coupleId: string,
    userId: string,
    userName: string,
    milestoneTitle: string
  ): Promise<string> {
    return this.createActivityLog(
      coupleId,
      userId,
      userName,
      'milestone_deleted',
      `${userName} a supprimé la date marquante : ${milestoneTitle}`,
      { milestoneTitle }
    );
  }

  static async logMessageSent(
    coupleId: string,
    userId: string,
    userName: string,
    messageContent: string
  ): Promise<string> {
    return this.createActivityLog(
      coupleId,
      userId,
      userName,
      'message_sent',
      `${userName} a envoyé un message`,
      { messageContent: messageContent.substring(0, 50) + '...' }
    );
  }

  static async logBudgetTransaction(
    coupleId: string,
    userId: string,
    userName: string,
    transactionTitle: string,
    amount: number,
    type: 'added' | 'updated' | 'deleted'
  ): Promise<string> {
    const activityType = `budget_transaction_${type}` as ActivityType;
    const action = type === 'added' ? 'ajouté' : type === 'updated' ? 'modifié' : 'supprimé';
    
    return this.createActivityLog(
      coupleId,
      userId,
      userName,
      activityType,
      `${userName} a ${action} une transaction : ${transactionTitle} (${amount}€)`,
      { transactionTitle, amount, type }
    );
  }

  static async logCapsuleCreated(
    coupleId: string,
    userId: string,
    userName: string,
    openDate: Date
  ): Promise<string> {
    return this.createActivityLog(
      coupleId,
      userId,
      userName,
      'capsule_created',
      `${userName} a créé une capsule temporelle pour le ${openDate.toLocaleDateString('fr-FR')}`,
      { openDate: openDate.toISOString() }
    );
  }

  static async logCapsuleOpened(
    coupleId: string,
    userId: string,
    userName: string
  ): Promise<string> {
    return this.createActivityLog(
      coupleId,
      userId,
      userName,
      'capsule_opened',
      `${userName} a ouvert une capsule temporelle`,
      {}
    );
  }

  static async logListActivity(
    coupleId: string,
    userId: string,
    userName: string,
    listTitle: string,
    action: 'created' | 'item_added' | 'item_completed' | 'item_deleted'
  ): Promise<string> {
    const activityType = action === 'created' ? 'list_created' : `list_item_${action.split('_')[1]}` as ActivityType;
    const actionText = action === 'created' ? 'créé' : 
                      action === 'item_added' ? 'ajouté un élément à' :
                      action === 'item_completed' ? 'terminé un élément de' :
                      'supprimé un élément de';

    return this.createActivityLog(
      coupleId,
      userId,
      userName,
      activityType,
      `${userName} a ${actionText} la liste : ${listTitle}`,
      { listTitle, action }
    );
  }

  static async logNoteActivity(
    coupleId: string,
    userId: string,
    userName: string,
    noteTitle: string,
    action: 'created' | 'updated' | 'deleted'
  ): Promise<string> {
    const activityType = `note_${action}` as ActivityType;
    const actionText = action === 'created' ? 'créé' : action === 'updated' ? 'modifié' : 'supprimé';

    return this.createActivityLog(
      coupleId,
      userId,
      userName,
      activityType,
      `${userName} a ${actionText} la note : ${noteTitle}`,
      { noteTitle, action }
    );
  }

  static async logProfileUpdate(
    coupleId: string,
    userId: string,
    userName: string,
    fieldUpdated: string
  ): Promise<string> {
    return this.createActivityLog(
      coupleId,
      userId,
      userName,
      'profile_updated',
      `${userName} a mis à jour son profil (${fieldUpdated})`,
      { fieldUpdated }
    );
  }

  static async logSettingsChange(
    coupleId: string,
    userId: string,
    userName: string,
    settingChanged: string
  ): Promise<string> {
    return this.createActivityLog(
      coupleId,
      userId,
      userName,
      'settings_changed',
      `${userName} a modifié les paramètres (${settingChanged})`,
      { settingChanged }
    );
  }

  static async logAgendaEventCreated(
    coupleId: string,
    userId: string,
    userName: string,
    eventTitle: string
  ): Promise<string> {
    return this.createActivityLog(
      coupleId,
      userId,
      userName,
      'agenda_event_created',
      `${userName} a créé un événement : ${eventTitle}`,
      { eventTitle }
    );
  }

  static async logAgendaEventUpdated(
    coupleId: string,
    userId: string,
    userName: string,
    eventTitle: string
  ): Promise<string> {
    return this.createActivityLog(
      coupleId,
      userId,
      userName,
      'agenda_event_updated',
      `${userName} a modifié un événement : ${eventTitle}`,
      { eventTitle }
    );
  }

  static async logAgendaEventDeleted(
    coupleId: string,
    userId: string,
    userName: string,
    eventTitle: string
  ): Promise<string> {
    return this.createActivityLog(
      coupleId,
      userId,
      userName,
      'agenda_event_deleted',
      `${userName} a supprimé un événement : ${eventTitle}`,
      { eventTitle }
    );
  }
}
