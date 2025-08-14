/**
 * Scan History Hook - Manages product scan history and favorites
 * 
 * SAFETY CRITICAL: Provides quick access to previously scanned products
 * and user's favorite safe products for emergency situations
 */

import { useState, useCallback, useEffect } from 'react'
import { Storage } from '../utils/storage'
import { Product, ProductSafetyAssessment, SafetyLevel } from '../types/database.types'
import { useAuth } from '../contexts/AuthContext'
import offlineService from '../services/offlineService'

export interface ScanHistoryItem {
  product: Product
  safetyAssessment?: ProductSafetyAssessment
  scannedAt: string
  safetyLevel?: SafetyLevel
  isFavorite: boolean
}

export interface ScanHistoryOptions {
  maxHistoryItems: number
  maxFavorites: number
  autoSaveOffline: boolean
}

export interface UseScanHistory {
  // History state
  history: ScanHistoryItem[]
  favorites: ScanHistoryItem[]
  loading: boolean
  error: string | null

  // History operations
  addToHistory: (product: Product, safetyAssessment?: ProductSafetyAssessment) => Promise<void>
  removeFromHistory: (productId: string) => Promise<void>
  clearHistory: () => Promise<void>
  
  // Favorites operations
  addToFavorites: (product: Product, safetyAssessment?: ProductSafetyAssessment) => Promise<void>
  removeFromFavorites: (productId: string) => Promise<void>
  toggleFavorite: (productId: string) => Promise<void>
  
  // Utilities
  getHistoryItem: (productId: string) => ScanHistoryItem | null
  isInHistory: (productId: string) => boolean
  isFavorite: (productId: string) => boolean
  searchHistory: (query: string) => ScanHistoryItem[]
  getRecentSafeProducts: (limit?: number) => ScanHistoryItem[]
  
  // Statistics
  getHistoryStats: () => {
    totalScans: number
    safeProducts: number
    dangerousProducts: number
    favoriteCount: number
  }
}

export const useScanHistory = (options: Partial<ScanHistoryOptions> = {}): UseScanHistory => {
  const { user } = useAuth()
  
  const opts: ScanHistoryOptions = {
    maxHistoryItems: 100,
    maxFavorites: 50,
    autoSaveOffline: true,
    ...options,
  }

  const [history, setHistory] = useState<ScanHistoryItem[]>([])
  const [favorites, setFavorites] = useState<ScanHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const HISTORY_KEY = `@scanHistory_${user?.id || 'guest'}`
  const FAVORITES_KEY = `@favorites_${user?.id || 'guest'}`

  // Load data on mount and user change
  useEffect(() => {
    loadData()
  }, [user?.id])

  const setErrorState = useCallback((errorMessage: string | null) => {
    setError(errorMessage)
    if (errorMessage) {
      console.error('Scan history error:', errorMessage)
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setErrorState(null)

    try {
      const [historyData, favoritesData] = await Promise.all([
        Storage.getItem(HISTORY_KEY),
        Storage.getItem(FAVORITES_KEY),
      ])

      const parsedHistory = historyData ? JSON.parse(historyData) : []
      const parsedFavorites = favoritesData ? JSON.parse(favoritesData) : []

      setHistory(parsedHistory)
      setFavorites(parsedFavorites)
    } catch (error) {
      console.error('Failed to load scan history:', error)
      setErrorState('Failed to load scan history')
    } finally {
      setLoading(false)
    }
  }, [HISTORY_KEY, FAVORITES_KEY, setErrorState])

  const saveHistory = useCallback(async (newHistory: ScanHistoryItem[]) => {
    try {
      await Storage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
      
      // Auto-save to offline cache if enabled
      if (opts.autoSaveOffline) {
        for (const item of newHistory.slice(0, 10)) { // Cache most recent 10
          await offlineService.cacheProduct(item.product, item.safetyAssessment)
        }
      }
    } catch (error) {
      console.error('Failed to save history:', error)
      setErrorState('Failed to save history')
    }
  }, [HISTORY_KEY, opts.autoSaveOffline, setErrorState])

  const saveFavorites = useCallback(async (newFavorites: ScanHistoryItem[]) => {
    try {
      await Storage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites))
      
      // Cache all favorites for offline access
      if (opts.autoSaveOffline) {
        for (const item of newFavorites) {
          await offlineService.cacheProduct(item.product, item.safetyAssessment)
        }
      }
    } catch (error) {
      console.error('Failed to save favorites:', error)
      setErrorState('Failed to save favorites')
    }
  }, [FAVORITES_KEY, opts.autoSaveOffline, setErrorState])

  const addToHistory = useCallback(async (
    product: Product,
    safetyAssessment?: ProductSafetyAssessment
  ) => {
    try {
      const existingIndex = history.findIndex(item => item.product.id === product.id)
      const now = new Date().toISOString()
      
      const historyItem: ScanHistoryItem = {
        product,
        safetyAssessment,
        scannedAt: now,
        safetyLevel: safetyAssessment?.overall_safety_level,
        isFavorite: favorites.some(fav => fav.product.id === product.id),
      }

      let newHistory: ScanHistoryItem[]
      
      if (existingIndex >= 0) {
        // Update existing item and move to front
        newHistory = [historyItem, ...history.filter((_, index) => index !== existingIndex)]
      } else {
        // Add new item to front
        newHistory = [historyItem, ...history]
      }

      // Enforce max history size
      if (newHistory.length > opts.maxHistoryItems) {
        newHistory = newHistory.slice(0, opts.maxHistoryItems)
      }

      setHistory(newHistory)
      await saveHistory(newHistory)
    } catch (error) {
      console.error('Failed to add to history:', error)
      setErrorState('Failed to add to history')
    }
  }, [history, favorites, opts.maxHistoryItems, saveHistory, setErrorState])

  const removeFromHistory = useCallback(async (productId: string) => {
    try {
      const newHistory = history.filter(item => item.product.id !== productId)
      setHistory(newHistory)
      await saveHistory(newHistory)
    } catch (error) {
      console.error('Failed to remove from history:', error)
      setErrorState('Failed to remove from history')
    }
  }, [history, saveHistory, setErrorState])

  const clearHistory = useCallback(async () => {
    try {
      setHistory([])
      await Storage.removeItem(HISTORY_KEY)
    } catch (error) {
      console.error('Failed to clear history:', error)
      setErrorState('Failed to clear history')
    }
  }, [HISTORY_KEY, setErrorState])

  const addToFavorites = useCallback(async (
    product: Product,
    safetyAssessment?: ProductSafetyAssessment
  ) => {
    try {
      // Check if already in favorites
      if (favorites.some(fav => fav.product.id === product.id)) {
        return
      }

      const favoriteItem: ScanHistoryItem = {
        product,
        safetyAssessment,
        scannedAt: new Date().toISOString(),
        safetyLevel: safetyAssessment?.overall_safety_level,
        isFavorite: true,
      }

      let newFavorites = [favoriteItem, ...favorites]

      // Enforce max favorites size
      if (newFavorites.length > opts.maxFavorites) {
        newFavorites = newFavorites.slice(0, opts.maxFavorites)
      }

      setFavorites(newFavorites)
      await saveFavorites(newFavorites)

      // Update history to reflect favorite status
      const newHistory = history.map(item =>
        item.product.id === product.id ? { ...item, isFavorite: true } : item
      )
      setHistory(newHistory)
      await saveHistory(newHistory)
    } catch (error) {
      console.error('Failed to add to favorites:', error)
      setErrorState('Failed to add to favorites')
    }
  }, [favorites, history, opts.maxFavorites, saveFavorites, saveHistory, setErrorState])

  const removeFromFavorites = useCallback(async (productId: string) => {
    try {
      const newFavorites = favorites.filter(item => item.product.id !== productId)
      setFavorites(newFavorites)
      await saveFavorites(newFavorites)

      // Update history to reflect favorite status
      const newHistory = history.map(item =>
        item.product.id === productId ? { ...item, isFavorite: false } : item
      )
      setHistory(newHistory)
      await saveHistory(newHistory)
    } catch (error) {
      console.error('Failed to remove from favorites:', error)
      setErrorState('Failed to remove from favorites')
    }
  }, [favorites, history, saveFavorites, saveHistory, setErrorState])

  const toggleFavorite = useCallback(async (productId: string) => {
    const historyItem = history.find(item => item.product.id === productId)
    
    if (!historyItem) {
      setErrorState('Product not found in history')
      return
    }

    if (historyItem.isFavorite) {
      await removeFromFavorites(productId)
    } else {
      await addToFavorites(historyItem.product, historyItem.safetyAssessment)
    }
  }, [history, addToFavorites, removeFromFavorites, setErrorState])

  const getHistoryItem = useCallback((productId: string): ScanHistoryItem | null => {
    return history.find(item => item.product.id === productId) || null
  }, [history])

  const isInHistory = useCallback((productId: string): boolean => {
    return history.some(item => item.product.id === productId)
  }, [history])

  const isFavorite = useCallback((productId: string): boolean => {
    return favorites.some(item => item.product.id === productId)
  }, [favorites])

  const searchHistory = useCallback((query: string): ScanHistoryItem[] => {
    const lowerQuery = query.toLowerCase()
    
    return history.filter(item =>
      item.product.name.toLowerCase().includes(lowerQuery) ||
      item.product.brand?.toLowerCase().includes(lowerQuery) ||
      item.product.barcode.includes(query) ||
      item.product.category?.toLowerCase().includes(lowerQuery)
    )
  }, [history])

  const getRecentSafeProducts = useCallback((limit = 10): ScanHistoryItem[] => {
    return history
      .filter(item => item.safetyLevel === 'safe')
      .slice(0, limit)
  }, [history])

  const getHistoryStats = useCallback(() => {
    const totalScans = history.length
    const safeProducts = history.filter(item => item.safetyLevel === 'safe').length
    const dangerousProducts = history.filter(item => 
      item.safetyLevel === 'danger' || item.safetyLevel === 'warning'
    ).length
    const favoriteCount = favorites.length

    return {
      totalScans,
      safeProducts,
      dangerousProducts,
      favoriteCount,
    }
  }, [history, favorites])

  return {
    // State
    history,
    favorites,
    loading,
    error,

    // History operations
    addToHistory,
    removeFromHistory,
    clearHistory,

    // Favorites operations
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,

    // Utilities
    getHistoryItem,
    isInHistory,
    isFavorite,
    searchHistory,
    getRecentSafeProducts,

    // Statistics
    getHistoryStats,
  }
}