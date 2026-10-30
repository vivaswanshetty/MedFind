import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { useIsFocused } from 'expo-router';

interface AnimatedScreenTransitionProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  duration?: number;
}

/**
 * AnimatedScreenTransition provides smooth, native iOS-grade fluid entrance transitions
 * when switching between tabs or mounting screens. Re-triggers smoothly on tab focus.
 */
export function AnimatedScreenTransition({
  children,
  style,
  duration = 260,
}: AnimatedScreenTransitionProps) {
  const isFocused = useIsFocused();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const scaleAnim = useRef(new Animated.Value(0.972)).current;
  const tiltAnim = useRef(new Animated.Value(3)).current;

  useEffect(() => {
    if (isFocused) {
      fadeAnim.setValue(0);
      slideAnim.setValue(14);
      scaleAnim.setValue(0.972);
      tiltAnim.setValue(3);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 85,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 85,
          useNativeDriver: true,
        }),
        Animated.spring(tiltAnim, {
          toValue: 0,
          friction: 8,
          tension: 85,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocused]);

  const rotateX = tiltAnim.interpolate({
    inputRange: [0, 10],
    outputRange: ['0deg', '10deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: fadeAnim,
          transform: [
            { perspective: 1000 },
            { translateY: slideAnim },
            { scale: scaleAnim },
            { rotateX },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
