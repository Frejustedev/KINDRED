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

interface FinanceScreenProps {
  navigation: any;
}

export const FinanceScreen: React.FC<FinanceScreenProps> = ({ navigation }) => {
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

  const financeFeatures = [
    {
      id: 'budget',
      title: 'Budget',
      description: 'Gestion des finances communes',
      icon: 'wallet-outline',
      color: colors.warning,
      onPress: () => navigation.navigate('Budget'),
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
          title="Finances"
          icon="card"
          subtitle="Gérez vos finances"
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
        title="Finances"
        icon="card"
        subtitle="Gérez vos finances ensemble"
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
            {financeFeatures.map(renderFeatureCard)}
          </View>
        </View>

                 <View style={styles.section}>
           <Text style={styles.sectionTitle}>Accès rapide</Text>
           <View style={styles.quickActions}>
             <TouchableOpacity
               style={styles.quickAction}
               onPress={() => navigation.navigate('Budget')}
               activeOpacity={0.7}
             >
               <Ionicons name="add-circle" size={24} color={colors.warning} />
               <Text style={styles.quickActionText}>Nouvelle dépense</Text>
             </TouchableOpacity>
             
             <TouchableOpacity
               style={styles.quickAction}
               onPress={() => navigation.navigate('Budget')}
               activeOpacity={0.7}
             >
               <Ionicons name="analytics-outline" size={24} color={colors.info} />
               <Text style={styles.quickActionText}>Voir statistiques</Text>
             </TouchableOpacity>
           </View>
         </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conseils financiers</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tipCard}>
              <Ionicons name="bulb-outline" size={24} color={colors.success} />
              <Text style={styles.tipText}>
                Planifiez vos dépenses mensuelles ensemble pour éviter les surprises
              </Text>
            </View>
            <View style={styles.tipCard}>
              <Ionicons name="trending-up-outline" size={24} color={colors.info} />
              <Text style={styles.tipText}>
                Suivez vos habitudes de dépenses pour mieux gérer votre budget
              </Text>
            </View>
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
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textOnPrimary + 'CC',
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
    ...colors.shadow,
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    minWidth: 120,
    ...colors.shadow,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  tipsContainer: {
    gap: 12,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    ...colors.shadow,
  },
  tipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});
