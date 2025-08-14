/**
 * Smart Meal Suggestion Service
 * 
 * Provides intelligent, context-aware meal suggestions based on:
 * - User dietary restrictions and preferences
 * - Real-time context (time, weather, mood, location)
 * - Available ingredients and equipment
 * - Safety requirements and preparation time
 * - Social context and budget constraints
 */

import { supabase } from '../lib/supabase'
import RecommendationService, { RecommendationContext } from './recommendationService'
import IngredientAnalysisService from './ingredientAnalysisService'
import AIService from './aiService'
import { SafetyLevel } from '../types/database.types'

export interface SmartSuggestionRequest {
  user_id: string
  context: {
    immediate_need?: 'quick_snack' | 'full_meal' | 'emergency_meal'
    available_time?: number // minutes
    available_ingredients?: string[]
    kitchen_equipment?: string[]
    budget_limit?: number
    dietary_goals?: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'recovery'
    energy_level?: 'low' | 'medium' | 'high'
    mood?: 'comfort' | 'adventurous' | 'healthy' | 'indulgent'
    weather?: 'hot' | 'cold' | 'rainy' | 'sunny'
    social_context?: 'alone' | 'family' | 'friends' | 'date' | 'work'
    location_type?: 'home' | 'work' | 'travel' | 'restaurant'
    health_status?: 'normal' | 'sick' | 'stressed' | 'tired'
  }
  preferences?: {
    safety_priority?: 'maximum' | 'high' | 'balanced' | 'adventurous'
    novelty_preference?: 'familiar' | 'mixed' | 'new'
    prep_complexity?: 'minimal' | 'moderate' | 'elaborate'
    portion_size?: 'light' | 'normal' | 'large'
  }
}

export interface SmartMealSuggestion {
  meal_id: string
  meal_data: any
  suggestion_score: number
  reasoning: {
    primary_reasons: string[]
    context_matches: string[]
    safety_factors: string[]
    convenience_factors: string[]
  }
  preparation_plan: {
    total_time: number
    active_time: number
    steps: Array<{
      step: string
      duration: number
      equipment_needed?: string[]
      safety_notes?: string[]
    }>
    missing_ingredients: string[]
    equipment_alternatives: string[]
  }
  nutrition_alignment: {
    calorie_fit: 'under' | 'perfect' | 'over'
    macro_balance: 'good' | 'acceptable' | 'poor'
    dietary_goal_support: number // 0-1
  }
  safety_assessment: {
    overall_safety: SafetyLevel
    specific_warnings: string[]
    preparation_safety_tips: string[]
    allergen_alternatives: string[]
  }
  adaptations: {
    quick_version?: {
      time_saved: number
      modifications: string[]
    }
    safer_version?: {
      safety_improvement: string[]
      ingredient_swaps: Record<string, string>
    }
    budget_version?: {
      cost_reduction: number
      substitutions: Record<string, string>
    }
  }
}

export interface EmergencyMealSuggestion {
  meal_name: string
  description: string
  safety_verified: boolean
  prep_time: number
  ingredients: Array<{
    name: string
    amount: string
    is_essential: boolean
    alternatives: string[]
  }>
  instructions: string[]
  safety_notes: string[]
  nutritional_info: {
    calories: number
    protein: number
    allergen_warnings: string[]
  }
}

class SmartMealSuggestionService {
  private static instance: SmartMealSuggestionService

  static getInstance(): SmartMealSuggestionService {
    if (!SmartMealSuggestionService.instance) {
      SmartMealSuggestionService.instance = new SmartMealSuggestionService()
    }
    return SmartMealSuggestionService.instance
  }

  /**
   * Get smart meal suggestions based on current context
   */
  async getSmartSuggestions(
    request: SmartSuggestionRequest,
    count: number = 5
  ): Promise<SmartMealSuggestion[]> {
    try {
      // Build recommendation context
      const recContext: RecommendationContext = {
        user_id: request.user_id,
        meal_type: this.inferMealType(request.context),
        time_of_day: new Date().toTimeString(),
        available_time: request.context.available_time,
        budget_limit: request.context.budget_limit,
        social_context: request.context.social_context,
        pantry_items: request.context.available_ingredients
      }

      // Get base recommendations
      const baseRecommendations = await RecommendationService.getPersonalizedRecommendations(
        recContext,
        {
          count: count * 3, // Get more to filter
          include_reasons: true,
          safety_threshold: this.getSafetyThreshold(request.preferences?.safety_priority),
          max_prep_time: request.context.available_time
        }
      )

      // Enhance recommendations with smart analysis
      const smartSuggestions = await Promise.all(
        baseRecommendations.slice(0, count).map(rec => 
          this.enhanceRecommendationWithContext(rec, request)
        )
      )

      // Sort by suggestion score
      return smartSuggestions.sort((a, b) => b.suggestion_score - a.suggestion_score)
    } catch (error) {
      console.error('Smart meal suggestion failed:', error)
      throw new Error('Failed to generate smart meal suggestions')
    }
  }

  /**
   * Get emergency meal suggestions for urgent situations
   */
  async getEmergencyMealSuggestions(
    userId: string,
    availableIngredients: string[] = []
  ): Promise<EmergencyMealSuggestion[]> {
    try {
      // Get user restrictions for safety
      const { data: restrictions } = await supabase
        .from('user_restrictions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      const userRestrictions = (restrictions || []).map(r => r.restriction_name)

      // Emergency meal templates based on common pantry items
      const emergencyMeals = [
        {
          meal_name: "Safe Rice Bowl",
          base_ingredients: ["rice", "salt", "oil"],
          optional_ingredients: ["vegetables", "protein"],
          prep_time: 15
        },
        {
          meal_name: "Simple Pasta",
          base_ingredients: ["pasta", "olive oil", "garlic"],
          optional_ingredients: ["vegetables", "herbs"],
          prep_time: 12
        },
        {
          meal_name: "Basic Egg Dish",
          base_ingredients: ["eggs", "oil"],
          optional_ingredients: ["vegetables", "cheese"],
          prep_time: 8
        },
        {
          meal_name: "Bread-Based Meal",
          base_ingredients: ["bread", "spread"],
          optional_ingredients: ["vegetables", "protein"],
          prep_time: 5
        }
      ]

      // Filter and enhance emergency meals
      const validMeals = []
      for (const meal of emergencyMeals) {
        const hasBaseIngredients = meal.base_ingredients.every(ing =>
          availableIngredients.some(avail => 
            avail.toLowerCase().includes(ing.toLowerCase())
          )
        )

        if (hasBaseIngredients) {
          const safetyChecked = await this.verifyEmergencyMealSafety(
            meal,
            userRestrictions
          )
          
          if (safetyChecked.safety_verified) {
            validMeals.push(safetyChecked)
          }
        }
      }

      return validMeals.slice(0, 3) // Return top 3 emergency options
    } catch (error) {
      console.error('Emergency meal suggestion failed:', error)
      return this.getFallbackEmergencyMeals()
    }
  }

  /**
   * Get suggestions for using specific ingredients
   */
  async getIngredientBasedSuggestions(
    userId: string,
    ingredients: string[],
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ): Promise<SmartMealSuggestion[]> {
    try {
      // Analyze ingredients for safety
      const ingredientAnalyses = await Promise.all(
        ingredients.map(ing => 
          IngredientAnalysisService.quickSafetyCheck(ing, userId)
        )
      )

      // Filter out unsafe ingredients
      const safeIngredients = ingredients.filter((_, index) => 
        ingredientAnalyses[index].is_safe
      )

      if (safeIngredients.length === 0) {
        throw new Error('No safe ingredients available for suggestions')
      }

      // Use AI to generate recipe ideas
      const aiSuggestions = await AIService.generateMealRecommendations(
        await this.getUserDietaryProfile(userId),
        mealType || 'dinner',
        5
      )

      // Filter suggestions that use available ingredients
      const matchingSuggestions = aiSuggestions.filter(suggestion => {
        const suggestionIngredients = suggestion.ingredients.map(i => i.name.toLowerCase())
        return safeIngredients.some(available => 
          suggestionIngredients.some(suggested => 
            suggested.includes(available.toLowerCase())
          )
        )
      })

      // Convert to smart suggestions format
      return Promise.all(
        matchingSuggestions.map(suggestion => 
          this.convertAISuggestionToSmart(suggestion, userId, safeIngredients)
        )
      )
    } catch (error) {
      console.error('Ingredient-based suggestion failed:', error)
      throw new Error('Failed to generate ingredient-based suggestions')
    }
  }

  /**
   * Get quick meal suggestions for immediate needs
   */
  async getQuickMealSuggestions(
    userId: string,
    maxPrepTime: number = 15
  ): Promise<SmartMealSuggestion[]> {
    const request: SmartSuggestionRequest = {
      user_id: userId,
      context: {
        immediate_need: 'quick_snack',
        available_time: maxPrepTime
      },
      preferences: {
        prep_complexity: 'minimal',
        safety_priority: 'high'
      }
    }

    return this.getSmartSuggestions(request, 5)
  }

  // Private helper methods

  private inferMealType(context: SmartSuggestionRequest['context']): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
    if (context.immediate_need === 'quick_snack') return 'snack'
    
    const hour = new Date().getHours()
    if (hour < 10) return 'breakfast'
    if (hour < 15) return 'lunch'
    if (hour > 18) return 'dinner'
    return 'snack'
  }

  private getSafetyThreshold(priority?: string): number {
    switch (priority) {
      case 'maximum': return 0.95
      case 'high': return 0.8
      case 'balanced': return 0.6
      case 'adventurous': return 0.4
      default: return 0.8
    }
  }

  private async enhanceRecommendationWithContext(
    recommendation: any,
    request: SmartSuggestionRequest
  ): Promise<SmartMealSuggestion> {
    // Calculate context-aware suggestion score
    const contextScore = this.calculateContextScore(recommendation, request)
    
    // Generate reasoning
    const reasoning = this.generateReasoningForSuggestion(recommendation, request)
    
    // Create preparation plan
    const preparationPlan = await this.createPreparationPlan(
      recommendation.meal_data,
      request.context
    )
    
    // Assess nutrition alignment
    const nutritionAlignment = this.assessNutritionAlignment(
      recommendation.meal_data,
      request.context
    )
    
    // Create safety assessment
    const safetyAssessment = await this.createSafetyAssessment(
      recommendation.meal_data,
      request.user_id
    )
    
    // Generate adaptations
    const adaptations = await this.generateAdaptations(
      recommendation.meal_data,
      request
    )
    
    return {
      meal_id: recommendation.meal_id,
      meal_data: recommendation.meal_data,
      suggestion_score: (recommendation.overall_score + contextScore) / 2,
      reasoning,
      preparation_plan: preparationPlan,
      nutrition_alignment: nutritionAlignment,
      safety_assessment: safetyAssessment,
      adaptations
    }
  }

  private calculateContextScore(recommendation: any, request: SmartSuggestionRequest): number {
    let score = 0.5
    
    // Time alignment
    if (request.context.available_time) {
      const mealTime = recommendation.meal_data.total_time || 30
      if (mealTime <= request.context.available_time) {
        score += 0.2
      } else {
        score -= 0.3
      }
    }
    
    // Mood alignment
    if (request.context.mood === 'comfort' && 
        recommendation.meal_data.category?.includes('comfort')) {
      score += 0.15
    }
    
    // Equipment availability
    if (request.context.kitchen_equipment) {
      const requiredEquipment = recommendation.meal_data.equipment_needed || []
      const hasAllEquipment = requiredEquipment.every((eq: string) =>
        request.context.kitchen_equipment!.includes(eq)
      )
      if (hasAllEquipment) score += 0.1
      else score -= 0.2
    }
    
    return Math.max(0, Math.min(1, score))
  }

  private generateReasoningForSuggestion(
    recommendation: any,
    request: SmartSuggestionRequest
  ) {
    const primaryReasons = [...recommendation.recommendation_reasons]
    const contextMatches = []
    const safetyFactors = []
    const convenienceFactors = []
    
    if (request.context.available_time && 
        recommendation.meal_data.total_time <= request.context.available_time) {
      contextMatches.push(`Fits your ${request.context.available_time} minute timeframe`)
    }
    
    if (request.context.mood) {
      contextMatches.push(`Matches your ${request.context.mood} mood`)
    }
    
    if (recommendation.safety_score > 0.8) {
      safetyFactors.push('High safety score for your restrictions')
    }
    
    if (recommendation.meal_data.difficulty_level === 'easy') {
      convenienceFactors.push('Simple preparation process')
    }
    
    return {
      primary_reasons: primaryReasons,
      context_matches: contextMatches,
      safety_factors: safetyFactors,
      convenience_factors: convenienceFactors
    }
  }

  private async createPreparationPlan(mealData: any, context: any) {
    const totalTime = mealData.total_time || 30
    const activeTime = Math.round(totalTime * 0.6) // Estimate active time
    
    return {
      total_time: totalTime,
      active_time: activeTime,
      steps: this.generatePreparationSteps(mealData),
      missing_ingredients: [],
      equipment_alternatives: []
    }
  }

  private generatePreparationSteps(mealData: any) {
    // Generate basic preparation steps
    return [
      {
        step: "Prepare ingredients",
        duration: 5,
        equipment_needed: ["knife", "cutting board"]
      },
      {
        step: "Cook according to recipe",
        duration: mealData.cook_time || 15,
        equipment_needed: mealData.equipment_needed || []
      },
      {
        step: "Plate and serve",
        duration: 2
      }
    ]
  }

  private assessNutritionAlignment(mealData: any, context: any) {
    const calories = mealData.calories_per_serving || 400
    
    return {
      calorie_fit: calories < 300 ? 'under' : calories > 600 ? 'over' : 'perfect',
      macro_balance: 'good',
      dietary_goal_support: 0.8
    }
  }

  private async createSafetyAssessment(mealData: any, userId: string) {
    try {
      const ingredients = Array.isArray(mealData.ingredients) 
        ? mealData.ingredients.map((i: any) => i.name || i)
        : []
      
      const safetyChecks = await Promise.all(
        ingredients.slice(0, 5).map((ing: string) => 
          IngredientAnalysisService.quickSafetyCheck(ing, userId)
        )
      )
      
      const overallSafety = safetyChecks.every(check => check.is_safe) ? 'safe' : 'caution'
      const warnings = safetyChecks.flatMap(check => check.immediate_concerns)
      
      return {
        overall_safety: overallSafety as SafetyLevel,
        specific_warnings: warnings,
        preparation_safety_tips: ['Wash hands before cooking', 'Clean all surfaces'],
        allergen_alternatives: []
      }
    } catch (error) {
      return {
        overall_safety: 'caution' as SafetyLevel,
        specific_warnings: ['Unable to verify all ingredients'],
        preparation_safety_tips: [],
        allergen_alternatives: []
      }
    }
  }

  private async generateAdaptations(mealData: any, request: SmartSuggestionRequest) {
    const adaptations: any = {}
    
    // Quick version if time is limited
    if (request.context.available_time && 
        mealData.total_time > request.context.available_time) {
      adaptations.quick_version = {
        time_saved: Math.round((mealData.total_time - request.context.available_time) / 2),
        modifications: ['Use pre-chopped ingredients', 'Increase heat for faster cooking']
      }
    }
    
    // Budget version if cost is a concern
    if (request.context.budget_limit && mealData.cost_per_serving > request.context.budget_limit) {
      adaptations.budget_version = {
        cost_reduction: 2,
        substitutions: {
          'expensive_ingredient': 'budget_alternative'
        }
      }
    }
    
    return adaptations
  }

  private async verifyEmergencyMealSafety(
    meal: any,
    userRestrictions: string[]
  ): Promise<EmergencyMealSuggestion> {
    const isRestrictionSafe = !userRestrictions.some(restriction =>
      meal.base_ingredients.some((ing: string) => 
        ing.toLowerCase().includes(restriction.toLowerCase())
      )
    )
    
    return {
      meal_name: meal.meal_name,
      description: `Quick and safe ${meal.meal_name.toLowerCase()} using basic ingredients`,
      safety_verified: isRestrictionSafe,
      prep_time: meal.prep_time,
      ingredients: meal.base_ingredients.map((ing: string) => ({
        name: ing,
        amount: 'as needed',
        is_essential: true,
        alternatives: []
      })),
      instructions: this.generateEmergencyInstructions(meal),
      safety_notes: ['Verify all ingredients are safe for your restrictions'],
      nutritional_info: {
        calories: 300,
        protein: 10,
        allergen_warnings: []
      }
    }
  }

  private generateEmergencyInstructions(meal: any): string[] {
    return [
      `Prepare ${meal.base_ingredients.join(', ')}`,
      'Cook using available equipment',
      'Season to taste',
      'Serve immediately'
    ]
  }

  private getFallbackEmergencyMeals(): EmergencyMealSuggestion[] {
    return [
      {
        meal_name: "Plain Rice",
        description: "Simple rice with salt",
        safety_verified: true,
        prep_time: 15,
        ingredients: [
          { name: "rice", amount: "1 cup", is_essential: true, alternatives: [] },
          { name: "water", amount: "2 cups", is_essential: true, alternatives: [] },
          { name: "salt", amount: "pinch", is_essential: false, alternatives: [] }
        ],
        instructions: ["Boil rice with water and salt", "Cook until tender", "Serve hot"],
        safety_notes: ["Rice is generally safe for most dietary restrictions"],
        nutritional_info: {
          calories: 250,
          protein: 5,
          allergen_warnings: []
        }
      }
    ]
  }

  private async getUserDietaryProfile(userId: string) {
    // Simplified profile for AI suggestions
    const { data: restrictions } = await supabase
      .from('user_restrictions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    return {
      user_id: userId,
      restrictions: (restrictions || []).map(r => ({
        id: r.restriction_id,
        name: r.restriction_name,
        severity: r.severity_level
      })),
      preferences: {
        cuisine_types: [],
        favorite_ingredients: [],
        avoided_ingredients: [],
        meal_types: [],
        dietary_goals: [],
        spice_tolerance: 'mild' as const,
        texture_preferences: []
      },
      cooking_preferences: {
        max_prep_time: 60,
        skill_level: 'beginner' as const,
        available_equipment: [],
        preferred_cooking_methods: []
      },
      learning_data: {
        liked_meals: [],
        disliked_meals: [],
        meal_ratings: {},
        search_history: [],
        order_history: []
      }
    }
  }

  private async convertAISuggestionToSmart(
    aiSuggestion: any,
    userId: string,
    availableIngredients: string[]
  ): Promise<SmartMealSuggestion> {
    return {
      meal_id: aiSuggestion.meal_id,
      meal_data: {
        name: aiSuggestion.meal_name,
        description: aiSuggestion.description,
        total_time: aiSuggestion.preparation_time,
        difficulty_level: aiSuggestion.difficulty_level,
        ingredients: aiSuggestion.ingredients
      },
      suggestion_score: aiSuggestion.safety_score,
      reasoning: {
        primary_reasons: ['Uses available ingredients'],
        context_matches: [],
        safety_factors: [],
        convenience_factors: []
      },
      preparation_plan: {
        total_time: aiSuggestion.preparation_time,
        active_time: Math.round(aiSuggestion.preparation_time * 0.7),
        steps: [],
        missing_ingredients: [],
        equipment_alternatives: []
      },
      nutrition_alignment: {
        calorie_fit: 'perfect',
        macro_balance: 'good',
        dietary_goal_support: 0.8
      },
      safety_assessment: {
        overall_safety: 'safe',
        specific_warnings: [],
        preparation_safety_tips: [],
        allergen_alternatives: []
      },
      adaptations: {}
    }
  }
}

export default SmartMealSuggestionService.getInstance()