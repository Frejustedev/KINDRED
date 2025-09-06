import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadowStyles } from '../../../constants/colors';
import { useAuth } from '../../../hooks/useAuth';
import { useCouple } from '../../../hooks/useCouple';
import { useMessages } from '../../../hooks/useMessages';
import { Message } from '../../../types';
import { AuthService } from '../../../services/firebase/auth.service';

interface MessagesScreenProps {
  navigation: any;
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const { currentTopicMessages, availableTopics, currentTopic, setCurrentTopic } = useMessages();
  const [unreadCount, setUnreadCount] = useState(0);
  const [partnerInfo, setPartnerInfo] = useState<{ name: string; email: string } | null>(null);

  // Récupérer les informations du partenaire
  useEffect(() => {
    const loadPartnerInfo = async () => {
      if (couple && couple.users && user) {
        const partnerId = couple.users.find(id => id !== user.uid);
        if (partnerId) {
          try {
            const partnerProfile = await AuthService.getUserProfile(partnerId);
            if (partnerProfile) {
              setPartnerInfo({
                name: partnerProfile.firstName || 'Partenaire',
                email: partnerProfile.email || 'Email inconnu'
              });
            }
          } catch (error) {
            console.error('Error loading partner info:', error);
          }
        }
      }
    };

    loadPartnerInfo();
  }, [couple, user]);

  // Calculer le nombre de messages non lus
  useEffect(() => {
    if (currentTopicMessages && user) {
      const unread = currentTopicMessages.filter(msg => !msg.read && msg.senderId !== user.uid).length;
      setUnreadCount(unread);
    }
  }, [currentTopicMessages, user]);

  const getTopicIcon = (topic: string) => {
    switch (topic) {
      case 'général':
        return '💬';
      case 'voyage':
        return '✈️';
      case 'budget':
        return '💰';
      case 'surprises':
        return '🎁';
      default:
        return '💬';
    }
  };

  const getTopicColor = (topic: string) => {
    switch (topic) {
      case 'général':
        return colors.primary;
      case 'voyage':
        return colors.info;
      case 'budget':
        return colors.success;
      case 'surprises':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  const getLastMessage = (topic: string) => {
    const topicMessages = currentTopicMessages.filter(msg => msg.topic === topic);
    if (topicMessages.length === 0) return null;
    
    // Trier par timestamp et prendre le plus récent
    const sortedMessages = topicMessages.sort((a, b) => {
      const timeA = a.timestamp?.toDate?.() || new Date();
      const timeB = b.timestamp?.toDate?.() || new Date();
      return timeB.getTime() - timeA.getTime();
    });
    
    return sortedMessages[0];
  };

  const getUnreadCountForTopic = (topic: string) => {
    if (!user) return 0;
    return currentTopicMessages.filter(msg => 
      msg.topic === topic && 
      !msg.read && 
      msg.senderId !== user.uid
    ).length;
  };

  const renderTopicCard = (topic: string) => {
    const lastMessage = getLastMessage(topic);
    const unreadCount = getUnreadCountForTopic(topic);
    
    const lastMessageTime = lastMessage?.timestamp?.toDate?.() || new Date();
    const timeString = lastMessageTime.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return (
      <TouchableOpacity
        key={topic}
        style={styles.topicCard}
        onPress={() => {
          setCurrentTopic(topic);
          navigation.navigate('Chat');
        }}
      >
        <View style={styles.topicHeader}>
          <View style={[styles.topicIcon, { backgroundColor: getTopicColor(topic) }]}>
            <Text style={styles.topicIconText}>{getTopicIcon(topic)}</Text>
          </View>
          
          <View style={styles.topicInfo}>
            <Text style={styles.topicName}>{topic}</Text>
            {lastMessage && (
              <Text style={styles.lastMessageTime}>📅 {timeString}</Text>
            )}
          </View>
          
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{unreadCount}</Text>
            </View>
          )}
        </View>
        
        {lastMessage ? (
          <Text 
            style={styles.lastMessage} 
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {lastMessage.content}
          </Text>
        ) : (
          <Text style={styles.noMessage}>Aucun message</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderQuickAction = (action: { icon: string; title: string; onPress: () => void }) => (
    <TouchableOpacity
      key={action.title}
      style={styles.quickAction}
      onPress={action.onPress}
    >
      <Text style={styles.quickActionIcon}>{action.icon}</Text>
      <Text style={styles.quickActionTitle}>{action.title}</Text>
    </TouchableOpacity>
  );

  const quickActions = [
    {
      icon: '💬',
      title: 'Nouveau message',
      onPress: () => {
        setCurrentTopic('général');
        navigation.navigate('Chat');
      }
    },
    {
      icon: '📷',
      title: 'Partager photo',
      onPress: () => {
        setCurrentTopic('général');
        navigation.navigate('Chat');
      }
    },
    {
      icon: '🎁',
      title: 'Surprise',
      onPress: () => {
        setCurrentTopic('surprises');
        navigation.navigate('Chat');
      }
    },
    {
      icon: '💰',
      title: 'Budget',
      onPress: () => {
        setCurrentTopic('budget');
        navigation.navigate('Chat');
      }
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header avec gradient */}
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>💬 Messages</Text>
              <Text style={styles.headerSubtitle}>
                {partnerInfo ? `Avec ${partnerInfo.name}` : 'Avec votre partenaire'}
              </Text>
              <Text style={styles.headerStatus}>
                {unreadCount > 0 ? `${unreadCount} message(s) non lu(s)` : 'Tous les messages lus'}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => {
                setCurrentTopic(null);
                navigation.navigate('Chat');
              }}
            >
              <Text style={styles.chatButtonText}>💬</Text>
        </TouchableOpacity>
      </View>
        </LinearGradient>

        {/* Actions rapides */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Topics */}
        <View style={styles.topicsSection}>
          <Text style={styles.sectionTitle}>Conversations</Text>
          
          {availableTopics.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>💬</Text>
              <Text style={styles.emptyStateTitle}>Aucune conversation</Text>
              <Text style={styles.emptyStateText}>
                Commencez à discuter avec votre partenaire !
          </Text>
            </View>
          ) : (
            <View style={styles.topicsList}>
              {availableTopics.map(renderTopicCard)}
            </View>
          )}
        </View>

        {/* Statistiques */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
                              <Text style={styles.statNumber}>{currentTopicMessages.length}</Text>
              <Text style={styles.statLabel}>Messages totaux</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{unreadCount}</Text>
              <Text style={styles.statLabel}>Non lus</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{availableTopics.length}</Text>
              <Text style={styles.statLabel}>Topics</Text>
            </View>
        </View>
      </View>
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
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textOnPrimary,
    opacity: 0.9,
    marginBottom: 2,
  },
  headerStatus: {
    fontSize: 14,
    color: colors.textOnPrimary,
    opacity: 0.7,
  },
  chatButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButtonText: {
    fontSize: 24,
  },
  quickActionsSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...shadowStyles,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  topicsSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  topicsList: {
    gap: 16,
  },
  topicCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    ...shadowStyles,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  topicIconText: {
    fontSize: 24,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  lastMessageTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  unreadBadge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  noMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  statsSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...shadowStyles,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
