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
import { colors, shadowStyles } from '../../constants/colors';
import { Header } from '../../components/common/Header';
import { useActivityLogs } from '../../hooks/useActivityLogs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityLog } from '../../types';

interface ActivityLogsScreenProps {
  navigation: any;
}

export const ActivityLogsScreen: React.FC<ActivityLogsScreenProps> = ({ navigation }) => {
  const { activityLogs, isLoading, error, unreadCount, markAsRead, markAllAsRead, deleteActivityLog, refreshActivityLogs } = useActivityLogs();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshActivityLogs();
    } catch (error) {
      console.error('Error refreshing activity logs:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshActivityLogs]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      Alert.alert('Succès', 'Tous les logs ont été marqués comme lus');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de marquer tous les logs comme lus');
    }
  };

  const handleDeleteLog = (log: ActivityLog) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer ce log d\'activité ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteActivityLog(log.id);
              Alert.alert('Succès', 'Log supprimé avec succès');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le log');
            }
          }
        },
      ]
    );
  };

  const handleLogPress = async (log: ActivityLog) => {
    if (!log.isRead) {
      try {
        await markAsRead(log.id);
      } catch (error) {
        console.error('Error marking log as read:', error);
      }
    }
  };

  const getActivityIcon = (activityType: string) => {
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

  const getActivityColor = (activityType: string) => {
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

  const renderActivityLog = (log: ActivityLog) => (
    <TouchableOpacity
      key={log.id}
      style={[
        styles.logCard,
        !log.isRead && styles.unreadLog
      ]}
      onPress={() => handleLogPress(log)}
      onLongPress={() => handleDeleteLog(log)}
      activeOpacity={0.7}
    >
      <View style={styles.logHeader}>
        <View style={[styles.activityIcon, { backgroundColor: getActivityColor(log.activityType) + '20' }]}>
          <Ionicons 
            name={getActivityIcon(log.activityType) as any} 
            size={20} 
            color={getActivityColor(log.activityType)} 
          />
        </View>
        <View style={styles.logInfo}>
          <Text style={styles.logDescription} numberOfLines={2}>
            {log.description}
          </Text>
          <Text style={styles.logTimestamp}>
            {formatTimestamp(log.timestamp)}
          </Text>
        </View>
        <View style={styles.logActions}>
          {!log.isRead && (
            <View style={styles.unreadIndicator} />
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteLog(log)}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Logs d'activité"
          icon="list"
          subtitle={`${unreadCount} non lu(s)`}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des logs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Logs d'activité"
        icon="list"
        subtitle={`${unreadCount} non lu(s)`}
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: "checkmark-done",
          onPress: handleMarkAllAsRead,
          disabled: unreadCount === 0
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

        {activityLogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucun log d'activité</Text>
            <Text style={styles.emptyDescription}>
              Les actions effectuées dans l'application apparaîtront ici
            </Text>
          </View>
        ) : (
          <View style={styles.logsContainer}>
            {activityLogs.map(renderActivityLog)}
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
  logsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...shadowStyles,
  },
  unreadLog: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logInfo: {
    flex: 1,
  },
  logDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  logTimestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  logActions: {
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
