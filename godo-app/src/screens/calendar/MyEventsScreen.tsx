import React from 'react';
import { StyleSheet } from 'react-native';
import { Container, Heading1, Body, Button } from '../../components/base';
import { spacing, colors } from '../../design';

export const MyEventsScreen = () => {
  return (
    <Container variant="screenCentered">
      <Heading1 align="center" style={styles.title}>
        My Events
      </Heading1>
      <Body color={colors.neutral[500]} align="center" style={styles.subtitle}>
        Your personal calendar and saved events
      </Body>
      <Button 
        title="Coming Soon" 
        onPress={() => {}} 
        style={styles.button}
        disabled
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing[2],
  },
  subtitle: {
    marginBottom: spacing[8],
  },
  button: {
    minWidth: 200,
  },
});