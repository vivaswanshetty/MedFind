import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  useReducedMotion,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../constants/theme';
import { typography } from '../../theme/tokens';

export type MedicineType =
  | 'tablet'
  | 'capsule'
  | 'syrup'
  | 'injection'
  | 'cream'
  | 'drops'
  | 'inhaler';

export interface MedicineIcon3DProps {
  /** Pharmaceutical form factor */
  type: MedicineType;

  /**
   * Bounding box dimension in points (width & height).
   * @default 64
   */
  size?: number;

  /**
   * Primary brand / formulation color.
   * Falls back to active theme palette accent.
   */
  color?: string;

  /** Optional container style */
  style?: StyleProp<ViewStyle>;

  /** Optional accessibility label */
  accessibilityLabel?: string;

  /** Test identifier */
  testID?: string;

  /** Enable HD ambient neon glow backdrop @default true */
  glow?: boolean;

  /** Enable subtle 3D floating levitation micro-animation @default false */
  float?: boolean;
}

/**
 * 3D-styled medicine form icons built purely with View layers, borderRadius, and gradients.
 *
 * Implements:
 * - 7 pharmaceutical forms: tablet, capsule, syrup, injection, cream, drops, inhaler
 * - 3D volumetric convex lighting, highlights, and layered parts
 * - HD ambient neon aura glow
 * - Grounding shadow beneath each icon
 * - Spring entrance scale animation (0.5 to 1) on mount
 * - Optional continuous 3D levitation bobbing
 * - Full reduced-motion accessibility support
 */
export function MedicineIcon3D({
  type,
  size = 64,
  color,
  style,
  accessibilityLabel,
  testID,
  glow = true,
  float = false,
}: MedicineIcon3DProps) {
  const { palette, scheme } = useTheme();
  const primaryColor = color || palette.accent;
  const shouldReduceMotion = useReducedMotion();

  // Animated entrance: spring scale from 0.5 to 1 on mount
  const scale = useSharedValue(shouldReduceMotion ? 1 : 0.5);
  const opacity = useSharedValue(shouldReduceMotion ? 1 : 0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      scale.value = 1;
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 140,
      mass: 0.8,
    });
    opacity.value = withTiming(1, { duration: 250 });

    if (float) {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 1800 }),
          withTiming(0, { duration: 1800 })
        ),
        -1,
        true
      );
    }
  }, [shouldReduceMotion, scale, opacity, translateY, float]);

  const animatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return { transform: [{ scale: 1 }, { translateY: 0 }], opacity: 1 };
    }
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
      ],
      opacity: opacity.value,
    };
  });

  const s = size / 64; // scale multiplier relative to default 64pt base

  const shadowColor =
    scheme === 'dark' ? 'rgba(0, 0, 0, 0.55)' : 'rgba(90, 62, 43, 0.20)';

  const renderIconContent = () => {
    switch (type) {
      case 'tablet':
        return renderTablet(size, s, primaryColor);
      case 'capsule':
        return renderCapsule(size, s, primaryColor, scheme);
      case 'syrup':
        return renderSyrup(size, s, primaryColor, scheme);
      case 'injection':
        return renderInjection(size, s, primaryColor);
      case 'cream':
        return renderCream(size, s, primaryColor, scheme);
      case 'drops':
        return renderDrops(size, s, primaryColor, scheme);
      case 'inhaler':
        return renderInhaler(size, s, primaryColor, scheme);
      default:
        return renderTablet(size, s, primaryColor);
    }
  };

  return (
    <Animated.View
      testID={testID}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel || `${type} icon`}
      style={[
        styles.rootContainer,
        { width: size, height: size },
        animatedStyle,
        style,
      ]}
    >
      {/* HD Ambient Neon Glow Aura */}
      {glow && (
        <View
          style={[
            styles.ambientGlowHalo,
            {
              width: size * 0.85,
              height: size * 0.85,
              borderRadius: (size * 0.85) / 2,
              backgroundColor: primaryColor,
              opacity: scheme === 'dark' ? 0.32 : 0.16,
              shadowColor: primaryColor,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: scheme === 'dark' ? 0.8 : 0.45,
              shadowRadius: size * 0.3,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* 3D Grounding Shadow */}
      <View
        style={[
          styles.groundShadow,
          {
            width: size * 0.68,
            height: size * 0.13,
            borderRadius: (size * 0.13) / 2,
            backgroundColor: shadowColor,
            bottom: size * 0.03,
          },
        ]}
        pointerEvents="none"
      />

      {/* Pharmaceutical Icon Visual Layers */}
      <View style={styles.contentWrapper} pointerEvents="none">
        {renderIconContent()}
      </View>
    </Animated.View>
  );
}

// =============================================================================
// 1. TABLET
// Rounded circle with subtle convex gradient (lighter center, darker edges)
// + inner highlight dot + center score groove + shadow underneath
// =============================================================================
function renderTablet(size: number, s: number, primaryColor: string) {
  const d = size * 0.68;
  return (
    <View
      style={[
        styles.tabletContainer,
        {
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: primaryColor,
        },
      ]}
    >
      {/* Convex volumetric lighting gradient */}
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.48)',
          'rgba(255, 255, 255, 0.08)',
          'rgba(0, 0, 0, 0.28)',
        ]}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={[styles.fullFill, { borderRadius: d / 2 }]}
      />

      {/* Recessed center score line */}
      <View
        style={[
          styles.tabletScoreGroove,
          {
            width: d * 0.75,
            height: Math.max(1.5, 2 * s),
          },
        ]}
      >
        <View style={styles.tabletScoreDark} />
        <View style={styles.tabletScoreHighlight} />
      </View>

      {/* Specular highlight dot */}
      <View
        style={[
          styles.tabletHighlightDot,
          {
            top: d * 0.18,
            left: d * 0.22,
            width: d * 0.16,
            height: d * 0.16,
            borderRadius: (d * 0.16) / 2,
          },
        ]}
      />
    </View>
  );
}

// =============================================================================
// 2. CAPSULE
// Elongated rounded rect, two-tone (left & right halves different shades)
// with curvature gradient, center seam, and white highlight stripe
// =============================================================================
function renderCapsule(
  size: number,
  s: number,
  primaryColor: string,
  scheme: 'light' | 'dark'
) {
  const width = size * 0.74;
  const height = size * 0.36;
  const radius = height / 2;
  const rightToneColor =
    scheme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : '#FFFBF0';

  return (
    <View
      style={[
        styles.capsuleWrapper,
        {
          width,
          height,
          borderRadius: radius,
          transform: [{ rotate: '-28deg' }],
        },
      ]}
    >
      {/* Left Half (Primary Active Formulation) */}
      <View
        style={[
          styles.capsuleHalf,
          {
            borderTopLeftRadius: radius,
            borderBottomLeftRadius: radius,
            backgroundColor: primaryColor,
          },
        ]}
      />

      {/* Right Half (Two-Tone Secondary Body) */}
      <View
        style={[
          styles.capsuleHalf,
          {
            borderTopRightRadius: radius,
            borderBottomRightRadius: radius,
            backgroundColor: rightToneColor,
          },
        ]}
      />

      {/* Center interlock joining seam band */}
      <View
        style={[
          styles.capsuleCenterSeam,
          {
            left: width / 2 - 1 * s,
            width: Math.max(2, 2.5 * s),
          },
        ]}
      />

      {/* Cylindrical curvature lighting gradient */}
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.42)',
          'rgba(255, 255, 255, 0.05)',
          'rgba(0, 0, 0, 0.32)',
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.fullFill, { borderRadius: radius }]}
      />

      {/* White glossy specular highlight stripe */}
      <View
        style={[
          styles.capsuleHighlightStripe,
          {
            top: height * 0.16,
            left: width * 0.12,
            width: width * 0.76,
            height: Math.max(2, 3.5 * s),
            borderRadius: 2,
          },
        ]}
      />
    </View>
  );
}

// =============================================================================
// 3. SYRUP
// Bottle shape using stacked View layers (body + neck + cap),
// with liquid fill level at ~70%, glossy highlight on glass
// =============================================================================
function renderSyrup(
  size: number,
  s: number,
  primaryColor: string,
  scheme: 'light' | 'dark'
) {
  const bodyW = size * 0.48;
  const bodyH = size * 0.50;
  const neckW = size * 0.18;
  const neckH = size * 0.09;
  const capW = size * 0.26;
  const capH = size * 0.11;

  const glassBg =
    scheme === 'dark' ? 'rgba(40, 40, 56, 0.55)' : 'rgba(235, 240, 245, 0.65)';
  const glassBorder =
    scheme === 'dark' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(180, 195, 210, 0.55)';

  return (
    <View style={styles.bottleStack}>
      {/* Cap */}
      <View
        style={[
          styles.syrupCap,
          {
            width: capW,
            height: capH,
            borderRadius: 3 * s,
            backgroundColor: primaryColor,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.35)', 'rgba(0, 0, 0, 0.25)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fullFill}
        />
        {/* Cap grip ridges */}
        <View style={styles.capRidgeRow}>
          <View style={styles.capRidge} />
          <View style={styles.capRidge} />
          <View style={styles.capRidge} />
        </View>
      </View>

      {/* Neck */}
      <View
        style={[
          styles.syrupNeck,
          {
            width: neckW,
            height: neckH,
            backgroundColor: glassBg,
            borderColor: glassBorder,
          },
        ]}
      />

      {/* Main Glass Bottle Body */}
      <View
        style={[
          styles.syrupBody,
          {
            width: bodyW,
            height: bodyH,
            borderRadius: 8 * s,
            backgroundColor: glassBg,
            borderColor: glassBorder,
          },
        ]}
      >
        {/* Liquid Fill Level at ~70% */}
        <View
          style={[
            styles.syrupLiquidContainer,
            {
              height: '70%',
              backgroundColor: primaryColor,
              borderBottomLeftRadius: 7 * s,
              borderBottomRightRadius: 7 * s,
            },
          ]}
        >
          {/* Liquid meniscus top curve */}
          <View style={styles.liquidMeniscus} />
          {/* Depth gradient inside liquid */}
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.25)',
              'transparent',
              'rgba(0, 0, 0, 0.35)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fullFill}
          />
        </View>

        {/* Dosage Measurement Calibration Ticks */}
        <View style={styles.syrupTickGroup}>
          <View style={[styles.syrupTick, { width: 6 * s }]} />
          <View style={[styles.syrupTick, { width: 9 * s }]} />
          <View style={[styles.syrupTick, { width: 6 * s }]} />
        </View>

        {/* Glossy highlight streak on glass surface */}
        <View
          style={[
            styles.syrupGlossStreak,
            {
              width: Math.max(2, 3 * s),
              borderRadius: 2 * s,
            },
          ]}
        />
      </View>
    </View>
  );
}

// =============================================================================
// 4. INJECTION
// Syringe shape: barrel (rect with rounded corners) + plunger + needle tip
// with metallic gradient on needle
// =============================================================================
function renderInjection(size: number, s: number, primaryColor: string) {
  const barrelW = size * 0.28;
  const barrelH = size * 0.44;
  const plungerFlangeW = size * 0.26;
  const plungerFlangeH = size * 0.05;
  const plungerRodH = size * 0.12;
  const needleH = size * 0.20;

  return (
    <View style={styles.syringeWrapper}>
      {/* Plunger Top Flange */}
      <View
        style={[
          styles.plungerFlange,
          {
            width: plungerFlangeW,
            height: plungerFlangeH,
            borderRadius: 2 * s,
            backgroundColor: '#CBD5E1',
          },
        ]}
      />

      {/* Plunger Shaft / Rod */}
      <View
        style={[
          styles.plungerRod,
          {
            width: Math.max(3, 4 * s),
            height: plungerRodH,
            backgroundColor: '#94A3B8',
          },
        ]}
      />

      {/* Barrel */}
      <View
        style={[
          styles.syringeBarrel,
          {
            width: barrelW,
            height: barrelH,
            borderRadius: 4 * s,
          },
        ]}
      >
        {/* Rubber Stopper */}
        <View
          style={[
            styles.rubberStopper,
            {
              height: 5 * s,
            },
          ]}
        />

        {/* Liquid Dose (~60% of barrel) */}
        <View
          style={[
            styles.syringeLiquid,
            {
              height: '60%',
              backgroundColor: primaryColor,
              borderBottomLeftRadius: 3 * s,
              borderBottomRightRadius: 3 * s,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.3)', 'rgba(0, 0, 0, 0.25)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fullFill}
          />
        </View>

        {/* Calibration Ticks */}
        <View style={styles.syringeTicks}>
          <View style={styles.syringeTick} />
          <View style={styles.syringeTick} />
          <View style={styles.syringeTick} />
          <View style={styles.syringeTick} />
        </View>
      </View>

      {/* Needle Hub (Luer Lock Base) */}
      <View
        style={[
          styles.needleHub,
          {
            width: 8 * s,
            height: 4 * s,
            backgroundColor: '#94A3B8',
          },
        ]}
      />

      {/* Needle Tip with Metallic Chrome Gradient */}
      <View
        style={[
          styles.needleShaft,
          {
            width: Math.max(1.5, 2 * s),
            height: needleH,
          },
        ]}
      >
        <LinearGradient
          colors={['#FFFFFF', '#94A3B8', '#475569']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fullFill}
        />
      </View>
    </View>
  );
}

// =============================================================================
// 5. CREAM
// Tube shape with rounded cap, squeeze fold lines, brand color band
// =============================================================================
function renderCream(
  size: number,
  s: number,
  primaryColor: string,
  scheme: 'light' | 'dark'
) {
  const tubeW = size * 0.44;
  const tubeH = size * 0.48;
  const capW = size * 0.24;
  const capH = size * 0.12;
  const crimpW = size * 0.46;
  const crimpH = size * 0.07;

  const tubeBg =
    scheme === 'dark' ? '#2A2A38' : '#F1EFEA';

  return (
    <View style={styles.creamStack}>
      {/* Top Crimp Seal */}
      <View
        style={[
          styles.creamCrimp,
          {
            width: crimpW,
            height: crimpH,
            borderRadius: 2 * s,
            backgroundColor: scheme === 'dark' ? '#3F3F54' : '#D9D4C7',
          },
        ]}
      >
        <View style={styles.crimpRidge} />
        <View style={styles.crimpRidge} />
      </View>

      {/* Main Tube Body */}
      <View
        style={[
          styles.creamBody,
          {
            width: tubeW,
            height: tubeH,
            borderTopLeftRadius: 3 * s,
            borderTopRightRadius: 3 * s,
            borderBottomLeftRadius: 6 * s,
            borderBottomRightRadius: 6 * s,
            backgroundColor: tubeBg,
          },
        ]}
      >
        {/* Cylindrical lighting gradient */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.35)',
            'rgba(255, 255, 255, 0.05)',
            'rgba(0, 0, 0, 0.25)',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.fullFill}
        />

        {/* Squeeze Fold Creases */}
        <View style={styles.creamCrease1} />
        <View style={styles.creamCrease2} />

        {/* Brand Formulation Color Band */}
        <View
          style={[
            styles.creamBrandBand,
            {
              backgroundColor: primaryColor,
              height: tubeH * 0.28,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.35)', 'rgba(0, 0, 0, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fullFill}
          />
        </View>
      </View>

      {/* Rounded Dispensing Cap */}
      <View
        style={[
          styles.creamCap,
          {
            width: capW,
            height: capH,
            borderRadius: 4 * s,
            backgroundColor: primaryColor,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.35)', 'rgba(0, 0, 0, 0.3)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fullFill}
        />
        <View style={styles.capRidgeRow}>
          <View style={styles.capRidge} />
          <View style={styles.capRidge} />
        </View>
      </View>
    </View>
  );
}

// =============================================================================
// 6. DROPS
// Dropper bottle with rounded bottom, narrow neck, dropper top,
// a single teardrop shape suspended below
// =============================================================================
function renderDrops(
  size: number,
  s: number,
  primaryColor: string,
  scheme: 'light' | 'dark'
) {
  const bottleW = size * 0.44;
  const bottleH = size * 0.38;
  const bulbW = size * 0.22;
  const bulbH = size * 0.14;
  const collarW = size * 0.28;
  const collarH = size * 0.07;
  const dropSize = size * 0.16;

  const glassBg =
    scheme === 'dark' ? 'rgba(38, 38, 52, 0.65)' : 'rgba(235, 240, 248, 0.75)';

  return (
    <View style={styles.dropsWrapper}>
      {/* Rubber Dropper Bulb */}
      <View
        style={[
          styles.dropperBulb,
          {
            width: bulbW,
            height: bulbH,
            borderRadius: bulbH / 2,
            backgroundColor: '#475569',
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.35)', 'rgba(0, 0, 0, 0.4)']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.fullFill}
        />
      </View>

      {/* Screw Cap Collar */}
      <View
        style={[
          styles.dropperCollar,
          {
            width: collarW,
            height: collarH,
            borderRadius: 2 * s,
            backgroundColor: primaryColor,
          },
        ]}
      />

      {/* Dropper Bottle Body with Rounded Bottom */}
      <View
        style={[
          styles.dropperBody,
          {
            width: bottleW,
            height: bottleH,
            borderTopLeftRadius: 4 * s,
            borderTopRightRadius: 4 * s,
            borderBottomLeftRadius: bottleW / 2,
            borderBottomRightRadius: bottleW / 2,
            backgroundColor: glassBg,
          },
        ]}
      >
        {/* Liquid Fill Level */}
        <View
          style={[
            styles.dropperLiquid,
            {
              height: '75%',
              borderBottomLeftRadius: bottleW / 2,
              borderBottomRightRadius: bottleW / 2,
              backgroundColor: primaryColor,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.28)', 'rgba(0, 0, 0, 0.3)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fullFill}
          />
        </View>

        {/* Glass specular sheen */}
        <View
          style={[
            styles.dropperGlossStreak,
            {
              width: Math.max(2, 2.5 * s),
            },
          ]}
        />
      </View>

      {/* Suspended Teardrop below the bottle */}
      <View
        style={[
          styles.teardropContainer,
          {
            width: dropSize,
            height: dropSize,
            marginTop: 3 * s,
          },
        ]}
      >
        <View
          style={[
            styles.teardropShape,
            {
              width: dropSize * 0.85,
              height: dropSize * 0.85,
              borderTopLeftRadius: 0,
              borderTopRightRadius: (dropSize * 0.85) / 2,
              borderBottomLeftRadius: (dropSize * 0.85) / 2,
              borderBottomRightRadius: (dropSize * 0.85) / 2,
              backgroundColor: primaryColor,
              transform: [{ rotate: '-45deg' }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.45)', 'rgba(0, 0, 0, 0.25)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fullFill}
          />
          {/* Specular dot */}
          <View
            style={[
              styles.teardropSpecular,
              {
                width: 3 * s,
                height: 3 * s,
                borderRadius: 1.5 * s,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

// =============================================================================
// 7. INHALER
// L-shaped body with mouthpiece, canister on top, activation button
// =============================================================================
function renderInhaler(
  size: number,
  s: number,
  primaryColor: string,
  scheme: 'light' | 'dark'
) {
  const canisterW = size * 0.24;
  const canisterH = size * 0.26;
  const verticalSleeveW = size * 0.32;
  const verticalSleeveH = size * 0.38;
  const mouthpieceW = size * 0.28;
  const mouthpieceH = size * 0.18;

  return (
    <View style={styles.inhalerWrapper}>
      {/* Aluminum Medicine Press Canister */}
      <View
        style={[
          styles.inhalerCanister,
          {
            width: canisterW,
            height: canisterH,
            borderTopLeftRadius: 5 * s,
            borderTopRightRadius: 5 * s,
            backgroundColor: '#CBD5E1',
          },
        ]}
      >
        {/* Metallic cylinder gradient */}
        <LinearGradient
          colors={['#FFFFFF', '#E2E8F0', '#94A3B8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fullFill}
        />
        {/* Activation button notch at top */}
        <View style={styles.inhalerButtonNotch} />
      </View>

      {/* L-Shaped Plastic Actuator Body */}
      <View style={styles.inhalerLBody}>
        {/* Vertical Sleeve */}
        <View
          style={[
            styles.inhalerVerticalSleeve,
            {
              width: verticalSleeveW,
              height: verticalSleeveH,
              borderTopLeftRadius: 4 * s,
              borderTopRightRadius: 4 * s,
              borderBottomLeftRadius: 8 * s,
              backgroundColor: primaryColor,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.32)', 'rgba(0, 0, 0, 0.25)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fullFill}
          />
        </View>

        {/* Horizontal Mouthpiece */}
        <View
          style={[
            styles.inhalerMouthpiece,
            {
              width: mouthpieceW,
              height: mouthpieceH,
              left: verticalSleeveW - 6 * s,
              borderTopRightRadius: 6 * s,
              borderBottomRightRadius: 6 * s,
              backgroundColor: primaryColor,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.25)', 'rgba(0, 0, 0, 0.3)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.fullFill}
          />

          {/* Protective Cap / Mouthpiece Opening Lip */}
          <View
            style={[
              styles.mouthpieceLip,
              {
                width: 4 * s,
                borderTopRightRadius: 6 * s,
                borderBottomRightRadius: 6 * s,
                backgroundColor:
                  scheme === 'dark' ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.45)',
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  ambientGlowHalo: {
    position: 'absolute',
    zIndex: 0,
    elevation: 4,
  },
  groundShadow: {
    position: 'absolute',
    zIndex: 1,
  },
  fullFill: {
    ...StyleSheet.absoluteFill,
  },

  // Tablet styles
  tabletContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabletScoreGroove: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletScoreDark: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  tabletScoreHighlight: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
  },
  tabletHighlightDot: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },

  // Capsule styles
  capsuleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  capsuleHalf: {
    flex: 1,
    height: '100%',
  },
  capsuleCenterSeam: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    zIndex: 3,
  },
  capsuleHighlightStripe: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    zIndex: 4,
  },

  // Syrup bottle styles
  bottleStack: {
    alignItems: 'center',
  },
  syrupCap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 3,
  },
  capRidgeRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  capRidge: {
    width: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  syrupNeck: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    zIndex: 2,
  },
  syrupBody: {
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  syrupLiquidContainer: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  liquidMeniscus: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  syrupTickGroup: {
    position: 'absolute',
    top: 6,
    right: 4,
    gap: 4,
    zIndex: 4,
  },
  syrupTick: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  syrupGlossStreak: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    zIndex: 5,
  },

  // Syringe styles
  syringeWrapper: {
    alignItems: 'center',
  },
  plungerFlange: {
    zIndex: 5,
  },
  plungerRod: {
    zIndex: 4,
  },
  syringeBarrel: {
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.65)',
    backgroundColor: 'rgba(241, 245, 249, 0.4)',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 3,
  },
  rubberStopper: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    backgroundColor: '#334155',
    borderRadius: 1,
    zIndex: 4,
  },
  syringeLiquid: {
    width: '100%',
    overflow: 'hidden',
  },
  syringeTicks: {
    position: 'absolute',
    top: 8,
    left: 3,
    gap: 4,
    zIndex: 5,
  },
  syringeTick: {
    width: 4,
    height: 1,
    backgroundColor: 'rgba(71, 85, 105, 0.8)',
  },
  needleHub: {
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    zIndex: 2,
  },
  needleShaft: {
    overflow: 'hidden',
    zIndex: 1,
  },

  // Cream tube styles
  creamStack: {
    alignItems: 'center',
  },
  creamCrimp: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  crimpRidge: {
    width: '30%',
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  creamBody: {
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  creamCrease1: {
    position: 'absolute',
    top: 6,
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  creamCrease2: {
    position: 'absolute',
    top: 10,
    left: 6,
    right: 6,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  creamBrandBand: {
    width: '100%',
    overflow: 'hidden',
  },
  creamCap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Drops styles
  dropsWrapper: {
    alignItems: 'center',
  },
  dropperBulb: {
    overflow: 'hidden',
    zIndex: 4,
  },
  dropperCollar: {
    zIndex: 3,
  },
  dropperBody: {
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.5)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    position: 'relative',
    zIndex: 2,
  },
  dropperLiquid: {
    width: '100%',
    overflow: 'hidden',
  },
  dropperGlossStreak: {
    position: 'absolute',
    top: 4,
    left: 3,
    bottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 1,
  },
  teardropContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  teardropShape: {
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teardropSpecular: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    position: 'absolute',
    top: 2,
    right: 2,
  },

  // Inhaler styles
  inhalerWrapper: {
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  inhalerCanister: {
    marginLeft: 3,
    marginBottom: -2,
    overflow: 'hidden',
    alignItems: 'center',
    zIndex: 1,
  },
  inhalerButtonNotch: {
    width: '60%',
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    marginTop: 2,
    borderRadius: 1,
  },
  inhalerLBody: {
    position: 'relative',
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  inhalerVerticalSleeve: {
    overflow: 'hidden',
  },
  inhalerMouthpiece: {
    position: 'absolute',
    bottom: 0,
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  mouthpieceLip: {
    height: '100%',
  },
});
