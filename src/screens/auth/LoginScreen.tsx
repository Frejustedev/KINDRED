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
import { useAuth } from '../../hooks/useAuth';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (error: any) {
      Alert.alert('Erreur de connexion', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
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
            <Text style={styles.title}>Kindred</Text>
            <Text style={styles.subtitle}>Votre espace intime</Text>
          </LinearGradient>

          {/* Formulaire */}
          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Bon retour !</Text>
            <Text style={styles.descriptionText}>
              Connectez-vous pour retrouver votre partenaire
            </Text>

            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              leftIcon={<Text style={styles.inputIcon}>📧</Text>}
            />

            <Input
              label="Mot de passe"
              placeholder="Votre mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
              leftIcon={<Text style={styles.inputIcon}>🔒</Text>}
            />

            <Button
              title="Se connecter"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              style={styles.loginButton}
            />

            <Button
              title="Mot de passe oublié ?"
              onPress={handleForgotPassword}
              variant="ghost"
              size="small"
              style={styles.forgotButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte ?</Text>
            <Button
              title="Créer un compte"
              onPress={handleSignUp}
              variant="outline"
              size="small"
            />
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
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 40,
    flex: 1,
  },
  welcomeText: {
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
  },
  inputIcon: {
    fontSize: 20,
  },
  loginButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  forgotButton: {
    alignSelf: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
});
