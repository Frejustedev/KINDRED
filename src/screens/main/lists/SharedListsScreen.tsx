import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
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
import { SharedList, ListItem } from '../../../types';
import { Ionicons } from '@expo/vector-icons';

interface SharedListsScreenProps {
  navigation: any;
}

export const SharedListsScreen: React.FC<SharedListsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [lists, setLists] = useState<SharedList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [newList, setNewList] = useState({
    title: '',
    type: 'todo' as SharedList['type'],
    color: '#FF6B6B',
    icon: '📝',
  });

  const loadLists = useCallback(async (retryCount = 0) => {
    if (!couple) return;

    try {
      setIsLoading(true);
      setError(null);
      const listsData = await FirestoreService.getSharedLists(couple.id);
      setLists(listsData);
    } catch (error: any) {
      console.error('Error loading lists:', error);
      setError('Erreur lors du chargement des listes');
      
      // Retry automatique pour les erreurs réseau
      if (retryCount < 3 && error.code === 'unavailable') {
        setTimeout(() => loadLists(retryCount + 1), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [couple]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadLists();
    setIsRefreshing(false);
  }, [loadLists]);

  useEffect(() => {
    if (couple) {
      loadLists();
    }
  }, [couple, loadLists]);

  const handleCreateList = async () => {
    if (!couple || !user) {
      Alert.alert('Erreur', 'Vous devez être connecté et faire partie d\'un couple');
      return;
    }

    // Validation robuste
    const title = newList.title.trim();

    if (title.length < 3) {
      Alert.alert('Erreur', 'Le titre doit contenir au moins 3 caractères');
      return;
    }

    if (title.length > 100) {
      Alert.alert('Erreur', 'Le titre ne peut pas dépasser 100 caractères');
      return;
    }

    try {
      const listData = {
        title,
        type: newList.type,
        items: [],
        createdBy: user.uid,
        color: newList.color,
        icon: newList.icon,
      };

      await FirestoreService.createSharedList(couple.id, listData);
      setNewList({ title: '', type: 'todo', color: '#FF6B6B', icon: '📝' });
      setShowAddModal(false);
      await loadLists();
      Alert.alert('Succès', 'Liste créée avec succès !');
    } catch (error: any) {
      console.error('Error creating list:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la création de la liste');
    }
  };

  const handleListPress = (list: SharedList) => {
    navigation.navigate('ListDetail', { listId: list.id, list });
  };

  const getListTypeInfo = (type: SharedList['type']) => {
    switch (type) {
      case 'todo':
        return { label: 'Todo', icon: '✅' };
      case 'shopping':
        return { label: 'Courses', icon: '🛒' };
      case 'wishlist':
        return { label: 'Souhaits', icon: '🎁' };
      case 'custom':
        return { label: 'Personnalisée', icon: '📝' };
      default:
        return { label: 'Liste', icon: '📝' };
    }
  };

  const getProgress = (list: SharedList) => {
    if (list.items.length === 0) return 0;
    const completed = list.items.filter(item => item.completed).length;
    return Math.round((completed / list.items.length) * 100);
  };

  const getFilteredLists = () => {
    let filtered = lists;

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(list => 
        list.title.toLowerCase().includes(query) ||
        list.items.some(item => item.text.toLowerCase().includes(query))
      );
    }

    // Filtre par type
    if (selectedTypeFilter) {
      filtered = filtered.filter(list => list.type === selectedTypeFilter);
    }

    return filtered;
  };

  const renderList = ({ item }: { item: SharedList }) => {
    const typeInfo = getListTypeInfo(item.type);
    const progress = getProgress(item);
    const lastUpdated = item.updatedAt?.toDate?.() || new Date(item.updatedAt as any);
    const timeString = lastUpdated.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={[styles.listCard, { borderLeftColor: item.color }]}
        onPress={() => handleListPress(item)}
      >
        <View style={styles.listHeader}>
          <View style={styles.listIconContainer}>
            <Text style={styles.listIcon}>{item.icon}</Text>
          </View>
          
          <View style={styles.listInfo}>
            <Text style={styles.listTitle}>{item.title}</Text>
            <Text style={styles.listType}>
              {typeInfo.icon} {typeInfo.label}
            </Text>
            <Text style={styles.listStats}>
              {item.items.length} éléments • {progress}% terminé
            </Text>
          </View>
          
          <Text style={styles.listTime}>{timeString}</Text>
        </View>

        {item.items.length > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progress}%`,
                    backgroundColor: item.color 
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="list-outline" size={60} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>Aucune liste</Text>
      <Text style={styles.emptyStateText}>
        Créez votre première liste partagée pour organiser vos tâches !
      </Text>
      <Button
        title="Créer ma première liste"
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
        onPress={() => loadLists()}
        style={styles.errorStateButton}
      />
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Chargement des listes...</Text>
    </View>
  );

  const listTypes = [
    { value: 'todo', label: 'Todo', icon: '✅', color: '#4ECDC4' },
    { value: 'shopping', label: 'Courses', icon: '🛒', color: '#45B7D1' },
    { value: 'wishlist', label: 'Souhaits', icon: '🎁', color: '#FF6B6B' },
    { value: 'custom', label: 'Personnalisée', icon: '📝', color: '#96CEB4' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Listes partagées"
        icon="list"
        subtitle="Todo, courses, souhaits"
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
            placeholder="Rechercher dans les listes..."
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
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons 
              name={showFilters ? "options" : "options-outline"} 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filtersLabel}>Filtrer par type :</Text>
            <View style={styles.filtersRow}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !selectedTypeFilter && styles.filterChipSelected
                ]}
                onPress={() => setSelectedTypeFilter(null)}
              >
                <Text style={[
                  styles.filterChipText,
                  !selectedTypeFilter && styles.filterChipTextSelected
                ]}>
                  Toutes
                </Text>
              </TouchableOpacity>
              {listTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.filterChip,
                    selectedTypeFilter === type.value && styles.filterChipSelected
                  ]}
                  onPress={() => setSelectedTypeFilter(type.value)}
                >
                  <Text style={styles.filterChipIcon}>{type.icon}</Text>
                  <Text style={[
                    styles.filterChipText,
                    selectedTypeFilter === type.value && styles.filterChipTextSelected
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Liste des listes */}
      {isLoading ? (
        renderLoadingState()
      ) : error ? (
        renderErrorState()
      ) : getFilteredLists().length === 0 ? (
        searchQuery || selectedTypeFilter ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={60} color={colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>Aucun résultat</Text>
            <Text style={styles.emptyStateText}>
              Aucune liste ne correspond à votre recherche.
            </Text>
            <Button
              title="Effacer les filtres"
              onPress={() => {
                setSearchQuery('');
                setSelectedTypeFilter(null);
              }}
              style={styles.emptyStateButton}
            />
          </View>
        ) : (
          renderEmptyState()
        )
      ) : (
        <FlatList
          data={getFilteredLists()}
          renderItem={renderList}
          keyExtractor={(item) => item.id}
          style={styles.listsContainer}
          contentContainerStyle={styles.listsContent}
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

      {/* Modal pour créer une nouvelle liste */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouvelle liste</Text>
            
            <Input
              label="Titre de la liste"
              placeholder="Ex: Courses du week-end"
              value={newList.title}
              onChangeText={(text) => setNewList(prev => ({ ...prev, title: text }))}
              style={styles.modalInput}
            />

            <Text style={styles.modalLabel}>Type de liste</Text>
            <View style={styles.typeSelector}>
              {listTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeOption,
                    newList.type === type.value && styles.typeOptionActive,
                    { borderColor: type.color }
                  ]}
                  onPress={() => setNewList(prev => ({ 
                    ...prev, 
                    type: type.value as SharedList['type'],
                    color: type.color,
                    icon: type.icon
                  }))}
                >
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                  <Text style={[
                    styles.typeLabel,
                    newList.type === type.value && styles.typeLabelActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleCreateList}
                disabled={!newList.title.trim()}
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 12,
    minHeight: 70,
  },
  searchInput: {
    flex: 1,
    marginLeft: 16,
    marginRight: 24,
    marginBottom: 0,
    fontSize: 18,
    minHeight: 50,
    paddingVertical: 12,
  },
  clearSearchButton: {
    padding: 6,
    marginLeft: 2,
  },
  filterButton: {
    padding: 6,
    marginLeft: 4,
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
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  listsContainer: {
    flex: 1,
  },
  listsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listIcon: {
    fontSize: 24,
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  listType: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  listStats: {
    fontSize: 12,
    color: colors.textLight,
  },
  listTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    minWidth: 30,
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
    paddingVertical: 60,
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
    marginTop: 8,
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  typeOption: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.divider,
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  typeOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  typeLabelActive: {
    color: colors.textOnPrimary,
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
