import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

const SAMPLE_JOURNAL_ENTRIES = [
  {
    id: 1,
    type: 'memory',
    title: 'Notre premier rendez-vous',
    content: 'Ce jour magique au restaurant italien où tout a commencé... 💕',
    date: '2024-03-15',
    image: 'https://picsum.photos/400/300?random=10',
    category: 'milestone',
  },
  {
    id: 2,
    type: 'photo',
    title: 'Coucher de soleil à la plage',
    content: 'Un moment parfait ensemble 🌅',
    date: '2024-06-20',
    image: 'https://picsum.photos/400/300?random=11',
    category: 'adventure',
  },
  {
    id: 3,
    type: 'message',
    title: 'Message d\'amour',
    content: '"Tu illumines chaque jour de ma vie" - Le plus beau message que j\'ai reçu ❤️',
    date: '2024-07-10',
    category: 'love',
  },
  {
    id: 4,
    type: 'anecdote',
    title: 'La fois où on s\'est perdus',
    content: 'Cette aventure improvisée qui nous a menés à découvrir ce petit café secret 😄',
    date: '2024-05-08',
    category: 'funny',
  },
];

const CATEGORIES = [
  { id: 'all', title: 'Tout', color: '#FF6B9D', icon: 'albums' },
  { id: 'milestone', title: 'Étapes', color: '#4ECDC4', icon: 'flag' },
  { id: 'adventure', title: 'Aventures', color: '#45B7D1', icon: 'compass' },
  { id: 'love', title: 'Amour', color: '#E74C3C', icon: 'heart' },
  { id: 'funny', title: 'Drôle', color: '#F39C12', icon: 'happy' },
  { id: 'special', title: 'Spécial', color: '#9B59B6', icon: 'star' },
];

export default function JournalScreen() {
  const [journalEntries, setJournalEntries] = useState(SAMPLE_JOURNAL_ENTRIES);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    category: 'milestone',
    type: 'memory',
    image: null,
  });

  const filteredEntries = selectedCategory === 'all' 
    ? journalEntries 
    : journalEntries.filter(entry => entry.category === selectedCategory);

  const getCategoryColor = (category) => {
    const cat = CATEGORIES.find(c => c.id === category);
    return cat ? cat.color : '#FF6B9D';
  };

  const getCategoryIcon = (type) => {
    switch (type) {
      case 'photo': return 'camera';
      case 'message': return 'chatbubble';
      case 'anecdote': return 'book';
      default: return 'heart';
    }
  };

  const addNewEntry = () => {
    if (newEntry.title.trim() && newEntry.content.trim()) {
      const entry = {
        id: journalEntries.length + 1,
        ...newEntry,
        date: new Date().toISOString().split('T')[0],
      };
      setJournalEntries([entry, ...journalEntries]);
      setNewEntry({ title: '', content: '', category: 'milestone', type: 'memory', image: null });
      setShowAddModal(false);
    } else {
      Alert.alert('Erreur', 'Veuillez remplir le titre et le contenu');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setNewEntry({ ...newEntry, image: result.assets[0].uri, type: 'photo' });
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        { backgroundColor: selectedCategory === item.id ? item.color : '#F8F9FA' }
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Ionicons
        name={item.icon}
        size={18}
        color={selectedCategory === item.id ? '#FFFFFF' : item.color}
      />
      <Text
        style={[
          styles.categoryText,
          { color: selectedCategory === item.id ? '#FFFFFF' : '#333' }
        ]}
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const renderJournalEntry = ({ item }) => (
    <TouchableOpacity style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryHeaderLeft}>
          <Ionicons 
            name={getCategoryIcon(item.type)} 
            size={20} 
            color={getCategoryColor(item.category)} 
          />
          <View style={styles.entryHeaderText}>
            <Text style={styles.entryTitle}>{item.title}</Text>
            <Text style={styles.entryDate}>{new Date(item.date).toLocaleDateString('fr-FR')}</Text>
          </View>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
          <Text style={styles.categoryBadgeText}>
            {CATEGORIES.find(c => c.id === item.category)?.title}
          </Text>
        </View>
      </View>

      {item.image && (
        <Image source={{ uri: item.image }} style={styles.entryImage} />
      )}

      <Text style={styles.entryContent}>{item.content}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#8EC5FC', '#E0C3FC']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Journal Partagé</Text>
        <Text style={styles.headerSubtitle}>Vos plus beaux souvenirs à deux</Text>
      </LinearGradient>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Journal Entries */}
      <FlatList
        data={filteredEntries}
        renderItem={renderJournalEntry}
        keyExtractor={(item) => item.id.toString()}
        style={styles.journalList}
        contentContainerStyle={styles.journalContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={60} color="#C7C7CC" />
            <Text style={styles.emptyText}>Aucun souvenir dans cette catégorie</Text>
            <Text style={styles.emptySubtext}>
              Commencez à écrire vos plus beaux moments
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => setShowAddModal(true)}
      >
        <LinearGradient
          colors={['#FF6B9D', '#C44569']}
          style={styles.addButtonGradient}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Entry Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouveau Souvenir</Text>
            <TouchableOpacity onPress={addNewEntry}>
              <Text style={styles.modalSave}>Sauver</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.titleInput}
              placeholder="Titre du souvenir..."
              value={newEntry.title}
              onChangeText={(text) => setNewEntry({ ...newEntry, title: text })}
            />

            <View style={styles.typeSelector}>
              {['memory', 'photo', 'message', 'anecdote'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    { backgroundColor: newEntry.type === type ? '#FF6B9D' : '#F0F0F0' }
                  ]}
                  onPress={() => setNewEntry({ ...newEntry, type })}
                >
                  <Ionicons 
                    name={getCategoryIcon(type)} 
                    size={16} 
                    color={newEntry.type === type ? '#FFFFFF' : '#666'} 
                  />
                  <Text style={[
                    styles.typeButtonText,
                    { color: newEntry.type === type ? '#FFFFFF' : '#666' }
                  ]}>
                    {type === 'memory' ? 'Souvenir' : 
                     type === 'photo' ? 'Photo' :
                     type === 'message' ? 'Message' : 'Anecdote'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.categorySelector}>
              <Text style={styles.selectorLabel}>Catégorie :</Text>
              <FlatList
                horizontal
                data={CATEGORIES.slice(1)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categorySelectorItem,
                      { backgroundColor: newEntry.category === item.id ? item.color : '#F0F0F0' }
                    ]}
                    onPress={() => setNewEntry({ ...newEntry, category: item.id })}
                  >
                    <Ionicons 
                      name={item.icon} 
                      size={14} 
                      color={newEntry.category === item.id ? '#FFFFFF' : item.color} 
                    />
                    <Text style={[
                      styles.categorySelectorText,
                      { color: newEntry.category === item.id ? '#FFFFFF' : '#666' }
                    ]}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
              />
            </View>

            {newEntry.image && (
              <Image source={{ uri: newEntry.image }} style={styles.selectedImage} />
            )}

            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Ionicons name="camera" size={20} color="#FF6B9D" />
              <Text style={styles.imageButtonText}>
                {newEntry.image ? 'Changer la photo' : 'Ajouter une photo'}
              </Text>
            </TouchableOpacity>

            <TextInput
              style={styles.contentInput}
              placeholder="Racontez votre souvenir..."
              value={newEntry.content}
              onChangeText={(text) => setNewEntry({ ...newEntry, content: text })}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
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
  categoriesContainer: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    marginRight: 10,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 5,
  },
  journalList: {
    flex: 1,
  },
  journalContent: {
    padding: 20,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  entryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  entryHeaderText: {
    marginLeft: 10,
    flex: 1,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  entryDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  entryImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  entryContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
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
    color: '#FF6B9D',
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
    marginBottom: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 5,
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categorySelector: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  categorySelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    gap: 4,
  },
  categorySelectorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderWidth: 2,
    borderColor: '#FF6B9D',
    borderStyle: 'dashed',
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  imageButtonText: {
    fontSize: 14,
    color: '#FF6B9D',
    fontWeight: '600',
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    height: 120,
  },
}); 