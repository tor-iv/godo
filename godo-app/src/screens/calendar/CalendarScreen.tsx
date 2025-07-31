import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, LAYOUT, SHADOWS } from '../../constants';
import { mockEvents, getCategoryEmoji, formatEventTime } from '../../data/mockEvents';

type TabType = 'private' | 'public' | 'saved';

const EventItem = ({ event }: { event: typeof mockEvents[0] }) => {
  const priceText = !event.price || event.price.min === 0 
    ? 'Free' 
    : event.price.min === event.price.max 
      ? `$${event.price.min}`
      : `$${event.price.min} - $${event.price.max}`;

  return (
    <View style={styles.eventItem}>
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: COLORS.LIGHT_PURPLE }]}>
            <Text style={styles.categoryText}>
              {getCategoryEmoji(event.category)} {event.category.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDate}>{formatEventTime(event.date)}</Text>
        <Text style={styles.eventLocation}>📍 {event.location.name}</Text>
        <Text style={styles.eventPrice}>{priceText}</Text>
      </View>
      <View style={styles.eventActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function CalendarScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('private');

  // Filter events based on active tab (for demo purposes, showing same events)
  const filteredEvents = mockEvents.slice(0, activeTab === 'private' ? 3 : activeTab === 'public' ? 2 : 4);

  const renderEventItem = ({ item }: { item: typeof mockEvents[0] }) => (
    <EventItem event={item} />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
        style={styles.gradientHeader}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Events</Text>
            <Text style={styles.headerSubtitle}>Your curated collection</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.tabSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContainer}
        >
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'private' && styles.tabActive]}
            onPress={() => setActiveTab('private')}
          >
            <Text style={[styles.tabText, activeTab === 'private' && styles.tabTextActive]}>
              🔒 Private
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'public' && styles.tabActive]}
            onPress={() => setActiveTab('public')}
          >
            <Text style={[styles.tabText, activeTab === 'public' && styles.tabTextActive]}>
              🌍 Public
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
            onPress={() => setActiveTab('saved')}
          >
            <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
              💾 Later
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.content}>
        <FlatList
          data={filteredEvents}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.eventsList}
        />
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
    paddingBottom: SPACING.MD,
  },
  header: {
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.SM,
  },
  headerTitle: {
    fontSize: FONT_SIZES.XXL + 4,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: SPACING.XS,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.SM,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabSection: {
    backgroundColor: COLORS.WHITE,
    ...SHADOWS.SMALL,
  },
  tabContainer: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
  },
  tab: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM - 2,
    marginRight: SPACING.SM,
    borderRadius: LAYOUT.BORDER_RADIUS_LARGE,
    backgroundColor: COLORS.OFF_WHITE,
    ...SHADOWS.SMALL,
  },
  tabActive: {
    backgroundColor: COLORS.PRIMARY_PURPLE,
    ...SHADOWS.MEDIUM,
  },
  tabText: {
    fontSize: FONT_SIZES.XS + 1,
    fontWeight: '600',
    color: COLORS.TEXT_MEDIUM,
  },
  tabTextActive: {
    color: COLORS.WHITE,
  },
  content: {
    flex: 1,
    paddingTop: SPACING.SM,
  },
  eventsList: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.XL,
  },
  eventItem: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: LAYOUT.BORDER_RADIUS,
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...SHADOWS.CARD,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    marginBottom: SPACING.XS,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.SM - 2,
    paddingVertical: SPACING.XS - 2,
    borderRadius: LAYOUT.BORDER_RADIUS_SMALL,
    alignSelf: 'flex-start',
    marginBottom: SPACING.XS,
  },
  categoryText: {
    fontSize: FONT_SIZES.XS - 1,
    fontWeight: 'bold',
    color: COLORS.DARK_PURPLE,
    letterSpacing: 0.3,
  },
  eventTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
    marginBottom: SPACING.XS - 2,
    lineHeight: FONT_SIZES.MD * 1.3,
  },
  eventDate: {
    fontSize: FONT_SIZES.SM - 1,
    color: COLORS.TEXT_LIGHT,
    fontWeight: '500',
    marginBottom: SPACING.XS - 2,
  },
  eventLocation: {
    fontSize: FONT_SIZES.SM - 1,
    color: COLORS.TEXT_LIGHT,
    marginBottom: SPACING.XS - 2,
  },
  eventPrice: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.PRIMARY_PURPLE,
  },
  eventActions: {
    marginLeft: SPACING.SM,
    justifyContent: 'center',
  },
  actionButton: {
    backgroundColor: COLORS.PRIMARY_PURPLE,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: LAYOUT.BORDER_RADIUS_SMALL,
    ...SHADOWS.SMALL,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.XS + 1,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
});