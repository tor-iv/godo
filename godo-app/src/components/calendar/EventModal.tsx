import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Linking,
} from 'react-native';
import { format } from 'date-fns';
import { COLORS, SPACING, FONT_SIZES, LAYOUT, SHADOWS } from '../../constants';
import { Event, EventCategory } from '../../types';
import { getCategoryIcon } from '../../data/mockEvents';

interface EventModalProps {
  event: Event | null;
  visible: boolean;
  onClose: () => void;
}

const getCategoryColor = (category: EventCategory): string => {
  switch (category) {
    case EventCategory.NETWORKING:
      return COLORS.SECONDARY;
    case EventCategory.CULTURE:
      return '#EC4899';
    case EventCategory.FITNESS:
      return COLORS.SUCCESS;
    case EventCategory.FOOD:
      return COLORS.WARNING;
    case EventCategory.NIGHTLIFE:
      return COLORS.ACCENT;
    case EventCategory.OUTDOOR:
      return '#10B981';
    case EventCategory.PROFESSIONAL:
      return '#3B82F6';
    default:
      return COLORS.PRIMARY;
  }
};

const ActionButton = ({ 
  title, 
  onPress, 
  color = COLORS.SECONDARY, 
  outline = false 
}: {
  title: string;
  onPress: () => void;
  color?: string;
  outline?: boolean;
}) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      outline 
        ? { borderColor: color, borderWidth: 2, backgroundColor: 'transparent' }
        : { backgroundColor: color }
    ]}
    onPress={onPress}
  >
    <Text style={[
      styles.actionButtonText,
      outline ? { color } : { color: COLORS.WHITE }
    ]}>
      {title}
    </Text>
  </TouchableOpacity>
);

export default function EventModal({ event, visible, onClose }: EventModalProps) {
  if (!event) return null;

  const categoryColor = getCategoryColor(event.category);
  const priceText = !event.price || event.price.min === 0
    ? 'Free'
    : event.price.min === event.price.max
      ? `$${event.price.min}`
      : `$${event.price.min} - $${event.price.max}`;

  const handleGetTickets = () => {
    if (event.ticketUrl) {
      Linking.openURL(event.ticketUrl);
    }
  };

  const handleGetDirections = () => {
    const { lat, lng } = event.location.coordinates;
    const url = `https://maps.apple.com/?q=${lat},${lng}`;
    Linking.openURL(url);
  };

  const handleShare = () => {
    // In a real app, you'd implement native sharing
    console.log('Share event:', event.title);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={[styles.header, { backgroundColor: categoryColor }]}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                
                <View style={styles.headerContent}>
                  <Text style={styles.categoryLabel}>
                    {event.category.charAt(0).toUpperCase()}
                  </Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>
                      {event.category.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Content */}
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.titleSection}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventPrice}>{priceText}</Text>
                </View>

                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <View style={styles.iconContainer}><Text style={styles.infoIconText}>Date</Text></View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Date & Time</Text>
                      <Text style={styles.infoValue}>
                        {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
                      </Text>
                      <Text style={styles.infoValue}>
                        {format(new Date(event.date), 'h:mm a')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.iconContainer}><Text style={styles.infoIconText}>Location</Text></View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Location</Text>
                      <Text style={styles.infoValue}>{event.location.name}</Text>
                      <Text style={styles.infoAddress}>{event.location.address}</Text>
                    </View>
                  </View>

                  {event.attendeeCount && (
                    <View style={styles.infoRow}>
                      <View style={styles.iconContainer}><Text style={styles.infoIconText}>People</Text></View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Attendance</Text>
                        <Text style={styles.infoValue}>
                          {event.attendeeCount} attending
                          {event.capacity && ` • ${event.capacity} capacity`}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {event.description && (
                  <View style={styles.descriptionSection}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.description}>{event.description}</Text>
                  </View>
                )}

                {event.tags && event.tags.length > 0 && (
                  <View style={styles.tagsSection}>
                    <Text style={styles.sectionTitle}>Tags</Text>
                    <View style={styles.tagsContainer}>
                      {event.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actionSection}>
                <View style={styles.actionRow}>
                  <ActionButton
                    title="Directions"
                    onPress={handleGetDirections}
                    outline
                  />
                  <ActionButton
                    title="Share"
                    onPress={handleShare}
                    outline
                  />
                </View>
                
                {event.ticketUrl && (
                  <ActionButton
                    title="Get Tickets"
                    onPress={handleGetTickets}
                    color={categoryColor}
                  />
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: LAYOUT.BORDER_RADIUS_LARGE,
    borderTopRightRadius: LAYOUT.BORDER_RADIUS_LARGE,
    maxHeight: '90%',
    ...SHADOWS.LARGE,
  },
  header: {
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    borderTopLeftRadius: LAYOUT.BORDER_RADIUS_LARGE,
    borderTopRightRadius: LAYOUT.BORDER_RADIUS_LARGE,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.MD,
    right: SPACING.MD,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: SPACING.SM,
  },
  categoryLabel: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: SPACING.SM,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: LAYOUT.BORDER_RADIUS_SMALL,
  },
  categoryText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.XS,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
  },
  titleSection: {
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  eventTitle: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
    marginBottom: SPACING.XS,
    lineHeight: FONT_SIZES.XXL * 1.2,
  },
  eventPrice: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.SECONDARY,
  },
  infoSection: {
    paddingVertical: SPACING.MD,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  iconContainer: {
    marginRight: SPACING.SM,
    marginTop: 2,
  },
  infoIconText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.SECONDARY,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoIcon: {
    fontSize: FONT_SIZES.LG,
    marginRight: SPACING.SM,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_LIGHT,
    fontWeight: '500',
    marginBottom: SPACING.XS,
  },
  infoValue: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_DARK,
    fontWeight: '500',
  },
  infoAddress: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_LIGHT,
    marginTop: 2,
  },
  descriptionSection: {
    paddingVertical: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_LIGHT,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
    marginBottom: SPACING.SM,
  },
  description: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_MEDIUM,
    lineHeight: FONT_SIZES.MD * 1.5,
  },
  tagsSection: {
    paddingVertical: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_LIGHT,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.XS,
  },
  tag: {
    backgroundColor: COLORS.LIGHT_GRAY,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: LAYOUT.BORDER_RADIUS_SMALL,
  },
  tagText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.ACCENT,
    fontWeight: '500',
  },
  actionSection: {
    padding: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_LIGHT,
    backgroundColor: COLORS.OFF_WHITE,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.SM,
    marginBottom: SPACING.SM,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.MD,
    borderRadius: LAYOUT.BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.SMALL,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
});