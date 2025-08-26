import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useCouple } from '../../hooks/useCouple';
import { useAuth } from '../../hooks/useAuth';

interface CouplingScreenProps {
  navigation: any;
}

export const CouplingScreen: React.FC<CouplingScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { createCouple, joinCouple, isLoading, error, clearError } = useCouple();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleCreateCouple = async () => {
    console.log('handleCreateCouple called');
    console.log('user:', user);
    console.log('partnerEmail:', partnerEmail);
    console.log('pin:', pin);
    
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    if (!partnerEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir l\'email de votre partenaire');
      return;
    }

    if (!pin.trim() || pin.length < 4) {
      Alert.alert('Erreur', 'Le code PIN doit contenir au moins 4 caractères');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('Erreur', 'Les codes PIN ne correspondent pas');
      return;
    }

    try {
      console.log('Creating couple...');
      await createCouple(partnerEmail, pin);
      Alert.alert(
        'Couple créé avec succès !', 
        'Votre partenaire a été ajouté au couple. Vous pouvez maintenant utiliser l\'application ensemble !',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error creating couple:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la création du couple');
    }
  };

  const handleJoinCouple = async () => {
    console.log('handleJoinCouple called');
    console.log('user:', user);
    console.log('inviteCode:', inviteCode);
    console.log('pin:', pin);
    
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    if (!inviteCode.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le code d\'invitation');
      return;
    }

    if (!pin.trim() || pin.length < 4) {
      Alert.alert('Erreur', 'Le code PIN doit contenir au moins 4 caractères');
      return;
    }

    try {
      console.log('Joining couple...');
      await joinCouple(inviteCode, pin);
      Alert.alert('Succès', 'Vous avez rejoint le couple avec succès !');
    } catch (error: any) {
      console.error('Error joining couple:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la jonction du couple');
    }
  };

  const clearForm = () => {
    setPartnerEmail('');
    setInviteCode('');
    setPin('');
    setConfirmPin('');
    clearError();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header avec gradient */}
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Text style={styles.logo}>💕</Text>
            <Text style={styles.title}>Jumelage</Text>
            <Text style={styles.subtitle}>Connectez-vous avec votre partenaire</Text>
          </LinearGradient>

          {/* Sélecteur de mode */}
          <View style={styles.modeSelector}>
            <Button
              title="Créer un couple"
              onPress={() => {
                setMode('create');
                clearForm();
              }}
              variant={mode === 'create' ? 'primary' : 'outline'}
              size="small"
              style={styles.modeButton}
            />
            <Button
              title="Rejoindre un couple"
              onPress={() => {
                setMode('join');
                clearForm();
              }}
              variant={mode === 'join' ? 'primary' : 'outline'}
              size="small"
              style={styles.modeButton}
            />
          </View>

          {/* Formulaire */}
          <View style={styles.formContainer}>
            {mode === 'create' ? (
              <>
                <Text style={styles.sectionTitle}>Créer un nouveau couple</Text>
                <Text style={styles.descriptionText}>
                  Invitez votre partenaire en saisissant son adresse email
                </Text>

                <Input
                  label="Email du partenaire"
                  placeholder="partenaire@email.com"
                  value={partnerEmail}
                  onChangeText={setPartnerEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Text style={styles.inputIcon}>📧</Text>}
                />

                <Input
                  label="Code PIN (4 chiffres minimum)"
                  placeholder="1234"
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="numeric"
                  maxLength={6}
                  leftIcon={<Text style={styles.inputIcon}>🔒</Text>}
                />

                <Input
                  label="Confirmer le code PIN"
                  placeholder="1234"
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  keyboardType="numeric"
                  maxLength={6}
                  leftIcon={<Text style={styles.inputIcon}>🔒</Text>}
                />

                <Button
                  title="Créer le couple"
                  onPress={handleCreateCouple}
                  loading={isLoading}
                  fullWidth
                  style={styles.submitButton}
                />
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Rejoindre un couple existant</Text>
                <Text style={styles.descriptionText}>
                  Saisissez le code d'invitation et le code PIN fournis par votre partenaire
                </Text>

                <Input
                  label="Code d'invitation"
                  placeholder="ABC123"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                  maxLength={6}
                  leftIcon={<Text style={styles.inputIcon}>🎫</Text>}
                />

                <Input
                  label="Code PIN"
                  placeholder="1234"
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="numeric"
                  maxLength={6}
                  leftIcon={<Text style={styles.inputIcon}>🔒</Text>}
                />

                <Button
                  title="Rejoindre le couple"
                  onPress={handleJoinCouple}
                  loading={isLoading}
                  fullWidth
                  style={styles.submitButton}
                />
              </>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Le code PIN sera utilisé pour sécuriser vos conversations
            </Text>
          </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logo: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textOnPrimary,
    opacity: 0.9,
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 32,
  },
  modeButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  formContainer: {
    paddingHorizontal: 24,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputIcon: {
    fontSize: 20,
  },
  submitButton: {
    marginTop: 24,
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
