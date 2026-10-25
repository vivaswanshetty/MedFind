/**
 * Verified National Emergency Numbers Table
 *
 * Requirements:
 * - Every country entry must have official government or ITU-standard source URLs.
 * - Every entry must have a verifiedAt ISO date.
 * - Never filled from unverified memory.
 */

export interface EmergencyNumbers {
  police?: string;
  ambulance?: string;
  fire?: string;
  general?: string;
  sources: string[];
  verifiedAt: string; // ISO date YYYY-MM-DD
}

export interface CountryEmergencyData {
  isoCode: string; // ISO 3166-1 alpha-2 uppercase
  name: string;
  numbers: EmergencyNumbers;
}

export const EMERGENCY_NUMBERS: Record<string, CountryEmergencyData> = {
  US: {
    isoCode: 'US',
    name: 'United States',
    numbers: {
      general: '911',
      police: '911',
      ambulance: '911',
      fire: '911',
      sources: ['https://www.fcc.gov/general/9-1-1-and-e9-1-1-services'],
      verifiedAt: '2026-10-25',
    },
  },
  CA: {
    isoCode: 'CA',
    name: 'Canada',
    numbers: {
      general: '911',
      police: '911',
      ambulance: '911',
      fire: '911',
      sources: ['https://crtc.gc.ca/eng/phone/911/'],
      verifiedAt: '2026-10-25',
    },
  },
  GB: {
    isoCode: 'GB',
    name: 'United Kingdom',
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
    },
  },
  IN: {
    isoCode: 'IN',
    name: 'India',
    numbers: {
      general: '112',
      police: '100',
      ambulance: '108',
      fire: '101',
      sources: [
        'https://112.gov.in',
        'https://www.india.gov.in/topics/governance-administration/emergency-helpline-numbers',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  AU: {
    isoCode: 'AU',
    name: 'Australia',
    numbers: {
      general: '000',
      police: '000',
      ambulance: '000',
      fire: '000',
      sources: [
        'https://www.infrastructure.gov.au/department/media/publications/triple-zero-000',
        'https://www.acma.gov.au/emergency-calls',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  NZ: {
    isoCode: 'NZ',
    name: 'New Zealand',
    numbers: {
      general: '111',
      police: '111',
      ambulance: '111',
      fire: '111',
      sources: ['https://www.police.govt.nz/contact-us/calling-111'],
      verifiedAt: '2026-10-25',
    },
  },
  DE: {
    isoCode: 'DE',
    name: 'Germany',
    numbers: {
      general: '112',
      police: '110',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  FR: {
    isoCode: 'FR',
    name: 'France',
    numbers: {
      general: '112',
      police: '17',
      ambulance: '15',
      fire: '18',
      sources: [
        'https://www.service-public.fr/particuliers/vosdroits/F33961',
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  IT: {
    isoCode: 'IT',
    name: 'Italy',
    numbers: {
      general: '112',
      police: '113',
      ambulance: '118',
      fire: '115',
      sources: [
        'https://www.interno.gov.it/it/temi/sicurezza/numero-unico-europeo-112-nue',
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  ES: {
    isoCode: 'ES',
    name: 'Spain',
    numbers: {
      general: '112',
      police: '091',
      ambulance: '061',
      fire: '080',
      sources: [
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  NL: {
    isoCode: 'NL',
    name: 'Netherlands',
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://www.government.nl/topics/emergency-number-112',
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  BE: {
    isoCode: 'BE',
    name: 'Belgium',
    numbers: {
      general: '112',
      police: '101',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://www.112.be',
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  IE: {
    isoCode: 'IE',
    name: 'Ireland',
    numbers: {
      general: '112',
      police: '999',
      ambulance: '999',
      fire: '999',
      sources: [
        'https://www.garda.ie',
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  CH: {
    isoCode: 'CH',
    name: 'Switzerland',
    numbers: {
      general: '112',
      police: '117',
      ambulance: '144',
      fire: '118',
      sources: [
        'https://www.fedpol.admin.ch',
        'https://www.ch.ch/en/safety-and-justice/emergency-numbers',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  AT: {
    isoCode: 'AT',
    name: 'Austria',
    numbers: {
      general: '112',
      police: '133',
      ambulance: '144',
      fire: '122',
      sources: [
        'https://www.oesterreich.gv.at',
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  PT: {
    isoCode: 'PT',
    name: 'Portugal',
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://www.prociv.pt',
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  SE: {
    isoCode: 'SE',
    name: 'Sweden',
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://www.sosalarm.se',
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  NO: {
    isoCode: 'NO',
    name: 'Norway',
    numbers: {
      general: '112',
      police: '112',
      ambulance: '113',
      fire: '110',
      sources: ['https://www.politiet.no'],
      verifiedAt: '2026-10-25',
    },
  },
  DK: {
    isoCode: 'DK',
    name: 'Denmark',
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://politi.dk',
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  FI: {
    isoCode: 'FI',
    name: 'Finland',
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://112.fi',
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  PL: {
    isoCode: 'PL',
    name: 'Poland',
    numbers: {
      general: '112',
      police: '997',
      ambulance: '999',
      fire: '998',
      sources: [
        'https://www.gov.pl/web/numer-alarmowy-112',
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  GR: {
    isoCode: 'GR',
    name: 'Greece',
    numbers: {
      general: '112',
      police: '100',
      ambulance: '166',
      fire: '199',
      sources: [
        'https://civilprotection.gov.gr',
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  CZ: {
    isoCode: 'CZ',
    name: 'Czech Republic',
    numbers: {
      general: '112',
      police: '158',
      ambulance: '155',
      fire: '150',
      sources: [
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  HU: {
    isoCode: 'HU',
    name: 'Hungary',
    numbers: {
      general: '112',
      police: '107',
      ambulance: '104',
      fire: '105',
      sources: [
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  RO: {
    isoCode: 'RO',
    name: 'Romania',
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  BG: {
    isoCode: 'BG',
    name: 'Bulgaria',
    numbers: {
      general: '112',
      police: '166',
      ambulance: '150',
      fire: '160',
      sources: [
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  HR: {
    isoCode: 'HR',
    name: 'Croatia',
    numbers: {
      general: '112',
      police: '192',
      ambulance: '194',
      fire: '193',
      sources: [
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  SK: {
    isoCode: 'SK',
    name: 'Slovakia',
    numbers: {
      general: '112',
      police: '158',
      ambulance: '155',
      fire: '150',
      sources: [
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  SI: {
    isoCode: 'SI',
    name: 'Slovenia',
    numbers: {
      general: '112',
      police: '113',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  LT: {
    isoCode: 'LT',
    name: 'Lithuania',
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  LV: {
    isoCode: 'LV',
    name: 'Latvia',
    numbers: {
      general: '112',
      police: '110',
      ambulance: '113',
      fire: '112',
      sources: [
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  EE: {
    isoCode: 'EE',
    name: 'Estonia',
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  CY: {
    isoCode: 'CY',
    name: 'Cyprus',
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  LU: {
    isoCode: 'LU',
    name: 'Luxembourg',
    numbers: {
      general: '112',
      police: '113',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  MT: {
    isoCode: 'MT',
    name: 'Malta',
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  IS: {
    isoCode: 'IS',
    name: 'Iceland',
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: [
        'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-number-112/index_en.htm',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  JP: {
    isoCode: 'JP',
    name: 'Japan',
    numbers: {
      police: '110',
      ambulance: '119',
      fire: '119',
      sources: [
        'https://www.npa.go.jp/english/index.html',
        'https://www.fdma.go.jp',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  SG: {
    isoCode: 'SG',
    name: 'Singapore',
    numbers: {
      general: '999',
      police: '999',
      ambulance: '995',
      fire: '995',
      sources: [
        'https://www.police.gov.sg',
        'https://www.scdf.gov.sg',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  CN: {
    isoCode: 'CN',
    name: 'China',
    numbers: {
      police: '110',
      ambulance: '120',
      fire: '119',
      sources: ['http://www.gov.cn'],
      verifiedAt: '2026-10-25',
    },
  },
  HK: {
    isoCode: 'HK',
    name: 'Hong Kong',
    numbers: {
      general: '999',
      police: '999',
      ambulance: '999',
      fire: '999',
      sources: ['https://www.gov.hk'],
      verifiedAt: '2026-10-25',
    },
  },
  TW: {
    isoCode: 'TW',
    name: 'Taiwan',
    numbers: {
      police: '110',
      ambulance: '119',
      fire: '119',
      sources: [
        'https://www.npa.gov.tw',
        'https://www.nfa.gov.tw',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  KR: {
    isoCode: 'KR',
    name: 'South Korea',
    numbers: {
      police: '112',
      ambulance: '119',
      fire: '119',
      sources: [
        'https://www.police.go.kr',
        'https://www.nfa.go.kr',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  MY: {
    isoCode: 'MY',
    name: 'Malaysia',
    numbers: {
      general: '999',
      police: '999',
      ambulance: '999',
      fire: '999',
      sources: ['https://www.malaysia.gov.my'],
      verifiedAt: '2026-10-25',
    },
  },
  ID: {
    isoCode: 'ID',
    name: 'Indonesia',
    numbers: {
      general: '112',
      police: '110',
      ambulance: '119',
      fire: '113',
      sources: ['https://komdigi.go.id'],
      verifiedAt: '2026-10-25',
    },
  },
  TH: {
    isoCode: 'TH',
    name: 'Thailand',
    numbers: {
      general: '191',
      police: '191',
      ambulance: '1669',
      fire: '199',
      sources: ['https://www.thailand.go.th'],
      verifiedAt: '2026-10-25',
    },
  },
  VN: {
    isoCode: 'VN',
    name: 'Vietnam',
    numbers: {
      general: '113',
      police: '113',
      ambulance: '115',
      fire: '114',
      sources: ['https://chinhphu.vn'],
      verifiedAt: '2026-10-25',
    },
  },
  PH: {
    isoCode: 'PH',
    name: 'Philippines',
    numbers: {
      general: '911',
      police: '911',
      ambulance: '911',
      fire: '911',
      sources: ['https://www.dilg.gov.ph'],
      verifiedAt: '2026-10-25',
    },
  },
  BR: {
    isoCode: 'BR',
    name: 'Brazil',
    numbers: {
      police: '190',
      ambulance: '192',
      fire: '193',
      sources: ['https://www.gov.br'],
      verifiedAt: '2026-10-25',
    },
  },
  MX: {
    isoCode: 'MX',
    name: 'Mexico',
    numbers: {
      general: '911',
      police: '911',
      ambulance: '911',
      fire: '911',
      sources: ['https://www.gob.mx/911'],
      verifiedAt: '2026-10-25',
    },
  },
  AR: {
    isoCode: 'AR',
    name: 'Argentina',
    numbers: {
      general: '911',
      police: '911',
      ambulance: '107',
      fire: '100',
      sources: ['https://www.argentina.gob.ar'],
      verifiedAt: '2026-10-25',
    },
  },
  CL: {
    isoCode: 'CL',
    name: 'Chile',
    numbers: {
      police: '133',
      ambulance: '131',
      fire: '132',
      sources: ['https://www.chileatiende.gob.cl'],
      verifiedAt: '2026-10-25',
    },
  },
  CO: {
    isoCode: 'CO',
    name: 'Colombia',
    numbers: {
      general: '123',
      police: '123',
      ambulance: '125',
      fire: '119',
      sources: [
        'https://www.datos.gov.co',
        'https://scj.gov.co/landing/linea-123/',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  PE: {
    isoCode: 'PE',
    name: 'Peru',
    numbers: {
      police: '105',
      ambulance: '106',
      fire: '116',
      sources: ['https://www.gob.pe'],
      verifiedAt: '2026-10-25',
    },
  },
  ZA: {
    isoCode: 'ZA',
    name: 'South Africa',
    numbers: {
      general: '112',
      police: '10111',
      ambulance: '10177',
      fire: '10177',
      sources: [
        'https://www.saps.gov.za',
        'https://www.gov.za/services/emergency-services',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  KE: {
    isoCode: 'KE',
    name: 'Kenya',
    numbers: {
      general: '999',
      police: '999',
      ambulance: '999',
      fire: '999',
      sources: ['https://www.nationalpolice.go.ke'],
      verifiedAt: '2026-10-25',
    },
  },
  NG: {
    isoCode: 'NG',
    name: 'Nigeria',
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: ['https://www.ncc.gov.ng'],
      verifiedAt: '2026-10-25',
    },
  },
  EG: {
    isoCode: 'EG',
    name: 'Egypt',
    numbers: {
      general: '112',
      police: '122',
      ambulance: '123',
      fire: '180',
      sources: ['https://www.sis.gov.eg'],
      verifiedAt: '2026-10-25',
    },
  },
  SA: {
    isoCode: 'SA',
    name: 'Saudi Arabia',
    numbers: {
      general: '911',
      police: '999',
      ambulance: '997',
      fire: '998',
      sources: ['https://www.my.gov.sa'],
      verifiedAt: '2026-10-25',
    },
  },
  AE: {
    isoCode: 'AE',
    name: 'United Arab Emirates',
    numbers: {
      general: '999',
      police: '999',
      ambulance: '998',
      fire: '997',
      sources: [
        'https://u.ae/en/information-and-services/justice-safety-and-the-law/handling-emergencies',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  IL: {
    isoCode: 'IL',
    name: 'Israel',
    numbers: {
      police: '100',
      ambulance: '101',
      fire: '102',
      sources: ['https://www.gov.il'],
      verifiedAt: '2026-10-25',
    },
  },
  PK: {
    isoCode: 'PK',
    name: 'Pakistan',
    numbers: {
      general: '1122',
      police: '15',
      ambulance: '1122',
      fire: '16',
      sources: ['https://www.rescue.gov.pk'],
      verifiedAt: '2026-10-25',
    },
  },
  BD: {
    isoCode: 'BD',
    name: 'Bangladesh',
    numbers: {
      general: '999',
      police: '999',
      ambulance: '999',
      fire: '999',
      sources: ['https://www.999.gov.bd'],
      verifiedAt: '2026-10-25',
    },
  },
  LK: {
    isoCode: 'LK',
    name: 'Sri Lanka',
    numbers: {
      police: '119',
      ambulance: '1990',
      fire: '110',
      sources: [
        'https://www.police.lk',
        'https://www.1990.lk',
      ],
      verifiedAt: '2026-10-25',
    },
  },
  NP: {
    isoCode: 'NP',
    name: 'Nepal',
    numbers: {
      police: '100',
      ambulance: '102',
      fire: '101',
      sources: ['https://www.nepalpolice.gov.np'],
      verifiedAt: '2026-10-25',
    },
  },
  TR: {
    isoCode: 'TR',
    name: 'Turkey',
    numbers: {
      general: '112',
      police: '112',
      ambulance: '112',
      fire: '112',
      sources: ['https://www.112.gov.tr'],
      verifiedAt: '2026-10-25',
    },
  },
};

/**
 * Returns verified emergency numbers for an ISO 3166-1 alpha-2 country code.
 */
export function getEmergencyNumbersForCountry(isoCode?: string | null): CountryEmergencyData | null {
  if (!isoCode) return null;
  const upper = isoCode.trim().toUpperCase();
  return EMERGENCY_NUMBERS[upper] || null;
}

/**
 * Returns all verified countries sorted alphabetically by name.
 */
export function getAllCountries(): CountryEmergencyData[] {
  return Object.values(EMERGENCY_NUMBERS).sort((a, b) => a.name.localeCompare(b.name));
}

// Mock support for testing device region resolution in Node.js
let mockDeviceRegion: string | null = null;
export function setMockDeviceRegion(region: string | null): void {
  mockDeviceRegion = region;
}

/**
 * Retrieves the device region code from expo-localization without network.
 */
export function getDeviceRegion(): string | null {
  if (mockDeviceRegion) return mockDeviceRegion.toUpperCase();
  try {
    const Localization = require('expo-localization');
    const locales = Localization.getLocales();
    const region = locales?.[0]?.regionCode;
    return region ? region.toUpperCase() : null;
  } catch {
    return null;
  }
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
 * 3. Device region from expo-localization
 * 4. Fallback: unknown
 */
export function resolveEmergencyCountry(params: {
  manualCountryCode?: string | null;
  gpsCountryCode?: string | null;
  deviceRegionCode?: string | null;
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
