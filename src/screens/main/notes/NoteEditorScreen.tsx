import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../constants/colors';
import { useAuth } from '../../../hooks/useAuth';
import { useCouple } from '../../../hooks/useCouple';
import { FirestoreService } from '../../../services/firebase/firestore.service';
import { CollaborativeNote } from '../../../types';
import { Ionicons } from '@expo/vector-icons';

interface NoteEditorScreenProps {
  navigation: any;
  route: any;
}

export const NoteEditorScreen: React.FC<NoteEditorScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const { noteId, note: initialNote } = route.params || {};
  
  const [note, setNote] = useState<CollaborativeNote>(initialNote);
  const [title, setTitle] = useState(initialNote.title);
  const [content, setContent] = useState(initialNote.content);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Détecter les changements
  useEffect(() => {
    const changed = title !== initialNote.title || content !== initialNote.content;
    setHasChanges(changed);
  }, [title, content, initialNote]);

  // Sauvegarde automatique
  const autoSave = useCallback(async () => {
    if (!hasChanges || !couple || !user) return;

    try {
      setIsSaving(true);
      setError(null);
      
      const updates = {
        title: title.trim(),
        content: content.trim(),
        lastEditedBy: user.uid,
        version: note.version + 1,
      };

      await FirestoreService.updateCollaborativeNote(couple.id, noteId, updates);
      
      // Mettre à jour l'état local
      setNote(prev => ({
        ...prev,
        ...updates,
        updatedAt: new Date() as any,
      }));
      
      setHasChanges(false);
    } catch (error: any) {
      console.error('Auto-save error:', error);
      setError('Erreur lors de la sauvegarde automatique');
    } finally {
      setIsSaving(false);
    }
  }, [hasChanges, couple, user, noteId, title, content, note.version]);

  // Auto-sauvegarde après 2 secondes d'inactivité
  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(autoSave, 2000);
    return () => clearTimeout(timer);
  }, [hasChanges, autoSave]);

  const handleSave = async () => {
    if (!couple || !user) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    // Validation
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (trimmedTitle.length < 1) {
      Alert.alert('Erreur', 'Le titre ne peut pas être vide');
      return;
    }

    if (trimmedTitle.length > 100) {
      Alert.alert('Erreur', 'Le titre ne peut pas dépasser 100 caractères');
      return;
    }

    if (trimmedContent.length > 10000) {
      Alert.alert('Erreur', 'Le contenu ne peut pas dépasser 10 000 caractères');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const updates = {
        title: trimmedTitle,
        content: trimmedContent,
        lastEditedBy: user.uid,
        version: note.version + 1,
      };

      await FirestoreService.updateCollaborativeNote(couple.id, noteId, updates);
      
      setNote(prev => ({
        ...prev,
        ...updates,
        updatedAt: new Date() as any,
      }));
      
      setHasChanges(false);
      Alert.alert('Succès', 'Note sauvegardée !');
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer la note',
      'Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (!couple) return;
            
            try {
              setIsLoading(true);
              await FirestoreService.deleteCollaborativeNote(couple.id, noteId);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Erreur lors de la suppression');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>📝 Éditeur de note</Text>
            <Text style={styles.headerSubtitle}>
              Version {note.version} • Modifiée le {formatDate(note.updatedAt)}
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            {isSaving && (
              <View style={styles.savingIndicator}>
                <ActivityIndicator size="small" color={colors.textOnPrimary} />
              </View>
            )}
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={!hasChanges || isSaving}
            >
              <Ionicons 
                name="checkmark" 
                size={24} 
                color={hasChanges ? colors.textOnPrimary : colors.textOnPrimary + '40'} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={24} color={colors.textOnPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.editorContainer}>
            <TextInput
              style={styles.titleInput}
              placeholder="Titre de la note..."
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={colors.textSecondary}
              maxLength={100}
            />
            
            <TextInput
              style={styles.contentInput}
              placeholder="Contenu de la note..."
              value={content}
              onChangeText={setContent}
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
              maxLength={10000}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textOnPrimary,
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savingIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  editorContainer: {
    padding: 20,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    minHeight: 60,
  },
  contentInput: {
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 400,
    lineHeight: 24,
  },
});
