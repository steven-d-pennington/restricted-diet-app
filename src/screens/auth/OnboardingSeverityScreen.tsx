/**
 * Onboarding Severity Configuration Screen
 * 
 * SAFETY CRITICAL: Configures severity levels for selected dietary restrictions
 * Includes medical validation requirements and cross-contamination sensitivity
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useOnboarding, getStepInfo, SelectedRestriction } from '../../contexts/OnboardingContext'
import { RestrictionSeverity } from '../../types/database.types'
import { 
  useButtonClasses, 
  useInputClasses, 
  useAlertClasses,
  useSafetyClasses,
  cn 
} from '../../utils/designSystem'

interface SeverityOption {
  level: RestrictionSeverity
  title: string
  description: string
  icon: string
  color: string
  examples: string[]
  requiresVerification: boolean
  requiresEmergencyInfo: boolean
}

const SEVERITY_OPTIONS: SeverityOption[] = [
  {
    level: 'mild',
    title: 'Mild',
    description: 'Minor discomfort or digestive issues',
    icon: '🟡',
    color: 'safety-caution',
    examples: [
      'Slight stomach discomfort',
      'Minor bloating or gas',
      'Mild taste preference',
      'Non-urgent dietary choice',
    ],
    requiresVerification: false,
    requiresEmergencyInfo: false,
  },
  {
    level: 'moderate',
    title: 'Moderate',
    description: 'Noticeable symptoms affecting daily activities',
    icon: '🟠',
    color: 'safety-caution',
    examples: [
      'Significant digestive issues',
      'Headaches or fatigue',
      'Skin irritation',
      'Strong dietary intolerance',
    ],
    requiresVerification: false,
    requiresEmergencyInfo: false,
  },
  {
    level: 'severe',
    title: 'Severe',
    description: 'Serious symptoms requiring medical attention',
    icon: '🔴',
    color: 'safety-danger',
    examples: [
      'Severe digestive distress',
      'Respiratory issues',
      'Significant skin reactions',
      'Requires medical monitoring',
    ],
    requiresVerification: true,
    requiresEmergencyInfo: true,
  },
  {
    level: 'life_threatening',
    title: 'Life-Threatening',
    description: 'Anaphylaxis or other life-threatening reactions',
    icon: '🚨',
    color: 'safety-danger',
    examples: [
      'Anaphylaxis risk',
      'Severe allergic reactions',
      'Emergency medication required',
      'Immediate medical attention needed',
    ],
    requiresVerification: true,
    requiresEmergencyInfo: true,
  },
]

interface RestrictionFormData {
  severity: RestrictionSeverity | null
  doctorVerified: boolean
  diagnosedDate: Date | null
  notes: string
  crossContaminationSensitive: boolean
}

export const OnboardingSeverityScreen: React.FC = () => {
  const { state, dispatch, goToNextStep, goToPreviousStep, validateCurrentStep, getStepProgress } = useOnboarding()
  const { getButtonClass, getOutlineButtonClass } = useButtonClasses()
  const { getInputClass, getLabelClass, getErrorClass } = useInputClasses()
  const { getAlertClass } = useAlertClasses()
  const { getStatusClass } = useSafetyClasses()

  const [currentRestrictionIndex, setCurrentRestrictionIndex] = useState(0)
  const [formData, setFormData] = useState<Record<string, RestrictionFormData>>({})
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const stepInfo = getStepInfo('restrictions_severity')
  const progress = getStepProgress()

  const currentRestriction = state.selectedRestrictions[currentRestrictionIndex]
  const totalRestrictions = state.selectedRestrictions.length

  // Initialize form data for all restrictions
  useEffect(() => {
    const initialFormData: Record<string, RestrictionFormData> = {}
    
    state.selectedRestrictions.forEach(restriction => {
      initialFormData[restriction.id] = {
        severity: restriction.severity || null,
        doctorVerified: restriction.doctorVerified,
        diagnosedDate: restriction.diagnosedDate ? new Date(restriction.diagnosedDate) : null,
        notes: restriction.notes || '',
        crossContaminationSensitive: restriction.crossContaminationSensitive,
      }
    })
    
    setFormData(initialFormData)
  }, [state.selectedRestrictions])

  // Update context when form data changes
  useEffect(() => {
    if (!currentRestriction) return

    const currentFormData = formData[currentRestriction.id]
    if (!currentFormData) return

    dispatch({
      type: 'UPDATE_RESTRICTION',
      payload: {
        id: currentRestriction.id,
        updates: {
          severity: currentFormData.severity || undefined,
          doctorVerified: currentFormData.doctorVerified,
          diagnosedDate: currentFormData.diagnosedDate?.toISOString().split('T')[0],
          notes: currentFormData.notes,
          crossContaminationSensitive: currentFormData.crossContaminationSensitive,
        },
      },
    })
  }, [formData, currentRestriction, dispatch])

  const updateFormData = (field: keyof RestrictionFormData, value: any) => {
    if (!currentRestriction) return

    setFormData(prev => ({
      ...prev,
      [currentRestriction.id]: {
        ...prev[currentRestriction.id],
        [field]: value,
      },
    }))
  }

  const handleSeveritySelect = (severity: RestrictionSeverity) => {
    const severityOption = SEVERITY_OPTIONS.find(opt => opt.level === severity)
    
    if (severityOption?.requiresVerification) {
      Alert.alert(
        'Medical Verification Required',
        `${severityOption.title} restrictions require verification from a medical professional. This helps ensure accurate emergency response and safety protocols.\n\nYou can mark this as verified now if you have medical documentation, or leave it unverified and update it later.`,
        [{ text: 'OK', style: 'default' }]
      )
    }
    
    updateFormData('severity', severity)
    
    // Auto-set requirements based on severity
    if (severityOption?.requiresVerification) {
      // Don't auto-check verification, let user decide
    }
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      updateFormData('diagnosedDate', selectedDate)
    }
  }

  const handleNext = () => {
    if (currentRestrictionIndex < totalRestrictions - 1) {
      setCurrentRestrictionIndex(currentRestrictionIndex + 1)
    } else {
      handleContinue()
    }
  }

  const handlePrevious = () => {
    if (currentRestrictionIndex > 0) {
      setCurrentRestrictionIndex(currentRestrictionIndex - 1)
    } else {
      goToPreviousStep()
    }
  }

  const handleContinue = () => {
    const validation = validateCurrentStep()
    setErrors(validation.errors)
    
    if (!validation.isValid) {
      Alert.alert(
        'Incomplete Configuration',
        validation.errors.join('\n\n'),
        [{ text: 'OK', style: 'default' }]
      )
      return
    }

    const lifeThreatening = state.selectedRestrictions.filter(r => r.severity === 'life_threatening')
    if (lifeThreatening.length > 0) {
      Alert.alert(
        'Life-Threatening Allergies Detected',
        `You have ${lifeThreatening.length} life-threatening restriction(s). The next step will help you set up emergency contacts and safety protocols.\n\nPlease ensure you have:\n• Emergency medication (EpiPen, inhaler, etc.)\n• Emergency contact information\n• Medical provider details`,
        [
          {
            text: 'Continue',
            style: 'default',
            onPress: goToNextStep,
          },
        ]
      )
      return
    }

    goToNextStep()
  }

  const renderSeverityOption = (option: SeverityOption) => {
    const currentFormData = formData[currentRestriction?.id]
    const isSelected = currentFormData?.severity === option.level
    
    return (
      <TouchableOpacity
        key={option.level}
        className={cn(
          'border-2 rounded-xl p-4 mb-3',
          isSelected 
            ? `border-${option.color}-500 bg-${option.color}-50` 
            : 'border-neutral-200 bg-white'
        )}
        onPress={() => handleSeveritySelect(option.level)}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={option.title}
        accessibilityHint={option.description}
      >
        <View className="flex-row items-start">
          <Text className="text-2xl mr-3">{option.icon}</Text>
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-2">
              <Text className={cn(
                'text-lg font-semibold',
                isSelected ? `text-${option.color}-700` : 'text-neutral-900'
              )}>
                {option.title}
              </Text>
              <View className={cn(
                'w-6 h-6 rounded-full border-2',
                isSelected 
                  ? `border-${option.color}-500 bg-${option.color}-500` 
                  : 'border-neutral-300 bg-white'
              )}>
                {isSelected && (
                  <View className="flex-1 items-center justify-center">
                    <View className="w-2 h-2 rounded-full bg-white" />
                  </View>
                )}
              </View>
            </View>
            
            <Text className="text-sm text-neutral-600 mb-2">
              {option.description}
            </Text>
            
            <Text className="text-xs text-neutral-500 mb-2">
              Examples: {option.examples.slice(0, 2).join(', ')}
            </Text>
            
            {(option.requiresVerification || option.requiresEmergencyInfo) && (
              <View className="flex-row flex-wrap">
                {option.requiresVerification && (
                  <View className="bg-info-100 px-2 py-1 rounded-full mr-2 mb-1">
                    <Text className="text-xs text-info-700">Medical verification recommended</Text>
                  </View>
                )}
                {option.requiresEmergencyInfo && (
                  <View className="bg-safety-caution-100 px-2 py-1 rounded-full">
                    <Text className="text-xs text-safety-caution-700">Emergency contacts required</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  if (!currentRestriction) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-lg text-neutral-600">No restrictions to configure</Text>
        <TouchableOpacity
          className={cn(getButtonClass('primary', 'lg'), 'mt-4')}
          onPress={goToPreviousStep}
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const currentFormData = formData[currentRestriction.id] || {}

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with Progress */}
      <View className="border-b border-neutral-200 px-6 py-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm text-neutral-500">
            Step {progress.current} of {progress.total}
          </Text>
          <Text className="text-sm text-neutral-500">
            Restriction {currentRestrictionIndex + 1} of {totalRestrictions}
          </Text>
        </View>
        <View className="w-full h-2 bg-neutral-200 rounded-full mb-2">
          <View 
            className="h-2 bg-primary-500 rounded-full"
            style={{ width: `${progress.percentage}%` }}
          />
        </View>
        <View className="w-full h-1 bg-neutral-100 rounded-full">
          <View 
            className="h-1 bg-primary-300 rounded-full"
            style={{ width: `${((currentRestrictionIndex + 1) / totalRestrictions) * 100}%` }}
          />
        </View>
        <Text className="text-2xl font-bold text-neutral-900 mt-4">
          Configure: {currentRestriction.name}
        </Text>
        <Text className="text-base text-neutral-600">
          Set severity level and safety preferences
        </Text>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Restriction Info */}
        <View className={cn(getAlertClass('info'), 'mb-6')}>
          <Text className="text-base font-medium text-info-800 mb-1">
            {currentRestriction.name} ({currentRestriction.category})
          </Text>
          <Text className="text-sm text-info-700">
            Please configure the severity level and safety settings for accurate risk assessment.
          </Text>
        </View>

        {/* Severity Selection */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-neutral-900 mb-4">
            Severity Level *
          </Text>
          <Text className="text-sm text-neutral-600 mb-4">
            Select the severity that best describes your reaction to this restriction:
          </Text>
          
          {SEVERITY_OPTIONS.map(renderSeverityOption)}
          
          {errors.some(e => e.includes('severity')) && (
            <Text className={getErrorClass()}>Please select a severity level</Text>
          )}
        </View>

        {/* Additional Configuration */}
        {currentFormData.severity && (
          <View className="mb-8">
            <Text className="text-lg font-semibold text-neutral-900 mb-4">
              Additional Information
            </Text>
            
            {/* Medical Verification */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-1">
                  <Text className={getLabelClass(false)}>
                    Medically Verified
                  </Text>
                  <Text className="text-sm text-neutral-500">
                    Has this restriction been diagnosed by a healthcare provider?
                  </Text>
                </View>
                <Switch
                  value={currentFormData.doctorVerified}
                  onValueChange={(value) => updateFormData('doctorVerified', value)}
                  trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                  thumbColor={currentFormData.doctorVerified ? '#ffffff' : '#f3f4f6'}
                />
              </View>
            </View>

            {/* Diagnosis Date */}
            {currentFormData.doctorVerified && (
              <View className="mb-4">
                <Text className={getLabelClass(false)}>
                  Diagnosis Date (Optional)
                </Text>
                <TouchableOpacity
                  className={cn(getInputClass(false), 'justify-center')}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text className={cn(
                    'text-base',
                    currentFormData.diagnosedDate ? 'text-neutral-900' : 'text-neutral-400'
                  )}>
                    {currentFormData.diagnosedDate 
                      ? currentFormData.diagnosedDate.toLocaleDateString()
                      : 'Select diagnosis date'
                    }
                  </Text>
                </TouchableOpacity>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={currentFormData.diagnosedDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </View>
            )}

            {/* Cross-contamination Sensitivity */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-1">
                  <Text className={getLabelClass(false)}>
                    Cross-Contamination Sensitive
                  </Text>
                  <Text className="text-sm text-neutral-500">
                    Do you react to trace amounts or shared cooking surfaces?
                  </Text>
                </View>
                <Switch
                  value={currentFormData.crossContaminationSensitive}
                  onValueChange={(value) => updateFormData('crossContaminationSensitive', value)}
                  trackColor={{ false: '#e5e7eb', true: '#f59e0b' }}
                  thumbColor={currentFormData.crossContaminationSensitive ? '#ffffff' : '#f3f4f6'}
                />
              </View>
            </View>

            {/* Notes */}
            <View className="mb-4">
              <Text className={getLabelClass(false)}>
                Additional Notes (Optional)
              </Text>
              <TextInput
                className={cn(getInputClass(false), 'h-20')}
                value={currentFormData.notes}
                onChangeText={(value) => updateFormData('notes', value)}
                placeholder="Add any additional information about this restriction..."
                multiline
                textAlignVertical="top"
                returnKeyType="done"
              />
            </View>
          </View>
        )}

        {/* High-Risk Warning */}
        {(currentFormData.severity === 'severe' || currentFormData.severity === 'life_threatening') && (
          <View className={getAlertClass('warning')}>
            <View className="flex-row items-start">
              <Text className="text-xl mr-2">⚠️</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-safety-caution-800 mb-1">
                  High-Risk Restriction Detected
                </Text>
                <Text className="text-sm text-safety-caution-700 leading-relaxed">
                  {currentFormData.severity === 'life_threatening' 
                    ? 'This life-threatening restriction requires emergency contacts and medication information. Make sure you have emergency medications (like an EpiPen) available at all times.'
                    : 'This severe restriction may require emergency contacts and medical provider information for safety purposes.'
                  }
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="border-t border-neutral-200 p-4 bg-white">
        <View className="flex-row space-x-3">
          <TouchableOpacity
            className={cn(getOutlineButtonClass('secondary', 'lg'), 'flex-1')}
            onPress={handlePrevious}
            accessibilityRole="button"
            accessibilityLabel="Go to previous restriction or step"
          >
            <Text className="text-base font-medium text-neutral-700">
              {currentRestrictionIndex === 0 ? 'Back' : 'Previous'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={cn(
              getButtonClass('primary', 'lg'),
              'flex-2',
              !currentFormData.severity && 'opacity-50'
            )}
            onPress={handleNext}
            disabled={!currentFormData.severity}
            accessibilityRole="button"
            accessibilityLabel={
              currentRestrictionIndex < totalRestrictions - 1 
                ? 'Continue to next restriction' 
                : 'Continue to emergency contacts'
            }
          >
            <Text className="text-base font-medium text-white">
              {currentRestrictionIndex < totalRestrictions - 1 ? 'Next Restriction' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {!currentFormData.severity && (
          <Text className="text-xs text-neutral-500 text-center mt-2">
            Please select a severity level to continue
          </Text>
        )}
      </View>
    </SafeAreaView>
  )
}