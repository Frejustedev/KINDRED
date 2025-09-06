import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadowStyles } from '../../constants/colors';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { useCouple } from '../../hooks/useCouple';

interface InvitationsScreenProps {
  navigation: any;
}

export const InvitationsScreen: React.FC<InvitationsScreenProps> = ({ navigation }) => {
  const { 
    pendingInvitations, 
    isLoading, 
    acceptInvitation, 
    rejectInvitation,
    loadPendingInvitations 
  } = useCouple();

  useEffect(() => {
    loadPendingInvitations();
  }, []);

  const handleAcceptInvitation = async (invitationId: string, senderName: string) => {
    Alert.alert(
      'Accepter l\'invitation',
      `Voulez-vous rejoindre le couple avec ${senderName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            try {
              await acceptInvitation(invitationId);
              Alert.alert(
                'Couple rejoint ! 💕',
                'Vous faites maintenant partie du couple !',
                [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
              );
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          }
        }
      ]
    );
  };

  const handleRejectInvitation = async (invitationId: string, senderName: string) => {
    Alert.alert(
      'Refuser l\'invitation',
      `Êtes-vous sûr de vouloir refuser l'invitation de ${senderName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectInvitation(invitationId);
              Alert.alert('Invitation refusée', 'L\'invitation a été refusée.');
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderInvitationItem = ({ item }: { item: any }) => (
    <View style={styles.invitationCard}>
      <View style={styles.invitationHeader}>
        <View style={styles.senderInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={24} color={colors.primary} />
          </View>
          <View style={styles.senderDetails}>
            <Text style={styles.senderName}>
              {item.sender?.firstName || 'Utilisateur'} {item.sender?.lastName || ''}
            </Text>
            <Text style={styles.senderEmail}>{item.toUserEmail}</Text>
            <Text style={styles.invitationDate}>
              Invité le {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>En attente</Text>
        </View>
      </View>

      <Text style={styles.invitationMessage}>
        Vous invite à rejoindre son couple sur Kindred
      </Text>

      <View style={styles.actionButtons}>
        <Button
          title="Refuser"
          onPress={() => handleRejectInvitation(item.id, item.sender?.firstName || 'cette personne')}
          variant="outline"
          size="small"
          style={styles.rejectButton}
          icon="close-outline"
        />
        <Button
          title="Accepter"
          onPress={() => handleAcceptInvitation(item.id, item.sender?.firstName || 'cette personne')}
          variant="primary"
          size="small"
          style={styles.acceptButton}
          icon="checkmark-outline"
        />
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="mail-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>Aucune invitation</Text>
      <Text style={styles.emptyStateText}>
        Vous n'avez pas d'invitations de couple en attente.
      </Text>
      <Button
        title="Créer un couple"
        onPress={() => navigation.navigate('SimpleCoupling')}
        variant="primary"
        style={styles.createCoupleButton}
        icon="heart-outline"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Invitations"
        icon="mail-outline"
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={pendingInvitations}
        renderItem={renderInvitationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadPendingInvitations}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    flexGrow: 1,
    padding: 16,
  },
  invitationCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...shadowStyles,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  senderInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  senderDetails: {
    flex: 1,
  },
  senderName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  senderEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  invitationDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
  },
  invitationMessage: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
  },
  acceptButton: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createCoupleButton: {
    paddingHorizontal: 32,
  },
});