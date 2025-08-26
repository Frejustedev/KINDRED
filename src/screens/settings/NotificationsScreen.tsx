import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { Header } from '../../components/common/Header';
import { useActivityLogs } from '../../hooks/useActivityLogs';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { ActivityLog } from '../../types';

interface NotificationsScreenProps {
  navigation: any;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { activityLogs, isLoading, error, unreadCount, markAsRead, markAllAsRead, deleteActivityLog, refreshActivityLogs } = useActivityLogs();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtrer uniquement les actions du partenaire
  const partnerNotifications = activityLogs.filter(log => log.userId !== user?.uid);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshActivityLogs();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshActivityLogs]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      Alert.alert('Succès', 'Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de marquer toutes les notifications comme lues');
    }
  };

  const handleDeleteNotification = (log: ActivityLog) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteActivityLog(log.id);
              Alert.alert('Succès', 'Notification supprimée avec succès');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la notification');
            }
          }
        },
      ]
    );
  };

  const handleNotificationPress = async (log: ActivityLog) => {
    if (!log.isRead) {
      try {
        await markAsRead(log.id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const getNotificationIcon = (activityType: string) => {
    const icons: { [key: string]: string } = {
      milestone_created: 'calendar',
      milestone_updated: 'create',
      milestone_deleted: 'trash',
      message_sent: 'chatbubble',
      message_received: 'chatbubble-ellipses',
      agenda_event_created: 'calendar',
      agenda_event_updated: 'create',
      agenda_event_deleted: 'trash',
      budget_transaction_added: 'add-circle',
      budget_transaction_updated: 'create-outline',
      budget_transaction_deleted: 'trash-outline',
      capsule_created: 'time',
      capsule_opened: 'open',
      list_created: 'list',
      list_item_added: 'add',
      list_item_completed: 'checkmark-circle',
      list_item_deleted: 'trash-outline',
      note_created: 'document-text',
      note_updated: 'create-outline',
      note_deleted: 'trash-outline',
      profile_updated: 'person',
      settings_changed: 'settings',
      couple_joined: 'person-add',
      couple_left: 'person-remove',
      login: 'log-in',
      logout: 'log-out',
    };

    return icons[activityType] || 'information-circle';
  };

  const getNotificationColor = (activityType: string) => {
    const colorMap: { [key: string]: string } = {
      milestone_created: colors.success,
      milestone_updated: colors.info,
      milestone_deleted: colors.error,
      message_sent: colors.primary,
      message_received: colors.primary,
      agenda_event_created: colors.success,
      agenda_event_updated: colors.info,
      agenda_event_deleted: colors.error,
      budget_transaction_added: colors.success,
      budget_transaction_updated: colors.info,
      budget_transaction_deleted: colors.error,
      capsule_created: colors.warning,
      capsule_opened: colors.warning,
      list_created: colors.success,
      list_item_added: colors.info,
      list_item_completed: colors.success,
      list_item_deleted: colors.error,
      note_created: colors.success,
      note_updated: colors.info,
      note_deleted: colors.error,
      profile_updated: colors.info,
      settings_changed: colors.info,
      couple_joined: colors.success,
      couple_left: colors.error,
      login: colors.success,
      logout: colors.error,
    };

    return colorMap[activityType] || colors.secondary;
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const renderNotification = (log: ActivityLog) => (
    <TouchableOpacity
      key={log.id}
      style={[
        styles.notificationCard,
        !log.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(log)}
      onLongPress={() => handleDeleteNotification(log)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationHeader}>
        <View style={[styles.notificationIcon, { backgroundColor: getNotificationColor(log.activityType) + '20' }]}>
          <Ionicons 
            name={getNotificationIcon(log.activityType) as any} 
            size={20} 
            color={getNotificationColor(log.activityType)} 
          />
        </View>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationDescription} numberOfLines={2}>
            {log.description}
          </Text>
          <Text style={styles.notificationTimestamp}>
            {formatTimestamp(log.timestamp)}
          </Text>
        </View>
        <View style={styles.notificationActions}>
          {!log.isRead && (
            <View style={styles.unreadIndicator} />
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteNotification(log)}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const unreadPartnerNotifications = partnerNotifications.filter(log => !log.isRead).length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Notifications système"
          icon="notifications"
          subtitle={`${unreadPartnerNotifications} non lue(s)`}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Notifications"
        icon="notifications"
        subtitle={`${unreadPartnerNotifications} non lue(s)`}
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: "checkmark-done",
          onPress: handleMarkAllAsRead,
          disabled: unreadPartnerNotifications === 0
        }}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {partnerNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyDescription}>
              Les actions de votre partenaire apparaîtront ici
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsContainer}>
            {partnerNotifications.map(renderNotification)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  notificationsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  notificationCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...colors.shadow,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  deleteButton: {
    padding: 4,
  },
});
