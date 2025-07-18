import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const TOPICS = [
  { id: 'general', title: 'Général', color: '#FF6B9D', icon: 'chatbubbles' },
  { id: 'voyage', title: 'Voyage', color: '#4ECDC4', icon: 'airplane' },
  { id: 'budget', title: 'Budget', color: '#45B7D1', icon: 'card' },
  { id: 'surprises', title: 'Idées Surprises', color: '#FFA726', icon: 'gift' },
  { id: 'plans', title: 'Plans', color: '#AB47BC', icon: 'calendar' },
  { id: 'dreams', title: 'Rêves', color: '#26A69A', icon: 'star' },
];

const SAMPLE_MESSAGES = [
  { id: 1, text: 'Salut mon amour ! 💕', sender: 'partner', time: '14:30', topic: 'general' },
  { id: 2, text: 'Coucou bébé ! Comment va ta journée ?', sender: 'me', time: '14:32', topic: 'general' },
  { id: 3, text: 'J\'ai trouvé un super restaurant pour notre prochaine sortie !', sender: 'partner', time: '14:35', topic: 'plans' },
  { id: 4, text: 'Oh génial ! Montre-moi ça 😍', sender: 'me', time: '14:36', topic: 'plans' },
];

export default function ChatScreen() {
  const { currentCouple, currentUser } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState('general');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(SAMPLE_MESSAGES);

  // Calculer les jours ensemble et le streak
  const getDaysTogether = () => {
    if (currentCouple?.daysTogether) {
      return currentCouple.daysTogether;
    }
    return 347; // Valeur par défaut
  };

  const getStreak = () => {
    // TODO: Implémenter la logique de streak depuis Firebase
    return 12; // Valeur par défaut
  };

  const filteredMessages = messages.filter(msg => msg.topic === selectedTopic);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: message,
        sender: 'me',
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        topic: selectedTopic,
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const renderTopicItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.topicItem,
        { backgroundColor: selectedTopic === item.id ? item.color : '#F8F9FA' }
      ]}
      onPress={() => setSelectedTopic(item.id)}
    >
      <Ionicons
        name={item.icon}
        size={20}
        color={selectedTopic === item.id ? '#FFFFFF' : item.color}
      />
      <Text
        style={[
          styles.topicText,
          { color: selectedTopic === item.id ? '#FFFFFF' : '#333' }
        ]}
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'me' ? styles.myMessage : styles.partnerMessage
    ]}>
      <View style={[
        styles.messageBubble,
        { backgroundColor: item.sender === 'me' ? '#FF6B9D' : '#F0F0F0' }
      ]}>
        <Text style={[
          styles.messageText,
          { color: item.sender === 'me' ? '#FFFFFF' : '#333' }
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.messageTime,
          { color: item.sender === 'me' ? 'rgba(255,255,255,0.8)' : '#999' }
        ]}>
          {item.time}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with loyalty counter */}
      <LinearGradient
        colors={['#FF6B9D', '#C44569']}
        style={styles.headerGradient}
      >
        <View style={styles.loyaltyCounter}>
          <Ionicons name="heart" size={20} color="#FFFFFF" />
          <Text style={styles.loyaltyText}>
            {getDaysTogether()} jours ensemble • Streak {getStreak()} jours 🔥
          </Text>
        </View>
      </LinearGradient>

      {/* Topics Slider */}
      <View style={styles.topicsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TOPICS}
          renderItem={renderTopicItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.topicsList}
        />
      </View>

      {/* Messages */}
      <FlatList
        data={filteredMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Tapez votre message..."
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: message.trim() ? '#FF6B9D' : '#E0E0E0' }
          ]}
          onPress={sendMessage}
          disabled={!message.trim()}
        >
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  loyaltyCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loyaltyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  topicsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  topicsList: {
    paddingHorizontal: 20,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topicText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  messagesContent: {
    padding: 20,
  },
  messageContainer: {
    marginVertical: 4,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  partnerMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 