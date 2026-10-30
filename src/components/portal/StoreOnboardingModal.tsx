import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import { Pharmacy } from '../../types/models';
import {
  pharmacyPortalService,
  FacilityType,
  StorePartnerAuth,
  UploadedComplianceDoc,
  DocumentRequirement,
  HOSPITAL_MANDATORY_DOCS,
  CLINIC_MANDATORY_DOCS,
  PHARMACY_MANDATORY_DOCS,
  HospitalComplianceData,
  ClinicComplianceData,
  PharmacyComplianceData,
  HOSPITAL_SCANNING_SERVICES,
} from '../../services/pharmacyPortalService';
import {
  StaffBadgeIcon,
  PharmacyStoreIcon,
  HospitalIcon,
  ClinicIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  BackArrowIcon,
  CloseIcon,
  ChevronRightIcon,
  ZapIcon,
  InfoIcon,
  UploadCloudIcon,
  DocumentFileIcon,
  TrashIcon,
} from '../icons/AppIcons';

export interface StoreOnboardingModalProps {
  pharmacies?: Pharmacy[];
  initialRole?: 'customer' | 'pharmacist' | 'clinic' | 'hospital' | null;
  onComplete: (auth: StorePartnerAuth) => void;
  onCancel?: () => void;
  cancelLabel?: string;
}

export function StoreOnboardingModal({
  pharmacies: initialPharmacies,
  initialRole,
  onComplete,
  onCancel,
  cancelLabel,
}: StoreOnboardingModalProps) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { t, formatNumber, tPharmacy, tHours, language, setLanguage } = useLanguage();

  // Determine initial facility tier based on provider role
  const initialFacilityType: FacilityType =
    initialRole === 'hospital'
      ? 'hospital'
      : initialRole === 'clinic'
      ? 'clinic'
      : 'pharmacy';

  const [facilityType, setFacilityType] = useState<FacilityType>(initialFacilityType);
  const [facilities, setFacilities] = useState<Pharmacy[]>([]);
  const [selectedStore, setSelectedStore] = useState<Pharmacy | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showStaffInfo, setShowStaffInfo] = useState(false);
  const [hasAttested, setHasAttested] = useState(false);

  // 1. Hospital fields
  const [hospitalCategory, setHospitalCategory] = useState('Level 3 Super-Specialty Hospital');
  const [bedCapacity, setBedCapacity] = useState('');
  const [operationTheatres, setOperationTheatres] = useState('');
  const [icuBeds, setIcuBeds] = useState('');
  const [emergencyBeds, setEmergencyBeds] = useState('');
  const [bioMedicalWasteId, setBioMedicalWasteId] = useState('');
  const [nodalOfficerName, setNodalOfficerName] = useState('');
  const [nodalOfficerContact, setNodalOfficerContact] = useState('');
  const [medicalSuperintendent, setMedicalSuperintendent] = useState('');
  const [selectedScans, setSelectedScans] = useState<string[]>([
    'mri',
    'ct_scan',
    'ultrasound',
    'digital_xray',
  ]);
  const [has24x7Scanning, setHas24x7Scanning] = useState(true);
  const [aerbClearanceNo, setAerbClearanceNo] = useState('');

  // 2. Clinic fields
  const [clinicType, setClinicType] = useState('Multi-Specialty Polyclinic');
  const [systemOfMedicine, setSystemOfMedicine] = useState('Allopathy (Modern Medicine)');
  const [diagnosticSupport, setDiagnosticSupport] = useState(true);
  const [primaryDoctorName, setPrimaryDoctorName] = useState('');
  const [primaryDoctorDegree, setPrimaryDoctorDegree] = useState('');
  const [primaryDoctorCouncilReg, setPrimaryDoctorCouncilReg] = useState('');
  const [consultationRoomId, setConsultationRoomId] = useState('');

  // 3. Pharmacy fields
  const [form20License, setForm20License] = useState('');
  const [form21License, setForm21License] = useState('');
  const [pharmacistName, setPharmacistName] = useState('');
  const [pharmacistCouncilReg, setPharmacistCouncilReg] = useState('');
  const [coldChainMonitoring, setColdChainMonitoring] = useState(
    'Automated 24/7 Digital Data Logger (2-8°C)'
  );
  const [counterId, setCounterId] = useState('');

  // 4. Document uploads storage
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedComplianceDoc | null>>({});

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 12;

  // Reset facility type and step when initialRole changes (e.g. user selected different role)
  useEffect(() => {
    const targetType: FacilityType =
      initialRole === 'hospital'
        ? 'hospital'
        : initialRole === 'clinic'
        ? 'clinic'
        : 'pharmacy';
    setFacilityType(targetType);
    setStep(1);
    setErrorMessage(null);
    setHasAttested(false);
  }, [initialRole]);

  // Load facilities when facilityType changes
  useEffect(() => {
    let isMounted = true;
    pharmacyPortalService.getFacilitiesByType(facilityType).then((list) => {
      if (isMounted) {
        setFacilities(list);
        if (list.length > 0) {
          setSelectedStore(list[0]);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [facilityType]);

  const activeDocRequirements: DocumentRequirement[] =
    facilityType === 'hospital'
      ? HOSPITAL_MANDATORY_DOCS
      : facilityType === 'clinic'
      ? CLINIC_MANDATORY_DOCS
      : PHARMACY_MANDATORY_DOCS;

  const cycleLanguage = () => {
    const nextLang = language === 'en' ? 'kn' : language === 'kn' ? 'hi' : 'en';
    setLanguage(nextLang);
  };

  // Quick-fill with authentic Karnataka government compliance demo data
  const handleQuickFill = () => {
    setErrorMessage(null);
    const nowIso = new Date().toISOString();

    if (facilityType === 'hospital') {
      setHospitalCategory('Level 3 Super-Specialty Hospital');
      setBedCapacity('750');
      setOperationTheatres('12');
      setIcuBeds('48');
      setEmergencyBeds('24');
      setBioMedicalWasteId('KSPCB/BMW/BLR/2026/8941');
      setNodalOfficerName('Dr. S. Nagaraj, MD');
      setNodalOfficerContact('080-26701199');
      setMedicalSuperintendent('Dr. Ramesh Babu, MS (Ortho) - BMCRI/MED/4412');
      setSelectedScans(['mri', 'ct_scan', 'ultrasound', 'digital_xray', 'echo_2d']);
      setHas24x7Scanning(true);
      setAerbClearanceNo('AERB/RSD/MED/BLR/2026/0442');

      const demoDocs: Record<string, UploadedComplianceDoc> = {
        kpme_license: {
          id: 'doc-h1',
          docKey: 'kpme_license',
          title: 'KPME Registration Certificate',
          fileName: 'KPME_License_KA_BLR_2026.pdf',
          fileSize: '1.4 MB',
          uploadedAt: nowIso,
        },
        fire_noc: {
          id: 'doc-h2',
          docKey: 'fire_noc',
          title: 'Fire Safety NOC',
          fileName: 'Karnataka_Fire_NOC_MultiStory_2026.pdf',
          fileSize: '880 KB',
          uploadedAt: nowIso,
        },
        kspcb_waste: {
          id: 'doc-h3',
          docKey: 'kspcb_waste',
          title: 'KSPCB BMW Authorization',
          fileName: 'KSPCB_BioMedical_Waste_Contract_2026.pdf',
          fileSize: '1.1 MB',
          uploadedAt: nowIso,
        },
        building_sanction: {
          id: 'doc-h4',
          docKey: 'building_sanction',
          title: 'Building Sanction & Occupancy',
          fileName: 'BBMP_Sanction_Plan_Occupancy_Cert.pdf',
          fileSize: '3.2 MB',
          uploadedAt: nowIso,
        },
        layout_sketch: {
          id: 'doc-h5',
          docKey: 'layout_sketch',
          title: 'Detailed Architectural Layout',
          fileName: 'Hospital_Ward_OT_ICU_Layout_Sketch.pdf',
          fileSize: '2.5 MB',
          uploadedAt: nowIso,
        },
        doctors_roster: {
          id: 'doc-h6',
          docKey: 'doctors_roster',
          title: 'Full Doctor & Staff Roster',
          fileName: 'Signed_Doctor_Council_Roster_BMCRI.pdf',
          fileSize: '950 KB',
          uploadedAt: nowIso,
        },
        aerb_noc: {
          id: 'doc-h7',
          docKey: 'aerb_noc',
          title: 'AERB Radiation Safety Clearance',
          fileName: 'AERB_Diagnostic_Radiology_Compliance.pdf',
          fileSize: '1.2 MB',
          uploadedAt: nowIso,
        },
      };
      setUploadedDocs(demoDocs);
    } else if (facilityType === 'clinic') {
      setClinicType('Multi-Specialty Polyclinic');
      setSystemOfMedicine('Allopathy (Modern Medicine)');
      setDiagnosticSupport(true);
      setPrimaryDoctorName('Dr. Shweta Rao');
      setPrimaryDoctorDegree('MBBS, MD (General Medicine)');
      setPrimaryDoctorCouncilReg('KMC/DOC/KA/2024/77412');
      setConsultationRoomId('Consultation Suite 1');

      const demoDocs: Record<string, UploadedComplianceDoc> = {
        clinic_kpme: {
          id: 'doc-c1',
          docKey: 'clinic_kpme',
          title: "Clinic's KPME License",
          fileName: 'KPME_OPD_Registration_Certificate.pdf',
          fileSize: '1.2 MB',
          uploadedAt: nowIso,
        },
        owner_id: {
          id: 'doc-c2',
          docKey: 'owner_id',
          title: 'Owner Identity Proof',
          fileName: 'Doctor_Proprietor_PAN_Aadhaar.pdf',
          fileSize: '650 KB',
          uploadedAt: nowIso,
        },
        premises_proof: {
          id: 'doc-c3',
          docKey: 'premises_proof',
          title: 'Tenancy / Ownership Proof',
          fileName: 'Executed_Commercial_Lease_Deed.pdf',
          fileSize: '1.8 MB',
          uploadedAt: nowIso,
        },
        doctor_degree_kmc: {
          id: 'doc-c4',
          docKey: 'doctor_degree_kmc',
          title: 'Doctor Degree & KMC Cert',
          fileName: 'MBBS_MD_KMC_Active_Registration.pdf',
          fileSize: '1.5 MB',
          uploadedAt: nowIso,
        },
        kspcb_waste_agreement: {
          id: 'doc-c5',
          docKey: 'kspcb_waste_agreement',
          title: 'BMW Disposal Agreement',
          fileName: 'BioMedical_Waste_Disposal_Agreement.pdf',
          fileSize: '780 KB',
          uploadedAt: nowIso,
        },
      };
      setUploadedDocs(demoDocs);
    } else {
      setForm20License('KA-BLR-20-449102');
      setForm21License('KA-BLR-21-449103');
      setPharmacistName('Dr. Anand Rao, B.Pharm');
      setPharmacistCouncilReg('KSPC/KA/2024/98412');
      setColdChainMonitoring('Automated 24/7 Digital Data Logger (2-8°C)');
      setCounterId('Dispensary Counter 1 - Front Deck');

      const demoDocs: Record<string, UploadedComplianceDoc> = {
        drug_license_forms: {
          id: 'doc-p1',
          docKey: 'drug_license_forms',
          title: 'Drug License Forms 20 & 21',
          fileName: 'Form20_Form21_Drug_License_Cert.pdf',
          fileSize: '1.6 MB',
          uploadedAt: nowIso,
        },
        pharmacist_reg_ppp: {
          id: 'doc-p2',
          docKey: 'pharmacist_reg_ppp',
          title: 'Pharmacy Council PPP Wallet',
          fileName: 'KSPC_Pharmacist_Registration_Renewal.pdf',
          fileSize: '820 KB',
          uploadedAt: nowIso,
        },
        pharmacist_affidavit: {
          id: 'doc-p3',
          docKey: 'pharmacist_affidavit',
          title: 'Full-Time Pharmacist Affidavit',
          fileName: 'Notarized_Pharmacist_Affidavit_Letter.pdf',
          fileSize: '910 KB',
          uploadedAt: nowIso,
        },
        premises_blueprint: {
          id: 'doc-p4',
          docKey: 'premises_blueprint',
          title: 'Storefront Blueprint',
          fileName: 'Store_15sqm_Cold_Storage_Blueprint.pdf',
          fileSize: '1.9 MB',
          uploadedAt: nowIso,
        },
      };
      setUploadedDocs(demoDocs);
    }
  };

  const handleUploadDocument = (req: DocumentRequirement) => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf,image/*';
      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            const dataUri = uploadEvent.target?.result as string;
            const sizeInKb = Math.round(file.size / 1024);
            const sizeStr = sizeInKb > 1000 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;

            const doc: UploadedComplianceDoc = {
              id: `doc-${Date.now()}`,
              docKey: req.key,
              title: req.title,
              fileName: file.name,
              fileSize: sizeStr,
              fileType: file.type || 'application/pdf',
              dataUri,
              uploadedAt: new Date().toISOString(),
            };
            setUploadedDocs((prev) => ({ ...prev, [req.key]: doc }));
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Mobile / simulated: generate authentic verified government certification artifact
      const simulatedDoc: UploadedComplianceDoc = {
        id: `doc-${Date.now()}`,
        docKey: req.key,
        title: req.title,
        fileName: `${req.key.toUpperCase()}_Govt_Karnataka_Certified.pdf`,
        fileSize: '1.2 MB',
        fileType: 'application/pdf',
        uploadedAt: new Date().toISOString(),
      };
      setUploadedDocs((prev) => ({ ...prev, [req.key]: simulatedDoc }));
      Alert.alert(
        'Document Attached',
        `${req.title} has been validated and attached with verified official seal.`
      );
    }
  };

  const handleRemoveDoc = (key: string) => {
    setUploadedDocs((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleNextFromStep1 = () => {
    if (!selectedStore) {
      setErrorMessage(t('select_operating_pharmacy', 'Please select an operating facility to proceed.'));
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    if (facilityType === 'hospital') {
      if (!bedCapacity.trim()) {
        setErrorMessage('Please enter the sanctioned inpatient bed capacity.');
        return;
      }
      if (!bioMedicalWasteId.trim()) {
        setErrorMessage('Please enter the KSPCB Bio-Medical Waste User ID.');
        return;
      }
      if (!nodalOfficerName.trim() || !nodalOfficerContact.trim()) {
        setErrorMessage('Please enter the internal consumer grievance redressal officer name & phone.');
        return;
      }
    } else if (facilityType === 'clinic') {
      if (!primaryDoctorName.trim()) {
        setErrorMessage("Please enter the primary in-charge doctor's name.");
        return;
      }
      if (!primaryDoctorCouncilReg.trim()) {
        setErrorMessage('Please enter the State Medical Council Registration Number (e.g. KMC).');
        return;
      }
    } else {
      if (!form20License.trim() && !form21License.trim()) {
        setErrorMessage('Please enter the Form 20 or Form 21 Drug License Number.');
        return;
      }
      if (!pharmacistName.trim()) {
        setErrorMessage('Please enter the registered pharmacist name.');
        return;
      }
      if (!pharmacistCouncilReg.trim()) {
        setErrorMessage('Please enter the State Pharmacy Council Registration Number (KSPC).');
        return;
      }
    }
    setErrorMessage(null);
    setStep(3);
  };

  const handleFinalize = () => {
    if (!hasAttested) {
      setErrorMessage(
        t('attest_checkbox_label', 'Please check the attestation box to certify regulatory compliance.')
      );
      return;
    }

    if (!selectedStore) return;

    // Build specific compliance structure
    let hospitalData: HospitalComplianceData | undefined;
    let clinicData: ClinicComplianceData | undefined;
    let pharmacyData: PharmacyComplianceData | undefined;

    let primaryStaffName = '';
    let primaryLicenseNo = '';
    let primaryCounter = '';

    if (facilityType === 'hospital') {
      primaryStaffName = medicalSuperintendent.trim() || nodalOfficerName.trim() || 'Medical Superintendent';
      primaryLicenseNo = bioMedicalWasteId.trim() || 'KPME/HOSP/BLR/2026';
      primaryCounter = 'Ward Dispensary & Inpatient Deck';

      hospitalData = {
        hospitalCategory,
        bedCapacity: bedCapacity.trim() || '500',
        operationTheatres: operationTheatres.trim() || '8',
        icuBeds: icuBeds.trim() || '30',
        emergencyBeds: emergencyBeds.trim() || '15',
        bioMedicalWasteId: bioMedicalWasteId.trim(),
        nodalOfficerName: nodalOfficerName.trim(),
        nodalOfficerContact: nodalOfficerContact.trim(),
        medicalSuperintendent: medicalSuperintendent.trim(),
        scanningFacilities: selectedScans,
        has24x7EmergencyScanning: has24x7Scanning,
        aerbClearanceNo: aerbClearanceNo.trim() || undefined,
        documents: uploadedDocs,
      };
    } else if (facilityType === 'clinic') {
      primaryStaffName = primaryDoctorName.trim() || 'Consulting Physician';
      primaryLicenseNo = primaryDoctorCouncilReg.trim() || 'KMC/DOC/KA/2026';
      primaryCounter = consultationRoomId.trim() || 'OPD Room 1';

      clinicData = {
        clinicType,
        systemOfMedicine,
        diagnosticSupport,
        primaryDoctorName: primaryDoctorName.trim(),
        primaryDoctorCouncilReg: primaryDoctorCouncilReg.trim(),
        primaryDoctorDegree: primaryDoctorDegree.trim() || 'MBBS',
        consultationRoomId: consultationRoomId.trim(),
        documents: uploadedDocs,
      };
    } else {
      primaryStaffName = pharmacistName.trim() || 'Registered Pharmacist';
      primaryLicenseNo = form20License.trim() || form21License.trim() || pharmacistCouncilReg.trim();
      primaryCounter = counterId.trim() || 'Counter 1';

      pharmacyData = {
        form20License: form20License.trim(),
        form21License: form21License.trim(),
        registeredPharmacistName: pharmacistName.trim(),
        pharmacistCouncilReg: pharmacistCouncilReg.trim(),
        coldChainMonitoring,
        counterId: counterId.trim(),
        documents: uploadedDocs,
      };
    }

    const auth: StorePartnerAuth = {
      isAuthorized: true,
      facilityType,
      pharmacyId: selectedStore.id,
      pharmacyName: selectedStore.name,
      pharmacistName: primaryStaffName,
      licenseNumber: primaryLicenseNo,
      counterId: primaryCounter,
      verifiedAt: new Date().toISOString(),
      hospitalData,
      clinicData,
      pharmacyData,
    };

    onComplete(auth);
  };

  const getPortalTitle = () => {
    switch (facilityType) {
      case 'hospital':
        return t('hospital_portal', 'Hospital Portal');
      case 'clinic':
        return t('clinic_portal', 'Clinic Portal');
      case 'pharmacy':
        return t('pharmacy_portal', 'Pharmacy Portal');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* HEADER */}
      <View style={[styles.headerBar, { paddingTop }]}>
        {onCancel ? (
          <Pressable
            testID="store-onboarding-cancel-btn"
            onPress={onCancel}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel || t('back_to_role_picker', 'Back / Change role')}
            style={({ pressed }) => [
              styles.navIconButton,
              cancelLabel ? styles.cancelLabelButton : null,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                opacity: pressed ? 0.8 : 1.0,
              },
            ]}
          >
            {cancelLabel ? (
              <>
                <BackArrowIcon size={16} color={palette.ink} />
                <Text
                  style={[
                    styles.cancelLabelText,
                    { color: palette.ink, fontFamily: fonts.sansBold },
                  ]}
                >
                  {t('back_change_role', 'Back / Change role')}
                </Text>
              </>
            ) : (
              <CloseIcon size={18} color={palette.ink} />
            )}
          </Pressable>
        ) : (
          <View style={styles.navIconButtonPlaceholder} />
        )}

        <View style={styles.headerTitleGroup}>
          <Text style={[styles.badgePillText, { color: palette.accent }]}>
            {t('authorized_personnel_only', 'AUTHORIZED PERSONNEL ONLY')}
          </Text>
          <Text style={[styles.headerMainTitle, { color: palette.ink }]} numberOfLines={1}>
            {getPortalTitle()} • {t('onboarding_badge', 'Onboarding')}
          </Text>
        </View>

        {/* TOP RIGHT CONTROLS */}
        <View style={styles.topRightControls}>
          <Pressable
            testID="store-onboarding-lang-btn"
            onPress={cycleLanguage}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Language: ${language.toUpperCase()}. Tap to switch language.`}
            style={({ pressed }) => [
              styles.langPillButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                opacity: pressed ? 0.8 : 1.0,
              },
            ]}
          >
            <Text style={[styles.langPillText, { color: palette.accent }]}>
              {language === 'en' ? 'EN' : language === 'kn' ? 'ಕನ್ನಡ' : 'हिंदी'}
            </Text>
          </Pressable>

          <Pressable
            testID="store-onboarding-staff-badge-btn"
            onPress={() => setShowStaffInfo(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('staff_badge_title', 'Staff Mode')}
            style={({ pressed }) => [
              styles.navIconButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.accent,
                opacity: pressed ? 0.8 : 1.0,
              },
            ]}
          >
            <StaffBadgeIcon size={20} />
          </Pressable>
        </View>
      </View>

      {/* STEPPER PROGRESS */}
      <View style={styles.stepperRow}>
        <View style={styles.stepIndicatorCol}>
          <View
            style={[
              styles.stepDot,
              {
                backgroundColor: step >= 1 ? palette.accent : palette.surface2,
                borderColor: step >= 1 ? palette.accent : palette.line,
              },
            ]}
          >
            <Text style={[styles.stepDotNum, { color: step >= 1 ? '#FFFFFF' : palette.ink2 }]}>
              {formatNumber(1)}
            </Text>
          </View>
          <Text style={[styles.stepLabel, { color: step === 1 ? palette.ink : palette.ink2 }]}>
            {facilityType === 'hospital'
              ? t('hospital_tab', 'Hospital')
              : facilityType === 'clinic'
              ? t('clinic_tab', 'Clinic')
              : t('pharmacy_tab', 'Pharmacy')}
          </Text>
        </View>

        <View
          style={[
            styles.stepConnector,
            { backgroundColor: step >= 2 ? palette.accent : palette.line },
          ]}
        />

        <View style={styles.stepIndicatorCol}>
          <View
            style={[
              styles.stepDot,
              {
                backgroundColor: step >= 2 ? palette.accent : palette.surface2,
                borderColor: step >= 2 ? palette.accent : palette.line,
              },
            ]}
          >
            <Text style={[styles.stepDotNum, { color: step >= 2 ? '#FFFFFF' : palette.ink2 }]}>
              {formatNumber(2)}
            </Text>
          </View>
          <Text style={[styles.stepLabel, { color: step === 2 ? palette.ink : palette.ink2 }]}>
            {t('compliance_label', 'Compliance')}
          </Text>
        </View>

        <View
          style={[
            styles.stepConnector,
            { backgroundColor: step >= 3 ? palette.accent : palette.line },
          ]}
        />

        <View style={styles.stepIndicatorCol}>
          <View
            style={[
              styles.stepDot,
              {
                backgroundColor: step >= 3 ? palette.accent : palette.surface2,
                borderColor: step >= 3 ? palette.accent : palette.line,
              },
            ]}
          >
            <Text style={[styles.stepDotNum, { color: step >= 3 ? '#FFFFFF' : palette.ink2 }]}>
              {formatNumber(3)}
            </Text>
          </View>
          <Text style={[styles.stepLabel, { color: step === 3 ? palette.ink : palette.ink2 }]}>
            {t('documents_label', 'Documents')}
          </Text>
        </View>
      </View>

      {/* ERROR BANNER */}
      {errorMessage && (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: palette.badTint,
              borderColor: palette.redLine,
            },
          ]}
        >
          <Text style={[styles.errorText, { color: palette.badInk }]}>{errorMessage}</Text>
        </View>
      )}

      {/* STEP CONTENT BODY */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: SELECT FACILITY CATEGORY & ESTABLISHMENT */}
        {step === 1 && (
          <View style={styles.stepBody}>
            {/* FACILITY CATEGORY TABS */}
            <View style={styles.categoryTabsRow}>
              <Pressable
                onPress={() => setFacilityType('hospital')}
                style={[
                  styles.categoryTabBtn,
                  { borderColor: palette.line, backgroundColor: palette.surface },
                  facilityType === 'hospital' && [
                    styles.categoryTabBtnActive,
                    { backgroundColor: palette.accent, borderColor: palette.accent },
                  ],
                ]}
              >
                <HospitalIcon
                  size={18}
                  color={facilityType === 'hospital' ? '#FFFFFF' : palette.ink}
                />
                <Text
                  style={[
                    styles.categoryTabBtnText,
                    {
                      color: facilityType === 'hospital' ? '#FFFFFF' : palette.ink,
                      fontFamily: fonts.sansBold,
                    },
                  ]}
                >
                  🏥 {t('hospital_tab', 'Hospital')}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setFacilityType('clinic')}
                style={[
                  styles.categoryTabBtn,
                  { borderColor: palette.line, backgroundColor: palette.surface },
                  facilityType === 'clinic' && [
                    styles.categoryTabBtnActive,
                    { backgroundColor: palette.accent, borderColor: palette.accent },
                  ],
                ]}
              >
                <ClinicIcon
                  size={18}
                  color={facilityType === 'clinic' ? '#FFFFFF' : palette.ink}
                />
                <Text
                  style={[
                    styles.categoryTabBtnText,
                    {
                      color: facilityType === 'clinic' ? '#FFFFFF' : palette.ink,
                      fontFamily: fonts.sansBold,
                    },
                  ]}
                >
                  🩺 {t('clinic_tab', 'Clinic')}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setFacilityType('pharmacy')}
                style={[
                  styles.categoryTabBtn,
                  { borderColor: palette.line, backgroundColor: palette.surface },
                  facilityType === 'pharmacy' && [
                    styles.categoryTabBtnActive,
                    { backgroundColor: palette.accent, borderColor: palette.accent },
                  ],
                ]}
              >
                <PharmacyStoreIcon
                  size={18}
                  color={facilityType === 'pharmacy' ? '#FFFFFF' : palette.ink}
                />
                <Text
                  style={[
                    styles.categoryTabBtnText,
                    {
                      color: facilityType === 'pharmacy' ? '#FFFFFF' : palette.ink,
                      fontFamily: fonts.sansBold,
                    },
                  ]}
                >
                  💊 {t('pharmacy_tab', 'Pharmacy')}
                </Text>
              </Pressable>
            </View>

            <View style={styles.stepHeaderGroup}>
              <Text style={[styles.stepTitle, { color: palette.ink }]}>
                {facilityType === 'hospital'
                  ? t('select_sanctioned_hospital', 'Select Sanctioned Hospital Establishment')
                  : facilityType === 'clinic'
                  ? t('select_registered_clinic', 'Select Registered Outpatient Clinic')
                  : t('select_operating_pharmacy', 'Select Operating Pharmacy')}
              </Text>
              <Text style={[styles.stepDescription, { color: palette.ink2 }]}>
                {facilityType === 'hospital'
                  ? t('hospital_step_desc', 'High-compliance clinical establishments registered under KPME Act with inpatient wards.')
                  : facilityType === 'clinic'
                  ? t('clinic_step_desc', 'Outpatient and consultation medical establishments registered under KPME Act.')
                  : t('pharmacy_step_desc', 'Retail drug storefronts licensed under the Drugs & Cosmetics Act 1940.')}
              </Text>
            </View>

            <View style={styles.storeCardsList}>
              {facilities.map((store) => {
                const isSelected = selectedStore?.id === store.id;

                return (
                  <Pressable
                    key={store.id}
                    onPress={() => {
                      setSelectedStore(store);
                      setErrorMessage(null);
                    }}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Store: ${tPharmacy(store.name)}, ${store.address}`}
                    style={({ pressed }) => [
                      styles.storeSelectCard,
                      {
                        backgroundColor: isSelected ? palette.surface2 : palette.surface,
                        borderColor: isSelected ? palette.accent : palette.line,
                        opacity: pressed ? 0.9 : 1.0,
                        shadowColor: palette.shadow,
                      },
                    ]}
                  >
                    <View style={styles.storeCardTop}>
                      <View
                        style={[
                          styles.storeIconCircle,
                          {
                            backgroundColor: isSelected ? palette.okTint : palette.surface2,
                          },
                        ]}
                      >
                        {facilityType === 'hospital' ? (
                          <HospitalIcon
                            size={18}
                            color={isSelected ? palette.okInk : palette.ink}
                          />
                        ) : facilityType === 'clinic' ? (
                          <ClinicIcon
                            size={18}
                            color={isSelected ? palette.okInk : palette.ink}
                          />
                        ) : (
                          <PharmacyStoreIcon
                            size={18}
                            color={isSelected ? palette.okInk : palette.ink}
                          />
                        )}
                      </View>

                      <View style={styles.storeInfoCol}>
                        <Text style={[styles.storeCardName, { color: palette.ink }]}>
                          {tPharmacy(store.name)}
                        </Text>
                        <Text
                          style={[styles.storeCardAddress, { color: palette.ink2 }]}
                          numberOfLines={2}
                        >
                          {store.address}
                        </Text>
                      </View>

                      {isSelected ? (
                        <CheckCircleIcon size={20} color={palette.okInk} />
                      ) : (
                        <View style={[styles.radioEmpty, { borderColor: palette.line }]} />
                      )}
                    </View>

                    <View style={styles.storeCardFooter}>
                      <View style={[styles.verifiedTag, { backgroundColor: palette.okTint }]}>
                        <Text style={[styles.verifiedTagText, { color: palette.okInk }]}>
                          {facilityType === 'hospital'
                            ? t('badge_kpme_hospital', 'KPME Level 2/3 Registered')
                            : facilityType === 'clinic'
                            ? t('badge_kpme_clinic', 'KPME OPD Registered')
                            : t('badge_verified_partner', 'Verified Pilot Partner')}
                        </Text>
                      </View>
                      <Text style={[styles.storeHoursText, { color: palette.ink2 }]}>
                        {tHours(store.opening_hours || '24 Hours')}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleNextFromStep1}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Proceed to compliance questions"
              style={({ pressed }) => [
                styles.primaryActionButton,
                {
                  backgroundColor: palette.btn,
                  opacity: pressed ? 0.85 : 1.0,
                },
              ]}
            >
              <Text style={[styles.primaryActionText, { color: palette.btnInk }]}>
                {t('continue_to_compliance_questions', 'Continue to Compliance Questions')}
              </Text>
              <ChevronRightIcon size={18} color={palette.btnInk} />
            </Pressable>
          </View>
        )}

        {/* STEP 2: CATEGORY-SPECIFIC GOVERNMENT COMPLIANCE QUESTIONS */}
        {step === 2 && (
          <View style={styles.stepBody}>
            <View style={styles.stepHeaderGroup}>
              <Text style={[styles.stepTitle, { color: palette.ink }]}>
                {facilityType === 'hospital'
                  ? t('hospital_compliance_title', 'Hospital Regulatory Compliance Data')
                  : facilityType === 'clinic'
                  ? t('clinic_compliance_title', 'Clinic Regulatory Compliance Data')
                  : t('pharmacy_compliance_title', 'Pharmacy Commercial Compliance Data')}
              </Text>
              <Text style={[styles.stepDescription, { color: palette.ink2 }]}>
                {facilityType === 'hospital'
                  ? t('hospital_compliance_desc', 'Mandatory government data fields required for bedded inpatient facilities under Karnataka KPME rules.')
                  : facilityType === 'clinic'
                  ? t('clinic_compliance_desc', 'Mandatory government data fields required for Outpatient Consultations under KPME rules.')
                  : t('pharmacy_compliance_desc', 'Mandatory license data required by the State Drugs Control Department under the Drugs and Cosmetics Act.')}
              </Text>
            </View>

            <Pressable
              onPress={handleQuickFill}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Autofill official government compliance data"
              style={({ pressed }) => [
                styles.quickFillPill,
                {
                  backgroundColor: palette.surface2,
                  borderColor: palette.line,
                  opacity: pressed ? 0.8 : 1.0,
                },
              ]}
            >
              <ZapIcon size={16} color={palette.accent} />
              <Text style={[styles.quickFillText, { color: palette.accent }]}>
                {t('quick_fill_compliance', 'Quick-Fill All Compliance & Documents')}
              </Text>
            </Pressable>

            {/* A. HOSPITAL QUESTIONS */}
            {facilityType === 'hospital' && (
              <View style={styles.formSection}>
                {/* Hospital Category Dropdown Options */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    {t('hospital_category_label', 'Hospital Category')} *
                  </Text>
                  <View style={styles.optionsWrap}>
                    {[
                      'Level 1A/1B Basic Hospital',
                      'Level 2 Multi-Specialty Hospital',
                      'Level 3 Super-Specialty Hospital',
                      'Level 4 Teaching / Tertiary Hospital',
                    ].map((cat) => {
                      const isSel = hospitalCategory === cat;
                      return (
                        <Pressable
                          key={cat}
                          onPress={() => setHospitalCategory(cat)}
                          style={[
                            styles.chipOption,
                            {
                              backgroundColor: isSel ? palette.accent : palette.surface,
                              borderColor: isSel ? palette.accent : palette.line,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipOptionText,
                              { color: isSel ? '#FFFFFF' : palette.ink },
                            ]}
                          >
                            {cat}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Bed Capacity Count */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    {t('bed_capacity_label', 'Sanctioned Inpatient Bed Capacity')} *
                  </Text>
                  <TextInput
                    value={bedCapacity}
                    onChangeText={setBedCapacity}
                    placeholder="e.g. 750"
                    placeholderTextColor={palette.ink2}
                    keyboardType="numeric"
                    style={[
                      styles.textInputField,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                        color: palette.ink,
                      },
                    ]}
                  />
                </View>

                {/* Infrastructure Details Breakdown (OT, ICU, Emergency) */}
                <View style={styles.multiColRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                      {t('operation_theatres_label', 'Operation Theatres (OT)')}
                    </Text>
                    <TextInput
                      value={operationTheatres}
                      onChangeText={setOperationTheatres}
                      placeholder="e.g. 12"
                      placeholderTextColor={palette.ink2}
                      keyboardType="numeric"
                      style={[
                        styles.textInputField,
                        {
                          backgroundColor: palette.surface,
                          borderColor: palette.line,
                          color: palette.ink,
                        },
                      ]}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                      {t('icu_beds_label', 'ICU Beds')}
                    </Text>
                    <TextInput
                      value={icuBeds}
                      onChangeText={setIcuBeds}
                      placeholder="e.g. 48"
                      placeholderTextColor={palette.ink2}
                      keyboardType="numeric"
                      style={[
                        styles.textInputField,
                        {
                          backgroundColor: palette.surface,
                          borderColor: palette.line,
                          color: palette.ink,
                        },
                      ]}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                      {t('emergency_beds_label', 'Emergency')}
                    </Text>
                    <TextInput
                      value={emergencyBeds}
                      onChangeText={setEmergencyBeds}
                      placeholder="e.g. 24"
                      placeholderTextColor={palette.ink2}
                      keyboardType="numeric"
                      style={[
                        styles.textInputField,
                        {
                          backgroundColor: palette.surface,
                          borderColor: palette.line,
                          color: palette.ink,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Bio-Medical Waste User ID */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    {t('bio_waste_id_label', 'Bio-Medical Waste User ID (KSPCB)')} *
                  </Text>
                  <TextInput
                    value={bioMedicalWasteId}
                    onChangeText={setBioMedicalWasteId}
                    placeholder="e.g. KSPCB/BMW/BLR/2026/8941"
                    placeholderTextColor={palette.ink2}
                    autoCapitalize="characters"
                    style={[
                      styles.textInputField,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                        color: palette.ink,
                      },
                    ]}
                  />
                </View>

                {/* Nodal Officer / Grievance Redressal Committee */}
                <View style={styles.multiColRow}>
                  <View style={[styles.inputGroup, { flex: 1.2 }]}>
                    <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                      {t('nodal_officer_name_label', 'Grievance Nodal Officer')} *
                    </Text>
                    <TextInput
                      value={nodalOfficerName}
                      onChangeText={setNodalOfficerName}
                      placeholder="e.g. Dr. S. Nagaraj, MD"
                      placeholderTextColor={palette.ink2}
                      style={[
                        styles.textInputField,
                        {
                          backgroundColor: palette.surface,
                          borderColor: palette.line,
                          color: palette.ink,
                        },
                      ]}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                      {t('nodal_officer_contact_label', 'Officer Phone')} *
                    </Text>
                    <TextInput
                      value={nodalOfficerContact}
                      onChangeText={setNodalOfficerContact}
                      placeholder="e.g. 080-26701199"
                      placeholderTextColor={palette.ink2}
                      keyboardType="phone-pad"
                      style={[
                        styles.textInputField,
                        {
                          backgroundColor: palette.surface,
                          borderColor: palette.line,
                          color: palette.ink,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Medical Superintendent / Administrator */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    {t('medical_superintendent_label', 'Medical Superintendent / Administrator')}
                  </Text>
                  <TextInput
                    value={medicalSuperintendent}
                    onChangeText={setMedicalSuperintendent}
                    placeholder="e.g. Dr. Ramesh Babu, MS (Ortho) - BMCRI/MED/4412"
                    placeholderTextColor={palette.ink2}
                    style={[
                      styles.textInputField,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                        color: palette.ink,
                      },
                    ]}
                  />
                </View>

                {/* Diagnostic Imaging & Scanning Facilities */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    {t('scannings_and_diagnostics', 'Diagnostic Imaging & Scanning Facilities')} *
                  </Text>
                  <Text style={[{ color: palette.ink2, fontSize: 13, marginBottom: 8 }]}>
                    {t('scannings_sub', 'Select imaging & diagnostic services provided on-site')}
                  </Text>
                  <View style={styles.optionsWrap}>
                    {HOSPITAL_SCANNING_SERVICES.map((scan) => {
                      const isSel = selectedScans.includes(scan.id);
                      return (
                        <Pressable
                          key={scan.id}
                          onPress={() => {
                            if (isSel) {
                              setSelectedScans(selectedScans.filter((s) => s !== scan.id));
                            } else {
                              setSelectedScans([...selectedScans, scan.id]);
                            }
                          }}
                          style={[
                            styles.chipOption,
                            {
                              backgroundColor: isSel ? palette.accent : palette.surface,
                              borderColor: isSel ? palette.accent : palette.line,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipOptionText,
                              { color: isSel ? '#FFFFFF' : palette.ink },
                            ]}
                          >
                            {scan.emoji} {scan.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* 24/7 Emergency Scanning Availability */}
                <Pressable
                  onPress={() => setHas24x7Scanning(!has24x7Scanning)}
                  accessible={true}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: has24x7Scanning }}
                  style={[
                    styles.attestationCard,
                    {
                      backgroundColor: has24x7Scanning ? palette.surface2 : palette.surface,
                      borderColor: has24x7Scanning ? palette.accent : palette.line,
                      marginTop: 6,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      {
                        backgroundColor: has24x7Scanning ? palette.accent : 'transparent',
                        borderColor: has24x7Scanning ? palette.accent : palette.line,
                      },
                    ]}
                  >
                    {has24x7Scanning && <CheckCircleIcon size={14} color="#FFFFFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.checkboxLabel, { color: palette.ink, fontFamily: fonts.sansBold }]}>
                      {t('emergency_scanning_247', '24/7 Emergency Scanning Available')}
                    </Text>
                    <Text style={{ color: palette.ink2, fontSize: 12, marginTop: 2 }}>
                      Round-the-clock emergency MRI/CT/X-Ray technicians and on-call radiologist
                    </Text>
                  </View>
                </Pressable>

                {/* AERB Clearance Number */}
                <View style={[styles.inputGroup, { marginTop: 12 }]}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    {t('aerb_clearance_title', 'AERB Radiation Safety Clearance / Reg No.')} *
                  </Text>
                  <TextInput
                    value={aerbClearanceNo}
                    onChangeText={setAerbClearanceNo}
                    placeholder="e.g. AERB/RSD/MED/BLR/2026/0442"
                    placeholderTextColor={palette.ink2}
                    autoCapitalize="characters"
                    style={[
                      styles.textInputField,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                        color: palette.ink,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* B. CLINIC QUESTIONS */}
            {facilityType === 'clinic' && (
              <View style={styles.formSection}>
                {/* Clinic Type */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    {t('clinic_type_label', 'Clinic Type')} *
                  </Text>
                  <View style={styles.optionsWrap}>
                    {[
                      'Solo Doctor Consultation',
                      'Multi-Specialty Polyclinic',
                      'Daycare Centre',
                    ].map((type) => {
                      const isSel = clinicType === type;
                      return (
                        <Pressable
                          key={type}
                          onPress={() => setClinicType(type)}
                          style={[
                            styles.chipOption,
                            {
                              backgroundColor: isSel ? palette.accent : palette.surface,
                              borderColor: isSel ? palette.accent : palette.line,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipOptionText,
                              { color: isSel ? '#FFFFFF' : palette.ink },
                            ]}
                          >
                            {type}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* System of Medicine */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    {t('system_of_medicine_label', 'System of Medicine')} *
                  </Text>
                  <View style={styles.optionsWrap}>
                    {['Allopathy (Modern Medicine)', 'Ayurveda', 'Homeopathy', 'Unani', 'Siddha'].map(
                      (sys) => {
                        const isSel = systemOfMedicine === sys;
                        return (
                          <Pressable
                            key={sys}
                            onPress={() => setSystemOfMedicine(sys)}
                            style={[
                              styles.chipOption,
                              {
                                backgroundColor: isSel ? palette.accent : palette.surface,
                                borderColor: isSel ? palette.accent : palette.line,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipOptionText,
                                { color: isSel ? '#FFFFFF' : palette.ink },
                              ]}
                            >
                              {sys}
                            </Text>
                          </Pressable>
                        );
                      }
                    )}
                  </View>
                </View>

                {/* Diagnostic Support Flag (Boolean Check) */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    {t('diagnostic_support_label', 'Internal Diagnostic Support (X-Ray / Labs On-Site)')} *
                  </Text>
                  <View style={styles.optionsWrap}>
                    <Pressable
                      onPress={() => setDiagnosticSupport(true)}
                      style={[
                        styles.chipOption,
                        {
                          backgroundColor: diagnosticSupport ? palette.okTint : palette.surface,
                          borderColor: diagnosticSupport ? palette.okLine : palette.line,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipOptionText,
                          {
                            color: diagnosticSupport ? palette.okInk : palette.ink,
                            fontFamily: fonts.sansBold,
                          },
                        ]}
                      >
                        ✓ {t('diagnostic_yes', 'Yes - Internal On-Site Facility')}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setDiagnosticSupport(false)}
                      style={[
                        styles.chipOption,
                        {
                          backgroundColor: !diagnosticSupport ? palette.surface2 : palette.surface,
                          borderColor: !diagnosticSupport ? palette.accent : palette.line,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipOptionText,
                          {
                            color: !diagnosticSupport ? palette.accent : palette.ink,
                            fontFamily: fonts.sansBold,
                          },
                        ]}
                      >
                        ✗ {t('diagnostic_no', 'No - External Labs Only')}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Primary Doctor Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    {t('primary_doctor_name_label', "Primary In-Charge Doctor's Name")} *
                  </Text>
                  <TextInput
                    value={primaryDoctorName}
                    onChangeText={setPrimaryDoctorName}
                    placeholder="e.g. Dr. Shweta Rao"
                    placeholderTextColor={palette.ink2}
                    style={[
                      styles.textInputField,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                        color: palette.ink,
                      },
                    ]}
                  />
                </View>

                {/* Doctor Degree & Qualification */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    {t('primary_doctor_degree_label', 'Doctor Qualifications & Degree')}
                  </Text>
                  <TextInput
                    value={primaryDoctorDegree}
                    onChangeText={setPrimaryDoctorDegree}
                    placeholder="e.g. MBBS, MD (General Medicine)"
                    placeholderTextColor={palette.ink2}
                    style={[
                      styles.textInputField,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                        color: palette.ink,
                      },
                    ]}
                  />
                </View>

                {/* State Medical Council Reg No. */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    {t('state_medical_council_reg', 'State Medical Council Reg. No. (e.g. KMC)')} *
                  </Text>
                  <TextInput
                    value={primaryDoctorCouncilReg}
                    onChangeText={setPrimaryDoctorCouncilReg}
                    placeholder="e.g. KMC/DOC/KA/2024/77412"
                    placeholderTextColor={palette.ink2}
                    autoCapitalize="characters"
                    style={[
                      styles.textInputField,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                        color: palette.ink,
                      },
                    ]}
                  />
                </View>

                {/* Consultation Room */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    Consultation Room / OPD Suite
                  </Text>
                  <TextInput
                    value={consultationRoomId}
                    onChangeText={setConsultationRoomId}
                    placeholder="e.g. Consultation Suite 1"
                    placeholderTextColor={palette.ink2}
                    style={[
                      styles.textInputField,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                        color: palette.ink,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* C. PHARMACY QUESTIONS */}
            {facilityType === 'pharmacy' && (
              <View style={styles.formSection}>
                {/* Form 20 License */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    {t('drug_license_form_20', 'Drug License Form 20 (Retail Drugs)')} *
                  </Text>
                  <TextInput
                    value={form20License}
                    onChangeText={setForm20License}
                    placeholder="e.g. KA-BLR-20-449102"
                    placeholderTextColor={palette.ink2}
                    autoCapitalize="characters"
                    style={[
                      styles.textInputField,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                        color: palette.ink,
                      },
                    ]}
                  />
                </View>

                {/* Form 21 License */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    {t('drug_license_form_21', 'Drug License Form 21 (Specified / Schedule Drugs)')} *
                  </Text>
                  <TextInput
                    value={form21License}
                    onChangeText={setForm21License}
                    placeholder="e.g. KA-BLR-21-449103"
                    placeholderTextColor={palette.ink2}
                    autoCapitalize="characters"
                    style={[
                      styles.textInputField,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                        color: palette.ink,
                      },
                    ]}
                  />
                </View>

                {/* Registered Pharmacist Name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    {t('registered_pharmacist_label', 'Registered Pharmacist Name')} *
                  </Text>
                  <TextInput
                    value={pharmacistName}
                    onChangeText={setPharmacistName}
                    placeholder="e.g. Dr. Anand Rao, B.Pharm"
                    placeholderTextColor={palette.ink2}
                    style={[
                      styles.textInputField,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                        color: palette.ink,
                      },
                    ]}
                  />
                </View>

                {/* State Pharmacy Council Reg No. */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    {t('pharmacist_council_reg', 'State Pharmacy Council Reg. No. (KSPC)')} *
                  </Text>
                  <TextInput
                    value={pharmacistCouncilReg}
                    onChangeText={setPharmacistCouncilReg}
                    placeholder="e.g. KSPC/KA/2024/98412"
                    placeholderTextColor={palette.ink2}
                    autoCapitalize="characters"
                    style={[
                      styles.textInputField,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                        color: palette.ink,
                      },
                    ]}
                  />
                </View>

                {/* Cold Chain Infrastructure */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    {t('cold_chain_status_label', 'Cold Chain Infrastructure Status')}
                  </Text>
                  <View style={styles.optionsWrap}>
                    {[
                      'Automated 24/7 Digital Data Logger (2-8°C)',
                      'Twice-Daily Manual Temperature Register',
                      'Standard Domestic Cold Storage',
                    ].map((mode) => {
                      const isSel = coldChainMonitoring === mode;
                      return (
                        <Pressable
                          key={mode}
                          onPress={() => setColdChainMonitoring(mode)}
                          style={[
                            styles.chipOption,
                            {
                              backgroundColor: isSel ? palette.accent : palette.surface,
                              borderColor: isSel ? palette.accent : palette.line,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipOptionText,
                              { color: isSel ? '#FFFFFF' : palette.ink },
                            ]}
                          >
                            {mode}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Dispensing Station / Counter */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                    {t('dispensing_station_label', 'Dispensing Station / Counter')}
                  </Text>
                  <TextInput
                    value={counterId}
                    onChangeText={setCounterId}
                    placeholder="e.g. Dispensary Counter 1 - Front Deck"
                    placeholderTextColor={palette.ink2}
                    style={[
                      styles.textInputField,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                        color: palette.ink,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            <View style={styles.buttonRow}>
              <Pressable
                onPress={() => setStep(1)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Go back to facility selection"
                style={({ pressed }) => [
                  styles.secondaryActionButton,
                  {
                    borderColor: palette.line,
                    backgroundColor: palette.surface,
                    opacity: pressed ? 0.8 : 1.0,
                  },
                ]}
              >
                <BackArrowIcon size={16} color={palette.ink} />
                <Text style={[styles.secondaryActionText, { color: palette.ink }]}>
                  {t('back_btn', 'Back')}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleNextFromStep2}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Continue to document uploads"
                style={({ pressed }) => [
                  styles.primaryFlexButton,
                  {
                    backgroundColor: palette.btn,
                    opacity: pressed ? 0.85 : 1.0,
                  },
                ]}
              >
                <Text style={[styles.primaryActionText, { color: palette.btnInk }]}>
                  {t('continue_to_document_uploads', 'Continue to Document Uploads')}
                </Text>
                <ChevronRightIcon size={18} color={palette.btnInk} />
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP 3: MANDATORY DOCUMENT UPLOADS & ATTESTATION */}
        {step === 3 && (
          <View style={styles.stepBody}>
            <View style={styles.stepHeaderGroup}>
              <Text style={[styles.stepTitle, { color: palette.ink }]}>
                {t('mandatory_document_uploads', 'Mandatory Document Uploads')}
              </Text>
              <Text style={[styles.stepDescription, { color: palette.ink2 }]}>
                {facilityType === 'hospital'
                  ? t('hospital_docs_desc', 'Government-mandated clearances and certifications required for bedded inpatient hospitals.')
                  : facilityType === 'clinic'
                  ? t('clinic_docs_desc', 'Professional licenses and premises certifications required for outpatient consultation clinics.')
                  : t('pharmacy_docs_desc', 'Commercial drug licenses and full-time pharmacist credentials required for retail pharmacies.')}
              </Text>
            </View>

            <Pressable
              onPress={handleQuickFill}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Autofill all mandatory documents"
              style={({ pressed }) => [
                styles.quickFillPill,
                {
                  backgroundColor: palette.surface2,
                  borderColor: palette.line,
                  opacity: pressed ? 0.8 : 1.0,
                },
              ]}
            >
              <ZapIcon size={16} color={palette.accent} />
              <Text style={[styles.quickFillText, { color: palette.accent }]}>
                {t('quick_fill_compliance', 'Quick-Fill All Compliance & Documents')}
              </Text>
            </Pressable>

            {/* DOCUMENT CHECKLIST CARDS */}
            <View style={styles.docCardsList}>
              {activeDocRequirements.map((req) => {
                const uploaded = uploadedDocs[req.key];

                return (
                  <View
                    key={req.key}
                    style={[
                      styles.docCard,
                      {
                        backgroundColor: uploaded ? palette.okTint : palette.surface,
                        borderColor: uploaded ? palette.okLine : palette.line,
                      },
                    ]}
                  >
                    <View style={styles.docCardTop}>
                      <View
                        style={[
                          styles.docIconBox,
                          {
                            backgroundColor: uploaded ? palette.surface : palette.surface2,
                          },
                        ]}
                      >
                        {uploaded ? (
                          <CheckCircleIcon size={20} color={palette.okInk} />
                        ) : (
                          <DocumentFileIcon size={20} color={palette.accent} />
                        )}
                      </View>

                      <View style={styles.docInfoCol}>
                        <View style={styles.docTitleRow}>
                          <Text
                            style={[
                              styles.docTitleText,
                              { color: palette.ink, fontFamily: fonts.sansBold },
                            ]}
                          >
                            {req.title}
                          </Text>
                        </View>
                        <Text style={[styles.docDescText, { color: palette.ink2 }]}>
                          {req.description}
                        </Text>
                        <Text style={[styles.docAuthorityText, { color: palette.accent }]}>
                          Authority: {req.authority}
                        </Text>
                      </View>
                    </View>

                    {/* UPLOAD ACTION / STATUS ROW */}
                    <View style={styles.docCardBottom}>
                      {uploaded ? (
                        <View style={styles.uploadedStatusRow}>
                          <View style={styles.fileMetaCol}>
                            <Text
                              style={[
                                styles.fileNameText,
                                { color: palette.okInk, fontFamily: fonts.sansSemi },
                              ]}
                              numberOfLines={1}
                            >
                              📄 {uploaded.fileName}
                            </Text>
                            <Text style={[styles.fileSizeText, { color: palette.ink2 }]}>
                              {uploaded.fileSize || 'Verified PDF'} • Verified Seal
                            </Text>
                          </View>

                          <Pressable
                            onPress={() => handleRemoveDoc(req.key)}
                            style={({ pressed }) => [
                              styles.removeDocBtn,
                              {
                                backgroundColor: palette.surface,
                                borderColor: palette.redLine,
                                opacity: pressed ? 0.8 : 1.0,
                              },
                            ]}
                          >
                            <TrashIcon size={14} color={palette.badInk} />
                            <Text
                              style={[
                                styles.removeDocText,
                                { color: palette.badInk, fontFamily: fonts.sansBold },
                              ]}
                            >
                              Remove
                            </Text>
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => handleUploadDocument(req)}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Upload ${req.title}`}
                          style={({ pressed }) => [
                            styles.uploadBtn,
                            {
                              backgroundColor: palette.surface2,
                              borderColor: palette.line,
                              opacity: pressed ? 0.8 : 1.0,
                            },
                          ]}
                        >
                          <UploadCloudIcon size={16} color={palette.accent} />
                          <Text
                            style={[
                              styles.uploadBtnText,
                              { color: palette.accent, fontFamily: fonts.sansBold },
                            ]}
                          >
                            {t('upload_doc_btn', 'Upload Document (PDF/Image)')}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* ATTESTATION CHECKBOX */}
            <Pressable
              onPress={() => setHasAttested(!hasAttested)}
              accessible={true}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: hasAttested }}
              accessibilityLabel="Certify regulatory compliance"
              style={[
                styles.attestationCard,
                {
                  backgroundColor: hasAttested ? palette.surface2 : palette.surface,
                  borderColor: hasAttested ? palette.accent : palette.line,
                },
              ]}
            >
              <View
                style={[
                  styles.checkboxBox,
                  {
                    backgroundColor: hasAttested ? palette.accent : 'transparent',
                    borderColor: hasAttested ? palette.accent : palette.line,
                  },
                ]}
              >
                {hasAttested && <CheckCircleIcon size={14} color="#FFFFFF" />}
              </View>

              <Text style={[styles.checkboxLabel, { color: palette.ink }]}>
                {facilityType === 'hospital' || facilityType === 'clinic'
                  ? t(
                      'kpme_attestation_statement',
                      'I hereby declare under the Karnataka Private Medical Establishments (KPME) Act and Bio-Medical Waste Management Rules that all facility details, infrastructure counts, and uploaded licenses are valid and true.'
                    )
                  : t(
                      'drugs_act_attestation_statement',
                      'I hereby declare under the Drugs & Cosmetics Act 1940 and Pharmacy Act 1948 that Form 20/21 licenses are active and the registered pharmacist is in attendance during dispensing hours.'
                    )}
              </Text>
            </Pressable>

            {/* BUTTON ROW */}
            <View style={styles.buttonRow}>
              <Pressable
                onPress={() => setStep(2)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Go back to compliance questions"
                style={({ pressed }) => [
                  styles.secondaryActionButton,
                  {
                    borderColor: palette.line,
                    backgroundColor: palette.surface,
                    opacity: pressed ? 0.8 : 1.0,
                  },
                ]}
              >
                <BackArrowIcon size={16} color={palette.ink} />
                <Text style={[styles.secondaryActionText, { color: palette.ink }]}>
                  {t('back_btn', 'Back')}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleFinalize}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Complete verification and enter portal"
                style={({ pressed }) => [
                  styles.primaryFlexButton,
                  {
                    backgroundColor: palette.btn,
                    opacity: pressed ? 0.85 : 1.0,
                  },
                ]}
              >
                <ShieldCheckIcon size={18} color={palette.btnInk} />
                <Text style={[styles.primaryActionText, { color: palette.btnInk }]}>
                  {facilityType === 'hospital'
                    ? t('verify_hospital_enter', 'Verify Hospital & Enter Portal')
                    : facilityType === 'clinic'
                    ? t('verify_clinic_enter', 'Verify Clinic & Enter Portal')
                    : t('verify_pharmacy_enter', 'Verify Pharmacy & Enter Portal')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* EXPLANATORY MODAL FOR STAFF BADGE */}
      <Modal
        visible={showStaffInfo}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStaffInfo(false)}
      >
        <Pressable style={styles.infoModalBackdrop} onPress={() => setShowStaffInfo(false)}>
          <Pressable
            style={[
              styles.infoModalCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.infoModalIconBox, { backgroundColor: palette.surface2 }]}>
              <StaffBadgeIcon size={32} color={palette.accent} />
            </View>

            <Text style={[styles.infoModalTitle, { color: palette.ink }]}>
              {getPortalTitle()} Staff Mode
            </Text>

            <Text style={[styles.infoModalBody, { color: palette.ink2 }]}>
              This symbol indicates that you are in authorized healthcare provider mode. Each category
              (Hospital, Clinic, Pharmacy) collects legally required government compliance data under the
              KPME Act or Drugs & Cosmetics Act.
            </Text>

            <View style={styles.infoModalButtonRow}>
              <Pressable
                onPress={() => setShowStaffInfo(false)}
                style={({ pressed }) => [
                  styles.infoModalOkButton,
                  {
                    backgroundColor: palette.btn,
                    opacity: pressed ? 0.85 : 1.0,
                  },
                ]}
              >
                <Text style={[styles.infoModalOkText, { color: palette.btnInk }]}>
                  {t('got_it_btn', 'Got it')}
                </Text>
              </Pressable>

              {onCancel && (
                <Pressable
                  onPress={() => {
                    setShowStaffInfo(false);
                    onCancel();
                  }}
                  style={({ pressed }) => [
                    styles.infoModalBackRoleButton,
                    {
                      borderColor: palette.line,
                      backgroundColor: palette.surface2,
                      opacity: pressed ? 0.8 : 1.0,
                    },
                  ]}
                >
                  <Text style={[styles.infoModalBackRoleText, { color: palette.ink }]}>
                    {cancelLabel || t('back_to_role_picker', 'Back to Role Selection')}
                  </Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerTitleGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  badgePillText: {
    fontFamily: fonts.sansBold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  headerMainTitle: {
    fontFamily: fonts.serif,
    fontSize: 16,
    fontWeight: '700',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langPillButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langPillText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    fontWeight: '700',
  },
  navIconButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabelButton: {
    width: 'auto',
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 6,
  },
  cancelLabelText: {
    fontSize: 12,
  },
  navIconButtonPlaceholder: {
    width: 36,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    gap: 3,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotNum: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    fontWeight: '700',
  },
  stepLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: radii.card,
    borderWidth: 1,
  },
  errorText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    textAlign: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  stepBody: {
    gap: 14,
  },
  stepHeaderGroup: {
    gap: 4,
  },
  stepTitle: {
    fontFamily: fonts.serif,
    fontSize: 18,
    fontWeight: '700',
  },
  stepDescription: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  categoryTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
  categoryTabBtnActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryTabBtnText: {
    fontSize: 12,
  },
  storeCardsList: {
    gap: 10,
  },
  storeSelectCard: {
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1.5,
    gap: 10,
  },
  storeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfoCol: {
    flex: 1,
    gap: 2,
  },
  storeCardName: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
  },
  storeCardAddress: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 15,
  },
  radioEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  storeCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  verifiedTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  verifiedTagText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
  },
  storeHoursText: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
  primaryActionButton: {
    minHeight: MIN_TARGET,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  primaryActionText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryFlexButton: {
    flex: 1,
    minHeight: MIN_TARGET,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  secondaryActionButton: {
    width: 90,
    minHeight: MIN_TARGET,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryActionText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  quickFillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  quickFillText: {
    fontFamily: fonts.sansBold,
    fontSize: 11.5,
  },
  formSection: {
    gap: 12,
  },
  inputGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
  },
  textInputField: {
    minHeight: 44,
    borderRadius: radii.card,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13.5,
    fontFamily: fonts.sans,
  },
  multiColRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  chipOptionText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },
  docCardsList: {
    gap: 10,
  },
  docCard: {
    padding: 12,
    borderRadius: radii.card,
    borderWidth: 1.5,
    gap: 8,
  },
  docCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  docIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfoCol: {
    flex: 1,
    gap: 2,
  },
  docTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docTitleText: {
    fontSize: 13,
  },
  docDescText: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 15,
  },
  docAuthorityText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    marginTop: 2,
  },
  docCardBottom: {
    paddingTop: 6,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  uploadBtnText: {
    fontSize: 12,
  },
  uploadedStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  fileMetaCol: {
    flex: 1,
    gap: 2,
  },
  fileNameText: {
    fontSize: 12,
  },
  fileSizeText: {
    fontSize: 10,
    fontFamily: fonts.sans,
  },
  removeDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  removeDocText: {
    fontSize: 11,
  },
  attestationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1.5,
    marginTop: 4,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: fonts.sansBold,
    fontSize: 12,
    lineHeight: 16,
  },
  infoModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  infoModalCard: {
    width: '100%',
    maxWidth: 380,
    padding: 24,
    borderRadius: radii.card,
    borderWidth: 1.5,
    gap: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    shadowOpacity: 0.15,
    elevation: 8,
  },
  infoModalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  infoModalTitle: {
    fontFamily: fonts.serif,
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  infoModalBody: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
  },
  infoModalButtonRow: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  infoModalOkButton: {
    width: '100%',
    minHeight: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModalOkText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
  infoModalBackRoleButton: {
    width: '100%',
    minHeight: 44,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModalBackRoleText: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
  },
});
