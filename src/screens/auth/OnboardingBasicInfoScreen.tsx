/**
 * Onboarding Basic Information Screen
 * 
 * SAFETY CRITICAL: Collects essential user information for medical profile
 * Includes account type selection and basic demographic information
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useOnboarding, getStepInfo } from '../../contexts/OnboardingContext'
import { AccountType } from '../../types/database.types'
import { 
  useButtonClasses, 
  useInputClasses, 
  useAlertClasses, 
  cn 
} from '../../utils/designSystem'

interface AccountTypeOption {
  type: AccountType
  title: string
  description: string
  icon: string
  recommended?: boolean
}

const ACCOUNT_TYPE_OPTIONS: AccountTypeOption[] = [
  {
    type: 'individual',
    title: 'Individual Account',
    description: 'Manage your own dietary restrictions and allergies',
    icon: '👤',
    recommended: true,
  },
  {
    type: 'family',
    title: 'Family Account',
    description: 'Manage dietary restrictions for multiple family members',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    type: 'caregiver',
    title: 'Caregiver Account',
    description: 'Manage dietary restrictions for people in your care',
    icon: '🩺',
  },
]

const COMMON_MEDICAL_CONDITIONS = [
  'Asthma',
  'Diabetes Type 1',
  'Diabetes Type 2',
  'Eczema',
  'GERD',
  'IBD/Crohn\'s',
  'IBS',
  'Celiac Disease',
  'Food Protein-Induced Enterocolitis Syndrome (FPIES)',
  'Eosinophilic Esophagitis',
  'Other',
]

export const OnboardingBasicInfoScreen: React.FC = () => {
  const { state, dispatch, goToNextStep, goToPreviousStep, canProceedToNext, validateCurrentStep, getStepProgress } = useOnboarding()
  const { getButtonClass, getOutlineButtonClass } = useButtonClasses()
  const { getInputClass, getLabelClass, getErrorClass } = useInputClasses()
  const { getAlertClass } = useAlertClasses()

  // Local state for form fields
  const [fullName, setFullName] = useState(state.basicInfo.fullName || '')
  const [phoneNumber, setPhoneNumber] = useState(state.basicInfo.phoneNumber || '')
  const [dateOfBirth, setDateOfBirth] = useState(
    state.basicInfo.dateOfBirth ? new Date(state.basicInfo.dateOfBirth) : new Date()
  )
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType | null>(
    state.basicInfo.accountType || null
  )
  const [selectedMedicalConditions, setSelectedMedicalConditions] = useState<string[]>(
    state.basicInfo.medicalConditions || []
  )
  const [customMedicalCondition, setCustomMedicalCondition] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showMedicalConditions, setShowMedicalConditions] = useState(false)

  // Validation errors
  const [errors, setErrors] = useState<string[]>([])

  const stepInfo = getStepInfo('basic_info')
  const progress = getStepProgress()

  // Update context when form fields change
  useEffect(() => {
    dispatch({
      type: 'UPDATE_BASIC_INFO',
      payload: {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        dateOfBirth: dateOfBirth.toISOString().split('T')[0],
        accountType: selectedAccountType || undefined,
        medicalConditions: selectedMedicalConditions,
      },
    })
  }, [fullName, phoneNumber, dateOfBirth, selectedAccountType, selectedMedicalConditions, dispatch])

  const handleAccountTypeSelect = (accountType: AccountType) => {
    setSelectedAccountType(accountType)
  }

  const handleMedicalConditionToggle = (condition: string) => {
    setSelectedMedicalConditions(prev => {
      if (prev.includes(condition)) {
        return prev.filter(c => c !== condition)
      } else {
        return [...prev, condition]
      }
    })
  }

  const handleCustomMedicalConditionAdd = () => {
    const condition = customMedicalCondition.trim()
    if (condition && !selectedMedicalConditions.includes(condition)) {
      setSelectedMedicalConditions(prev => [...prev, condition])
      setCustomMedicalCondition('')
    }
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      setDateOfBirth(selectedDate)
    }
  }

  const calculateAge = (birthDate: Date) => {
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1
    }
    return age
  }

  const handleContinue = () => {
    const validation = validateCurrentStep()
    setErrors(validation.errors)
    
    if (!validation.isValid) {
      Alert.alert(
        'Incomplete Information',
        validation.errors.join('\n\n'),
        [{ text: 'OK', style: 'default' }]
      )
      return
    }

    // Age validation
    const age = calculateAge(dateOfBirth)
    if (age < 13) {
      Alert.alert(
        'Age Requirement',
        'This app requires users to be at least 13 years old. For children under 13, please create a Family or Caregiver account.',
        [{ text: 'OK', style: 'default' }]
      )
      return
    }

    goToNextStep()
  }

  const renderAccountTypeOption = (option: AccountTypeOption) => {
    const isSelected = selectedAccountType === option.type
    
    return (
      <TouchableOpacity
        key={option.type}
        className={cn(
          'border-2 rounded-xl p-4 mb-3',
          isSelected 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-neutral-200 bg-white',
          'active:bg-neutral-50'
        )}
        onPress={() => handleAccountTypeSelect(option.type)}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={option.title}
        accessibilityHint={option.description}
      >
        <View className="flex-row items-center">
          <Text className="text-2xl mr-3">{option.icon}</Text>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className={cn(
                'text-lg font-semibold',
                isSelected ? 'text-primary-700' : 'text-neutral-900'
              )}>
                {option.title}
              </Text>
              {option.recommended && (
                <View className="bg-primary-100 px-2 py-1 rounded-full ml-2">
                  <Text className="text-xs font-medium text-primary-700">
                    Recommended
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-sm text-neutral-600 mt-1">
              {option.description}
            </Text>
          </View>
          <View className={cn(
            'w-6 h-6 rounded-full border-2',
            isSelected 
              ? 'border-primary-500 bg-primary-500' 
              : 'border-neutral-300 bg-white'
          )}>
            {isSelected && (
              <View className="flex-1 items-center justify-center">
                <View className="w-2 h-2 rounded-full bg-white" />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderMedicalConditionChip = (condition: string) => {
    const isSelected = selectedMedicalConditions.includes(condition)
    
    return (
      <TouchableOpacity
        key={condition}
        className={cn(
          'px-3 py-2 rounded-full border mr-2 mb-2',
          isSelected 
            ? 'border-primary-500 bg-primary-100' 
            : 'border-neutral-300 bg-neutral-50'
        )}
        onPress={() => handleMedicalConditionToggle(condition)}
      >
        <Text className={cn(
          'text-sm',
          isSelected ? 'text-primary-700 font-medium' : 'text-neutral-700'
        )}>
          {condition}
        </Text>
      </TouchableOpacity>
    )
  }

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
        {/* Personal Information */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-neutral-900 mb-4">
            Personal Information
          </Text>
          
          {/* Full Name */}
          <View className="mb-4">
            <Text className={getLabelClass(errors.includes('Full name is required'))}>
              Full Name *
            </Text>
            <TextInput
              className={getInputClass(errors.includes('Full name is required'))}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              accessibilityLabel="Full name"
              accessibilityHint="Enter your first and last name"
            />
            {errors.includes('Full name is required') && (
              <Text className={getErrorClass()}>Full name is required</Text>
            )}
          </View>

          {/* Date of Birth */}
          <View className="mb-4">
            <Text className={getLabelClass(errors.includes('Date of birth is required'))}>
              Date of Birth *
            </Text>
            <TouchableOpacity
              className={cn(
                getInputClass(errors.includes('Date of birth is required')),
                'justify-center'
              )}
              onPress={() => setShowDatePicker(true)}
            >
              <Text className={cn(
                'text-base',
                dateOfBirth ? 'text-neutral-900' : 'text-neutral-400'
              )}>
                {dateOfBirth.toLocaleDateString()} ({calculateAge(dateOfBirth)} years old)
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
              />
            )}
          </View>

          {/* Phone Number (Optional) */}
          <View className="mb-4">
            <Text className={getLabelClass(false)}>
              Phone Number
              <Text className="text-neutral-400 text-sm"> (Optional)</Text>
            </Text>
            <TextInput
              className={getInputClass(false)}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              returnKeyType="done"
              accessibilityLabel="Phone number"
              accessibilityHint="Optional contact phone number"
            />
          </View>
        </View>

        {/* Account Type Selection */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-neutral-900 mb-2">
            Account Type *
          </Text>
          <Text className="text-sm text-neutral-600 mb-4">
            Choose the type of account that best fits your needs:
          </Text>
          
          {ACCOUNT_TYPE_OPTIONS.map(renderAccountTypeOption)}
          
          {errors.includes('Account type selection is required') && (
            <Text className={getErrorClass()}>Please select an account type</Text>
          )}
        </View>

        {/* Medical Conditions */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold text-neutral-900">
              Medical Conditions
            </Text>
            <TouchableOpacity
              onPress={() => setShowMedicalConditions(!showMedicalConditions)}
            >
              <Text className="text-primary-600 text-sm">
                {showMedicalConditions ? 'Hide' : 'Show Options'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text className="text-sm text-neutral-600 mb-4">
            Select any medical conditions that may affect your dietary needs (optional but recommended for safety):
          </Text>

          {showMedicalConditions && (
            <>
              <View className="flex-row flex-wrap mb-4">
                {COMMON_MEDICAL_CONDITIONS.map(renderMedicalConditionChip)}
              </View>

              <View className="flex-row items-center space-x-2 mb-4">
                <TextInput
                  className={cn(getInputClass(false), 'flex-1')}
                  value={customMedicalCondition}
                  onChangeText={setCustomMedicalCondition}
                  placeholder="Add custom condition"
                  onSubmitEditing={handleCustomMedicalConditionAdd}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  className={cn(
                    getButtonClass('secondary', 'md'),
                    !customMedicalCondition.trim() && 'opacity-50'
                  )}
                  onPress={handleCustomMedicalConditionAdd}
                  disabled={!customMedicalCondition.trim()}
                >
                  <Text className="text-sm font-medium">Add</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {selectedMedicalConditions.length > 0 && (
            <View className={getAlertClass('info')}>
              <Text className="text-sm font-medium text-info-800 mb-1">
                Selected Medical Conditions:
              </Text>
              <Text className="text-sm text-info-700">
                {selectedMedicalConditions.join(', ')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="border-t border-neutral-200 p-4 bg-white">
        <View className="flex-row space-x-3">
          <TouchableOpacity
            className={cn(getOutlineButtonClass('secondary', 'lg'), 'flex-1')}
            onPress={goToPreviousStep}
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
              !canProceedToNext() && 'opacity-50'
            )}
            onPress={handleContinue}
            disabled={!canProceedToNext()}
            accessibilityRole="button"
            accessibilityLabel="Continue to dietary restrictions"
          >
            <Text className="text-base font-medium text-white">
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}