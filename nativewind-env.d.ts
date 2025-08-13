/// <reference types="nativewind/types" />

// Extend the default theme to include our custom colors and utilities
declare module "nativewind/theme" {
  interface Theme {
    colors: {
      // Primary brand colors
      primary: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
      
      // Safety status colors (core to medical app)
      safety: {
        safe: {
          50: string;
          100: string;
          200: string;
          300: string;
          400: string;
          500: string;
          600: string;
          700: string;
          800: string;
          900: string;
        };
        danger: {
          50: string;
          100: string;
          200: string;
          300: string;
          400: string;
          500: string;
          600: string;
          700: string;
          800: string;
          900: string;
        };
        caution: {
          50: string;
          100: string;
          200: string;
          300: string;
          400: string;
          500: string;
          600: string;
          700: string;
          800: string;
          900: string;
        };
        unknown: {
          50: string;
          100: string;
          200: string;
          300: string;
          400: string;
          500: string;
          600: string;
          700: string;
          800: string;
          900: string;
        };
      };
      
      // Medical context colors
      medical: {
        prescription: string;
        otc: string;
        supplement: string;
        natural: string;
      };
      
      // Semantic colors
      info: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
      success: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
      warning: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
      error: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
      
      // Neutral colors
      neutral: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
      
      // Background and text colors
      background: string;
      surface: string;
      card: string;
      text: {
        primary: string;
        secondary: string;
        tertiary: string;
        inverse: string;
      };
    };
    
    fontFamily: {
      sans: string[];
      mono: string[];
      medical: string[];
    };
    
    fontSize: {
      xs: [string, { lineHeight: string }];
      sm: [string, { lineHeight: string }];
      base: [string, { lineHeight: string }];
      lg: [string, { lineHeight: string }];
      xl: [string, { lineHeight: string }];
      "2xl": [string, { lineHeight: string }];
      "3xl": [string, { lineHeight: string }];
      "4xl": [string, { lineHeight: string }];
      "5xl": [string, { lineHeight: string }];
      "6xl": [string, { lineHeight: string }];
      "medical-caption": [string, { lineHeight: string; letterSpacing: string }];
      "medical-body": [string, { lineHeight: string }];
      "medical-label": [string, { lineHeight: string; fontWeight: string }];
      "medical-heading": [string, { lineHeight: string; fontWeight: string }];
      "medical-title": [string, { lineHeight: string; fontWeight: string }];
    };
    
    spacing: {
      "18": string;
      "72": string;
      "84": string;
      "96": string;
      "touch-sm": string;
      "touch-md": string;
      "touch-lg": string;
      "touch-xl": string;
    };
    
    borderRadius: {
      xs: string;
      "4xl": string;
      "5xl": string;
      medical: string;
    };
    
    boxShadow: {
      soft: string;
      medium: string;
      strong: string;
      safe: string;
      danger: string;
      caution: string;
    };
    
    minHeight: {
      touch: string;
      "touch-android": string;
    };
    
    minWidth: {
      touch: string;
      "touch-android": string;
    };
    
    zIndex: {
      dropdown: string;
      sticky: string;
      fixed: string;
      "modal-backdrop": string;
      modal: string;
      popover: string;
      tooltip: string;
      toast: string;
    };
  }
}

// Extend React Native types for better TypeScript support
declare module "react-native" {
  interface TextProps {
    className?: string;
  }
  
  interface ViewProps {
    className?: string;
  }
  
  interface ImageProps {
    className?: string;
  }
  
  interface ScrollViewProps {
    className?: string;
  }
  
  interface TouchableOpacityProps {
    className?: string;
  }
  
  interface PressableProps {
    className?: string;
  }
  
  interface SafeAreaViewProps {
    className?: string;
  }
  
  interface FlatListProps<ItemT> {
    className?: string;
  }
  
  interface SectionListProps<ItemT, SectionT> {
    className?: string;
  }
  
  interface StatusBarProps {
    className?: string;
  }
  
  interface KeyboardAvoidingViewProps {
    className?: string;
  }
  
  interface ModalProps {
    className?: string;
  }
  
  interface RefreshControlProps {
    className?: string;
  }
  
  interface SwitchProps {
    className?: string;
  }
  
  interface ActivityIndicatorProps {
    className?: string;
  }
}

// Safety status type definitions for better type safety
export type SafetyStatus = 'safe' | 'danger' | 'caution' | 'unknown';

export type MedicalType = 'prescription' | 'otc' | 'supplement' | 'natural';

// Component prop types that include safety status
export interface SafetyIndicatorProps {
  status: SafetyStatus;
  className?: string;
  children?: React.ReactNode;
}

export interface MedicalCardProps {
  type: MedicalType;
  className?: string;
  children?: React.ReactNode;
}

// Utility type for Tailwind classes with safety status
export type SafetyClassName = 
  | `safety-safe-${string}`
  | `safety-danger-${string}`
  | `safety-caution-${string}`
  | `safety-unknown-${string}`;

export type MedicalClassName = 
  | `medical-${MedicalType}`
  | `${MedicalType}-card`;

// Enhanced className prop with safety-specific classes
export type EnhancedClassName = string | SafetyClassName | MedicalClassName;

// Hook for getting safety-related classes
export interface UseSafetyClassesReturn {
  safeClass: string;
  dangerClass: string;
  cautionClass: string;
  unknownClass: string;
  getStatusClass: (status: SafetyStatus) => string;
}

// Component variants for consistent styling
export type ComponentVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Responsive breakpoint types
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Animation duration types
export type AnimationDuration = 'fast' | 'normal' | 'slow' | number;

// Theme mode types (for future dark mode support)
export type ThemeMode = 'light' | 'dark' | 'system';

// Accessibility types
export interface AccessibilityProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  accessible?: boolean;
  testID?: string;
}