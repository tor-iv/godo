import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { TabNavigator } from './src/navigation/TabNavigator';

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </>
  );
}
