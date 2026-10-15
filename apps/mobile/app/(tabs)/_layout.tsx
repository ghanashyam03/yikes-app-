import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '../../src/navigation/TabBar';

export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="path" />
      <Tabs.Screen name="moments" />
      <Tabs.Screen name="you" />
    </Tabs>
  );
}
