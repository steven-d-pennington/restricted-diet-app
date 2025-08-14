import React, { useMemo, useState, useEffect } from 'react'
import { View, Text, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { SafetyButton } from '../../components/SafetyButton'
import { useAuth } from '../../contexts/AuthContext'
import { useInputClasses, getAccessibilityProps } from '../../utils/designSystem'
import type { ProfileStackScreenProps } from '../../types/navigation.types'

function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

type Props = ProfileStackScreenProps<'EditProfile'>

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { userProfile, updateProfile } = useAuth()
  const { getInputClass, getInputStyle, getLabelClass, getErrorClass } = useInputClasses()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [fullName, setFullName] = useState(userProfile?.full_name || '')
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phone_number || '')
  const [dateOfBirth, setDateOfBirth] = useState(userProfile?.date_of_birth || '')
  const [preferredLanguage, setPreferredLanguage] = useState(userProfile?.preferred_language || 'en')
  const [timezone, setTimezone] = useState(userProfile?.timezone || '')
  const [emName, setEmName] = useState(userProfile?.emergency_contact_name || '')
  const [emPhone, setEmPhone] = useState(userProfile?.emergency_contact_phone || '')
  const [emRelation, setEmRelation] = useState(userProfile?.emergency_contact_relationship || '')
  const [allergistName, setAllergistName] = useState(userProfile?.allergist_name || '')
  const [allergistPhone, setAllergistPhone] = useState(userProfile?.allergist_phone || '')

  const placeholderColor = '#6b7280'
  const inputTextStyle = { color: '#111827' } as const

  useEffect(() => {
    setFullName(userProfile?.full_name || '')
  }, [userProfile?.full_name])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!fullName.trim()) e.full_name = 'Name is required'
    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) e.phone_number = 'Invalid phone'
    if (emPhone && !isValidPhoneNumber(emPhone)) e.emergency_contact_phone = 'Invalid phone'
    if (allergistPhone && !isValidPhoneNumber(allergistPhone)) e.allergist_phone = 'Invalid phone'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    const updates = {
      full_name: fullName.trim(),
      phone_number: phoneNumber.trim() || null,
      date_of_birth: dateOfBirth.trim() || null,
      preferred_language: preferredLanguage,
      // timezone is typed as string | undefined (not null) in Update type
      timezone: timezone.trim() || undefined,
      emergency_contact_name: emName.trim() || null,
      emergency_contact_phone: emPhone.trim() || null,
      emergency_contact_relationship: emRelation.trim() || null,
      allergist_name: allergistName.trim() || null,
      allergist_phone: allergistPhone.trim() || null,
    }
    const { error } = await updateProfile(updates)
    setSaving(false)
    if (error) {
      Alert.alert('Update failed', error.message || 'Could not save profile')
      return
    }
    navigation.goBack()
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 24, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <Text className="text-xl font-bold text-gray-900 mb-4">Edit Profile</Text>

        <View className="mb-4">
          <Text className={getLabelClass(!!errors.full_name)}>Full Name *</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your name"
            className={getInputClass(!!errors.full_name)}
            style={[getInputStyle(!!errors.full_name), inputTextStyle]}
            placeholderTextColor={placeholderColor}
            {...getAccessibilityProps('Full name input')}
          />
          {errors.full_name && <Text className={getErrorClass()}>{errors.full_name}</Text>}
        </View>

        <View className="mb-4">
          <Text className={getLabelClass(!!errors.phone_number)}>Phone</Text>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+1 555 123 4567"
            keyboardType="phone-pad"
            className={getInputClass(!!errors.phone_number)}
            style={[getInputStyle(!!errors.phone_number), inputTextStyle]}
            placeholderTextColor={placeholderColor}
            {...getAccessibilityProps('Phone number input')}
          />
          {errors.phone_number && <Text className={getErrorClass()}>{errors.phone_number}</Text>}
        </View>

        <View className="mb-4">
          <Text className={getLabelClass(false)}>Date of Birth</Text>
          <TextInput
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
            className={getInputClass(false)}
            style={[getInputStyle(false), inputTextStyle]}
            placeholderTextColor={placeholderColor}
            {...getAccessibilityProps('Date of birth input')}
          />
        </View>

        <View className="mb-4">
          <Text className={getLabelClass(false)}>Preferred Language</Text>
          <TextInput
            value={preferredLanguage}
            onChangeText={setPreferredLanguage}
            placeholder="en"
            className={getInputClass(false)}
            style={[getInputStyle(false), inputTextStyle]}
            placeholderTextColor={placeholderColor}
            {...getAccessibilityProps('Preferred language input')}
          />
        </View>

        <View className="mb-6">
          <Text className={getLabelClass(false)}>Timezone</Text>
          <TextInput
            value={timezone}
            onChangeText={setTimezone}
            placeholder="e.g., America/New_York"
            className={getInputClass(false)}
            style={[getInputStyle(false), inputTextStyle]}
            placeholderTextColor={placeholderColor}
            {...getAccessibilityProps('Timezone input')}
          />
        </View>

        <Text className="text-lg font-semibold text-gray-900 mb-2">Emergency Contact</Text>
        <View className="mb-4">
          <Text className={getLabelClass(false)}>Name</Text>
          <TextInput
            value={emName}
            onChangeText={setEmName}
            placeholder="Contact name"
            className={getInputClass(false)}
            style={[getInputStyle(false), inputTextStyle]}
            placeholderTextColor={placeholderColor}
          />
        </View>
        <View className="mb-4">
          <Text className={getLabelClass(!!errors.emergency_contact_phone)}>Phone</Text>
          <TextInput
            value={emPhone}
            onChangeText={setEmPhone}
            placeholder="+1 555 123 4567"
            keyboardType="phone-pad"
            className={getInputClass(!!errors.emergency_contact_phone)}
            style={[getInputStyle(!!errors.emergency_contact_phone), inputTextStyle]}
            placeholderTextColor={placeholderColor}
          />
          {errors.emergency_contact_phone && <Text className={getErrorClass()}>{errors.emergency_contact_phone}</Text>}
        </View>
        <View className="mb-6">
          <Text className={getLabelClass(false)}>Relationship</Text>
          <TextInput
            value={emRelation}
            onChangeText={setEmRelation}
            placeholder="e.g., Spouse"
            className={getInputClass(false)}
            style={[getInputStyle(false), inputTextStyle]}
            placeholderTextColor={placeholderColor}
          />
        </View>

        <Text className="text-lg font-semibold text-gray-900 mb-2">Allergist</Text>
        <View className="mb-4">
          <Text className={getLabelClass(false)}>Name</Text>
          <TextInput
            value={allergistName}
            onChangeText={setAllergistName}
            placeholder="Allergist name"
            className={getInputClass(false)}
            style={[getInputStyle(false), inputTextStyle]}
            placeholderTextColor={placeholderColor}
          />
        </View>
        <View className="mb-8">
          <Text className={getLabelClass(!!errors.allergist_phone)}>Phone</Text>
          <TextInput
            value={allergistPhone}
            onChangeText={setAllergistPhone}
            placeholder="+1 555 123 4567"
            keyboardType="phone-pad"
            className={getInputClass(!!errors.allergist_phone)}
            style={[getInputStyle(!!errors.allergist_phone), inputTextStyle]}
            placeholderTextColor={placeholderColor}
          />
          {errors.allergist_phone && <Text className={getErrorClass()}>{errors.allergist_phone}</Text>}
        </View>

        <View className="flex-row" style={{ gap: 8 }}>
          <SafetyButton title="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
          <SafetyButton title={saving ? 'Saving...' : 'Save'} onPress={handleSave} disabled={saving} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default EditProfileScreen
