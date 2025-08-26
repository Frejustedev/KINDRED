import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../constants/colors';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { useMessages } from '../../../hooks/useMessages';
import { useAuth } from '../../../hooks/useAuth';
import { useCouple } from '../../../hooks/useCouple';
import { Message } from '../../../types';
import { AuthService } from '../../../services/firebase/auth.service';
import { FirestoreService } from '../../../services/firebase/firestore.service';

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ChatScreenProps {
  navigation: any;
  route: any;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { 
    currentTopicMessages, 
    sendMessage, 
    currentTopic, 
    setCurrentTopic, 
    availableTopics, 
    isLoading,
    isTyping,
    setIsTyping,
    typingUsers
  } = useMessages();
  const { user } = useAuth();
  const { couple } = useCouple();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<{ name: string; email: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [favoriteMessages, setFavoriteMessages] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fonctions de recherche et filtres
  const filterMessages = () => {
    let filtered = currentTopicMessages;

    // Filtre par recherche textuelle
    if (searchQuery.trim()) {
      filtered = filtered.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par favoris
    if (showFavoritesOnly) {
      filtered = filtered.filter(msg => favoriteMessages.has(msg.id));
    }

    // Filtre par date
    if (selectedDate) {
      filtered = filtered.filter(msg => {
        const messageDate = msg.timestamp?.toDate?.() || new Date(msg.timestamp as any);
        const selectedDateStart = new Date(selectedDate);
        selectedDateStart.setHours(0, 0, 0, 0);
        const selectedDateEnd = new Date(selectedDate);
        selectedDateEnd.setHours(23, 59, 59, 999);
        
        return messageDate >= selectedDateStart && messageDate <= selectedDateEnd;
      });
    }

    setFilteredMessages(filtered);
  };

  // Appliquer les filtres quand les messages ou les critères changent
  useEffect(() => {
    filterMessages();
  }, [currentTopicMessages, searchQuery, showFavoritesOnly, selectedDate]);

  const toggleFavorite = (messageId: string) => {
    const newFavorites = new Set(favoriteMessages);
    if (newFavorites.has(messageId)) {
      newFavorites.delete(messageId);
    } else {
      newFavorites.add(messageId);
    }
    setFavoriteMessages(newFavorites);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setShowFavoritesOnly(false);
    setSelectedDate(null);
    setShowSearch(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };


  const flatListRef = useRef<FlatList>(null);

  // Définir le topic initial depuis les paramètres de route
  useEffect(() => {
    if (route.params?.topic) {
      setCurrentTopic(route.params.topic);
    }
  }, [route.params?.topic]);

  // Gérer l'indicateur de frappe
  useEffect(() => {
    if (!newMessage.trim() || !couple || !user || !currentTopic) {
      if (isTyping) {
        setIsTyping(false);
        FirestoreService.stopTyping(couple?.id || '', currentTopic || '', user?.uid || '');
      }
      return;
    }

    if (!isTyping) {
      setIsTyping(true);
      FirestoreService.startTyping(couple.id, currentTopic, user.uid);
    }

    // Réinitialiser le timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Arrêter l'indicateur après 3 secondes d'inactivité
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      FirestoreService.stopTyping(couple.id, currentTopic, user.uid);
    }, 3000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, couple?.id, user?.uid, currentTopic, isTyping]);

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

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (currentTopicMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentTopicMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setIsSending(true);
      const topicToUse = currentTopic || 'général';
      await sendMessage(newMessage.trim(), topicToUse);
      setNewMessage('');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Recharger les messages en changeant temporairement le topic
    const currentTopicTemp = currentTopic;
    setCurrentTopic(null);
    setTimeout(() => {
      setCurrentTopic(currentTopicTemp);
      setRefreshing(false);
    }, 100);
  };



  // Fonctions pour les nouvelles fonctionnalités






  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.uid;
    const messageTime = item.timestamp?.toDate?.() || new Date();
    const timeString = messageTime.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Statut de lecture détaillé
    const getReadStatus = () => {
      if (!isOwnMessage) return null;
      
      if (item.read) {
        return (
          <View style={styles.readStatusContainer}>
            <Text style={styles.readStatus}>✓✓</Text>
            <Text style={styles.readStatusText}>Vu</Text>
          </View>
        );
      } else {
        return (
          <View style={styles.readStatusContainer}>
            <Text style={styles.readStatus}>✓</Text>
            <Text style={styles.readStatusText}>Envoyé</Text>
          </View>
        );
      }
    };

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>


          {/* Contenu du message selon le type */}
          {item.type === 'text' ? (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </Text>
          ) : (
            <View style={styles.mediaContainer}>
              <Text style={styles.mediaText}>📎 Média non supporté</Text>
            </View>
          )}
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {timeString}
            </Text>
            
            <View style={styles.messageActions}>
              {getReadStatus()}
              
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => toggleFavorite(item.id)}
              >
                <Ionicons 
                  name={favoriteMessages.has(item.id) ? "star" : "star-outline"} 
                  size={16} 
                  color={favoriteMessages.has(item.id) ? colors.warning : colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>


        </View>
      </View>
    );
  };



  const renderEmptyState = () => {
    const currentTopicName = !currentTopic || currentTopic === 'général' ? 'Principal' : currentTopic;
    
    if (showSearch && (searchQuery.trim() || showFavoritesOnly || selectedDate)) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🔍</Text>
          <Text style={styles.emptyStateTitle}>Aucun résultat</Text>
          <Text style={styles.emptyStateText}>
            Aucun message ne correspond à vos critères de recherche
          </Text>
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Effacer les filtres</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>💬</Text>
        <Text style={styles.emptyStateTitle}>Aucun message</Text>
        <Text style={styles.emptyStateText}>
          Commencez la conversation dans {currentTopicName} !
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Header */}
                 <LinearGradient
           colors={[colors.primary, colors.secondary]}
           start={{ x: 0, y: 0 }}
           end={{ x: 1, y: 1 }}
           style={styles.header}
         >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            
                         <View style={styles.headerInfo}>
               <Text style={styles.headerTitle}>
                 {!currentTopic || currentTopic === 'général' ? 'Principal' : currentTopic}
               </Text>
               <Text style={styles.headerSubtitle}>
                 {partnerInfo ? `Avec ${partnerInfo.name}` : 'Avec votre partenaire'}
               </Text>
             </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={() => setShowSearch(!showSearch)}
              >
                <Ionicons name="search" size={20} color={colors.textOnPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.moreButton}>
                <Ionicons name="ellipsis-vertical" size={20} color={colors.textOnPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Barre de recherche et filtres */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
              <Input
                placeholder="Rechercher dans les messages..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                inputStyle={styles.searchInputText}
              />
              {searchQuery.trim() && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.filtersContainer}>
              <TouchableOpacity
                style={[styles.filterButton, showFavoritesOnly && styles.filterButtonActive]}
                onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Ionicons 
                  name={showFavoritesOnly ? "star" : "star-outline"} 
                  size={16} 
                  color={showFavoritesOnly ? colors.primary : colors.textSecondary} 
                />
                <Text style={[styles.filterButtonText, showFavoritesOnly && styles.filterButtonTextActive]}>
                  Favoris
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.filterButton, selectedDate && styles.filterButtonActive]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons 
                  name="calendar" 
                  size={16} 
                  color={selectedDate ? colors.primary : colors.textSecondary} 
                />
                <Text style={[styles.filterButtonText, selectedDate && styles.filterButtonTextActive]}>
                  {selectedDate ? formatDate(selectedDate) : 'Date'}
                </Text>
              </TouchableOpacity>
              
              {(searchQuery.trim() || showFavoritesOnly || selectedDate) && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearFiltersText}>Effacer</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Liste des messages */}
        <FlatList
          ref={flatListRef}
          data={showSearch ? filteredMessages : currentTopicMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />

        {/* Indicateur de frappe */}
        {typingUsers.length > 0 && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>
              {partnerInfo?.name || 'Votre partenaire'} est en train d'écrire...
            </Text>
            <View style={styles.typingDots}>
              <Text style={styles.typingDot}>•</Text>
              <Text style={styles.typingDot}>•</Text>
              <Text style={styles.typingDot}>•</Text>
            </View>
          </View>
        )}

        {/* Input pour nouveau message */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>

            <View style={styles.inputBubble}>
                             <Input
                 placeholder="Tapez votre message..."
                 value={newMessage}
                 onChangeText={setNewMessage}
                 multiline
                 numberOfLines={6}
                 style={styles.messageInput}
                 inputStyle={styles.messageInputText}
               />
            </View>
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                !newMessage.trim() && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={colors.textOnPrimary} />
              ) : (
                <Ionicons name="send" size={20} color={colors.textOnPrimary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Sélecteur de date */}
        {showDatePicker && (
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModal}>
              <Text style={styles.datePickerTitle}>Sélectionner une date</Text>
              <DateTimePicker
                value={selectedDate || new Date()}
                mode="date"
                display="calendar"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
              />
              <View style={styles.datePickerButtons}>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => {
                    setShowDatePicker(false);
                    setSelectedDate(null);
                  }}
                >
                  <Text style={styles.datePickerButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.datePickerButton, styles.datePickerButtonPrimary]}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={[styles.datePickerButtonText, styles.datePickerButtonTextPrimary]}>
                    Valider
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.textOnPrimary,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textOnPrimary,
    opacity: 0.8,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 20,
    color: colors.textOnPrimary,
  },

  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: colors.textOnPrimary,
  },
  otherMessageText: {
    color: colors.text,
  },
  mediaContainer: {
    padding: 8,
    alignItems: 'center',
  },
  mediaText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
  },
  ownMessageTime: {
    color: colors.textOnPrimary,
    opacity: 0.8,
  },
  otherMessageTime: {
    color: colors.textSecondary,
  },
  readStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  readStatus: {
    fontSize: 12,
    color: colors.textOnPrimary,
    opacity: 0.8,
  },
  readStatusText: {
    fontSize: 10,
    color: colors.textOnPrimary,
    opacity: 0.6,
    marginLeft: 2,
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  reactionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  reactionEmoji: {
    fontSize: 16,
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
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  inputBubble: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  messageInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  messageInputText: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sendButtonDisabled: {
    backgroundColor: colors.disabled,
    elevation: 0,
    shadowOpacity: 0,
  },
  sendButtonText: {
    fontSize: 20,
    color: colors.textOnPrimary,
  },

  // Styles pour les nouvelles fonctionnalités
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  typingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  typingDots: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  typingDot: {
    fontSize: 16,
    color: colors.primary,
    marginHorizontal: 1,
    opacity: 0.7,
  },

  // Styles pour la recherche et filtres
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    color: colors.textSecondary,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  searchInputText: {
    fontSize: 16,
    color: colors.text,
  },
  clearSearch: {
    fontSize: 18,
    color: colors.textSecondary,
    padding: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: colors.textOnPrimary,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.error,
  },
  clearFiltersText: {
    fontSize: 14,
    color: colors.textOnPrimary,
    fontWeight: '500',
  },

  // Styles pour les favoris
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    padding: 4,
  },

  // Styles pour le sélecteur de date
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
  datePickerModal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
  },
  datePickerButtonPrimary: {
    backgroundColor: colors.primary,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  datePickerButtonTextPrimary: {
    color: colors.textOnPrimary,
  },

});
