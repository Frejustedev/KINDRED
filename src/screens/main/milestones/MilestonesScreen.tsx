import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadowStyles } from '../../../constants/colors';
import { Header } from '../../../components/common/Header';
import { Button } from '../../../components/common/Button';
import { useMilestones } from '../../../hooks/useMilestones';
import { useAuth } from '../../../hooks/useAuth';
import { useCouple } from '../../../hooks/useCouple';
import { MilestoneService } from '../../../services/couple/milestone.service';
import { CoupleMilestone, MilestoneType } from '../../../types';
import { Ionicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';

interface MilestonesScreenProps {
  navigation: any;
}

export const MilestonesScreen: React.FC<MilestonesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const { 
    milestones, 
    isLoading, 
    error, 
    getDaysSince, 
    getDaysUntil, 
    refreshMilestones,
    clearError 
  } = useMilestones();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [upcomingMilestones, setUpcomingMilestones] = useState<CoupleMilestone[]>([]);

  useEffect(() => {
    loadUpcomingMilestones();
  }, [milestones]);

  const loadUpcomingMilestones = async () => {
    try {
      const upcoming = milestones.filter(milestone => {
        const daysUntil = getDaysUntil(milestone.date);
        return daysUntil >= 0 && daysUntil <= 30;
      });
      setUpcomingMilestones(upcoming);
    } catch (error) {
      console.error('Error loading upcoming milestones:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshMilestones();
    } catch (error) {
      console.error('Error refreshing milestones:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddMilestone = () => {
    navigation.navigate('AddMilestone');
  };

  const handleMilestonePress = (milestone: CoupleMilestone) => {
    navigation.navigate('EditMilestone', { milestoneId: milestone.id });
  };

  const renderMilestoneCard = (milestone: CoupleMilestone) => {
    const typeInfo = MilestoneService.getMilestoneTypeInfo(milestone.type);
    const milestoneDate = milestone.date.toDate();
    const daysSince = getDaysSince(milestone.date);
    const daysUntil = getDaysUntil(milestone.date);
    const isToday = daysSince === 0;
    const isUpcoming = daysUntil > 0 && daysUntil <= 30;

    return (
      <TouchableOpacity
        key={milestone.id}
        style={[styles.milestoneCard, { borderLeftColor: typeInfo.color }]}
        onPress={() => handleMilestonePress(milestone)}
      >
        <View style={styles.milestoneHeader}>
          <View style={[styles.milestoneIcon, { backgroundColor: typeInfo.color + '20' }]}>
            <Ionicons name={typeInfo.icon as any} size={20} color={typeInfo.color} />
          </View>
          <View style={styles.milestoneInfo}>
            <Text style={styles.milestoneTitle}>{milestone.title}</Text>
            <Text style={styles.milestoneDate}>
              {milestoneDate.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.milestoneStatus}>
            {isToday ? (
              <View style={styles.todayBadge}>
                <Text style={styles.todayText}>Aujourd'hui</Text>
              </View>
            ) : isUpcoming ? (
              <View style={styles.upcomingBadge}>
                <Text style={styles.upcomingText}>Dans {daysUntil}j</Text>
              </View>
            ) : (
              <View style={styles.pastBadge}>
                <Text style={styles.pastText}>Il y a {daysSince}j</Text>
              </View>
            )}
          </View>
        </View>
        
        {milestone.description && (
          <Text style={styles.milestoneDescription} numberOfLines={2}>
            {milestone.description}
          </Text>
        )}

        <View style={styles.milestoneFooter}>
          {milestone.notifications && (
            <View style={styles.notificationIndicator}>
              <Ionicons name="notifications" size={14} color={colors.primary} />
              <Text style={styles.notificationText}>
                Rappel {milestone.reminderDays}j avant
              </Text>
            </View>
          )}
          {milestone.isRecurring && (
            <View style={styles.recurringIndicator}>
              <Ionicons name="refresh" size={14} color={colors.secondary} />
              <Text style={styles.recurringText}>Annuel</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderUpcomingSection = () => {
    if (upcomingMilestones.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prochaines dates</Text>
        <Text style={styles.sectionSubtitle}>
          {upcomingMilestones.length} date{upcomingMilestones.length > 1 ? 's' : ''} dans les 30 prochains jours
        </Text>
        {upcomingMilestones.map(renderMilestoneCard)}
      </View>
    );
  };

  const renderAllMilestonesSection = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Toutes nos dates</Text>
        <Text style={styles.sectionSubtitle}>
          {milestones.length} date{milestones.length > 1 ? 's' : ''} marquante{milestones.length > 1 ? 's' : ''}
        </Text>
        {milestones.map(renderMilestoneCard)}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Dates marquantes"
          icon="heart"
          subtitle="Nos moments importants"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des dates marquantes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Dates marquantes"
        icon="heart"
        subtitle="Nos moments importants"
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >


         {error && (
           <View style={styles.errorBanner}>
             <Ionicons name="alert-circle" size={16} color={colors.error} />
             <Text style={styles.errorText}>{error}</Text>
             <TouchableOpacity onPress={clearError}>
               <Ionicons name="close" size={16} color={colors.error} />
             </TouchableOpacity>
           </View>
         )}

        {milestones.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="heart-outline" size={64} color={colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>Aucune date marquante</Text>
            <Text style={styles.emptyText}>
              Ajoutez vos premières dates importantes pour commencer à célébrer vos moments ensemble.
            </Text>
            <Button
              title="Ajouter une date"
              onPress={handleAddMilestone}
              variant="primary"
              style={styles.addButton}
              icon="add"
            />
          </View>
        ) : (
          <>
            {renderAllMilestonesSection()}
            
            <View style={styles.addSection}>
              <Button
                title="Ajouter une nouvelle date"
                onPress={handleAddMilestone}
                variant="outline"
                style={styles.addNewButton}
                icon="add-circle-outline"
              />
            </View>
          </>
        )}
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '20',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  addButton: {
    width: '100%',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  milestoneCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    ...shadowStyles,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  milestoneDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  milestoneStatus: {
    marginLeft: 8,
  },
  todayBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  upcomingBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upcomingText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  pastBadge: {
    backgroundColor: colors.textSecondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pastText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  milestoneDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  milestoneFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationText: {
    fontSize: 12,
    color: colors.primary,
  },
  recurringIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recurringText: {
    fontSize: 12,
    color: colors.secondary,
  },
  addSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
     addNewButton: {
     width: '100%',
   },
   debugInfo: {
     backgroundColor: colors.surfaceVariant,
     padding: 12,
     marginHorizontal: 16,
     marginTop: 16,
     borderRadius: 8,
   },
   debugText: {
     fontSize: 12,
     color: colors.textSecondary,
     fontFamily: 'monospace',
   },
 });
