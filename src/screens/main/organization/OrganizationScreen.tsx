import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { Header } from '../../../components/common/Header';
import { useAuth } from '../../../hooks/useAuth';
import { useCouple } from '../../../hooks/useCouple';

interface OrganizationScreenProps {
  navigation: any;
}

export const OrganizationScreen: React.FC<OrganizationScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      // Recharger les données si nécessaire
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      setError(error.message || 'Erreur lors du rechargement');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const organizationFeatures = [
    {
      id: 'agenda',
      title: 'Agenda',
      description: 'Calendrier partagé et événements',
      icon: 'calendar-outline',
      color: colors.info,
      onPress: () => navigation.navigate('Agenda'),
    },
    {
      id: 'milestones',
      title: 'Dates marquantes',
      description: 'Nos moments importants',
      icon: 'heart-outline',
      color: colors.primary,
      onPress: () => navigation.navigate('Milestones'),
    },
    {
      id: 'lists',
      title: 'Listes',
      description: 'Todo lists et courses partagées',
      icon: 'list-outline',
      color: colors.success,
      onPress: () => navigation.navigate('SharedLists'),
    },
    {
      id: 'notes',
      title: 'Notes',
      description: 'Notes collaboratives',
      icon: 'document-text-outline',
      color: colors.warning,
      onPress: () => navigation.navigate('CollaborativeNotes'),
    },
  ];

  const renderFeatureCard = (feature: any) => (
    <TouchableOpacity
      key={feature.id}
      style={styles.featureCard}
      onPress={feature.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: feature.color + '20' }]}>
        <Ionicons name={feature.icon as any} size={32} color={feature.color} />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
    </TouchableOpacity>
  );

  if (!couple) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Organisation"
          icon="grid"
          subtitle="Agenda, listes et notes"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Organisation"
        icon="grid"
        subtitle="Agenda, listes et notes"
      />

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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fonctionnalités</Text>
          <View style={styles.featuresContainer}>
            {organizationFeatures.map(renderFeatureCard)}
          </View>
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
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  featuresContainer: {
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textLight,
  },
});
