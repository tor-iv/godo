import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';

export type RootTabParamList = {
  Discover: undefined;
  MyEvents: undefined;
};

export type DiscoverStackParamList = {
  DiscoverFeed: undefined;
  EventDetail: { eventId: string };
  Profile: undefined;
};

export type MyEventsStackParamList = {
  Calendar: undefined;
  SavedEvents: undefined;
  LikedEvents: undefined;
  EventDetail: { eventId: string };
};

export type DiscoverScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Discover'>,
  StackScreenProps<DiscoverStackParamList>
>;

export type MyEventsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'MyEvents'>,
  StackScreenProps<MyEventsStackParamList>
>;