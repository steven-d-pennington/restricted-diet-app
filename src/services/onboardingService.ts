/**
 * Onboarding Service
 * 
 * SAFETY CRITICAL: Handles saving onboarding data to Supabase database
 * Ensures data integrity and proper validation for medical information
 */

import { supabase } from '../lib/supabase'
import { 
  UserProfileInsert, 
  UserRestrictionInsert, 
  EmergencyCardInsert,
  RestrictionSeverity,
  AccountType 
} from '../types/database.types'
import { OnboardingData, SelectedRestriction, EmergencyContact, MedicalProvider } from '../contexts/OnboardingContext'

export interface OnboardingSubmissionResult {
  success: boolean
  userProfileId?: string
  emergencyCardId?: string
  error?: string
  details?: any
}

/**
 * Validates onboarding data before submission
 */
export function validateOnboardingData(data: OnboardingData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Basic info validation
  if (!data.basicInfo.fullName?.trim()) {
    errors.push('Full name is required')
  }

  if (!data.basicInfo.dateOfBirth) {
    errors.push('Date of birth is required')
  }

  if (!data.basicInfo.accountType) {
    errors.push('Account type is required')
  }

  // Consent validation
  if (!data.consentGiven.medicalDataHandling) {
    errors.push('Medical data handling consent is required')
  }

  if (!data.consentGiven.termsOfService) {
    errors.push('Terms of service acceptance is required')
  }

  if (!data.consentGiven.privacyPolicy) {
    errors.push('Privacy policy acceptance is required')
  }

  // Restriction validation
  const restrictionsWithoutSeverity = data.selectedRestrictions.filter(r => !r.severity)
  if (restrictionsWithoutSeverity.length > 0) {
    errors.push('All dietary restrictions must have severity levels set')
  }

  // Life-threatening allergy validation
  const lifeThreatening = data.selectedRestrictions.filter(r => r.severity === 'life_threatening')
  if (lifeThreatening.length > 0) {
    if (!data.consentGiven.emergencySharing) {
      errors.push('Emergency information sharing consent is required for life-threatening allergies')
    }

    if (data.emergencyContacts.length === 0) {
      errors.push('At least one emergency contact is required for life-threatening allergies')
    }

    const unverifiedLifeThreatening = lifeThreatening.filter(r => !r.doctorVerified)
    if (unverifiedLifeThreatening.length > 0) {
      // Warning but not blocking
      console.warn('Life-threatening allergies should be medically verified')
    }
  }

  // Emergency contact validation
  for (const contact of data.emergencyContacts) {
    if (!contact.name.trim() || !contact.phone.trim() || !contact.relationship.trim()) {
      errors.push('All emergency contact fields must be completed')
      break
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Submits complete onboarding data to Supabase
 */
export async function submitOnboardingData(
  userId: string, 
  data: OnboardingData
): Promise<OnboardingSubmissionResult> {
  try {
    // Validate data first
    const validation = validateOnboardingData(data)
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        details: validation.errors
      }
    }

    // Start transaction-like operations
    // Note: Supabase doesn't have native transactions, so we'll handle rollbacks manually if needed
    const results = {
      userProfile: null as any,
      restrictions: [] as any[],
      emergencyCard: null as any,
    }

    try {
      // 1. Create/update user profile
      const userProfile = await createUserProfile(userId, data)
      results.userProfile = userProfile

      // 2. Create dietary restrictions
      if (data.selectedRestrictions.length > 0) {
        const restrictions = await createUserRestrictions(userId, data.selectedRestrictions)
        results.restrictions = restrictions
      }

      // 3. Create emergency card if needed
      let emergencyCard = null
      if (data.emergencyContacts.length > 0 || data.selectedRestrictions.some(r => r.severity === 'life_threatening' || r.severity === 'severe')) {
        emergencyCard = await createEmergencyCard(userId, data)
        results.emergencyCard = emergencyCard
      }

      // 4. Log the successful onboarding
      await logOnboardingCompletion(userId, data)

      return {
        success: true,
        userProfileId: results.userProfile?.id,
        emergencyCardId: results.emergencyCard?.id,
      }

    } catch (error) {
      // Attempt rollback of any created records
      await rollbackOnboardingData(userId, results)
      throw error
    }

  } catch (error) {
    console.error('Onboarding submission error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error
    }
  }
}

/**
 * Creates or updates user profile
 */
async function createUserProfile(userId: string, data: OnboardingData) {
  const profileData: UserProfileInsert = {
    id: userId,
    email: '', // This should come from auth context
    full_name: data.basicInfo.fullName || '',
    phone_number: data.basicInfo.phoneNumber || null,
    date_of_birth: data.basicInfo.dateOfBirth || null,
    account_type: data.basicInfo.accountType || 'individual',
    medical_conditions: data.basicInfo.medicalConditions || null,
    preferred_language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    privacy_settings: {
      shareWithFamily: data.basicInfo.accountType === 'family',
      shareWithCaregivers: data.basicInfo.accountType === 'caregiver',
      allowEmergencySharing: data.consentGiven.emergencySharing,
    },
    notification_preferences: {
      productAlerts: true,
      emergencyAlerts: true,
      reminderAlerts: true,
      marketingEmails: false,
    },
  }

  // Add emergency contact info if provided
  if (data.emergencyContacts.length > 0) {
    const primaryContact = data.emergencyContacts.find(c => c.isPrimary) || data.emergencyContacts[0]
    profileData.emergency_contact_name = primaryContact.name
    profileData.emergency_contact_phone = primaryContact.phone
    profileData.emergency_contact_relationship = primaryContact.relationship
  }

  // Add medical provider info if provided
  if (data.medicalProviders.length > 0) {
    const allergist = data.medicalProviders.find(p => p.type === 'allergist')
    if (allergist) {
      profileData.allergist_name = allergist.name
      profileData.allergist_phone = allergist.phone
    }
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .upsert(profileData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create user profile: ${error.message}`)
  }

  return profile
}

/**
 * Creates user dietary restrictions
 */
async function createUserRestrictions(userId: string, restrictions: SelectedRestriction[]) {
  const restrictionData: UserRestrictionInsert[] = restrictions.map(restriction => ({
    user_id: userId,
    restriction_id: restriction.id,
    severity: restriction.severity as RestrictionSeverity,
    diagnosed_date: restriction.diagnosedDate || null,
    doctor_verified: restriction.doctorVerified,
    notes: restriction.notes || null,
    is_active: true,
  }))

  const { data, error } = await supabase
    .from('user_restrictions')
    .insert(restrictionData)
    .select()

  if (error) {
    throw new Error(`Failed to create user restrictions: ${error.message}`)
  }

  return data
}

/**
 * Creates emergency card
 */
async function createEmergencyCard(userId: string, data: OnboardingData) {
  const lifeThreatening = data.selectedRestrictions.filter(r => r.severity === 'life_threatening')
  const severe = data.selectedRestrictions.filter(r => r.severity === 'severe')
  const allHighRisk = [...lifeThreatening, ...severe]

  const restrictionsSummary = data.selectedRestrictions
    .map(r => `${r.name} (${r.severity})`)
    .join(', ')

  const emergencyInstructions = lifeThreatening.length > 0
    ? 'SEVERE ALLERGY - Call 911 immediately if exposed. Administer epinephrine if available and trained. Do not induce vomiting.'
    : 'Severe dietary restrictions. Seek medical attention if accidental exposure occurs.'

  const cardData: EmergencyCardInsert = {
    user_id: userId,
    family_member_id: null,
    card_name: `${data.basicInfo.fullName}'s Emergency Card`,
    restrictions_summary: restrictionsSummary,
    severity_level: lifeThreatening.length > 0 ? 'life_threatening' : 
                   severe.length > 0 ? 'severe' : 'moderate',
    emergency_instructions: emergencyInstructions,
    medications: lifeThreatening.length > 0 ? ['EpiPen/Epinephrine Auto-Injector'] : null,
    card_language: 'en',
    is_active: true,
  }

  // Add emergency contacts
  if (data.emergencyContacts.length > 0) {
    const contacts = data.emergencyContacts.slice(0, 2) // Limit to 2 contacts
    cardData.emergency_contact_1_name = contacts[0].name
    cardData.emergency_contact_1_phone = contacts[0].phone
    cardData.emergency_contact_1_relationship = contacts[0].relationship

    if (contacts.length > 1) {
      cardData.emergency_contact_2_name = contacts[1].name
      cardData.emergency_contact_2_phone = contacts[1].phone
      cardData.emergency_contact_2_relationship = contacts[1].relationship
    }
  }

  // Add medical provider
  if (data.medicalProviders.length > 0) {
    const provider = data.medicalProviders[0]
    cardData.doctor_name = provider.name
    cardData.doctor_phone = provider.phone
  }

  const { data: card, error } = await supabase
    .from('emergency_cards')
    .insert(cardData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create emergency card: ${error.message}`)
  }

  return card
}

/**
 * Logs successful onboarding completion
 */
async function logOnboardingCompletion(userId: string, data: OnboardingData) {
  const auditData = {
    table_name: 'user_profiles',
    record_id: userId,
    action: 'onboarding_completed',
    new_values: {
      restrictions_count: data.selectedRestrictions.length,
      emergency_contacts_count: data.emergencyContacts.length,
      medical_providers_count: data.medicalProviders.length,
      high_risk_restrictions: data.selectedRestrictions.filter(r => 
        r.severity === 'severe' || r.severity === 'life_threatening'
      ).length,
      onboarding_completed_at: new Date().toISOString(),
    },
    user_id: userId,
  }

  await supabase
    .from('audit_log')
    .insert(auditData)
}

/**
 * Attempts to rollback created data in case of errors
 */
async function rollbackOnboardingData(userId: string, results: any) {
  try {
    // Delete emergency card
    if (results.emergencyCard?.id) {
      await supabase
        .from('emergency_cards')
        .delete()
        .eq('id', results.emergencyCard.id)
    }

    // Delete user restrictions
    if (results.restrictions?.length > 0) {
      await supabase
        .from('user_restrictions')
        .delete()
        .eq('user_id', userId)
    }

    // Note: We don't delete the user profile as it might be needed for auth
    // Instead, we could mark it as incomplete

  } catch (rollbackError) {
    console.error('Rollback failed:', rollbackError)
  }
}

/**
 * Retrieves dietary restrictions master list for selection
 */
export async function getDietaryRestrictions() {
  const { data, error } = await supabase
    .from('dietary_restrictions')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Failed to fetch dietary restrictions:', error)
    return []
  }

  return data || []
}

/**
 * Validates phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Calculates age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

/**
 * Sanitizes user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}