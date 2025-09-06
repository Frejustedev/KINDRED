import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useCouple } from '../../hooks/useCouple';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface CouplingWizardScreenProps {
  navigation: any;
}

export const CouplingWizardScreen: React.FC<CouplingWizardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { createCouple, joinCouple, isLoading, error, clearError } = useCouple();
  
  // États pour l'interface guidée
  const [currentStep, setCurrentStep] = useState(1);
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Validation en temps réel
  const [emailError, setEmailError] = useState('');
  const [pinError, setPinError] = useState('');
  const [confirmPinError, setConfirmPinError] = useState('');
  
  // Animations
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(cardScaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Validation en temps réel
  useEffect(() => {
    validateEmail(partnerEmail);
  }, [partnerEmail]);

  useEffect(() => {
    validatePIN(pin);
  }, [pin]);

  useEffect(() => {
    validateConfirmPIN(confirmPin, pin);
  }, [confirmPin, pin]);

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Format d\'email invalide');
    } else {
      setEmailError('');
    }
  };

  const validatePIN = (pin: string) => {
    if (!pin) {
      setPinError('');
      return;
    }
    
    if (pin.length < 4) {
      setPinError('Le PIN doit contenir 4 chiffres');
    } else if (!/^\d+$/.test(pin)) {
      setPinError('Le PIN ne doit contenir que des chiffres');
    } else {
      setPinError('');
    }
  };

  const validateConfirmPIN = (confirmPin: string, pin: string) => {
    if (!confirmPin) {
      setConfirmPinError('');
      return;
    }
    
    if (confirmPin !== pin) {
      setConfirmPinError('Les PIN ne correspondent pas');
    } else {
      setConfirmPinError('');
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !mode) {
      Alert.alert('Erreur', 'Veuillez choisir un mode');
      return;
    }
    
    if (currentStep === 2) {
      if (mode === 'create' && (!partnerEmail || emailError)) {
        Alert.alert('Erreur', 'Veuillez saisir un email valide');
        return;
      }
      if (mode === 'join' && !inviteCode) {
        Alert.alert('Erreur', 'Veuillez saisir le code d\'invitation');
        return;
      }
    }

    Animated.timing(slideAnim, {
      toValue: -(currentStep * width),
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(currentStep + 1);
    });
  };

  const prevStep = () => {
    Animated.timing(slideAnim, {
      toValue: -((currentStep - 2) * width),
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(currentStep - 1);
    });
  };

  const handleCreateCouple = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    if (!partnerEmail.trim() || emailError) {
      Alert.alert('Erreur', 'Veuillez saisir un email valide');
      return;
    }

    if (!pin.trim() || pinError || confirmPinError) {
      Alert.alert('Erreur', 'Veuillez saisir un PIN valide');
      return;
    }

    try {
      await createCouple(partnerEmail, pin);
      setShowSuccess(true);
      setTimeout(() => {
        navigation.navigate('Main');
      }, 3000);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la création du couple');
    }
  };

  const handleJoinCouple = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    if (!inviteCode.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le code d\'invitation');
      return;
    }

    if (!pin.trim() || pinError) {
      Alert.alert('Erreur', 'Veuillez saisir le PIN correct');
      return;
    }

    try {
      await joinCouple(inviteCode, pin);
      setShowSuccess(true);
      setTimeout(() => {
        navigation.navigate('Main');
      }, 3000);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la jonction du couple');
    }
  };

  const clearForm = () => {
    setPartnerEmail('');
    setInviteCode('');
    setPin('');
    setConfirmPin('');
    setCurrentStep(1);
    setShowSuccess(false);
    setEmailError('');
    setPinError('');
    setConfirmPinError('');
    clearError();
  };

  // Écran de succès
  if (showSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={colors.gradient}
          style={styles.successContainer}
        >
          <Animated.View style={[styles.successContent, { opacity: fadeAnim }]}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color="white" />
            </View>
            <Text style={styles.successTitle}>🎉 Couple créé avec succès !</Text>
            <Text style={styles.successSubtitle}>
              Vous êtes maintenant connectés et pouvez commencer à partager vos moments ensemble !
            </Text>
            <View style={styles.successSteps}>
              <Text style={styles.successStep}>✅ Votre partenaire a été notifié</Text>
              <Text style={styles.successStep}>✅ Votre espace couple est prêt</Text>
              <Text style={styles.successStep}>✅ Redirection automatique...</Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Header avec gradient moderne */}
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.logo}>💕</Text>
            <Text style={styles.title}>Jumelage</Text>
            <Text style={styles.subtitle}>Connectez-vous avec votre partenaire</Text>
          </Animated.View>
        </LinearGradient>

        {/* Indicateur de progression moderne */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill, 
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', `${(currentStep / 3) * 100}%`],
                  })
                }
              ]} 
            />
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>Étape {currentStep} sur 3</Text>
            <Text style={styles.progressPercentage}>{Math.round((currentStep / 3) * 100)}%</Text>
          </View>
        </View>

        {/* Contenu principal avec ScrollView */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.contentContainer,
              {
                transform: [{ translateX: slideAnim }, { scale: cardScaleAnim }]
              }
            ]}
          >
            {/* Étape 1: Choix du mode */}
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepTitle}>Comment souhaitez-vous procéder ?</Text>
              </View>
              
              <View style={styles.modeCards}>
                <TouchableOpacity
                  style={[
                    styles.modeCard,
                    mode === 'create' && styles.modeCardActive
                  ]}
                  onPress={() => setMode('create')}
                >
                  <View style={styles.modeCardIcon}>
                    <Ionicons 
                      name="add-circle-outline" 
                      size={48} 
                      color={mode === 'create' ? colors.primary : colors.textSecondary} 
                    />
                  </View>
                  <Text style={[
                    styles.modeCardTitle,
                    mode === 'create' && styles.modeCardTitleActive
                  ]}>
                    Créer un couple
                  </Text>
                  <Text style={styles.modeCardSubtitle}>
                    Invitez votre partenaire par email
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeCard,
                    mode === 'join' && styles.modeCardActive
                  ]}
                  onPress={() => setMode('join')}
                >
                  <View style={styles.modeCardIcon}>
                    <Ionicons 
                      name="enter-outline" 
                      size={48} 
                      color={mode === 'join' ? colors.primary : colors.textSecondary} 
                    />
                  </View>
                  <Text style={[
                    styles.modeCardTitle,
                    mode === 'join' && styles.modeCardTitleActive
                  ]}>
                    Rejoindre un couple
                  </Text>
                  <Text style={styles.modeCardSubtitle}>
                    Utilisez un code d'invitation
                  </Text>
                </TouchableOpacity>
              </View>

              <Button
                title="Continuer"
                onPress={nextStep}
                fullWidth
                style={styles.nextButton}
                disabled={!mode}
              />
            </View>

            {/* Étape 2: Saisie des informations */}
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <TouchableOpacity onPress={prevStep} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepTitle}>
                  {mode === 'create' ? 'Informations du partenaire' : 'Code d\'invitation'}
                </Text>
              </View>

              {mode === 'create' ? (
                <View style={styles.formSection}>
                  <Text style={styles.formDescription}>
                    Saisissez l'adresse email de votre partenaire pour l'inviter
                  </Text>
                  
                  <Input
                    label="Email du partenaire"
                    placeholder="partenaire@email.com"
                    value={partnerEmail}
                    onChangeText={setPartnerEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    leftIcon={<Text style={styles.inputIcon}>📧</Text>}
                    error={emailError}
                  />
                </View>
              ) : (
                <View style={styles.formSection}>
                  <Text style={styles.formDescription}>
                    Entrez le code d'invitation que votre partenaire vous a envoyé
                  </Text>
                  
                  <Input
                    label="Code d'invitation"
                    placeholder="ABC123"
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    autoCapitalize="characters"
                    leftIcon={<Text style={styles.inputIcon}>🎫</Text>}
                  />
                </View>
              )}

              <Button
                title="Continuer"
                onPress={nextStep}
                fullWidth
                style={styles.nextButton}
                disabled={mode === 'create' ? (!partnerEmail.trim() || !!emailError) : !inviteCode.trim()}
              />
            </View>

            {/* Étape 3: Code PIN */}
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <TouchableOpacity onPress={prevStep} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepTitle}>Code de sécurité</Text>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formDescription}>
                  {mode === 'create' 
                    ? 'Créez un code PIN à 4 chiffres pour sécuriser votre couple'
                    : 'Entrez le code PIN fourni par votre partenaire'
                  }
                </Text>
                
                {mode === 'create' && (
                  <>
                    <Input
                      label="Code PIN"
                      placeholder="1234"
                      value={pin}
                      onChangeText={setPin}
                      keyboardType="numeric"
                      maxLength={4}
                      leftIcon={<Text style={styles.inputIcon}>🔒</Text>}
                      error={pinError}
                    />

                    <Input
                      label="Confirmer le code PIN"
                      placeholder="1234"
                      value={confirmPin}
                      onChangeText={setConfirmPin}
                      keyboardType="numeric"
                      maxLength={4}
                      leftIcon={<Text style={styles.inputIcon}>🔒</Text>}
                      error={confirmPinError}
                    />

                    <View style={styles.pinInfo}>
                      <Ionicons name="information-circle-outline" size={20} color={colors.text} />
                      <Text style={styles.pinInfoText}>
                        Ce code sera utilisé pour accéder aux fonctionnalités privées du couple
                      </Text>
                    </View>
                  </>
                )}

                {mode === 'join' && (
                  <Input
                    label="Code PIN"
                    placeholder="1234"
                    value={pin}
                    onChangeText={setPin}
                    keyboardType="numeric"
                    maxLength={4}
                    leftIcon={<Text style={styles.inputIcon}>🔒</Text>}
                    error={pinError}
                  />
                )}
              </View>

              <Button
                title={mode === 'create' ? 'Créer le couple' : 'Rejoindre le couple'}
                onPress={mode === 'create' ? handleCreateCouple : handleJoinCouple}
                loading={isLoading}
                fullWidth
                style={styles.nextButton}
                disabled={
                  mode === 'create' 
                    ? (!pin.trim() || !!pinError || !!confirmPinError || pin !== confirmPin)
                    : (!pin.trim() || !!pinError)
                }
              />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.textOnPrimary,
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 20,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  contentContainer: {
    flexDirection: 'row',
    width: width - 48,
  },
  stepContainer: {
    width: width - 48,
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    padding: 12,
    marginRight: 16,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepNumberText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  modeCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 16,
  },
  modeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modeCardActive: {
    borderColor: colors.primary,
    borderWidth: 3,
    backgroundColor: colors.primaryLight,
    transform: [{ scale: 1.02 }],
  },
  modeCardIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modeCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modeCardTitleActive: {
    color: colors.primary,
  },
  modeCardSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  nextButton: {
    marginTop: 24,
  },
  formSection: {
    marginBottom: 24,
  },
  formDescription: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 26,
  },
  inputIcon: {
    fontSize: 24,
  },
  pinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: colors.infoLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.infoExtraLight,
  },
  pinInfoText: {
    fontSize: 16,
    color: colors.info,
    marginLeft: 12,
    flexShrink: 1,
    lineHeight: 22,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successContent: {
    alignItems: 'center',
  },
  successIcon: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 18,
    color: colors.textOnPrimary,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
  },
  successSteps: {
    width: '100%',
  },
  successStep: {
    fontSize: 18,
    color: colors.textOnPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
});
