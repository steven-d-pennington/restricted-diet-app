/**
 * Onboarding Completion Screen
 * 
 * SAFETY CRITICAL: Final verification and summary of user's dietary restriction profile
 * Includes safety checklist and profile verification before completing onboarding
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useOnboarding, getStepInfo } from '../../contexts/OnboardingContext'
import { useAuth } from '../../contexts/AuthContext'
import { 
  useButtonClasses, 
  useAlertClasses,
  useSafetyClasses,
  getSafetyInfo,
  cn 
} from '../../utils/designSystem'

interface SafetyChecklistItem {
  id: string
  label: string
  description: string
  completed: boolean
  required: boolean
  criticalForSafety: boolean
}

export const OnboardingCompletionScreen: React.FC = () => {
  const { state, dispatch, hasLifeThreateningAllergies, getStepProgress } = useOnboarding()
  const { user } = useAuth()
  const { getButtonClass, getOutlineButtonClass } = useButtonClasses()
  const { getAlertClass } = useAlertClasses()
  const { getStatusBadgeClass } = useSafetyClasses()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [finalConsent, setFinalConsent] = useState(false)
  const [emergencyCardConsent, setEmergencyCardConsent] = useState(false)

  const stepInfo = getStepInfo('verification')
  const progress = getStepProgress()

  // Generate safety checklist based on user's profile
  const generateSafetyChecklist = (): SafetyChecklistItem[] => {
    const checklist: SafetyChecklistItem[] = [
      {
        id: 'basic_info_complete',
        label: 'Personal information provided',
        description: 'Name, date of birth, and account type configured',
        completed: !!(state.basicInfo.fullName && state.basicInfo.dateOfBirth && state.basicInfo.accountType),
        required: true,
        criticalForSafety: false,
      },
      {
        id: 'restrictions_configured',
        label: 'Dietary restrictions configured',
        description: 'All restrictions have severity levels and settings configured',
        completed: state.selectedRestrictions.length > 0 && state.selectedRestrictions.every(r => r.severity),
        required: false,
        criticalForSafety: true,
      },
      {
        id: 'high_risk_verified',
        label: 'High-risk restrictions verified',
        description: 'Severe and life-threatening allergies have been properly configured',
        completed: state.selectedRestrictions
          .filter(r => r.severity === 'severe' || r.severity === 'life_threatening')
          .every(r => r.doctorVerified || r.notes),
        required: hasLifeThreateningAllergies(),
        criticalForSafety: true,
      },
      {
        id: 'emergency_contacts',
        label: 'Emergency contacts added',
        description: 'At least one emergency contact for high-risk allergies',
        completed: !hasLifeThreateningAllergies() || state.emergencyContacts.length > 0,
        required: hasLifeThreateningAllergies(),
        criticalForSafety: true,
      },
      {
        id: 'medical_providers',
        label: 'Medical providers added',
        description: 'Healthcare providers who manage your dietary restrictions',
        completed: state.medicalProviders.length > 0,
        required: false,
        criticalForSafety: false,
      },
      {
        id: 'cross_contamination_set',
        label: 'Cross-contamination preferences set',
        description: 'Contamination sensitivity configured for applicable restrictions',
        completed: state.selectedRestrictions
          .filter(r => r.severity === 'severe' || r.severity === 'life_threatening')
          .every(r => r.crossContaminationSensitive !== undefined),
        required: hasLifeThreateningAllergies(),
        criticalForSafety: true,
      },
    ]

    return checklist
  }

  const [safetyChecklist, setSafetyChecklist] = useState<SafetyChecklistItem[]>(generateSafetyChecklist())

  useEffect(() => {
    setSafetyChecklist(generateSafetyChecklist())
  }, [state])

  const handleCompleteOnboarding = async () => {
    // Final validation
    const requiredItems = safetyChecklist.filter(item => item.required && !item.completed)
    if (requiredItems.length > 0) {
      Alert.alert(
        'Setup Incomplete',
        `The following required items must be completed:\n\n${requiredItems.map(item => `• ${item.label}`).join('\n')}`,
        [{ text: 'OK', style: 'default' }]
      )
      return
    }

    if (!finalConsent) {
      Alert.alert(
        'Consent Required',
        'Please confirm that all information is accurate before completing setup.',
        [{ text: 'OK', style: 'default' }]
      )
      return
    }

    if (hasLifeThreateningAllergies() && !emergencyCardConsent) {
      Alert.alert(
        'Emergency Information Consent',
        'Please consent to emergency information sharing for life-threatening allergies.',
        [{ text: 'OK', style: 'default' }]
      )
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, this would save to Supabase
      await saveProfileToDatabase()
      
      // Mark onboarding as complete
      dispatch({ type: 'COMPLETE_ONBOARDING' })
      
      // Show success message
      Alert.alert(
        'Profile Created Successfully',
        'Your dietary restriction profile has been created and is ready to help keep you safe. You can now scan products, view your emergency card, and manage your restrictions.',
        [
          {
            text: 'Get Started',
            style: 'default',
            onPress: () => {
              // Navigate to main app
              // This would typically be handled by the navigation system
            },
          },
        ]
      )
    } catch (error) {
      Alert.alert(
        'Setup Error',
        'There was an error saving your profile. Please try again.',
        [{ text: 'OK', style: 'default' }]
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveProfileToDatabase = async () => {
    // Mock implementation - in real app this would use Supabase
    return new Promise(resolve => setTimeout(resolve, 2000))
  }

  const handleGoBack = () => {
    Alert.alert(
      'Go Back',
      'Are you sure you want to go back? Your information will be saved.',
      [
        { text: 'Stay Here', style: 'cancel' },
        { text: 'Go Back', style: 'default', onPress: () => {
          // Navigate back to previous step
        }},
      ]
    )
  }

  const renderProfileSummary = () => {
    const highRiskCount = state.selectedRestrictions.filter(
      r => r.severity === 'severe' || r.severity === 'life_threatening'
    ).length

    const lifeThreatening = state.selectedRestrictions.filter(r => r.severity === 'life_threatening')
    const severe = state.selectedRestrictions.filter(r => r.severity === 'severe')
    const moderate = state.selectedRestrictions.filter(r => r.severity === 'moderate')
    const mild = state.selectedRestrictions.filter(r => r.severity === 'mild')

    return (
      <View className="mb-6">
        <Text className="text-lg font-semibold text-neutral-900 mb-4">
          Your Safety Profile
        </Text>
        
        {/* Basic Info Summary */}
        <View className="bg-neutral-50 rounded-xl p-4 mb-4">
          <Text className="font-semibold text-neutral-900 mb-2">Personal Information</Text>
          <Text className="text-sm text-neutral-600">
            Name: {state.basicInfo.fullName}
          </Text>
          <Text className="text-sm text-neutral-600">
            Account Type: {state.basicInfo.accountType}
          </Text>
          {state.basicInfo.medicalConditions && state.basicInfo.medicalConditions.length > 0 && (
            <Text className="text-sm text-neutral-600">
              Medical Conditions: {state.basicInfo.medicalConditions.join(', ')}
            </Text>
          )}
        </View>

        {/* Restrictions Summary */}
        {state.selectedRestrictions.length > 0 ? (
          <View className="bg-neutral-50 rounded-xl p-4 mb-4">
            <Text className="font-semibold text-neutral-900 mb-3">
              Dietary Restrictions ({state.selectedRestrictions.length})
            </Text>
            
            {lifeThreatening.length > 0 && (
              <View className="mb-3">
                <View className="flex-row items-center mb-2">
                  <Text className="text-sm font-medium text-safety-danger-700">🚨 Life-Threatening</Text>
                </View>
                {lifeThreatening.map(restriction => (
                  <View key={restriction.id} className="flex-row items-center mb-1">
                    <Text className="text-sm text-neutral-700">• {restriction.name}</Text>
                    {restriction.doctorVerified && (
                      <Text className="text-xs text-safety-safe-600 ml-2">✓ Verified</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {severe.length > 0 && (
              <View className="mb-3">
                <Text className="text-sm font-medium text-safety-danger-600 mb-1">🔴 Severe</Text>
                {severe.map(restriction => (
                  <Text key={restriction.id} className="text-sm text-neutral-700">• {restriction.name}</Text>
                ))}
              </View>
            )}

            {moderate.length > 0 && (
              <View className="mb-3">
                <Text className="text-sm font-medium text-safety-caution-600 mb-1">🟠 Moderate</Text>
                {moderate.map(restriction => (
                  <Text key={restriction.id} className="text-sm text-neutral-700">• {restriction.name}</Text>
                ))}
              </View>
            )}

            {mild.length > 0 && (
              <View className="mb-1">
                <Text className="text-sm font-medium text-safety-caution-500 mb-1">🟡 Mild</Text>
                {mild.map(restriction => (
                  <Text key={restriction.id} className="text-sm text-neutral-700">• {restriction.name}</Text>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View className="bg-neutral-50 rounded-xl p-4 mb-4">
            <Text className="text-sm text-neutral-600">No dietary restrictions configured</Text>
          </View>
        )}

        {/* Emergency Contacts Summary */}
        {state.emergencyContacts.length > 0 && (
          <View className="bg-neutral-50 rounded-xl p-4 mb-4">
            <Text className="font-semibold text-neutral-900 mb-2">
              Emergency Contacts ({state.emergencyContacts.length})
            </Text>
            {state.emergencyContacts.map((contact, index) => (
              <Text key={index} className="text-sm text-neutral-600">
                • {contact.name} ({contact.relationship})
                {contact.isPrimary && ' - Primary'}
              </Text>
            ))}
          </View>
        )}

        {/* Medical Providers Summary */}
        {state.medicalProviders.length > 0 && (
          <View className="bg-neutral-50 rounded-xl p-4 mb-4">
            <Text className="font-semibold text-neutral-900 mb-2">
              Medical Providers ({state.medicalProviders.length})
            </Text>
            {state.medicalProviders.map((provider, index) => (
              <Text key={index} className="text-sm text-neutral-600">
                • {provider.name} ({provider.type})
              </Text>
            ))}
          </View>
        )}
      </View>
    )
  }

  const renderSafetyChecklist = () => {
    const completedItems = safetyChecklist.filter(item => item.completed).length
    const totalItems = safetyChecklist.length
    const requiredIncomplete = safetyChecklist.filter(item => item.required && !item.completed).length

    return (
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-neutral-900">
            Safety Checklist
          </Text>
          <Text className="text-sm text-neutral-500">
            {completedItems}/{totalItems} Complete
          </Text>
        </View>

        {requiredIncomplete > 0 && (
          <View className={cn(getAlertClass('warning'), 'mb-4')}>
            <Text className="text-sm font-medium text-safety-caution-800 mb-1">
              {requiredIncomplete} Required Item{requiredIncomplete > 1 ? 's' : ''} Remaining
            </Text>
            <Text className="text-sm text-safety-caution-700">
              Please complete all required items before finishing setup.
            </Text>
          </View>
        )}

        {safetyChecklist.map(item => (
          <View 
            key={item.id} 
            className={cn(
              'flex-row items-start p-3 rounded-lg mb-2',
              item.completed ? 'bg-safety-safe-50' : 'bg-neutral-50',
              item.required && !item.completed && 'border border-safety-caution-200'
            )}
          >
            <View className={cn(
              'w-6 h-6 rounded-full mr-3 mt-0.5 items-center justify-center',
              item.completed 
                ? 'bg-safety-safe-500' 
                : item.required 
                  ? 'bg-safety-caution-200' 
                  : 'bg-neutral-300'
            )}>
              <Text className={cn(
                'text-xs font-bold',
                item.completed ? 'text-white' : 'text-neutral-600'
              )}>
                {item.completed ? '✓' : item.required ? '!' : '○'}
              </Text>
            </View>
            
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className={cn(
                  'text-sm font-medium',
                  item.completed ? 'text-safety-safe-800' : 'text-neutral-900'
                )}>
                  {item.label}
                </Text>
                {item.required && (
                  <Text className="text-safety-caution-500 ml-1 text-xs">*</Text>
                )}
                {item.criticalForSafety && (
                  <View className="bg-safety-danger-100 px-1 py-0.5 rounded ml-2">
                    <Text className="text-xs text-safety-danger-700">Critical</Text>
                  </View>
                )}
              </View>
              <Text className="text-xs text-neutral-600">{item.description}</Text>
            </div>
          </View>
        ))}
      </View>
    )
  }

  const renderFinalConsents = () => (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-neutral-900 mb-4">
        Final Verification
      </Text>

      <TouchableOpacity
        className="flex-row items-start mb-4"
        onPress={() => setFinalConsent(!finalConsent)}
      >
        <View className={cn(
          'w-5 h-5 rounded border-2 mr-3 mt-1 items-center justify-center',
          finalConsent ? 'bg-primary-500 border-primary-500' : 'border-neutral-300'
        )}>
          {finalConsent && (
            <Text className="text-white text-xs font-bold">✓</Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-neutral-900 mb-1">
            Information Accuracy Confirmation *
          </Text>
          <Text className="text-xs text-neutral-600 leading-relaxed">
            I confirm that all information provided is accurate to the best of my knowledge. I understand that incorrect information could compromise my safety and the effectiveness of this app.
          </Text>
        </View>
      </TouchableOpacity>

      {hasLifeThreateningAllergies() && (
        <TouchableOpacity
          className="flex-row items-start mb-4"
          onPress={() => setEmergencyCardConsent(!emergencyCardConsent)}
        >
          <View className={cn(
            'w-5 h-5 rounded border-2 mr-3 mt-1 items-center justify-center',
            emergencyCardConsent ? 'bg-primary-500 border-primary-500' : 'border-neutral-300'
          )}>
            {emergencyCardConsent && (
              <Text className="text-white text-xs font-bold">✓</Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-neutral-900 mb-1">
              Emergency Information Sharing *
            </Text>
            <Text className="text-xs text-neutral-600 leading-relaxed">
              I consent to sharing my dietary restriction and emergency contact information with healthcare providers, first responders, and emergency personnel when necessary for my safety and medical care.
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  )

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with Progress */}
      <View className="border-b border-neutral-200 px-6 py-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm text-neutral-500">
            Step {progress.current} of {progress.total}
          </Text>
          <Text className="text-sm text-neutral-500">
            {progress.percentage}% Complete
          </Text>
        </View>
        <View className="w-full h-2 bg-neutral-200 rounded-full">
          <View 
            className="h-2 bg-primary-500 rounded-full"
            style={{ width: `${progress.percentage}%` }}
          />
        </View>
        <Text className="text-2xl font-bold text-neutral-900 mt-4">
          {stepInfo.title}
        </Text>
        <Text className="text-base text-neutral-600">
          {stepInfo.subtitle}
        </Text>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Message */}
        <View className={cn(getAlertClass('success'), 'mb-6')}>
          <View className="flex-row items-start">
            <Text className="text-xl mr-2">✅</Text>
            <View className="flex-1">
              <Text className="text-base font-semibold text-safety-safe-800 mb-1">
                Profile Setup Nearly Complete
              </Text>
              <Text className="text-sm text-safety-safe-700 leading-relaxed">
                Please review your information below and complete the final verification steps to activate your safety profile.
              </Text>
            </View>
          </View>
        </View>

        {renderProfileSummary()}
        {renderSafetyChecklist()}
        {renderFinalConsents()}

        {/* Next Steps Information */}
        <View className={getAlertClass('info')}>
          <Text className="text-base font-medium text-info-800 mb-2">
            What's Next?
          </Text>
          <Text className="text-sm text-info-700 leading-relaxed">
            After completing setup, you'll be able to:
            {'\n'}• Scan product barcodes for safety information
            {'\n'}• Access your emergency card and QR code
            {'\n'}• Manage your dietary restrictions and contacts
            {'\n'}• Find safe alternatives to products
            {'\n'}• Share your profile with family and caregivers
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="border-t border-neutral-200 p-4 bg-white">
        <View className="flex-row space-x-3">
          <TouchableOpacity
            className={cn(getOutlineButtonClass('secondary', 'lg'), 'flex-1')}
            onPress={handleGoBack}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Go back to previous step"
          >
            <Text className="text-base font-medium text-neutral-700">
              Back
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={cn(
              getButtonClass('primary', 'lg'),
              'flex-2',
              (!finalConsent || (hasLifeThreateningAllergies() && !emergencyCardConsent) || isSubmitting) && 'opacity-50'
            )}
            onPress={handleCompleteOnboarding}
            disabled={!finalConsent || (hasLifeThreateningAllergies() && !emergencyCardConsent) || isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Complete profile setup"
          >
            {isSubmitting ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="white" />
                <Text className="text-base font-medium text-white ml-2">
                  Creating Profile...
                </Text>
              </View>
            ) : (
              <Text className="text-base font-medium text-white">
                Complete Setup
              </Text>
            )}
          </TouchableOpacity>
        </View>
        
        <Text className="text-xs text-neutral-500 text-center mt-2">
          * Required for profile activation
        </Text>
      </View>
    </SafeAreaView>
  )
}