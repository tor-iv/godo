import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../design/tokens';

// Stat types for type safety
export type StatType = 'eventsAttended' | 'eventsSaved' | 'friendsConnected';

interface ProfileStatsRowLayoutProps {
  stats: {
    eventsAttended: number;
    eventsSaved: number;
    friendsConnected: number;
  };
  layout?: 'single-row' | 'two-row' | 'compact';
  showSubtitles?: boolean;
  showIcons?: boolean;
  interactive?: boolean;
  colorVariant?: 'default' | 'monochrome' | 'colorful';
  onStatPress?: (statType: StatType, value: number) => void;
  testID?: string;
}

const statConfig = {
  eventsAttended: {
    title: 'Events Attended',
    icon: 'calendar' as keyof typeof Feather.glyphMap,
    color: colors.success[500],
  },
  eventsSaved: {
    title: 'Events Saved',
    icon: 'bookmark' as keyof typeof Feather.glyphMap,
    color: colors.warning[500],
  },
  friendsConnected: {
    title: 'Friends Connected',
    icon: 'users' as keyof typeof Feather.glyphMap,
    color: colors.info[500],
  },
};

export const ProfileStatsRowLayout: React.FC<ProfileStatsRowLayoutProps> = ({
  stats,
  layout = 'single-row',
  showSubtitles = false,
  showIcons = true,
  interactive = false,
  colorVariant = 'default',
  onStatPress,
  testID = 'profile-stats-row',
}) => {
  const getStatColor = (statType: StatType) => {
    if (colorVariant === 'monochrome') return colors.neutral[600];
    if (colorVariant === 'colorful') return statConfig[statType].color;
    return colors.primary[500]; // default
  };

  const renderStatItem = (statType: StatType, value: number, index: number) => {
    const config = statConfig[statType];
    const isInteractive = interactive && onStatPress;

    const StatWrapper = isInteractive ? Pressable : View;

    return (
      <StatWrapper
        key={statType}
        style={[
          styles.statItem,
          layout === 'compact' && styles.statItemCompact,
        ]}
        onPress={isInteractive ? () => onStatPress(statType, value) : undefined}
        accessible={true}
        accessibilityRole={isInteractive ? 'button' : undefined}
        accessibilityLabel={`${config.title}: ${value}`}
        testID={`${testID}-${statType}`}
      >
        {showIcons && (
          <View
            style={[
              styles.iconContainer,
              layout === 'compact' && styles.iconContainerCompact,
              { backgroundColor: `${getStatColor(statType)}15` },
            ]}
          >
            <Feather
              name={config.icon}
              size={layout === 'compact' ? 18 : 22}
              color={getStatColor(statType)}
            />
          </View>
        )}

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.statValue,
              layout === 'compact' && styles.statValueCompact,
            ]}
          >
            {value.toLocaleString()}
          </Text>

          <Text
            style={[
              styles.statLabel,
              layout === 'compact' && styles.statLabelCompact,
            ]}
            numberOfLines={showSubtitles ? 2 : 1}
          >
            {config.title}
          </Text>

          {showSubtitles && (
            <Text style={styles.statSubtitle}>Total count</Text>
          )}
        </View>
      </StatWrapper>
    );
  };

  const statsArray: [StatType, number][] = [
    ['eventsAttended', stats.eventsAttended],
    ['eventsSaved', stats.eventsSaved],
    ['friendsConnected', stats.friendsConnected],
  ];

  // Always render each stat as its own row (3 separate rows)
  return (
    <View style={styles.container} testID={testID}>
      {statsArray.map(([statType, value], index) => (
        <View key={statType} style={styles.individualRow}>
          {renderStatItem(statType, value, index)}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[4],
  },
  individualRow: {
    marginBottom: spacing[3],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginBottom: spacing[3],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[25],
    borderRadius: 16,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    minHeight: 70,
    marginHorizontal: spacing[1],
  },
  statItemCompact: {
    padding: spacing[3],
    minHeight: 60,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  iconContainerCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing[2],
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.neutral[800],
    lineHeight: 24,
    marginBottom: spacing[1],
  },
  statValueCompact: {
    fontSize: 18,
    lineHeight: 20,
  },
  statLabel: {
    ...typography.caption,
    color: colors.neutral[600],
    lineHeight: 16,
  },
  statLabelCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  statSubtitle: {
    ...typography.caption,
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
});

export default ProfileStatsRowLayout;
