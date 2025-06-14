import { Platform, ViewStyle } from 'react-native';

interface ShadowStyle extends ViewStyle {}

type ShadowSize = 'small' | 'medium' | 'large' | 'xl';

export const shadows: Record<ShadowSize, ShadowStyle> = {
  small: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
    },
    android: {
      elevation: 1,
    },
  }) as ShadowStyle,
  
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    android: {
      elevation: 5,
    },
  }) as ShadowStyle,
  
  large: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
    },
    android: {
      elevation: 8,
    },
  }) as ShadowStyle,
  
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.37,
      shadowRadius: 7.49,
    },
    android: {
      elevation: 12,
    },
  }) as ShadowStyle,
};

// Helper function with types
export const createCustomShadow = (
  elevation: number, 
  shadowColor: string = '#000', 
  opacity: number = 0.25
): ShadowStyle => 
  Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity: opacity,
      shadowRadius: elevation,
    },
    android: { elevation },
  }) as ShadowStyle;