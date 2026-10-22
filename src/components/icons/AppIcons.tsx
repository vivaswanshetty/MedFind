import React from 'react';
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';

export interface IconProps {
  size?: number;
  width?: number;
  height?: number;
  color?: string;
  secondaryColor?: string;
}

/**
 * 1. Info Icon - Vibrant Blue/Cyan circular info badge
 */
export function InfoIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="infoGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#38BDF8" />
          <Stop offset="100%" stopColor="#0284C7" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="10" fill={color || 'url(#infoGrad)'} />
      <Circle cx="12" cy="8" r="1.3" fill="#FFFFFF" />
      <Rect x="10.8" y="11" width="2.4" height="6" rx="1.2" fill="#FFFFFF" />
    </Svg>
  );
}

/**
 * 2. Moon Icon - Rich glowing crescent moon with night indigo gradient
 */
export function MoonIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="moonGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#D97706" />
        </LinearGradient>
      </Defs>
      <Path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        fill={color || 'url(#moonGrad)'}
      />
      <Circle cx="17.5" cy="6.5" r="1" fill="#FCD34D" />
      <Circle cx="19.5" cy="10" r="0.75" fill="#FCD34D" />
    </Svg>
  );
}

/**
 * 3. Sun Icon - Warm golden-amber radiant sun with rays
 */
export function SunIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="sunGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#FBBF24" />
          <Stop offset="100%" stopColor="#F59E0B" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="5" fill={color || 'url(#sunGrad)'} />
      <G stroke={color || '#F59E0B'} strokeWidth="2" strokeLinecap="round">
        <Path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
      </G>
    </Svg>
  );
}

/**
 * 4. Search Loupe Icon - Teal/Sage gradient glass magnifying glass
 */
export function SearchIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="searchGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#14B8A6" />
          <Stop offset="100%" stopColor="#0D9488" />
        </LinearGradient>
      </Defs>
      <Circle
        cx="11"
        cy="11"
        r="7"
        stroke={color || 'url(#searchGrad)'}
        strokeWidth="2.5"
      />
      <Path
        d="M16.5 16.5L21 21"
        stroke={color || 'url(#searchGrad)'}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * 5. Clear Cross Icon - Clean dismiss circle
 */
export function ClearIcon({ size = 16, color = '#6B7280' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx="10" cy="10" r="9" fill={color} fillOpacity="0.2" />
      <Path
        d="M7 7l6 6M13 7l-6 6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * 6. Emergency Siren Icon - Vibrant crimson & coral beacon
 */
export function EmergencySirenIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="sirenGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#EF4444" />
          <Stop offset="100%" stopColor="#B91C1C" />
        </LinearGradient>
      </Defs>
      <Path
        d="M6 19h12v2H6v-2zm1-2a5 5 0 0110 0H7zm5-13a1 1 0 011 1v1h-2V5a1 1 0 011-1z"
        fill={color || 'url(#sirenGrad)'}
      />
      <Path
        d="M12 2v2M4.93 6.93l1.41 1.41M19.07 6.93l-1.41 1.41"
        stroke={color || '#EF4444'}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * 7. Arrow Right / Chevron Icon
 */
export function ArrowRightIcon({ size = 14, color = '#B91C1C' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M6 3.5L10.5 8 6 12.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * 8. Clock / Freshness Icon - Sapphire slate timepiece
 */
export function ClockIcon({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Defs>
        <LinearGradient id="clockGrad" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#64748B" />
          <Stop offset="100%" stopColor="#475569" />
        </LinearGradient>
      </Defs>
      <Circle
        cx="10"
        cy="10"
        r="8"
        stroke={color || 'url(#clockGrad)'}
        strokeWidth="1.8"
      />
      <Path
        d="M10 5.5v4.8l3 1.8"
        stroke={color || 'url(#clockGrad)'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * 9. Pharmacy Storefront Icon - Fresh sage storefront
 */
export function PharmacyStoreIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="storeGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#10B981" />
          <Stop offset="100%" stopColor="#059669" />
        </LinearGradient>
      </Defs>
      <Path
        d="M3 9l1-5h16l1 5v2h-1v8H4v-8H3V9zm3 8h12v-6H6v6z"
        fill={color || 'url(#storeGrad)'}
      />
      <Path
        d="M11 12h2v4h-2zm-1 2h4v-1h-4z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

/**
 * 10. Map Pin / Location Icon - Vibrant coral teardrop marker
 */
export function MapPinIcon({ size = 15, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="pinGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#F43F5E" />
          <Stop offset="100%" stopColor="#E11D48" />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill={color || 'url(#pinGrad)'}
      />
      <Circle cx="12" cy="9" r="2.8" fill="#FFFFFF" />
    </Svg>
  );
}

/**
 * 11. Phone Icon - Fresh emerald handset
 */
export function PhoneIcon({ size = 15, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="phoneGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#34D399" />
          <Stop offset="100%" stopColor="#059669" />
        </LinearGradient>
      </Defs>
      <Path
        d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
        fill={color || 'url(#phoneGrad)'}
      />
    </Svg>
  );
}

/**
 * 12. Warning Alert Icon - Luminous amber caution triangle
 */
export function WarningIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="warnGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#FBBF24" />
          <Stop offset="100%" stopColor="#D97706" />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 2.5a1.8 1.8 0 011.56.9l8.66 15A1.8 1.8 0 0120.66 21H3.34a1.8 1.8 0 01-1.56-2.6l8.66-15a1.8 1.8 0 011.56-.9z"
        fill={color || 'url(#warnGrad)'}
      />
      <Path d="M12 8.5v5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="16.5" r="1.1" fill="#FFFFFF" />
    </Svg>
  );
}

/**
 * 13. Shield Check Icon - Verified database status
 */
export function ShieldCheckIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="shieldGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#10B981" />
          <Stop offset="100%" stopColor="#047857" />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"
        fill={color || 'url(#shieldGrad)'}
      />
      <Path
        d="M9.5 12l2 2 4-4"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * 14. Academic Graduation Cap Icon
 */
export function AcademicCapIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="acadGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#8B5CF6" />
          <Stop offset="100%" stopColor="#6D28D9" />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"
        fill={color || 'url(#acadGrad)'}
      />
    </Svg>
  );
}

/**
 * 15. Medical Cross Shield Icon - Clinical guardrails
 */
export function MedicalCrossIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="medGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#14B8A6" />
          <Stop offset="100%" stopColor="#0F766E" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="10" fill={color || 'url(#medGrad)'} />
      <Path
        d="M10.5 7h3v3.5H17v3h-3.5V17h-3v-3.5H7v-3h3.5V7z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

/**
 * 16. Lock Icon - Privacy & Health Data
 */
export function LockIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="lockGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#6366F1" />
          <Stop offset="100%" stopColor="#4338CA" />
        </LinearGradient>
      </Defs>
      <Rect x="4" y="10" width="16" height="11" rx="2.5" fill={color || 'url(#lockGrad)'} />
      <Path
        d="M8 10V7a4 4 0 118 0v3"
        stroke={color || '#6366F1'}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="15.5" r="1.3" fill="#FFFFFF" />
    </Svg>
  );
}

/**
 * 17. Close Cross Icon
 */
export function CloseIcon({ size = 16, color = '#6B7280' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 6l12 12M18 6L6 18"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * 18. Hospital Facility Icon
 */
export function HospitalIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="hospGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#3B82F6" />
          <Stop offset="100%" stopColor="#1D4ED8" />
        </LinearGradient>
      </Defs>
      <Path
        d="M4 21V5a2 2 0 012-2h12a2 2 0 012 2v16H4zm7-14h2v2h2v2h-2v2h-2v-2H9v-2h2V7zm-4 7h2v2H7v-2zm0 3h2v2H7v-2zm8-3h2v2h-2v-2zm0 3h2v2h-2v-2z"
        fill={color || 'url(#hospGrad)'}
      />
    </Svg>
  );
}

/**
 * 19. Clinic / Stethoscope Icon
 */
export function ClinicIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="clinicGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#10B981" />
          <Stop offset="100%" stopColor="#047857" />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 2a4 4 0 00-4 4v5a4 4 0 008 0V6a4 4 0 00-4-4zm-2 9V6a2 2 0 114 0v5a2 2 0 11-4 0z"
        fill={color || 'url(#clinicGrad)'}
      />
      <Path
        d="M6 13a6 6 0 0012 0v-2h-2v2a4 4 0 01-8 0v-2H6v2zm6 7a2 2 0 100-4 2 2 0 000 4z"
        fill={color || 'url(#clinicGrad)'}
      />
    </Svg>
  );
}

/**
 * 20. Ambulance Icon
 */
export function AmbulanceIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="ambGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#EF4444" />
          <Stop offset="100%" stopColor="#DC2626" />
        </LinearGradient>
      </Defs>
      <Path
        d="M18 6h-4V4H2v13h2a3 3 0 006 0h4a3 3 0 006 0h2v-5l-4-6zm-11 5H5V9h2v2zm6 0H9V9h4v2zm5-1.5l2.5 3.5H16v-3.5h2zM7 19a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm10 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"
        fill={color || 'url(#ambGrad)'}
      />
      <Path d="M7 6.5h2v1H7zm1-1v3h-1v-3z" fill="#EF4444" />
    </Svg>
  );
}

/**
 * 21. Empty State Clipboard / Document Icon
 */
export function EmptyClipboardIcon({ size = 44, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Defs>
        <LinearGradient id="clipGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#87A96B" />
          <Stop offset="100%" stopColor="#5A3E2B" />
        </LinearGradient>
      </Defs>
      <Rect x="8" y="10" width="32" height="34" rx="4" fill={color || 'url(#clipGrad)'} fillOpacity="0.12" stroke={color || '#87A96B'} strokeWidth="2.5" />
      <Rect x="17" y="6" width="14" height="7" rx="2" fill={color || '#87A96B'} />
      <Path d="M16 22h16M16 28h16M16 34h10" stroke={color || '#87A96B'} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * 22. Bookmark / Favorite Icon
 */
export function BookmarkIcon({ size = 18, color, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="bkmkGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#D97706" />
        </LinearGradient>
      </Defs>
      <Path
        d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"
        fill={filled ? (color || 'url(#bkmkGrad)') : 'none'}
        stroke={color || (filled ? 'url(#bkmkGrad)' : '#D97706')}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * 23. Check Circle Icon - Verified Stock Update Confirmation
 */
export function CheckCircleIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="chkGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#10B981" />
          <Stop offset="100%" stopColor="#047857" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="10" fill={color || 'url(#chkGrad)'} />
      <Path
        d="M8.5 12.5l2.5 2.5 5-5"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * 24. Staff Badge / ID Card Icon - Pharmacy Staff Portal
 */
export function StaffBadgeIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="staffGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#8B5CF6" />
          <Stop offset="100%" stopColor="#6D28D9" />
        </LinearGradient>
      </Defs>
      <Rect x="4" y="3" width="16" height="18" rx="3" fill={color || 'url(#staffGrad)'} />
      <Circle cx="12" cy="9" r="2.8" fill="#FFFFFF" />
      <Path
        d="M8 16c0-2 1.8-3 4-3s4 1 4 3"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Rect x="9" y="1" width="6" height="3" rx="1.5" fill="#C4B5FD" />
    </Svg>
  );
}

/**
 * 25. Directions / Map Navigation Icon
 */
export function DirectionsIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="dirGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#38BDF8" />
          <Stop offset="100%" stopColor="#0284C7" />
        </LinearGradient>
      </Defs>
      <Path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke={color || 'url(#dirGrad)'}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * 26. Pill Capsule Icon - Pharmaceutical details
 */
export function PillCapsuleIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="pillGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#F43F5E" />
          <Stop offset="100%" stopColor="#E11D48" />
        </LinearGradient>
      </Defs>
      <Path
        d="M10.5 4.5l9 9a4.24 4.24 0 01-6 6l-9-9a4.24 4.24 0 016-6z"
        stroke={color || 'url(#pillGrad)'}
        strokeWidth="2"
      />
      <Path
        d="M7.5 13.5l3-3"
        stroke={color || '#F43F5E'}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * 27. Back Arrow / Chevron Left Icon
 */
export function BackArrowIcon({ size = 20, color = '#5A3E2B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * 28. Settings / Gear Icon - Apple iOS Liquid Glass settings icon with gradient
 */
export function SettingsIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="settingsGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#38BDF8" />
          <Stop offset="100%" stopColor="#0284C7" />
        </LinearGradient>
      </Defs>
      <Path
        d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
        fill={color || 'url(#settingsGrad)'}
      />
    </Svg>
  );
}

