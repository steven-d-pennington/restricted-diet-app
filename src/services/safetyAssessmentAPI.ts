// Simplified Safety Assessment API for testing
// Full implementation temporarily disabled due to Unicode escape sequence issues

export interface SafetyAPIResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
  cache_hit?: boolean
}

export interface SafetyAssessmentResult {
  overall_safety_score: number
  safety_level: 'safe' | 'caution' | 'warning' | 'danger'
  confidence_score: number
  critical_warnings: string[]
  expert_verified: boolean
  data_freshness_days: number
}

// Minimal overview type used by UI components
export interface RestaurantSafetyOverview {
  restaurant_id: string
  overall_safety_score: number
  safety_level: 'safe' | 'caution' | 'warning' | 'danger'
  confidence_score: number
  last_updated: string
  restriction_specific_scores: Array<{
    restriction_id: string
    restriction_name: string
    safety_score: number
    safety_level: 'safe' | 'caution' | 'warning' | 'danger'
    confidence_score: number
  }>
  critical_warnings: string[]
  data_freshness_days: number
  expert_verified: boolean
}

class SafetyAssessmentAPI {
  private static instance: SafetyAssessmentAPI
  
  static getInstance(): SafetyAssessmentAPI {
    if (!SafetyAssessmentAPI.instance) {
      SafetyAssessmentAPI.instance = new SafetyAssessmentAPI()
    }
    return SafetyAssessmentAPI.instance
  }

  async getRestaurantSafetyAssessment(
    restaurantId: string,
    userId?: string
  ): Promise<SafetyAPIResponse<RestaurantSafetyOverview>> {
    // Mock implementation for testing
    const now = new Date().toISOString()
    const base: SafetyAssessmentResult = {
      overall_safety_score: 85,
      safety_level: 'safe',
      confidence_score: 92,
      critical_warnings: [],
      expert_verified: true,
      data_freshness_days: 7
    }

    const overview: RestaurantSafetyOverview = {
      restaurant_id: restaurantId,
      overall_safety_score: base.overall_safety_score,
      safety_level: base.safety_level,
      confidence_score: base.confidence_score,
      last_updated: now,
      restriction_specific_scores: [],
      critical_warnings: base.critical_warnings,
      data_freshness_days: base.data_freshness_days,
      expert_verified: base.expert_verified
    }

    return {
      success: true,
      data: overview,
      timestamp: now,
      cache_hit: false
    }
  }

  // Stubbed method: returns a simplified per-restriction assessment
  async getRestrictionSpecificSafety(
    restaurantId: string,
    restrictionId: string
  ): Promise<SafetyAPIResponse<SafetyAssessmentResult>> {
    const now = new Date().toISOString()
    const result: SafetyAssessmentResult = {
      overall_safety_score: 80,
      safety_level: 'safe',
      confidence_score: 85,
      critical_warnings: [],
      expert_verified: true,
      data_freshness_days: 5
    }
    return { success: true, data: result, timestamp: now, cache_hit: false }
  }

  // Stubbed method: mimic a refresh and return an assessment
  async forceRefreshAssessment(
    restaurantId: string,
    restrictionId?: string
  ): Promise<SafetyAPIResponse<SafetyAssessmentResult>> {
    return this.getRestrictionSpecificSafety(restaurantId, restrictionId || '')
  }
}

export default SafetyAssessmentAPI.getInstance()