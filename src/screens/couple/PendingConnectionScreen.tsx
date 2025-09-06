import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadowStyles } from '../../constants/colors';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { useCouple } from '../../hooks/useCouple';
import { useAuth } from '../../hooks/useAuth';

interface PendingConnectionScreenProps {
  navigation: any;
}

export const PendingConnectionScreen: React.FC<PendingConnectionScreenProps> = ({ navigation }) => {
  const { couple, refreshCouple, isLoading } = useCouple();
  const { user } = useAuth();
  const [partnerEmail, setPartnerEmail] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Récupérer l'email du partenaire depuis les invitations ou le couple
    loadPartnerEmail();
  }, [couple]);

  const loadPartnerEmail = async () => {
    // Si le couple existe et a des utilisateurs, on peut déduire l'email du partenaire
    // Pour l'instant, on va utiliser une méthode simple
    if (couple && couple.users && couple.users.length === 1) {
      // Couple créé mais pas encore complet
      setPartnerEmail('Partenaire invité'); // Placeholder
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshCouple();
      
      // Vérifier si le couple est maintenant complet
      if (couple && couple.users && couple.users.length >= 2) {
        Alert.alert(
          'Couple complet ! 🎉',
          'Votre partenaire a rejoint le couple !',
          [
            { 
              text: 'Voir le couple', 
              onPress: () => navigation.navigate('Settings', { screen: 'CoupleInfo' })
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de rafraîchir les données');
    } finally {
      setRefreshing(false);
    }
  };

  const handleResendInvitation = () => {
    Alert.alert(
      'Renvoyer l\'invitation',
      'Cette fonctionnalité sera bientôt disponible. Votre partenaire peut rejoindre le couple avec votre email et le PIN que vous avez créé.',
      [{ text: 'OK' }]
    );
  };

  const handleCancelCouple = () => {
    Alert.alert(
      'Annuler le couple',
      'Êtes-vous sûr de vouloir annuler ce couple ? Cette action supprimera le couple en attente.',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: () => {
            // TODO: Implémenter la suppression du couple en attente
            Alert.alert('Fonctionnalité', 'Cette fonctionnalité sera bientôt disponible.');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Attente de connexion"
        icon="time-outline"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Icône principale */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Ionicons name="hourglass-outline" size={64} color={colors.warning} />
          </View>
        </View>

        {/* Titre et message */}
        <Text style={styles.title}>En attente de connexion</Text>
        <Text style={styles.subtitle}>
          Votre couple a été créé avec succès !
        </Text>

        {/* Étapes de progression */}
        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={[styles.stepIcon, styles.stepCompleted]}>
              <Ionicons name="checkmark" size={20} color={colors.textOnPrimary} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Couple créé</Text>
              <Text style={styles.stepDescription}>Votre couple a été créé avec succès</Text>
            </View>
          </View>

          <View style={styles.stepConnector} />

          <View style={styles.step}>
            <View style={[styles.stepIcon, styles.stepPending]}>
              <Ionicons name="time-outline" size={20} color={colors.warning} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Invitation envoyée</Text>
              <Text style={styles.stepDescription}>En attente d'acceptation du partenaire</Text>
            </View>
          </View>

          <View style={styles.stepConnector} />

          <View style={styles.step}>
            <View style={[styles.stepIcon, styles.stepInactive]}>
              <Ionicons name="heart-outline" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, styles.stepInactiveText]}>Couple complet</Text>
              <Text style={[styles.stepDescription, styles.stepInactiveText]}>
                Prêt à utiliser toutes les fonctionnalités
              </Text>
            </View>
          </View>
        </View>

        {/* Informations */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={colors.info} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Comment votre partenaire peut rejoindre :</Text>
            <Text style={styles.infoText}>
              1. Télécharger l'application Kindred{'\n'}
              2. Créer un compte{'\n'}
              3. Choisir "Rejoindre un couple"{'\n'}
              4. Saisir votre email et le PIN créé
            </Text>
          </View>
        </View>

        {/* Statistiques du couple */}
        {couple && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Informations du couple</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {couple.users ? couple.users.length : 0}/2
                </Text>
                <Text style={styles.statLabel}>Membres</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {couple.startDate?.toDate?.().toLocaleDateString('fr-FR') || 'Aujourd\'hui'}
                </Text>
                <Text style={styles.statLabel}>Créé le</Text>
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Actualiser"
            onPress={handleRefresh}
            loading={refreshing}
            variant="primary"
            style={styles.refreshButton}
            icon="refresh-outline"
          />

          <Button
            title="Renvoyer l'invitation"
            onPress={handleResendInvitation}
            variant="outline"
            style={styles.resendButton}
            icon="mail-outline"
          />

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelCouple}
          >
            <Text style={styles.cancelButtonText}>Annuler le couple</Text>
          </TouchableOpacity>
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
  content: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowStyles,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  stepsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepCompleted: {
    backgroundColor: colors.success,
  },
  stepPending: {
    backgroundColor: colors.warning + '20',
    borderWidth: 2,
    borderColor: colors.warning,
  },
  stepInactive: {
    backgroundColor: colors.textSecondary + '20',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  stepInactiveText: {
    color: colors.textSecondary,
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: colors.textSecondary + '30',
    marginLeft: 19,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
    ...shadowStyles,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.info,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.info,
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    width: '100%',
    ...shadowStyles,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actions: {
    width: '100%',
    gap: 16,
  },
  refreshButton: {
    paddingVertical: 16,
  },
  resendButton: {
    paddingVertical: 16,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.error,
    textDecorationLine: 'underline',
  },
});
