/**
 * Onboarding Coordinator Component
 * 
 * SAFETY CRITICAL: Coordinates the onboarding flow and handles navigation between steps
 * Provides a centralized entry point for the comprehensive onboarding experience
 */

import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { AuthStackScreenProps } from '../types/navigation.types'
import { useOnboarding } from '../contexts/OnboardingContext'

interface OnboardingCoordinatorProps {
  // Optional callback for when onboarding is completed
  onComplete?: () => void
  // Optional starting step override
  startStep?: 'welcome' | 'basic_info' | 'restrictions' | 'severity' | 'emergency' | 'completion'
}

/**
 * Hook to provide onboarding navigation helpers
 */
export const useOnboardingNavigation = () => {
  const navigation = useNavigation<AuthStackScreenProps<'OnboardingWelcome'>['navigation']>()
  const { state } = useOnboarding()

  const startOnboarding = () => {
    navigation.navigate('OnboardingWelcome')
  }

  const resumeOnboarding = () => {
    // Navigate to appropriate step based on current state
    switch (state.currentStep) {
      case 'welcome':
        navigation.navigate('OnboardingWelcome')
        break
      case 'basic_info':
        navigation.navigate('OnboardingBasicInfo')
        break
      case 'restrictions_category':
        navigation.navigate('OnboardingRestrictions')
        break
      case 'restrictions_severity':
        navigation.navigate('OnboardingSeverity')
        break
      case 'emergency_contacts':
        navigation.navigate('OnboardingEmergency')
        break
      case 'verification':
        navigation.navigate('OnboardingCompletion')
        break
      default:
        navigation.navigate('OnboardingWelcome')
    }
  }

  const skipToStep = (step: string) => {
    switch (step) {
      case 'welcome':
        navigation.navigate('OnboardingWelcome')
        break
      case 'basic_info':
        navigation.navigate('OnboardingBasicInfo')
        break
      case 'restrictions':
        navigation.navigate('OnboardingRestrictions')
        break
      case 'severity':
        navigation.navigate('OnboardingSeverity')
        break
      case 'emergency':
        navigation.navigate('OnboardingEmergency')
        break
      case 'completion':
        navigation.navigate('OnboardingCompletion')
        break
    }
  }

  const exitOnboarding = () => {
    // Navigate back to welcome or main app depending on auth state
    navigation.navigate('Welcome')
  }

  return {
    startOnboarding,
    resumeOnboarding,
    skipToStep,
    exitOnboarding,
    currentStep: state.currentStep,
    isComplete: state.isComplete,
  }
}

/**
 * Helper component to determine onboarding status and provide navigation options
 */
export const OnboardingCoordinator: React.FC<OnboardingCoordinatorProps> = ({
  onComplete,
  startStep,
}) => {
  const { startOnboarding, resumeOnboarding, skipToStep } = useOnboardingNavigation()
  const { state } = useOnboarding()

  React.useEffect(() => {
    if (state.isComplete && onComplete) {
      onComplete()
    }
  }, [state.isComplete, onComplete])

  React.useEffect(() => {
    if (startStep) {
      skipToStep(startStep)
    }
  }, [startStep, skipToStep])

  // This component doesn't render anything, it's just a coordinator
  return null
}

/**
 * Hook to check if user needs onboarding
 */
export const useOnboardingStatus = () => {
  const { state } = useOnboarding()
  
  const needsOnboarding = !state.isComplete
  const hasStartedOnboarding = state.currentStep !== 'welcome' || 
                               state.basicInfo.fullName || 
                               state.selectedRestrictions.length > 0
  
  const canResumeOnboarding = hasStartedOnboarding && !state.isComplete
  
  const getCompletionPercentage = () => {
    const stepOrder = ['welcome', 'basic_info', 'restrictions_category', 'restrictions_severity', 'emergency_contacts', 'verification', 'complete']
    const currentIndex = stepOrder.indexOf(state.currentStep)
    return Math.round(((currentIndex + 1) / stepOrder.length) * 100)
  }

  return {
    needsOnboarding,
    hasStartedOnboarding,
    canResumeOnboarding,
    currentStep: state.currentStep,
    isComplete: state.isComplete,
    completionPercentage: getCompletionPercentage(),
  }
}

/**
 * Utility functions for onboarding flow management
 */
export const OnboardingUtils = {
  /**
   * Determines if onboarding can be skipped based on user's restrictions
   */
  canSkipOnboarding: (selectedRestrictions: any[]) => {
    // Never allow skipping if there are life-threatening allergies
    const hasLifeThreatening = selectedRestrictions.some(
      r => r.severity === 'life_threatening'
    )
    return !hasLifeThreatening
  },

  /**
   * Gets required steps based on user's selections
   */
  getRequiredSteps: (state: any) => {
    const baseSteps = ['welcome', 'basic_info']
    
    if (state.selectedRestrictions.length > 0) {
      baseSteps.push('restrictions_severity')
    }
    
    const hasHighRiskRestrictions = state.selectedRestrictions.some(
      (r: any) => r.severity === 'severe' || r.severity === 'life_threatening'
    )
    
    if (hasHighRiskRestrictions) {
      baseSteps.push('emergency_contacts')
    }
    
    baseSteps.push('verification')
    
    return baseSteps
  },

  /**
   * Validates if user can proceed from current step
   */
  canProceedFromStep: (step: string, state: any) => {
    switch (step) {
      case 'welcome':
        return state.consentGiven.medicalDataHandling && 
               state.consentGiven.termsOfService && 
               state.consentGiven.privacyPolicy

      case 'basic_info':
        return state.basicInfo.fullName && 
               state.basicInfo.dateOfBirth && 
               state.basicInfo.accountType

      case 'restrictions_category':
        // This step can be skipped if no restrictions
        return true

      case 'restrictions_severity':
        // All selected restrictions must have severity
        return state.selectedRestrictions.every((r: any) => r.severity)

      case 'emergency_contacts':
        const hasLifeThreatening = state.selectedRestrictions.some(
          (r: any) => r.severity === 'life_threatening'
        )
        // Required for life-threatening allergies
        return !hasLifeThreatening || state.emergencyContacts.length > 0

      case 'verification':
        // All previous steps must be valid
        return true

      default:
        return false
    }
  },

  /**
   * Gets safety warnings for current configuration
   */
  getSafetyWarnings: (state: any) => {
    const warnings: string[] = []
    
    const lifeThreatening = state.selectedRestrictions.filter(
      (r: any) => r.severity === 'life_threatening'
    )
    
    if (lifeThreatening.length > 0) {
      if (state.emergencyContacts.length === 0) {
        warnings.push('Emergency contacts required for life-threatening allergies')
      }
      
      const unverified = lifeThreatening.filter((r: any) => !r.doctorVerified)
      if (unverified.length > 0) {
        warnings.push('Life-threatening allergies should be medically verified')
      }
      
      if (!state.consentGiven.emergencySharing) {
        warnings.push('Emergency information sharing consent recommended for safety')
      }
    }
    
    return warnings
  }
}

export default OnboardingCoordinator