/**
 * Platform Compatibility Utilities
 * 
 * Provides platform-specific utilities and fallbacks for native modules
 * Ensures consistent behavior across web, iOS, and Android platforms
 */

import React from 'react'
import { Platform } from 'react-native'

/**
 * Platform detection utilities
 */
export const PlatformUtils = {
  isWeb: Platform.OS === 'web',
  isNative: Platform.OS !== 'web',
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
}

/**
 * Safe import wrapper for native-only modules
 * Returns null on web platform to prevent import errors
 */
export function safeImport<T>(importFn: () => T): T | null {
  if (PlatformUtils.isWeb) {
    return null
  }
  
  try {
    return importFn()
  } catch (error) {
    console.warn('Failed to import native module:', error)
    return null
  }
}

/**
 * Platform-specific component wrapper
 * Renders different components based on platform
 */
interface PlatformSpecificProps<T = any> {
  web?: React.ComponentType<T> | React.ReactElement | null
  native?: React.ComponentType<T> | React.ReactElement | null
  ios?: React.ComponentType<T> | React.ReactElement | null
  android?: React.ComponentType<T> | React.ReactElement | null
  fallback?: React.ComponentType<T> | React.ReactElement | null
  props?: T
}

export function PlatformSpecific<T = any>({
  web,
  native,
  ios,
  android,
  fallback,
  props = {} as T
}: PlatformSpecificProps<T>) {
  let Component: React.ComponentType<T> | React.ReactElement | null = null

  switch (Platform.OS) {
    case 'web':
      Component = web ?? fallback ?? null
      break
    case 'ios':
      Component = ios ?? native ?? fallback ?? null
      break
    case 'android':
      Component = android ?? native ?? fallback ?? null
      break
    default:
      Component = native ?? fallback ?? null
  }

  if (!Component) {
    return null
  }

  // If it's a React element, return it directly
  if (React.isValidElement(Component)) {
    return Component
  }

  // If it's a component, render it with props
  if (typeof Component === 'function') {
    return React.createElement(Component, props)
  }

  return null
}

/**
 * Feature availability checks
 */
export const FeatureSupport = {
  camera: PlatformUtils.isNative && 'mediaDevices' in navigator,
  location: PlatformUtils.isNative || ('geolocation' in navigator),
  maps: PlatformUtils.isNative,
  barcode: PlatformUtils.isNative,
  fileSystem: PlatformUtils.isNative,
  sharing: PlatformUtils.isNative || ('share' in navigator),
  notifications: PlatformUtils.isNative || ('Notification' in window),
}

/**
 * Web fallback implementations
 */
export const WebFallbacks = {
  /**
   * File input fallback for camera on web
   */
  createFileInput: (options: {
    accept?: string
    capture?: boolean | string
    multiple?: boolean
    onChange?: (files: FileList | null) => void
  }) => {
    if (!PlatformUtils.isWeb) {
      throw new Error('createFileInput is only available on web platform')
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = options.accept || 'image/*'
    input.multiple = options.multiple || false
    
    if (options.capture) {
      input.setAttribute('capture', typeof options.capture === 'string' ? options.capture : 'environment')
    }
    
    if (options.onChange) {
      input.onchange = (event) => {
        const target = event.target as HTMLInputElement
        options.onChange(target.files)
      }
    }
    
    return input
  },

  /**
   * Web share API fallback
   */
  share: async (data: { title?: string; text?: string; url?: string }) => {
    if (!PlatformUtils.isWeb) {
      throw new Error('Web share is only available on web platform')
    }

    if ('share' in navigator) {
      try {
        await navigator.share(data)
        return true
      } catch (error) {
        console.warn('Web share failed:', error)
      }
    }

    // Fallback to clipboard or manual sharing
    const shareText = [data.title, data.text, data.url].filter(Boolean).join('\n\n')
    
    if ('clipboard' in navigator) {
      try {
        await navigator.clipboard.writeText(shareText)
        return true
      } catch (error) {
        console.warn('Clipboard write failed:', error)
      }
    }

    return false
  },

  /**
   * Local storage fallback for AsyncStorage
   */
  storage: {
    getItem: async (key: string): Promise<string | null> => {
      if (!PlatformUtils.isWeb) {
        throw new Error('Web storage is only available on web platform')
      }
      
      try {
        return localStorage.getItem(key)
      } catch (error) {
        console.warn('localStorage.getItem failed:', error)
        return null
      }
    },

    setItem: async (key: string, value: string): Promise<void> => {
      if (!PlatformUtils.isWeb) {
        throw new Error('Web storage is only available on web platform')
      }
      
      try {
        localStorage.setItem(key, value)
      } catch (error) {
        console.warn('localStorage.setItem failed:', error)
        throw error
      }
    },

    removeItem: async (key: string): Promise<void> => {
      if (!PlatformUtils.isWeb) {
        throw new Error('Web storage is only available on web platform')
      }
      
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn('localStorage.removeItem failed:', error)
        throw error
      }
    },

    clear: async (): Promise<void> => {
      if (!PlatformUtils.isWeb) {
        throw new Error('Web storage is only available on web platform')
      }
      
      try {
        localStorage.clear()
      } catch (error) {
        console.warn('localStorage.clear failed:', error)
        throw error
      }
    }
  }
}

/**
 * Platform-aware error handling
 */
export const PlatformError = {
  /**
   * Create platform-specific error messages
   */
  create: (
    webMessage: string,
    nativeMessage: string,
    fallback: string = 'Feature not available'
  ): Error => {
    const message = PlatformUtils.isWeb 
      ? webMessage 
      : PlatformUtils.isNative 
        ? nativeMessage 
        : fallback

    return new Error(message)
  },

  /**
   * Log platform-specific warnings
   */
  warn: (feature: string, error?: any) => {
    const platform = Platform.OS
    console.warn(`[${platform.toUpperCase()}] ${feature} not available:`, error)
  }
}

export default PlatformUtils