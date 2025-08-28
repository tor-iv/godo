export const formatPrice = (min?: number, max?: number): string => {
  // Handle edge cases more defensively
  const minPrice = typeof min === 'number' && !isNaN(min) ? min : 0;
  const maxPrice = typeof max === 'number' && !isNaN(max) ? max : null;

  if (minPrice === 0) return 'Free';
  if (!maxPrice || minPrice === maxPrice) return `$${minPrice}`;
  return `$${minPrice} - $${maxPrice}`;
};

export const formatAttendees = (
  current?: number,
  capacity?: number
): string => {
  if (!current && !capacity) return '';

  if (current && !capacity) {
    return `${current} attending`;
  }

  if (current && capacity) {
    return `${current} of ${capacity} attending`;
  }

  if (capacity && !current) {
    return `Up to ${capacity} people`;
  }

  return '';
};

export const formatFriendsAttending = (count?: number): string => {
  // Handle edge cases more defensively
  const friendCount =
    typeof count === 'number' && !isNaN(count) && count > 0 ? count : 0;

  if (friendCount === 0) return '';
  if (friendCount === 1) return '1 friend interested';
  return `${friendCount} friends interested`;
};

export const formatEventCapacity = (
  current?: number,
  capacity?: number
): {
  text: string;
  percentage: number;
  status: 'low' | 'medium' | 'high' | 'full';
} => {
  if (!current || !capacity) {
    return {
      text: '',
      percentage: 0,
      status: 'low',
    };
  }

  const percentage = Math.round((current / capacity) * 100);

  let status: 'low' | 'medium' | 'high' | 'full';
  if (percentage >= 100) {
    status = 'full';
  } else if (percentage >= 80) {
    status = 'high';
  } else if (percentage >= 50) {
    status = 'medium';
  } else {
    status = 'low';
  }

  return {
    text: `${current}/${capacity} (${percentage}%)`,
    percentage,
    status,
  };
};

export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  }

  return `${Math.round(distanceKm)}km`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export const getCategoryDisplayName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    NETWORKING: 'Networking',
    CULTURE: 'Culture',
    FITNESS: 'Fitness',
    FOOD: 'Food & Drink',
    NIGHTLIFE: 'Nightlife',
    OUTDOOR: 'Outdoor',
    PROFESSIONAL: 'Professional',
  };

  return categoryMap[category] || category;
};

export const getCategoryColor = (category: string): string => {
  const categoryColors: Record<string, string> = {
    NETWORKING: '#3b82f6', // Blue
    CULTURE: '#8b5cf6', // Purple
    FITNESS: '#10b981', // Green
    FOOD: '#f59e0b', // Orange
    NIGHTLIFE: '#ec4899', // Pink
    OUTDOOR: '#059669', // Teal
    PROFESSIONAL: '#6366f1', // Indigo
  };

  return categoryColors[category] || '#71717a'; // Default gray
};
