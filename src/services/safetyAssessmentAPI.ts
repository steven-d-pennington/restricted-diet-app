/**
 * Safety Assessment API Service
 * 
 * SAFETY CRITICAL: Real-time API endpoints for restaurant safety calculations
 * Provides high-performance access to safety scoring and assessment data
 */

import SafetyAssessmentService, { SafetyAssessmentResult } from './safetyAssessmentService'
import RestaurantCertificationService from './restaurantCertificationService'
import { supabase } from '../lib/supabase'
import { SafetyLevel, RestrictionSeverity } from '../types/database.types'

export interface SafetyAPIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
  cache_hit?: boolean
}

export interface RestaurantSafetyOverview {
  restaurant_id: string
  overall_safety_score: number
  safety_level: SafetyLevel
  confidence_score: number
  last_updated: string
  restriction_specific_scores: Array<{
    restriction_id: string
    restriction_name: string
    safety_score: number
    safety_level: SafetyLevel
    confidence_score: number
  }>
  critical_warnings: string[]
  data_freshness_days: number
  expert_verified: boolean
}

export interface SafetyTrend {
  restaurant_id: string
  date: string
  overall_score: number
  safety_level: SafetyLevel
  confidence_score: number
  data_points: number
}

export interface SafetyComparison {
  restaurant_a: RestaurantSafetyOverview
  restaurant_b: RestaurantSafetyOverview
  comparison_summary: {
    safer_restaurant: string
    score_difference: number
    confidence_difference: number
    key_differences: string[]
  }
}

class SafetyAssessmentAPI {
  private static instance: SafetyAssessmentAPI
  private requestCache: Map<string, { data: any; timestamp: number; expires: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes for API cache

  static getInstance(): SafetyAssessmentAPI {
    if (!SafetyAssessmentAPI.instance) {
      SafetyAssessmentAPI.instance = new SafetyAssessmentAPI()
    }
    return SafetyAssessmentAPI.instance
  }

  /**
   * Get comprehensive safety assessment for a restaurant
   */
  async getRestaurantSafetyAssessment(
    restaurantId: string,
    userId?: string,
    forceRefresh: boolean = false
  ): Promise<SafetyAPIResponse<RestaurantSafetyOverview>> {
    const startTime = Date.now()
    const cacheKey = `safety_overview_${restaurantId}_${userId || 'public'}`

    try {
      // Check API cache first
      if (!forceRefresh && this.requestCache.has(cacheKey)) {
        const cached = this.requestCache.get(cacheKey)!
        if (Date.now() < cached.expires) {
          return {
            success: true,
            data: cached.data,
            timestamp: new Date().toISOString(),
            cache_hit: true
          }
        }
      }

      // Get user-specific assessment if userId provided
      let assessment: SafetyAssessmentResult
      let restrictionAssessments: SafetyAssessmentResult[] = []
      let criticalWarnings: string[] = []

      if (userId) {
        const userAssessment = await SafetyAssessmentService.getUserSpecificSafetyAssessment(
          restaurantId,
          userId
        )
        assessment = userAssessment.overall_assessment
        restrictionAssessments = userAssessment.restriction_assessments
        criticalWarnings = userAssessment.critical_warnings
      } else {
        assessment = await SafetyAssessmentService.calculateSafetyAssessment(
          restaurantId,
          null,
          forceRefresh
        )
      }

      // Get restriction details for restriction-specific scores
      const restrictionScores = await Promise.all(
        restrictionAssessments.map(async (ra) => {
          const { data: restriction } = await supabase
            .from('dietary_restrictions')
            .select('name')
            .eq('id', ra.restriction_id!)
            .single()

          return {
            restriction_id: ra.restriction_id!,
            restriction_name: restriction?.name || 'Unknown',
            safety_score: ra.overall_safety_score,
            safety_level: ra.safety_level,
            confidence_score: ra.confidence_score
          }
        })
      )

      const result: RestaurantSafetyOverview = {
        restaurant_id: restaurantId,
        overall_safety_score: assessment.overall_safety_score,
        safety_level: assessment.safety_level,
        confidence_score: assessment.confidence_score,
        last_updated: assessment.last_calculation,
        restriction_specific_scores: restrictionScores,
        critical_warnings: criticalWarnings,
        data_freshness_days: assessment.data_sources.data_freshness_days,
        expert_verified: assessment.data_sources.expert_assessments_count > 0
      }

      // Cache the result
      this.requestCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        expires: Date.now() + this.CACHE_DURATION
      })

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        cache_hit: false
      }

    } catch (error) {
      console.error('Safety assessment API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Get safety assessment for specific dietary restriction
   */
  async getRestrictionSpecificSafety(
    restaurantId: string,
    restrictionId: string,
    forceRefresh: boolean = false
  ): Promise<SafetyAPIResponse<SafetyAssessmentResult>> {
    const cacheKey = `restriction_safety_${restaurantId}_${restrictionId}`

    try {
      // Check cache
      if (!forceRefresh && this.requestCache.has(cacheKey)) {
        const cached = this.requestCache.get(cacheKey)!
        if (Date.now() < cached.expires) {
          return {
            success: true,
            data: cached.data,
            timestamp: new Date().toISOString(),
            cache_hit: true
          }
        }
      }

      const assessment = await SafetyAssessmentService.calculateSafetyAssessment(
        restaurantId,
        restrictionId,
        forceRefresh
      )

      // Cache result
      this.requestCache.set(cacheKey, {
        data: assessment,
        timestamp: Date.now(),
        expires: Date.now() + this.CACHE_DURATION
      })

      return {
        success: true,
        data: assessment,
        timestamp: new Date().toISOString(),
        cache_hit: false
      }

    } catch (error) {
      console.error('Restriction-specific safety API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Get safety trends for a restaurant over time
   */
  async getRestaurantSafetyTrends(
    restaurantId: string,
    restrictionId?: string,
    days: number = 30
  ): Promise<SafetyAPIResponse<SafetyTrend[]>> {
    const cacheKey = `safety_trends_${restaurantId}_${restrictionId || 'overall'}_${days}`

    try {
      // Check cache
      if (this.requestCache.has(cacheKey)) {
        const cached = this.requestCache.get(cacheKey)!
        if (Date.now() < cached.expires) {
          return {
            success: true,
            data: cached.data,
            timestamp: new Date().toISOString(),
            cache_hit: true
          }
        }
      }

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      let query = supabase
        .from('restaurant_safety_scores')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('calculation_timestamp', startDate.toISOString())
        .order('calculation_timestamp', { ascending: true })

      if (restrictionId) {
        query = query.eq('restriction_id', restrictionId)
      } else {
        query = query.is('restriction_id', null)
      }

      const { data } = await query

      const trends: SafetyTrend[] = (data || []).map(record => ({
        restaurant_id: restaurantId,
        date: record.calculation_timestamp,
        overall_score: record.overall_safety_score,
        safety_level: record.safety_level,
        confidence_score: record.confidence_score,
        data_points: Object.keys(record.data_sources || {}).length
      }))

      // Cache for longer period since trends change slowly
      this.requestCache.set(cacheKey, {
        data: trends,
        timestamp: Date.now(),
        expires: Date.now() + (this.CACHE_DURATION * 4) // 20 minutes
      })

      return {
        success: true,
        data: trends,
        timestamp: new Date().toISOString(),
        cache_hit: false
      }

    } catch (error) {
      console.error('Safety trends API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Compare safety between two restaurants
   */\n  async compareRestaurantSafety(\n    restaurantAId: string,\n    restaurantBId: string,\n    userId?: string\n  ): Promise<SafetyAPIResponse<SafetyComparison>> {\n    const cacheKey = `safety_comparison_${restaurantAId}_${restaurantBId}_${userId || 'public'}`\n\n    try {\n      // Check cache\n      if (this.requestCache.has(cacheKey)) {\n        const cached = this.requestCache.get(cacheKey)!\n        if (Date.now() < cached.expires) {\n          return {\n            success: true,\n            data: cached.data,\n            timestamp: new Date().toISOString(),\n            cache_hit: true\n          }\n        }\n      }\n\n      // Get assessments for both restaurants\n      const [assessmentA, assessmentB] = await Promise.all([\n        this.getRestaurantSafetyAssessment(restaurantAId, userId),\n        this.getRestaurantSafetyAssessment(restaurantBId, userId)\n      ])\n\n      if (!assessmentA.success || !assessmentB.success) {\n        throw new Error('Failed to get one or both restaurant assessments')\n      }\n\n      const dataA = assessmentA.data!\n      const dataB = assessmentB.data!\n\n      // Determine safer restaurant\n      let saferRestaurant: string\n      if (dataA.overall_safety_score > dataB.overall_safety_score) {\n        saferRestaurant = restaurantAId\n      } else if (dataB.overall_safety_score > dataA.overall_safety_score) {\n        saferRestaurant = restaurantBId\n      } else {\n        // If scores are equal, use confidence as tiebreaker\n        saferRestaurant = dataA.confidence_score >= dataB.confidence_score ? restaurantAId : restaurantBId\n      }\n\n      // Generate key differences\n      const keyDifferences: string[] = []\n      \n      const scoreDiff = Math.abs(dataA.overall_safety_score - dataB.overall_safety_score)\n      if (scoreDiff >= 10) {\n        keyDifferences.push(`${scoreDiff} point safety score difference`)\n      }\n\n      const confidenceDiff = Math.abs(dataA.confidence_score - dataB.confidence_score)\n      if (confidenceDiff >= 20) {\n        keyDifferences.push(`${confidenceDiff} point confidence difference`)\n      }\n\n      if (dataA.safety_level !== dataB.safety_level) {\n        keyDifferences.push(`Different safety levels: ${dataA.safety_level} vs ${dataB.safety_level}`)\n      }\n\n      if (dataA.expert_verified !== dataB.expert_verified) {\n        const verifiedRestaurant = dataA.expert_verified ? 'Restaurant A' : 'Restaurant B'\n        keyDifferences.push(`${verifiedRestaurant} has expert verification`)\n      }\n\n      const freshnessA = dataA.data_freshness_days\n      const freshnessB = dataB.data_freshness_days\n      if (Math.abs(freshnessA - freshnessB) >= 30) {\n        keyDifferences.push(`Significant data freshness difference: ${freshnessA} vs ${freshnessB} days`)\n      }\n\n      if (dataA.critical_warnings.length !== dataB.critical_warnings.length) {\n        keyDifferences.push(`Different number of critical warnings: ${dataA.critical_warnings.length} vs ${dataB.critical_warnings.length}`)\n      }\n\n      const comparison: SafetyComparison = {\n        restaurant_a: dataA,\n        restaurant_b: dataB,\n        comparison_summary: {\n          safer_restaurant: saferRestaurant,\n          score_difference: Math.abs(dataA.overall_safety_score - dataB.overall_safety_score),\n          confidence_difference: Math.abs(dataA.confidence_score - dataB.confidence_score),\n          key_differences: keyDifferences\n        }\n      }\n\n      // Cache result\n      this.requestCache.set(cacheKey, {\n        data: comparison,\n        timestamp: Date.now(),\n        expires: Date.now() + this.CACHE_DURATION\n      })\n\n      return {\n        success: true,\n        data: comparison,\n        timestamp: new Date().toISOString(),\n        cache_hit: false\n      }\n\n    } catch (error) {\n      console.error('Safety comparison API error:', error)\n      return {\n        success: false,\n        error: error instanceof Error ? error.message : 'Unknown error',\n        timestamp: new Date().toISOString()\n      }\n    }\n  }\n\n  /**\n   * Get restaurants by safety level in area\n   */\n  async getRestaurantsBySafetyLevel(\n    latitude: number,\n    longitude: number,\n    radiusKm: number,\n    restrictionId?: string,\n    safetyLevel?: SafetyLevel\n  ): Promise<SafetyAPIResponse<Array<{\n    restaurant_id: string\n    name: string\n    address: string\n    distance_km: number\n    safety_score: number\n    safety_level: SafetyLevel\n    confidence_score: number\n    last_updated: string\n  }>>> {\n    const cacheKey = `restaurants_by_safety_${latitude}_${longitude}_${radiusKm}_${restrictionId || 'all'}_${safetyLevel || 'all'}`\n\n    try {\n      // Check cache\n      if (this.requestCache.has(cacheKey)) {\n        const cached = this.requestCache.get(cacheKey)!\n        if (Date.now() < cached.expires) {\n          return {\n            success: true,\n            data: cached.data,\n            timestamp: new Date().toISOString(),\n            cache_hit: true\n          }\n        }\n      }\n\n      // This would typically use a geospatial query\n      // For now, we'll get restaurants and filter by safety level\n      let safetyQuery = supabase\n        .from('restaurant_safety_scores')\n        .select(`\n          restaurant_id,\n          overall_safety_score,\n          safety_level,\n          confidence_score,\n          calculation_timestamp,\n          restaurants (\n            name,\n            address,\n            latitude,\n            longitude\n          )\n        `)\n        .not('expires_at', 'lt', new Date().toISOString())\n\n      if (restrictionId) {\n        safetyQuery = safetyQuery.eq('restriction_id', restrictionId)\n      } else {\n        safetyQuery = safetyQuery.is('restriction_id', null)\n      }\n\n      if (safetyLevel) {\n        safetyQuery = safetyQuery.eq('safety_level', safetyLevel)\n      }\n\n      const { data } = await safetyQuery\n\n      // Calculate distances and filter by radius\n      const results = (data || [])\n        .map(record => {\n          const restaurant = record.restaurants as any\n          if (!restaurant?.latitude || !restaurant?.longitude) return null\n\n          const distance = this.calculateDistance(\n            latitude,\n            longitude,\n            restaurant.latitude,\n            restaurant.longitude\n          )\n\n          if (distance > radiusKm) return null\n\n          return {\n            restaurant_id: record.restaurant_id,\n            name: restaurant.name,\n            address: restaurant.address,\n            distance_km: Math.round(distance * 10) / 10,\n            safety_score: record.overall_safety_score,\n            safety_level: record.safety_level,\n            confidence_score: record.confidence_score,\n            last_updated: record.calculation_timestamp\n          }\n        })\n        .filter(Boolean)\n        .sort((a, b) => b!.safety_score - a!.safety_score) // Sort by safety score descending\n\n      // Cache result\n      this.requestCache.set(cacheKey, {\n        data: results,\n        timestamp: Date.now(),\n        expires: Date.now() + this.CACHE_DURATION\n      })\n\n      return {\n        success: true,\n        data: results as any,\n        timestamp: new Date().toISOString(),\n        cache_hit: false\n      }\n\n    } catch (error) {\n      console.error('Restaurants by safety level API error:', error)\n      return {\n        success: false,\n        error: error instanceof Error ? error.message : 'Unknown error',\n        timestamp: new Date().toISOString()\n      }\n    }\n  }\n\n  /**\n   * Get safety statistics for area or restriction type\n   */\n  async getSafetyStatistics(\n    filters?: {\n      restriction_id?: string\n      safety_level?: SafetyLevel\n      latitude?: number\n      longitude?: number\n      radius_km?: number\n      days_back?: number\n    }\n  ): Promise<SafetyAPIResponse<{\n    total_assessments: number\n    average_safety_score: number\n    average_confidence_score: number\n    safety_level_distribution: Record<SafetyLevel, number>\n    expert_verified_percentage: number\n    data_freshness_average_days: number\n    trend_direction: 'improving' | 'declining' | 'stable'\n  }>> {\n    const cacheKey = `safety_statistics_${JSON.stringify(filters || {})}`\n\n    try {\n      // Check cache\n      if (this.requestCache.has(cacheKey)) {\n        const cached = this.requestCache.get(cacheKey)!\n        if (Date.now() < cached.expires) {\n          return {\n            success: true,\n            data: cached.data,\n            timestamp: new Date().toISOString(),\n            cache_hit: true\n          }\n        }\n      }\n\n      // Build query with filters\n      let query = supabase\n        .from('restaurant_safety_scores')\n        .select('*')\n\n      if (filters?.restriction_id) {\n        query = query.eq('restriction_id', filters.restriction_id)\n      }\n\n      if (filters?.safety_level) {\n        query = query.eq('safety_level', filters.safety_level)\n      }\n\n      if (filters?.days_back) {\n        const cutoffDate = new Date()\n        cutoffDate.setDate(cutoffDate.getDate() - filters.days_back)\n        query = query.gte('calculation_timestamp', cutoffDate.toISOString())\n      }\n\n      const { data } = await query\n\n      if (!data || data.length === 0) {\n        return {\n          success: true,\n          data: {\n            total_assessments: 0,\n            average_safety_score: 0,\n            average_confidence_score: 0,\n            safety_level_distribution: { safe: 0, caution: 0, warning: 0, danger: 0 },\n            expert_verified_percentage: 0,\n            data_freshness_average_days: 0,\n            trend_direction: 'stable' as const\n          },\n          timestamp: new Date().toISOString(),\n          cache_hit: false\n        }\n      }\n\n      // Calculate statistics\n      const totalAssessments = data.length\n      const averageSafetyScore = data.reduce((sum, r) => sum + r.overall_safety_score, 0) / totalAssessments\n      const averageConfidenceScore = data.reduce((sum, r) => sum + r.confidence_score, 0) / totalAssessments\n\n      const safetyLevelDistribution: Record<SafetyLevel, number> = {\n        safe: 0,\n        caution: 0,\n        warning: 0,\n        danger: 0\n      }\n\n      let expertVerifiedCount = 0\n      let totalDataFreshness = 0\n\n      data.forEach(record => {\n        safetyLevelDistribution[record.safety_level]++\n        \n        if (record.data_sources && (record.data_sources as any).expert_assessments_count > 0) {\n          expertVerifiedCount++\n        }\n        \n        totalDataFreshness += (record.data_sources as any)?.data_freshness_days || 0\n      })\n\n      const expertVerifiedPercentage = (expertVerifiedCount / totalAssessments) * 100\n      const averageDataFreshness = totalDataFreshness / totalAssessments\n\n      // Calculate trend direction (simplified)\n      let trendDirection: 'improving' | 'declining' | 'stable' = 'stable'\n      if (data.length >= 10) {\n        const recent = data.slice(-5)\n        const older = data.slice(0, 5)\n        const recentAvg = recent.reduce((sum, r) => sum + r.overall_safety_score, 0) / recent.length\n        const olderAvg = older.reduce((sum, r) => sum + r.overall_safety_score, 0) / older.length\n        \n        if (recentAvg > olderAvg + 2) trendDirection = 'improving'\n        else if (recentAvg < olderAvg - 2) trendDirection = 'declining'\n      }\n\n      const statistics = {\n        total_assessments: totalAssessments,\n        average_safety_score: Math.round(averageSafetyScore * 10) / 10,\n        average_confidence_score: Math.round(averageConfidenceScore * 10) / 10,\n        safety_level_distribution: safetyLevelDistribution,\n        expert_verified_percentage: Math.round(expertVerifiedPercentage * 10) / 10,\n        data_freshness_average_days: Math.round(averageDataFreshness),\n        trend_direction: trendDirection\n      }\n\n      // Cache result for longer period\n      this.requestCache.set(cacheKey, {\n        data: statistics,\n        timestamp: Date.now(),\n        expires: Date.now() + (this.CACHE_DURATION * 6) // 30 minutes\n      })\n\n      return {\n        success: true,\n        data: statistics,\n        timestamp: new Date().toISOString(),\n        cache_hit: false\n      }\n\n    } catch (error) {\n      console.error('Safety statistics API error:', error)\n      return {\n        success: false,\n        error: error instanceof Error ? error.message : 'Unknown error',\n        timestamp: new Date().toISOString()\n      }\n    }\n  }\n\n  /**\n   * Force refresh safety assessment (admin function)\n   */\n  async forceRefreshAssessment(\n    restaurantId: string,\n    restrictionId?: string\n  ): Promise<SafetyAPIResponse<SafetyAssessmentResult>> {\n    try {\n      // Clear caches first\n      this.clearRestaurantCache(restaurantId)\n      await SafetyAssessmentService.invalidateRestaurantCache(restaurantId)\n\n      // Recalculate assessment\n      const assessment = await SafetyAssessmentService.calculateSafetyAssessment(\n        restaurantId,\n        restrictionId || null,\n        true // Force recalculation\n      )\n\n      return {\n        success: true,\n        data: assessment,\n        timestamp: new Date().toISOString(),\n        cache_hit: false\n      }\n\n    } catch (error) {\n      console.error('Force refresh assessment API error:', error)\n      return {\n        success: false,\n        error: error instanceof Error ? error.message : 'Unknown error',\n        timestamp: new Date().toISOString()\n      }\n    }\n  }\n\n  /**\n   * Bulk refresh assessments (background job endpoint)\n   */\n  async bulkRefreshAssessments(\n    restaurantIds: string[],\n    restrictionIds?: string[]\n  ): Promise<SafetyAPIResponse<{\n    success_count: number\n    error_count: number\n    errors: Array<{ restaurant_id: string; restriction_id: string | null; error: string }>\n  }>> {\n    try {\n      const result = await SafetyAssessmentService.bulkRecalculateAssessments(\n        restaurantIds,\n        restrictionIds || []\n      )\n\n      // Clear related caches\n      restaurantIds.forEach(id => this.clearRestaurantCache(id))\n\n      return {\n        success: true,\n        data: result,\n        timestamp: new Date().toISOString(),\n        cache_hit: false\n      }\n\n    } catch (error) {\n      console.error('Bulk refresh assessments API error:', error)\n      return {\n        success: false,\n        error: error instanceof Error ? error.message : 'Unknown error',\n        timestamp: new Date().toISOString()\n      }\n    }\n  }\n\n  /**\n   * Helper method to calculate distance between two points\n   */\n  private calculateDistance(\n    lat1: number,\n    lon1: number,\n    lat2: number,\n    lon2: number\n  ): number {\n    const R = 6371 // Earth's radius in kilometers\n    const dLat = (lat2 - lat1) * Math.PI / 180\n    const dLon = (lon2 - lon1) * Math.PI / 180\n    const a = \n      Math.sin(dLat/2) * Math.sin(dLat/2) +\n      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * \n      Math.sin(dLon/2) * Math.sin(dLon/2)\n    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))\n    return R * c\n  }\n\n  /**\n   * Clear restaurant-specific cache entries\n   */\n  private clearRestaurantCache(restaurantId: string): void {\n    const keysToDelete = Array.from(this.requestCache.keys())\n      .filter(key => key.includes(restaurantId))\n    \n    keysToDelete.forEach(key => this.requestCache.delete(key))\n  }\n\n  /**\n   * Clear all API cache\n   */\n  clearCache(): void {\n    this.requestCache.clear()\n  }\n\n  /**\n   * Get cache statistics\n   */\n  getCacheStats(): {\n    total_entries: number\n    cache_size_mb: number\n    hit_rate: number\n    oldest_entry_age_minutes: number\n  } {\n    const entries = Array.from(this.requestCache.values())\n    const now = Date.now()\n    \n    let totalSize = 0\n    let oldestEntry = now\n    \n    entries.forEach(entry => {\n      totalSize += JSON.stringify(entry.data).length\n      if (entry.timestamp < oldestEntry) {\n        oldestEntry = entry.timestamp\n      }\n    })\n\n    const sizeMB = totalSize / (1024 * 1024)\n    const oldestAgeMinutes = (now - oldestEntry) / (1000 * 60)\n\n    return {\n      total_entries: entries.length,\n      cache_size_mb: Math.round(sizeMB * 100) / 100,\n      hit_rate: 0, // Would need to track hits vs misses\n      oldest_entry_age_minutes: Math.round(oldestAgeMinutes)\n    }\n  }\n}\n\nexport default SafetyAssessmentAPI.getInstance()