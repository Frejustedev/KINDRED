import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

const SAMPLE_VAULT_ITEMS = [
  {
    id: 1,
    type: 'photo',
    uri: 'https://picsum.photos/300/300?random=1',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    expiresAt: Date.now() + 1000 * 60 * 60 * 22, // 22 hours from now
  },
  {
    id: 2,
    type: 'photo',
    uri: 'https://picsum.photos/300/300?random=2',
    timestamp: Date.now() - 1000 * 60 * 60 * 8, // 8 hours ago
    expiresAt: Date.now() + 1000 * 60 * 60 * 16, // 16 hours from now
  },
];

export default function VaultScreen() {
  const [isLocked, setIsLocked] = useState(true);
  const [secretCode, setSecretCode] = useState('');
  const [vaultItems, setVaultItems] = useState(SAMPLE_VAULT_ITEMS);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [isSettingCode, setIsSettingCode] = useState(false);

  const VAULT_CODE = '1234'; // In real app, this would be stored securely

  useEffect(() => {
    // Clean up expired items
    const cleanupExpired = () => {
      setVaultItems(prev => prev.filter(item => item.expiresAt > Date.now()));
    };

    const interval = setInterval(cleanupExpired, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const formatTimeRemaining = (expiresAt) => {
    const remaining = expiresAt - Date.now();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleCodeSubmit = () => {
    if (secretCode === VAULT_CODE) {
      setIsLocked(false);
      setShowCodeModal(false);
      setSecretCode('');
    } else {
      Alert.alert('Code incorrect', 'Veuillez réessayer');
      setSecretCode('');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const newItem = {
        id: vaultItems.length + 1,
        type: 'photo',
        uri: result.assets[0].uri,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      };
      setVaultItems([newItem, ...vaultItems]);
    }
  };

  const deleteItem = (id) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous supprimer cette photo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => {
          setVaultItems(prev => prev.filter(item => item.id !== id));
        }},
      ]
    );
  };

  const renderVaultItem = ({ item }) => (
    <TouchableOpacity
      style={styles.vaultItem}
      onLongPress={() => deleteItem(item.id)}
    >
      <Image source={{ uri: item.uri }} style={styles.vaultImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.imageOverlay}
      >
        <View style={styles.timerContainer}>
          <Ionicons name="time" size={14} color="#FFFFFF" />
          <Text style={styles.timerText}>
            {formatTimeRemaining(item.expiresAt)}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (isLocked) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.lockedContainer}
        >
          <Ionicons name="lock-closed" size={80} color="#FFFFFF" />
          <Text style={styles.lockedTitle}>Coffre Sensible</Text>
          <Text style={styles.lockedSubtitle}>
            Entrez votre code secret pour accéder aux photos intimes
          </Text>
          <TouchableOpacity
            style={styles.unlockButton}
            onPress={() => setShowCodeModal(true)}
          >
            <Text style={styles.unlockButtonText}>Déverrouiller</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Modal visible={showCodeModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.codeModal}>
              <Text style={styles.modalTitle}>Code Secret</Text>
              <TextInput
                style={styles.codeInput}
                value={secretCode}
                onChangeText={setSecretCode}
                keyboardType="numeric"
                secureTextEntry
                maxLength={6}
                placeholder="••••"
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowCodeModal(false);
                    setSecretCode('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleCodeSubmit}
                >
                  <Text style={styles.confirmButtonText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Coffre Sensible</Text>
            <Text style={styles.headerSubtitle}>
              Photos qui disparaissent après 24h
            </Text>
          </View>
          <TouchableOpacity
            style={styles.lockButton}
            onPress={() => setIsLocked(true)}
          >
            <Ionicons name="lock-open" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <FlatList
          data={vaultItems}
          renderItem={renderVaultItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={60} color="#C7C7CC" />
              <Text style={styles.emptyText}>Aucune photo dans le coffre</Text>
              <Text style={styles.emptySubtext}>
                Ajoutez des photos intimes qui disparaîtront après 24h
              </Text>
            </View>
          }
        />

        <TouchableOpacity style={styles.addButton} onPress={pickImage}>
          <LinearGradient
            colors={['#FF6B9D', '#C44569']}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  lockedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  lockedSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 40,
  },
  unlockButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  lockButton: {
    padding: 10,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  grid: {
    padding: 20,
  },
  vaultItem: {
    flex: 1,
    margin: 8,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  vaultImage: {
    width: '100%',
    aspectRatio: 1,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 250,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  addButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeModal: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    width: 120,
    marginBottom: 30,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  modalButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  confirmButton: {
    backgroundColor: '#667eea',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 