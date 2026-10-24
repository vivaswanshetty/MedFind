import { ImageSourcePropType } from 'react-native';

export interface OnboardingSmallAssets {
  capsule: ImageSourcePropType;
  tablet: ImageSourcePropType;
  pin: ImageSourcePropType;
  cross: ImageSourcePropType;
  blister: ImageSourcePropType;
  syrup: ImageSourcePropType;

  // Swipe-card question illustrations (512x512 downscaled)
  cardMedicineBox: ImageSourcePropType;
  cardOutOfStock: ImageSourcePropType;
  cardFamily: ImageSourcePropType;
  cardReminder: ImageSourcePropType;
  cardCompare: ImageSourcePropType;
}

export interface OnboardingAssets {
  // Splash objects
  capsule: ImageSourcePropType;
  tablet: ImageSourcePropType;
  pin: ImageSourcePropType;
  cross: ImageSourcePropType;
  blister: ImageSourcePropType;
  syrup: ImageSourcePropType;

  // Downscaled objects (splash & cards)
  small: OnboardingSmallAssets;

  // Mascot ("Pill Pal")
  mascotWave: ImageSourcePropType;
  mascotThink: ImageSourcePropType;
  mascotCelebrate: ImageSourcePropType;

  // Who-picker characters
  whoMe: ImageSourcePropType;
  whoParent: ImageSourcePropType;
  whoChild: ImageSourcePropType;
  whoOther: ImageSourcePropType;

  // Swipe-card question illustrations (1024x1024)
  cardMedicineBox: ImageSourcePropType;
  cardOutOfStock: ImageSourcePropType;
  cardFamily: ImageSourcePropType;
  cardReminder: ImageSourcePropType;
  cardCompare: ImageSourcePropType;
}

export const onboardingAssets: OnboardingAssets = {
  // Splash objects
  capsule: require('./capsule.png'),
  tablet: require('./tablet.png'),
  pin: require('./pin.png'),
  cross: require('./cross.png'),
  blister: require('./blister.png'),
  syrup: require('./syrup.png'),

  // Downscaled objects
  small: {
    capsule: require('./capsule-s.png'),
    tablet: require('./tablet-s.png'),
    pin: require('./pin-s.png'),
    cross: require('./cross-s.png'),
    blister: require('./blister-s.png'),
    syrup: require('./syrup-s.png'),

    // Small card illustrations (512x512)
    cardMedicineBox: require('./card-medicine-box-s.png'),
    cardOutOfStock: require('./card-out-of-stock-s.png'),
    cardFamily: require('./card-family-s.png'),
    cardReminder: require('./card-reminder-s.png'),
    cardCompare: require('./card-compare-s.png'),
  },

  // Mascot ("Pill Pal")
  mascotWave: require('./mascot-wave.png'),
  mascotThink: require('./mascot-think.png'),
  mascotCelebrate: require('./mascot-celebrate.png'),

  // Who-picker characters
  whoMe: require('./who-me.png'),
  whoParent: require('./who-parent.png'),
  whoChild: require('./who-child.png'),
  whoOther: require('./who-other.png'),

  // Swipe-card question illustrations (1024x1024)
  cardMedicineBox: require('./card-medicine-box.png'),
  cardOutOfStock: require('./card-out-of-stock.png'),
  cardFamily: require('./card-family.png'),
  cardReminder: require('./card-reminder.png'),
  cardCompare: require('./card-compare.png'),
};

export default onboardingAssets;
