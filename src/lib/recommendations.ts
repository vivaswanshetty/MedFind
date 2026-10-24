/**
 * Recommendation Engine for MedFind
 * 
 * Safety & Privacy Boundaries:
 * - Recommendations are generated strictly on-device using local profile preferences.
 * - Recommends verified categories, facilities, checklist reminders, and guidance tips only.
 * - NEVER recommends a specific drug, dose, or medical diagnosis.
 * - NEVER infers a medical condition from user preferences.
 * - Non-existent features (medicine box, price comparison, stock alert push) produce no cards.
 */

import { Profile } from '../store/profile';
import { BuddyProfile } from './buddy';

export type RecommendationKind = 'category' | 'feature' | 'tip';

export interface Recommendation {
  id: string;
  title: string;
  subtitle: string;
  kind: RecommendationKind;
  route?: string;
  whyReason: string;
  dismissible?: boolean;
}

export interface GreetingInfo {
  headline: string;
  caption: string;
  subline: string;
  isFirstVisit: boolean;
  isGuest?: boolean;
}

/**
 * Returns deterministic recommendations based strictly on existing features and user profile preferences.
 */
export function getRecommendations(profile: Profile | null | undefined): Recommendation[] {
  if (!profile) return [];

  const recs: Recommendation[] = [];

  // Rule 0: Onboarding skipped -> show "Finish setting up (takes 1 minute)"
  if (profile.onboardingSkippedAt && !profile.onboardingComplete && !profile.dismissedSetupCard) {
    recs.push({
      id: 'rec-finish-setup',
      title: 'Finish setting up (takes 1 minute)',
      subtitle: 'Personalize your buddy, notifications, and recommendations',
      kind: 'feature',
      route: 'restart-onboarding',
      whyReason: 'Because you skipped initial setup',
      dismissible: true,
    });
  }

  // Rule 1: Stock issues -> prioritize "Check availability near you"
  if (profile.answers?.stockIssues) {
    recs.push({
      id: 'rec-stock-availability',
      title: 'Check availability near you',
      subtitle: 'Search nearby verified pharmacies before making an unnecessary trip',
      kind: 'feature',
      route: '/(tabs)/search',
      whyReason: "Because you said you've struggled to find a medicine in stock",
    });
  }

  // Rule 2: Child / Under-18 preferences
  const isChildOrMinor =
    profile.who === 'child' ||
    profile.ageGroup === 'under5' ||
    profile.ageGroup === '5to12' ||
    profile.ageGroup === '13to17';

  if (isChildOrMinor) {
    // (a) Find a pediatric clinic linking to Care directory (clinic filter)
    recs.push({
      id: 'rec-pediatric-clinic',
      title: 'Find a pediatric clinic',
      subtitle: 'View verified primary healthcare clinics and pediatric consultation centers nearby',
      kind: 'category',
      route: '/(tabs)/care?category=clinic',
      whyReason:
        profile.who === 'child'
          ? 'Because you are managing healthcare for your child'
          : 'Because you selected an age group under 18',
    });

    // (b) Under 5 safety tip
    if (profile.ageGroup === 'under5') {
      recs.push({
        id: 'rec-under5-safety-tip',
        title: 'For your child',
        subtitle:
          'Always check the label and ask a pharmacist or doctor before giving any medicine to a young child.',
        kind: 'tip',
        route: undefined,
        whyReason: 'Important safety guidance for infants and toddlers under 5',
      });
    }
  }

  // Rule 3: Senior (60plus)
  if (profile.ageGroup === '60plus') {
    // (a) General Care directory link (do not describe as chronic care)
    recs.push({
      id: 'rec-senior-care-directory',
      title: 'Explore healthcare facilities',
      subtitle: 'Browse verified hospitals, outpatient centers, and clinics in your area',
      kind: 'category',
      route: '/(tabs)/care',
      whyReason: 'Because you selected the 60 and above age group',
    });

    // (b) Senior interaction safety tip
    recs.push({
      id: 'rec-senior-interactions-tip',
      title: 'Medication Interaction Tip',
      subtitle: 'Ask a pharmacist about interactions when taking several medicines.',
      kind: 'tip',
      route: undefined,
      whyReason: 'Important safety check when managing multiple prescription medications',
    });
  }

  // Rule 4: Medicine Box & Reminders (answers.medicineBox, answers.wantsReminders)
  const hasMedicineBox = Boolean(profile.answers?.medicineBox);
  const wantsReminders = Boolean(profile.answers?.wantsReminders);

  if (hasMedicineBox && wantsReminders) {
    // If BOTH are true, show only ONE combined card
    recs.push({
      id: 'rec-medicine-box-both',
      title: 'My Medicine Box',
      subtitle: 'Track your home medicines and get refill reminders',
      kind: 'feature',
      route: '/medicine-box',
      whyReason: 'Because you said you keep a medicine box at home and would like refill reminders',
    });
  } else if (hasMedicineBox) {
    recs.push({
      id: 'rec-medicine-box-only',
      title: 'Open your medicine box',
      subtitle: "Track what you have at home so you don't buy twice",
      kind: 'feature',
      route: '/medicine-box',
      whyReason: 'Because you said you keep a medicine box at home',
    });
  } else if (wantsReminders) {
    recs.push({
      id: 'rec-medicine-reminders-only',
      title: 'Set refill & expiry reminders',
      subtitle: 'Never run out of essentials',
      kind: 'feature',
      route: '/medicine-box',
      whyReason: "Because you said you'd like refill reminders",
    });
  }

  // Note: Gaps (answers.buysForFamily, answers.comparesPrices)
  // are intentionally omitted. No placeholder or "coming soon" cards.

  return recs;
}

/**
 * Generates personalized home greeting data based on profile, displayName, and buddy metadata.
 */
export function getHomeGreeting(profile: Profile | null | undefined): GreetingInfo {
  // If buddy is null and onboardingComplete is false (guest / skipped onboarding),
  // show plain "Welcome" with no buddy name, no archetype caption, and no mascot persona.
  const isGuest = !profile?.onboardingComplete && !profile?.buddy;
  if (isGuest) {
    return {
      headline: 'Welcome',
      caption: '',
      subline: '',
      isFirstVisit: false,
      isGuest: true,
    };
  }

  const displayName = profile?.displayName?.trim();
  const headline = displayName ? `Hi ${displayName}` : 'Welcome';

  // Extract buddy info (fallback to Pip, The Explorer if none recorded)
  const buddyName = profile?.buddy?.name || profile?.buddyName || 'Pip';
  const buddyArchetype = profile?.buddy?.archetype || 'The Explorer';
  const buddyBlurb =
    profile?.buddy?.blurb ||
    "I'll help you find verified medicines and care nearby.";

  const caption = `${buddyName}, ${buddyArchetype}`;
  const isFirstVisit = !profile?.hasSeenFirstHomeVisit;

  const subline = isFirstVisit
    ? buddyBlurb
    : 'Personalized recommendations based on your preferences';

  return {
    headline,
    caption,
    subline,
    isFirstVisit,
    isGuest: false,
  };
}
