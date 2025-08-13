/**
 * Core Database Service Layer
 * 
 * SAFETY CRITICAL: This service layer handles all database operations
 * for life-threatening allergy and dietary restriction information
 */

import { supabase, handleSupabaseResponse, SupabaseResponse } from '../lib/supabase'
import {
  Database,
  UserProfile,
  UserProfileUpdate,
  FamilyMember,
  FamilyMemberInsert,
  FamilyMemberUpdate,
  DietaryRestriction,
  UserRestriction,
  UserRestrictionInsert,
  UserRestrictionUpdate,
  Product,
  ProductInsert,
  ProductUpdate,
  ProductSafetyAssessment,
  ProductSafetyAssessmentInsert,
  EmergencyCard,
  EmergencyCardInsert,
  EmergencyCardUpdate,
  UserWithRestrictions,
  FamilyMemberWithRestrictions,
  ProductWithSafetyInfo,
  RestrictionSeverity,
  SafetyLevel,
} from '../types/database.types'

/**
 * Generic database operations for reusable CRUD functionality
 */
export class BaseService<T extends { id: string }> {
  constructor(protected tableName: string) {}

  async findById(id: string): Promise<SupabaseResponse<T>> {
    const response = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    return handleSupabaseResponse(response)
  }

  async findMany(filters?: Record<string, any>): Promise<SupabaseResponse<T[]>> {
    let query = supabase.from(this.tableName).select('*')

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    const response = await query
    return handleSupabaseResponse(response)
  }

  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseResponse<T>> {
    const response = await supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single()

    return handleSupabaseResponse(response)
  }

  async update(id: string, updates: Partial<T>): Promise<SupabaseResponse<T>> {
    const response = await supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return handleSupabaseResponse(response)
  }

  async delete(id: string): Promise<SupabaseResponse<void>> {
    const response = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)

    return handleSupabaseResponse(response)
  }
}

/**
 * User Profile Service
 * Handles user profile CRUD operations with dietary restrictions
 */
export class UserProfileService extends BaseService<UserProfile> {
  constructor() {
    super('user_profiles')
  }

  /**
   * Get user profile with all dietary restrictions
   */
  async getUserWithRestrictions(userId: string): Promise<SupabaseResponse<UserWithRestrictions>> {
    const response = await supabase
      .from('user_profiles')
      .select(`
        *,
        restrictions:user_restrictions(
          *,
          dietary_restriction:dietary_restrictions(*)
        )
      `)
      .eq('id', userId)
      .single()

    return handleSupabaseResponse(response)
  }

  /**
   * Update user profile with safety validation
   */
  async updateProfile(userId: string, updates: UserProfileUpdate): Promise<SupabaseResponse<UserProfile>> {
    // Validate critical fields for safety
    if (updates.emergency_contact_phone && !this.isValidPhoneNumber(updates.emergency_contact_phone)) {
      return {
        data: null,
        error: { message: 'Emergency contact phone number is invalid' }
      }
    }

    return this.update(userId, updates)
  }

  /**
   * Validate phone number format for emergency contacts
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Basic phone validation - can be enhanced based on requirements
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  }
}

/**
 * Family Member Service
 * Handles family member management for family accounts
 */
export class FamilyMemberService extends BaseService<FamilyMember> {
  constructor() {
    super('family_members')
  }

  /**
   * Get all family members for a family admin
   */
  async getFamilyMembers(familyAdminId: string): Promise<SupabaseResponse<FamilyMember[]>> {
    const response = await supabase
      .from('family_members')
      .select('*')
      .eq('family_admin_id', familyAdminId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    return handleSupabaseResponse(response)
  }

  /**
   * Get family member with dietary restrictions
   */
  async getFamilyMemberWithRestrictions(memberId: string): Promise<SupabaseResponse<FamilyMemberWithRestrictions>> {
    const response = await supabase
      .from('family_members')
      .select(`
        *,
        restrictions:family_member_restrictions(
          *,
          dietary_restriction:dietary_restrictions(*)
        )
      `)
      .eq('id', memberId)
      .single()

    return handleSupabaseResponse(response)
  }

  /**
   * Create new family member with validation
   */
  async createFamilyMember(data: FamilyMemberInsert): Promise<SupabaseResponse<FamilyMember>> {
    // Validate family admin permissions
    const adminCheck = await supabase
      .from('user_profiles')
      .select('account_type')
      .eq('id', data.family_admin_id)
      .single()

    if (adminCheck.error || adminCheck.data?.account_type !== 'family') {
      return {
        data: null,
        error: { message: 'Only family account holders can add family members' }
      }
    }

    return this.create(data)
  }

  /**
   * Deactivate family member instead of hard delete for safety
   */
  async deactivateFamilyMember(memberId: string): Promise<SupabaseResponse<FamilyMember>> {
    return this.update(memberId, { is_active: false })
  }
}

/**
 * Dietary Restrictions Service
 * Handles dietary restrictions and user restrictions
 */
export class DietaryRestrictionsService {
  /**
   * Get all available dietary restrictions
   */
  async getAllRestrictions(): Promise<SupabaseResponse<DietaryRestriction[]>> {
    const response = await supabase
      .from('dietary_restrictions')
      .select('*')
      .order('name')

    return handleSupabaseResponse(response)
  }

  /**
   * Search dietary restrictions by name or common names
   */
  async searchRestrictions(query: string): Promise<SupabaseResponse<DietaryRestriction[]>> {
    const response = await supabase
      .from('dietary_restrictions')
      .select('*')
      .or(`name.ilike.%${query}%,common_names.cs.{${query}}`)
      .order('name')

    return handleSupabaseResponse(response)
  }

  /**
   * Add dietary restriction to user
   */
  async addUserRestriction(data: UserRestrictionInsert): Promise<SupabaseResponse<UserRestriction>> {
    // Validate severity level for life-threatening restrictions
    if (data.severity === 'life_threatening') {
      console.warn('Life-threatening restriction added for user:', data.user_id)
    }

    const response = await supabase
      .from('user_restrictions')
      .insert(data)
      .select()
      .single()

    return handleSupabaseResponse(response)
  }

  /**
   * Update user restriction with safety validation
   */
  async updateUserRestriction(
    restrictionId: string, 
    updates: UserRestrictionUpdate
  ): Promise<SupabaseResponse<UserRestriction>> {
    // Log critical severity changes
    if (updates.severity === 'life_threatening') {
      console.warn('User restriction updated to life-threatening:', restrictionId)
    }

    const response = await supabase
      .from('user_restrictions')
      .update(updates)
      .eq('id', restrictionId)
      .select()
      .single()

    return handleSupabaseResponse(response)
  }

  /**
   * Remove user restriction (mark as inactive for safety)
   */
  async removeUserRestriction(restrictionId: string): Promise<SupabaseResponse<UserRestriction>> {
    const response = await supabase
      .from('user_restrictions')
      .update({ is_active: false })
      .eq('id', restrictionId)
      .select()
      .single()

    return handleSupabaseResponse(response)
  }

  /**
   * Get user restrictions with full details
   */
  async getUserRestrictions(userId: string): Promise<SupabaseResponse<(UserRestriction & { dietary_restriction: DietaryRestriction })[]>> {
    const response = await supabase
      .from('user_restrictions')
      .select(`
        *,
        dietary_restriction:dietary_restrictions(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('severity', { ascending: false }) // Life-threatening first

    return handleSupabaseResponse(response)
  }
}

/**
 * Product Service
 * Handles product database operations and barcode scanning
 */
export class ProductService extends BaseService<Product> {
  constructor() {
    super('products')
  }

  /**
   * Find product by barcode
   */
  async findByBarcode(barcode: string): Promise<SupabaseResponse<Product>> {
    const response = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .eq('is_active', true)
      .single()

    return handleSupabaseResponse(response)
  }

  /**
   * Get product with full safety assessment information
   */
  async getProductWithSafetyInfo(
    productId: string, 
    userId?: string,
    familyMemberId?: string
  ): Promise<SupabaseResponse<ProductWithSafetyInfo>> {
    let safetyQuery = supabase
      .from('products')
      .select(`
        *,
        ingredients:product_ingredients(
          *,
          ingredient:ingredients(*)
        )
      `)
      .eq('id', productId)

    // Add safety assessment if user context provided
    if (userId || familyMemberId) {
      safetyQuery = supabase
        .from('products')
        .select(`
          *,
          safety_assessment:product_safety_assessments(*)${userId ? `.eq(user_id,${userId})` : ''}${familyMemberId ? `.eq(family_member_id,${familyMemberId})` : ''},
          ingredients:product_ingredients(
            *,
            ingredient:ingredients(*)
          )
        `)
        .eq('id', productId)
    }

    const response = await safetyQuery.single()
    return handleSupabaseResponse(response)
  }

  /**
   * Create or update product from barcode scan
   */
  async createOrUpdateProduct(productData: ProductInsert): Promise<SupabaseResponse<Product>> {
    // First try to find existing product by barcode
    const existingProduct = await this.findByBarcode(productData.barcode)
    
    if (existingProduct.data) {
      // Update existing product with new information
      return this.update(existingProduct.data.id, productData)
    } else {
      // Create new product
      return this.create(productData)
    }
  }

  /**
   * Search products by name or brand
   */
  async searchProducts(query: string, limit: number = 20): Promise<SupabaseResponse<Product[]>> {
    const response = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
      .eq('is_active', true)
      .order('verification_count', { ascending: false })
      .limit(limit)

    return handleSupabaseResponse(response)
  }
}

/**
 * Product Safety Assessment Service
 * Handles safety assessments for products based on user restrictions
 */
export class ProductSafetyService extends BaseService<ProductSafetyAssessment> {
  constructor() {
    super('product_safety_assessments')
  }

  /**
   * Create safety assessment for user and product
   */
  async createSafetyAssessment(
    productId: string,
    userId?: string,
    familyMemberId?: string,
    userRestrictions?: (UserRestriction & { dietary_restriction: DietaryRestriction })[]
  ): Promise<SupabaseResponse<ProductSafetyAssessment>> {
    if (!userId && !familyMemberId) {
      return {
        data: null,
        error: { message: 'Either userId or familyMemberId must be provided' }
      }
    }

    // Get product ingredients
    const productResponse = await supabase
      .from('products')
      .select(`
        *,
        product_ingredients(
          *,
          ingredient:ingredients(
            *,
            risk_assessments:ingredient_risk_assessments(*)
          )
        )
      `)
      .eq('id', productId)
      .single()

    if (productResponse.error || !productResponse.data) {
      return handleSupabaseResponse({
        data: null,
        error: productResponse.error || { message: 'Product not found' }
      })
    }

    // Calculate safety assessment
    const safetyAssessment = await this.calculateSafetyLevel(
      productResponse.data,
      userRestrictions || []
    )

    const assessmentData: ProductSafetyAssessmentInsert = {
      product_id: productId,
      user_id: userId || null,
      family_member_id: familyMemberId || null,
      ...safetyAssessment
    }

    const response = await supabase
      .from('product_safety_assessments')
      .insert(assessmentData)
      .select()
      .single()

    return handleSupabaseResponse(response)
  }

  /**
   * Calculate safety level based on ingredients and user restrictions
   */
  private async calculateSafetyLevel(
    product: any,
    userRestrictions: (UserRestriction & { dietary_restriction: DietaryRestriction })[]
  ): Promise<{
    overall_safety_level: SafetyLevel
    risk_factors: any
    safe_ingredients_count: number
    warning_ingredients_count: number
    dangerous_ingredients_count: number
    confidence_score: number
  }> {
    let safeCount = 0
    let warningCount = 0
    let dangerCount = 0
    let highestRisk: SafetyLevel = 'safe'
    const riskFactors: any[] = []

    const restrictionIds = userRestrictions.map(r => r.restriction_id)

    // Analyze each ingredient
    for (const productIngredient of product.product_ingredients || []) {
      const ingredient = productIngredient.ingredient
      
      // Check if ingredient has risk assessments for user's restrictions
      const relevantRisks = ingredient.risk_assessments?.filter((risk: any) => 
        restrictionIds.includes(risk.restriction_id)
      ) || []

      if (relevantRisks.length === 0) {
        safeCount++
        continue
      }

      // Find highest risk level for this ingredient
      const ingredientRisks = relevantRisks.map((risk: any) => risk.risk_level)
      const maxRisk = this.getHighestRiskLevel(ingredientRisks)

      switch (maxRisk) {
        case 'danger':
          dangerCount++
          if (this.getRiskPriority('danger') > this.getRiskPriority(highestRisk)) {
            highestRisk = 'danger'
          }
          riskFactors.push({
            ingredient_name: ingredient.name,
            risk_level: 'danger',
            restrictions_affected: relevantRisks.map((r: any) => r.restriction_id)
          })
          break
        case 'warning':
          warningCount++
          if (this.getRiskPriority('warning') > this.getRiskPriority(highestRisk)) {
            highestRisk = 'warning'
          }
          riskFactors.push({
            ingredient_name: ingredient.name,
            risk_level: 'warning',
            restrictions_affected: relevantRisks.map((r: any) => r.restriction_id)
          })
          break
        case 'caution':
          warningCount++
          if (this.getRiskPriority('caution') > this.getRiskPriority(highestRisk)) {
            highestRisk = 'caution'
          }
          break
        default:
          safeCount++
          break
      }
    }

    // Calculate confidence score based on data quality
    const totalIngredients = (product.product_ingredients || []).length
    const confidenceScore = totalIngredients > 0 ? 
      Math.min(100, Math.round((totalIngredients * product.data_quality_score) / 100)) : 
      product.data_quality_score

    return {
      overall_safety_level: highestRisk,
      risk_factors: { risks: riskFactors },
      safe_ingredients_count: safeCount,
      warning_ingredients_count: warningCount,
      dangerous_ingredients_count: dangerCount,
      confidence_score: confidenceScore
    }
  }

  private getHighestRiskLevel(risks: SafetyLevel[]): SafetyLevel {
    const priorities = { danger: 4, warning: 3, caution: 2, safe: 1 }
    return risks.reduce((highest, current) => 
      priorities[current] > priorities[highest] ? current : highest, 'safe'
    )
  }

  private getRiskPriority(risk: SafetyLevel): number {
    const priorities = { danger: 4, warning: 3, caution: 2, safe: 1 }
    return priorities[risk]
  }
}

/**
 * Emergency Card Service
 * Handles emergency card management for critical allergy information
 */
export class EmergencyCardService extends BaseService<EmergencyCard> {
  constructor() {
    super('emergency_cards')
  }

  /**
   * Get active emergency cards for user
   */
  async getUserEmergencyCards(userId: string): Promise<SupabaseResponse<EmergencyCard[]>> {
    const response = await supabase
      .from('emergency_cards')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('severity_level', { ascending: false }) // Life-threatening first

    return handleSupabaseResponse(response)
  }

  /**
   * Get active emergency cards for family member
   */
  async getFamilyMemberEmergencyCards(familyMemberId: string): Promise<SupabaseResponse<EmergencyCard[]>> {
    const response = await supabase
      .from('emergency_cards')
      .select('*')
      .eq('family_member_id', familyMemberId)
      .eq('is_active', true)
      .order('severity_level', { ascending: false })

    return handleSupabaseResponse(response)
  }

  /**
   * Create emergency card with validation
   */
  async createEmergencyCard(data: EmergencyCardInsert): Promise<SupabaseResponse<EmergencyCard>> {
    // Validate that either user_id or family_member_id is provided
    if (!data.user_id && !data.family_member_id) {
      return {
        data: null,
        error: { message: 'Either user_id or family_member_id must be provided' }
      }
    }

    // Validate emergency contact information for life-threatening cases
    if (data.severity_level === 'life_threatening') {
      if (!data.emergency_contact_1_phone) {
        return {
          data: null,
          error: { message: 'Emergency contact phone is required for life-threatening restrictions' }
        }
      }
    }

    const response = await supabase
      .from('emergency_cards')
      .insert(data)
      .select()
      .single()

    return handleSupabaseResponse(response)
  }

  /**
   * Update emergency card with last_updated timestamp
   */
  async updateEmergencyCard(cardId: string, updates: EmergencyCardUpdate): Promise<SupabaseResponse<EmergencyCard>> {
    const updateData = {
      ...updates,
      last_updated: new Date().toISOString()
    }

    return this.update(cardId, updateData)
  }
}

// Export service instances
export const userProfileService = new UserProfileService()
export const familyMemberService = new FamilyMemberService()
export const dietaryRestrictionsService = new DietaryRestrictionsService()
export const productService = new ProductService()
export const productSafetyService = new ProductSafetyService()
export const emergencyCardService = new EmergencyCardService()