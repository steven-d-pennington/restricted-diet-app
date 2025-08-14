/**
 * Product Lookup Service - Handles product data retrieval with fallbacks
 * 
 * SAFETY CRITICAL: Provides reliable product information lookup for safety assessments
 * Integrates local database, external APIs, and user-contributed data
 */

import { productService } from './database'
import { Product, ProductInsert } from '../types/database.types'
import { SupabaseResponse } from '../lib/supabase'

export interface ExternalProductData {
  barcode: string
  name: string
  brand?: string
  manufacturer?: string
  category?: string
  ingredients_list?: string
  allergen_warnings?: string[]
  nutrition_facts?: any
  package_size?: string
  country_of_origin?: string
  product_images?: string[]
  data_source: string
  data_quality_score: number
}

export interface ProductLookupResult {
  product: Product | null
  source: 'local' | 'external' | 'user'
  isNewProduct: boolean
  needsVerification: boolean
  confidence: number
}

export interface ProductLookupOptions {
  includeExternalAPIs: boolean
  allowUserContribution: boolean
  minConfidenceScore: number
  maxCacheAge: number // in minutes
}

class ProductLookupService {
  private static instance: ProductLookupService
  private cache: Map<string, { data: ExternalProductData; timestamp: number }> = new Map()
  private readonly defaultOptions: ProductLookupOptions = {
    includeExternalAPIs: true,
    allowUserContribution: true,
    minConfidenceScore: 60,
    maxCacheAge: 60, // 1 hour
  }

  private constructor() {}

  static getInstance(): ProductLookupService {
    if (!ProductLookupService.instance) {
      ProductLookupService.instance = new ProductLookupService()
    }
    return ProductLookupService.instance
  }

  /**
   * Primary product lookup method with comprehensive fallback strategy
   */
  async lookupProduct(
    barcode: string, 
    options: Partial<ProductLookupOptions> = {}
  ): Promise<ProductLookupResult> {
    const opts = { ...this.defaultOptions, ...options }
    
    try {
      // Step 1: Try local database first
      const localResult = await this.lookupInLocalDatabase(barcode)
      if (localResult.product && localResult.confidence >= opts.minConfidenceScore) {
        return localResult
      }

      // Step 2: Try external APIs if enabled
      if (opts.includeExternalAPIs) {
        const externalResult = await this.lookupInExternalAPIs(barcode, opts)
        if (externalResult.product && externalResult.confidence >= opts.minConfidenceScore) {
          // Store in local database for future use
          await this.storeProductInDatabase(externalResult.product, 'external')
          return externalResult
        }
      }

      // Step 3: Return local result if external failed but local exists
      if (localResult.product) {
        return {
          ...localResult,
          needsVerification: true,
        }
      }

      // Step 4: No product found
      return {
        product: null,
        source: 'local',
        isNewProduct: false,
        needsVerification: false,
        confidence: 0,
      }

    } catch (error) {
      console.error('Product lookup failed:', error)
      
      // Fallback to local database on error
      try {
        const fallbackResult = await this.lookupInLocalDatabase(barcode)
        return {
          ...fallbackResult,
          needsVerification: true,
        }
      } catch (fallbackError) {
        console.error('Fallback lookup failed:', fallbackError)
        throw new Error('Product lookup service unavailable')
      }
    }
  }

  /**
   * Lookup product in local Supabase database
   */
  private async lookupInLocalDatabase(barcode: string): Promise<ProductLookupResult> {
    try {
      const response = await productService.findByBarcode(barcode)
      
      if (response.data) {
        // Calculate confidence based on data completeness
        const confidence = this.calculateProductConfidence(response.data)
        
        return {
          product: response.data,
          source: 'local',
          isNewProduct: false,
          needsVerification: confidence < 80,
          confidence,
        }
      }

      return {
        product: null,
        source: 'local',
        isNewProduct: false,
        needsVerification: false,
        confidence: 0,
      }
    } catch (error) {
      console.error('Local database lookup failed:', error)
      throw error
    }
  }

  /**
   * Lookup product in external APIs with multiple providers
   */
  private async lookupInExternalAPIs(
    barcode: string, 
    options: ProductLookupOptions
  ): Promise<ProductLookupResult> {
    // Check cache first
    const cached = this.getCachedData(barcode)
    if (cached && this.isCacheValid(cached, options.maxCacheAge)) {
      const product = await this.convertExternalDataToProduct(cached.data)
      return {
        product,
        source: 'external',
        isNewProduct: true,
        needsVerification: false,
        confidence: cached.data.data_quality_score,
      }
    }

    // Try multiple external APIs in order of preference
    const providers = [
      'OpenFoodFacts',
      'UPCDatabase',
      'Barcode Monster',
    ]

    for (const provider of providers) {
      try {
        const externalData = await this.fetchFromProvider(provider, barcode)
        if (externalData && externalData.data_quality_score >= options.minConfidenceScore) {
          // Cache the result
          this.setCachedData(barcode, externalData)
          
          const product = await this.convertExternalDataToProduct(externalData)
          return {
            product,
            source: 'external',
            isNewProduct: true,
            needsVerification: externalData.data_quality_score < 80,
            confidence: externalData.data_quality_score,
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${provider}:`, error)
        // Continue to next provider
      }
    }

    return {
      product: null,
      source: 'external',
      isNewProduct: false,
      needsVerification: false,
      confidence: 0,
    }
  }

  /**
   * Fetch product data from specific external provider
   */
  private async fetchFromProvider(provider: string, barcode: string): Promise<ExternalProductData | null> {
    switch (provider) {
      case 'OpenFoodFacts':
        return this.fetchFromOpenFoodFacts(barcode)
      case 'UPCDatabase':
        return this.fetchFromUPCDatabase(barcode)
      case 'Barcode Monster':
        return this.fetchFromBarcodeMonster(barcode)
      default:
        throw new Error(`Unknown provider: ${provider}`)
    }
  }

  /**
   * Fetch from Open Food Facts API
   */
  private async fetchFromOpenFoodFacts(barcode: string): Promise<ExternalProductData | null> {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.status === 0) {
        return null // Product not found
      }

      const product = data.product

      return {
        barcode,
        name: product.product_name || product.generic_name || 'Unknown Product',
        brand: product.brands,
        manufacturer: product.manufacturing_places,
        category: product.categories,
        ingredients_list: product.ingredients_text,
        allergen_warnings: product.allergens_tags?.map((tag: string) => 
          tag.replace('en:', '').replace(/-/g, ' ')
        ),
        nutrition_facts: product.nutriments,
        package_size: product.quantity,
        country_of_origin: product.countries,
        product_images: product.image_url ? [product.image_url] : [],
        data_source: 'OpenFoodFacts',
        data_quality_score: Math.min(100, Math.round(
          (product.completeness || 0) * 100 + 
          (product.ingredients_text ? 20 : 0) + 
          (product.allergens_tags?.length > 0 ? 10 : 0)
        )),
      }
    } catch (error) {
      console.error('OpenFoodFacts API error:', error)
      throw error
    }
  }

  /**
   * Fetch from UPC Database API (fallback)
   */
  private async fetchFromUPCDatabase(barcode: string): Promise<ExternalProductData | null> {
    try {
      // This is a placeholder for UPC Database integration
      // In a real implementation, you would integrate with their API
      console.log(`UPCDatabase lookup for ${barcode} - not implemented`)
      return null
    } catch (error) {
      console.error('UPCDatabase API error:', error)
      throw error
    }
  }

  /**
   * Fetch from Barcode Monster API (fallback)
   */
  private async fetchFromBarcodeMonster(barcode: string): Promise<ExternalProductData | null> {
    try {
      // This is a placeholder for Barcode Monster integration
      // In a real implementation, you would integrate with their API
      console.log(`BarcodeMonster lookup for ${barcode} - not implemented`)
      return null
    } catch (error) {
      console.error('BarcodeMonster API error:', error)
      throw error
    }
  }

  /**
   * Convert external API data to Product format
   */
  private async convertExternalDataToProduct(externalData: ExternalProductData): Promise<Product> {
    const productData: ProductInsert = {
      barcode: externalData.barcode,
      name: externalData.name,
      brand: externalData.brand || null,
      manufacturer: externalData.manufacturer || null,
      category: externalData.category || null,
      ingredients_list: externalData.ingredients_list || null,
      allergen_warnings: externalData.allergen_warnings || null,
      nutrition_facts: externalData.nutrition_facts || null,
      package_size: externalData.package_size || null,
      country_of_origin: externalData.country_of_origin || null,
      product_images: externalData.product_images || null,
      data_source: externalData.data_source,
      data_quality_score: externalData.data_quality_score,
      last_verified_date: new Date().toISOString(),
      verification_count: 0,
      is_active: true,
    }

    // This would be stored in database, but for now return a mock product
  return {
      id: `temp-${Date.now()}`,
      ...productData,
      subcategory: null,
      description: null,
      serving_size: null,
      manufacturing_date: null,
      expiration_date: null,
      certification_labels: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
  } as Product
  }

  /**
   * Store product in local database
   */
  private async storeProductInDatabase(product: Product, source: string): Promise<void> {
    try {
      const productData: ProductInsert = {
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        manufacturer: product.manufacturer,
        category: product.category,
        subcategory: product.subcategory,
        description: product.description,
        ingredients_list: product.ingredients_list,
        allergen_warnings: product.allergen_warnings,
        nutrition_facts: product.nutrition_facts,
        package_size: product.package_size,
        serving_size: product.serving_size,
        country_of_origin: product.country_of_origin,
        manufacturing_date: product.manufacturing_date,
        expiration_date: product.expiration_date,
        certification_labels: product.certification_labels,
        product_images: product.product_images,
        data_source: source,
        data_quality_score: product.data_quality_score,
        last_verified_date: new Date().toISOString(),
        verification_count: 0,
        is_active: true,
      }

      await productService.createOrUpdateProduct(productData)
    } catch (error) {
      console.error('Failed to store product in database:', error)
      // Don't throw error - this is not critical
    }
  }

  /**
   * Calculate product data confidence score
   */
  private calculateProductConfidence(product: Product): number {
    let score = 0

    // Basic information (40 points)
    if (product.name && product.name.trim().length > 0) score += 20
    if (product.brand) score += 10
    if (product.category) score += 10

    // Ingredient information (30 points)
    if (product.ingredients_list && product.ingredients_list.trim().length > 0) score += 20
    if (product.allergen_warnings && product.allergen_warnings.length > 0) score += 10

    // Additional details (20 points)
    if (product.nutrition_facts) score += 5
    if (product.manufacturer) score += 5
    if (product.country_of_origin) score += 5
    if (product.package_size) score += 5

    // Verification and quality (10 points)
    if (product.verification_count > 0) score += 5
    if (product.data_quality_score > 70) score += 5

    return Math.min(100, score)
  }

  /**
   * Cache management methods
   */
  private getCachedData(barcode: string): { data: ExternalProductData; timestamp: number } | null {
    return this.cache.get(barcode) || null
  }

  private setCachedData(barcode: string, data: ExternalProductData): void {
    this.cache.set(barcode, {
      data,
      timestamp: Date.now(),
    })

    // Clean old cache entries (keep only last 100)
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value as string | undefined
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }
  }

  private isCacheValid(cached: { data: ExternalProductData; timestamp: number }, maxAgeMinutes: number): boolean {
    const ageInMinutes = (Date.now() - cached.timestamp) / (1000 * 60)
    return ageInMinutes < maxAgeMinutes
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    }
  }
}

export default ProductLookupService.getInstance()