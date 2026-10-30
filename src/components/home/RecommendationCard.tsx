import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { Recommendation } from '../../lib/recommendations';
import { ColorPalette, typography } from '../../theme/tokens';
import { useLanguage } from '../../context/LanguageContext';
import {
  ChevronRightIcon,
  SearchIcon,
  HospitalIcon,
  ShieldCheckIcon,
  InfoIcon,
  CloseIcon,
  StaffBadgeIcon,
} from '../icons/AppIcons';

interface RecommendationCardProps {
  item: Recommendation;
  index: number;
  onPress?: (route: string) => void;
  onDismiss?: (id: string) => void;
  theme: ColorPalette;
}

export function RecommendationCard({
  item,
  index,
  onPress,
  onDismiss,
  theme,
}: RecommendationCardProps) {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const entrance = useSharedValue(shouldReduceMotion ? 1 : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      entrance.value = 1;
      return;
    }
    entrance.value = withDelay(
      index * 80,
      withSpring(1, { damping: 14, stiffness: 120 })
    );
  }, [shouldReduceMotion, index, entrance]);

  const animatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] };
    }
    return {
      opacity: entrance.value,
      transform: [
        { translateY: (1 - entrance.value) * 16 },
        { scale: 0.96 + 0.04 * entrance.value },
      ],
    };
  });

  const isInteractive = Boolean(item.route && onPress);

  const getIcon = () => {
    if (item.id === 'rec-finish-setup') {
      return <StaffBadgeIcon size={20} color={theme.primaryAccent} />;
    }
    switch (item.kind) {
      case 'feature':
        return <SearchIcon size={20} color={theme.primaryAccent} />;
      case 'category':
        return <HospitalIcon size={20} color={theme.primaryAccent} />;
      case 'tip':
      default:
        return <ShieldCheckIcon size={20} color={theme.primaryAccent} />;
    }
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable
        onPress={() => item.route && onPress?.(item.route)}
        disabled={!isInteractive}
        accessible={true}
        accessibilityRole={Platform.OS === 'web' || (item.dismissible && onDismiss) ? undefined : (isInteractive ? 'button' : 'text')}
        accessibilityLabel={`${item.title}: ${item.subtitle}`}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: pressed && isInteractive ? 0.92 : 1.0,
            transform: [{ scale: pressed && isInteractive ? 0.985 : 1.0 }],
          },
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: theme.badgeBackground,
                borderColor: theme.badgeBorder,
              },
            ]}
          >
            {getIcon()}
          </View>

          <View style={styles.headerTextGroup}>
            <Text
              style={[
                styles.title,
                {
                  color: theme.textPrimary,
                  fontFamily: typography.fontFamilyBold,
                },
              ]}
              numberOfLines={2}
            >
              {t(item.title, item.title)}
            </Text>
          </View>

          {item.dismissible && onDismiss ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onDismiss(item.id);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Dismiss ${item.title}`}
              style={({ pressed }) => [
                styles.dismissButton,
                {
                  backgroundColor: theme.surfaceSubtle,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <CloseIcon size={14} color={theme.textMuted} />
            </Pressable>
          ) : isInteractive ? (
            <View style={styles.chevronBox}>
              <ChevronRightIcon size={18} color={theme.textMuted} />
            </View>
          ) : null}
        </View>

        <Text
          style={[
            styles.subtitle,
            {
              color: theme.textSecondary,
              fontFamily: typography.fontFamilyRegular,
            },
          ]}
        >
          {t(item.subtitle, item.subtitle)}
        </Text>

        {/* Why am I seeing this? Attribution badge */}
        <View
          style={[
            styles.whyRow,
            {
              backgroundColor: theme.surfaceSubtle,
              borderColor: theme.border,
            },
          ]}
        >
          <InfoIcon size={12} color={theme.textMuted} />
          <Text
            style={[
              styles.whyText,
              {
                color: theme.textSecondary,
                fontFamily: typography.fontFamilyMedium,
              },
            ]}
            numberOfLines={2}
          >
            {t('why_seeing_this', 'Why am I seeing this?')} {t(item.whyReason, item.whyReason)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  chevronBox: {
    marginLeft: 4,
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  whyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  whyText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
});
