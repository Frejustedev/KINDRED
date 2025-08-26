import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { colors } from '../../../constants/colors';
import { Header } from '../../../components/common/Header';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { useAuth } from '../../../hooks/useAuth';
import { useCouple } from '../../../hooks/useCouple';
import { FirestoreService } from '../../../services/firebase/firestore.service';
import { RecurringEventService } from '../../../services/agenda/recurring.service';
import { AgendaEvent, ViewMode, MarkedDate, EventType, RecurringType } from '../../../types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface AgendaScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

export const AgendaScreen: React.FC<AgendaScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  
  // État principal
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState<{[key: string]: MarkedDate}>({});
  
  // État pour l'ajout/édition d'événements
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(),
    allDay: false,
    location: '',
    type: 'general' as EventType,
    color: colors.primary,
    recurring: null as any,
  });
  
  // État pour les sélecteurs
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showRecurringPicker, setShowRecurringPicker] = useState(false);

  // Charger les événements
  useEffect(() => {
    if (couple) {
      loadEvents();
    }
  }, [couple, selectedDate, viewMode]);

  const loadEvents = async () => {
    if (!couple) return;

    try {
      setIsLoading(true);
      const date = new Date(selectedDate);
      let events: AgendaEvent[] = [];

      switch (viewMode) {
        case 'day':
          events = await FirestoreService.getDayEvents(couple.id, date);
          break;
        case 'week':
          events = await FirestoreService.getWeekEvents(couple.id, date);
          break;
        case 'month':
        case 'agenda':
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          events = await FirestoreService.getMonthEvents(couple.id, year, month);
          break;
      }

      setEvents(events);
      generateMarkedDates(events);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Erreur', 'Impossible de charger les événements');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMarkedDates = useCallback((events: AgendaEvent[]) => {
    const marked: {[key: string]: MarkedDate} = {};

    events.forEach(event => {
      const startDate = event.startDate.toDate();
      const endDate = event.endDate?.toDate();

      if (event.isMultiDay && endDate) {
        // Événement multi-jours
        const days = RecurringEventService.generateMultiDayDates(startDate, endDate);
        days.forEach((day, index) => {
          const dateString = day.toISOString().split('T')[0];
          const isFirst = index === 0;
          const isLast = index === days.length - 1;
          
          marked[dateString] = {
            ...marked[dateString],
            marked: true,
            dotColor: event.color || colors.primary,
            selectedColor: event.color || colors.primary,
            // startingDay: isFirst, // Propriété non supportée
            // endingDay: isLast, // Propriété non supportée
            // color: event.color || colors.primary, // Propriété non supportée
            textColor: 'white',
          };
        });
      } else {
        // Événement d'une journée
        const dateString = startDate.toISOString().split('T')[0];
        marked[dateString] = {
          ...marked[dateString],
          marked: true,
          dotColor: event.color || colors.primary,
          events: [...(marked[dateString]?.events || []), event],
        };
      }
    });

    // Marquer le jour sélectionné
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: colors.primary,
    };

    setMarkedDates(marked);
  }, [selectedDate]);

  const handleAddEvent = async () => {
    if (!couple || !user) {
      Alert.alert('Erreur', 'Vous devez être connecté et faire partie d\'un couple');
      return;
    }

    if (!newEvent.title.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un titre');
      return;
    }

    try {
      const eventData = {
        title: newEvent.title.trim(),
        description: newEvent.description.trim(),
        startDate: newEvent.startDate as any,
        endDate: newEvent.endDate as any,
        allDay: newEvent.allDay,
        location: newEvent.location.trim(),
        type: newEvent.type,
        color: newEvent.color,
        recurring: newEvent.recurring,
        createdBy: user.uid,
      };

      if (editingEvent) {
        await FirestoreService.updateAgendaEvent(couple.id, editingEvent.id, eventData);
        Alert.alert('Succès', 'Événement modifié avec succès');
      } else {
        await FirestoreService.createAgendaEvent(couple.id, eventData);
        Alert.alert('Succès', 'Événement ajouté avec succès');
      }

      resetForm();
      setShowAddModal(false);
      await loadEvents();
    } catch (error: any) {
      console.error('Error saving event:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEditEvent = (event: AgendaEvent) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description || '',
      startDate: event.startDate.toDate(),
      endDate: event.endDate?.toDate() || new Date(),
      allDay: event.allDay,
      location: event.location || '',
      type: event.type,
      color: event.color || colors.primary,
      recurring: event.recurring,
    });
    setShowAddModal(true);
  };

  const handleDeleteEvent = async (event: AgendaEvent) => {
    if (!couple) return;

    const isRecurring = event.recurring && !event.recurrenceId;
    const isRecurrenceInstance = !!event.recurrenceId;

    if (isRecurring) {
      Alert.alert(
        'Supprimer événement récurrent',
        'Voulez-vous supprimer toutes les occurrences ou seulement celle-ci ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Seulement celle-ci',
            onPress: () => deleteRecurrenceInstance(event),
          },
          {
            text: 'Toutes les occurrences',
            style: 'destructive',
            onPress: () => deleteEvent(event.id),
          },
        ]
      );
    } else {
      Alert.alert(
        'Supprimer l\'événement',
        'Êtes-vous sûr de vouloir supprimer cet événement ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => isRecurrenceInstance ? deleteRecurrenceInstance(event) : deleteEvent(event.id),
          },
        ]
      );
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!couple) return;
    
    try {
      await FirestoreService.deleteAgendaEvent(couple.id, eventId);
      await loadEvents();
      Alert.alert('Succès', 'Événement supprimé');
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Erreur', 'Impossible de supprimer l\'événement');
    }
  };

  const deleteRecurrenceInstance = async (event: AgendaEvent) => {
    if (!couple) return;
    
    try {
      const baseEventId = event.recurrenceId || event.id;
      const occurrenceDate = event.startDate.toDate();
      await FirestoreService.deleteRecurringEventOccurrence(couple.id, baseEventId, occurrenceDate);
      await loadEvents();
      Alert.alert('Succès', 'Occurrence supprimée');
    } catch (error) {
      console.error('Error deleting occurrence:', error);
      Alert.alert('Erreur', 'Impossible de supprimer l\'occurrence');
    }
  };

  const resetForm = () => {
    setNewEvent({
      title: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(),
      allDay: false,
      location: '',
      type: 'general',
      color: colors.primary,
      recurring: null,
    });
    setEditingEvent(null);
  };

  const getEventIcon = (type: EventType) => {
    const icons = {
      general: '📅',
      date: '💕',
      anniversary: '🎉',
      birthday: '🎂',
      travel: '✈️',
      work: '💼',
      medical: '🏥',
      personal: '👤',
      important: '⭐',
    };
    return icons[type] || '📅';
  };

  const getEventColor = (type: EventType) => {
    const colorMap = {
      general: colors.primary,
      date: '#FF6B6B',
      anniversary: '#4ECDC4',
      birthday: '#45B7D1',
      travel: '#96CEB4',
      work: '#FFEAA7',
      medical: '#DDA0DD',
      personal: '#98D8C8',
      important: '#F7DC6F',
    };
    return colorMap[type] || colors.primary;
  };

  const formatEventTime = (event: AgendaEvent) => {
    if (event.allDay) {
      return 'Toute la journée';
    }

    const start = event.startDate.toDate();
    const end = event.endDate?.toDate();

    if (end && !RecurringEventService.isMultiDayEvent(start, end)) {
      return `${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderEvent = (event: AgendaEvent) => (
    <TouchableOpacity
      key={event.id}
      style={[styles.eventCard, { borderLeftColor: event.color || getEventColor(event.type) }]}
      onPress={() => handleEditEvent(event)}
    >
      <View style={styles.eventHeader}>
        <View style={styles.eventIcon}>
          <Text style={styles.eventIconText}>{getEventIcon(event.type)}</Text>
        </View>
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventTime}>{formatEventTime(event)}</Text>
          {event.description && (
            <Text style={styles.eventDescription} numberOfLines={2}>
              {event.description}
            </Text>
          )}
          {event.location && (
            <Text style={styles.eventLocation}>📍 {event.location}</Text>
          )}
          {event.recurring && (
            <Text style={styles.eventRecurring}>
              🔄 {RecurringEventService.formatRecurrenceDescription(event.recurring)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteEvent(event)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderViewModeSelector = () => (
    <View style={styles.viewModeSelector}>
      {(['day', 'week', 'month', 'agenda'] as ViewMode[]).map((mode) => (
        <TouchableOpacity
          key={mode}
          style={[
            styles.viewModeButton,
            viewMode === mode && styles.viewModeButtonActive
          ]}
          onPress={() => setViewMode(mode)}
        >
          <Text style={[
            styles.viewModeButtonText,
            viewMode === mode && styles.viewModeButtonTextActive
          ]}>
            {mode === 'day' ? 'Jour' : mode === 'week' ? 'Semaine' : mode === 'month' ? 'Mois' : 'Agenda'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCalendarView = () => {
    if (viewMode === 'agenda') {
      // Vue Agenda simplifiée - liste chronologique des événements
      const sortedEvents = [...events].sort((a, b) => 
        a.startDate.toDate().getTime() - b.startDate.toDate().getTime()
      );

      return (
        <View style={styles.agendaContainer}>
          <Text style={styles.agendaTitle}>Vue Agenda</Text>
          <ScrollView style={styles.agendaList}>
            {sortedEvents.length > 0 ? (
              sortedEvents.map(renderEvent)
            ) : (
              <View style={styles.emptyAgenda}>
                <Text style={styles.emptyAgendaText}>Aucun événement programmé</Text>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    return (
      <View>
        <Calendar
          current={selectedDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          markingType="multi-dot"
          theme={{
            calendarBackground: colors.surface,
            textSectionTitleColor: colors.text,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.textOnPrimary,
            todayTextColor: colors.primary,
            dayTextColor: colors.text,
            textDisabledColor: colors.textLight,
            dotColor: colors.primary,
            selectedDotColor: colors.textOnPrimary,
            arrowColor: colors.primary,
            monthTextColor: colors.text,
          }}
        />
        
        {/* Liste des événements du jour sélectionné */}
        <View style={styles.dayEvents}>
          <Text style={styles.dayEventsTitle}>
            Événements du {new Date(selectedDate).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </Text>
          <ScrollView style={styles.dayEventsList}>
            {events
              .filter(event => {
                const eventDate = event.startDate.toDate().toISOString().split('T')[0];
                return eventDate === selectedDate || 
                  (event.isMultiDay && event.endDate && 
                   eventDate <= selectedDate && 
                   event.endDate.toDate().toISOString().split('T')[0] >= selectedDate);
              })
              .map(renderEvent)}
            
            {events.filter(event => {
              const eventDate = event.startDate.toDate().toISOString().split('T')[0];
              return eventDate === selectedDate || 
                (event.isMultiDay && event.endDate && 
                 eventDate <= selectedDate && 
                 event.endDate.toDate().toISOString().split('T')[0] >= selectedDate);
            }).length === 0 && (
              <View style={styles.emptyDay}>
                <Text style={styles.emptyDayText}>Aucun événement ce jour</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Agenda"
        icon="calendar"
        subtitle="Gérez vos événements"
        rightAction={{
          icon: "add",
          onPress: () => {
            resetForm();
            setShowAddModal(true);
          }
        }}
      />

      {/* Sélecteur de vue */}
      {renderViewModeSelector()}

      {/* Vue calendrier */}
      <View style={styles.calendarContainer}>
        {renderCalendarView()}
      </View>

      {/* Modal d'ajout/édition d'événement */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingEvent ? 'Modifier l\'événement' : 'Ajouter un événement'}
              </Text>
              
              <Input
                label="Titre *"
                placeholder="Titre de l'événement"
                value={newEvent.title}
                onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
              />

              <Input
                label="Description"
                placeholder="Description (optionnel)"
                value={newEvent.description}
                onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
                multiline
                numberOfLines={3}
              />

              <Input
                label="Lieu"
                placeholder="Lieu (optionnel)"
                value={newEvent.location}
                onChangeText={(text) => setNewEvent({ ...newEvent, location: text })}
              />

              {/* Switch Toute la journée */}
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Toute la journée</Text>
                <TouchableOpacity
                  style={[styles.switch, newEvent.allDay && styles.switchActive]}
                  onPress={() => setNewEvent({ ...newEvent, allDay: !newEvent.allDay })}
                >
                  <View style={[styles.switchThumb, newEvent.allDay && styles.switchThumbActive]} />
                </TouchableOpacity>
              </View>

              {/* Date de début */}
              <View style={styles.dateTimeContainer}>
                <Text style={styles.dateTimeLabel}>Date de début</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    📅 {newEvent.startDate.toLocaleDateString('fr-FR')}
                  </Text>
                </TouchableOpacity>
                
                {!newEvent.allDay && (
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Text style={styles.dateTimeText}>
                      🕐 {newEvent.startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Date de fin */}
              <View style={styles.dateTimeContainer}>
                <Text style={styles.dateTimeLabel}>Date de fin</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    📅 {newEvent.endDate.toLocaleDateString('fr-FR')}
                  </Text>
                </TouchableOpacity>
                
                {!newEvent.allDay && (
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Text style={styles.dateTimeText}>
                      🕐 {newEvent.endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Type d'événement */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Type d'événement</Text>
                <TouchableOpacity
                  style={styles.typeSelector}
                  onPress={() => setShowTypePicker(true)}
                >
                  <Text style={styles.typeSelectorText}>
                    {getEventIcon(newEvent.type)} {newEvent.type}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Récurrence */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Récurrence</Text>
                <TouchableOpacity
                  style={styles.typeSelector}
                  onPress={() => setShowRecurringPicker(true)}
                >
                  <Text style={styles.typeSelectorText}>
                    {newEvent.recurring 
                      ? RecurringEventService.formatRecurrenceDescription(newEvent.recurring)
                      : 'Aucune récurrence'
                    }
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <Button
                  title="Annuler"
                  onPress={() => setShowAddModal(false)}
                  variant="outline"
                  style={styles.modalButton}
                />
                <Button
                  title={editingEvent ? 'Modifier' : 'Ajouter'}
                  onPress={handleAddEvent}
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={newEvent.startDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartDatePicker(false);
            if (date) {
              setNewEvent({ ...newEvent, startDate: date });
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={newEvent.endDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndDatePicker(false);
            if (date) {
              setNewEvent({ ...newEvent, endDate: date });
            }
          }}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={newEvent.startDate}
          mode="time"
          display="default"
          onChange={(event, date) => {
            setShowStartTimePicker(false);
            if (date) {
              setNewEvent({ ...newEvent, startDate: date });
            }
          }}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={newEvent.endDate}
          mode="time"
          display="default"
          onChange={(event, date) => {
            setShowEndTimePicker(false);
            if (date) {
              setNewEvent({ ...newEvent, endDate: date });
            }
          }}
        />
      )}

      {/* Modal sélecteur de type */}
      <Modal
        visible={showTypePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTypePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Type d'événement</Text>
            
            <View style={styles.typeOptions}>
              {([
                { type: 'general', label: 'Général', icon: '📅' },
                { type: 'date', label: 'Rendez-vous amoureux', icon: '💕' },
                { type: 'anniversary', label: 'Anniversaire de couple', icon: '🎉' },
                { type: 'birthday', label: 'Anniversaire', icon: '🎂' },
                { type: 'travel', label: 'Voyage', icon: '✈️' },
                { type: 'work', label: 'Travail', icon: '💼' },
                { type: 'medical', label: 'Médical', icon: '🏥' },
                { type: 'personal', label: 'Personnel', icon: '👤' },
                { type: 'important', label: 'Important', icon: '⭐' },
              ] as const).map((option) => (
                <TouchableOpacity
                  key={option.type}
                  style={[
                    styles.typeOption,
                    newEvent.type === option.type && styles.typeOptionSelected
                  ]}
                  onPress={() => {
                    setNewEvent({ 
                      ...newEvent, 
                      type: option.type,
                      color: getEventColor(option.type)
                    });
                    setShowTypePicker(false);
                  }}
                >
                  <Text style={styles.typeOptionIcon}>{option.icon}</Text>
                  <Text style={styles.typeOptionLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Annuler"
              onPress={() => setShowTypePicker(false)}
              variant="outline"
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal sélecteur de récurrence */}
      <Modal
        visible={showRecurringPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRecurringPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Récurrence</Text>
            
            <View style={styles.typeOptions}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  !newEvent.recurring && styles.typeOptionSelected
                ]}
                onPress={() => {
                  setNewEvent({ ...newEvent, recurring: null });
                  setShowRecurringPicker(false);
                }}
              >
                <Text style={styles.typeOptionIcon}>📅</Text>
                <Text style={styles.typeOptionLabel}>Aucune récurrence</Text>
              </TouchableOpacity>

              {([
                { type: 'daily', label: 'Quotidienne', icon: '🔄' },
                { type: 'weekly', label: 'Hebdomadaire', icon: '📅' },
                { type: 'monthly', label: 'Mensuelle', icon: '🗓️' },
                { type: 'yearly', label: 'Annuelle', icon: '📆' },
              ] as const).map((option) => (
                <TouchableOpacity
                  key={option.type}
                  style={[
                    styles.typeOption,
                    newEvent.recurring?.type === option.type && styles.typeOptionSelected
                  ]}
                  onPress={() => {
                    const recurringConfig = RecurringEventService.createDefaultConfig(option.type);
                    setNewEvent({ ...newEvent, recurring: recurringConfig });
                    setShowRecurringPicker(false);
                  }}
                >
                  <Text style={styles.typeOptionIcon}>{option.icon}</Text>
                  <Text style={styles.typeOptionLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Annuler"
              onPress={() => setShowRecurringPicker(false)}
              variant="outline"
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textOnPrimary,
    opacity: 0.8,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: colors.textOnPrimary,
    fontWeight: 'bold',
  },
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: colors.primary,
  },
  viewModeButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  viewModeButtonTextActive: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  calendarContainer: {
    flex: 1,
  },
  dayEvents: {
    padding: 16,
    backgroundColor: colors.background,
  },
  dayEventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  dayEventsList: {
    maxHeight: 300,
  },
  emptyDay: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyDayText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyDate: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyDateText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    ...colors.shadow,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventIconText: {
    fontSize: 18,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  eventRecurring: {
    fontSize: 12,
    color: colors.info,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 24,
    width: width * 0.9,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: colors.primary,
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  dateTimeContainer: {
    marginBottom: 16,
  },
  dateTimeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  dateTimeText: {
    fontSize: 16,
    color: colors.text,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  typeSelectorText: {
    fontSize: 16,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  typeOptions: {
    gap: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  typeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  typeOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
     typeOptionLabel: {
     fontSize: 16,
     color: colors.text,
   },
   agendaContainer: {
     flex: 1,
     backgroundColor: colors.background,
   },
   agendaTitle: {
     fontSize: 20,
     fontWeight: 'bold',
     color: colors.text,
     padding: 16,
     textAlign: 'center',
     borderBottomWidth: 1,
     borderBottomColor: colors.divider,
   },
   agendaList: {
     flex: 1,
     padding: 16,
   },
   emptyAgenda: {
     alignItems: 'center',
     paddingVertical: 40,
   },
   emptyAgendaText: {
     fontSize: 16,
     color: colors.textSecondary,
     textAlign: 'center',
   },
 });
