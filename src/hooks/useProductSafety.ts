/**
 * Product Safety Assessment Hooks
 * 
 * SAFETY CRITICAL: These hooks handle product scanning and safety assessment
 * for life-threatening dietary restrictions and allergies
 */

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUserRestrictions } from './useUserProfile'
import {
  productService,
  productSafetyService,
} from '../services/database'
import {
  Product,
  ProductInsert,
  ProductWithSafetyInfo,
  ProductSafetyAssessment,
  SafetyLevel,
  UserRestriction,
  DietaryRestriction,
} from '../types/database.types'

interface UseProductSafetyReturn {
  // State
  currentProduct: ProductWithSafetyInfo | null
  safetyAssessment: ProductSafetyAssessment | null
  loading: boolean
  error: string | null
  scanHistory: Product[]

  // Product operations
  scanProduct: (barcode: string) => Promise<Product | null>
  addProduct: (productData: ProductInsert) => Promise<Product | null>
  searchProducts: (query: string) => Promise<Product[]>
  
  // Safety assessment
  assessProductSafety: (productId: string, userId?: string, familyMemberId?: string) => Promise<ProductSafetyAssessment | null>
  getSafetyLevel: () => SafetyLevel | null
  getSafetyColor: () => string
  getSafetyMessage: () => string
  getRiskFactors: () => any[]
  
  // Safety helpers
  isSafeForUser: boolean
  hasWarnings: boolean
  hasDangers: boolean
  criticalIngredients: string[]
  
  // History management
  clearHistory: () => void
  removeFromHistory: (productId: string) => void
}

export const useProductSafety = (): UseProductSafetyReturn => {
  const { user } = useAuth()
  const { restrictions, hasEmergencyRestrictions } = useUserRestrictions()
  
  const [currentProduct, setCurrentProduct] = useState<ProductWithSafetyInfo | null>(null)
  const [safetyAssessment, setSafetyAssessment] = useState<ProductSafetyAssessment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanHistory, setScanHistory] = useState<Product[]>([])

  const setLoadingState = useCallback((isLoading: boolean) => {
    setLoading(isLoading)
    if (isLoading) {
      setError(null)
    }
  }, [])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setLoading(false)
    console.error('Product safety error:', errorMessage)
  }, [])

  const scanProduct = useCallback(async (barcode: string): Promise<Product | null> => {
    if (!barcode || barcode.trim().length === 0) {
      handleError('Invalid barcode')
      return null
    }

    setLoadingState(true)
    try {
      // First, try to find existing product
      const response = await productService.findByBarcode(barcode)
      
      if (response.error && !response.error.message.includes('No rows returned')) {
        handleError(response.error.message)
        return null
      }

      let product = response.data

      if (!product) {
        // Product not found - could integrate with external APIs here
        handleError('Product not found in database. Please add product information manually.')
        return null
      }

      // Add to scan history
      setScanHistory(prev => {
        const filtered = prev.filter(p => p.id !== product!.id)
        return [product!, ...filtered].slice(0, 10) // Keep last 10 scans
      })

      // Get detailed product information with safety assessment
      if (user?.id) {
        await loadProductWithSafety(product.id, user.id)
      }

      return product
    } catch (error) {
      handleError('Failed to scan product')
      return null
    } finally {
      setLoading(false)
    }
  }, [user?.id, setLoadingState, handleError])

  const loadProductWithSafety = useCallback(async (
    productId: string, 
    userId?: string, 
    familyMemberId?: string
  ) => {
    try {
      const response = await productService.getProductWithSafetyInfo(
        productId, 
        userId, 
        familyMemberId
      )
      
      if (response.error) {
        console.warn('Failed to load product safety info:', response.error.message)
        return
      }

      if (response.data) {
        setCurrentProduct(response.data)
        
        // Get or create safety assessment
        if (userId || familyMemberId) {
          const assessment = await assessProductSafety(productId, userId, familyMemberId)
          setSafetyAssessment(assessment)
        }
      }
    } catch (error) {
      console.warn('Error loading product safety info:', error)
    }
  }, [])

  const addProduct = useCallback(async (productData: ProductInsert): Promise<Product | null> => {
    setLoadingState(true)
    try {
      const response = await productService.createOrUpdateProduct(productData)
      
      if (response.error) {
        handleError(response.error.message)
        return null
      }

      const product = response.data
      if (product) {
        // Add to scan history
        setScanHistory(prev => {
          const filtered = prev.filter(p => p.id !== product.id)
          return [product, ...filtered].slice(0, 10)
        })

        // Load with safety assessment if user is logged in
        if (user?.id) {
          await loadProductWithSafety(product.id, user.id)
        }
      }

      return product
    } catch (error) {
      handleError('Failed to add product')
      return null
    } finally {
      setLoading(false)
    }
  }, [user?.id, setLoadingState, handleError, loadProductWithSafety])

  const searchProducts = useCallback(async (query: string): Promise<Product[]> => {
    if (!query || query.trim().length < 2) {
      return []
    }

    try {
      const response = await productService.searchProducts(query)
      
      if (response.error) {
        console.warn('Failed to search products:', response.error.message)
        return []
      }

      return response.data || []
    } catch (error) {
      console.warn('Error searching products:', error)
      return []
    }
  }, [])

  const assessProductSafety = useCallback(async (
    productId: string,
    userId?: string,
    familyMemberId?: string
  ): Promise<ProductSafetyAssessment | null> => {
    try {
      // Check if assessment already exists
      const existingAssessment = currentProduct?.safety_assessment
      if (existingAssessment) {
        return existingAssessment
      }

      // Create new safety assessment
      const response = await productSafetyService.createSafetyAssessment(
        productId,
        userId,
        familyMemberId,
        restrictions
      )
      
      if (response.error) {
        console.warn('Failed to create safety assessment:', response.error.message)
        return null
      }

      return response.data
    } catch (error) {
      console.warn('Error assessing product safety:', error)
      return null
    }
  }, [currentProduct?.safety_assessment, restrictions])

  const getSafetyLevel = useCallback((): SafetyLevel | null => {
    return safetyAssessment?.overall_safety_level || null
  }, [safetyAssessment])

  const getSafetyColor = useCallback((): string => {
    const safetyLevel = getSafetyLevel()
    switch (safetyLevel) {
      case 'safe':
        return '#10B981' // Green
      case 'caution':
        return '#F59E0B' // Yellow
      case 'warning':
        return '#F97316' // Orange
      case 'danger':
        return '#EF4444' // Red
      default:
        return '#6B7280' // Gray
    }
  }, [getSafetyLevel])

  const getSafetyMessage = useCallback((): string => {
    const safetyLevel = getSafetyLevel()
    const dangerousCount = safetyAssessment?.dangerous_ingredients_count || 0
    const warningCount = safetyAssessment?.warning_ingredients_count || 0
    
    switch (safetyLevel) {
      case 'safe':
        return 'This product appears safe for your dietary restrictions.'
      case 'caution':
        return 'Use caution - this product may contain ingredients to watch.'
      case 'warning':
        return `Warning - this product contains ${warningCount} ingredient(s) that may cause reactions.`
      case 'danger':
        return `DANGER - this product contains ${dangerousCount} ingredient(s) that could cause severe reactions. DO NOT CONSUME.`
      default:
        return 'Safety assessment not available.'
    }
  }, [getSafetyLevel, safetyAssessment])

  const getRiskFactors = useCallback((): any[] => {
    const riskFactors = safetyAssessment?.risk_factors
    if (riskFactors && typeof riskFactors === 'object' && 'risks' in riskFactors) {
      return (riskFactors as any).risks || []
    }
    return []
  }, [safetyAssessment])

  const clearHistory = useCallback(() => {
    setScanHistory([])
  }, [])

  const removeFromHistory = useCallback((productId: string) => {
    setScanHistory(prev => prev.filter(p => p.id !== productId))
  }, [])

  // Safety analysis helpers
  const safetyLevel = getSafetyLevel()
  const isSafeForUser = safetyLevel === 'safe'
  const hasWarnings = safetyLevel === 'caution' || safetyLevel === 'warning'
  const hasDangers = safetyLevel === 'danger'
  
  const criticalIngredients = getRiskFactors()
    .filter(risk => risk.risk_level === 'danger')
    .map(risk => risk.ingredient_name)

  // Auto-assess safety when product or restrictions change
  useEffect(() => {
    if (currentProduct && user?.id && restrictions.length > 0) {
      assessProductSafety(currentProduct.id, user.id)
        .then(assessment => {
          if (assessment) {
            setSafetyAssessment(assessment)
          }
        })
    }
  }, [currentProduct, user?.id, restrictions, assessProductSafety])

  return {
    // State
    currentProduct,
    safetyAssessment,
    loading,
    error,
    scanHistory,

    // Operations
    scanProduct,
    addProduct,
    searchProducts,
    assessProductSafety,
    getSafetyLevel,
    getSafetyColor,
    getSafetyMessage,
    getRiskFactors,

    // Safety helpers
    isSafeForUser,
    hasWarnings,
    hasDangers,
    criticalIngredients,

    // History
    clearHistory,
    removeFromHistory,
  }
}

/**
 * Hook for managing product scanning with camera integration
 */
export const useProductScanner = () => {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  
  const { scanProduct } = useProductSafety()

  const startScanning = useCallback(() => {
    setIsScanning(true)
    setScanError(null)
    setScannedBarcode(null)
  }, [])

  const stopScanning = useCallback(() => {
    setIsScanning(false)
    setScanError(null)
  }, [])

  const handleBarcodeScanned = useCallback(async (barcode: string) => {
    setScannedBarcode(barcode)
    setIsScanning(false)
    
    try {
      const product = await scanProduct(barcode)
      if (!product) {
        setScanError('Product not found')
      }
    } catch (error) {
      setScanError('Failed to process barcode')
    }
  }, [scanProduct])

  const handleScanError = useCallback((error: string) => {
    setScanError(error)
    setIsScanning(false)
  }, [])

  const resetScanner = useCallback(() => {
    setScannedBarcode(null)
    setScanError(null)
    setIsScanning(false)
  }, [])

  return {
    isScanning,
    scannedBarcode,
    scanError,
    startScanning,
    stopScanning,
    handleBarcodeScanned,
    handleScanError,
    resetScanner,
  }
}

export default useProductSafety