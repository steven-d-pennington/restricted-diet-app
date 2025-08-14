/**
 * Supabase Client Configuration
 * 
 * SAFETY CRITICAL: This client handles life-threatening allergy information
 * Ensure all operations maintain data integrity and security
 */

import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { Storage } from '../utils/storage'
import { PlatformUtils } from '../utils/platformUtils'
import { Database } from '../types/database.types'

// Create a storage adapter that matches Supabase's expected interface
const supabaseStorageAdapter = {
  getItem: (key: string) => Storage.getItem(key),
  setItem: (key: string, value: string) => Storage.setItem(key, value),
  removeItem: (key: string) => Storage.removeItem(key)
}

// Environment variables validation
// Prefer Expo public env vars on web; fall back to plain vars for native/dev
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable')
}

/**
 * Supabase client with proper TypeScript types and platform-universal storage configuration
 * Works on both React Native and web platforms
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: supabaseStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: PlatformUtils.isWeb, // Only detect session in URL on web
  },
  global: {
    headers: {
      'x-application-name': 'restricted-diet-app',
    },
  },
})

/**
 * Error types for consistent error handling
 */
export interface SupabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}

/**
 * Standard response wrapper for all database operations
 */
export interface SupabaseResponse<T = any> {
  data: T | null
  error: SupabaseError | null
  count?: number | null
}

/**
 * Utility function to handle Supabase responses consistently
 */
export function handleSupabaseResponse<T>(
  response: { data: T | null; error: any; count?: number | null }
): SupabaseResponse<T> {
  if (response.error) {
    console.error('Supabase error:', response.error)
    return {
      data: null,
      error: {
        message: response.error.message || 'An unexpected error occurred',
        details: response.error.details,
        hint: response.error.hint,
        code: response.error.code,
      },
      count: response.count,
    }
  }

  return {
    data: response.data,
    error: null,
    count: response.count,
  }
}

/**
 * Authentication state helper
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  
  return user
}

/**
 * Session state helper
 */
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error getting current session:', error)
    return null
  }
  
  return session
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser()
  return !!user
}

/**
 * Sign out helper
 */
export const signOut = async (): Promise<SupabaseResponse<void>> => {
  const { error } = await supabase.auth.signOut()
  
  return handleSupabaseResponse({ data: null, error })
}

/**
 * Real-time subscription cleanup helper
 */
export const cleanupSubscription = (subscription: any) => {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
}

export default supabase