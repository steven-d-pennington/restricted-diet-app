/**
 * Restricted Diet App - Supabase Integration Main Export
 * 
 * SAFETY CRITICAL: This module provides comprehensive database integration
 * for managing life-threatening dietary restrictions and allergies
 * 
 * Key Features:
 * - Type-safe database operations
 * - User authentication and profile management
 * - Family member management for family accounts
 * - Product scanning and safety assessment
 * - Emergency card management for critical allergies
 * - Comprehensive error handling
 */

// Core Supabase client and utilities
export { default as supabase } from './lib/supabase'
export {
  handleSupabaseResponse,
  getCurrentUser,
  getCurrentSession,
  isAuthenticated,
  signOut,
  cleanupSubscription,
} from './lib/supabase'
export type { SupabaseResponse, SupabaseError } from './lib/supabase'

// Database types
export type * from './types/database.types'
export type {
  Database,
  UserProfile,
  UserProfileInsert,
  UserProfileUpdate,
  FamilyMember,
  FamilyMemberInsert,
  FamilyMemberUpdate,
  DietaryRestriction,
  UserRestriction,
  UserRestrictionInsert,
  UserRestrictionUpdate,
  Product,
  ProductInsert,
  ProductUpdate,
  ProductSafetyAssessment,
  ProductSafetyAssessmentInsert,
  EmergencyCard,
  EmergencyCardInsert,
  EmergencyCardUpdate,
  UserWithRestrictions,
  FamilyMemberWithRestrictions,
  ProductWithSafetyInfo,
  RestrictionSeverity,
  RestrictionType,
  SafetyLevel,
  AccountType,
  RestaurantSafetyCategory,
} from './types/database.types'

// Authentication context and hooks
export { AuthProvider, useAuth, useRequireAuth } from './contexts/AuthContext'
export type { default as AuthContext } from './contexts/AuthContext'

// Navigation components and types
export { RootNavigator } from './navigation/RootNavigator'
export { AuthNavigator } from './navigation/AuthNavigator'
export { MainNavigator } from './navigation/MainNavigator'
export type * from './types/navigation.types'

// UI Components
export { LoadingScreen } from './components/LoadingScreen'
export { PlaceholderScreen } from './components/PlaceholderScreen'

// Screen Components
export { WelcomeScreen } from './screens/auth/WelcomeScreen'
export { LoginScreen } from './screens/auth/LoginScreen'
export { RegisterScreen } from './screens/auth/RegisterScreen'
export { ForgotPasswordScreen } from './screens/auth/ForgotPasswordScreen'
export { OnboardingIntroScreen } from './screens/auth/OnboardingIntroScreen'
export { DashboardScreen } from './screens/main/DashboardScreen'
export { ScannerScreen } from './screens/main/ScannerScreen'

// Database services
export {
  userProfileService,
  familyMemberService,
  dietaryRestrictionsService,
  productService,
  productSafetyService,
  emergencyCardService,
  BaseService,
  UserProfileService,
  FamilyMemberService,
  DietaryRestrictionsService,
  ProductService,
  ProductSafetyService,
  EmergencyCardService,
} from './services/database'

// Hooks for UI components
export { default as useUserProfile, useUserRestrictions } from './hooks/useUserProfile'
export { default as useFamilyMembers, useFamilyMember } from './hooks/useFamilyMembers'
export { default as useProductSafety, useProductScanner } from './hooks/useProductSafety'
export { default as useEmergencyCards, useEmergencyCard } from './hooks/useEmergencyCards'

// Error handling utilities
export {
  ErrorHandler,
  errorHandler,
  handleSupabaseError,
  handleSafetyCriticalError,
  handleNetworkError,
  handleValidationError,
  handleAuthError,
  useErrorHandler,
  isSafetyCriticalError,
  getUserFriendlyMessage,
  ErrorType,
  ErrorSeverity,
} from './utils/errorHandling'
export type { AppError } from './utils/errorHandling'

/**
 * Hook return types for better TypeScript support
 */
// Re-export hooks (types are internal to each hook)
// Note: hooks are already exported above as defaults

/**
 * SAFETY GUIDELINES FOR DEVELOPERS:
 * 
 * 1. ALWAYS validate user inputs, especially for life-threatening restrictions
 * 2. Use proper error handling for all database operations
 * 3. Never hard-delete safety-critical data - use soft deletes (is_active: false)
 * 4. Log all safety-critical operations for audit trails
 * 5. Implement proper backup and recovery mechanisms
 * 6. Test thoroughly with edge cases and error scenarios
 * 7. Follow principle of least privilege for data access
 * 8. Encrypt sensitive medical information
 * 9. Implement proper session management and timeouts
 * 10. Regular security audits and penetration testing
 */

/**
 * USAGE EXAMPLES:
 * 
 * Basic setup in App.tsx:
 * ```tsx
 * import { AuthProvider } from './src'
 * 
 * export default function App() {
 *   return (
 *     <AuthProvider>
 *       <YourAppContent />
 *     </AuthProvider>
 *   )
 * }
 * ```
 * 
 * Using hooks in components:
 * ```tsx
 * import { useAuth, useUserProfile, useProductSafety } from './src'
 * 
 * function ProfileScreen() {
 *   const { user, signOut } = useAuth()
 *   const { userProfile, addRestriction } = useUserProfile()
 *   const { scanProduct, getSafetyLevel } = useProductSafety()
 *   
 *   // Component implementation...
 * }
 * ```
 * 
 * Handling safety-critical operations:
 * ```tsx
 * import { handleSafetyCriticalError, useEmergencyCards } from './src'
 * 
 * function EmergencyCardScreen() {
 *   const { createEmergencyCard, hasLifeThreateningCards } = useEmergencyCards()
 *   
 *   const handleEmergencyCardCreation = async (cardData) => {
 *     try {
 *       await createEmergencyCard(cardData)
 *     } catch (error) {
 *       handleSafetyCriticalError(
 *         'Failed to create emergency card for life-threatening allergy',
 *         { cardData, userId: user?.id },
 *         error
 *       )
 *     }
 *   }
 * }
 * ```
 */