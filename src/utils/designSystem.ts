/**
 * Design System Utilities
 * Provides helper functions and hooks for safety-focused styling in the dietary restriction app
 */

import { useMemo } from 'react';

// Type definitions
export type SafetyStatus = 'safe' | 'danger' | 'caution' | 'unknown';
export type MedicalType = 'prescription' | 'otc' | 'supplement' | 'natural';
export type ComponentVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AlertType = 'info' | 'success' | 'warning' | 'error';

// Safety status configuration
export const SAFETY_CONFIG = {
  safe: {
    color: '#22c55e',
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    textColor: '#166534',
    label: 'Safe',
    description: 'No known allergens or restrictions detected',
    icon: '✓',
  },
  danger: {
    color: '#ef4444',
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    textColor: '#991b1b',
    label: 'Contains Allergens',
    description: 'Contains ingredients you need to avoid',
    icon: '⚠',
  },
  caution: {
    color: '#f59e0b',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    textColor: '#92400e',
    label: 'Check Ingredients',
    description: 'May contain ingredients that require verification',
    icon: '⚡',
  },
  unknown: {
    color: '#64748b',
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    textColor: '#1e293b',
    label: 'Unknown Status',
    description: 'Safety status has not been determined',
    icon: '?',
  },
} as const;

// Medical type configuration
export const MEDICAL_CONFIG = {
  prescription: {
    color: '#6366f1',
    label: 'Prescription',
    description: 'Prescription medication',
    icon: '💊',
  },
  otc: {
    color: '#8b5cf6',
    label: 'Over-the-Counter',
    description: 'Over-the-counter medication',
    icon: '🏥',
  },
  supplement: {
    color: '#06b6d4',
    label: 'Supplement',
    description: 'Dietary supplement or vitamin',
    icon: '🌟',
  },
  natural: {
    color: '#10b981',
    label: 'Natural',
    description: 'Natural or organic product',
    icon: '🌿',
  },
} as const;

// Component size configuration
export const SIZE_CONFIG = {
  xs: {
    padding: 'p-1',
    text: 'text-xs',
    height: 'h-6',
    icon: 'w-3 h-3',
  },
  sm: {
    padding: 'p-2',
    text: 'text-sm',
    height: 'h-8',
    icon: 'w-4 h-4',
  },
  md: {
    padding: 'p-3',
    text: 'text-base',
    height: 'h-10',
    icon: 'w-5 h-5',
  },
  lg: {
    padding: 'p-4',
    text: 'text-lg',
    height: 'h-12',
    icon: 'w-6 h-6',
  },
  xl: {
    padding: 'p-6',
    text: 'text-xl',
    height: 'h-16',
    icon: 'w-8 h-8',
  },
} as const;

/**
 * Hook to get safety-related CSS classes
 */
export function useSafetyClasses() {
  return useMemo(() => ({
    safeClass: 'safety-safe bg-safety-safe-50 border-safety-safe-200 text-safety-safe-800',
    dangerClass: 'safety-danger bg-safety-danger-50 border-safety-danger-200 text-safety-danger-800',
    cautionClass: 'safety-caution bg-safety-caution-50 border-safety-caution-200 text-safety-caution-800',
    unknownClass: 'safety-unknown bg-safety-unknown-50 border-safety-unknown-200 text-safety-unknown-800',
    
    getStatusClass: (status: SafetyStatus): string => {
      const classes = {
        safe: 'safety-safe bg-safety-safe-50 border-safety-safe-200 text-safety-safe-800',
        danger: 'safety-danger bg-safety-danger-50 border-safety-danger-200 text-safety-danger-800',
        caution: 'safety-caution bg-safety-caution-50 border-safety-caution-200 text-safety-caution-800',
        unknown: 'safety-unknown bg-safety-unknown-50 border-safety-unknown-200 text-safety-unknown-800',
      };
      return classes[status];
    },
    
    getStatusBadgeClass: (status: SafetyStatus): string => {
      const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
      const statusClass = {
        safe: 'bg-safety-safe-100 text-safety-safe-800',
        danger: 'bg-safety-danger-100 text-safety-danger-800',
        caution: 'bg-safety-caution-100 text-safety-caution-800',
        unknown: 'bg-safety-unknown-100 text-safety-unknown-800',
      };
      return `${baseClass} ${statusClass[status]}`;
    },
    
    getStatusIconClass: (status: SafetyStatus): string => {
      const classes = {
        safe: 'text-safety-safe-500',
        danger: 'text-safety-danger-500',
        caution: 'text-safety-caution-500',
        unknown: 'text-safety-unknown-500',
      };
      return classes[status];
    },
  }), []);
}

/**
 * Hook to get medical-related CSS classes
 */
export function useMedicalClasses() {
  return useMemo(() => ({
    getMedicalCardClass: (type: MedicalType): string => {
      const baseClass = 'medical-card border-l-4';
      const typeClass = {
        prescription: 'border-l-medical-prescription',
        otc: 'border-l-medical-otc',
        supplement: 'border-l-medical-supplement',
        natural: 'border-l-medical-natural',
      };
      return `${baseClass} ${typeClass[type]}`;
    },
    
    getMedicalBadgeClass: (type: MedicalType): string => {
      const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
      const typeClass = {
        prescription: 'bg-indigo-100 text-indigo-800',
        otc: 'bg-violet-100 text-violet-800',
        supplement: 'bg-cyan-100 text-cyan-800',
        natural: 'bg-emerald-100 text-emerald-800',
      };
      return `${baseClass} ${typeClass[type]}`;
    },
  }), []);
}

/**
 * Hook for button styling
 */
export function useButtonClasses() {
  return useMemo(() => ({
    getButtonClass: (variant: ComponentVariant, size: ComponentSize = 'md'): string => {
      const baseClass = 'btn font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 touch-target';
      const sizeClass = SIZE_CONFIG[size];
      
      const variantClass = {
        primary: 'btn-primary bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
        secondary: 'btn-secondary bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500',
        success: 'btn-success bg-safety-safe-500 text-white hover:bg-safety-safe-600 focus:ring-safety-safe-500',
        warning: 'btn-caution bg-safety-caution-500 text-white hover:bg-safety-caution-600 focus:ring-safety-caution-500',
        error: 'btn-danger bg-safety-danger-500 text-white hover:bg-safety-danger-600 focus:ring-safety-danger-500',
      };
      
      return `${baseClass} ${sizeClass.padding} ${sizeClass.text} ${variantClass[variant]}`;
    },
    
    getOutlineButtonClass: (variant: ComponentVariant, size: ComponentSize = 'md'): string => {
      const baseClass = 'btn font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 touch-target border-2';
      const sizeClass = SIZE_CONFIG[size];
      
      const variantClass = {
        primary: 'border-primary-500 text-primary-500 hover:bg-primary-50 focus:ring-primary-500',
        secondary: 'border-neutral-300 text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-500',
        success: 'border-safety-safe-500 text-safety-safe-500 hover:bg-safety-safe-50 focus:ring-safety-safe-500',
        warning: 'border-safety-caution-500 text-safety-caution-500 hover:bg-safety-caution-50 focus:ring-safety-caution-500',
        error: 'border-safety-danger-500 text-safety-danger-500 hover:bg-safety-danger-50 focus:ring-safety-danger-500',
      };
      
      return `${baseClass} ${sizeClass.padding} ${sizeClass.text} ${variantClass[variant]}`;
    },
  }), []);
}

/**
 * Hook for input styling
 */
export function useInputClasses() {
  return useMemo(() => ({
    getInputClass: (hasError: boolean = false): string => {
      const baseClass = 'input w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1';
      
      if (hasError) {
        return `${baseClass} border-safety-danger-300 focus:ring-safety-danger-500 focus:border-safety-danger-500`;
      }
      
      return `${baseClass} border-neutral-300 focus:ring-primary-500 focus:border-primary-500`;
    },
    
    getLabelClass: (hasError: boolean = false): string => {
      const baseClass = 'block text-sm font-medium mb-1';
      return hasError 
        ? `${baseClass} text-safety-danger-700`
        : `${baseClass} text-neutral-700`;
    },
    
    getErrorClass: (): string => {
      return 'mt-1 text-sm text-safety-danger-600';
    },
  }), []);
}

/**
 * Hook for alert/notification styling
 */
export function useAlertClasses() {
  return useMemo(() => ({
    getAlertClass: (type: AlertType): string => {
      const baseClass = 'alert p-4 rounded-lg border';
      
      const typeClass = {
        info: 'alert-info bg-info-50 border-info-200 text-info-800',
        success: 'alert-success bg-safety-safe-50 border-safety-safe-200 text-safety-safe-800',
        warning: 'alert-warning bg-safety-caution-50 border-safety-caution-200 text-safety-caution-800',
        error: 'alert-error bg-safety-danger-50 border-safety-danger-200 text-safety-danger-800',
      };
      
      return `${baseClass} ${typeClass[type]}`;
    },
  }), []);
}

/**
 * Utility function to get safety information
 */
export function getSafetyInfo(status: SafetyStatus) {
  return SAFETY_CONFIG[status];
}

/**
 * Utility function to get medical type information
 */
export function getMedicalInfo(type: MedicalType) {
  return MEDICAL_CONFIG[type];
}

/**
 * Utility function to combine class names
 */
export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Utility function to get responsive classes
 */
export function getResponsiveClass(
  mobile: string,
  tablet?: string,
  desktop?: string
): string {
  const classes = [mobile];
  
  if (tablet) classes.push(`md:${tablet}`);
  if (desktop) classes.push(`lg:${desktop}`);
  
  return classes.join(' ');
}

/**
 * Utility function for touch target compliance
 */
export function getTouchTargetClass(platform: 'ios' | 'android' | 'web' = 'ios'): string {
  const baseClass = 'flex items-center justify-center';
  
  switch (platform) {
    case 'android':
      return `${baseClass} touch-target-android min-h-[48px] min-w-[48px]`;
    case 'ios':
      return `${baseClass} touch-target min-h-[44px] min-w-[44px]`;
    case 'web':
      return `${baseClass} touch-target min-h-[44px] min-w-[44px] cursor-pointer`;
    default:
      return `${baseClass} touch-target min-h-[44px] min-w-[44px]`;
  }
}

/**
 * Accessibility helper for screen readers
 */
export function getAccessibilityProps(
  label: string,
  hint?: string,
  role?: string
) {
  return {
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: role,
    accessible: true,
  };
}

/**
 * Safety status color utilities
 */
export const SafetyColors = {
  safe: {
    primary: '#22c55e',
    light: '#f0fdf4',
    dark: '#166534',
  },
  danger: {
    primary: '#ef4444',
    light: '#fef2f2',
    dark: '#991b1b',
  },
  caution: {
    primary: '#f59e0b',
    light: '#fffbeb',
    dark: '#92400e',
  },
  unknown: {
    primary: '#64748b',
    light: '#f8fafc',
    dark: '#1e293b',
  },
} as const;

/**
 * Design tokens for consistent spacing
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  touch: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
  },
} as const;

/**
 * Design tokens for typography
 */
export const Typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    medical: {
      caption: 12,
      body: 16,
      label: 14,
      heading: 20,
      title: 24,
    },
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;