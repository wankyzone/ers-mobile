import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ClientScreen from '../../screens/ClientScreen';
import RunnerScreen from '../../screens/RunnerScreen';
import WalletScreen from '../../screens/WalletScreen';
import ProfileScreen from '../../screens/ProfileScreen';

type RootTabParamList = {
  Client: undefined;
  Runner: undefined;
  Wallet: undefined;
  Profile: undefined;
};

type LegacyTabKey = 'client' | 'runner' | 'wallet' | 'profile';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ROUTES: Record<LegacyTabKey, keyof RootTabParamList> = {
  client: 'Client',
  runner: 'Runner',
  wallet: 'Wallet',
  profile: 'Profile',
};

export default function BottomTabs() {
  const insets = useSafeAreaInsets();

  const createSetTab = useCallback(
    (navigation: any) => (tab: string) => {
      const routeName = TAB_ROUTES[tab as LegacyTabKey];

      if (routeName) {
        navigation.navigate(routeName);
      }
    },
    []
  );

  return (
    <Tab.Navigator
      initialRouteName="Client"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: [
          styles.tabBar,
          {
            paddingBottom: insets.bottom,
            height: 65 + insets.bottom,
          },
        ],
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen name="Client" component={ClientScreen} />
      <Tab.Screen name="Runner" component={RunnerScreen} />
      <Tab.Screen name="Wallet">
        {({ navigation }) => (
          <WalletScreen setTab={createSetTab(navigation)} />
        )}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {({ navigation }) => (
          <ProfileScreen setTab={createSetTab(navigation)} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0B1220',
    borderTopWidth: 0,
    elevation: 8,
    position: 'absolute',
  },
  tabBarItem: {
    paddingVertical: 6,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
