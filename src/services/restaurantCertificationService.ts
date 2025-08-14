/**
 * Restaurant Certification Service
 * 
 * SAFETY CRITICAL: Manages third-party certifications and compliance tracking
 * for restaurant safety assessment system
 */

import { supabase } from '../lib/supabase'
import { Json } from '../types/database.types'

export interface RestaurantCertification {
  id: string
  restaurant_id: string
  certification_type: string
  certifying_organization: string
  certificate_number?: string
  issue_date: string
  expiry_date: string
  certification_level?: string
  scope_of_certification: string[]
  certificate_url?: string
  verification_status: 'pending' | 'verified' | 'rejected'
  verified_by?: string
  verification_date?: string
  annual_renewal_required: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CertificationRequirement {
  restriction_type: string
  required_certifications: string[]
  preferred_certifications: string[]
  minimum_level?: string
  validity_period_months: number
}

export interface CertificationAssessment {
  restaurant_id: string
  total_certifications: number
  valid_certifications: number
  expired_certifications: number
  pending_certifications: number
  coverage_score: number
  compliance_level: 'excellent' | 'good' | 'adequate' | 'insufficient' | 'none'
  missing_certifications: string[]
  expiring_soon: RestaurantCertification[]
  recommendations: string[]
}

class RestaurantCertificationService {
  private static instance: RestaurantCertificationService
  private certificationRequirements: Map<string, CertificationRequirement> = new Map()

  static getInstance(): RestaurantCertificationService {
    if (!RestaurantCertificationService.instance) {
      RestaurantCertificationService.instance = new RestaurantCertificationService()
    }
    return RestaurantCertificationService.instance
  }

  constructor() {
    this.initializeCertificationRequirements()
  }

  /**
   * Initialize certification requirements for different restriction types
   */
  private initializeCertificationRequirements(): void {
    // Gluten-Free certifications
    this.certificationRequirements.set('gluten_free', {
      restriction_type: 'gluten_free',
      required_certifications: ['gluten_free_certified'],
      preferred_certifications: ['gfco_certified', 'celiac_safe'],
      minimum_level: 'basic',
      validity_period_months: 12
    })

    // Food Allergy certifications
    this.certificationRequirements.set('food_allergy', {
      restriction_type: 'food_allergy',
      required_certifications: ['allergen_safe', 'haccp'],
      preferred_certifications: ['allergy_trained_staff', 'fare_certified'],
      minimum_level: 'basic',
      validity_period_months: 24
    })

    // General food safety
    this.certificationRequirements.set('general', {
      restriction_type: 'general',
      required_certifications: ['servsafe', 'haccp'],
      preferred_certifications: ['iso22000', 'brc_food_safety'],
      minimum_level: 'basic',
      validity_period_months: 24
    })

    // Kosher certifications
    this.certificationRequirements.set('kosher', {
      restriction_type: 'kosher',
      required_certifications: ['kosher_certified'],
      preferred_certifications: ['orthodox_union', 'star_k'],
      validity_period_months: 12
    })

    // Halal certifications
    this.certificationRequirements.set('halal', {
      restriction_type: 'halal',
      required_certifications: ['halal_certified'],
      preferred_certifications: ['isna_halal', 'hfa_certified'],
      validity_period_months: 12
    })

    // Vegan certifications
    this.certificationRequirements.set('vegan', {
      restriction_type: 'vegan',
      required_certifications: [],
      preferred_certifications: ['vegan_certified', 'plant_based_certified'],
      validity_period_months: 24
    })
  }

  /**
   * Add or update restaurant certification
   */
  async addRestaurantCertification(
    restaurantId: string,
    certificationData: {
      certification_type: string
      certifying_organization: string
      certificate_number?: string
      issue_date: string
      expiry_date: string
      certification_level?: string
      scope_of_certification: string[]
      certificate_url?: string
      annual_renewal_required?: boolean
    }
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('restaurant_certifications')
        .insert({
          restaurant_id: restaurantId,
          ...certificationData,
          verification_status: 'pending',
          is_active: true
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Failed to add restaurant certification:', error)
      throw error
    }
  }

  /**
   * Update existing certification
   */
  async updateRestaurantCertification(
    certificationId: string,
    updates: Partial<RestaurantCertification>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('restaurant_certifications')
        .update(updates)
        .eq('id', certificationId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to update restaurant certification:', error)
      throw error
    }
  }

  /**
   * Verify certification (admin/expert function)
   */
  async verifyCertification(
    certificationId: string,
    verifierId: string,
    status: 'verified' | 'rejected'
  ): Promise<void> {
    try {
      await supabase
        .from('restaurant_certifications')
        .update({
          verification_status: status,
          verified_by: verifierId,
          verification_date: new Date().toISOString()
        })
        .eq('id', certificationId)
    } catch (error) {
      console.error('Failed to verify certification:', error)
      throw error
    }
  }

  /**
   * Get restaurant certifications
   */
  async getRestaurantCertifications(
    restaurantId: string,
    includeExpired: boolean = false
  ): Promise<RestaurantCertification[]> {
    try {
      let query = supabase
        .from('restaurant_certifications')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('expiry_date', { ascending: false })

      if (!includeExpired) {
        query = query.gte('expiry_date', new Date().toISOString().split('T')[0])
      }

      const { data } = await query
      return data || []
    } catch (error) {
      console.error('Failed to get restaurant certifications:', error)
      return []
    }
  }

  /**
   * Get certifications by type
   */
  async getCertificationsByType(
    restaurantId: string,
    certificationType: string
  ): Promise<RestaurantCertification[]> {
    try {
      const { data } = await supabase
        .from('restaurant_certifications')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('certification_type', certificationType)
        .eq('is_active', true)
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .order('expiry_date', { ascending: false })

      return data || []
    } catch (error) {
      console.error('Failed to get certifications by type:', error)
      return []
    }
  }

  /**
   * Check if restaurant has specific certification
   */
  async hasValidCertification(
    restaurantId: string,
    certificationType: string,
    minimumLevel?: string
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('restaurant_certifications')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('certification_type', certificationType)
        .eq('verification_status', 'verified')
        .eq('is_active', true)
        .gte('expiry_date', new Date().toISOString().split('T')[0])

      if (minimumLevel) {
        query = query.gte('certification_level', minimumLevel)
      }

      const { data } = await query.limit(1)
      return (data?.length || 0) > 0
    } catch (error) {
      console.error('Failed to check certification:', error)
      return false
    }
  }

  /**
   * Get certifications expiring soon
   */
  async getCertificationsExpiringSoon(
    restaurantId: string,
    daysAhead: number = 90
  ): Promise<RestaurantCertification[]> {
    try {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + daysAhead)

      const { data } = await supabase
        .from('restaurant_certifications')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .lte('expiry_date', futureDate.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true })

      return data || []
    } catch (error) {
      console.error('Failed to get expiring certifications:', error)
      return []
    }
  }

  /**
   * Assess restaurant certification compliance
   */
  async assessCertificationCompliance(
    restaurantId: string,
    restrictionTypes: string[] = ['general']
  ): Promise<CertificationAssessment> {
    try {
      const certifications = await this.getRestaurantCertifications(restaurantId, true)
      const validCertifications = certifications.filter(
        cert => new Date(cert.expiry_date) >= new Date() && cert.verification_status === 'verified'
      )
      const expiredCertifications = certifications.filter(
        cert => new Date(cert.expiry_date) < new Date()
      )
      const pendingCertifications = certifications.filter(
        cert => cert.verification_status === 'pending'
      )

      // Calculate coverage score based on requirements
      let coverageScore = 0
      let totalRequirements = 0
      const missingCertifications: string[] = []

      for (const restrictionType of restrictionTypes) {
        const requirements = this.certificationRequirements.get(restrictionType)
        if (!requirements) continue

        totalRequirements += requirements.required_certifications.length
        totalRequirements += requirements.preferred_certifications.length * 0.5

        // Check required certifications
        for (const requiredCert of requirements.required_certifications) {
          const hasCert = validCertifications.some(cert => 
            cert.certification_type === requiredCert &&
            (!requirements.minimum_level || cert.certification_level === requirements.minimum_level)
          )
          
          if (hasCert) {
            coverageScore += 1
          } else {
            missingCertifications.push(requiredCert)
          }
        }

        // Check preferred certifications (half weight)
        for (const preferredCert of requirements.preferred_certifications) {
          const hasCert = validCertifications.some(cert => cert.certification_type === preferredCert)
          if (hasCert) {
            coverageScore += 0.5
          }
        }
      }

      const coveragePercentage = totalRequirements > 0 ? (coverageScore / totalRequirements) * 100 : 0

      // Determine compliance level
      let complianceLevel: CertificationAssessment['compliance_level']
      if (coveragePercentage >= 90) complianceLevel = 'excellent'
      else if (coveragePercentage >= 75) complianceLevel = 'good'
      else if (coveragePercentage >= 50) complianceLevel = 'adequate'
      else if (coveragePercentage > 0) complianceLevel = 'insufficient'
      else complianceLevel = 'none'

      // Get certifications expiring soon
      const expiringSoon = await this.getCertificationsExpiringSoon(restaurantId)

      // Generate recommendations
      const recommendations = this.generateCertificationRecommendations(
        missingCertifications,
        expiringSoon,
        restrictionTypes
      )

      return {
        restaurant_id: restaurantId,
        total_certifications: certifications.length,
        valid_certifications: validCertifications.length,
        expired_certifications: expiredCertifications.length,
        pending_certifications: pendingCertifications.length,
        coverage_score: Math.round(coveragePercentage),
        compliance_level: complianceLevel,
        missing_certifications: missingCertifications,
        expiring_soon: expiringSoon,
        recommendations
      }
    } catch (error) {
      console.error('Failed to assess certification compliance:', error)
      return {
        restaurant_id: restaurantId,
        total_certifications: 0,
        valid_certifications: 0,
        expired_certifications: 0,
        pending_certifications: 0,
        coverage_score: 0,
        compliance_level: 'none',
        missing_certifications: [],
        expiring_soon: [],
        recommendations: ['Unable to assess certification compliance. Please verify system status.']
      }
    }
  }

  /**
   * Generate certification recommendations
   */
  private generateCertificationRecommendations(
    missingCertifications: string[],
    expiringSoon: RestaurantCertification[],
    restrictionTypes: string[]
  ): string[] {
    const recommendations: string[] = []

    // Missing certifications
    if (missingCertifications.length > 0) {
      recommendations.push(
        `Obtain missing certifications: ${missingCertifications.join(', ')}`
      )
    }

    // Expiring certifications
    if (expiringSoon.length > 0) {
      recommendations.push(
        `Renew ${expiringSoon.length} certification(s) expiring within 90 days`
      )
    }

    // Restriction-specific recommendations
    for (const restrictionType of restrictionTypes) {
      const requirements = this.certificationRequirements.get(restrictionType)
      if (!requirements) continue

      if (restrictionType === 'food_allergy') {
        recommendations.push(
          'Consider additional allergy-specific training certifications for staff'
        )
      } else if (restrictionType === 'gluten_free') {
        recommendations.push(
          'Ensure dedicated gluten-free preparation area certification'
        )
      }
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push(
        'Maintain current certification levels and monitor expiry dates'
      )
    }

    return recommendations
  }

  /**
   * Get all certification types
   */
  getCertificationTypes(): string[] {
    return [
      'allergen_safe',
      'gluten_free_certified',
      'gfco_certified',
      'celiac_safe',
      'haccp',
      'servsafe',
      'iso22000',
      'brc_food_safety',
      'allergy_trained_staff',
      'fare_certified',
      'kosher_certified',
      'orthodox_union',
      'star_k',
      'halal_certified',
      'isna_halal',
      'hfa_certified',
      'vegan_certified',
      'plant_based_certified',
      'organic_certified',
      'non_gmo_verified'
    ]
  }

  /**
   * Get certification organizations
   */
  getCertifyingOrganizations(): string[] {
    return [
      'Gluten-Free Certification Organization (GFCO)',
      'Celiac Support Association',
      'Food Allergy Research & Education (FARE)',
      'National Restaurant Association',
      'NSF International',
      'Eurofins',
      'Orthodox Union (OU)',
      'Star-K Kosher Certification',
      'Islamic Society of North America (ISNA)',
      'Halal Food Authority (HFA)',
      'Vegan Action',
      'Certified Plant Based',
      'USDA Organic',
      'Non-GMO Project'
    ]
  }

  /**
   * Search certifications by criteria
   */
  async searchCertifications(criteria: {
    certification_type?: string
    certifying_organization?: string
    verification_status?: string
    expiring_before?: string
    expiring_after?: string
    restriction_scope?: string
  }): Promise<RestaurantCertification[]> {
    try {
      let query = supabase
        .from('restaurant_certifications')
        .select(`
          *,
          restaurants (
            name,
            address
          )
        `)
        .eq('is_active', true)

      if (criteria.certification_type) {
        query = query.eq('certification_type', criteria.certification_type)
      }

      if (criteria.certifying_organization) {
        query = query.eq('certifying_organization', criteria.certifying_organization)
      }

      if (criteria.verification_status) {
        query = query.eq('verification_status', criteria.verification_status)
      }

      if (criteria.expiring_before) {
        query = query.lte('expiry_date', criteria.expiring_before)
      }

      if (criteria.expiring_after) {
        query = query.gte('expiry_date', criteria.expiring_after)
      }

      if (criteria.restriction_scope) {
        query = query.contains('scope_of_certification', [criteria.restriction_scope])
      }

      const { data } = await query.order('expiry_date', { ascending: true })
      return data || []
    } catch (error) {
      console.error('Failed to search certifications:', error)
      return []
    }
  }

  /**
   * Bulk update certification statuses
   */
  async bulkUpdateCertificationStatus(
    certificationIds: string[],
    status: 'verified' | 'rejected',
    verifierId: string
  ): Promise<{ success: number; errors: number }> {
    let success = 0
    let errors = 0

    for (const certificationId of certificationIds) {
      try {
        await this.verifyCertification(certificationId, verifierId, status)
        success++
      } catch (error) {
        errors++
        console.error(`Failed to update certification ${certificationId}:`, error)
      }

      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    return { success, errors }
  }

  /**
   * Generate certification report for restaurant
   */
  async generateCertificationReport(restaurantId: string): Promise<{
    restaurant_id: string
    report_date: string
    certifications: RestaurantCertification[]
    compliance_assessment: CertificationAssessment
    action_items: Array<{
      priority: 'high' | 'medium' | 'low'
      action: string
      deadline?: string
    }>
  }> {
    try {
      const certifications = await this.getRestaurantCertifications(restaurantId, true)
      const complianceAssessment = await this.assessCertificationCompliance(restaurantId)

      // Generate action items
      const actionItems = []

      // High priority: Expired required certifications
      const expiredRequired = certifications.filter(cert => 
        new Date(cert.expiry_date) < new Date() &&
        ['allergen_safe', 'haccp', 'servsafe', 'gluten_free_certified'].includes(cert.certification_type)
      )

      for (const cert of expiredRequired) {
        actionItems.push({
          priority: 'high' as const,
          action: `Renew expired ${cert.certification_type} certification`,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      }

      // Medium priority: Expiring soon
      for (const cert of complianceAssessment.expiring_soon) {
        actionItems.push({
          priority: 'medium' as const,
          action: `Renew ${cert.certification_type} certification expiring on ${cert.expiry_date}`,
          deadline: cert.expiry_date
        })
      }

      // Low priority: Missing preferred certifications
      for (const missing of complianceAssessment.missing_certifications) {
        if (!['allergen_safe', 'haccp', 'servsafe'].includes(missing)) {
          actionItems.push({
            priority: 'low' as const,
            action: `Consider obtaining ${missing} certification`
          })
        }
      }

      return {
        restaurant_id: restaurantId,
        report_date: new Date().toISOString(),
        certifications,
        compliance_assessment: complianceAssessment,
        action_items: actionItems
      }
    } catch (error) {
      console.error('Failed to generate certification report:', error)
      throw error
    }
  }
}

export default RestaurantCertificationService.getInstance()