import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Rect } from 'react-native-svg';
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
          {/* Top ambient linear wash: rich sage green in light theme, subtle royal violet in dark */}
          <LinearGradient id="ambient-top-wash" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0%"
              stopColor={scheme === 'light' ? 'rgb(125,170,95)' : 'rgb(59,10,107)'}
              stopOpacity={scheme === 'light' ? 0.35 : 0.45}
            />
            <Stop
              offset="45%"
              stopColor={scheme === 'light' ? 'rgb(140,185,110)' : 'rgb(35,8,65)'}
              stopOpacity={scheme === 'light' ? 0.16 : 0.18}
            />
            <Stop
              offset="100%"
              stopColor={scheme === 'light' ? 'rgb(140,185,110)' : 'rgb(0,0,0)'}
              stopOpacity={0}
            />
          </LinearGradient>

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

        {/* Ambient Top Wash */}
        <Rect
          x="0"
          y="0"
          width={width}
          height={height * 0.55}
          fill="url(#ambient-top-wash)"
        />

        {/* Radial Atmosphere Blobs */}
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
