import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fonts, radii } from '../constants/theme';
import {
  CheckCircleIcon,
  ClockIcon,
  TriangleAlertIcon,
  CircleHelpIcon,
  MinusCircleIcon,
} from './icons/AppIcons';

export type StatusTone = 'ok' | 'warn' | 'stale' | 'na' | 'bad' | 'available' | 'low_stock';

interface StatusChipProps {
  tone: StatusTone;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
}

export function StatusChip({ tone, label, hint, icon }: StatusChipProps) {
  const { palette } = useTheme();

  let bg = palette.naTint;
  let text = palette.naInk;
  let defaultIcon: React.ReactNode = null;

  switch (tone) {
    case 'ok':
    case 'available':
      bg = palette.okTint;
      text = palette.okInk;
      defaultIcon = <CheckCircleIcon size={14} color={palette.okInk} />;
      break;

    case 'warn':
      bg = palette.amberTint;
      text = palette.amberInk;
      defaultIcon = <ClockIcon size={14} color={palette.amberInk} />;
      break;

    case 'low_stock':
      bg = palette.amberTint;
      text = palette.amberInk;
      defaultIcon = <MinusCircleIcon size={14} color={palette.amberInk} />;
      break;

    case 'stale':
      bg = palette.amber;
      text = palette.amberOn;
      defaultIcon = <TriangleAlertIcon size={14} color={palette.amberOn} />;
      break;

    case 'na':
      bg = palette.naTint;
      text = palette.naInk;
      defaultIcon = <CircleHelpIcon size={14} color={palette.naInk} />;
      break;

    case 'bad':
      bg = palette.badTint;
      text = palette.badInk;
      defaultIcon = <MinusCircleIcon size={14} color={palette.badInk} />;
      break;
  }

  const renderedIcon = icon !== undefined ? icon : defaultIcon;

  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      {renderedIcon}
      <Text style={[styles.labelText, { color: text }]}>{label}</Text>
      {hint ? (
        <Text
          style={[
            styles.hintText,
            {
              color: text,
              opacity: tone === 'stale' ? 1.0 : 0.85,
            },
          ]}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.chip,
    paddingVertical: 9,
    paddingHorizontal: 10,
    gap: 6,
  },
  labelText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
  },
  hintText: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    fontWeight: '600',
  },
});
