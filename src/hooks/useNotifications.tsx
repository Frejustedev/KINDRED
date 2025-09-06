import { useState, useEffect, useCallback } from 'react';
import { CoupleNotificationService, CoupleInvitation } from '../services/notifications/couple-notification.service';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const { user } = useAuth();
  const [pendingInvitations, setPendingInvitations] = useState<CoupleInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<CoupleInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Charger les invitations en attente
  const loadPendingInvitations = useCallback(async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      setError(null);
      const invitations = await CoupleNotificationService.getPendingInvitations(user.email);
      setPendingInvitations(invitations);
      
      // Compter les invitations non lues
      const unread = invitations.filter(inv => !inv.readAt).length;
      setUnreadCount(unread);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des invitations');
      console.error('Error loading pending invitations:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  // Charger les invitations envoyées
  const loadSentInvitations = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);
      const invitations = await CoupleNotificationService.getSentInvitations(user.uid);
      setSentInvitations(invitations);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des invitations envoyées');
      console.error('Error loading sent invitations:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Accepter une invitation
  const acceptInvitation = useCallback(async (invitationId: string) => {
    if (!user?.uid) return false;

    try {
      setError(null);
      await CoupleNotificationService.acceptInvitation(invitationId, user.uid);
      
      // Recharger les invitations
      await loadPendingInvitations();
      return true;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'acceptation de l\'invitation');
      console.error('Error accepting invitation:', err);
      return false;
    }
  }, [user?.uid, loadPendingInvitations]);

  // Refuser une invitation
  const declineInvitation = useCallback(async (invitationId: string) => {
    try {
      setError(null);
      await CoupleNotificationService.declineInvitation(invitationId);
      
      // Recharger les invitations
      await loadPendingInvitations();
      return true;
    } catch (err: any) {
      setError(err.message || 'Erreur lors du refus de l\'invitation');
      console.error('Error declining invitation:', err);
      return false;
    }
  }, [loadPendingInvitations]);

  // Marquer une invitation comme lue
  const markAsRead = useCallback(async (invitationId: string) => {
    try {
      await CoupleNotificationService.markAsRead(invitationId);
      
      // Mettre à jour l'état local
      setPendingInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, readAt: new Date().toISOString() }
            : inv
        )
      );
      
      // Mettre à jour le compteur
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error marking invitation as read:', err);
    }
  }, []);

  // Marquer toutes les invitations comme lues
  const markAllAsRead = useCallback(async () => {
    if (!user?.email) return;

    try {
      await CoupleNotificationService.markAllAsRead(user.email);
      
      // Mettre à jour l'état local
      setPendingInvitations(prev => 
        prev.map(inv => ({ ...inv, readAt: new Date().toISOString() }))
      );
      
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Error marking all invitations as read:', err);
    }
  }, [user?.email]);

  // Vérifier s'il y a des invitations en attente
  const hasPendingInvitations = useCallback(async (): Promise<boolean> => {
    if (!user?.email) return false;

    try {
      return await CoupleNotificationService.hasPendingInvitations(user.email);
    } catch (err: any) {
      console.error('Error checking pending invitations:', err);
      return false;
    }
  }, [user?.email]);

  // Obtenir les statistiques des invitations
  const getInvitationStats = useCallback(async () => {
    if (!user?.uid) return null;

    try {
      return await CoupleNotificationService.getInvitationStats(user.uid);
    } catch (err: any) {
      console.error('Error getting invitation stats:', err);
      return null;
    }
  }, [user?.uid]);

  // Nettoyer les invitations expirées
  const cleanupExpiredInvitations = useCallback(async () => {
    try {
      await CoupleNotificationService.cleanupExpiredInvitations();
      // Recharger les invitations après nettoyage
      await loadPendingInvitations();
    } catch (err: any) {
      console.error('Error cleaning up expired invitations:', err);
    }
  }, [loadPendingInvitations]);

  // Charger les données au montage et quand l'utilisateur change
  useEffect(() => {
    if (user?.email) {
      loadPendingInvitations();
    }
  }, [user?.email, loadPendingInvitations]);

  useEffect(() => {
    if (user?.uid) {
      loadSentInvitations();
    }
  }, [user?.uid, loadSentInvitations]);

  // Nettoyer les invitations expirées périodiquement
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupExpiredInvitations, 24 * 60 * 60 * 1000); // 24h

    return () => clearInterval(cleanupInterval);
  }, [cleanupExpiredInvitations]);

  return {
    // État
    pendingInvitations,
    sentInvitations,
    loading,
    error,
    unreadCount,
    
    // Actions
    loadPendingInvitations,
    loadSentInvitations,
    acceptInvitation,
    declineInvitation,
    markAsRead,
    markAllAsRead,
    hasPendingInvitations,
    getInvitationStats,
    cleanupExpiredInvitations,
    
    // Utilitaires
    clearError: () => setError(null),
  };
};
