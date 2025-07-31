import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, LAYOUT, SHADOWS } from '../../constants';

type TabType = 'private' | 'public' | 'saved';

const EventItem = ({ title, date, location, category }: {
  title: string;
  date: string;
  location: string;
  category: string;
}) => (
  <View style={styles.eventItem}>
    <View style={styles.eventContent}>
      <View style={styles.eventHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: COLORS.LIGHT_PURPLE }]}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
        <Text style={styles.eventDate}>{date}</Text>
      </View>
      <Text style={styles.eventTitle}>{title}</Text>
      <Text style={styles.eventLocation}>📍 {location}</Text>
    </View>
    <View style={styles.eventActions}>
      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionButtonText}>View</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const mockEvents = [
  { id: '1', title: 'Rooftop Party at 230 Fifth', date: 'Tonight • 9:00 PM', location: 'Midtown Manhattan', category: 'NIGHTLIFE' },
  { id: '2', title: 'Art Gallery Opening', date: 'Tomorrow • 7:00 PM', location: 'SoHo', category: 'CULTURE' },
  { id: '3', title: 'Morning Yoga Class', date: 'Saturday • 8:00 AM', location: 'Central Park', category: 'FITNESS' },
];

export default function CalendarScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('private');

  const renderEventItem = ({ item }: { item: typeof mockEvents[0] }) => (
    <EventItem
      title={item.title}
      date={item.date}
      location={item.location}
      category={item.category}
    />
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
        style={styles.gradientHeader}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Events</Text>
            <Text style={styles.headerSubtitle}>Your curated event collection</Text>
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
              🔒 Private Calendar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'public' && styles.tabActive]}
            onPress={() => setActiveTab('public')}
          >
            <Text style={[styles.tabText, activeTab === 'public' && styles.tabTextActive]}>
              🌍 Public Calendar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
            onPress={() => setActiveTab('saved')}
          >
            <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
              💾 Saved Later
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.content}>
        <FlatList
          data={mockEvents}
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
  },
  tabSection: {
    backgroundColor: COLORS.WHITE,
    ...SHADOWS.SMALL,
  },
  tabContainer: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
  },
  tab: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
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
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_MEDIUM,
  },
  tabTextActive: {
    color: COLORS.WHITE,
  },
  content: {
    flex: 1,
    paddingTop: SPACING.MD,
  },
  eventsList: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.XL,
  },
  eventItem: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: LAYOUT.BORDER_RADIUS,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.CARD,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.SM,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: LAYOUT.BORDER_RADIUS_SMALL,
  },
  categoryText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: 'bold',
    color: COLORS.DARK_PURPLE,
    letterSpacing: 0.5,
  },
  eventDate: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_LIGHT,
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
    marginBottom: SPACING.XS,
    lineHeight: FONT_SIZES.LG * 1.2,
  },
  eventLocation: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_LIGHT,
  },
  eventActions: {
    marginLeft: SPACING.MD,
  },
  actionButton: {
    backgroundColor: COLORS.PRIMARY_PURPLE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: LAYOUT.BORDER_RADIUS_SMALL,
    ...SHADOWS.SMALL,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
});