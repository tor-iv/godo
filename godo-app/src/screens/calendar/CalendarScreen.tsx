import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { COLORS, SPACING, FONT_SIZES, LAYOUT, SHADOWS } from '../../constants';
import { getCategoryEmoji, formatEventTime } from '../../data/mockEvents';
import { useEventsByCategory } from '../../context/AppContext';
import { Event } from '../../types';
import {
  CalendarGrid,
  WeekView,
  DayView,
  EventModal,
  CalendarViewToggle,
  DateNavigation,
  CalendarViewType,
} from '../../components/calendar';

type TabType = 'private' | 'public' | 'saved';

const EventItem = ({ event }: { event: Event }) => {
  const priceText =
    !event.price || event.price.min === 0
      ? 'Free'
      : event.price.min === event.price.max
        ? `$${event.price.min}`
        : `$${event.price.min} - $${event.price.max}`;

  return (
    <View style={styles.eventItem}>
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: COLORS.LIGHT_PURPLE },
            ]}
          >
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
  const [currentView, setCurrentView] = useState<CalendarViewType>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDateString, setSelectedDateString] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const eventsByCategory = useEventsByCategory();

  // Get events based on active tab
  const getFilteredEvents = () => {
    switch (activeTab) {
      case 'private':
        return eventsByCategory.private;
      case 'public':
        return eventsByCategory.public;
      case 'saved':
        return eventsByCategory.saved;
      default:
        return [];
    }
  };

  const filteredEvents = getFilteredEvents();

  const handleEventPress = (event: Event) => {
    setSelectedEvent(event);
    setIsEventModalVisible(true);
  };

  const handleDateSelect = (date: string | Date) => {
    if (typeof date === 'string') {
      setSelectedDateString(date);
      setSelectedDate(new Date(date));
    } else {
      setSelectedDate(date);
      setSelectedDateString(format(date, 'yyyy-MM-dd'));
    }
  };

  const handleTodayPress = () => {
    const today = new Date();
    setSelectedDate(today);
    setSelectedDateString(format(today, 'yyyy-MM-dd'));
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <EventItem event={item} />
  );

  const renderCalendarView = () => {
    switch (currentView) {
      case 'month':
        return (
          <CalendarGrid
            events={filteredEvents}
            selectedDate={selectedDateString}
            onDateSelect={handleDateSelect}
            onEventPress={handleEventPress}
          />
        );
      case 'week':
        return (
          <WeekView
            events={filteredEvents}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onEventPress={handleEventPress}
          />
        );
      case 'day':
        return (
          <DayView
            events={filteredEvents}
            selectedDate={selectedDate}
            onEventPress={handleEventPress}
          />
        );
      case 'agenda':
        return renderAgendaView();
      default:
        return null;
    }
  };

  const renderAgendaView = () => {
    return (
      <View style={styles.agendaContainer}>
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No events yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Start swiping on events to see them here!
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredEvents}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.eventsList}
          />
        )}
      </View>
    );
  };

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

      <CalendarViewToggle
        activeView={currentView}
        onViewChange={setCurrentView}
      />

      <DateNavigation
        currentDate={selectedDate}
        viewType={currentView}
        onDateChange={handleDateSelect}
        onTodayPress={handleTodayPress}
      />

      <View style={styles.tabSection}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'private' && styles.tabActive]}
            onPress={() => setActiveTab('private')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'private' && styles.tabTextActive,
              ]}
            >
              🔒 Private
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'public' && styles.tabActive]}
            onPress={() => setActiveTab('public')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'public' && styles.tabTextActive,
              ]}
            >
              🌍 Public
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
            onPress={() => setActiveTab('saved')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'saved' && styles.tabTextActive,
              ]}
            >
              💾 Later
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {renderCalendarView()}
      </View>

      <EventModal
        event={selectedEvent}
        visible={isEventModalVisible}
        onClose={() => {
          setIsEventModalVisible(false);
          setSelectedEvent(null);
        }}
      />
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
    flexDirection: 'row',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM - 2,
    marginHorizontal: SPACING.XS,
    borderRadius: LAYOUT.BORDER_RADIUS_LARGE,
    backgroundColor: COLORS.OFF_WHITE,
    alignItems: 'center',
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
  },
  agendaContainer: {
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
    marginBottom: SPACING.XS,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: FONT_SIZES.SM * 1.4,
  },
});