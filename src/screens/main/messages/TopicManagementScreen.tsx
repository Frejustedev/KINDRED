import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { useAuth } from '../../../hooks/useAuth';
import { useCouple } from '../../../hooks/useCouple';
import { useMessages } from '../../../hooks/useMessages';

interface TopicManagementScreenProps {
  navigation: any;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  messageCount: number;
  createdAt: any;
}

export const TopicManagementScreen: React.FC<TopicManagementScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const { availableTopics, addTopic, updateTopic, deleteTopic, clearTopicMessages } = useMessages();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');

  const loadTopics = useCallback(async () => {
    // Les topics sont maintenant gérés par le hook useMessages
    setIsLoading(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadTopics();
    setIsRefreshing(false);
  }, [loadTopics]);

  useEffect(() => {
    if (couple) {
      loadTopics();
    }
  }, [couple, loadTopics]);

  const handleAddTopic = async () => {
    if (!newTopicName.trim()) {
      Alert.alert('Erreur', 'Le nom du topic est requis');
      return;
    }

    try {
      await addTopic(newTopicName.trim());
      setNewTopicName('');
      setNewTopicDescription('');
      setShowAddModal(false);
      Alert.alert('Succès', 'Topic créé avec succès');
    } catch (error: any) {
      console.error('Error creating topic:', error);
      Alert.alert('Erreur', error.message || 'Impossible de créer le topic');
    }
  };

  const handleEditTopic = async () => {
    if (!editingTopic || !newTopicName.trim()) {
      Alert.alert('Erreur', 'Le nom du topic est requis');
      return;
    }

    try {
      await updateTopic(editingTopic, newTopicName.trim());
      setEditingTopic(null);
      setNewTopicName('');
      setNewTopicDescription('');
      Alert.alert('Succès', 'Topic modifié avec succès');
    } catch (error: any) {
      console.error('Error updating topic:', error);
      Alert.alert('Erreur', error.message || 'Impossible de modifier le topic');
    }
  };

  const handleDeleteTopic = (topicName: string) => {
    if (topicName === 'général') {
      Alert.alert('Erreur', 'Le topic principal ne peut pas être supprimé');
      return;
    }

    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer le topic "${topicName}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTopic(topicName);
              Alert.alert('Succès', 'Topic supprimé avec succès');
            } catch (error: any) {
              console.error('Error deleting topic:', error);
              Alert.alert('Erreur', error.message || 'Impossible de supprimer le topic');
            }
          },
        },
      ]
    );
  };

  const handleClearMessages = (topicName: string) => {
    Alert.alert(
      'Effacer tous les messages',
      `Êtes-vous sûr de vouloir effacer tous les messages du topic "${topicName}" ?\n\nCette action est irréversible et supprimera définitivement tous les messages.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearTopicMessages(topicName);
              Alert.alert('Succès', 'Tous les messages ont été effacés');
            } catch (error: any) {
              console.error('Error clearing messages:', error);
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
    setNewTopicDescription('');
  };

  const renderTopicCard = (topicName: string) => (
    <View key={topicName} style={styles.topicCard}>
      <View style={styles.topicHeader}>
        <View style={styles.topicInfo}>
          <Text style={styles.topicName}>
            {topicName}
            {topicName === 'général' && (
              <Text style={styles.defaultBadge}> Principal</Text>
            )}
          </Text>
        </View>
        
        <View style={styles.topicActions}>
          {topicName === 'général' ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleClearMessages(topicName)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.warning} />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openEditModal(topicName)}
              >
                <Ionicons name="pencil" size={20} color={colors.info} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteTopic(topicName)}
              >
                <Ionicons name="trash" size={20} color={colors.error} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );

  if (!couple) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Gestion des Topics</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestion des Topics</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </LinearGradient>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Chargement des topics...</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Topics de conversation</Text>
              <Text style={styles.sectionDescription}>
                Gérez vos topics de conversation. Le topic principal ne peut pas être supprimé.
              </Text>
            </View>

            <View style={styles.topicsContainer}>
              {availableTopics.length > 0 ? (
                availableTopics.map(renderTopicCard)
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubbles-outline" size={48} color={colors.textLight} />
                  <Text style={styles.emptyStateText}>Aucun topic trouvé</Text>
                  <Text style={styles.emptyStateDescription}>
                    Créez votre premier topic pour organiser vos conversations
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal pour ajouter un topic */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau Topic</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nom du topic"
              value={newTopicName}
              onChangeText={setNewTopicName}
              maxLength={50}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optionnel)"
              value={newTopicDescription}
              onChangeText={setNewTopicDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddTopic}
              >
                <Text style={styles.confirmButtonText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal pour éditer un topic */}
      <Modal
        visible={!!editingTopic}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingTopic(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier le Topic</Text>
              <TouchableOpacity
                onPress={() => setEditingTopic(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nom du topic"
              value={newTopicName}
              onChangeText={setNewTopicName}
              maxLength={50}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optionnel)"
              value={newTopicDescription}
              onChangeText={setNewTopicDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditingTopic(null)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleEditTopic}
              >
                <Text style={styles.confirmButtonText}>Modifier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '20',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  errorText: {
    color: colors.error,
    marginLeft: 8,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textLight,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  topicsContainer: {
    gap: 12,
  },
  topicCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  defaultBadge: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
  },
  topicDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  topicStats: {
    fontSize: 12,
    color: colors.textLight,
  },
  topicActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 16,
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
});
