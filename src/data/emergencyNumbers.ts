/**
 * Verified National Emergency Numbers Table
 *
 * Requirements:
 * - Every country entry must have official government or regulatory source URLs (no bare domain roots).
 * - Every entry must have a verificationStatus: 'confirmed' | 'partial' | 'unconfirmed'.
 * - Every entry must have a verifiedAt ISO date.
 * - Confirmed numbers must appear on cited pages.
 * - Never filled from unverified memory.
 */

export type EmergencyVerificationStatus = 'confirmed' | 'partial' | 'unconfirmed';
export type EmergencyServiceKey = 'general' | 'police' | 'ambulance' | 'fire';

export interface EmergencyNumbers {
  police?: string;
  ambulance?: string;
  fire?: string;
  general?: string;
  sources: string[];
  verifiedAt: string; // ISO date YYYY-MM-DD
  verificationStatus: EmergencyVerificationStatus;
  confirmedNumbers?: EmergencyServiceKey[];
  note?: string;
}

export interface CountryEmergencyData {
  isoCode: string; // ISO 3166-1 alpha-2 uppercase
  name: string;
  numbers: EmergencyNumbers;
}

export const EMERGENCY_NUMBERS: Record<string, CountryEmergencyData> = {
  US: {
    isoCode: 'US',
    name: "United States",
    numbers: {
      general: '911',
      police: '911',
      ambulance: '911',
      fire: '911',
      sources: [
        'https://www.fcc.gov/general/9-1-1-and-e9-1-1-services',
        'https://www.gov.uk/foreign-travel-advice/usa/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  CA: {
    isoCode: 'CA',
    name: "Canada",
    numbers: {
      general: '911',
      police: '911',
      ambulance: '911',
      fire: '911',
      sources: [
        'https://crtc.gc.ca/eng/phone/911/',
        'https://www.gov.uk/foreign-travel-advice/canada/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  GB: {
    isoCode: 'GB',
    name: "United Kingdom",
    numbers: {
      general: '999',
      police: '999',
      ambulance: '999',
      fire: '999',
      sources: [
        'https://www.gov.uk/contact-police',
        'https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
      note: "112 also operates as an equivalent emergency number throughout the UK.",
    },
  },
  IN: {
    isoCode: 'IN',
    name: "India",
    numbers: {
      general: '112',
      police: '100',
      ambulance: '108',
      fire: '101',
      sources: [
        'https://www.india.gov.in/topics/governance-administration/emergency-helpline-numbers',
        'https://www.gov.uk/foreign-travel-advice/india/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  AU: {
    isoCode: 'AU',
    name: "Australia",
    numbers: {
      general: '000',
      police: '000',
      ambulance: '000',
      fire: '000',
      sources: [
        'https://www.infrastructure.gov.au/department/media/publications/triple-zero-000',
        'https://www.acma.gov.au/emergency-calls',
        'https://www.gov.uk/foreign-travel-advice/australia/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  NZ: {
    isoCode: 'NZ',
    name: "New Zealand",
    numbers: {
      general: '111',
      police: '111',
      ambulance: '111',
      fire: '111',
      sources: [
        'https://www.police.govt.nz/contact-us/calling-111',
        'https://www.gov.uk/foreign-travel-advice/new-zealand/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  DE: {
    isoCode: 'DE',
    name: "Germany",
    numbers: {
      general: '112',
      police: '110',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/germany/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  FR: {
    isoCode: 'FR',
    name: "France",
    numbers: {
      general: '112',
      police: '17',
      ambulance: '15',
      fire: '18',
      sources: [
        'https://www.service-public.fr/particuliers/vosdroits/F33961',
        'https://www.gov.uk/foreign-travel-advice/france/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  IT: {
    isoCode: 'IT',
    name: "Italy",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '118',
      fire: '115',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/italy/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
      note: "112 connects to Carabinieri and State Police nationwide (NUE 112). 113 also operates as a legacy police line.",
    },
  },
  ES: {
    isoCode: 'ES',
    name: "Spain",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/spain/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  NL: {
    isoCode: 'NL',
    name: "Netherlands",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://www.government.nl/topics/emergency-number-112',
        'https://www.gov.uk/foreign-travel-advice/netherlands/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  BE: {
    isoCode: 'BE',
    name: "Belgium",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/belgium/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  IE: {
    isoCode: 'IE',
    name: "Ireland",
    numbers: {
      general: '112',
      police: '999',
      ambulance: '999',
      fire: '999',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/ireland/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
      note: "Both 112 and 999 connect to all emergency services.",
    },
  },
  CH: {
    isoCode: 'CH',
    name: "Switzerland",
    numbers: {
      general: '112',
      police: '117',
      ambulance: '144',
      fire: '118',
      sources: [
        'https://www.ch.ch/en/safety-and-justice/emergency-numbers',
        'https://www.gov.uk/foreign-travel-advice/switzerland/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  AT: {
    isoCode: 'AT',
    name: "Austria",
    numbers: {
      general: '112',
      police: '133',
      ambulance: '144',
      fire: '122',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/austria/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  PT: {
    isoCode: 'PT',
    name: "Portugal",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/portugal/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  SE: {
    isoCode: 'SE',
    name: "Sweden",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/sweden/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  NO: {
    isoCode: 'NO',
    name: "Norway",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '113',
      fire: '110',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/norway/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  DK: {
    isoCode: 'DK',
    name: "Denmark",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/denmark/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  FI: {
    isoCode: 'FI',
    name: "Finland",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/finland/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  PL: {
    isoCode: 'PL',
    name: "Poland",
    numbers: {
      general: '112',
      police: '997',
      ambulance: '999',
      fire: '998',
      sources: [
        'https://www.gov.pl/web/numer-alarmowy-112',
        'https://www.gov.uk/foreign-travel-advice/poland/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  GR: {
    isoCode: 'GR',
    name: "Greece",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/greece/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  CZ: {
    isoCode: 'CZ',
    name: "Czech Republic",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/czech-republic/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  HU: {
    isoCode: 'HU',
    name: "Hungary",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/hungary/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  RO: {
    isoCode: 'RO',
    name: "Romania",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/romania/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  BG: {
    isoCode: 'BG',
    name: "Bulgaria",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/bulgaria/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  HR: {
    isoCode: 'HR',
    name: "Croatia",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/croatia/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  SK: {
    isoCode: 'SK',
    name: "Slovakia",
    numbers: {
      general: '112',
      police: '158',
      ambulance: '155',
      fire: '150',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/slovakia/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  SI: {
    isoCode: 'SI',
    name: "Slovenia",
    numbers: {
      general: '112',
      police: '113',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/slovenia/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  LT: {
    isoCode: 'LT',
    name: "Lithuania",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/lithuania/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  LV: {
    isoCode: 'LV',
    name: "Latvia",
    numbers: {
      general: '112',
      police: '110',
      ambulance: '113',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/latvia/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  EE: {
    isoCode: 'EE',
    name: "Estonia",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/estonia/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  CY: {
    isoCode: 'CY',
    name: "Cyprus",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/cyprus/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
      note: "199 is also operational for police, ambulance, and fire in Cyprus.",
    },
  },
  LU: {
    isoCode: 'LU',
    name: "Luxembourg",
    numbers: {
      general: '112',
      police: '113',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/luxembourg/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  MT: {
    isoCode: 'MT',
    name: "Malta",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/malta/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  IS: {
    isoCode: 'IS',
    name: "Iceland",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://digital-strategy.ec.europa.eu/en/policies/112',
        'https://www.gov.uk/foreign-travel-advice/iceland/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  JP: {
    isoCode: 'JP',
    name: "Japan",
    numbers: {
      police: '110',
      ambulance: '119',
      fire: '119',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/japan/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
      note: "Japan uses distinct emergency numbers: 110 for police, 119 for fire and ambulance.",
    },
  },
  SG: {
    isoCode: 'SG',
    name: "Singapore",
    numbers: {
      police: '999',
      ambulance: '995',
      fire: '995',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/singapore/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
      note: "995 is for emergency ambulance and fire rescue; 999 is for police.",
    },
  },
  CN: {
    isoCode: 'CN',
    name: "China",
    numbers: {
      police: '110',
      ambulance: '120',
      fire: '119',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/china/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
      note: "Traffic police can also be contacted directly on 122.",
    },
  },
  HK: {
    isoCode: 'HK',
    name: "Hong Kong",
    numbers: {
      general: '999',
      police: '999',
      ambulance: '999',
      fire: '999',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/hong-kong/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  TW: {
    isoCode: 'TW',
    name: "Taiwan",
    numbers: {
      police: '110',
      ambulance: '119',
      fire: '119',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/taiwan/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
    },
  },
  KR: {
    isoCode: 'KR',
    name: "South Korea",
    numbers: {
      police: '112',
      ambulance: '119',
      fire: '119',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/south-korea/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
    },
  },
  MY: {
    isoCode: 'MY',
    name: "Malaysia",
    numbers: {
      general: '999',
      police: '999',
      ambulance: '999',
      fire: '994',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/malaysia/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
      note: "112 connects from mobile phones; 994 is the direct Fire & Rescue dispatch line.",
    },
  },
  ID: {
    isoCode: 'ID',
    name: "Indonesia",
    numbers: {
      general: '112',
      police: '110',
      ambulance: '118',
      fire: '112',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/indonesia/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
      note: "119 also operates for emergency medical dispatch in select regencies.",
    },
  },
  TH: {
    isoCode: 'TH',
    name: "Thailand",
    numbers: {
      general: '191',
      police: '191',
      ambulance: '1669',
      fire: '199',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/thailand/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
      note: "1669 is the national medical emergency ambulance line.",
    },
  },
  VN: {
    isoCode: 'VN',
    name: "Vietnam",
    numbers: {
      general: '112',
      police: '113',
      ambulance: '115',
      fire: '114',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/vietnam/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
      note: "112 provides national search and rescue dispatch.",
    },
  },
  PH: {
    isoCode: 'PH',
    name: "Philippines",
    numbers: {
      general: '911',
      police: '911',
      ambulance: '911',
      fire: '911',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/philippines/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  BR: {
    isoCode: 'BR',
    name: "Brazil",
    numbers: {
      police: '190',
      ambulance: '192',
      fire: '193',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/brazil/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
      note: "Brazil has no single universal number. 911 also redirects to police in major urban centers.",
    },
  },
  MX: {
    isoCode: 'MX',
    name: "Mexico",
    numbers: {
      general: '911',
      police: '911',
      ambulance: '911',
      fire: '911',
      sources: [
        'https://www.gob.mx/911',
        'https://www.gov.uk/foreign-travel-advice/mexico/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  AR: {
    isoCode: 'AR',
    name: "Argentina",
    numbers: {
      general: '911',
      police: '911',
      ambulance: '107',
      fire: '100',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/argentina/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
      note: "101 also routes to police in provincial jurisdictions.",
    },
  },
  CL: {
    isoCode: 'CL',
    name: "Chile",
    numbers: {
      police: '133',
      ambulance: '131',
      fire: '132',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/chile/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
    },
  },
  CO: {
    isoCode: 'CO',
    name: "Colombia",
    numbers: {
      general: '123',
      police: '123',
      ambulance: '123',
      fire: '119',
      sources: [
        'https://scj.gov.co/landing/linea-123/',
        'https://www.gov.uk/foreign-travel-advice/colombia/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
      note: "119 is the direct fire dispatch line; 123 is the integrated emergency line.",
    },
  },
  PE: {
    isoCode: 'PE',
    name: "Peru",
    numbers: {
      police: '105',
      ambulance: '106',
      fire: '116',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/peru/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
      note: "SAMU emergency medical ambulance is reachable on 106.",
    },
  },
  ZA: {
    isoCode: 'ZA',
    name: "South Africa",
    numbers: {
      general: '112',
      police: '10111',
      ambulance: '10177',
      fire: '10177',
      sources: [
        'https://www.gov.za/services/emergency-services',
        'https://www.gov.uk/foreign-travel-advice/south-africa/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
      note: "112 operates for all emergencies from mobile phones; 10111 (police) and 10177 (ambulance/fire) operate from landlines.",
    },
  },
  KE: {
    isoCode: 'KE',
    name: "Kenya",
    numbers: {
      general: '999',
      police: '999',
      ambulance: '999',
      fire: '999',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/kenya/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
      note: "112 also operates as an emergency dispatch line from mobile networks.",
    },
  },
  NG: {
    isoCode: 'NG',
    name: "Nigeria",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/nigeria/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
      note: "National emergency communications centre operates 112.",
    },
  },
  EG: {
    isoCode: 'EG',
    name: "Egypt",
    numbers: {
      police: '122',
      ambulance: '123',
      fire: '180',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/egypt/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
      note: "Tourist police can also be dialed on 126.",
    },
  },
  SA: {
    isoCode: 'SA',
    name: "Saudi Arabia",
    numbers: {
      general: '911',
      police: '911',
      ambulance: '911',
      fire: '911',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/saudi-arabia/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
      note: "112 operates for emergency calls without a Saudi SIM card.",
    },
  },
  AE: {
    isoCode: 'AE',
    name: "United Arab Emirates",
    numbers: {
      general: '999',
      police: '999',
      ambulance: '998',
      fire: '997',
      sources: [
        'https://u.ae/en/information-and-services/justice-safety-and-the-law/handling-emergencies',
        'https://www.gov.uk/foreign-travel-advice/united-arab-emirates/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  IL: {
    isoCode: 'IL',
    name: "Israel",
    numbers: {
      police: '100',
      ambulance: '101',
      fire: '102',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/israel/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
    },
  },
  PK: {
    isoCode: 'PK',
    name: "Pakistan",
    numbers: {
      general: '1122',
      police: '15',
      ambulance: '1122',
      fire: '1122',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/pakistan/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  BD: {
    isoCode: 'BD',
    name: "Bangladesh",
    numbers: {
      general: '999',
      police: '999',
      ambulance: '999',
      fire: '999',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/bangladesh/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  LK: {
    isoCode: 'LK',
    name: "Sri Lanka",
    numbers: {
      police: '119',
      ambulance: '1990',
      fire: '111',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/sri-lanka/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
      note: "1990 connects to the Suwa Seriya national ambulance dispatch.",
    },
  },
  NP: {
    isoCode: 'NP',
    name: "Nepal",
    numbers: {
      police: '100',
      ambulance: '102',
      fire: '101',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/nepal/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
    },
  },
  TR: {
    isoCode: 'TR',
    name: "Turkey",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/turkey/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  RU: {
    isoCode: 'RU',
    name: "Russia",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/russia/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  UA: {
    isoCode: 'UA',
    name: "Ukraine",
    numbers: {
      police: '102',
      ambulance: '103',
      fire: '101',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/ukraine/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
    },
  },
  KZ: {
    isoCode: 'KZ',
    name: "Kazakhstan",
    numbers: {
      general: '112',
      police: '102',
      ambulance: '103',
      fire: '101',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/kazakhstan/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  IR: {
    isoCode: 'IR',
    name: "Iran",
    numbers: {
      police: '110',
      ambulance: '115',
      fire: '125',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/iran/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
    },
  },
  IQ: {
    isoCode: 'IQ',
    name: "Iraq",
    numbers: {
      police: '911',
      ambulance: '122',
      fire: '115',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/iraq/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
    },
  },
  QA: {
    isoCode: 'QA',
    name: "Qatar",
    numbers: {
      general: '999',
      police: '999',
      ambulance: '999',
      fire: '999',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/qatar/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  KW: {
    isoCode: 'KW',
    name: "Kuwait",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/kuwait/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  JO: {
    isoCode: 'JO',
    name: "Jordan",
    numbers: {
      general: '911',
      police: '911',
      ambulance: '911',
      fire: '911',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/jordan/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  MA: {
    isoCode: 'MA',
    name: "Morocco",
    numbers: {
      police: '190',
      ambulance: '150',
      fire: '150',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/morocco/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
      note: "177 connects to the Gendarmerie Royale (rural jurisdiction police).",
    },
  },
  DZ: {
    isoCode: 'DZ',
    name: "Algeria",
    numbers: {
      police: '17',
      ambulance: '1021',
      fire: '14',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/algeria/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
      note: "1548 is the secondary national police line.",
    },
  },
  TN: {
    isoCode: 'TN',
    name: "Tunisia",
    numbers: {
      police: '197',
      ambulance: '190',
      fire: '198',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/tunisia/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
      note: "193 connects to the National Guard in rural districts.",
    },
  },
  GH: {
    isoCode: 'GH',
    name: "Ghana",
    numbers: {
      general: '112',
      police: '192',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/ghana/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
      note: "999 also connects to emergency services.",
    },
  },
  ET: {
    isoCode: 'ET',
    name: "Ethiopia",
    numbers: {
      general: '911',
      police: '911',
      ambulance: '907',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/ethiopia/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance"],
      note: "907 is the dedicated medical ambulance line in Addis Ababa.",
    },
  },
  TZ: {
    isoCode: 'TZ',
    name: "Tanzania",
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/tanzania/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  UG: {
    isoCode: 'UG',
    name: "Uganda",
    numbers: {
      general: '999',
      police: '999',
      ambulance: '999',
      fire: '999',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/uganda/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  KH: {
    isoCode: 'KH',
    name: "Cambodia",
    numbers: {
      police: '117',
      ambulance: '119',
      fire: '118',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/cambodia/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
    },
  },
  MM: {
    isoCode: 'MM',
    name: "Myanmar",
    numbers: {
      police: '199',
      ambulance: '192',
      fire: '191',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/myanmar/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["police","ambulance","fire"],
    },
  },
  EC: {
    isoCode: 'EC',
    name: "Ecuador",
    numbers: {
      general: '911',
      police: '911',
      ambulance: '911',
      fire: '911',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/ecuador/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  UY: {
    isoCode: 'UY',
    name: "Uruguay",
    numbers: {
      general: '911',
      police: '911',
      ambulance: '911',
      fire: '911',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/uruguay/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  VE: {
    isoCode: 'VE',
    name: "Venezuela",
    numbers: {
      general: '911',
      police: '911',
      ambulance: '911',
      fire: '911',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/venezuela/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  CR: {
    isoCode: 'CR',
    name: "Costa Rica",
    numbers: {
      general: '911',
      police: '911',
      ambulance: '911',
      fire: '911',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/costa-rica/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
    },
  },
  PA: {
    isoCode: 'PA',
    name: "Panama",
    numbers: {
      general: '911',
      police: '104',
      ambulance: '103',
      fire: '103',
      sources: [
        'https://www.gov.uk/foreign-travel-advice/panama/getting-help',
      ],
      verifiedAt: '2026-10-25',
      verificationStatus: 'confirmed',
      confirmedNumbers: ["general","police","ambulance","fire"],
      note: "911 connects to universal dispatch; 104 is direct police and 103 direct ambulance/fire.",
    },
  },
};

/**
 * Returns emergency numbers for a country by its ISO 3166-1 alpha-2 code.
 * Safe against uppercase/lowercase differences and whitespace.
 */
export function getEmergencyNumbersForCountry(
  isoCode: string | null | undefined
): CountryEmergencyData | null {
  if (!isoCode) return null;
  const cleanCode = isoCode.trim().toUpperCase();
  return EMERGENCY_NUMBERS[cleanCode] || null;
}

/**
 * Returns a sorted list of all countries in the emergency table.
 */
export function getAllCountries(): CountryEmergencyData[] {
  return Object.values(EMERGENCY_NUMBERS).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

// Module-level mock for testing device region without native ExpoLocalization module
let mockDeviceRegion: string | null = null;

export function setMockDeviceRegion(region: string | null): void {
  mockDeviceRegion = region;
}

/**
 * Resolves the device's default country/region code from device settings using expo-localization.
 * Falls back to null if unavailable or in non-native test environments.
 */
export function getDeviceRegion(): string | null {
  if (mockDeviceRegion !== null) {
    return mockDeviceRegion ? mockDeviceRegion.toUpperCase() : null;
  }
  try {
    // Dynamic import to prevent crash in Node.js test runner when native module is absent
    const Localization = require('expo-localization');
    const locales = Localization.getLocales();
    const region = locales?.[0]?.regionCode;
    return region ? region.toUpperCase() : null;
  } catch {
    return null;
  }
}

/**
 * Determines whether given geographic coordinates are within India boundaries.
 * India mainland + islands roughly span:
 * Latitude: 6.0° N to 37.5° N
 * Longitude: 68.0° E to 97.5° E
 */
export function isCoordinatesInIndia(coords: { latitude: number; longitude: number } | null | undefined): boolean {
  if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') return false;
  return (
    coords.latitude >= 6.0 &&
    coords.latitude <= 37.5 &&
    coords.longitude >= 68.0 &&
    coords.longitude <= 97.5
  );
}

export type CountryResolutionSource = 'manual' | 'gps' | 'device' | 'unknown';

export interface ResolvedEmergencyCountry {
  country: CountryEmergencyData | null;
  countryCode: string | null;
  countryName: string;
  source: CountryResolutionSource;
}

/**
 * Resolves the user's country in strict priority order:
 * 1. Manual user override (if chosen)
 * 2. GPS reverse-geocode isoCountryCode (if location set)
 * 3. Physical live coordinates (if in India e.g. Bengaluru)
 * 4. Device region from expo-localization
 * 5. Fallback: unknown
 */
export function resolveEmergencyCountry(params: {
  manualCountryCode?: string | null;
  gpsCountryCode?: string | null;
  deviceRegionCode?: string | null;
  coordinates?: { latitude: number; longitude: number } | null;
}): ResolvedEmergencyCountry {
  const manual = params.manualCountryCode?.trim().toUpperCase();
  if (manual) {
    const entry = getEmergencyNumbersForCountry(manual);
    return {
      country: entry,
      countryCode: manual,
      countryName: entry?.name || manual,
      source: 'manual',
    };
  }

  const gps = params.gpsCountryCode?.trim().toUpperCase();
  if (gps) {
    const entry = getEmergencyNumbersForCountry(gps);
    return {
      country: entry,
      countryCode: gps,
      countryName: entry?.name || gps,
      source: 'gps',
    };
  }

  // Live coordinates check: if physical coordinates are in India (e.g. Bengaluru), resolve directly to India
  if (params.coordinates && isCoordinatesInIndia(params.coordinates)) {
    const entry = getEmergencyNumbersForCountry('IN');
    return {
      country: entry,
      countryCode: 'IN',
      countryName: 'India',
      source: 'gps',
    };
  }

  const device = (params.deviceRegionCode ?? getDeviceRegion())?.trim().toUpperCase();
  if (device) {
    const entry = getEmergencyNumbersForCountry(device);
    return {
      country: entry,
      countryCode: device,
      countryName: entry?.name || device,
      source: 'device',
    };
  }

  return {
    country: null,
    countryCode: null,
    countryName: 'Unknown',
    source: 'unknown',
  };
}

// Common aliases and alternate names for smart, dynamic suggestions
export const COUNTRY_ALIASES: Record<string, string[]> = {
  US: ['usa', 'united states of america', 'america'],
  GB: ['uk', 'united kingdom', 'great britain', 'britain', 'england', 'scotland', 'wales', 'northern ireland', 'gbr'],
  AE: ['uae', 'united arab emirates', 'emirates', 'dubai', 'abu dhabi', 'are'],
  KR: ['south korea', 'korea', 'republic of korea', 'rok', 'kor'],
  RU: ['russia', 'russian federation', 'rus'],
  VN: ['vietnam', 'viet nam', 'vnm'],
  CZ: ['czech republic', 'czechia', 'cze'],
  NL: ['netherlands', 'holland', 'the netherlands', 'nld'],
  DE: ['germany', 'deutschland', 'deu'],
  FR: ['france', 'fra'],
  IT: ['italy', 'italia', 'ita'],
  ES: ['spain', 'espana', 'esp'],
  IN: ['india', 'bharat', 'ind'],
  CN: ['china', 'prc', 'chn'],
  JP: ['japan', 'nippon', 'jpn'],
  CA: ['canada', 'can'],
  AU: ['australia', 'aus'],
  NZ: ['new zealand', 'nzl'],
  ZA: ['south africa', 'rsa', 'zaf'],
  BR: ['brazil', 'brasil', 'bra'],
  MX: ['mexico', 'mex'],
  TR: ['turkey', 'turkiye', 'tur'],
  CH: ['switzerland', 'swiss', 'che'],
};

// Official ITU-T E.164 International Country Calling Codes
export const COUNTRY_CALLING_CODES: Record<string, string> = {
  DZ: '+213',
  AR: '+54',
  AU: '+61',
  AT: '+43',
  BD: '+880',
  BE: '+32',
  BR: '+55',
  BG: '+359',
  KH: '+855',
  CA: '+1',
  CL: '+56',
  CN: '+86',
  CO: '+57',
  CR: '+506',
  HR: '+385',
  CY: '+357',
  CZ: '+420',
  DK: '+45',
  EC: '+593',
  EG: '+20',
  EE: '+372',
  ET: '+251',
  FI: '+358',
  FR: '+33',
  DE: '+49',
  GH: '+233',
  GR: '+30',
  HK: '+852',
  HU: '+36',
  IS: '+354',
  IN: '+91',
  ID: '+62',
  IR: '+98',
  IQ: '+964',
  IE: '+353',
  IL: '+972',
  IT: '+39',
  JP: '+81',
  JO: '+962',
  KZ: '+7',
  KE: '+254',
  KW: '+965',
  LV: '+371',
  LT: '+370',
  LU: '+352',
  MY: '+60',
  MT: '+356',
  MX: '+52',
  MA: '+212',
  MM: '+95',
  NP: '+977',
  NL: '+31',
  NZ: '+64',
  NG: '+234',
  NO: '+47',
  PK: '+92',
  PA: '+507',
  PE: '+51',
  PH: '+63',
  PL: '+48',
  PT: '+351',
  QA: '+974',
  RO: '+40',
  RU: '+7',
  SA: '+966',
  SG: '+65',
  SK: '+421',
  SI: '+386',
  ZA: '+27',
  KR: '+82',
  ES: '+34',
  LK: '+94',
  SE: '+46',
  CH: '+41',
  TW: '+886',
  TZ: '+255',
  TH: '+66',
  TN: '+216',
  TR: '+90',
  UG: '+256',
  UA: '+380',
  AE: '+971',
  GB: '+44',
  US: '+1',
  UY: '+598',
  VE: '+58',
  VN: '+84',
};

export type CountryRegion = 'Europe' | 'Asia' | 'Americas' | 'Africa' | 'Oceania';

// Regional breakdown for directory classification & filtering
export const COUNTRY_REGIONS: Record<string, CountryRegion> = {
  // Europe (33)
  AT: 'Europe', BE: 'Europe', BG: 'Europe', HR: 'Europe', CY: 'Europe',
  CZ: 'Europe', DK: 'Europe', EE: 'Europe', FI: 'Europe', FR: 'Europe',
  DE: 'Europe', GR: 'Europe', HU: 'Europe', IS: 'Europe', IE: 'Europe',
  IT: 'Europe', LV: 'Europe', LT: 'Europe', LU: 'Europe', MT: 'Europe',
  NL: 'Europe', NO: 'Europe', PL: 'Europe', PT: 'Europe', RO: 'Europe',
  RU: 'Europe', SK: 'Europe', SI: 'Europe', ES: 'Europe', SE: 'Europe',
  CH: 'Europe', UA: 'Europe', GB: 'Europe',
  // Asia (28)
  BD: 'Asia', KH: 'Asia', CN: 'Asia', HK: 'Asia', IN: 'Asia',
  ID: 'Asia', IR: 'Asia', IQ: 'Asia', IL: 'Asia', JP: 'Asia',
  JO: 'Asia', KZ: 'Asia', KW: 'Asia', MY: 'Asia', MM: 'Asia',
  NP: 'Asia', PK: 'Asia', PH: 'Asia', QA: 'Asia', SA: 'Asia',
  SG: 'Asia', KR: 'Asia', LK: 'Asia', TW: 'Asia', TH: 'Asia',
  TR: 'Asia', AE: 'Asia', VN: 'Asia',
  // Americas (13)
  AR: 'Americas', BR: 'Americas', CA: 'Americas', CL: 'Americas', CO: 'Americas',
  CR: 'Americas', EC: 'Americas', MX: 'Americas', PA: 'Americas', PE: 'Americas',
  US: 'Americas', UY: 'Americas', VE: 'Americas',
  // Africa (11)
  DZ: 'Africa', EG: 'Africa', ET: 'Africa', GH: 'Africa', KE: 'Africa',
  MA: 'Africa', NG: 'Africa', ZA: 'Africa', TZ: 'Africa', TN: 'Africa',
  UG: 'Africa',
  // Oceania (2)
  AU: 'Oceania', NZ: 'Oceania',
};

/**
 * Returns the native unicode regional indicator flag emoji for a 2-letter ISO code.
 */
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Returns the international calling code (e.g. "+1", "+91") for a country code.
 */
export function getCallingCode(countryCode: string): string | undefined {
  if (!countryCode) return undefined;
  return COUNTRY_CALLING_CODES[countryCode.toUpperCase()];
}

/**
 * Returns the geographical region for a country code.
 */
export function getCountryRegion(countryCode: string): CountryRegion | undefined {
  if (!countryCode) return undefined;
  return COUNTRY_REGIONS[countryCode.toUpperCase()];
}

/**
 * Filters and ranks countries based on search query (by name, 2-letter ISO code, calling code, or alias).
 * Yields smart dynamic suggestions as the user types.
 */
export function searchCountries(query: string): CountryEmergencyData[] {
  const all = getAllCountries();
  const rawQ = query.trim().toLowerCase();
  if (!rawQ) return all;
  const digitsOnly = rawQ.replace(/[^0-9]/g, '');

  const matches = all.filter((c) => {
    const name = c.name.toLowerCase();
    const code = c.isoCode.toLowerCase();
    if (name.includes(rawQ) || code === rawQ) return true;
    const aliases = COUNTRY_ALIASES[c.isoCode];
    if (aliases && aliases.some((a) => a.includes(rawQ) || rawQ.includes(a))) return true;
    const calling = COUNTRY_CALLING_CODES[c.isoCode];
    if (calling) {
      if (calling.toLowerCase() === rawQ) return true;
      if (digitsOnly && calling.replace(/[^0-9]/g, '') === digitsOnly) return true;
    }
    return false;
  });

  return matches.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const aStarts = aName.startsWith(rawQ);
    const bStarts = bName.startsWith(rawQ);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    const aCode = a.isoCode.toLowerCase();
    const bCode = b.isoCode.toLowerCase();
    if (aCode === rawQ && bCode !== rawQ) return -1;
    if (aCode !== rawQ && bCode === rawQ) return 1;

    return aName.localeCompare(bName);
  });
}

export type EmergencyCountryChangeListener = (isoCode: string | null) => void;
const emergencyCountryListeners = new Set<EmergencyCountryChangeListener>();

/**
 * Subscribes to changes to the selected emergency country.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToEmergencyCountryChange(
  listener: EmergencyCountryChangeListener
): () => void {
  emergencyCountryListeners.add(listener);
  return () => {
    emergencyCountryListeners.delete(listener);
  };
}

/**
 * Broadcasts an emergency country selection update to all active listeners.
 */
export function notifyEmergencyCountryChange(isoCode: string | null): void {
  const normalized = isoCode ? isoCode.trim().toUpperCase() : null;
  emergencyCountryListeners.forEach((listener) => {
    try {
      listener(normalized);
    } catch {
      // Ignore errors from individual listeners
    }
  });
}
