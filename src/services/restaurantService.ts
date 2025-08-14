/**
 * Restaurant Service
 * 
 * SAFETY CRITICAL: Provides restaurant search and safety assessment functionality
 * Integrates with Supabase database and location services for safe dining discovery
 */

import { supabase } from '../lib/supabase'
import LocationService from './locationService'
import {
  Restaurant,
  RestaurantWithSafetyInfo,
  RestaurantWithReviews,
  RestaurantSearchParams,
  RestaurantSearchFilters,
  LocationCoordinates,
  RestaurantReview,
  MenuItem,
  MenuItemWithSafety,
  RestaurantSafetyProtocol,
  UserFavoriteRestaurant,
  SafetyLevel,
  UserRestriction,
  DietaryRestriction
} from '../types/database.types'

export interface RestaurantSearchResult {
  restaurants: RestaurantWithSafetyInfo[]
  total_count: number
  has_more: boolean
  search_center: LocationCoordinates
  search_radius_km: number
}

export interface RestaurantSafetyAssessment {
  overall_safety: SafetyLevel
  user_specific_safety: SafetyLevel
  verified_restrictions: string[]
  warning_restrictions: string[]
  dangerous_restrictions: string[]
  safety_score: number // 0-100
  verification_status: 'verified' | 'community' | 'unverified'
  last_assessment_date: string
}

export interface RestaurantServiceError {
  code: 'NETWORK_ERROR' | 'PERMISSION_DENIED' | 'INVALID_PARAMS' | 'NOT_FOUND' | 'DATABASE_ERROR'
  message: string
  details?: any
}

class RestaurantService {
  private static instance: RestaurantService
  private searchCache: Map<string, RestaurantSearchResult> = new Map()
  private restaurantCache: Map<string, RestaurantWithSafetyInfo> = new Map()
  private locationService = LocationService

  static getInstance(): RestaurantService {
    if (!RestaurantService.instance) {
      RestaurantService.instance = new RestaurantService()
    }
    return RestaurantService.instance
  }

  /**
   * Search for restaurants within a specific area
   */
  async searchRestaurants(params: RestaurantSearchParams): Promise<RestaurantSearchResult> {
    try {
      const cacheKey = this.generateSearchCacheKey(params)
      
      // Check cache first (valid for 10 minutes)
      if (this.searchCache.has(cacheKey)) {
        const cached = this.searchCache.get(cacheKey)!
        // TODO: Add cache expiry check
        return cached
      }

      // Build query with PostGIS location filtering
      let query = supabase
        .from('restaurants')
        .select(`
          *,
          restaurant_reviews!inner (
            id,
            rating,
            safety_rating,
            created_at
          )
        `)
        .eq('is_active', true)

      // Add location-based filtering using PostGIS
      // Note: This would require a stored procedure or RPC call for proper PostGIS distance queries
      // For now, we'll implement basic coordinate filtering
      const { location, radius_km } = params
      const latRange = radius_km / 111.32 // Approximate km per degree latitude
      const lonRange = radius_km / (111.32 * Math.cos(location.latitude * Math.PI / 180))

      query = query
        .gte('latitude', location.latitude - latRange)
        .lte('latitude', location.latitude + latRange)
        .gte('longitude', location.longitude - lonRange)
        .lte('longitude', location.longitude + lonRange)

      // Apply filters
      if (params.filters) {
        query = this.applySearchFilters(query, params.filters)
      }

      // Apply sorting
      switch (params.sort_by) {
        case 'rating':
          query = query.order('average_rating', { ascending: false })
          break
        case 'safety_rating':
          query = query.order('safety_rating', { ascending: false })
          break
        case 'price':
          query = query.order('price_range', { ascending: true })
          break
        default:
          // Distance sorting would be handled in post-processing
          break
      }

      // Apply pagination
      if (params.limit) {
        query = query.limit(params.limit)
      }
      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 20) - 1)
      }

      const { data: restaurants, error, count } = await query

      if (error) {
        throw {
          code: 'DATABASE_ERROR',
          message: 'Failed to search restaurants',
          details: error
        } as RestaurantServiceError
      }

      if (!restaurants) {
        return {
          restaurants: [],
          total_count: 0,
          has_more: false,
          search_center: location,
          search_radius_km: radius_km
        }
      }

      // Process restaurants with safety assessments and distance calculation
      const processedRestaurants = await Promise.all(
        restaurants.map(async (restaurant: any) => {
          // Extract coordinates from PostGIS location
          // In a real implementation, this would parse the PostGIS geometry
          // For now, we'll assume latitude/longitude are available
          const restaurantCoords: LocationCoordinates = {
            latitude: restaurant.latitude || 0,
            longitude: restaurant.longitude || 0
          }
          
          const distance = this.locationService.calculateDistance(location, restaurantCoords)
          
          // Skip if outside radius (precise distance check)
          if (distance > radius_km) {
            return null
          }

          // Get safety assessment for user's restrictions
          const safetyAssessment = await this.assessRestaurantSafety(
            restaurant.id,
            params.user_restrictions || []
          )

          // Check if restaurant is in user's favorites
          const isFavorite = await this.isRestaurantFavorite(restaurant.id)

          const processedRestaurant: RestaurantWithSafetyInfo = {
            ...restaurant,
            distance_km: distance,
            safety_rating_details: safetyAssessment,
            is_favorite: isFavorite,
            recent_reviews: restaurant.restaurant_reviews?.slice(0, 3) || []
          }

          return processedRestaurant
        })
      )

      // Filter out null results and sort by distance if no other sort specified
      const validRestaurants = processedRestaurants
        .filter((r): r is RestaurantWithSafetyInfo => r !== null)
        .sort((a, b) => {
          if (params.sort_by === 'distance' || !params.sort_by) {
            return (a.distance_km || 0) - (b.distance_km || 0)
          }
          return 0
        })

      const result: RestaurantSearchResult = {
        restaurants: validRestaurants,
        total_count: count || validRestaurants.length,
        has_more: (count || 0) > validRestaurants.length,
        search_center: location,
        search_radius_km: radius_km
      }

      // Cache the result
      this.searchCache.set(cacheKey, result)

      return result

    } catch (error: any) {
      console.error('Restaurant search error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'DATABASE_ERROR',
        message: 'Failed to search restaurants',
        details: error
      } as RestaurantServiceError
    }
  }

  /**
   * Get detailed restaurant information
   */
  async getRestaurantDetails(restaurantId: string): Promise<RestaurantWithReviews> {
    try {
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          restaurant_reviews (
            *,
            user_profiles!restaurant_reviews_user_id_fkey (
              full_name,
              is_verified
            )
          )
        `)
        .eq('id', restaurantId)
        .single()

      if (error) {
        throw {
          code: 'DATABASE_ERROR',
          message: 'Failed to get restaurant details',
          details: error
        } as RestaurantServiceError
      }

      if (!restaurant) {
        throw {
          code: 'NOT_FOUND',
          message: 'Restaurant not found'
        } as RestaurantServiceError
      }

      // Check if restaurant is in user's favorites
      const isFavorite = await this.isRestaurantFavorite(restaurantId)

      // Get user's review if exists
      const { data: { user } } = await supabase.auth.getUser()
      let userReview: RestaurantReview | undefined

      if (user) {
        const { data: reviews } = await supabase
          .from('restaurant_reviews')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('user_id', user.id)
          .limit(1)

        userReview = reviews?.[0]
      }

      return {
        ...restaurant,
        is_favorite: isFavorite,
        user_review: userReview
      }

    } catch (error: any) {
      console.error('Get restaurant details error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'DATABASE_ERROR',
        message: 'Failed to get restaurant details',
        details: error
      } as RestaurantServiceError
    }
  }

  /**
   * Assess restaurant safety for specific dietary restrictions
   */
  async assessRestaurantSafety(
    restaurantId: string,
    userRestrictions: string[]
  ): Promise<RestaurantSafetyAssessment> {
    try {
      if (userRestrictions.length === 0) {
        return {
          overall_safety: 'safe',
          user_specific_safety: 'safe',
          verified_restrictions: [],
          warning_restrictions: [],
          dangerous_restrictions: [],
          safety_score: 100,
          verification_status: 'unverified',
          last_assessment_date: new Date().toISOString()
        }
      }

      // Get restaurant safety protocols for user's restrictions
      const { data: protocols, error } = await supabase
        .from('restaurant_safety_protocols')
        .select(`
          *,
          dietary_restrictions (
            id,
            name,
            category,
            medical_severity_default
          )
        `)
        .eq('restaurant_id', restaurantId)
        .in('restriction_id', userRestrictions)

      if (error) {
        console.error('Safety protocols query error:', error)
      }

      const safetyProtocols = protocols || []
      
      // Analyze safety for each restriction
      const verified: string[] = []
      const warning: string[] = []
      const dangerous: string[] = []

      for (const restrictionId of userRestrictions) {
        const protocol = safetyProtocols.find(p => p.restriction_id === restrictionId)
        
        if (!protocol) {
          // No specific protocol - assess based on restriction severity
          const { data: restriction } = await supabase
            .from('dietary_restrictions')
            .select('medical_severity_default')
            .eq('id', restrictionId)
            .single()

          if (restriction?.medical_severity_default === 'life_threatening') {
            dangerous.push(restrictionId)
          } else {
            warning.push(restrictionId)
          }
          continue
        }

        // Assess protocol completeness
        const safetyScore = this.calculateProtocolSafety(protocol)
        
        if (safetyScore >= 80) {
          verified.push(restrictionId)
        } else if (safetyScore >= 50) {
          warning.push(restrictionId)
        } else {
          dangerous.push(restrictionId)
        }
      }

      // Calculate overall safety levels
      const overallSafety: SafetyLevel = dangerous.length > 0 ? 'danger' : 
                                       warning.length > 0 ? 'warning' : 
                                       verified.length > 0 ? 'caution' : 'safe'

      const userSpecificSafety: SafetyLevel = dangerous.length > 0 ? 'danger' :
                                             warning.length > verified.length ? 'warning' :
                                             'safe'

      // Calculate safety score (0-100)
      const totalRestrictions = userRestrictions.length
      const safetyScore = totalRestrictions === 0 ? 100 : 
                         Math.round((verified.length * 100 + warning.length * 50) / totalRestrictions)

      // Determine verification status
      const verificationStatus = verified.length === totalRestrictions ? 'verified' :
                                verified.length > 0 ? 'community' : 'unverified'

      return {
        overall_safety: overallSafety,
        user_specific_safety: userSpecificSafety,
        verified_restrictions: verified,
        warning_restrictions: warning,
        dangerous_restrictions: dangerous,
        safety_score: safetyScore,
  verification_status: verificationStatus,
        last_assessment_date: new Date().toISOString()
      }

    } catch (error) {
      console.error('Safety assessment error:', error)
      
      // Return conservative assessment on error
      return {
        overall_safety: 'warning',
        user_specific_safety: 'warning',
        verified_restrictions: [],
        warning_restrictions: userRestrictions,
        dangerous_restrictions: [],
        safety_score: 50,
        verification_status: 'unverified',
        last_assessment_date: new Date().toISOString()
      }
    }
  }

  /**
   * Get menu items for a restaurant with safety assessments
   */
  async getRestaurantMenu(
    restaurantId: string,
    userRestrictions: string[] = []
  ): Promise<MenuItemWithSafety[]> {
    try {
      const { data: menuItems, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          menu_item_safety_assessments (
            restriction_id,
            safety_level,
            risk_factors,
            customer_notes
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('category_id')

      if (error) {
        throw {
          code: 'DATABASE_ERROR',
          message: 'Failed to get restaurant menu',
          details: error
        } as RestaurantServiceError
      }

      if (!menuItems) return []

      // Process menu items with safety assessments
      return menuItems.map(item => ({
        ...item,
        safety_assessment: item.menu_item_safety_assessments?.filter((assessment: any) =>
          userRestrictions.includes(assessment.restriction_id)
        ) || []
      }))

    } catch (error: any) {
      console.error('Get restaurant menu error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'DATABASE_ERROR',
        message: 'Failed to get restaurant menu',
        details: error
      } as RestaurantServiceError
    }
  }

  /**
   * Add restaurant to user's favorites
   */
  async addToFavorites(restaurantId: string, notes?: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw {
          code: 'PERMISSION_DENIED',
          message: 'User must be logged in to add favorites'
        } as RestaurantServiceError
      }

      const { error } = await supabase
        .from('user_favorite_restaurants')
        .insert({
          user_id: user.id,
          restaurant_id: restaurantId,
          notes: notes || null
        })

      if (error) {
        throw {
          code: 'DATABASE_ERROR',
          message: 'Failed to add restaurant to favorites',
          details: error
        } as RestaurantServiceError
      }

      // Clear relevant caches
      this.clearRestaurantCache(restaurantId)

    } catch (error: any) {
      console.error('Add to favorites error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'DATABASE_ERROR',
        message: 'Failed to add restaurant to favorites',
        details: error
      } as RestaurantServiceError
    }
  }

  /**
   * Remove restaurant from user's favorites
   */
  async removeFromFavorites(restaurantId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw {
          code: 'PERMISSION_DENIED',
          message: 'User must be logged in to manage favorites'
        } as RestaurantServiceError
      }

      const { error } = await supabase
        .from('user_favorite_restaurants')
        .delete()
        .eq('user_id', user.id)
        .eq('restaurant_id', restaurantId)

      if (error) {
        throw {
          code: 'DATABASE_ERROR',
          message: 'Failed to remove restaurant from favorites',
          details: error
        } as RestaurantServiceError
      }

      // Clear relevant caches
      this.clearRestaurantCache(restaurantId)

    } catch (error: any) {
      console.error('Remove from favorites error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'DATABASE_ERROR',
        message: 'Failed to remove restaurant from favorites',
        details: error
      } as RestaurantServiceError
    }
  }

  /**
   * Get user's favorite restaurants
   */
  async getFavoriteRestaurants(): Promise<RestaurantWithSafetyInfo[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return []
      }

      const { data: favorites, error } = await supabase
        .from('user_favorite_restaurants')
        .select(`
          notes,
          created_at,
          restaurants (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw {
          code: 'DATABASE_ERROR',
          message: 'Failed to get favorite restaurants',
          details: error
        } as RestaurantServiceError
      }

      if (!favorites) return []

      // Get user's restrictions for safety assessment
      const { data: userRestrictions } = await supabase
        .from('user_restrictions')
        .select('restriction_id')
        .eq('user_id', user.id)
        .eq('is_active', true)

      const restrictionIds = userRestrictions?.map(r => r.restriction_id) || []

      // Process favorites with safety assessments
      const processedFavorites = await Promise.all(
        favorites.map(async (favorite: any) => {
          const restaurant = favorite.restaurants
          const safetyAssessment = await this.assessRestaurantSafety(
            restaurant.id,
            restrictionIds
          )

          return {
            ...restaurant,
            safety_rating_details: safetyAssessment,
            is_favorite: true,
            distance_km: undefined // Will be calculated when location is available
          }
        })
      )

      return processedFavorites

    } catch (error: any) {
      console.error('Get favorite restaurants error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'DATABASE_ERROR',
        message: 'Failed to get favorite restaurants',
        details: error
      } as RestaurantServiceError
    }
  }

  /**
   * Private helper methods
   */

  private async isRestaurantFavorite(restaurantId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return false

      const { data: favorite } = await supabase
        .from('user_favorite_restaurants')
        .select('id')
        .eq('user_id', user.id)
        .eq('restaurant_id', restaurantId)
        .limit(1)

      return !!favorite && favorite.length > 0

    } catch (error) {
      console.error('Check favorite status error:', error)
      return false
    }
  }

  private applySearchFilters(query: any, filters: RestaurantSearchFilters): any {
    if (filters.cuisine_types?.length) {
      query = query.overlaps('cuisine_types', filters.cuisine_types)
    }

    if (filters.price_range?.length) {
      query = query.in('price_range', filters.price_range)
    }

    if (filters.safety_rating_min !== undefined) {
      query = query.gte('safety_rating', filters.safety_rating_min)
    }

    if (filters.has_verified_safety) {
      query = query.eq('is_verified', true)
    }

    if (filters.wheelchair_accessible) {
      query = query.eq('wheelchair_accessible', true)
    }

    if (filters.delivery_available) {
      query = query.eq('delivery_available', true)
    }

    if (filters.takeout_available) {
      query = query.eq('takeout_available', true)
    }

    return query
  }

  private calculateProtocolSafety(protocol: RestaurantSafetyProtocol): number {
    let score = 0
    const maxScore = 100

    // Dedicated prep area (30 points)
    if (protocol.has_dedicated_prep_area) score += 30

    // Dedicated equipment (25 points)
    if (protocol.has_dedicated_equipment) score += 25

    // Staff training (20 points)
    if (protocol.has_staff_training) score += 20

    // Cross contamination protocols (15 points)
    if (protocol.has_cross_contamination_protocols) score += 15

    // Ingredient tracking (10 points)
    if (protocol.has_ingredient_tracking) score += 10

    return Math.min(score, maxScore)
  }

  private generateSearchCacheKey(params: RestaurantSearchParams): string {
    return JSON.stringify({
      lat: Math.round(params.location.latitude * 1000) / 1000,
      lng: Math.round(params.location.longitude * 1000) / 1000,
      radius: params.radius_km,
      filters: params.filters,
      restrictions: params.user_restrictions?.sort(),
      sort: params.sort_by,
      limit: params.limit,
      offset: params.offset
    })
  }

  private clearRestaurantCache(restaurantId?: string): void {
    if (restaurantId) {
      this.restaurantCache.delete(restaurantId)
    } else {
      this.restaurantCache.clear()
    }
    this.searchCache.clear()
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.searchCache.clear()
    this.restaurantCache.clear()
  }
}

export default RestaurantService.getInstance()