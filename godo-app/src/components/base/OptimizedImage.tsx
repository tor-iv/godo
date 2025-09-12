import React, { useState, useCallback } from 'react';
import {
  Image,
  ImageProps,
  View,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { colors } from '../../design';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  uri: string;
  showLoader?: boolean;
  fallbackSource?: any;
  onLoadComplete?: () => void;
  onError?: (error: any) => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = React.memo(
  ({
    uri,
    style,
    showLoader = true,
    fallbackSource,
    onLoadComplete,
    onError,
    ...props
  }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = useCallback(() => {
      setIsLoading(false);
      onLoadComplete?.();
    }, [onLoadComplete]);

    const handleError = useCallback(
      (error: any) => {
        setIsLoading(false);
        setHasError(true);
        onError?.(error);
      },
      [onError]
    );

    const imageSource = hasError && fallbackSource ? fallbackSource : { uri };

    return (
      <View style={[styles.container, style]}>
        <Image
          {...props}
          source={imageSource}
          style={[styles.image, style]}
          onLoad={handleLoad}
          onError={handleError}
          // Performance optimizations
          fadeDuration={Platform.OS === 'android' ? 200 : 0}
          resizeMethod="resize"
          cache="force-cache"
        />

        {isLoading && showLoader && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={colors.primary[500]} />
          </View>
        )}
      </View>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
  },
});
