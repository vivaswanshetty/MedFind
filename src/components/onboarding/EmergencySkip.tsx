import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/tokens';
import { EmergencySirenIcon } from '../icons/AppIcons';

export interface EmergencySkipProps {
  onSkip: () => void;
}

/**
 * EmergencySkip: An always-available, floating emergency bypass pill button.
 * Renders on top of every onboarding frame from the very first splash frame.
 */
export function EmergencySkip({ onSkip }: EmergencySkipProps) {
  const insets = useSafeAreaInsets();
  const { scheme, theme } = useTheme();

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const top = Math.max(insets.top, statusBarHeight) + 8;

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Gracefully ignore on unsupported devices or web
    }
    onSkip();
  };

  const isDark = scheme === 'dark';
  const urgentColor = isDark ? '#FF6B6B' : theme.urgentAccent;
  const bgColor = isDark ? 'rgba(45, 14, 18, 0.94)' : 'rgba(253, 241, 238, 0.96)';
  const borderColor = isDark ? 'rgba(255, 107, 107, 0.5)' : 'rgba(178, 59, 42, 0.4)';

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          top,
          right: 16,
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Emergency. Skip setup and open emergency help"
        style={({ pressed }) => [
          styles.pillButton,
          {
            backgroundColor: bgColor,
            borderColor: borderColor,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
      >
        <EmergencySirenIcon size={16} color={urgentColor} />
        <Text
          style={[
            styles.label,
            {
              color: urgentColor,
              fontFamily: typography.fontFamilyBold,
            },
          ]}
        >
          Emergency? Skip
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: 100000,
    elevation: 1000,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 1.5,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  label: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
});
