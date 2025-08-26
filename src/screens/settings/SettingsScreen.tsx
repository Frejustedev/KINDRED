import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useCouple } from '../../hooks/useCouple';
import { useNotifications } from '../../hooks/useNotifications';
import { useActivityLogs } from '../../hooks/useActivityLogs';
import { NotificationService } from '../../services/notifications/notification.service';
import { AuthService } from '../../services/firebase/auth.service';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { user, signOut, profile, refreshProfile, isEmailVerified, resendVerificationEmail } = useAuth();
  const { couple, generateInviteCode, refreshCouple, leaveCouple } = useCouple();
  const { isNotificationsEnabled, requestPermissions, clearBadge } = useNotifications();
  const { unreadCount } = useActivityLogs();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('fr');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les préférences au démarrage
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const storedPreferences = await AsyncStorage.getItem('userPreferences');
      if (storedPreferences) {
        const preferences = JSON.parse(storedPreferences);
        setNotificationsEnabled(preferences.notificationsEnabled ?? true);
        setDailyReminders(preferences.dailyReminders ?? true);
        setMessageNotifications(preferences.messageNotifications ?? true);
        setEventReminders(preferences.eventReminders ?? true);
        setDarkMode(preferences.darkMode ?? false);
        setLanguage(preferences.language ?? 'fr');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }, []);

  const savePreferences = useCallback(async () => {
    try {
      const preferences = {
        notificationsEnabled,
        dailyReminders,
        messageNotifications,
        eventReminders,
        darkMode,
        language,
      };
      await AsyncStorage.setItem('userPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }, [notificationsEnabled, dailyReminders, messageNotifications, eventReminders, darkMode, language]);

  // Sauvegarder les préférences quand elles changent
  useEffect(() => {
    savePreferences();
  }, [savePreferences]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await refreshProfile();
      await refreshCouple();
      await loadPreferences();
    } catch (error: any) {
      console.error('Error refreshing:', error);
      setError('Erreur lors du rafraîchissement');
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshProfile, refreshCouple, loadPreferences]);

  const handleLeaveCouple = () => {
    Alert.alert(
      'Quitter le couple',
      'Êtes-vous sûr de vouloir quitter ce couple ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Quitter', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await leaveCouple();
              Alert.alert('Succès', 'Vous avez quitté le couple');
            } catch (error: any) {
              console.error('Leave couple error:', error);
              Alert.alert('Erreur', error.message || 'Impossible de quitter le couple');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleResendVerificationEmail = async () => {
    try {
      setIsLoading(true);
      await resendVerificationEmail();
      Alert.alert(
        'Email envoyé',
        'Un nouvel email de vérification a été envoyé à votre adresse email.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer l\'email de vérification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ? Toutes les données locales seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              // Effacer les préférences locales
              await AsyncStorage.removeItem('userPreferences');
              await signOut();
            } catch (error: any) {
              console.error('Sign out error:', error);
              Alert.alert('Erreur', error.message || 'Impossible de se déconnecter');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleGenerateInviteCode = async () => {
    try {
      const code = await generateInviteCode();
      Alert.alert(
        'Code d\'invitation',
        `Code généré : ${code}\n\nCe code expire dans 24 heures.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const handleViewCoupleInfo = () => {
    navigation.navigate('CoupleInfo');
  };

  const handleToggleNotifications = async (value: boolean) => {
    try {
      if (value) {
        const granted = await NotificationService.requestPermissions();
        if (!granted) {
          Alert.alert('Permission refusée', 'Les notifications ne peuvent pas être activées');
          return;
        }
      }
      setNotificationsEnabled(value);
    } catch (error: any) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la modification des notifications');
    }
  };

  const handleToggleDailyReminders = async (value: boolean) => {
    try {
      setDailyReminders(value);
      if (value) {
        await NotificationService.scheduleDailyReminder(20, 0);
        Alert.alert('Succès', 'Rappel quotidien activé à 20h00');
      } else {
        await NotificationService.cancelDailyReminder();
        Alert.alert('Succès', 'Rappel quotidien désactivé');
      }
    } catch (error: any) {
      console.error('Error toggling daily reminders:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la modification des rappels');
    }
  };

  const handleToggleMessageNotifications = (value: boolean) => {
    setMessageNotifications(value);
    Alert.alert('Succès', value ? 'Notifications de messages activées' : 'Notifications de messages désactivées');
  };

  const handleToggleEventReminders = (value: boolean) => {
    setEventReminders(value);
    Alert.alert('Succès', value ? 'Rappels d\'événements activés' : 'Rappels d\'événements désactivés');
  };

  const handleToggleDarkMode = (value: boolean) => {
    setDarkMode(value);
    Alert.alert('Succès', value ? 'Mode sombre activé' : 'Mode sombre désactivé');
  };

  const handleChangeLanguage = () => {
    Alert.alert(
      'Changer la langue',
      'Sélectionnez la langue souhaitée :',
      [
        { text: 'Français', onPress: () => setLanguage('fr') },
        { text: 'English', onPress: () => setLanguage('en') },
        { text: 'Español', onPress: () => setLanguage('es') },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const handleChangePIN = () => {
    Alert.alert(
      'Modifier le code PIN',
      'Cette fonctionnalité sera disponible dans une prochaine version.',
      [{ text: 'OK' }]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Exporter les données',
      'Cette fonctionnalité sera disponible dans une prochaine version.',
      [{ text: 'OK' }]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contacter le support',
      'Email : support@kindred-app.com\n\nNous répondons sous 24h.',
      [{ text: 'OK' }]
    );
  };

  const handleRateApp = () => {
    Alert.alert(
      'Évaluer l\'application',
      'Merci pour votre intérêt ! Cette fonctionnalité sera disponible prochainement.',
      [{ text: 'OK' }]
    );
  };

  const handleAboutApp = () => {
    Alert.alert(
      'À propos de Kindred',
      'Version 1.0 du 26/08/25\n\nDéveloppeur : Frejuste Agboton\nSite : frejusteagboton.info\n\nUne application pour couples qui souhaitent partager leur vie ensemble.',
      [{ text: 'OK' }]
    );
  };

  const renderSettingItem = (
    iconName: string,
    title: string,
    subtitle?: string,
    rightComponent?: React.ReactNode
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={iconName as any} size={20} color={colors.primary} />
      </View>
      
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        )}
      </View>
      
      {rightComponent && (
        <View style={styles.settingAction}>
          {rightComponent}
        </View>
      )}
    </View>
  );

  const renderSwitch = (value: boolean, onValueChange: (value: boolean) => void) => (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.disabled, true: colors.primary }}
      thumbColor={colors.surface}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Paramètres"
        icon="settings"
        subtitle="Gérez vos préférences"
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

        {/* Profil utilisateur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil</Text>
          
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {profile?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
              </Text>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.displayName || 'Utilisateur'}
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              
              {/* Badge de vérification d'email */}
              <View style={styles.verificationContainer}>
                <View style={[
                  styles.verificationBadge,
                  isEmailVerified ? styles.verifiedBadge : styles.unverifiedBadge
                ]}>
                  <Ionicons 
                    name={isEmailVerified ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={isEmailVerified ? colors.success : colors.error} 
                  />
                  <Text style={[
                    styles.verificationText,
                    isEmailVerified ? styles.verifiedText : styles.unverifiedText
                  ]}>
                    {isEmailVerified ? 'Email vérifié' : 'Email non vérifié'}
                  </Text>
                </View>
                
                {!isEmailVerified && (
                  <TouchableOpacity 
                    style={styles.resendButton}
                    onPress={handleResendVerificationEmail}
                    disabled={isLoading}
                  >
                    <Text style={styles.resendButtonText}>
                      {isLoading ? 'Envoi...' : 'Renvoyer'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Couple */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Couple</Text>
          
          {couple ? (
            <>
              {renderSettingItem(
                'heart-outline',
                'Informations du couple',
                `Créé le ${couple.startDate?.toDate?.().toLocaleDateString('fr-FR') || 'Date inconnue'}`,
                <TouchableOpacity 
                  style={styles.infoButton}
                  onPress={handleViewCoupleInfo}
                >
                  <Text style={styles.infoButtonText}>Voir</Text>
                </TouchableOpacity>
              )}
              
              {renderSettingItem(
                'ticket-outline',
                'Code d\'invitation',
                'Générer un nouveau code',
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleGenerateInviteCode}
                >
                  <Text style={styles.actionButtonText}>Générer</Text>
                </TouchableOpacity>
              )}
              
              {renderSettingItem(
                'exit-outline',
                'Quitter le couple',
                'Se séparer de votre partenaire',
                <TouchableOpacity 
                  style={[styles.actionButton, styles.dangerButton]}
                  onPress={handleLeaveCouple}
                >
                  <Text style={[styles.actionButtonText, styles.dangerButtonText]}>Quitter</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Vous n'êtes pas encore en couple
              </Text>
              <View style={styles.buttonContainer}>
                <Button
                  title="Créer ou rejoindre un couple"
                  onPress={() => navigation.navigate('Coupling')}
                  variant="primary"
                  size="small"
                  style={styles.coupleButton}
                />
                <Button
                  title="🔄 Rafraîchir"
                  onPress={async () => {
                    try {
                      await refreshProfile();
                      await refreshCouple();
                    } catch (error) {
                      console.error('Error refreshing:', error);
                    }
                  }}
                  variant="outline"
                  size="small"
                  style={styles.refreshButton}
                />
              </View>
            </View>
          )}
        </View>

        {/* Logs d'activité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logs d'activité</Text>
          
          {renderSettingItem(
            'list-outline',
            'Historique des actions',
            `${unreadCount} nouvelle(s) activité(s)`,
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('ActivityLogs')}
            >
              <Text style={styles.actionButtonText}>Voir</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          {renderSettingItem(
            'notifications-outline',
            'Notifications push',
            isNotificationsEnabled ? 'Activées' : 'Désactivées',
            renderSwitch(isNotificationsEnabled, handleToggleNotifications)
          )}
          
          {renderSettingItem(
            'chatbubble-ellipses-outline',
            'Badge messages',
            'Nombre de messages non lus',
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={clearBadge}
            >
              <Text style={styles.actionButtonText}>Effacer</Text>
            </TouchableOpacity>
          )}
          
          {renderSettingItem(
            'volume-high-outline',
            'Son personnalisé',
            'Son de notification personnalisé',
            <Text style={styles.statusText}>Activé</Text>
          )}
          
          {renderSettingItem(
            'time-outline',
            'Rappels quotidiens',
            'Rappel à 20h00 chaque jour',
            renderSwitch(dailyReminders, handleToggleDailyReminders)
          )}
          
          {renderSettingItem(
            'chatbubble-outline',
            'Messages',
            'Notifications pour nouveaux messages',
            renderSwitch(messageNotifications, handleToggleMessageNotifications)
          )}
          
          {renderSettingItem(
            'calendar-outline',
            'Événements',
            'Rappels pour événements',
            renderSwitch(eventReminders, handleToggleEventReminders)
          )}
        </View>

        {/* Sécurité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sécurité</Text>
          
          {renderSettingItem(
            'lock-closed-outline',
            'Code PIN',
            'Modifier le code PIN du couple',
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleChangePIN}
            >
              <Text style={styles.actionButtonText}>Modifier</Text>
            </TouchableOpacity>
          )}
          
          {renderSettingItem(
            'shield-checkmark-outline',
            'Chiffrement',
            'Messages chiffrés de bout en bout',
            <Text style={styles.statusText}>Activé</Text>
          )}
        </View>

        {/* Application */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application</Text>
          
          {renderSettingItem(
            'phone-portrait-outline',
            'Version',
            '1.0.0',
            <Text style={styles.statusText}>À jour</Text>
          )}
          
          {renderSettingItem(
            'moon-outline',
            'Thème sombre',
            'Activer le mode sombre',
            renderSwitch(darkMode, handleToggleDarkMode)
          )}
          
          {renderSettingItem(
            'language-outline',
            'Langue',
            language === 'fr' ? 'Français' : language === 'en' ? 'English' : 'Español',
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleChangeLanguage}
            >
              <Text style={styles.actionButtonText}>Changer</Text>
            </TouchableOpacity>
          )}

          {renderSettingItem(
            'download-outline',
            'Exporter les données',
            'Sauvegarder vos données',
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleExportData}
            >
              <Text style={styles.actionButtonText}>Exporter</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          {renderSettingItem(
            'help-circle-outline',
            'Aide',
            'Centre d\'aide et FAQ',
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Help')}
            >
              <Text style={styles.actionButtonText}>Voir</Text>
            </TouchableOpacity>
          )}
          
          {renderSettingItem(
            'mail-outline',
            'Contact',
            'Nous contacter',
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleContactSupport}
            >
              <Text style={styles.actionButtonText}>Contacter</Text>
            </TouchableOpacity>
          )}
          
          {renderSettingItem(
            'star-outline',
            'Évaluer',
            'Noter l\'application',
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleRateApp}
            >
              <Text style={styles.actionButtonText}>Évaluer</Text>
            </TouchableOpacity>
          )}
          
          {renderSettingItem(
            'information-circle-outline',
            'À propos de l\'application',
            'Version 1.0 du 26/08/25',
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={handleAboutApp}
            >
              <Text style={styles.infoButtonText}>Voir</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Déconnexion */}
        <View style={styles.section}>
          <Button
            title={isLoading ? "Déconnexion..." : "Se déconnecter"}
            onPress={handleSignOut}
            variant="outline"
            style={styles.signOutButton}
            textStyle={styles.signOutButtonText}
            disabled={isLoading}
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
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerInfo: {
    alignItems: 'center',
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
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    ...colors.shadow,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedBadge: {
    backgroundColor: colors.success + '20',
  },
  unverifiedBadge: {
    backgroundColor: colors.error + '20',
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  verifiedText: {
    color: colors.success,
  },
  unverifiedText: {
    color: colors.error,
  },
  resendButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resendButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    ...colors.shadow,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  settingAction: {
    marginLeft: 16,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
  dangerButton: {
    backgroundColor: colors.error,
  },
  dangerButtonText: {
    color: colors.textOnPrimary,
  },
  infoButton: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  statusText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  coupleButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  refreshButton: {
    marginTop: 8,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  signOutButton: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  signOutButtonText: {
    color: colors.textOnPrimary,
  },
});
