# MedFind Motion Spec (Slikk-style onboarding, MedFind flavor)

Three moments: **1) Logo intro, 2) "Who is this for?" picker (the gender-screen mechanic), 3) Finale with sound.**
Both themes (light: sage/walnut/amber, dark: jet/amethyst/cyan) must work. Zero hardcoded colors.

---

## Part A. Asset plan (the smarter move)

| Asset | Who makes it | Why |
|---|---|---|
| Logo intro | Code only (staggered letters + pulse ring) | Vector and theme-aware, needs no files |
| Finale checkmark + ring | Code only (SVG stroke draw) | Same |
| Figure cutouts (2-3 people) | **Gemini image generation** | People illustrations drawn by hand-written SVG look amateur |
| Sounds | Included in `sounds/` (synthesized, royalty-free, yours to use) | Swap later if you want something richer |

### Gemini prompts for the cutouts
Generate each at 1024x1536, then remove the background (remove.bg, Photoroom, or Gemini's own "remove background" edit) and export transparent PNG.
Make a light-theme and dark-theme-friendly pair by keeping clothing mid-tone (not pure white or pure black).

1. `Full-body flat editorial illustration of a friendly adult standing front-facing, relaxed posture, soft shading, warm sage green and walnut brown clothing, plain flat background, no text, consistent style.`
2. `Same style, same proportions: a friendly older adult standing front-facing, cardigan, cane optional, plain flat background, no text.`
3. `Same style, same proportions: a child standing front-facing, light jacket, plain flat background, no text.`

Keep identical style words across all three so the set looks like one family.
Save to `assets/images/figures/me.png`, `parent.png`, `child.png`.

---

## Part B. Product decision to confirm

Slikk asks gender because it tailors a catalog. MedFind stores no personal medical data (your README), so a gender question has no job here.
Smarter version, same animation: **"Who are you finding medicine for?"** with Me / My parent / My child.
It is a local-only preference that changes copy and defaults (for example "your mother's prescription"). No clinical advice, nothing sent to Supabase.
If you prefer a pure gender or avatar pick, the animation code is identical, only the labels change.

---

## Part C. Motion design per moment

### 1. Logo intro (about 2.8 s total)
- Background: `colors.background`, with a soft radial glow in `colors.accent` at 12 percent opacity.
- Letters of "MedFind" spring up one by one (70 ms stagger, damping 14).
- A ring pulses outward once behind the wordmark, scale 0.6 to 1.6, opacity 0.5 to 0.
- Tagline fades in at 1.3 s: "Medicine, found."
- Light haptic at start. Fade out at 2.6 s, then route to onboarding.

### 2. Who-picker (the gender-screen mechanic)
- Title fades in. Figures stagger in from below (translateY 60 to 0, 120 ms apart) with a gentle idle float (2 px, 2.5 s loop).
- On tap: whoosh sound plus light haptic. The chosen figure scales 1.0 to 1.12 and slides to center. The others fade and slide off-screen.
- Background wipes to the accent tint in a circular reveal from the tap point.
- Auto-advance after 700 ms. Provide a visible Skip.

### 3. Finale with sound (about 2.2 s)
- "Fetching your area" step with a radar sweep (rotating gradient arc), honest copy: "Finding participating pharmacies near you". Never "live stock".
- Ring draws (stroke dash 0 to 1, 700 ms), the checkmark draws after it, chime plays on the check landing, success haptic.
- Ring then expands and fills the screen in the theme background, handing off to the Home tab with `AnimatedScreenTransition`.
- Calm, per your README: no flashing, no strobe, no siren visuals.

---

## Part D. Master prompt for Antigravity (paste this)

```
Read these first: package.json, src/theme/tokens.ts, src/theme/ThemeContext.tsx,
src/components/onboarding/*, src/app/_layout.tsx, src/components/AnimatedScreenTransition.tsx.
Match existing conventions (TypeScript, Expo Router, theme tokens).

Goal: rebuild the onboarding in three animated moments (splash logo intro, "who is this for"
picker, finale with sound). Full spec is in MEDFIND_MOTION_SPEC.md Part C.

Steps:
1. Check the Expo SDK version. Install with `npx expo install`: react-native-reanimated,
   react-native-gesture-handler, react-native-svg, expo-haptics, and expo-audio
   (use expo-av only if the SDK is older than the one that supports expo-audio).
   Confirm the reanimated babel plugin is configured.
2. Copy medfind-motion/sounds/*.wav to assets/sounds/.
3. Create src/components/onboarding/SplashIntro.tsx using the starter in Part E.
4. Create src/components/onboarding/WhoPicker.tsx (figure images from assets/images/figures/).
5. Create src/components/onboarding/AllSetFinale.tsx (radar sweep, SVG ring + checkmark draw,
   chime, success haptic, ring expansion into the home screen).
6. Create src/hooks/useOnboardingSounds.ts that preloads tap, whoosh, finale_chime and
   unloads on unmount. Fail silently if audio fails.
7. Wire the sequence inside the existing OnboardingFlow. Persist "onboarding done" via
   storageService so it runs once. Add a Skip button on every screen.

Hard rules:
- Every color comes from the theme. Test light AND dark.
- Honor reduced motion (reanimated useReducedMotion): replace motion with simple fades.
- Animate only transform and opacity on the UI thread (reanimated worklets).
- Tap targets at least 44x44. Add accessibilityLabel to every pressable.
- Copy must never imply live stock or medical advice (see README safety boundaries).
- Store the picker answer locally only.
- Test on a low-end Android device or emulator profile and report any dropped frames.
```

---

## Part E. Starter code: logo intro

Assumes `useTheme()` returns `{ colors }` with `background`, `text`, `accent`. Adjust the destructuring to match your `ThemeContext.tsx`.

```tsx
// src/components/onboarding/SplashIntro.tsx
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

const WORD = 'MedFind'.split('');

function Letter({ char, index, color }: { char: string; index: number; color: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(500 + index * 70, withSpring(1, { damping: 14, stiffness: 120 }));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 28 }, { scale: 0.9 + 0.1 * p.value }],
  }));
  return <Animated.Text style={[styles.letter, { color }, style]}>{char}</Animated.Text>;
}

export function SplashIntro({ onDone }: { onDone: () => void }) {
  const { colors } = useTheme();
  const ring = useSharedValue(0);
  const tag = useSharedValue(0);
  const out = useSharedValue(1);

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    ring.value = withDelay(200, withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }));
    tag.value = withDelay(1300, withTiming(1, { duration: 500 }));
    out.value = withDelay(
      2600,
      withTiming(0, { duration: 350 }, (finished) => {
        if (finished) runOnJS(onDone)();
      })
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - ring.value),
    transform: [{ scale: 0.6 + ring.value }],
  }));
  const tagStyle = useAnimatedStyle(() => ({
    opacity: tag.value,
    transform: [{ translateY: (1 - tag.value) * 10 }],
  }));
  const rootStyle = useAnimatedStyle(() => ({ opacity: out.value }));

  return (
    <Animated.View style={[styles.root, { backgroundColor: colors.background }, rootStyle]}>
      <Animated.View style={[styles.ring, { borderColor: colors.accent }, ringStyle]} />
      <View style={styles.row}>
        {WORD.map((c, i) => (
          <Letter key={i} char={c} index={i} color={colors.text} />
        ))}
      </View>
      <Animated.Text style={[styles.tag, { color: colors.text }, tagStyle]}>
        Medicine, found.
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 2 },
  row: { flexDirection: 'row' },
  letter: { fontSize: 44, fontWeight: '700', letterSpacing: -1 },
  tag: { marginTop: 12, fontSize: 15, opacity: 0.7 },
});
```

---

## Sounds (in `sounds/`)
- `tap.wav`: soft pop for selections
- `whoosh.wav`: figure slide
- `finale_chime.wav`: rising four-note chime for the checkmark landing
