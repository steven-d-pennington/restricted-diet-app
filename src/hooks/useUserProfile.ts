/**
 * User Profile Management Hooks
 * 
 * SAFETY CRITICAL: These hooks manage user profiles and dietary restrictions
 * for life-threatening allergy information
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  userProfileService,
  dietaryRestrictionsService,
} from '../services/database'
import {
  UserProfile,
  UserProfileUpdate,
  UserWithRestrictions,
  DietaryRestriction,
  UserRestriction,
  UserRestrictionInsert,
  UserRestrictionUpdate,
  RestrictionSeverity,
} from '../types/database.types'
import { SupabaseResponse } from '../lib/supabase'

interface UseUserProfileReturn {
  // Profile state
  userProfile: UserProfile | null
  userWithRestrictions: UserWithRestrictions | null
  availableRestrictions: DietaryRestriction[]
  loading: boolean
  error: string | null

  // Profile operations
  updateProfile: (updates: UserProfileUpdate) => Promise<boolean>
  refreshProfile: () => Promise<void>

  // Restriction operations
  addRestriction: (restrictionId: string, severity: RestrictionSeverity, notes?: string) => Promise<boolean>
  updateRestriction: (restrictionId: string, updates: UserRestrictionUpdate) => Promise<boolean>
  removeRestriction: (restrictionId: string) => Promise<boolean>
  searchRestrictions: (query: string) => Promise<DietaryRestriction[]>

  // Safety helpers
  hasLifeThreateningRestrictions: boolean
  hasSevereRestrictions: boolean
  criticalRestrictions: UserRestriction[]
}

export const useUserProfile = (): UseUserProfileReturn => {
  const { user, userProfile: authUserProfile } = useAuth()
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(authUserProfile)
  const [userWithRestrictions, setUserWithRestrictions] = useState<UserWithRestrictions | null>(null)
  const [availableRestrictions, setAvailableRestrictions] = useState<DietaryRestriction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync with auth context
  useEffect(() => {
    setUserProfile(authUserProfile)
  }, [authUserProfile])

  // Load user with restrictions when user changes
  useEffect(() => {
    if (user?.id) {
      loadUserWithRestrictions()
    }
  }, [user?.id])

  // Load available restrictions on mount
  useEffect(() => {
    loadAvailableRestrictions()
  }, [])

  const setLoadingState = useCallback((isLoading: boolean) => {
    setLoading(isLoading)
    if (isLoading) {
      setError(null)
    }
  }, [])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setLoading(false)
    console.error('User profile error:', errorMessage)
  }, [])

  const loadUserWithRestrictions = useCallback(async () => {
    if (!user?.id) return

    setLoadingState(true)
    try {
      const response = await userProfileService.getUserWithRestrictions(user.id)
      
      if (response.error) {
        handleError(response.error.message)
        return
      }

      if (response.data) {
        setUserWithRestrictions(response.data)
        setUserProfile(response.data)
      }
    } catch (error) {
      handleError('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }, [user?.id, setLoadingState, handleError])

  const loadAvailableRestrictions = useCallback(async () => {
    try {
      const response = await dietaryRestrictionsService.getAllRestrictions()
      
      if (response.error) {
        console.warn('Failed to load available restrictions:', response.error.message)
        return
      }

      if (response.data) {
        setAvailableRestrictions(response.data)
      }
    } catch (error) {
      console.warn('Error loading available restrictions:', error)
    }
  }, [])

  const updateProfile = useCallback(async (updates: UserProfileUpdate): Promise<boolean> => {
    if (!user?.id) {
      handleError('User must be authenticated')
      return false
    }

    setLoadingState(true)
    try {
      const response = await userProfileService.updateProfile(user.id, updates)
      
      if (response.error) {
        handleError(response.error.message)
        return false
      }

      if (response.data) {
        setUserProfile(response.data)
        // Update userWithRestrictions if it exists
        if (userWithRestrictions) {
          setUserWithRestrictions({
            ...userWithRestrictions,
            ...response.data
          })
        }
      }

      return true
    } catch (error) {
      handleError('Failed to update profile')
      return false
    } finally {
      setLoading(false)
    }
  }, [user?.id, userWithRestrictions, setLoadingState, handleError])

  const refreshProfile = useCallback(async () => {
    await loadUserWithRestrictions()
  }, [loadUserWithRestrictions])

  const addRestriction = useCallback(async (
    restrictionId: string, 
    severity: RestrictionSeverity, 
    notes?: string
  ): Promise<boolean> => {
    if (!user?.id) {
      handleError('User must be authenticated')
      return false
    }

    setLoadingState(true)
    try {
      const restrictionData: UserRestrictionInsert = {
        user_id: user.id,
        restriction_id: restrictionId,
        severity,
        notes: notes || null,
        is_active: true
      }

      const response = await dietaryRestrictionsService.addUserRestriction(restrictionData)
      
      if (response.error) {
        handleError(response.error.message)
        return false
      }

      // Refresh user data to include new restriction
      await loadUserWithRestrictions()
      return true
    } catch (error) {
      handleError('Failed to add dietary restriction')
      return false
    } finally {
      setLoading(false)
    }
  }, [user?.id, setLoadingState, handleError, loadUserWithRestrictions])

  const updateRestriction = useCallback(async (
    restrictionId: string, 
    updates: UserRestrictionUpdate
  ): Promise<boolean> => {
    setLoadingState(true)
    try {
      const response = await dietaryRestrictionsService.updateUserRestriction(restrictionId, updates)
      
      if (response.error) {
        handleError(response.error.message)
        return false
      }

      // Refresh user data to reflect changes
      await loadUserWithRestrictions()
      return true
    } catch (error) {
      handleError('Failed to update dietary restriction')
      return false
    } finally {
      setLoading(false)
    }
  }, [setLoadingState, handleError, loadUserWithRestrictions])

  const removeRestriction = useCallback(async (restrictionId: string): Promise<boolean> => {
    setLoadingState(true)
    try {
      const response = await dietaryRestrictionsService.removeUserRestriction(restrictionId)
      
      if (response.error) {
        handleError(response.error.message)
        return false
      }

      // Refresh user data to reflect removal
      await loadUserWithRestrictions()
      return true
    } catch (error) {
      handleError('Failed to remove dietary restriction')
      return false
    } finally {
      setLoading(false)
    }
  }, [setLoadingState, handleError, loadUserWithRestrictions])

  const searchRestrictions = useCallback(async (query: string): Promise<DietaryRestriction[]> => {
    try {
      const response = await dietaryRestrictionsService.searchRestrictions(query)
      
      if (response.error) {
        console.warn('Failed to search restrictions:', response.error.message)
        return []
      }

      return response.data || []
    } catch (error) {
      console.warn('Error searching restrictions:', error)
      return []
    }
  }, [])

  // Safety helpers
  const userRestrictions = userWithRestrictions?.restrictions || []
  
  const hasLifeThreateningRestrictions = userRestrictions.some(
    restriction => restriction.severity === 'life_threatening' && restriction.is_active
  )
  
  const hasSevereRestrictions = userRestrictions.some(
    restriction => 
      (restriction.severity === 'severe' || restriction.severity === 'life_threatening') && 
      restriction.is_active
  )
  
  const criticalRestrictions = userRestrictions.filter(
    restriction => 
      (restriction.severity === 'severe' || restriction.severity === 'life_threatening') && 
      restriction.is_active
  )

  return {
    // State
    userProfile,
    userWithRestrictions,
    availableRestrictions,
    loading,
    error,
    
    // Operations
    updateProfile,
    refreshProfile,
    addRestriction,
    updateRestriction,
    removeRestriction,
    searchRestrictions,
    
    // Safety helpers
    hasLifeThreateningRestrictions,
    hasSevereRestrictions,
    criticalRestrictions,
  }
}

/**
 * Hook for getting current user's dietary restrictions only
 */
export const useUserRestrictions = () => {
  const { user } = useAuth()
  const [restrictions, setRestrictions] = useState<(UserRestriction & { dietary_restriction: DietaryRestriction })[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRestrictions = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)
    
    try {
      const response = await dietaryRestrictionsService.getUserRestrictions(user.id)
      
      if (response.error) {
        setError(response.error.message)
        return
      }

      setRestrictions(response.data || [])
    } catch (error) {
      setError('Failed to load dietary restrictions')
      console.error('Error loading restrictions:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadRestrictions()
  }, [loadRestrictions])

  const refreshRestrictions = useCallback(() => {
    loadRestrictions()
  }, [loadRestrictions])

  // Safety analysis
  const lifeThreateningRestrictions = restrictions.filter(r => r.severity === 'life_threatening')
  const severeRestrictions = restrictions.filter(r => r.severity === 'severe')
  const hasEmergencyRestrictions = lifeThreateningRestrictions.length > 0

  return {
    restrictions,
    loading,
    error,
    refreshRestrictions,
    lifeThreateningRestrictions,
    severeRestrictions,
    hasEmergencyRestrictions,
  }
}

export default useUserProfile