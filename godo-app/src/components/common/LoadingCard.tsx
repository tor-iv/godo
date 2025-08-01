import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

const LoadingCard: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Image placeholder */}
        <View style={styles.imagePlaceholder} />

        {/* Content placeholder */}
        <View style={styles.content}>
          {/* Title placeholder */}
          <View style={styles.titlePlaceholder} />

          {/* Description placeholder */}
          <View style={styles.descriptionPlaceholder} />

          {/* Meta info placeholder */}
          <View style={styles.metaContainer}>
            <View style={styles.badgePlaceholder} />
            <View style={styles.pricePlaceholder} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: '60%',
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  titlePlaceholder: {
    height: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 8,
  },
  descriptionPlaceholder: {
    height: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    width: '80%',
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgePlaceholder: {
    width: 80,
    height: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  pricePlaceholder: {
    width: 60,
    height: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
});

export default LoadingCard;
