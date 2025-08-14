/**
 * Offline Service - Manages offline capabilities for essential products
 * 
 * SAFETY CRITICAL: Ensures key product safety information is available
 * even when network connectivity is unavailable
 */

import { Storage } from '../utils/storage'
import { Product, ProductSafetyAssessment, SafetyLevel } from '../types/database.types'

export interface OfflineProduct extends Product {
  safetyAssessment?: ProductSafetyAssessment
  lastUpdated: string
}

export interface OfflineCache {
  products: Record<string, OfflineProduct> // barcode -> product
  userRestrictions: string[]
  lastSync: string
  version: number
}

class OfflineService {
  private static instance: OfflineService
  private readonly CACHE_KEY = '@restrictedDietApp/offlineCache'
  private readonly CACHE_VERSION = 1
  private readonly MAX_CACHE_AGE_DAYS = 30
  private readonly MAX_CACHED_PRODUCTS = 100

  private cache: OfflineCache | null = null

  private constructor() {}

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService()
    }
    return OfflineService.instance
  }

  /**
   * Initialize offline cache
   */
  async initialize(): Promise<void> {
    try {
      await this.loadCache()
      await this.cleanupExpiredItems()
    } catch (error) {
      console.error('Failed to initialize offline service:', error)
      await this.resetCache()
    }
  }

  /**
   * Add product to offline cache
   */
  async cacheProduct(product: Product, safetyAssessment?: ProductSafetyAssessment): Promise<void> {
    try {
      await this.ensureCacheLoaded()
      
      if (!this.cache) return

      const offlineProduct: OfflineProduct = {
        ...product,
        safetyAssessment,
        lastUpdated: new Date().toISOString(),
      }

      this.cache.products[product.barcode] = offlineProduct

      // Cleanup if cache is getting too large
      await this.enforceMaxCacheSize()
      await this.saveCache()

      console.log(`Cached product: ${product.name} (${product.barcode})`)
    } catch (error) {
      console.error('Failed to cache product:', error)
    }
  }

  /**
   * Get product from offline cache
   */
  async getCachedProduct(barcode: string): Promise<OfflineProduct | null> {
    try {
      await this.ensureCacheLoaded()
      
      if (!this.cache) return null

      const product = this.cache.products[barcode]
      
      if (!product) return null

      // Check if cached product is too old
      const lastUpdated = new Date(product.lastUpdated)
      const maxAge = this.MAX_CACHE_AGE_DAYS * 24 * 60 * 60 * 1000
      
      if (Date.now() - lastUpdated.getTime() > maxAge) {
        await this.removeCachedProduct(barcode)
        return null
      }

      return product
    } catch (error) {
      console.error('Failed to get cached product:', error)
      return null
    }
  }

  /**
   * Remove product from cache
   */
  async removeCachedProduct(barcode: string): Promise<void> {
    try {
      await this.ensureCacheLoaded()
      
      if (!this.cache) return

      delete this.cache.products[barcode]
      await this.saveCache()
    } catch (error) {
      console.error('Failed to remove cached product:', error)
    }
  }

  /**
   * Get all cached products
   */
  async getAllCachedProducts(): Promise<OfflineProduct[]> {
    try {
      await this.ensureCacheLoaded()
      
      if (!this.cache) return []

      return Object.values(this.cache.products)
    } catch (error) {
      console.error('Failed to get all cached products:', error)
      return []
    }
  }

  /**
   * Search cached products
   */
  async searchCachedProducts(query: string): Promise<OfflineProduct[]> {
    try {
      const allProducts = await this.getAllCachedProducts()
      const lowerQuery = query.toLowerCase()

      return allProducts.filter(product =>
        product.name.toLowerCase().includes(lowerQuery) ||
        product.brand?.toLowerCase().includes(lowerQuery) ||
        product.barcode.includes(query)
      )
    } catch (error) {
      console.error('Failed to search cached products:', error)
      return []
    }
  }

  /**
   * Cache user restrictions for offline safety assessment
   */
  async cacheUserRestrictions(restrictions: string[]): Promise<void> {
    try {
      await this.ensureCacheLoaded()
      
      if (!this.cache) return

      this.cache.userRestrictions = restrictions
      this.cache.lastSync = new Date().toISOString()
      
      await this.saveCache()
    } catch (error) {
      console.error('Failed to cache user restrictions:', error)
    }
  }

  /**
   * Get cached user restrictions
   */
  async getCachedUserRestrictions(): Promise<string[]> {
    try {
      await this.ensureCacheLoaded()
      
      if (!this.cache) return []

      return this.cache.userRestrictions || []
    } catch (error) {
      console.error('Failed to get cached user restrictions:', error)
      return []
    }
  }

  /**
   * Perform basic offline safety assessment
   */
  async performOfflineSafetyAssessment(
    product: OfflineProduct,
    userRestrictions?: string[]
  ): Promise<{ safetyLevel: SafetyLevel; warnings: string[] }> {
    try {
      const restrictions = userRestrictions || await this.getCachedUserRestrictions()
      
      // Use cached assessment if available
      if (product.safetyAssessment) {
        return {
          safetyLevel: product.safetyAssessment.overall_safety_level,
          warnings: this.extractWarningsFromAssessment(product.safetyAssessment),
        }
      }

      // Perform basic offline assessment
      return this.basicSafetyAssessment(product, restrictions)
    } catch (error) {
      console.error('Failed to perform offline safety assessment:', error)
      return {
        safetyLevel: 'caution',
        warnings: ['Unable to assess safety offline. Please check connection.'],
      }
    }
  }

  /**
   * Basic safety assessment using simple rules
   */
  private basicSafetyAssessment(
    product: OfflineProduct,
    userRestrictions: string[]
  ): { safetyLevel: SafetyLevel; warnings: string[] } {
    const warnings: string[] = []
    let safetyLevel: SafetyLevel = 'safe'

    const ingredients = product.ingredients_list?.toLowerCase() || ''
    const allergens = product.allergen_warnings || []

    // Check for common allergens
    if (userRestrictions.includes('nut_allergy')) {
      const hasNuts = allergens.some(allergen =>
        allergen.toLowerCase().includes('nut') ||
        allergen.toLowerCase().includes('peanut')
      ) || ingredients.includes('peanut') || ingredients.includes('almond') || 
          ingredients.includes('cashew') || ingredients.includes('walnut')

      if (hasNuts) {
        safetyLevel = 'danger'
        warnings.push('Contains nuts - severe allergy risk')
      }
    }

    if (userRestrictions.includes('gluten_sensitivity')) {
      const hasGluten = ingredients.includes('wheat') || 
                       ingredients.includes('gluten') ||
                       allergens.some(allergen => allergen.toLowerCase().includes('gluten'))

      if (hasGluten) {
        if (safetyLevel === 'safe') safetyLevel = 'warning'
        warnings.push('Contains gluten')
      }
    }

    if (userRestrictions.includes('lactose_intolerance')) {
      const hasLactose = ingredients.includes('milk') ||
                        ingredients.includes('dairy') ||
                        ingredients.includes('lactose') ||
                        allergens.some(allergen => allergen.toLowerCase().includes('milk'))

      if (hasLactose) {
        if (safetyLevel === 'safe') safetyLevel = 'caution'
        warnings.push('Contains dairy/lactose')
      }
    }

    return { safetyLevel, warnings }
  }

  /**
   * Extract warnings from cached assessment
   */
  private extractWarningsFromAssessment(assessment: ProductSafetyAssessment): string[] {
    const warnings: string[] = []

    if (assessment.dangerous_ingredients_count > 0) {
      warnings.push(`${assessment.dangerous_ingredients_count} dangerous ingredient(s) found`)
    }

    if (assessment.warning_ingredients_count > 0) {
      warnings.push(`${assessment.warning_ingredients_count} ingredient(s) may cause reactions`)
    }

    // Extract risk factors if available
    if (assessment.risk_factors && typeof assessment.risk_factors === 'object') {
      const riskFactors = (assessment.risk_factors as any).risks || []
      riskFactors.forEach((risk: any) => {
        if (risk.risk_level === 'danger' || risk.risk_level === 'warning') {
          warnings.push(`${risk.ingredient_name}: ${risk.risk_level}`)
        }
      })
    }

    return warnings
  }

  /**
   * Load cache from storage
   */
  private async loadCache(): Promise<void> {
    try {
      const cacheData = await Storage.getItem(this.CACHE_KEY)
      
      if (cacheData) {
        this.cache = JSON.parse(cacheData)
        
        // Handle version migrations
        if (!this.cache || this.cache.version !== this.CACHE_VERSION) {
          await this.resetCache()
        }
      } else {
        await this.resetCache()
      }
    } catch (error) {
      console.error('Failed to load cache:', error)
      await this.resetCache()
    }
  }

  /**
   * Save cache to storage
   */
  private async saveCache(): Promise<void> {
    try {
      if (!this.cache) return

      const cacheData = JSON.stringify(this.cache)
      await Storage.setItem(this.CACHE_KEY, cacheData)
    } catch (error) {
      console.error('Failed to save cache:', error)
    }
  }

  /**
   * Reset cache to default state
   */
  private async resetCache(): Promise<void> {
    this.cache = {
      products: {},
      userRestrictions: [],
      lastSync: new Date().toISOString(),
      version: this.CACHE_VERSION,
    }
    
    await this.saveCache()
  }

  /**
   * Ensure cache is loaded
   */
  private async ensureCacheLoaded(): Promise<void> {
    if (!this.cache) {
      await this.loadCache()
    }
  }

  /**
   * Clean up expired cache items
   */
  private async cleanupExpiredItems(): Promise<void> {
    if (!this.cache) return

    const maxAge = this.MAX_CACHE_AGE_DAYS * 24 * 60 * 60 * 1000
    const now = Date.now()
    let cleaned = false

    for (const [barcode, product] of Object.entries(this.cache.products)) {
      const lastUpdated = new Date(product.lastUpdated)
      if (now - lastUpdated.getTime() > maxAge) {
        delete this.cache.products[barcode]
        cleaned = true
      }
    }

    if (cleaned) {
      await this.saveCache()
    }
  }

  /**
   * Enforce maximum cache size
   */
  private async enforceMaxCacheSize(): Promise<void> {
    if (!this.cache) return

    const productCount = Object.keys(this.cache.products).length
    
    if (productCount <= this.MAX_CACHED_PRODUCTS) return

    // Remove oldest products
    const products = Object.entries(this.cache.products)
    products.sort((a, b) => 
      new Date(a[1].lastUpdated).getTime() - new Date(b[1].lastUpdated).getTime()
    )

    const toRemove = productCount - this.MAX_CACHED_PRODUCTS
    for (let i = 0; i < toRemove; i++) {
      delete this.cache.products[products[i][0]]
    }

    await this.saveCache()
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    productCount: number
    lastSync: string
    cacheSize: string
  }> {
    try {
      await this.ensureCacheLoaded()
      
      if (!this.cache) {
        return { productCount: 0, lastSync: 'Never', cacheSize: '0 KB' }
      }

      const productCount = Object.keys(this.cache.products).length
      const cacheData = JSON.stringify(this.cache)
      const cacheSize = `${Math.round(cacheData.length / 1024)} KB`

      return {
        productCount,
        lastSync: this.cache.lastSync,
        cacheSize,
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error)
      return { productCount: 0, lastSync: 'Error', cacheSize: '0 KB' }
    }
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    try {
      await Storage.removeItem(this.CACHE_KEY)
      this.cache = null
      console.log('Offline cache cleared')
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }
}

export default OfflineService.getInstance()