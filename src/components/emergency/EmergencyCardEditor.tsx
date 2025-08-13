/**
 * Emergency Card Editor Component
 * Allows users to create and edit emergency medical information cards
 */

import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  Pressable, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  Switch
} from 'react-native'
import { 
  EmergencyCard, 
  EmergencyCardInsert, 
  EmergencyCardUpdate, 
  RestrictionSeverity,
  UserRestriction,
  DietaryRestriction 
} from '../../types/database.types'
import { SafetyButton } from '../SafetyButton'
import { EmergencyPhotoCapture } from './EmergencyPhotoCapture'
import { useInputClasses, getAccessibilityProps } from '../../utils/designSystem'

interface EmergencyCardEditorProps {
  card?: EmergencyCard | null
  userRestrictions?: (UserRestriction & { dietary_restriction: DietaryRestriction })[]
  onSave: (cardData: EmergencyCardInsert | EmergencyCardUpdate) => Promise<boolean>
  onCancel: () => void
  onGenerateFromRestrictions?: () => EmergencyCardInsert
  loading?: boolean
  familyMemberId?: string
}

interface FormErrors {
  card_name?: string
  restrictions_summary?: string
  emergency_instructions?: string
  emergency_contact_1_phone?: string
}

export const EmergencyCardEditor: React.FC<EmergencyCardEditorProps> = ({
  card,
  userRestrictions = [],
  onSave,
  onCancel,
  onGenerateFromRestrictions,
  loading = false,
  familyMemberId,
}) => {
  const { getInputClass, getLabelClass, getErrorClass } = useInputClasses()
  const isEditing = !!card

  // Form state
  const [cardName, setCardName] = useState(card?.card_name || '')
  const [restrictionsSummary, setRestrictionsSummary] = useState(card?.restrictions_summary || '')
  const [severityLevel, setSeverityLevel] = useState<RestrictionSeverity>(card?.severity_level || 'moderate')
  const [emergencyInstructions, setEmergencyInstructions] = useState(card?.emergency_instructions || '')
  const [medications, setMedications] = useState<string[]>(card?.medications || [])
  const [medicationInput, setMedicationInput] = useState('')
  
  // Contact information
  const [emergencyContact1Name, setEmergencyContact1Name] = useState(card?.emergency_contact_1_name || '')
  const [emergencyContact1Phone, setEmergencyContact1Phone] = useState(card?.emergency_contact_1_phone || '')
  const [emergencyContact1Relationship, setEmergencyContact1Relationship] = useState(card?.emergency_contact_1_relationship || '')
  const [emergencyContact2Name, setEmergencyContact2Name] = useState(card?.emergency_contact_2_name || '')
  const [emergencyContact2Phone, setEmergencyContact2Phone] = useState(card?.emergency_contact_2_phone || '')
  const [emergencyContact2Relationship, setEmergencyContact2Relationship] = useState(card?.emergency_contact_2_relationship || '')
  
  // Medical information
  const [doctorName, setDoctorName] = useState(card?.doctor_name || '')
  const [doctorPhone, setDoctorPhone] = useState(card?.doctor_phone || '')
  const [insuranceInfo, setInsuranceInfo] = useState(card?.insurance_info || '')
  const [additionalNotes, setAdditionalNotes] = useState(card?.additional_notes || '')
  
  // Settings
  const [isActive, setIsActive] = useState(card?.is_active ?? true)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(card?.profile_photo_url || null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Track changes for unsaved warning
  useEffect(() => {
    if (isEditing && card) {
      const hasChanges = 
        cardName !== card.card_name ||
        restrictionsSummary !== card.restrictions_summary ||
        severityLevel !== card.severity_level ||
        emergencyInstructions !== card.emergency_instructions ||
        JSON.stringify(medications) !== JSON.stringify(card.medications || []) ||
        emergencyContact1Name !== (card.emergency_contact_1_name || '') ||
        emergencyContact1Phone !== (card.emergency_contact_1_phone || '') ||
        profilePhotoUrl !== (card.profile_photo_url || null) ||
        isActive !== card.is_active

      setHasUnsavedChanges(hasChanges)
    } else if (!isEditing) {
      const hasData = cardName || restrictionsSummary || emergencyInstructions
      setHasUnsavedChanges(hasData)
    }
  }, [
    cardName, restrictionsSummary, severityLevel, emergencyInstructions, medications,
    emergencyContact1Name, emergencyContact1Phone, isActive, card, isEditing
  ])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!cardName.trim()) {
      newErrors.card_name = 'Card name is required'
    }

    if (!restrictionsSummary.trim()) {
      newErrors.restrictions_summary = 'Restrictions summary is required'
    }

    if (!emergencyInstructions.trim()) {
      newErrors.emergency_instructions = 'Emergency instructions are required'
    }

    // Require emergency contact for life-threatening allergies
    if (severityLevel === 'life_threatening' && !emergencyContact1Phone.trim()) {
      newErrors.emergency_contact_1_phone = 'Emergency contact is required for life-threatening restrictions'
    }

    // Validate phone number format
    if (emergencyContact1Phone && !isValidPhoneNumber(emergencyContact1Phone)) {
      newErrors.emergency_contact_1_phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  }

  const handleAddMedication = () => {
    if (medicationInput.trim()) {
      setMedications([...medications, medicationInput.trim()])
      setMedicationInput('')
    }
  }

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index))
  }

  const handleGenerateFromRestrictions = () => {
    if (onGenerateFromRestrictions) {
      const generated = onGenerateFromRestrictions()
      setCardName(generated.card_name)
      setRestrictionsSummary(generated.restrictions_summary)
      setSeverityLevel(generated.severity_level)
      setEmergencyInstructions(generated.emergency_instructions)
      setMedications(generated.medications || [])
    }
  }

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors below and try again.')
      return
    }

    const cardData = isEditing ? {
      card_name: cardName.trim(),
      restrictions_summary: restrictionsSummary.trim(),
      severity_level: severityLevel,
      emergency_instructions: emergencyInstructions.trim(),
      medications: medications.length > 0 ? medications : null,
      emergency_contact_1_name: emergencyContact1Name.trim() || null,
      emergency_contact_1_phone: emergencyContact1Phone.trim() || null,
      emergency_contact_1_relationship: emergencyContact1Relationship.trim() || null,
      emergency_contact_2_name: emergencyContact2Name.trim() || null,
      emergency_contact_2_phone: emergencyContact2Phone.trim() || null,
      emergency_contact_2_relationship: emergencyContact2Relationship.trim() || null,
      doctor_name: doctorName.trim() || null,
      doctor_phone: doctorPhone.trim() || null,
      insurance_info: insuranceInfo.trim() || null,
      additional_notes: additionalNotes.trim() || null,
      profile_photo_url: profilePhotoUrl,
      is_active: isActive,
    } as EmergencyCardUpdate : {
      user_id: familyMemberId ? null : undefined,
      family_member_id: familyMemberId || null,
      card_name: cardName.trim(),
      restrictions_summary: restrictionsSummary.trim(),
      severity_level: severityLevel,
      emergency_instructions: emergencyInstructions.trim(),
      medications: medications.length > 0 ? medications : null,
      emergency_contact_1_name: emergencyContact1Name.trim() || null,
      emergency_contact_1_phone: emergencyContact1Phone.trim() || null,
      emergency_contact_1_relationship: emergencyContact1Relationship.trim() || null,
      emergency_contact_2_name: emergencyContact2Name.trim() || null,
      emergency_contact_2_phone: emergencyContact2Phone.trim() || null,
      emergency_contact_2_relationship: emergencyContact2Relationship.trim() || null,
      doctor_name: doctorName.trim() || null,
      doctor_phone: doctorPhone.trim() || null,
      insurance_info: insuranceInfo.trim() || null,
      additional_notes: additionalNotes.trim() || null,
      profile_photo_url: profilePhotoUrl,
      card_language: 'en',
      is_active: isActive,
    } as EmergencyCardInsert

    const success = await onSave(cardData)
    if (success) {
      setHasUnsavedChanges(false)
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Continue Editing', style: 'cancel' },
          { text: 'Discard Changes', style: 'destructive', onPress: onCancel }
        ]
      )
    } else {
      onCancel()
    }
  }

  const severityOptions = [
    { value: 'mild' as RestrictionSeverity, label: 'Mild', color: 'bg-green-100 border-green-300' },
    { value: 'moderate' as RestrictionSeverity, label: 'Moderate', color: 'bg-yellow-100 border-yellow-300' },
    { value: 'severe' as RestrictionSeverity, label: 'Severe', color: 'bg-orange-100 border-orange-300' },
    { value: 'life_threatening' as RestrictionSeverity, label: 'Life-Threatening', color: 'bg-red-100 border-red-300' },
  ]

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-gray-800 text-lg font-bold">
              {isEditing ? 'Edit Emergency Card' : 'New Emergency Card'}
            </Text>
            {hasUnsavedChanges && (
              <Text className="text-orange-600 text-sm">• Unsaved changes</Text>
            )}
          </View>
          
          <View className="flex-row">
            <SafetyButton
              title="Cancel"
              variant="secondary"
              size="sm"
              onPress={handleCancel}
              style={{ marginRight: 8 }}
            />
            <SafetyButton
              title={isEditing ? 'Update' : 'Create'}
              variant="primary"
              size="sm"
              onPress={handleSave}
              loading={loading}
            />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        {/* Generate from restrictions helper */}
        {!isEditing && userRestrictions.length > 0 && onGenerateFromRestrictions && (
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <Text className="text-blue-800 font-semibold mb-2">Quick Start</Text>
            <Text className="text-blue-700 text-sm mb-3">
              Generate an emergency card from your current dietary restrictions?
            </Text>
            <SafetyButton
              title="Generate from Restrictions"
              variant="secondary"
              size="sm"
              onPress={handleGenerateFromRestrictions}
              icon="⚡"
            />
          </View>
        )}

        {/* Profile Photo */}
        <View className="mb-6">
          <EmergencyPhotoCapture
            currentPhotoUrl={profilePhotoUrl}
            onPhotoSelected={setProfilePhotoUrl}
            onPhotoRemoved={() => setProfilePhotoUrl(null)}
          />
        </View>

        {/* Basic Information */}
        <View className="mb-6">
          <Text className="text-gray-800 text-lg font-bold mb-4">Basic Information</Text>
          
          {/* Card Name */}
          <View className="mb-4">
            <Text className={getLabelClass(!!errors.card_name)}>Card Name *</Text>
            <TextInput
              value={cardName}
              onChangeText={setCardName}
              placeholder="e.g., John's Emergency Card"
              className={getInputClass(!!errors.card_name)}
              {...getAccessibilityProps('Card name input', 'Enter a name for this emergency card')}
            />
            {errors.card_name && (
              <Text className={getErrorClass()}>{errors.card_name}</Text>
            )}
          </View>

          {/* Restrictions Summary */}
          <View className="mb-4">
            <Text className={getLabelClass(!!errors.restrictions_summary)}>Medical Restrictions *</Text>
            <TextInput
              value={restrictionsSummary}
              onChangeText={setRestrictionsSummary}
              placeholder="e.g., Severe allergies: Peanuts, Shellfish, Dairy"
              className={getInputClass(!!errors.restrictions_summary)}
              multiline
              numberOfLines={2}
              {...getAccessibilityProps('Medical restrictions input', 'List the main allergies or medical restrictions')}
            />
            {errors.restrictions_summary && (
              <Text className={getErrorClass()}>{errors.restrictions_summary}</Text>
            )}
          </View>

          {/* Severity Level */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Severity Level *</Text>
            <View className="flex-row flex-wrap">
              {severityOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setSeverityLevel(option.value)}
                  className={`${option.color} ${
                    severityLevel === option.value ? 'border-2' : 'border'
                  } px-3 py-2 rounded-lg mr-2 mb-2 flex-row items-center`}
                  {...getAccessibilityProps(`Severity level ${option.label}`, '', 'button')}
                >
                  <View className={`w-3 h-3 rounded-full mr-2 ${
                    severityLevel === option.value ? 'bg-gray-800' : 'bg-gray-400'
                  }`} />
                  <Text className={`text-sm font-medium ${
                    severityLevel === option.value ? 'text-gray-800' : 'text-gray-600'
                  }`}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Emergency Instructions */}
        <View className="mb-6">
          <Text className="text-gray-800 text-lg font-bold mb-4">Emergency Instructions</Text>
          
          <View className="mb-4">
            <Text className={getLabelClass(!!errors.emergency_instructions)}>Instructions for First Responders *</Text>
            <TextInput
              value={emergencyInstructions}
              onChangeText={setEmergencyInstructions}
              placeholder="Clear instructions for emergency responders..."
              className={getInputClass(!!errors.emergency_instructions)}
              multiline
              numberOfLines={4}
              {...getAccessibilityProps('Emergency instructions input', 'Enter instructions for first responders')}
            />
            {errors.emergency_instructions && (
              <Text className={getErrorClass()}>{errors.emergency_instructions}</Text>
            )}
          </View>
        </View>

        {/* Medications */}
        <View className="mb-6">
          <Text className="text-gray-800 text-lg font-bold mb-4">Medications</Text>
          
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Add Medication</Text>
            <View className="flex-row">
              <TextInput
                value={medicationInput}
                onChangeText={setMedicationInput}
                placeholder="e.g., EpiPen, Benadryl"
                className={`${getInputClass()} flex-1 mr-2`}
                {...getAccessibilityProps('Medication input', 'Enter medication name')}
              />
              <SafetyButton
                title="Add"
                variant="secondary"
                size="sm"
                onPress={handleAddMedication}
                disabled={!medicationInput.trim()}
              />
            </View>
          </View>

          {/* Current Medications */}
          {medications.length > 0 && (
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Current Medications</Text>
              {medications.map((med, index) => (
                <View key={index} className="flex-row items-center bg-gray-100 p-3 rounded-lg mb-2">
                  <Text className="flex-1 text-gray-800">{med}</Text>
                  <Pressable
                    onPress={() => handleRemoveMedication(index)}
                    className="ml-2 p-1"
                    {...getAccessibilityProps(`Remove ${med}`, '', 'button')}
                  >
                    <Text className="text-red-600 text-lg">✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Emergency Contacts */}
        <View className="mb-6">
          <Text className="text-gray-800 text-lg font-bold mb-4">Emergency Contacts</Text>
          
          {/* Primary Contact */}
          <View className="bg-gray-50 p-4 rounded-lg mb-4">
            <Text className="text-gray-700 font-semibold mb-3">Primary Contact</Text>
            
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">Name</Text>
              <TextInput
                value={emergencyContact1Name}
                onChangeText={setEmergencyContact1Name}
                placeholder="Contact name"
                className={getInputClass()}
                {...getAccessibilityProps('Primary contact name', '')}
              />
            </View>

            <View className="mb-3">
              <Text className={getLabelClass(!!errors.emergency_contact_1_phone)}>
                Phone Number {severityLevel === 'life_threatening' && '*'}
              </Text>
              <TextInput
                value={emergencyContact1Phone}
                onChangeText={setEmergencyContact1Phone}
                placeholder="Phone number"
                keyboardType="phone-pad"
                className={getInputClass(!!errors.emergency_contact_1_phone)}
                {...getAccessibilityProps('Primary contact phone', '')}
              />
              {errors.emergency_contact_1_phone && (
                <Text className={getErrorClass()}>{errors.emergency_contact_1_phone}</Text>
              )}
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Relationship</Text>
              <TextInput
                value={emergencyContact1Relationship}
                onChangeText={setEmergencyContact1Relationship}
                placeholder="e.g., Spouse, Parent"
                className={getInputClass()}
                {...getAccessibilityProps('Primary contact relationship', '')}
              />
            </View>
          </View>

          {/* Secondary Contact */}
          <View className="bg-gray-50 p-4 rounded-lg mb-4">
            <Text className="text-gray-700 font-semibold mb-3">Secondary Contact (Optional)</Text>
            
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">Name</Text>
              <TextInput
                value={emergencyContact2Name}
                onChangeText={setEmergencyContact2Name}
                placeholder="Contact name"
                className={getInputClass()}
              />
            </View>

            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">Phone Number</Text>
              <TextInput
                value={emergencyContact2Phone}
                onChangeText={setEmergencyContact2Phone}
                placeholder="Phone number"
                keyboardType="phone-pad"
                className={getInputClass()}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Relationship</Text>
              <TextInput
                value={emergencyContact2Relationship}
                onChangeText={setEmergencyContact2Relationship}
                placeholder="e.g., Friend, Doctor"
                className={getInputClass()}
              />
            </View>
          </View>
        </View>

        {/* Medical Information */}
        <View className="mb-6">
          <Text className="text-gray-800 text-lg font-bold mb-4">Medical Information</Text>
          
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Doctor Name</Text>
            <TextInput
              value={doctorName}
              onChangeText={setDoctorName}
              placeholder="Primary doctor or allergist"
              className={getInputClass()}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Doctor Phone</Text>
            <TextInput
              value={doctorPhone}
              onChangeText={setDoctorPhone}
              placeholder="Doctor's phone number"
              keyboardType="phone-pad"
              className={getInputClass()}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Insurance Information</Text>
            <TextInput
              value={insuranceInfo}
              onChangeText={setInsuranceInfo}
              placeholder="Insurance provider and member ID"
              className={getInputClass()}
              multiline
              numberOfLines={2}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Additional Notes</Text>
            <TextInput
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              placeholder="Any other important medical information"
              className={getInputClass()}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Settings */}
        <View className="mb-8">
          <Text className="text-gray-800 text-lg font-bold mb-4">Settings</Text>
          
          <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-lg">
            <View className="flex-1">
              <Text className="text-gray-800 font-semibold">Active Card</Text>
              <Text className="text-gray-600 text-sm">
                Active cards appear in emergency situations and searches
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#f3f4f6', true: '#22c55e' }}
              thumbColor={isActive ? '#ffffff' : '#ffffff'}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default EmergencyCardEditor