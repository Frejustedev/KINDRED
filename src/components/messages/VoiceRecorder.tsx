import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onCancel,
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        const permission = await requestPermission();
        if (permission.status !== 'granted') {
          Alert.alert('Permission refusée', 'Permission d\'enregistrement requise');
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setDuration(0);
      startPulseAnimation();

      // Mettre à jour la durée toutes les secondes
      const interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Stocker l'interval pour le nettoyer plus tard
      (recording as any).interval = interval;

    } catch (err) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', err);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      stopPulseAnimation();

      // Arrêter l'interval de durée
      if ((recording as any).interval) {
        clearInterval((recording as any).interval);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        // Vérifier la taille du fichier
        const fileInfo = await FileSystem.getInfoAsync(uri);
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (fileInfo.exists && 'size' in fileInfo && fileInfo.size && fileInfo.size > maxSize) {
          Alert.alert('Fichier trop volumineux', 'Le message vocal est trop long');
          return;
        }

        onRecordingComplete(uri, duration);
      }

      setRecording(null);
      setDuration(0);

    } catch (err) {
      console.error('Erreur lors de l\'arrêt de l\'enregistrement:', err);
      Alert.alert('Erreur', 'Impossible d\'arrêter l\'enregistrement');
    }
  };

  const cancelRecording = async () => {
    if (recording) {
      try {
        setIsRecording(false);
        stopPulseAnimation();

        if ((recording as any).interval) {
          clearInterval((recording as any).interval);
        }

        await recording.stopAndUnloadAsync();
        setRecording(null);
        setDuration(0);
      } catch (err) {
        console.error('Erreur lors de l\'annulation:', err);
      }
    }
    onCancel();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Enregistrement vocal</Text>
        <TouchableOpacity onPress={cancelRecording} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.recordButton,
            isRecording && { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <Ionicons
            name={isRecording ? "radio-button-on" : "mic"}
            size={32}
            color={isRecording ? colors.error : colors.primary}
          />
        </Animated.View>

        <Text style={styles.duration}>{formatDuration(duration)}</Text>

        <View style={styles.controls}>
          {!isRecording ? (
            <TouchableOpacity onPress={startRecording} style={styles.startButton}>
              <Text style={styles.startButtonText}>Commencer</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={stopRecording} style={styles.stopButton}>
              <Text style={styles.stopButtonText}>Arrêter</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.hint}>
          {isRecording 
            ? 'Enregistrement en cours... Appuyez sur "Arrêter" pour terminer'
            : 'Appuyez sur "Commencer" pour enregistrer votre message vocal'
          }
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    margin: 20,
    ...colors.shadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  cancelButton: {
    padding: 4,
  },
  content: {
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  duration: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  controls: {
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  startButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  stopButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
