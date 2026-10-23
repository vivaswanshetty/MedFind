import { ImageSourcePropType } from 'react-native';

export interface OnboardingAssets {
  // Splash objects
  capsule: ImageSourcePropType;
  tablet: ImageSourcePropType;
  pin: ImageSourcePropType;
  cross: ImageSourcePropType;
  blister: ImageSourcePropType;
  syrup: ImageSourcePropType;

  // Mascot ("Pill Pal")
  mascotWave: ImageSourcePropType;
  mascotThink: ImageSourcePropType;
  mascotCelebrate: ImageSourcePropType;

  // Who-picker characters
  whoMe: ImageSourcePropType;
  whoParent: ImageSourcePropType;
  whoChild: ImageSourcePropType;
  whoOther: ImageSourcePropType;
}

export const onboardingAssets: OnboardingAssets = {
  // Splash objects
  capsule: require('./capsule.png'),
  tablet: require('./tablet.png'),
  pin: require('./pin.png'),
  cross: require('./cross.png'),
  blister: require('./blister.png'),
  syrup: require('./syrup.png'),

  // Mascot ("Pill Pal")
  mascotWave: require('./mascot-wave.png'),
  mascotThink: require('./mascot-think.png'),
  mascotCelebrate: require('./mascot-celebrate.png'),

  // Who-picker characters
  whoMe: require('./who-me.png'),
  whoParent: require('./who-parent.png'),
  whoChild: require('./who-child.png'),
  whoOther: require('./who-other.png'),
};

export default onboardingAssets;
