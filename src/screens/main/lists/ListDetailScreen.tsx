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
import { useAuth } from '../../../hooks/useAuth';
import { useCouple } from '../../../hooks/useCouple';
import { FirestoreService } from '../../../services/firebase/firestore.service';
import { SharedList, ListItem } from '../../../types';
import { Timestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

interface ListDetailScreenProps {
  navigation: any;
  route: any;
}

export const ListDetailScreen: React.FC<ListDetailScreenProps> = ({ navigation, route }) => {
  const { listId, list: initialList } = route.params;
  const { user } = useAuth();
  const { couple } = useCouple();
  const [list, setList] = useState<SharedList>(initialList);
  const [newItemText, setNewItemText] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (couple && listId) {
      loadList();
    }
  }, [couple, listId]);

  const loadList = useCallback(async (retryCount = 0) => {
    if (!couple || !listId) return;

    try {
      setIsLoading(true);
      setError(null);
      // Pour l'instant, on utilise la liste initiale
      // Plus tard, on pourrait charger depuis Firestore
      setList(initialList);
    } catch (error: any) {
      console.error('Error loading list:', error);
      setError('Erreur lors du chargement de la liste');
      
      // Retry automatique pour les erreurs réseau
      if (retryCount < 3 && error.code === 'unavailable') {
        setTimeout(() => loadList(retryCount + 1), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [couple, listId, initialList]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadList();
    setIsRefreshing(false);
  }, [loadList]);

  useEffect(() => {
    if (couple && listId) {
      loadList();
    }
  }, [couple, listId, loadList]);

  const handleAddItem = async () => {
    if (!couple || !user) {
      Alert.alert('Erreur', 'Vous devez être connecté et faire partie d\'un couple');
      return;
    }

    const text = newItemText.trim();

    if (text.length < 2) {
      Alert.alert('Erreur', 'L\'élément doit contenir au moins 2 caractères');
      return;
    }

    if (text.length > 200) {
      Alert.alert('Erreur', 'L\'élément ne peut pas dépasser 200 caractères');
      return;
    }

    try {
      setIsAddingItem(true);
      const newItem: ListItem = {
        id: Date.now().toString(), // Temporaire, devrait être généré par Firestore
        text,
        completed: false,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        priority: 'medium',
      };

      const updatedItems = [...list.items, newItem];
      const updatedList = { ...list, items: updatedItems };
      
      await FirestoreService.updateSharedList(couple.id, list.id, { items: updatedItems });
      setList(updatedList);
      setNewItemText('');
    } catch (error: any) {
      console.error('Error adding item:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de l\'ajout de l\'élément');
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleToggleItem = async (itemId: string) => {
    if (!couple || !user) return;

    try {
      const updatedItems = list.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            completed: !item.completed,
            completedAt: !item.completed ? Timestamp.now() : undefined,
          };
        }
        return item;
      });

      await FirestoreService.updateSharedList(couple.id, list.id, { items: updatedItems });
      setList({ ...list, items: updatedItems });
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!couple) return;

    try {
      const updatedItems = list.items.filter(item => item.id !== itemId);
      await FirestoreService.updateSharedList(couple.id, list.id, { items: updatedItems });
      setList({ ...list, items: updatedItems });
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const handleDeleteList = async () => {
    if (!couple) return;

    Alert.alert(
      'Supprimer la liste',
      'Êtes-vous sûr de vouloir supprimer cette liste ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirestoreService.deleteSharedList(couple.id, list.id);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    const isOwnItem = item.createdBy === user?.uid;
    const createdDate = item.createdAt?.toDate?.() || new Date(item.createdAt as any);
    const timeString = createdDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={[styles.itemCard, item.completed && styles.itemCardCompleted]}>
        <TouchableOpacity
          style={styles.itemCheckbox}
          onPress={() => handleToggleItem(item.id)}
        >
          <Ionicons 
            name={item.completed ? "checkmark-circle" : "ellipse-outline"} 
            size={24} 
            color={item.completed ? colors.success : colors.textSecondary} 
          />
        </TouchableOpacity>
        
        <View style={styles.itemContent}>
          <Text style={[
            styles.itemText,
            item.completed && styles.itemTextCompleted
          ]}>
            {item.text}
          </Text>
          <Text style={styles.itemTime}>
            {timeString} {isOwnItem ? '(vous)' : ''}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    );
  };

  const getProgress = () => {
    if (list.items.length === 0) return 0;
    const completed = list.items.filter(item => item.completed).length;
    return Math.round((completed / list.items.length) * 100);
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

  const typeInfo = getListTypeInfo(list.type);
  const progress = getProgress();

  return (
    <SafeAreaView style={styles.container}>
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
            <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{list.title}</Text>
            <Text style={styles.headerSubtitle}>
              {typeInfo.icon} {typeInfo.label} • {progress}% terminé
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.deleteListButton}
            onPress={handleDeleteList}
          >
            <Ionicons name="trash-outline" size={24} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Barre de progression */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${progress}%`,
                backgroundColor: list.color 
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>

      {/* Liste des éléments */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement de la liste...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.error} />
          <Text style={styles.errorStateTitle}>Erreur de chargement</Text>
          <Text style={styles.errorStateText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadList()}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={list.items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.itemsContainer}
          contentContainerStyle={styles.itemsContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={60} color={colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>Aucun élément</Text>
              <Text style={styles.emptyStateText}>
                Ajoutez votre premier élément à la liste !
              </Text>
            </View>
          }
        />
      )}

      {/* Input pour ajouter un élément */}
      <View style={styles.addItemContainer}>
        <View style={styles.addItemInput}>
          <TextInput
            style={styles.addItemTextInput}
            placeholder="Ajouter un élément..."
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[
              styles.addItemButton,
              !newItemText.trim() && styles.addItemButtonDisabled
            ]}
            onPress={handleAddItem}
            disabled={!newItemText.trim() || isAddingItem}
          >
                         <Ionicons 
               name={isAddingItem ? "hourglass-outline" : "add"} 
               size={24} 
               color={colors.textOnPrimary} 
             />
          </TouchableOpacity>
        </View>
      </View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textOnPrimary,
    opacity: 0.8,
  },
  deleteListButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    minWidth: 40,
  },
  itemsContainer: {
    flex: 1,
  },
  itemsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemCardCompleted: {
    opacity: 0.6,
  },
  itemCheckbox: {
    marginRight: 12,
  },

  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  itemTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  itemTime: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
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
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
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
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  addItemContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  addItemInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 50,
  },
  addItemTextInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
    minHeight: 40,
  },
  addItemButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  addItemButtonDisabled: {
    backgroundColor: colors.disabled,
  },

});
