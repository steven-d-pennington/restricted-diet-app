/**
 * Platform-Universal Storage Utility
 * 
 * Provides consistent storage interface across web and native platforms
 * Uses AsyncStorage on native platforms and localStorage on web
 */

import { Platform } from 'react-native'
import { PlatformUtils, WebFallbacks } from './platformUtils'

// Import AsyncStorage only on native platforms
let AsyncStorage: any = null
if (PlatformUtils.isNative) {
  try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default
  } catch (error) {
    console.warn('AsyncStorage not available:', error)
  }
}

export interface StorageInterface {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
  clear(): Promise<void>
  getAllKeys?(): Promise<string[]>
}

class UniversalStorage implements StorageInterface {
  async getItem(key: string): Promise<string | null> {
    if (PlatformUtils.isWeb) {
      return WebFallbacks.storage.getItem(key)
    }
    
    if (AsyncStorage) {
      try {
        return await AsyncStorage.getItem(key)
      } catch (error) {
        console.warn('AsyncStorage.getItem failed:', error)
        return null
      }
    }
    
    throw new Error('Storage not available on this platform')
  }

  async setItem(key: string, value: string): Promise<void> {
    if (PlatformUtils.isWeb) {
      return WebFallbacks.storage.setItem(key, value)
    }
    
    if (AsyncStorage) {
      try {
        return await AsyncStorage.setItem(key, value)
      } catch (error) {
        console.warn('AsyncStorage.setItem failed:', error)
        throw error
      }
    }
    
    throw new Error('Storage not available on this platform')
  }

  async removeItem(key: string): Promise<void> {
    if (PlatformUtils.isWeb) {
      return WebFallbacks.storage.removeItem(key)
    }
    
    if (AsyncStorage) {
      try {
        return await AsyncStorage.removeItem(key)
      } catch (error) {
        console.warn('AsyncStorage.removeItem failed:', error)
        throw error
      }
    }
    
    throw new Error('Storage not available on this platform')
  }

  async clear(): Promise<void> {
    if (PlatformUtils.isWeb) {
      return WebFallbacks.storage.clear()
    }
    
    if (AsyncStorage) {
      try {
        return await AsyncStorage.clear()
      } catch (error) {
        console.warn('AsyncStorage.clear failed:', error)
        throw error
      }
    }
    
    throw new Error('Storage not available on this platform')
  }

  async getAllKeys(): Promise<string[]> {
    if (PlatformUtils.isWeb) {
      try {
        const keys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key) keys.push(key)
        }
        return keys
      } catch (error) {
        console.warn('localStorage key enumeration failed:', error)
        return []
      }
    }
    
    if (AsyncStorage) {
      try {
        return await AsyncStorage.getAllKeys()
      } catch (error) {
        console.warn('AsyncStorage.getAllKeys failed:', error)
        return []
      }
    }
    
    throw new Error('Storage not available on this platform')
  }

  // Convenience methods for JSON storage
  async getObject<T>(key: string): Promise<T | null> {
    try {
      const value = await this.getItem(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.warn('Failed to parse stored object:', error)
      return null
    }
  }

  async setObject<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      return await this.setItem(key, serialized)
    } catch (error) {
      console.warn('Failed to serialize object for storage:', error)
      throw error
    }
  }
}

// Export singleton instance
export const Storage = new UniversalStorage()
export default Storage