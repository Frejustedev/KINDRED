import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import { useCouple } from '../../hooks/useCouple';
import { Ionicons } from '@expo/vector-icons';

interface SignUpScreenProps {
  navigation: any;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const { signUp } = useAuth();
  const { couple } = useCouple();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('fr');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    country?: string;
    language?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // États pour les modals
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Données pour les sélecteurs
  const countries = [
    { code: 'AF', name: 'Afghanistan' },
    { code: 'ZA', name: 'Afrique du Sud' },
    { code: 'AL', name: 'Albanie' },
    { code: 'DZ', name: 'Algérie' },
    { code: 'DE', name: 'Allemagne' },
    { code: 'AD', name: 'Andorre' },
    { code: 'AO', name: 'Angola' },
    { code: 'AI', name: 'Anguilla' },
    { code: 'AQ', name: 'Antarctique' },
    { code: 'AG', name: 'Antigua-et-Barbuda' },
    { code: 'SA', name: 'Arabie Saoudite' },
    { code: 'AR', name: 'Argentine' },
    { code: 'AM', name: 'Arménie' },
    { code: 'AW', name: 'Aruba' },
    { code: 'AU', name: 'Australie' },
    { code: 'AT', name: 'Autriche' },
    { code: 'AZ', name: 'Azerbaïdjan' },
    { code: 'BS', name: 'Bahamas' },
    { code: 'BH', name: 'Bahreïn' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BB', name: 'Barbade' },
    { code: 'BE', name: 'Belgique' },
    { code: 'BZ', name: 'Belize' },
    { code: 'BJ', name: 'Bénin' },
    { code: 'BM', name: 'Bermudes' },
    { code: 'BT', name: 'Bhoutan' },
    { code: 'BO', name: 'Bolivie' },
    { code: 'BA', name: 'Bosnie-Herzégovine' },
    { code: 'BW', name: 'Botswana' },
    { code: 'BR', name: 'Brésil' },
    { code: 'BN', name: 'Brunei' },
    { code: 'BG', name: 'Bulgarie' },
    { code: 'BF', name: 'Burkina Faso' },
    { code: 'BI', name: 'Burundi' },
    { code: 'KH', name: 'Cambodge' },
    { code: 'CM', name: 'Cameroun' },
    { code: 'CA', name: 'Canada' },
    { code: 'CV', name: 'Cap-Vert' },
    { code: 'CL', name: 'Chili' },
    { code: 'CN', name: 'Chine' },
    { code: 'CY', name: 'Chypre' },
    { code: 'CO', name: 'Colombie' },
    { code: 'KM', name: 'Comores' },
    { code: 'CG', name: 'Congo' },
    { code: 'CD', name: 'Congo (RDC)' },
    { code: 'KR', name: 'Corée du Sud' },
    { code: 'KP', name: 'Corée du Nord' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'CI', name: 'Côte d\'Ivoire' },
    { code: 'HR', name: 'Croatie' },
    { code: 'CU', name: 'Cuba' },
    { code: 'DK', name: 'Danemark' },
    { code: 'DJ', name: 'Djibouti' },
    { code: 'DO', name: 'République dominicaine' },
    { code: 'EG', name: 'Égypte' },
    { code: 'AE', name: 'Émirats arabes unis' },
    { code: 'EC', name: 'Équateur' },
    { code: 'ER', name: 'Érythrée' },
    { code: 'ES', name: 'Espagne' },
    { code: 'EE', name: 'Estonie' },
    { code: 'SZ', name: 'Eswatini' },
    { code: 'US', name: 'États-Unis' },
    { code: 'ET', name: 'Éthiopie' },
    { code: 'FJ', name: 'Fidji' },
    { code: 'FI', name: 'Finlande' },
    { code: 'FR', name: 'France' },
    { code: 'GA', name: 'Gabon' },
    { code: 'GM', name: 'Gambie' },
    { code: 'GE', name: 'Géorgie' },
    { code: 'GH', name: 'Ghana' },
    { code: 'GI', name: 'Gibraltar' },
    { code: 'GR', name: 'Grèce' },
    { code: 'GD', name: 'Grenade' },
    { code: 'GL', name: 'Groenland' },
    { code: 'GP', name: 'Guadeloupe' },
    { code: 'GU', name: 'Guam' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'GG', name: 'Guernesey' },
    { code: 'GN', name: 'Guinée' },
    { code: 'GQ', name: 'Guinée équatoriale' },
    { code: 'GW', name: 'Guinée-Bissau' },
    { code: 'GY', name: 'Guyana' },
    { code: 'GF', name: 'Guyane française' },
    { code: 'HT', name: 'Haïti' },
    { code: 'HN', name: 'Honduras' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'HU', name: 'Hongrie' },
    { code: 'IN', name: 'Inde' },
    { code: 'ID', name: 'Indonésie' },
    { code: 'IQ', name: 'Irak' },
    { code: 'IR', name: 'Iran' },
    { code: 'IE', name: 'Irlande' },
    { code: 'IS', name: 'Islande' },
    { code: 'IL', name: 'Israël' },
    { code: 'IT', name: 'Italie' },
    { code: 'JM', name: 'Jamaïque' },
    { code: 'JP', name: 'Japon' },
    { code: 'JE', name: 'Jersey' },
    { code: 'JO', name: 'Jordanie' },
    { code: 'KZ', name: 'Kazakhstan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KG', name: 'Kirghizistan' },
    { code: 'KI', name: 'Kiribati' },
    { code: 'XK', name: 'Kosovo' },
    { code: 'KW', name: 'Koweït' },
    { code: 'LA', name: 'Laos' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'LV', name: 'Lettonie' },
    { code: 'LB', name: 'Liban' },
    { code: 'LR', name: 'Libéria' },
    { code: 'LY', name: 'Libye' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Lituanie' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MO', name: 'Macao' },
    { code: 'MK', name: 'Macédoine du Nord' },
    { code: 'MG', name: 'Madagascar' },
    { code: 'MY', name: 'Malaisie' },
    { code: 'MW', name: 'Malawi' },
    { code: 'MV', name: 'Maldives' },
    { code: 'ML', name: 'Mali' },
    { code: 'MT', name: 'Malte' },
    { code: 'MA', name: 'Maroc' },
    { code: 'MQ', name: 'Martinique' },
    { code: 'MU', name: 'Maurice' },
    { code: 'MR', name: 'Mauritanie' },
    { code: 'YT', name: 'Mayotte' },
    { code: 'MX', name: 'Mexique' },
    { code: 'MD', name: 'Moldavie' },
    { code: 'MC', name: 'Monaco' },
    { code: 'MN', name: 'Mongolie' },
    { code: 'ME', name: 'Monténégro' },
    { code: 'MS', name: 'Montserrat' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'MM', name: 'Myanmar' },
    { code: 'NA', name: 'Namibie' },
    { code: 'NR', name: 'Nauru' },
    { code: 'NP', name: 'Népal' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'NE', name: 'Niger' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'NU', name: 'Niue' },
    { code: 'NO', name: 'Norvège' },
    { code: 'NC', name: 'Nouvelle-Calédonie' },
    { code: 'NZ', name: 'Nouvelle-Zélande' },
    { code: 'OM', name: 'Oman' },
    { code: 'UG', name: 'Ouganda' },
    { code: 'UZ', name: 'Ouzbékistan' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PW', name: 'Palaos' },
    { code: 'PS', name: 'Palestine' },
    { code: 'PA', name: 'Panama' },
    { code: 'PG', name: 'Papouasie-Nouvelle-Guinée' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'NL', name: 'Pays-Bas' },
    { code: 'PE', name: 'Pérou' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PL', name: 'Pologne' },
    { code: 'PF', name: 'Polynésie française' },
    { code: 'PR', name: 'Porto Rico' },
    { code: 'PT', name: 'Portugal' },
    { code: 'RE', name: 'Réunion' },
    { code: 'RO', name: 'Roumanie' },
    { code: 'GB', name: 'Royaume-Uni' },
    { code: 'RU', name: 'Russie' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'EH', name: 'Sahara occidental' },
    { code: 'BL', name: 'Saint-Barthélemy' },
    { code: 'KN', name: 'Saint-Kitts-et-Nevis' },
    { code: 'SM', name: 'Saint-Marin' },
    { code: 'MF', name: 'Saint-Martin' },
    { code: 'PM', name: 'Saint-Pierre-et-Miquelon' },
    { code: 'VA', name: 'Saint-Siège (Vatican)' },
    { code: 'VC', name: 'Saint-Vincent-et-les-Grenadines' },
    { code: 'LC', name: 'Sainte-Lucie' },
    { code: 'SB', name: 'Îles Salomon' },
    { code: 'WS', name: 'Samoa' },
    { code: 'AS', name: 'Samoa américaines' },
    { code: 'ST', name: 'Sao Tomé-et-Principe' },
    { code: 'SN', name: 'Sénégal' },
    { code: 'RS', name: 'Serbie' },
    { code: 'SC', name: 'Seychelles' },
    { code: 'SL', name: 'Sierra Leone' },
    { code: 'SG', name: 'Singapour' },
    { code: 'SK', name: 'Slovaquie' },
    { code: 'SI', name: 'Slovénie' },
    { code: 'SO', name: 'Somalie' },
    { code: 'SD', name: 'Soudan' },
    { code: 'SS', name: 'Soudan du Sud' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'SE', name: 'Suède' },
    { code: 'CH', name: 'Suisse' },
    { code: 'SR', name: 'Suriname' },
    { code: 'SY', name: 'Syrie' },
    { code: 'TJ', name: 'Tadjikistan' },
    { code: 'TW', name: 'Taïwan' },
    { code: 'TZ', name: 'Tanzanie' },
    { code: 'TD', name: 'Tchad' },
    { code: 'CZ', name: 'République tchèque' },
    { code: 'TF', name: 'Terres australes françaises' },
    { code: 'TH', name: 'Thaïlande' },
    { code: 'TL', name: 'Timor oriental' },
    { code: 'TG', name: 'Togo' },
    { code: 'TK', name: 'Tokelau' },
    { code: 'TO', name: 'Tonga' },
    { code: 'TT', name: 'Trinité-et-Tobago' },
    { code: 'TN', name: 'Tunisie' },
    { code: 'TM', name: 'Turkménistan' },
    { code: 'TR', name: 'Turquie' },
    { code: 'TV', name: 'Tuvalu' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'VU', name: 'Vanuatu' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'WF', name: 'Wallis-et-Futuna' },
    { code: 'YE', name: 'Yémen' },
    { code: 'ZM', name: 'Zambie' },
    { code: 'ZW', name: 'Zimbabwe' },
  ];

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: 'Chinois', flag: '🇨🇳' },
    { code: 'fon', name: 'Fon', flag: '🇧🇯' },
    { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
    { code: 'ar', name: 'Arabe', flag: '🇸🇦' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'ru', name: 'Russe', flag: '🇷🇺' },
  ];

  const validateForm = () => {
    const newErrors: {
      firstName?: string;
      lastName?: string;
      birthDate?: string;
      country?: string;
      language?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!birthDate) {
      newErrors.birthDate = 'La date de naissance est requise';
    } else {
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 13 || age > 120) {
        newErrors.birthDate = 'L\'âge doit être entre 13 et 120 ans';
      }
    }

    if (!country.trim()) {
      newErrors.country = 'Le pays est requis';
    }

    if (!language.trim()) {
      newErrors.language = 'La langue est requise';
    }

    if (!email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Calculer l'âge à partir de la date de naissance
      const today = new Date();
      const age = today.getFullYear() - birthDate!.getFullYear();
      const monthDiff = today.getMonth() - birthDate!.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate!.getDate())) {
        age--;
      }

      await signUp(
        email.trim(), 
        password, 
        firstName.trim(),
        lastName.trim(),
        age,
        country.trim(),
        language
      );
      
      // Vérifier si l'utilisateur a un couple après l'inscription
      if (!couple) {
        // Si pas de couple, rediriger vers la page de jumelage
        Alert.alert(
          'Inscription réussie !',
          'Un email de vérification a été envoyé à votre adresse email. Vous devez maintenant créer ou rejoindre un couple.',
          [
            {
              text: 'Continuer',
              onPress: () => navigation.navigate('Coupling'),
            },
          ]
        );
      } else {
        // Si déjà un couple, rediriger vers la vérification email
        Alert.alert(
          'Inscription réussie !',
          'Un email de vérification a été envoyé à votre adresse email.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('EmailVerification'),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Erreur d\'inscription', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleCountrySelect = (selectedCountry: string) => {
    setCountry(selectedCountry);
    setShowCountryModal(false);
  };

  const handleLanguageSelect = (selectedLanguage: string) => {
    setLanguage(selectedLanguage);
    setShowLanguageModal(false);
  };

  const getSelectedCountryName = () => {
    const selected = countries.find(c => c.code === country);
    return selected ? selected.name : 'Sélectionner un pays';
  };

  const getSelectedLanguageName = () => {
    const selected = languages.find(l => l.code === language);
    return selected ? `${selected.flag} ${selected.name}` : 'Sélectionner une langue';
  };

  const getSelectedBirthDate = () => {
    if (!birthDate) return 'Sélectionner votre date de naissance';
    return birthDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateAge = () => {
    if (!birthDate) return '';
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
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
            <Text style={styles.subtitle}>Rejoignez l'aventure</Text>
          </LinearGradient>

          {/* Formulaire */}
          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Créer votre compte</Text>
            <Text style={styles.descriptionText}>
              Commencez votre voyage ensemble
            </Text>

            <Input
              label="Prénom"
              placeholder="Votre prénom"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              error={errors.firstName}
              leftIcon={<Text style={styles.inputIcon}>👤</Text>}
            />

            <Input
              label="Nom"
              placeholder="Votre nom"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              error={errors.lastName}
              leftIcon={<Text style={styles.inputIcon}>📝</Text>}
            />

            <TouchableOpacity
              style={[styles.selectInput, errors.birthDate && styles.selectInputError]}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.selectInputContent}>
                <Text style={styles.inputIcon}>🎂</Text>
                <View style={styles.selectInputText}>
                  <Text style={styles.selectInputLabel}>Date de naissance</Text>
                  <Text style={styles.selectInputValue}>{getSelectedBirthDate()}</Text>
                  {birthDate && (
                    <Text style={styles.ageText}>{calculateAge()} ans</Text>
                  )}
                </View>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
            {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}

            <TouchableOpacity
              style={[styles.selectInput, errors.country && styles.selectInputError]}
              onPress={() => setShowCountryModal(true)}
            >
              <View style={styles.selectInputContent}>
                <Text style={styles.inputIcon}>🌍</Text>
                <View style={styles.selectInputText}>
                  <Text style={styles.selectInputLabel}>Pays</Text>
                  <Text style={styles.selectInputValue}>{getSelectedCountryName()}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
            {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}

            <TouchableOpacity
              style={[styles.selectInput, errors.language && styles.selectInputError]}
              onPress={() => setShowLanguageModal(true)}
            >
              <View style={styles.selectInputContent}>
                <Text style={styles.inputIcon}>🗣️</Text>
                <View style={styles.selectInputText}>
                  <Text style={styles.selectInputLabel}>Langue</Text>
                  <Text style={styles.selectInputValue}>{getSelectedLanguageName()}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
            {errors.language && <Text style={styles.errorText}>{errors.language}</Text>}

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
              placeholder="Créez un mot de passe sécurisé"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
              leftIcon={<Text style={styles.inputIcon}>🔒</Text>}
            />

            <Input
              label="Confirmer le mot de passe"
              placeholder="Confirmez votre mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              error={errors.confirmPassword}
              leftIcon={<Text style={styles.inputIcon}>🔐</Text>}
            />

            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>Le mot de passe doit contenir :</Text>
              <Text style={[styles.requirement, password.length >= 6 && styles.requirementMet]}>
                • Au moins 6 caractères
              </Text>
              <Text style={[styles.requirement, /[a-z]/.test(password) && styles.requirementMet]}>
                • Une lettre minuscule
              </Text>
              <Text style={[styles.requirement, /[A-Z]/.test(password) && styles.requirementMet]}>
                • Une lettre majuscule
              </Text>
              <Text style={[styles.requirement, /\d/.test(password) && styles.requirementMet]}>
                • Un chiffre
              </Text>
            </View>

            <Button
              title="Créer mon compte"
              onPress={handleSignUp}
              loading={loading}
              fullWidth
              style={styles.signUpButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ?</Text>
            <Button
              title="Se connecter"
              onPress={handleLogin}
              variant="outline"
              size="small"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal pour sélectionner le pays */}
      <Modal
        visible={showCountryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un pays</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {countries.map((countryItem) => (
                <TouchableOpacity
                  key={countryItem.code}
                  style={styles.modalItem}
                  onPress={() => handleCountrySelect(countryItem.code)}
                >
                  <Text style={styles.modalItemText}>{countryItem.name}</Text>
                  {country === countryItem.code && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal pour sélectionner la langue */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une langue</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {languages.map((languageItem) => (
                <TouchableOpacity
                  key={languageItem.code}
                  style={styles.modalItem}
                  onPress={() => handleLanguageSelect(languageItem.code)}
                >
                  <Text style={styles.modalItemText}>
                    {languageItem.flag} {languageItem.name}
                  </Text>
                  {language === languageItem.code && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DatePicker pour la date de naissance */}
      {showDatePicker && (
        <DateTimePicker
          value={birthDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}
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
  passwordRequirements: {
    backgroundColor: colors.surfaceVariant,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  requirement: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  requirementMet: {
    color: colors.success,
  },
  signUpButton: {
    marginTop: 8,
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
  selectInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectInputError: {
    borderColor: colors.error,
  },
  selectInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectInputText: {
    flex: 1,
    marginLeft: 12,
  },
  selectInputLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  selectInputValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  ageText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.text,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
});
