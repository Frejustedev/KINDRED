import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

export default function CoupleSetupScreen({ navigation }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Create couple state
  const [coupleName, setCoupleName] = useState('');
  const [secretCode, setSecretCode] = useState('');

  // Join couple state
  const [inviteCode, setInviteCode] = useState('');
  const [joinSecretCode, setJoinSecretCode] = useState('');

  const { createCouple, joinCouple } = useAuth();

  const handleCreateCouple = async () => {
    if (!coupleName.trim() || !secretCode.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (secretCode.length < 4 || secretCode.length > 6) {
      Alert.alert('Erreur', 'Le code secret doit contenir entre 4 et 6 chiffres');
      return;
    }

    if (!/^\d+$/.test(secretCode)) {
      Alert.alert('Erreur', 'Le code secret ne doit contenir que des chiffres');
      return;
    }

    setLoading(true);
    try {
      const result = await createCouple(coupleName.trim(), secretCode);
      
      Alert.alert(
        'Couple créé !',
        `Votre couple "${coupleName}" a été créé avec succès.\n\nCode d'invitation : ${result.inviteCode}\n\nPartagez ce code avec votre partenaire pour qu'il puisse vous rejoindre.`,
        [{ text: 'Compris !', style: 'default' }]
      );
      
      setShowCreateModal(false);
      // Navigation automatique vers l'app principale gérée par AuthContext
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCouple = async () => {
    if (!inviteCode.trim() || !joinSecretCode.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!/^\d+$/.test(joinSecretCode)) {
      Alert.alert('Erreur', 'Le code secret ne doit contenir que des chiffres');
      return;
    }

    setLoading(true);
    try {
      await joinCouple(inviteCode.trim().toUpperCase(), joinSecretCode);
      
      Alert.alert(
        'Couple rejoint !',
        'Vous avez rejoint le couple avec succès. Bienvenue sur Kindred !',
        [{ text: 'Parfait !', style: 'default' }]
      );
      
      setShowJoinModal(false);
      // Navigation automatique vers l'app principale gérée par AuthContext
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#8EC5FC', '#E0C3FC']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="heart-circle" size={100} color="rgba(255,255,255,0.9)" />
              <Text style={styles.title}>Configuration du Couple</Text>
              <Text style={styles.subtitle}>
                Créez votre espace privé ou rejoignez votre partenaire
              </Text>
            </View>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => setShowCreateModal(true)}
            >
              <LinearGradient
                colors={['#FF6B9D', '#C44569']}
                style={styles.optionGradient}
              >
                <Ionicons name="add-circle" size={50} color="#FFFFFF" />
                <Text style={styles.optionTitle}>Créer un Couple</Text>
                <Text style={styles.optionDescription}>
                  Créez votre espace privé et générez un code d'invitation pour votre partenaire
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => setShowJoinModal(true)}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.optionGradient}
              >
                <Ionicons name="heart" size={50} color="#FFFFFF" />
                <Text style={styles.optionTitle}>Rejoindre un Couple</Text>
                <Text style={styles.optionDescription}>
                  Utilisez le code d'invitation de votre partenaire pour le rejoindre
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.infoText}>Chiffrement de bout en bout</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="people" size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.infoText}>Limité à deux personnes maximum</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark" size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.infoText}>Code secret partagé pour sécurité</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Create Couple Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.modalCancel}>Annuler</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Créer un Couple</Text>
              <TouchableOpacity 
                onPress={handleCreateCouple}
                disabled={loading}
              >
                <Text style={[styles.modalSave, loading && styles.modalSaveDisabled]}>
                  {loading ? 'Création...' : 'Créer'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom du couple</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Sarah & Alex"
                  value={coupleName}
                  onChangeText={setCoupleName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Code secret commun (4-6 chiffres)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 1234"
                  value={secretCode}
                  onChangeText={setSecretCode}
                  keyboardType="numeric"
                  maxLength={6}
                  secureTextEntry
                />
                <Text style={styles.inputHelper}>
                  Ce code protégera votre coffre sensible. Choisissez-le ensemble !
                </Text>
              </View>

              <View style={styles.processInfo}>
                <Text style={styles.processTitle}>Après création :</Text>
                <Text style={styles.processStep}>1. Un code d'invitation sera généré</Text>
                <Text style={styles.processStep}>2. Partagez-le avec votre partenaire</Text>
                <Text style={styles.processStep}>3. Il pourra rejoindre votre couple</Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Join Couple Modal */}
      <Modal visible={showJoinModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                <Text style={styles.modalCancel}>Annuler</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Rejoindre un Couple</Text>
              <TouchableOpacity 
                onPress={handleJoinCouple}
                disabled={loading}
              >
                <Text style={[styles.modalSave, loading && styles.modalSaveDisabled]}>
                  {loading ? 'Connexion...' : 'Rejoindre'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Code d'invitation</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: ABC123"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <Text style={styles.inputHelper}>
                  Code fourni par votre partenaire
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Code secret commun</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Code secret du couple"
                  value={joinSecretCode}
                  onChangeText={setJoinSecretCode}
                  keyboardType="numeric"
                  maxLength={6}
                  secureTextEntry
                />
                <Text style={styles.inputHelper}>
                  Le code secret défini par votre partenaire
                </Text>
              </View>

              <View style={styles.warningContainer}>
                <Ionicons name="information-circle" size={20} color="#FF9500" />
                <Text style={styles.warningText}>
                  Assurez-vous d'avoir les bonnes informations de votre partenaire
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 20,
    marginVertical: 20,
  },
  optionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionGradient: {
    padding: 30,
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 15,
    marginBottom: 10,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoContainer: {
    gap: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#999',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B9D',
  },
  modalSaveDisabled: {
    opacity: 0.5,
  },
  formContainer: {
    flex: 1,
    padding: 20,
    gap: 25,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  inputHelper: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  processInfo: {
    backgroundColor: '#F0F8FF',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  processTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  processStep: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  warningText: {
    fontSize: 14,
    color: '#F57C00',
    flex: 1,
  },
}); 