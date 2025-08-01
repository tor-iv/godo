import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';

export default function SavedEventsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Saved Events Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.SECONDARY,
  },
});