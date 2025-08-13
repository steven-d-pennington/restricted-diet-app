/**
 * Onboarding Welcome Screen
 * 
 * SAFETY CRITICAL: First screen of onboarding process
 * Presents safety disclaimer, consent forms, and medical data handling policies
 */

import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useOnboarding } from '../../contexts/OnboardingContext'
import { useButtonClasses, useAlertClasses, cn } from '../../utils/designSystem'

interface ConsentSection {
  id: keyof typeof initialConsent
  title: string
  content: string
  required: boolean
  critical: boolean
}

const initialConsent = {
  medicalDataHandling: false,
  termsOfService: false,
  privacyPolicy: false,
  emergencySharing: false,
}

export const OnboardingWelcomeScreen: React.FC = () => {
  const { state, dispatch, goToNextStep, canProceedToNext, validateCurrentStep } = useOnboarding()
  const { getButtonClass, getOutlineButtonClass } = useButtonClasses()
  const { getAlertClass } = useAlertClasses()

  const [localConsent, setLocalConsent] = useState(state.consentGiven)
  const [showFullDisclaimer, setShowFullDisclaimer] = useState(false)

  const consentSections: ConsentSection[] = [
    {
      id: 'medicalDataHandling',
      title: 'Medical Data Handling Consent',
      content: 'I understand that this app will collect, store, and process my medical information including dietary restrictions, allergies, and emergency contact information. This data is critical for my safety and will be handled according to HIPAA guidelines.',
      required: true,
      critical: true,
    },
    {
      id: 'termsOfService',
      title: 'Terms of Service',
      content: 'I have read and agree to the Terms of Service, including understanding that this app is a medical assistance tool and does not replace professional medical advice.',
      required: true,
      critical: true,
    },
    {
      id: 'privacyPolicy',
      title: 'Privacy Policy',
      content: 'I have read and agree to the Privacy Policy, understanding how my personal and medical data will be collected, used, and protected.',
      required: true,
      critical: true,
    },
    {
      id: 'emergencySharing',
      title: 'Emergency Information Sharing',
      content: 'I consent to sharing my dietary restriction and emergency contact information with healthcare providers and emergency responders in case of a medical emergency.',
      required: false,
      critical: false,
    },
  ]

  const safetyDisclaimer = `IMPORTANT SAFETY INFORMATION

This app is designed to assist with dietary restriction management and should not replace professional medical advice, diagnosis, or treatment. 

KEY SAFETY POINTS:
• Always verify ingredient information independently
• Consult healthcare providers for medical decisions
• Keep emergency medications (like EpiPens) readily available
• Update your restrictions if your medical condition changes
• This app cannot guarantee 100% accuracy of product information

MEDICAL DISCLAIMER:
This application is intended for informational purposes only and is not a substitute for professional medical advice. Always consult with qualified healthcare providers regarding dietary restrictions, allergies, and medical conditions.

EMERGENCY SITUATIONS:
If you experience an allergic reaction or medical emergency, seek immediate medical attention and call emergency services. Do not rely solely on this app during emergencies.`

  const handleConsentChange = (id: keyof typeof initialConsent, value: boolean) => {
    const updatedConsent = { ...localConsent, [id]: value }
    setLocalConsent(updatedConsent)
    dispatch({ type: 'UPDATE_CONSENT', payload: updatedConsent })
  }

  const handleContinue = () => {
    const validation = validateCurrentStep()
    
    if (!validation.isValid) {
      Alert.alert(
        'Required Consent Missing',
        validation.errors.join('\n\n'),
        [{ text: 'OK', style: 'default' }]
      )
      return
    }

    // Show additional confirmation for critical medical app
    Alert.alert(
      'Important Safety Confirmation',
      'By proceeding, you confirm that you understand this is a medical assistance app that requires accurate information for your safety. Incorrect information could be life-threatening.\n\nProceed with setup?',
      [
        {
          text: 'Review Again',
          style: 'cancel',
        },
        {
          text: 'Continue',
          style: 'default',
          onPress: goToNextStep,
        },
      ]
    )
  }

  const handleViewDocument = (documentType: 'terms' | 'privacy') => {
    // In a real app, this would open the actual legal documents
    Alert.alert(
      documentType === 'terms' ? 'Terms of Service' : 'Privacy Policy',
      `This would open the full ${documentType === 'terms' ? 'Terms of Service' : 'Privacy Policy'} document in a web view or document viewer.`,
      [{ text: 'OK', style: 'default' }]
    )
  }

  const renderConsentCheckbox = (section: ConsentSection) => {
    const isChecked = localConsent[section.id]
    const checkboxStyle = cn(
      'w-6 h-6 rounded border-2 mr-3 flex-shrink-0 flex items-center justify-center',
      isChecked 
        ? 'bg-primary-500 border-primary-500' 
        : 'bg-white border-neutral-300',
      section.critical && 'border-safety-danger-300'
    )

    return (
      <TouchableOpacity
        key={section.id}
        className="flex-row items-start mb-6"
        onPress={() => handleConsentChange(section.id, !isChecked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isChecked }}
        accessibilityLabel={section.title}
        accessibilityHint={section.required ? 'Required for app use' : 'Optional consent'}
      >
        <View className={checkboxStyle}>
          {isChecked && (
            <Text className="text-white text-sm font-bold">✓</Text>
          )}
        </View>
        
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <Text className={cn(
              'text-base font-semibold',
              section.critical ? 'text-safety-danger-700' : 'text-neutral-900'
            )}>
              {section.title}
            </Text>
            {section.required && (
              <Text className="text-safety-danger-500 ml-1">*</Text>
            )}
          </View>
          
          <Text className="text-sm text-neutral-600 leading-relaxed mb-2">
            {section.content}
          </Text>
          
          {(section.id === 'termsOfService' || section.id === 'privacyPolicy') && (
            <TouchableOpacity
              onPress={() => handleViewDocument(section.id === 'termsOfService' ? 'terms' : 'privacy')}
              className="self-start"
            >
              <Text className="text-primary-600 text-sm underline">
                View Full Document
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-neutral-900 mb-2">
            Welcome to SafeEats
          </Text>
          <Text className="text-lg text-neutral-600">
            Your medical-grade dietary restriction companion
          </Text>
        </View>

        {/* Critical Safety Alert */}
        <View className={getAlertClass('warning')}>
          <View className="flex-row items-start">
            <Text className="text-xl mr-2">⚠️</Text>
            <View className="flex-1">
              <Text className="text-base font-semibold text-safety-caution-800 mb-1">
                Medical Safety Notice
              </Text>
              <Text className="text-sm text-safety-caution-700 leading-relaxed">
                This app handles life-critical medical information. Please read all safety information carefully before proceeding.
              </Text>
            </View>
          </View>
        </View>

        {/* Safety Disclaimer */}
        <View className="my-6">
          <TouchableOpacity
            className="bg-neutral-50 border border-neutral-200 rounded-lg p-4"
            onPress={() => setShowFullDisclaimer(!showFullDisclaimer)}
            accessibilityRole="button"
            accessibilityLabel="Safety disclaimer"
            accessibilityHint="Tap to expand full safety information"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-neutral-900">
                Safety Disclaimer & Medical Information
              </Text>
              <Text className="text-primary-600 text-lg">
                {showFullDisclaimer ? '−' : '+'}
              </Text>
            </View>
            
            {showFullDisclaimer && (
              <Text className="text-sm text-neutral-700 leading-relaxed mt-3 whitespace-pre-line">
                {safetyDisclaimer}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Consent Sections */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-neutral-900 mb-4">
            Required Consents
          </Text>
          <Text className="text-sm text-neutral-600 mb-6">
            Please review and accept the following to continue setup:
          </Text>
          
          {consentSections.map(renderConsentCheckbox)}
        </View>

        {/* Additional Safety Information */}
        <View className={cn(getAlertClass('info'), 'mb-8')}>
          <Text className="text-base font-medium text-info-800 mb-2">
            What happens next?
          </Text>
          <Text className="text-sm text-info-700 leading-relaxed">
            We'll guide you through setting up your dietary restriction profile, including severity levels, emergency contacts, and safety preferences. This process takes about 5-10 minutes and ensures your safety when using the app.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="border-t border-neutral-200 p-4 bg-white">
        <View className="flex-row space-x-3">
          <TouchableOpacity
            className={cn(
              getOutlineButtonClass('secondary', 'lg'),
              'flex-1'
            )}
            onPress={() => {
              Alert.alert(
                'Exit Setup',
                'Are you sure you want to exit? You can return to complete your profile setup later.',
                [
                  { text: 'Continue Setup', style: 'cancel' },
                  { text: 'Exit', style: 'destructive', onPress: () => {
                    // Navigate back to welcome or login
                  }},
                ]
              )
            }}
            accessibilityRole="button"
            accessibilityLabel="Exit setup"
          >
            <Text className="text-base font-medium text-neutral-700">
              Exit
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={cn(
              getButtonClass('primary', 'lg'),
              'flex-2',
              !canProceedToNext() && 'opacity-50'
            )}
            onPress={handleContinue}
            disabled={!canProceedToNext()}
            accessibilityRole="button"
            accessibilityLabel="Continue to next step"
            accessibilityHint={!canProceedToNext() ? 'Please accept required consents first' : undefined}
          >
            <Text className="text-base font-medium text-white">
              Continue Setup
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Required field notice */}
        <Text className="text-xs text-neutral-500 text-center mt-2">
          * Required fields must be accepted to continue
        </Text>
      </View>
    </SafeAreaView>
  )
}