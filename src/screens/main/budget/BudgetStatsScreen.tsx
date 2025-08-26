import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { useAuth } from '../../../hooks/useAuth';
import { useCouple } from '../../../hooks/useCouple';
import { FirestoreService } from '../../../services/firebase/firestore.service';
import { Transaction } from '../../../types';

interface BudgetStatsScreenProps {
  navigation: any;
}

interface CategoryStats {
  category: string;
  total: number;
  percentage: number;
  count: number;
  color: string;
}

interface MonthlyStats {
  month: string;
  expenses: number;
  income: number;
  balance: number;
}

const { width } = Dimensions.get('window');

export const BudgetStatsScreen: React.FC<BudgetStatsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);

  const categoryColors = [
    colors.primary,
    colors.success,
    colors.warning,
    colors.error,
    colors.info,
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
  ];

  const loadTransactions = useCallback(async () => {
    if (!couple) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const currentDate = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (selectedPeriod) {
        case 'month':
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          break;
        case 'quarter':
          const quarter = Math.floor(currentDate.getMonth() / 3);
          startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
          endDate = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0);
          break;
        case 'year':
          startDate = new Date(currentDate.getFullYear(), 0, 1);
          endDate = new Date(currentDate.getFullYear(), 11, 31);
          break;
        default:
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      }

      const allTransactions = await FirestoreService.getTransactionsByDateRange(
        couple.id,
        startDate,
        endDate
      );
      
      setTransactions(allTransactions);
      calculateStats(allTransactions);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      setError(error.message || 'Impossible de charger les statistiques');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [couple, selectedPeriod]);

  const calculateStats = (transactions: Transaction[]) => {
    // Calculer les statistiques par catégorie
    const categoryMap = new Map<string, { total: number; count: number }>();
    let totalExpenses = 0;

    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        const current = categoryMap.get(transaction.category) || { total: 0, count: 0 };
        categoryMap.set(transaction.category, {
          total: current.total + transaction.amount,
          count: current.count + 1
        });
        totalExpenses += transaction.amount;
      }
    });

    const stats: CategoryStats[] = Array.from(categoryMap.entries()).map(([category, data], index) => ({
      category,
      total: data.total,
      percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
      count: data.count,
      color: categoryColors[index % categoryColors.length]
    }));

    stats.sort((a, b) => b.total - a.total);
    setCategoryStats(stats);

    // Calculer les statistiques mensuelles
    const monthlyMap = new Map<string, { expenses: number; income: number }>();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date as any);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyMap.get(monthKey) || { expenses: 0, income: 0 };
      
      if (transaction.type === 'expense') {
        current.expenses += transaction.amount;
      } else {
        current.income += transaction.amount;
      }
      
      monthlyMap.set(monthKey, current);
    });

    const monthly: MonthlyStats[] = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        expenses: data.expenses,
        income: data.income,
        balance: data.income - data.expenses
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    setMonthlyStats(monthly);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTransactions();
  };

  useEffect(() => {
    if (couple) {
      loadTransactions();
    }
  }, [couple, selectedPeriod, loadTransactions]);

  const getTotalExpenses = () => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalIncome = () => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getBalance = () => {
    return getTotalIncome() - getTotalExpenses();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const renderCategoryBar = (stat: CategoryStats) => (
    <View key={stat.category} style={styles.categoryBar}>
      <View style={styles.categoryInfo}>
        <View style={[styles.categoryColor, { backgroundColor: stat.color }]} />
        <Text style={styles.categoryName}>{stat.category}</Text>
        <Text style={styles.categoryCount}>({stat.count})</Text>
      </View>
      <View style={styles.categoryValues}>
        <Text style={styles.categoryAmount}>{formatCurrency(stat.total)}</Text>
        <Text style={styles.categoryPercentage}>{stat.percentage.toFixed(1)}%</Text>
      </View>
      <View style={[styles.progressBar, { width: `${stat.percentage}%`, backgroundColor: stat.color }]} />
    </View>
  );

  const renderMonthlyBar = (stat: MonthlyStats) => (
    <View key={stat.month} style={styles.monthlyBar}>
      <Text style={styles.monthlyLabel}>{stat.month}</Text>
      <View style={styles.monthlyBars}>
        <View style={[styles.monthlyExpenseBar, { width: `${Math.min((stat.expenses / 1000) * 100, 100)}%` }]} />
        <View style={[styles.monthlyIncomeBar, { width: `${Math.min((stat.income / 1000) * 100, 100)}%` }]} />
      </View>
      <View style={styles.monthlyValues}>
        <Text style={styles.monthlyExpense}>{formatCurrency(stat.expenses)}</Text>
        <Text style={styles.monthlyIncome}>{formatCurrency(stat.income)}</Text>
      </View>
    </View>
  );

  if (!couple) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
          <Text style={styles.headerTitle}>Statistiques</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistiques Budget</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {/* Sélecteur de période */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.periodButtonTextActive]}>
              Mois
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'quarter' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('quarter')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'quarter' && styles.periodButtonTextActive]}>
              Trimestre
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'year' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('year')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'year' && styles.periodButtonTextActive]}>
              Année
            </Text>
          </TouchableOpacity>
        </View>

        {/* Résumé global */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Résumé</Text>
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <Ionicons name="trending-down" size={24} color={colors.error} />
              <Text style={styles.summaryLabel}>Dépenses</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(getTotalExpenses())}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="trending-up" size={24} color={colors.success} />
              <Text style={styles.summaryLabel}>Revenus</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(getTotalIncome())}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="wallet" size={24} color={colors.primary} />
              <Text style={styles.summaryLabel}>Solde</Text>
              <Text style={[styles.summaryAmount, { color: getBalance() >= 0 ? colors.success : colors.error }]}>
                {formatCurrency(getBalance())}
              </Text>
            </View>
          </View>
        </View>

        {/* Statistiques par catégorie */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Dépenses par catégorie</Text>
          {categoryStats.length > 0 ? (
            categoryStats.map(renderCategoryBar)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="pie-chart-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyStateText}>Aucune dépense pour cette période</Text>
            </View>
          )}
        </View>

        {/* Évolution mensuelle */}
        <View style={styles.monthlySection}>
          <Text style={styles.sectionTitle}>Évolution mensuelle</Text>
          {monthlyStats.length > 0 ? (
            monthlyStats.map(renderMonthlyBar)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyStateText}>Aucune donnée pour cette période</Text>
            </View>
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: colors.textOnPrimary,
  },
  summarySection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...colors.shadow,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 8,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  categorySection: {
    marginBottom: 30,
  },
  categoryBar: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...colors.shadow,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  categoryCount: {
    fontSize: 14,
    color: colors.textLight,
  },
  categoryValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  categoryPercentage: {
    fontSize: 14,
    color: colors.textLight,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  monthlySection: {
    marginBottom: 30,
  },
  monthlyBar: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...colors.shadow,
  },
  monthlyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  monthlyBars: {
    height: 20,
    backgroundColor: colors.background,
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  monthlyExpenseBar: {
    height: '100%',
    backgroundColor: colors.error,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  monthlyIncomeBar: {
    height: '100%',
    backgroundColor: colors.success,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  monthlyValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthlyExpense: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
  monthlyIncome: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 16,
    textAlign: 'center',
  },
});
