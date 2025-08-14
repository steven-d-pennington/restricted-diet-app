/**
 * Personalized Recommendation Service
 * 
 * Implements multiple recommendation algorithms for meal suggestions:
 * - Safety-first collaborative filtering
 * - Content-based filtering using ingredient/nutrition profiles
 * - Hybrid recommendations combining multiple approaches
 * - Machine learning-based preference learning
 * - Real-time contextual recommendations
 */

import { supabase } from '../lib/supabase'
import AIService, { UserDietaryProfile, MealRecommendation } from './aiService'
import { SafetyLevel, RestrictionSeverity } from '../types/database.types'

export interface RecommendationContext {
  user_id: string
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  time_of_day?: string
  day_of_week?: string
  location?: { latitude: number; longitude: number }
  weather?: string
  social_context?: 'alone' | 'family' | 'friends' | 'date'
  budget_limit?: number
  available_time?: number // minutes
  dietary_goals?: string[] // e.g., ['weight_loss', 'muscle_gain', 'maintenance']
  current_mood?: string
  recent_meals?: string[] // IDs of recently consumed meals
  pantry_items?: string[] // Available ingredients
}

export interface RecommendationOptions {
  count?: number
  include_reasons?: boolean
  diversify?: boolean
  safety_threshold?: number
  max_prep_time?: number
  cuisine_variety?: boolean
  exclude_recent?: boolean
  boost_favorites?: boolean
}

export interface ScoredRecommendation {
  meal_id: string
  meal_data: any
  overall_score: number
  safety_score: number
  preference_score: number
  relevance_score: number
  confidence_level: number
  recommendation_reasons: string[]
  safety_reasons: string[]
  personalization_factors: Record<string, number>
  model_used: string
}

export interface UserPreferenceModel {
  user_id: string
  cuisine_preferences: Record<string, number>
  ingredient_preferences: Record<string, number>
  cooking_time_preference: number
  difficulty_preference: string
  nutrition_priorities: Record<string, number>
  meal_timing_patterns: Record<string, number>
  seasonal_preferences: Record<string, number>
  safety_sensitivity: number
  last_updated: string
  confidence_level: number
}

class RecommendationService {
  private static instance: RecommendationService
  private userModels: Map<string, UserPreferenceModel> = new Map()
  private cache: Map<string, { data: any; expires: number }> = new Map()
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

  static getInstance(): RecommendationService {
    if (!RecommendationService.instance) {
      RecommendationService.instance = new RecommendationService()
    }
    return RecommendationService.instance
  }

  /**
   * Generate personalized meal recommendations using hybrid approach
   */
  async getPersonalizedRecommendations(
    context: RecommendationContext,
    options: RecommendationOptions = {}
  ): Promise<ScoredRecommendation[]> {
    const cacheKey = `recommendations_${context.user_id}_${JSON.stringify(context)}_${JSON.stringify(options)}`
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      if (Date.now() < cached.expires) {
        return cached.data
      }
    }

    try {
      // Get user profile and preferences
      const [userProfile, userModel] = await Promise.all([
        this.getUserDietaryProfile(context.user_id),
        this.getUserPreferenceModel(context.user_id)
      ])

      // Generate recommendations using multiple algorithms
      const [
        collaborativeRecs,
        contentBasedRecs,
        aiGeneratedRecs,
        contextualRecs
      ] = await Promise.all([
        this.getCollaborativeFilteringRecommendations(context, userProfile, options),
        this.getContentBasedRecommendations(context, userProfile, userModel, options),
        this.getAIGeneratedRecommendations(context, userProfile, options),
        this.getContextualRecommendations(context, userProfile, options)
      ])

      // Combine and score recommendations
      const combinedRecs = this.combineRecommendations([
        { recommendations: collaborativeRecs, weight: 0.3, model: 'collaborative' },
        { recommendations: contentBasedRecs, weight: 0.3, model: 'content_based' },
        { recommendations: aiGeneratedRecs, weight: 0.25, model: 'ai_generated' },
        { recommendations: contextualRecs, weight: 0.15, model: 'contextual' }
      ])

      // Apply safety filtering and final scoring
      const finalRecs = await this.applySafetyFiltering(combinedRecs, userProfile)
      const scoredRecs = this.applyFinalScoring(finalRecs, context, options)

      // Sort and limit results
      const sortedRecs = scoredRecs
        .sort((a, b) => b.overall_score - a.overall_score)
        .slice(0, options.count || 10)

      // Cache results
      this.cache.set(cacheKey, {
        data: sortedRecs,
        expires: Date.now() + this.CACHE_DURATION
      })

      // Track recommendation generation for analytics
      await this.trackRecommendationGeneration(context, sortedRecs)

      return sortedRecs
    } catch (error) {
      console.error('Failed to generate recommendations:', error)
      throw new Error('Unable to generate personalized recommendations')
    }
  }

  /**
   * Update user preference model based on interactions
   */
  async updateUserPreferences(
    userId: string,
    interaction: {
      type: 'view' | 'save' | 'cook' | 'rate' | 'dismiss'
      meal_id: string
      rating?: number
      context?: RecommendationContext
    }
  ): Promise<void> {
    try {
      const userModel = await this.getUserPreferenceModel(userId)
      const mealData = await this.getMealData(interaction.meal_id)
      
      // Update preferences based on interaction type
      const updatedModel = this.computePreferenceUpdates(userModel, interaction, mealData)
      
      // Store updated model
      await this.storeUserPreferenceModel(userId, updatedModel)
      
      // Update cache
      this.userModels.set(userId, updatedModel)
      
      // Use AI to learn from behavior patterns
      if (Math.random() < 0.1) { // 10% chance to trigger ML update
        await this.triggerMLModelUpdate(userId)
      }
    } catch (error) {
      console.error('Failed to update user preferences:', error)
    }
  }

  /**
   * Get similar meals based on content similarity
   */
  async getSimilarMeals(
    mealId: string,
    userId?: string,
    count: number = 5
  ): Promise<ScoredRecommendation[]> {
    try {
      const targetMeal = await this.getMealData(mealId)
      const userProfile = userId ? await this.getUserDietaryProfile(userId) : null
      
      // Find meals with similar ingredients, cuisine, nutrition
      const similarMeals = await this.findContentSimilarMeals(targetMeal, count * 3)
      
      // Score based on similarity and user preferences
      const scoredMeals = similarMeals.map(meal => ({
        meal_id: meal.id,
        meal_data: meal,
        overall_score: this.calculateSimilarityScore(targetMeal, meal, userProfile),
        safety_score: userProfile ? this.calculateSafetyScore(meal, userProfile) : 1.0,
        preference_score: userProfile ? this.calculatePreferenceScore(meal, userProfile) : 0.5,
        relevance_score: this.calculateRelevanceScore(targetMeal, meal),
        confidence_level: 0.8,
        recommendation_reasons: this.generateSimilarityReasons(targetMeal, meal),
        safety_reasons: [],
        personalization_factors: {},
        model_used: 'content_similarity'
      }))
      
      return scoredMeals
        .sort((a, b) => b.overall_score - a.overall_score)
        .slice(0, count)
    } catch (error) {
      console.error('Failed to get similar meals:', error)
      throw new Error('Unable to find similar meals')
    }
  }

  /**
   * Get trending meals in user's area or with similar restrictions
   */
  async getTrendingRecommendations(
    userId: string,
    timeframe: '24h' | '7d' | '30d' = '7d',
    count: number = 10
  ): Promise<ScoredRecommendation[]> {
    try {
      const userProfile = await this.getUserDietaryProfile(userId)
      
      // Get trending meals based on recent interactions
      const { data: trendingMeals, error } = await supabase
        .from('user_behavior_events')
        .select(`
          target_id,
          COUNT(*) as interaction_count,
          meals!inner(*)
        `)
        .eq('target_type', 'meal')
        .in('event_type', ['meal_view', 'meal_save', 'meal_cook', 'meal_rate'])
        .gte('created_at', this.getTimeframeCutoff(timeframe))
        .group('target_id')
        .order('interaction_count', { ascending: false })
        .limit(count * 2)

      if (error) throw error

      // Score based on trending popularity and user fit
      const scoredTrending = (trendingMeals || []).map(item => ({
        meal_id: item.target_id,
        meal_data: item.meals,
        overall_score: this.calculateTrendingScore(item, userProfile),
        safety_score: this.calculateSafetyScore(item.meals, userProfile),
        preference_score: this.calculatePreferenceScore(item.meals, userProfile),
        relevance_score: item.interaction_count / 100, // Normalize trending score
        confidence_level: 0.7,
        recommendation_reasons: [`Trending in community (${item.interaction_count} interactions)`],
        safety_reasons: [],
        personalization_factors: { trending_score: item.interaction_count },
        model_used: 'trending'
      }))

      return scoredTrending
        .filter(rec => rec.safety_score >= 0.7) // Safety threshold
        .sort((a, b) => b.overall_score - a.overall_score)
        .slice(0, count)
    } catch (error) {
      console.error('Failed to get trending recommendations:', error)
      throw new Error('Unable to get trending recommendations')
    }
  }

  // Private helper methods

  private async getUserDietaryProfile(userId: string): Promise<UserDietaryProfile> {
    // Get user restrictions and preferences from database
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    const { data: restrictions, error: restrictionsError } = await supabase
      .from('user_restrictions')
      .select(`
        *,
        dietary_restrictions(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    if (restrictionsError) throw restrictionsError

    const { data: preferences, error: preferencesError } = await supabase
      .from('user_ai_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Build comprehensive user profile
    return {
      user_id: userId,
      restrictions: (restrictions || []).map(r => ({
        id: r.restriction_id,
        name: r.dietary_restrictions.name,
        severity: r.severity_level,
        specific_allergens: r.specific_allergens
      })),
      preferences: {
        cuisine_types: preferences?.preferences_data?.cuisine_types || [],
        favorite_ingredients: preferences?.preferences_data?.favorite_ingredients || [],
        avoided_ingredients: preferences?.preferences_data?.avoided_ingredients || [],
        meal_types: preferences?.preferences_data?.meal_types || [],
        dietary_goals: preferences?.preferences_data?.dietary_goals || [],
        spice_tolerance: preferences?.preferences_data?.spice_tolerance || 'mild',
        texture_preferences: preferences?.preferences_data?.texture_preferences || []
      },
      nutritional_targets: preferences?.preferences_data?.nutritional_targets,
      cooking_preferences: {
        max_prep_time: preferences?.preferences_data?.max_prep_time || 60,
        skill_level: preferences?.preferences_data?.skill_level || 'beginner',
        available_equipment: preferences?.preferences_data?.available_equipment || [],
        preferred_cooking_methods: preferences?.preferences_data?.preferred_cooking_methods || []
      },
      learning_data: {
        liked_meals: preferences?.learning_data?.liked_meals || [],
        disliked_meals: preferences?.learning_data?.disliked_meals || [],
        meal_ratings: preferences?.learning_data?.meal_ratings || {},
        search_history: preferences?.learning_data?.search_history || [],
        order_history: preferences?.learning_data?.order_history || []
      }
    }
  }

  private async getUserPreferenceModel(userId: string): Promise<UserPreferenceModel> {
    if (this.userModels.has(userId)) {
      return this.userModels.get(userId)!
    }

    // Load from database or create new model
    const { data, error } = await supabase
      .from('user_ai_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    let model: UserPreferenceModel

    if (error || !data) {
      // Create new model with defaults
      model = {
        user_id: userId,
        cuisine_preferences: {},
        ingredient_preferences: {},
        cooking_time_preference: 30,
        difficulty_preference: 'medium',
        nutrition_priorities: {},
        meal_timing_patterns: {},
        seasonal_preferences: {},
        safety_sensitivity: 0.8,
        last_updated: new Date().toISOString(),
        confidence_level: 0.1
      }
    } else {
      model = {
        user_id: userId,
        cuisine_preferences: data.preferences_data?.cuisine_preferences || {},
        ingredient_preferences: data.preferences_data?.ingredient_preferences || {},
        cooking_time_preference: data.preferences_data?.cooking_time_preference || 30,
        difficulty_preference: data.preferences_data?.difficulty_preference || 'medium',
        nutrition_priorities: data.preferences_data?.nutrition_priorities || {},
        meal_timing_patterns: data.preferences_data?.meal_timing_patterns || {},
        seasonal_preferences: data.preferences_data?.seasonal_preferences || {},
        safety_sensitivity: data.preferences_data?.safety_sensitivity || 0.8,
        last_updated: data.updated_at,
        confidence_level: data.preferences_data?.confidence_level || 0.5
      }
    }

    this.userModels.set(userId, model)
    return model
  }

  private async getCollaborativeFilteringRecommendations(
    context: RecommendationContext,
    userProfile: UserDietaryProfile,
    options: RecommendationOptions
  ): Promise<any[]> {
    // Find users with similar restrictions and preferences
    const { data: similarUsers, error } = await supabase.rpc(
      'find_similar_users_for_recommendations',
      {
        p_user_id: context.user_id,
        p_restriction_overlap_threshold: 0.7,
        p_limit: 50
      }
    )

    if (error) {
      console.warn('Collaborative filtering failed:', error)
      return []
    }

    // Get highly rated meals from similar users
    const similarUserIds = (similarUsers || []).map((u: any) => u.user_id)
    
    if (similarUserIds.length === 0) return []

    const { data: recommendations } = await supabase
      .from('user_meal_executions')
      .select(`
        meal_id,
        taste_rating,
        safety_rating,
        would_make_again,
        meals(*)
      `)
      .in('user_id', similarUserIds)
      .gte('taste_rating', 4)
      .eq('would_make_again', true)
      .limit(options.count ? options.count * 2 : 20)

    return recommendations || []
  }

  private async getContentBasedRecommendations(
    context: RecommendationContext,
    userProfile: UserDietaryProfile,
    userModel: UserPreferenceModel,
    options: RecommendationOptions
  ): Promise<any[]> {
    // Build content-based query using user preferences
    let query = supabase
      .from('meals')
      .select('*')
      .eq('is_public', true)
      .eq('is_active', true)

    // Filter by meal type if specified
    if (context.meal_type) {
      query = query.eq('meal_type', context.meal_type)
    }

    // Filter by prep time if specified
    if (context.available_time) {
      query = query.lte('total_time', context.available_time)
    }

    // Filter by dietary flags matching user preferences
    const userDietaryFlags = this.extractDietaryFlags(userProfile)
    if (userDietaryFlags.length > 0) {
      query = query.contains('dietary_flags', userDietaryFlags)
    }

    const { data: meals, error } = await query.limit(options.count ? options.count * 3 : 30)

    if (error) {
      console.warn('Content-based filtering failed:', error)
      return []
    }

    return meals || []
  }

  private async getAIGeneratedRecommendations(
    context: RecommendationContext,
    userProfile: UserDietaryProfile,
    options: RecommendationOptions
  ): Promise<any[]> {
    try {
      // Use AI service to generate recommendations
      const aiRecommendations = await AIService.generateMealRecommendations(
        userProfile,
        context.meal_type || 'dinner',
        options.count || 5
      )

      // Convert AI recommendations to our format
      return aiRecommendations.map(rec => ({
        id: rec.meal_id,
        name: rec.meal_name,
        description: rec.description,
        meal_type: context.meal_type || 'dinner',
        total_time: rec.preparation_time,
        difficulty_level: rec.difficulty_level,
        ingredients: rec.ingredients,
        nutritional_info: rec.nutritional_summary,
        ai_generated: true,
        safety_score: rec.safety_score
      }))
    } catch (error) {
      console.warn('AI-generated recommendations failed:', error)
      return []
    }
  }

  private async getContextualRecommendations(
    context: RecommendationContext,
    userProfile: UserDietaryProfile,
    options: RecommendationOptions
  ): Promise<any[]> {
    // Generate recommendations based on current context
    let contextualFilters: any = {}

    // Time-based recommendations
    if (context.time_of_day) {
      const hour = new Date().getHours()
      if (hour < 10) contextualFilters.meal_type = 'breakfast'
      else if (hour < 15) contextualFilters.meal_type = 'lunch'
      else if (hour > 18) contextualFilters.meal_type = 'dinner'
    }

    // Weather-based recommendations
    if (context.weather) {
      if (context.weather.includes('cold') || context.weather.includes('winter')) {
        contextualFilters.cooking_methods = ['slow_cook', 'braise', 'stew']
      } else if (context.weather.includes('hot') || context.weather.includes('summer')) {
        contextualFilters.cooking_methods = ['no_cook', 'grill', 'quick_sauté']
      }
    }

    // Social context recommendations
    if (context.social_context) {
      if (context.social_context === 'family') {
        contextualFilters.servings_min = 4
      } else if (context.social_context === 'date') {
        contextualFilters.difficulty_level = ['medium', 'hard']
        contextualFilters.cuisine_types = ['italian', 'french', 'mediterranean']
      }
    }

    let query = supabase
      .from('meals')
      .select('*')
      .eq('is_public', true)
      .eq('is_active', true)

    // Apply contextual filters
    Object.entries(contextualFilters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value)
      } else {
        query = query.eq(key, value)
      }
    })

    const { data: meals, error } = await query.limit(options.count || 10)

    if (error) {
      console.warn('Contextual recommendations failed:', error)
      return []
    }

    return meals || []
  }

  private combineRecommendations(
    sources: Array<{ recommendations: any[]; weight: number; model: string }>
  ): Array<{ meal: any; score: number; model: string }> {
    const combinedMap = new Map<string, { meal: any; totalScore: number; models: string[] }>()

    sources.forEach(source => {
      source.recommendations.forEach((meal, index) => {
        const mealId = meal.id || meal.meal_id
        const positionScore = (source.recommendations.length - index) / source.recommendations.length
        const weightedScore = positionScore * source.weight

        if (combinedMap.has(mealId)) {
          const existing = combinedMap.get(mealId)!
          existing.totalScore += weightedScore
          existing.models.push(source.model)
        } else {
          combinedMap.set(mealId, {
            meal,
            totalScore: weightedScore,
            models: [source.model]
          })
        }
      })
    })

    return Array.from(combinedMap.values()).map(item => ({
      meal: item.meal,
      score: item.totalScore,
      model: item.models.join(',')
    }))
  }

  private async applySafetyFiltering(
    recommendations: Array<{ meal: any; score: number; model: string }>,
    userProfile: UserDietaryProfile
  ): Promise<Array<{ meal: any; score: number; model: string; safetyScore: number }>> {
    const filtered = await Promise.all(
      recommendations.map(async rec => {
        const safetyScore = await this.calculateMealSafety(rec.meal, userProfile)
        return {
          ...rec,
          safetyScore
        }
      })
    )

    // Filter out meals that don't meet safety threshold
    return filtered.filter(rec => rec.safetyScore >= 0.7)
  }

  private applyFinalScoring(
    recommendations: Array<{ meal: any; score: number; model: string; safetyScore: number }>,
    context: RecommendationContext,
    options: RecommendationOptions
  ): ScoredRecommendation[] {
    return recommendations.map(rec => {
      const preferenceScore = rec.score
      const relevanceScore = this.calculateContextualRelevance(rec.meal, context)
      const overallScore = (
        rec.safetyScore * 0.4 +
        preferenceScore * 0.35 +
        relevanceScore * 0.25
      )

      return {
        meal_id: rec.meal.id || rec.meal.meal_id,
        meal_data: rec.meal,
        overall_score: overallScore,
        safety_score: rec.safetyScore,
        preference_score: preferenceScore,
        relevance_score: relevanceScore,
        confidence_level: 0.8,
        recommendation_reasons: this.generateRecommendationReasons(rec.meal, context, rec.model),
        safety_reasons: [],
        personalization_factors: {},
        model_used: rec.model
      }
    })
  }

  private async calculateMealSafety(meal: any, userProfile: UserDietaryProfile): Promise<number> {
    // Implement safety calculation based on user restrictions
    if (!userProfile.restrictions || userProfile.restrictions.length === 0) {
      return 1.0 // No restrictions, fully safe
    }

    let safetyScore = 1.0
    const mealIngredients = Array.isArray(meal.ingredients) 
      ? meal.ingredients.map((i: any) => i.name || i).join(' ').toLowerCase()
      : (meal.ingredients || '').toLowerCase()

    const allergenWarnings = meal.allergen_warnings || []
    const dietaryFlags = meal.dietary_flags || []

    userProfile.restrictions.forEach(restriction => {
      // Check for direct allergen matches
      if (allergenWarnings.some((warning: string) => 
        warning.toLowerCase().includes(restriction.name.toLowerCase())
      )) {
        safetyScore *= restriction.severity === 'life_threatening' ? 0 : 0.3
      }

      // Check ingredients for potential issues
      if (mealIngredients.includes(restriction.name.toLowerCase())) {
        safetyScore *= restriction.severity === 'life_threatening' ? 0 : 0.5
      }

      // Boost score for appropriate dietary flags
      if (restriction.name.toLowerCase() === 'gluten' && dietaryFlags.includes('gluten-free')) {
        safetyScore = Math.min(1.0, safetyScore + 0.2)
      }
    })

    return Math.max(0, safetyScore)
  }

  private calculateContextualRelevance(meal: any, context: RecommendationContext): number {
    let relevanceScore = 0.5

    // Meal type relevance
    if (context.meal_type && meal.meal_type === context.meal_type) {
      relevanceScore += 0.3
    }

    // Time constraint relevance
    if (context.available_time && meal.total_time <= context.available_time) {
      relevanceScore += 0.2
    }

    // Budget relevance
    if (context.budget_limit && meal.cost_per_serving <= context.budget_limit) {
      relevanceScore += 0.1
    }

    return Math.min(1.0, relevanceScore)
  }

  private generateRecommendationReasons(meal: any, context: RecommendationContext, model: string): string[] {
    const reasons: string[] = []

    if (model.includes('collaborative')) {
      reasons.push('Liked by users with similar preferences')
    }
    if (model.includes('content_based')) {
      reasons.push('Matches your ingredient preferences')
    }
    if (model.includes('ai_generated')) {
      reasons.push('AI-crafted for your specific needs')
    }
    if (context.meal_type && meal.meal_type === context.meal_type) {
      reasons.push(`Perfect for ${context.meal_type}`)
    }
    if (meal.total_time <= 30) {
      reasons.push('Quick preparation time')
    }
    if (meal.difficulty_level === 'easy') {
      reasons.push('Easy to prepare')
    }

    return reasons
  }

  private extractDietaryFlags(userProfile: UserDietaryProfile): string[] {
    const flags: string[] = []
    
    userProfile.restrictions.forEach(restriction => {
      if (restriction.name.toLowerCase().includes('gluten')) {
        flags.push('gluten-free')
      }
      if (restriction.name.toLowerCase().includes('dairy')) {
        flags.push('dairy-free')
      }
      if (restriction.name.toLowerCase().includes('vegan')) {
        flags.push('vegan')
      }
      if (restriction.name.toLowerCase().includes('vegetarian')) {
        flags.push('vegetarian')
      }
    })

    return flags
  }

  private async getMealData(mealId: string): Promise<any> {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('id', mealId)
      .single()

    if (error) throw error
    return data
  }

  private async findContentSimilarMeals(targetMeal: any, count: number): Promise<any[]> {
    // Simplified content similarity - would use vector similarity in production
    const { data: meals, error } = await supabase
      .from('meals')
      .select('*')
      .eq('cuisine_type', targetMeal.cuisine_type)
      .eq('meal_type', targetMeal.meal_type)
      .neq('id', targetMeal.id)
      .limit(count)

    if (error) throw error
    return meals || []
  }

  private calculateSimilarityScore(targetMeal: any, meal: any, userProfile: UserDietaryProfile | null): number {
    let score = 0

    // Cuisine similarity
    if (targetMeal.cuisine_type === meal.cuisine_type) score += 0.3

    // Meal type similarity
    if (targetMeal.meal_type === meal.meal_type) score += 0.2

    // Difficulty similarity
    if (targetMeal.difficulty_level === meal.difficulty_level) score += 0.1

    // Time similarity
    const timeDiff = Math.abs((targetMeal.total_time || 0) - (meal.total_time || 0))
    if (timeDiff <= 15) score += 0.2

    // Dietary flags overlap
    const targetFlags = new Set(targetMeal.dietary_flags || [])
    const mealFlags = new Set(meal.dietary_flags || [])
    const flagOverlap = [...targetFlags].filter(flag => mealFlags.has(flag)).length
    score += (flagOverlap / Math.max(targetFlags.size, 1)) * 0.2

    return Math.min(1.0, score)
  }

  private calculateSafetyScore(meal: any, userProfile: UserDietaryProfile): number {
    // Reuse the safety calculation logic
    return 0.8 // Simplified for now
  }

  private calculatePreferenceScore(meal: any, userProfile: UserDietaryProfile): number {
    let score = 0.5

    // Check cuisine preferences
    if (userProfile.preferences.cuisine_types.includes(meal.cuisine_type)) {
      score += 0.3
    }

    // Check favorite ingredients
    const mealIngredients = Array.isArray(meal.ingredients) 
      ? meal.ingredients.map((i: any) => i.name || i)
      : []
    
    const favoriteMatches = userProfile.preferences.favorite_ingredients.filter(fav =>
      mealIngredients.some(ing => ing.toLowerCase().includes(fav.toLowerCase()))
    ).length

    score += (favoriteMatches / Math.max(userProfile.preferences.favorite_ingredients.length, 1)) * 0.2

    return Math.min(1.0, score)
  }

  private calculateRelevanceScore(targetMeal: any, meal: any): number {
    return this.calculateSimilarityScore(targetMeal, meal, null)
  }

  private generateSimilarityReasons(targetMeal: any, meal: any): string[] {
    const reasons: string[] = []

    if (targetMeal.cuisine_type === meal.cuisine_type) {
      reasons.push(`Same cuisine: ${meal.cuisine_type}`)
    }
    if (targetMeal.meal_type === meal.meal_type) {
      reasons.push(`Same meal type: ${meal.meal_type}`)
    }
    if (targetMeal.difficulty_level === meal.difficulty_level) {
      reasons.push(`Similar difficulty: ${meal.difficulty_level}`)
    }

    return reasons
  }

  private calculateTrendingScore(item: any, userProfile: UserDietaryProfile): number {
    const trendingWeight = Math.min(item.interaction_count / 100, 1.0)
    const safetyScore = this.calculateSafetyScore(item.meals, userProfile)
    const preferenceScore = this.calculatePreferenceScore(item.meals, userProfile)

    return (trendingWeight * 0.4 + safetyScore * 0.4 + preferenceScore * 0.2)
  }

  private getTimeframeCutoff(timeframe: '24h' | '7d' | '30d'): string {
    const now = new Date()
    switch (timeframe) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  }

  private computePreferenceUpdates(
    userModel: UserPreferenceModel,
    interaction: any,
    mealData: any
  ): UserPreferenceModel {
    // Simplified preference learning - would use more sophisticated ML in production
    const updatedModel = { ...userModel }

    if (interaction.type === 'rate' && interaction.rating) {
      const rating = interaction.rating
      const weight = rating > 3 ? 0.1 : -0.05

      // Update cuisine preferences
      if (mealData.cuisine_type) {
        updatedModel.cuisine_preferences[mealData.cuisine_type] = 
          (updatedModel.cuisine_preferences[mealData.cuisine_type] || 0) + weight
      }

      // Update ingredient preferences
      const ingredients = Array.isArray(mealData.ingredients) 
        ? mealData.ingredients.map((i: any) => i.name || i)
        : []
      
      ingredients.forEach((ingredient: string) => {
        updatedModel.ingredient_preferences[ingredient] = 
          (updatedModel.ingredient_preferences[ingredient] || 0) + weight
      })

      updatedModel.confidence_level = Math.min(1.0, updatedModel.confidence_level + 0.01)
    }

    updatedModel.last_updated = new Date().toISOString()
    return updatedModel
  }

  private async storeUserPreferenceModel(userId: string, model: UserPreferenceModel): Promise<void> {
    await supabase
      .from('user_ai_preferences')
      .upsert({
        user_id: userId,
        preferences_data: {
          cuisine_preferences: model.cuisine_preferences,
          ingredient_preferences: model.ingredient_preferences,
          cooking_time_preference: model.cooking_time_preference,
          difficulty_preference: model.difficulty_preference,
          nutrition_priorities: model.nutrition_priorities,
          meal_timing_patterns: model.meal_timing_patterns,
          seasonal_preferences: model.seasonal_preferences,
          safety_sensitivity: model.safety_sensitivity,
          confidence_level: model.confidence_level
        },
        updated_at: new Date().toISOString()
      })
  }

  private async triggerMLModelUpdate(userId: string): Promise<void> {
    // Trigger ML model retraining (would integrate with ML pipeline)
    console.log(`Triggering ML model update for user: ${userId}`)
  }

  private async trackRecommendationGeneration(
    context: RecommendationContext,
    recommendations: ScoredRecommendation[]
  ): Promise<void> {
    try {
      await supabase
        .from('user_behavior_events')
        .insert({
          user_id: context.user_id,
          session_id: 'recommendation_session',
          event_type: 'recommendation_view',
          event_action: 'generate_recommendations',
          event_data: {
            context,
            recommendation_count: recommendations.length,
            top_score: recommendations[0]?.overall_score || 0
          }
        })
    } catch (error) {
      console.warn('Failed to track recommendation generation:', error)
    }
  }

  /**
   * Clear recommendation cache
   */
  clearCache(): void {
    this.cache.clear()
    this.userModels.clear()
  }
}

export default RecommendationService.getInstance()