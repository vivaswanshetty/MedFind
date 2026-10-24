export type BuddyProfile = {
  archetype: string;
  name: string;
  traits: string[];
  blurb: string;
};

interface ArchetypeConfig {
  archetype: string;
  name: string;
  blurb: string;
  trait: string;
}

const QUESTION_ARCHETYPES: ArchetypeConfig[] = [
  {
    archetype: 'The Organizer',
    name: 'Remy',
    trait: 'Organized',
    blurb: "I'll keep your medicine box tidy and expiry dates in check.",
  },
  {
    archetype: 'The Hunter',
    name: 'Juno',
    trait: 'Persistent',
    blurb: "I'll track down verified pharmacy stock so you never make an empty trip.",
  },
  {
    archetype: 'The Caregiver',
    name: 'Cleo',
    trait: 'Caring',
    blurb: "I'll help you coordinate prescriptions and refills for everyone you care for.",
  },
  {
    archetype: 'The Planner',
    name: 'Milo',
    trait: 'Punctual',
    blurb: "I'll make sure your medication schedule and dose reminders run like clockwork.",
  },
  {
    archetype: 'The Smart Saver',
    name: 'Nova',
    trait: 'Savvy',
    blurb: "I'll highlight verified nearby options so you always find the best pharmacy value.",
  },
];

const DEFAULT_ARCHETYPE: BuddyProfile = {
  archetype: 'The Explorer',
  name: 'Pip',
  traits: ['Curious'],
  blurb: "I'll guide you through finding verified medicine and care wherever you are.",
};

/**
 * Deterministically generates a BuddyProfile from the user's swipe-card answers.
 * Answers order: [medicineBox, stockIssues, buysForFamily, wantsReminders, comparesPrices]
 */
export function getBuddy(answers: boolean[]): BuddyProfile {
  const traits: string[] = [];
  let primaryConfig: ArchetypeConfig | null = null;

  for (let i = 0; i < QUESTION_ARCHETYPES.length; i++) {
    if (answers[i]) {
      traits.push(QUESTION_ARCHETYPES[i].trait);
      if (!primaryConfig) {
        primaryConfig = QUESTION_ARCHETYPES[i];
      }
    }
  }

  if (!primaryConfig) {
    return { ...DEFAULT_ARCHETYPE };
  }

  return {
    archetype: primaryConfig.archetype,
    name: primaryConfig.name,
    traits,
    blurb: primaryConfig.blurb,
  };
}
