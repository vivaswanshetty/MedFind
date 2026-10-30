import { useRef, useCallback, useMemo } from 'react';
import {
  PanResponder,
  LayoutChangeEvent,
  GestureResponderHandlers,
} from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
  SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

/**
 * Configuration options for the 3D tilt hook.
 */
export interface Use3DTiltOptions {
  /**
   * Maximum tilt angle in degrees.
   * @default 8
   */
  maxDegrees?: number;

  /**
   * Perspective distance for 3D depth transform.
   * @default 800
   */
  perspective?: number;

  /**
   * Whether tilt touch tracking is disabled.
   * @default false
   */
  disabled?: boolean;

  /**
   * Optional press handler called when the card receives a tap without dragging.
   */
  onPress?: () => void;
}

/**
 * Return type of the use3DTilt hook.
 */
export interface Use3DTiltResult {
  /** Handlers to attach to the view's pan responder props */
  panHandlers: GestureResponderHandlers | Record<string, never>;
  /** Reanimated animated style with perspective, rotateX, and rotateY */
  animatedStyle: any;
  /** onLayout callback to measure element dimensions */
  onLayout: (event: LayoutChangeEvent) => void;
  /** Reanimated shared value for X-axis rotation in degrees */
  rotateX: SharedValue<number>;
  /** Reanimated shared value for Y-axis rotation in degrees */
  rotateY: SharedValue<number>;
}

const DEFAULT_MAX_DEGREES = 8;
const DEFAULT_PERSPECTIVE = 800;

/**
 * Custom React hook for 3D tilt interaction on cards.
 *
 * Tilts the card toward the touch point based on relative finger position:
 * - Touching the top tilts the top inward (positive rotateX in RN coordinates)
 * - Touching the right tilts the right edge inward (positive rotateY in RN coordinates)
 * - Smoothly springs back to flat (0deg) upon touch release or cancellation.
 * - Automatically disables animations and returns static values when reduced motion is preferred.
 *
 * @param maxDegreesOrOptions Maximum tilt angle in degrees, or a Use3DTiltOptions object.
 * @returns PanResponder handlers, reanimated animatedStyle, layout callback, and shared values.
 */
export function use3DTilt(
  maxDegreesOrOptions?: number | Use3DTiltOptions
): Use3DTiltResult {
  const options: Use3DTiltOptions = useMemo(() => {
    if (typeof maxDegreesOrOptions === 'number') {
      return { maxDegrees: maxDegreesOrOptions };
    }
    return maxDegreesOrOptions || {};
  }, [maxDegreesOrOptions]);

  const maxDegrees = options.maxDegrees ?? DEFAULT_MAX_DEGREES;
  const perspective = options.perspective ?? DEFAULT_PERSPECTIVE;
  const disabled = options.disabled ?? false;
  const onPress = options.onPress;

  const shouldReduceMotion = useReducedMotion();

  // Reanimated shared values for smooth 3D rotations
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  // Layout dimensions of the card
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const touchStartRef = useRef<{ time: number; x: number; y: number }>({
    time: 0,
    x: 0,
    y: 0,
  });

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    dimensionsRef.current = { width, height };
  }, []);

  const resetTilt = useCallback(() => {
    'worklet';
    rotateX.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
      mass: 0.8,
    });
    rotateY.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
      mass: 0.8,
    });
  }, [rotateX, rotateY]);

  const panResponder = useMemo(() => {
    if (shouldReduceMotion || disabled) {
      return null;
    }

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderTerminationRequest: () => true,

      onPanResponderGrant: (evt) => {
        touchStartRef.current = {
          time: Date.now(),
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
        };

        // Light haptic feedback on touch engagement
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

        const { width, height } = dimensionsRef.current;
        if (width <= 0 || height <= 0) return;

        const centerX = width / 2;
        const centerY = height / 2;
        const normX = Math.max(-1, Math.min(1, (evt.nativeEvent.locationX - centerX) / centerX));
        const normY = Math.max(-1, Math.min(1, (evt.nativeEvent.locationY - centerY) / centerY));

        // Tilt toward the touch point
        rotateX.value = withSpring(-normY * maxDegrees, {
          damping: 20,
          stiffness: 240,
          mass: 0.5,
        });
        rotateY.value = withSpring(normX * maxDegrees, {
          damping: 20,
          stiffness: 240,
          mass: 0.5,
        });
      },

      onPanResponderMove: (evt) => {
        const { width, height } = dimensionsRef.current;
        if (width <= 0 || height <= 0) return;

        const centerX = width / 2;
        const centerY = height / 2;
        const normX = Math.max(-1, Math.min(1, (evt.nativeEvent.locationX - centerX) / centerX));
        const normY = Math.max(-1, Math.min(1, (evt.nativeEvent.locationY - centerY) / centerY));

        rotateX.value = withSpring(-normY * maxDegrees, {
          damping: 22,
          stiffness: 260,
          mass: 0.4,
        });
        rotateY.value = withSpring(normX * maxDegrees, {
          damping: 22,
          stiffness: 260,
          mass: 0.4,
        });
      },

      onPanResponderRelease: (evt, gestureState) => {
        resetTilt();

        // Check if the interaction was a clean tap (minimal drag & short duration)
        const duration = Date.now() - touchStartRef.current.time;
        const distance = Math.hypot(gestureState.dx, gestureState.dy);
        if (duration < 500 && distance < 8) {
          onPress?.();
        }
      },

      onPanResponderTerminate: () => {
        resetTilt();
      },
    });
  }, [shouldReduceMotion, disabled, maxDegrees, onPress, resetTilt, rotateX, rotateY]);

  const animatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion || disabled) {
      return {
        transform: [
          { perspective },
          { rotateX: '0deg' },
          { rotateY: '0deg' },
        ],
      };
    }

    return {
      transform: [
        { perspective },
        { rotateX: `${rotateX.value}deg` },
        { rotateY: `${rotateY.value}deg` },
      ],
    };
  });

  return {
    panHandlers: panResponder ? panResponder.panHandlers : {},
    animatedStyle,
    onLayout,
    rotateX,
    rotateY,
  };
}
