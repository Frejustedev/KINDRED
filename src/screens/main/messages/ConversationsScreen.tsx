import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { Input } from '../../../components/common/Input';
import { useMessages } from '../../../hooks/useMessages';
import { useAuth } from '../../../hooks/useAuth';
import { useCouple } from '../../../hooks/useCouple';
import { AuthService } from '../../../services/firebase/auth.service';

interface ConversationsScreenProps {
  navigation: any;
  route: any;
}

interface TopicItem {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isMain: boolean;
}

export const ConversationsScreen: React.FC<ConversationsScreenProps> = ({ navigation }) => {
  const { availableTopics, addTopic, updateTopic, deleteTopic, clearTopicMessages, conversationsInfo, refreshConversations } = useMessages();
  const { user } = useAuth();
  const { couple } = useCouple();
  const [partnerInfo, setPartnerInfo] = useState<{ name: string; email: string; lastSeen?: Date; isOnline?: boolean } | null>(null);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showEditTopic, setShowEditTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [editingTopic, setEditingTopic] = useState<string>('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [isEditingTopic, setIsEditingTopic] = useState(false);

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
                 name: partnerProfile.firstName || partnerProfile.email?.split('@')[0] || 'Partenaire',
                 email: partnerProfile.email || 'Email inconnu',
                 lastSeen: partnerProfile.lastSeen ? new Date(partnerProfile.lastSeen.toDate()) : undefined,
                 isOnline: false // À implémenter plus tard avec la logique de présence
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

  // Forcer la mise à jour des conversations quand l'écran devient actif
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshConversations();
    });

    return unsubscribe;
  }, [navigation, refreshConversations]);

  const handleAddTopic = async () => {
    if (!newTopicName.trim()) return;

    try {
      setIsAddingTopic(true);
      // Capitaliser la première lettre et mettre le reste en minuscule
      const formattedName = newTopicName.trim().charAt(0).toUpperCase() + newTopicName.trim().slice(1).toLowerCase();
      await addTopic(formattedName);
      setNewTopicName('');
      setShowAddTopic(false);
      Alert.alert('Succès', 'Nouvelle conversation créée !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setIsAddingTopic(false);
    }
  };

  const handleEditTopic = async () => {
    if (!newTopicName.trim()) return;

    try {
      setIsEditingTopic(true);
      // Capitaliser la première lettre et mettre le reste en minuscule
      const formattedName = newTopicName.trim().charAt(0).toUpperCase() + newTopicName.trim().slice(1).toLowerCase();
      await updateTopic(editingTopic, formattedName);
      setNewTopicName('');
      setEditingTopic('');
      setShowEditTopic(false);
      Alert.alert('Succès', 'Conversation modifiée !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setIsEditingTopic(false);
    }
  };

  const handleDeleteTopic = (topicName: string) => {
    if (topicName === 'Principal') {
      Alert.alert('Erreur', 'Le topic principal ne peut pas être supprimé');
      return;
    }

    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer la conversation "${topicName}" ?\n\nTous les messages seront déplacés vers le topic principal.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTopic(topicName);
              Alert.alert('Succès', 'Conversation supprimée !');
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const handleClearMessages = (topicId: string, displayName: string) => {
    Alert.alert(
      'Effacer tous les messages',
      `Êtes-vous sûr de vouloir effacer tous les messages de "${displayName}" ?\n\nCette action est irréversible et supprimera définitivement tous les messages.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearTopicMessages(topicId);
              Alert.alert('Succès', 'Tous les messages ont été effacés');
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible d\'effacer les messages');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (topicName: string) => {
    setEditingTopic(topicName);
    setNewTopicName(topicName);
    setShowEditTopic(true);
  };

  const handleTopicPress = (topic: string) => {
    navigation.navigate('Chat', { topic });
  };

  const getPartnerStatus = () => {
    if (!partnerInfo) return '';
    
    if (partnerInfo.isOnline) {
      return 'En ligne';
    }
    
    if (partnerInfo.lastSeen) {
      const now = new Date();
      const lastSeen = partnerInfo.lastSeen;
      const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) {
        return 'Vu à l\'instant';
      } else if (diffInMinutes < 60) {
        return `Vu il y a ${diffInMinutes}min`;
      } else if (diffInMinutes < 1440) { // 24h
        const hours = Math.floor(diffInMinutes / 60);
        return `Vu il y a ${hours}h`;
      } else {
        return lastSeen.toLocaleDateString('fr-FR', { 
          day: '2-digit', 
          month: '2-digit' 
        });
      }
    }
    
    return 'Hors ligne';
  };

  const renderTopicItem = ({ item }: { item: TopicItem }) => (
    <View style={styles.topicItem}>
      <TouchableOpacity
        style={styles.topicContent}
        onPress={() => handleTopicPress(item.name === 'Principal' ? 'général' : item.name)}
      >
        <View style={styles.topicAvatar}>
          <Text style={styles.topicAvatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.topicInfo}>
          <View style={styles.topicHeader}>
            <Text style={styles.topicName}>{item.name}</Text>
            {item.lastMessageTime && (
              <Text style={styles.topicTime}>{item.lastMessageTime}</Text>
            )}
          </View>
          
          <Text 
            style={styles.topicLastMessage}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.lastMessage || 'Aucun message'}
          </Text>
        </View>
        
        {item.unreadCount && item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.topicActions}>
        {item.isMain ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleClearMessages(item.id, item.name)}
          >
            <Ionicons name="trash-outline" size={16} color={colors.warning} />
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openEditModal(item.id)}
            >
              <Ionicons name="pencil" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteTopic(item.id)}
            >
              <Ionicons name="trash" size={16} color={colors.error} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  const getTopicsList = (): TopicItem[] => {
    const topics: TopicItem[] = [];
    
    conversationsInfo.forEach(conv => {
      const isMain = conv.topic === 'général';
      const displayName = isMain ? 'Principal' : conv.topic.charAt(0).toUpperCase() + conv.topic.slice(1).toLowerCase();
      
      // Formater l'heure du dernier message
      let timeString = 'Aucun message';
      if (conv.lastMessageTime) {
        const now = new Date();
        const messageTime = new Date(conv.lastMessageTime);
        const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) {
          timeString = 'Maintenant';
        } else if (diffInMinutes < 60) {
          timeString = `Il y a ${diffInMinutes}min`;
        } else if (diffInMinutes < 1440) { // 24h
          const hours = Math.floor(diffInMinutes / 60);
          timeString = `Il y a ${hours}h`;
        } else {
          timeString = messageTime.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit' 
          });
        }
      }
      
      topics.push({
        id: conv.topic,
        name: displayName,
        lastMessage: conv.lastMessage,
        lastMessageTime: timeString,
        unreadCount: conv.unreadCount,
        isMain,
      });
    });
    
    return topics;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>💬</Text>
      <Text style={styles.emptyStateTitle}>Aucune conversation</Text>
      <Text style={styles.emptyStateText}>
        Commencez par créer votre première conversation !
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête personnalisé avec gradient, icône et sous-titre */}
      <LinearGradient
        colors={['#8B5CF6', '#EC4899', '#F472B6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.6, 1]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerInfo}>
            <View style={styles.titleContainer}>
              <Ionicons name="chatbubbles" size={22} color={colors.textOnPrimary} />
              <Text style={styles.headerTitle}>Conversations</Text>
            </View>
                         {partnerInfo && (
               <View style={styles.partnerInfoContainer}>
                 <Text style={styles.headerSubtitle}>
                   Avec {partnerInfo.name}
                   <Text style={styles.partnerStatus}> • {getPartnerStatus()}</Text>
                 </Text>
               </View>
             )}
          </View>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddTopic(true)}
          >
                         <Ionicons name="add" size={22} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Liste des conversations */}
      <FlatList
        data={getTopicsList()}
        renderItem={renderTopicItem}
        keyExtractor={(item) => item.id}
        style={styles.topicsList}
        contentContainerStyle={styles.topicsContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Section Capsules Temporelles */}
      <View style={styles.capsulesSection}>
        <View style={styles.capsulesHeader}>
          <View style={styles.capsulesTitleContainer}>
            <Ionicons name="time" size={20} color={colors.primary} />
            <Text style={styles.capsulesTitle}>Capsules Temporelles</Text>
          </View>
          <TouchableOpacity
            style={styles.capsulesButton}
            onPress={() => navigation.navigate('Capsules')}
          >
            <Text style={styles.capsulesButtonText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.capsuleCard}
          onPress={() => navigation.navigate('Capsules')}
        >
          <View style={styles.capsuleIcon}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.capsuleInfo}>
            <Text style={styles.capsuleTitle}>Créer une capsule</Text>
            <Text style={styles.capsuleDescription}>
              Envoyez un message qui s'ouvrira plus tard
            </Text>
          </View>
          <View style={styles.capsuleArrow}>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal pour ajouter une nouvelle conversation */}
      {showAddTopic && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouvelle conversation</Text>
            <Input
              placeholder="Nom de la conversation..."
              value={newTopicName}
              onChangeText={setNewTopicName}
              style={styles.modalInput}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowAddTopic(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAddTopic}
                disabled={!newTopicName.trim() || isAddingTopic}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  {isAddingTopic ? 'Création...' : 'Créer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal pour modifier une conversation */}
      {showEditTopic && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier la conversation</Text>
            <Input
              placeholder="Nouveau nom de la conversation..."
              value={newTopicName}
              onChangeText={setNewTopicName}
              style={styles.modalInput}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowEditTopic(false);
                  setEditingTopic('');
                  setNewTopicName('');
                }}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleEditTopic}
                disabled={!newTopicName.trim() || isEditingTopic}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  {isEditingTopic ? 'Modification...' : 'Modifier'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 35,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textOnPrimary,
    opacity: 0.8,
    marginLeft: 30, // Aligné avec le texte du titre
  },
  partnerInfoContainer: {
    marginLeft: 30, // Aligné avec le texte du titre
  },
  partnerStatus: {
    fontSize: 11,
    color: colors.textOnPrimary,
    opacity: 0.7,
    fontWeight: '300',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicsList: {
    flex: 1,
  },
  topicsContent: {
    paddingVertical: 8,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topicContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topicAvatarText: {
    fontSize: 20,
    color: colors.textOnPrimary,
  },
  topicInfo: {
    flex: 1,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  topicTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  topicLastMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    fontSize: 12,
    color: colors.textOnPrimary,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: colors.textOnPrimary,
  },
  // Styles pour les capsules temporelles
  capsulesSection: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  capsulesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  capsulesTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  capsulesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  capsulesButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 16,
  },
  capsulesButtonText: {
    fontSize: 12,
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  capsuleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  capsuleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  capsuleInfo: {
    flex: 1,
  },
  capsuleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  capsuleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  capsuleArrow: {
    padding: 8,
  },
});
