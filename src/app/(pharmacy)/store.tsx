import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useProfile } from '../../store/profile';
import {
  pharmacyPortalService,
  StorePartnerAuth,
} from '../../services/pharmacyPortalService';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import {
  BackArrowIcon,
  PharmacyStoreIcon,
  StaffBadgeIcon,
  ShieldCheckIcon,
  SunIcon,
  MoonIcon,
  RefreshIcon,
  InfoIcon,
} from '../../components/icons/AppIcons';

export default function PharmacyStoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette, scheme, setScheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { updateProfile } = useProfile();

  const [partnerAuth, setPartnerAuth] = useState<StorePartnerAuth | null>(null);

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 8;

  useEffect(() => {
    pharmacyPortalService.getStorePartnerAuth().then(setPartnerAuth);
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Sign out of pharmacy?',
      'You will need to enter your pharmacist credentials and attestation again to make stock updates.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await pharmacyPortalService.clearStorePartnerAuth();
            router.replace('/(pharmacy)');
          },
        },
      ]
    );
  };

  const handleChangeRole = () => {
    Alert.alert(
      t('change_role', 'Change role?'),
      t('change_role_confirm_msg', 'This takes you back to the start.'),
      [
        { text: t('cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('change_role', 'Change role'),
          style: 'destructive',
          onPress: async () => {
            await pharmacyPortalService.clearStorePartnerAuth();
            await updateProfile({ role: null });
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* HEADER BAR */}
      <View style={[styles.headerBar, { paddingTop, borderBottomColor: palette.line }]}>
        <Pressable
          testID="pharmacy-store-back-btn"
          onPress={() => router.back()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Back to inventory"
          style={({ pressed }) => [
            styles.headerBackButton,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              opacity: pressed ? 0.8 : 1.0,
            },
          ]}
        >
          <BackArrowIcon size={18} color={palette.ink} />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: palette.ink, fontFamily: fonts.sansBold }]}>
            Store Settings
          </Text>
          <Text style={[styles.headerSubtitle, { color: palette.ink2, fontFamily: fonts.sans }]}>
            Dispensary & Staff Station
          </Text>
        </View>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* DEMO NOTICE BADGE */}
        <View
          style={[
            styles.demoBadgeCard,
            {
              backgroundColor: palette.surface2,
              borderColor: palette.line,
            },
          ]}
        >
          <InfoIcon size={20} color={palette.accent} />
          <View style={styles.demoBadgeTextCol}>
            <Text
              style={[
                styles.demoBadgeTitle,
                { color: palette.ink, fontFamily: fonts.sansBold },
              ]}
            >
              {t('demo_sample_data_label', 'Demo app: sample data')}
            </Text>
            <Text
              style={[
                styles.demoBadgeSub,
                { color: palette.ink2, fontFamily: fonts.sans },
              ]}
            >
              Stock updates are kept locally for this session.
            </Text>
          </View>
        </View>

        {/* STORE DETAILS SECTION */}
        <Text style={[styles.sectionHeading, { color: palette.ink2, fontFamily: fonts.sansSemi }]}>
          CURRENT STORE & CREDENTIALS
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <View style={styles.rowItem}>
            <PharmacyStoreIcon size={20} color={palette.accent} />
            <View style={styles.rowTextCol}>
              <Text style={[styles.rowLabel, { color: palette.ink2, fontFamily: fonts.sans }]}>
                Pharmacy Name
              </Text>
              <Text style={[styles.rowValue, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                {partnerAuth?.pharmacyName || 'Victoria Hospital Community Pharmacy'}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: palette.line }]} />

          <View style={styles.rowItem}>
            <StaffBadgeIcon size={20} color={palette.accent} />
            <View style={styles.rowTextCol}>
              <Text style={[styles.rowLabel, { color: palette.ink2, fontFamily: fonts.sans }]}>
                Registered Pharmacist
              </Text>
              <Text style={[styles.rowValue, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                {partnerAuth?.pharmacistName || 'Dr. Anand Rao, B.Pharm'}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: palette.line }]} />

          <View style={styles.rowItem}>
            <ShieldCheckIcon size={20} color={palette.accent} />
            <View style={styles.rowTextCol}>
              <Text style={[styles.rowLabel, { color: palette.ink2, fontFamily: fonts.sans }]}>
                Registration / License No.
              </Text>
              <Text style={[styles.rowValue, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                {partnerAuth?.licenseNumber || 'KSPC/KA/2024/98412'}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: palette.line }]} />

          <View style={styles.rowItem}>
            <View style={styles.rowTextCol}>
              <Text style={[styles.rowLabel, { color: palette.ink2, fontFamily: fonts.sans }]}>
                Dispensing Station
              </Text>
              <Text style={[styles.rowValue, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                {partnerAuth?.counterId || 'Dispensary Counter 1'}
              </Text>
            </View>
          </View>
        </View>

        {/* APPEARANCE SECTION */}
        <Text style={[styles.sectionHeading, { color: palette.ink2, fontFamily: fonts.sansSemi }]}>
          APPEARANCE & LANGUAGE
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          {/* THEME SWITCHER */}
          <View style={styles.preferenceRow}>
            <View style={styles.prefLabelCol}>
              <Text style={[styles.prefTitle, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                Theme
              </Text>
              <Text style={[styles.prefSub, { color: palette.ink2, fontFamily: fonts.sans }]}>
                {scheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <View style={[styles.segmentedControl, { backgroundColor: palette.surface2, borderColor: palette.line }]}>
              <Pressable
                onPress={() => setScheme('light')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Switch to light theme"
                style={[
                  styles.segmentBtn,
                  scheme === 'light' && [styles.segmentBtnActive, { backgroundColor: palette.surface }],
                ]}
              >
                <SunIcon size={16} color={scheme === 'light' ? palette.accent : palette.ink2} />
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: scheme === 'light' ? palette.ink : palette.ink2,
                      fontFamily: scheme === 'light' ? fonts.sansBold : fonts.sans,
                    },
                  ]}
                >
                  Light
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setScheme('dark')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Switch to dark theme"
                style={[
                  styles.segmentBtn,
                  scheme === 'dark' && [styles.segmentBtnActive, { backgroundColor: palette.surface }],
                ]}
              >
                <MoonIcon size={16} color={scheme === 'dark' ? palette.accent : palette.ink2} />
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: scheme === 'dark' ? palette.ink : palette.ink2,
                      fontFamily: scheme === 'dark' ? fonts.sansBold : fonts.sans,
                    },
                  ]}
                >
                  Dark
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: palette.line }]} />

          {/* LANGUAGE SWITCHER */}
          <View style={styles.preferenceRow}>
            <View style={styles.prefLabelCol}>
              <Text style={[styles.prefTitle, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                Language
              </Text>
              <Text style={[styles.prefSub, { color: palette.ink2, fontFamily: fonts.sans }]}>
                {language === 'kn' ? 'ಕನ್ನಡ' : language === 'hi' ? 'हिंदी' : 'English'}
              </Text>
            </View>
            <View style={[styles.segmentedControl, { backgroundColor: palette.surface2, borderColor: palette.line }]}>
              {(['en', 'kn', 'hi'] as const).map((lang) => (
                <Pressable
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch language to ${lang}`}
                  style={[
                    styles.segmentBtn,
                    language === lang && [styles.segmentBtnActive, { backgroundColor: palette.surface }],
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: language === lang ? palette.ink : palette.ink2,
                        fontFamily: language === lang ? fonts.sansBold : fonts.sans,
                      },
                    ]}
                  >
                    {lang === 'en' ? 'EN' : lang === 'kn' ? 'ಕನ್ನಡ' : 'हिं'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* ACCOUNT / ROLE ACTIONS */}
        <Text style={[styles.sectionHeading, { color: palette.ink2, fontFamily: fonts.sansSemi }]}>
          SESSION & ROLE
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          {/* SIGN OUT */}
          <Pressable
            testID="pharmacy-sign-out-btn"
            onPress={handleSignOut}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Sign out of pharmacy portal"
            style={({ pressed }) => [
              styles.actionRow,
              { opacity: pressed ? 0.75 : 1.0 },
            ]}
          >
            <View style={styles.actionRowTextCol}>
              <Text style={[styles.actionRowTitle, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                Sign out of pharmacy
              </Text>
              <Text style={[styles.actionRowSub, { color: palette.ink2, fontFamily: fonts.sans }]}>
                Clears verified credentials on this device
              </Text>
            </View>
            <Text style={[styles.actionButtonText, { color: palette.accent, fontFamily: fonts.sansBold }]}>
              Sign out
            </Text>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: palette.line }]} />

          {/* CHANGE ROLE */}
          <Pressable
            testID="pharmacy-change-role-btn"
            onPress={handleChangeRole}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Change role to customer"
            style={({ pressed }) => [
              styles.actionRow,
              { opacity: pressed ? 0.75 : 1.0 },
            ]}
          >
            <View style={styles.actionRowTextCol}>
              <Text style={[styles.actionRowTitle, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                Change role
              </Text>
              <Text style={[styles.actionRowSub, { color: palette.ink2, fontFamily: fonts.sans }]}>
                Return to start to choose Customer or Staff
              </Text>
            </View>
            <RefreshIcon size={18} color={palette.accent} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  headerRightPlaceholder: {
    width: 44,
    height: 44,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  demoBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  demoBadgeTextCol: {
    flex: 1,
    gap: 2,
  },
  demoBadgeTitle: {
    fontSize: 14,
  },
  demoBadgeSub: {
    fontSize: 12,
  },
  sectionHeading: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  rowTextCol: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 12,
  },
  rowValue: {
    fontSize: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: MIN_TARGET,
  },
  prefLabelCol: {
    flex: 1,
    gap: 2,
  },
  prefTitle: {
    fontSize: 15,
  },
  prefSub: {
    fontSize: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    gap: 5,
    minHeight: 36,
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 52,
  },
  actionRowTextCol: {
    flex: 1,
    gap: 2,
  },
  actionRowTitle: {
    fontSize: 15,
  },
  actionRowSub: {
    fontSize: 12,
  },
  actionButtonText: {
    fontSize: 14,
  },
});
