import React, { useEffect, useState, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { Header } from '../../../components/common/Header';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { useAuth } from '../../../hooks/useAuth';
import { useCouple } from '../../../hooks/useCouple';
import { FirestoreService } from '../../../services/firebase/firestore.service';
import { TimeCapsule } from '../../../types';

interface CapsulesScreenProps {
  navigation: any;
}

export const CapsulesScreen: React.FC<CapsulesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCapsuleModal, setShowCapsuleModal] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState<TimeCapsule | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'closed'>('all');
  
  // État pour la création de capsule
  const [newCapsule, setNewCapsule] = useState({
    message: '',
    timeToOpen: '7',
    timeUnit: 'days' as 'seconds' | 'minutes' | 'hours' | 'days',
    title: '',
  });
  const [showTimeUnitDropdown, setShowTimeUnitDropdown] = useState(false);

  // Charger les capsules
  const loadCapsules = useCallback(async (retryCount = 0) => {
    if (!couple) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const list = await FirestoreService.getCapsules(couple.id, true);
      setCapsules(list);
    } catch (error: any) {
      console.error('Error loading capsules:', error);
      const errorMessage = error.message || 'Impossible de charger les capsules';
      setError(errorMessage);
      
      // Retry automatique en cas d'erreur réseau
      if (retryCount < 3 && error.code === 'unavailable') {
        setTimeout(() => loadCapsules(retryCount + 1), 2000);
      } else {
        Alert.alert('Erreur', errorMessage);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [couple]);

  useEffect(() => {
    if (couple) {
      loadCapsules();
    }
  }, [couple, loadCapsules]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCapsules();
  };

  const handleCreateCapsule = async () => {
    if (!couple || !user) {
      Alert.alert('Erreur', 'Vous devez être connecté et faire partie d\'un couple');
      return;
    }
    
    // Validation robuste
    if (!newCapsule.title.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un titre pour la capsule');
      return;
    }

    if (newCapsule.title.trim().length < 3) {
      Alert.alert('Erreur', 'Le titre doit contenir au moins 3 caractères');
      return;
    }

    if (newCapsule.title.trim().length > 50) {
      Alert.alert('Erreur', 'Le titre ne peut pas dépasser 50 caractères');
      return;
    }

    if (!newCapsule.message.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un message');
      return;
    }
    
    if (newCapsule.message.trim().length < 10) {
      Alert.alert('Erreur', 'Le message doit contenir au moins 10 caractères');
      return;
    }

    if (newCapsule.message.trim().length > 1000) {
      Alert.alert('Erreur', 'Le message ne peut pas dépasser 1000 caractères');
      return;
    }

    const timeValue = parseInt(newCapsule.timeToOpen, 10);
    if (isNaN(timeValue) || timeValue <= 0) {
      Alert.alert('Erreur', 'La durée doit être supérieure à 0');
      return;
    }

    // Validation selon l'unité de temps
    const maxValues = {
      seconds: 86400, // 24 heures max
      minutes: 1440,  // 24 heures max
      hours: 8760,    // 1 an max
      days: 3650      // 10 ans max
    };

    if (timeValue > maxValues[newCapsule.timeUnit]) {
      const maxLabels = {
        seconds: '24 heures (86400 secondes)',
        minutes: '24 heures (1440 minutes)',
        hours: '1 an (8760 heures)',
        days: '10 ans (3650 jours)'
      };
      Alert.alert('Erreur', `La durée ne peut pas dépasser ${maxLabels[newCapsule.timeUnit]}`);
      return;
    }
    
    try {
      const openDate = new Date();
      
      // Calculer la date d'ouverture selon l'unité
      switch (newCapsule.timeUnit) {
        case 'seconds':
          openDate.setSeconds(openDate.getSeconds() + timeValue);
          break;
        case 'minutes':
          openDate.setMinutes(openDate.getMinutes() + timeValue);
          break;
        case 'hours':
          openDate.setHours(openDate.getHours() + timeValue);
          break;
        case 'days':
          openDate.setDate(openDate.getDate() + timeValue);
          break;
      }
      
      await FirestoreService.createCapsule(
        couple.id, 
        newCapsule.message.trim(), 
        openDate, 
        user.uid
      );
      
      setNewCapsule({
        message: '',
        timeToOpen: '7',
        timeUnit: 'days',
        title: '',
      });
      setShowCreateModal(false);
      await loadCapsules();
      Alert.alert('Succès', 'Capsule créée avec succès');
    } catch (error: any) {
      console.error('Error creating capsule:', error);
      const errorMessage = error.message || 'Erreur lors de la création de la capsule';
      Alert.alert('Erreur', errorMessage);
    }
  };

  const handleOpenCapsule = async (capsule: TimeCapsule) => {
    if (!couple) return;

    Alert.alert(
      'Ouvrir la capsule',
      'Êtes-vous sûr de vouloir ouvrir cette capsule ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Ouvrir',
          onPress: async () => {
            try {
              await FirestoreService.openCapsule(couple.id, capsule.id);
              await loadCapsules();
              Alert.alert('Succès', 'Capsule ouverte avec succès');
            } catch (error: any) {
              console.error('Error opening capsule:', error);
              Alert.alert('Erreur', 'Impossible d\'ouvrir la capsule');
            }
          },
        },
      ]
    );
  };

  const handleDeleteCapsule = async (capsule: TimeCapsule) => {
    if (!couple) return;

    Alert.alert(
      'Supprimer la capsule',
      'Êtes-vous sûr de vouloir supprimer cette capsule ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirestoreService.deleteCapsule(couple.id, capsule.id);
              await loadCapsules();
              Alert.alert('Succès', 'Capsule supprimée avec succès');
            } catch (error: any) {
              console.error('Error deleting capsule:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la capsule');
            }
          },
        },
      ]
    );
  };

  const canOpen = (capsule: TimeCapsule) => {
    const now = new Date();
    let openDate: Date;
    if (typeof capsule.openDate === 'object' && capsule.openDate.toDate) {
      openDate = capsule.openDate.toDate();
    } else {
      openDate = new Date(capsule.openDate as any);
    }
    return now >= openDate && !capsule.isOpen;
  };

  const getTimeRemaining = (capsule: TimeCapsule) => {
    const now = new Date();
    let openDate: Date;
    if (typeof capsule.openDate === 'object' && capsule.openDate.toDate) {
      openDate = capsule.openDate.toDate();
    } else {
      openDate = new Date(capsule.openDate as any);
    }
    
    const diffTime = openDate.getTime() - now.getTime();
    
    if (diffTime <= 0) return 'Prêt à ouvrir';
    
    const diffSeconds = Math.ceil(diffTime / 1000);
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffSeconds < 60) return `${diffSeconds} seconde${diffSeconds > 1 ? 's' : ''} restante${diffSeconds > 1 ? 's' : ''}`;
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} restante${diffMinutes > 1 ? 's' : ''}`;
    if (diffHours < 24) return `${diffHours} heure${diffHours > 1 ? 's' : ''} restante${diffHours > 1 ? 's' : ''}`;
    if (diffDays === 1) return '1 jour restant';
    if (diffDays < 7) return `${diffDays} jours restants`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} semaine${Math.ceil(diffDays / 7) > 1 ? 's' : ''} restante${Math.ceil(diffDays / 7) > 1 ? 's' : ''}`;
    return `${Math.ceil(diffDays / 30)} mois restants`;
  };

  const getFilteredCapsules = () => {
    switch (activeTab) {
      case 'open':
        return capsules.filter(capsule => capsule.isOpen);
      case 'closed':
        return capsules.filter(capsule => !capsule.isOpen);
      default:
        return capsules;
    }
  };

  const renderCapsule = ({ item: capsule }: { item: TimeCapsule }) => {
    let openDate: Date;
    if (typeof capsule.openDate === 'object' && capsule.openDate.toDate) {
      openDate = capsule.openDate.toDate();
    } else {
      openDate = new Date(capsule.openDate as any);
    }
    
    const dateStr = openDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return (
      <TouchableOpacity
        style={styles.capsuleCard}
        onPress={() => {
          setSelectedCapsule(capsule);
          setShowCapsuleModal(true);
        }}
      >
        <View style={styles.capsuleHeader}>
          <View style={[styles.capsuleIcon, { backgroundColor: capsule.isOpen ? colors.success : colors.warning }]}>
            <Ionicons 
              name={capsule.isOpen ? "lock-open" : "lock-closed"} 
              size={24} 
              color={colors.textOnPrimary} 
            />
          </View>
          <View style={styles.capsuleInfo}>
            <Text style={styles.capsuleTitle}>
              {capsule.isOpen ? 'Capsule ouverte' : 'Capsule verrouillée'}
            </Text>
            <Text style={styles.capsuleDate}>
              <Ionicons name="calendar" size={12} color={colors.textSecondary} />
              {' '}Ouverture: {dateStr}
            </Text>
            {!capsule.isOpen && (
              <Text style={styles.capsuleTimeRemaining}>
                <Ionicons name="time" size={12} color={colors.textSecondary} />
                {' '}{getTimeRemaining(capsule)}
              </Text>
            )}
          </View>
          <View style={styles.capsuleActions}>
            {canOpen(capsule) && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleOpenCapsule(capsule);
                }}
              >
                <Ionicons name="lock-open" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteCapsule(capsule);
              }}
            >
              <Ionicons name="trash" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {capsule.isOpen && capsule.message ? (
          <Text style={styles.capsuleMessage} numberOfLines={3}>
            {capsule.message}
          </Text>
        ) : (
          <Text style={styles.capsulePlaceholder}>
            Le message sera lisible à l'ouverture.
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="time-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>Aucune capsule</Text>
      <Text style={styles.emptyStateText}>
        Créez votre première capsule pour envoyer un message au futur
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
        onPress={() => loadCapsules()}
        style={styles.retryButton}
      />
    </View>
  );

  const filteredCapsules = getFilteredCapsules();
  const stats = {
    total: capsules.length,
    open: capsules.filter(c => c.isOpen).length,
    closed: capsules.filter(c => !c.isOpen).length,
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Capsules temporelles"
        icon="time"
        subtitle="Des messages pour le futur"
        rightAction={{
          icon: "add",
          onPress: () => setShowCreateModal(true)
        }}
      />

      <ScrollView
        style={styles.content}
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
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Ouvertes</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.open}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Fermées</Text>
            <Text style={[styles.statValue, { color: colors.warning }]}>{stats.closed}</Text>
          </View>
        </View>

        {/* Onglets */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
              Toutes ({stats.total})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'open' && styles.activeTab]}
            onPress={() => setActiveTab('open')}
          >
            <Text style={[styles.tabText, activeTab === 'open' && styles.activeTabText]}>
              Ouvertes ({stats.open})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'closed' && styles.activeTab]}
            onPress={() => setActiveTab('closed')}
          >
            <Text style={[styles.tabText, activeTab === 'closed' && styles.activeTabText]}>
              Fermées ({stats.closed})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Liste des capsules */}
        <View style={styles.capsulesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Capsules</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={20} color={colors.textOnPrimary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Chargement des capsules...</Text>
            </View>
          ) : error ? (
            renderErrorState()
          ) : filteredCapsules.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={filteredCapsules}
              renderItem={renderCapsule}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Modal de création */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCreateModal(false);
          setShowTimeUnitDropdown(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nouvelle capsule</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowCreateModal(false);
                    setShowTimeUnitDropdown(false);
                  }}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
          </View>

              <View style={styles.modalBody}>
                <Input
                  label="Titre de la capsule"
                  value={newCapsule.title}
                  onChangeText={(text) => setNewCapsule({...newCapsule, title: text})}
                  placeholder="Ex: Message pour notre anniversaire"
                  maxLength={50}
                />

          <Input
            label="Message"
                  value={newCapsule.message}
                  onChangeText={(text) => setNewCapsule({...newCapsule, message: text})}
                  placeholder="Votre message pour le futur..."
            multiline
                  numberOfLines={6}
                  maxLength={1000}
          />

                <View style={styles.timeInputContainer}>
                  <View style={styles.timeValueContainer}>
          <Input
                      label="Durée d'ouverture"
                      value={newCapsule.timeToOpen}
                      onChangeText={(text) => setNewCapsule({...newCapsule, timeToOpen: text})}
            placeholder="7"
            keyboardType="numeric"
                      maxLength={5}
                      style={styles.timeInput}
                    />
                  </View>
                  
                  <View style={styles.timeUnitContainer}>
                    <Text style={styles.timeUnitLabel}>Unité</Text>
                    <TouchableOpacity
                      style={styles.timeUnitDropdown}
                      onPress={() => setShowTimeUnitDropdown(!showTimeUnitDropdown)}
                    >
                      <Text style={styles.timeUnitText}>
                        {newCapsule.timeUnit === 'seconds' ? 'Seconde(s)' :
                         newCapsule.timeUnit === 'minutes' ? 'Minute(s)' :
                         newCapsule.timeUnit === 'hours' ? 'Heure(s)' :
                         'Jour(s)'}
                      </Text>
                      <Ionicons 
                        name={showTimeUnitDropdown ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color={colors.textSecondary} 
                      />
                    </TouchableOpacity>

                    {showTimeUnitDropdown && (
                      <View style={styles.timeUnitList}>
                        {[
                          { value: 'seconds', label: 'Seconde(s)', hint: 'max 24h' },
                          { value: 'minutes', label: 'Minute(s)', hint: 'max 24h' },
                          { value: 'hours', label: 'Heure(s)', hint: 'max 1 an' },
                          { value: 'days', label: 'Jour(s)', hint: 'max 10 ans' },
                        ].map((unit) => (
                          <TouchableOpacity
                            key={unit.value}
                            style={[
                              styles.timeUnitItem,
                              newCapsule.timeUnit === unit.value && styles.timeUnitItemSelected
                            ]}
                            onPress={() => {
                              setNewCapsule({...newCapsule, timeUnit: unit.value as any});
                              setShowTimeUnitDropdown(false);
                            }}
                          >
                            <View style={styles.timeUnitItemContent}>
                              <Text style={[
                                styles.timeUnitItemLabel,
                                newCapsule.timeUnit === unit.value && styles.timeUnitItemLabelSelected
                              ]}>
                                {unit.label}
                              </Text>
                              <Text style={styles.timeUnitItemHint}>
                                {unit.hint}
                              </Text>
                            </View>
                            {newCapsule.timeUnit === unit.value && (
                              <Ionicons name="checkmark" size={16} color={colors.primary} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <Button
                    title="Annuler"
                    onPress={() => {
                      setShowCreateModal(false);
                      setShowTimeUnitDropdown(false);
                    }}
                    style={styles.cancelButton}
                    textStyle={styles.cancelButtonText}
                  />
                  <Button
                    title="Créer"
                    onPress={handleCreateCapsule}
                    style={styles.createButton}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de détail de capsule */}
      <Modal
        visible={showCapsuleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCapsuleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails de la capsule</Text>
              <TouchableOpacity
                onPress={() => setShowCapsuleModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedCapsule && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.capsuleDetailHeader}>
                  <View style={[styles.capsuleIcon, { backgroundColor: selectedCapsule.isOpen ? colors.success : colors.warning }]}>
                                         <Ionicons 
                       name={selectedCapsule.isOpen ? "lock-open" : "lock-closed"} 
                       size={32} 
                       color={colors.textOnPrimary} 
                     />
                  </View>
                  <View style={styles.capsuleDetailInfo}>
                    <Text style={styles.capsuleDetailTitle}>
                      {selectedCapsule.isOpen ? 'Capsule ouverte' : 'Capsule verrouillée'}
                    </Text>
                    <Text style={styles.capsuleDetailDate}>
                      Ouverture: {new Date(selectedCapsule.openDate.toDate?.() || selectedCapsule.openDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                    {!selectedCapsule.isOpen && (
                      <Text style={styles.capsuleDetailTimeRemaining}>
                        {getTimeRemaining(selectedCapsule)}
                      </Text>
                    )}
                  </View>
                </View>

                {selectedCapsule.isOpen && selectedCapsule.message ? (
                  <View style={styles.messageContainer}>
                    <Text style={styles.messageLabel}>Message :</Text>
                    <Text style={styles.messageText}>{selectedCapsule.message}</Text>
              </View>
            ) : (
                  <View style={styles.messageContainer}>
                    <Text style={styles.messageLabel}>Message :</Text>
                    <Text style={styles.messagePlaceholder}>
                      Le message sera lisible à l'ouverture.
                    </Text>
                  </View>
                )}

                <View style={styles.capsuleDetailActions}>
                  {canOpen(selectedCapsule) && (
                    <Button
                      title="Ouvrir maintenant"
                      onPress={() => {
                        setShowCapsuleModal(false);
                        handleOpenCapsule(selectedCapsule);
                      }}
                      style={styles.openButton}
                    />
                  )}
                  <Button
                    title="Supprimer"
                    onPress={() => {
                      setShowCapsuleModal(false);
                      handleDeleteCapsule(selectedCapsule);
                    }}
                    style={styles.deleteButton}
                    textStyle={styles.deleteButtonText}
                  />
              </View>
              </ScrollView>
            )}
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
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textOnPrimary,
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...colors.shadow,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.textOnPrimary,
  },
  capsulesSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
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
  capsuleCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...colors.shadow,
  },
  capsuleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  capsuleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  capsuleDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  capsuleTimeRemaining: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
  },
  capsuleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
  },
  capsuleMessage: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  capsulePlaceholder: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalScrollView: {
    width: '100%',
    height: '100%',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    color: colors.text,
  },
  createButton: {
    flex: 2,
    backgroundColor: colors.primary,
  },
  capsuleDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  capsuleDetailInfo: {
    flex: 1,
    marginLeft: 16,
  },
  capsuleDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  capsuleDetailDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  capsuleDetailTimeRemaining: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: '500',
  },
  messageContainer: {
    marginBottom: 20,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    backgroundColor: colors.surfaceVariant,
    padding: 16,
    borderRadius: 8,
  },
  messagePlaceholder: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: 'italic',
    backgroundColor: colors.surfaceVariant,
    padding: 16,
    borderRadius: 8,
  },
  capsuleDetailActions: {
    gap: 12,
  },
  openButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  deleteButtonText: {
    color: colors.textOnPrimary,
  },
  timeInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  timeValueContainer: {
    flex: 2,
  },
  timeInput: {
    marginBottom: 0,
  },
  timeUnitContainer: {
    flex: 1,
  },
  timeUnitLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  timeUnitDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    minHeight: 48,
  },
  timeUnitText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  timeUnitList: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    zIndex: 1000,
    ...colors.shadow,
  },
  timeUnitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  timeUnitItemSelected: {
    backgroundColor: colors.primary + '20',
  },
  timeUnitItemContent: {
    flex: 1,
  },
  timeUnitItemLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  timeUnitItemLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  timeUnitItemHint: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});


