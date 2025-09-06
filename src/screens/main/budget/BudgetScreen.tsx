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
import { Ionicons } from '@expo/vector-icons';
import { colors, shadowStyles } from '../../../constants/colors';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Header } from '../../../components/common/Header';
import { useAuth } from '../../../hooks/useAuth';
import { useCouple } from '../../../hooks/useCouple';
import { useBudget } from '../../../hooks/useBudget';
import { FirestoreService } from '../../../services/firebase/firestore.service';
import { Transaction } from '../../../types';

interface BudgetScreenProps {
  navigation: any;
}

export const BudgetScreen: React.FC<BudgetScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const { 
    transactions, 
    isLoading, 
    error, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction,
    customCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    clearError,
    refreshTransactions
  } = useBudget();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    title: '',
    amount: '',
    type: 'expense' as Transaction['type'],
    category: 'general' as Transaction['category'],
    date: new Date(),
    description: '',
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [deletedDefaultCategories, setDeletedDefaultCategories] = useState<string[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Le hook se charge automatiquement de rafraîchir
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleAddTransaction = async () => {
    if (!couple || !user) {
      Alert.alert('Erreur', 'Vous devez être connecté et faire partie d\'un couple');
      return;
    }

    // Validation robuste
    if (!newTransaction.title.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un titre');
      return;
    }

    if (newTransaction.title.trim().length < 2) {
      Alert.alert('Erreur', 'Le titre doit contenir au moins 2 caractères');
      return;
    }

    const amount = parseFloat(newTransaction.amount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide (supérieur à 0)');
      return;
    }

    if (amount > 1000000) {
      Alert.alert('Erreur', 'Le montant ne peut pas dépasser 1 000 000€');
      return;
    }

    try {
      await FirestoreService.addTransaction(couple.id, {
        title: newTransaction.title.trim(),
        amount: amount,
        type: newTransaction.type as any,
        category: newTransaction.category,
        date: newTransaction.date as any,
        description: newTransaction.description.trim(),
        paidBy: user.uid,
        splitType: 'equal' as const,
      });

      setShowAddModal(false);
      setNewTransaction({
        title: '',
        amount: '',
        type: 'expense' as Transaction['type'],
        category: 'general',
        date: new Date(),
        description: '',
      });
      
      await refreshTransactions();
      Alert.alert('Succès', 'Transaction ajoutée avec succès');
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      const errorMessage = error.message || 'Erreur lors de la création de la transaction';
      Alert.alert('Erreur', errorMessage);
    }
  };

  const calculateStats = () => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpenses;
    
    return { totalIncome, totalExpenses, balance };
  };

  const handleAddCustomCategory = async () => {
    if (!newCategory.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom de catégorie');
      return;
    }

    if (newCategory.trim().length < 2) {
      Alert.alert('Erreur', 'Le nom de catégorie doit contenir au moins 2 caractères');
      return;
    }

    const categoryName = newCategory.trim().toLowerCase();
    if (customCategories.includes(categoryName)) {
      Alert.alert('Erreur', 'Cette catégorie existe déjà');
      return;
    }

    await addCategory(categoryName);
    setNewCategory('');
    setShowCategoryModal(false);
    Alert.alert('Succès', 'Catégorie ajoutée avec succès');
  };

  const handleEditCategory = (oldName: string) => {
    setEditingCategory(oldName);
    setNewCategory(oldName);
    setShowCategoryModal(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategory.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom de catégorie');
      return;
    }

    if (newCategory.trim().length < 2) {
      Alert.alert('Erreur', 'Le nom de catégorie doit contenir au moins 2 caractères');
      return;
    }

    const newName = newCategory.trim().toLowerCase();
    const allCategories = getAllCategories();
    
    if (newName !== editingCategory && allCategories.includes(newName)) {
      Alert.alert('Erreur', 'Cette catégorie existe déjà');
      return;
    }

    const defaultCategories = ['general', 'food', 'transport', 'entertainment', 'shopping', 'health', 'travel', 'bills', 'salary', 'gift'];
    
    // Si c'est une catégorie par défaut, on l'ajoute aux personnalisées et on la supprime des par défaut
    if (defaultCategories.includes(editingCategory)) {
      setDeletedDefaultCategories([...deletedDefaultCategories, editingCategory]);
      await addCategory(newName);
    } else {
      // Sinon, c'est une catégorie personnalisée, on la met à jour
      await updateCategory(editingCategory, newName);
    }

    // Mettre à jour la catégorie sélectionnée si elle était en cours d'édition
    if (newTransaction.category === editingCategory) {
      setNewTransaction({...newTransaction, category: newName as Transaction['category']});
    }

    setEditingCategory(null);
    setNewCategory('');
    setShowCategoryModal(false);
    Alert.alert('Succès', 'Catégorie modifiée avec succès');
  };

  const handleDeleteCategory = (categoryName: string) => {
    const defaultCategories = ['general', 'food', 'transport', 'entertainment', 'shopping', 'health', 'travel', 'bills', 'salary', 'gift'];
    const isDefaultCategory = defaultCategories.includes(categoryName);
    
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ?${isDefaultCategory ? '\n\nNote: Cette catégorie par défaut sera masquée.' : ''}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (isDefaultCategory) {
              // Pour une catégorie par défaut, on l'ajoute à la liste des supprimées
              setDeletedDefaultCategories([...deletedDefaultCategories, categoryName]);
            } else {
              // Pour une catégorie personnalisée, on la supprime de la liste
              await deleteCategory(categoryName);
            }
            
            // Si la catégorie supprimée était sélectionnée, trouver une alternative
            if (newTransaction.category === categoryName) {
              const remainingCategories = getAllCategories().filter(cat => cat !== categoryName);
              const fallbackCategory = remainingCategories.length > 0 ? remainingCategories[0] : 'general';
              setNewTransaction({...newTransaction, category: fallbackCategory as Transaction['category']});
            }
            
            Alert.alert('Succès', 'Catégorie supprimée avec succès');
          },
        },
      ]
    );
  };

  const handleRestoreCategory = (categoryName: string) => {
    Alert.alert(
      'Restaurer la catégorie',
      `Voulez-vous restaurer la catégorie "${categoryName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Restaurer',
          onPress: () => {
            const updatedDeleted = deletedDefaultCategories.filter(cat => cat !== categoryName);
            setDeletedDefaultCategories(updatedDeleted);
            Alert.alert('Succès', 'Catégorie restaurée avec succès');
          },
        },
      ]
    );
  };

  const getCategoryColor = (category: Transaction['category']) => {
    switch (category) {
      case 'food':
        return colors.warning;
      case 'transport':
        return colors.info;
      case 'entertainment':
        return colors.success;
      case 'shopping':
        return colors.primary;
      case 'health':
        return colors.error;
      case 'travel':
        return colors.secondary;
      case 'bills':
        return colors.textSecondary;
      case 'salary':
        return colors.success;
      case 'gift':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!couple) return;

    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette transaction ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirestoreService.deleteTransaction(couple.id, transactionId);
              await refreshTransactions();
              Alert.alert('Succès', 'Transaction supprimée avec succès');
            } catch (error: any) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la transaction');
            }
          },
        },
      ]
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const transactionDate = item.date.toDate?.() || new Date(item.date as any);
    const dateString = transactionDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
            <Text style={styles.categoryBadgeText}>{item.category.toUpperCase()}</Text>
          </View>
          
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>{item.title}</Text>
            <Text style={styles.transactionDate}>
              <Ionicons name="calendar" size={14} color={colors.textSecondary} />
              {' '}{dateString}
            </Text>
            {item.description && (
              <Text style={styles.transactionDescription}>{item.description}</Text>
            )}
          </View>
          
          <View style={styles.transactionAmount}>
            <Text style={[
              styles.amountText,
              { color: item.type === 'income' ? colors.success : colors.error }
            ]}>
              {item.type === 'income' ? '+' : '-'}{item.amount.toFixed(2)}€
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteTransaction(item.id)}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="wallet-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>Aucune transaction</Text>
      <Text style={styles.emptyStateText}>
        Commencez par ajouter votre première transaction pour suivre vos finances
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
      <Text style={styles.errorStateTitle}>Erreur de chargement</Text>
      <Text style={styles.errorStateText}>{error}</Text>
      <Button
        title="Réessayer"
        onPress={() => refreshTransactions()}
        style={styles.retryButton}
      />
    </View>
  );

  const getAllCategories = () => {
    const defaultCategories = [
      'general', 'food', 'transport', 'entertainment', 'shopping', 
      'health', 'travel', 'bills', 'salary', 'gift'
    ];
    // Filtrer les catégories par défaut supprimées
    const visibleDefaultCategories = defaultCategories.filter(cat => 
      !deletedDefaultCategories.includes(cat)
    );
    return [...visibleDefaultCategories, ...customCategories];
  };

  const categoryOptions = getAllCategories().map(category => ({
    value: category,
    label: category.charAt(0).toUpperCase() + category.slice(1),
  }));

  const stats = calculateStats();

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Budget"
        icon="wallet"
        subtitle="Gérez vos finances"
        rightAction={{
          icon: "add",
          onPress: () => setShowAddModal(true)
        }}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >


        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Revenus</Text>
            <Text style={[styles.statAmount, { color: colors.success }]}>
              +€{stats.totalIncome.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Dépenses</Text>
            <Text style={[styles.statAmount, { color: colors.error }]}>
              -€{stats.totalExpenses.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Solde</Text>
            <Text style={[
              styles.statAmount,
              { color: stats.balance >= 0 ? colors.success : colors.error }
            ]}>
              {stats.balance >= 0 ? '+' : ''}€{stats.balance.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Liste des transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Transactions du mois</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Chargement des transactions...</Text>
            </View>
          ) : error ? (
            renderErrorState()
          ) : transactions.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={transactions}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              style={styles.transactionsList}
            />
          )}
        </View>
      </ScrollView>

      {/* Modal d'ajout de transaction */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddModal(false);
          setShowCategoryDropdown(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nouvelle transaction</Text>
              
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newTransaction.type === 'expense' && styles.typeButtonSelected
                  ]}
                  onPress={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                >
                  <Text style={styles.typeButtonText}>💸 Dépense</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newTransaction.type === 'income' && styles.typeButtonSelected
                  ]}
                  onPress={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                >
                  <Text style={styles.typeButtonText}>💰 Revenu</Text>
                </TouchableOpacity>
              </View>

              <Input
                label="Titre"
                placeholder="Titre de la transaction"
                value={newTransaction.title}
                onChangeText={(text) => setNewTransaction({ ...newTransaction, title: text })}
              />

              <Input
                label="Montant (€)"
                placeholder="0.00"
                value={newTransaction.amount}
                onChangeText={(text) => setNewTransaction({ ...newTransaction, amount: text })}
                keyboardType="numeric"
              />

              <Input
                label="Description"
                placeholder="Description (optionnel)"
                value={newTransaction.description}
                onChangeText={(text) => setNewTransaction({ ...newTransaction, description: text })}
                multiline
                numberOfLines={3}
              />

              <View style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryLabel}>Catégorie</Text>
                  <View style={styles.categoryActions}>
                    <TouchableOpacity
                      style={styles.manageCategoryButton}
                      onPress={() => setShowCategoryManagement(true)}
                    >
                      <Ionicons name="settings" size={16} color={colors.textSecondary} />
                      <Text style={styles.manageCategoryText}>Gérer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addCategoryButton}
                      onPress={() => {
                        setEditingCategory(null);
                        setNewCategory('');
                        setShowCategoryModal(true);
                      }}
                    >
                      <Ionicons name="add" size={16} color={colors.primary} />
                      <Text style={styles.addCategoryText}>Nouvelle</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Dropdown de catégories */}
                <TouchableOpacity
                  style={styles.categoryDropdown}
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <View style={styles.dropdownHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(newTransaction.category) }]}>
                      <Text style={styles.categoryBadgeText}>{newTransaction.category.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.dropdownLabel}>
                      {newTransaction.category.charAt(0).toUpperCase() + newTransaction.category.slice(1)}
                    </Text>
                  </View>
                  <Ionicons 
                    name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>

                {/* Liste déroulante */}
                {showCategoryDropdown && (
                  <View style={styles.dropdownList}>
                    {categoryOptions.map((category) => (
                      <TouchableOpacity
                        key={category.value}
                        style={[
                          styles.dropdownItem,
                          newTransaction.category === category.value && styles.dropdownItemSelected
                        ]}
                        onPress={() => {
                          setNewTransaction({ ...newTransaction, category: category.value as Transaction['category'] });
                          setShowCategoryDropdown(false);
                        }}
                      >
                        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(category.value as Transaction['category']) }]}>
                          <Text style={styles.categoryBadgeText}>{category.value.toUpperCase()}</Text>
                        </View>
                        <Text style={[
                          styles.dropdownItemLabel,
                          newTransaction.category === category.value && styles.dropdownItemLabelSelected
                        ]}>
                          {category.label}
                        </Text>
                        {newTransaction.category === category.value && (
                          <Ionicons name="checkmark" size={16} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.modalButtons}>
                <Button
                  title="Annuler"
                  onPress={() => {
                    setShowAddModal(false);
                    setShowCategoryDropdown(false);
                  }}
                  variant="outline"
                  style={styles.modalButton}
                />
                <Button
                  title="Ajouter"
                  onPress={handleAddTransaction}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </ScrollView>
      </View>
      </Modal>

      {/* Modal d'ajout/modification de catégorie */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                  setNewCategory('');
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Input
                label="Nom de la catégorie"
                value={newCategory}
                onChangeText={setNewCategory}
                placeholder="Ex: Restaurant, Sport, etc."
                maxLength={20}
              />
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Annuler"
                onPress={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                  setNewCategory('');
                }}
                style={styles.cancelButton}
                textStyle={styles.cancelButtonText}
              />
              <Button
                title={editingCategory ? "Modifier" : "Ajouter"}
                onPress={editingCategory ? handleUpdateCategory : handleAddCustomCategory}
                style={styles.addCategoryConfirmButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de gestion des catégories */}
      <Modal
        visible={showCategoryManagement}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryManagement(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gérer les catégories</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryManagement(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.categoryManagementSection}>
                <Text style={styles.sectionTitle}>Catégories par défaut</Text>
                <View style={styles.defaultCategoriesList}>
                  {['general', 'food', 'transport', 'entertainment', 'shopping', 'health', 'travel', 'bills', 'salary', 'gift']
                    .filter(cat => !deletedDefaultCategories.includes(cat))
                    .map((category) => (
                    <View key={category} style={styles.categoryManagementItem}>
                      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(category as Transaction['category']) }]}>
                        <Text style={styles.categoryBadgeText}>{category.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.categoryManagementLabel}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                      <View style={styles.categoryManagementActions}>
                        <TouchableOpacity
                          style={styles.editCategoryButton}
                          onPress={() => {
                            setShowCategoryManagement(false);
                            handleEditCategory(category);
                          }}
                        >
                          <Ionicons name="pencil" size={16} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteCategoryButton}
                          onPress={() => handleDeleteCategory(category)}
                        >
                          <Ionicons name="trash" size={16} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {customCategories.length > 0 && (
                <View style={styles.categoryManagementSection}>
                  <Text style={styles.sectionTitle}>Catégories personnalisées</Text>
                  <View style={styles.customCategoriesList}>
                    {customCategories.map((category) => (
                      <View key={category} style={styles.categoryManagementItem}>
                        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(category as Transaction['category']) }]}>
                          <Text style={styles.categoryBadgeText}>{category.toUpperCase()}</Text>
                        </View>
                        <Text style={styles.categoryManagementLabel}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                        <View style={styles.categoryManagementActions}>
                          <TouchableOpacity
                            style={styles.editCategoryButton}
                            onPress={() => {
                              setShowCategoryManagement(false);
                              handleEditCategory(category);
                            }}
                          >
                            <Ionicons name="pencil" size={16} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteCategoryButton}
                            onPress={() => handleDeleteCategory(category)}
                          >
                            <Ionicons name="trash" size={16} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {deletedDefaultCategories.length > 0 && (
                <View style={styles.categoryManagementSection}>
                  <Text style={styles.sectionTitle}>Catégories supprimées</Text>
                  <View style={styles.deletedCategoriesList}>
                    {deletedDefaultCategories.map((category) => (
                      <View key={category} style={styles.categoryManagementItem}>
                        <View style={[styles.categoryBadge, { backgroundColor: colors.textSecondary, opacity: 0.5 }]}>
                          <Text style={styles.categoryBadgeText}>{category.toUpperCase()}</Text>
                        </View>
                        <Text style={[styles.categoryManagementLabel, { opacity: 0.5 }]}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                        <View style={styles.categoryManagementActions}>
                          <TouchableOpacity
                            style={styles.restoreCategoryButton}
                            onPress={() => handleRestoreCategory(category)}
                          >
                            <Ionicons name="refresh" size={16} color={colors.success} />
                            <Text style={styles.restoreCategoryText}>Restaurer</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.addCategorySection}>
                <Button
                  title="Ajouter une nouvelle catégorie"
                  onPress={() => {
                    setShowCategoryManagement(false);
                    setEditingCategory(null);
                    setNewCategory('');
                    setShowCategoryModal(true);
                  }}
                  style={styles.addNewCategoryButton}
                />
              </View>
            </ScrollView>
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
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsButton: {
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
  addButtonText: {
    fontSize: 24,
    color: colors.textOnPrimary,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
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
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionsSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  errorState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.error,
    marginTop: 16,
  },
  errorStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...shadowStyles,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deleteButton: {
    padding: 4,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  categorySection: {
    marginVertical: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  manageCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
    gap: 4,
  },
  manageCategoryText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
    gap: 4,
  },
  addCategoryText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  dropdownLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  dropdownList: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dropdownItemSelected: {
    backgroundColor: colors.primary + '20',
  },
  dropdownItemLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  dropdownItemLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  closeButton: {
    padding: 4,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    color: colors.text,
  },
  addCategoryConfirmButton: {
    flex: 2,
    backgroundColor: colors.primary,
  },
  categoryManagementSection: {
    marginBottom: 24,
  },
  // sectionTitle: { // Dupliqué, supprimé
  //   fontSize: 18,
  //   fontWeight: 'bold',
  //   color: colors.text,
  //   marginBottom: 16,
  // },
  defaultCategoriesList: {
    gap: 12,
  },
  customCategoriesList: {
    gap: 12,
  },
  categoryManagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    gap: 12,
  },
  categoryManagementLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  categoryManagementActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultCategoryText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  editCategoryButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
  },
  deleteCategoryButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
  },
  addCategorySection: {
    marginTop: 16,
  },
  addNewCategoryButton: {
    backgroundColor: colors.primary,
  },
  deletedCategoriesList: {
    gap: 12,
  },
  restoreCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.success + '20',
    gap: 4,
  },
  restoreCategoryText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
});
