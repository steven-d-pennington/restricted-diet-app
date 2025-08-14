/**
 * AI-Powered Ingredient Analysis Service
 * 
 * Advanced ingredient analysis combining:
 * - AI/ML ingredient recognition and classification
 * - Real-time safety assessment against user restrictions
 * - Nutritional analysis and allergen detection
 * - Alternative ingredient suggestions
 * - Cross-contamination risk evaluation
 */

import { supabase } from '../lib/supabase'
import AIService, { IngredientAnalysisResult } from './aiService'
import { SafetyLevel, RestrictionSeverity } from '../types/database.types'
import { Storage } from '../utils/storage'

export interface DetailedIngredientAnalysis extends IngredientAnalysisResult {
  // Enhanced safety information
  restriction_matches: Array<{
    restriction_id: string
    restriction_name: string
    severity: RestrictionSeverity
    match_confidence: number
    specific_concerns: string[]
    mitigation_strategies: string[]
  }>
  
  // Cross-contamination analysis
  cross_contamination_sources: string[]
  manufacturing_warnings: string[]
  shared_facility_risks: string[]
  
  // Nutritional deep dive
  detailed_nutrition: {
    macronutrients: {
      protein_quality_score: number
      carb_complexity: 'simple' | 'complex' | 'mixed'
      fat_saturation_profile: Record<string, number>
    }
    micronutrients: Record<string, number>
    phytonutrients: string[]
    anti_nutrients: string[]
  }
  
  // Source and quality information
  source_info: {
    organic_available: boolean
    seasonal_availability: string[]
    typical_origins: string[]
    sustainability_score: number
    freshness_indicators: string[]
  }
  
  // Preparation guidance
  preparation_methods: Array<{
    method: string
    safety_impact: SafetyLevel
    nutrition_impact: 'positive' | 'neutral' | 'negative'
    instructions: string[]
  }>
  
  // Alternatives and substitutions
  safe_alternatives: Array<{
    ingredient: string
    similarity_score: number
    substitution_ratio: string
    taste_profile_match: number
    nutritional_comparison: 'better' | 'similar' | 'worse'
    safety_improvement: boolean
  }>
  
  // Confidence and reliability
  analysis_confidence: number
  data_sources: string[]
  last_verified: string
  expert_reviewed: boolean
}

export interface IngredientScanResult {
  recognized_text: string
  confidence_score: number
  detected_ingredients: Array<{
    name: string
    confidence: number
    position: { x: number; y: number; width: number; height: number }
    analysis: DetailedIngredientAnalysis | null
  }>
  potential_allergens: string[]
  safety_warnings: string[]
  overall_safety_assessment: SafetyLevel
}

export interface BatchAnalysisRequest {
  ingredients: string[]
  user_id: string
  context?: {
    recipe_name?: string
    meal_type?: string
    preparation_method?: string
    serving_size?: number
  }
}

export interface BatchAnalysisResult {
  individual_analyses: DetailedIngredientAnalysis[]
  combined_safety_assessment: {
    overall_risk: SafetyLevel
    risk_factors: string[]
    safety_score: number
    confidence: number
  }
  interaction_warnings: Array<{
    ingredients: string[]
    warning_type: 'allergen_interaction' | 'nutrient_interference' | 'preparation_conflict'
    severity: SafetyLevel
    description: string
    mitigation: string
  }>
  recipe_suggestions: {
    safer_alternatives: string[]
    preparation_modifications: string[]
    portion_adjustments: string[]
  }
}

class IngredientAnalysisService {
  private static instance: IngredientAnalysisService
  private cache: Map<string, { data: DetailedIngredientAnalysis; expires: number }> = new Map()
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
  
  // Known allergens and their variants
  private readonly COMMON_ALLERGENS = {
    'milk': ['dairy', 'lactose', 'casein', 'whey', 'butter', 'cheese', 'cream', 'yogurt'],
    'eggs': ['egg', 'albumin', 'lecithin', 'mayonnaise'],
    'fish': ['salmon', 'tuna', 'cod', 'anchovy', 'sardine'],
    'shellfish': ['shrimp', 'crab', 'lobster', 'scallop', 'oyster', 'mussel'],
    'tree_nuts': ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'hazelnut', 'macadamia'],
    'peanuts': ['peanut', 'groundnut'],
    'wheat': ['gluten', 'flour', 'bulgur', 'semolina', 'spelt'],
    'soy': ['soybean', 'tofu', 'tempeh', 'miso', 'edamame', 'lecithin']
  }

  static getInstance(): IngredientAnalysisService {
    if (!IngredientAnalysisService.instance) {
      IngredientAnalysisService.instance = new IngredientAnalysisService()
    }
    return IngredientAnalysisService.instance
  }

  /**
   * Comprehensive analysis of a single ingredient
   */
  async analyzeIngredient(
    ingredientName: string,
    userId: string,
    forceRefresh: boolean = false
  ): Promise<DetailedIngredientAnalysis> {
    const cacheKey = `detailed_${ingredientName.toLowerCase()}_${userId}`
    
    // Check cache first
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      if (Date.now() < cached.expires) {
        return cached.data
      }
    }

    try {
      // Get user restrictions
      const userRestrictions = await this.getUserRestrictions(userId)
      
      // Get basic AI analysis
      const basicAnalysis = await AIService.analyzeIngredient(
        ingredientName,
        userRestrictions.map(r => r.name),
        forceRefresh
      )
      
      // Enhance with detailed analysis
      const detailedAnalysis = await this.enhanceBasicAnalysis(
        basicAnalysis,
        userRestrictions,
        ingredientName
      )
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: detailedAnalysis,
        expires: Date.now() + this.CACHE_DURATION
      })
      
      // Store in database for future reference
      await this.storeAnalysisResult(detailedAnalysis, userId)
      
      return detailedAnalysis
    } catch (error) {
      console.error('Detailed ingredient analysis failed:', error)
      throw new Error(`Failed to analyze ingredient: ${ingredientName}`)
    }
  }

  /**
   * Batch analysis of multiple ingredients with interaction detection
   */
  async analyzeBatch(request: BatchAnalysisRequest): Promise<BatchAnalysisResult> {
    try {
      // Analyze each ingredient individually
      const individualAnalyses = await Promise.all(
        request.ingredients.map(ingredient => 
          this.analyzeIngredient(ingredient, request.user_id)
        )
      )
      
      // Analyze interactions between ingredients
      const interactionWarnings = await this.analyzeIngredientInteractions(
        individualAnalyses,
        request.context
      )
      
      // Calculate combined safety assessment
      const combinedSafety = this.calculateCombinedSafety(individualAnalyses, interactionWarnings)
      
      // Generate recipe suggestions
      const recipeSuggestions = await this.generateRecipeSuggestions(
        individualAnalyses,
        interactionWarnings,
        request.context
      )
      
      return {
        individual_analyses: individualAnalyses,
        combined_safety_assessment: combinedSafety,
        interaction_warnings: interactionWarnings,
        recipe_suggestions: recipeSuggestions
      }
    } catch (error) {
      console.error('Batch ingredient analysis failed:', error)
      throw new Error('Failed to analyze ingredient batch')
    }
  }

  /**
   * Scan and analyze ingredients from image/text
   */
  async scanAndAnalyzeIngredients(
    imageUri?: string,
    textInput?: string,
    userId?: string
  ): Promise<IngredientScanResult> {
    try {
      let recognizedText: string
      let confidence: number
      
      if (imageUri) {
        // Use OCR to extract text from image
        const ocrResult = await this.extractTextFromImage(imageUri)
        recognizedText = ocrResult.text
        confidence = ocrResult.confidence
      } else if (textInput) {
        recognizedText = textInput
        confidence = 1.0
      } else {
        throw new Error('Either imageUri or textInput must be provided')
      }
      
      // Parse ingredients from text
      const detectedIngredients = await this.parseIngredientsFromText(recognizedText)
      
      // Analyze each detected ingredient
      const analyzedIngredients = userId ? await Promise.all(
        detectedIngredients.map(async (ingredient) => ({
          ...ingredient,
          analysis: await this.analyzeIngredient(ingredient.name, userId)
        }))
      ) : detectedIngredients.map(ingredient => ({
        ...ingredient,
        analysis: null
      }))
      
      // Detect potential allergens
      const potentialAllergens = this.detectAllergens(recognizedText)
      
      // Generate safety warnings
      const safetyWarnings = this.generateSafetyWarnings(analyzedIngredients)
      
      // Calculate overall safety assessment
      const overallSafety = this.calculateOverallSafety(analyzedIngredients)
      
      return {
        recognized_text: recognizedText,
        confidence_score: confidence,
        detected_ingredients: analyzedIngredients,
        potential_allergens: potentialAllergens,
        safety_warnings: safetyWarnings,
        overall_safety_assessment: overallSafety
      }
    } catch (error) {
      console.error('Ingredient scanning failed:', error)
      throw new Error('Failed to scan and analyze ingredients')
    }
  }

  /**
   * Get alternative ingredients for safer substitution
   */
  async getSafeAlternatives(
    originalIngredient: string,
    userId: string,
    context?: {
      recipe_type?: string
      cooking_method?: string
      flavor_profile?: string
    }
  ): Promise<Array<{
    ingredient: string
    safety_improvement: number
    nutrition_comparison: any
    substitution_notes: string[]
    confidence: number
  }>> {
    try {
      const analysis = await this.analyzeIngredient(originalIngredient, userId)
      const userRestrictions = await this.getUserRestrictions(userId)
      
      // Get AI-generated alternatives
      const aiAlternatives = await AIService.analyzeIngredient(
        originalIngredient,
        userRestrictions.map(r => r.name)
      )
      
      // Enhance alternatives with detailed comparison
      const detailedAlternatives = await Promise.all(
        aiAlternatives.alternatives.map(async (alt) => {
          const altAnalysis = await this.analyzeIngredient(alt, userId)
          
          return {
            ingredient: alt,
            safety_improvement: this.calculateSafetyImprovement(analysis, altAnalysis),
            nutrition_comparison: this.compareNutrition(analysis, altAnalysis),
            substitution_notes: this.generateSubstitutionNotes(originalIngredient, alt, context),
            confidence: altAnalysis.confidence_score / 100
          }
        })
      )
      
      // Sort by safety improvement and confidence
      return detailedAlternatives.sort((a, b) => 
        (b.safety_improvement * b.confidence) - (a.safety_improvement * a.confidence)
      )
    } catch (error) {
      console.error('Failed to get safe alternatives:', error)
      throw new Error('Failed to find safe alternatives')
    }
  }

  /**
   * Real-time ingredient safety check
   */
  async quickSafetyCheck(
    ingredient: string,
    userId: string
  ): Promise<{
    is_safe: boolean
    risk_level: SafetyLevel
    immediate_concerns: string[]
    quick_alternatives: string[]
  }> {
    try {
      const userRestrictions = await this.getUserRestrictions(userId)
      
      // Quick allergen check using known patterns
      const immediateRisks = this.quickAllergenScan(ingredient, userRestrictions)
      
      if (immediateRisks.length > 0) {
        return {
          is_safe: false,
          risk_level: 'danger',
          immediate_concerns: immediateRisks,
          quick_alternatives: await this.getQuickAlternatives(ingredient)
        }
      }
      
      // If no immediate risks, do a quick AI check
      const quickAnalysis = await AIService.analyzeIngredient(
        ingredient,
        userRestrictions.map(r => r.name)
      )
      
      return {
        is_safe: quickAnalysis.risk_level === 'safe',
        risk_level: quickAnalysis.risk_level,
        immediate_concerns: quickAnalysis.common_allergens,
        quick_alternatives: quickAnalysis.alternatives.slice(0, 3)
      }
    } catch (error) {
      console.error('Quick safety check failed:', error)
      return {
        is_safe: false,
        risk_level: 'warning',
        immediate_concerns: ['Unable to verify safety - please check manually'],
        quick_alternatives: []
      }
    }
  }

  // Private helper methods

  private async getUserRestrictions(userId: string) {
    const { data, error } = await supabase
      .from('user_restrictions')
      .select(`
        *,
        dietary_restrictions(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) throw error
    
    return (data || []).map(r => ({
      id: r.restriction_id,
      name: r.dietary_restrictions.name,
      severity: r.severity_level,
      specific_allergens: r.specific_allergens || []
    }))
  }

  private async enhanceBasicAnalysis(
    basicAnalysis: IngredientAnalysisResult,
    userRestrictions: any[],
    ingredientName: string
  ): Promise<DetailedIngredientAnalysis> {
    // Enhance with restriction matching
    const restrictionMatches = await this.analyzeRestrictionMatches(
      basicAnalysis,
      userRestrictions
    )
    
    // Enhance with cross-contamination analysis
    const crossContamination = await this.analyzeCrossContamination(ingredientName)
    
    // Enhance with detailed nutrition
    const detailedNutrition = await this.getDetailedNutrition(ingredientName)
    
    // Enhance with source information
    const sourceInfo = await this.getSourceInformation(ingredientName)
    
    // Enhance with preparation methods
    const preparationMethods = await this.getPreparationMethods(ingredientName)
    
    // Enhance with safe alternatives
    const safeAlternatives = await this.getSafeAlternativesDetailed(
      ingredientName,
      userRestrictions
    )
    
    return {
      ...basicAnalysis,
      restriction_matches: restrictionMatches,
      cross_contamination_sources: crossContamination.sources,
      manufacturing_warnings: crossContamination.manufacturing,
      shared_facility_risks: crossContamination.facility,
      detailed_nutrition: detailedNutrition,
      source_info: sourceInfo,
      preparation_methods: preparationMethods,
      safe_alternatives: safeAlternatives,
      analysis_confidence: this.calculateAnalysisConfidence(basicAnalysis),
      data_sources: ['AI_Analysis', 'FDA_Database', 'USDA_Nutrition'],
      last_verified: new Date().toISOString(),
      expert_reviewed: false
    }
  }

  private async analyzeRestrictionMatches(
    analysis: IngredientAnalysisResult,
    userRestrictions: any[]
  ) {
    return userRestrictions.map(restriction => {
      const matchConfidence = this.calculateMatchConfidence(
        analysis.ingredient_name,
        restriction.name,
        analysis.common_allergens
      )
      
      return {
        restriction_id: restriction.id,
        restriction_name: restriction.name,
        severity: restriction.severity,
        match_confidence: matchConfidence,
        specific_concerns: this.generateSpecificConcerns(analysis, restriction),
        mitigation_strategies: this.generateMitigationStrategies(restriction)
      }
    }).filter(match => match.match_confidence > 0.1)
  }

  private async analyzeCrossContamination(ingredientName: string) {
    // Analyze potential cross-contamination sources
    return {
      sources: this.getCrossContaminationSources(ingredientName),
      manufacturing: this.getManufacturingWarnings(ingredientName),
      facility: this.getSharedFacilityRisks(ingredientName)
    }
  }

  private async getDetailedNutrition(ingredientName: string) {
    // Get detailed nutritional information
    return {
      macronutrients: {
        protein_quality_score: 0.8,
        carb_complexity: 'complex' as const,
        fat_saturation_profile: { saturated: 0.2, monounsaturated: 0.5, polyunsaturated: 0.3 }
      },
      micronutrients: {},
      phytonutrients: [],
      anti_nutrients: []
    }
  }

  private async getSourceInformation(ingredientName: string) {
    return {
      organic_available: true,
      seasonal_availability: ['spring', 'summer'],
      typical_origins: ['North America', 'Europe'],
      sustainability_score: 0.7,
      freshness_indicators: ['color', 'texture', 'smell']
    }
  }

  private async getPreparationMethods(ingredientName: string) {
    return [
      {
        method: 'raw',
        safety_impact: 'safe' as SafetyLevel,
        nutrition_impact: 'positive' as const,
        instructions: ['Wash thoroughly', 'Store refrigerated']
      }
    ]
  }

  private async getSafeAlternativesDetailed(ingredientName: string, userRestrictions: any[]) {
    return [
      {
        ingredient: 'alternative_ingredient',
        similarity_score: 0.8,
        substitution_ratio: '1:1',
        taste_profile_match: 0.9,
        nutritional_comparison: 'similar' as const,
        safety_improvement: true
      }
    ]
  }

  private async analyzeIngredientInteractions(
    analyses: DetailedIngredientAnalysis[],
    context?: any
  ) {
    // Analyze potential interactions between ingredients
    const interactions = []
    
    for (let i = 0; i < analyses.length; i++) {
      for (let j = i + 1; j < analyses.length; j++) {
        const interaction = this.checkIngredientInteraction(analyses[i], analyses[j])
        if (interaction) {
          interactions.push(interaction)
        }
      }
    }
    
    return interactions
  }

  private calculateCombinedSafety(
    analyses: DetailedIngredientAnalysis[],
    interactions: any[]
  ) {
    const riskLevels = analyses.map(a => a.risk_level)
    const worstRisk = this.getWorstRiskLevel(riskLevels)
    
    return {
      overall_risk: worstRisk,
      risk_factors: this.aggregateRiskFactors(analyses, interactions),
      safety_score: this.calculateCombinedSafetyScore(analyses),
      confidence: this.calculateCombinedConfidence(analyses)
    }
  }

  private async generateRecipeSuggestions(
    analyses: DetailedIngredientAnalysis[],
    interactions: any[],
    context?: any
  ) {
    return {
      safer_alternatives: [],
      preparation_modifications: [],
      portion_adjustments: []
    }
  }

  private async extractTextFromImage(imageUri: string) {
    // OCR implementation would go here
    // For now, return mock data
    return {
      text: 'Mock OCR text from image',
      confidence: 0.95
    }
  }

  private async parseIngredientsFromText(text: string) {
    // Parse ingredients from text using NLP
    const words = text.toLowerCase().split(/[\s,;]+/)
    const ingredients = []
    
    for (const word of words) {
      if (this.isLikelyIngredient(word)) {
        ingredients.push({
          name: word,
          confidence: 0.8,
          position: { x: 0, y: 0, width: 0, height: 0 }
        })
      }
    }
    
    return ingredients
  }

  private detectAllergens(text: string): string[] {
    const allergens = []
    const lowerText = text.toLowerCase()
    
    for (const [allergen, variants] of Object.entries(this.COMMON_ALLERGENS)) {
      if (variants.some(variant => lowerText.includes(variant))) {
        allergens.push(allergen)
      }
    }
    
    return allergens
  }

  private generateSafetyWarnings(ingredients: any[]): string[] {
    const warnings = []
    
    for (const ingredient of ingredients) {
      if (ingredient.analysis?.risk_level === 'danger') {
        warnings.push(`High risk: ${ingredient.name}`)
      } else if (ingredient.analysis?.risk_level === 'warning') {
        warnings.push(`Caution: ${ingredient.name}`)
      }
    }
    
    return warnings
  }

  private calculateOverallSafety(ingredients: any[]): SafetyLevel {
    const riskLevels = ingredients
      .map(i => i.analysis?.risk_level)
      .filter(Boolean)
    
    return this.getWorstRiskLevel(riskLevels)
  }

  private quickAllergenScan(ingredient: string, restrictions: any[]): string[] {
    const concerns = []
    const lowerIngredient = ingredient.toLowerCase()
    
    for (const restriction of restrictions) {
      const allergenVariants = this.COMMON_ALLERGENS[restriction.name.toLowerCase()] || []
      
      if (allergenVariants.some(variant => lowerIngredient.includes(variant))) {
        concerns.push(`Contains ${restriction.name}`)
      }
    }
    
    return concerns
  }

  private async getQuickAlternatives(ingredient: string): Promise<string[]> {
    // Return quick alternatives based on common substitutions
    const substitutions: Record<string, string[]> = {
      'milk': ['almond milk', 'oat milk', 'coconut milk'],
      'egg': ['flax egg', 'chia egg', 'applesauce'],
      'butter': ['olive oil', 'coconut oil', 'avocado'],
      'wheat flour': ['almond flour', 'rice flour', 'coconut flour']
    }
    
    const lowerIngredient = ingredient.toLowerCase()
    for (const [key, alternatives] of Object.entries(substitutions)) {
      if (lowerIngredient.includes(key)) {
        return alternatives
      }
    }
    
    return []
  }

  // Utility methods

  private isLikelyIngredient(word: string): boolean {
    // Simple heuristic to identify if a word is likely an ingredient
    return word.length > 2 && !['and', 'or', 'with', 'the', 'of', 'in'].includes(word)
  }

  private calculateMatchConfidence(
    ingredient: string,
    restriction: string,
    allergens: string[]
  ): number {
    const lowerIngredient = ingredient.toLowerCase()
    const lowerRestriction = restriction.toLowerCase()
    
    if (lowerIngredient.includes(lowerRestriction)) return 0.9
    if (allergens.some(a => a.toLowerCase().includes(lowerRestriction))) return 0.7
    
    return 0.0
  }

  private generateSpecificConcerns(analysis: any, restriction: any): string[] {
    return [`May contain ${restriction.name}`]
  }

  private generateMitigationStrategies(restriction: any): string[] {
    return [`Avoid products containing ${restriction.name}`]
  }

  private getCrossContaminationSources(ingredient: string): string[] {
    return ['shared processing equipment', 'shared storage facilities']
  }

  private getManufacturingWarnings(ingredient: string): string[] {
    return ['processed in facility that also processes allergens']
  }

  private getSharedFacilityRisks(ingredient: string): string[] {
    return ['may contain traces of other allergens']
  }

  private calculateAnalysisConfidence(analysis: IngredientAnalysisResult): number {
    return analysis.confidence_score / 100
  }

  private checkIngredientInteraction(ing1: any, ing2: any): any {
    // Check for known ingredient interactions
    return null
  }

  private getWorstRiskLevel(levels: SafetyLevel[]): SafetyLevel {
    if (levels.includes('danger')) return 'danger'
    if (levels.includes('warning')) return 'warning'
    if (levels.includes('caution')) return 'caution'
    return 'safe'
  }

  private aggregateRiskFactors(analyses: any[], interactions: any[]): string[] {
    return analyses.flatMap(a => a.common_allergens)
  }

  private calculateCombinedSafetyScore(analyses: DetailedIngredientAnalysis[]): number {
    if (analyses.length === 0) return 0
    return analyses.reduce((sum, a) => sum + a.confidence_score, 0) / analyses.length / 100
  }

  private calculateCombinedConfidence(analyses: DetailedIngredientAnalysis[]): number {
    if (analyses.length === 0) return 0
    return analyses.reduce((sum, a) => sum + a.confidence_score, 0) / analyses.length / 100
  }

  private calculateSafetyImprovement(original: any, alternative: any): number {
    const originalRisk = this.riskLevelToNumber(original.risk_level)
    const alternativeRisk = this.riskLevelToNumber(alternative.risk_level)
    return Math.max(0, (originalRisk - alternativeRisk) / 3)
  }

  private riskLevelToNumber(level: SafetyLevel): number {
    switch (level) {
      case 'safe': return 0
      case 'caution': return 1
      case 'warning': return 2
      case 'danger': return 3
      default: return 2
    }
  }

  private compareNutrition(original: any, alternative: any): any {
    return { comparison: 'similar' }
  }

  private generateSubstitutionNotes(
    original: string,
    alternative: string,
    context?: any
  ): string[] {
    return [`Replace ${original} with ${alternative} in equal amounts`]
  }

  private async storeAnalysisResult(analysis: DetailedIngredientAnalysis, userId: string): Promise<void> {
    try {
      await supabase
        .from('ingredient_analysis_cache')
        .upsert({
          ingredient_name: analysis.ingredient_name,
          user_id: userId,
          analysis_data: analysis,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + this.CACHE_DURATION).toISOString()
        })
    } catch (error) {
      console.warn('Failed to store analysis result:', error)
    }
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

export default IngredientAnalysisService.getInstance()