import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { colors, shadowStyles } from '../../constants/colors';

interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectReaction: (emoji: string) => void;
}

const REACTIONS = [
  '❤️', '😍', '😂', '😮', '😢', '😡', '👍', '👎', '👏', '🙏',
  '🔥', '💯', '💪', '🎉', '🎊', '🎯', '💎', '⭐', '🌟', '✨',
  '💖', '💕', '💗', '💓', '💝', '💘', '💞', '💟', '💌', '💋',
  '😊', '😄', '😃', '😀', '😁', '😆', '😅', '🤣', '😋', '😎',
  '😴', '😪', '😵', '🤯', '😱', '😨', '😰', '😥', '😓', '😭',
  '😤', '😠', '😡', '🤬', '😈', '👿', '💀', '☠️', '👻', '👽',
  '🤖', '👾', '👹', '👺', '🤡', '💩', '🤠', '👨‍🌾', '👩‍🌾', '👨‍⚕️',
];

const { width } = Dimensions.get('window');

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  visible,
  onClose,
  onSelectReaction,
}) => {
  const handleSelectReaction = (emoji: string) => {
    onSelectReaction(emoji);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <View style={styles.picker}>
            <View style={styles.header}>
              <Text style={styles.title}>Réactions</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.reactionsContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.reactionsGrid}>
                {REACTIONS.map((emoji, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.reactionButton}
                    onPress={() => handleSelectReaction(emoji)}
                  >
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  picker: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    maxHeight: 400,
    ...shadowStyles,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: 'bold',
  },
  reactionsContainer: {
    padding: 15,
  },
  reactionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  reactionButton: {
    width: (width - 70) / 8,
    height: (width - 70) / 8,
    borderRadius: (width - 70) / 16,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  reactionEmoji: {
    fontSize: 20,
  },
});
