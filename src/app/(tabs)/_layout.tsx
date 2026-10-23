import React from 'react';
import { Tabs } from 'expo-router';
import { AppTabBar } from '../../components/AppTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
        }}
      />
      <Tabs.Screen
        name="care"
        options={{
          title: 'Care nearby',
        }}
      />
      <Tabs.Screen
        name="emergency"
        options={{
          title: 'Emergency help',
        }}
      />
    </Tabs>
  );
}
