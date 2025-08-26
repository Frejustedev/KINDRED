import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { FirestoreService } from '../services/firebase/firestore.service';
import { useAuth } from './useAuth';
import { useCouple } from './useCouple';
import { Message } from '../types';
import { NotificationService } from '../services/notifications/notification.service';

interface ConversationInfo {
  topic: string;
  lastMessage: string;
  lastMessageTime: Date | null;
  unreadCount: number;
  lastMessageSender: string;
}

interface MessagesContextType {
  messages: Message[];
  currentTopicMessages: Message[]; // Messages du topic actuel
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, topic?: string, type?: Message['type'], mediaUrl?: string, replyTo?: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markTopicAsRead: (topic: string) => Promise<void>;

  currentTopic: string | null;
  setCurrentTopic: (topic: string | null) => void;
  availableTopics: string[];
  addTopic: (topicName: string) => Promise<void>;
  updateTopic: (oldTopicName: string, newTopicName: string) => Promise<void>;
  deleteTopic: (topicName: string) => Promise<void>;
  clearError: () => void;
  conversationsInfo: ConversationInfo[];
  totalUnreadCount: number;
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
  typingUsers: string[];
  refreshConversations: () => void;

}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export const MessagesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  const [conversationsInfo, setConversationsInfo] = useState<ConversationInfo[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [typingUnsubscribe, setTypingUnsubscribe] = useState<(() => void) | null>(null);

  // Filtrer les messages du topic actuel
  const currentTopicMessages = currentTopic 
    ? messages.filter(msg => msg.topic === currentTopic)
    : messages.filter(msg => msg.topic === 'général');

  // Topics disponibles
  const availableTopics = couple?.topics || ['général'];

  // Calculer les informations des conversations
  const calculateConversationsInfo = (allMessages: Message[]) => {
    const topics = ['général', ...availableTopics.filter(t => t !== 'général')];
    const conversations: ConversationInfo[] = [];
    let totalUnread = 0;

    topics.forEach(topic => {
      const topicMessages = allMessages.filter(msg => msg.topic === topic);
      const lastMessage = topicMessages[topicMessages.length - 1];
      const unreadMessages = topicMessages.filter(
        msg => !msg.read && msg.senderId !== user?.uid
      );

      conversations.push({
        topic,
        lastMessage: lastMessage?.content || 'Aucun message',
        lastMessageTime: lastMessage?.timestamp?.toDate?.() || null,
        unreadCount: unreadMessages.length,
        lastMessageSender: lastMessage?.senderId || '',
      });

      totalUnread += unreadMessages.length;
    });

    setConversationsInfo(conversations);
    setTotalUnreadCount(totalUnread);
    
    // Mettre à jour le badge de notification
    NotificationService.setBadgeCount(totalUnread);
  };

  // Recalculer les conversations quand les topics changent
  useEffect(() => {
    if (messages.length > 0) {
      calculateConversationsInfo(messages);
    }
  }, [availableTopics, messages, user?.uid]);

  // Écouter TOUS les messages en temps réel (tous les topics)
  useEffect(() => {
    if (!couple || !user) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Se désabonner de l'ancienne subscription
    if (unsubscribe) {
      unsubscribe();
    }

    // S'abonner à TOUS les messages (pas seulement currentTopic)
    const newUnsubscribe = FirestoreService.subscribeToAllMessages(
      couple.id,
      (allMessages) => {
        setMessages(allMessages);
        setIsLoading(false);
        
        // Calculer les informations des conversations
        calculateConversationsInfo(allMessages);
        
        // Notifier des nouveaux messages non lus
        const unreadMessages = allMessages.filter(
          msg => !msg.read && msg.senderId !== user.uid
        );
        
        if (unreadMessages.length > 0) {
          const latestMessage = unreadMessages[unreadMessages.length - 1];
          
          // Notification locale avec son personnalisé
          NotificationService.notifyNewMessage(
            'Votre partenaire',
            latestMessage.content.substring(0, 50) + '...',
            couple.id,
            latestMessage.topic || undefined
          );

          // Mettre à jour le badge avec le total des messages non lus
          const totalUnread = allMessages.filter(
            msg => !msg.read && msg.senderId !== user.uid
          ).length;
          NotificationService.setBadgeCount(totalUnread);
        }
      },
      50
    );

    setUnsubscribe(() => newUnsubscribe);

    return () => {
      newUnsubscribe();
    };
  }, [couple?.id, user?.uid]);

  // Écouter les indicateurs de frappe
  useEffect(() => {
    if (!couple || !currentTopic) {
      setTypingUsers([]);
      return;
    }

    // Se désabonner de l'ancienne subscription
    if (typingUnsubscribe) {
      typingUnsubscribe();
    }

    // S'abonner aux indicateurs de frappe
    const newTypingUnsubscribe = FirestoreService.subscribeToTyping(
      couple.id,
      currentTopic,
      (users) => {
        // Filtrer l'utilisateur actuel
        const otherUsers = users.filter(uid => uid !== user?.uid);
        setTypingUsers(otherUsers);
      }
    );

    setTypingUnsubscribe(() => newTypingUnsubscribe);

    return () => {
      newTypingUnsubscribe();
    };
  }, [couple?.id, currentTopic, user?.uid]);

  // Envoyer un message
  const sendMessage = async (
    content: string,
    topic: string = 'général',
    type: Message['type'] = 'text',
    mediaUrl?: string,
    replyTo?: string
  ) => {
    if (!couple || !user) throw new Error('Couple ou utilisateur non disponible');

    try {
      setError(null);
      await FirestoreService.sendMessage(
        couple.id,
        user.uid,
        content,
        topic,
        type,
        mediaUrl,
        replyTo
      );
      
      // Arrêter l'indicateur de frappe après envoi
      await FirestoreService.stopTyping(couple.id, topic, user.uid);
      setIsTyping(false);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Marquer comme lu
  const markAsRead = async (messageId: string) => {
    if (!couple) return;

    try {
      await FirestoreService.markAsRead(couple.id, messageId);
      // Recalculer les conversations après marquage
      setTimeout(() => {
        calculateConversationsInfo(messages);
      }, 100);
    } catch (error: any) {
      console.error('Error marking message as read:', error);
    }
  };

  // Marquer tout un topic comme lu
  const markTopicAsRead = async (topic: string) => {
    if (!couple || !user) return;

    try {
      await FirestoreService.markTopicAsRead(couple.id, topic, user.uid);
      
      // Recalculer les conversations après marquage
      setTimeout(() => {
        calculateConversationsInfo(messages);
      }, 100);
    } catch (error: any) {
      console.error('Error marking topic as read:', error);
    }
  };

  // Forcer la mise à jour des conversations
  const refreshConversations = () => {
    if (messages.length > 0) {
      calculateConversationsInfo(messages);
    }
  };



  // Ajouter un nouveau topic
  const addTopic = async (topicName: string) => {
    if (!couple) throw new Error('Couple non disponible');

    try {
      setError(null);
      await FirestoreService.addTopic(couple.id, topicName);
      // Le topic sera automatiquement ajouté à availableTopics via le couple
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Modifier un topic
  const updateTopic = async (oldTopicName: string, newTopicName: string) => {
    if (!couple) throw new Error('Couple non disponible');

    try {
      setError(null);
      await FirestoreService.updateTopic(couple.id, oldTopicName, newTopicName);
      // Le topic sera automatiquement mis à jour via le couple
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Supprimer un topic
  const deleteTopic = async (topicName: string) => {
    if (!couple) throw new Error('Couple non disponible');

    try {
      setError(null);
      await FirestoreService.deleteTopic(couple.id, topicName);
      // Le topic sera automatiquement supprimé via le couple
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Effacer l'erreur
  const clearError = () => {
    setError(null);
  };

  // Marquer automatiquement comme lu quand on voit les messages
  useEffect(() => {
    if (messages.length > 0 && couple && currentTopic) {
      // Ne marquer comme lu que les messages du topic actuel
      // et seulement si l'utilisateur est actuellement dans ce chat
      const currentTopicMessages = messages.filter(msg => msg.topic === currentTopic);
      const unreadMessages = currentTopicMessages.filter(
        msg => !msg.read && msg.senderId !== user?.uid
      );
      
      // Marquer comme lu avec un délai pour éviter les marquages trop fréquents
      if (unreadMessages.length > 0) {
        setTimeout(() => {
          unreadMessages.forEach(msg => {
            markAsRead(msg.id);
          });
        }, 1000); // Délai de 1 seconde
      }
    }
  }, [messages, couple?.id, user?.uid, currentTopic]);

  const value = {
    messages,
    currentTopicMessages,
    isLoading,
    error,
    sendMessage,
    markAsRead,
    markTopicAsRead,

    currentTopic,
    setCurrentTopic,
    availableTopics,
    addTopic,
    updateTopic,
    deleteTopic,
    clearError,
    conversationsInfo,
    totalUnreadCount,
    isTyping,
    setIsTyping,
    typingUsers,
    refreshConversations,

  };

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
};

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
};
