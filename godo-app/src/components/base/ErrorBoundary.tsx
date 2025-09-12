import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../design';
import { Heading2, Body } from './Typography';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // ErrorBoundary caught an error - logging for debugging in development only
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container} accessibilityRole="alert">
          <Heading2 style={styles.title}>Something went wrong</Heading2>
          <Body style={styles.message}>
            We encountered an unexpected error. Please try again.
          </Body>
          <Button
            title="Try Again"
            onPress={this.handleRetry}
            variant="primary"
            style={styles.button}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
    backgroundColor: colors.neutral[0],
  },
  title: {
    marginBottom: spacing[3],
    textAlign: 'center',
    color: colors.error[500],
  },
  message: {
    textAlign: 'center',
    color: colors.neutral[600],
    marginBottom: spacing[6],
    maxWidth: 300,
  },
  button: {
    minWidth: 120,
  },
});
