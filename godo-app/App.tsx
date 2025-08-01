import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider } from './src/context/AppContext';
import TabNavigator from './src/navigation/TabNavigator';
import { COLORS } from './src/constants';

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProvider>
          <NavigationContainer>
            <StatusBar style="light" backgroundColor={COLORS.SECONDARY} />
            <TabNavigator />
          </NavigationContainer>
        </AppProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
