import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Firebase et Auth
import './src/config/firebase';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Auth Screens
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import CoupleSetupScreen from './src/screens/auth/CoupleSetupScreen';

// Main App Screens
import ChatScreen from './src/screens/ChatScreen';
import VaultScreen from './src/screens/VaultScreen';
import JournalScreen from './src/screens/JournalScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Navigation pour les utilisateurs authentifiés avec un couple
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Vault') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Journal') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B9D',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: styles.tabBar,
        headerStyle: styles.header,
        headerTintColor: '#FF6B9D',
        headerTitleStyle: styles.headerTitle,
      })}
    >
      <Tab.Screen name="Chat" component={ChatScreen} options={{ title: 'Kindred' }} />
      <Tab.Screen name="Vault" component={VaultScreen} options={{ title: 'Coffre Sensible' }} />
      <Tab.Screen name="Journal" component={JournalScreen} options={{ title: 'Journal Partagé' }} />
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Calendrier' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

// Navigation pour l'authentification
function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="CoupleSetup" component={CoupleSetupScreen} />
    </Stack.Navigator>
  );
}

// Composant principal avec navigation conditionnelle
function AppNavigator() {
  const { isAuthenticated, currentUser, currentCouple } = useAuth();

  if (!isAuthenticated) {
    // Utilisateur non connecté -> écrans d'authentification
    return <AuthNavigator />;
  }

  if (isAuthenticated && (!currentUser?.isInCouple || !currentCouple)) {
    // Utilisateur connecté mais pas dans un couple -> configuration du couple
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CoupleSetup" component={CoupleSetupScreen} />
      </Stack.Navigator>
    );
  }

  // Utilisateur connecté et dans un couple -> application principale
  return <MainTabNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#F2F2F7',
    borderTopWidth: 1,
    height: 90,
    paddingBottom: 30,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  header: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  headerTitle: {
    fontWeight: '600',
    fontSize: 18,
  },
});
