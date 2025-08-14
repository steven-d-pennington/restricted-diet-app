/**
 * Family Member Management Hooks
 * 
 * SAFETY CRITICAL: These hooks manage family member profiles and dietary restrictions
 * for life-threatening allergy information in family accounts
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  familyMemberService,
  dietaryRestrictionsService,
} from '../services/database'
import {
  FamilyMember,
  FamilyMemberInsert,
  FamilyMemberUpdate,
  FamilyMemberWithRestrictions,
  DietaryRestriction,
  UserRestriction,
  RestrictionSeverity,
} from '../types/database.types'

interface UseFamilyMembersReturn {
  // State
  familyMembers: FamilyMember[]
  selectedMember: FamilyMemberWithRestrictions | null
  loading: boolean
  error: string | null

  // Family member operations
  addFamilyMember: (memberData: Omit<FamilyMemberInsert, 'family_admin_id'>) => Promise<boolean>
  updateFamilyMember: (memberId: string, updates: FamilyMemberUpdate) => Promise<boolean>
  removeFamilyMember: (memberId: string) => Promise<boolean>
  selectMember: (memberId: string) => Promise<void>
  clearSelectedMember: () => void
  refreshFamilyMembers: () => Promise<void>

  // Restriction operations for family members
  addMemberRestriction: (memberId: string, restrictionId: string, severity: RestrictionSeverity, notes?: string) => Promise<boolean>
  updateMemberRestriction: (restrictionId: string, updates: any) => Promise<boolean>
  removeMemberRestriction: (restrictionId: string) => Promise<boolean>

  // Safety helpers
  membersWithLifeThreateningRestrictions: FamilyMember[]
  membersWithSevereRestrictions: FamilyMember[]
  totalCriticalRestrictions: number
}

export const useFamilyMembers = (): UseFamilyMembersReturn => {
  const { user, userProfile } = useAuth()
  
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [selectedMember, setSelectedMember] = useState<FamilyMemberWithRestrictions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if user has family account type
  const isFamilyAccount = userProfile?.account_type === 'family'

  useEffect(() => {
    if (user?.id && isFamilyAccount) {
      loadFamilyMembers()
    }
  }, [user?.id, isFamilyAccount])

  const setLoadingState = useCallback((isLoading: boolean) => {
    setLoading(isLoading)
    if (isLoading) {
      setError(null)
    }
  }, [])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setLoading(false)
    console.error('Family members error:', errorMessage)
  }, [])

  const loadFamilyMembers = useCallback(async () => {
    if (!user?.id || !isFamilyAccount) return

    setLoadingState(true)
    try {
      const response = await familyMemberService.getFamilyMembers(user.id)
      
      if (response.error) {
        handleError(response.error.message)
        return
      }

      setFamilyMembers(response.data || [])
    } catch (error) {
      handleError('Failed to load family members')
    } finally {
      setLoading(false)
    }
  }, [user?.id, isFamilyAccount, setLoadingState, handleError])

  const addFamilyMember = useCallback(async (
    memberData: Omit<FamilyMemberInsert, 'family_admin_id'>
  ): Promise<boolean> => {
    if (!user?.id || !isFamilyAccount) {
      handleError('Only family account holders can add family members')
      return false
    }

    setLoadingState(true)
    try {
      const familyMemberData: FamilyMemberInsert = {
        ...memberData,
        family_admin_id: user.id
      }

      const response = await familyMemberService.createFamilyMember(familyMemberData)
      
      if (response.error) {
        handleError(response.error.message)
        return false
      }

      // Refresh family members list
      await loadFamilyMembers()
      return true
    } catch (error) {
      handleError('Failed to add family member')
      return false
    } finally {
      setLoading(false)
    }
  }, [user?.id, isFamilyAccount, setLoadingState, handleError, loadFamilyMembers])

  const updateFamilyMember = useCallback(async (
    memberId: string, 
    updates: FamilyMemberUpdate
  ): Promise<boolean> => {
    if (!isFamilyAccount) {
      handleError('Only family account holders can update family members')
      return false
    }

    setLoadingState(true)
    try {
      const response = await familyMemberService.update(memberId, updates)
      
      if (response.error) {
        handleError(response.error.message)
        return false
      }

      // Refresh family members list
      await loadFamilyMembers()
      
      // Update selected member if it's the one being updated
      if (selectedMember?.id === memberId) {
        await selectMember(memberId)
      }

      return true
    } catch (error) {
      handleError('Failed to update family member')
      return false
    } finally {
      setLoading(false)
    }
  }, [isFamilyAccount, selectedMember?.id, setLoadingState, handleError, loadFamilyMembers])

  const removeFamilyMember = useCallback(async (memberId: string): Promise<boolean> => {
    if (!isFamilyAccount) {
      handleError('Only family account holders can remove family members')
      return false
    }

    setLoadingState(true)
    try {
      // Use deactivate instead of hard delete for safety
      const response = await familyMemberService.deactivateFamilyMember(memberId)
      
      if (response.error) {
        handleError(response.error.message)
        return false
      }

      // Clear selected member if it's the one being removed
      if (selectedMember?.id === memberId) {
        setSelectedMember(null)
      }

      // Refresh family members list
      await loadFamilyMembers()
      return true
    } catch (error) {
      handleError('Failed to remove family member')
      return false
    } finally {
      setLoading(false)
    }
  }, [isFamilyAccount, selectedMember?.id, setLoadingState, handleError, loadFamilyMembers])

  const selectMember = useCallback(async (memberId: string) => {
    setLoadingState(true)
    try {
      const response = await familyMemberService.getFamilyMemberWithRestrictions(memberId)
      
      if (response.error) {
        handleError(response.error.message)
        return
      }

      setSelectedMember(response.data)
    } catch (error) {
      handleError('Failed to load family member details')
    } finally {
      setLoading(false)
    }
  }, [setLoadingState, handleError])

  const clearSelectedMember = useCallback(() => {
    setSelectedMember(null)
  }, [])

  const refreshFamilyMembers = useCallback(async () => {
    await loadFamilyMembers()
    if (selectedMember) {
      await selectMember(selectedMember.id)
    }
  }, [loadFamilyMembers, selectedMember])

  const addMemberRestriction = useCallback(async (
    memberId: string,
    restrictionId: string,
    severity: RestrictionSeverity,
    notes?: string
  ): Promise<boolean> => {
    if (!isFamilyAccount) {
      handleError('Only family account holders can manage restrictions')
      return false
    }

    setLoadingState(true)
    try {
      const restrictionData = {
        family_member_id: memberId,
        restriction_id: restrictionId,
        severity,
        notes: notes || null,
        is_active: true
      }

      // Use direct Supabase client for restrictions table since service is for family_members
      const { supabase } = await import('../lib/supabase')
      const response = await supabase
        .from('family_member_restrictions')
        .insert(restrictionData)
        .select()
        .single()

      if (response.error) {
        handleError(response.error.message)
        return false
      }

      // Refresh selected member if it's the one being updated
      if (selectedMember?.id === memberId) {
        await selectMember(memberId)
      }

      return true
    } catch (error) {
      handleError('Failed to add dietary restriction')
      return false
    } finally {
      setLoading(false)
    }
  }, [isFamilyAccount, selectedMember?.id, setLoadingState, handleError])

  const updateMemberRestriction = useCallback(async (
    restrictionId: string,
    updates: any
  ): Promise<boolean> => {
    if (!isFamilyAccount) {
      handleError('Only family account holders can manage restrictions')
      return false
    }

    setLoadingState(true)
    try {
      const { supabase } = await import('../lib/supabase')
      const response = await supabase
        .from('family_member_restrictions')
        .update(updates)
        .eq('id', restrictionId)
        .select()
        .single()

      if (response.error) {
        handleError(response.error.message)
        return false
      }

      // Refresh selected member
      if (selectedMember) {
        await selectMember(selectedMember.id)
      }

      return true
    } catch (error) {
      handleError('Failed to update dietary restriction')
      return false
    } finally {
      setLoading(false)
    }
  }, [isFamilyAccount, selectedMember, setLoadingState, handleError])

  const removeMemberRestriction = useCallback(async (restrictionId: string): Promise<boolean> => {
    if (!isFamilyAccount) {
      handleError('Only family account holders can manage restrictions')
      return false
    }

    setLoadingState(true)
    try {
      // Mark as inactive instead of hard delete for safety
      const { supabase } = await import('../lib/supabase')
      const response = await supabase
        .from('family_member_restrictions')
        .update({ is_active: false })
        .eq('id', restrictionId)
        .select()
        .single()

      if (response.error) {
        handleError(response.error.message)
        return false
      }

      // Refresh selected member
      if (selectedMember) {
        await selectMember(selectedMember.id)
      }

      return true
    } catch (error) {
      handleError('Failed to remove dietary restriction')
      return false
    } finally {
      setLoading(false)
    }
  }, [isFamilyAccount, selectedMember, setLoadingState, handleError])

  // Safety analysis helpers
  const getMemberCriticalRestrictions = useCallback((member: FamilyMember) => {
    // This would need to be enhanced to include restriction details
    // For now, we'll use medical_conditions as a proxy
    return member.medical_conditions?.filter(condition => 
      condition.toLowerCase().includes('allergy') || 
      condition.toLowerCase().includes('anaphylaxis')
    ) || []
  }, [])

  const membersWithLifeThreateningRestrictions = familyMembers.filter(member => {
    const criticalConditions = getMemberCriticalRestrictions(member)
    return criticalConditions.length > 0
  })

  const membersWithSevereRestrictions = familyMembers.filter(member => {
    return member.medical_conditions && member.medical_conditions.length > 0
  })

  const totalCriticalRestrictions = familyMembers.reduce((total, member) => {
    return total + getMemberCriticalRestrictions(member).length
  }, 0)

  return {
    // State
    familyMembers,
    selectedMember,
    loading,
    error,

    // Operations
    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember,
    selectMember,
    clearSelectedMember,
    refreshFamilyMembers,

    // Restriction operations
    addMemberRestriction,
    updateMemberRestriction,
    removeMemberRestriction,

    // Safety helpers
    membersWithLifeThreateningRestrictions,
    membersWithSevereRestrictions,
    totalCriticalRestrictions,
  }
}

/**
 * Hook for managing a specific family member
 */
export const useFamilyMember = (memberId: string | null) => {
  const [member, setMember] = useState<FamilyMemberWithRestrictions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMember = useCallback(async () => {
    if (!memberId) {
      setMember(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await familyMemberService.getFamilyMemberWithRestrictions(memberId)
      
      if (response.error) {
        setError(response.error.message)
        return
      }

      setMember(response.data)
    } catch (error) {
      setError('Failed to load family member')
      console.error('Error loading family member:', error)
    } finally {
      setLoading(false)
    }
  }, [memberId])

  useEffect(() => {
    loadMember()
  }, [loadMember])

  const refreshMember = useCallback(() => {
    loadMember()
  }, [loadMember])

  // Safety analysis
  const memberRestrictions = member?.restrictions || []
  const lifeThreateningRestrictions = memberRestrictions.filter(r => r.severity === 'life_threatening')
  const severeRestrictions = memberRestrictions.filter(r => r.severity === 'severe')
  const hasEmergencyRestrictions = lifeThreateningRestrictions.length > 0

  return {
    member,
    loading,
    error,
    refreshMember,
    memberRestrictions,
    lifeThreateningRestrictions,
    severeRestrictions,
    hasEmergencyRestrictions,
  }
}

export default useFamilyMembers