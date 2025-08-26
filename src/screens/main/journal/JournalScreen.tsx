import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../constants/colors';
import { Header } from '../../../components/common/Header';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { useAuth } from '../../../hooks/useAuth';
import { useCouple } from '../../../hooks/useCouple';
import { FirestoreService } from '../../../services/firebase/firestore.service';
import { JournalEntry } from '../../../types';
import { Ionicons } from '@expo/vector-icons';

interface JournalScreenProps {
  navigation: any;
}

export const JournalScreen: React.FC<JournalScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    mood: 'happy' as JournalEntry['mood'],
    tags: [] as string[],
  });

  // Charger les entrées du journal
  const loadJournalEntries = useCallback(async (retryCount = 0) => {
    if (!couple) return;

    try {
      setIsLoading(true);
      setError(null);
      const result = await FirestoreService.getJournalEntries(couple.id, 50);
      setEntries(result.entries);
    } catch (error: any) {
      console.error('Error loading journal entries:', error);
      setError('Erreur lors du chargement des entrées');
      
      // Retry automatique pour les erreurs réseau
      if (retryCount < 3 && error.code === 'unavailable') {
        setTimeout(() => loadJournalEntries(retryCount + 1), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [couple]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadJournalEntries();
    setIsRefreshing(false);
  }, [loadJournalEntries]);

  useEffect(() => {
    if (couple) {
      loadJournalEntries();
    }
  }, [couple, loadJournalEntries]);

  const handleAddEntry = async () => {
    if (!couple || !user) {
      Alert.alert('Erreur', 'Vous devez être connecté et faire partie d\'un couple');
      return;
    }

    // Validation robuste
    const title = newEntry.title.trim();
    const content = newEntry.content.trim();

    if (title.length < 3) {
      Alert.alert('Erreur', 'Le titre doit contenir au moins 3 caractères');
      return;
    }

    if (title.length > 100) {
      Alert.alert('Erreur', 'Le titre ne peut pas dépasser 100 caractères');
      return;
    }

    if (content.length < 10) {
      Alert.alert('Erreur', 'Le contenu doit contenir au moins 10 caractères');
      return;
    }

    if (content.length > 5000) {
      Alert.alert('Erreur', 'Le contenu ne peut pas dépasser 5000 caractères');
      return;
    }

    // Validation des tags
    const validTags = newEntry.tags.filter(tag => tag.trim().length > 0 && tag.trim().length <= 20);
    const uniqueTags = [...new Set(validTags)];

    try {
      await FirestoreService.addJournalEntry(
        couple.id,
        title,
        content,
        user.uid,
        [], // media
        newEntry.mood,
        uniqueTags
      );

      setShowAddModal(false);
      setNewEntry({
        title: '',
        content: '',
        mood: 'happy',
        tags: [],
      });
      
      await loadJournalEntries();
      Alert.alert('Succès', 'Entrée ajoutée avec succès');
    } catch (error: any) {
      console.error('Error creating journal entry:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la création de l\'entrée');
    }
  };

  const getMoodIcon = (mood: JournalEntry['mood']) => {
    switch (mood) {
      case 'happy':
        return '😊';
      case 'sad':
        return '😢';
      case 'excited':
        return '🤩';
      case 'angry':
        return '😠';
      case 'calm':
        return '😌';
      case 'love':
        return '🥰';
      default:
        return '😊';
    }
  };

  const getMoodColor = (mood: JournalEntry['mood']) => {
    switch (mood) {
      case 'happy':
        return colors.success;
      case 'sad':
        return colors.info;
      case 'excited':
        return colors.warning;
      case 'angry':
        return colors.error;
      case 'calm':
        return colors.secondary;
      case 'love':
        return colors.primary;
      default:
        return colors.primary;
    }
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowEditModal(true);
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry || !couple) return;

    const title = editingEntry.title.trim();
    const content = editingEntry.content.trim();

    if (title.length < 3) {
      Alert.alert('Erreur', 'Le titre doit contenir au moins 3 caractères');
      return;
    }

    if (title.length > 100) {
      Alert.alert('Erreur', 'Le titre ne peut pas dépasser 100 caractères');
      return;
    }

    if (content.length < 10) {
      Alert.alert('Erreur', 'Le contenu doit contenir au moins 10 caractères');
      return;
    }

    if (content.length > 5000) {
      Alert.alert('Erreur', 'Le contenu ne peut pas dépasser 5000 caractères');
      return;
    }

    try {
      await FirestoreService.updateJournalEntry(
        couple.id,
        editingEntry.id,
        title,
        content,
        editingEntry.mood,
        editingEntry.tags || []
      );

      setShowEditModal(false);
      setEditingEntry(null);
      await loadJournalEntries();
      Alert.alert('Succès', 'Entrée modifiée avec succès');
    } catch (error: any) {
      console.error('Error updating journal entry:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la modification');
    }
  };

  const handleDeleteEntry = (entry: JournalEntry) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette entrée ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            if (!couple) return;
            try {
              await FirestoreService.deleteJournalEntry(couple.id, entry.id);
              await loadJournalEntries();
              Alert.alert('Succès', 'Entrée supprimée avec succès');
            } catch (error: any) {
              console.error('Error deleting journal entry:', error);
              Alert.alert('Erreur', error.message || 'Erreur lors de la suppression');
            }
          }
        }
      ]
    );
  };

  const getFilteredEntries = () => {
    let filtered = entries;

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(query) ||
        entry.content.toLowerCase().includes(query) ||
        (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // Filtre par humeur
    if (selectedMoodFilter) {
      filtered = filtered.filter(entry => entry.mood === selectedMoodFilter);
    }

    return filtered;
  };

  const renderEntry = ({ item }: { item: JournalEntry }) => {
    const entryDate = item.date.toDate?.() || new Date(item.date as any);
    const dateString = entryDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeString = entryDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={styles.entryInfo}>
            <Text style={styles.entryTitle}>{item.title}</Text>
            <Text style={styles.entryDate}>
              <Ionicons name="calendar" size={12} color={colors.textSecondary} />
              {' '}{dateString} à {timeString}
            </Text>
          </View>
          <View style={styles.entryActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditEntry(item)}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteEntry(item)}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.moodSection}>
          <View style={[styles.moodBadge, { backgroundColor: getMoodColor(item.mood) }]}>
            <Text style={styles.moodIcon}>{getMoodIcon(item.mood)}</Text>
          </View>
          <Text style={styles.moodLabel}>
            {moodOptions.find(m => m.value === item.mood)?.label || 'Heureux'}
          </Text>
        </View>
        
        <Text style={styles.entryContent} numberOfLines={4}>
          {item.content}
        </Text>
        
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const moodOptions = [
    { value: 'happy', label: 'Heureux', icon: '😊' },
    { value: 'sad', label: 'Triste', icon: '😢' },
    { value: 'excited', label: 'Excité', icon: '🤩' },
    { value: 'angry', label: 'En colère', icon: '😠' },
    { value: 'calm', label: 'Calme', icon: '😌' },
    { value: 'love', label: 'Amoureux', icon: '🥰' },
  ];

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="book-outline" size={60} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>Journal vide</Text>
      <Text style={styles.emptyStateText}>
        Commencez à écrire votre première entrée pour partager vos moments !
      </Text>
      <Button
        title="Créer ma première entrée"
        onPress={() => setShowAddModal(true)}
        style={styles.emptyStateButton}
      />
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Ionicons name="alert-circle-outline" size={60} color={colors.error} />
      <Text style={styles.errorStateTitle}>Erreur de chargement</Text>
      <Text style={styles.errorStateText}>{error}</Text>
      <Button
        title="Réessayer"
        onPress={() => loadJournalEntries()}
        style={styles.errorStateButton}
      />
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Chargement des entrées...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Journal"
        icon="book"
        subtitle="Partagez vos moments"
        rightAction={{
          icon: "add",
          onPress: () => setShowAddModal(true)
        }}
      />

      {/* Barre de recherche et filtres */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <Input
            placeholder="Rechercher dans les entrées..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
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

        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filtersLabel}>Filtrer par humeur :</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !selectedMoodFilter && styles.filterChipSelected
                ]}
                onPress={() => setSelectedMoodFilter(null)}
              >
                <Text style={[
                  styles.filterChipText,
                  !selectedMoodFilter && styles.filterChipTextSelected
                ]}>
                  Toutes
                </Text>
              </TouchableOpacity>
              {moodOptions.map((mood) => (
                <TouchableOpacity
                  key={mood.value}
                  style={[
                    styles.filterChip,
                    selectedMoodFilter === mood.value && styles.filterChipSelected
                  ]}
                  onPress={() => setSelectedMoodFilter(mood.value)}
                >
                  <Text style={styles.filterChipIcon}>{mood.icon}</Text>
                  <Text style={[
                    styles.filterChipText,
                    selectedMoodFilter === mood.value && styles.filterChipTextSelected
                  ]}>
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Liste des entrées */}
      {isLoading ? (
        renderLoadingState()
      ) : error ? (
        renderErrorState()
      ) : getFilteredEntries().length === 0 ? (
        searchQuery || selectedMoodFilter ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={60} color={colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>Aucun résultat</Text>
            <Text style={styles.emptyStateText}>
              Aucune entrée ne correspond à votre recherche.
            </Text>
            <Button
              title="Effacer les filtres"
              onPress={() => {
                setSearchQuery('');
                setSelectedMoodFilter(null);
              }}
              style={styles.emptyStateButton}
            />
          </View>
        ) : (
          renderEmptyState()
        )
      ) : (
        <FlatList
          data={getFilteredEntries()}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          style={styles.entriesList}
          contentContainerStyle={styles.entriesContent}
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

      {/* Modal d'ajout d'entrée */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nouvelle entrée</Text>
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <Input
                label="Titre"
                placeholder="Titre de votre entrée"
                value={newEntry.title}
                onChangeText={(text) => setNewEntry({ ...newEntry, title: text })}
                maxLength={100}
              />

              <Input
                label="Contenu"
                placeholder="Racontez votre journée..."
                value={newEntry.content}
                onChangeText={(text) => setNewEntry({ ...newEntry, content: text })}
                multiline
                numberOfLines={6}
                maxLength={5000}
              />

              <View style={styles.modalMoodSection}>
                <Text style={styles.modalMoodLabel}>Humeur</Text>
                <View style={styles.moodOptions}>
                  {moodOptions.map((mood) => (
                    <TouchableOpacity
                      key={mood.value}
                      style={[
                        styles.moodOption,
                        newEntry.mood === mood.value && styles.moodOptionSelected
                      ]}
                      onPress={() => setNewEntry({ ...newEntry, mood: mood.value as JournalEntry['mood'] })}
                    >
                      <Text style={styles.moodOptionIcon}>{mood.icon}</Text>
                      <Text style={styles.moodOptionLabel}>{mood.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalFooter}>
                <Button
                  title="Annuler"
                  onPress={() => setShowAddModal(false)}
                  style={styles.cancelButton}
                  textStyle={styles.cancelButtonText}
                />
                <Button
                  title="Ajouter"
                  onPress={handleAddEntry}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal d'édition d'entrée */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Modifier l'entrée</Text>
                <TouchableOpacity
                  onPress={() => setShowEditModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              {editingEntry && (
                <>
                  <Input
                    label="Titre"
                    placeholder="Titre de votre entrée"
                    value={editingEntry.title}
                    onChangeText={(text) => setEditingEntry({ ...editingEntry, title: text })}
                    maxLength={100}
                  />

                  <Input
                    label="Contenu"
                    placeholder="Racontez votre journée..."
                    value={editingEntry.content}
                    onChangeText={(text) => setEditingEntry({ ...editingEntry, content: text })}
                    multiline
                    numberOfLines={6}
                    maxLength={5000}
                  />

                  <View style={styles.modalMoodSection}>
                    <Text style={styles.modalMoodLabel}>Humeur</Text>
                    <View style={styles.moodOptions}>
                      {moodOptions.map((mood) => (
                        <TouchableOpacity
                          key={mood.value}
                          style={[
                            styles.moodOption,
                            editingEntry.mood === mood.value && styles.moodOptionSelected
                          ]}
                          onPress={() => setEditingEntry({ ...editingEntry, mood: mood.value as JournalEntry['mood'] })}
                        >
                          <Text style={styles.moodOptionIcon}>{mood.icon}</Text>
                          <Text style={styles.moodOptionLabel}>{mood.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.modalFooter}>
                    <Button
                      title="Annuler"
                      onPress={() => setShowEditModal(false)}
                      style={styles.cancelButton}
                      textStyle={styles.cancelButtonText}
                    />
                    <Button
                      title="Modifier"
                      onPress={handleUpdateEntry}
                      style={styles.modalButton}
                    />
                  </View>
                </>
              )}
            </View>
          </ScrollView>
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
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginBottom: 0,
  },
  clearSearchButton: {
    padding: 4,
  },
  filtersContainer: {
    marginTop: 8,
  },
  filtersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
  },
  filterChipIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: colors.textOnPrimary,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  emptyStateButton: {
    marginTop: 8,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
    marginTop: 8,
  },
  entriesList: {
    flex: 1,
  },
  entriesContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  entryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...colors.shadow,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 12,
    color: colors.textSecondary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  moodIcon: {
    fontSize: 16,
  },
  moodLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  entryContent: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    width: '100%',
    height: '100%',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 24,
    margin: 20,
    maxHeight: '90%',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalMoodSection: {
    marginVertical: 16,
  },
  modalMoodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  moodOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceVariant,
    minWidth: 80,
  },
  moodOptionSelected: {
    backgroundColor: colors.primary,
  },
  moodOptionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodOptionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
  },
  cancelButtonText: {
    color: colors.text,
  },
});
