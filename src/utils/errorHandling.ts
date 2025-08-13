/**
 * Comprehensive Error Handling Utilities
 * 
 * SAFETY CRITICAL: Robust error handling for life-threatening allergy management
 * Ensures graceful degradation and proper error reporting for safety-critical operations
 */

import { SupabaseError } from '../lib/supabase'

/**
 * Standard error types for the application
 */
export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  SAFETY_CRITICAL = 'SAFETY_CRITICAL',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Application error interface
 */
export interface AppError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  details?: string
  code?: string
  timestamp: string
  userId?: string
  context?: Record<string, any>
  originalError?: any
}

/**
 * Error handler class for consistent error processing
 */
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorLog: AppError[] = []

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Create a standardized error from various error sources
   */
  createError(
    type: ErrorType,
    severity: ErrorSeverity,
    message: string,
    options?: {
      details?: string
      code?: string
      userId?: string
      context?: Record<string, any>
      originalError?: any
    }
  ): AppError {
    const error: AppError = {
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
      ...options,
    }

    this.logError(error)
    return error
  }

  /**
   * Handle Supabase errors with proper categorization
   */
  handleSupabaseError(
    supabaseError: SupabaseError,
    context?: Record<string, any>
  ): AppError {
    let errorType = ErrorType.DATABASE
    let severity = ErrorSeverity.MEDIUM

    // Categorize Supabase errors
    if (supabaseError.code) {
      switch (supabaseError.code) {
        case 'PGRST301':
        case 'PGRST116':
          errorType = ErrorType.AUTHENTICATION
          severity = ErrorSeverity.HIGH
          break
        case 'PGRST204':
          errorType = ErrorType.AUTHORIZATION
          severity = ErrorSeverity.HIGH
          break
        case '23505': // Unique violation
        case '23503': // Foreign key violation
          errorType = ErrorType.VALIDATION
          severity = ErrorSeverity.MEDIUM
          break
        case 'ECONNREFUSED':
        case 'ENOTFOUND':
          errorType = ErrorType.NETWORK
          severity = ErrorSeverity.HIGH
          break
        default:
          errorType = ErrorType.DATABASE
          severity = ErrorSeverity.MEDIUM
      }
    }

    return this.createError(
      errorType,
      severity,
      supabaseError.message,
      {
        details: supabaseError.details,
        code: supabaseError.code,
        context,
        originalError: supabaseError,
      }
    )
  }

  /**
   * Handle safety-critical errors (life-threatening situations)
   */
  handleSafetyCriticalError(
    message: string,
    context?: Record<string, any>,
    originalError?: any
  ): AppError {
    const error = this.createError(
      ErrorType.SAFETY_CRITICAL,
      ErrorSeverity.CRITICAL,
      message,
      {
        context: {
          ...context,
          isSafetyCritical: true,
          requiresImmediateAttention: true,
        },
        originalError,
      }
    )

    // For safety-critical errors, we might want to:
    // 1. Send immediate notifications
    // 2. Log to external monitoring services
    // 3. Trigger fallback mechanisms
    this.handleCriticalError(error)

    return error
  }

  /**
   * Handle network errors with retry logic consideration
   */
  handleNetworkError(
    message: string,
    context?: Record<string, any>,
    originalError?: any
  ): AppError {
    return this.createError(
      ErrorType.NETWORK,
      ErrorSeverity.HIGH,
      message,
      {
        details: 'Network connection failed. Please check your internet connection and try again.',
        context: {
          ...context,
          suggestRetry: true,
        },
        originalError,
      }
    )
  }

  /**
   * Handle validation errors
   */
  handleValidationError(
    message: string,
    fieldErrors?: Record<string, string>,
    context?: Record<string, any>
  ): AppError {
    return this.createError(
      ErrorType.VALIDATION,
      ErrorSeverity.LOW,
      message,
      {
        context: {
          ...context,
          fieldErrors,
        },
      }
    )
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(
    message: string,
    context?: Record<string, any>,
    originalError?: any
  ): AppError {
    return this.createError(
      ErrorType.AUTHENTICATION,
      ErrorSeverity.HIGH,
      message,
      {
        context: {
          ...context,
          requiresLogin: true,
        },
        originalError,
      }
    )
  }

  /**
   * Log error to internal storage and external services
   */
  private logError(error: AppError): void {
    // Add to internal log
    this.errorLog.push(error)
    
    // Keep only last 100 errors in memory
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100)
    }

    // Console logging based on severity
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🚨 CRITICAL ERROR:', error)
        break
      case ErrorSeverity.HIGH:
        console.error('❌ HIGH SEVERITY ERROR:', error)
        break
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️ MEDIUM SEVERITY ERROR:', error)
        break
      case ErrorSeverity.LOW:
        console.info('ℹ️ LOW SEVERITY ERROR:', error)
        break
    }

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(error)
    }
  }

  /**
   * Handle critical errors that require immediate attention
   */
  private handleCriticalError(error: AppError): void {
    // In a real app, this would:
    // 1. Send push notifications to emergency contacts
    // 2. Log to high-priority monitoring systems
    // 3. Trigger fallback safety mechanisms
    // 4. Store locally for offline access
    
    console.error('🚨 SAFETY CRITICAL ERROR - IMMEDIATE ATTENTION REQUIRED:', error)
    
    // Store critical errors locally for offline access
    this.storeCriticalErrorLocally(error)
  }

  /**
   * Send error to external error tracking service
   */
  private sendToErrorService(error: AppError): void {
    // Implementation would integrate with services like:
    // - Sentry
    // - Bugsnag
    // - LogRocket
    // - Custom logging endpoint
    
    console.log('Sending error to tracking service:', error.type, error.message)
  }

  /**
   * Store critical errors locally for offline access
   */
  private storeCriticalErrorLocally(error: AppError): void {
    try {
      // In React Native, use AsyncStorage
      // For now, just console log
      console.log('Storing critical error locally:', error)
    } catch (storageError) {
      console.error('Failed to store critical error locally:', storageError)
    }
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit: number = 10): AppError[] {
    return this.errorLog.slice(-limit)
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
    return this.errorLog.filter(error => error.severity === severity)
  }

  /**
   * Clear error log
   */
  clearErrors(): void {
    this.errorLog = []
  }
}

/**
 * Convenience functions for common error handling scenarios
 */
export const errorHandler = ErrorHandler.getInstance()

export const handleSupabaseError = (error: SupabaseError, context?: Record<string, any>) => 
  errorHandler.handleSupabaseError(error, context)

export const handleSafetyCriticalError = (message: string, context?: Record<string, any>, originalError?: any) => 
  errorHandler.handleSafetyCriticalError(message, context, originalError)

export const handleNetworkError = (message: string, context?: Record<string, any>, originalError?: any) => 
  errorHandler.handleNetworkError(message, context, originalError)

export const handleValidationError = (message: string, fieldErrors?: Record<string, string>, context?: Record<string, any>) => 
  errorHandler.handleValidationError(message, fieldErrors, context)

export const handleAuthError = (message: string, context?: Record<string, any>, originalError?: any) => 
  errorHandler.handleAuthError(message, context, originalError)

/**
 * React hook for error handling in components
 */
export const useErrorHandler = () => {
  const handleError = (error: any, context?: Record<string, any>) => {
    if (error && typeof error === 'object') {
      if (error.message) {
        // Supabase error
        return handleSupabaseError(error, context)
      } else if (error.code === 'NETWORK_ERROR') {
        return handleNetworkError(error.message || 'Network error occurred', context, error)
      }
    }

    // Generic error
    return errorHandler.createError(
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      typeof error === 'string' ? error : 'An unexpected error occurred',
      { context, originalError: error }
    )
  }

  return {
    handleError,
    handleSafetyCriticalError,
    handleNetworkError,
    handleValidationError,
    handleAuthError,
    getRecentErrors: () => errorHandler.getRecentErrors(),
    clearErrors: () => errorHandler.clearErrors(),
  }
}

/**
 * Utility to check if an error is safety-critical
 */
export const isSafetyCriticalError = (error: AppError): boolean => {
  return error.type === ErrorType.SAFETY_CRITICAL || error.severity === ErrorSeverity.CRITICAL
}

/**
 * Utility to get user-friendly error messages
 */
export const getUserFriendlyMessage = (error: AppError): string => {
  switch (error.type) {
    case ErrorType.AUTHENTICATION:
      return 'Please sign in to continue.'
    case ErrorType.AUTHORIZATION:
      return 'You do not have permission to perform this action.'
    case ErrorType.NETWORK:
      return 'Network connection failed. Please check your internet connection and try again.'
    case ErrorType.VALIDATION:
      return error.message || 'Please check your input and try again.'
    case ErrorType.SAFETY_CRITICAL:
      return `SAFETY ALERT: ${error.message} Please seek immediate assistance if needed.`
    case ErrorType.DATABASE:
      return 'A database error occurred. Please try again later.'
    default:
      return error.message || 'An unexpected error occurred. Please try again.'
  }
}

export default ErrorHandler