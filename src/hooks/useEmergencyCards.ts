/**
 * Emergency Card Management Hooks
 * 
 * SAFETY CRITICAL: These hooks manage emergency cards for life-threatening allergies
 * Emergency cards provide critical information for first responders and medical personnel
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUserRestrictions } from './useUserProfile'
import { emergencyCardService } from '../services/database'
import { supabase } from '../lib/supabase'
import {
  EmergencyCard,
  EmergencyCardInsert,
  EmergencyCardUpdate,
  RestrictionSeverity,
  UserRestriction,
  DietaryRestriction,
} from '../types/database.types'

interface UseEmergencyCardsReturn {
  // State
  emergencyCards: EmergencyCard[]
  activeCards: EmergencyCard[]
  selectedCard: EmergencyCard | null
  loading: boolean
  error: string | null

  // Card operations
  createEmergencyCard: (cardData: Omit<EmergencyCardInsert, 'user_id' | 'family_member_id'>, forFamilyMember?: string) => Promise<boolean>
  updateEmergencyCard: (cardId: string, updates: EmergencyCardUpdate) => Promise<boolean>
  deleteEmergencyCard: (cardId: string) => Promise<boolean>
  activateCard: (cardId: string) => Promise<boolean>
  deactivateCard: (cardId: string) => Promise<boolean>
  selectCard: (cardId: string) => void
  clearSelectedCard: () => void
  refreshCards: () => Promise<void>

  // Card generation helpers
  generateCardFromRestrictions: (restrictions: (UserRestriction & { dietary_restriction: DietaryRestriction })[], cardName?: string) => EmergencyCardInsert
  generateQRCode: (cardId: string) => Promise<string | null>
  generateCardPDF: (cardId: string) => Promise<Blob | null>

  // Safety helpers
  hasLifeThreateningCards: boolean
  criticalCards: EmergencyCard[]
  needsEmergencyCard: boolean
  getCardPriority: (card: EmergencyCard) => number
}

export const useEmergencyCards = (familyMemberId?: string): UseEmergencyCardsReturn => {
  const { user } = useAuth()
  const { restrictions, hasEmergencyRestrictions, lifeThreateningRestrictions } = useUserRestrictions()
  
  const [emergencyCards, setEmergencyCards] = useState<EmergencyCard[]>([])
  const [selectedCard, setSelectedCard] = useState<EmergencyCard | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id || familyMemberId) {
      loadEmergencyCards()
    }
  }, [user?.id, familyMemberId])

  const setLoadingState = useCallback((isLoading: boolean) => {
    setLoading(isLoading)
    if (isLoading) {
      setError(null)
    }
  }, [])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setLoading(false)
    console.error('Emergency cards error:', errorMessage)
  }, [])

  const loadEmergencyCards = useCallback(async () => {
    if (!user?.id && !familyMemberId) return

    setLoadingState(true)
    try {
      let response
      if (familyMemberId) {
        response = await emergencyCardService.getFamilyMemberEmergencyCards(familyMemberId)
      } else {
        response = await emergencyCardService.getUserEmergencyCards(user!.id)
      }
      
      if (response.error) {
        handleError(response.error.message)
        return
      }

      setEmergencyCards(response.data || [])
    } catch (error) {
      handleError('Failed to load emergency cards')
    } finally {
      setLoading(false)
    }
  }, [user?.id, familyMemberId, setLoadingState, handleError])

  const createEmergencyCard = useCallback(async (
    cardData: Omit<EmergencyCardInsert, 'user_id' | 'family_member_id'>,
    forFamilyMember?: string
  ): Promise<boolean> => {
    if (!user?.id && !forFamilyMember) {
      handleError('User must be authenticated or family member specified')
      return false
    }

    setLoadingState(true)
    try {
      // If creating for the current user, ensure the user_profiles row exists to satisfy FK
      if (!forFamilyMember && user?.id) {
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (!existingProfile) {
          // Create a minimal profile record
          const { error: insertProfileError } = await supabase
            .from('user_profiles')
            .insert({ id: user.id, email: user.email || '' })

          if (insertProfileError) {
            handleError('Unable to create user profile required for emergency cards')
            return false
          }
        }
      }

      const emergencyCardData: EmergencyCardInsert = {
        ...cardData,
        user_id: forFamilyMember ? null : user!.id,
        family_member_id: forFamilyMember || null,
      }

      const response = await emergencyCardService.createEmergencyCard(emergencyCardData)
      
      if (response.error) {
        handleError(response.error.message)
        return false
      }

      // Refresh cards list
      await loadEmergencyCards()
      return true
    } catch (error) {
      handleError('Failed to create emergency card')
      return false
    } finally {
      setLoading(false)
    }
  }, [user?.id, setLoadingState, handleError, loadEmergencyCards])

  const updateEmergencyCard = useCallback(async (
    cardId: string,
    updates: EmergencyCardUpdate
  ): Promise<boolean> => {
    setLoadingState(true)
    try {
      const response = await emergencyCardService.updateEmergencyCard(cardId, updates)
      
      if (response.error) {
        handleError(response.error.message)
        return false
      }

      // Update local state
      setEmergencyCards(prev => 
        prev.map(card => 
          card.id === cardId ? { ...card, ...updates } : card
        )
      )

      // Update selected card if it's the one being updated
      if (selectedCard?.id === cardId) {
        setSelectedCard(prev => prev ? { ...prev, ...updates } : null)
      }

      return true
    } catch (error) {
      handleError('Failed to update emergency card')
      return false
    } finally {
      setLoading(false)
    }
  }, [selectedCard?.id, setLoadingState, handleError])

  const deleteEmergencyCard = useCallback(async (cardId: string): Promise<boolean> => {
    setLoadingState(true)
    try {
      const response = await emergencyCardService.delete(cardId)
      
      if (response.error) {
        handleError(response.error.message)
        return false
      }

      // Remove from local state
      setEmergencyCards(prev => prev.filter(card => card.id !== cardId))
      
      // Clear selected card if it's the one being deleted
      if (selectedCard?.id === cardId) {
        setSelectedCard(null)
      }

      return true
    } catch (error) {
      handleError('Failed to delete emergency card')
      return false
    } finally {
      setLoading(false)
    }
  }, [selectedCard?.id, setLoadingState, handleError])

  const activateCard = useCallback(async (cardId: string): Promise<boolean> => {
    return updateEmergencyCard(cardId, { is_active: true })
  }, [updateEmergencyCard])

  const deactivateCard = useCallback(async (cardId: string): Promise<boolean> => {
    return updateEmergencyCard(cardId, { is_active: false })
  }, [updateEmergencyCard])

  const selectCard = useCallback((cardId: string) => {
    const card = emergencyCards.find(c => c.id === cardId)
    setSelectedCard(card || null)
  }, [emergencyCards])

  const clearSelectedCard = useCallback(() => {
    setSelectedCard(null)
  }, [])

  const refreshCards = useCallback(async () => {
    await loadEmergencyCards()
  }, [loadEmergencyCards])

  const generateCardFromRestrictions = useCallback((
    userRestrictions: (UserRestriction & { dietary_restriction: DietaryRestriction })[],
    cardName?: string
  ): EmergencyCardInsert => {
    // Filter to critical restrictions only
    const criticalRestrictions = userRestrictions.filter(
      r => r.severity === 'life_threatening' || r.severity === 'severe'
    )

    const restrictionNames = criticalRestrictions.map(r => r.dietary_restriction.name)
    const highestSeverity = criticalRestrictions.some(r => r.severity === 'life_threatening') 
      ? 'life_threatening' as RestrictionSeverity
      : 'severe' as RestrictionSeverity

    // Generate restrictions summary
    const restrictionsSummary = restrictionNames.length > 0 
      ? `Severe allergies: ${restrictionNames.join(', ')}`
      : 'Multiple dietary restrictions - see details below'

    // Generate emergency instructions
    const emergencyInstructions = highestSeverity === 'life_threatening'
      ? `EMERGENCY: This person has life-threatening allergies to ${restrictionNames.join(', ')}. If exposed, they may experience anaphylaxis. Call 911 immediately. Administer epinephrine if available and trained. Do not leave person alone.`
      : `CAUTION: This person has severe allergies to ${restrictionNames.join(', ')}. Monitor for allergic reactions. Seek medical attention if symptoms develop.`

    // Suggested medications for life-threatening allergies
    const medications = highestSeverity === 'life_threatening' 
      ? ['EpiPen/Epinephrine Auto-injector', 'Antihistamine (Benadryl)']
      : ['Antihistamine (Benadryl)']

    return {
      user_id: user?.id || null,
      family_member_id: familyMemberId || null,
      card_name: cardName || `Emergency Card - ${new Date().toLocaleDateString()}`,
      restrictions_summary: restrictionsSummary,
      severity_level: highestSeverity,
      emergency_instructions: emergencyInstructions,
      medications,
      card_language: 'en',
      is_active: true,
    }
  }, [user?.id, familyMemberId])

  const generateQRCode = useCallback(async (cardId: string): Promise<string | null> => {
    try {
      // Generate QR code URL that links to emergency card view
      const cardUrl = `${process.env.EXPO_PUBLIC_APP_URL}/emergency/${cardId}`
      
      // In a real app, you would use a QR code generation library here
      // For now, return a placeholder URL
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardUrl)}`
      
      // Update the card with the QR code URL
      await updateEmergencyCard(cardId, { qr_code_url: qrCodeUrl })
      
      return qrCodeUrl
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      return null
    }
  }, [updateEmergencyCard])

  const generateCardPDF = useCallback(async (cardId: string): Promise<Blob | null> => {
    try {
      const card = emergencyCards.find(c => c.id === cardId)
      if (!card) {
        throw new Error('Card not found')
      }

      // In a real app, you would use a PDF generation library here
      // For now, return null as placeholder
      console.log('PDF generation would be implemented here for card:', card.card_name)
      return null
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      return null
    }
  }, [emergencyCards])

  const getCardPriority = useCallback((card: EmergencyCard): number => {
    // Higher number = higher priority
    switch (card.severity_level) {
      case 'life_threatening':
        return 4
      case 'severe':
        return 3
      case 'moderate':
        return 2
      case 'mild':
        return 1
      default:
        return 0
    }
  }, [])

  // Computed values
  const activeCards = emergencyCards.filter(card => card.is_active)
  
  const hasLifeThreateningCards = activeCards.some(
    card => card.severity_level === 'life_threatening'
  )
  
  const criticalCards = activeCards
    .filter(card => 
      card.severity_level === 'life_threatening' || 
      card.severity_level === 'severe'
    )
    .sort((a, b) => getCardPriority(b) - getCardPriority(a))
  
  const needsEmergencyCard = hasEmergencyRestrictions && activeCards.length === 0

  return {
    // State
    emergencyCards,
    activeCards,
    selectedCard,
    loading,
    error,

    // Operations
    createEmergencyCard,
    updateEmergencyCard,
    deleteEmergencyCard,
    activateCard,
    deactivateCard,
    selectCard,
    clearSelectedCard,
    refreshCards,

    // Helpers
    generateCardFromRestrictions,
    generateQRCode,
    generateCardPDF,

    // Safety analysis
    hasLifeThreateningCards,
    criticalCards,
    needsEmergencyCard,
    getCardPriority,
  }
}

/**
 * Hook for viewing a specific emergency card (e.g., from QR code scan)
 */
export const useEmergencyCard = (cardId: string | null) => {
  const [card, setCard] = useState<EmergencyCard | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCard = useCallback(async () => {
    if (!cardId) {
      setCard(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await emergencyCardService.findById(cardId)
      
      if (response.error) {
        setError(response.error.message)
        return
      }

      setCard(response.data)
    } catch (error) {
      setError('Failed to load emergency card')
      console.error('Error loading emergency card:', error)
    } finally {
      setLoading(false)
    }
  }, [cardId])

  useEffect(() => {
    loadCard()
  }, [loadCard])

  const isLifeThreatening = card?.severity_level === 'life_threatening'
  const isSevere = card?.severity_level === 'severe'
  const isActive = card?.is_active

  return {
    card,
    loading,
    error,
    isLifeThreatening,
    isSevere,
    isActive,
    refreshCard: loadCard,
  }
}

export default useEmergencyCards