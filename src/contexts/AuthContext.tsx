/**
 * Authentication Context for Restricted Diet Application
 * 
 * SAFETY CRITICAL: Manages user authentication for accessing medical information
 * Ensures proper session management and secure access to dietary restriction data
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User, AuthError } from '@supabase/supabase-js'
import { supabase, handleSupabaseResponse, SupabaseResponse } from '../lib/supabase'
import { UserProfile, UserProfileInsert } from '../types/database.types'

interface AuthContextType {
  // Authentication state
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  loading: boolean
  
  // Authentication methods
  signUp: (email: string, password: string, profileData?: Partial<UserProfileInsert>) => Promise<SupabaseResponse<{ user: User | null; profile: UserProfile | null }>>
  signIn: (email: string, password: string) => Promise<SupabaseResponse<{ user: User | null; session: Session | null }>>
  signOut: () => Promise<SupabaseResponse<void>>
  resetPassword: (email: string) => Promise<SupabaseResponse<void>>
  updatePassword: (password: string) => Promise<SupabaseResponse<void>>
  
  // Profile management
  updateProfile: (updates: Partial<UserProfile>) => Promise<SupabaseResponse<UserProfile>>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize authentication state
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
          
          if (session?.user) {
            await fetchUserProfile(session.user.id)
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      setUserProfile(data)
      return data
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      return null
    }
  }

  // Sign up new user with profile
  const signUp = async (
    email: string, 
    password: string, 
    profileData?: Partial<UserProfileInsert>
  ): Promise<SupabaseResponse<{ user: User | null; profile: UserProfile | null }>> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        return handleSupabaseResponse({ data: null, error: authError })
      }

      if (!authData.user) {
        return handleSupabaseResponse({ 
          data: null, 
          error: { message: 'Failed to create user account' } 
        })
      }

      // Create user profile
      const profileInsert: UserProfileInsert = {
        id: authData.user.id,
        email: authData.user.email!,
        full_name: profileData?.full_name || null,
        phone_number: profileData?.phone_number || null,
        account_type: profileData?.account_type || 'individual',
        ...profileData,
      }

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert(profileInsert)
        .select()
        .single()

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        // Note: User account was created but profile failed
        return handleSupabaseResponse({
          data: { user: authData.user, profile: null },
          error: profileError
        })
      }

      return handleSupabaseResponse({
        data: { user: authData.user, profile: profileData },
        error: null
      })
    } catch (error) {
      console.error('Error in signUp:', error)
      return handleSupabaseResponse({
        data: null,
        error: { message: 'An unexpected error occurred during sign up' }
      })
    }
  }

  // Sign in existing user
  const signIn = async (
    email: string, 
    password: string
  ): Promise<SupabaseResponse<{ user: User | null; session: Session | null }>> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return handleSupabaseResponse({ data: null, error })
      }

      return handleSupabaseResponse({
        data: { user: data.user, session: data.session },
        error: null
      })
    } catch (error) {
      console.error('Error in signIn:', error)
      return handleSupabaseResponse({
        data: null,
        error: { message: 'An unexpected error occurred during sign in' }
      })
    }
  }

  // Sign out user
  const signOut = async (): Promise<SupabaseResponse<void>> => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return handleSupabaseResponse({ data: null, error })
      }

      return handleSupabaseResponse({ data: null, error: null })
    } catch (error) {
      console.error('Error in signOut:', error)
      return handleSupabaseResponse({
        data: null,
        error: { message: 'An unexpected error occurred during sign out' }
      })
    }
  }

  // Reset password
  const resetPassword = async (email: string): Promise<SupabaseResponse<void>> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      
      return handleSupabaseResponse({ data: null, error })
    } catch (error) {
      console.error('Error in resetPassword:', error)
      return handleSupabaseResponse({
        data: null,
        error: { message: 'An unexpected error occurred during password reset' }
      })
    }
  }

  // Update password
  const updatePassword = async (password: string): Promise<SupabaseResponse<void>> => {
    try {
      const { error } = await supabase.auth.updateUser({ password })
      
      return handleSupabaseResponse({ data: null, error })
    } catch (error) {
      console.error('Error in updatePassword:', error)
      return handleSupabaseResponse({
        data: null,
        error: { message: 'An unexpected error occurred during password update' }
      })
    }
  }

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>): Promise<SupabaseResponse<UserProfile>> => {
    if (!user) {
      return handleSupabaseResponse({
        data: null,
        error: { message: 'User must be authenticated to update profile' }
      })
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        return handleSupabaseResponse({ data: null, error })
      }

      setUserProfile(data)
      return handleSupabaseResponse({ data, error: null })
    } catch (error) {
      console.error('Error in updateProfile:', error)
      return handleSupabaseResponse({
        data: null,
        error: { message: 'An unexpected error occurred during profile update' }
      })
    }
  }

  // Refresh user profile
  const refreshProfile = async (): Promise<void> => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Hook for requiring authentication
export const useRequireAuth = (): AuthContextType => {
  const auth = useAuth()
  
  if (!auth.user) {
    throw new Error('This component requires authentication')
  }
  
  return auth
}

export default AuthContext