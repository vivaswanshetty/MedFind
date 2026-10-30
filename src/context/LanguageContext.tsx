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

export const translations: Record<AppLanguage, Record<string, string>> = {
  en: {
    // Navigation / Tabs
    tab_home: 'Home',
    tab_search: 'Search',
    tab_map: 'Map',
    tab_emergency: 'Emergency',
    tab_care: 'Care',

    // Home / Hero
    hero_headline_1: 'Find your medicine',
    hero_highlight: 'before',
    hero_headline_2: 'you visit.',
    hero_subtext: 'See which nearby pharmacy last confirmed it, and exactly how long ago.',
    search_medicine_name: 'Search medicine name',
    care_nearby_title: 'Care nearby',
    care_nearby_subtitle: 'Hospitals, clinics and ambulance contacts',
    emergency_help_title: 'Emergency help',
    emergency_help_subtitle: 'Call 112 or view emergency contacts',
    for_you: 'For you',
    for_you_subtitle: 'Tailored based on your onboarding preferences',
    set_your_area: 'Set your area',

    // Freshness System Guide
    stock_status_guide: 'STOCK STATUS GUIDE',
    how_to_check_stock: 'How to check medicine availability',
    check_stock_sub: 'Check when the pharmacy last confirmed their stock so you can visit directly or call first.',
    just_updated_ready: 'Just updated • Ready to visit',
    call_store_first: 'Call store first',
    tier_recent_title: 'Updated Just Now',
    tier_recent_time: 'Within 30 mins',
    tier_recent_desc: 'Directly confirmed by the pharmacy staff. You can visit the store with full confidence.',
    tier_aging_title: 'Updated Earlier Today',
    tier_aging_time: '30 min – 2 hrs',
    tier_aging_desc: 'Confirmed earlier today. Stock is likely available, but fast-moving items can run out.',
    tier_stale_title: 'Updated Earlier',
    tier_stale_time: 'Over 2 hrs ago',
    tier_stale_desc: 'Update was a few hours ago. We recommend tapping Call to check before heading out.',
    tier_unreported_title: 'Call Store Directly',
    tier_unreported_time: 'No report today',
    tier_unreported_desc: 'Pharmacy is open, but has not sent a stock update today. Tap Call to check with the pharmacist.',
    genuine_updates_notice: 'Genuine pharmacy updates only. MedFind never guesses or invents stock availability.',
    demo_sample_data_label: 'Demo app: sample data',

    // Search
    search_placeholder: 'Search medicines (e.g. Dolo, Cough, Calpol)...',
    search_subtext: 'Find medicines by brand or formula name.',
    search_medicine_title: 'Search medicine',
    popular_medicines: 'Common medicines',
    recent_searches_device: 'Recent, saved on this device only',
    clear_all: 'Clear all',
    clear_search: 'Clear search',
    verified_network: 'Verified Network',
    verified_network_desc: 'Stock reported directly by participating pharmacies.',
    sample_data_badge: 'Sample data',
    sample_data_notice: 'Sample data for demonstration. Call the pharmacy to confirm stock.',
    verified_stock_title: 'Verified Pharmacy Stock',
    verified_stock_desc: 'Stock is confirmed directly by pharmacy staff.',
    sample_care_network: 'Sample healthcare directory for demonstration',
    showing_region: 'Showing {region}',
    unsupported_region_title: 'No pharmacy data for this area yet',
    unsupported_region_notice: "MedFind doesn't have pharmacy data for this area yet.",
    choose_another_area: 'Choose another area',
    emergency_link: 'Emergency contacts',
    no_area_set: 'No area set',
    filter_type: 'MEDICINE TYPE',
    filter_dose: 'DOSE / STRENGTH',
    filter_all: 'All',
    tablet: 'Tablet',
    syrup: 'Syrup',
    inhaler: 'Inhaler',
    cream: 'Cream',
    injection: 'Injection',
    drops: 'Drops',
    no_matching_records: 'No matching records',
    no_records_hint: "We couldn't find a record matching your search. Try checking the spelling or searching by generic formula.",
    matching_records: 'Matching records',
    exact_descriptions: 'exact descriptions',
    diff_form_notice: 'Different formulation, not treated as equivalent',

    // Availability & Actions
    in_stock: 'In stock',
    available: 'Available',
    low_stock: 'Few left',
    out_of_stock: 'Out of stock',
    call_to_check: 'Call to check',
    unreported: 'Call store to verify',
    call: 'Call',
    call_store: 'Call store',
    call_pharmacy: 'Call pharmacy',
    directions: 'Directions',
    open_daily: 'Open 24/7',
    distance_km: 'km away',

    // Care & Providers
    care_title: 'Care nearby',
    care_subtitle: 'Verified hospitals, clinics, ambulance contacts & pharmacies',
    hospitals: 'Hospitals',
    clinics: 'Clinics',
    ambulances: 'Ambulance',
    pharmacies: 'Pharmacies',
    all: 'All',
    osm_care_title: 'Nearby healthcare from OpenStreetMap',
    osm_care_body: 'Real hospitals, clinics, and pharmacies. Call ahead to confirm hours, emergency availability, or stock.',
    direct_phone_numbers: 'Direct phone numbers for hospitals, clinics, ambulance services & pharmacies.',

    // Emergency
    emergency_title: 'If this is an emergency, call now.',
    emergency_subtitle: "One tap opens your phone's dialer. You place the call yourself.",
    emergency_numbers_for: 'Emergency numbers for',
    change_country: 'Change country',
    call_local_emergency: 'Call your local emergency number',
    common_emergency_numbers: 'Common numbers: 112, 911, and 999. MedFind does not dispatch help or estimate arrival.',
    call_112: 'Call emergency service',
    dial_112: 'Dial 112',
    call_108: 'Call Ambulance (108)',
    quick_guide: 'Quick Emergency Help',
    quick_guide_desc: 'In severe or life-threatening situations, call your local emergency service immediately for priority help.',
    direct_services: 'DIRECT SERVICES',
    police: 'Police',
    police_sub: 'Emergency Law Enforcement',
    ambulance_medical: 'Ambulance / Medical Emergency',
    ambulance_sub: 'Urgent Medical Care',
    fire_rescue: 'Fire & Rescue Service',
    fire_sub: 'Fire & Disaster Rescue',
    dial_prefix: 'Dial',
    worldwide_directory: 'Worldwide Emergency Directory',
    worldwide_directory_sub: 'All 87 country codes, police, ambulance & fire numbers',
    unverified_region: 'Unverified Region',
    helplines_in: 'Helplines in',
    women_helpline: 'Women Helpline',
    child_helpline: 'Child Helpline',
    senior_helpline: 'Senior Citizen Helpline',
    disaster_helpline: 'Disaster Helpline',
    mental_health_helpline: 'Mental Health Helpline (Tele-MANAS)',
    official_citations: 'Official Government Citations',

    // Settings
    settings: 'Settings',
    healthcare_tools: 'Healthcare & Tools',
    my_medicine_box: 'My Medicine Box',
    medicine_box_desc: 'Track saved medicines, expiry & refill dates',
    emergency_directory_title: 'Emergency Directory',
    emergency_directory_subtitle: '87 countries • Calling codes & verified helplines',
    preferences: 'Preferences',
    language: 'App Language',
    language_subtitle: 'English, ಕನ್ನಡ, हिंदी',
    appearance: 'Appearance',
    light_theme: 'Light theme',
    dark_theme: 'Dark theme',
    services_info: 'Services & Information',
    how_location_works: 'How Location Works',
    how_location_subtitle: 'GPS usage, distance calculation & privacy',
    quality_policy: 'Quality & Safety Policy',
    quality_policy_subtitle: 'Official records & verified stores',
    data_management: 'Data Management',
    reset_answers: 'Reset my answers',
    reset_answers_sub: 'Retake questions to update your buddy and recommendations',
    delete_medicine_box: 'Delete all medicine box data',
    delete_medicine_box_sub: 'Remove all saved medicines and cancel scheduled reminders',
    close: 'Close',
    switch_theme: 'Switch',
    change_language: 'Change',
    understood: 'Understood',
    switch_to_dark: 'Tap to switch to dark theme',
    switch_to_light: 'Tap to switch to light theme',
    personal_health_prefs: 'Personal health preferences & answers',
    tap_to_view_profile: 'Tap to view profile',
    reset_answers_confirm_title: 'Reset answers?',
    reset_answers_confirm_msg: 'This will reset your onboarding answers so you can retake the questions and update your buddy and recommendations.',
    delete_box_confirm_title: 'Delete all medicine box data?',
    delete_box_confirm_msg: 'This will remove all saved medicines and cancel any scheduled reminders. This action cannot be undone.',
    cancel: 'Cancel',
    reset: 'Reset',
    delete_all: 'Delete all',
    search_directory_placeholder: 'Search by country, code (+91) or number...',
    set_as_my_country: 'Set as my country',
    active_emergency_country: 'Active Emergency Country',
    verified: 'Verified',
    general_service: 'General',
    hide_sources: 'Hide official sources ▲',
    official_citations_btn: 'Official Government Citations ({count}) ▼',
    emergency_direct_call_note: 'Tapping opens your dialer with {number} ready. MedFind does not dispatch help or estimate arrival.',
    emergency_direct_tap_note: 'Tap any service below to open your dialer. MedFind does not dispatch help.',
    see_all_care_nearby: 'See all care nearby',

    // Profile & Storage
    profile_screen_title: 'Profile & Local Data',
    saved_only_on_phone: 'Saved only on this phone',
    who_finding_for: "Who I'm finding medicine for",
    tailors_recommendations: 'Tailors search results and recommendations',
    age_group_title: 'Age group',
    age_group_sub: 'Used to suggest age-appropriate formulations',
    my_answers: 'My answers',
    my_answers_sub: 'Adjust your preferences anytime. Recommendations update immediately.',
    saved_on_phone: 'Saved on this phone',
    saved_on_phone_sub: 'Local device storage counts and management',
    saved_medicines_title: 'Saved Medicines',
    recent_searches_title: 'Recent Searches',
    location_preference_title: 'Location Preference',
    clear_everything: 'Clear everything',
    clear_everything_sub: 'Deletes all profile data, medicine box items, and searches. Theme and language settings will be kept.',
    delete_everything_btn: 'Delete Everything',
    clear: 'Clear',
    sign_out: 'Sign out',
    change_role: 'Change role',
    change_role_sub: 'Switch between customer and pharmacy staff',
    change_role_confirm_msg: 'This takes you back to the start.',
    back_to_role_picker: 'Back / Change role',
    emergency_country_ref_title: 'Emergency & Country References',
    emergency_country_ref_sub: 'Worldwide emergency lines and dialing codes directory',
    no_tracking_sub: 'No tracking: MedFind never records which medicines you view or places you visit.',
    osm_privacy_notice: 'Nearby places are looked up with your approximate location using OpenStreetMap servers.',
    emergency_demo_disclaimer: 'Demo app: emergency numbers may be incomplete or out of date. In a real emergency, call your local emergency number.',
    medicines_count: '{current}/{max} medicines',
    empty_box_title: 'Your medicine box is empty',
    empty_box_sub: 'Keep track of expiry dates and get refill reminders on this phone.',
    add_medicine_btn: 'Add a medicine',
    box_full_banner: 'Your medicine box is full ({count} items)',
    saved_only_phone_never_shared: 'Saved only on this phone. Never shared.',
    edit_medicine: 'Edit Medicine',
    add_medicine: 'Add Medicine',
    save_changes: 'Save Changes',
    add_to_box: 'Add to Box',
    remind_me: 'Remind me',
    remind_sub: 'Get notified before expiry and on refill day',

    // Recommendations & Greetings
    welcome: 'Welcome',
    hi_prefix: 'Hi',
    why_seeing_this: 'Why am I seeing this?',
    'Finish setting up (takes 1 minute)': 'Finish setting up (takes 1 minute)',
    'Personalize your buddy, notifications, and recommendations': 'Personalize your buddy, notifications, and recommendations',
    'Check availability near you': 'Check availability near you',
    'Search nearby verified pharmacies before making an unnecessary trip': 'Search nearby verified pharmacies before making an unnecessary trip',
    'Find a pediatric clinic': 'Find a pediatric clinic',
    'View verified primary healthcare clinics and pediatric consultation centers nearby': 'View verified primary healthcare clinics and pediatric consultation centers nearby',
    'Child dosage safety notice': 'Child dosage safety notice',
    'Always verify liquid medicine concentrations and weight-based doses with a doctor': 'Always verify liquid medicine concentrations and weight-based doses with a doctor',
    'Emergency hospital care': 'Emergency hospital care',
    'Locate emergency-ready hospitals with 24/7 casualty departments nearby': 'Locate emergency-ready hospitals with 24/7 casualty departments nearby',
    'Elder care & home safety': 'Elder care & home safety',
    'Keep emergency contacts pinned and check that daily medicines are accessible': 'Keep emergency contacts pinned and check that daily medicines are accessible',
    'First-aid supplies': 'First-aid supplies',
    'Browse essential antiseptics, bandages, and basic wound care items nearby': 'Browse essential antiseptics, bandages, and basic wound care items nearby',
    'Explore verified care facilities': 'Explore verified care facilities',
    'Browse hospitals, clinics, and emergency services in your area': 'Browse hospitals, clinics, and emergency services in your area',
    'Search essential medicines': 'Search essential medicines',
    'Locate nearby pharmacies and view last-verified stock reports': 'Locate nearby pharmacies and view last-verified stock reports',
    'Set refill & expiry reminders': 'Set refill & expiry reminders',
    'Never run out of essentials': 'Never run out of essentials',
    'Because you skipped initial setup': 'Because you skipped initial setup',
    "Because you said you've struggled to find a medicine in stock": "Because you said you've struggled to find a medicine in stock",
    'Because you have a child in your household profile': 'Because you have a child in your household profile',
    'Because you have a senior in your household profile': 'Because you have a senior in your household profile',
    "Because you don't have a basic first-aid kit ready": "Because you don't have a basic first-aid kit ready",
    "Because you said you'd like refill reminders": "Because you said you'd like refill reminders",
    'Personalized recommendations based on your preferences': 'Personalized recommendations based on your preferences',

    // Profile Chip & Toggle Options
    'Me': 'Me',
    'Parent': 'Parent',
    'Child': 'Child',
    'Someone else': 'Someone else',
    'Under 5': 'Under 5',
    '5 to 12': '5 to 12',
    '13 to 17': '13 to 17',
    '18 to 59': '18 to 59',
    '60 and above': '60 and above',
    'Male': 'Male',
    'Female': 'Female',
    'Other': 'Other',
    'Prefer not to say': 'Prefer not to say',
    'Penicillin': 'Penicillin',
    'Aspirin': 'Aspirin',
    'Sulfa drugs': 'Sulfa drugs',
    'Latex': 'Latex',
    'Peanuts': 'Peanuts',
    'Shellfish': 'Shellfish',
    'Dairy': 'Dairy',
    'Gluten': 'Gluten',
    'None': 'None',
    'I keep a medicine box at home': 'I keep a medicine box at home',
    "I've struggled to find a medicine in stock": "I've struggled to find a medicine in stock",
    'I buy medicines for my family': 'I buy medicines for my family',
    "I'd like refill reminders": "I'd like refill reminders",
    'I compare prices before buying': 'I compare prices before buying',

    // Staff Onboarding & Portal
    staff_badge_title: 'Pharmacy Staff Mode',
    staff_badge_info_msg: 'This symbol indicates you are in Pharmacy Staff Mode, reserved for licensed dispensary staff to update live medicine stock.\n\nIf you are a customer looking for medicines, tap "< Back / Change role" on the top left.',
    authorized_personnel_only: 'AUTHORIZED PERSONNEL ONLY',
    store_partner_onboarding: 'Store Partner Onboarding',
    step_store: 'Store',
    step_staff_id: 'Staff ID',
    step_attest: 'Attest',
    select_operating_pharmacy: 'Select Operating Pharmacy',
    select_pharmacy_sub: 'Choose the verified retail dispensary or hospital counter you are operating today.',
    verified_pilot_partner: 'Verified Pilot Partner',
    continue_to_pharmacist_id: 'Continue to Pharmacist ID',
    pharmacist_identification: 'Pharmacist Identification',
    pharmacist_id_sub: 'Enter your licensed pharmacist credentials. Every inventory modification is logged with your operator identity.',
    autofill_demo_credentials: 'Autofill Demo Credentials',
    pharmacist_name_label: 'Registered Pharmacist Name *',
    license_number_label: 'KSPC Registration / Drug Retail License *',
    counter_station_label: 'Counter / Dispensing Station *',
    back_btn: 'Back',
    continue_to_attest: 'Continue to Attest',
    regulatory_attestation_title: 'Clinical & Regulatory Attestation',
    regulatory_attestation_sub: 'Review and certify compliance with Karnataka Drug Rules & MedFind transparency standards.',
    shelf_verification_title: 'Physical Shelf Verification',
    shelf_verification_desc: 'I confirm that availability updates represent physically inspected stock on retail shelves.',
    dpco_price_compliance: 'DPCO Price Compliance',
    dpco_price_compliance_sub: 'Dispensed essential medicines adhere strictly to NPPA ceiling prices without markups.',
    traceable_audit_trail: 'Traceable Audit Trail',
    traceable_audit_trail_sub: 'Updates record my operator identity and timestamp for regulatory inspection.',
    attest_checkbox_label: 'I attest under Section 65 of Drugs and Cosmetics Rules that I am authorized dispensary staff.',
    onboarding_assignment: 'ONBOARDING ASSIGNMENT',
    complete_verification_btn: 'Complete Verification & Enter Portal',
    staff_portal: 'Staff Portal',
    hospital_portal: 'Hospital Portal',
    clinic_portal: 'Clinic Portal',
    pharmacy_portal: 'Pharmacy Portal',
    hospital_tab: 'Hospital',
    clinic_tab: 'Clinic',
    pharmacy_tab: 'Pharmacy',
    hospital_settings_title: 'Hospital Settings & Compliance',
    clinic_settings_title: 'Clinic Settings & Compliance',
    pharmacy_settings_title: 'Pharmacy Settings & Compliance',
    tier_hospital: 'Hospital (Tier 1)',
    tier_clinic: 'Clinic (Tier 2)',
    tier_pharmacy: 'Pharmacy (Tier 3)',
    facility_type_label: 'Establishment Category',
    hospital_category_label: 'Hospital Category',
    hospital_category_desc: 'KPME Sanctioned Operational Classification',
    category_level_1: 'Level 1A/1B Basic Hospital',
    category_level_2: 'Level 2 Multi-Specialty Hospital',
    category_level_3: 'Level 3 Super-Specialty Hospital',
    category_level_4: 'Level 4 Teaching / Tertiary Hospital',
    bed_capacity_label: 'Sanctioned Inpatient Bed Capacity',
    operation_theatres_label: 'Operation Theatres (OT)',
    icu_beds_label: 'Intensive Care Units (ICU)',
    emergency_beds_label: 'Emergency / Casualty Beds',
    bio_waste_id_label: 'Bio-Medical Waste User ID (KSPCB)',
    nodal_officer_name_label: 'Nodal Grievance Redressal Officer',
    nodal_officer_contact_label: 'Grievance Officer Contact Phone',
    medical_superintendent_label: 'Medical Superintendent / Administrator',
    clinic_type_label: 'Clinic Type',
    clinic_type_solo: 'Solo Doctor Consultation',
    clinic_type_multi: 'Multi-Specialty Polyclinic',
    clinic_type_daycare: 'Daycare Centre',
    system_of_medicine_label: 'System of Medicine',
    medicine_allopathy: 'Allopathy (Modern Medicine)',
    medicine_ayurveda: 'Ayurveda',
    medicine_homeopathy: 'Homeopathy',
    medicine_unani: 'Unani',
    diagnostic_support_label: 'Internal Diagnostic Support (X-Ray / Labs)',
    diagnostic_yes: 'Yes - Internal On-Site Facility',
    diagnostic_no: 'No - External Labs Only',
    primary_doctor_name_label: "Primary In-Charge Doctor's Name",
    primary_doctor_degree_label: 'Doctor Qualifications & Degree (e.g. MBBS, MD)',
    state_medical_council_reg: 'State Medical Council Reg. No. (e.g. KMC)',
    drug_license_form_20: 'Drug License Form 20 (Retail)',
    drug_license_form_21: 'Drug License Form 21 (Specified / Schedule)',
    pharmacist_council_reg: 'Pharmacy Council Reg. No. (KSPC)',
    cold_chain_status_label: 'Cold Chain Monitoring Infrastructure',
    cold_chain_automated: 'Automated 24/7 Digital Data Logger (2-8°C)',
    cold_chain_manual: 'Twice-Daily Manual Temperature Register',
    cold_chain_standard: 'Standard Domestic Cold Storage',
    mandatory_document_uploads: 'MANDATORY DOCUMENT UPLOADS',
    upload_doc_btn: 'Upload Document (PDF/Image)',
    uploaded_status: 'Uploaded & Verified',
    required_status: 'Required',
    quick_fill_compliance: 'Quick-Fill All Compliance & Documents',
    quick_fill_compliance_sub: 'Pre-fills official Karnataka regulatory data for demonstration',
    kpme_attestation_statement: 'I hereby declare under the Karnataka Private Medical Establishments (KPME) Act and Bio-Medical Waste Management Rules that all facility details, infrastructure counts, and uploaded licenses are valid and true.',
    drugs_act_attestation_statement: 'I hereby declare under the Drugs & Cosmetics Act 1940 and Pharmacy Act 1948 that Form 20/21 licenses are active and the registered pharmacist is in attendance during dispensing hours.',
    verified_badge: 'Verified',
    store_settings_tab: 'Store',
    search_pharmacy_inventory_placeholder: 'Search medicine brand, generic name...',
    all_items: 'All Items',
    on_shelf_stock_header: 'ON-SHELF DISPENSARY STOCK',
    updated_prefix: 'Updated',
    no_reports_yet: 'No reports yet',
    store_settings_title: 'Store Settings',
    dispensary_staff_station: 'Dispensary & Staff Station',
    session_stock_updates_notice: 'Stock updates are kept locally for this session.',
    current_store_credentials: 'CURRENT STORE & CREDENTIALS',
    registered_pharmacist_label: 'Registered Pharmacist',
    registration_license_label: 'Registration / License No.',
    dispensing_station_label: 'Dispensing Station',
    appearance_and_lang: 'APPEARANCE & LANGUAGE',
    theme_label: 'Theme',
    light_mode: 'Light Mode',
    dark_mode: 'Dark Mode',
    store_photos_heading: 'STORE PHOTOS',
    add_store_photo: 'Add Store Photo',
    replace_photo: 'Replace Photo',
    remove_photo: 'Remove',
    photo_upload_web_hint: 'Click to choose from your files',
    photo_upload_native_hint: 'Tap to open camera or gallery',
    store_location_heading: 'STORE LOCATION',
    share_live_location: 'Share Live Location',
    update_live_location: 'Update Live Location',
    getting_location: 'Getting Location…',
    location_shared_success: 'Location shared!',
    location_share_sub: 'Helps customers navigate to your exact counter',
    session_and_role: 'SESSION & ROLE',
    sign_out_of_pharmacy: 'Sign out of pharmacy',
    clears_credentials_sub: 'Clears verified credentials on this device',
    switch_to_customer: 'Switch to Customer View',
    switch_to_customer_sub: 'Search medicines and view nearby pharmacies as a patient',
    pinpoint_on_map: 'Pinpoint on Map',
    pinpoint_on_live_map: 'Pinpoint on Live Map',
    pinpoint_map_subtitle: 'Drag the marker or tap anywhere on the OpenStreetMap to set your exact location.',
    pinpoint_confirm_btn: 'Set this as my location',
    pinpoint_hospital_location: 'Pinpoint Hospital Entrance',
    pinpoint_clinic_location: 'Pinpoint Clinic Location',
    pinpoint_pharmacy_location: 'Pinpoint Pharmacy Counter',
    recenter_gps: 'Re-center to GPS',
    selected_live_location: 'Selected Live Location',
    searching_location: 'Finding address…',
    back_change_role: 'Back / Change role',
    onboarding_badge: 'Onboarding',
    compliance_label: 'Compliance',
    documents_label: 'Documents',
    select_sanctioned_hospital: 'Select Sanctioned Hospital Establishment',
    select_registered_clinic: 'Select Registered Outpatient Clinic',
    hospital_step_desc: 'High-compliance clinical establishments registered under KPME Act with inpatient wards.',
    clinic_step_desc: 'Outpatient and consultation medical establishments registered under KPME Act.',
    pharmacy_step_desc: 'Retail drug storefronts licensed under the Drugs & Cosmetics Act 1940.',
    badge_kpme_hospital: 'KPME Level 2/3 Registered',
    badge_kpme_clinic: 'KPME OPD Registered',
    badge_verified_partner: 'Verified Pilot Partner',
    continue_to_compliance_questions: 'Continue to Compliance Questions',
    continue_to_documents: 'Continue to Document Verification',
    back_to_selection: 'Back to Selection',
    back_to_compliance: 'Back to Questions',
    complete_onboarding: 'Attest & Enter Portal',
    scannings_and_diagnostics: 'Diagnostic Imaging & Scanning Facilities',
    scannings_sub: 'Select imaging & diagnostic services provided on-site',
    emergency_scanning_247: '24/7 Emergency Scanning Available',
    aerb_clearance_title: 'AERB Radiation Safety Clearance / Reg No.',
    how_will_you_use: 'How will you use MedFind?',
    select_role_sub: 'Select your role to personalize your medical directory & tools.',
    role_buyer: 'Buyer / Patient',
    role_buyer_sub: 'Find medicines, compare prices & track health',
    role_pharma: 'Pharmacy',
    role_pharma_sub: 'Manage pharmacy stock & dispensary',
    role_clinic: 'Clinic',
    role_clinic_sub: 'Manage clinic dispensary & patient supplies',
    role_hospital: 'Hospital',
    role_hospital_sub: 'Manage hospital pharmacy, wards & scanning',
    role_continue: 'Continue',
    change_role_or_signout: 'Sign Out / Switch Role',
    change_role_or_signout_sub: 'Return to start screen to choose Buyer, Pharmacy, Clinic, or Hospital',
    hospital_compliance_title: 'Hospital Regulatory Compliance Data',
    clinic_compliance_title: 'Clinic Regulatory Compliance Data',
    pharmacy_compliance_title: 'Pharmacy Commercial Compliance Data',
    hospital_compliance_desc: 'Mandatory government data fields required for bedded inpatient facilities under Karnataka KPME rules.',
    clinic_compliance_desc: 'Mandatory government data fields required for Outpatient Consultations under KPME rules.',
    pharmacy_compliance_desc: 'Mandatory license data required by the State Drugs Control Department under the Drugs and Cosmetics Act.',
    hospital_docs_desc: 'Government-mandated clearances and certifications required for bedded inpatient hospitals.',
    clinic_docs_desc: 'Professional licenses and premises certifications required for outpatient consultation clinics.',
    pharmacy_docs_desc: 'Commercial drug licenses and full-time pharmacist credentials required for retail pharmacies.',
    verify_hospital_enter: 'Verify Hospital & Enter Portal',
    verify_clinic_enter: 'Verify Clinic & Enter Portal',
    verify_pharmacy_enter: 'Verify Pharmacy & Enter Portal',
  },

  kn: {
    // Navigation / Tabs
    tab_home: 'ಮುಖಪುಟ',
    tab_search: 'ಹುಡುಕಿ',
    tab_map: 'ನಕ್ಷೆ',
    tab_emergency: 'ತುರ್ತು',
    tab_care: 'ಆರೈಕೆ',

    // Home / Hero
    hero_headline_1: 'ನಿಮ್ಮ ಔಷಧಿಯನ್ನು ಹುಡುಕಿ',
    hero_highlight: 'ಭೇಟಿ ನೀಡುವ',
    hero_headline_2: 'ಮೊದಲು ತಿಳಿಯಿರಿ.',
    hero_subtext: 'ಹತ್ತಿರದ ಯಾವ ಔಷಧಾಲಯವು ಕೊನೆಯದಾಗಿ ದೃಢಪಡಿಸಿದೆ ಮತ್ತು ಎಷ್ಟು ಸಮಯದ ಹಿಂದೆ ಎಂದು ತಿಳಿಯಿರಿ.',
    search_medicine_name: 'ಔಷಧಿಯ ಹೆಸರು ಹುಡುಕಿ',
    care_nearby_title: 'ಹತ್ತಿರದ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳು',
    care_nearby_subtitle: 'ಆಸ್ಪತ್ರೆಗಳು, ಕ್ಲಿನಿಕ್‌ಗಳು ಮತ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಂಪರ್ಕಗಳು',
    emergency_help_title: 'ತುರ್ತು ಸಹಾಯ',
    emergency_help_subtitle: '112 ಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ತುರ್ತು ಸಂಪರ್ಕಗಳನ್ನು ನೋಡಿ',
    for_you: 'ನಿಮಗಾಗಿ',
    for_you_subtitle: 'ನಿಮ್ಮ ಆದ್ಯತೆಗಳಿಗೆ ಅನುಗುಣವಾಗಿ ಹೊಂದಿಸಲಾಗಿದೆ',
    set_your_area: 'ನಿಮ್ಮ ಪ್ರದೇಶ ಹೊಂದಿಸಿ',

    // Freshness System Guide
    stock_status_guide: 'ಸ್ಟಾಕ್ ಸ್ಥಿತಿ ಮಾರ್ಗದರ್ಶಿ',
    how_to_check_stock: 'ಔಷಧಿ ಲಭ್ಯತೆಯನ್ನು ಹೇಗೆ ಪರಿಶೀಲಿಸುವುದು',
    check_stock_sub: 'ಔಷಧಾಲಯವು ಕೊನೆಯದಾಗಿ ಯಾವಾಗ ಸ್ಟಾಕ್ ಖಚಿತಪಡಿಸಿದೆ ಎಂದು ಪರಿಶೀಲಿಸಿ, ನೇರವಾಗಿ ಭೇಟಿ ನೀಡಿ ಅಥವಾ ಮೊದಲು ಕರೆ ಮಾಡಿ.',
    just_updated_ready: 'ಈಗಷ್ಟೇ ನವೀಕರಿಸಲಾಗಿದೆ • ಭೇಟಿ ನೀಡಬಹುದು',
    call_store_first: 'ಮೊದಲು ಅಂಗಡಿಗೆ ಕರೆ ಮಾಡಿ',
    tier_recent_title: 'ಈಗಷ್ಟೇ ನವೀಕರಿಸಲಾಗಿದೆ',
    tier_recent_time: '30 ನಿಮಿಷಗಳ ಒಳಗೆ',
    tier_recent_desc: 'ಔಷಧಾಲಯದ ಸಿಬ್ಬಂದಿಯಿಂದ ನೇರವಾಗಿ ದೃಢೀಕರಿಸಲಾಗಿದೆ. ನೀವು ಭೇಟಿ ನೀಡಬಹುದು.',
    tier_aging_title: 'ಇಂದು ಮೊದಲೇ ನವೀಕರಿಸಲಾಗಿದೆ',
    tier_aging_time: '30 ನಿಮಿಷ – 2 ಗಂಟೆ',
    tier_aging_desc: 'ಇಂದು ಮೊದಲೇ ದೃಢೀಕರಿಸಲಾಗಿದೆ. ಸ್ಟಾಕ್ ಲಭ್ಯವಿರುವ ಸಾಧ್ಯತೆಯಿದೆ.',
    tier_stale_title: 'ಹಿಂದೆ ನವೀಕರಿಸಲಾಗಿದೆ',
    tier_stale_time: '2 ಗಂಟೆಗೂ ಹೆಚ್ಚು ಹಿಂದೆ',
    tier_stale_desc: 'ಕೆಲವು ಗಂಟೆಗಳ ಹಿಂದೆ ನವೀಕರಿಸಲಾಗಿದೆ. ಹೊರಡುವ ಮೊದಲು ಕರೆ ಮಾಡಿ ವಿಚಾರಿಸಿ.',
    tier_unreported_title: 'ನೇರವಾಗಿ ಅಂಗಡಿಗೆ ಕರೆ ಮಾಡಿ',
    tier_unreported_time: 'ಇಂದು ವರದಿಯಾಗಿಲ್ಲ',
    tier_unreported_desc: 'ಔಷಧಾಲಯ ತೆರೆದಿದೆ, ಆದರೆ ಇಂದು ಸ್ಟಾಕ್ ವರದಿ ಬಂದಿಲ್ಲ. ಫಾರ್ಮಸಿಸ್ಟ್ ಜತೆ ವಿಚಾರಿಸಲು ಕರೆ ಮಾಡಿ.',
    genuine_updates_notice: 'ನೈಜ ಔಷಧಾಲಯ ನವೀಕರಣಗಳು ಮಾತ್ರ. ಮೆಡ್‌ಫೈಂಡ್ ಎಂದಿಗೂ ಸ್ಟಾಕ್ ಲಭ್ಯತೆಯನ್ನು ಊಹಿಸುವುದಿಲ್ಲ.',
    demo_sample_data_label: 'ಡೆಮೊ ಆ್ಯಪ್: ಮಾದರಿ ಮಾಹಿತಿ',

    // Search
    search_placeholder: 'ಔಷಧಿಗಳನ್ನು ಹುಡುಕಿ (ಡೋಲೋ, ಕೆಮ್ಮು, ಕಾಲ್ಪಾಲ್)...',
    search_subtext: 'ಔಷಧಿಯ ಹೆಸರು ಅಥವಾ ಸತ್ವದ ಹೆಸರಿನಿಂದ ಹುಡುಕಿ.',
    search_medicine_title: 'ಔಷಧಿ ಹುಡುಕಿ',
    popular_medicines: 'ಸಾಮಾನ್ಯ ಔಷಧಿಗಳು',
    recent_searches_device: 'ಇತ್ತೀಚಿನವು, ಈ ಸಾಧನದಲ್ಲಿ ಮಾತ್ರ ಉಳಿಸಲಾಗಿದೆ',
    clear_all: 'ಎಲ್ಲವನ್ನೂ ತೆರವುಗೊಳಿಸಿ',
    clear_search: 'ಹುಡುಕಾಟ ತೆರವುಗೊಳಿಸಿ',
    verified_network: 'ದೃಢೀಕೃತ ಜಾಲ',
    verified_network_desc: 'ನೋಂದಾಯಿತ ಔಷಧಾಲಯಗಳಿಂದ ನೇರವಾಗಿ ವರದಿ ಮಾಡಲಾದ ಸ್ಟಾಕ್.',
    sample_data_badge: 'ಮಾದರಿ ಮಾಹಿತಿ',
    sample_data_notice: 'ಪ್ರದರ್ಶನಕ್ಕಾಗಿ ಮಾದರಿ ಮಾಹಿತಿ. ಸ್ಟಾಕ್ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ಔಷಧಾಲಯಕ್ಕೆ ಕರೆ ಮಾಡಿ.',
    verified_stock_title: 'ದೃಢೀಕೃತ ಔಷಧಾಲಯ ಸ್ಟಾಕ್',
    verified_stock_desc: 'ಔಷಧಾಲಯದ ಸಿಬ್ಬಂದಿಯಿಂದ ನೇರವಾಗಿ ದೃಢೀಕರಿಸಲಾಗಿದೆ.',
    sample_care_network: 'ಪ್ರದರ್ಶನಕ್ಕಾಗಿ ಮಾದರಿ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳ ಪಟ್ಟಿ',
    showing_region: '{region} ತೋರಿಸಲಾಗುತ್ತಿದೆ',
    unsupported_region_title: 'ಈ ಪ್ರದೇಶಕ್ಕೆ ಇನ್ನೂ ಔಷಧಾಲಯದ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ',
    unsupported_region_notice: 'ಮೆಡ್‌ಫೈಂಡ್‌ನಲ್ಲಿ ಈ ಪ್ರದೇಶಕ್ಕೆ ಇನ್ನೂ ಔಷಧಾಲಯದ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.',
    choose_another_area: 'ಬೇರೆ ಪ್ರದೇಶವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    emergency_link: 'ತುರ್ತು ಸಂಪರ್ಕಗಳು',
    no_area_set: 'ಯಾವುದೇ ಪ್ರದೇಶ ಹೊಂದಿಸಿಲ್ಲ',
    filter_type: 'ಔಷಧಿಯ ಪ್ರಕಾರ',
    filter_dose: 'ಪ್ರಮಾಣ / ಶಕ್ತಿ',
    filter_all: 'ಎಲ್ಲವೂ',
    tablet: 'ಮಾತ್ರೆ',
    syrup: 'ಸಿರಪ್',
    inhaler: 'ಇನ್ಹೇಲರ್',
    cream: 'ಕ್ರೀಮ್',
    injection: 'ಇಂಜೆಕ್ಷನ್',
    drops: 'ಹನಿಗಳು',
    no_matching_records: 'ಯಾವುದೇ ಫಲಿತಾಂಶ ಸಿಗಲಿಲ್ಲ',
    no_records_hint: 'ನಿಮ್ಮ ಹುಡುಕಾಟಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗುವ ದಾಖಲೆ ಸಿಗಲಿಲ್ಲ. ಕಾಗುಣಿತ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಸಾಲ್ಟ್ ಹೆಸರಿನಿಂದ ಹುಡುಕಿ.',
    matching_records: 'ಹೊಂದಿಕೆಯಾಗುವ ದಾಖಲೆಗಳು',
    exact_descriptions: 'ನಿಖರ ವಿವರಣೆಗಳು',
    diff_form_notice: 'ವಿಭಿನ್ನ ಔಷಧ ರೂಪ, ಸಮಾನವೆಂದು ಪರಿಗಣಿಸಲಾಗುವುದಿಲ್ಲ',

    // Availability & Actions
    in_stock: 'ಲಭ್ಯವಿದೆ',
    available: 'ಲಭ್ಯವಿದೆ',
    low_stock: 'ಸ್ವಲ್ಪ ಉಳಿದಿದೆ',
    out_of_stock: 'ಖಾಲಿಯಾಗಿದೆ',
    call_to_check: 'ಕರೆ ಮಾಡಿ ವಿಚಾರಿಸಿ',
    unreported: 'ಅಂಗಡಿಗೆ ಕರೆ ಮಾಡಿ',
    call: 'ಕರೆ ಮಾಡಿ',
    call_store: 'ಅಂಗಡಿಗೆ ಕರೆ',
    call_pharmacy: 'ಔಷಧಾಲಯಕ್ಕೆ ಕರೆ ಮಾಡಿ',
    directions: 'ದಾರಿ',
    open_daily: '24 ಗಂಟೆ ಲಭ್ಯ',
    distance_km: 'ಕಿ.ಮೀ ದೂರ',

    // Care & Providers
    care_title: 'ಹತ್ತಿರದ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳು',
    care_subtitle: 'ಪರಿಶೀಲಿಸಿದ ಆಸ್ಪತ್ರೆಗಳು, ಕ್ಲಿನಿಕ್‌ಗಳು, ಆಂಬ್ಯುಲೆನ್ಸ್ ಮತ್ತು ಔಷಧಾಲಯಗಳು',
    hospitals: 'ಆಸ್ಪತ್ರೆಗಳು',
    clinics: 'ಕ್ಲಿನಿಕ್‌ಗಳು',
    ambulances: 'ಆಂಬ್ಯುಲೆನ್ಸ್',
    pharmacies: 'ಔಷಧಾಲಯಗಳು',
    all: 'ಎಲ್ಲವೂ',
    osm_care_title: 'ಓಪನ್‌ಸ್ಟ್ರೀಟ್‌ಮ್ಯಾಪ್‌ನಿಂದ ಹತ್ತಿರದ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳು',
    osm_care_body: 'ನಿಜವಾದ ಆಸ್ಪತ್ರೆಗಳು, ಕ್ಲಿನಿಕ್‌ಗಳು ಮತ್ತು ಔಷಧಾಲಯಗಳು. ಸಮಯ ಮತ್ತು ಲಭ್ಯತೆ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ಕರೆ ಮಾಡಿ.',
    direct_phone_numbers: 'ಆಸ್ಪತ್ರೆಗಳು, ಕ್ಲಿನಿಕ್‌ಗಳು, ಆಂಬ್ಯುಲೆನ್ಸ್ ಮತ್ತು ಔಷಧಾಲಯಗಳ ನೇರ ಫೋನ್ ಸಂಖ್ಯೆಗಳು.',

    // Emergency
    emergency_title: 'ತುರ್ತು ಸಂದರ್ಭದಲ್ಲಿ, ಈಗಲೇ ಕರೆ ಮಾಡಿ.',
    emergency_subtitle: 'ಒಂದು ಸ್ಪರ್ಶದಲ್ಲಿ ನಿಮ್ಮ ಫೋನ್ ಡಯಲರ್ ತೆರೆಯುತ್ತದೆ. ನೀವೇ ಕರೆ ಮಾಡಿ.',
    emergency_numbers_for: 'ತುರ್ತು ಸಂಖ್ಯೆಗಳು:',
    change_country: 'ದೇಶ ಬದಲಾಯಿಸಿ',
    call_local_emergency: 'ನಿಮ್ಮ ಸ್ಥಳೀಯ ತುರ್ತು ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಿ',
    common_emergency_numbers: 'ಸಾಮಾನ್ಯ ಸಂಖ್ಯೆಗಳು: 112, 911, ಮತ್ತು 999. ಮೆಡ್‌ಫೈಂಡ್ ಸಹಾಯ ರವಾನಿಸುವುದಿಲ್ಲ.',
    call_112: 'ತುರ್ತು ಸೇವೆಗೆ ಕರೆ ಮಾಡಿ',
    dial_112: '112 ಗೆ ಕರೆ ಮಾಡಿ',
    call_108: 'ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗೆ ಕರೆ (108)',
    quick_guide: 'ತ್ವರಿತ ತುರ್ತು ಸಹಾಯ',
    quick_guide_desc: 'ಗಂಭೀರ ಅಥವಾ ಜೀವಕ್ಕೆ ಅಪಾಯವಿರುವ ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ತಕ್ಷಣ ತುರ್ತು ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಿ.',
    direct_services: 'ನೇರ ಸೇವೆಗಳು',
    police: 'ಪೊಲೀಸ್',
    police_sub: 'ತುರ್ತು ಕಾನೂನು ಜಾರಿ',
    ambulance_medical: 'ಆಂಬ್ಯುಲೆನ್ಸ್ / ವೈದ್ಯಕೀಯ ತುರ್ತು',
    ambulance_sub: 'ತುರ್ತು ವೈದ್ಯಕೀಯ ಆರೈಕೆ',
    fire_rescue: 'ಅಗ್ನಿಶಾಮಕ ಮತ್ತು ರಕ್ಷಣಾ ಸೇವೆ',
    fire_sub: 'ಅಗ್ನಿ ಮತ್ತು ವಿಪತ್ತು ರಕ್ಷಣೆ',
    dial_prefix: 'ಡಯಲ್ ಮಾಡಿ',
    worldwide_directory: 'ವಿಶ್ವವ್ಯಾಪಿ ತುರ್ತು ಡೈರೆಕ್ಟರಿ',
    worldwide_directory_sub: 'ಎಲ್ಲಾ 87 ದೇಶಗಳ ಕೋಡ್‌ಗಳು, ಪೊಲೀಸ್, ಆಂಬ್ಯುಲೆನ್ಸ್ ಮತ್ತು ಅಗ್ನಿಶಾಮಕ ಸಂಖ್ಯೆಗಳು',
    unverified_region: 'ದೃಢೀಕರಿಸದ ಪ್ರದೇಶ',
    helplines_in: 'ಸಹಾಯವಾಣಿಗಳು:',
    women_helpline: 'ಮಹಿಳಾ ಸಹಾಯವಾಣಿ',
    child_helpline: 'ಮಕ್ಕಳ ಸಹಾಯವಾಣಿ',
    senior_helpline: 'ಹಿರಿಯ ನಾಗರಿಕರ ಸಹಾಯವಾಣಿ',
    disaster_helpline: 'ವಿಪತ್ತು ಸಹಾಯವಾಣಿ',
    mental_health_helpline: 'ಮಾನಸಿಕ ಆರೋಗ್ಯ ಸಹಾಯವಾಣಿ (ಟೆಲಿ-ಮಾನಸ್)',
    official_citations: 'ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಆಕರಗಳು',

    // Settings
    settings: 'ಸೆಟ್ಟಿಂಗ್ಸ್',
    healthcare_tools: 'ಆರೋಗ್ಯ ರಕ್ಷಣೆ ಮತ್ತು ಸಾಧನಗಳು',
    my_medicine_box: 'ನನ್ನ ಔಷಧಿ ಪೆಟ್ಟಿಗೆ',
    medicine_box_desc: 'ಉಳಿಸಿದ ಔಷಧಿಗಳು, ಮುಕ್ತಾಯ ಮತ್ತು ಮರುಪೂರಣ ದಿನಾಂಕಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    emergency_directory_title: 'ತುರ್ತು ಡೈರೆಕ್ಟರಿ',
    emergency_directory_subtitle: '87 ದೇಶಗಳು • ಕರೆ ಕೋಡ್‌ಗಳು ಮತ್ತು ತುರ್ತು ಸಂಖ್ಯೆಗಳು',
    preferences: 'ಆದ್ಯತೆಗಳು',
    language: 'ಆ್ಯಪ್ ಭಾಷೆ',
    language_subtitle: 'English, ಕನ್ನಡ, हिंदी',
    appearance: 'ವಿನ್ಯಾಸ',
    light_theme: 'ಬೆಳಕಿನ ವಿನ್ಯಾಸ',
    dark_theme: 'ಕತ್ತಲೆಯ ವಿನ್ಯಾಸ',
    services_info: 'ಸೇವೆಗಳು ಮತ್ತು ಮಾಹಿತಿ',
    how_location_works: 'ಸ್ಥಳದ ಮಾಹಿತಿ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ',
    how_location_subtitle: 'ಜಿಪಿಎಸ್ ಬಳಕೆ, ಅಂತರ ಲೆಕ್ಕಾಚಾರ ಮತ್ತು ಗೌಪ್ಯತೆ',
    quality_policy: 'ಗುಣಮಟ್ಟ ಮತ್ತು ಸುರಕ್ಷತಾ ನೀತಿ',
    quality_policy_subtitle: 'ಅಧಿಕೃತ ದಾಖಲೆಗಳು ಮತ್ತು ದೃಢೀಕೃತ ಅಂಗಡಿಗಳು',
    data_management: 'ಡೇಟಾ ನಿರ್ವಹಣೆ',
    reset_answers: 'ನನ್ನ ಉತ್ತರಗಳನ್ನು ಮರುಹೊಂದಿಸಿ',
    reset_answers_sub: 'ನಿಮ್ಮ ಬಡ್ಡಿ ಮತ್ತು ಶಿಫಾರಸುಗಳನ್ನು ನವೀಕರಿಸಲು ಪ್ರಶ್ನೆಗಳನ್ನು ಮತ್ತೆ ತೆಗೆದುಕೊಳ್ಳಿ',
    delete_medicine_box: 'ಔಷಧಿ ಪೆಟ್ಟಿಗೆಯ ಡೇಟಾ ಅಳಿಸಿ',
    delete_medicine_box_sub: 'ಉಳಿಸಿದ ಎಲ್ಲಾ ಔಷಧಿಗಳನ್ನು ತೆಗೆದುಹಾಕಿ ಮತ್ತು ಜ್ಞಾಪನೆಗಳನ್ನು ರದ್ದುಗೊಳಿಸಿ',
    close: 'ಮುಚ್ಚಿ',
    switch_theme: 'ಬದಲಾಯಿಸಿ',
    change_language: 'ಬದಲಾಯಿಸಿ',
    understood: 'ತಿಳಿದಿದೆ',
    switch_to_dark: 'ಡಾರ್ಕ್ ಮೋಡ್‌ಗೆ ಬದಲಾಯಿಸಿ',
    switch_to_light: 'ಲೈಟ್ ಮೋಡ್‌ಗೆ ಬದಲಾಯಿಸಿ',
    personal_health_prefs: 'ವೈಯಕ್ತಿಕ ಆರೋಗ್ಯ ಆದ್ಯತೆಗಳು ಮತ್ತು ಉತ್ತರಗಳು',
    tap_to_view_profile: 'ಪ್ರೊಫೈಲ್ ನೋಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ',
    reset_answers_confirm_title: 'ಉತ್ತರಗಳನ್ನು ಮರುಹೊಂದಿಸಬೇಕೆ?',
    reset_answers_confirm_msg: 'ಇದು ನಿಮ್ಮ ಉತ್ತರಗಳನ್ನು ಮರುಹೊಂದಿಸುತ್ತದೆ ಇದರಿಂದ ನೀವು ಪ್ರಶ್ನೆಗಳನ್ನು ಮತ್ತೆ ಉತ್ತರಿಸಬಹುದು.',
    delete_box_confirm_title: 'ಔಷಧಿ ಪೆಟ್ಟಿಗೆಯ ಡೇಟಾ ಅಳಿಸಬೇಕೆ?',
    delete_box_confirm_msg: 'ಇದು ಉಳಿಸಿದ ಎಲ್ಲಾ ಔಷಧಿಗಳನ್ನು ತೆಗೆದುಹಾಕುತ್ತದೆ ಮತ್ತು ಜ್ಞಾಪನೆಗಳನ್ನು ರದ್ದುಗೊಳಿಸುತ್ತದೆ.',
    cancel: 'ರದ್ದುಮಾಡಿ',
    reset: 'ಮರುಹೊಂದಿಸಿ',
    delete_all: 'ಎಲ್ಲವನ್ನೂ ಅಳಿಸಿ',
    search_directory_placeholder: 'ದೇಶ, ಕೋಡ್ (+91) ಅಥವಾ ಸಂಖ್ಯೆಯ ಮೂಲಕ ಹುಡುಕಿ...',
    set_as_my_country: 'ನನ್ನ ದೇಶವಾಗಿ ಹೊಂದಿಸಿ',
    active_emergency_country: 'ಸಕ್ರಿಯ ತುರ್ತು ದೇಶ',
    verified: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ',
    general_service: 'ಸಾಮಾನ್ಯ',
    hide_sources: 'ಮೂಲಗಳನ್ನು ಮರೆಮಾಡಿ ▲',
    official_citations_btn: 'ಅಧಿಕೃತ ಸರ್ಕಾರಿ ದಾಖಲೆಗಳು ({count}) ▼',
    emergency_direct_call_note: 'ಟ್ಯಾಪ್ ಮಾಡಿದರೆ ನಿಮ್ಮ ಡಯಲರ್‌ನಲ್ಲಿ {number} ತೆರೆಯುತ್ತದೆ. MedFind ಸಹಾಯವನ್ನು ಕಳುಹಿಸುವುದಿಲ್ಲ.',
    emergency_direct_tap_note: 'ನಿಮ್ಮ ಡಯಲರ್ ತೆರೆಯಲು ಕೆಳಗಿನ ಯಾವುದೇ ಸೇವೆಯನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿ.',
    see_all_care_nearby: 'ಹತ್ತಿರದ ಎಲ್ಲಾ ಆರೈಕೆ ಕೇಂದ್ರಗಳನ್ನು ನೋಡಿ',

    // Profile & Storage
    profile_screen_title: 'ಪ್ರೊಫೈಲ್ ಮತ್ತು ಸ್ಥಳೀಯ ಡೇಟಾ',
    saved_only_on_phone: 'ಈ ಫೋನ್‌ನಲ್ಲಿ ಮಾತ್ರ ಉಳಿಸಲಾಗಿದೆ',
    who_finding_for: 'ನಾನು ಯಾರಿಗಾಗಿ ಔಷಧಿ ಹುಡುಕುತ್ತಿದ್ದೇನೆ',
    tailors_recommendations: 'ಹುಡುಕಾಟ ಫಲಿತಾಂಶಗಳು ಮತ್ತು ಶಿಫಾರಸುಗಳನ್ನು ಹೊಂದಿಸುತ್ತದೆ',
    age_group_title: 'ವಯೋಮಾನ',
    age_group_sub: 'ವಯಸ್ಸಿಗೆ ಸೂಕ್ತವಾದ ಔಷಧಿಗಳನ್ನು ಸೂಚಿಸಲು ಬಳಸಲಾಗುತ್ತದೆ',
    my_answers: 'ನನ್ನ ಉತ್ತರಗಳು',
    my_answers_sub: 'ಯಾವಾಗ ಬೇಕಾದರೂ ಬದಲಾಯಿಸಿ. ಶಿಫಾರಸುಗಳು ತಕ್ಷಣ ನವೀಕರಣಗೊಳ್ಳುತ್ತವೆ.',
    saved_on_phone: 'ಈ ಫೋನ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ',
    saved_on_phone_sub: 'ಸ್ಥಳೀಯ ಸಾಧನದ ಸಂಗ್ರಹಣೆ ವಿವರಗಳು ಮತ್ತು ನಿರ್ವಹಣೆ',
    saved_medicines_title: 'ಉಳಿಸಿದ ಔಷಧಿಗಳು',
    recent_searches_title: 'ಇತ್ತೀಚಿನ ಹುಡುಕಾಟಗಳು',
    location_preference_title: 'ಸ್ಥಳದ ಆದ್ಯತೆ',
    clear_everything: 'ಎಲ್ಲವನ್ನೂ ಅಳಿಸಿ',
    clear_everything_sub: 'ಪ್ರೊಫೈಲ್, ಔಷಧಿ ಪೆಟ್ಟಿಗೆ, ಹುಡುಕಾಟಗಳನ್ನು ಅಳಿಸುತ್ತದೆ. ವಿನ್ಯಾಸ ಮತ್ತು ಭಾಷೆ ಉಳಿಯುತ್ತದೆ.',
    delete_everything_btn: 'ಎಲ್ಲವನ್ನೂ ಅಳಿಸಿ',
    clear: 'ತೆರವುಗೊಳಿಸಿ',
    sign_out: 'ಸೈನ್ ಔಟ್',
    change_role: 'ಪಾತ್ರವನ್ನು ಬದಲಾಯಿಸಿ',
    change_role_sub: 'ಗ್ರಾಹಕ ಮತ್ತು ಔಷಧಾಲಯ ಸಿಬ್ಬಂದಿ ನಡುವೆ ಬದಲಾಯಿಸಿ',
    change_role_confirm_msg: 'ಇದು ನಿಮ್ಮನ್ನು ಆರಂಭಕ್ಕೆ ಹಿಂತಿರುಗಿಸುತ್ತದೆ.',
    back_to_role_picker: 'ಹಿಂದೆ / ಪಾತ್ರ ಬದಲಾಯಿಸಿ',
    emergency_country_ref_title: 'ತುರ್ತು ಮತ್ತು ದೇಶದ ಉಲ್ಲೇಖಗಳು',
    emergency_country_ref_sub: 'ವಿಶ್ವಾದ್ಯಂತ ತುರ್ತು ಸಹಾಯವಾಣಿಗಳು ಮತ್ತು ಡಯಲಿಂಗ್ ಕೋಡ್‌ಗಳ ಡೈರೆಕ್ಟರಿ',
    no_tracking_sub: 'ಯಾವುದೇ ಟ್ರ್ಯಾಕಿಂಗ್ ಇಲ್ಲ: ಮೆಡ್‌ಫೈಂಡ್ ನೀವು ವೀಕ್ಷಿಸಿದ ಔಷಧಿ ಅಥವಾ ಭೇಟಿ ನೀಡಿದ ಸ್ಥಳಗಳನ್ನು ಎಂದಿಗೂ ದಾಖಲಿಸುವುದಿಲ್ಲ.',
    osm_privacy_notice: 'ಓಪನ್‌ಸ್ಟ್ರೀಟ್‌ಮ್ಯಾಪ್ ಸರ್ವರ್‌ಗಳನ್ನು ಬಳಸಿ ನಿಮ್ಮ ಅಂದಾಜು ಸ್ಥಳದೊಂದಿಗೆ ಹತ್ತಿರದ ಸ್ಥಳಗಳನ್ನು ಹುಡುಕಲಾಗುತ್ತದೆ.',
    emergency_demo_disclaimer: 'ಡೆಮೊ ಆ್ಯಪ್: ತುರ್ತು ಸಂಖ್ಯೆಗಳು ಅಪೂರ್ಣವಾಗಿರಬಹುದು ಅಥವಾ ಹಳೆಯದಾಗಿರಬಹುದು. ನೈಜ ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ, ನಿಮ್ಮ ಸ್ಥಳೀಯ ತುರ್ತು ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಿ.',
    medicines_count: '{current}/{max} ಔಷಧಿಗಳು',
    empty_box_title: 'ನಿಮ್ಮ ಔಷಧಿ ಪೆಟ್ಟಿಗೆ ಖಾಲಿಯಾಗಿದೆ',
    empty_box_sub: 'ಮುಕ್ತಾಯ ದಿನಾಂಕಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ ಮತ್ತು ಈ ಫೋನ್‌ನಲ್ಲಿ ರೀಫಿಲ್ ಜ್ಞಾಪನೆಗಳನ್ನು ಪಡೆಯಿರಿ.',
    add_medicine_btn: 'ಔಷಧಿ ಸೇರಿಸಿ',
    box_full_banner: 'ನಿಮ್ಮ ಔಷಧಿ ಪೆಟ್ಟಿಗೆ ಭರ್ತಿಯಾಗಿದೆ ({count} ಐಟಂಗಳು)',
    saved_only_phone_never_shared: 'ಈ ಫೋನ್‌ನಲ್ಲಿ ಮಾತ್ರ ಉಳಿಸಲಾಗಿದೆ. ಎಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳುವುದಿಲ್ಲ.',
    edit_medicine: 'ಔಷಧಿ ಬದಲಾಯಿಸಿ',
    add_medicine: 'ಔಷಧಿ ಸೇರಿಸಿ',
    save_changes: 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
    add_to_box: 'ಪೆಟ್ಟಿಗೆಗೆ ಸೇರಿಸಿ',
    remind_me: 'ನನಗೆ ನೆನಪಿಸಿ',
    remind_sub: 'ಮುಕ್ತಾಯಕ್ಕೆ ಮುನ್ನ ಮತ್ತು ರೀಫಿಲ್ ದಿನದಂದು ಸೂಚನೆ ಪಡೆಯಿರಿ',

    // Recommendations & Greetings
    welcome: 'ಸ್ವಾಗತ',
    hi_prefix: 'ನಮಸ್ಕಾರ',
    why_seeing_this: 'ಇದನ್ನು ಏಕೆ ತೋರಿಸಲಾಗುತ್ತಿದೆ?',
    'Finish setting up (takes 1 minute)': 'ಸೆಟಪ್ ಪೂರ್ಣಗೊಳಿಸಿ (1 ನಿಮಿಷ)',
    'Personalize your buddy, notifications, and recommendations': 'ನಿಮ್ಮ ಬಡ್ಡಿ, ಅಧಿಸೂಚನೆಗಳು ಮತ್ತು ಶಿಫಾರಸುಗಳನ್ನು ವೈಯಕ್ತೀಕರಿಸಿ',
    'Check availability near you': 'ನಿಮ್ಮ ಹತ್ತಿರ ಲಭ್ಯತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ',
    'Search nearby verified pharmacies before making an unnecessary trip': 'ಅನಗತ್ಯ ಪ್ರಯಾಣ ತಪ್ಪಿಸಲು ಹತ್ತಿರದ ಪರಿಶೀಲಿಸಿದ ಔಷಧಾಲಯಗಳನ್ನು ಹುಡುಕಿ',
    'Find a pediatric clinic': 'ಮಕ್ಕಳ ಕ್ಲಿನಿಕ್ ಹುಡುಕಿ',
    'View verified primary healthcare clinics and pediatric consultation centers nearby': 'ಹತ್ತಿರದ ಪರಿಶೀಲಿಸಿದ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳು ಮತ್ತು ಮಕ್ಕಳ ಚಿಕಿತ್ಸಾ ಕೇಂದ್ರಗಳನ್ನು ನೋಡಿ',
    'Child dosage safety notice': 'ಮಕ್ಕಳ ಔಷಧ ಪ್ರಮಾಣ ಸುರಕ್ಷತಾ ಸೂಚನೆ',
    'Always verify liquid medicine concentrations and weight-based doses with a doctor': 'ದ್ರವರೂಪದ ಔಷಧಿ ಸಾಂದ್ರತೆ ಮತ್ತು ತೂಕ-ಆಧಾರಿತ ಪ್ರಮಾಣವನ್ನು ಯಾವಾಗಲೂ ವೈದ್ಯರೊಂದಿಗೆ ಖಚಿತಪಡಿಸಿ',
    'Emergency hospital care': 'ತುರ್ತು ಆಸ್ಪತ್ರೆ ಆರೈಕೆ',
    'Locate emergency-ready hospitals with 24/7 casualty departments nearby': '24/7 ತುರ್ತು ವಿಭಾಗ ಹೊಂದಿರುವ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳನ್ನು ಪತ್ತೆ ಮಾಡಿ',
    'Elder care & home safety': 'ಹಿರಿಯರ ಆರೈಕೆ ಮತ್ತು ಮನೆ ಸುರಕ್ಷತೆ',
    'Keep emergency contacts pinned and check that daily medicines are accessible': 'ತುರ್ತು ಸಂಪರ್ಕಗಳನ್ನು ಸಿದ್ಧವಾಗಿಡಿ ಮತ್ತು ದೈನಂದಿನ ಔಷಧಿಗಳು ಸುಲಭವಾಗಿ ಸಿಗುವಂತೆ ನೋಡಿಕೊಳ್ಳಿ',
    'First-aid supplies': 'ಪ್ರಥಮ ಚಿಕಿತ್ಸಾ ಸರಬರಾಜುಗಳು',
    'Browse essential antiseptics, bandages, and basic wound care items nearby': 'ಹತ್ತಿರದ ಅಗತ್ಯ ನಂಜುನಿರೋಧಕಗಳು, ಬ್ಯಾಂಡೇಜ್‌ಗಳು ಮತ್ತು ಗಾಯದ ಆರೈಕೆ ವಸ್ತುಗಳನ್ನು ಹುಡುಕಿ',
    'Explore verified care facilities': 'ಪರಿಶೀಲಿಸಿದ ಆರೈಕೆ ಕೇಂದ್ರಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
    'Browse hospitals, clinics, and emergency services in your area': 'ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಆಸ್ಪತ್ರೆಗಳು, ಕ್ಲಿನಿಕ್‌ಗಳು ಮತ್ತು ತುರ್ತು ಸೇವೆಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ',
    'Search essential medicines': 'ಅಗತ್ಯ ಔಷಧಿಗಳನ್ನು ಹುಡುಕಿ',
    'Locate nearby pharmacies and view last-verified stock reports': 'ಹತ್ತಿರದ ಔಷಧಾಲಯಗಳನ್ನು ಪತ್ತೆ ಮಾಡಿ ಮತ್ತು ಕೊನೆಯದಾಗಿ ದೃಢೀಕರಿಸಿದ ಸ್ಟಾಕ್ ವರದಿಗಳನ್ನು ನೋಡಿ',
    'Set refill & expiry reminders': 'ರೀಫಿಲ್ ಮತ್ತು ಮುಕ್ತಾಯ ಜ್ಞಾಪನೆಗಳನ್ನು ಹೊಂದಿಸಿ',
    'Never run out of essentials': 'ಅಗತ್ಯ ಔಷಧಿಗಳು ಎಂದಿಗೂ ಖಾಲಿಯಾಗದಂತೆ ನೋಡಿಕೊಳ್ಳಿ',
    'Because you skipped initial setup': 'ನೀವು ಆರಂಭಿಕ ಸೆಟಪ್ ಅನ್ನು ಬಿಟ್ಟುಬಿಟ್ಟಿದ್ದೀರಿ',
    "Because you said you've struggled to find a medicine in stock": 'ಸ್ಟಾಕ್ ಹುಡುಕಲು ಕಷ್ಟವಾಯಿತು ಎಂದು ನೀವು ಹೇಳಿದ್ದೀರಿ',
    'Because you have a child in your household profile': 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಮಗು ಇದೆ',
    'Because you have a senior in your household profile': 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಹಿರಿಯ ನಾಗರಿಕರಿದ್ದಾರೆ',
    "Because you don't have a basic first-aid kit ready": 'ನಿಮ್ಮ ಬಳಿ ಪ್ರಥಮ ಚಿಕಿತ್ಸಾ ಕಿಟ್ ಸಿದ್ಧವಾಗಿಲ್ಲ',
    "Because you said you'd like refill reminders": 'ನಿಮಗೆ ರೀಫಿಲ್ ಜ್ಞಾಪನೆಗಳು ಬೇಕು ಎಂದು ನೀವು ತಿಳಿಸಿದ್ದೀರಿ',
    'Personalized recommendations based on your preferences': 'ನಿಮ್ಮ ಆದ್ಯತೆಗಳಿಗೆ ಅನುಗುಣವಾಗಿ ವೈಯಕ್ತೀಕರಿಸಿದ ಶಿಫಾರಸುಗಳು',

    // Profile Chip & Toggle Options
    'Me': 'ನಾನು',
    'Parent': 'ಪೋಷಕರು',
    'Child': 'ಮಗು',
    'Someone else': 'ಇನ್ನೊಬ್ಬರು',
    'Under 5': '5 ವರ್ಷದ ಒಳಗೆ',
    '5 to 12': '5 ರಿಂದ 12',
    '13 to 17': '13 ರಿಂದ 17',
    '18 to 59': '18 ರಿಂದ 59',
    '60 and above': '60 ಮತ್ತು ಮೇಲ್ಪಟ್ಟ',
    'Male': 'ಪುರುಷ',
    'Female': 'ಮಹಿಳೆ',
    'Other': 'ಇತರೆ',
    'Prefer not to say': 'ಹೇಳಲು ಇಷ್ಟವಿಲ್ಲ',
    'Penicillin': 'ಪೆನಿಸಿಲಿನ್',
    'Aspirin': 'ಆಸ್ಪಿರಿನ್',
    'Sulfa drugs': 'ಸಲ್ಫಾ ಔಷಧಗಳು',
    'Latex': 'ಲ್ಯಾಟೆಕ್ಸ್',
    'Peanuts': 'ಕಡಲೆಕಾಯಿ',
    'Shellfish': 'ಚಿಪ್ಪುಮೀನು',
    'Dairy': 'ಡೈರಿ / ಹಾಲು',
    'Gluten': 'ಗ್ಲುಟನ್',
    'None': 'ಯಾವುದೂ ಇಲ್ಲ',
    'I keep a medicine box at home': 'ನನ್ನ ಮನೆಯಲ್ಲಿ ಔಷಧಿ ಪೆಟ್ಟಿಗೆ ಇಟ್ಟುಕೊಂಡಿದ್ದೇನೆ',
    "I've struggled to find a medicine in stock": 'ಔಷಧಿ ಸ್ಟಾಕ್ ಹುಡುಕಲು ನನಗೆ ಕಷ್ಟವಾಗಿದೆ',
    'I buy medicines for my family': 'ನನ್ನ ಕುಟುಂಬಕ್ಕಾಗಿ ನಾನು ಔಷಧಿಗಳನ್ನು ಖರೀದಿಸುತ್ತೇನೆ',
    "I'd like refill reminders": 'ನನಗೆ ರೀಫಿಲ್ ಜ್ಞಾಪನೆಗಳು ಬೇಕು',
    'I compare prices before buying': 'ಖರೀದಿಸುವ ಮೊದಲು ನಾನು ಬೆಲೆಗಳನ್ನು ಹೋಲಿಸುತ್ತೇನೆ',

    // Staff Onboarding & Portal
    staff_badge_title: 'ಔಷಧಾಲಯ ಸಿಬ್ಬಂದಿ ಮೋಡ್',
    staff_badge_info_msg: 'ಈ ಚಿಹ್ನೆಯು ನೀವು ಔಷಧಾಲಯ ಸಿಬ್ಬಂದಿ ಮೋಡ್‌ನಲ್ಲಿರುವುದನ್ನು ಸೂಚಿಸುತ್ತದೆ. ಔಷಧಿ ಲಭ್ಯತೆಯನ್ನು ನವೀಕರಿಸಲು ಪರವಾನಗಿ ಪಡೆದ ಔಷಧಾಲಯ ಸಿಬ್ಬಂದಿಗೆ ಮಾತ್ರ ಇದನ್ನು ಮೀಸಲಿಡಲಾಗಿದೆ.\n\nನೀವು ಗ್ರಾಹಕರಾಗಿದ್ದರೆ, ಮೇಲಿನ ಎಡಭಾಗದಲ್ಲಿರುವ "< ಹಿಂದೆ / ಪಾತ್ರ ಬದಲಾಯಿಸಿ" ಟ್ಯಾಪ್ ಮಾಡಿ.',
    authorized_personnel_only: 'ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿಗೆ ಮಾತ್ರ',
    store_partner_onboarding: 'ಔಷಧಾಲಯ ಪಾಲುದಾರರ ನೋಂದಣಿ',
    step_store: 'ಅಂಗಡಿ',
    step_staff_id: 'ಸಿಬ್ಬಂದಿ ಐಡಿ',
    step_attest: 'ದೃಢೀಕರಣ',
    select_operating_pharmacy: 'ಕಾರ್ಯನಿರ್ವಹಿಸುವ ಔಷಧಾಲಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    select_pharmacy_sub: 'ನೀವು ಇಂದು ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿರುವ ಪರಿಶೀಲಿಸಿದ ಔಷಧಾಲಯ ಅಥವಾ ಆಸ್ಪತ್ರೆ ಕೌಂಟರ್ ಅನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    verified_pilot_partner: 'ಪರಿಶೀಲಿಸಿದ ಪ್ರಾಯೋಗಿಕ ಪಾಲುದಾರ',
    continue_to_pharmacist_id: 'ಫಾರ್ಮಸಿಸ್ಟ್ ಐಡಿಗೆ ಮುಂದುವರಿಯಿರಿ',
    pharmacist_identification: 'ಫಾರ್ಮಸಿಸ್ಟ್ ಗುರುತಿಸುವಿಕೆ',
    pharmacist_id_sub: 'ನಿಮ್ಮ ಪರವಾನಗಿ ಪಡೆದ ಫಾರ್ಮಸಿಸ್ಟ್ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ. ಪ್ರತಿಯೊಂದು ಸ್ಟಾಕ್ ನವೀಕರಣವು ನಿಮ್ಮ ಗುರುತಿನೊಂದಿಗೆ ದಾಖಲಾಗುತ್ತದೆ.',
    autofill_demo_credentials: 'ಡೆಮೊ ವಿವರಗಳನ್ನು ಸ್ವಯಂ ಭರ್ತಿ ಮಾಡಿ',
    pharmacist_name_label: 'ನೋಂದಾಯಿತ ಫಾರ್ಮಸಿಸ್ಟ್ ಹೆಸರು *',
    license_number_label: 'ಕೆಎಸ್‌ಪಿಸಿ ನೋಂದಣಿ / ಔಷಧ ಚಿಲ್ಲರೆ ಪರವಾನಗಿ ಸಂಖ್ಯೆ *',
    counter_station_label: 'ಕೌಂಟರ್ / ವಿತರಣಾ ಕೇಂದ್ರ *',
    back_btn: 'ಹಿಂದೆ',
    continue_to_attest: 'ದೃಢೀಕರಣಕ್ಕೆ ಮುಂದುವರಿಯಿರಿ',
    regulatory_attestation_title: 'ಕ್ಲಿನಿಕಲ್ ಮತ್ತು ನಿಯಂತ್ರಕ ದೃಢೀಕರಣ',
    regulatory_attestation_sub: 'ಕರ್ನಾಟಕ ಔಷಧ ನಿಯಮಗಳು ಮತ್ತು ಮೆಡ್‌ಫೈಂಡ್ ಪಾರದರ್ಶಕತೆ ಮಾನದಂಡಗಳ ಅನುಸರಣೆಯನ್ನು ಪರಿಶೀಲಿಸಿ ಪ್ರಮಾಣೀಕರಿಸಿ.',
    shelf_verification_title: 'ಭೌತಿಕ ಕಪಾಟು ಪರಿಶೀಲನೆ',
    shelf_verification_desc: 'ಸ್ಟಾಕ್ ನವೀಕರಣಗಳು ಚಿಲ್ಲರೆ ಕಪಾಟಿನಲ್ಲಿ ಭೌತಿಕವಾಗಿ ಪರಿಶೀಲಿಸಿದ ಸ್ಟಾಕ್ ಅನ್ನು ಪ್ರತಿನಿಧಿಸುತ್ತವೆ ಎಂದು ನಾನು ಖಚಿತಪಡಿಸುತ್ತೇನೆ.',
    dpco_price_compliance: 'ಡಿಪಿಸಿಒ ಬೆಲೆ ಅನುಸರಣೆ',
    dpco_price_compliance_sub: 'ವಿತರಿಸಲಾದ ಅಗತ್ಯ ಔಷಧಿಗಳು ಎನ್‌ಪಿಪಿಎ ಗರಿಷ್ಠ ಬೆಲೆಗಳನ್ನು ಯಾವುದೇ ಹೆಚ್ಚುವರಿ ಶುಲ್ಕವಿಲ್ಲದೆ ಕಟ್ಟುನಿಟ್ಟಾಗಿ ಪಾಲಿಸುತ್ತವೆ.',
    traceable_audit_trail: 'ಪತ್ತೆಹಚ್ಚಬಹುದಾದ ಲೆಕ್ಕಪರಿಶೋಧನಾ ದಾಖಲೆ',
    traceable_audit_trail_sub: 'ನವೀಕರಣಗಳು ನಿಯಂತ್ರಕ ತಪಾಸಣೆಗಾಗಿ ನನ್ನ ಆಪರೇಟರ್ ಗುರುತು ಮತ್ತು ಸಮಯದ ಮುದ್ರೆಯನ್ನು ದಾಖಲಿಸುತ್ತವೆ.',
    attest_checkbox_label: 'ಔಷಧಿ ಮತ್ತು ಸೌಂದರ್ಯವರ್ಧಕ ನಿಯಮಗಳ ನಿಯಮ 65 ರ ಅಡಿಯಲ್ಲಿ ನಾನು ಅಧಿಕೃತ ಔಷಧಾಲಯ ಸಿಬ್ಬಂದಿ ಎಂದು ದೃಢೀಕರಿಸುತ್ತೇನೆ.',
    onboarding_assignment: 'ಆನ್‌ಬೋರ್ಡಿಂಗ್ ನಿಯೋಜನೆ',
    complete_verification_btn: 'ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಳಿಸಿ ಮತ್ತು ಪೋರ್ಟಲ್ ಪ್ರವೇಶಿಸಿ',
    staff_portal: 'ಸಿಬ್ಬಂದಿ ಪೋರ್ಟಲ್',
    hospital_portal: 'ಆಸ್ಪತ್ರೆ ಪೋರ್ಟಲ್',
    clinic_portal: 'ಕ್ಲಿನಿಕ್ ಪೋರ್ಟಲ್',
    pharmacy_portal: 'ಫಾರ್ಮಸಿ ಪೋರ್ಟಲ್',
    hospital_tab: 'ಆಸ್ಪತ್ರೆ',
    clinic_tab: 'ಕ್ಲಿನಿಕ್',
    pharmacy_tab: 'ಫಾರ್ಮಸಿ',
    hospital_settings_title: 'ಆಸ್ಪತ್ರೆ ಸೆಟ್ಟಿಂಗ್ಸ್ ಮತ್ತು ನಿಯಮಾವಳಿಗಳು',
    clinic_settings_title: 'ಕ್ಲಿನಿಕ್ ಸೆಟ್ಟಿಂಗ್ಸ್ ಮತ್ತು ನಿಯಮಾವಳಿಗಳು',
    pharmacy_settings_title: 'ಫಾರ್ಮಸಿ ಸೆಟ್ಟಿಂಗ್ಸ್ ಮತ್ತು ನಿಯಮಾವಳಿಗಳು',
    tier_hospital: 'ಆಸ್ಪತ್ರೆ (ಹಂತ 1)',
    tier_clinic: 'ಕ್ಲಿನಿಕ್ (ಹಂತ 2)',
    tier_pharmacy: 'ಫಾರ್ಮಸಿ (ಹಂತ 3)',
    facility_type_label: 'ಸಂಸ್ಥೆಯ ವರ್ಗ',
    hospital_category_label: 'ಆಸ್ಪತ್ರೆಯ ವರ್ಗ',
    hospital_category_desc: 'ಕೆಪಿಎಂಇ ಅನುಮೋದಿತ ಕಾರ್ಯಾಚರಣಾ ವರ್ಗೀಕರಣ',
    category_level_1: 'ಲೆವೆಲ್ 1A/1B ಮೂಲಭೂತ ಆಸ್ಪತ್ರೆ',
    category_level_2: 'ಲೆವೆಲ್ 2 ಮಲ್ಟಿ-ಸ್ಪೆಷಾಲಿಟಿ ಆಸ್ಪತ್ರೆ',
    category_level_3: 'ಲೆವೆಲ್ 3 ಸೂಪರ್-ಸ್ಪೆಷಾಲಿಟಿ ಆಸ್ಪತ್ರೆ',
    category_level_4: 'ಲೆವೆಲ್ 4 ಬೋಧನಾ / ತೃತೀಯ ಆಸ್ಪತ್ರೆ',
    bed_capacity_label: 'ಅನುಮೋದಿತ ಒಳರೋಗಿ ಹಾಸಿಗೆಗಳ ಸಾಮರ್ಥ್ಯ',
    operation_theatres_label: 'ಆಪರೇಷನ್ ಥಿಯೇಟರ್‌ಗಳು (OT)',
    icu_beds_label: 'ತೀವ್ರ ನಿಗಾ ಘಟಕಗಳು (ICU)',
    emergency_beds_label: 'ತುರ್ತು ಹಾಸಿಗೆಗಳು',
    bio_waste_id_label: 'ಜೈವಿಕ ವೈದ್ಯಕೀಯ ತ್ಯಾಜ್ಯ ಬಳಕೆದಾರ ಐಡಿ (KSPCB)',
    nodal_officer_name_label: 'ನೋಡಲ್ ಕುಂದುಕೊರತೆ ನಿವಾರಣಾ ಅಧಿಕಾರಿ',
    nodal_officer_contact_label: 'ಕುಂದುಕೊರತೆ ಅಧಿಕಾರಿಯ ಸಂಪರ್ಕ ಸಂಖ್ಯೆ',
    medical_superintendent_label: 'ವೈದ್ಯಕೀಯ ಅಧೀಕ್ಷಕರು / ನಿರ್ವಾಹಕರು',
    clinic_type_label: 'ಕ್ಲಿನಿಕ್ ಪ್ರಕಾರ',
    clinic_type_solo: 'ಏಕವ್ಯಕ್ತಿ ವೈದ್ಯರ ಸಮಾಲೋಚನೆ',
    clinic_type_multi: 'ಮಲ್ಟಿ-ಸ್ಪೆಷಾಲಿಟಿ ಪಾಲಿಕ್ರಿನಿಕ್',
    clinic_type_daycare: 'ಡೇಕೇರ್ ಸೆಂಟರ್',
    system_of_medicine_label: 'ಔಷಧ ಪದ್ಧತಿ',
    medicine_allopathy: 'ಅಲೋಪತಿ (ಆಧುನಿಕ ವೈದ್ಯಕೀಯ)',
    medicine_ayurveda: 'ಆಯುರ್ವೇದ',
    medicine_homeopathy: 'ಹೋಮಿಯೋಪತಿ',
    medicine_unani: 'ಯುನಾನಿ',
    diagnostic_support_label: 'ಆಂತರಿಕ ರೋಗನಿರ್ಣಯ ಸೌಲಭ್ಯ (ಎಕ್ಸ್-ರೇ / ಲ್ಯಾಬ್)',
    diagnostic_yes: 'ಹೌದು - ಸ್ಥಳದಲ್ಲೇ ಆಂತರಿಕ ಸೌಲಭ್ಯವಿದೆ',
    diagnostic_no: 'ಇಲ್ಲ - ಬಾಹ್ಯ ಲ್ಯಾಬ್‌ಗಳು ಮಾತ್ರ',
    primary_doctor_name_label: 'ಮುಖ್ಯ ಉಸ್ತುವಾರಿ ವೈದ್ಯರ ಹೆಸರು',
    primary_doctor_degree_label: 'ವೈದ್ಯರ ಅರ್ಹತೆ ಮತ್ತು ಪದವಿ (ಉದಾ. MBBS, MD)',
    state_medical_council_reg: 'ರಾಜ್ಯ ವೈದ್ಯಕೀಯ ಮಂಡಳಿ ನೋಂದಣಿ ಸಂಖ್ಯೆ (KMC)',
    drug_license_form_20: 'ಔಷಧ ಪರವಾನಗಿ ಫಾರ್ಮ್ 20 (ಚಿಲ್ಲರೆ)',
    drug_license_form_21: 'ಔಷಧ ಪರವಾನಗಿ ಫಾರ್ಮ್ 21 (ನಿಗದಿತ)',
    pharmacist_council_reg: 'ಫಾರ್ಮಸಿ ಕೌನ್ಸಿಲ್ ನೋಂದಣಿ ಸಂಖ್ಯೆ (KSPC)',
    cold_chain_status_label: 'ಕೋಲ್ಡ್ ಚೈನ್ ತಾಪಮಾನ ಮೇಲ್ವಿಚಾರಣೆ',
    cold_chain_automated: 'ಸ್ವಯಂಚಾಲಿತ 24/7 ಡಿಜಿಟಲ್ ಡಾಟಾ ಲಾಗರ್ (2-8°C)',
    cold_chain_manual: 'ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ ಹಸ್ತಚಾಲಿತ ತಾಪಮಾನ ರಿಜಿಸ್ಟರ್',
    cold_chain_standard: 'ಸಾಮಾನ್ಯ ಶೈತ್ಯಾಗಾರ',
    mandatory_document_uploads: 'ಕಡ್ಡಾಯ ದಾಖಲೆಗಳ ಅಪ್‌ಲೋಡ್',
    upload_doc_btn: 'ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ (PDF/ಚಿತ್ರ)',
    uploaded_status: 'ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿದೆ ಮತ್ತು ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    required_status: 'ಕಡ್ಡಾಯವಾಗಿದೆ',
    quick_fill_compliance: 'ಎಲ್ಲಾ ವಿವರಗಳು ಮತ್ತು ದಾಖಲೆಗಳನ್ನು ತ್ವರಿತವಾಗಿ ಭರ್ತಿ ಮಾಡಿ',
    quick_fill_compliance_sub: 'ಪ್ರದರ್ಶನಕ್ಕಾಗಿ ಅಧಿಕೃತ ಕರ್ನಾಟಕ ನಿಯಂತ್ರಕ ಡೇಟಾವನ್ನು ಮೊದಲೇ ಭರ್ತಿ ಮಾಡುತ್ತದೆ',
    kpme_attestation_statement: 'ಕರ್ನಾಟಕ ಖಾಸಗಿ ವೈದ್ಯಕೀಯ ಸಂಸ್ಥೆಗಳ (ಕೆಪಿಎಂಇ) ಕಾಯಿದೆ ಮತ್ತು ಜೈವಿಕ ವೈದ್ಯಕೀಯ ತ್ಯಾಜ್ಯ ನಿರ್ವಹಣಾ ನಿಯಮಗಳ ಅಡಿಯಲ್ಲಿ ಎಲ್ಲಾ ಸೌಲಭ್ಯ ವಿವರಗಳು ಮತ್ತು ಪರವಾನಗಿಗಳು ಮಾನ್ಯವಾಗಿವೆ ಎಂದು ನಾನು ಈ ಮೂಲಕ ಘೋಷಿಸುತ್ತೇನೆ.',
    drugs_act_attestation_statement: 'ಔಷಧಿ ಮತ್ತು ಸೌಂದರ್ಯವರ್ಧಕ ಕಾಯ್ದೆ 1940 ರ ಅಡಿಯಲ್ಲಿ ಫಾರ್ಮ್ 20/21 ಪರವಾನಗಿಗಳು ಸಕ್ರಿಯವಾಗಿವೆ ಮತ್ತು ವಿತರಣಾ ಸಮಯದಲ್ಲಿ ನೋಂದಾಯಿತ ಫಾರ್ಮಸಿಸ್ಟ್ ಹಾಜರಿದ್ದಾರೆ ಎಂದು ನಾನು ಘೋಷಿಸುತ್ತೇನೆ.',
    verified_badge: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ',
    store_settings_tab: 'ಅಂಗಡಿ',
    search_pharmacy_inventory_placeholder: 'ಔಷಧಿ ಬ್ರ್ಯಾಂಡ್, ಜೆನೆರಿಕ್ ಹೆಸರನ್ನು ಹುಡುಕಿ...',
    all_items: 'ಎಲ್ಲಾ ಐಟಂಗಳು',
    on_shelf_stock_header: 'ಕಪಾಟಿನಲ್ಲಿರುವ ಔಷಧಾಲಯದ ಸ್ಟಾಕ್',
    updated_prefix: 'ನವೀಕರಿಸಲಾಗಿದೆ',
    no_reports_yet: 'ಇನ್ನೂ ವರದಿಗಳಿಲ್ಲ',
    store_settings_title: 'ಅಂಗಡಿ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    dispensary_staff_station: 'ಔಷಧಾಲಯ ಮತ್ತು ಸಿಬ್ಬಂದಿ ಕೇಂದ್ರ',
    session_stock_updates_notice: 'ಈ ಸೆಷನ್‌ಗಾಗಿ ಸ್ಟಾಕ್ ನವೀಕರಣಗಳನ್ನು ಇಲ್ಲಿ ಇರಿಸಲಾಗಿದೆ.',
    current_store_credentials: 'ಪ್ರಸ್ತುತ ಅಂಗಡಿ ಮತ್ತು ವಿವರಗಳು',
    registered_pharmacist_label: 'ನೋಂದಾಯಿತ ಫಾರ್ಮಸಿಸ್ಟ್',
    registration_license_label: 'ನೋಂದಣಿ / ಪರವಾನಗಿ ಸಂಖ್ಯೆ',
    dispensing_station_label: 'ವಿತರಣಾ ಕೇಂದ್ರ',
    appearance_and_lang: 'ಗೋಚರತೆ ಮತ್ತು ಭಾಷೆ',
    theme_label: 'ಥೀಮ್',
    light_mode: 'ಲೈಟ್ ಮೋಡ್',
    dark_mode: 'ಡಾರ್ಕ್ ಮೋಡ್',
    store_photos_heading: 'ಅಂಗಡಿಯ ಫೋಟೋಗಳು',
    add_store_photo: 'ಅಂಗಡಿಯ ಫೋಟೋ ಸೇರಿಸಿ',
    replace_photo: 'ಫೋಟೋ ಬದಲಾಯಿಸಿ',
    remove_photo: 'ತೆಗೆದುಹಾಕಿ',
    photo_upload_web_hint: 'ನಿಮ್ಮ ಫೈಲ್‌ಗಳಿಂದ ಆಯ್ಕೆ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ',
    photo_upload_native_hint: 'ಕ್ಯಾಮೆರಾ ಅಥವಾ ಗ್ಯಾಲರಿ ತೆರೆಯಲು ಟ್ಯಾಪ್ ಮಾಡಿ',
    store_location_heading: 'ಅಂಗಡಿಯ ಸ್ಥಳ',
    share_live_location: 'ಲೈವ್ ಸ್ಥಳವನ್ನು ಹಂಚಿಕೊಳ್ಳಿ',
    update_live_location: 'ಲೈವ್ ಸ್ಥಳವನ್ನು ನವೀಕರಿಸಿ',
    getting_location: 'ಸ್ಥಳವನ್ನು ಪಡೆಯಲಾಗುತ್ತಿದೆ…',
    location_shared_success: 'ಸ್ಥಳವನ್ನು ಹಂಚಿಕೊಳ್ಳಲಾಗಿದೆ!',
    location_share_sub: 'ಗ್ರಾಹಕರು ನಿಮ್ಮ ಕೌಂಟರ್‌ಗೆ ನೇರವಾಗಿ ತಲುಪಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ',
    session_and_role: 'ಸೆಷನ್ ಮತ್ತು ಪಾತ್ರ',
    sign_out_of_pharmacy: 'ಔಷಧಾಲಯದಿಂದ ಸೈನ್ ಔಟ್ ಮಾಡಿ',
    clears_credentials_sub: 'ಈ ಸಾಧನದಲ್ಲಿರುವ ಪರಿಶೀಲಿಸಿದ ವಿವರಗಳನ್ನು ತೆರವುಗೊಳಿಸುತ್ತದೆ',
    switch_to_customer: 'ಗ್ರಾಹಕರ ವೀಕ್ಷಣೆಗೆ ಬದಲಾಯಿಸಿ',
    switch_to_customer_sub: 'ರೋಗಿಯಾಗಿ ಔಷಧಿಗಳನ್ನು ಹುಡುಕಿ ಮತ್ತು ಹತ್ತಿರದ ಔಷಧಾಲಯಗಳನ್ನು ನೋಡಿ',
    pinpoint_on_map: 'ನಕ್ಷೆಯಲ್ಲಿ ಗುರುತಿಸಿ',
    pinpoint_on_live_map: 'ಲೈವ್ ನಕ್ಷೆಯಲ್ಲಿ ಗುರುತಿಸಿ',
    pinpoint_map_subtitle: 'ನಿಖರವಾದ ಸ್ಥಳವನ್ನು ಗುರುತಿಸಲು ಮಾರ್ಕರ್ ಎಳೆಯಿರಿ ಅಥವಾ ನಕ್ಷೆಯಲ್ಲಿ ಟ್ಯಾಪ್ ಮಾಡಿ.',
    pinpoint_confirm_btn: 'ಈ ಸ್ಥಳವನ್ನು ದೃಢೀಕರಿಸಿ',
    pinpoint_hospital_location: 'ಆಸ್ಪತ್ರೆಯ ಪ್ರವೇಶದ್ವಾರ ಗುರುತಿಸಿ',
    pinpoint_clinic_location: 'ಕ್ಲಿನಿಕ್ ಸ್ಥಳ ಗುರುತಿಸಿ',
    pinpoint_pharmacy_location: 'ಔಷಧಾಲಯ ಕೌಂಟರ್ ಗುರುತಿಸಿ',
    recenter_gps: 'ಜಿಪಿಎಸ್ ಮರುಕೇಂದ್ರೀಕರಿಸಿ',
    selected_live_location: 'ಆಯ್ದ ಲೈವ್ ಸ್ಥಳ',
    searching_location: 'ವಿಳಾಸ ಹುಡುಕಲಾಗುತ್ತಿದೆ…',
    back_change_role: 'ಹಿಂದಕ್ಕೆ / ಪಾತ್ರ ಬದಲಾಯಿಸಿ',
    onboarding_badge: 'ಆನ್‌ಬೋರ್ಡಿಂಗ್',
    compliance_label: 'ಅನುಸರಣೆ',
    documents_label: 'ದಾಖಲೆಗಳು',
    select_sanctioned_hospital: 'ಅನುಮೋದಿತ ಆಸ್ಪತ್ರೆ ಸಂಸ್ಥೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    select_registered_clinic: 'ನೋಂದಾಯಿತ ಹೊರರೋಗಿ ಕ್ಲಿನಿಕ್ ಆಯ್ಕೆಮಾಡಿ',
    hospital_step_desc: 'ಒಳರೋಗಿ ವಾರ್ಡ್‌ಗಳೊಂದಿಗೆ ಕೆಪಿಎಂಇ ಕಾಯ್ದೆಯಡಿ ನೋಂದಾಯಿಸಲಾದ ಉನ್ನತ-ಅನುಸರಣೆಯ ವೈದ್ಯಕೀಯ ಸಂಸ್ಥೆಗಳು.',
    clinic_step_desc: 'ಕೆಪಿಎಂಇ ಕಾಯ್ದೆಯಡಿ ನೋಂದಾಯಿಸಲಾದ ಹೊರರೋಗಿ ಮತ್ತು ಸಮಾಲೋಚನೆ ವೈದ್ಯಕೀಯ ಸಂಸ್ಥೆಗಳು.',
    pharmacy_step_desc: 'ಡ್ರಗ್ಸ್ ಮತ್ತು ಕಾಸ್ಮೆಟಿಕ್ಸ್ ಕಾಯ್ದೆ 1940 ರ ಅಡಿಯಲ್ಲಿ ಪರವಾನಗಿ ಪಡೆದ ಚಿಲ್ಲರೆ ಔಷಧ ಮಳಿಗೆಗಳು.',
    badge_kpme_hospital: 'ಕೆಪಿಎಂಇ ಹಂತ ೨/೩ ನೋಂದಾಯಿತ',
    badge_kpme_clinic: 'ಕೆಪಿಎಂಇ ಒಪಿಡಿ ನೋಂದಾಯಿತ',
    badge_verified_partner: 'ಪರಿಶೀಲಿಸಿದ ಪಾಲುದಾರ',
    continue_to_compliance_questions: 'ಅನುಸರಣೆ ಪ್ರಶ್ನೆಗಳಿಗೆ ಮುಂದುವರಿಯಿರಿ',
    continue_to_documents: 'ದಾಖಲೆ ಪರಿಶೀಲನೆಗೆ ಮುಂದುವರಿಯಿರಿ',
    back_to_selection: 'ಆಯ್ಕೆಗೆ ಹಿಂದಿರುಗಿ',
    back_to_compliance: 'ಪ್ರಶ್ನೆಗಳಿಗೆ ಹಿಂದಿರುಗಿ',
    complete_onboarding: 'ದೃಢೀಕರಿಸಿ ಮತ್ತು ಪೋರ್ಟಲ್ ಪ್ರವೇಶಿಸಿ',
    scannings_and_diagnostics: 'ರೋಗನಿರ್ಣಯ ಇಮೇಜಿಂಗ್ ಮತ್ತು ಸ್ಕ್ಯಾನಿಂಗ್ ಸೌಲಭ್ಯಗಳು',
    scannings_sub: 'ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಒದಗಿಸಲಾದ ಇಮೇಜಿಂಗ್ ಮತ್ತು ರೋಗನಿರ್ಣಯ ಸೇವೆಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    emergency_scanning_247: '೨೪/೭ ತುರ್ತು ಸ್ಕ್ಯಾನಿಂಗ್ ಲಭ್ಯವಿದೆ',
    aerb_clearance_title: 'ಎಇಆರ್‌ಬಿ ವಿಕಿರಣ ಸುರಕ್ಷತಾ ಅನುಮತಿ / ನೋಂದಣಿ ಸಂಖ್ಯೆ',
    how_will_you_use: 'ನೀವು ಮೆಡ್‌ಫೈಂಡ್ ಅನ್ನು ಹೇಗೆ ಬಳಸುತ್ತೀರಿ?',
    select_role_sub: 'ವೈದ್ಯಕೀಯ ಡೈರೆಕ್ಟರಿ ಮತ್ತು ಪರಿಕರಗಳನ್ನು ವೈಯಕ್ತೀಕರಿಸಲು ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    role_buyer: 'ಗ್ರಾಹಕರು / ರೋಗಿಗಳು',
    role_buyer_sub: 'ಔಷಧಿಗಳನ್ನು ಹುಡುಕಿ, ಬೆಲೆಗಳನ್ನು ಹೋಲಿಸಿ ಮತ್ತು ಆರೋಗ್ಯ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    role_pharma: 'ಔಷಧಾಲಯ',
    role_pharma_sub: 'ಔಷಧಾಲಯ ಸ್ಟಾಕ್ ಮತ್ತು ವಿತರಣೆಯನ್ನು ನಿರ್ವಹಿಸಿ',
    role_clinic: 'ಕ್ಲಿನಿಕ್',
    role_clinic_sub: 'ಕ್ಲಿನಿಕ್ ಔಷಧ ವಿತರಣೆ ಮತ್ತು ರೋಗಿಗಳ ಸರಬರಾಜು ನಿರ್ವಹಿಸಿ',
    role_hospital: 'ಆಸ್ಪತ್ರೆ',
    role_hospital_sub: 'ಆಸ್ಪತ್ರೆ ಔಷಧಾಲಯ, ವಾರ್ಡ್‌ಗಳು ಮತ್ತು ಸ್ಕ್ಯಾನಿಂಗ್ ನಿರ್ವಹಿಸಿ',
    role_continue: 'ಮುಂದುವರಿಯಿರಿ',
    change_role_or_signout: 'ಸೈನ್ ಔಟ್ / ಪಾತ್ರ ಬದಲಾಯಿಸಿ',
    change_role_or_signout_sub: 'ಖರೀದಿದಾರ, ಔಷಧಾಲಯ, ಕ್ಲಿನಿಕ್ ಅಥವಾ ಆಸ್ಪತ್ರೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಲು ಪ್ರಾರಂಭಕ್ಕೆ ಹಿಂತಿರುಗಿ',
    hospital_compliance_title: 'ಆಸ್ಪತ್ರೆಯ ನಿಯಂತ್ರಕ ಅನುಸರಣೆ ಮಾಹಿತಿ',
    clinic_compliance_title: 'ಕ್ಲಿನಿಕ್ ನಿಯಂತ್ರಕ ಅನುಸರಣೆ ಮಾಹಿತಿ',
    pharmacy_compliance_title: 'ಔಷಧಾಲಯ ವಾಣಿಜ್ಯ ಅನುಸರಣೆ ಮಾಹಿತಿ',
    hospital_compliance_desc: 'ಕರ್ನಾಟಕ ಕೆಪಿಎಂಇ ನಿಯಮಾವಳಿಗಳ ಅನ್ವಯ ಒಳರೋಗಿ ಹಾಸಿಗೆ ಸೌಲಭ್ಯಗಳಿಗೆ ಅಗತ್ಯವಿರುವ ಕಡ್ಡಾಯ ಮಾಹಿತಿ.',
    clinic_compliance_desc: 'ಕೆಪಿಎಂಇ ನಿಯಮಾವಳಿಗಳ ಅನ್ವಯ ಹೊರರೋಗಿ ಸಮಾಲೋಚನೆಗಾಗಿ ಅಗತ್ಯವಿರುವ ಕಡ್ಡಾಯ ಮಾಹಿತಿ.',
    pharmacy_compliance_desc: 'ಔಷಧಿ ಮತ್ತು ಸೌಂದರ್ಯವರ್ಧಕ ಕಾಯ್ದೆಯಡಿ ರಾಜ್ಯ ಔಷಧಿ ನಿಯಂತ್ರಣ ಇಲಾಖೆಯ ಕಡ್ಡಾಯ ಪರವಾನಗಿ ಮಾಹಿತಿ.',
    hospital_docs_desc: 'ಒಳರೋಗಿ ಆಸ್ಪತ್ರೆಗಳಿಗೆ ಸರ್ಕಾರವು ಕಡ್ಡಾಯಗೊಳಿಸಿರುವ ಅನುಮತಿಗಳು ಮತ್ತು ಪ್ರಮಾಣಪತ್ರಗಳು.',
    clinic_docs_desc: 'ಹೊರರೋಗಿ ಸಮಾಲೋಚನಾ ಕ್ಲಿನಿಕ್‌ಗಳಿಗೆ ಅಗತ್ಯವಿರುವ ವೃತ್ತಿಪರ ಪರವಾನಗಿಗಳು ಮತ್ತು ದೃಢೀಕರಣಗಳು.',
    pharmacy_docs_desc: 'ಚಿಲ್ಲರೆ ಔಷಧಾಲಯಗಳಿಗೆ ಅಗತ್ಯವಿರುವ ವಾಣಿಜ್ಯ ಔಷಧಿ ಪರವಾನಗಿಗಳು ಮತ್ತು ಅರ್ಹತೆಗಳು.',
    verify_hospital_enter: 'ಆಸ್ಪತ್ರೆ ದೃಢೀಕರಿಸಿ ಪೋರ್ಟಲ್‌ಗೆ ಪ್ರವೇಶಿಸಿ',
    verify_clinic_enter: 'ಕ್ಲಿನಿಕ್ ದೃಢೀಕರಿಸಿ ಪೋರ್ಟಲ್‌ಗೆ ಪ್ರವೇಶಿಸಿ',
    verify_pharmacy_enter: 'ಔಷಧಾಲಯ ದೃಢೀಕರಿಸಿ ಪೋರ್ಟಲ್‌ಗೆ ಪ್ರವೇಶಿಸಿ',
  },

  hi: {
    // Navigation / Tabs
    tab_home: 'होम',
    tab_search: 'खोजें',
    tab_map: 'नक्शा',
    tab_emergency: 'आपातकालीन',
    tab_care: 'अस्पताल',

    // Home / Hero
    hero_headline_1: 'अपनी दवाई खोजें',
    hero_highlight: 'जाने से',
    hero_headline_2: 'पहले पुष्टि करें।',
    hero_subtext: 'देखें कि किस नजदीकी फार्मेसी ने आखिरी बार पुष्टि की थी और कितने समय पहले।',
    search_medicine_name: 'दवाई का नाम खोजें',
    care_nearby_title: 'आसपास के स्वास्थ्य केंद्र',
    care_nearby_subtitle: 'अस्पताल, क्लीनिक और एम्बुलेंस संपर्क',
    emergency_help_title: 'आपातकालीन सहायता',
    emergency_help_subtitle: '112 पर कॉल करें या आपातकालीन संपर्क देखें',
    for_you: 'आपके लिए',
    for_you_subtitle: 'आपकी प्राथमिकताओं के आधार पर तैयार',
    set_your_area: 'अपना क्षेत्र सेट करें',

    // Freshness System Guide
    stock_status_guide: 'स्टॉक स्थिति गाइड',
    how_to_check_stock: 'दवाई की उपलब्धता कैसे जांचें',
    check_stock_sub: 'फार्मेसी ने आखिरी बार स्टॉक की पुष्टि कब की थी, जांचें ताकि आप सीधे जा सकें या पहले कॉल करें।',
    just_updated_ready: 'अभी अपडेट हुआ • सीधे जा सकते हैं',
    call_store_first: 'पहले दुकान पर कॉल करें',
    tier_recent_title: 'अभी-अभी अपडेट हुआ',
    tier_recent_time: '30 मिनट के भीतर',
    tier_recent_desc: 'फार्मेसी कर्मचारियों द्वारा सीधे पुष्टि की गई। आप बेझिझक जा सकते हैं।',
    tier_aging_title: 'आज पहले अपडेट किया गया',
    tier_aging_time: '30 मिनट – 2 घंटे',
    tier_aging_desc: 'आज पहले पुष्टि की गई। स्टॉक मिलने की संभावना है।',
    tier_stale_title: 'पहले अपडेट किया गया',
    tier_stale_time: '2 घंटे से अधिक पहले',
    tier_stale_desc: 'अपडेट कुछ घंटे पहले का था। जाने से पहले कॉल करने की सलाह दी जाती है।',
    tier_unreported_title: 'सीधे दुकान पर कॉल करें',
    tier_unreported_time: 'आज कोई रिपोर्ट नहीं',
    tier_unreported_desc: 'फार्मेसी खुली है, लेकिन आज कोई स्टॉक अपडेट नहीं भेजा है। कॉल करके जांचें।',
    genuine_updates_notice: 'केवल वास्तविक फार्मेसी अपडेट। मेडफाइंड कभी भी स्टॉक का अनुमान नहीं लगाता।',
    demo_sample_data_label: 'डेमो ऐप: नमूना डेटा',

    // Search
    search_placeholder: 'दवाई खोजें (जैसे डोलो, खांसी, कैलपॉल)...',
    search_subtext: 'दवाई के ब्रांड या सॉल्ट नाम से खोजें।',
    search_medicine_title: 'दवाई खोजें',
    popular_medicines: 'आम दवाइयां',
    recent_searches_device: 'हालिया खोजें, केवल इसी डिवाइस पर सहेजी गईं',
    clear_all: 'सभी हटाएं',
    clear_search: 'खोज हटाएं',
    verified_network: 'सत्यापित नेटवर्क',
    verified_network_desc: 'पंजीकृत फार्मेसियों द्वारा सीधे रिपोर्ट किया गया स्टॉक।',
    sample_data_badge: 'नमूना डेटा',
    sample_data_notice: 'प्रदर्शन के लिए नमूना डेटा। स्टॉक की पुष्टि के लिए फार्मेसी को कॉल करें।',
    verified_stock_title: 'सत्यापित फार्मेसी स्टॉक',
    verified_stock_desc: 'फार्मेसी कर्मचारियों द्वारा सीधे पुष्टि की गई।',
    sample_care_network: 'प्रदर्शन के लिए नमूना स्वास्थ्य निर्देशिका',
    showing_region: '{region} दिखाया जा रहा है',
    unsupported_region_title: 'इस क्षेत्र के लिए अभी फार्मेसी डेटा उपलब्ध नहीं है',
    unsupported_region_notice: 'मेडफाइंड के पास अभी इस क्षेत्र के लिए फार्मेसी डेटा नहीं है।',
    choose_another_area: 'दूसरा क्षेत्र चुनें',
    emergency_link: 'आपातकालीन संपर्क',
    no_area_set: 'कोई क्षेत्र सेट नहीं',
    filter_type: 'दवाई का प्रकार',
    filter_dose: 'मात्रा / खुराक',
    filter_all: 'सभी',
    tablet: 'गोली (टैबलेट)',
    syrup: 'सिरप',
    inhaler: 'इनहेलर',
    cream: 'क्रीम',
    injection: 'इंजेक्शन',
    drops: 'ड्रॉप्स',
    no_matching_records: 'कोई रिकॉर्ड नहीं मिला',
    no_records_hint: 'आपकी खोज से मेल खाता कोई रिकॉर्ड नहीं मिला। स्पेलिंग जांचें या सॉल्ट के नाम से खोजें।',
    matching_records: 'मिलते-जुलते रिकॉर्ड',
    exact_descriptions: 'सटीक विवरण',
    diff_form_notice: 'अलग फॉर्मूलेशन, समान नहीं माना जाता',

    // Availability & Actions
    in_stock: 'उपलब्ध है',
    available: 'उपलब्ध है',
    low_stock: 'कम बची है',
    out_of_stock: 'खत्म हो गया',
    call_to_check: 'कॉल करके जांचें',
    unreported: 'दुकान पर कॉल करें',
    call: 'कॉल करें',
    call_store: 'दुकान पर कॉल',
    call_pharmacy: 'फार्मेसी को कॉल करें',
    directions: 'दिशा-निर्देश',
    open_daily: '24 घंटे खुला',
    distance_km: 'किमी दूर',

    // Care & Providers
    care_title: 'आसपास के स्वास्थ्य केंद्र',
    care_subtitle: 'सत्यापित अस्पताल, क्लीनिक, एम्बुलेंस और फार्मेसियां',
    hospitals: 'अस्पताल',
    clinics: 'क्लीनिक',
    ambulances: 'एम्बुलेंस',
    pharmacies: 'फार्मेसियां',
    all: 'सभी',
    osm_care_title: 'ओपनस्ट्रीटमैप से नजदीकी स्वास्थ्य केंद्र',
    osm_care_body: 'वास्तविक अस्पताल, क्लीनिक और फार्मेसियां। समय और उपलब्धता की पुष्टि के लिए पहले कॉल करें।',
    direct_phone_numbers: 'अस्पतालों, क्लीनिकों, एम्बुलेंस और फार्मेसियों के सीधे फोन नंबर।',

    // Emergency
    emergency_title: 'यदि यह आपातकालीन स्थिति है, तुरंत कॉल करें।',
    emergency_subtitle: 'एक टैप से आपका फोन डायलर खुलेगा। आप स्वयं कॉल करें।',
    emergency_numbers_for: 'आपातकालीन नंबर:',
    change_country: 'देश बदलें',
    call_local_emergency: 'अपने स्थानीय आपातकालीन नंबर पर कॉल करें',
    common_emergency_numbers: 'सामान्य नंबर: 112, 911, और 999। मेडफाइंड सहायता नहीं भेजता।',
    call_112: 'आपातकालीन सेवा पर कॉल करें',
    dial_112: '112 डायल करें',
    call_108: 'एम्बुलेंस (108) को कॉल करें',
    quick_guide: 'त्वरित आपातकालीन सहायता',
    quick_guide_desc: 'गंभीर या जीवन-घातक स्थितियों में प्राथमिकता सहायता के लिए तुरंत स्थानीय आपातकालीन नंबर पर कॉल करें।',
    direct_services: 'सीधी सेवाएं',
    police: 'पुलिस',
    police_sub: 'आपातकालीन कानून प्रवर्तन',
    ambulance_medical: 'एम्बुलेंस / मेडिकल इमरजेंसी',
    ambulance_sub: 'आपातकालीन चिकित्सा देखभाल',
    fire_rescue: 'अग्निशमन और बचाव सेवा',
    fire_sub: 'आग और आपदा बचाव',
    dial_prefix: 'डायल करें',
    worldwide_directory: 'विश्वव्यापी आपातकालीन डायरेक्टरी',
    worldwide_directory_sub: 'सभी 87 देशों के कोड, पुलिस, एम्बुलेंस और फायर नंबर',
    unverified_region: 'असत्यापित क्षेत्र',
    helplines_in: 'हेल्पलाइन नंबर:',
    women_helpline: 'महिला हेल्पलाइन',
    child_helpline: 'चाइल्ड हेल्पलाइन',
    senior_helpline: 'वरिष्ठ नागरिक हेल्पलाइन',
    disaster_helpline: 'आपदा हेल्पलाइन',
    mental_health_helpline: 'मानसिक स्वास्थ्य हेल्पलाइन (टेली-मानस)',
    official_citations: 'आधिकारिक सरकारी स्रोत',

    // Settings
    settings: 'सेटिंग्स',
    healthcare_tools: 'स्वास्थ्य और सुविधाएं',
    my_medicine_box: 'मेरी दवाई पेटी',
    medicine_box_desc: 'सहेजी गई दवाइयां, समाप्ति और रीफिल तिथियां ट्रैक करें',
    emergency_directory_title: 'आपातकालीन डायरेक्टरी',
    emergency_directory_subtitle: '87 देश • कॉलिंग कोड और आपातकालीन नंबर',
    preferences: 'प्राथमिकताएं',
    language: 'ऐप की भाषा',
    language_subtitle: 'English, ಕನ್ನಡ, हिंदी',
    appearance: 'दिखावट',
    light_theme: 'लाइट थीम',
    dark_theme: 'डार्क थीम',
    services_info: 'सेवाएं और जानकारी',
    how_location_works: 'स्थान कैसे काम करता है',
    how_location_subtitle: 'जीपीएस उपयोग, दूरी की गणना और गोपनीयता',
    quality_policy: 'गुणवत्ता और सुरक्षा नीति',
    quality_policy_subtitle: 'सरकारी रिकॉर्ड और सत्यापित दुकानें',
    data_management: 'डेटा प्रबंधन',
    reset_answers: 'मेरे उत्तर रीसेट करें',
    reset_answers_sub: 'बडी और सिफारिशों को अपडेट करने के लिए दोबारा उत्तर दें',
    delete_medicine_box: 'दवाई पेटी का डेटा हटाएं',
    delete_medicine_box_sub: 'सभी सहेजी गई दवाइयों और अनुस्मारकों को हटाएं',
    close: 'बंद करें',
    switch_theme: 'बदलें',
    change_language: 'बदलें',
    understood: 'समझ गया',
    switch_to_dark: 'डार्क थीम पर बदलें',
    switch_to_light: 'लाइट थीम पर बदलें',
    personal_health_prefs: 'व्यक्तिगत स्वास्थ्य प्राथमिकताएं और उत्तर',
    tap_to_view_profile: 'प्रोफ़ाइल देखने के लिए टैप करें',
    reset_answers_confirm_title: 'उत्तर रीसेट करें?',
    reset_answers_confirm_msg: 'यह आपके उत्तरों को रीसेट कर देगा ताकि आप फिर से उत्तर दे सकें।',
    delete_box_confirm_title: 'दवाई पेटी का डेटा हटाएं?',
    delete_box_confirm_msg: 'यह सभी सहेजी गई दवाइयों और अनुस्मारकों को हटा देगा।',
    cancel: 'रद्द करें',
    reset: 'रीसेट करें',
    delete_all: 'सभी हटाएं',
    search_directory_placeholder: 'देश, कोड (+91) या नंबर से खोजें...',
    set_as_my_country: 'मेरा देश सेट करें',
    active_emergency_country: 'सक्रिय आपातकालीन देश',
    verified: 'सत्यापित',
    general_service: 'सामान्य',
    hide_sources: 'स्रोत छिपाएं ▲',
    official_citations_btn: 'आधिकारिक सरकारी संदर्भ ({count}) ▼',
    emergency_direct_call_note: 'टैप करने पर डायलर में {number} खुलेगा। MedFind सहायता नहीं भेजता है।',
    emergency_direct_tap_note: 'डायलर खोलने के लिए किसी भी सेवा पर टैप करें।',
    see_all_care_nearby: 'नजदीकी सभी स्वास्थ्य केंद्र देखें',

    // Profile & Storage
    profile_screen_title: 'प्रोफाइल और स्थानीय डेटा',
    saved_only_on_phone: 'केवल इसी फोन पर सहेजा गया',
    who_finding_for: 'मैं किसके लिए दवाई ढूंढ रहा हूँ',
    tailors_recommendations: 'खोज परिणाम और सिफारिशें तैयार करता है',
    age_group_title: 'आयु वर्ग',
    age_group_sub: 'आयु के अनुसार सही दवाई सुझाने में प्रयुक्त',
    my_answers: 'मेरे उत्तर',
    my_answers_sub: 'कभी भी बदलें। सिफारिशें तुरंत अपडेट हो जाती हैं।',
    saved_on_phone: 'इस फोन पर सहेजा गया',
    saved_on_phone_sub: 'डिवाइस स्टोरेज और प्रबंधन',
    saved_medicines_title: 'सहेजी गई दवाइयां',
    recent_searches_title: 'हालिया खोजें',
    location_preference_title: 'स्थान प्राथमिकता',
    clear_everything: 'सब कुछ हटाएं',
    clear_everything_sub: 'प्रोफाइल, दवाई पेटी और खोजें हटा दी जाएंगी। थीम और भाषा सुरक्षित रहेगी।',
    delete_everything_btn: 'सब कुछ हटाएं',
clear: 'हटाएं',
    sign_out: 'साइन आउट',
    change_role: 'भूमिका बदलें',
    change_role_sub: 'ग्राहक और फार्मेसी स्टाफ के बीच बदलें',
    change_role_confirm_msg: 'यह आपको शुरुआत में वापस ले जाएगा।',
    back_to_role_picker: 'वापस / भूमिका बदलें',
    emergency_country_ref_title: 'आपातकालीन एवं देश संदर्भ',
    emergency_country_ref_sub: 'दुनिया भर की आपातकालीन हेल्पलाइन और डायलिंग कोड',
    no_tracking_sub: 'कोई ट्रैकिंग नहीं: मेडफाइंड कभी भी आपके देखे गए दवाओं या स्थानों को रिकॉर्ड नहीं करता।',
    osm_privacy_notice: 'ओपनस्ट्रीटमैप सर्वर का उपयोग करके आपके अनुमानित स्थान से नजदीकी स्थानों की खोज की जाती है।',
    emergency_demo_disclaimer: 'डेमो ऐप: आपातकालीन नंबर अपूर्ण या पुराने हो सकते हैं। वास्तविक आपात स्थिति में, अपने स्थानीय आपातकालीन नंबर पर कॉल करें।',
    medicines_count: '{current}/{max} दवाइयां',
    empty_box_title: 'आपकी दवाई पेटी खाली है',
    empty_box_sub: 'समाप्ति तिथि ट्रैक करें और इस फोन पर रीफिल रिमाइंडर प्राप्त करें।',
    add_medicine_btn: 'दवाई जोड़ें',
    box_full_banner: 'आपकी दवाई पेटी भर चुकी है ({count} आइटम)',
    saved_only_phone_never_shared: 'केवल इसी फोन पर सहेजा गया। कभी साझा नहीं किया गया।',
    edit_medicine: 'दवाई संपादित करें',
    add_medicine: 'दवाई जोड़ें',
    save_changes: 'बदलाव सहेजें',
    add_to_box: 'पेटी में जोड़ें',
    remind_me: 'मुझे याद दिलाएं',
    remind_sub: 'समाप्ति से पहले और रीफिल के दिन सूचना पाएं',

    // Recommendations & Greetings
    welcome: 'स्वागत है',
    hi_prefix: 'नमस्ते',
    why_seeing_this: 'यह क्यों दिखाया जा रहा है?',
    'Finish setting up (takes 1 minute)': 'सेटअप पूरा करें (1 मिनट)',
    'Personalize your buddy, notifications, and recommendations': 'अपने साथी, सूचनाएं और सिफारिशों को कस्टमाइज़ करें',
    'Check availability near you': 'अपने नजदीकी उपलब्धता देखें',
    'Search nearby verified pharmacies before making an unnecessary trip': 'अनावश्यक यात्रा से बचने के लिए नजदीकी सत्यापित फार्मेसी खोजें',
    'Find a pediatric clinic': 'बाल चिकित्सालय (क्लिनिक) खोजें',
    'View verified primary healthcare clinics and pediatric consultation centers nearby': 'आसपास के सत्यापित प्राथमिक स्वास्थ्य केंद्र और बाल क्लीनिक देखें',
    'Child dosage safety notice': 'बच्चों की दवा खुराक सुरक्षा निर्देश',
    'Always verify liquid medicine concentrations and weight-based doses with a doctor': 'तरल दवा की सांद्रता और वजन-आधारित खुराक हमेशा डॉक्टर से सत्यापित करें',
    'Emergency hospital care': 'आपातकालीन अस्पताल देखभाल',
    'Locate emergency-ready hospitals with 24/7 casualty departments nearby': '24/7 आपातकालीन विभाग वाले नजदीकी अस्पताल खोजें',
    'Elder care & home safety': 'वरिष्ठ नागरिकों की देखभाल और सुरक्षा',
    'Keep emergency contacts pinned and check that daily medicines are accessible': 'आपातकालीन संपर्क सुरक्षित रखें और दैनिक दवाएं आसानी से सुलभ रखें',
    'First-aid supplies': 'प्राथमिक चिकित्सा सामग्री',
    'Browse essential antiseptics, bandages, and basic wound care items nearby': 'नजदीकी आवश्यक एंटीसेप्टिक, पट्टियां और प्राथमिक उपचार सामग्री खोजें',
    'Explore verified care facilities': 'सत्यापित स्वास्थ्य केंद्र देखें',
    'Browse hospitals, clinics, and emergency services in your area': 'अपने क्षेत्र के अस्पताल, क्लीनिक और आपातकालीन सेवाएं देखें',
    'Search essential medicines': 'आवश्यक दवाएं खोजें',
    'Locate nearby pharmacies and view last-verified stock reports': 'नजदीकी फार्मेसी खोजें और अंतिम सत्यापित स्टॉक रिपोर्ट देखें',
    'Set refill & expiry reminders': 'रीफ़िल और समाप्ति रिमाइंडर सेट करें',
    'Never run out of essentials': 'आवश्यक दवाइयां कभी खत्म न होने दें',
    'Because you skipped initial setup': 'क्योंकि आपने प्रारंभिक सेटअप छोड़ दिया था',
    "Because you said you've struggled to find a medicine in stock": 'क्योंकि आपको दवा का स्टॉक मिलने में परेशानी हुई थी',
    'Because you have a child in your household profile': 'क्योंकि आपकी प्रोफ़ाइल में बच्चा शामिल है',
    'Because you have a senior in your household profile': 'क्योंकि आपकी प्रोफ़ाइल में वरिष्ठ नागरिक शामिल हैं',
    "Because you don't have a basic first-aid kit ready": 'क्योंकि आपके पास प्राथमिक चिकित्सा किट तैयार नहीं है',
    "Because you said you'd like refill reminders": 'क्योंकि आपने कहा कि आपको रीफ़िल रिमाइंडर चाहिए',
    'Personalized recommendations based on your preferences': 'आपकी प्राथमिकताओं के आधार पर वैयक्तिकृत सिफारिशें',

    // Profile Chip & Toggle Options
    'Me': 'मैं',
    'Parent': 'माता-पिता',
    'Child': 'बच्चा',
    'Someone else': 'कोई अन्य',
    'Under 5': '5 वर्ष से कम',
    '5 to 12': '5 से 12',
    '13 to 17': '13 से 17',
    '18 to 59': '18 से 59',
    '60 and above': '60 और उससे अधिक',
    'Male': 'पुरुष',
    'Female': 'महिला',
    'Other': 'अन्य',
    'Prefer not to say': 'बताना नहीं चाहते',
    'Penicillin': 'पेनिसिलिन',
    'Aspirin': 'एस्पिरिन',
    'Sulfa drugs': 'सल्फा दवाएं',
    'Latex': 'लेटेक्स',
    'Peanuts': 'मूंगफली',
    'Shellfish': 'शेलफिश',
    'Dairy': 'डेयरी / दूध',
    'Gluten': 'ग्लूटेन',
    'None': 'कोई नहीं',
    'I keep a medicine box at home': 'मैं घर पर दवाई की पेटी रखता/रखती हूं',
    "I've struggled to find a medicine in stock": 'मुझे दवा का स्टॉक ढूंढने में परेशानी हुई है',
    'I buy medicines for my family': 'मैं अपने परिवार के लिए दवाइयां खरीदता/खरीदती हूं',
    "I'd like refill reminders": 'मुझे रीफ़िल रिमाइंडर चाहिए',
    'I compare prices before buying': 'खरीदने से पहले मैं कीमतों की तुलना करता/करती हूं',

    // Staff Onboarding & Portal
    staff_badge_title: 'फार्मेसी स्टाफ मोड',
    staff_badge_info_msg: 'यह प्रतीक दर्शाता है कि आप फार्मेसी स्टाफ मोड में हैं। यह दवाओं के स्टॉक को अपडेट करने के लिए अधिकृत कर्मचारियों के लिए आरक्षित है।\n\nयदि आप ग्राहक हैं, तो ऊपर बाईं ओर "< वापस / भूमिका बदलें" पर टैप करें।',
    authorized_personnel_only: 'केवल अधिकृत कर्मियों के लिए',
    store_partner_onboarding: 'स्टोर पार्टनर ऑनबोर्डिंग',
    step_store: 'स्टोर',
    step_staff_id: 'स्टाफ आईडी',
    step_attest: 'प्रमाणन',
    select_operating_pharmacy: 'संचालन फार्मेसी चुनें',
    select_pharmacy_sub: 'वह सत्यापित रिटेल डिस्पेंसरी या अस्पताल काउंटर चुनें जिसे आप आज संचालित कर रहे हैं।',
    verified_pilot_partner: 'सत्यापित पायलट पार्टनर',
    continue_to_pharmacist_id: 'फार्मासिस्ट आईडी पर आगे बढ़ें',
    pharmacist_identification: 'फार्मासिस्ट पहचान',
    pharmacist_id_sub: 'अपने लाइसेंस प्राप्त फार्मासिस्ट क्रेडेंशियल दर्ज करें। प्रत्येक इन्वेंट्री संशोधन आपकी पहचान के साथ दर्ज किया जाता है।',
    autofill_demo_credentials: 'डेमो विवरण स्वतः भरें',
    pharmacist_name_label: 'पंजीकृत फार्मासिस्ट का नाम *',
    license_number_label: 'केएसपीसी पंजीकरण / ड्रग रिटेल लाइसेंस *',
    counter_station_label: 'काउंटर / वितरण स्टेशन *',
    back_btn: 'वापस',
    continue_to_attest: 'प्रमाणन के लिए आगे बढ़ें',
    regulatory_attestation_title: 'क्लिनिकल एवं विनियामक प्रमाणन',
    regulatory_attestation_sub: 'कर्नाटक औषधि नियमों और मेडफाइंड पारदर्शिता मानकों के अनुपालन की समीक्षा करें और प्रमाणित करें।',
    shelf_verification_title: 'भौतिक शेल्फ सत्यापन',
    shelf_verification_desc: 'मैं पुष्टि करता/करती हूं कि उपलब्धता अपडेट शेल्फ पर भौतिक रूप से निरीक्षण किए गए स्टॉक को दर्शाते हैं।',
    dpco_price_compliance: 'डीपीसीओ मूल्य अनुपालन',
    dpco_price_compliance_sub: 'वितरित आवश्यक दवाएं बिना किसी अतिरिक्त शुल्क के एनपीपीए अधिकतम मूल्य का सख्ती से पालन करती हैं।',
    traceable_audit_trail: 'ट्रेसेबल ऑडिट ट्रेल',
    traceable_audit_trail_sub: 'अपडेट विनियामक निरीक्षण के लिए मेरे ऑपरेटर की पहचान और समय दर्ज करते हैं।',
    attest_checkbox_label: 'मैं औषधि और प्रसाधन सामग्री नियमों की धारा 65 के तहत प्रमाणित करता/करती हूं कि मैं अधिकृत डिस्पेंसरी स्टाफ हूं।',
    onboarding_assignment: 'ऑनबोर्डिंग असाइनमेंट',
    complete_verification_btn: 'सत्यापन पूरा करें और पोर्टल में प्रवेश करें',
    staff_portal: 'स्टाफ पोर्टल',
    hospital_portal: 'अस्पताल पोर्टल',
    clinic_portal: 'क्लिनिक पोर्टल',
    pharmacy_portal: 'फार्मेसी पोर्टल',
    hospital_tab: 'अस्पताल',
    clinic_tab: 'क्लिनिक',
    pharmacy_tab: 'फार्मेसी',
    hospital_settings_title: 'अस्पताल सेटिंग्स और अनुपालन',
    clinic_settings_title: 'क्लिनिक सेटिंग्स और अनुपालन',
    pharmacy_settings_title: 'फार्मेसी सेटिंग्स और अनुपालन',
    tier_hospital: 'अस्पताल (स्तर 1)',
    tier_clinic: 'क्लिनिक (स्तर 2)',
    tier_pharmacy: 'फार्मेसी (स्तर 3)',
    facility_type_label: 'प्रतिष्ठान श्रेणी',
    hospital_category_label: 'अस्पताल श्रेणी',
    hospital_category_desc: 'केपीएमई स्वीकृत परिचालन वर्गीकरण',
    category_level_1: 'स्तर 1A/1B बुनियादी अस्पताल',
    category_level_2: 'स्तर 2 मल्टी-स्पेशलिटी अस्पताल',
    category_level_3: 'स्तर 3 सुपर-स्पेशलिटी अस्पताल',
    category_level_4: 'स्तर 4 शिक्षण / तृतीयक अस्पताल',
    bed_capacity_label: 'स्वीकृत इनपेशेंट बेड क्षमता',
    operation_theatres_label: 'ऑपरेशन थिएटर (OT)',
    icu_beds_label: 'गहन चिकित्सा इकाई (ICU)',
    emergency_beds_label: 'आपातकालीन / कैजुअल्टी बेड',
    bio_waste_id_label: 'बायो-मेडिकल वेस्ट यूजर आईडी (KSPCB)',
    nodal_officer_name_label: 'नोडल शिकायत निवारण अधिकारी',
    nodal_officer_contact_label: 'शिकायत अधिकारी का संपर्क फोन',
    medical_superintendent_label: 'चिकित्सा अधीक्षक / प्रशासक',
    clinic_type_label: 'क्लिनिक प्रकार',
    clinic_type_solo: 'एकल चिकित्सक परामर्श',
    clinic_type_multi: 'मल्टी-स्पेशलिटी पॉलीक्लिनिक',
    clinic_type_daycare: 'डेकेयर सेंटर',
    system_of_medicine_label: 'चिकित्सा प्रणाली',
    medicine_allopathy: 'एलोपैथी (आधुनिक चिकित्सा)',
    medicine_ayurveda: 'आयुर्वेद',
    medicine_homeopathy: 'होम्योपैथी',
    medicine_unani: 'यूनानी',
    diagnostic_support_label: 'आंतरिक नैदानिक सहायता (एक्स-रे / लैब)',
    diagnostic_yes: 'हां - ऑन-साइट आंतरिक सुविधा',
    diagnostic_no: 'नहीं - केवल बाहरी प्रयोगशालाएं',
    primary_doctor_name_label: 'मुख्य प्रभारी डॉक्टर का नाम',
    primary_doctor_degree_label: 'डॉक्टर योग्यता और डिग्री (जैसे MBBS, MD)',
    state_medical_council_reg: 'राज्य चिकित्सा परिषद पंजीकरण संख्या (KMC)',
    drug_license_form_20: 'ड्रग लाइसेंस फॉर्म 20 (खुदरा)',
    drug_license_form_21: 'ड्रग लाइसेंस फॉर्म 21 (निर्दिष्ट)',
    pharmacist_council_reg: 'फार्मेसी काउंसिल पंजीकरण संख्या (KSPC)',
    cold_chain_status_label: 'कोल्ड चेन तापमान निगरानी अवसंरचना',
    cold_chain_automated: 'स्वचालित 24/7 डिजिटल डेटा लॉगर (2-8°C)',
    cold_chain_manual: 'दिन में दो बार मैनुअल तापमान रजिस्टर',
    cold_chain_standard: 'मानक घरेलू कोल्ड स्टोरेज',
    mandatory_document_uploads: 'अनिवार्य दस्तावेज अपलोड',
    upload_doc_btn: 'दस्तावेज अपलोड करें (PDF/छवि)',
    uploaded_status: 'अपलोड और सत्यापित',
    required_status: 'आवश्यक',
    quick_fill_compliance: 'सभी अनुपालन और दस्तावेज तुरंत भरें',
    quick_fill_compliance_sub: 'प्रदर्शन के लिए आधिकारिक कर्नाटक विनियामक डेटा पहले से भरता है',
    kpme_attestation_statement: 'मैं कर्नाटक निजी चिकित्सा प्रतिष्ठान (केपीएमई) अधिनियम और बायो-मेडिकल अपशिष्ट प्रबंधन नियमों के तहत घोषणा करता/करती हूं कि सभी सुविधाएं और दस्तावेज वैध और सत्य हैं।',
    drugs_act_attestation_statement: 'मैं औषधि और प्रसाधन सामग्री अधिनियम 1940 के तहत घोषणा करता/करती हूं कि फॉर्म 20/21 लाइसेंस सक्रिय हैं और वितरण के दौरान पंजीकृत फार्मासिस्ट उपस्थित रहता है।',
    verified_badge: 'सत्यापित',
    store_settings_tab: 'स्टोर',
    search_pharmacy_inventory_placeholder: 'दवा का ब्रांड, जेनेरिक नाम खोजें...',
    all_items: 'सभी वस्तुएं',
    on_shelf_stock_header: 'ऑन-शेल्फ डिस्पेंसरी स्टॉक',
    updated_prefix: 'अपडेट किया गया',
    no_reports_yet: 'अभी तक कोई रिपोर्ट नहीं',
    store_settings_title: 'स्टोर सेटिंग्स',
    dispensary_staff_station: 'डिस्पेंसरी और स्टाफ स्टेशन',
    session_stock_updates_notice: 'इस सत्र के लिए स्टॉक अपडेट स्थानीय रूप से रखे जाते हैं।',
    current_store_credentials: 'वर्तमान स्टोर और क्रेडेंशियल',
    registered_pharmacist_label: 'पंजीकृत फार्मासिस्ट',
    registration_license_label: 'पंजीकरण / लाइसेंस संख्या',
    dispensing_station_label: 'डिस्पेंसिंग स्टेशन',
    appearance_and_lang: 'दिखावट और भाषा',
    theme_label: 'थीम',
    light_mode: 'लाइट मोड',
    dark_mode: 'डार्क मोड',
    store_photos_heading: 'स्टोर की तस्वीरें',
    add_store_photo: 'स्टोर की तस्वीर जोड़ें',
    replace_photo: 'तस्वीर बदलें',
    remove_photo: 'हटाएं',
    photo_upload_web_hint: 'अपनी फ़ाइलों में से चुनने के लिए क्लिक करें',
    photo_upload_native_hint: 'कैमरा या गैलरी खोलने के लिए टैप करें',
    store_location_heading: 'स्टोर का स्थान',
    share_live_location: 'लाइव स्थान साझा करें',
    update_live_location: 'लाइव स्थान अपडेट करें',
    getting_location: 'स्थान प्राप्त किया जा रहा है…',
    location_shared_success: 'स्थान साझा किया गया!',
    location_share_sub: 'ग्राहकों को आपके सटीक काउंटर तक पहुंचने में मदद करता है',
    session_and_role: 'सत्र और भूमिका',
    sign_out_of_pharmacy: 'फार्मेसी से साइन आउट करें',
    clears_credentials_sub: 'इस डिवाइस पर सत्यापित क्रेडेंशियल हटाता है',
    switch_to_customer: 'ग्राहक दृश्य पर स्विच करें',
    switch_to_customer_sub: 'मरीज़ के रूप में दवाएं खोजें और नजदीकी फार्मेसी देखें',
    pinpoint_on_map: 'मैप पर पिन करें',
    pinpoint_on_live_map: 'लाइव मैप पर पिन करें',
    pinpoint_map_subtitle: 'सटीक स्थान तय करने के लिए मार्कर को खींचें या मैप पर टैप करें।',
    pinpoint_confirm_btn: 'इस स्थान को सेट करें',
    pinpoint_hospital_location: 'अस्पताल प्रवेश द्वार पिन करें',
    pinpoint_clinic_location: 'क्लिनिक स्थान पिन करें',
    pinpoint_pharmacy_location: 'फार्मेसी काउंटर पिन करें',
    recenter_gps: 'जीपीएस पर पुनः केंद्रित करें',
    selected_live_location: 'चयनित लाइव स्थान',
    searching_location: 'पता खोजा जा रहा है…',
    back_change_role: 'पीछे / भूमिका बदलें',
    onboarding_badge: 'ऑनबोर्डिंग',
    compliance_label: 'अनुपालन',
    documents_label: 'दस्तावेज़',
    select_sanctioned_hospital: 'स्वीकृत अस्पताल प्रतिष्ठान चुनें',
    select_registered_clinic: 'पंजीकृत आउटपेशेंट क्लिनिक चुनें',
    hospital_step_desc: 'इनपेशेंट वार्डों के साथ केपीएमई अधिनियम के तहत पंजीकृत उच्च-अनुपालन नैदानिक प्रतिष्ठान।',
    clinic_step_desc: 'केपीएमई अधिनियम के तहत पंजीकृत आउटपेशेंट और परामर्श चिकित्सा प्रतिष्ठान।',
    pharmacy_step_desc: 'ड्रग्स एंड कॉस्मेटिक्स एक्ट 1940 के तहत लाइसेंस प्राप्त खुदरा दवा स्टोर।',
    badge_kpme_hospital: 'केपीएमई स्तर 2/3 पंजीकृत',
    badge_kpme_clinic: 'केपीएमई ओपीडी पंजीकृत',
    badge_verified_partner: 'सत्यापित भागीदार',
    continue_to_compliance_questions: 'अनुपालन प्रश्नों पर आगे बढ़ें',
    continue_to_documents: 'दस्तावेज़ सत्यापन पर आगे बढ़ें',
    back_to_selection: 'चयन पर वापस जाएं',
    back_to_compliance: 'प्रश्नों पर वापस जाएं',
    complete_onboarding: 'सत्यापित करें और पोर्टल में प्रवेश करें',
    scannings_and_diagnostics: 'डायग्नोस्टिक इमेजिंग और स्कैनिंग सुविधाएं',
    scannings_sub: 'परिसर में उपलब्ध इमेजिंग और डायग्नोस्टिक सेवाएं चुनें',
    emergency_scanning_247: '24/7 आपातकालीन स्कैनिंग उपलब्ध',
    aerb_clearance_title: 'एईआरबी विकिरण सुरक्षा मंजूरी / पंजीकरण सं.',
    how_will_you_use: 'आप MedFind का उपयोग कैसे करेंगे?',
    select_role_sub: 'अपनी मेडिकल डायरेक्टरी और टूल्स को कस्टमाइज़ करने के लिए अपनी भूमिका चुनें।',
    role_buyer: 'खरीदार / मरीज़',
    role_buyer_sub: 'दवाएं खोजें, कीमतों की तुलना करें और स्वास्थ्य ट्रैक करें',
    role_pharma: 'फार्मेसी',
    role_pharma_sub: 'फार्मेसी स्टॉक और डिस्पेंसरी प्रबंधित करें',
    role_clinic: 'क्लिनिक',
    role_clinic_sub: 'क्लिनिक डिस्पेंसरी और रोगी आपूर्ति प्रबंधित करें',
    role_hospital: 'अस्पताल',
    role_hospital_sub: 'अस्पताल फार्मेसी, वार्ड और स्कैनिंग प्रबंधित करें',
    role_continue: 'जारी रखें',
    change_role_or_signout: 'साइन आउट / भूमिका बदलें',
    change_role_or_signout_sub: 'खरीदार, फार्मेसी, क्लिनिक या अस्पताल चुनने के लिए शुरुआत में वापस जाएं',
    hospital_compliance_title: 'अस्पताल नियामक अनुपालन डेटा',
    clinic_compliance_title: 'क्लिनिक नियामक अनुपालन डेटा',
    pharmacy_compliance_title: 'फार्मेसी वाणिज्यिक अनुपालन डेटा',
    hospital_compliance_desc: 'कर्नाटक केपीएमई नियमों के तहत भर्ती इनपेशेंट सुविधाओं के लिए अनिवार्य सरकारी डेटा।',
    clinic_compliance_desc: 'केपीएमई नियमों के तहत ओपीडी परामर्श के लिए अनिवार्य सरकारी डेटा।',
    pharmacy_compliance_desc: 'औषधि एवं प्रसाधन सामग्री अधिनियम के तहत राज्य औषधि नियंत्रण विभाग द्वारा आवश्यक लाइसेंस डेटा।',
    hospital_docs_desc: 'इनपेशेंट अस्पतालों के लिए आवश्यक सरकारी स्वीकृतियां और प्रमाण पत्र।',
    clinic_docs_desc: 'आउटपेशेंट परामर्श क्लिनिकों के लिए आवश्यक पेशेवर लाइसेंस और परिसर प्रमाणन।',
    pharmacy_docs_desc: 'खुदरा फार्मेसियों के लिए आवश्यक वाणिज्यिक दवा लाइसेंस और फार्मासिस्ट क्रेडेंशियल।',
    verify_hospital_enter: 'अस्पताल सत्यापित करें और पोर्टल में प्रवेश करें',
    verify_clinic_enter: 'क्लिनिक सत्यापित करें और पोर्टल में प्रवेश करें',
    verify_pharmacy_enter: 'फार्मेसी सत्यापित करें और पोर्टल में प्रवेश करें',
  },
};

// Numeral maps
const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const KANNADA_DIGITS = ['೦', '೧', '೨', '೩', '೪', '೫', '೬', '೭', '೮', '೯'];

export function formatNativeDigits(text: string | number, lang: AppLanguage): string {
  const str = String(text);
  if (lang === 'en') return str;
  const digits = lang === 'hi' ? DEVANAGARI_DIGITS : KANNADA_DIGITS;
  return str.replace(/[0-9]/g, (d) => digits[parseInt(d, 10)] ?? d);
}

export function formatLocalizedNumber(value: number | string, lang: AppLanguage): string {
  if (lang === 'en') return String(value);
  let result = String(value);
  if (lang === 'hi') {
    result = result
      .replace(/(?<=\d|\s|^)km\b/gi, 'किमी')
      .replace(/(?<=\d|\s|^)hrs\b/gi, 'घंटे')
      .replace(/(?<=\d|\s|^)mins\b/gi, 'मिनट')
      .replace(/(?<=\d|\s|^)mg\b/gi, 'मिलीग्राम')
      .replace(/(?<=\d|\s|^)mcg\b/gi, 'माइक्रोग्राम')
      .replace(/(?<=\d|\s|^)ml\b/gi, 'मिली');
  } else if (lang === 'kn') {
    result = result
      .replace(/(?<=\d|\s|^)km\b/gi, 'ಕಿ.ಮೀ')
      .replace(/(?<=\d|\s|^)hrs\b/gi, 'ಗಂಟೆ')
      .replace(/(?<=\d|\s|^)mins\b/gi, 'ನಿಮಿಷ')
      .replace(/(?<=\d|\s|^)mg\b/gi, 'ಮಿ.ಗ್ರಾಂ')
      .replace(/(?<=\d|\s|^)mcg\b/gi, 'ಮೈಕ್ರೋಗ್ರಾಂ')
      .replace(/(?<=\d|\s|^)ml\b/gi, 'ಮಿ.ಲೀ');
  }
  return formatNativeDigits(result, lang);
}

export const MEDICINE_TRANSLATIONS: Record<string, { hi: string; kn: string }> = {
  // Base brand & generic molecules
  'Salbutamol': { hi: 'सालबुटामोल', kn: 'ಸಾಲ್ಬುಟಮಾಲ್' },
  'Cetirizine': { hi: 'सेटिरिज़िन', kn: 'ಸೆಟ್ರಿಜಿನ್' },
  'Calpol': { hi: 'कैलपोल', kn: 'ಕಾಲ್ಪೋಲ್' },
  'Asthalin': { hi: 'अस्थालीन', kn: 'ಅಸ್ತಲಿನ್' },
  'Cetzine': { hi: 'सेटज़ीन', kn: 'ಸೆಟ್ಜಿನ್' },
  'Dolo': { hi: 'डोलो', kn: 'ಡೋಲೋ' },
  'Amoxicillin': { hi: 'एमोक्सिसिलिन', kn: 'ಅಮೋಕ್ಸಿಸಿಲಿನ್' },
  'Azithromycin': { hi: 'एज़िथ्रोमाइसिन', kn: 'ಅಜಿತ್ರೊಮೈಸಿನ್' },
  'Pantoprazole': { hi: 'पैंटोप्राजोल', kn: 'ಪ್ಯಾಂಟೊಪ್ರಜೋಲ್' },
  'Metformin': { hi: 'मेटफॉर्मिन', kn: 'ಮೆಟ್‌ಫಾರ್ಮಿನ್' },
  'Diclofenac': { hi: 'डाइक्लोफेनाक', kn: 'ಡಿಕ್ಲೋಫೆನಾಕ್' },
  'Clotrimazole': { hi: 'क्लोट्रिमेज़ोल', kn: 'ಕ್ಲೋಟ್ರಿಮಝೋಲ್' },
  'Ibuprofen': { hi: 'इबुप्रोफेन', kn: 'ಐಬುಪ್ರೊಫೇನ್' },
  'Ciprofloxacin': { hi: 'सिप्रोफ्लोक्सासिन', kn: 'ಸಿಪ್ರೊಫ್ಲೋಕ್ಸಾಸಿನ್' },
  'Omeprazole': { hi: 'ओमेप्राजोल', kn: 'ಒಮೆಪ್ರಜೋಲ್' },
  'Domperidone': { hi: 'डोमपेरिडोन', kn: 'ಡೊಂಪೆರಿಡೋನ್' },
  'Mupirocin': { hi: 'म्यूपिरोसिन', kn: 'ಮುಪಿರೋಸಿನ್' },
  'Amlodipine': { hi: 'एम्लोडिपिन', kn: 'ಆಮ್ಲೋಡಿಪಿನ್' },
  'Telmisartan': { hi: 'टेल्मिसार्टन', kn: 'ಟೆಲ್ಮಿಸಾರ್ಟನ್' },
  'Atorvastatin': { hi: 'एटोरवास्टेटिन', kn: 'ಅಟೋರ್ವಾಸ್ಟಾಟಿನ್' },
  'Budesonide': { hi: 'बुडेसोनाइड', kn: 'ಬುಡೆಸೊನೈಡ್' },
  'Formoterol': { hi: 'फॉर्मोटेरोल', kn: 'ಫಾರ್ಮೊಟೆರಾಲ್' },
  'Montelukast': { hi: 'मोंटेलुकास्ट', kn: 'ಮೊಂಟೆಲುಕಾಸ್ಟ್' },
  'Levocetirizine': { hi: 'लेवोसेटिरिज़िन', kn: 'ಲೆವೊಸೆಟ್ರಿಜಿನ್' },
  'Paracetamol': { hi: 'पैरासिटामोल', kn: 'ಪ್ಯಾರಸಿಟಮಾಲ್' },
  'Dolo 650': { hi: 'डोलो ६५०', kn: 'ಡೋಲೋ ೬೫೦' },
  'Augmentin 625 Duo': { hi: 'ऑगमेंटिन ६२५ डुओ', kn: 'ಆಗ್ಮೆಂಟಿನ್ ೬೨೫ ಡ್ಯುಯೊ' },
  'Electral': { hi: 'इलेक्ट्रल', kn: 'ಎಲೆಕ್ಟ್ರಲ್' },
  'Glycomet 500': { hi: 'ग्लाइकोमेट ५००', kn: 'ಗ್ಲೈಕೊಮೆಟ್ ೫೦೦' },
  'Azee 500': { hi: 'अज़ी ५००', kn: 'ಅಝೀ ೫೦೦' },
  'Pan 40': { hi: 'पैन ४०', kn: 'ಪ್ಯಾನ್ ೪೦' },
  'Montek-LC': { hi: 'मोंटेक-एलसी', kn: 'ಮಾಂಟೆಕ್-ಎಲ್‌ಸಿ' },
  'Telma 40': { hi: 'टेल्मा ४०', kn: 'ಟೆಲ್ಮಾ ೪೦' },
  'Atorva 10': { hi: 'अटोर्वा १०', kn: 'ಅಟೋರ್ವಾ ೧೦' },
  'Brufen 400': { hi: 'ब्रुफेन ४००', kn: 'ಬ್ರೂಫೆನ್ ೪೦೦' },
  'Human Mixtard 30/70': { hi: 'ह्यूमन मिक्सटार्ड ३०/७०', kn: 'ಹ್ಯೂಮನ್ ಮಿಕ್ಸ್‌ಟಾರ್ಡ್ ೩೦/೭೦' },
  'Volini Gel': { hi: 'वोलिनी जेल', kn: 'ವಾಲಿನಿ ಜೆಲ್' },
  'Candid Cream': { hi: 'कैंडिड क्रीम', kn: 'ಕ್ಯಾಂಡಿಡ್ ಕ್ರೀಮ್' },
  'Foracort 200 Inhaler': { hi: 'फोराकोर्ट २०० इन्हेलर', kn: 'ಫೊರಾಕಾರ್ಟ್ ೨೦೦ ಇನ್ಹೇಲರ್' },
  'Amlong 5': { hi: 'एमलॉन्ग ५', kn: 'ಆಮ್ಲಾಂಗ್ ೫' },
  'Omez 20': { hi: 'ओमेज़ २०', kn: 'ಒಮೆಜ್ ೨೦' },
  'Domstal 10': { hi: 'डोमस्टाल १०', kn: 'ಡೊಮ್ಸ್ಟಾಲ್ ೧೦' },
  'Ascoril D Plus': { hi: 'एस्कोरिल डी प्लस', kn: 'ಆಸ್ಕೋರಿಲ್ ಡಿ ಪ್ಲಸ್' },
  'Shelcal 500': { hi: 'शैलकल ५००', kn: 'ಶೆಲ್ಕಲ್ ೫೦೦' },
  'Limcee 500': { hi: 'लिमसी ५००', kn: 'ಲಿಮ್ಸಿ ೫೦೦' },
  'Ciplox 500': { hi: 'सिप्लॉक्स ५००', kn: 'ಸಿಪ್ಲಾಕ್ಸ್ ೫೦೦' },
  'Crocin Baby Drops': { hi: 'क्रोसिन बेबी ड्रॉप्स', kn: 'ಕ್ರೋಸಿನ್ ಬೇಬಿ ಡ್ರಾಪ್ಸ್' },
  'T-Bact 2%': { hi: 'टी-बैक्ट २%', kn: 'ಟಿ-ಬ್ಯಾಕ್ಟ್ ೨%' },
  'Amaryl 2': { hi: 'अमारिल २', kn: 'ಅಮರಿಲ್ ೨' },
  'Famocid 40': { hi: 'फेमोसिड ४०', kn: 'ಫ್ಯಾಮೊಸಿಡ್ ೪೦' },
  'Calpol 500': { hi: 'कैलपोल ५००', kn: 'ಕಾಲ್ಪೋಲ್ ೫೦೦' },
  'Amoxicillin + Clavulanic Acid': { hi: 'एमोक्सिसिलिन + क्लावुलैनिक एसिड', kn: 'ಅಮೋಕ್ಸಿಸಿಲಿನ್ + ಕ್ಲಾವುಲಾನಿಕ್ ಆಮ್ಲ' },
  'Cetirizine Hydrochloride': { hi: 'सेटिरिज़िन हाइड्रोक्लोराइड', kn: 'ಸೆಟ್ರಿಜಿನ್ ಹೈಡ್ರೋಕ್ಲೋರೈಡ್' },
  'Salbutamol Inhaler': { hi: 'सालबुटामोल इन्हेलर', kn: 'ಸಾಲ್ಬುಟಮಾಲ್ ಇನ್ಹೇಲರ್' },
  'Oral Rehydration Salts (ORS)': { hi: 'ओरल रिहाइड्रेशन साल्ट्स (ओआरएस)', kn: 'ಓರಲ್ ರಿಹೈಡ್ರೇಶನ್ ಸಾಲ್ಟ್ಸ್ (ಒಆರ್‌ಎಸ್)' },
  'Metformin Hydrochloride': { hi: 'मेटफॉर्मिन हाइड्रोक्लोराइड', kn: 'ಮೆಟ್‌ಫಾರ್ಮಿನ್ ಹೈಡ್ರೋಕ್ಲೋರೈಡ್' },
  'Pantoprazole Gastro-resistant': { hi: 'पैंटोप्राजोल गैस्ट्रो-रेसिस्टेंट', kn: 'ಪ್ಯಾಂಟೊಪ್ರಜೋಲ್ ಗ್ಯಾಸ್ಟ್ರೋ-ರೆಸಿಸ್ಟೆಂಟ್' },
  'Montelukast + Levocetirizine': { hi: 'मोंटेलुकास्ट + लेवोसेटिरिज़िन', kn: 'ಮೊಂಟೆಲುಕಾಸ್ಟ್ + ಲೆವೊಸೆಟ್ರಿಜಿನ್' },
  'Human Insulin 30/70': { hi: 'मानव इंसुलिन ३०/७०', kn: 'ಮಾನವ ಇನ್ಸುಲಿನ್ ೩೦/೭೦' },
  'Diclofenac Diethylamine Gel': { hi: 'डाइक्लोफेनाक डायथाइलैमाइन जेल', kn: 'ಡಿಕ್ಲೋಫೆನಾಕ್ ಡೈಎಥೈಲಾಮೈನ್ ಜೆಲ್' },
  'Clotrimazole Topical Cream': { hi: 'क्लोट्रिमेज़ोल टॉपिकल क्रीम', kn: 'ಕ್ಲೋಟ್ರಿಮಝೋಲ್ ಸಾಮಯಿಕ ಕ್ರೀಮ್' },
  'Budesonide + Formoterol Inhaler': { hi: 'बुडेसोनाइड + फॉर्मोटेरोल इन्हेलर', kn: 'ಬುಡೆಸೊನೈಡ್ + ಫಾರ್ಮೊಟೆರಾಲ್ ಇನ್ಹೇಲರ್' },
  'Amlodipine Besylate': { hi: 'एम्लोडिपिन बेसिलेट', kn: 'ಆಮ್ಲೋಡಿಪಿನ್ ಬೆಸಿಲೇಟ್' },
  'Dextromethorphan + Chlorpheniramine Syrup': { hi: 'डेक्सट्रोमेथॉर्फन + क्लोरफेनिरामाइन सिरप', kn: 'ಡೆಕ್ಸ್‌ಟ್ರೋಮೆಥೋರ್ಫಾನ್ + ಕ್ಲೋರ್‌ಫೆನಿರಮೈನ್ ಸಿರಪ್' },
  'Calcium Carbonate + Vitamin D3': { hi: 'कैल्शियम कार्बोनेट + विटामिन डी३', kn: 'ಕ್ಯಾಲ್ಸಿಯಂ ಕಾರ್ಬೊನೇಟ್ + ವಿಟಮಿನ್ ಡಿ೩' },
  'Vitamin C Chewable': { hi: 'विटामिन सी चबाने योग्य', kn: 'ವಿಟಮಿನ್ ಸಿ ಅಗಿಯುವ ಮಾತ್ರೆ' },
  'Paracetamol Pediatric Drops': { hi: 'पैरासिटामोल बाल चिकित्सा ड्रॉप्स', kn: 'ಪ್ಯಾರಸಿಟಮಾಲ್ ಮಕ್ಕಳ ಹನಿಗಳು' },
  'Mupirocin Ointment': { hi: 'म्यूपिरोसिन मरहम', kn: 'ಮುಪಿರೋಸಿನ್ ಮುಲಾಮು' },
  'Glimepiride': { hi: 'ग्लिमेपिराइड', kn: 'ಗ್ಲಿಮೆಪಿರೈಡ್' },
  'Famotidine': { hi: 'फैमोटिडाइन', kn: 'ಫ್ಯಾಮೊಟಿಡೈನ್' },
};

export const PHARMACY_TRANSLATIONS: Record<string, { hi: string; kn: string }> = {
  'Apollo Pharmacy - Victoria Hospital Road': {
    hi: 'अपोलो फार्मेसी - विक्टोरिया अस्पताल रोड',
    kn: 'ಅಪೊಲೊ ಫಾರ್ಮಸಿ - ವಿಕ್ಟೋರಿಯಾ ಆಸ್ಪತ್ರೆ ರಸ್ತೆ',
  },
  'MedPlus Pharmacy - Gandhi Bazaar': {
    hi: 'मेडप्लस फार्मेसी - गांधी बाज़ार',
    kn: 'ಮೆಡ್‌ಪ್ಲಸ್ ಫಾರ್ಮಸಿ - ಗಾಂಧಿ ಬಜಾರ್',
  },
  'Wellness Forever 24/7 - Jayanagar': {
    hi: 'वेलनेस फॉरएवर २४/७ - जयनगर',
    kn: 'ವೆಲ್ನೆಸ್ ಫಾರೆವರ್ ೨೪/೭ - ಜಯನಗರ',
  },
  'Apollo Pharmacy 24/7 - Indiranagar': {
    hi: 'अपोलो फार्मेसी २४/७ - इंदिरानगर',
    kn: 'ಅಪೊಲೊ ಫಾರ್ಮಸಿ ೨೪/೭ - ಇಂದಿರಾನಗರ',
  },
  'MedPlus Pharmacy - Koramangala 4th Block': {
    hi: 'मेडप्लस फार्मेसी - कोरमंगला चौथा ब्लॉक',
    kn: 'ಮೆಡ್‌ಪ್ಲಸ್ ಫಾರ್ಮಸಿ - ಕೋರಮಂಗಲ ೪ನೇ ಬ್ಲಾಕ್',
  },
  'Trust Chemist & Druggist - Malleshwaram': {
    hi: 'ट्रस्ट केमिस्ट और ड्रगिस्ट - मल्लेश्वरम',
    kn: 'ಟ್ರಸ್ಟ್ ಕೆಮಿಸ್ಟ್ ಮತ್ತು ಡ್ರಗ್ಗಿಸ್ಟ್ - ಮಲ್ಲೇಶ್ವರಂ',
  },
  'Apollo Pharmacy - Jayanagar 9th Block': {
    hi: 'अपोलो फार्मेसी - जयनगर ९वां ब्लॉक',
    kn: 'ಅಪೊಲೊ ಫಾರ್ಮಸಿ - ಜಯನಗರ ೯ನೇ ಬ್ಲಾಕ್',
  },
  'MedPlus Pharmacy - HSR Layout Sector 1': {
    hi: 'मेडप्लस फार्मेसी - एचएसआर लेआउट सेक्टर १',
    kn: 'ಮೆಡ್‌ಪ್ಲಸ್ ಫಾರ್ಮಸಿ - ಎಚ್‌ಎಸ್‌ಆರ್ ಲೇಔಟ್ ಸೆಕ್ಟರ್ ೧',
  },
  'Apollo Pharmacy 24/7 - Banashankari 2nd Stage': {
    hi: 'अपोलो फार्मेसी २४/७ - बनशंकरी दूसरा चरण',
    kn: 'ಅಪೊಲೊ ಫಾರ್ಮಸಿ ೨೪/೭ - ಬನಶಂಕರಿ ೨ನೇ ಹಂತ',
  },
  'Wellness Forever 24/7 - BTM Layout': {
    hi: 'वेलनेस फॉरएवर २४/७ - बीटीएम लेआउट',
    kn: 'ವೆಲ್ನೆಸ್ ಫಾರೆವರ್ ೨೪/೭ - ಬಿಟಿಎಂ ಲೇಔಟ್',
  },
  'Apollo Pharmacy - JP Nagar 6th Phase': {
    hi: 'अपोलो फार्मेसी - जेपी नगर छठा चरण',
    kn: 'ಅಪೊಲೊ ಫಾರ್ಮಸಿ - ಜೆಪಿ ನಗರ ೬ನೇ ಹಂತ',
  },
  'MedPlus Pharmacy - Rajajinagar 1st Block': {
    hi: 'मेडप्लस फार्मेसी - राजाजीनगर पहला ब्लॉक',
    kn: 'ಮೆಡ್‌ಪ್ಲಸ್ ಫಾರ್ಮಸಿ - ರಾಜಾಜಿನಗರ ೧ನೇ ಬ್ಲಾಕ್',
  },
  'Apollo Pharmacy 24/7 - Whitefield ITPL': {
    hi: 'अपोलो फार्मेसी २४/७ - व्हाइटफील्ड आईटीपीएल',
    kn: 'ಅಪೊಲೊ ಫಾರ್ಮಸಿ ೨೪/೭ - ವೈಟ್‌ಫೀಲ್ಡ್ ಐಟಿಪಿಎಲ್',
  },
  'Jan Aushadhi Kendra (PMBJP) - BMCRI Victoria Campus': {
    hi: 'जन औषधि केंद्र (पीएमबीजेपी) - बीएमसीआरआई विक्टोरिया परिसर',
    kn: 'ಜನ ಔಷಧಿ ಕೇಂದ್ರ (ಪಿಎಂಬಿಜೆಪಿ) - ಬಿಎಂಸಿಆರ್‌ಐ ವಿಕ್ಟೋರಿಯಾ ಕ್ಯಾಂಪಸ್',
  },
  'Lalbagh Road Pharmacy': {
    hi: 'लालबाग रोड फार्मेसी',
    kn: 'ಲಾಲ್‌ಬಾಗ್ ರಸ್ತೆ ಫಾರ್ಮಸಿ',
  },
  'Gandhi Bazaar Medicals': {
    hi: 'गांधी बाज़ार मेडिकल्स',
    kn: 'ಗಾಂಧಿ ಬಜಾರ್ ಮೆಡಿಕಲ್ಸ್',
  },
  'Bull Temple Care Pharmacy': {
    hi: 'बुल टेम्पल केयर फार्मेसी',
    kn: 'ಬುಲ್ ಟೆಂಪಲ್ ಕೇರ್ ಫಾರ್ಮಸಿ',
  },
  'Basavanagudi Health Store': {
    hi: 'बसवनगुड़ी हेल्थ स्टोर',
    kn: 'ಬಸವನಗುಡಿ ಆರೋಗ್ಯ ಮಳಿಗೆ',
  },
  'Victoria Hospital Community Pharmacy': {
    hi: 'विक्टोरिया अस्पताल सामुदायिक फार्मेसी',
    kn: 'ವಿಕ್ಟೋರಿಯಾ ಆಸ್ಪತ್ರೆ ಸಮುದಾಯ ಔಷಧಾಲಯ',
  },
};

export const CLINIC_TRANSLATIONS: Record<string, { hi: string; kn: string }> = {
  'Victoria Hospital Casualty & Emergency': {
    hi: 'विक्टोरिया अस्पताल आपातकालीन एवं दुर्घटना विभाग',
    kn: 'ವಿಕ್ಟೋರಿಯಾ ಆಸ್ಪತ್ರೆ ಅಪಘಾತ ಮತ್ತು ತುರ್ತು ಚಿಕಿತ್ಸಾ ವಿಭಾಗ',
  },
  'Bowring and Lady Curzon Emergency Wing': {
    hi: 'बॉवरिंग और लेडी कर्जन आपातकालीन विंग',
    kn: 'ಬೌರಿಂಗ್ ಮತ್ತು ಲೇಡಿ ಕರ್ಜನ್ ತುರ್ತು ಚಿಕಿತ್ಸಾ ವಿಭಾಗ',
  },
  'Manipal Emergency Cardiac & Trauma Ambulance': {
    hi: 'मणिपाल इमरजेंसी कार्डिएक और ट्रॉमा एम्बुलेंस',
    kn: 'ಮಣಿಪಾಲ್ ಎಮರ್ಜೆನ್ಸಿ ಕಾರ್ಡಿಯಾಕ್ ಮತ್ತು ಟ್ರಾಮಾ ಆಂಬ್ಯುಲೆನ್ಸ್',
  },
  'Jayadeva Cardiac Emergency Mobile ICU': {
    hi: 'जयदेव कार्डिएक इमरजेंसी मोबाइल आईसीयू',
    kn: 'ಜಯದೇವ ಕಾರ್ಡಿಯಾಕ್ ಎಮರ್ಜೆನ್ಸಿ ಮೊಬೈಲ್ ಐಸಿಯು',
  },
  'Victoria Hospital - BMCRI Campus': {
    hi: 'विक्टोरिया अस्पताल - बीएमसीआरआई परिसर',
    kn: 'ವಿಕ್ಟೋರಿಯಾ ಆಸ್ಪತ್ರೆ - ಬಿಎಂಸಿಆರ್‌ಐ ಕ್ಯಾಂಪಸ್',
  },
  'Bowring & Lady Curzon Hospital': {
    hi: 'बॉवरिंग और लेडी कर्जन अस्पताल',
    kn: 'ಬೌರಿಂಗ್ ಮತ್ತು ಲೇಡಿ ಕರ್ಜನ್ ಆಸ್ಪತ್ರೆ',
  },
  'KC General Hospital': {
    hi: 'केसी जनरल अस्पताल',
    kn: 'ಕೆಸಿ ಜನರಲ್ ಆಸ್ಪತ್ರೆ',
  },
  'NIMHANS Emergency Centre': {
    hi: 'निमहंस आपातकालीन केंद्र',
    kn: 'ನಿಮ್ಹಾನ್ಸ್ ತುರ್ತು ಕೇಂದ್ರ',
  },
  'Indira Gandhi Institute of Child Health': {
    hi: 'इंदिरा गांधी बाल स्वास्थ्य संस्थान',
    kn: 'ಇಂದಿರಾ ಗಾಂಧಿ ಮಕ್ಕಳ ಆರೋಗ್ಯ ಸಂಸ್ಥೆ',
  },
  'Sri Jayadeva Institute of Cardiovascular Sciences': {
    hi: 'श्री जयदेव हृदय रोग संस्थान',
    kn: 'ಶ್ರೀ ಜಯದೇವ ಹೃದ್ರೋಗ ವಿಜ್ಞಾನ ಸಂಸ್ಥೆ',
  },
};

export function translateMedicineName(name: string, lang: AppLanguage): string {
  if (!name || lang === 'en') return name;

  // 1. Direct dictionary match
  if (MEDICINE_TRANSLATIONS[name]) {
    return MEDICINE_TRANSLATIONS[name][lang];
  }

  // 2. Case-insensitive lookup
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(MEDICINE_TRANSLATIONS)) {
    if (key.toLowerCase().trim() === lower) {
      return val[lang];
    }
  }

  // 3. Handle 'Demo-' or 'Demo ' prefix (e.g. 'Demo-Asthalin', 'Demo-Calpol', 'Demo-Cetzine')
  const demoMatch = trimmed.match(/^demo[-\s:]+(.+)$/i);
  if (demoMatch) {
    const rawCore = demoMatch[1];
    const translatedCore = translateMedicineName(rawCore, lang);
    const demoPrefix = lang === 'kn' ? 'ಡೆಮೊ-' : 'डेमो-';
    return `${demoPrefix}${translatedCore}`;
  }

  // 4. Handle combinations with '+'
  if (trimmed.includes('+')) {
    const parts = trimmed.split('+').map((p) => translateMedicineName(p.trim(), lang));
    return parts.join(' + ');
  }

  // 5. Formulation tokens replacement
  let translated = trimmed;
  if (lang === 'hi') {
    translated = translated
      .replace(/\btablet\b/gi, 'गोली')
      .replace(/\bsyrup\b/gi, 'सिरप')
      .replace(/\binhaler\b/gi, 'इन्हेलर')
      .replace(/\bcream\b/gi, 'क्रीम')
      .replace(/\bdrops\b/gi, 'ड्रॉप्स')
      .replace(/\binjection\b/gi, 'इंजेक्शन')
      .replace(/\bgel\b/gi, 'जेल')
      .replace(/\bpowder\b/gi, 'पाउडर');
  } else if (lang === 'kn') {
    translated = translated
      .replace(/\btablet\b/gi, 'ಮಾತ್ರೆ')
      .replace(/\bsyrup\b/gi, 'ಸಿರಪ್')
      .replace(/\binhaler\b/gi, 'ಇನ್ಹೇಲರ್')
      .replace(/\bcream\b/gi, 'ಕ್ರೀಮ್')
      .replace(/\bdrops\b/gi, 'ಹನಿಗಳು')
      .replace(/\binjection\b/gi, 'ಇಂಜೆಕ್ಷನ್')
      .replace(/\bgel\b/gi, 'ಜೆಲ್')
      .replace(/\bpowder\b/gi, 'ಪುಡಿ');
  }
  return formatLocalizedNumber(translated, lang);
}

export function translatePharmacyName(name: string, lang: AppLanguage): string {
  if (!name || lang === 'en') return name;

  if (PHARMACY_TRANSLATIONS[name]) {
    return PHARMACY_TRANSLATIONS[name][lang];
  }

  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(PHARMACY_TRANSLATIONS)) {
    if (key.toLowerCase().trim() === lower) {
      return val[lang];
    }
  }

  let translated = trimmed;
  if (lang === 'kn') {
    translated = translated
      .replace(/\bdemo\b/gi, 'ಡೆಮೊ')
      .replace(/\bchemists\b/gi, 'ಕೆಮಿಸ್ಟ್ಸ್')
      .replace(/\bchemist\b/gi, 'ಕೆಮಿಸ್ಟ್')
      .replace(/\bpharmacy\b/gi, 'ಫಾರ್ಮಸಿ')
      .replace(/\bmedicals\b/gi, 'ಮೆಡಿಕಲ್ಸ್')
      .replace(/\bhealthcare\b/gi, 'ಹೆಲ್ತ್‌ಕೇರ್')
      .replace(/\bhospital\b/gi, 'ಆಸ್ಪತ್ರೆ')
      .replace(/\bclinic\b/gi, 'ಕ್ಲಿನಿಕ್')
      .replace(/\bstore\b/gi, 'ಅಂಗಡಿ')
      .replace(/\bbeta\b/gi, 'ಬೀಟಾ')
      .replace(/\balpha\b/gi, 'ಆಲ್ಫಾ')
      .replace(/\bgamma\b/gi, 'ಗಾಮಾ')
      .replace(/\(fictional\)/gi, '(ಕಾಲ್ಪನಿಕ)')
      .replace(/\(simulated\)/gi, '(ಅನುಕರಿಸಿದ)')
      .replace(/\broad\b/gi, 'ರಸ್ತೆ')
      .replace(/\bavenue\b/gi, 'ಅವೆನ್ಯೂ')
      .replace(/\bblock\b/gi, 'ಬ್ಲಾಕ್')
      .replace(/\bboulevard\b/gi, 'ಬೌಲೆವಾರ್ಡ್')
      .replace(/\bbengaluru\b/gi, 'ಬೆಂಗಳೂರು');
  } else if (lang === 'hi') {
    translated = translated
      .replace(/\bdemo\b/gi, 'डेमो')
      .replace(/\bchemists\b/gi, 'केमिस्ट्स')
      .replace(/\bchemist\b/gi, 'केमिस्ट')
      .replace(/\bpharmacy\b/gi, 'फार्मेसी')
      .replace(/\bmedicals\b/gi, 'मेडिकल्स')
      .replace(/\bhealthcare\b/gi, 'हेल्थकेयर')
      .replace(/\bhospital\b/gi, 'अस्पताल')
      .replace(/\bclinic\b/gi, 'क्लीनिक')
      .replace(/\bstore\b/gi, 'स्टोर')
      .replace(/\bbeta\b/gi, 'बीटा')
      .replace(/\balpha\b/gi, 'अल्फा')
      .replace(/\bgamma\b/gi, 'गामा')
      .replace(/\(fictional\)/gi, '(काल्पनिक)')
      .replace(/\(simulated\)/gi, '(सिम्युलेटेड)')
      .replace(/\broad\b/gi, 'रोड')
      .replace(/\bavenue\b/gi, 'एवेन्यू')
      .replace(/\bblock\b/gi, 'ब्लॉक')
      .replace(/\bboulevard\b/gi, 'बुलेवार्ड')
      .replace(/\bbengaluru\b/gi, 'बेंगलुरु');
  }
  return formatLocalizedNumber(translated, lang);
}

export function translateClinicName(name: string, lang: AppLanguage): string {
  if (!name || lang === 'en') return name;
  if (CLINIC_TRANSLATIONS[name]) {
    return CLINIC_TRANSLATIONS[name][lang];
  }
  const lower = name.toLowerCase().trim();
  for (const [key, val] of Object.entries(CLINIC_TRANSLATIONS)) {
    if (key.toLowerCase().trim() === lower) {
      return val[lang];
    }
  }
  let translated = name;
  if (lang === 'hi') {
    translated = translated
      .replace(/\bhospital\b/gi, 'अस्पताल')
      .replace(/\bclinic\b/gi, 'क्लिनिक')
      .replace(/\bambulance\b/gi, 'एम्बुलेंस')
      .replace(/\bemergency\b/gi, 'आपातकालीन')
      .replace(/\bdispatch\b/gi, 'सेवा')
      .replace(/\bcentre|center\b/gi, 'केंद्र');
  } else if (lang === 'kn') {
    translated = translated
      .replace(/\bhospital\b/gi, 'ಆಸ್ಪತ್ರೆ')
      .replace(/\bclinic\b/gi, 'ಕ್ಲಿನಿಕ್')
      .replace(/\bambulance\b/gi, 'ಆಂಬ್ಯುಲೆನ್ಸ್')
      .replace(/\bemergency\b/gi, 'ತುರ್ತು')
      .replace(/\bdispatch\b/gi, 'ಸೇವೆ')
      .replace(/\bcentre|center\b/gi, 'ಕೇಂದ್ರ');
  }
  return formatLocalizedNumber(translated, lang);
}

export function formatOpeningHours(rawHours: string | null | undefined, lang: AppLanguage): string {
  if (!rawHours) return lang === 'kn' ? '೨೪ ಗಂಟೆ ಲಭ್ಯ' : lang === 'hi' ? '२४ घंटे उपलब्ध' : 'Open 24/7';
  if (lang === 'en') return rawHours;
  let res = formatNativeDigits(rawHours, lang);
  if (lang === 'kn') {
    res = res
      .replace(/\bhours\b/gi, 'ಗಂಟೆಗಳು')
      .replace(/\bhour\b/gi, 'ಗಂಟೆ')
      .replace(/\(simulated\)/gi, '(ಅನುಕರಿಸಿದ)')
      .replace(/\(fictional\)/gi, '(ಕಾಲ್ಪನಿಕ)');
  } else if (lang === 'hi') {
    res = res
      .replace(/\bhours\b/gi, 'घंटे')
      .replace(/\bhour\b/gi, 'घंटे')
      .replace(/\(simulated\)/gi, '(सिम्युलेटेड)')
      .replace(/\(fictional\)/gi, '(काल्पनिक)');
  }
  return res;
}

export function formatRelativeTimeLocalized(
  isoString: string | null | undefined,
  lang: AppLanguage
): string {
  if (!isoString) {
    if (lang === 'kn') return 'ಇನ್ನೂ ವರದಿಗಳಿಲ್ಲ';
    if (lang === 'hi') return 'अभी तक कोई रिपोर्ट नहीं';
    return 'No reports yet';
  }
  const time = new Date(isoString).getTime();
  if (isNaN(time)) {
    if (lang === 'kn') return 'ಇನ್ನೂ ವರದಿಗಳಿಲ್ಲ';
    if (lang === 'hi') return 'अभी तक कोई रिपोर्ट नहीं';
    return 'No reports yet';
  }

  const diffMs = Math.max(0, Date.now() - time);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) {
    if (lang === 'kn') return 'ಈಗಷ್ಟೇ ನವೀಕರಿಸಲಾಗಿದೆ';
    if (lang === 'hi') return 'अभी-अभी अपडेट किया गया';
    return 'Just now';
  }
  if (diffMin < 60) {
    const num = formatNativeDigits(diffMin, lang);
    if (lang === 'kn') return `${num} ನಿಮಿಷಗಳ ಹಿಂದೆ`;
    if (lang === 'hi') return `${num} मिनट पहले`;
    return `${diffMin}m ago`;
  }
  if (diffHours < 24) {
    const num = formatNativeDigits(diffHours, lang);
    if (lang === 'kn') return `${num} ಗಂಟೆಗಳ ಹಿಂದೆ`;
    if (lang === 'hi') return `${num} घंटे पहले`;
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) {
    if (lang === 'kn') return 'ನಿನ್ನೆ';
    if (lang === 'hi') return 'कल';
    return 'Yesterday';
  }
  const num = formatNativeDigits(diffDays, lang);
  if (lang === 'kn') return `${num} ದಿನಗಳ ಹಿಂದೆ`;
  if (lang === 'hi') return `${num} दिन पहले`;
  return `${diffDays}d ago`;
}

export interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  t: (key: string, defaultText?: string) => string;
  languages: LanguageInfo[];
  formatNumber: (value: number | string) => string;
  tMedicine: (name: string) => string;
  tPharmacy: (name: string) => string;
  tClinic: (name: string) => string;
  tTime: (isoString: string | null | undefined) => string;
  tHours: (raw: string | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (key, defaultText) => defaultText || key,
  languages: SUPPORTED_LANGUAGES,
  formatNumber: (v) => String(v),
  tMedicine: (n) => n,
  tPharmacy: (n) => n,
  tClinic: (n) => n,
  tTime: () => 'No reports yet',
  tHours: (h) => h || 'Open 24/7',
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

  const formatNumber = (value: number | string) => formatLocalizedNumber(value, language);
  const tMedicine = (name: string) => translateMedicineName(name, language);
  const tPharmacy = (name: string) => translatePharmacyName(name, language);
  const tClinic = (name: string) => translateClinicName(name, language);
  const tTime = (iso: string | null | undefined) => formatRelativeTimeLocalized(iso, language);
  const tHours = (h: string | null | undefined) => formatOpeningHours(h, language);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
        formatNumber,
        tMedicine,
        tPharmacy,
        tClinic,
        tTime,
        tHours,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
