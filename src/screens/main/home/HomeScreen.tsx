import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadowStyles } from '../../../constants/colors';
import { Header } from '../../../components/common/Header';
import { useAuth } from '../../../hooks/useAuth';
import { useCouple } from '../../../hooks/useCouple';
import { useMessages } from '../../../hooks/useMessages';
import { useMilestones } from '../../../hooks/useMilestones';
import { useActivityLogs } from '../../../hooks/useActivityLogs';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, profile } = useAuth();
  const { couple, partnerInfo, pendingInvitations } = useCouple();
  const { messages, totalUnreadCount, refreshConversations } = useMessages();
  const { milestones, getTimeSince, getTimeUntil } = useMilestones();
  const { activityLogs } = useActivityLogs();
  const [greeting, setGreeting] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoveStoryExpanded, setIsLoveStoryExpanded] = useState(false);
  const [timeUnits, setTimeUnits] = useState<{ [key: string]: 'days' | 'weeks' | 'months' | 'years' }>({});
  const animatedHeight = useSharedValue(0);
  const rotateAnimation = useSharedValue(0);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Bonjour');
    } else if (hour < 18) {
      setGreeting('Bon après-midi');
    } else {
      setGreeting('Bonsoir');
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      // Forcer la mise à jour des conversations
      refreshConversations();
      
      // Simuler un rafraîchissement des données
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error('Error refreshing:', error);
      setError('Erreur lors du rafraîchissement');
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshConversations]);

  const getUnreadCount = () => {
    return totalUnreadCount || 0;
  };

  // Calculer le nombre de notifications non lues du partenaire
  const getPartnerNotificationsCount = () => {
    if (!user?.uid || !activityLogs) return 0;
    const partnerNotifications = activityLogs.filter(log => 
      log.userId !== user.uid && !log.isRead
    );
    return partnerNotifications.length;
  };

  const getDaysSince = useCallback((milestoneDate: any) => {
    if (!milestoneDate) return null;
    
    try {
      let date: Date;
      if (typeof milestoneDate === 'object' && milestoneDate.toDate) {
        date = milestoneDate.toDate();
      } else {
        date = new Date(milestoneDate);
      }
      
      if (isNaN(date.getTime())) {
        return null;
      }
      
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - date.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error('Error calculating days since:', error);
      return null;
    }
  }, []);

  const getMilestoneTime = useCallback((type: string) => {
    const milestone = milestones.find(m => m.type === type);
    if (!milestone) return null;
    
    const unit = timeUnits[type] || 'days';
    const timeSince = getTimeSince(milestone.date, unit);
    return timeSince;
  }, [milestones, getTimeSince, timeUnits]);

  const toggleTimeUnit = useCallback((type: string) => {
    const currentUnit = timeUnits[type] || 'days';
    const units: ('days' | 'weeks' | 'months' | 'years')[] = ['days', 'weeks', 'months', 'years'];
    const currentIndex = units.indexOf(currentUnit);
    const nextIndex = (currentIndex + 1) % units.length;
    const nextUnit = units[nextIndex];
    
    setTimeUnits(prev => ({
      ...prev,
      [type]: nextUnit
    }));
  }, [timeUnits]);

  const toggleLoveStory = () => {
    setIsLoveStoryExpanded(!isLoveStoryExpanded);
    animatedHeight.value = withTiming(isLoveStoryExpanded ? 0 : 1, { duration: 300 });
    rotateAnimation.value = withTiming(isLoveStoryExpanded ? 0 : 1, { duration: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(animatedHeight.value, [0, 1], [0, 400], Extrapolate.CLAMP),
      opacity: interpolate(animatedHeight.value, [0, 1], [0, 1], Extrapolate.CLAMP),
    };
  });

  const rotateStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${interpolate(rotateAnimation.value, [0, 1], [0, 180], Extrapolate.CLAMP)}deg` }],
    };
  });

  // Forcer la mise à jour des conversations quand l'écran devient actif
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshConversations();
    });

    return unsubscribe;
  }, [navigation, refreshConversations]);


  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={`${greeting} !`}
        icon="home"
        subtitle="Votre espace personnel"
        rightAction={{
          icon: "notifications-outline",
          onPress: () => navigation.navigate('Settings', { screen: 'Notifications' }),
          badge: getPartnerNotificationsCount()
        }}
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
          </View>
        )}

        {/* Info utilisateur */}
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
          <Text style={styles.userName}>
              {profile?.firstName || user?.email?.split('@')[0] || 'Utilisateur'} & {partnerInfo?.firstName || 'Votre partenaire'}
          </Text>
            <TouchableOpacity
              style={styles.seeMoreButton}
              onPress={() => navigation.navigate('Settings', { screen: 'CoupleInfo' })}
            >
              <Text style={styles.seeMoreText}>Voir plus</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {couple && (
            <View style={styles.coupleInfoContainer}>
              <TouchableOpacity 
                style={styles.accordionHeader} 
                onPress={toggleLoveStory}
                activeOpacity={0.7}
              >
                <View style={styles.accordionHeaderContent}>
                  <Ionicons name="heart" size={20} color={colors.primary} />
                  <Text style={styles.accordionTitle}>Votre histoire d'amour</Text>
                </View>
                <Animated.View style={rotateStyle}>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </Animated.View>
              </TouchableOpacity>
              
              <Animated.View style={[styles.accordionContent, animatedStyle]}>
                <View style={styles.milestonesGrid}>
                <TouchableOpacity 
                  style={[styles.milestoneCard, styles.fullWidthCard]}
                  onPress={() => toggleTimeUnit('first_meeting')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.milestoneIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="heart-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.fullWidthContent}>
                    <Text style={styles.milestoneLabel}>Rencontre</Text>
                                      <View style={styles.milestoneValueContainer}>
                    <Text style={styles.milestoneValue}>
                      {getMilestoneTime('first_meeting') ? `${getMilestoneTime('first_meeting')?.value} ${getMilestoneTime('first_meeting')?.unit}` : '???'}
                    </Text>
                    <Ionicons name="swap-horizontal" size={10} color={colors.textSecondary} style={styles.unitIndicator} />
                  </View>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.milestoneCard}
                  onPress={() => toggleTimeUnit('official_relationship')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.milestoneIcon, { backgroundColor: colors.success + '20' }]}>
                    <Ionicons name="heart" size={20} color={colors.success} />
                  </View>
                  <Text style={styles.milestoneLabel}>En couple</Text>
                  <View style={styles.milestoneValueContainer}>
                    <Text style={styles.milestoneValue}>
                      {getMilestoneTime('official_relationship') ? `${getMilestoneTime('official_relationship')?.value} ${getMilestoneTime('official_relationship')?.unit}` : '???'}
                    </Text>
                    <Ionicons name="swap-horizontal" size={10} color={colors.textSecondary} style={styles.unitIndicator} />
                  </View>
                </TouchableOpacity>
                

                
                <TouchableOpacity 
                  style={styles.milestoneCard}
                  onPress={() => toggleTimeUnit('engagement')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.milestoneIcon, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="diamond-outline" size={20} color={colors.warning} />
                  </View>
                  <Text style={styles.milestoneLabel}>Fiançailles</Text>
                  <View style={styles.milestoneValueContainer}>
                    <Text style={styles.milestoneValue}>
                      {getMilestoneTime('engagement') ? `${getMilestoneTime('engagement')?.value} ${getMilestoneTime('engagement')?.unit}` : '???'}
                    </Text>
                    <Ionicons name="swap-horizontal" size={10} color={colors.textSecondary} style={styles.unitIndicator} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.milestoneCard}
                  onPress={() => toggleTimeUnit('civil_wedding')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.milestoneIcon, { backgroundColor: colors.info + '20' }]}>
                    <Ionicons name="business-outline" size={20} color={colors.info} />
                  </View>
                  <Text style={styles.milestoneLabel}>Mariage civil</Text>
                  <View style={styles.milestoneValueContainer}>
                    <Text style={styles.milestoneValue}>
                      {getMilestoneTime('civil_wedding') ? `${getMilestoneTime('civil_wedding')?.value} ${getMilestoneTime('civil_wedding')?.unit}` : '???'}
                    </Text>
                    <Ionicons name="swap-horizontal" size={10} color={colors.textSecondary} style={styles.unitIndicator} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.milestoneCard}
                  onPress={() => toggleTimeUnit('religious_wedding')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.milestoneIcon, { backgroundColor: colors.info + '20' }]}>
                    <Ionicons name="business-outline" size={20} color={colors.info} />
                  </View>
                  <Text style={styles.milestoneLabel}>Mariage religieux</Text>
                  <View style={styles.milestoneValueContainer}>
                    <Text style={styles.milestoneValue}>
                      {getMilestoneTime('religious_wedding') ? `${getMilestoneTime('religious_wedding')?.value} ${getMilestoneTime('religious_wedding')?.unit}` : '???'}
                    </Text>
                    <Ionicons name="swap-horizontal" size={10} color={colors.textSecondary} style={styles.unitIndicator} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.milestoneCard}
                  onPress={() => toggleTimeUnit('traditional_wedding')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.milestoneIcon, { backgroundColor: colors.info + '20' }]}>
                    <Ionicons name="people-outline" size={20} color={colors.info} />
                  </View>
                  <Text style={styles.milestoneLabel}>Mariage traditionnel</Text>
                  <View style={styles.milestoneValueContainer}>
                    <Text style={styles.milestoneValue}>
                      {getMilestoneTime('traditional_wedding') ? `${getMilestoneTime('traditional_wedding')?.value} ${getMilestoneTime('traditional_wedding')?.unit}` : '???'}
                    </Text>
                    <Ionicons name="swap-horizontal" size={10} color={colors.textSecondary} style={styles.unitIndicator} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.milestoneCard}
                  onPress={() => toggleTimeUnit('child_birth')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.milestoneIcon, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="medical-outline" size={20} color={colors.warning} />
                  </View>
                  <Text style={styles.milestoneLabel}>Parents</Text>
                  <View style={styles.milestoneValueContainer}>
                    <Text style={styles.milestoneValue}>
                      {getMilestoneTime('child_birth') ? `${getMilestoneTime('child_birth')?.value} ${getMilestoneTime('child_birth')?.unit}` : '???'}
                    </Text>
                    <Ionicons name="swap-horizontal" size={10} color={colors.textSecondary} style={styles.unitIndicator} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.milestoneCard, styles.fullWidthCard]}
                  onPress={() => toggleTimeUnit('kindred')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.milestoneIcon, { backgroundColor: colors.secondary + '20' }]}>
                    <Ionicons name="phone-portrait-outline" size={20} color={colors.secondary} />
                  </View>
                  <View style={styles.fullWidthContent}>
                    <Text style={styles.milestoneLabel}>Kindred</Text>
                    <View style={styles.milestoneValueContainer}>
                      <Text style={styles.milestoneValue}>
                        {couple?.createdAt ? (() => {
                          const unit = timeUnits['kindred'] || 'days';
                          const timeSince = getTimeSince(couple.createdAt, unit);
                          return `${timeSince.value} ${timeSince.unit}`;
                        })() : '???'}
            </Text>
                      <Ionicons name="swap-horizontal" size={10} color={colors.textSecondary} style={styles.unitIndicator} />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
                          </Animated.View>
            </View>
          )}


        </View>


        {/* Fonctionnalités récentes */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Fonctionnalités</Text>
          
          <View style={styles.featureGrid}>
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('Messages')}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={32} color={colors.primary} />
              <Text style={styles.featureTitle}>Chat en temps réel</Text>
              <Text style={styles.featureDescription}>
                Messages chiffrés avec votre partenaire
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('Organization')}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={32} color={colors.info} />
              <Text style={styles.featureTitle}>Organisation</Text>
              <Text style={styles.featureDescription}>
                Agenda, listes et notes partagées
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('Finance')}
              activeOpacity={0.7}
            >
              <Ionicons name="wallet-outline" size={32} color={colors.warning} />
              <Text style={styles.featureTitle}>Finances</Text>
              <Text style={styles.featureDescription}>
                Gestion du budget commun
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('Organization', { screen: 'Capsules' })}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={32} color={colors.info} />
              <Text style={styles.featureTitle}>Capsules temporelles</Text>
              <Text style={styles.featureDescription}>
                Messages pour le futur
              </Text>
            </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  userInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primary + '10',
  },
  seeMoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  coupleInfoContainer: {
    marginTop: 12,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    ...shadowStyles,
  },
  accordionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 12,
  },
  accordionContent: {
    overflow: 'hidden',
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  milestoneCard: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    ...shadowStyles,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fullWidthCard: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
  },
  fullWidthContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  milestoneIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  milestoneLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 3,
    fontWeight: '500',
  },
  milestoneValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  milestoneCardPressed: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  milestoneValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  unitIndicator: {
    marginLeft: 2,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    flex: 1,
  },
  statsSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...shadowStyles,
  },

  statCardNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  recentSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...shadowStyles,
  },

  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
