import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../../../constants/colors';
import { Header } from '../../../components/common/Header';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { useMilestones } from '../../../hooks/useMilestones';
import { useAuth } from '../../../hooks/useAuth';
import { MilestoneService } from '../../../services/couple/milestone.service';
import { MilestoneType } from '../../../types';
import { Ionicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';

interface AddMilestoneScreenProps {
  navigation: any;
}

export const AddMilestoneScreen: React.FC<AddMilestoneScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { createMilestone, milestones } = useMilestones();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<MilestoneType>('custom');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [reminderDays, setReminderDays] = useState(7);
  const [isLoading, setIsLoading] = useState(false);

  const milestoneTypes: { type: MilestoneType; info: any }[] = [
    { type: 'first_meeting', info: MilestoneService.getMilestoneTypeInfo('first_meeting') },
    { type: 'official_relationship', info: MilestoneService.getMilestoneTypeInfo('official_relationship') },
    { type: 'engagement', info: MilestoneService.getMilestoneTypeInfo('engagement') },
    { type: 'civil_wedding', info: MilestoneService.getMilestoneTypeInfo('civil_wedding') },
    { type: 'religious_wedding', info: MilestoneService.getMilestoneTypeInfo('religious_wedding') },
    { type: 'traditional_wedding', info: MilestoneService.getMilestoneTypeInfo('traditional_wedding') },
    { type: 'child_birth', info: MilestoneService.getMilestoneTypeInfo('child_birth') },
    { type: 'custom', info: MilestoneService.getMilestoneTypeInfo('custom') },
  ];

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTypeSelect = (type: MilestoneType) => {
    // Vérifier si ce type de milestone existe déjà
    const existingMilestone = milestones.find(m => m.type === type);
    if (existingMilestone) {
      Alert.alert(
        'Date déjà créée',
        `Une date marquante de type "${MilestoneService.getMilestoneTypeInfo(type).title}" existe déjà.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Voir la date existante', onPress: () => navigation.navigate('EditMilestone', { milestoneId: existingMilestone.id }) }
        ]
      );
      return;
    }

    setSelectedType(type);
    const typeInfo = MilestoneService.getMilestoneTypeInfo(type);
    if (type !== 'custom' && !title) {
      setTitle(typeInfo.title);
      setDescription(typeInfo.description);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un titre pour la date marquante');
      return;
    }

    if (selectedDate > new Date()) {
      Alert.alert('Erreur', 'La date ne peut pas être dans le futur');
      return;
    }

    try {
      setIsLoading(true);
      const typeInfo = MilestoneService.getMilestoneTypeInfo(selectedType);
      
      const milestone = {
        title: title.trim(),
        description: description.trim() || undefined,
        date: Timestamp.fromDate(selectedDate),
        type: selectedType,
        isRecurring,
        notifications,
        reminderDays,
        color: typeInfo.color,
        icon: typeInfo.icon,
        createdBy: user?.uid || '',
        coupleId: '', // Sera ajouté par le service
      };

      await createMilestone(milestone);
      Alert.alert(
        'Succès',
        'Date marquante ajoutée avec succès !',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error creating milestone:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'ajouter la date marquante');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTypePicker = () => {
    const selectedTypeInfo = MilestoneService.getMilestoneTypeInfo(selectedType);
    const existingMilestone = milestones.find(m => m.type === selectedType);
    const isDisabled = existingMilestone !== undefined;

    return (
      <Modal
        visible={showTypePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir le type de date</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.typeList}>
              {milestoneTypes.map(({ type, info }) => {
                const existing = milestones.find(m => m.type === type);
                const isTypeDisabled = existing !== undefined;
                
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typePickerOption,
                      selectedType === type && styles.typePickerOptionSelected,
                      isTypeDisabled && styles.typePickerOptionDisabled,
                    ]}
                    onPress={() => {
                      if (!isTypeDisabled) {
                        handleTypeSelect(type);
                        setShowTypePicker(false);
                      }
                    }}
                    disabled={isTypeDisabled}
                  >
                    <View style={[styles.typePickerIcon, { backgroundColor: info.color + '20' }]}>
                      <Ionicons name={info.icon as any} size={20} color={info.color} />
                    </View>
                    <View style={styles.typePickerInfo}>
                      <Text style={styles.typePickerTitle}>{info.title}</Text>
                      <Text style={styles.typePickerDescription}>{info.description}</Text>
                    </View>
                    {selectedType === type && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                    {isTypeDisabled && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderReminderOptions = () => (
    <View style={styles.reminderSection}>
      <Text style={styles.sectionTitle}>Rappels</Text>
      <View style={styles.reminderOptions}>
        {[1, 3, 7, 14, 30].map((days) => (
          <TouchableOpacity
            key={days}
            style={[
              styles.reminderOption,
              reminderDays === days && styles.reminderOptionSelected
            ]}
            onPress={() => setReminderDays(days)}
          >
            <Text style={[
              styles.reminderOptionText,
              reminderDays === days && styles.reminderOptionTextSelected
            ]}>
              {days} jour{days > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Ajouter une date"
        icon="add-circle"
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Type de date marquante */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de date</Text>
          <Text style={styles.sectionSubtitle}>
            Choisissez le type de date marquante ou créez une date personnalisée
          </Text>
          <TouchableOpacity
            style={styles.typeSelector}
            onPress={() => setShowTypePicker(true)}
          >
            <View style={styles.typeSelectorContent}>
              <View style={[styles.typeSelectorIcon, { backgroundColor: MilestoneService.getMilestoneTypeInfo(selectedType).color + '20' }]}>
                <Ionicons name={MilestoneService.getMilestoneTypeInfo(selectedType).icon as any} size={20} color={MilestoneService.getMilestoneTypeInfo(selectedType).color} />
              </View>
              <View style={styles.typeSelectorInfo}>
                <Text style={styles.typeSelectorTitle}>{MilestoneService.getMilestoneTypeInfo(selectedType).title}</Text>
                <Text style={styles.typeSelectorDescription}>{MilestoneService.getMilestoneTypeInfo(selectedType).description}</Text>
              </View>
            </View>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Informations de base */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          
          <Input
            label="Titre"
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Notre premier rendez-vous"
            style={styles.input}
          />
          
          <Input
            label="Description (optionnel)"
            value={description}
            onChangeText={setDescription}
            placeholder="Ajoutez des détails sur cette date importante..."
            multiline
            numberOfLines={3}
            style={styles.input}
          />
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.dateInfo}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.dateText}>
                {selectedDate.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>
          
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setIsRecurring(!isRecurring)}
          >
            <View style={styles.optionInfo}>
              <Ionicons name="refresh" size={20} color={colors.primary} />
              <Text style={styles.optionTitle}>Répéter chaque année</Text>
            </View>
            <View style={[styles.checkbox, isRecurring && styles.checkboxChecked]}>
              {isRecurring && <Ionicons name="checkmark" size={16} color={colors.textOnPrimary} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setNotifications(!notifications)}
          >
            <View style={styles.optionInfo}>
              <Ionicons name="notifications" size={20} color={colors.primary} />
              <Text style={styles.optionTitle}>Activer les notifications</Text>
            </View>
            <View style={[styles.checkbox, notifications && styles.checkboxChecked]}>
              {notifications && <Ionicons name="checkmark" size={16} color={colors.textOnPrimary} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Rappels */}
        {notifications && renderReminderOptions()}
      </ScrollView>

      {/* Bouton de sauvegarde */}
      <View style={styles.footer}>
        <Button
          title={isLoading ? "Ajout en cours..." : "Ajouter la date"}
          onPress={handleSave}
          variant="primary"
          style={styles.saveButton}
          disabled={isLoading}
        />
      </View>

              {/* Sélecteur de date */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Sélecteur de type */}
        {renderTypePicker()}
      </SafeAreaView>
    );
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    ...colors.shadow,
  },
  typeOptionSelected: {
    borderWidth: 2,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  typeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    ...colors.shadow,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  reminderSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  reminderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reminderOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  reminderOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  reminderOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  reminderOptionTextSelected: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  saveButton: {
    width: '100%',
  },
  typeOptionDisabled: {
    opacity: 0.6,
    backgroundColor: colors.background,
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
  },
  disabledText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    ...colors.shadow,
  },
  typeSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeSelectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeSelectorInfo: {
    flex: 1,
  },
  typeSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  typeSelectorDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  typeList: {
    maxHeight: 400,
  },
  typePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  typePickerOptionSelected: {
    backgroundColor: colors.primary + '10',
  },
  typePickerOptionDisabled: {
    opacity: 0.6,
    backgroundColor: colors.background,
  },
  typePickerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typePickerInfo: {
    flex: 1,
  },
  typePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  typePickerDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
