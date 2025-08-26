import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useCouple } from '../../hooks/useCouple';
import { AuthService } from '../../services/firebase/auth.service';
import { Ionicons } from '@expo/vector-icons';

interface CoupleInfoScreenProps {
  navigation: any;
}

interface CoupleMember {
  id: string;
  displayName: string;
  email: string;
  isCurrentUser: boolean;
}

export const CoupleInfoScreen: React.FC<CoupleInfoScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { couple, generateInviteCode } = useCouple();
  const [members, setMembers] = useState<CoupleMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  useEffect(() => {
    loadCoupleMembers();
  }, [couple]);

  const loadCoupleMembers = async () => {
    if (!couple?.users) {
      setIsLoading(false);
      return;
    }

    try {
      const membersData: CoupleMember[] = [];
      
      for (const userId of couple.users) {
        try {
          const userProfile = await AuthService.getUserProfile(userId);
          membersData.push({
            id: userId,
            displayName: userProfile?.firstName || userProfile?.displayName || 'Utilisateur',
            email: userProfile?.email || 'Email inconnu',
            isCurrentUser: userId === user?.uid,
          });
        } catch (error) {
          console.error('Error fetching user profile:', error);
          membersData.push({
            id: userId,
            displayName: 'Utilisateur inconnu',
            email: 'Email inconnu',
            isCurrentUser: userId === user?.uid,
          });
        }
      }
      
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading couple members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInviteCode = async () => {
    try {
      setIsGeneratingCode(true);
      const code = await generateInviteCode();
      Alert.alert(
        'Code d\'invitation généré',
        `Code : ${code}\n\nCe code expire dans 24 heures.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de générer le code');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleLeaveCouple = () => {
    Alert.alert(
      'Quitter le couple',
      'Êtes-vous sûr de vouloir quitter ce couple ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Quitter (à venir)', 
          style: 'destructive',
          onPress: () => {
            // Fonctionnalité à implémenter ultérieurement
          }
        }
      ]
    );
  };

  const renderInfoCard = (title: string, value: string, icon: string, color?: string) => (
    <View style={styles.infoCard}>
      <View style={[styles.infoIcon, { backgroundColor: color || colors.primary + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color || colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  const renderMemberCard = (member: CoupleMember) => (
    <View key={member.id} style={styles.memberCard}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>
          {member.displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {member.displayName}
          {member.isCurrentUser && (
            <Text style={styles.currentUserBadge}> (Vous)</Text>
          )}
        </Text>
        <Text style={styles.memberEmail}>{member.email}</Text>
      </View>
      <View style={styles.memberStatus}>
        <View style={styles.onlineIndicator} />
        <Text style={styles.statusText}>En ligne</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Informations du couple"
          icon="heart"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des informations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!couple) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Informations du couple"
          icon="heart"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="heart-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.errorTitle}>Aucun couple trouvé</Text>
          <Text style={styles.errorText}>
            Vous n'êtes pas encore en couple ou il y a eu une erreur de chargement.
          </Text>
          <Button
            title="Retour aux paramètres"
            onPress={() => navigation.goBack()}
            variant="primary"
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const startDate = couple.startDate?.toDate?.()?.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) || 'Date inconnue';

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Informations du couple"
        icon="heart"
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* En-tête du couple */}
        <View style={styles.coupleHeader}>
          <View style={styles.coupleAvatar}>
            <Ionicons name="heart" size={32} color={colors.textOnPrimary} />
          </View>
          <Text style={styles.coupleTitle}>Votre Couple</Text>
          <Text style={styles.coupleSubtitle}>Créé le {startDate}</Text>
        </View>

        {/* Informations générales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations générales</Text>
          
          {renderInfoCard(
            'Date de création',
            startDate,
            'calendar-outline',
            colors.primary
          )}
          
          {renderInfoCard(
            'ID du couple',
            couple.id || 'ID inconnu',
            'finger-print-outline',
            colors.secondary
          )}
          
          {renderInfoCard(
            'Statut',
            'Actif',
            'checkmark-circle-outline',
            colors.success
          )}
          
          {renderInfoCard(
            'Chiffrement',
            'Activé',
            'shield-checkmark-outline',
            colors.warning
          )}
        </View>

        {/* Statistiques du couple */}
        {couple && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistiques du couple</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="chatbubble-outline" size={24} color={colors.primary} />
                <Text style={styles.statCardNumber}>{couple.stats?.messageCount || 0}</Text>
                <Text style={styles.statCardLabel}>Messages</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="flame-outline" size={24} color={colors.warning} />
                <Text style={styles.statCardNumber}>{couple.stats?.currentStreak || 0}</Text>
                <Text style={styles.statCardLabel}>Streak actuel</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="trophy-outline" size={24} color={colors.success} />
                <Text style={styles.statCardNumber}>{couple.stats?.longestStreak || 0}</Text>
                <Text style={styles.statCardLabel}>Meilleur streak</Text>
              </View>
            </View>
          </View>
        )}

        {/* Membres du couple */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membres du couple</Text>
          <Text style={styles.sectionSubtitle}>
            {members.length} membre{members.length > 1 ? 's' : ''}
          </Text>
          
          {members.map(renderMemberCard)}
        </View>

        {/* Fonctionnalités */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fonctionnalités activées</Text>
          
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
              <Text style={styles.featureText}>Messages</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              <Text style={styles.featureText}>Agenda</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="time-outline" size={24} color={colors.primary} />
              <Text style={styles.featureText}>Capsules</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="list-outline" size={24} color={colors.primary} />
              <Text style={styles.featureText}>Listes</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="card-outline" size={24} color={colors.primary} />
              <Text style={styles.featureText}>Budget</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="document-text-outline" size={24} color={colors.primary} />
              <Text style={styles.featureText}>Notes</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <Button
            title={isGeneratingCode ? "Génération..." : "Générer un code d'invitation"}
            onPress={handleGenerateInviteCode}
            variant="primary"
            style={styles.actionButton}
            disabled={isGeneratingCode}
            icon={isGeneratingCode ? undefined : "ticket-outline"}
          />
          
          <Button
            title="Gérer les dates marquantes"
            onPress={() => navigation.navigate('Organization', { screen: 'Milestones' })}
            variant="outline"
            style={styles.actionButton}
            icon="heart-outline"
          />
          
          <Button
            title="Quitter le couple"
            onPress={handleLeaveCouple}
            variant="outline"
            style={styles.leaveButton}
            textStyle={styles.leaveButtonText}
            icon="exit-outline"
          />
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    width: '100%',
  },
  coupleHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  coupleAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  coupleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  coupleSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...colors.shadow,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...colors.shadow,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  currentUserBadge: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  memberEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  memberStatus: {
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    ...colors.shadow,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    ...colors.shadow,
  },
  statCardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actionButton: {
    marginBottom: 12,
  },
  leaveButton: {
    borderColor: colors.error,
  },
  leaveButtonText: {
    color: colors.error,
  },
});
