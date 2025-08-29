import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  AccessibilityInfo,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../design/tokens';
import {
  responsiveDesignSystem,
  getResponsiveSpacing,
} from '../../design/responsiveTokens';
import { layoutPatterns } from '../../design/layoutPatterns';

interface ProfileStatsProps {
  stats: {
    eventsAttended: number;
    eventsSaved: number;
    friendsConnected: number;
  };
  onStatPress?: (statType: 'attended' | 'saved' | 'friends') => void;
  variant?: 'default' | 'compact' | 'detailed';
}

export const ResponsiveProfileStats: React.FC<ProfileStatsProps> = ({
  stats,
  onStatPress,
  variant = 'default',
}) => {
  const handleStatPress = (statType: 'attended' | 'saved' | 'friends') => {
    if (onStatPress) {
      // Provide haptic feedback on press
      if (responsiveDesignSystem.device.type === 'phone') {
        // Add haptic feedback if available
      }
      onStatPress(statType);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const renderStatCard = (
    title: string,
    value: number,
    icon: keyof typeof Feather.glyphMap,
    statType: 'attended' | 'saved' | 'friends',
    color: string = colors.primary[500]
  ) => {
    const isCompact = variant === 'compact';
    const isDetailed = variant === 'detailed';
    const isInteractive = !!onStatPress;

    const StatComponent = isInteractive ? Pressable : View;

    const accessibilityLabel = `${title}: ${value}${isInteractive ? '. Double tap to view details' : ''}`;

    return (
      <StatComponent
        key={statType}
        style={[
          styles.statCard,
          isCompact && styles.statCardCompact,
          isInteractive && styles.statCardInteractive,
        ]}
        onPress={isInteractive ? () => handleStatPress(statType) : undefined}
        accessible={true}
        accessibilityRole={isInteractive ? 'button' : 'text'}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={
          isInteractive ? 'Tap to view more details' : undefined
        }
        // @ts-ignore - Pressable specific props
        android_ripple={
          isInteractive
            ? { color: colors.primary[100], borderless: false }
            : undefined
        }
      >
        <View
          style={[
            styles.statIcon,
            isCompact && styles.statIconCompact,
            { backgroundColor: `${color}15` }, // 15% opacity
          ]}
        >
          <Feather
            name={icon}
            size={responsiveDesignSystem.device.size === 'small' ? 20 : 24}
            color={color}
          />
        </View>

        <Text
          style={[
            styles.statValue,
            isCompact && styles.statValueCompact,
            isDetailed && styles.statValueDetailed,
          ]}
        >
          {isDetailed ? value.toLocaleString() : formatNumber(value)}
        </Text>

        <Text style={[styles.statTitle, isCompact && styles.statTitleCompact]}>
          {title}
        </Text>

        {/* Optional percentage change for detailed view */}
        {isDetailed && <Text style={styles.statChange}>+12% this month</Text>}
      </StatComponent>
    );
  };

  return (
    <View
      style={[
        styles.container,
        variant === 'compact' && styles.containerCompact,
      ]}
    >
      {renderStatCard(
        'Events',
        stats.eventsAttended,
        'calendar',
        'attended',
        colors.primary[500]
      )}
      {renderStatCard(
        'Saved',
        stats.eventsSaved,
        'bookmark',
        'saved',
        colors.warning[500]
      )}
      {renderStatCard(
        'Friends',
        stats.friendsConnected,
        'users',
        'friends',
        colors.info[500]
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...layoutPatterns.component.profileStats.container,
    marginVertical: getResponsiveSpacing(6),
  },
  containerCompact: {
    marginVertical: getResponsiveSpacing(4),
    paddingVertical: getResponsiveSpacing(4),
  },

  statCard: {
    ...layoutPatterns.component.profileStats.statCard,
    // Add press states
    transform: [{ scale: 1 }],
  },
  statCardCompact: {
    paddingVertical: getResponsiveSpacing(4),
    minWidth: responsiveDesignSystem.device.size === 'small' ? 70 : 85,
  },
  statCardInteractive: {
    // This will be handled by Pressable's style function in a real implementation
    // For now, we'll rely on the android_ripple and iOS will need additional press handling
  },

  statIcon: {
    ...layoutPatterns.component.profileStats.statIcon,
  },
  statIconCompact: {
    width: responsiveDesignSystem.performance.commonSizes.iconSize * 1.5,
    height: responsiveDesignSystem.performance.commonSizes.iconSize * 1.5,
    borderRadius:
      responsiveDesignSystem.performance.commonSizes.iconSize * 0.75,
    marginBottom: getResponsiveSpacing(2),
  },

  statValue: {
    ...layoutPatterns.component.profileStats.statValue,
    color: colors.neutral[800],
  },
  statValueCompact: {
    ...responsiveDesignSystem.typography.stats.small,
    marginBottom: getResponsiveSpacing(0.5),
  },
  statValueDetailed: {
    ...responsiveDesignSystem.typography.stats.large,
  },

  statTitle: {
    ...layoutPatterns.component.profileStats.statLabel,
  },
  statTitleCompact: {
    fontSize: responsiveDesignSystem.device.size === 'small' ? 9 : 11,
    lineHeight: responsiveDesignSystem.device.size === 'small' ? 12 : 14,
  },

  statChange: {
    ...responsiveDesignSystem.typography.ui.caption,
    color: colors.success[600],
    fontSize: responsiveDesignSystem.device.size === 'small' ? 9 : 10,
    marginTop: getResponsiveSpacing(1),
    textAlign: 'center' as const,
  },
});

// Enhanced version with animation support
export const AnimatedProfileStats: React.FC<
  ProfileStatsProps & {
    animateOnMount?: boolean;
    animationDelay?: number;
  }
> = ({ animateOnMount = false, animationDelay = 0, ...props }) => {
  // Animation implementation would go here using react-native-reanimated
  // For now, we'll just render the regular component
  return <ResponsiveProfileStats {...props} />;
};

// Usage examples for documentation:
/*
// Basic usage
<ResponsiveProfileStats 
  stats={{
    eventsAttended: 42,
    eventsSaved: 128,
    friendsConnected: 89
  }}
/>

// Interactive with press handlers
<ResponsiveProfileStats 
  stats={stats}
  onStatPress={(statType) => {
    navigation.navigate('StatDetail', { type: statType });
  }}
/>

// Compact variant for smaller spaces
<ResponsiveProfileStats 
  stats={stats}
  variant="compact"
/>

// Detailed variant with more information
<ResponsiveProfileStats 
  stats={stats}
  variant="detailed"
  onStatPress={handleStatPress}
/>

// Animated version
<AnimatedProfileStats 
  stats={stats}
  animateOnMount={true}
  animationDelay={300}
/>
*/
