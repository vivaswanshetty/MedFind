import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { atmosphere } from '../constants/theme';

export function AtmosphereBackground() {
  const { scheme } = useTheme();
  const { width, height } = useWindowDimensions();

  const currentAtmosphere = atmosphere[scheme];
  const blobs = currentAtmosphere.blobs;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        { backgroundColor: currentAtmosphere.base },
      ]}
      pointerEvents="none"
    >
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          {blobs.map((blob, index) => {
            const cx = blob.cx * width;
            const cy = blob.cy * height;
            const rx = blob.rx * width;
            const ry = blob.ry * height;
            const r = Math.max(rx, ry);

            return (
              <RadialGradient
                key={`grad-${index}`}
                id={`blob-grad-${index}`}
                cx={cx}
                cy={cy}
                r={r}
                fx={cx}
                fy={cy}
                gradientUnits="userSpaceOnUse"
              >
                <Stop
                  offset="0%"
                  stopColor={`rgb(${blob.rgb})`}
                  stopOpacity={blob.opacity}
                />
                <Stop
                  offset={`${Math.round(blob.stop * 100)}%`}
                  stopColor={`rgb(${blob.rgb})`}
                  stopOpacity={0}
                />
              </RadialGradient>
            );
          })}
        </Defs>

        {blobs.map((_, index) => (
          <Rect
            key={`rect-${index}`}
            x="0"
            y="0"
            width={width}
            height={height}
            fill={`url(#blob-grad-${index})`}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Keep behind scroll content without clipping behind window decor
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
