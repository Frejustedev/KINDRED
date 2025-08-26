import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../constants/colors';
import { Header } from '../../../components/common/Header';
import { useAuth } from '../../../hooks/useAuth';
import { useCouple } from '../../../hooks/useCouple';
import { FirestoreService } from '../../../services/firebase/firestore.service';
import { CollaborativeNote } from '../../../types';
import { Ionicons } from '@expo/vector-icons';

interface CollaborativeNotesScreenProps {
  navigation: any;
}

export const CollaborativeNotesScreen: React.FC<CollaborativeNotesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [notes, setNotes] = useState<CollaborativeNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    if (couple) {
      loadNotes();
    }
  }, [couple, loadNotes]);

  const loadNotes = useCallback(async (retryCount = 0) => {
    if (!couple) return;

    try {
      setIsLoading(true);
      setError(null);
      const notesData = await FirestoreService.getCollaborativeNotes(couple.id);
      setNotes(notesData);
    } catch (error: any) {
      console.error('Error loading notes:', error);
      setError('Erreur lors du chargement des notes');
      
      // Retry automatique pour les erreurs réseau
      if (retryCount < 3 && error.code === 'unavailable') {
        setTimeout(() => loadNotes(retryCount + 1), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [couple]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadNotes();
    setIsRefreshing(false);
  }, [loadNotes]);

  const handleCreateNote = async () => {
    if (!couple || !user) {
      Alert.alert('Erreur', 'Vous devez être connecté et faire partie d\'un couple');
      return;
    }

    // Validation robuste
    const title = newNote.title.trim();
    const content = newNote.content.trim();

    if (title.length < 1) {
      Alert.alert('Erreur', 'Le titre ne peut pas être vide');
      return;
    }

    if (title.length > 100) {
      Alert.alert('Erreur', 'Le titre ne peut pas dépasser 100 caractères');
      return;
    }

    if (content.length > 10000) {
      Alert.alert('Erreur', 'Le contenu ne peut pas dépasser 10 000 caractères');
      return;
    }

    try {
      const noteData = {
        title,
        content,
        createdBy: user.uid,
      };

      await FirestoreService.createCollaborativeNote(couple.id, noteData);
      setNewNote({ title: '', content: '' });
      setShowAddModal(false);
      await loadNotes();
      Alert.alert('Succès', 'Note créée avec succès !');
    } catch (error: any) {
      console.error('Error creating note:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la création de la note');
    }
  };

  const handleNotePress = (note: CollaborativeNote) => {
    navigation.navigate('NoteEditor', { noteId: note.id, note });
  };

  const handleDeleteNote = async (note: CollaborativeNote) => {
    if (!couple) return;

    Alert.alert(
      'Supprimer la note',
      'Êtes-vous sûr de vouloir supprimer cette note ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirestoreService.deleteCollaborativeNote(couple.id, note.id);
              await loadNotes();
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const getFilteredNotes = () => {
    if (!searchQuery.trim()) return notes;
    
    const query = searchQuery.toLowerCase();
    return notes.filter(note => 
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    );
  };

  const renderNote = ({ item }: { item: CollaborativeNote }) => {
    const lastUpdated = item.updatedAt?.toDate?.() || new Date(item.updatedAt as any);
    const timeString = lastUpdated.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const previewContent = item.content.length > 100 
      ? item.content.substring(0, 100) + '...' 
      : item.content;

    return (
      <TouchableOpacity
        style={styles.noteCard}
        onPress={() => handleNotePress(item)}
      >
        <View style={styles.noteHeader}>
          <View style={styles.noteInfo}>
            <Text style={styles.noteTitle}>{item.title}</Text>
            <Text style={styles.noteTime}>
              <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
              {' '}Modifiée le {timeString} • v{item.version}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteNote(item)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.notePreview} numberOfLines={3}>
          {previewContent || 'Aucun contenu'}
        </Text>
        
        {item.isLocked && (
          <View style={styles.lockIndicator}>
            <Ionicons name="lock-closed" size={14} color={colors.warning} />
            <Text style={styles.lockText}> Verrouillée</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={60} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>Aucune note</Text>
      <Text style={styles.emptyStateText}>
        Créez votre première note collaborative pour partager vos idées !
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.emptyStateButtonText}>Créer ma première note</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Ionicons name="alert-circle-outline" size={60} color={colors.error} />
      <Text style={styles.errorStateTitle}>Erreur de chargement</Text>
      <Text style={styles.errorStateText}>{error}</Text>
      <TouchableOpacity
        style={styles.errorStateButton}
        onPress={() => loadNotes()}
      >
        <Text style={styles.errorStateButtonText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Chargement des notes...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Notes collaboratives"
        icon="document-text"
        subtitle="Éditeur de texte partagé"
        rightAction={{
          icon: "add",
          onPress: () => setShowAddModal(true)
        }}
      />

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans les notes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchButton}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Liste des notes */}
      {isLoading ? (
        renderLoadingState()
      ) : error ? (
        renderErrorState()
      ) : getFilteredNotes().length === 0 ? (
        searchQuery ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={60} color={colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>Aucun résultat</Text>
            <Text style={styles.emptyStateText}>
              Aucune note ne correspond à votre recherche.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.emptyStateButtonText}>Effacer la recherche</Text>
            </TouchableOpacity>
          </View>
        ) : (
          renderEmptyState()
        )
      ) : (
        <FlatList
          data={getFilteredNotes()}
          renderItem={renderNote}
          keyExtractor={(item) => item.id}
          style={styles.notesContainer}
          contentContainerStyle={styles.notesContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Modal pour créer une nouvelle note */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouvelle note</Text>
            
            <TextInput
              style={styles.modalTitleInput}
              placeholder="Titre de la note"
              value={newNote.title}
              onChangeText={(text) => setNewNote(prev => ({ ...prev, title: text }))}
            />

            <TextInput
              style={styles.modalContentInput}
              placeholder="Contenu de la note..."
              value={newNote.content}
              onChangeText={(text) => setNewNote(prev => ({ ...prev, content: text }))}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleCreateNote}
                disabled={!newNote.title.trim()}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  Créer
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textOnPrimary,
    opacity: 0.8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: colors.textOnPrimary,
    fontWeight: 'bold',
  },
  notesContainer: {
    flex: 1,
  },
  notesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteInfo: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  noteTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: 4,
  },

  notePreview: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  lockIndicator: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.warning,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  lockText: {
    fontSize: 12,
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  errorStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  errorStateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorStateButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  searchContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    fontSize: 16,
    color: colors.text,
  },
  clearSearchButton: {
    padding: 8,
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
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalTitleInput: {
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  modalContentInput: {
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 24,
    minHeight: 120,
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
});
