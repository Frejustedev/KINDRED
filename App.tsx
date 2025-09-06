import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';

import { AuthProvider } from './src/hooks/useAuth';
import { CoupleProvider } from './src/hooks/useCouple';
import { MessagesProvider } from './src/hooks/useMessages';
import { BudgetProvider } from './src/hooks/useBudget';
import { AgendaProvider } from './src/hooks/useAgenda';
import { SharedListsProvider } from './src/hooks/useSharedLists';
import { CollaborativeNotesProvider } from './src/hooks/useCollaborativeNotes';
import { TimeCapsuleProvider } from './src/hooks/useTimeCapsules';
import { MilestonesProvider } from './src/hooks/useMilestones';
import { ActivityLogsProvider } from './src/hooks/useActivityLogs';
import { RootNavigator } from './src/navigation/RootNavigator';

// Configuration des notifications (sera gérée par NotificationService)

// Garder le splash screen visible
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    // Cacher le splash screen après le chargement
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };
    
    setTimeout(hideSplash, 2000);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <CoupleProvider>
            <MessagesProvider>
              <BudgetProvider>
                <AgendaProvider>
                  <SharedListsProvider>
                    <CollaborativeNotesProvider>
                      <TimeCapsuleProvider>
                        <MilestonesProvider>
                          <ActivityLogsProvider>
                            <RootNavigator />
                            <StatusBar style="auto" />
                          </ActivityLogsProvider>
                        </MilestonesProvider>
                      </TimeCapsuleProvider>
                    </CollaborativeNotesProvider>
                  </SharedListsProvider>
                </AgendaProvider>
              </BudgetProvider>
            </MessagesProvider>
          </CoupleProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
