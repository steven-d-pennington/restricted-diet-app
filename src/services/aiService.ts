/**
 * AI/ML Service Integration
 * 
 * Handles integration with various AI/ML services for:
 * - Ingredient analysis and classification
 * - Personalized meal recommendations
 * - Safety risk assessment
 * - Smart menu parsing
 * - User preference learning
 * - Dietary pattern analysis
 */

import { supabase } from '../lib/supabase'
import { Storage } from '../utils/storage'
import { RestrictionSeverity, SafetyLevel } from '../types/database.types'

// Configuration for different AI providers
const AI_CONFIG = {
  // OpenAI configuration
  openai: {
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini', // More cost-effective for most tasks
    maxTokens: 1000,
  },
  
  // Anthropic Claude configuration (fallback)
  anthropic: {
    apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-haiku-20240307',
    maxTokens: 1000,
  },
  
  // Local/Edge AI configuration
  edge: {
    enabled: false,
    modelPath: '',
  }
}

export interface IngredientAnalysisResult {
  ingredient_name: string
  common_allergens: string[]
  risk_level: SafetyLevel
  confidence_score: number
  alternatives: string[]
  nutritional_info?: {
    calories_per_100g?: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number
    sodium?: number
  }
  dietary_flags: string[] // e.g., ['vegan', 'gluten-free', 'halal']
  cross_contamination_risk: boolean
  processing_methods?: string[]
}

export interface MealRecommendation {
  meal_id: string
  meal_name: string
  description: string
  safety_score: number
  matching_preferences: string[]
  preparation_time: number
  difficulty_level: 'easy' | 'medium' | 'hard'
  ingredients: Array<{
    name: string
    amount: string
    unit: string
    is_safe: boolean
    alternatives?: string[]
  }>
  nutritional_summary: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sodium: number
  }
  cooking_instructions: string[]
  safety_notes: string[]
  image_url?: string
}

export interface UserDietaryProfile {
  user_id: string
  restrictions: Array<{
    id: string
    name: string
    severity: RestrictionSeverity
    specific_allergens?: string[]
  }>
  preferences: {
    cuisine_types: string[]
    favorite_ingredients: string[]
    avoided_ingredients: string[]
    meal_types: string[]
    dietary_goals: string[]
    spice_tolerance: 'none' | 'mild' | 'medium' | 'hot'
    texture_preferences: string[]
  }
  nutritional_targets?: {
    daily_calories?: number
    protein_percentage?: number
    carb_percentage?: number
    fat_percentage?: number
    max_sodium?: number
    min_fiber?: number
  }
  cooking_preferences: {
    max_prep_time: number
    skill_level: 'beginner' | 'intermediate' | 'advanced'
    available_equipment: string[]
    preferred_cooking_methods: string[]
  }
  learning_data: {
    liked_meals: string[]
    disliked_meals: string[]
    meal_ratings: Record<string, number>
    search_history: string[]
    order_history: string[]
  }
}

export interface SafetyRiskAssessment {
  overall_risk: SafetyLevel
  risk_factors: Array<{
    factor: string
    severity: SafetyLevel
    description: string
    mitigation_strategy?: string
  }>
  confidence_score: number
  cross_contamination_risk: boolean
  preparation_warnings: string[]
  safe_alternatives: string[]
}

class AIService {
  private static instance: AIService
  private cache: Map<string, { data: any; timestamp: number; expires: number }> = new Map()
  private readonly CACHE_DURATION = 60 * 60 * 1000 // 1 hour
  private readonly MAX_RETRIES = 3
  private readonly RATE_LIMIT_DELAY = 1000 // 1 second between requests

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  /**
   * Analyze ingredient safety and properties using AI
   */
  async analyzeIngredient(
    ingredientName: string,
    userRestrictions: string[],
    forceRefresh: boolean = false
  ): Promise<IngredientAnalysisResult> {
    const cacheKey = `ingredient_analysis_${ingredientName}_${userRestrictions.join(',')}`
    
    // Check cache first
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      if (Date.now() < cached.expires) {
        return cached.data
      }
    }

    const prompt = this.buildIngredientAnalysisPrompt(ingredientName, userRestrictions)
    
    try {
      const response = await this.callAIProvider(prompt, 'analysis')
      const result = await this.parseIngredientAnalysis(response, ingredientName)
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        expires: Date.now() + this.CACHE_DURATION
      })
      
      // Store in database for future reference
      await this.storeIngredientAnalysis(result)
      
      return result
    } catch (error) {
      console.error('Ingredient analysis failed:', error)
      throw new Error(`Failed to analyze ingredient: ${ingredientName}`)
    }
  }

  /**
   * Generate personalized meal recommendations
   */
  async generateMealRecommendations(
    userProfile: UserDietaryProfile,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    count: number = 5
  ): Promise<MealRecommendation[]> {
    const cacheKey = `meal_recommendations_${userProfile.user_id}_${mealType}_${count}`
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      if (Date.now() < cached.expires) {
        return cached.data
      }
    }

    const prompt = this.buildMealRecommendationPrompt(userProfile, mealType, count)
    
    try {
      const response = await this.callAIProvider(prompt, 'recommendation')
      const recommendations = await this.parseMealRecommendations(response)
      
      // Cache results
      this.cache.set(cacheKey, {
        data: recommendations,
        timestamp: Date.now(),
        expires: Date.now() + (this.CACHE_DURATION / 2) // Shorter cache for recommendations
      })
      
      return recommendations
    } catch (error) {
      console.error('Meal recommendation generation failed:', error)
      throw new Error('Failed to generate meal recommendations')
    }
  }

  /**
   * Assess safety risk for a meal or recipe
   */
  async assessSafetyRisk(
    ingredients: string[],
    userRestrictions: Array<{ name: string; severity: RestrictionSeverity }>,
    preparationMethod?: string
  ): Promise<SafetyRiskAssessment> {
    const prompt = this.buildSafetyAssessmentPrompt(ingredients, userRestrictions, preparationMethod)
    
    try {
      const response = await this.callAIProvider(prompt, 'safety')
      return await this.parseSafetyAssessment(response)
    } catch (error) {
      console.error('Safety risk assessment failed:', error)
      throw new Error('Failed to assess safety risk')
    }
  }

  /**
   * Parse menu text and extract structured information
   */
  async parseMenuText(
    menuText: string,
    restaurantContext?: string
  ): Promise<Array<{
    name: string
    description: string
    price?: string
    ingredients: string[]
    dietary_flags: string[]
    potential_allergens: string[]
  }>> {
    const prompt = this.buildMenuParsingPrompt(menuText, restaurantContext)
    
    try {
      const response = await this.callAIProvider(prompt, 'parsing')
      return await this.parseMenuStructure(response)
    } catch (error) {
      console.error('Menu parsing failed:', error)
      throw new Error('Failed to parse menu text')
    }
  }

  /**
   * Learn from user behavior and update preferences
   */
  async updateUserPreferencesFromBehavior(
    userId: string,
    behaviorData: {
      liked_items: string[]
      disliked_items: string[]
      search_queries: string[]
      order_history: Array<{ item: string; rating?: number }>
    }
  ): Promise<Partial<UserDietaryProfile['preferences']>> {
    const prompt = this.buildPreferenceLearningPrompt(behaviorData)
    
    try {
      const response = await this.callAIProvider(prompt, 'learning')
      const updatedPreferences = await this.parsePreferenceUpdates(response)
      
      // Store learned preferences
      await this.storeUserPreferences(userId, updatedPreferences)
      
      return updatedPreferences
    } catch (error) {
      console.error('Preference learning failed:', error)
      throw new Error('Failed to update user preferences')
    }
  }

  // Private helper methods

  private async callAIProvider(prompt: string, taskType: string): Promise<string> {
    const provider = this.selectOptimalProvider(taskType)
    
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        await this.enforceRateLimit()
        
        if (provider === 'openai') {
          return await this.callOpenAI(prompt)
        } else if (provider === 'anthropic') {
          return await this.callAnthropic(prompt)
        }
        
        throw new Error('No AI provider available')
      } catch (error) {
        lastError = error as Error
        console.warn(`AI provider attempt ${attempt + 1} failed:`, error)
        
        if (attempt < this.MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        }
      }
    }
    
    throw lastError || new Error('All AI provider attempts failed')
  }

  private selectOptimalProvider(taskType: string): 'openai' | 'anthropic' {
    // Select provider based on task type and availability
    if (AI_CONFIG.openai.apiKey && AI_CONFIG.openai.apiKey !== 'demo_key_for_development') {
      return 'openai'
    } else if (AI_CONFIG.anthropic.apiKey && AI_CONFIG.anthropic.apiKey !== 'demo_key_for_development') {
      return 'anthropic'
    }
    
    throw new Error('No AI provider configured with valid API keys')
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch(`${AI_CONFIG.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_CONFIG.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a specialized AI assistant for dietary restriction and food safety analysis. Provide accurate, structured responses in JSON format when requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: AI_CONFIG.openai.maxTokens,
        temperature: 0.2, // Low temperature for consistent, factual responses
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  private async callAnthropic(prompt: string): Promise<string> {
    const response = await fetch(`${AI_CONFIG.anthropic.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': AI_CONFIG.anthropic.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: AI_CONFIG.anthropic.model,
        max_tokens: AI_CONFIG.anthropic.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.content[0].text
  }

  private async enforceRateLimit(): Promise<void> {
    const lastRequest = await Storage.getItem('ai_last_request')
    if (lastRequest) {
      const timeSinceLastRequest = Date.now() - parseInt(lastRequest)
      if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
        await new Promise(resolve => 
          setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest)
        )
      }
    }
    
    await Storage.setItem('ai_last_request', Date.now().toString())
  }

  private buildIngredientAnalysisPrompt(ingredient: string, restrictions: string[]): string {
    return `Analyze the ingredient "${ingredient}" for someone with the following dietary restrictions: ${restrictions.join(', ')}.

Please provide a comprehensive analysis in JSON format with the following structure:
{
  "ingredient_name": "${ingredient}",
  "common_allergens": ["list of allergens present"],
  "risk_level": "safe|caution|warning|danger",
  "confidence_score": 0-100,
  "alternatives": ["safe alternatives"],
  "nutritional_info": {
    "calories_per_100g": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number,
    "sodium": number
  },
  "dietary_flags": ["vegan", "gluten-free", etc.],
  "cross_contamination_risk": boolean,
  "processing_methods": ["common processing methods"]
}

Focus on safety and accuracy. If unsure about any aspect, indicate lower confidence and recommend consulting with healthcare providers.`
  }

  private buildMealRecommendationPrompt(profile: UserDietaryProfile, mealType: string, count: number): string {
    return `Generate ${count} personalized ${mealType} recommendations for a user with the following profile:

Restrictions: ${profile.restrictions.map(r => `${r.name} (${r.severity})`).join(', ')}
Preferred cuisines: ${profile.preferences.cuisine_types.join(', ')}
Favorite ingredients: ${profile.preferences.favorite_ingredients.join(', ')}
Avoided ingredients: ${profile.preferences.avoided_ingredients.join(', ')}
Max prep time: ${profile.cooking_preferences.max_prep_time} minutes
Skill level: ${profile.cooking_preferences.skill_level}

Please provide recommendations in JSON format as an array of meal objects with detailed ingredient lists, preparation instructions, and safety notes.

Ensure all recommendations are completely safe for the user's restrictions and align with their preferences.`
  }

  private buildSafetyAssessmentPrompt(
    ingredients: string[], 
    restrictions: Array<{ name: string; severity: RestrictionSeverity }>,
    preparation?: string
  ): string {
    return `Assess the safety risk of a meal with these ingredients: ${ingredients.join(', ')}

For someone with these restrictions: ${restrictions.map(r => `${r.name} (${r.severity})`).join(', ')}

${preparation ? `Preparation method: ${preparation}` : ''}

Provide a comprehensive safety assessment in JSON format with overall risk level, specific risk factors, and mitigation strategies.`
  }

  private buildMenuParsingPrompt(menuText: string, context?: string): string {
    return `Parse the following menu text and extract structured information about each item:

${context ? `Restaurant context: ${context}` : ''}

Menu text:
${menuText}

Please extract each menu item with name, description, ingredients, potential allergens, and dietary flags in JSON format.`
  }

  private buildPreferenceLearningPrompt(behaviorData: any): string {
    return `Analyze user behavior data and suggest preference updates:

Liked items: ${behaviorData.liked_items.join(', ')}
Disliked items: ${behaviorData.disliked_items.join(', ')}
Search queries: ${behaviorData.search_queries.join(', ')}
Order history: ${JSON.stringify(behaviorData.order_history)}

Suggest preference updates in JSON format that reflect the user's apparent tastes and patterns.`
  }

  private async parseIngredientAnalysis(response: string, ingredientName: string): Promise<IngredientAnalysisResult> {
    try {
      const parsed = JSON.parse(response)
      return {
        ingredient_name: ingredientName,
        common_allergens: parsed.common_allergens || [],
        risk_level: parsed.risk_level || 'safe',
        confidence_score: parsed.confidence_score || 50,
        alternatives: parsed.alternatives || [],
        nutritional_info: parsed.nutritional_info,
        dietary_flags: parsed.dietary_flags || [],
        cross_contamination_risk: parsed.cross_contamination_risk || false,
        processing_methods: parsed.processing_methods
      }
    } catch (error) {
      console.error('Failed to parse ingredient analysis:', error)
      throw new Error('Invalid response format from AI service')
    }
  }

  private async parseMealRecommendations(response: string): Promise<MealRecommendation[]> {
    try {
      const parsed = JSON.parse(response)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch (error) {
      console.error('Failed to parse meal recommendations:', error)
      throw new Error('Invalid response format from AI service')
    }
  }

  private async parseSafetyAssessment(response: string): Promise<SafetyRiskAssessment> {
    try {
      const parsed = JSON.parse(response)
      return {
        overall_risk: parsed.overall_risk || 'safe',
        risk_factors: parsed.risk_factors || [],
        confidence_score: parsed.confidence_score || 50,
        cross_contamination_risk: parsed.cross_contamination_risk || false,
        preparation_warnings: parsed.preparation_warnings || [],
        safe_alternatives: parsed.safe_alternatives || []
      }
    } catch (error) {
      console.error('Failed to parse safety assessment:', error)
      throw new Error('Invalid response format from AI service')
    }
  }

  private async parseMenuStructure(response: string): Promise<any[]> {
    try {
      const parsed = JSON.parse(response)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch (error) {
      console.error('Failed to parse menu structure:', error)
      throw new Error('Invalid response format from AI service')
    }
  }

  private async parsePreferenceUpdates(response: string): Promise<Partial<UserDietaryProfile['preferences']>> {
    try {
      return JSON.parse(response)
    } catch (error) {
      console.error('Failed to parse preference updates:', error)
      throw new Error('Invalid response format from AI service')
    }
  }

  private async storeIngredientAnalysis(analysis: IngredientAnalysisResult): Promise<void> {
    try {
      await supabase
        .from('ai_ingredient_analyses')
        .upsert({
          ingredient_name: analysis.ingredient_name,
          analysis_data: analysis,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString() // 30 days
        })
    } catch (error) {
      console.warn('Failed to store ingredient analysis:', error)
    }
  }

  private async storeUserPreferences(userId: string, preferences: any): Promise<void> {
    try {
      await supabase
        .from('user_ai_preferences')
        .upsert({
          user_id: userId,
          preferences_data: preferences,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.warn('Failed to store user preferences:', error)
    }
  }

  /**
   * Clear AI service cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { total_entries: number; cache_size_mb: number } {
    const entries = Array.from(this.cache.values())
    let totalSize = 0
    
    entries.forEach(entry => {
      totalSize += JSON.stringify(entry.data).length
    })
    
    return {
      total_entries: entries.length,
      cache_size_mb: Math.round((totalSize / (1024 * 1024)) * 100) / 100
    }
  }
}

export default AIService.getInstance()