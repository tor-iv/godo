import { format, isToday, isTomorrow, isThisWeek, isThisYear } from 'date-fns';

export const formatEventDate = (date: Date | string): string => {
  const eventDate = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(eventDate)) {
    return `Today, ${format(eventDate, 'h:mm a')}`;
  }
  
  if (isTomorrow(eventDate)) {
    return `Tomorrow, ${format(eventDate, 'h:mm a')}`;
  }
  
  if (isThisWeek(eventDate)) {
    return format(eventDate, 'EEEE, h:mm a'); // "Monday, 6:30 PM"
  }
  
  if (isThisYear(eventDate)) {
    return format(eventDate, 'MMM d, h:mm a'); // "Aug 24, 6:30 PM"
  }
  
  return format(eventDate, 'MMM d, yyyy h:mm a'); // "Aug 24, 2024 6:30 PM"
};

export const formatEventDateShort = (date: Date | string): string => {
  const eventDate = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(eventDate)) {
    return 'Today';
  }
  
  if (isTomorrow(eventDate)) {
    return 'Tomorrow';
  }
  
  if (isThisWeek(eventDate)) {
    return format(eventDate, 'EEE'); // "Mon"
  }
  
  if (isThisYear(eventDate)) {
    return format(eventDate, 'MMM d'); // "Aug 24"
  }
  
  return format(eventDate, 'MMM d, yy'); // "Aug 24, 24"
};

export const formatEventTime = (date: Date | string): string => {
  const eventDate = typeof date === 'string' ? new Date(date) : date;
  return format(eventDate, 'h:mm a'); // "6:30 PM"
};

export const getEventDayOfWeek = (date: Date | string): string => {
  const eventDate = typeof date === 'string' ? new Date(date) : date;
  return format(eventDate, 'EEEE'); // "Monday"
};

export const isEventUpcoming = (date: Date | string): boolean => {
  const eventDate = typeof date === 'string' ? new Date(date) : date;
  return eventDate > new Date();
};

export const isEventToday = (date: Date | string): boolean => {
  const eventDate = typeof date === 'string' ? new Date(date) : date;
  return isToday(eventDate);
};

export const isEventThisWeek = (date: Date | string): boolean => {
  const eventDate = typeof date === 'string' ? new Date(date) : date;
  return isThisWeek(eventDate);
};