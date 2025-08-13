/**
 * Alternative Product Service - Suggests safer alternatives for unsafe products
 * 
 * SAFETY CRITICAL: Provides alternative product recommendations for users
 * with dietary restrictions when a scanned product is unsafe
 */

import { productService } from './database'
import { Product, SafetyLevel } from '../types/database.types'
import { SupabaseResponse } from '../lib/supabase'

export interface AlternativeProduct {
  product: Product
  safetyLevel: SafetyLevel
  matchScore: number // How well it matches the original product
  availabilityScore: number // How available/common the product is
  reasonSafer: string[]
}

export interface AlternativeSearchOptions {
  maxResults: number
  minSafetyLevel: SafetyLevel
  preferSameBrand: boolean
  preferSameCategory: boolean
  includeGeneric: boolean
}

class AlternativeProductService {
  private static instance: AlternativeProductService
  private readonly defaultOptions: AlternativeSearchOptions = {
    maxResults: 5,
    minSafetyLevel: 'caution',
    preferSameBrand: true,
    preferSameCategory: true,
    includeGeneric: true,
  }

  private constructor() {}

  static getInstance(): AlternativeProductService {
    if (!AlternativeProductService.instance) {
      AlternativeProductService.instance = new AlternativeProductService()
    }
    return AlternativeProductService.instance
  }

  /**
   * Find alternative products for an unsafe product
   */
  async findAlternatives(
    unsafeProduct: Product,
    userRestrictions: string[],
    options: Partial<AlternativeSearchOptions> = {}
  ): Promise<AlternativeProduct[]> {
    const opts = { ...this.defaultOptions, ...options }

    try {
      // Get potential alternatives based on category and type
      const candidates = await this.getCandidateProducts(unsafeProduct, opts)
      
      // Score and filter alternatives
      const scoredAlternatives = await Promise.all(
        candidates.map(candidate => this.scoreAlternative(candidate, unsafeProduct, userRestrictions))
      )

      // Filter by safety level and sort by match score
      const safeAlternatives = scoredAlternatives
        .filter(alt => this.isSafetyLevelAcceptable(alt.safetyLevel, opts.minSafetyLevel))
        .sort((a, b) => {
          // Sort by safety level first (safer = better), then by match score
          const safetyPriority = this.getSafetyPriority(b.safetyLevel) - this.getSafetyPriority(a.safetyLevel)
          if (safetyPriority !== 0) return safetyPriority
          return b.matchScore - a.matchScore
        })
        .slice(0, opts.maxResults)

      return safeAlternatives
    } catch (error) {
      console.error('Failed to find alternative products:', error)
      return []
    }
  }

  /**
   * Get candidate products that could be alternatives
   */
  private async getCandidateProducts(
    originalProduct: Product,
    options: AlternativeSearchOptions
  ): Promise<Product[]> {
    const candidates: Product[] = []

    try {
      // Search by same category
      if (originalProduct.category && options.preferSameCategory) {
        const categoryResponse = await productService.findMany({
          category: originalProduct.category,
          is_active: true,
        })
        
        if (categoryResponse.data) {
          candidates.push(...categoryResponse.data.filter(p => p.id !== originalProduct.id))
        }
      }

      // Search by same brand if preferred
      if (originalProduct.brand && options.preferSameBrand) {
        const brandResponse = await productService.findMany({
          brand: originalProduct.brand,
          is_active: true,
        })
        
        if (brandResponse.data) {
          candidates.push(...brandResponse.data.filter(p => p.id !== originalProduct.id))
        }
      }

      // Search by similar names (keyword matching)
      if (originalProduct.name) {
        const keywords = this.extractKeywords(originalProduct.name)
        const nameSearchResults = await Promise.all(
          keywords.map(keyword => productService.searchProducts(keyword, 10))
        )
        
        nameSearchResults.forEach(response => {
          if (response.data) {
            candidates.push(...response.data.filter(p => p.id !== originalProduct.id))
          }
        })
      }

      // Include generic/store brand alternatives if enabled
      if (options.includeGeneric) {
        const genericAlternatives = await this.findGenericAlternatives(originalProduct)
        candidates.push(...genericAlternatives)
      }

      // Remove duplicates
      const uniqueCandidates = candidates.filter((product, index, self) =>
        index === self.findIndex(p => p.id === product.id)
      )

      return uniqueCandidates.slice(0, 50) // Limit to prevent overwhelming the scoring process
    } catch (error) {
      console.error('Failed to get candidate products:', error)
      return []
    }
  }

  /**
   * Score how well an alternative matches the original product
   */
  private async scoreAlternative(
    candidate: Product,
    original: Product,
    userRestrictions: string[]
  ): Promise<AlternativeProduct> {
    let matchScore = 0
    let availabilityScore = candidate.verification_count || 0
    const reasonsSafer: string[] = []
    
    // Mock safety level calculation (in real app, this would use the safety assessment service)
    const safetyLevel = this.mockCalculateSafetyLevel(candidate, userRestrictions, reasonsSafer)

    // Category match bonus
    if (candidate.category === original.category) {
      matchScore += 30
    }

    // Brand match bonus
    if (candidate.brand === original.brand) {
      matchScore += 20
    } else if (candidate.brand && this.isSimilarBrand(candidate.brand, original.brand)) {
      matchScore += 10
    }

    // Name similarity bonus
    const nameSimilarity = this.calculateNameSimilarity(candidate.name, original.name)
    matchScore += nameSimilarity * 25

    // Package size similarity
    if (candidate.package_size && original.package_size) {
      const sizeSimilarity = this.calculateSizeSimilarity(candidate.package_size, original.package_size)
      matchScore += sizeSimilarity * 15
    }

    // Ingredients improvement (mock calculation)
    const ingredientScore = this.mockCalculateIngredientImprovement(candidate, original, reasonsSafer)
    matchScore += ingredientScore

    // Availability bonus based on verification count
    availabilityScore = Math.min(100, (candidate.verification_count || 0) * 2)

    return {
      product: candidate,
      safetyLevel,
      matchScore: Math.round(matchScore),
      availabilityScore,
      reasonSafer,
    }
  }

  /**
   * Mock safety level calculation (placeholder for real implementation)
   */
  private mockCalculateSafetyLevel(
    product: Product,
    userRestrictions: string[],
    reasonsSafer: string[]
  ): SafetyLevel {
    // This is a simplified mock implementation
    // In a real app, this would use the actual safety assessment service
    
    const allergenWarnings = product.allergen_warnings || []
    const ingredients = product.ingredients_list?.toLowerCase() || ''

    // Check for common allergens
    const hasNuts = allergenWarnings.some(warning => 
      warning.toLowerCase().includes('nut') || 
      warning.toLowerCase().includes('peanut')
    )
    
    const hasGluten = ingredients.includes('wheat') || 
                     ingredients.includes('gluten') || 
                     allergenWarnings.some(warning => warning.toLowerCase().includes('gluten'))
    
    const hasDairy = ingredients.includes('milk') || 
                     ingredients.includes('dairy') || 
                     allergenWarnings.some(warning => warning.toLowerCase().includes('milk'))

    // Simplified safety assessment
    if (hasNuts && userRestrictions.includes('nut_allergy')) {
      return 'danger'
    }
    
    if (hasGluten && userRestrictions.includes('celiac_disease')) {
      return 'warning'
    }
    
    if (hasDairy && userRestrictions.includes('lactose_intolerance')) {
      return 'caution'
    }

    // Add reasons why it's safer
    if (!hasNuts) reasonsSafer.push('Nut-free')
    if (!hasGluten) reasonsSafer.push('Gluten-free')
    if (!hasDairy) reasonsSafer.push('Dairy-free')

    return 'safe'
  }

  /**
   * Extract meaningful keywords from product name
   */
  private extractKeywords(productName: string): string[] {
    const name = productName.toLowerCase()
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
    
    return name
      .split(/[\s\-_.,]+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .slice(0, 5) // Limit to top 5 keywords
  }

  /**
   * Find generic/store brand alternatives
   */
  private async findGenericAlternatives(originalProduct: Product): Promise<Product[]> {
    if (!originalProduct.category) return []

    try {
      const response = await productService.searchProducts(`generic ${originalProduct.category}`, 5)
      return response.data || []
    } catch (error) {
      console.error('Failed to find generic alternatives:', error)
      return []
    }
  }

  /**
   * Check if two brands are similar (e.g., different spellings, subsidiaries)
   */
  private isSimilarBrand(brand1: string | null, brand2: string | null): boolean {
    if (!brand1 || !brand2) return false
    
    const normalize = (brand: string) => brand.toLowerCase().replace(/[^a-z0-9]/g, '')
    const normalized1 = normalize(brand1)
    const normalized2 = normalize(brand2)
    
    // Check for partial matches or common brand relationships
    return normalized1.includes(normalized2) || 
           normalized2.includes(normalized1) ||
           this.calculateStringSimilarity(normalized1, normalized2) > 0.7
  }

  /**
   * Calculate name similarity between two products
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9\s]/g, '')
    return this.calculateStringSimilarity(normalize(name1), normalize(name2))
  }

  /**
   * Calculate string similarity using a simple algorithm
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(/\s+/)
    const words2 = str2.split(/\s+/)
    
    let matches = 0
    words1.forEach(word1 => {
      if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
        matches++
      }
    })
    
    return matches / Math.max(words1.length, words2.length)
  }

  /**
   * Calculate package size similarity
   */
  private calculateSizeSimilarity(size1: string, size2: string): number {
    // Simple similarity check - in reality, this would parse units and normalize
    const normalize = (size: string) => size.toLowerCase().replace(/[^a-z0-9.]/g, '')
    return this.calculateStringSimilarity(normalize(size1), normalize(size2))
  }

  /**
   * Mock ingredient improvement calculation
   */
  private mockCalculateIngredientImprovement(
    candidate: Product,
    original: Product,
    reasonsSafer: string[]
  ): number {
    let score = 0
    
    // Simplified comparison - in real app, this would do ingredient-by-ingredient analysis
    const candidateIngredients = candidate.ingredients_list?.toLowerCase() || ''
    const originalIngredients = original.ingredients_list?.toLowerCase() || ''
    
    // Check for removal of common problem ingredients
    if (originalIngredients.includes('artificial') && !candidateIngredients.includes('artificial')) {
      score += 10
      reasonsSafer.push('No artificial ingredients')
    }
    
    if (originalIngredients.includes('preservative') && !candidateIngredients.includes('preservative')) {
      score += 8
      reasonsSafer.push('No preservatives')
    }
    
    if (originalIngredients.includes('high fructose') && !candidateIngredients.includes('high fructose')) {
      score += 12
      reasonsSafer.push('No high fructose corn syrup')
    }
    
    return score
  }

  /**
   * Check if safety level is acceptable based on minimum requirements
   */
  private isSafetyLevelAcceptable(level: SafetyLevel, minLevel: SafetyLevel): boolean {
    const levelPriority = this.getSafetyPriority(level)
    const minPriority = this.getSafetyPriority(minLevel)
    return levelPriority >= minPriority
  }

  /**
   * Get numerical priority for safety levels (higher = safer)
   */
  private getSafetyPriority(level: SafetyLevel): number {
    switch (level) {
      case 'safe': return 4
      case 'caution': return 3
      case 'warning': return 2
      case 'danger': return 1
      default: return 0
    }
  }

  /**
   * Get formatted alternative suggestions for UI display
   */
  formatAlternativesForDisplay(alternatives: AlternativeProduct[]): {
    title: string
    subtitle: string
    safetyBadge: SafetyLevel
    reasons: string[]
  }[] {
    return alternatives.map(alt => ({
      title: alt.product.name,
      subtitle: alt.product.brand ? `by ${alt.product.brand}` : 'Generic brand',
      safetyBadge: alt.safetyLevel,
      reasons: alt.reasonSafer,
    }))
  }
}

export default AlternativeProductService.getInstance()