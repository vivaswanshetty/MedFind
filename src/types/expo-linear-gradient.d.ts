import * as React from 'react';
import { ViewProps, ColorValue } from 'react-native';

declare module 'expo-linear-gradient' {
  export interface LinearGradientPoint {
    x: number;
    y: number;
  }

  export interface LinearGradientProps extends ViewProps {
    colors: readonly [ColorValue, ColorValue, ...ColorValue[]] | readonly ColorValue[];
    locations?: readonly number[] | null;
    start?: LinearGradientPoint | null;
    end?: LinearGradientPoint | null;
  }

  export const LinearGradient: React.FC<LinearGradientProps>;
}
