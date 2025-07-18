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
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const SAMPLE_GOALS = [
  {
    id: 1,
    title: 'Économiser pour nos vacances',
    description: 'Mettre de côté 2000€ pour notre voyage en Italie',
    target: 2000,
    current: 1450,
    category: 'finance',
    deadline: '2024-12-31',
    completed: false,
  },
  {
    id: 2,
    title: 'Courir ensemble 3 fois par semaine',
    description: 'Rester en forme ensemble',
    target: 12,
    current: 8,
    category: 'health',
    deadline: '2024-08-31',
    completed: false,
  },
  {
    id: 3,
    title: 'Apprendre à cuisiner italien',
    description: 'Maîtriser 10 recettes italiennes',
    target: 10,
    current: 6,
    category: 'hobby',
    deadline: '2024-09-30',
    completed: false,
  },
];

const SAMPLE_POLLS = [
  {
    id: 1,
    question: 'Où allons-nous pour notre prochain weekend ?',
    options: ['Plage', 'Montagne', 'Ville', 'Campagne'],
    votes: { 'Plage': 1, 'Montagne': 1, 'Ville': 0, 'Campagne': 0 },
    type: 'choice',
    active: true,
    createdAt: '2024-07-15',
  },
  {
    id: 2,
    question: 'Quel film regarder ce soir ?',
    options: ['Action', 'Romance', 'Comédie', 'Thriller'],
    votes: { 'Action': 0, 'Romance': 2, 'Comédie': 0, 'Thriller': 0 },
    type: 'choice',
    active: false,
    createdAt: '2024-07-10',
  },
];

const GOAL_CATEGORIES = [
  { id: 'finance', title: 'Finance', color: '#27AE60', icon: 'card' },
  { id: 'health', title: 'Santé', color: '#E74C3C', icon: 'fitness' },
  { id: 'hobby', title: 'Loisirs', color: '#3498DB', icon: 'game-controller' },
  { id: 'travel', title: 'Voyage', color: '#F39C12', icon: 'airplane' },
  { id: 'home', title: 'Maison', color: '#9B59B6', icon: 'home' },
  { id: 'other', title: 'Autre', color: '#95A5A6', icon: 'ellipsis-horizontal' },
];

export default function ProfileScreen() {
  const { logout, currentUser, currentCouple } = useAuth();
  const [goals, setGoals] = useState(SAMPLE_GOALS);
  const [polls, setPolls] = useState(SAMPLE_POLLS);
  const [activeTab, setActiveTab] = useState('goals'); // 'goals', 'polls', 'settings'
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showAddPollModal, setShowAddPollModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target: '',
    category: 'finance',
    deadline: '',
  });
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', ''],
  });
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoLock: true,
    shareLocation: false,
  });

  const getCategoryInfo = (category) => {
    return GOAL_CATEGORIES.find(c => c.id === category) || GOAL_CATEGORIES[0];
  };

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const addNewGoal = () => {
    if (newGoal.title.trim() && newGoal.target) {
      const goal = {
        id: goals.length + 1,
        ...newGoal,
        target: parseInt(newGoal.target),
        current: 0,
        completed: false,
      };
      setGoals([...goals, goal]);
      setNewGoal({
        title: '',
        description: '',
        target: '',
        category: 'finance',
        deadline: '',
      });
      setShowAddGoalModal(false);
    } else {
      Alert.alert('Erreur', 'Veuillez remplir le titre et l\'objectif');
    }
  };

  const updateGoalProgress = (goalId, increment) => {
    setGoals(goals.map(goal => {
      if (goal.id === goalId) {
        const newCurrent = Math.max(0, Math.min(goal.target, goal.current + increment));
        return {
          ...goal,
          current: newCurrent,
          completed: newCurrent >= goal.target,
        };
      }
      return goal;
    }));
  };

  const addNewPoll = () => {
    if (newPoll.question.trim() && newPoll.options.filter(opt => opt.trim()).length >= 2) {
      const poll = {
        id: polls.length + 1,
        question: newPoll.question,
        options: newPoll.options.filter(opt => opt.trim()),
        votes: {},
        type: 'choice',
        active: true,
        createdAt: new Date().toISOString().split('T')[0],
      };
      // Initialize votes
      poll.options.forEach(option => {
        poll.votes[option] = 0;
      });
      setPolls([poll, ...polls]);
      setNewPoll({ question: '', options: ['', ''] });
      setShowAddPollModal(false);
    } else {
      Alert.alert('Erreur', 'Veuillez remplir la question et au moins 2 options');
    }
  };

  const voteOnPoll = (pollId, option) => {
    setPolls(polls.map(poll => {
      if (poll.id === pollId && poll.active) {
        return {
          ...poll,
          votes: {
            ...poll.votes,
            [option]: (poll.votes[option] || 0) + 1,
          },
        };
      }
      return poll;
    }));
  };

  const addPollOption = () => {
    if (newPoll.options.length < 6) {
      setNewPoll({
        ...newPoll,
        options: [...newPoll.options, ''],
      });
    }
  };

  const updatePollOption = (index, value) => {
    const newOptions = [...newPoll.options];
    newOptions[index] = value;
    setNewPoll({ ...newPoll, options: newOptions });
  };

  const removePollOption = (index) => {
    if (newPoll.options.length > 2) {
      const newOptions = newPoll.options.filter((_, i) => i !== index);
      setNewPoll({ ...newPoll, options: newOptions });
    }
  };

  const renderGoalItem = ({ item }) => {
    const categoryInfo = getCategoryInfo(item.category);
    const progress = getProgressPercentage(item.current, item.target);

    return (
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalHeaderLeft}>
            <View style={[styles.goalCategoryIcon, { backgroundColor: categoryInfo.color }]}>
              <Ionicons name={categoryInfo.icon} size={16} color="#FFFFFF" />
            </View>
            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle}>{item.title}</Text>
              <Text style={styles.goalDescription}>{item.description}</Text>
            </View>
          </View>
          {item.completed && (
            <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
          )}
        </View>

        <View style={styles.goalProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              {item.current} / {item.target}
            </Text>
            <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: categoryInfo.color }]} />
          </View>
        </View>

        <View style={styles.goalActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.decrementButton]}
            onPress={() => updateGoalProgress(item.id, -1)}
          >
            <Ionicons name="remove" size={16} color="#FF6B9D" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.incrementButton]}
            onPress={() => updateGoalProgress(item.id, 1)}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPollItem = ({ item }) => {
    const totalVotes = Object.values(item.votes).reduce((sum, votes) => sum + votes, 0);

    return (
      <View style={styles.pollCard}>
        <Text style={styles.pollQuestion}>{item.question}</Text>
        <View style={styles.pollOptions}>
          {item.options.map((option, index) => {
            const votes = item.votes[option] || 0;
            const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.pollOption}
                onPress={() => item.active && voteOnPoll(item.id, option)}
                disabled={!item.active}
              >
                <View style={styles.pollOptionContent}>
                  <Text style={styles.pollOptionText}>{option}</Text>
                  <Text style={styles.pollOptionVotes}>{votes} votes</Text>
                </View>
                <View style={styles.pollOptionBar}>
                  <View style={[styles.pollOptionProgress, { width: `${percentage}%` }]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.pollMeta}>
          <Text style={styles.pollTotalVotes}>{totalVotes} votes au total</Text>
          <Text style={[styles.pollStatus, { color: item.active ? '#27AE60' : '#999' }]}>
            {item.active ? 'Actif' : 'Terminé'}
          </Text>
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    if (activeTab === 'goals') {
      return (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Objectifs Partagés</Text>
            <TouchableOpacity onPress={() => setShowAddGoalModal(true)}>
              <Ionicons name="add-circle" size={24} color="#FF6B9D" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={goals}
            renderItem={renderGoalItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="trophy-outline" size={60} color="#C7C7CC" />
                <Text style={styles.emptyText}>Aucun objectif défini</Text>
              </View>
            }
          />
        </View>
      );
    }

    if (activeTab === 'polls') {
      return (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mini-Sondages</Text>
            <TouchableOpacity onPress={() => setShowAddPollModal(true)}>
              <Ionicons name="add-circle" size={24} color="#FF6B9D" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={polls}
            renderItem={renderPollItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="bar-chart-outline" size={60} color="#C7C7CC" />
                <Text style={styles.emptyText}>Aucun sondage créé</Text>
              </View>
            }
          />
        </View>
      );
    }

    if (activeTab === 'settings') {
      return (
        <ScrollView style={styles.tabContent}>
          <View style={styles.settingsSection}>
            <Text style={styles.settingsTitle}>Paramètres</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications" size={20} color="#FF6B9D" />
                <Text style={styles.settingLabel}>Notifications</Text>
              </View>
              <Switch
                value={settings.notifications}
                onValueChange={(value) => setSettings({ ...settings, notifications: value })}
                trackColor={{ false: '#E0E0E0', true: '#FF6B9D' }}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon" size={20} color="#FF6B9D" />
                <Text style={styles.settingLabel}>Mode sombre</Text>
              </View>
              <Switch
                value={settings.darkMode}
                onValueChange={(value) => setSettings({ ...settings, darkMode: value })}
                trackColor={{ false: '#E0E0E0', true: '#FF6B9D' }}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="lock-closed" size={20} color="#FF6B9D" />
                <Text style={styles.settingLabel}>Verrouillage automatique</Text>
              </View>
              <Switch
                value={settings.autoLock}
                onValueChange={(value) => setSettings({ ...settings, autoLock: value })}
                trackColor={{ false: '#E0E0E0', true: '#FF6B9D' }}
              />
            </View>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsTitle}>Couple</Text>
            
            <TouchableOpacity style={styles.settingButton}>
              <Ionicons name="key" size={20} color="#667eea" />
              <Text style={styles.settingButtonText}>Changer le code secret</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingButton}>
              <Ionicons name="sync" size={20} color="#667eea" />
              <Text style={styles.settingButtonText}>Synchroniser les données</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsTitle}>Support</Text>
            
            <TouchableOpacity style={styles.settingButton}>
              <Ionicons name="help-circle" size={20} color="#27AE60" />
              <Text style={styles.settingButtonText}>Centre d'aide</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingButton}>
              <Ionicons name="mail" size={20} color="#27AE60" />
              <Text style={styles.settingButtonText}>Nous contacter</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsTitle}>Compte</Text>
            
            <View style={styles.userInfo}>
              <Text style={styles.userInfoText}>
                Connecté en tant que {currentUser?.displayName || 'Utilisateur'}
              </Text>
              {currentCouple && (
                <Text style={styles.coupleInfoText}>
                  Couple : {currentCouple.name}
                </Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={[styles.settingButton, styles.logoutButton]}
              onPress={() => {
                Alert.alert(
                  'Déconnexion',
                  'Êtes-vous sûr de vouloir vous déconnecter ?',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Déconnexion', style: 'destructive', onPress: logout }
                  ]
                );
              }}
            >
              <Ionicons name="log-out" size={20} color="#E74C3C" />
              <Text style={[styles.settingButtonText, styles.logoutButtonText]}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FF6B9D', '#C44569']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Profil</Text>
        <Text style={styles.headerSubtitle}>Gérez vos objectifs et paramètres</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { id: 'goals', title: 'Objectifs', icon: 'trophy' },
          { id: 'polls', title: 'Sondages', icon: 'bar-chart' },
          { id: 'settings', title: 'Réglages', icon: 'settings' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.id ? '#FF6B9D' : '#999'} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.id ? '#FF6B9D' : '#999' }
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderTabContent()}

      {/* Add Goal Modal */}
      <Modal visible={showAddGoalModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddGoalModal(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouvel Objectif</Text>
            <TouchableOpacity onPress={addNewGoal}>
              <Text style={styles.modalSave}>Créer</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Titre de l'objectif..."
              value={newGoal.title}
              onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
            />
            <TextInput
              style={styles.textArea}
              placeholder="Description..."
              value={newGoal.description}
              onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Objectif (nombre)"
              value={newGoal.target}
              onChangeText={(text) => setNewGoal({ ...newGoal, target: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Date limite (YYYY-MM-DD)"
              value={newGoal.deadline}
              onChangeText={(text) => setNewGoal({ ...newGoal, deadline: text })}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add Poll Modal */}
      <Modal visible={showAddPollModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddPollModal(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouveau Sondage</Text>
            <TouchableOpacity onPress={addNewPoll}>
              <Text style={styles.modalSave}>Créer</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Question du sondage..."
              value={newPoll.question}
              onChangeText={(text) => setNewPoll({ ...newPoll, question: text })}
            />
            <Text style={styles.inputLabel}>Options de réponse :</Text>
            {newPoll.options.map((option, index) => (
              <View key={index} style={styles.optionRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={`Option ${index + 1}...`}
                  value={option}
                  onChangeText={(text) => updatePollOption(index, text)}
                />
                {newPoll.options.length > 2 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removePollOption(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#E74C3C" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {newPoll.options.length < 6 && (
              <TouchableOpacity style={styles.addOptionButton} onPress={addPollOption}>
                <Ionicons name="add" size={16} color="#FF6B9D" />
                <Text style={styles.addOptionText}>Ajouter une option</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B9D',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabContent: {
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
  goalCard: {
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
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  goalHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  goalCategoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  goalProgress: {
    marginBottom: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#FF6B9D',
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  goalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decrementButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF6B9D',
  },
  incrementButton: {
    backgroundColor: '#FF6B9D',
  },
  pollCard: {
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
  pollQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  pollOptions: {
    gap: 10,
    marginBottom: 15,
  },
  pollOption: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  pollOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pollOptionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  pollOptionVotes: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  pollOptionBar: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  pollOptionProgress: {
    height: '100%',
    backgroundColor: '#FF6B9D',
    borderRadius: 2,
  },
  pollMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pollTotalVotes: {
    fontSize: 12,
    color: '#666',
  },
  pollStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  settingButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
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
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    height: 80,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  removeButton: {
    padding: 5,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderWidth: 2,
    borderColor: '#FF6B9D',
    borderStyle: 'dashed',
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  addOptionText: {
    fontSize: 14,
    color: '#FF6B9D',
    fontWeight: '600',
  },
  userInfo: {
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userInfoText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  coupleInfoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutButtonText: {
    color: '#E74C3C',
  },
}); 