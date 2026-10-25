import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import { Pharmacy } from '../../types/models';
import { StorePartnerAuth } from '../../services/pharmacyPortalService';
import {
  StaffBadgeIcon,
  PharmacyStoreIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  BackArrowIcon,
  CloseIcon,
  ChevronRightIcon,
  ZapIcon,
} from '../icons/AppIcons';

interface StoreOnboardingModalProps {
  pharmacies: Pharmacy[];
  onComplete: (auth: StorePartnerAuth) => void;
  onCancel?: () => void;
  cancelLabel?: string;
}

export function StoreOnboardingModal({
  pharmacies,
  onComplete,
  onCancel,
  cancelLabel,
}: StoreOnboardingModalProps) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedStore, setSelectedStore] = useState<Pharmacy>(
    pharmacies[0] || {
      id: 'pharm-blr-001',
      name: 'Victoria Hospital Community Pharmacy',
      address: 'Fort Road, near City Market, Kalasipalya, Bengaluru 560002',
      latitude: 12.9625,
      longitude: 77.5745,
      phone: '080-26701100',
      participation_status: 'participating',
      verified_at: '2026-10-22T00:00:00.000Z',
      opening_hours: '24 Hours',
      source_type: 'provider_confirmed',
      source_url: 'https://medfind.local/pharmacy/blr-001',
      verified_date: '2026-10-22',
      is_demo: false,
    }
  );

  const [pharmacistName, setPharmacistName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [counterId, setCounterId] = useState('');
  const [hasAttested, setHasAttested] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 12;

  const handleQuickFill = () => {
    setPharmacistName('Dr. Anand Rao, B.Pharm');
    setLicenseNumber('KSPC/KA/2024/98412');
    setCounterId('Dispensary Counter 1 - Front Deck');
    setErrorMessage(null);
  };

  const handleNextFromStep1 = () => {
    if (!selectedStore) {
      setErrorMessage('Please select a pharmacy store to proceed.');
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    if (!pharmacistName.trim()) {
      setErrorMessage('Please enter the registered pharmacist name.');
      return;
    }
    if (!licenseNumber.trim()) {
      setErrorMessage('Please enter the drug license / registration number.');
      return;
    }
    if (!counterId.trim()) {
      setErrorMessage('Please enter the counter or dispensing station.');
      return;
    }
    setErrorMessage(null);
    setStep(3);
  };

  const handleFinalize = () => {
    if (!hasAttested) {
      setErrorMessage('Please check the attestation box to certify regulatory compliance.');
      return;
    }

    const auth: StorePartnerAuth = {
      isAuthorized: true,
      pharmacyId: selectedStore.id,
      pharmacyName: selectedStore.name,
      pharmacistName: pharmacistName.trim(),
      licenseNumber: licenseNumber.trim(),
      counterId: counterId.trim() || 'Counter 1',
      verifiedAt: new Date().toISOString(),
    };

    onComplete(auth);
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
            accessibilityLabel={cancelLabel || 'Close onboarding and exit'}
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
                  {cancelLabel}
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
            AUTHORIZED PERSONNEL ONLY
          </Text>
          <Text style={[styles.headerMainTitle, { color: palette.ink }]} numberOfLines={1}>
            Store Partner Onboarding
          </Text>
        </View>

        <View
          style={[
            styles.navIconButton,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <StaffBadgeIcon size={20} />
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
              1
            </Text>
          </View>
          <Text style={[styles.stepLabel, { color: step === 1 ? palette.ink : palette.ink2 }]}>
            Store
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
              2
            </Text>
          </View>
          <Text style={[styles.stepLabel, { color: step === 2 ? palette.ink : palette.ink2 }]}>
            Staff ID
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
              3
            </Text>
          </View>
          <Text style={[styles.stepLabel, { color: step === 3 ? palette.ink : palette.ink2 }]}>
            Attest
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
        {/* STEP 1: SELECT STORE */}
        {step === 1 && (
          <View style={styles.stepBody}>
            <View style={styles.stepHeaderGroup}>
              <Text style={[styles.stepTitle, { color: palette.ink }]}>
                Select Operating Pharmacy
              </Text>
              <Text style={[styles.stepDescription, { color: palette.ink2 }]}>
                Choose the verified retail dispensary or hospital counter you are operating today.
              </Text>
            </View>

            <View style={styles.storeCardsList}>
              {pharmacies.map((store) => {
                const isSelected = selectedStore.id === store.id;

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
                    accessibilityLabel={`Store: ${store.name}, ${store.address}`}
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
                        <PharmacyStoreIcon
                          size={18}
                          color={isSelected ? palette.okInk : palette.ink}
                        />
                      </View>

                      <View style={styles.storeInfoCol}>
                        <Text style={[styles.storeCardName, { color: palette.ink }]}>
                          {store.name}
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
                          Verified Pilot Partner
                        </Text>
                      </View>
                      <Text style={[styles.storeHoursText, { color: palette.ink2 }]}>
                        {store.opening_hours || '09:00 - 21:00'}
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
              accessibilityLabel="Confirm store and proceed to pharmacist ID"
              style={({ pressed }) => [
                styles.primaryActionButton,
                {
                  backgroundColor: palette.btn,
                  opacity: pressed ? 0.85 : 1.0,
                },
              ]}
            >
              <Text style={[styles.primaryActionText, { color: palette.btnInk }]}>
                Continue to Pharmacist ID
              </Text>
              <ChevronRightIcon size={18} color={palette.btnInk} />
            </Pressable>
          </View>
        )}

        {/* STEP 2: PHARMACIST CREDENTIALS */}
        {step === 2 && (
          <View style={styles.stepBody}>
            <View style={styles.stepHeaderGroup}>
              <Text style={[styles.stepTitle, { color: palette.ink }]}>
                Pharmacist Identification
              </Text>
              <Text style={[styles.stepDescription, { color: palette.ink2 }]}>
                Enter your licensed pharmacist credentials. Every inventory modification is logged with your operator identity.
              </Text>
            </View>

            <Pressable
              onPress={handleQuickFill}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Autofill demo credentials"
              style={({ pressed }) => [
                styles.quickFillPill,
                {
                  backgroundColor: palette.surface2,
                  borderColor: palette.line,
                  opacity: pressed ? 0.8 : 1.0,
                },
              ]}
            >
              <ZapIcon size={14} color={palette.accent} />
              <Text style={[styles.quickFillText, { color: palette.accent }]}>
                Autofill Demo Credentials
              </Text>
            </Pressable>

            {/* Input 1: Pharmacist Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                Registered Pharmacist Name *
              </Text>
              <TextInput
                value={pharmacistName}
                onChangeText={(text) => {
                  setPharmacistName(text);
                  setErrorMessage(null);
                }}
                placeholder="e.g. Dr. Priya Sharma, R.Ph"
                placeholderTextColor={palette.ink2}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.line,
                    color: palette.ink,
                  },
                ]}
              />
            </View>

            {/* Input 2: License Number */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                KSPC Registration / Drug Retail License *
              </Text>
              <TextInput
                value={licenseNumber}
                onChangeText={(text) => {
                  setLicenseNumber(text);
                  setErrorMessage(null);
                }}
                placeholder="e.g. KA-BLR-2024-DR-0492"
                placeholderTextColor={palette.ink2}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.line,
                    color: palette.ink,
                  },
                ]}
              />
            </View>

            {/* Input 3: Counter / Desk ID */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                Counter / Dispensing Station *
              </Text>
              <TextInput
                value={counterId}
                onChangeText={(text) => {
                  setCounterId(text);
                  setErrorMessage(null);
                }}
                placeholder="e.g. Dispensary Counter 1"
                placeholderTextColor={palette.ink2}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.line,
                    color: palette.ink,
                  },
                ]}
              />
            </View>

            {/* Navigation Buttons */}
            <View style={styles.buttonRow}>
              <Pressable
                onPress={() => {
                  setErrorMessage(null);
                  setStep(1);
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Go back to store selection"
                style={({ pressed }) => [
                  styles.secondaryActionButton,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.line,
                    opacity: pressed ? 0.8 : 1.0,
                  },
                ]}
              >
                <BackArrowIcon size={16} color={palette.ink} />
                <Text style={[styles.secondaryActionText, { color: palette.ink }]}>Back</Text>
              </Pressable>

              <Pressable
                onPress={handleNextFromStep2}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Proceed to compliance attestation"
                style={({ pressed }) => [
                  styles.primaryFlexButton,
                  {
                    backgroundColor: palette.btn,
                    opacity: pressed ? 0.85 : 1.0,
                  },
                ]}
              >
                <Text style={[styles.primaryActionText, { color: palette.btnInk }]}>
                  Continue to Attest
                </Text>
                <ChevronRightIcon size={16} color={palette.btnInk} />
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP 3: REGULATORY ATTESTATION */}
        {step === 3 && (
          <View style={styles.stepBody}>
            <View style={styles.stepHeaderGroup}>
              <Text style={[styles.stepTitle, { color: palette.ink }]}>
                Clinical & Regulatory Attestation
              </Text>
              <Text style={[styles.stepDescription, { color: palette.ink2 }]}>
                Review and certify compliance with Karnataka Drug Rules & MedFind transparency standards.
              </Text>
            </View>

            {/* Attestation Items */}
            <View
              style={[
                styles.attestationCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.line,
                  shadowColor: palette.shadow,
                },
              ]}
            >
              <View style={styles.attestItem}>
                <ShieldCheckIcon size={20} color={palette.okInk} />
                <View style={styles.attestTextCol}>
                  <Text style={[styles.attestItemTitle, { color: palette.ink }]}>
                    Physical Shelf Verification
                  </Text>
                  <Text style={[styles.attestItemDesc, { color: palette.ink2 }]}>
                    I confirm that availability updates represent physically inspected stock on retail shelves.
                  </Text>
                </View>
              </View>

              <View style={[styles.attestDivider, { backgroundColor: palette.line }]} />

              <View style={styles.attestItem}>
                <CheckCircleIcon size={20} color={palette.okInk} />
                <View style={styles.attestTextCol}>
                  <Text style={[styles.attestItemTitle, { color: palette.ink }]}>
                    DPCO Price Compliance
                  </Text>
                  <Text style={[styles.attestItemDesc, { color: palette.ink2 }]}>
                    Dispensed essential medicines adhere strictly to NPPA ceiling prices without markups.
                  </Text>
                </View>
              </View>

              <View style={[styles.attestDivider, { backgroundColor: palette.line }]} />

              <View style={styles.attestItem}>
                <StaffBadgeIcon size={20} />
                <View style={styles.attestTextCol}>
                  <Text style={[styles.attestItemTitle, { color: palette.ink }]}>
                    Traceable Audit Trail
                  </Text>
                  <Text style={[styles.attestItemDesc, { color: palette.ink2 }]}>
                    Updates record my operator identity ({pharmacistName}) and timestamp for regulatory inspection.
                  </Text>
                </View>
              </View>
            </View>

            {/* Attestation Checkbox */}
            <Pressable
              onPress={() => {
                setHasAttested(!hasAttested);
                setErrorMessage(null);
              }}
              accessible={true}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: hasAttested }}
              accessibilityLabel="I attest and certify my authority as licensed pharmacy staff"
              style={[
                styles.checkboxRow,
                {
                  backgroundColor: hasAttested ? palette.okTint : palette.surface2,
                  borderColor: hasAttested ? palette.okLine : palette.line,
                },
              ]}
            >
              <View
                style={[
                  styles.checkboxBox,
                  {
                    backgroundColor: hasAttested ? palette.okInk : 'transparent',
                    borderColor: hasAttested ? palette.okInk : palette.line,
                  },
                ]}
              >
                {hasAttested && <CheckCircleIcon size={14} color="#FFFFFF" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: palette.ink }]}>
                I attest under Section 65 of Drugs and Cosmetics Rules that I am authorized dispensary staff.
              </Text>
            </Pressable>

            {/* Summary Box */}
            <View
              style={[
                styles.summaryBox,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.line,
                },
              ]}
            >
              <Text style={[styles.summaryTitle, { color: palette.ink2 }]}>
                ONBOARDING ASSIGNMENT
              </Text>
              <Text style={[styles.summaryStore, { color: palette.ink }]}>
                {selectedStore.name}
              </Text>
              <Text style={[styles.summaryStaff, { color: palette.ink2 }]}>
                {pharmacistName} • {licenseNumber}
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <Pressable
                onPress={() => {
                  setErrorMessage(null);
                  setStep(2);
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Go back to staff details"
                style={({ pressed }) => [
                  styles.secondaryActionButton,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.line,
                    opacity: pressed ? 0.8 : 1.0,
                  },
                ]}
              >
                <BackArrowIcon size={16} color={palette.ink} />
                <Text style={[styles.secondaryActionText, { color: palette.ink }]}>Back</Text>
              </Pressable>

              <Pressable
                onPress={handleFinalize}
                disabled={!hasAttested}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Complete onboarding and open staff portal"
                style={({ pressed }) => [
                  styles.primaryFlexButton,
                  {
                    backgroundColor: hasAttested ? palette.okInk : palette.surface2,
                    opacity: pressed ? 0.85 : 1.0,
                  },
                ]}
              >
                <ShieldCheckIcon size={16} color="#FFFFFF" />
                <Text style={[styles.primaryActionText, { color: '#FFFFFF' }]}>
                  Launch Staff Portal
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  navIconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabelButton: {
    width: 'auto',
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 6,
  },
  cancelLabelText: {
    fontSize: 13,
  },
  navIconButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  headerTitleGroup: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  badgePillText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  headerMainTitle: {
    fontFamily: fonts.serif,
    fontSize: 17,
    fontWeight: '700',
  },

  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 10,
    gap: 8,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotNum: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
  },
  stepLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    marginBottom: 16,
  },

  errorBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.chip,
    borderWidth: 1,
  },
  errorText: {
    fontFamily: fonts.sansBold,
    fontSize: 12.5,
  },

  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  stepBody: {
    gap: 16,
  },
  stepHeaderGroup: {
    gap: 4,
  },
  stepTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    fontWeight: '700',
  },
  stepDescription: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },

  storeCardsList: {
    gap: 12,
  },
  storeSelectCard: {
    padding: 16,
    borderRadius: radii.card,
    borderWidth: 1.5,
    gap: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    shadowOpacity: 0.06,
    elevation: 2,
  },
  storeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfoCol: {
    flex: 1,
    gap: 2,
  },
  storeCardName: {
    fontFamily: fonts.serif,
    fontSize: 16,
    fontWeight: '700',
  },
  storeCardAddress: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  radioEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  storeCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  verifiedTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  verifiedTagText: {
    fontFamily: fonts.sansBold,
    fontSize: 10.5,
    fontWeight: '700',
  },
  storeHoursText: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },

  quickFillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  quickFillText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    fontWeight: '700',
  },

  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 12.5,
  },
  textInput: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: radii.chip,
    borderWidth: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
  },

  attestationCard: {
    padding: 16,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    shadowOpacity: 0.06,
    elevation: 2,
  },
  attestItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  attestTextCol: {
    flex: 1,
    gap: 2,
  },
  attestItemTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
  },
  attestItemDesc: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  attestDivider: {
    height: 1,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
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

  summaryBox: {
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 3,
  },
  summaryTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  summaryStore: {
    fontFamily: fonts.serif,
    fontSize: 15,
    fontWeight: '700',
  },
  summaryStaff: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
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
  primaryActionText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
  },
});
