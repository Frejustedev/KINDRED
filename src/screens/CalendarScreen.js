import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SAMPLE_EVENTS = [
  {
    id: 1,
    title: 'Anniversaire de rencontre',
    date: '2024-08-15',
    type: 'anniversary',
    description: 'Il y a 1 an que nous nous sommes rencontrés 💕',
    recurring: 'yearly',
    important: true,
  },
  {
    id: 2,
    title: 'Dîner romantique',
    date: '2024-07-20',
    type: 'date',
    description: 'Restaurant Le Petit Paris, 19h30',
    recurring: false,
    important: false,
  },
  {
    id: 3,
    title: 'Weekend à la campagne',
    date: '2024-07-25',
    type: 'trip',
    description: 'Séjour en Normandie, 3 jours/2 nuits',
    recurring: false,
    important: true,
  },
  {
    id: 4,
    title: 'Anniversaire Sarah',
    date: '2024-09-12',
    type: 'birthday',
    description: 'Penser au cadeau !',
    recurring: 'yearly',
    important: false,
  },
];

const EVENT_TYPES = [
  { id: 'anniversary', title: 'Anniversaire', color: '#E74C3C', icon: 'heart' },
  { id: 'date', title: 'Rendez-vous', color: '#FF6B9D', icon: 'restaurant' },
  { id: 'trip', title: 'Voyage', color: '#3498DB', icon: 'airplane' },
  { id: 'birthday', title: 'Anniversaire', color: '#F39C12', icon: 'gift' },
  { id: 'project', title: 'Projet', color: '#9B59B6', icon: 'construct' },
  { id: 'other', title: 'Autre', color: '#95A5A6', icon: 'calendar' },
];

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function CalendarScreen() {
  const [events, setEvents] = useState(SAMPLE_EVENTS);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'date',
    recurring: false,
    important: false,
  });

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const getUpcomingEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events
      .filter(event => event.date >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  };

  const getEventTypeInfo = (type) => {
    return EVENT_TYPES.find(t => t.id === type) || EVENT_TYPES[0];
  };

  const addNewEvent = () => {
    if (newEvent.title.trim()) {
      const event = {
        id: events.length + 1,
        ...newEvent,
      };
      setEvents([...events, event]);
      setNewEvent({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        type: 'date',
        recurring: false,
        important: false,
      });
      setShowAddModal(false);
    } else {
      Alert.alert('Erreur', 'Veuillez entrer un titre pour l\'événement');
    }
  };

  const deleteEvent = (eventId) => {
    Alert.alert(
      'Supprimer l\'événement',
      'Êtes-vous sûr de vouloir supprimer cet événement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => {
          setEvents(events.filter(e => e.id !== eventId));
        }},
      ]
    );
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getDaysUntil = (dateStr) => {
    const today = new Date();
    const eventDate = new Date(dateStr);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Demain";
    if (diffDays < 0) return "Passé";
    return `Dans ${diffDays} jours`;
  };

  const renderEventItem = ({ item }) => {
    const typeInfo = getEventTypeInfo(item.type);
    
    return (
      <TouchableOpacity 
        style={styles.eventCard}
        onLongPress={() => deleteEvent(item.id)}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventHeaderLeft}>
            <View style={[styles.eventTypeIndicator, { backgroundColor: typeInfo.color }]}>
              <Ionicons name={typeInfo.icon} size={16} color="#FFFFFF" />
            </View>
            <View style={styles.eventInfo}>
              <View style={styles.eventTitleRow}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                {item.important && (
                  <Ionicons name="star" size={16} color="#FFD700" />
                )}
              </View>
              <Text style={styles.eventDate}>{formatDate(item.date)}</Text>
              {item.description && (
                <Text style={styles.eventDescription}>{item.description}</Text>
              )}
            </View>
          </View>
          <View style={styles.eventMeta}>
            <Text style={[styles.countdown, { color: typeInfo.color }]}>
              {getDaysUntil(item.date)}
            </Text>
            {item.recurring && (
              <Ionicons name="repeat" size={14} color="#999" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTypeSelector = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.typeOption,
        { backgroundColor: newEvent.type === item.id ? item.color : '#F0F0F0' }
      ]}
      onPress={() => setNewEvent({ ...newEvent, type: item.id })}
    >
      <Ionicons 
        name={item.icon} 
        size={18} 
        color={newEvent.type === item.id ? '#FFFFFF' : item.color} 
      />
      <Text style={[
        styles.typeOptionText,
        { color: newEvent.type === item.id ? '#FFFFFF' : '#666' }
      ]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Calendrier Partagé</Text>
          <Text style={styles.headerSubtitle}>Planifiez vos moments ensemble</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'month' && styles.activeViewButton]}
            onPress={() => setViewMode('month')}
          >
            <Ionicons name="calendar" size={20} color={viewMode === 'month' ? '#667eea' : '#FFFFFF'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'list' && styles.activeViewButton]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={20} color={viewMode === 'list' ? '#667eea' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{events.length}</Text>
          <Text style={styles.statLabel}>Événements</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{getUpcomingEvents().length}</Text>
          <Text style={styles.statLabel}>À venir</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{events.filter(e => e.important).length}</Text>
          <Text style={styles.statLabel}>Importants</Text>
        </View>
      </View>

      {/* Events List */}
      <View style={styles.eventsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Événements à venir</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Ionicons name="add-circle" size={24} color="#667eea" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={getUpcomingEvents()}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={60} color="#C7C7CC" />
              <Text style={styles.emptyText}>Aucun événement prévu</Text>
              <Text style={styles.emptySubtext}>
                Ajoutez vos premiers événements ensemble
              </Text>
            </View>
          }
        />
      </View>

      {/* Add Event Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouvel Événement</Text>
            <TouchableOpacity onPress={addNewEvent}>
              <Text style={styles.modalSave}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.titleInput}
              placeholder="Titre de l'événement..."
              value={newEvent.title}
              onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
            />

            <TextInput
              style={styles.descriptionInput}
              placeholder="Description (optionnel)..."
              value={newEvent.description}
              onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.dateContainer}>
              <Text style={styles.inputLabel}>Date :</Text>
              <TextInput
                style={styles.dateInput}
                value={newEvent.date}
                onChangeText={(text) => setNewEvent({ ...newEvent, date: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.typeContainer}>
              <Text style={styles.inputLabel}>Type d'événement :</Text>
              <FlatList
                horizontal
                data={EVENT_TYPES}
                renderItem={renderTypeSelector}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                style={styles.typeList}
              />
            </View>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => setNewEvent({ ...newEvent, important: !newEvent.important })}
              >
                <Ionicons 
                  name={newEvent.important ? "star" : "star-outline"} 
                  size={20} 
                  color={newEvent.important ? "#FFD700" : "#999"} 
                />
                <Text style={styles.optionText}>Marquer comme important</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => setNewEvent({ ...newEvent, recurring: !newEvent.recurring })}
              >
                <Ionicons 
                  name={newEvent.recurring ? "repeat" : "repeat-outline"} 
                  size={20} 
                  color={newEvent.recurring ? "#667eea" : "#999"} 
                />
                <Text style={styles.optionText}>Répéter chaque année</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingVertical: 25,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  viewButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  activeViewButton: {
    backgroundColor: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  eventsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  eventTypeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  eventDate: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
    marginTop: 2,
  },
  eventDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
  eventMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  countdown: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 250,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    color: '#667eea',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    height: 80,
    textAlignVertical: 'top',
  },
  dateContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  typeContainer: {
    marginBottom: 20,
  },
  typeList: {
    marginTop: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 10,
    gap: 6,
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  optionsContainer: {
    gap: 15,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
}); 