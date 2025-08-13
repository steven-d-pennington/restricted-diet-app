/**
 * Onboarding Context
 * 
 * SAFETY CRITICAL: Manages onboarding state for medical dietary restriction setup
 * Ensures complete and accurate collection of life-threatening allergy information
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { RestrictionType, RestrictionSeverity, AccountType } from '../types/database.types'

// Onboarding step types
export type OnboardingStep = 
  | 'welcome'
  | 'basic_info'
  | 'restrictions_category'
  | 'restrictions_severity'
  | 'emergency_contacts'
  | 'verification'
  | 'complete'

// Form data interfaces
export interface BasicInfo {
  fullName: string
  dateOfBirth: string
  accountType: AccountType
  medicalConditions: string[]
  phoneNumber?: string
}

export interface SelectedRestriction {
  id: string
  name: string
  category: RestrictionType
  severity?: RestrictionSeverity
  doctorVerified: boolean
  diagnosedDate?: string
  notes?: string
  crossContaminationSensitive: boolean
}

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
  isPrimary: boolean
}

export interface MedicalProvider {
  name: string
  phone: string
  type: 'allergist' | 'primary_care' | 'specialist'
}

export interface OnboardingData {
  currentStep: OnboardingStep
  basicInfo: Partial<BasicInfo>
  selectedRestrictions: SelectedRestriction[]
  emergencyContacts: EmergencyContact[]
  medicalProviders: MedicalProvider[]
  consentGiven: {
    medicalDataHandling: boolean
    termsOfService: boolean
    privacyPolicy: boolean
    emergencySharing: boolean
  }
  skipOptionalSteps: boolean
  isComplete: boolean
}

// Action types
export type OnboardingAction =
  | { type: 'SET_STEP'; payload: OnboardingStep }
  | { type: 'UPDATE_BASIC_INFO'; payload: Partial<BasicInfo> }
  | { type: 'ADD_RESTRICTION'; payload: SelectedRestriction }
  | { type: 'UPDATE_RESTRICTION'; payload: { id: string; updates: Partial<SelectedRestriction> } }
  | { type: 'REMOVE_RESTRICTION'; payload: string }
  | { type: 'ADD_EMERGENCY_CONTACT'; payload: EmergencyContact }
  | { type: 'UPDATE_EMERGENCY_CONTACT'; payload: { index: number; updates: Partial<EmergencyContact> } }
  | { type: 'REMOVE_EMERGENCY_CONTACT'; payload: number }
  | { type: 'ADD_MEDICAL_PROVIDER'; payload: MedicalProvider }
  | { type: 'UPDATE_CONSENT'; payload: Partial<OnboardingData['consentGiven']> }
  | { type: 'SET_SKIP_OPTIONAL'; payload: boolean }
  | { type: 'RESET_ONBOARDING' }
  | { type: 'COMPLETE_ONBOARDING' }

// Initial state
const initialState: OnboardingData = {
  currentStep: 'welcome',
  basicInfo: {},
  selectedRestrictions: [],
  emergencyContacts: [],
  medicalProviders: [],
  consentGiven: {
    medicalDataHandling: false,
    termsOfService: false,
    privacyPolicy: false,
    emergencySharing: false,
  },
  skipOptionalSteps: false,
  isComplete: false,
}

// Reducer
function onboardingReducer(state: OnboardingData, action: OnboardingAction): OnboardingData {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
      }

    case 'UPDATE_BASIC_INFO':
      return {
        ...state,
        basicInfo: {
          ...state.basicInfo,
          ...action.payload,
        },
      }

    case 'ADD_RESTRICTION':
      // Prevent duplicates
      const existingRestriction = state.selectedRestrictions.find(r => r.id === action.payload.id)
      if (existingRestriction) {
        return state
      }
      return {
        ...state,
        selectedRestrictions: [...state.selectedRestrictions, action.payload],
      }

    case 'UPDATE_RESTRICTION':
      return {
        ...state,
        selectedRestrictions: state.selectedRestrictions.map(restriction =>
          restriction.id === action.payload.id
            ? { ...restriction, ...action.payload.updates }
            : restriction
        ),
      }

    case 'REMOVE_RESTRICTION':
      return {
        ...state,
        selectedRestrictions: state.selectedRestrictions.filter(r => r.id !== action.payload),
      }

    case 'ADD_EMERGENCY_CONTACT':
      // If this is set as primary, remove primary from others
      const contacts = action.payload.isPrimary
        ? state.emergencyContacts.map(contact => ({ ...contact, isPrimary: false }))
        : state.emergencyContacts

      return {
        ...state,
        emergencyContacts: [...contacts, action.payload],
      }

    case 'UPDATE_EMERGENCY_CONTACT':
      const { index, updates } = action.payload
      const updatedContacts = [...state.emergencyContacts]
      updatedContacts[index] = { ...updatedContacts[index], ...updates }

      // Handle primary contact logic
      if (updates.isPrimary) {
        updatedContacts.forEach((contact, i) => {
          if (i !== index) contact.isPrimary = false
        })
      }

      return {
        ...state,
        emergencyContacts: updatedContacts,
      }

    case 'REMOVE_EMERGENCY_CONTACT':
      return {
        ...state,
        emergencyContacts: state.emergencyContacts.filter((_, index) => index !== action.payload),
      }

    case 'ADD_MEDICAL_PROVIDER':
      return {
        ...state,
        medicalProviders: [...state.medicalProviders, action.payload],
      }

    case 'UPDATE_CONSENT':
      return {
        ...state,
        consentGiven: {
          ...state.consentGiven,
          ...action.payload,
        },
      }

    case 'SET_SKIP_OPTIONAL':
      return {
        ...state,
        skipOptionalSteps: action.payload,
      }

    case 'RESET_ONBOARDING':
      return initialState

    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        isComplete: true,
      }

    default:
      return state
  }
}

// Context interface
interface OnboardingContextType {
  state: OnboardingData
  dispatch: React.Dispatch<OnboardingAction>
  // Helper functions
  goToNextStep: () => void
  goToPreviousStep: () => void
  canProceedToNext: () => boolean
  getStepProgress: () => { current: number; total: number; percentage: number }
  hasLifeThreateningAllergies: () => boolean
  validateCurrentStep: () => { isValid: boolean; errors: string[] }
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

// Step order configuration
const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'basic_info',
  'restrictions_category',
  'restrictions_severity',
  'emergency_contacts',
  'verification',
  'complete'
]

interface OnboardingProviderProps {
  children: ReactNode
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(onboardingReducer, initialState)

  const goToNextStep = () => {
    const currentIndex = STEP_ORDER.indexOf(state.currentStep)
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[currentIndex + 1]
      
      // Skip steps based on user selections
      if (state.skipOptionalSteps && nextStep === 'emergency_contacts') {
        // Skip to verification if no restrictions require emergency info
        const hasHighRiskRestrictions = state.selectedRestrictions.some(
          r => r.severity === 'severe' || r.severity === 'life_threatening'
        )
        if (!hasHighRiskRestrictions) {
          dispatch({ type: 'SET_STEP', payload: 'verification' })
          return
        }
      }
      
      dispatch({ type: 'SET_STEP', payload: nextStep })
    }
  }

  const goToPreviousStep = () => {
    const currentIndex = STEP_ORDER.indexOf(state.currentStep)
    if (currentIndex > 0) {
      const previousStep = STEP_ORDER[currentIndex - 1]
      dispatch({ type: 'SET_STEP', payload: previousStep })
    }
  }

  const canProceedToNext = () => {
    const validation = validateCurrentStep()
    return validation.isValid
  }

  const getStepProgress = () => {
    const current = STEP_ORDER.indexOf(state.currentStep) + 1
    const total = STEP_ORDER.length
    const percentage = Math.round((current / total) * 100)
    
    return { current, total, percentage }
  }

  const hasLifeThreateningAllergies = () => {
    return state.selectedRestrictions.some(
      restriction => restriction.severity === 'life_threatening'
    )
  }

  const validateCurrentStep = () => {
    const errors: string[] = []

    switch (state.currentStep) {
      case 'welcome':
        if (!state.consentGiven.termsOfService) {
          errors.push('You must accept the Terms of Service to continue')
        }
        if (!state.consentGiven.privacyPolicy) {
          errors.push('You must accept the Privacy Policy to continue')
        }
        if (!state.consentGiven.medicalDataHandling) {
          errors.push('You must consent to medical data handling to use this app')
        }
        break

      case 'basic_info':
        if (!state.basicInfo.fullName?.trim()) {
          errors.push('Full name is required')
        }
        if (!state.basicInfo.dateOfBirth) {
          errors.push('Date of birth is required')
        }
        if (!state.basicInfo.accountType) {
          errors.push('Account type selection is required')
        }
        break

      case 'restrictions_category':
        // Optional - user can skip if no restrictions
        break

      case 'restrictions_severity':
        // Validate that all restrictions have severity set
        const restrictionsWithoutSeverity = state.selectedRestrictions.filter(r => !r.severity)
        if (restrictionsWithoutSeverity.length > 0) {
          errors.push('Please set severity level for all selected restrictions')
        }
        
        // Require doctor verification for life-threatening allergies
        const lifeThreatening = state.selectedRestrictions.filter(r => r.severity === 'life_threatening')
        const unverifiedLifeThreatening = lifeThreatening.filter(r => !r.doctorVerified)
        if (unverifiedLifeThreatening.length > 0) {
          errors.push('Life-threatening allergies require medical professional verification')
        }
        break

      case 'emergency_contacts':
        // Require at least one emergency contact for life-threatening allergies
        if (hasLifeThreateningAllergies() && state.emergencyContacts.length === 0) {
          errors.push('Emergency contact is required for life-threatening allergies')
        }
        
        // Validate contact information completeness
        const invalidContacts = state.emergencyContacts.filter(
          contact => !contact.name.trim() || !contact.phone.trim() || !contact.relationship.trim()
        )
        if (invalidContacts.length > 0) {
          errors.push('All emergency contact fields are required')
        }
        break

      case 'verification':
        // Final validation before completion
        if (!state.consentGiven.emergencySharing && hasLifeThreateningAllergies()) {
          errors.push('Emergency information sharing consent is required for safety')
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  const contextValue: OnboardingContextType = {
    state,
    dispatch,
    goToNextStep,
    goToPreviousStep,
    canProceedToNext,
    getStepProgress,
    hasLifeThreateningAllergies,
    validateCurrentStep,
  }

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  )
}

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}

// Helper function to get step display information
export const getStepInfo = (step: OnboardingStep) => {
  const stepInfo = {
    welcome: {
      title: 'Welcome to SafeEats',
      subtitle: 'Your medical-grade dietary restriction companion',
      description: 'Before we begin, please review and accept our safety policies',
    },
    basic_info: {
      title: 'Basic Information',
      subtitle: 'Tell us about yourself',
      description: 'This information helps us customize your safety profile',
    },
    restrictions_category: {
      title: 'Dietary Restrictions',
      subtitle: 'Select your dietary restrictions and allergies',
      description: 'Choose all that apply to build your complete safety profile',
    },
    restrictions_severity: {
      title: 'Severity Configuration',
      subtitle: 'Configure restriction severity levels',
      description: 'Accurate severity information is critical for your safety',
    },
    emergency_contacts: {
      title: 'Emergency Contacts',
      subtitle: 'Add emergency contact information',
      description: 'Required for life-threatening allergies and medical emergencies',
    },
    verification: {
      title: 'Profile Verification',
      subtitle: 'Review your safety profile',
      description: 'Please verify all information is accurate before completing setup',
    },
    complete: {
      title: 'Setup Complete',
      subtitle: 'Your safety profile is ready',
      description: 'You can now safely scan products and manage your dietary restrictions',
    },
  }

  return stepInfo[step]
}