/**
 * Onboarding Emergency Contacts Screen
 * 
 * SAFETY CRITICAL: Collects emergency contact information for high-risk restrictions
 * Required for severe and life-threatening allergies and medical conditions
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useOnboarding, getStepInfo, EmergencyContact, MedicalProvider } from '../../contexts/OnboardingContext'
import { 
  useButtonClasses, 
  useInputClasses, 
  useAlertClasses,
  cn 
} from '../../utils/designSystem'

const RELATIONSHIP_OPTIONS = [
  'Spouse/Partner',
  'Parent',
  'Child',
  'Sibling',
  'Other Family',
  'Friend',
  'Colleague',
  'Caregiver',
  'Medical Professional',
  'Other',
]

const MEDICAL_PROVIDER_TYPES = [
  { value: 'allergist', label: 'Allergist/Immunologist', description: 'Specializes in allergies and immune system disorders' },
  { value: 'primary_care', label: 'Primary Care Doctor', description: 'Your main healthcare provider' },
  { value: 'specialist', label: 'Other Specialist', description: 'Cardiologist, endocrinologist, etc.' },
]

export const OnboardingEmergencyScreen: React.FC = () => {
  const { state, dispatch, goToNextStep, goToPreviousStep, validateCurrentStep, hasLifeThreateningAllergies, getStepProgress } = useOnboarding()
  const { getButtonClass, getOutlineButtonClass } = useButtonClasses()
  const { getInputClass, getLabelClass, getErrorClass } = useInputClasses()
  const { getAlertClass } = useAlertClasses()

  // Form state for new contacts
  const [newContact, setNewContact] = useState<Partial<EmergencyContact>>({
    name: '',
    phone: '',
    relationship: '',
    isPrimary: state.emergencyContacts.length === 0, // First contact is primary by default
  })

  const [newMedicalProvider, setNewMedicalProvider] = useState<Partial<MedicalProvider>>({
    name: '',
    phone: '',
    type: 'primary_care',
  })

  const [errors, setErrors] = useState<string[]>([])
  const [showContactForm, setShowContactForm] = useState(false)
  const [showMedicalForm, setShowMedicalForm] = useState(false)
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null)
  const [editingMedicalIndex, setEditingMedicalIndex] = useState<number | null>(null)

  const stepInfo = getStepInfo('emergency_contacts')
  const progress = getStepProgress()
  const isRequired = hasLifeThreateningAllergies()

  // Auto-show form if no contacts exist and it's required
  useEffect(() => {
    if (isRequired && state.emergencyContacts.length === 0 && !showContactForm) {
      setShowContactForm(true)
    }
  }, [isRequired, state.emergencyContacts.length, showContactForm])

  const resetContactForm = () => {
    setNewContact({
      name: '',
      phone: '',
      relationship: '',
      isPrimary: state.emergencyContacts.length === 0,
    })
    setEditingContactIndex(null)
    setShowContactForm(false)
  }

  const resetMedicalForm = () => {
    setNewMedicalProvider({
      name: '',
      phone: '',
      type: 'primary_care',
    })
    setEditingMedicalIndex(null)
    setShowMedicalForm(false)
  }

  const handleAddContact = () => {
    if (!newContact.name?.trim() || !newContact.phone?.trim() || !newContact.relationship?.trim()) {
      Alert.alert('Incomplete Information', 'Please fill in all contact fields.')
      return
    }

    const contact: EmergencyContact = {
      name: newContact.name.trim(),
      phone: newContact.phone.trim(),
      relationship: newContact.relationship,
      isPrimary: newContact.isPrimary || false,
    }

    if (editingContactIndex !== null) {
      dispatch({
        type: 'UPDATE_EMERGENCY_CONTACT',
        payload: { index: editingContactIndex, updates: contact },
      })
    } else {
      dispatch({ type: 'ADD_EMERGENCY_CONTACT', payload: contact })
    }

    resetContactForm()
  }

  const handleEditContact = (index: number) => {
    const contact = state.emergencyContacts[index]
    setNewContact(contact)
    setEditingContactIndex(index)
    setShowContactForm(true)
  }

  const handleDeleteContact = (index: number) => {
    const contact = state.emergencyContacts[index]
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to remove ${contact.name} from your emergency contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch({ type: 'REMOVE_EMERGENCY_CONTACT', payload: index }),
        },
      ]
    )
  }

  const handleAddMedicalProvider = () => {
    if (!newMedicalProvider.name?.trim() || !newMedicalProvider.phone?.trim()) {
      Alert.alert('Incomplete Information', 'Please fill in provider name and phone number.')
      return
    }

    const provider: MedicalProvider = {
      name: newMedicalProvider.name.trim(),
      phone: newMedicalProvider.phone.trim(),
      type: newMedicalProvider.type as 'allergist' | 'primary_care' | 'specialist',
    }

    dispatch({ type: 'ADD_MEDICAL_PROVIDER', payload: provider })
    resetMedicalForm()
  }

  const handleCallContact = (phone: string) => {
    Alert.alert(
      'Call Contact',
      `Call ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          style: 'default',
          onPress: () => Linking.openURL(`tel:${phone}`),
        },
      ]
    )
  }

  const handleContinue = () => {
    const validation = validateCurrentStep()
    setErrors(validation.errors)
    
    if (!validation.isValid) {
      Alert.alert(
        'Emergency Information Required',
        validation.errors.join('\n\n'),
        [{ text: 'OK', style: 'default' }]
      )
      return
    }

    goToNextStep()
  }

  const handleSkip = () => {
    if (isRequired) {
      Alert.alert(
        'Cannot Skip This Step',
        'Emergency contact information is required for life-threatening allergies. This information could be critical in a medical emergency.',
        [{ text: 'OK', style: 'default' }]
      )
      return
    }

    Alert.alert(
      'Skip Emergency Contacts',
      'Are you sure you want to skip adding emergency contacts? You can always add them later in your profile settings.',
      [
        { text: 'Add Contacts', style: 'cancel' },
        {
          text: 'Skip for Now',
          style: 'default',
          onPress: goToNextStep,
        },
      ]
    )
  }

  const renderContactForm = () => (
    <View className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 mb-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-neutral-900">
          {editingContactIndex !== null ? 'Edit Contact' : 'Add Emergency Contact'}
        </Text>
        <TouchableOpacity onPress={resetContactForm}>
          <Text className="text-neutral-500 text-lg">✕</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-4">
        <Text className={getLabelClass(false)}>Full Name *</Text>
        <TextInput
          className={getInputClass(false)}
          value={newContact.name}
          onChangeText={(text) => setNewContact(prev => ({ ...prev, name: text }))}
          placeholder="Enter contact's full name"
          autoCapitalize="words"
          returnKeyType="next"
        />
      </View>

      <View className="mb-4">
        <Text className={getLabelClass(false)}>Phone Number *</Text>
        <TextInput
          className={getInputClass(false)}
          value={newContact.phone}
          onChangeText={(text) => setNewContact(prev => ({ ...prev, phone: text }))}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          returnKeyType="next"
        />
      </View>

      <View className="mb-4">
        <Text className={getLabelClass(false)}>Relationship *</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mb-2"
        >
          {RELATIONSHIP_OPTIONS.map(relationship => (
            <TouchableOpacity
              key={relationship}
              className={cn(
                'px-3 py-2 rounded-full border mr-2',
                newContact.relationship === relationship 
                  ? 'border-primary-500 bg-primary-100' 
                  : 'border-neutral-300 bg-white'
              )}
              onPress={() => setNewContact(prev => ({ ...prev, relationship }))}
            >
              <Text className={cn(
                'text-sm',
                newContact.relationship === relationship 
                  ? 'text-primary-700 font-medium' 
                  : 'text-neutral-700'
              )}>
                {relationship}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View className="mb-4">
        <View className="flex-row items-center">
          <TouchableOpacity
            className={cn(
              'w-5 h-5 rounded border-2 mr-3 items-center justify-center',
              newContact.isPrimary ? 'bg-primary-500 border-primary-500' : 'border-neutral-300'
            )}
            onPress={() => setNewContact(prev => ({ ...prev, isPrimary: !prev.isPrimary }))}
          >
            {newContact.isPrimary && (
              <Text className="text-white text-xs font-bold">✓</Text>
            )}
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-sm font-medium text-neutral-900">
              Primary Emergency Contact
            </Text>
            <Text className="text-xs text-neutral-500">
              This person will be contacted first in emergencies
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        className={cn(
          getButtonClass('primary', 'md'),
          (!newContact.name?.trim() || !newContact.phone?.trim() || !newContact.relationship?.trim()) && 'opacity-50'
        )}
        onPress={handleAddContact}
        disabled={!newContact.name?.trim() || !newContact.phone?.trim() || !newContact.relationship?.trim()}
      >
        <Text className="text-white font-medium">
          {editingContactIndex !== null ? 'Update Contact' : 'Add Contact'}
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderMedicalProviderForm = () => (
    <View className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 mb-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-neutral-900">
          Add Medical Provider
        </Text>
        <TouchableOpacity onPress={resetMedicalForm}>
          <Text className="text-neutral-500 text-lg">✕</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-4">
        <Text className={getLabelClass(false)}>Provider Type</Text>
        {MEDICAL_PROVIDER_TYPES.map(type => (
          <TouchableOpacity
            key={type.value}
            className={cn(
              'border rounded-lg p-3 mb-2',
              newMedicalProvider.type === type.value 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-neutral-200 bg-white'
            )}
            onPress={() => setNewMedicalProvider(prev => ({ ...prev, type: type.value as any }))}
          >
            <Text className={cn(
              'font-medium',
              newMedicalProvider.type === type.value ? 'text-primary-700' : 'text-neutral-900'
            )}>
              {type.label}
            </Text>
            <Text className="text-sm text-neutral-600">{type.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="mb-4">
        <Text className={getLabelClass(false)}>Provider Name *</Text>
        <TextInput
          className={getInputClass(false)}
          value={newMedicalProvider.name}
          onChangeText={(text) => setNewMedicalProvider(prev => ({ ...prev, name: text }))}
          placeholder="Dr. Smith or ABC Medical Center"
          autoCapitalize="words"
          returnKeyType="next"
        />
      </View>

      <View className="mb-4">
        <Text className={getLabelClass(false)}>Phone Number *</Text>
        <TextInput
          className={getInputClass(false)}
          value={newMedicalProvider.phone}
          onChangeText={(text) => setNewMedicalProvider(prev => ({ ...prev, phone: text }))}
          placeholder="Enter office phone number"
          keyboardType="phone-pad"
          returnKeyType="done"
        />
      </View>

      <TouchableOpacity
        className={cn(
          getButtonClass('primary', 'md'),
          (!newMedicalProvider.name?.trim() || !newMedicalProvider.phone?.trim()) && 'opacity-50'
        )}
        onPress={handleAddMedicalProvider}
        disabled={!newMedicalProvider.name?.trim() || !newMedicalProvider.phone?.trim()}
      >
        <Text className="text-white font-medium">Add Provider</Text>
      </TouchableOpacity>
    </View>
  )

  const renderContactItem = (contact: EmergencyContact, index: number) => (
    <View key={index} className="border border-neutral-200 rounded-xl p-4 mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-lg font-semibold text-neutral-900">
              {contact.name}
            </Text>
            {contact.isPrimary && (
              <View className="bg-primary-100 px-2 py-1 rounded-full ml-2">
                <Text className="text-xs font-medium text-primary-700">Primary</Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-neutral-600 mb-1">{contact.relationship}</Text>
          <TouchableOpacity onPress={() => handleCallContact(contact.phone)}>
            <Text className="text-sm text-primary-600">{contact.phone}</Text>
          </TouchableOpacity>
        </View>
        
        <View className="flex-row space-x-2">
          <TouchableOpacity
            className="p-2"
            onPress={() => handleEditContact(index)}
          >
            <Text className="text-neutral-500">✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2"
            onPress={() => handleDeleteContact(index)}
          >
            <Text className="text-red-500">🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const renderMedicalProviderItem = (provider: MedicalProvider, index: number) => (
    <View key={index} className="border border-neutral-200 rounded-xl p-4 mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-neutral-900">
            {provider.name}
          </Text>
          <Text className="text-sm text-neutral-600 mb-1">
            {MEDICAL_PROVIDER_TYPES.find(t => t.value === provider.type)?.label}
          </Text>
          <TouchableOpacity onPress={() => handleCallContact(provider.phone)}>
            <Text className="text-sm text-primary-600">{provider.phone}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
        {/* Requirement Notice */}
        {isRequired ? (
          <View className={getAlertClass('warning')}>
            <View className="flex-row items-start">
              <Text className="text-xl mr-2">🚨</Text>
              <View className="flex-1">
                <Text className="text-base font-semibold text-safety-caution-800 mb-1">
                  Emergency Information Required
                </Text>
                <Text className="text-sm text-safety-caution-700 leading-relaxed">
                  You have life-threatening allergies that require emergency contact information. This could be critical for first responders and medical personnel.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View className={getAlertClass('info')}>
            <Text className="text-base font-medium text-info-800 mb-1">
              Optional Safety Information
            </Text>
            <Text className="text-sm text-info-700 leading-relaxed">
              Adding emergency contacts is recommended for all dietary restrictions, even mild ones. This information can be helpful for family, friends, and healthcare providers.
            </Text>
          </View>
        )}

        {/* Emergency Contacts Section */}
        <View className="mt-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-neutral-900">
              Emergency Contacts {isRequired && '*'}
            </Text>
            {!showContactForm && (
              <TouchableOpacity
                className={getOutlineButtonClass('primary', 'sm')}
                onPress={() => setShowContactForm(true)}
              >
                <Text className="text-primary-600 font-medium">Add Contact</Text>
              </TouchableOpacity>
            )}
          </View>

          {showContactForm && renderContactForm()}

          {state.emergencyContacts.length > 0 ? (
            state.emergencyContacts.map(renderContactItem)
          ) : (
            <View className="border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center">
              <Text className="text-neutral-500 text-center">
                No emergency contacts added yet
              </Text>
            </View>
          )}
        </View>

        {/* Medical Providers Section */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-neutral-900">
              Medical Providers
              <Text className="text-sm text-neutral-500 font-normal"> (Optional)</Text>
            </Text>
            {!showMedicalForm && (
              <TouchableOpacity
                className={getOutlineButtonClass('primary', 'sm')}
                onPress={() => setShowMedicalForm(true)}
              >
                <Text className="text-primary-600 font-medium">Add Provider</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text className="text-sm text-neutral-600 mb-4">
            Add your allergist, primary care doctor, or other specialists who manage your dietary restrictions.
          </Text>

          {showMedicalForm && renderMedicalProviderForm()}

          {state.medicalProviders.length > 0 ? (
            state.medicalProviders.map(renderMedicalProviderItem)
          ) : (
            <View className="border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center">
              <Text className="text-neutral-500 text-center">
                No medical providers added yet
              </Text>
            </View>
          )}
        </View>

        {/* Emergency Instructions */}
        <View className={getAlertClass('info')}>
          <Text className="text-base font-medium text-info-800 mb-2">
            Emergency Information Usage
          </Text>
          <Text className="text-sm text-info-700 leading-relaxed mb-2">
            Your emergency contacts and medical providers will be:
          </Text>
          <Text className="text-sm text-info-700 leading-relaxed">
            • Shown on your emergency card and QR code{'\n'}
            • Available to first responders through the app{'\n'}
            • Used to contact people if you're unable to communicate{'\n'}
            • Kept private unless you're in a medical emergency
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="border-t border-neutral-200 p-4 bg-white">
        <View className="flex-row space-x-3">
          <TouchableOpacity
            className={cn(getOutlineButtonClass('secondary', 'lg'), 'flex-1')}
            onPress={goToPreviousStep}
            accessibilityRole="button"
            accessibilityLabel="Go back to severity configuration"
          >
            <Text className="text-base font-medium text-neutral-700">
              Back
            </Text>
          </TouchableOpacity>
          
          {!isRequired && (
            <TouchableOpacity
              className={cn(getOutlineButtonClass('secondary', 'lg'), 'flex-1')}
              onPress={handleSkip}
              accessibilityRole="button"
              accessibilityLabel="Skip emergency contacts"
            >
              <Text className="text-base font-medium text-neutral-700">
                Skip
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            className={cn(
              getButtonClass('primary', 'lg'),
              'flex-2',
              isRequired && state.emergencyContacts.length === 0 && 'opacity-50'
            )}
            onPress={handleContinue}
            disabled={isRequired && state.emergencyContacts.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Continue to verification"
          >
            <Text className="text-base font-medium text-white">
              Continue
            </Text>
          </TouchableOpacity>
        </View>
        
        {isRequired && state.emergencyContacts.length === 0 && (
          <Text className="text-xs text-safety-danger-600 text-center mt-2">
            At least one emergency contact is required for life-threatening allergies
          </Text>
        )}
      </View>
    </SafeAreaView>
  )
}