import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
// import * as Location from 'expo-location'; // À implémenter ultérieurement
// import { MapView, Marker } from 'expo-maps'; // À implémenter ultérieurement

interface LocationMessageProps {
  latitude: number;
  longitude: number;
  address?: string;
  isOwnMessage: boolean;
}

const { width } = Dimensions.get('window');

export const LocationMessage: React.FC<LocationMessageProps> = ({
  latitude,
  longitude,
  address,
  isOwnMessage,
}) => {
  const [mapModalVisible, setMapModalVisible] = useState(false);

  const handleLocationPress = () => {
    setMapModalVisible(true);
  };

  const handleShareLocation = async () => {
    // Fonctionnalité à implémenter ultérieurement
  };

  const openInMaps = () => {
    // Fonctionnalité à implémenter ultérieurement
  };

  const getDirections = () => {
    // Fonctionnalité à implémenter ultérieurement
  };

  return (
    <>
      <TouchableOpacity onPress={handleLocationPress} style={styles.container}>
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Ionicons name="location" size={24} color={colors.primary} />
            <Text style={styles.locationTitle}>Localisation</Text>
          </View>
          
          <View style={styles.locationInfo}>
            <Text style={styles.coordinates}>
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
            {address && (
              <Text style={styles.address} numberOfLines={2}>
                {address}
              </Text>
            )}
          </View>

          <View style={styles.locationActions}>
            <TouchableOpacity style={[styles.actionButton, { opacity: 0.5 }]} onPress={() => {}}>
              <Ionicons name="map" size={16} color={colors.primary} />
              <Text style={styles.actionText}>Carte (à venir)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, { opacity: 0.5 }]} onPress={() => {}}>
              <Ionicons name="navigate" size={16} color={colors.primary} />
              <Text style={styles.actionText}>Itinéraire (à venir)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Modal avec la carte */}
      <Modal
        visible={mapModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMapModalVisible(false)}
      >
        <View style={styles.mapModalOverlay}>
          <View style={styles.mapModalHeader}>
            <Text style={styles.mapModalTitle}>Localisation</Text>
            <TouchableOpacity
              onPress={() => setMapModalVisible(false)}
              style={styles.mapModalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.textOnPrimary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.mapContainer}>
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map" size={64} color={colors.textSecondary} />
              <Text style={styles.mapPlaceholderText}>Carte</Text>
              <Text style={styles.mapPlaceholderSubtext}>
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </Text>
            </View>
          </View>

          <View style={styles.mapModalActions}>
            <TouchableOpacity style={[styles.mapActionButton, { opacity: 0.5 }]} onPress={() => {}}>
              <Ionicons name="open-outline" size={20} color={colors.primary} />
              <Text style={styles.mapActionText}>Ouvrir dans Maps (à venir)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.mapActionButton, { opacity: 0.5 }]} onPress={() => {}}>
              <Ionicons name="navigate-outline" size={20} color={colors.primary} />
              <Text style={styles.mapActionText}>Itinéraire (à venir)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: width * 0.7,
  },
  locationCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  locationInfo: {
    marginBottom: 12,
  },
  coordinates: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  address: {
    fontSize: 13,
    color: colors.text,
    marginTop: 4,
  },
  locationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.surface,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  mapModalOverlay: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  mapModalCloseButton: {
    padding: 4,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginTop: 12,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  mapModalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: colors.surface,
  },
  mapActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
  },
  mapActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
