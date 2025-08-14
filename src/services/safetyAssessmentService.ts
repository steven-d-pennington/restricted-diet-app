/**
 * Safety Assessment Service
 * 
 * SAFETY CRITICAL: Provides comprehensive restaurant safety scoring and assessment
 * Implements multi-factor analysis to prevent life-threatening allergic reactions
 */

import { supabase } from '../lib/supabase'
import {
  SafetyLevel,
  RestrictionSeverity,
  DietaryRestriction,
  RestaurantSafetyProtocol,
  IncidentSeverity,
  Json
} from '../types/database.types'

export interface SafetyAssessmentResult {
  restaurant_id: string
  restriction_id: string | null // null for overall assessment
  overall_safety_score: number // 0-100
  confidence_score: number // 0-100
  safety_level: SafetyLevel
  score_breakdown: SafetyScoreBreakdown
  data_sources: SafetyDataSources
  expert_override: boolean
  last_calculation: string
  expires_at: string
  recommendations: SafetyRecommendation[]
}

export interface SafetyScoreBreakdown {
  staff_training_score: number
  kitchen_protocols_score: number
  equipment_safety_score: number
  cross_contamination_prevention_score: number
  ingredient_tracking_score: number
  emergency_preparedness_score: number
  incident_history_impact: number
  health_department_score: number
  certification_score: number
  community_verification_score: number
  expert_assessment_score: number
  raw_total_score: number
  severity_adjusted_score: number
  confidence_weighted_score: number
}

export interface SafetyDataSources {
  safety_protocols_count: number
  expert_assessments_count: number
  community_verifications_count: number
  health_inspections_count: number
  certifications_count: number
  incident_reports_count: number
  review_safety_assessments_count: number
  data_freshness_days: number
  last_expert_assessment_date: string | null
  last_incident_date: string | null
}

export interface SafetyRecommendation {
  category: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
  impact_on_score: number
  implementation_complexity: 'easy' | 'moderate' | 'complex'
  estimated_timeline: string
}

export interface IncidentImpactFactor {
  severity: IncidentSeverity
  restriction_ids: string[]
  impact_score: number
  duration_months: number
  mitigation_factor: number
  restaurant_response_quality: number
}

export interface ExpertAssessmentSummary {
  assessment_count: number
  average_score: number
  latest_assessment_date: string
  expert_confidence: number
  assessment_validity: boolean
}

export interface CommunityVerificationSummary {
  verification_count: number
  average_confidence: number
  latest_verification_date: string
  consensus_score: number
  verification_types: string[]
}

class SafetyAssessmentService {
  private static instance: SafetyAssessmentService
  private assessmentCache: Map<string, SafetyAssessmentResult> = new Map()
  private scoringWeights: Map<string, any> = new Map()
  private lastWeightsUpdate: Date | null = null

  static getInstance(): SafetyAssessmentService {
    if (!SafetyAssessmentService.instance) {
      SafetyAssessmentService.instance = new SafetyAssessmentService()
    }
    return SafetyAssessmentService.instance
  }

  /**
   * Calculate comprehensive safety assessment for a restaurant and specific restriction
   */
  async calculateSafetyAssessment(
    restaurantId: string,
    restrictionId: string | null = null,
    forceRecalculation: boolean = false
  ): Promise<SafetyAssessmentResult> {
    try {
      const cacheKey = `${restaurantId}_${restrictionId || 'overall'}`
      
      // Check cache first
      if (!forceRecalculation && this.assessmentCache.has(cacheKey)) {
        const cached = this.assessmentCache.get(cacheKey)!
        if (new Date(cached.expires_at) > new Date()) {
          return cached
        }
      }

      // Check for existing cached assessment in database
      if (!forceRecalculation) {
        const { data: existingAssessment } = await supabase
          .from('restaurant_safety_scores')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('restriction_id', restrictionId)
          .single()

        if (existingAssessment && new Date(existingAssessment.expires_at) > new Date()) {
          const result = this.parseDbAssessment(existingAssessment)
          this.assessmentCache.set(cacheKey, result)
          return result
        }
      }

      // Load scoring weights if needed
      await this.loadScoringWeights()

      // Get restriction details for severity-based scoring
      let restriction: DietaryRestriction | null = null
      if (restrictionId) {
        const { data } = await supabase
          .from('dietary_restrictions')
          .select('*')
          .eq('id', restrictionId)
          .single()
        restriction = data
      }

      // Gather all data sources for assessment
      const [
        safetyProtocols,
        expertAssessments,
        communityVerifications,
        healthInspections,
        certifications,
        incidentReports,
        reviewSafetyAssessments
      ] = await Promise.all([
        this.getSafetyProtocols(restaurantId, restrictionId),
        this.getExpertAssessments(restaurantId, restrictionId),
        this.getCommunityVerifications(restaurantId, restrictionId),
        this.getHealthInspections(restaurantId),
        this.getCertifications(restaurantId, restrictionId),
        this.getIncidentReports(restaurantId, restrictionId),
        this.getReviewSafetyAssessments(restaurantId, restrictionId)
      ])

      // Calculate individual component scores
      const scoreBreakdown = await this.calculateScoreBreakdown({
        safetyProtocols,
        expertAssessments,
        communityVerifications,
        healthInspections,
        certifications,
        incidentReports,
        reviewSafetyAssessments,
        restriction
      })

      // Apply severity-based adjustments
      const severityAdjustedScore = this.applySeverityAdjustments(
        scoreBreakdown,
        restriction?.medical_severity_default || 'mild'
      )

      // Calculate confidence score based on data quality and quantity
      const confidenceScore = this.calculateConfidenceScore({
        safetyProtocols,
        expertAssessments,
        communityVerifications,
        healthInspections,
        certifications,
        incidentReports,
        reviewSafetyAssessments
      })

      // Apply confidence weighting
      const finalScore = Math.round(severityAdjustedScore * (confidenceScore / 100))

      // Determine safety level
      const safetyLevel = this.determineSafetyLevel(finalScore, confidenceScore, restriction)

      // Generate data sources summary
      const dataSources = this.generateDataSourcesSummary({
        safetyProtocols,
        expertAssessments,
        communityVerifications,
        healthInspections,
        certifications,
        incidentReports,
        reviewSafetyAssessments
      })

      // Generate recommendations
      const recommendations = this.generateRecommendations(scoreBreakdown, restriction)

      // Check for expert overrides
      const expertOverride = await this.checkExpertOverride(restaurantId, restrictionId)

      const result: SafetyAssessmentResult = {
        restaurant_id: restaurantId,
        restriction_id: restrictionId,
        overall_safety_score: finalScore,
        confidence_score: confidenceScore,
        safety_level: safetyLevel,
        score_breakdown: {
          ...scoreBreakdown,
          severity_adjusted_score: severityAdjustedScore,
          confidence_weighted_score: finalScore
        },
        data_sources: dataSources,
        expert_override: expertOverride.hasOverride,
        last_calculation: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        recommendations
      }

      // Cache the result
      await this.cacheAssessmentResult(result)
      this.assessmentCache.set(cacheKey, result)

      return result

    } catch (error) {
      console.error('Safety assessment calculation error:', error)
      
      // Return conservative fallback assessment
      return this.getConservativeFallbackAssessment(restaurantId, restrictionId)
    }
  }

  /**
   * Calculate safety assessments for multiple restrictions
   */
  async calculateMultipleRestrictionsAssessment(
    restaurantId: string,
    restrictionIds: string[]
  ): Promise<SafetyAssessmentResult[]> {
    try {
      const assessments = await Promise.all(
        restrictionIds.map(id => this.calculateSafetyAssessment(restaurantId, id))
      )

      return assessments
    } catch (error) {
      console.error('Multiple restrictions assessment error:', error)
      return []
    }
  }

  /**
   * Get safety assessment with user-specific restrictions
   */
  async getUserSpecificSafetyAssessment(
    restaurantId: string,
    userId: string
  ): Promise<{
    overall_assessment: SafetyAssessmentResult
    restriction_assessments: SafetyAssessmentResult[]
    combined_safety_level: SafetyLevel
    critical_warnings: string[]
  }> {
    try {
      // Get user's active restrictions
      const { data: userRestrictions } = await supabase
        .from('user_restrictions')
        .select(`
          restriction_id,
          severity,
          dietary_restrictions (
            id,
            name,
            category,
            medical_severity_default
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)

      if (!userRestrictions || userRestrictions.length === 0) {
        return {
          overall_assessment: await this.calculateSafetyAssessment(restaurantId),
          restriction_assessments: [],
          combined_safety_level: 'safe',
          critical_warnings: []
        }
      }

      // Calculate assessments for each restriction
      const restrictionAssessments = await Promise.all(
        userRestrictions.map(ur => 
          this.calculateSafetyAssessment(restaurantId, ur.restriction_id)
        )
      )

      // Calculate overall assessment
      const overallAssessment = await this.calculateSafetyAssessment(restaurantId)

      // Determine combined safety level (most restrictive)
      const combinedSafetyLevel = this.determineCombinedSafetyLevel(restrictionAssessments)

      // Generate critical warnings
      const criticalWarnings = this.generateCriticalWarnings(
        restrictionAssessments,
        userRestrictions
      )

      return {
        overall_assessment: overallAssessment,
        restriction_assessments: restrictionAssessments,
        combined_safety_level: combinedSafetyLevel,
        critical_warnings: criticalWarnings
      }

    } catch (error) {
      console.error('User-specific safety assessment error:', error)
      
      // Return conservative assessment
      return {
        overall_assessment: this.getConservativeFallbackAssessment(restaurantId, null),
        restriction_assessments: [],
        combined_safety_level: 'danger',
        critical_warnings: ['Unable to calculate safety assessment. Please exercise extreme caution.']
      }
    }
  }

  /**
   * Bulk recalculate safety assessments (for background processing)
   */
  async bulkRecalculateAssessments(
    restaurantIds: string[],
    restrictionIds: string[] = []
  ): Promise<{
    success_count: number
    error_count: number
    errors: Array<{ restaurant_id: string, restriction_id: string | null, error: string }>
  }> {
    let successCount = 0
    let errorCount = 0
    const errors: Array<{ restaurant_id: string, restriction_id: string | null, error: string }> = []

    for (const restaurantId of restaurantIds) {
      try {
        // Calculate overall assessment
        await this.calculateSafetyAssessment(restaurantId, null, true)
        successCount++

        // Calculate restriction-specific assessments
        for (const restrictionId of restrictionIds) {
          try {
            await this.calculateSafetyAssessment(restaurantId, restrictionId, true)
            successCount++
          } catch (error: any) {
            errorCount++
            errors.push({
              restaurant_id: restaurantId,
              restriction_id: restrictionId,
              error: error.message
            })
          }
        }

      } catch (error: any) {
        errorCount++
        errors.push({
          restaurant_id: restaurantId,
          restriction_id: null,
          error: error.message
        })
      }

      // Add small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return { success_count: successCount, error_count: errorCount, errors }
  }

  /**
   * Private helper methods
   */

  private async loadScoringWeights(): Promise<void> {
    try {
      // Load weights every hour or on first access
      if (this.lastWeightsUpdate && 
          Date.now() - this.lastWeightsUpdate.getTime() < 60 * 60 * 1000) {
        return
      }

      const { data: weights } = await supabase
        .from('safety_scoring_weights')
        .select('*')
        .eq('is_active', true)

      if (weights) {
        this.scoringWeights.clear()
        weights.forEach(weight => {
          this.scoringWeights.set(weight.weight_category, weight)
        })
        this.lastWeightsUpdate = new Date()
      }
    } catch (error) {
      console.error('Failed to load scoring weights:', error)
    }
  }

  private async getSafetyProtocols(
    restaurantId: string,
    restrictionId: string | null
  ): Promise<RestaurantSafetyProtocol[]> {
    let query = supabase
      .from('restaurant_safety_protocols')
      .select('*')
      .eq('restaurant_id', restaurantId)

    if (restrictionId) {
      query = query.eq('restriction_id', restrictionId)
    }

    const { data } = await query
    return data || []
  }

  private async getExpertAssessments(
    restaurantId: string,
    restrictionId: string | null
  ): Promise<any[]> {
    let query = supabase
      .from('expert_safety_assessments')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_published', true)

    if (restrictionId) {
      query = query.contains('restrictions_assessed', [restrictionId])
    }

    const { data } = await query
    return data || []
  }

  private async getCommunityVerifications(
    restaurantId: string,
    restrictionId: string | null
  ): Promise<any[]> {
    let query = supabase
      .from('community_safety_verifications')
      .select('*')
      .eq('restaurant_id', restaurantId)

    if (restrictionId) {
      query = query.contains('restriction_ids', [restrictionId])
    }

    const { data } = await query
    return data || []
  }

  private async getHealthInspections(restaurantId: string): Promise<any[]> {
    const { data } = await supabase
      .from('restaurant_health_ratings')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_current', true)
      .order('inspection_date', { ascending: false })
      .limit(5)

    return data || []
  }

  private async getCertifications(
    restaurantId: string,
    restrictionId: string | null
  ): Promise<any[]> {
    let query = supabase
      .from('restaurant_certifications')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .gte('expiry_date', new Date().toISOString().split('T')[0])

    if (restrictionId) {
      // Get restriction name to match against certification scope
      const { data: restriction } = await supabase
        .from('dietary_restrictions')
        .select('name')
        .eq('id', restrictionId)
        .single()

      if (restriction) {
        query = query.contains('scope_of_certification', [restriction.name.toLowerCase()])
      }
    }

    const { data } = await query
    return data || []
  }

  private async getIncidentReports(
    restaurantId: string,
    restrictionId: string | null
  ): Promise<any[]> {
    let query = supabase
      .from('safety_incidents')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .gte('incident_date', new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString()) // Last 2 years

    if (restrictionId) {
      query = query.contains('restriction_ids', [restrictionId])
    }

    const { data } = await query
    return data || []
  }

  private async getReviewSafetyAssessments(
    restaurantId: string,
    restrictionId: string | null
  ): Promise<any[]> {
    let query = supabase
      .from('review_safety_assessments')
      .select(`
        *,
        restaurant_reviews!inner (
          restaurant_id,
          created_at
        )
      `)
      .eq('restaurant_reviews.restaurant_id', restaurantId)

    if (restrictionId) {
      query = query.eq('restriction_id', restrictionId)
    }

    const { data } = await query
    return data || []
  }

  private async calculateScoreBreakdown(data: {
    safetyProtocols: any[]
    expertAssessments: any[]
    communityVerifications: any[]
    healthInspections: any[]
    certifications: any[]
    incidentReports: any[]
    reviewSafetyAssessments: any[]
    restriction: DietaryRestriction | null
  }): Promise<SafetyScoreBreakdown> {
    // Implementation of detailed scoring algorithm
    // This is a simplified version - the actual algorithm would be much more complex
    
    const staffTrainingScore = this.calculateStaffTrainingScore(data.safetyProtocols, data.expertAssessments)
    const kitchenProtocolsScore = this.calculateKitchenProtocolsScore(data.safetyProtocols, data.expertAssessments)
    const equipmentSafetyScore = this.calculateEquipmentSafetyScore(data.safetyProtocols, data.expertAssessments)
    const crossContaminationScore = this.calculateCrossContaminationScore(data.safetyProtocols, data.expertAssessments)
    const ingredientTrackingScore = this.calculateIngredientTrackingScore(data.safetyProtocols, data.expertAssessments)
    const emergencyPreparednessScore = this.calculateEmergencyPreparednessScore(data.safetyProtocols, data.expertAssessments)
    const incidentHistoryImpact = this.calculateIncidentHistoryImpact(data.incidentReports)
    const healthDepartmentScore = this.calculateHealthDepartmentScore(data.healthInspections)
    const certificationScore = this.calculateCertificationScore(data.certifications)
    const communityVerificationScore = this.calculateCommunityVerificationScore(data.communityVerifications)
    const expertAssessmentScore = this.calculateExpertAssessmentScore(data.expertAssessments)

    const rawTotalScore = 
      staffTrainingScore +
      kitchenProtocolsScore +
      equipmentSafetyScore +
      crossContaminationScore +
      ingredientTrackingScore +
      emergencyPreparednessScore +
      incidentHistoryImpact +
      healthDepartmentScore +
      certificationScore +
      communityVerificationScore +
      expertAssessmentScore

    return {
      staff_training_score: staffTrainingScore,
      kitchen_protocols_score: kitchenProtocolsScore,
      equipment_safety_score: equipmentSafetyScore,
      cross_contamination_prevention_score: crossContaminationScore,
      ingredient_tracking_score: ingredientTrackingScore,
      emergency_preparedness_score: emergencyPreparednessScore,
      incident_history_impact: incidentHistoryImpact,
      health_department_score: healthDepartmentScore,
      certification_score: certificationScore,
      community_verification_score: communityVerificationScore,
      expert_assessment_score: expertAssessmentScore,
      raw_total_score: Math.max(0, Math.min(100, rawTotalScore)),
      severity_adjusted_score: 0, // Will be calculated later
      confidence_weighted_score: 0 // Will be calculated later
    }
  }

  private calculateStaffTrainingScore(protocols: any[], expertAssessments: any[]): number {
    const weight = this.scoringWeights.get('staff_training_certification')?.base_weight || 25
    
    if (protocols.length === 0) return 0
    
    let score = 0
    let validProtocols = 0

    protocols.forEach(protocol => {
      if (protocol.has_staff_training) {
        score += 20
        
        if (protocol.staff_training_frequency) {
          switch (protocol.staff_training_frequency) {
            case 'monthly': score += 5; break
            case 'quarterly': score += 3; break
            case 'annually': score += 1; break
          }
        }

        if (protocol.last_training_date) {
          const daysSinceTraining = (Date.now() - new Date(protocol.last_training_date).getTime()) / (1000 * 60 * 60 * 24)
          if (daysSinceTraining <= 90) score += 5
          else if (daysSinceTraining <= 180) score += 3
          else if (daysSinceTraining <= 365) score += 1
        }

        validProtocols++
      }
    })

    // Factor in expert assessments
    expertAssessments.forEach(assessment => {
      if (assessment.staff_training_score) {
        score += assessment.staff_training_score * 0.3 // 30% weight from expert
      }
    })

    const averageScore = validProtocols > 0 ? score / validProtocols : 0
    return Math.min(weight, (averageScore / 30) * weight) // Normalize to weight
  }

  private calculateKitchenProtocolsScore(protocols: any[], expertAssessments: any[]): number {
    const weight = this.scoringWeights.get('dedicated_preparation_areas')?.base_weight || 20
    
    if (protocols.length === 0) return 0
    
    let score = 0
    protocols.forEach(protocol => {
      if (protocol.has_dedicated_prep_area) score += 8
      if (protocol.has_dedicated_equipment) score += 7
      if (protocol.has_dedicated_fryer) score += 5
    })

    expertAssessments.forEach(assessment => {
      if (assessment.kitchen_protocols_score) {
        score += assessment.kitchen_protocols_score * 0.2
      }
    })

    return Math.min(weight, (score / 20) * weight)
  }

  private calculateEquipmentSafetyScore(protocols: any[], expertAssessments: any[]): number {
    const weight = 15 // Base weight for equipment safety
    
    let score = 0
    protocols.forEach(protocol => {
      if (protocol.has_dedicated_equipment) score += 10
      if (protocol.has_cross_contamination_protocols) score += 5
    })

    expertAssessments.forEach(assessment => {
      if (assessment.equipment_safety_score) {
        score += assessment.equipment_safety_score * 0.15
      }
    })

    return Math.min(weight, score)
  }

  private calculateCrossContaminationScore(protocols: any[], expertAssessments: any[]): number {
    const weight = this.scoringWeights.get('cross_contamination_protocols')?.base_weight || 20
    
    let score = 0
    protocols.forEach(protocol => {
      if (protocol.has_cross_contamination_protocols) score += 15
      if (protocol.protocol_description?.toLowerCase().includes('cross contamination')) score += 5
    })

    expertAssessments.forEach(assessment => {
      if (assessment.cross_contamination_prevention_score) {
        score += assessment.cross_contamination_prevention_score * 0.2
      }
    })

    return Math.min(weight, score)
  }

  private calculateIngredientTrackingScore(protocols: any[], expertAssessments: any[]): number {
    const weight = this.scoringWeights.get('ingredient_tracking_systems')?.base_weight || 15
    
    let score = 0
    protocols.forEach(protocol => {
      if (protocol.has_ingredient_tracking) score += 10
      if (protocol.supplier_verification) score += 5
    })

    expertAssessments.forEach(assessment => {
      if (assessment.ingredient_sourcing_score) {
        score += assessment.ingredient_sourcing_score * 0.15
      }
    })

    return Math.min(weight, score)
  }

  private calculateEmergencyPreparednessScore(protocols: any[], expertAssessments: any[]): number {
    const weight = this.scoringWeights.get('emergency_response_preparedness')?.base_weight || 10
    
    let score = 0
    protocols.forEach(protocol => {
      if (protocol.emergency_procedures) score += 5
      if (protocol.incident_response_plan) score += 5
    })

    expertAssessments.forEach(assessment => {
      if (assessment.emergency_preparedness_score) {
        score += assessment.emergency_preparedness_score * 0.1
      }
    })

    return Math.min(weight, score)
  }

  private calculateIncidentHistoryImpact(incidents: any[]): number {
    if (incidents.length === 0) return 0

    let impact = 0
    const weight = Math.abs(this.scoringWeights.get('incident_history_impact')?.base_weight || -2)

    incidents.forEach(incident => {
      let incidentImpact = 0
      
      switch (incident.severity) {
        case 'critical': incidentImpact = -10; break
        case 'severe': incidentImpact = -6; break
        case 'moderate': incidentImpact = -3; break
        case 'minor': incidentImpact = -1; break
      }

      // Reduce impact over time
      const daysSinceIncident = (Date.now() - new Date(incident.incident_date).getTime()) / (1000 * 60 * 60 * 24)
      const timeFactor = Math.max(0.1, 1 - (daysSinceIncident / 730)) // 2 years full impact decay

      impact += incidentImpact * timeFactor
    })

    return Math.max(-weight, impact)
  }

  private calculateHealthDepartmentScore(inspections: any[]): number {
    const weight = this.scoringWeights.get('health_department_compliance')?.base_weight || 5
    
    if (inspections.length === 0) return 0

    let score = 0
    inspections.forEach(inspection => {
      if (inspection.rating_score) {
        score += (inspection.rating_score / 100) * 5
      } else if (inspection.rating_grade) {
        switch (inspection.rating_grade.toUpperCase()) {
          case 'A': score += 5; break
          case 'B': score += 3; break
          case 'C': score += 1; break
          default: score += 0; break
        }
      }

      // Penalize violations
      score -= (inspection.critical_violations_count || 0) * 0.5
      score -= (inspection.allergen_violations_count || 0) * 1
    })

    return Math.max(0, Math.min(weight, score / inspections.length))
  }

  private calculateCertificationScore(certifications: any[]): number {
    const weight = this.scoringWeights.get('third_party_certifications')?.base_weight || 3
    
    if (certifications.length === 0) return 0

    let score = 0
    certifications.forEach(cert => {
      switch (cert.certification_type.toLowerCase()) {
        case 'allergen_safe':
        case 'gluten_free_certified':
          score += 1.5
          break
        case 'haccp':
        case 'servsafe':
          score += 1
          break
        default:
          score += 0.5
          break
      }
    })

    return Math.min(weight, score)
  }

  private calculateCommunityVerificationScore(verifications: any[]): number {
    if (verifications.length === 0) return 0

    let score = 0
    let totalConfidence = 0

    verifications.forEach(verification => {
      const confidence = verification.confidence_in_verification || 50
      const weight = confidence / 100

      score += (verification.knowledge_score || 50) * weight * 0.1
      score += (verification.protocol_compliance_score || 50) * weight * 0.1
      totalConfidence += confidence
    })

    const avgConfidence = totalConfidence / verifications.length
    return (score / verifications.length) * (avgConfidence / 100) * 5 // Max 5 points
  }

  private calculateExpertAssessmentScore(assessments: any[]): number {
    if (assessments.length === 0) return 0

    let totalScore = 0
    let totalWeight = 0

    assessments.forEach(assessment => {
      const confidence = assessment.confidence_level || 50
      const weight = confidence / 100
      const score = assessment.overall_assessment_score || 50

      totalScore += score * weight
      totalWeight += weight
    })

    const weightedAverage = totalWeight > 0 ? totalScore / totalWeight : 0
    return (weightedAverage / 100) * 10 // Max 10 points
  }

  private applySeverityAdjustments(
    scoreBreakdown: SafetyScoreBreakdown,
    severity: RestrictionSeverity
  ): number {
    const multipliers: Record<RestrictionSeverity, number> = {
      mild: 1.0,
      moderate: 1.2,
      severe: 1.5,
      life_threatening: 2.0
    }

    const multiplier = multipliers[severity]
    let adjustedScore = scoreBreakdown.raw_total_score

    // Apply stricter standards for more severe restrictions
    if (severity === 'life_threatening') {
      // Life-threatening restrictions require higher standards
      adjustedScore = Math.max(0, adjustedScore - 20) // Reduce by 20 points as baseline
      
      // Heavy penalty for any incidents
      if (scoreBreakdown.incident_history_impact < 0) {
        adjustedScore += scoreBreakdown.incident_history_impact * 3
      }
    } else if (severity === 'severe') {
      adjustedScore = Math.max(0, adjustedScore - 10)
      
      if (scoreBreakdown.incident_history_impact < 0) {
        adjustedScore += scoreBreakdown.incident_history_impact * 2
      }
    }

    return Math.max(0, Math.min(100, adjustedScore))
  }

  private calculateConfidenceScore(data: {
    safetyProtocols: any[]
    expertAssessments: any[]
    communityVerifications: any[]
    healthInspections: any[]
    certifications: any[]
    incidentReports: any[]
    reviewSafetyAssessments: any[]
  }): number {
    let confidence = 0

    // Data quantity factors
    if (data.expertAssessments.length > 0) confidence += 30
    if (data.safetyProtocols.length > 0) confidence += 20
    if (data.communityVerifications.length >= 3) confidence += 15
    if (data.healthInspections.length > 0) confidence += 10
    if (data.certifications.length > 0) confidence += 10
    if (data.reviewSafetyAssessments.length >= 5) confidence += 10

    // Data freshness factors
    const now = Date.now()
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000)
    const threeMonthsAgo = now - (90 * 24 * 60 * 60 * 1000)

    if (data.expertAssessments.some(a => new Date(a.assessment_date).getTime() > oneMonthAgo)) {
      confidence += 5
    }
    if (data.communityVerifications.some(v => new Date(v.verification_date).getTime() > threeMonthsAgo)) {
      confidence += 5
    }

    // Data quality factors
    const expertConfidenceAvg = data.expertAssessments.reduce((sum, a) => sum + (a.confidence_level || 50), 0) / 
                               Math.max(1, data.expertAssessments.length)
    confidence += (expertConfidenceAvg / 100) * 5

    return Math.min(100, confidence)
  }

  private determineSafetyLevel(
    score: number,
    confidence: number,
    restriction: DietaryRestriction | null
  ): SafetyLevel {
    const isLifeThreatening = restriction?.medical_severity_default === 'life_threatening'
    
    // Conservative thresholds for life-threatening restrictions
    if (isLifeThreatening) {
      if (score >= 90 && confidence >= 80) return 'safe'
      if (score >= 75 && confidence >= 70) return 'caution'
      if (score >= 60) return 'warning'
      return 'danger'
    }

    // Standard thresholds
    if (score >= 80 && confidence >= 60) return 'safe'
    if (score >= 65 && confidence >= 50) return 'caution'
    if (score >= 50) return 'warning'
    return 'danger'
  }

  private determineCombinedSafetyLevel(assessments: SafetyAssessmentResult[]): SafetyLevel {
    if (assessments.some(a => a.safety_level === 'danger')) return 'danger'
    if (assessments.some(a => a.safety_level === 'warning')) return 'warning'
    if (assessments.some(a => a.safety_level === 'caution')) return 'caution'
    return 'safe'
  }

  private generateCriticalWarnings(
    assessments: SafetyAssessmentResult[],
    userRestrictions: any[]
  ): string[] {
    const warnings: string[] = []

    assessments.forEach((assessment, index) => {
      const restriction = userRestrictions[index]?.dietary_restrictions
      
      if (assessment.safety_level === 'danger') {
        warnings.push(
          `CRITICAL: High risk detected for ${restriction?.name}. Strongly recommend avoiding this restaurant.`
        )
      }
      
      if (assessment.safety_level === 'warning' && restriction?.medical_severity_default === 'life_threatening') {
        warnings.push(
          `WARNING: Limited safety data for life-threatening ${restriction?.name} allergy. Exercise extreme caution.`
        )
      }

      if (assessment.confidence_score < 50) {
        warnings.push(
          `NOTICE: Low confidence in safety assessment for ${restriction?.name}. Verification recommended.`
        )
      }
    })

    return warnings
  }

  private generateDataSourcesSummary(data: {
    safetyProtocols: any[]
    expertAssessments: any[]
    communityVerifications: any[]
    healthInspections: any[]
    certifications: any[]
    incidentReports: any[]
    reviewSafetyAssessments: any[]
  }): SafetyDataSources {
    const now = new Date()
    const dataAges = [
      ...data.expertAssessments.map(a => new Date(a.assessment_date)),
      ...data.communityVerifications.map(v => new Date(v.verification_date)),
      ...data.healthInspections.map(i => new Date(i.inspection_date))
    ]

    const latestDataDate = dataAges.length > 0 ? Math.max(...dataAges.map(d => d.getTime())) : now.getTime()
    const dataFreshnessDays = Math.floor((now.getTime() - latestDataDate) / (1000 * 60 * 60 * 24))

    return {
      safety_protocols_count: data.safetyProtocols.length,
      expert_assessments_count: data.expertAssessments.length,
      community_verifications_count: data.communityVerifications.length,
      health_inspections_count: data.healthInspections.length,
      certifications_count: data.certifications.length,
      incident_reports_count: data.incidentReports.length,
      review_safety_assessments_count: data.reviewSafetyAssessments.length,
      data_freshness_days: dataFreshnessDays,
      last_expert_assessment_date: data.expertAssessments.length > 0 ? 
        data.expertAssessments[0].assessment_date : null,
      last_incident_date: data.incidentReports.length > 0 ? 
        data.incidentReports[0].incident_date : null
    }
  }

  private generateRecommendations(
    scoreBreakdown: SafetyScoreBreakdown,
    restriction: DietaryRestriction | null
  ): SafetyRecommendation[] {
    const recommendations: SafetyRecommendation[] = []

    if (scoreBreakdown.staff_training_score < 15) {
      recommendations.push({
        category: 'Staff Training',
        priority: restriction?.medical_severity_default === 'life_threatening' ? 'critical' : 'high',
        recommendation: 'Implement comprehensive allergen training program for all staff',
        impact_on_score: 10,
        implementation_complexity: 'moderate',
        estimated_timeline: '2-4 weeks'
      })
    }

    if (scoreBreakdown.cross_contamination_prevention_score < 15) {
      recommendations.push({
        category: 'Cross-Contamination Prevention',
        priority: 'high',
        recommendation: 'Establish dedicated preparation areas and equipment protocols',
        impact_on_score: 8,
        implementation_complexity: 'complex',
        estimated_timeline: '1-3 months'
      })
    }

    if (scoreBreakdown.emergency_preparedness_score < 8) {
      recommendations.push({
        category: 'Emergency Preparedness',
        priority: restriction?.medical_severity_default === 'life_threatening' ? 'critical' : 'medium',
        recommendation: 'Develop emergency response procedures and train staff',
        impact_on_score: 5,
        implementation_complexity: 'easy',
        estimated_timeline: '1-2 weeks'
      })
    }

    return recommendations
  }

  private async checkExpertOverride(
    restaurantId: string,
    restrictionId: string | null
  ): Promise<{ hasOverride: boolean; reason?: string }> {
    const { data: override } = await supabase
      .from('restaurant_safety_scores')
      .select('expert_override, expert_override_reason')
      .eq('restaurant_id', restaurantId)
      .eq('restriction_id', restrictionId)
      .eq('expert_override', true)
      .single()

    return {
      hasOverride: !!override,
      reason: override?.expert_override_reason
    }
  }

  private parseDbAssessment(dbAssessment: any): SafetyAssessmentResult {
    return {
      restaurant_id: dbAssessment.restaurant_id,
      restriction_id: dbAssessment.restriction_id,
      overall_safety_score: dbAssessment.overall_safety_score,
      confidence_score: dbAssessment.confidence_score,
      safety_level: dbAssessment.safety_level,
      score_breakdown: dbAssessment.score_breakdown,
      data_sources: dbAssessment.data_sources || {},
      expert_override: dbAssessment.expert_override,
      last_calculation: dbAssessment.calculation_timestamp,
      expires_at: dbAssessment.expires_at,
      recommendations: []
    }
  }

  private async cacheAssessmentResult(result: SafetyAssessmentResult): Promise<void> {
    try {
      await supabase
        .from('restaurant_safety_scores')
        .upsert({
          restaurant_id: result.restaurant_id,
          restriction_id: result.restriction_id,
          overall_safety_score: result.overall_safety_score,
          confidence_score: result.confidence_score,
          safety_level: result.safety_level,
          score_breakdown: result.score_breakdown as Json,
          data_sources: result.data_sources as Json,
          calculation_timestamp: result.last_calculation,
          expires_at: result.expires_at,
          expert_override: result.expert_override
        })
    } catch (error) {
      console.error('Failed to cache assessment result:', error)
    }
  }

  private getConservativeFallbackAssessment(
    restaurantId: string,
    restrictionId: string | null
  ): SafetyAssessmentResult {
    return {
      restaurant_id: restaurantId,
      restriction_id: restrictionId,
      overall_safety_score: 30,
      confidence_score: 10,
      safety_level: 'danger',
      score_breakdown: {
        staff_training_score: 0,
        kitchen_protocols_score: 0,
        equipment_safety_score: 0,
        cross_contamination_prevention_score: 0,
        ingredient_tracking_score: 0,
        emergency_preparedness_score: 0,
        incident_history_impact: 0,
        health_department_score: 0,
        certification_score: 0,
        community_verification_score: 0,
        expert_assessment_score: 0,
        raw_total_score: 30,
        severity_adjusted_score: 30,
        confidence_weighted_score: 30
      },
      data_sources: {
        safety_protocols_count: 0,
        expert_assessments_count: 0,
        community_verifications_count: 0,
        health_inspections_count: 0,
        certifications_count: 0,
        incident_reports_count: 0,
        review_safety_assessments_count: 0,
        data_freshness_days: 999,
        last_expert_assessment_date: null,
        last_incident_date: null
      },
      expert_override: false,
      last_calculation: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      recommendations: []
    }
  }

  /**
   * SCORING WEIGHT MANAGEMENT
   */

  /**
   * Update safety scoring weights
   */
  async updateScoringWeight(
    category: string,
    baseWeight: number,
    severityMultiplier: Record<RestrictionSeverity, number>
  ): Promise<void> {
    try {
      await supabase
        .from('safety_scoring_weights')
        .upsert({
          weight_category: category,
          base_weight: baseWeight,
          severity_multiplier: severityMultiplier as Json
        })
      
      // Force reload of weights
      this.lastWeightsUpdate = null
      await this.loadScoringWeights()
    } catch (error) {
      console.error('Failed to update scoring weight:', error)
      throw error
    }
  }

  /**
   * Get current scoring weights
   */
  async getScoringWeights(): Promise<Map<string, any>> {
    await this.loadScoringWeights()
    return new Map(this.scoringWeights)
  }

  /**
   * EXPERT CREDENTIAL VERIFICATION
   */

  /**
   * Submit expert credentials for verification
   */
  async submitExpertCredentials(
    userId: string,
    credentials: {
      credential_type: string
      license_number?: string
      license_state?: string
      issuing_organization: string
      issue_date?: string
      expiry_date?: string
      verification_documents?: string[]
    }
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('expert_credentials')
        .insert({
          user_id: userId,
          ...credentials,
          verification_status: 'pending'
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Failed to submit expert credentials:', error)
      throw error
    }
  }

  /**
   * Verify expert credentials (admin function)
   */
  async verifyExpertCredentials(
    credentialId: string,
    verifierId: string,
    status: 'verified' | 'rejected',
    notes?: string
  ): Promise<void> {
    try {
      await supabase
        .from('expert_credentials')
        .update({
          verification_status: status,
          verified_by: verifierId,
          verification_date: new Date().toISOString(),
          verification_notes: notes
        })
        .eq('id', credentialId)
    } catch (error) {
      console.error('Failed to verify expert credentials:', error)
      throw error
    }
  }

  /**
   * Get user's expert credentials
   */
  async getUserExpertCredentials(userId: string): Promise<any[]> {
    try {
      const { data } = await supabase
        .from('expert_credentials')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      return data || []
    } catch (error) {
      console.error('Failed to get expert credentials:', error)
      return []
    }
  }

  /**
   * Check if user is a verified expert
   */
  async isVerifiedExpert(userId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('expert_credentials')
        .select('id')
        .eq('user_id', userId)
        .eq('verification_status', 'verified')
        .eq('is_active', true)
        .limit(1)

      return (data?.length || 0) > 0
    } catch (error) {
      console.error('Failed to check expert status:', error)
      return false
    }
  }

  /**
   * EXPERT SAFETY ASSESSMENTS
   */

  /**
   * Submit expert safety assessment
   */
  async submitExpertAssessment(
    expertId: string,
    restaurantId: string,
    assessment: {
      restrictions_assessed: string[]
      staff_training_score: number
      kitchen_protocols_score: number
      equipment_safety_score: number
      ingredient_sourcing_score: number
      cross_contamination_prevention_score: number
      emergency_preparedness_score: number
      overall_assessment_score: number
      confidence_level: number
      staff_knowledge_assessment?: string
      kitchen_inspection_notes?: string
      equipment_evaluation?: string
      supplier_verification_notes?: string
      protocol_documentation_review?: string
      emergency_procedure_evaluation?: string
      improvement_recommendations?: string
      critical_issues?: string
      assessment_methodology?: string
      time_spent_hours?: number
      areas_assessed?: string[]
      certifications_reviewed?: string[]
    }
  ): Promise<string> {
    try {
      // Verify expert credentials
      const isExpert = await this.isVerifiedExpert(expertId)
      if (!isExpert) {
        throw new Error('User is not a verified expert')
      }

      const { data, error } = await supabase
        .from('expert_safety_assessments')
        .insert({
          restaurant_id: restaurantId,
          expert_id: expertId,
          assessment_date: new Date().toISOString(),
          ...assessment
        })
        .select('id')
        .single()

      if (error) throw error

      // Invalidate cached assessments for this restaurant
      await this.invalidateRestaurantCache(restaurantId)

      return data.id
    } catch (error) {
      console.error('Failed to submit expert assessment:', error)
      throw error
    }
  }

  /**
   * Publish expert assessment
   */
  async publishExpertAssessment(
    assessmentId: string,
    expertId: string
  ): Promise<void> {
    try {
      await supabase
        .from('expert_safety_assessments')
        .update({
          is_published: true,
          published_date: new Date().toISOString()
        })
        .eq('id', assessmentId)
        .eq('expert_id', expertId)

      // Invalidate related caches
      const { data: assessment } = await supabase
        .from('expert_safety_assessments')
        .select('restaurant_id')
        .eq('id', assessmentId)
        .single()

      if (assessment) {
        await this.invalidateRestaurantCache(assessment.restaurant_id)
      }
    } catch (error) {
      console.error('Failed to publish expert assessment:', error)
      throw error
    }
  }

  /**
   * INCIDENT IMPACT ASSESSMENT
   */

  /**
   * Calculate incident impact on safety scores
   */
  async calculateIncidentImpact(
    incidentId: string,
    assessorId: string,
    impactData: {
      severity_impact_score: number
      duration_impact_months: number
      restriction_specific_impact?: Record<string, number>
      restaurant_response_quality_score?: number
      corrective_actions_implemented: boolean
      corrective_actions_description?: string
      prevention_measures_added: boolean
      prevention_measures_description?: string
      impact_mitigation_factor: number
    }
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('incident_impact_assessments')
        .insert({
          incident_id: incidentId,
          assessed_by: assessorId,
          ...impactData,
          restriction_specific_impact: impactData.restriction_specific_impact as Json
        })
        .select('id')
        .single()

      if (error) throw error

      // Invalidate safety assessments for affected restaurant
      const { data: incident } = await supabase
        .from('safety_incidents')
        .select('restaurant_id')
        .eq('id', incidentId)
        .single()

      if (incident) {
        await this.invalidateRestaurantCache(incident.restaurant_id)
      }

      return data.id
    } catch (error) {
      console.error('Failed to calculate incident impact:', error)
      throw error
    }
  }

  /**
   * Finalize incident impact assessment
   */
  async finalizeIncidentImpact(
    impactId: string,
    assessorId: string
  ): Promise<void> {
    try {
      await supabase
        .from('incident_impact_assessments')
        .update({ is_final: true })
        .eq('id', impactId)
        .eq('assessed_by', assessorId)
    } catch (error) {
      console.error('Failed to finalize incident impact:', error)
      throw error
    }
  }

  /**
   * COMMUNITY SAFETY VERIFICATION
   */

  /**
   * Submit community safety verification
   */
  async submitCommunityVerification(
    verifierId: string,
    restaurantId: string,
    verification: {
      restriction_ids: string[]
      verification_type: string
      verification_method?: string
      questions_asked?: string[]
      staff_responses?: string[]
      observations?: string
      documentation_reviewed?: string[]
      photos_taken?: string[]
      knowledge_score?: number
      protocol_compliance_score?: number
      confidence_in_verification: number
      recommendation: string
      verifier_notes?: string
      follow_up_needed?: boolean
      follow_up_date?: string
    }
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('community_safety_verifications')
        .insert({
          restaurant_id: restaurantId,
          verifier_id: verifierId,
          ...verification
        })
        .select('id')
        .single()

      if (error) throw error

      // Invalidate cached assessments
      await this.invalidateRestaurantCache(restaurantId)

      return data.id
    } catch (error) {
      console.error('Failed to submit community verification:', error)
      throw error
    }
  }

  /**
   * Get community verifications for restaurant
   */
  async getCommunityVerificationsForRestaurant(
    restaurantId: string,
    restrictionId?: string
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('community_safety_verifications')
        .select(`
          *,
          user_profiles!verifier_id (
            first_name,
            last_name
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('verification_date', { ascending: false })

      if (restrictionId) {
        query = query.contains('restriction_ids', [restrictionId])
      }

      const { data } = await query
      return data || []
    } catch (error) {
      console.error('Failed to get community verifications:', error)
      return []
    }
  }

  /**
   * Expert review of community verification
   */
  async expertReviewVerification(
    verificationId: string,
    expertId: string,
    notes: string
  ): Promise<void> {
    try {
      const isExpert = await this.isVerifiedExpert(expertId)
      if (!isExpert) {
        throw new Error('User is not a verified expert')
      }

      await supabase
        .from('community_safety_verifications')
        .update({
          is_verified_by_expert: true,
          expert_reviewer_id: expertId,
          expert_review_date: new Date().toISOString(),
          expert_review_notes: notes
        })
        .eq('id', verificationId)
    } catch (error) {
      console.error('Failed to expert review verification:', error)
      throw error
    }
  }

  /**
   * RESTAURANT SAFETY RESPONSES
   */

  /**
   * Submit restaurant response to safety assessment or incident
   */
  async submitRestaurantResponse(
    restaurantId: string,
    responseData: {
      reference_type: string
      reference_id: string
      response_type: string
      response_text: string
      corrective_actions_planned?: string
      corrective_actions_timeline?: string
      responsible_party?: string
      contact_information?: string
      is_public?: boolean
    }
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('restaurant_safety_responses')
        .insert({
          restaurant_id: restaurantId,
          ...responseData
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Failed to submit restaurant response:', error)
      throw error
    }
  }

  /**
   * Update response implementation status
   */
  async updateResponseImplementation(
    responseId: string,
    implementationData: {
      actions_implemented: boolean
      implementation_date?: string
      implementation_evidence?: string[]
      follow_up_assessment_requested?: boolean
    }
  ): Promise<void> {
    try {
      await supabase
        .from('restaurant_safety_responses')
        .update(implementationData)
        .eq('id', responseId)
    } catch (error) {
      console.error('Failed to update response implementation:', error)
      throw error
    }
  }

  /**
   * Assess restaurant response quality
   */
  async assessResponseQuality(
    responseId: string,
    assessorId: string,
    qualityScore: number,
    notes?: string
  ): Promise<void> {
    try {
      await supabase
        .from('restaurant_safety_responses')
        .update({
          response_quality_score: qualityScore,
          assessed_by: assessorId,
          assessment_notes: notes
        })
        .eq('id', responseId)
    } catch (error) {
      console.error('Failed to assess response quality:', error)
      throw error
    }
  }

  /**
   * BACKGROUND PROCESSING AND OPTIMIZATION
   */

  /**
   * Invalidate cached assessments for a restaurant
   */
  async invalidateRestaurantCache(restaurantId: string): Promise<void> {
    try {
      // Remove from memory cache
      const keysToRemove = Array.from(this.assessmentCache.keys())
        .filter(key => key.startsWith(restaurantId))
      
      keysToRemove.forEach(key => this.assessmentCache.delete(key))

      // Mark database cache as expired
      await supabase
        .from('restaurant_safety_scores')
        .update({ expires_at: new Date().toISOString() })
        .eq('restaurant_id', restaurantId)
    } catch (error) {
      console.error('Failed to invalidate restaurant cache:', error)
    }
  }

  /**
   * Get restaurants requiring safety assessment updates
   */
  async getRestaurantsNeedingUpdate(): Promise<string[]> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      
      const { data } = await supabase
        .from('restaurant_safety_scores')
        .select('restaurant_id')
        .or(`expires_at.lt.${new Date().toISOString()},calculation_timestamp.lt.${thirtyDaysAgo}`)
        .order('calculation_timestamp', { ascending: true })
        .limit(100)

      return data ? Array.from(new Set(data.map(r => r.restaurant_id))) : []
    } catch (error) {
      console.error('Failed to get restaurants needing update:', error)
      return []
    }
  }

  /**
   * Process safety assessment queue (background job)
   */
  async processSafetyAssessmentQueue(
    maxProcessingTime: number = 300000 // 5 minutes
  ): Promise<{ processed: number; errors: number }> {
    const startTime = Date.now()
    let processed = 0
    let errors = 0

    try {
      const restaurantsToUpdate = await this.getRestaurantsNeedingUpdate()
      
      for (const restaurantId of restaurantsToUpdate) {
        if (Date.now() - startTime > maxProcessingTime) {
          break // Time limit reached
        }

        try {
          // Calculate overall assessment
          await this.calculateSafetyAssessment(restaurantId, null, true)
          
          // Get active restrictions to update specific assessments
          const { data: activeRestrictions } = await supabase
            .from('dietary_restrictions')
            .select('id')
            .eq('is_active', true)
            .limit(10) // Limit to prevent overwhelming the system

          if (activeRestrictions) {
            for (const restriction of activeRestrictions) {
              if (Date.now() - startTime > maxProcessingTime) {
                break
              }
              
              try {
                await this.calculateSafetyAssessment(restaurantId, restriction.id, true)
                processed++
              } catch (error) {
                errors++
                console.error(`Error processing restriction ${restriction.id} for restaurant ${restaurantId}:`, error)
              }
            }
          }

          processed++
          
          // Small delay to prevent overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 50))
        } catch (error) {
          errors++
          console.error(`Error processing restaurant ${restaurantId}:`, error)
        }
      }
    } catch (error) {
      console.error('Error in safety assessment queue processing:', error)
      errors++
    }

    return { processed, errors }
  }

  /**
   * Get safety assessment statistics
   */
  async getSafetyAssessmentStats(): Promise<{
    total_assessments: number
    assessments_by_level: Record<SafetyLevel, number>
    expert_assessments_count: number
    community_verifications_count: number
    cache_hit_rate: number
    avg_confidence_score: number
  }> {
    try {
      const { data: assessments } = await supabase
        .from('restaurant_safety_scores')
        .select('safety_level, confidence_score')

      const { data: expertAssessments } = await supabase
        .from('expert_safety_assessments')
        .select('id', { count: 'exact' })

      const { data: communityVerifications } = await supabase
        .from('community_safety_verifications')
        .select('id', { count: 'exact' })

      const assessmentsByLevel: Record<SafetyLevel, number> = {
        safe: 0,
        caution: 0,
        warning: 0,
        danger: 0
      }

      let totalConfidence = 0
      
      if (assessments) {
        assessments.forEach(assessment => {
          assessmentsByLevel[assessment.safety_level]++
          totalConfidence += assessment.confidence_score
        })
      }

      const avgConfidence = assessments?.length ? totalConfidence / assessments.length : 0
      const cacheHitRate = this.assessmentCache.size / Math.max(1, assessments?.length || 1)

      return {
        total_assessments: assessments?.length || 0,
        assessments_by_level: assessmentsByLevel,
        expert_assessments_count: expertAssessments?.length || 0,
        community_verifications_count: communityVerifications?.length || 0,
        cache_hit_rate: Math.min(1, cacheHitRate),
        avg_confidence_score: avgConfidence
      }
    } catch (error) {
      console.error('Failed to get safety assessment stats:', error)
      return {
        total_assessments: 0,
        assessments_by_level: { safe: 0, caution: 0, warning: 0, danger: 0 },
        expert_assessments_count: 0,
        community_verifications_count: 0,
        cache_hit_rate: 0,
        avg_confidence_score: 0
      }
    }
  }

  /**
   * Clear assessment cache
   */
  clearCache(): void {
    this.assessmentCache.clear()
  }

  /**
   * Get cached assessment count
   */
  getCacheSize(): number {
    return this.assessmentCache.size
  }
}

export default SafetyAssessmentService.getInstance()