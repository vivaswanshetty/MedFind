import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Modal,
  TextInput,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts, radii, MIN_TARGET } from '../constants/theme';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { AnimatedScreenTransition } from '../components/AnimatedScreenTransition';
import { onboardingAssets } from '../../assets/onboarding';
import { useProfile, ProfileAnswers } from '../store/profile';
import { useMedicineBox } from '../store/medicineBox';
import { useLocation } from '../context/LocationContext';
import { storageService } from '../services/storageService';
import { clearAllUserData } from '../services/clearDataService';
import { cancelAllItemReminders } from '../lib/reminders';
import { getBuddy } from '../lib/buddy';
import { WhoOption } from '../components/onboarding/WhoPicker';
import { AgeGroup } from '../components/onboarding/AgePicker';
import {
  BackArrowIcon,
  ShieldCheckIcon,
  PillCapsuleIcon,
  BookmarkIcon,
  SearchIcon,
  MapPinIcon,
  RefreshIcon,
  TrashIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  CloseIcon,
  PencilIcon,
  UserIcon,
  GlobeIcon,
} from '../components/icons/AppIcons';

interface WhoChipOption {
  id: WhoOption;
  label: string;
}

const WHO_CHIP_OPTIONS: WhoChipOption[] = [
  { id: 'me', label: 'Me' },
  { id: 'parent', label: 'Parent' },
  { id: 'child', label: 'Child' },
  { id: 'other', label: 'Someone else' },
];

interface AgeChipOption {
  id: AgeGroup;
  label: string;
}

const AGE_CHIP_OPTIONS: AgeChipOption[] = [
  { id: 'under5', label: 'Under 5' },
  { id: '5to12', label: '5 to 12' },
  { id: '13to17', label: '13 to 17' },
  { id: '18to59', label: '18 to 59' },
  { id: '60plus', label: '60 and above' },
];

interface AnswerToggleDef {
  key: keyof ProfileAnswers;
  label: string;
}

const ANSWER_TOGGLE_DEFS: AnswerToggleDef[] = [
  {
    key: 'medicineBox',
    label: 'I keep a medicine box at home',
  },
  {
    key: 'stockIssues',
    label: "I've struggled to find a medicine in stock",
  },
  {
    key: 'buysForFamily',
    label: 'I buy medicines for my family',
  },
  {
    key: 'wantsReminders',
    label: "I'd like refill reminders",
  },
  {
    key: 'comparesPrices',
    label: 'I compare prices before buying',
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheme, palette, theme } = useTheme();
  const { t } = useLanguage();

  const { profile, updateProfile, resetProfile } = useProfile();
  const { items: medicineBoxItems, clearAll: clearMedicineBox } = useMedicineBox();
  const { areaName, locationSource, clearLocation } = useLocation();

  // Local storage counts
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [recentSearchesCount, setRecentSearchesCount] = useState<number>(0);

  // Edit Name Modal State
  const [showEditNameModal, setShowEditNameModal] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');

  const refreshCounts = useCallback(async () => {
    try {
      const favs = await storageService.getFavoriteIds();
      setFavoritesCount(favs.length);

      const recents = await storageService.getRecentSearches();
      setRecentSearchesCount(recents.length);
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 8;

  // Handle Who & Age Chip selections
  const handleSelectWho = async (who: WhoOption) => {
    await updateProfile({ who });
  };

  const handleSelectAge = async (ageGroup: AgeGroup) => {
    await updateProfile({ ageGroup });
  };

  // Handle Answers Toggle
  const handleToggleAnswer = async (key: keyof ProfileAnswers) => {
    const current = profile.answers || {
      medicineBox: false,
      stockIssues: false,
      buysForFamily: false,
      wantsReminders: false,
      comparesPrices: false,
    };

    const nextAnswers: ProfileAnswers = {
      ...current,
      [key]: !current[key],
    };

    // If user has a buddy, keep buddy archetype updated
    const updatedBuddy = profile.buddy
      ? getBuddy([
          nextAnswers.medicineBox,
          nextAnswers.stockIssues,
          nextAnswers.buysForFamily,
          nextAnswers.wantsReminders,
          nextAnswers.comparesPrices,
        ])
      : null;

    await updateProfile({
      answers: nextAnswers,
      ...(updatedBuddy ? { buddy: updatedBuddy, buddyTrait: updatedBuddy.traits[0] } : {}),
    });
  };

  // Handle Display Name Update
  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    await updateProfile({
      displayName: trimmed || null,
    });
    setShowEditNameModal(false);
  };

  // Clear Individual Sections with Confirmations
  const handleClearMedicineBox = () => {
    Alert.alert(
      'Clear Medicine Box?',
      'This will remove all saved medicines and cancel any scheduled refill or expiry reminders.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Box',
          style: 'destructive',
          onPress: async () => {
            await clearMedicineBox();
            await cancelAllItemReminders();
          },
        },
      ]
    );
  };

  const handleClearFavorites = () => {
    Alert.alert(
      'Clear Saved Medicines?',
      'This will remove all bookmarked medicines from your saved list.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await storageService.clearFavorites();
            setFavoritesCount(0);
          },
        },
      ]
    );
  };

  const handleClearRecentSearches = () => {
    Alert.alert(
      'Clear Search History?',
      'This will delete all recent medicine searches saved on this phone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await storageService.clearRecentSearches();
            setRecentSearchesCount(0);
          },
        },
      ]
    );
  };

  const handleClearLocation = () => {
    Alert.alert(
      'Clear Location Preference?',
      'This will reset your location to "No area set" and clear any saved area selection.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Location',
          style: 'destructive',
          onPress: async () => {
            await clearLocation();
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
            await updateProfile({ role: null });
            router.replace('/');
          },
        },
      ]
    );
  };

  // Clear Everything (Full Privacy Wipe & Reset)
  const handleClearEverything = () => {
    Alert.alert(
      'Clear everything?',
      'This will delete your profile, medicine box items, favorites, search history, and location preference, and cancel all scheduled reminders.\n\nTheme and language settings will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            // 1. Clear disk storage and reminders
            await clearAllUserData();

            // 2. Reset in-memory contexts
            await resetProfile();
            await clearMedicineBox();
            await clearLocation();

            // 3. Reset local counts
            setFavoritesCount(0);
            setRecentSearchesCount(0);

            // 4. Return to root which restarts onboarding cleanly
            router.replace('/');
          },
        },
      ]
    );
  };

  const isGuest = !profile.buddy;

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
              paddingBottom: insets.bottom + 48,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Navigation */}
          <View style={styles.navRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={[
                styles.backButton,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.line,
                  shadowColor: palette.shadow,
                },
              ]}
            >
              <BackArrowIcon size={20} color={palette.ink} />
            </Pressable>

            <View style={styles.navTitleContainer}>
              <Text style={[styles.screenTitle, { color: palette.ink }]}>
                {t('profile_screen_title', 'Profile & Local Data')}
              </Text>
              <Text style={[styles.screenSubtitle, { color: palette.ink2 }]}>
                {t('saved_only_on_phone', 'Saved only on this phone')}
              </Text>
            </View>
          </View>

          {/* Section 1: User & Buddy Profile Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <View style={styles.profileHeaderRow}>
              {/* Avatar: Mascot for Onboarded Buddy, or clean User Icon for Guest */}
              {!isGuest ? (
                <View
                  style={[
                    styles.avatarWrapper,
                    {
                      backgroundColor: theme.surfaceSubtle,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Image
                    source={onboardingAssets.mascotWave}
                    style={styles.mascotImage}
                    resizeMode="contain"
                    accessibilityLabel="MedFind Buddy Mascot"
                  />
                </View>
              ) : (
                <View
                  style={[
                    styles.avatarWrapper,
                    {
                      backgroundColor: theme.surfaceSubtle,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <UserIcon size={32} color={palette.ink} />
                </View>
              )}

              {/* Name & Archetype Details */}
              <View style={styles.profileTextGroup}>
                <Pressable
                  onPress={() => {
                    setNameInput(profile.displayName || '');
                    setShowEditNameModal(true);
                  }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Display name: ${profile.displayName || 'Friend'}. Tap to edit`}
                  style={styles.nameRow}
                >
                  <Text style={[styles.profileNameText, { color: palette.ink }]}>
                    {profile.displayName || (isGuest ? 'Guest User' : 'Friend')}
                  </Text>
                  <View style={[styles.editBadge, { borderColor: palette.line }]}>
                    <PencilIcon size={12} color={palette.ink2} />
                  </View>
                </Pressable>

                {/* Buddy Badge (hidden if Guest) */}
                {!isGuest && profile.buddy ? (
                  <View style={styles.buddyBadgeRow}>
                    <View
                      style={[
                        styles.buddyTag,
                        {
                          backgroundColor: theme.badgeBackground,
                          borderColor: theme.badgeBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.buddyTagText,
                          { color: palette.accent || theme.primaryAccentText },
                        ]}
                      >
                        {profile.buddyName || profile.buddy.name} • {profile.buddy.archetype}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.guestCaption, { color: palette.ink2 }]}>
                    Standard Search Mode
                  </Text>
                )}
              </View>
            </View>

            {/* Buddy Blurb (if buddy exists) */}
            {!isGuest && profile.buddy?.blurb ? (
              <View
                style={[
                  styles.buddyBlurbBox,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.buddyBlurbText, { color: palette.ink2 }]}>
                  "{profile.buddy.blurb}"
                </Text>
              </View>
            ) : null}
          </View>

          {/* Section 2: Finding Medicine For & Age Group */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <Text style={[styles.sectionHeading, { color: palette.ink }]}>
              {t('who_finding_for', "Who I'm finding medicine for")}
            </Text>
            <Text style={[styles.sectionCaption, { color: palette.ink2 }]}>
              {t('tailors_recommendations', 'Tailors search results and recommendations')}
            </Text>

            {/* Who Chips */}
            <View style={styles.chipsRow}>
              {WHO_CHIP_OPTIONS.map((opt) => {
                const isSelected = profile.who === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => handleSelectWho(opt.id)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Finding medicine for: ${opt.label}`}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected
                          ? palette.accent || theme.primaryAccent
                          : palette.surface2,
                        borderColor: isSelected
                          ? palette.accent || theme.primaryAccent
                          : palette.line,
                      },
                    ]}
                  >
                    {isSelected && (
                      <CheckCircleIcon size={14} color={palette.surface} />
                    )}
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: isSelected ? palette.surface : palette.ink,
                          fontFamily: isSelected ? fonts.sansSemi : fonts.sans,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.divider, { backgroundColor: palette.line }]} />

            <Text style={[styles.sectionHeading, { color: palette.ink }]}>
              {t('age_group_title', 'Age group')}
            </Text>
            <Text style={[styles.sectionCaption, { color: palette.ink2 }]}>
              {t('age_group_sub', 'Used to suggest age-appropriate formulations')}
            </Text>

            {/* Age Chips */}
            <View style={styles.chipsRow}>
              {AGE_CHIP_OPTIONS.map((opt) => {
                const isSelected = profile.ageGroup === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => handleSelectAge(opt.id)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Age group: ${opt.label}`}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected
                          ? palette.accent || theme.primaryAccent
                          : palette.surface2,
                        borderColor: isSelected
                          ? palette.accent || theme.primaryAccent
                          : palette.line,
                      },
                    ]}
                  >
                    {isSelected && (
                      <CheckCircleIcon size={14} color={palette.surface} />
                    )}
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: isSelected ? palette.surface : palette.ink,
                          fontFamily: isSelected ? fonts.sansSemi : fonts.sans,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Section 3: My Answers (5 Exact Questions) */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <Text style={[styles.sectionHeading, { color: palette.ink }]}>
              {t('my_answers', 'My answers')}
            </Text>
            <Text style={[styles.sectionCaption, { color: palette.ink2 }]}>
              {t('my_answers_sub', 'Adjust your preferences anytime. Recommendations update immediately.')}
            </Text>

            <View style={styles.togglesList}>
              {ANSWER_TOGGLE_DEFS.map((def, idx) => {
                const isEnabled = Boolean(profile.answers?.[def.key]);
                const isLast = idx === ANSWER_TOGGLE_DEFS.length - 1;

                return (
                  <View
                    key={def.key}
                    style={[
                      styles.toggleRow,
                      !isLast && { borderBottomWidth: 1, borderBottomColor: palette.line },
                    ]}
                  >
                    <Text style={[styles.toggleLabel, { color: palette.ink }]}>
                      {def.label}
                    </Text>
                    <Switch
                      value={isEnabled}
                      onValueChange={() => handleToggleAnswer(def.key)}
                      trackColor={{
                        false: palette.line,
                        true: palette.accent || theme.primaryAccent,
                      }}
                      thumbColor={palette.surface}
                      ios_backgroundColor={palette.line}
                      accessibilityLabel={def.label}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          {/* Section 4: Saved on this phone */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <Text style={[styles.sectionHeading, { color: palette.ink }]}>
              {t('saved_on_phone', 'Saved on this phone')}
            </Text>
            <Text style={[styles.sectionCaption, { color: palette.ink2 }]}>
              {t('saved_on_phone_sub', 'Local device storage counts and management')}
            </Text>

            {/* Row 1: Medicine Box */}
            <Pressable
              onPress={() => router.push('/medicine-box')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Medicine box: ${medicineBoxItems.length} items. Tap to open`}
              style={[styles.storageRow, { borderBottomColor: palette.line }]}
            >
              <View
                style={[
                  styles.storageIconBox,
                  {
                    backgroundColor:
                      scheme === 'light'
                        ? 'rgba(135, 169, 107, 0.16)'
                        : 'rgba(135, 169, 107, 0.25)',
                    borderColor:
                      scheme === 'light'
                        ? 'rgba(135, 169, 107, 0.35)'
                        : 'rgba(135, 169, 107, 0.45)',
                  },
                ]}
              >
                <PillCapsuleIcon
                  size={18}
                  color={scheme === 'light' ? '#4A7036' : '#87A96B'}
                />
              </View>

              <View style={styles.storageItemInfo}>
                <Text style={[styles.storageItemTitle, { color: palette.ink }]}>
                  {t('my_medicine_box', 'Medicine Box')}
                </Text>
                <Text style={[styles.storageItemSubtitle, { color: palette.ink2 }]}>
                  {medicineBoxItems.length} saved item{medicineBoxItems.length === 1 ? '' : 's'}
                </Text>
              </View>

              <View style={styles.rowActions}>
                {medicineBoxItems.length > 0 && (
                  <Pressable
                    onPress={handleClearMedicineBox}
                    hitSlop={8}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Clear medicine box items"
                    style={[styles.clearBtn, { borderColor: palette.line }]}
                  >
                    <Text style={[styles.clearBtnText, { color: theme.urgentAccent }]}>
                      Clear
                    </Text>
                  </Pressable>
                )}
                <ChevronRightIcon size={18} color={palette.ink2} />
              </View>
            </Pressable>

            {/* Row 2: Favorites */}
            <Pressable
              onPress={() => router.push('/(tabs)/search')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Saved medicines: ${favoritesCount} items`}
              style={[styles.storageRow, { borderBottomColor: palette.line }]}
            >
              <View
                style={[
                  styles.storageIconBox,
                  {
                    backgroundColor:
                      scheme === 'light'
                        ? 'rgba(217, 119, 6, 0.14)'
                        : 'rgba(245, 158, 11, 0.2)',
                    borderColor:
                      scheme === 'light'
                        ? 'rgba(217, 119, 6, 0.3)'
                        : 'rgba(245, 158, 11, 0.4)',
                  },
                ]}
              >
                <BookmarkIcon
                  size={18}
                  color={scheme === 'light' ? '#D97706' : '#FBBF24'}
                  filled={true}
                />
              </View>

              <View style={styles.storageItemInfo}>
                <Text style={[styles.storageItemTitle, { color: palette.ink }]}>
                  {t('saved_medicines_title', 'Saved Medicines')}
                </Text>
                <Text style={[styles.storageItemSubtitle, { color: palette.ink2 }]}>
                  {favoritesCount} saved item{favoritesCount === 1 ? '' : 's'}
                </Text>
              </View>

              <View style={styles.rowActions}>
                {favoritesCount > 0 && (
                  <Pressable
                    onPress={handleClearFavorites}
                    hitSlop={8}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Clear saved medicines"
                    style={[styles.clearBtn, { borderColor: palette.line }]}
                  >
                    <Text style={[styles.clearBtnText, { color: theme.urgentAccent }]}>
                      Clear
                    </Text>
                  </Pressable>
                )}
                <ChevronRightIcon size={18} color={palette.ink2} />
              </View>
            </Pressable>

            {/* Row 3: Recent Searches */}
            <Pressable
              onPress={() => router.push('/(tabs)/search')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Search history: ${recentSearchesCount} search terms`}
              style={[styles.storageRow, { borderBottomColor: palette.line }]}
            >
              <View
                style={[
                  styles.storageIconBox,
                  {
                    backgroundColor:
                      scheme === 'light'
                        ? 'rgba(59, 130, 246, 0.14)'
                        : 'rgba(96, 165, 250, 0.2)',
                    borderColor:
                      scheme === 'light'
                        ? 'rgba(59, 130, 246, 0.3)'
                        : 'rgba(96, 165, 250, 0.4)',
                  },
                ]}
              >
                <SearchIcon
                  size={18}
                  color={scheme === 'light' ? '#2563EB' : '#60A5FA'}
                />
              </View>

              <View style={styles.storageItemInfo}>
                <Text style={[styles.storageItemTitle, { color: palette.ink }]}>
                  {t('recent_searches_title', 'Recent Searches')}
                </Text>
                <Text style={[styles.storageItemSubtitle, { color: palette.ink2 }]}>
                  {recentSearchesCount} search term{recentSearchesCount === 1 ? '' : 's'}
                </Text>
              </View>

              <View style={styles.rowActions}>
                {recentSearchesCount > 0 && (
                  <Pressable
                    onPress={handleClearRecentSearches}
                    hitSlop={8}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Clear recent searches"
                    style={[styles.clearBtn, { borderColor: palette.line }]}
                  >
                    <Text style={[styles.clearBtnText, { color: theme.urgentAccent }]}>
                      {t('clear', 'Clear')}
                    </Text>
                  </Pressable>
                )}
                <ChevronRightIcon size={18} color={palette.ink2} />
              </View>
            </Pressable>

            {/* Row 4: Location Preference */}
            <View
              style={[
                styles.storageRow,
                { borderBottomWidth: 0 },
              ]}
            >
              <View
                style={[
                  styles.storageIconBox,
                  {
                    backgroundColor:
                      scheme === 'light'
                        ? 'rgba(14, 165, 233, 0.14)'
                        : 'rgba(56, 189, 248, 0.2)',
                    borderColor:
                      scheme === 'light'
                        ? 'rgba(14, 165, 233, 0.3)'
                        : 'rgba(56, 189, 248, 0.4)',
                  },
                ]}
              >
                <MapPinIcon
                  size={18}
                  color={scheme === 'light' ? '#0284C7' : '#38BDF8'}
                />
              </View>

              <View style={styles.storageItemInfo}>
                <Text style={[styles.storageItemTitle, { color: palette.ink }]}>
                  {t('location_preference_title', 'Location Preference')}
                </Text>
                <Text style={[styles.storageItemSubtitle, { color: palette.ink2 }]}>
                  {areaName} • {locationSource === 'gps' ? 'Device GPS' : locationSource === 'manual_area' ? 'Manual area' : 'Default'}
                </Text>
                <Text style={[styles.osmPrivacyNotice, { color: palette.ink2 }]}>
                  {t('osm_privacy_notice', 'Nearby places are looked up with your approximate location using OpenStreetMap servers.')}
                </Text>
              </View>

              <View style={styles.rowActions}>
                {locationSource !== 'none' && (
                  <Pressable
                    onPress={handleClearLocation}
                    hitSlop={8}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Reset location preference"
                    style={[styles.clearBtn, { borderColor: palette.line }]}
                  >
                    <Text style={[styles.clearBtnText, { color: theme.urgentAccent }]}>
                      {t('clear', 'Clear')}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>

          {/* Section 5: Emergency & Safety References */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <Text style={[styles.sectionHeading, { color: palette.ink }]}>
              {t('emergency_country_ref_title', 'Emergency & Country References')}
            </Text>
            <Text style={[styles.sectionCaption, { color: palette.ink2 }]}>
              {t('emergency_country_ref_sub', 'Worldwide emergency lines and dialing codes directory')}
            </Text>

            <Pressable
              onPress={() => router.push('/emergency-directory')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Open worldwide emergency directory for 87 countries"
              style={[styles.storageRow, { borderBottomWidth: 0 }]}
            >
              <View
                style={[
                  styles.storageIconBox,
                  {
                    backgroundColor:
                      scheme === 'light'
                        ? 'rgba(37, 99, 235, 0.12)'
                        : 'rgba(56, 189, 248, 0.18)',
                    borderColor:
                      scheme === 'light'
                        ? 'rgba(37, 99, 235, 0.25)'
                        : 'rgba(56, 189, 248, 0.35)',
                  },
                ]}
              >
                <GlobeIcon
                  size={18}
                  color={scheme === 'light' ? '#1D4ED8' : '#38BDF8'}
                />
              </View>

              <View style={styles.storageItemInfo}>
                <Text style={[styles.storageItemTitle, { color: palette.ink }]}>
                  {t('worldwide_directory', 'Worldwide Emergency Directory')}
                </Text>
                <Text style={[styles.storageItemSubtitle, { color: palette.ink2 }]}>
                  {t('worldwide_directory_sub', '87 countries • Calling codes • Police, ambulance & fire numbers')}
                </Text>
              </View>

              <View style={styles.rowActions}>
                <ChevronRightIcon size={18} color={palette.ink2} />
              </View>
            </Pressable>
          </View>

          {/* Section 6: Change Role */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <Pressable
              testID="profile-change-role-btn"
              onPress={handleChangeRole}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Change role"
              style={[styles.storageRow, { borderBottomWidth: 0 }]}
            >
              <View
                style={[
                  styles.storageIconBox,
                  {
                    backgroundColor:
                      scheme === 'light'
                        ? 'rgba(13, 148, 136, 0.14)'
                        : 'rgba(45, 212, 191, 0.18)',
                    borderColor:
                      scheme === 'light'
                        ? 'rgba(13, 148, 136, 0.3)'
                        : 'rgba(45, 212, 191, 0.35)',
                  },
                ]}
              >
                <RefreshIcon
                  size={18}
                  color={scheme === 'light' ? '#0D9488' : '#2DD4BF'}
                />
              </View>

              <View style={styles.storageItemInfo}>
                <Text style={[styles.storageItemTitle, { color: palette.ink }]}>
                  {t('change_role', 'Change role')}
                </Text>
                <Text style={[styles.storageItemSubtitle, { color: palette.ink2 }]}>
                  {t('change_role_sub', 'Switch between customer and pharmacy staff')}
                </Text>
              </View>

              <View style={styles.rowActions}>
                <ChevronRightIcon size={18} color={palette.ink2} />
              </View>
            </Pressable>
          </View>

          {/* Section 7: Clear Everything (Full Reset) */}
          <View
            style={[
              styles.dangerCard,
              {
                backgroundColor: theme.emergencyBackground,
                borderColor: theme.emergencyBorder,
              },
            ]}
          >
            <View style={styles.dangerHeaderRow}>
              <View
                style={[
                  styles.dangerIconBox,
                  { backgroundColor: theme.urgentAccent },
                ]}
              >
                <TrashIcon size={16} color="#FFFFFF" />
              </View>

              <View style={styles.dangerTextGroup}>
                <Text style={[styles.dangerTitle, { color: theme.emergencyText }]}>
                  {t('clear_everything', 'Clear everything')}
                </Text>
                <Text style={[styles.dangerSubtitle, { color: theme.emergencyText }]}>
                  {t('clear_everything_sub', 'Deletes all profile data, medicine box items, and searches. Theme and language settings will be kept.')}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleClearEverything}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear everything. Permanently wipe all personal data from this device"
              style={[
                styles.dangerButton,
                {
                  backgroundColor: theme.urgentAccent,
                  shadowColor: palette.shadow,
                },
              ]}
            >
              <TrashIcon size={16} color="#FFFFFF" />
              <Text style={styles.dangerButtonText}>{t('delete_everything_btn', 'Delete Everything')}</Text>
            </Pressable>
          </View>

          {/* Footer Privacy Note */}
          <View style={styles.privacyFooter}>
            <ShieldCheckIcon size={16} color={palette.ink2} />
            <Text style={[styles.privacyFooterText, { color: palette.ink2 }]}>
              {t('saved_only_on_phone', 'Everything here is saved only on this phone.')}
            </Text>
            <Text style={[styles.privacySubText, { color: palette.ink2 }]}>
              {t('no_tracking_sub', 'No tracking: MedFind never records which medicines you view or places you visit.')}
            </Text>
          </View>
        </ScrollView>
      </AnimatedScreenTransition>

      {/* Edit Name Modal */}
      <Modal
        visible={showEditNameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditNameModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowEditNameModal(false)}
        >
          <Pressable
            style={[
              styles.editModalCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                shadowColor: palette.shadow,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.editModalHeader}>
              <Text style={[styles.editModalTitle, { color: palette.ink }]}>
                Edit Display Name
              </Text>
              <Pressable
                onPress={() => setShowEditNameModal(false)}
                hitSlop={8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close name dialog"
                style={[styles.closeModalBtn, { borderColor: palette.line }]}
              >
                <CloseIcon size={16} color={palette.ink2} />
              </Pressable>
            </View>

            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter your name"
              placeholderTextColor={palette.ink2}
              maxLength={24}
              autoFocus={true}
              style={[
                styles.modalTextInput,
                {
                  backgroundColor: palette.surface2,
                  borderColor: palette.line,
                  color: palette.ink,
                },
              ]}
            />

            <View style={styles.modalButtonsRow}>
              <Pressable
                onPress={() => setShowEditNameModal(false)}
                style={[
                  styles.modalCancelBtn,
                  { borderColor: palette.line, backgroundColor: palette.surface2 },
                ]}
              >
                <Text style={[styles.modalCancelText, { color: palette.ink2 }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSaveName}
                style={[
                  styles.modalSaveBtn,
                  { backgroundColor: palette.accent || theme.primaryAccent },
                ]}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingHorizontal: 16,
    gap: 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  backButton: {
    width: MIN_TARGET,
    height: MIN_TARGET,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  navTitleContainer: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 20,
    fontFamily: fonts.sansBold,
  },
  screenSubtitle: {
    fontSize: 12,
    fontFamily: fonts.sans,
    marginTop: 2,
  },
  card: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mascotImage: {
    width: 52,
    height: 52,
  },
  profileTextGroup: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileNameText: {
    fontSize: 18,
    fontFamily: fonts.sansBold,
  },
  editBadge: {
    padding: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  buddyBadgeRow: {
    flexDirection: 'row',
  },
  buddyTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  buddyTagText: {
    fontSize: 12,
    fontFamily: fonts.sansSemi,
  },
  guestCaption: {
    fontSize: 13,
    fontFamily: fonts.sans,
  },
  buddyBlurbBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  buddyBlurbText: {
    fontSize: 13,
    fontFamily: fonts.sans,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 15,
    fontFamily: fonts.sansBold,
  },
  sectionCaption: {
    fontSize: 12,
    fontFamily: fonts.sans,
    marginTop: 2,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 38,
  },
  chipText: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  togglesList: {
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.sansMedium,
    lineHeight: 20,
  },
  storageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  storageIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageItemInfo: {
    flex: 1,
  },
  storageItemTitle: {
    fontSize: 14,
    fontFamily: fonts.sansSemi,
  },
  storageItemSubtitle: {
    fontSize: 12,
    fontFamily: fonts.sans,
    marginTop: 2,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  clearBtnText: {
    fontSize: 12,
    fontFamily: fonts.sansSemi,
  },
  dangerCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  dangerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dangerIconBox: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerTextGroup: {
    flex: 1,
  },
  dangerTitle: {
    fontSize: 15,
    fontFamily: fonts.sansBold,
  },
  dangerSubtitle: {
    fontSize: 12,
    fontFamily: fonts.sans,
    marginTop: 4,
    lineHeight: 18,
    opacity: 0.9,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radii.pill,
    minHeight: 44,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.sansBold,
  },
  privacyFooter: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  privacyFooterText: {
    fontSize: 13,
    fontFamily: fonts.sansMedium,
  },
  privacySubText: {
    fontSize: 11,
    fontFamily: fonts.sans,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editModalTitle: {
    fontSize: 16,
    fontFamily: fonts.sansBold,
  },
  closeModalBtn: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTextInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: fonts.sans,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 13,
    fontFamily: fonts.sansSemi,
  },
  modalSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fonts.sansSemi,
  },
  osmPrivacyNotice: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
});
