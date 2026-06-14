import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BottomTabs from './BottomTabs';
import CreateErrandScreen from '../../screens/CreateErrandScreen';
import TransactionsScreen from '../../screens/TransactionsScreen';

// ─── TYPES ─────────────────────────────────────

export type RootStackParamList = {
  Tabs: undefined;
  CreateErrand: undefined;
  Transactions: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── NAVIGATOR ─────────────────────────────────

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>

        {/* MAIN APP */}
        <Stack.Screen
          name="Tabs"
          component={BottomTabs}
          options={{ headerShown: false }}
        />

        {/* MODAL SCREENS */}
        <Stack.Screen
          name="CreateErrand"
          component={CreateErrandScreen}
          options={{
            presentation: 'modal',
            title: 'Create Errand',
          }}
        />

        <Stack.Screen
          name="Transactions"
          component={TransactionsScreen}
          options={{
            presentation: 'modal',
            title: 'Transactions',
          }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}