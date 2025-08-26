import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface MediaMessageProps {
  mediaUrl: string;
  type: 'image' | 'video' | 'audio' | 'document';
  fileName?: string;
  fileSize?: number;
  voiceDuration?: number;
  isOwnMessage: boolean;
}

const { width } = Dimensions.get('window');

export const MediaMessage: React.FC<MediaMessageProps> = ({
  mediaUrl,
  type,
  fileName,
  fileSize,
  voiceDuration,
  isOwnMessage,
}) => {
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMediaPress = () => {
    switch (type) {
      case 'image':
        setImageModalVisible(true);
        break;
      case 'video':
      case 'audio':
      case 'document':
        // Fonctionnalités à implémenter ultérieurement
        break;
    }
  };

  const renderMediaContent = () => {
    switch (type) {
      case 'image':
        return (
          <TouchableOpacity onPress={handleMediaPress} style={styles.imageContainer}>
            <Image source={{ uri: mediaUrl }} style={styles.image} resizeMode="cover" />
            <View style={styles.imageOverlay}>
              <Ionicons name="expand" size={24} color={colors.textOnPrimary} />
            </View>
          </TouchableOpacity>
        );

      case 'video':
        return (
          <TouchableOpacity style={[styles.videoContainer, { opacity: 0.5 }]}>
            <Image source={{ uri: mediaUrl }} style={styles.videoThumbnail} resizeMode="cover" />
            <View style={styles.videoOverlay}>
              <Ionicons name="play-circle" size={48} color={colors.textOnPrimary} />
            </View>
          </TouchableOpacity>
        );

      case 'audio':
        return (
          <TouchableOpacity style={[styles.audioContainer, { opacity: 0.5 }]}>
            <View style={styles.audioContent}>
              <Ionicons name="musical-notes" size={24} color={colors.primary} />
              <View style={styles.audioInfo}>
                <Text style={styles.audioText}>Message vocal (à venir)</Text>
                {voiceDuration && (
                  <Text style={styles.audioDuration}>{formatDuration(voiceDuration)}</Text>
                )}
              </View>
              <Ionicons name="play" size={24} color={colors.primary} />
            </View>
          </TouchableOpacity>
        );

      case 'document':
        return (
          <TouchableOpacity style={[styles.documentContainer, { opacity: 0.5 }]}>
            <View style={styles.documentContent}>
              <Ionicons name="document" size={32} color={colors.primary} />
              <View style={styles.documentInfo}>
                <Text style={styles.documentName} numberOfLines={1}>
                  {fileName || 'Document (à venir)'}
                </Text>
                {fileSize && (
                  <Text style={styles.documentSize}>{formatFileSize(fileSize)}</Text>
                )}
              </View>
              <Ionicons name="download" size={24} color={colors.primary} />
            </View>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderMediaContent()}
      
      {/* Modal pour les images */}
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close" size={30} color={colors.textOnPrimary} />
          </TouchableOpacity>
          <Image
            source={{ uri: mediaUrl }}
            style={styles.imageModalImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: width * 0.6,
    height: 200,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 4,
  },
  videoContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: width * 0.6,
    height: 200,
    borderRadius: 12,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioContainer: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    padding: 12,
    minWidth: 200,
  },
  audioContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  audioInfo: {
    flex: 1,
  },
  audioText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  audioDuration: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  documentContainer: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    padding: 12,
    minWidth: 200,
  },
  documentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  documentSize: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  imageModalImage: {
    width: width,
    height: width,
  },
});
