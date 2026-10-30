import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { useFonts } from 'expo-font';

// Configure Reanimated logger: disable strict mode check that flags React 19 concurrent renders
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});
import { initNotifications } from '../lib/notifications';

initNotifications();

import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { LocationProvider } from '../context/LocationContext';
import { LanguageProvider } from '../context/LanguageContext';
import { SplashIntro } from '../components/onboarding/SplashIntro';
import { RolePicker, UserRoleChoice } from '../components/onboarding/RolePicker';
import { WhoPicker, WhoOption } from '../components/onboarding/WhoPicker';
import { AgePicker, AgeGroup } from '../components/onboarding/AgePicker';
import { SwipeCardsEnhanced } from '../components/onboarding/SwipeCardsEnhanced';
import { BuddyReveal } from '../components/onboarding/BuddyReveal';
import { NamePicker } from '../components/onboarding/NamePicker';
import { ProfileFieldsStep } from '../components/onboarding/ProfileFieldsStep';
import { LocationStep } from '../components/onboarding/LocationStep';
import { AllDone } from '../components/onboarding/AllDone';
import { EmergencySkip } from '../components/onboarding/EmergencySkip';
import { BuddyProfile } from '../lib/buddy';
import { ProfileProvider, useProfile, mapSwipeAnswers, UserRole, isProviderRole, BloodGroup, Gender } from '../store/profile';
import { MedicineBoxProvider } from '../store/medicineBox';
import { fonts } from '../constants/theme';
import { WebCursorGlow } from '../components/WebCursorGlow';

import { resolveRouteAccess } from '../lib/routeGuard';

function RootNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { scheme, palette } = useTheme();
  const { profile, isLoading, saveProfile, updateProfile } = useProfile();

  const isEmergencyRoute =
    pathname === '/emergency' ||
    pathname === '/(tabs)/emergency' ||
    pathname === '/emergency-directory';

  const needsOnboarding =
    profile.role === null ||
    (profile.role === 'customer' && !profile.onboardingComplete && !profile.onboardingSkippedAt);

  const [showSplash, setShowSplash] = useState(true);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showWhoPicker, setShowWhoPicker] = useState(false);
  const [showAgePicker, setShowAgePicker] = useState(false);
  const [showSwipeCards, setShowSwipeCards] = useState(false);
  const [showBuddyReveal, setShowBuddyReveal] = useState(false);
  const [showNamePicker, setShowNamePicker] = useState(false);
  const [showProfileFields, setShowProfileFields] = useState(false);
  const [showLocationStep, setShowLocationStep] = useState(false);
  const [showAllDone, setShowAllDone] = useState(false);
  const [selectedWho, setSelectedWho] = useState<WhoOption | null>(null);
  const [selectedAge, setSelectedAge] = useState<AgeGroup | null>(null);
  const [quickAnswers, setQuickAnswers] = useState<boolean[] | null>(null);
  const [selectedBuddy, setSelectedBuddy] = useState<BuddyProfile | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [profileFields, setProfileFields] = useState<{
    bloodGroup: BloodGroup | null;
    allergies: string[];
    gender: Gender | null;
  } | null>(null);

  // Re-launch role selection / onboarding if role becomes null or answers reset
  React.useEffect(() => {
    if (!isLoading && !showSplash) {
      // If user is currently viewing emergency help, never interrupt with onboarding overlays
      if (isEmergencyRoute) {
        setShowRolePicker(false);
        setShowWhoPicker(false);
        setShowAgePicker(false);
        setShowSwipeCards(false);
        setShowBuddyReveal(false);
        setShowNamePicker(false);
        setShowProfileFields(false);
        setShowLocationStep(false);
        setShowAllDone(false);
        return;
      }
      if (profile.role === null) {
        if (!showRolePicker) {
          setShowWhoPicker(false);
          setShowAgePicker(false);
          setShowSwipeCards(false);
          setShowBuddyReveal(false);
          setShowNamePicker(false);
          setShowProfileFields(false);
          setShowLocationStep(false);
          setShowAllDone(false);
          setShowRolePicker(true);
        }
      } else if (
        profile.role === 'customer' &&
        !profile.onboardingComplete &&
        !profile.onboardingSkippedAt &&
        !showRolePicker &&
        !showWhoPicker &&
        !showAgePicker &&
        !showSwipeCards &&
        !showBuddyReveal &&
        !showNamePicker &&
        !showProfileFields &&
        !showLocationStep &&
        !showAllDone
      ) {
        setShowWhoPicker(true);
      }
    }
  }, [
    profile.role,
    profile.onboardingComplete,
    profile.onboardingSkippedAt,
    isLoading,
    showSplash,
    showRolePicker,
    showWhoPicker,
    showAgePicker,
    showSwipeCards,
    showBuddyReveal,
    showNamePicker,
    showProfileFields,
    showLocationStep,
    showAllDone,
    isEmergencyRoute,
  ]);

  // Route access guard effect — debounced to let programmatic navigation
  // (e.g. sign-out, change-role) settle before enforcing route rules.
  React.useEffect(() => {
    if (isLoading) return;
    const redirectTarget = resolveRouteAccess(profile.role, pathname);
    if (redirectTarget && redirectTarget !== pathname) {
      const timer = setTimeout(() => {
        router.replace(redirectTarget as any);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [profile.role, pathname, isLoading, router]);

  const handleSelectRole = async (role: UserRoleChoice) => {
    await updateProfile({ role });
    setShowRolePicker(false);
    if (role === 'customer') {
      setShowWhoPicker(true);
      router.replace('/(tabs)');
    } else {
      // All provider roles (pharmacist, clinic, hospital) go to portal
      router.replace('/(pharmacy)');
    }
  };

  const handleEmergencySkip = async () => {
    setShowSplash(false);
    setShowRolePicker(false);
    setShowWhoPicker(false);
    setShowAgePicker(false);
    setShowSwipeCards(false);
    setShowBuddyReveal(false);
    setShowNamePicker(false);
    setShowProfileFields(false);
    setShowLocationStep(false);
    setShowAllDone(false);

    setSelectedWho(null);
    setSelectedAge(null);
    setQuickAnswers(null);
    setSelectedBuddy(null);
    setDisplayName(null);

    // Route directly to emergency screen immediately
    router.replace('/(tabs)/emergency');

    await updateProfile({
      role: 'customer',
      onboardingSkippedAt: new Date().toISOString(),
    });
  };

  const isOnboardingActive =
    !isEmergencyRoute &&
    (showSplash ||
      showRolePicker ||
      showWhoPicker ||
      showAgePicker ||
      showSwipeCards ||
      showBuddyReveal ||
      showNamePicker ||
      showProfileFields ||
      showLocationStep ||
      showAllDone);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 280,
          contentStyle: {
            backgroundColor: palette.bg,
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(pharmacy)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="medicine/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="portal"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="medicine-box"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="emergency-directory"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      {/* Prevent underlying screens from flashing through during splash or onboarding transitions */}
      {needsOnboarding && !isEmergencyRoute && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: palette.bg },
          ]}
          pointerEvents="none"
        />
      )}
      {showSplash && !isEmergencyRoute && (
        <SplashIntro
          fadeOut={!needsOnboarding}
          onDone={() => {
            setShowSplash(false);
            if (profile.role === null) {
              setShowRolePicker(true);
            } else if (profile.role === 'customer' && needsOnboarding) {
              setShowWhoPicker(true);
            } else if (isProviderRole(profile.role)) {
              router.replace('/(pharmacy)');
            }
          }}
        />
      )}
      {!isEmergencyRoute && showRolePicker && (
        <RolePicker onSelect={handleSelectRole} />
      )}
      {!isEmergencyRoute && showWhoPicker && (
        <WhoPicker
          onSelect={(who) => {
            setSelectedWho(who);
            setShowWhoPicker(false);
            setShowAgePicker(true);
          }}
        />
      )}
      {!isEmergencyRoute && showAgePicker && selectedWho && (
        <AgePicker
          who={selectedWho}
          onSelect={(age) => {
            setSelectedAge(age);
            setShowAgePicker(false);
            setShowSwipeCards(true);
          }}
        />
      )}
      {!isEmergencyRoute && showSwipeCards && (
        <SwipeCardsEnhanced
          ageGroup={selectedAge || undefined}
          onDone={(answers) => {
            setQuickAnswers(answers);
            setShowSwipeCards(false);
            setShowBuddyReveal(true);
          }}
        />
      )}
      {!isEmergencyRoute && showBuddyReveal && quickAnswers && (
        <BuddyReveal
          answers={quickAnswers}
          onDone={(buddy) => {
            setSelectedBuddy(buddy);
            setShowBuddyReveal(false);
            setShowNamePicker(true);
          }}
        />
      )}
      {!isEmergencyRoute && showNamePicker && selectedBuddy && (
        <NamePicker
          buddyName={selectedBuddy.name}
          onDone={(name) => {
            setDisplayName(name);
            setShowNamePicker(false);
            setShowProfileFields(true);
          }}
        />
      )}
      {!isEmergencyRoute && showProfileFields && (
        <ProfileFieldsStep
          onDone={(fields) => {
            setProfileFields(fields as any);
            setShowProfileFields(false);
            setShowLocationStep(true);
          }}
        />
      )}
      {!isEmergencyRoute && showLocationStep && (
        <LocationStep
          onDone={() => {
            setShowLocationStep(false);
            setShowAllDone(true);
          }}
        />
      )}
      {!isEmergencyRoute && showAllDone && (
        <AllDone
          name={displayName}
          onDone={async () => {
            const answersObj = quickAnswers ? mapSwipeAnswers(quickAnswers) : null;
            await saveProfile({
              role: 'customer',
              who: selectedWho,
              ageGroup: selectedAge,
              answers: answersObj,
              buddy: selectedBuddy,
              buddyName: selectedBuddy?.name ?? null,
              buddyTrait: selectedBuddy?.traits[0] ?? null,
              displayName: displayName,
              bloodGroup: profileFields?.bloodGroup ?? null,
              allergies: profileFields?.allergies ?? [],
              gender: profileFields?.gender ?? null,
              onboardingComplete: true,
              onboardingSkippedAt: null,
              dismissedSetupCard: false,
              hasSeenFirstHomeVisit: false,
              createdAt: new Date().toISOString(),
            });
            setShowAllDone(false);
            router.replace('/(tabs)');
          }}
        />
      )}
      {isOnboardingActive && (
        <EmergencySkip onSkip={handleEmergencySkip} />
      )}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'SF-Pro-Display-Regular': require('../../assets/fonts/SF-Pro-Display-Regular.otf'),
    'SF-Pro-Display-Medium': require('../../assets/fonts/SF-Pro-Display-Medium.otf'),
    'SF-Pro-Display-Semibold': require('../../assets/fonts/SF-Pro-Display-Semibold.otf'),
    'SF-Pro-Display-Bold': require('../../assets/fonts/SF-Pro-Display-Bold.otf'),
    'SF Pro Display': require('../../assets/fonts/SF-Pro-Display-Regular.otf'),
    'SFProDisplay-Bold': require('../../assets/fonts/SF-Pro-Display-Bold.otf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <WebCursorGlow />
          <LanguageProvider>
            <LocationProvider>
              <ProfileProvider>
                <MedicineBoxProvider>
                  <RootNavigation />
                </MedicineBoxProvider>
              </ProfileProvider>
            </LocationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
