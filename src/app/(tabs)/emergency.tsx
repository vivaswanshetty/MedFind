import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
  Alert,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import { AtmosphereBackground } from '../../components/AtmosphereBackground';
import { AnimatedScreenTransition } from '../../components/AnimatedScreenTransition';
import {
  BackArrowIcon,
  PhoneIcon,
  InfoIcon,
  ChevronRightIcon,
} from '../../components/icons/AppIcons';

export default function EmergencyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheme, palette } = useTheme();

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 8;

  // Pulsating emergency glow ring animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const handleDial = async (number: string, title: string) => {
    const cleanNumber = number.replace(/[^\d+]/g, '');
    const telUrl = `tel:${cleanNumber}`;
    try {
      const canOpen = await Linking.canOpenURL(telUrl);
      if (canOpen) {
        await Linking.openURL(telUrl);
      } else {
        Alert.alert('Dialer Unavailable', `Cannot place calls to ${number} from this device.`);
      }
    } catch {
      Alert.alert('Error', 'Unable to open phone dialer.');
    }
  };

  return (
    <View style={[styles.rootContainer, { backgroundColor: palette.bg }]}>
      <AtmosphereBackground />

      <AnimatedScreenTransition style={{ flex: 1 }}>
        <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop,
            paddingBottom: 130,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Back to Previous Screen"
            style={[
              styles.backButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <BackArrowIcon size={18} color={palette.ink} />
          </Pressable>
          <Text style={[styles.headerSubtitleTag, { color: palette.ink2 }]}>
            EMERGENCY HELP
          </Text>
        </View>

        {/* HERO TITLE */}
        <View style={styles.heroTitleGroup}>
          <Text style={[styles.heroHeadline, { color: palette.ink }]}>
            If this is an emergency, call now.
          </Text>
          <Text style={[styles.heroSubtitle, { color: palette.ink2 }]}>
            One tap opens your phone's dialer. You place the call yourself.
          </Text>
        </View>

        {/* PRIMARY 112 HERO BUTTON WITH PULSING EMERGENCY RING */}
        <View style={styles.heroEmergencyWrapper}>
          <Animated.View
            style={[
              styles.emergencyPulseRing,
              {
                borderColor: palette.red,
                transform: [{ scale: pulseAnim }],
                opacity: pulseOpacity,
              },
            ]}
          />
          <Pressable
            onPress={() => handleDial('112', 'National Emergency Response 112')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Call emergency service, Dial 112"
            style={({ pressed }) => [
              styles.heroEmergencyButton,
              {
                backgroundColor: palette.red,
                opacity: pressed ? 0.9 : 1.0,
              },
            ]}
          >
            <View style={styles.heroEmergencyIconBox}>
              <PhoneIcon size={24} color="#FFFFFF" />
            </View>
            <View style={styles.heroEmergencyTextGroup}>
              <Text style={styles.heroEmergencyTitle}>
                Call emergency service
              </Text>
              <Text style={styles.heroEmergencySubtitle}>
                Dial 112
              </Text>
            </View>
          </Pressable>
        </View>

        <Text style={[styles.heroEmergencyCaption, { color: palette.ink2 }]}>
          Tapping opens your dialer with 112 ready. MedFind does not dispatch help or estimate arrival.
        </Text>

        {/* OTHER LISTED CONTACTS SECTION */}
        <View style={styles.contactsSection}>
          <Text style={[styles.contactsSectionHeader, { color: palette.ink2 }]}>
            OTHER LISTED CONTACTS
          </Text>

          {/* Hospital Contact */}
          <View
            style={[
              styles.contactCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <View
              style={[
                styles.contactInitialBadge,
                {
                  backgroundColor: scheme === 'light' ? palette.ink : palette.btn,
                },
              ]}
            >
              <Text style={styles.contactInitialBadgeText}>H</Text>
            </View>

            <View style={styles.contactDetails}>
              <Text style={[styles.contactTitle, { color: palette.ink }]}>
                Call hospital
              </Text>
              <Text style={[styles.contactMeta, { color: palette.ink2 }]}>
                Lalbagh General Hospital • 1.2 km • reviewed 18 Oct
              </Text>
            </View>

            <Pressable
              onPress={() => handleDial('080-26700000', 'Lalbagh General Hospital')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Call Lalbagh General Hospital"
              style={[
                styles.callIconButton,
                {
                  backgroundColor: scheme === 'light' ? palette.surface2 : palette.btn,
                },
              ]}
            >
              <PhoneIcon size={18} color={scheme === 'light' ? palette.ink : '#FFFFFF'} />
            </Pressable>
          </View>

          {/* Ambulance Contact */}
          <View
            style={[
              styles.contactCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <View
              style={[
                styles.contactInitialBadge,
                {
                  backgroundColor: scheme === 'light' ? palette.ink : palette.btn,
                },
              ]}
            >
              <Text style={styles.contactInitialBadgeText}>A</Text>
            </View>

            <View style={styles.contactDetails}>
              <Text style={[styles.contactTitle, { color: palette.ink }]}>
                Call ambulance contact
              </Text>
              <Text style={[styles.contactMeta, { color: palette.ink2 }]}>
                Ward 42 listing • reviewed 18 Oct
              </Text>
            </View>

            <Pressable
              onPress={() => handleDial('108', 'Karnataka Emergency Ambulance 108')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Call ambulance contact 108"
              style={[
                styles.callIconButton,
                {
                  backgroundColor: scheme === 'light' ? palette.surface2 : palette.btn,
                },
              ]}
            >
              <PhoneIcon size={18} color={scheme === 'light' ? palette.ink : '#FFFFFF'} />
            </Pressable>
          </View>

          {/* Link to Care Nearby */}
          <Pressable
            onPress={() => router.push('/(tabs)/care')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="See all care nearby"
            style={[
              styles.seeAllCareButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <Text style={[styles.seeAllCareText, { color: palette.ink }]}>
              See all care nearby
            </Text>
            <ChevronRightIcon size={18} color={palette.ink2} />
          </Pressable>
        </View>

        {/* CLINICAL POLICY BOUNDARY NOTE */}
        <View
          style={[
            styles.boundaryBox,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <InfoIcon size={18} color={palette.ink2} />
          <View style={styles.boundaryTextGroup}>
            <Text style={[styles.boundaryTitle, { color: palette.ink }]}>
              What MedFind cannot do.
            </Text>
            <Text style={[styles.boundaryBody, { color: palette.ink2 }]}>
              It does not book ambulances, confirm hospital beds or give medical advice. Listings are directory information.
            </Text>
          </View>
        </View>
      </ScrollView>
      </AnimatedScreenTransition>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },

  // HEADER
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: MIN_TARGET,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitleTag: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // HERO TITLE
  heroTitleGroup: {
    gap: 6,
    marginTop: 4,
  },
  heroHeadline: {
    fontFamily: fonts.serif,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 22,
  },

  // PRIMARY 112 HERO BUTTON
  heroEmergencyWrapper: {
    position: 'relative',
    borderRadius: radii.cardLg,
  },
  emergencyPulseRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: radii.cardLg + 4,
    borderWidth: 2.5,
  },
  heroEmergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 84,
    paddingHorizontal: 20,
    borderRadius: radii.cardLg,
    gap: 16,
    shadowColor: '#B3261E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  heroEmergencyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmergencyTextGroup: {
    flex: 1,
    gap: 2,
  },
  heroEmergencyTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroEmergencySubtitle: {
    fontFamily: fonts.sansXBold,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    opacity: 0.95,
  },
  heroEmergencyCaption: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },

  // CONTACTS SECTION
  contactsSection: {
    gap: 10,
    marginTop: 6,
  },
  contactsSectionHeader: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 12,
  },
  contactInitialBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInitialBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contactDetails: {
    flex: 1,
    gap: 2,
  },
  contactTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    fontWeight: '700',
  },
  contactMeta: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  callIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllCareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: radii.card,
    borderWidth: 1,
    marginTop: 4,
  },
  seeAllCareText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    fontWeight: '700',
  },

  // BOUNDARY BOX
  boundaryBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: radii.card,
    borderWidth: 1,
  },
  boundaryTextGroup: {
    flex: 1,
    gap: 2,
  },
  boundaryTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
  },
  boundaryBody: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
});
