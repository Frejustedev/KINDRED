import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { UserProfile } from '../../types';

export interface CoupleInvitation {
  id: string;
  fromUserId: string;
  fromUserEmail: string;
  toUserEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  expiresAt: string;
  coupleId?: string;
  pin?: string;
  readAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  toUserId?: string;
}

export class CoupleNotificationService {
  private static readonly COLLECTION = 'couple_invitations';

  // Créer une invitation de couple
  static async createInvitation(
    fromUserId: string,
    fromUserEmail: string,
    toUserEmail: string,
    pin: string
  ): Promise<string> {
    try {
      const invitationId = `${fromUserId}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

      const invitation: CoupleInvitation = {
        id: invitationId,
        fromUserId,
        fromUserEmail: fromUserEmail.toLowerCase(),
        toUserEmail: toUserEmail.toLowerCase(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        pin,
      };

      await setDoc(doc(db, this.COLLECTION, invitationId), invitation);

      // Envoyer une notification push (si configurée)
      await this.sendPushNotification(toUserEmail, {
        title: '💕 Invitation de couple',
        body: `${fromUserEmail} souhaite créer un couple avec vous !`,
        data: {
          type: 'couple_invitation',
          invitationId,
        },
      });

      return invitationId;
    } catch (error) {
      console.error('Error creating couple invitation:', error);
      throw new Error('Erreur lors de la création de l\'invitation');
    }
  }

  // Accepter une invitation
  static async acceptInvitation(
    invitationId: string,
    toUserId: string
  ): Promise<void> {
    try {
      const invitationRef = doc(db, this.COLLECTION, invitationId);
      const invitationSnap = await getDoc(invitationRef);

      if (!invitationSnap.exists()) {
        throw new Error('Invitation non trouvée');
      }

      const invitation = invitationSnap.data() as CoupleInvitation;

      if (invitation.status !== 'pending') {
        throw new Error('Cette invitation a déjà été traitée');
      }

      // Vérifier l'expiration
      if (new Date() > new Date(invitation.expiresAt)) {
        throw new Error('Cette invitation a expiré');
      }

      // Mettre à jour le statut
      await updateDoc(invitationRef, {
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        toUserId,
      });

      // Notifier l'expéditeur
      await this.sendPushNotification(invitation.fromUserEmail, {
        title: '🎉 Invitation acceptée !',
        body: 'Votre partenaire a accepté votre invitation de couple !',
        data: {
          type: 'couple_invitation_accepted',
          invitationId,
        },
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  // Refuser une invitation
  static async declineInvitation(invitationId: string): Promise<void> {
    try {
      const invitationRef = doc(db, this.COLLECTION, invitationId);
      const invitationSnap = await getDoc(invitationRef);

      if (!invitationSnap.exists()) {
        throw new Error('Invitation non trouvée');
      }

      const invitation = invitationSnap.data() as CoupleInvitation;

      await updateDoc(invitationRef, {
        status: 'declined',
        declinedAt: new Date().toISOString(),
      });

      // Notifier l'expéditeur
      await this.sendPushNotification(invitation.fromUserEmail, {
        title: 'Invitation refusée',
        body: 'Votre invitation de couple a été refusée',
        data: {
          type: 'couple_invitation_declined',
          invitationId,
        },
      });
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }
  }

  // Obtenir les invitations en attente pour un utilisateur
  static async getPendingInvitations(userEmail: string): Promise<CoupleInvitation[]> {
    try {
      const invitationsRef = collection(db, this.COLLECTION);
      const q = query(
        invitationsRef,
        where('toUserEmail', '==', userEmail.toLowerCase()),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const invitations: CoupleInvitation[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as CoupleInvitation;
        // Vérifier l'expiration
        if (new Date() <= new Date(data.expiresAt)) {
          invitations.push({
            ...data,
            id: doc.id,
          });
        }
      });

      return invitations;
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      return [];
    }
  }

  // Obtenir les invitations envoyées par un utilisateur
  static async getSentInvitations(userId: string): Promise<CoupleInvitation[]> {
    try {
      const invitationsRef = collection(db, this.COLLECTION);
      const q = query(
        invitationsRef,
        where('fromUserId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const invitations: CoupleInvitation[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as CoupleInvitation;
        invitations.push({
          ...data,
          id: doc.id,
        });
      });

      return invitations;
    } catch (error) {
      console.error('Error getting sent invitations:', error);
      return [];
    }
  }

  // Obtenir une invitation spécifique
  static async getInvitation(invitationId: string): Promise<CoupleInvitation | null> {
    try {
      const invitationRef = doc(db, this.COLLECTION, invitationId);
      const invitationSnap = await getDoc(invitationRef);

      if (!invitationSnap.exists()) {
        return null;
      }

      return {
        ...invitationSnap.data() as CoupleInvitation,
        id: invitationSnap.id,
      };
    } catch (error) {
      console.error('Error getting invitation:', error);
      return null;
    }
  }

  // Vérifier si un utilisateur a des invitations en attente
  static async hasPendingInvitations(userEmail: string): Promise<boolean> {
    try {
      const invitations = await this.getPendingInvitations(userEmail);
      return invitations.length > 0;
    } catch (error) {
      console.error('Error checking pending invitations:', error);
      return false;
    }
  }

  // Marquer une invitation comme lue
  static async markAsRead(invitationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION, invitationId), {
        readAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error marking invitation as read:', error);
    }
  }

  // Marquer toutes les invitations d'un utilisateur comme lues
  static async markAllAsRead(userEmail: string): Promise<void> {
    try {
      const invitations = await this.getPendingInvitations(userEmail);
      const batch = writeBatch(db);

      invitations.forEach((invitation) => {
        const invitationRef = doc(db, this.COLLECTION, invitation.id);
        batch.update(invitationRef, {
          readAt: new Date().toISOString(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all invitations as read:', error);
    }
  }

  // Supprimer une invitation expirée
  static async deleteExpiredInvitation(invitationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION, invitationId));
    } catch (error) {
      console.error('Error deleting expired invitation:', error);
    }
  }

  // Nettoyer toutes les invitations expirées
  static async cleanupExpiredInvitations(): Promise<void> {
    try {
      const invitationsRef = collection(db, this.COLLECTION);
      const q = query(
        invitationsRef,
        where('status', '==', 'pending'),
        where('expiresAt', '<', new Date().toISOString())
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleaned up ${snapshot.size} expired invitations`);
    } catch (error) {
      console.error('Error cleaning up expired invitations:', error);
    }
  }

  // Obtenir les statistiques des invitations
  static async getInvitationStats(userId: string): Promise<{
    sent: number;
    received: number;
    pending: number;
    accepted: number;
    declined: number;
  }> {
    try {
      const sentInvitations = await this.getSentInvitations(userId);
      const receivedInvitations = await this.getPendingInvitations(userId);

      const stats = {
        sent: sentInvitations.length,
        received: receivedInvitations.length,
        pending: 0,
        accepted: 0,
        declined: 0,
      };

      // Compter les statuts des invitations envoyées
      sentInvitations.forEach((invitation) => {
        switch (invitation.status) {
          case 'pending':
            stats.pending++;
            break;
          case 'accepted':
            stats.accepted++;
            break;
          case 'declined':
            stats.declined++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting invitation stats:', error);
      return {
        sent: 0,
        received: 0,
        pending: 0,
        accepted: 0,
        declined: 0,
      };
    }
  }

  // Envoyer une notification push
  private static async sendPushNotification(
    userEmail: string,
    notification: {
      title: string;
      body: string;
      data?: any;
    }
  ): Promise<void> {
    try {
      // Ici, vous pourriez intégrer avec un service de notifications push
      // comme Firebase Cloud Messaging ou Expo Notifications
      console.log('Push notification would be sent to:', userEmail, notification);
      
      // Pour l'instant, on simule l'envoi
      // En production, vous utiliseriez :
      // - Firebase Cloud Messaging
      // - Expo Notifications
      // - Un service tiers comme OneSignal
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
}
