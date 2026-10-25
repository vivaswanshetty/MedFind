# MedFind

> **Emergency-Aware Medicine Discovery & Care Access**  
> *BMSCE CSE Semester 5 Mini Project (October 2026)*

MedFind is an Android-first mobile discovery application designed to eliminate information friction when searching for prescribed medicines across community pharmacies and locating nearby healthcare directory contacts.

Rather than making unverified claims of "live" inventory, MedFind introduces an **honest freshness indicator** that tells users exactly which pharmacy reported stock, what the availability level was, and how many minutes or hours ago it was confirmed.

---

## ✨ Features

- **Honest Stock Freshness System**:
  - Displays explicit time-stamped stock snapshots across 4 clear freshness tiers:
    - 🟢 **Recent** (Confirmed ≤ 30 mins ago): Highest confidence for immediate visits.
    - 🟡 **Aging** (Confirmed 31–120 mins ago): Useful reference, call store to confirm.
    - 🟠 **Stale** (Confirmed > 2 hours ago): Likely changed, verify before traveling.
    - ⚪ **Unreported**: In catalog but no recent staff report recorded.
  - Distinct stock states: *Available*, *Low Stock*, and *Unavailable*.
  - Strict dosage form filters and clear distinction between identical active ingredients in different formulations (e.g. tablet vs. suspension).

- **Worldwide Emergency Directory & Direct Dialer**:
  - Directory of emergency numbers across 87 countries with official dialing codes and government citations.
  - Direct services access for Universal Emergency (112 / 911 / 999), Police, Ambulance, and Fire Department.
  - Native dialer integration — MedFind opens the phone's dialer ready to call without placing automatic calls.

- **Nearby Places via OpenStreetMap**:
  - Discovers nearby pharmacies, hospitals, clinics, and emergency rooms using live OpenStreetMap (OSM) Overpass API queries.
  - Privacy-preserving query mechanism: coordinates are rounded to 2 decimals (~1 km precision) before query execution.
  - Built-in 24-hour local caching and automatic secondary mirror fallback.

- **My Medicine Box & Refill Reminders**:
  - Offline-first personal medicine tracker capped at 30 items for device safety.
  - Tracks both month-precision (as printed on blister packs) and exact expiry dates.
  - Local push notifications scheduled for 30 days before expiry and on custom refill dates.

- **Personal Health Preferences & Onboarding Buddy**:
  - Quick, swipe-based onboarding tailoring discovery recommendations based on household care needs.
  - Assigns one of 6 supportive mascot buddy archetypes (Remy, Juno, Cleo, Milo, Nova, Pip).
  - Can be skipped instantly from any onboarding screen via the prominent floating emergency bypass.

- **Pharmacy Staff Portal**:
  - Dedicated dispensary interface for participating pharmacy staff to rapidly update stock levels with a single tap.
  - Append-only local audit trail with timestamps and counter identification.

- **Comprehensive Multi-Language Localization**:
  - Full support for **English**, **Kannada (ಕನ್ನಡ)**, and **Hindi (हिंदी)** across all tabs, cards, settings, and forms.

- **Accessible Dual Design System**:
  - **Editorial Warm Light Theme**: Calming sage green (`#87A96B`), warm parchment canvas (`#FCF8ED`), and walnut typography (`#5A3E2B`).
  - **Cinematic High-Contrast Dark Theme**: Deep black surfaces (`#050505`), royal amethyst brand accents (`#3B0A6B`), and electric cyan (`#00E5FF`).
  - WCAG AA compliant with minimum 44×44pt tap targets and zero reliance on color alone for conveying status.

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) (0.88) with [Expo SDK 58](https://expo.dev/)
- **Navigation & Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing with tab navigation)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict type checking)
- **Animation & Gestures**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) (v4) & [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) (v3)
- **Storage**: [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) (Device-local persistence)
- **Device Capabilities**:
  - `expo-location`: GPS permission handling and approximate coordinate resolution
  - `expo-notifications`: Local device reminder scheduling
  - `expo-haptics`: Tactile feedback on interactive gestures
  - `expo-font`: SF Pro Display typography loading
- **External Data Sources**:
  - [OpenStreetMap Overpass API](https://overpass-api.de/): Live nearby healthcare facilities lookup
  - [Supabase](https://supabase.com/): Optional cloud backend for synchronized inventory (falls back to local verified catalog when unconfigured)
- **Test Runner**: Node.js native test runner (`node:test`) executed with `npx tsx`

---

## 🚀 How to Run

### Prerequisites
- Node.js (v20+ or v24+ recommended)
- npm (v10+)
- [Expo Go](https://expo.dev/go) app installed on your physical iOS or Android device, or an Android Studio Emulator / Xcode Simulator.

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/vivaswanshetty/MedFind.git
cd MedFind

# Install project dependencies
npm install
```

### 2. Start the Development Server
```bash
# Start the Expo bundler
npx expo start
```

### 3. Open the App
- **Physical Device**: Scan the QR code displayed in the terminal using the Expo Go app (Android) or the native Camera app (iOS).
- **Android Emulator**: Press `a` in the terminal.
- **iOS Simulator**: Press `i` in the terminal.
- **Web Preview**: Press `w` in the terminal.

### 4. Running Verification & Tests
```bash
# Run the complete test suite (119 automated tests)
npm test

# Run TypeScript type check
npx tsc --noEmit
```

---

## 🔒 Privacy & Local Storage Note

MedFind is built on strict data minimization principles:
- **Everything is stored on your phone**: All profile answers, medicine box records, search history, and store sessions are saved strictly in your device's local storage via AsyncStorage.
- **No Cloud Tracking**: MedFind never transmits your search terms, viewed medicines, or visited places to external servers.
- **Approximate Location**: When querying nearby places from OpenStreetMap, your GPS coordinates are truncated to 2 decimal places (~1 km radius) to protect your exact home or current address.
- **Full Device Wipe**: You can permanently clear all personal data, saved medicines, and search terms at any time from *Settings > Profile > Delete Everything*.

---

## 🧪 Demo Data Note

- The pharmacy stock catalog and demo provider listings (`src/data/demoData.ts`) are **sample demonstration data** designed for evaluation and UI testing.
- Facilities in the Care tab and map views are queried dynamically from public **OpenStreetMap** servers based on your approximate location.
- Cloud Supabase integration is optional: if no credentials are configured in `.env`, the app automatically and seamlessly falls back to the local verified demo catalog.

---

## ⚠️ Known Limitations

1. **Sample Stock Data**: Pharmacy availability snapshots in this demo build are synthetic demonstration records to showcase freshness algorithms and UI states.
2. **No Live Pharmacy Reports**: MedFind is not currently connected to active Point-of-Sale (POS) retail pharmacy inventory systems; all reports reflect manual staff submissions or demonstration test data.
3. **Emergency Numbers Not Independently Verified**: The Worldwide Emergency Directory numbers and dialing codes are compiled from public international repositories (government portals, foreign travel advisories, and the International Telecommunication Union). While vetted with sources cited, they must not be relied upon as a substitute for official local emergency guidelines, and MedFind does not dispatch emergency services.
4. **Overpass Servers are Rate-Limited**: The public OpenStreetMap Overpass API instances utilized for nearby facility queries are shared community infrastructure and may occasionally experience throttling or temporary latency during peak global traffic. The app caches results locally for 24 hours to minimize queries.
