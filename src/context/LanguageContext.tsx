import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'en' | 'kn' | 'hi';

export interface LanguageInfo {
  code: AppLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
];

export const LANGUAGE_STORAGE_KEY = 'medfind.language_v1';

const translations: Record<AppLanguage, Record<string, string>> = {
  en: {
    // Navigation / Tabs
    tab_search: 'Search',
    tab_map: 'Map',
    tab_emergency: 'Emergency',
    tab_care: 'Care',

    // Home / Search
    search_placeholder: 'Search medicines (e.g. Dolo, Cough, Calpol)...',
    search_subtext: 'Find medicines by brand or formula name.',
    popular_medicines: 'Common medicines',
    verified_network: 'Verified Bengaluru Network',
    verified_network_desc: 'Stock verified directly with participating pharmacies across Bengaluru.',
    filter_type: 'MEDICINE TYPE',
    filter_dose: 'DOSE / STRENGTH',
    filter_all: 'All',
    tablet: 'Tablet',
    syrup: 'Syrup',
    inhaler: 'Inhaler',
    cream: 'Cream',
    injection: 'Injection',
    drops: 'Drops',

    // Availability
    in_stock: 'In stock',
    available: 'Available',
    low_stock: 'Few left',
    out_of_stock: 'Out of stock',
    call_to_check: 'Call to check',
    unreported: 'Call store to verify',

    // Actions
    call: 'Call',
    call_store: 'Call store',
    directions: 'Directions',
    open_daily: 'Open 24/7',
    distance_km: 'km away',

    // Care & Providers
    care_title: 'Care nearby',
    care_subtitle: 'Verified hospitals, clinics, ambulance contacts & pharmacies',
    hospitals: 'Hospitals',
    clinics: 'Clinics',
    ambulances: 'Ambulance',
    all: 'All',

    // Emergency
    emergency_title: 'If this is an emergency, call now.',
    emergency_subtitle: 'One tap opens your phone dialer. Connect directly to help.',
    call_112: 'Call emergency service',
    dial_112: 'Dial 112',
    call_108: 'Call Karnataka Ambulance (108)',
    quick_guide: 'Quick Emergency Help',
    quick_guide_desc: 'In severe or life-threatening situations, dial 112 or 108 immediately for priority help.',

    // Settings
    settings: 'Settings',
    language: 'App Language',
    language_subtitle: 'English, ಕನ್ನಡ, हिंदी',
    appearance: 'Appearance',
    light_theme: 'Light theme',
    dark_theme: 'Dark theme',
    how_location_works: 'How Location Works',
    how_location_subtitle: 'GPS usage, distance calculation & privacy',
    staff_portal: 'Pharmacy Staff Portal',
    staff_portal_subtitle: 'Submit quick stock updates',
    quality_policy: 'Quality & Safety Policy',
    quality_policy_subtitle: 'Official records & verified stores',
    close: 'Close',
    switch_theme: 'Switch',
    change_language: 'Change',
    understood: 'Understood',
  },

  kn: {
    // Navigation / Tabs
    tab_search: 'ಹುಡುಕಿ',
    tab_map: 'ನಕ್ಷೆ',
    tab_emergency: 'ತುರ್ತು',
    tab_care: 'ಆರೈಕೆ',

    // Home / Search
    search_placeholder: 'ಔಷಧಿಗಳನ್ನು ಹುಡುಕಿ (ಡೋಲೋ, ಕೆಮ್ಮು, ಕಾಲ್ಪಾಲ್)...',
    search_subtext: 'ಔಷಧಿಯ ಹೆಸರು ಅಥವಾ ಸತ್ವದ ಹೆಸರಿನಿಂದ ಹುಡುಕಿ.',
    popular_medicines: 'ಸಾಮಾನ್ಯ ಔಷಧಿಗಳು',
    verified_network: 'ದೃಢೀಕೃತ ಬೆಂಗಳೂರು ಜಾಲ',
    verified_network_desc: 'ಬೆಂಗಳೂರಿನ ನೋಂದಾಯಿತ ಔಷಧಾಲಯಗಳೊಂದಿಗೆ ನೇರವಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.',
    filter_type: 'ಔಷಧಿಯ ಪ್ರಕಾರ',
    filter_dose: 'ಪ್ರಮಾಣ / ಶಕ್ತಿ',
    filter_all: 'ಎಲ್ಲವೂ',
    tablet: 'ಮಾತ್ರೆ',
    syrup: 'ಸಿರಪ್',
    inhaler: 'ಇನ್ಹೇಲರ್',
    cream: 'ಕ್ರೀಮ್',
    injection: 'ಇಂಜೆಕ್ಷನ್',
    drops: 'ಹನಿಗಳು',

    // Availability
    in_stock: 'ಲಭ್ಯವಿದೆ',
    available: 'ಲಭ್ಯವಿದೆ',
    low_stock: 'ಸ್ವಲ್ಪ ಉಳಿದಿದೆ',
    out_of_stock: 'ಖಾಲಿಯಾಗಿದೆ',
    call_to_check: 'ಕರೆ ಮಾಡಿ ವಿಚಾರಿಸಿ',
    unreported: 'ಅಂಗಡಿಗೆ ಕರೆ ಮಾಡಿ',

    // Actions
    call: 'ಕರೆ ಮಾಡಿ',
    call_store: 'ಅಂಗಡಿಗೆ ಕರೆ',
    directions: 'ದಾರಿ',
    open_daily: '24 ಗಂಟೆ ಲಭ್ಯ',
    distance_km: 'ಕಿ.ಮೀ ದೂರ',

    // Care & Providers
    care_title: 'ಹತ್ತಿರದ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳು',
    care_subtitle: 'ಪರಿಶೀಲಿಸಿದ ಆಸ್ಪತ್ರೆಗಳು, ಕ್ಲಿನಿಕ್‌ಗಳು, ಆಂಬ್ಯುಲೆನ್ಸ್ ಮತ್ತು ಔಷಧಾಲಯಗಳು',
    hospitals: 'ಆಸ್ಪತ್ರೆಗಳು',
    clinics: 'ಕ್ಲಿನಿಕ್‌ಗಳು',
    ambulances: 'ಆಂಬ್ಯುಲೆನ್ಸ್',
    all: 'ಎಲ್ಲವೂ',

    // Emergency
    emergency_title: 'ತುರ್ತು ಸಂದರ್ಭದಲ್ಲಿ, ಈಗಲೇ ಕರೆ ಮಾಡಿ.',
    emergency_subtitle: 'ಒಂದು ಸ್ಪರ್ಶದಲ್ಲಿ ನಿಮ್ಮ ಫೋನ್ ಡಯಲರ್ ತೆರೆಯುತ್ತದೆ.',
    call_112: 'ತುರ್ತು ಸೇವೆಗೆ ಕರೆ ಮಾಡಿ',
    dial_112: '112 ಗೆ ಕರೆ ಮಾಡಿ',
    call_108: 'ಕರ್ನಾಟಕ ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗೆ ಕರೆ (108)',
    quick_guide: 'ತ್ವರಿತ ತುರ್ತು ಸಹಾಯ',
    quick_guide_desc: 'ಗಂಭೀರ ಅಥವಾ ಜೀವಕ್ಕೆ ಅಪಾಯವಿರುವ ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ತಕ್ಷಣ 112 ಅಥವಾ 108 ಗೆ ಕರೆ ಮಾಡಿ.',

    // Settings
    settings: 'ಸೆಟ್ಟಿಂಗ್ಸ್',
    language: 'ಆ್ಯಪ್ ಭಾಷೆ',
    language_subtitle: 'English, ಕನ್ನಡ, हिंदी',
    appearance: 'ವಿನ್ಯಾಸ',
    light_theme: 'ಬೆಳಕಿನ ವಿನ್ಯಾಸ',
    dark_theme: 'ಕತ್ತಲೆಯ ವಿನ್ಯಾಸ',
    how_location_works: 'ಸ್ಥಳದ ಮಾಹಿತಿ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ',
    how_location_subtitle: 'ಜಿಪಿಎಸ್ ಬಳಕೆ, ಅಂತರ ಲೆಕ್ಕಾಚಾರ ಮತ್ತು ಗೌಪ್ಯತೆ',
    staff_portal: 'ಔಷಧಾಲಯ ಸಿಬ್ಬಂದಿ ಪೋರ್ಟಲ್',
    staff_portal_subtitle: 'ಸ್ಟಾಕ್ ನವೀಕರಣಗಳನ್ನು ಸಲ್ಲಿಸಿ',
    quality_policy: 'ಗುಣಮಟ್ಟ ಮತ್ತು ಸುರಕ್ಷತಾ ನೀತಿ',
    quality_policy_subtitle: 'ಅಧಿಕೃತ ದಾಖಲೆಗಳು ಮತ್ತು ದೃಢೀಕೃತ ಅಂಗಡಿಗಳು',
    close: 'ಮುಚ್ಚಿ',
    switch_theme: 'ಬದಲಾಯಿಸಿ',
    change_language: 'ಬದಲಾಯಿಸಿ',
    understood: 'ತಿಳಿದಿದೆ',
  },

  hi: {
    // Navigation / Tabs
    tab_search: 'खोजें',
    tab_map: 'नक्शा',
    tab_emergency: 'आपातकालीन',
    tab_care: 'अस्पताल',

    // Home / Search
    search_placeholder: 'दवाई खोजें (जैसे डोलो, खांसी, कैलपॉल)...',
    search_subtext: 'दवाई के ब्रांड या सॉल्ट नाम से खोजें।',
    popular_medicines: 'आम दवाइयां',
    verified_network: 'सत्यापित बेंगलुरु नेटवर्क',
    verified_network_desc: 'बेंगलुरु की पंजीकृत फार्मेसियों द्वारा सीधे सत्यापित स्टॉक।',
    filter_type: 'दवाई का प्रकार',
    filter_dose: 'मात्रा / खुराक',
    filter_all: 'सभी',
    tablet: 'गोली (टैबलेट)',
    syrup: 'सिरप',
    inhaler: 'इनहेलर',
    cream: 'क्रीम',
    injection: 'इंजेक्शन',
    drops: 'ड्रॉप्स',

    // Availability
    in_stock: 'उपलब्ध है',
    available: 'उपलब्ध है',
    low_stock: 'कम बची है',
    out_of_stock: 'खत्म हो गया',
    call_to_check: 'कॉल करके जांचें',
    unreported: 'दुकान पर कॉल करें',

    // Actions
    call: 'कॉल करें',
    call_store: 'दुकान पर कॉल',
    directions: 'दिशा-निर्देश',
    open_daily: '24 घंटे खुला',
    distance_km: 'किमी दूर',

    // Care & Providers
    care_title: 'आसपास के स्वास्थ्य केंद्र',
    care_subtitle: 'सत्यापित अस्पताल, क्लीनिक, एम्बुलेंस और फार्मेसियां',
    hospitals: 'अस्पताल',
    clinics: 'क्लीनिक',
    ambulances: 'एम्बुलेंस',
    all: 'सभी',

    // Emergency
    emergency_title: 'यदि यह आपातकालीन स्थिति है, तुरंत कॉल करें।',
    emergency_subtitle: 'एक टैप से आपका फोन डायलर खुलेगा। तुरंत सहायता पाएं।',
    call_112: 'आपातकालीन सेवा पर कॉल करें',
    dial_112: '112 डायल करें',
    call_108: 'कर्नाटक एम्बुलेंस (108) को कॉल करें',
    quick_guide: 'त्वरित आपातकालीन सहायता',
    quick_guide_desc: 'गंभीर या जीवन-घातक स्थितियों में प्राथमिकता सहायता के लिए तुरंत 112 या 108 डायल करें।',

    // Settings
    settings: 'सेटिंग्स',
    language: 'ऐप की भाषा',
    language_subtitle: 'English, ಕನ್ನಡ, हिंदी',
    appearance: 'दिखावट',
    light_theme: 'लाइट थीम',
    dark_theme: 'डार्क थीम',
    how_location_works: 'स्थान कैसे काम करता है',
    how_location_subtitle: 'जीपीएस उपयोग, दूरी की गणना और गोपनीयता',
    staff_portal: 'फार्मेसी स्टाफ पोर्टल',
    staff_portal_subtitle: 'स्टॉक की स्थिति तुरंत अपडेट करें',
    quality_policy: 'गुणवत्ता और सुरक्षा नीति',
    quality_policy_subtitle: 'सरकारी रिकॉर्ड और सत्यापित दुकानें',
    close: 'बंद करें',
    switch_theme: 'बदलें',
    change_language: 'बदलें',
    understood: 'समझ गया',
  },
};

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  t: (key: string, defaultText?: string) => string;
  languages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (key, defaultText) => defaultText || key,
  languages: SUPPORTED_LANGUAGES,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>('en');

  useEffect(() => {
    async function loadSavedLanguage() {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved === 'en' || saved === 'kn' || saved === 'hi') {
          setLanguageState(saved);
        }
      } catch {
        // Fallback to default English
      }
    }
    loadSavedLanguage();
  }, []);

  const setLanguage = async (newLang: AppLanguage) => {
    setLanguageState(newLang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch {
      // Best-effort storage
    }
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English
    if (translations.en[key]) {
      return translations.en[key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
