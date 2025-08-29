import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  colors,
  typography,
  spacing,
  layout,
  shadows,
} from '../../design/tokens';

interface ProfileStatsProps {
  stats: {
    eventsAttended: number;
    eventsSaved: number;
    friendsConnected: number;
  };
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ stats }) => {
  const renderStatCard = (
    title: string,
    value: number,
    icon: keyof typeof Feather.glyphMap
  ) => {
    return (
      <View style={styles.statCard}>
        <View style={styles.statIcon}>
          <Feather name={icon} size={24} color={colors.primary[500]} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderStatCard('Events Attended', stats.eventsAttended, 'calendar')}
      {renderStatCard('Events Saved', stats.eventsSaved, 'bookmark')}
      {renderStatCard('Friends', stats.friendsConnected, 'users')}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing[10],
    gap: spacing[4],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: layout.cardBorderRadius,
    padding: spacing[6],
    alignItems: 'center',
    ...shadows.medium,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  statValue: {
    ...typography.display3,
    color: colors.neutral[800],
    marginBottom: spacing[1],
  },
  statTitle: {
    ...typography.caption,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});
