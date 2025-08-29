import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, layout } from '../../design/tokens';

interface ProfilePreferencesProps {
  categories: string[];
  neighborhoods: string[];
}

export const ProfilePreferences: React.FC<ProfilePreferencesProps> = ({
  categories,
  neighborhoods,
}) => {
  const renderPreferenceChips = (items: string[]) => {
    return (
      <View style={styles.chipsContainer}>
        {items.map((item, index) => (
          <View key={index} style={styles.chip}>
            <Text style={styles.chipText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favorite Categories</Text>
        {renderPreferenceChips(categories)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferred Neighborhoods</Text>
        {renderPreferenceChips(neighborhoods)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing[8],
  },
  section: {
    marginBottom: spacing[8],
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.neutral[800],
    marginBottom: spacing[4],
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  chipText: {
    ...typography.caption,
    color: colors.primary[700],
    fontWeight: '600',
  },
});
