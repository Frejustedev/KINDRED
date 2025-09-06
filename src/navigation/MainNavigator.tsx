import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadowStyles } from '../constants/colors';
import { useMessages } from '../hooks/useMessages';
import { HomeScreen } from '../screens/main/home/HomeScreen';
import { MessagesScreen } from '../screens/main/messages/MessagesScreen';
import { ChatScreen } from '../screens/main/messages/ChatScreen';
import { ConversationsScreen } from '../screens/main/messages/ConversationsScreen';
import { AgendaScreen } from '../screens/main/agenda/AgendaScreen';

import { BudgetScreen } from '../screens/main/budget/BudgetScreen';
import { BudgetStatsScreen } from '../screens/main/budget/BudgetStatsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { CoupleInfoScreen } from '../screens/settings/CoupleInfoScreen';
import { CapsulesScreen } from '../screens/main/capsules/CapsulesScreen';
import { SharedListsScreen } from '../screens/main/lists/SharedListsScreen';
import { ListDetailScreen } from '../screens/main/lists/ListDetailScreen';
import { CollaborativeNotesScreen } from '../screens/main/notes/CollaborativeNotesScreen';
import { NoteEditorScreen } from '../screens/main/notes/NoteEditorScreen';
import { OrganizationScreen } from '../screens/main/organization/OrganizationScreen';
import { FinanceScreen } from '../screens/main/finance/FinanceScreen';
import { MilestonesScreen } from '../screens/main/milestones/MilestonesScreen';
import { AddMilestoneScreen } from '../screens/main/milestones/AddMilestoneScreen';
import { EditMilestoneScreen } from '../screens/main/milestones/EditMilestoneScreen';
import { ActivityLogsScreen } from '../screens/settings/ActivityLogsScreen';
import { NotificationsScreen } from '../screens/settings/NotificationsScreen';
import { HelpScreen } from '../screens/settings/HelpScreen';

const Tab = createBottomTabNavigator();
const MessagesStack = createNativeStackNavigator();
const OrganizationStack = createNativeStackNavigator();
const FinanceStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

// Stack pour les messages
const MessagesStackNavigator = () => (
  <MessagesStack.Navigator 
    screenOptions={{ headerShown: false }}
    initialRouteName="Conversations"
  >
    <MessagesStack.Screen name="Conversations" component={ConversationsScreen} />
    <MessagesStack.Screen name="Chat" component={ChatScreen} />
    <MessagesStack.Screen name="MessagesList" component={MessagesScreen} />
    <MessagesStack.Screen name="Capsules" component={CapsulesScreen} />
  </MessagesStack.Navigator>
);

// Stack pour l'organisation (Agenda, Listes, Notes, Dates marquantes)
const OrganizationStackNavigator = () => (
  <OrganizationStack.Navigator 
    screenOptions={{ headerShown: false }}
    initialRouteName="OrganizationHome"
  >
    <OrganizationStack.Screen name="OrganizationHome" component={OrganizationScreen} />
    <OrganizationStack.Screen name="Agenda" component={AgendaScreen} />
    <OrganizationStack.Screen name="SharedLists" component={SharedListsScreen} />
    <OrganizationStack.Screen name="ListDetail" component={ListDetailScreen} />
    <OrganizationStack.Screen name="CollaborativeNotes" component={CollaborativeNotesScreen} />
    <OrganizationStack.Screen name="NoteEditor" component={NoteEditorScreen} />
    <OrganizationStack.Screen name="Milestones" component={MilestonesScreen} />
    <OrganizationStack.Screen name="AddMilestone" component={AddMilestoneScreen} />
    <OrganizationStack.Screen name="EditMilestone" component={EditMilestoneScreen} />
  </OrganizationStack.Navigator>
);

// Stack pour les finances (Budget uniquement)
const FinanceStackNavigator = () => (
  <FinanceStack.Navigator 
    screenOptions={{ headerShown: false }}
    initialRouteName="FinanceHome"
  >
    <FinanceStack.Screen name="FinanceHome" component={FinanceScreen} />
    <FinanceStack.Screen name="Budget" component={BudgetScreen} />
    <FinanceStack.Screen name="BudgetStats" component={BudgetStatsScreen} />
  </FinanceStack.Navigator>
);

// Stack pour les paramètres
const SettingsStackNavigator = () => (
  <SettingsStack.Navigator 
    screenOptions={{ headerShown: false }}
    initialRouteName="SettingsHome"
  >
    <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} />
    <SettingsStack.Screen name="CoupleInfo" component={CoupleInfoScreen} />
    <SettingsStack.Screen name="ActivityLogs" component={ActivityLogsScreen} />
    <SettingsStack.Screen name="Notifications" component={NotificationsScreen} />
    <SettingsStack.Screen name="Help" component={HelpScreen} />
  </SettingsStack.Navigator>
);

// Composants d'icônes avec Ionicons
const TabIcon: React.FC<{ name: string; focused: boolean }> = ({ name, focused }) => {
  const { totalUnreadCount } = useMessages();
  
  const getIconName = () => {
    switch (name) {
      case 'Messages':
        return focused ? 'chatbubbles' : 'chatbubbles-outline';
      case 'Organization':
        return focused ? 'calendar' : 'calendar-outline';
      case 'Home':
        return focused ? 'home' : 'home-outline';
      case 'Finance':
        return focused ? 'wallet' : 'wallet-outline';
      case 'Settings':
        return focused ? 'settings' : 'settings-outline';
      default:
        return 'help-outline';
    }
  };

  const getIconSize = () => {
    return name === 'Home' ? 28 : 24;
  };

  return (
    <View style={[
      styles.iconContainer, 
      focused && styles.iconContainerFocused,
      name === 'Home' && styles.homeIconContainer
    ]}>
      <Ionicons 
        name={getIconName() as any} 
        size={getIconSize()} 
        color={focused ? colors.primary : colors.textLight} 
      />
      {name === 'Messages' && totalUnreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </Text>
        </View>
      )}
    </View>
  );
};

export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: styles.tabBar,
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Messages"
        component={MessagesStackNavigator}
        options={{
          tabBarLabel: () => <></>,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            // Réinitialiser la stack Messages vers l'écran principal
            navigation.navigate('Messages', { screen: 'Conversations' });
          },
        })}
      />
      <Tab.Screen
        name="Organization"
        component={OrganizationStackNavigator}
        options={{
          tabBarLabel: () => <></>,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            // Réinitialiser la stack Organization vers l'écran principal
            navigation.navigate('Organization', { screen: 'OrganizationHome' });
          },
        })}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: () => <></>,
        }}
      />
      <Tab.Screen
        name="Finance"
        component={FinanceStackNavigator}
        options={{
          tabBarLabel: () => <></>,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            // Réinitialiser la stack Finance vers l'écran principal
            navigation.navigate('Finance', { screen: 'FinanceHome' });
          },
        })}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          tabBarLabel: () => <></>,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            // Réinitialiser la stack Settings vers l'écran principal
            navigation.navigate('Settings', { screen: 'SettingsHome' });
          },
        })}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 8,
    paddingBottom: 8,
    height: 75,
    ...shadowStyles,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainerFocused: {
    transform: [{ scale: 1.1 }],
  },
  homeIconContainer: {
    transform: [{ scale: 1.2 }],
  },

  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    color: colors.textOnPrimary,
    fontWeight: 'bold',
  },
});
