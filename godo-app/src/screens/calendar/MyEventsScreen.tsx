import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const MyEventsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Events</Text>
      <Text style={styles.subtitle}>Your personal calendar</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#71717A',
    textAlign: 'center',
  },
});