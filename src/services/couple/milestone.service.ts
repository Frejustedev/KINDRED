import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { CoupleMilestone, MilestoneType } from '../../types';
// Import dynamique pour éviter le cycle de dépendances
// import { NotificationService } from '../notifications/notification.service';
// import { ActivityLogService } from '../activity/activity-log.service';

export class MilestoneService {
  private static COLLECTION = 'CoupleMilestones';

  // Créer une nouvelle date marquante
  static async createMilestone(
    coupleId: string,
    milestone: Omit<CoupleMilestone, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const milestoneData = {
        ...milestone,
        coupleId: coupleId, // Ajouter explicitement le coupleId
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), milestoneData);
      
      // Programmer les notifications si activées
      if (milestone.notifications) {
        await this.scheduleMilestoneNotifications(docRef.id, milestone);
      }

      // Créer un log d'activité
      try {
        const { ActivityLogService } = await import('../activity/activity-log.service');
        
        // Récupérer le nom de l'utilisateur
        let userName = 'Utilisateur';
        if (milestone.createdBy && milestone.createdBy !== 'unknown') {
          try {
            const userDoc = await getDoc(doc(db, 'users', milestone.createdBy));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userName = userData.firstName || userData.email?.split('@')[0] || 'Utilisateur';
            }
          } catch (error) {
            console.error('Error getting user name:', error);
          }
        }
        
        await ActivityLogService.logMilestoneCreated(
          coupleId,
          milestone.createdBy || 'unknown',
          userName,
          milestone.title
        );
      } catch (error) {
        console.error('Error creating activity log:', error);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw new Error('Impossible de créer la date marquante');
    }
  }

  // Récupérer toutes les dates marquantes d'un couple
  static async getCoupleMilestones(coupleId: string): Promise<CoupleMilestone[]> {
    try {
      console.log('Getting milestones for coupleId:', coupleId);
      const q = query(
        collection(db, this.COLLECTION),
        where('coupleId', '==', coupleId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Milestones query result:', querySnapshot.docs.length, 'documents');
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CoupleMilestone[];
    } catch (error) {
      console.error('Error getting milestones:', error);
      console.error('Error details:', error);
      throw new Error('Impossible de récupérer les dates marquantes');
    }
  }

  // Récupérer une date marquante spécifique
  static async getMilestone(milestoneId: string): Promise<CoupleMilestone> {
    try {
      const docSnap = await getDoc(doc(db, this.COLLECTION, milestoneId));
      if (!docSnap.exists()) {
        throw new Error('Date marquante non trouvée');
      }
      return { id: docSnap.id, ...docSnap.data() } as CoupleMilestone;
    } catch (error) {
      console.error('Error getting milestone:', error);
      throw new Error('Impossible de récupérer la date marquante');
    }
  }

  // Mettre à jour une date marquante
  static async updateMilestone(
    milestoneId: string,
    updates: Partial<CoupleMilestone>
  ): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, this.COLLECTION, milestoneId), updateData);

      // Mettre à jour les notifications si nécessaire
      if (updates.notifications !== undefined || updates.reminderDays !== undefined) {
        const milestone = await this.getMilestone(milestoneId);
        if (milestone.notifications) {
          await this.scheduleMilestoneNotifications(milestoneId, milestone);
        } else {
          await this.cancelMilestoneNotifications(milestoneId);
        }
      }

      // Créer un log d'activité
      try {
        const { ActivityLogService } = await import('../activity/activity-log.service');
        const milestone = await this.getMilestone(milestoneId);
        
        // Récupérer le nom de l'utilisateur
        let userName = 'Utilisateur';
        if (milestone.createdBy && milestone.createdBy !== 'unknown') {
          try {
            const userDoc = await getDoc(doc(db, 'users', milestone.createdBy));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userName = userData.firstName || userData.email?.split('@')[0] || 'Utilisateur';
            }
          } catch (error) {
            console.error('Error getting user name:', error);
          }
        }
        
        await ActivityLogService.logMilestoneUpdated(
          milestone.coupleId,
          milestone.createdBy || 'unknown',
          userName,
          milestone.title
        );
      } catch (error) {
        console.error('Error creating activity log:', error);
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
      throw new Error('Impossible de mettre à jour la date marquante');
    }
  }

  // Supprimer une date marquante
  static async deleteMilestone(milestoneId: string): Promise<void> {
    try {
      // Récupérer les informations de la milestone avant suppression
      const milestone = await this.getMilestone(milestoneId);
      
      await deleteDoc(doc(db, this.COLLECTION, milestoneId));
      
      // Annuler les notifications associées
      await this.cancelMilestoneNotifications(milestoneId);

      // Créer un log d'activité
      try {
        const { ActivityLogService } = await import('../activity/activity-log.service');
        
        // Récupérer le nom de l'utilisateur
        let userName = 'Utilisateur';
        if (milestone.createdBy && milestone.createdBy !== 'unknown') {
          try {
            const userDoc = await getDoc(doc(db, 'users', milestone.createdBy));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userName = userData.firstName || userData.email?.split('@')[0] || 'Utilisateur';
            }
          } catch (error) {
            console.error('Error getting user name:', error);
          }
        }
        
        await ActivityLogService.logMilestoneDeleted(
          milestone.coupleId,
          milestone.createdBy || 'unknown',
          userName,
          milestone.title
        );
      } catch (error) {
        console.error('Error creating activity log:', error);
      }
    } catch (error) {
      console.error('Error deleting milestone:', error);
      throw new Error('Impossible de supprimer la date marquante');
    }
  }

  // Écouter les changements des dates marquantes en temps réel
  static subscribeToMilestones(
    coupleId: string,
    onUpdate: (milestones: CoupleMilestone[]) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('coupleId', '==', coupleId),
        orderBy('date', 'desc')
      );

      return onSnapshot(q, 
        (querySnapshot) => {
          const milestones = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as CoupleMilestone[];
          onUpdate(milestones);
        },
        (error) => {
          console.error('Error subscribing to milestones:', error);
          onError(error);
        }
      );
    } catch (error) {
      console.error('Error setting up milestone subscription:', error);
      onError(error as Error);
      return () => {};
    }
  }

  // Calculer le nombre de jours depuis une date marquante
  static getDaysSince(milestoneDate: Timestamp): number {
    const now = new Date();
    const milestone = milestoneDate.toDate();
    const diffTime = Math.abs(now.getTime() - milestone.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Calculer le nombre de jours jusqu'à une date marquante
  static getDaysUntil(milestoneDate: Timestamp): number {
    const now = new Date();
    const milestone = milestoneDate.toDate();
    const diffTime = milestone.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Obtenir les dates marquantes à venir (dans les 30 prochains jours)
  static async getUpcomingMilestones(coupleId: string, days: number = 30): Promise<CoupleMilestone[]> {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + days);

      const q = query(
        collection(db, this.COLLECTION),
        where('coupleId', '==', coupleId),
        where('date', '>=', Timestamp.fromDate(now)),
        where('date', '<=', Timestamp.fromDate(futureDate)),
        orderBy('date', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CoupleMilestone[];
    } catch (error) {
      console.error('Error getting upcoming milestones:', error);
      throw new Error('Impossible de récupérer les dates marquantes à venir');
    }
  }

  // Programmer les notifications pour une date marquante
  private static async scheduleMilestoneNotifications(
    milestoneId: string,
    milestone: CoupleMilestone
  ): Promise<void> {
    try {
      // Import dynamique pour éviter le cycle de dépendances
      const { NotificationService } = await import('../notifications/notification.service');
      
      const milestoneDate = milestone.date.toDate();
      const reminderDate = new Date(milestoneDate);
      reminderDate.setDate(reminderDate.getDate() - milestone.reminderDays);

             // Notification de rappel
       if (milestone.reminderDays > 0) {
         await NotificationService.scheduleLocalNotification(
           `Rappel : ${milestone.title}`,
           `Dans ${milestone.reminderDays} jour(s), ce sera ${milestone.title}`,
           {
             type: 'milestone_reminder',
             milestoneId: milestoneId,
           },
           {
             type: 'date' as any,
             date: reminderDate,
           }
         );
       }

       // Notification du jour même
       await NotificationService.scheduleLocalNotification(
         `🎉 ${milestone.title}`,
         `Aujourd'hui, c'est ${milestone.title} !`,
         {
           type: 'milestone_day',
           milestoneId: milestoneId,
         },
         {
           type: 'date' as any,
           date: milestoneDate,
         }
       );
    } catch (error) {
      console.error('Error scheduling milestone notifications:', error);
    }
  }

  // Annuler les notifications pour une date marquante
  private static async cancelMilestoneNotifications(milestoneId: string): Promise<void> {
    try {
      // Import dynamique pour éviter le cycle de dépendances
      const { NotificationService } = await import('../notifications/notification.service');
      
      await NotificationService.cancelNotification(`milestone_reminder_${milestoneId}`);
      await NotificationService.cancelNotification(`milestone_day_${milestoneId}`);
    } catch (error) {
      console.error('Error canceling milestone notifications:', error);
    }
  }

  // Créer automatiquement la date d'installation de l'app
  static async createAppInstallationMilestone(
    coupleId: string,
    userId: string,
    installationDate: Date
  ): Promise<string> {
    const milestone: Omit<CoupleMilestone, 'id' | 'createdAt' | 'updatedAt'> = {
      title: 'Installation de Kindred',
      description: 'Le jour où nous avons installé Kindred pour notre couple',
      date: Timestamp.fromDate(installationDate),
      type: 'app_installation',
      isRecurring: true,
      notifications: true,
      reminderDays: 7,
      color: '#6366f1',
      icon: 'phone-portrait',
      createdBy: userId,
      coupleId: coupleId,
    };

    return this.createMilestone(coupleId, milestone);
  }

  // Obtenir les informations d'un type de date marquante
  static getMilestoneTypeInfo(type: MilestoneType): {
    title: string;
    description: string;
    icon: string;
    color: string;
    isRecurring: boolean;
  } {
    const types = {
      first_meeting: {
        title: 'Première rencontre',
        description: 'Le jour où nous nous sommes rencontrés pour la première fois',
        icon: 'heart-outline',
        color: '#ef4444',
        isRecurring: true,
      },
      first_date: {
        title: 'Premier rendez-vous',
        description: 'Notre premier rendez-vous romantique',
        icon: 'calendar-outline',
        color: '#f97316',
        isRecurring: true,
      },
      official_relationship: {
        title: 'Début de relation',
        description: 'Le jour où nous sommes devenus officiellement en couple',
        icon: 'heart',
        color: '#ec4899',
        isRecurring: true,
      },
      engagement: {
        title: 'Fiançailles',
        description: 'Le jour de nos fiançailles',
        icon: 'diamond-outline',
        color: '#8b5cf6',
        isRecurring: true,
      },
      wedding: {
        title: 'Mariage',
        description: 'Le jour de notre mariage',
        icon: 'business-outline',
        color: '#06b6d4',
        isRecurring: true,
      },
      civil_wedding: {
        title: 'Mariage civil',
        description: 'Le jour de notre mariage civil',
        icon: 'business-outline',
        color: '#06b6d4',
        isRecurring: true,
      },
      religious_wedding: {
        title: 'Mariage religieux',
        description: 'Le jour de notre mariage religieux',
        icon: 'business-outline',
        color: '#8b5cf6',
        isRecurring: true,
      },
      traditional_wedding: {
        title: 'Mariage traditionnel',
        description: 'Le jour de notre mariage traditionnel',
        icon: 'people-outline',
        color: '#f59e0b',
        isRecurring: true,
      },
      app_installation: {
        title: 'Installation de Kindred',
        description: 'Le jour où nous avons installé Kindred',
        icon: 'phone-portrait',
        color: '#6366f1',
        isRecurring: true,
      },
      moving_in: {
        title: 'Déménagement ensemble',
        description: 'Le jour où nous avons emménagé ensemble',
        icon: 'home-outline',
        color: '#10b981',
        isRecurring: true,
      },
      first_travel: {
        title: 'Premier voyage',
        description: 'Notre premier voyage ensemble',
        icon: 'airplane-outline',
        color: '#f59e0b',
        isRecurring: true,
      },
      pregnancy_announcement: {
        title: 'Annonce de grossesse',
        description: 'Le jour où nous avons annoncé la grossesse',
        icon: 'medical-outline',
        color: '#ec4899',
        isRecurring: true,
      },
      child_birth: {
        title: 'Naissance',
        description: 'Le jour de la naissance de notre enfant',
        icon: 'medical-outline',
        color: '#06b6d4',
        isRecurring: true,
      },
      custom: {
        title: 'Date personnalisée',
        description: 'Une date importante pour nous',
        icon: 'star-outline',
        color: '#8b5cf6',
        isRecurring: true,
      },
    };

    return types[type];
  }
}
