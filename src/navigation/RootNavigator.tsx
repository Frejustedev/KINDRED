import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { CouplingScreen } from '../screens/auth/CouplingScreen';
import { MainNavigator } from './MainNavigator';
import { LoadingScreen } from '../screens/auth/LoadingScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          // Utilisateur connecté - Navigation principale
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen name="Coupling" component={CouplingScreen} />
          </>
        ) : (
          // Utilisateur non connecté - Navigation d'authentification
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="Coupling" component={CouplingScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
