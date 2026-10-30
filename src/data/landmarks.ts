/**
 * Curated Landmarks & Educational Institutions Database for Bengaluru & India
 * 
 * Provides instant, offline-capable coordinates for colleges, universities,
 * hospitals, transit hubs, and neighborhoods so users can search resources
 * near any location (e.g. BMS College, Girinagar, Hosakerehalli, PES, RVCE).
 */

export interface LandmarkItem {
  id: string;
  name: string;
  locality: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  category: 'college' | 'area' | 'hospital' | 'transit' | 'techpark';
  aliases: string[];
}

export const CURATED_LANDMARKS: LandmarkItem[] = [
  // ==========================================
  // 1. COLLEGES & UNIVERSITIES
  // ==========================================
  {
    id: 'college-bmsce',
    name: 'BMS College of Engineering (BMSCE)',
    locality: 'Bull Temple Road, Basavanagudi, Bengaluru',
    pincode: '560019',
    latitude: 12.9410,
    longitude: 77.5655,
    category: 'college',
    aliases: [
      'bms',
      'bms college',
      'bms college of engineering',
      'bmsce',
      'bms engineering',
      'bull temple road bms',
      'bms basavanagudi',
      'bms college basavanagudi',
    ],
  },
  {
    id: 'college-bmsit',
    name: 'BMS Institute of Technology (BMSIT)',
    locality: 'Doddaballapur Main Road, Yelahanka, Bengaluru',
    pincode: '560064',
    latitude: 13.1332,
    longitude: 77.5684,
    category: 'college',
    aliases: ['bmsit', 'bms institute of technology', 'bms yelahanka'],
  },
  {
    id: 'college-bms-law',
    name: 'BMS College of Law',
    locality: 'Bull Temple Road, Basavanagudi, Bengaluru',
    pincode: '560019',
    latitude: 12.9415,
    longitude: 77.5650,
    category: 'college',
    aliases: ['bms law', 'bms college of law', 'bms law college'],
  },
  {
    id: 'college-bms-women',
    name: 'BMS College for Women',
    locality: 'Bugle Rock Road, Basavanagudi, Bengaluru',
    pincode: '560004',
    latitude: 12.9420,
    longitude: 77.5680,
    category: 'college',
    aliases: ['bms women', 'bms college for women', 'bms womens college'],
  },
  {
    id: 'college-pes-rr',
    name: 'PES University (RR Campus)',
    locality: 'Outer Ring Road, Banashankari 3rd Stage / Hosakerehalli, Bengaluru',
    pincode: '560085',
    latitude: 12.9344,
    longitude: 77.5345,
    category: 'college',
    aliases: ['pes', 'pesit', 'pes university', 'pes college', 'pes ring road', 'pes banashankari', 'pes hosakerehalli'],
  },
  {
    id: 'college-pes-ecity',
    name: 'PES University (Electronic City Campus)',
    locality: 'Hosur Road, Electronic City, Bengaluru',
    pincode: '560100',
    latitude: 12.8615,
    longitude: 77.6647,
    category: 'college',
    aliases: ['pes ecity', 'pes electronic city', 'pes south campus'],
  },
  {
    id: 'college-rvce',
    name: 'RV College of Engineering (RVCE)',
    locality: 'Mysuru Road, RV Vidyaniketan, Bengaluru',
    pincode: '560059',
    latitude: 12.9237,
    longitude: 77.4987,
    category: 'college',
    aliases: ['rv', 'rvce', 'rv college', 'rv college of engineering', 'rv mysore road'],
  },
  {
    id: 'college-msrit',
    name: 'Ramaiah Institute of Technology (MSRIT)',
    locality: 'MSR Nagar, Mathikere, Bengaluru',
    pincode: '560054',
    latitude: 13.0304,
    longitude: 77.5647,
    category: 'college',
    aliases: ['msrit', 'ramaiah', 'ms ramaiah', 'ms ramaiah institute of technology', 'ramaiah college'],
  },
  {
    id: 'college-bit',
    name: 'Bangalore Institute of Technology (BIT)',
    locality: 'KR Road, VV Puram, Bengaluru',
    pincode: '560004',
    latitude: 12.9575,
    longitude: 77.5732,
    category: 'college',
    aliases: ['bit', 'bit college', 'bangalore institute of technology', 'bit vv puram'],
  },
  {
    id: 'college-dsce',
    name: 'Dayananda Sagar College of Engineering (DSCE)',
    locality: 'Shavige Malleshwara Hills, Kumaraswamy Layout, Bengaluru',
    pincode: '560078',
    latitude: 12.9081,
    longitude: 77.5666,
    category: 'college',
    aliases: ['dsce', 'dayananda sagar', 'dayanand sagar', 'dsce college', 'dayananda sagar university', 'dsu'],
  },
  {
    id: 'college-christ-central',
    name: 'Christ University (Central Campus)',
    locality: 'Hosur Road, Bhavani Nagar, SG Palya, Bengaluru',
    pincode: '560029',
    latitude: 12.9343,
    longitude: 77.6058,
    category: 'college',
    aliases: ['christ', 'christ university', 'christ college', 'christ hosur road', 'christ sg palya'],
  },
  {
    id: 'college-iisc',
    name: 'Indian Institute of Science (IISc)',
    locality: 'CV Raman Road, Malleshwaram, Bengaluru',
    pincode: '560012',
    latitude: 13.0219,
    longitude: 77.5671,
    category: 'college',
    aliases: ['iisc', 'iisc bangalore', 'indian institute of science', 'tata institute'],
  },
  {
    id: 'college-nlsiu',
    name: 'National Law School of India University (NLSIU)',
    locality: 'Gnana Bharathi Main Road, Nagarbhavi, Bengaluru',
    pincode: '560072',
    latitude: 12.9566,
    longitude: 77.5085,
    category: 'college',
    aliases: ['nls', 'nlsiu', 'national law school', 'nls nagarbhavi'],
  },
  {
    id: 'college-mount-carmel',
    name: 'Mount Carmel College (MCC)',
    locality: 'Palace Road, Vasanth Nagar, Bengaluru',
    pincode: '560052',
    latitude: 12.9912,
    longitude: 77.5878,
    category: 'college',
    aliases: ['mcc', 'mount carmel', 'mount carmel college'],
  },
  {
    id: 'college-st-josephs',
    name: "St. Joseph's University",
    locality: 'Langford Road, Shanti Nagar, Bengaluru',
    pincode: '560027',
    latitude: 12.9620,
    longitude: 77.6010,
    category: 'college',
    aliases: ['st josephs', 'st joseph', 'sju', 'st josephs college', 'josephs'],
  },
  {
    id: 'college-oxford',
    name: 'The Oxford College of Engineering',
    locality: 'Hosur Road, Bommanahalli, Bengaluru',
    pincode: '560068',
    latitude: 12.9022,
    longitude: 77.6200,
    category: 'college',
    aliases: ['oxford college', 'oxford engineering', 'oxford bommanahalli'],
  },
  {
    id: 'college-new-horizon',
    name: 'New Horizon College of Engineering (NHCE)',
    locality: 'Outer Ring Road, Near Marathahalli, Bellandur, Bengaluru',
    pincode: '560103',
    latitude: 12.9362,
    longitude: 77.6912,
    category: 'college',
    aliases: ['nhce', 'new horizon', 'new horizon college', 'new horizon engineering'],
  },
  {
    id: 'college-mvj',
    name: 'MVJ College of Engineering',
    locality: 'Channasandra, Near ITPL, Whitefield, Bengaluru',
    pincode: '560067',
    latitude: 12.9837,
    longitude: 77.7561,
    category: 'college',
    aliases: ['mvj', 'mvj college', 'mvj engineering', 'mvj whitefield'],
  },
  {
    id: 'college-rnsit',
    name: 'RNS Institute of Technology (RNSIT)',
    locality: 'Channasandra, Rajarajeshwari Nagar Post, Bengaluru',
    pincode: '560098',
    latitude: 12.9015,
    longitude: 77.5186,
    category: 'college',
    aliases: ['rnsit', 'rns', 'rns college', 'rns institute of technology', 'rns rr nagar'],
  },
  {
    id: 'college-jssate',
    name: 'JSS Academy of Technical Education (JSSATE)',
    locality: 'Uttarahalli-Kengeri Main Road, Bengaluru',
    pincode: '560060',
    latitude: 12.8988,
    longitude: 77.5075,
    category: 'college',
    aliases: ['jss', 'jssate', 'jss college', 'jss uttarahalli'],
  },
  {
    id: 'college-national-college-basavanagudi',
    name: 'National College Basavanagudi',
    locality: 'Pampa Mahakavi Road, Basavanagudi, Bengaluru',
    pincode: '560004',
    latitude: 12.9435,
    longitude: 77.5740,
    category: 'college',
    aliases: ['national college', 'national college basavanagudi', 'ncb'],
  },
  {
    id: 'college-national-college-jayanagar',
    name: 'National College Jayanagar',
    locality: '36th Cross, 7th Block, Jayanagar, Bengaluru',
    pincode: '560070',
    latitude: 12.9295,
    longitude: 77.5810,
    category: 'college',
    aliases: ['national college jayanagar', 'ncj'],
  },
  {
    id: 'college-vijaya',
    name: 'Vijaya College',
    locality: 'RV Road, Basavanagudi, Bengaluru',
    pincode: '560004',
    latitude: 12.9390,
    longitude: 77.5790,
    category: 'college',
    aliases: ['vijaya college', 'vijaya college basavanagudi', 'vijaya pu college'],
  },
  {
    id: 'college-bangalore-univ',
    name: 'Bangalore University (Jnana Bharathi Campus)',
    locality: 'Jnana Bharathi, Mysuru Road, Bengaluru',
    pincode: '560056',
    latitude: 12.9470,
    longitude: 77.5050,
    category: 'college',
    aliases: ['bangalore university', 'bu', 'jnana bharathi', 'bangalore university campus'],
  },

  // ==========================================
  // 2. RESIDENTIAL & NEIGHBORHOOD LOCALITIES
  // ==========================================
  {
    id: 'area-girinagar',
    name: 'Girinagar, Bengaluru',
    locality: 'Girinagar (1st, 2nd, 3rd, 4th Phase), Banashankari, Bengaluru',
    pincode: '560085',
    latitude: 12.9350,
    longitude: 77.5440,
    category: 'area',
    aliases: ['girinagar', 'giri nagar', 'girinagar 1st phase', 'girinagar 2nd phase', 'girinagar bsk', 'avalhalli girinagar'],
  },
  {
    id: 'area-hosakerehalli',
    name: 'Hosakerehalli, Bengaluru',
    locality: 'Hosakerehalli, Banashankari 3rd Stage, Bengaluru',
    pincode: '560085',
    latitude: 12.9250,
    longitude: 77.5350,
    category: 'area',
    aliases: ['hosakerehalli', 'hosekerehalli', 'hosakerehalli cross', 'hosakerehalli lake', 'bsk 3rd stage hosakerehalli'],
  },
  {
    id: 'area-basavanagudi',
    name: 'Basavanagudi, Bengaluru',
    locality: 'Basavanagudi, Bengaluru',
    pincode: '560004',
    latitude: 12.9416,
    longitude: 77.5738,
    category: 'area',
    aliases: ['basavanagudi', 'basavangudi', 'bull temple', 'bugle rock'],
  },
  {
    id: 'area-gandhi-bazaar',
    name: 'Gandhi Bazaar, Basavanagudi',
    locality: 'Gandhi Bazaar Main Road, Basavanagudi, Bengaluru',
    pincode: '560004',
    latitude: 12.9430,
    longitude: 77.5710,
    category: 'area',
    aliases: ['gandhi bazaar', 'gandhibazaar', 'dvg road', 'vidyarthi bhavan'],
  },
  {
    id: 'area-hanumanthnagar',
    name: 'Hanumanthnagar, Bengaluru',
    locality: 'Hanumanthnagar, Banashankari 1st Stage, Bengaluru',
    pincode: '560019',
    latitude: 12.9430,
    longitude: 77.5580,
    category: 'area',
    aliases: ['hanumanthnagar', 'hanumanthanagar', 'hanumant nagar', 'kumaraswamy temple hill'],
  },
  {
    id: 'area-banashankari',
    name: 'Banashankari, Bengaluru',
    locality: 'Banashankari (1st, 2nd & 3rd Stage), Bengaluru',
    pincode: '560070',
    latitude: 12.9255,
    longitude: 77.5468,
    category: 'area',
    aliases: ['banashankari', 'bsk', 'banashankari 2nd stage', 'banashankari 3rd stage', 'banashankari bus stand', 'banashankari bda'],
  },
  {
    id: 'area-padmanabhanagar',
    name: 'Padmanabhanagar, Bengaluru',
    locality: 'Padmanabhanagar, Bengaluru',
    pincode: '560070',
    latitude: 12.9180,
    longitude: 77.5580,
    category: 'area',
    aliases: ['padmanabhanagar', 'padmanabha nagar', 'devegowda petrol bunk'],
  },
  {
    id: 'area-kumaraswamy-layout',
    name: 'Kumaraswamy Layout, Bengaluru',
    locality: 'Kumaraswamy Layout (1st & 2nd Stage), Bengaluru',
    pincode: '560078',
    latitude: 12.9060,
    longitude: 77.5600,
    category: 'area',
    aliases: ['kumaraswamy layout', 'ks layout', 'kumaraswamy'],
  },
  {
    id: 'area-uttarahalli',
    name: 'Uttarahalli, Bengaluru',
    locality: 'Uttarahalli Hobli, Bengaluru',
    pincode: '560061',
    latitude: 12.9010,
    longitude: 77.5380,
    category: 'area',
    aliases: ['uttarahalli', 'uttarahalli main road', 'chikkalasandra'],
  },
  {
    id: 'area-rr-nagar',
    name: 'Rajarajeshwari Nagar (RR Nagar)',
    locality: 'Rajarajeshwari Nagar, Bengaluru',
    pincode: '560098',
    latitude: 12.9260,
    longitude: 77.5180,
    category: 'area',
    aliases: ['rr nagar', 'rajarajeshwari nagar', 'rajarajeshwarinagar', 'rr nagar arch'],
  },
  {
    id: 'area-chamrajpet',
    name: 'Chamrajpet, Bengaluru',
    locality: 'Chamrajpet, Bengaluru',
    pincode: '560018',
    latitude: 12.9600,
    longitude: 77.5650,
    category: 'area',
    aliases: ['chamrajpet', 'chamarajapet', 'makkalakoota'],
  },
  {
    id: 'area-vv-puram',
    name: 'Visvesvarapuram (VV Puram)',
    locality: 'VV Puram / Food Street, Bengaluru',
    pincode: '560004',
    latitude: 12.9530,
    longitude: 77.5760,
    category: 'area',
    aliases: ['vv puram', 'food street', 'sajjan rao circle', 'visvesvarapuram'],
  },
  {
    id: 'area-jayanagar',
    name: 'Jayanagar, Bengaluru',
    locality: 'Jayanagar (1st to 9th Block), Bengaluru',
    pincode: '560011',
    latitude: 12.9308,
    longitude: 77.5838,
    category: 'area',
    aliases: ['jayanagar', 'jayanagar 4th block', 'jayanagar 3rd block', 'jayanagar bda complex'],
  },
  {
    id: 'area-jp-nagar',
    name: 'JP Nagar, Bengaluru',
    locality: 'Jayaprakash Nagar (JP Nagar 1st to 9th Phase), Bengaluru',
    pincode: '560078',
    latitude: 12.9063,
    longitude: 77.5857,
    category: 'area',
    aliases: ['jp nagar', 'jayaprakash nagar', 'jp nagar 2nd phase', 'jp nagar 6th phase'],
  },
  {
    id: 'area-btm-layout',
    name: 'BTM Layout, Bengaluru',
    locality: 'BTM Layout (1st & 2nd Stage), Bengaluru',
    pincode: '560068',
    latitude: 12.9166,
    longitude: 77.6101,
    category: 'area',
    aliases: ['btm', 'btm layout', 'madiwala', 'btm 2nd stage'],
  },
  {
    id: 'area-hsr-layout',
    name: 'HSR Layout, Bengaluru',
    locality: 'HSR Layout (Sectors 1 to 7), Bengaluru',
    pincode: '560102',
    latitude: 12.9121,
    longitude: 77.6446,
    category: 'area',
    aliases: ['hsr', 'hsr layout', 'hsr sector 1', 'hsr bda complex'],
  },
  {
    id: 'area-koramangala',
    name: 'Koramangala, Bengaluru',
    locality: 'Koramangala (1st to 8th Block), Bengaluru',
    pincode: '560034',
    latitude: 12.9352,
    longitude: 77.6245,
    category: 'area',
    aliases: ['koramangala', 'kora', 'sony world signal', 'koramangala 4th block'],
  },
  {
    id: 'area-indiranagar',
    name: 'Indiranagar, Bengaluru',
    locality: 'Indiranagar (100ft Road / CMH Road), Bengaluru',
    pincode: '560038',
    latitude: 12.9719,
    longitude: 77.6412,
    category: 'area',
    aliases: ['indiranagar', 'indira nagar', '100ft road indiranagar', 'cmh road'],
  },
  {
    id: 'area-malleshwaram',
    name: 'Malleshwaram, Bengaluru',
    locality: 'Malleshwaram, Bengaluru',
    pincode: '560003',
    latitude: 13.0031,
    longitude: 77.5643,
    category: 'area',
    aliases: ['malleshwaram', 'malleswaram', 'sampige road', 'margosa road', '8th cross malleshwaram'],
  },
  {
    id: 'area-rajajinagar',
    name: 'Rajajinagar, Bengaluru',
    locality: 'Rajajinagar, Bengaluru',
    pincode: '560010',
    latitude: 12.9982,
    longitude: 77.5530,
    category: 'area',
    aliases: ['rajajinagar', 'rajaji nagar', 'orion mall', 'navrang'],
  },
  {
    id: 'area-vijayanagar',
    name: 'Vijayanagar, Bengaluru',
    locality: 'Vijayanagar, Bengaluru',
    pincode: '560040',
    latitude: 12.9719,
    longitude: 77.5303,
    category: 'area',
    aliases: ['vijayanagar', 'vijaynagar', 'rpc layout', 'vijayanagar water tank'],
  },
  {
    id: 'area-whitefield',
    name: 'Whitefield, Bengaluru',
    locality: 'Whitefield / ITPL, Bengaluru',
    pincode: '560066',
    latitude: 12.9698,
    longitude: 77.7500,
    category: 'area',
    aliases: ['whitefield', 'itpl', 'hope farm', 'kadugodi'],
  },
  {
    id: 'area-electronic-city',
    name: 'Electronic City, Bengaluru',
    locality: 'Electronic City (Phase 1 & Phase 2), Bengaluru',
    pincode: '560100',
    latitude: 12.8452,
    longitude: 77.6602,
    category: 'area',
    aliases: ['electronic city', 'ecity', 'electronic city phase 1', 'electronic city phase 2'],
  },
  {
    id: 'area-bellandur',
    name: 'Bellandur / Outer Ring Road',
    locality: 'Bellandur, Outer Ring Road, Bengaluru',
    pincode: '560103',
    latitude: 12.9304,
    longitude: 77.6784,
    category: 'area',
    aliases: ['bellandur', 'outer ring road', 'ecospace'],
  },
  {
    id: 'area-marathahalli',
    name: 'Marathahalli, Bengaluru',
    locality: 'Marathahalli Bridge, Bengaluru',
    pincode: '560037',
    latitude: 12.9591,
    longitude: 77.6974,
    category: 'area',
    aliases: ['marathahalli', 'marathalli', 'marathahalli bridge'],
  },
  {
    id: 'area-hebbal',
    name: 'Hebbal, Bengaluru',
    locality: 'Hebbal Flyover / Lake, Bengaluru',
    pincode: '560024',
    latitude: 13.0358,
    longitude: 77.5970,
    category: 'area',
    aliases: ['hebbal', 'hebbal flyover', 'manyata'],
  },
  {
    id: 'area-yelahanka',
    name: 'Yelahanka, Bengaluru',
    locality: 'Yelahanka New Town, Bengaluru',
    pincode: '560064',
    latitude: 13.1007,
    longitude: 77.5963,
    category: 'area',
    aliases: ['yelahanka', 'yelahanka new town', 'yelahanka old town'],
  },
  {
    id: 'area-majestic',
    name: 'Majestic / Kempegowda Bus Station',
    locality: 'Majestic, City Railway Station, Bengaluru',
    pincode: '560009',
    latitude: 12.9781,
    longitude: 77.5696,
    category: 'transit',
    aliases: ['majestic', 'kbs', 'kempegowda bus station', 'bangalore railway station', 'kranti veera sangolli rayanna'],
  },

  // ==========================================
  // 3. MAJOR HEALTHCARE HUBS
  // ==========================================
  {
    id: 'hosp-victoria',
    name: 'Victoria Hospital (BMCRI)',
    locality: 'Kalasipalya, Near City Market, Bengaluru',
    pincode: '560002',
    latitude: 12.9625,
    longitude: 77.5745,
    category: 'hospital',
    aliases: ['victoria hospital', 'bmcri', 'victoria bmcri', 'city market hospital'],
  },
  {
    id: 'hosp-bowring',
    name: 'Bowring and Lady Curzon Hospital',
    locality: 'Shivaji Nagar, Bengaluru',
    pincode: '560001',
    latitude: 12.9830,
    longitude: 77.6040,
    category: 'hospital',
    aliases: ['bowring', 'bowring hospital', 'lady curzon hospital', 'shivaji nagar hospital'],
  },
  {
    id: 'hosp-nimhans',
    name: 'NIMHANS Hospital',
    locality: 'Hosur Road, Bengaluru',
    pincode: '560029',
    latitude: 12.9385,
    longitude: 77.5965,
    category: 'hospital',
    aliases: ['nimhans', 'nimhans hospital', 'national institute of mental health'],
  },
  {
    id: 'hosp-jayadeva',
    name: 'Sri Jayadeva Institute of Cardiovascular Sciences',
    locality: 'Bannerghatta Road, 9th Block, Jayanagar, Bengaluru',
    pincode: '560069',
    latitude: 12.9180,
    longitude: 77.5990,
    category: 'hospital',
    aliases: ['jayadeva', 'jayadeva hospital', 'jayadeva cardiology'],
  },
  {
    id: 'hosp-stjohns',
    name: "St. John's Medical College Hospital",
    locality: 'Sarjapur Main Road, Koramangala, Bengaluru',
    pincode: '560034',
    latitude: 12.9325,
    longitude: 77.6210,
    category: 'hospital',
    aliases: ['st johns', 'st johns hospital', 'st john hospital koramangala'],
  },
];

/**
 * Fast search through curated landmarks, colleges, and localities.
 * Returns matches sorted by relevance score.
 */
export function searchCuratedLandmarks(query: string, maxResults = 6): LandmarkItem[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const tokens = q.split(/\s+/).filter(Boolean);

  const scored: { item: LandmarkItem; score: number }[] = [];

  for (const item of CURATED_LANDMARKS) {
    let score = 0;
    const nameLower = item.name.toLowerCase();
    const locLower = item.locality.toLowerCase();

    // 1. Exact alias match (highest priority, e.g. "bms college" or "girinagar")
    if (item.aliases.some((a) => a === q)) {
      score += 100;
    } else if (item.aliases.some((a) => a.startsWith(q))) {
      score += 80;
    } else if (item.aliases.some((a) => a.includes(q))) {
      score += 60;
    }

    // 2. Name matches
    if (nameLower.startsWith(q)) {
      score += 70;
    } else if (nameLower.includes(q)) {
      score += 45;
    }

    // 3. Locality matches
    if (locLower.includes(q)) {
      score += 30;
    }

    // 4. Multi-token match (e.g. "bms engineering")
    const allText = `${nameLower} ${locLower} ${item.aliases.join(' ')}`;
    const allTokensMatch = tokens.every((token) => allText.includes(token));
    if (allTokensMatch) {
      score += 25;
    }

    if (score > 0) {
      scored.push({ item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults).map((s) => s.item);
}

