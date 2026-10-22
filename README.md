# MedFind

> **Emergency-Aware Medicine Discovery & Care Access**  
> *BMSCE CSE Semester 5 Mini Project (October 2026)*

MedFind is an Android-first mobile discovery application designed to reduce information friction when searching for prescribed medicines across participating community pharmacies and locating nearby healthcare directory contacts.

---

## ⚠️ Important Product & Safety Boundaries

MedFind is an **information discovery layer**, not a telemedicine, dispensing, or emergency dispatch system. The following boundaries are strictly enforced across the data model, user experience, and architecture:

1. **Stock Availability & Freshness**:
   - Stock records are append-only snapshots displaying a discrete state (`Available`, `Low stock`, `Unavailable`, `Unknown`) paired with an **exact last-update timestamp**.
   - Stock is **never described as "live" or real-time** unless an active, verified Point-of-Sale (POS) integration exists.
   - Missing data strictly resolves to `Unknown`, never "Available".
2. **Coverage Boundary**:
   - MedFind displays **only participating pharmacies** that have agreed to maintain availability snapshots.
   - The pilot coverage boundary is prominently stated so users do not assume city-wide or comprehensive inventory.
3. **Directory-Only Care Listings**:
   - Hospital, clinic, and ambulance service entries are **directory contact records** showing verified review dates and sources.
   - MedFind makes **zero claims** regarding live hospital bed capacity, ICU availability, emergency room wait times, ambulance response times, ambulance booking, or automatic dispatch.
4. **Clinical Safety**:
   - MedFind does **not** provide medical diagnoses, dosage recommendations, treatment advice, symptom checking, or automatic medicine substitutions.
   - Users are directed to consult a licensed pharmacist or physician for any prescription questions.
5. **Calm Emergency UX**:
   - The Emergency Help action is prominent and accessible within two taps, but visually calm and reassuring. It avoids alarming flashing states, sirens, or panic-inducing visuals.
6. **Data Minimization & Privacy**:
   - The MVP does not store personal medical history, patient diagnoses, or prescription images.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ or v24+)
- npm (v10+ or v11+)
- Android Studio / Android Emulator (or Expo Go app on a physical Android device)

### Installation
```bash
# Clone and enter directory
cd MedFind

# Install dependencies
npm install
```

### Running the App
```bash
# Start Expo development server
npm start

# Run directly on an Android emulator / connected device
npm run android

# Run in web preview
npm run web
```

### Running Unit Tests
```bash
# Run standalone business logic unit tests (freshness boundary calculations)
npm test
```

---

## 🎨 Design System & Approved Themes

MedFind features two distinct, WCAG AA compliant themes defined in the project Design Document:

- **Light Theme (Warm & Editorial)**:
  - **Sage Green** (`#87A96B`): Primary accent & verified availability cue.
  - **Walnut Brown** (`#5A3E2B`): Grounded editorial typography & navigation hierarchy.
  - **Amber Glow** (`#D5851F`): Freshness warning & aging signal.
- **Dark Theme (Cinematic & High-Contrast)**:
  - **Jet Black** (`#050505`): Deep canvas & elevated dark surfaces.
  - **Royal Amethyst** (`#3B0A6B`): Brand accent, active states & secondary actions.
  - **Electric Cyan** (`#00E5FF`): Urgent scan accent, focus rings & verified indicators.

*Accessibility Rule*: All status states include explicit text labels and semantic markers; **no status relies on color alone**. Minimum tap target size is **44 x 44 points**.

---

## 🗄️ Database & Supabase Schema

The local migration script is prepared at:
`supabase/migrations/20261022000000_initial_medfind_schema.sql`

It defines the core relational entities with Row Level Security (RLS) policies:
- `medicines`: Exact prescribed descriptors (name, generic name, brand name, strength, dosage form).
- `pharmacies`: Participating pharmacies with verification timestamps.
- `stock_snapshots`: Append-only availability event log with timestamps and audit updater tracking.
- `provider_listings`: Reviewed directory listings for hospitals, clinics, and ambulance contacts.
- `user_profiles`: Role-based access control (`public`, `pharmacy_staff`, `admin`).
- `audit_events`: Immutable audit logging for stock updates and administrative changes.

> **Note**: Cloud Supabase connectivity is currently **unconnected** pending team account creation. All credentials must be configured via untracked `.env` using `.env.example`.

---

## 🧪 Demo Dataset

A simulated dataset is provided in `src/data/demoData.ts` for evaluation and testing.
Every record is marked with `is_demo: true` and contains **completely fictional** provider names, synthetic addresses, and simulated test phone strings. No real contact details or operational claims are present.
