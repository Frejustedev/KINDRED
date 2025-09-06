import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadowStyles } from '../../constants/colors';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useCouple } from '../../hooks/useCouple';
import { Ionicons } from '@expo/vector-icons';

interface SimpleCouplingScreenProps {
  navigation: any;
}

export const SimpleCouplingScreen: React.FC<SimpleCouplingScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { createCouple, joinCouple, isLoading } = useCouple();
  
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [showPendingInvitation, setShowPendingInvitation] = useState(false);
  
  // États séparés pour chaque mode
  const [createForm, setCreateForm] = useState({
    partnerEmail: '',
    pin: '',
    emailError: '',
    pinError: ''
  });
  
  const [joinForm, setJoinForm] = useState({
    partnerEmail: '',
    pin: '',
    emailError: '',
    pinError: ''
  });

  // Obtenir le formulaire actuel selon le mode
  const currentForm = mode === 'create' ? createForm : joinForm;
  const setCurrentForm = mode === 'create' ? setCreateForm : setJoinForm;

  // Validation email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let emailError = '';
    
    if (!email.trim()) {
      emailError = 'Email requis';
    } else if (!emailRegex.test(email)) {
      emailError = 'Email invalide';
    } else if (email.toLowerCase() === user?.email?.toLowerCase()) {
      emailError = 'Vous ne pouvez pas vous inviter vous-même';
    }
    
    setCurrentForm(prev => ({ ...prev, emailError }));
    return emailError === '';
  };

  // Validation PIN
  const validatePin = (pinValue: string) => {
    let pinError = '';
    
    if (!pinValue.trim()) {
      pinError = 'PIN requis';
    } else if (pinValue.length !== 4) {
      pinError = 'Le PIN doit contenir 4 chiffres';
    } else if (!/^\d{4}$/.test(pinValue)) {
      pinError = 'Le PIN doit contenir uniquement des chiffres';
    }
    
    setCurrentForm(prev => ({ ...prev, pinError }));
    return pinError === '';
  };

  const handleEmailChange = (email: string) => {
    setCurrentForm(prev => ({ ...prev, partnerEmail: email }));
    validateEmail(email);
  };

  const handlePinChange = (pinValue: string) => {
    setCurrentForm(prev => ({ ...prev, pin: pinValue }));
    validatePin(pinValue);
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    const isEmailValid = validateEmail(currentForm.partnerEmail);
    const isPinValid = validatePin(currentForm.pin);

    if (!isEmailValid || !isPinValid) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs');
      return;
    }

    try {
      if (mode === 'create') {
        await createCouple(currentForm.partnerEmail, currentForm.pin);
        // Afficher l'interface d'attente au lieu de naviguer immédiatement
        setShowPendingInvitation(true);
      } else {
        await joinCouple(currentForm.partnerEmail, currentForm.pin);
        Alert.alert(
          'Couple rejoint ! 💕',
          'Vous faites maintenant partie du couple !',
          [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
        );
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const isFormValid = !currentForm.emailError && !currentForm.pinError && 
                     currentForm.partnerEmail.trim() && currentForm.pin.trim();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>💕 Mise en Couple</Text>
            <Text style={styles.headerSubtitle}>
              {mode === 'create' 
                ? 'Créez votre couple en 2 étapes simples'
                : 'Rejoignez le couple de votre partenaire'
              }
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {showPendingInvitation ? (
            /* Interface d'attente d'invitation */
            <View style={styles.pendingContainer}>
              <View style={styles.pendingIcon}>
                <Ionicons name="mail-outline" size={64} color={colors.primary} />
              </View>
              
              <Text style={styles.pendingTitle}>Invitation envoyée ! 📧</Text>
              
              <Text style={styles.pendingMessage}>
                Une invitation a été envoyée à{'\n'}
                <Text style={styles.pendingEmail}>{currentForm.partnerEmail}</Text>
              </Text>
              
              <View style={styles.pendingSteps}>
                <View style={styles.pendingStep}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                  <Text style={styles.pendingStepText}>Couple créé</Text>
                </View>
                
                <View style={styles.pendingStep}>
                  <Ionicons name="time-outline" size={24} color={colors.warning} />
                  <Text style={styles.pendingStepText}>En attente d'acceptation</Text>
                </View>
                
                <View style={styles.pendingStep}>
                  <Ionicons name="heart-outline" size={24} color={colors.textSecondary} />
                  <Text style={[styles.pendingStepText, styles.pendingStepInactive]}>
                    Couple complet
                  </Text>
                </View>
              </View>
              
              <Text style={styles.pendingInfo}>
                Votre partenaire recevra une notification et pourra rejoindre le couple avec votre email et le PIN que vous avez créé.
              </Text>
              
              <View style={styles.pendingActions}>
                <Button
                  title="Continuer vers l'app"
                  onPress={() => navigation.navigate('Main')}
                  variant="primary"
                  style={styles.continueButton}
                  icon="arrow-forward-outline"
                />
                
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setShowPendingInvitation(false)}
                >
                  <Text style={styles.backButtonText}>Modifier l'invitation</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Formulaire normal */
            <>
              {/* Mode Selection */}
              <View style={styles.modeSelector}>
                <TouchableOpacity
                  style={[styles.modeButton, mode === 'create' && styles.modeButtonActive]}
                  onPress={() => setMode('create')}
                >
                  <Ionicons 
                    name="heart-outline" 
                    size={24} 
                    color={mode === 'create' ? colors.textOnPrimary : colors.primary} 
                  />
                  <Text style={[
                    styles.modeButtonText,
                    mode === 'create' && styles.modeButtonTextActive
                  ]}>
                    Créer un couple
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeButton, mode === 'join' && styles.modeButtonActive]}
                  onPress={() => setMode('join')}
                >
                  <Ionicons 
                    name="people-outline" 
                    size={24} 
                    color={mode === 'join' ? colors.textOnPrimary : colors.primary} 
                  />
                  <Text style={[
                    styles.modeButtonText,
                    mode === 'join' && styles.modeButtonTextActive
                  ]}>
                    Rejoindre un couple
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form */}
              <View style={styles.form}>
            <Input
              label={mode === 'create' ? 'Email de votre partenaire' : 'Email de votre partenaire'}
              placeholder="partenaire@example.com"
              value={currentForm.partnerEmail}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={20} color={colors.primary} />}
              error={currentForm.emailError}
            />

            <Input
              label={mode === 'create' ? 'Créer un PIN (4 chiffres)' : 'PIN du couple'}
              placeholder="1234"
              value={currentForm.pin}
              onChangeText={handlePinChange}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.primary} />}
              error={currentForm.pinError}
            />

            {/* Instructions */}
            <View style={styles.instructions}>
              <Ionicons name="information-circle-outline" size={20} color={colors.info} />
              <Text style={styles.instructionsText}>
                {mode === 'create' 
                  ? 'Votre partenaire pourra rejoindre le couple avec votre email et ce PIN.'
                  : 'Demandez à votre partenaire son email et le PIN du couple.'
                }
              </Text>
            </View>

            <Button
              title={mode === 'create' ? 'Créer le couple' : 'Rejoindre le couple'}
              onPress={handleSubmit}
              loading={isLoading}
              disabled={!isFormValid}
              fullWidth
              style={styles.submitButton}
              icon={mode === 'create' ? 'heart' : 'people'}
            />
              </View>

              {/* Skip option */}
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => navigation.navigate('Main')}
              >
                <Text style={styles.skipText}>Passer pour l'instant</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textOnPrimary,
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  modeButtonTextActive: {
    color: colors.textOnPrimary,
  },
  form: {
    gap: 20,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.info + '20',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: colors.info,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 16,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 24,
  },
  skipText: {
    fontSize: 16,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  // Styles pour l'interface d'attente
  pendingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  pendingIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  pendingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  pendingMessage: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 26,
  },
  pendingEmail: {
    fontWeight: '600',
    color: colors.primary,
  },
  pendingSteps: {
    width: '100%',
    marginVertical: 32,
  },
  pendingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    ...shadowStyles,
  },
  pendingStepText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  pendingStepInactive: {
    color: colors.textSecondary,
  },
  pendingInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  pendingActions: {
    width: '100%',
    gap: 16,
  },
  continueButton: {
    paddingVertical: 16,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
