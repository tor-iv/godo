import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, LAYOUT, SHADOWS } from '../../constants';
import { FeedMode } from '../../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const EventCard = () => (
  <Animated.View style={styles.eventCard}>
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800' }}
      style={styles.cardImage}
      imageStyle={styles.cardImageStyle}
    >
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>NIGHTLIFE</Text>
            </View>
            <Text style={styles.dateText}>Tonight • 9:00 PM</Text>
          </View>
          
          <View style={styles.cardFooter}>
            <Text style={styles.eventTitle}>Rooftop Party at 230 Fifth</Text>
            <Text style={styles.eventLocation}>📍 Midtown Manhattan</Text>
            <Text style={styles.eventPrice}>$25 - $45</Text>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
    
    <View style={styles.swipeHints}>
      <View style={styles.swipeHint}>
        <Text style={styles.swipeHintText}>↑ Public</Text>
      </View>
      <View style={styles.swipeHint}>
        <Text style={styles.swipeHintText}>← Pass</Text>
      </View>
      <View style={styles.swipeHint}>
        <Text style={styles.swipeHintText}>→ Private</Text>
      </View>
      <View style={styles.swipeHint}>
        <Text style={styles.swipeHintText}>↓ Later</Text>
      </View>
    </View>
  </Animated.View>
);

export default function DiscoverScreen() {
  const [feedMode, setFeedMode] = useState<FeedMode>(FeedMode.HAPPENING_NOW);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
        style={styles.gradientHeader}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Discover</Text>
            <Text style={styles.headerSubtitle}>Find your next adventure</Text>
            
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  feedMode === FeedMode.HAPPENING_NOW && styles.toggleButtonActive,
                ]}
                onPress={() => setFeedMode(FeedMode.HAPPENING_NOW)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    feedMode === FeedMode.HAPPENING_NOW && styles.toggleTextActive,
                  ]}
                >
                  🔥 Happening Now
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  feedMode === FeedMode.PLANNING_AHEAD && styles.toggleButtonActive,
                ]}
                onPress={() => setFeedMode(FeedMode.PLANNING_AHEAD)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    feedMode === FeedMode.PLANNING_AHEAD && styles.toggleTextActive,
                  ]}
                >
                  📅 Planning Ahead
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        <EventCard />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  gradientHeader: {
    paddingBottom: SPACING.LG,
  },
  header: {
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.MD,
  },
  headerTitle: {
    fontSize: FONT_SIZES.XXXL,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: SPACING.XS,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.MD,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: SPACING.LG,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: LAYOUT.BORDER_RADIUS_LARGE,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: SPACING.SM + 2,
    paddingHorizontal: SPACING.MD,
    borderRadius: LAYOUT.BORDER_RADIUS_LARGE - 4,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: COLORS.WHITE,
    ...SHADOWS.SMALL,
  },
  toggleText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  toggleTextActive: {
    color: COLORS.PRIMARY_PURPLE,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
  },
  eventCard: {
    width: screenWidth - SPACING.LG * 2,
    height: screenHeight * 0.7,
    borderRadius: LAYOUT.BORDER_RADIUS_LARGE,
    overflow: 'hidden',
    ...SHADOWS.LARGE,
  },
  cardImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardImageStyle: {
    borderRadius: LAYOUT.BORDER_RADIUS_LARGE,
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SPACING.LG,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    alignItems: 'flex-start',
    paddingTop: SPACING.SM,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: LAYOUT.BORDER_RADIUS_SMALL,
    marginBottom: SPACING.SM,
  },
  categoryText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: 'bold',
    color: COLORS.PRIMARY_PURPLE,
    letterSpacing: 1,
  },
  dateText: {
    fontSize: FONT_SIZES.SM,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  cardFooter: {
    alignItems: 'flex-start',
  },
  eventTitle: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: SPACING.XS,
    lineHeight: FONT_SIZES.XXL * 1.2,
  },
  eventLocation: {
    fontSize: FONT_SIZES.MD,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: SPACING.XS,
  },
  eventPrice: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  swipeHints: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    transform: [{ translateY: -20 }],
  },
  swipeHint: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: LAYOUT.BORDER_RADIUS_SMALL,
  },
  swipeHintText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.WHITE,
    fontWeight: '500',
  },
});