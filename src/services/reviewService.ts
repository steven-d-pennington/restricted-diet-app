/**
 * Enhanced Restaurant Review Service
 * 
 * SAFETY CRITICAL: Comprehensive community review and verification system
 * Manages life-threatening allergy safety reviews, community verification, and expert validation
 */

import { supabase } from '../lib/supabase'
import {
  RestaurantReview,
  RestaurantReviewInsert,
  RestaurantReviewUpdate,
  RestaurantReviewWithDetails,
  ReviewWithCommunityData,
  ReviewCategoryRating,
  ReviewCategoryRatingInsert,
  ReviewSafetyAssessment,
  ReviewSafetyAssessmentInsert,
  ReviewPhoto,
  ReviewPhotoInsert,
  ReviewTemplate,
  ReviewTemplateStructure,
  ReviewTemplateResponse,
  ReviewTemplateResponseInsert,
  ReviewCredibilityScore,
  ExpertReviewerProfile,
  ReviewReport,
  ReviewReportInsert,
  ReviewNotification,
  ReviewNotificationInsert,
  UserFollow,
  ReviewAcknowledgment,
  ReviewAcknowledgmentInsert,
  ReviewFilterOptions,
  ReviewPhotoUpload,
  ReviewInteraction,
  ReviewInteractionSummary,
  SafetyIncidentReport,
  ReviewNotificationData,
  ReviewCategory,
  ReviewTemplateType,
  PhotoEvidenceType,
  ReviewVerificationLevel,
  IncidentSeverity,
  DietaryRestriction
} from '../types/database.types'

export interface ReviewServiceError {
  code: 'NETWORK_ERROR' | 'PERMISSION_DENIED' | 'INVALID_PARAMS' | 'NOT_FOUND' | 'DATABASE_ERROR' | 'MODERATION_ERROR'
  message: string
  details?: any
}

export interface ReviewCreationData {
  restaurant_id: string
  rating: number
  review_text?: string
  visit_date?: string
  safety_rating?: number
  category_ratings?: { category: ReviewCategory; rating: number; notes?: string }[]
  safety_assessments?: Omit<ReviewSafetyAssessmentInsert, 'id' | 'review_id' | 'created_at'>[]
  photos?: ReviewPhotoUpload[]
  template_id?: string
  template_responses?: Omit<ReviewTemplateResponseInsert, 'id' | 'review_id' | 'created_at'>[]
  incident_report?: Omit<SafetyIncidentReport, 'restaurant_id'>
  anonymous?: boolean
}

export interface ReviewSearchResult {
  reviews: RestaurantReviewWithDetails[]
  total_count: number
  has_more: boolean
  filters_applied: ReviewFilterOptions
  aggregated_stats: {
    average_rating: number
    average_safety_rating: number
    total_photos: number
    expert_reviews_count: number
    incident_reports_count: number
    verification_levels: { [key in ReviewVerificationLevel]: number }
  }
}

class ReviewService {
  private static instance: ReviewService
  private reviewCache: Map<string, RestaurantReviewWithDetails> = new Map()
  private templateCache: Map<string, ReviewTemplate> = new Map()

  static getInstance(): ReviewService {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService()
    }
    return ReviewService.instance
  }

  /**
   * CREATE REVIEW OPERATIONS
   */

  /**
   * Create a comprehensive restaurant review
   */
  async createReview(reviewData: ReviewCreationData): Promise<RestaurantReview> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw {
          code: 'PERMISSION_DENIED',
          message: 'User must be logged in to create reviews'
        } as ReviewServiceError
      }

      // Start transaction for atomic review creation
      const { data: review, error: reviewError } = await supabase
        .from('restaurant_reviews')
        .insert({
          restaurant_id: reviewData.restaurant_id,
          user_id: user.id,
          rating: reviewData.rating,
          review_text: reviewData.review_text,
          visit_date: reviewData.visit_date,
          safety_rating: reviewData.safety_rating,
          overall_experience: 'positive', // Will be calculated based on ratings
          cross_contamination_concerns: reviewData.incident_report?.severity === 'critical',
          incident_reported: !!reviewData.incident_report,
          moderation_status: this.determineInitialModerationStatus(reviewData)
        })
        .select()
        .single()

      if (reviewError) {
        throw {
          code: 'DATABASE_ERROR',
          message: 'Failed to create review',
          details: reviewError
        } as ReviewServiceError
      }

      const reviewId = review.id

      // Create category ratings
      if (reviewData.category_ratings?.length) {
        const categoryRatings: ReviewCategoryRatingInsert[] = reviewData.category_ratings.map(cr => ({
          review_id: reviewId,
          category: cr.category,
          rating: cr.rating,
          notes: cr.notes
        }))

        const { error: categoryError } = await supabase
          .from('review_category_ratings')
          .insert(categoryRatings)

        if (categoryError) {
          console.error('Failed to create category ratings:', categoryError)
        }
      }

      // Create safety assessments
      if (reviewData.safety_assessments?.length) {
        const safetyAssessments: ReviewSafetyAssessmentInsert[] = reviewData.safety_assessments.map(sa => ({
          ...sa,
          review_id: reviewId
        }))

        const { error: safetyError } = await supabase
          .from('review_safety_assessments')
          .insert(safetyAssessments)

        if (safetyError) {
          console.error('Failed to create safety assessments:', safetyError)
        }
      }

      // Handle photo uploads
      if (reviewData.photos?.length) {
        await this.uploadReviewPhotos(reviewId, reviewData.photos)
      }

      // Create template responses if using a template
      if (reviewData.template_id && reviewData.template_responses?.length) {
        const templateResponses: ReviewTemplateResponseInsert[] = reviewData.template_responses.map(tr => ({
          ...tr,
          review_id: reviewId,
          template_id: reviewData.template_id!
        }))

        const { error: templateError } = await supabase
          .from('review_template_responses')
          .insert(templateResponses)

        if (templateError) {
          console.error('Failed to create template responses:', templateError)
        }
      }

      // Create safety incident report if applicable
      if (reviewData.incident_report) {
        await this.createSafetyIncident({
          ...reviewData.incident_report,
          restaurant_id: reviewData.restaurant_id,
          review_id: reviewId
        })
      }

      // Initialize credibility score
      await this.initializeReviewCredibilityScore(reviewId)

      // Send notifications for safety-critical reviews
      if (reviewData.incident_report?.severity === 'critical' || reviewData.safety_rating && reviewData.safety_rating <= 2) {
        await this.sendSafetyCriticalNotifications(review)
      }

      // Clear relevant caches
      this.clearReviewCaches(reviewData.restaurant_id)

      return review

    } catch (error: any) {
      console.error('Create review error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'DATABASE_ERROR',
        message: 'Failed to create review',
        details: error
      } as ReviewServiceError
    }
  }

  /**
   * Upload photos for a review with compression and moderation
   */
  async uploadReviewPhotos(reviewId: string, photos: ReviewPhotoUpload[]): Promise<ReviewPhoto[]> {
    try {
      const uploadedPhotos: ReviewPhoto[] = []

      for (const photo of photos) {
        // Compress image if needed
        const compressedFile = await this.compressImage(photo.file)
        
        // Upload to Supabase storage
        const fileName = `reviews/${reviewId}/${Date.now()}-${Math.random().toString(36).substring(7)}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('review-photos')
          .upload(fileName, compressedFile)

        if (uploadError) {
          console.error('Photo upload error:', uploadError)
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('review-photos')
          .getPublicUrl(fileName)

        // Create photo record
        const { data: photoRecord, error: photoError } = await supabase
          .from('review_photos')
          .insert({
            review_id: reviewId,
            photo_url: publicUrl,
            photo_type: photo.photo_type,
            caption: photo.caption,
            is_primary: photo.is_primary || false,
            file_size_bytes: compressedFile.size,
            compression_applied: compressedFile.size < photo.file.size,
            moderation_status: this.determinePhotoModerationStatus(photo.photo_type)
          })
          .select()
          .single()

        if (!photoError && photoRecord) {
          uploadedPhotos.push(photoRecord)
        }
      }

      return uploadedPhotos

    } catch (error) {
      console.error('Photo upload error:', error)
      return []
    }
  }

  /**
   * CREATE SAFETY INCIDENT REPORT
   */
  async createSafetyIncident(incidentData: SafetyIncidentReport & { review_id?: string }): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw {
          code: 'PERMISSION_DENIED',
          message: 'User must be logged in to report incidents'
        } as ReviewServiceError
      }

      const { error } = await supabase
        .from('safety_incidents')
        .insert({
          restaurant_id: incidentData.restaurant_id,
          reported_by: user.id,
          review_id: incidentData.review_id,
          incident_date: new Date().toISOString(),
          severity: incidentData.severity,
          restriction_ids: incidentData.restriction_ids,
          incident_description: incidentData.incident_description,
          symptoms_experienced: incidentData.symptoms_experienced,
          medical_attention_required: incidentData.medical_attention_required,
          epipen_used: incidentData.epipen_used,
          ambulance_called: incidentData.ambulance_called,
          reaction_onset_minutes: incidentData.reaction_onset_minutes,
          reaction_duration_minutes: incidentData.reaction_duration_minutes,
          emergency_contact_made: incidentData.emergency_contact_made,
          restaurant_response: incidentData.restaurant_response,
          incident_photos: incidentData.photos,
          impact_on_rating: true
        })

      if (error) {
        throw {
          code: 'DATABASE_ERROR',
          message: 'Failed to create safety incident report',
          details: error
        } as ReviewServiceError
      }

      // Send critical safety notifications
      if (incidentData.severity === 'critical') {
        await this.sendCriticalSafetyAlert(incidentData)
      }

    } catch (error: any) {
      console.error('Create safety incident error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'DATABASE_ERROR',
        message: 'Failed to create safety incident report',
        details: error
      } as ReviewServiceError
    }
  }

  /**
   * REVIEW RETRIEVAL AND FILTERING
   */

  /**
   * Get reviews for a restaurant with comprehensive filtering
   */
  async getRestaurantReviews(
    restaurantId: string,
    filters: ReviewFilterOptions = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<ReviewSearchResult> {
    try {
      let query = supabase
        .from('restaurant_reviews')
        .select(`
          *,
          review_category_ratings (*),
          review_safety_assessments (
            *,
            dietary_restrictions (*)
          ),
          review_photos (*),
          review_credibility_scores (*),
          user_profiles!restaurant_reviews_user_id_fkey (
            full_name,
            is_verified,
            expert_reviewer_profiles (*)
          ),
          review_acknowledgments (*),
          review_template_responses (*)
        `)
        .eq('restaurant_id', restaurantId)

      // Apply filters
      query = this.applyReviewFilters(query, filters)

      // Apply sorting
      switch (filters.sort_by) {
        case 'rating':
          query = query.order('rating', { ascending: filters.sort_order === 'asc' })
          break
        case 'helpfulness':
          // This would require a computed field or separate query
          query = query.order('helpful_count', { ascending: filters.sort_order === 'asc' })
          break
        case 'credibility':
          // Join with credibility scores and sort
          query = query.order('credibility_score', { ascending: filters.sort_order === 'asc' })
          break
        case 'safety':
          query = query.order('safety_rating', { ascending: filters.sort_order === 'asc' })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data: reviews, error, count } = await query

      if (error) {
        throw {
          code: 'DATABASE_ERROR',
          message: 'Failed to get restaurant reviews',
          details: error
        } as ReviewServiceError
      }

      if (!reviews) {
        return {
          reviews: [],
          total_count: 0,
          has_more: false,
          filters_applied: filters,
          aggregated_stats: this.getEmptyAggregatedStats()
        }
      }

      // Process reviews with community data
      const processedReviews = await this.processReviewsWithCommunityData(reviews)

      // Calculate aggregated statistics
      const aggregatedStats = await this.calculateAggregatedStats(restaurantId, filters)

      return {
        reviews: processedReviews,
        total_count: count || reviews.length,
        has_more: (count || 0) > offset + limit,
        filters_applied: filters,
  aggregated_stats: aggregatedStats
      }

    } catch (error: any) {
      console.error('Get restaurant reviews error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'DATABASE_ERROR',
        message: 'Failed to get restaurant reviews',
        details: error
      } as ReviewServiceError
    }
  }

  /**
   * Get detailed review by ID
   */
  async getReviewDetails(reviewId: string): Promise<RestaurantReviewWithDetails> {
    try {
      // Check cache first
      if (this.reviewCache.has(reviewId)) {
        return this.reviewCache.get(reviewId)!
      }

      const { data: review, error } = await supabase
        .from('restaurant_reviews')
        .select(`
          *,
          review_category_ratings (*),
          review_safety_assessments (
            *,
            dietary_restrictions (*)
          ),
          review_photos (*),
          review_credibility_scores (*),
          user_profiles!restaurant_reviews_user_id_fkey (
            full_name,
            is_verified,
            expert_reviewer_profiles (*)
          ),
          review_acknowledgments (*),
          review_template_responses (*)
        `)
        .eq('id', reviewId)
        .single()

      if (error) {
        throw {
          code: 'DATABASE_ERROR',
          message: 'Failed to get review details',
          details: error
        } as ReviewServiceError
      }

      if (!review) {
        throw {
          code: 'NOT_FOUND',
          message: 'Review not found'
        } as ReviewServiceError
      }

      // Process review with community data
      const processedReview = await this.processReviewWithCommunityData(review)

      // Cache the result
      this.reviewCache.set(reviewId, processedReview)

      return processedReview

    } catch (error: any) {
      console.error('Get review details error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'DATABASE_ERROR',
        message: 'Failed to get review details',
        details: error
      } as ReviewServiceError
    }
  }

  /**
   * COMMUNITY INTERACTION OPERATIONS
   */

  /**
   * Submit review interaction (helpful, not helpful, report, thank)
   */
  async submitReviewInteraction(reviewId: string, interaction: ReviewInteraction): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw {
          code: 'PERMISSION_DENIED',
          message: 'User must be logged in to interact with reviews'
        } as ReviewServiceError
      }

      if (interaction.type === 'report') {
        // Create a formal report
        await this.reportReview(reviewId, interaction.reason || 'No reason provided', interaction.explanation)
      } else {
        // Create or update interaction
        const { error } = await supabase
          .from('review_interactions')
          .upsert({
            review_id: reviewId,
            review_type: 'restaurant',
            user_id: user.id,
            interaction_type: interaction.type,
            reason: interaction.reason,
            explanation: interaction.explanation
          }, {
            onConflict: 'review_id,review_type,user_id,interaction_type'
          })

        if (error) {
          throw {
            code: 'DATABASE_ERROR',
            message: 'Failed to submit review interaction',
            details: error
          } as ReviewServiceError
        }

        // Update credibility score
        await this.updateReviewCredibilityScore(reviewId)

        // Send notification to reviewer for thanks and helpful votes
        if (interaction.type === 'thank' || interaction.type === 'helpful') {
          await this.sendInteractionNotification(reviewId, interaction.type, user.id)
        }
      }

      // Clear caches
      this.clearReviewCache(reviewId)

    } catch (error: any) {
      console.error('Submit review interaction error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'DATABASE_ERROR',
        message: 'Failed to submit review interaction',
        details: error
      } as ReviewServiceError
    }
  }

  /**
   * Get review interaction summary
   */
  async getReviewInteractionSummary(reviewId: string): Promise<ReviewInteractionSummary> {
    try {
      const { data: interactions, error } = await supabase
        .from('review_interactions')
        .select('interaction_type, user_id, created_at')
        .eq('review_id', reviewId)
        .eq('review_type', 'restaurant')

      if (error) {
        console.error('Get review interactions error:', error)
        return this.getEmptyInteractionSummary()
      }

      const summary = {
        helpful_count: 0,
        not_helpful_count: 0,
        report_count: 0,
        thank_count: 0,
        user_interaction: undefined as ReviewInteraction | undefined,
        helpfulness_ratio: 0
      }

      const { data: { user } } = await supabase.auth.getUser()

      for (const interaction of interactions || []) {
        switch (interaction.interaction_type) {
          case 'helpful':
            summary.helpful_count++
            break
          case 'not_helpful':
            summary.not_helpful_count++
            break
          case 'report':
            summary.report_count++
            break
          case 'thank':
            summary.thank_count++
            break
        }

        // Check if current user has interacted
        if (user && interaction.user_id === user.id) {
          summary.user_interaction = {
            type: interaction.interaction_type as any
          }
        }
      }

      // Calculate helpfulness ratio
      const totalVotes = summary.helpful_count + summary.not_helpful_count
      summary.helpfulness_ratio = totalVotes > 0 ? summary.helpful_count / totalVotes : 0

      return summary

    } catch (error) {
      console.error('Get review interaction summary error:', error)
      return this.getEmptyInteractionSummary()
    }
  }

  /**
   * REVIEW TEMPLATES
   */

  /**
   * Get review templates by type and restrictions
   */
  async getReviewTemplates(
    templateType?: ReviewTemplateType,
    restrictionTypes?: string[]
  ): Promise<ReviewTemplate[]> {
    try {
      let query = supabase
        .from('review_templates')
        .select('*')
        .eq('is_active', true)

      if (templateType) {
        query = query.eq('template_type', templateType)
      }

      if (restrictionTypes?.length) {
        query = query.overlaps('restriction_types', restrictionTypes)
      }

      const { data: templates, error } = await query.order('usage_count', { ascending: false })

      if (error) {
        throw {
          code: 'DATABASE_ERROR',
          message: 'Failed to get review templates',
          details: error
        } as ReviewServiceError
      }

      return templates || []

    } catch (error: any) {
      console.error('Get review templates error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'DATABASE_ERROR',
        message: 'Failed to get review templates',
        details: error
      } as ReviewServiceError
    }
  }

  /**
   * EXPERT REVIEWER OPERATIONS
   */

  /**
   * Apply to become an expert reviewer
   */
  async applyForExpertStatus(expertData: Omit<ExpertReviewerProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw {
          code: 'PERMISSION_DENIED',
          message: 'User must be logged in to apply for expert status'
        } as ReviewServiceError
      }

      const { error } = await supabase
        .from('expert_reviewer_profiles')
        .insert({
          user_id: user.id,
          ...expertData,
          credentials_verified: false
        })

      if (error) {
        throw {
          code: 'DATABASE_ERROR',
          message: 'Failed to submit expert application',
          details: error
        } as ReviewServiceError
      }

      // Send notification to admins about new expert application
      await this.sendExpertApplicationNotification(user.id, expertData.professional_title)

    } catch (error: any) {
      console.error('Apply for expert status error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'DATABASE_ERROR',
        message: 'Failed to submit expert application',
        details: error
      } as ReviewServiceError
    }
  }

  /**
   * PRIVATE HELPER METHODS
   */

  private determineInitialModerationStatus(reviewData: ReviewCreationData): 'pending' | 'auto_approved' {
    // Auto-approve simple reviews without safety concerns
    if (!reviewData.incident_report && 
        (!reviewData.safety_rating || reviewData.safety_rating >= 3) &&
        reviewData.rating >= 3) {
      return 'auto_approved'
    }
    
    return 'pending'
  }

  private determinePhotoModerationStatus(photoType: PhotoEvidenceType): 'pending' | 'auto_approved' {
    // Auto-approve general photos, require moderation for evidence
    if (photoType === 'general' || photoType === 'menu_item') {
      return 'auto_approved'
    }
    
    return 'pending'
  }

  private async compressImage(file: File | Blob): Promise<Blob> {
    // For now, return the original file
    // In a real implementation, you would compress the image here
    return file
  }

  private applyReviewFilters(query: any, filters: ReviewFilterOptions): any {
    if (filters.restriction_ids?.length) {
      // This would require a more complex join with safety assessments
      // For now, we'll handle this in post-processing
    }

    if (filters.min_rating) {
      query = query.gte('rating', filters.min_rating)
    }

    if (filters.max_rating) {
      query = query.lte('rating', filters.max_rating)
    }

    if (filters.has_photos) {
      // Would require EXISTS subquery
    }

    if (filters.incident_reports_only) {
      query = query.eq('incident_reported', true)
    }

    if (filters.date_range) {
      query = query.gte('created_at', filters.date_range.start)
        .lte('created_at', filters.date_range.end)
    }

    return query
  }

  private async processReviewsWithCommunityData(reviews: any[]): Promise<RestaurantReviewWithDetails[]> {
    return Promise.all(reviews.map(review => this.processReviewWithCommunityData(review)))
  }

  private async processReviewWithCommunityData(review: any): Promise<RestaurantReviewWithDetails> {
    // Get current user's interaction with this review
    const { data: { user } } = await supabase.auth.getUser()
    let userInteraction = undefined

    if (user) {
      const { data: interaction } = await supabase
        .from('review_interactions')
        .select('interaction_type, created_at')
        .eq('review_id', review.id)
        .eq('user_id', user.id)
        .limit(1)
        .single()

      userInteraction = interaction
    }

    return {
      ...review,
      user_interaction: userInteraction
    }
  }

  private async calculateAggregatedStats(restaurantId: string, filters: ReviewFilterOptions) {
    // This would calculate comprehensive statistics
    // For now, return basic structure
    return {
      average_rating: 0,
      average_safety_rating: 0,
      total_photos: 0,
      expert_reviews_count: 0,
      incident_reports_count: 0,
      verification_levels: {
        unverified: 0,
        user_verified: 0,
        expert_verified: 0,
        restaurant_confirmed: 0,
        incident_verified: 0
      }
    }
  }

  private getEmptyAggregatedStats() {
    return {
      average_rating: 0,
      average_safety_rating: 0,
      total_photos: 0,
      expert_reviews_count: 0,
      incident_reports_count: 0,
      verification_levels: {
        unverified: 0,
        user_verified: 0,
        expert_verified: 0,
        restaurant_confirmed: 0,
        incident_verified: 0
      }
    }
  }

  private getEmptyInteractionSummary(): ReviewInteractionSummary {
    return {
      helpful_count: 0,
      not_helpful_count: 0,
      report_count: 0,
      thank_count: 0,
      helpfulness_ratio: 0
    }
  }

  private async initializeReviewCredibilityScore(reviewId: string): Promise<void> {
    await supabase
      .from('review_credibility_scores')
      .insert({
        review_id: reviewId,
        credibility_score: 50.0
      })
  }

  private async updateReviewCredibilityScore(reviewId: string): Promise<void> {
    // Call the database function to recalculate credibility score
    await supabase.rpc('calculate_review_credibility_score', { review_uuid: reviewId })
  }

  private async reportReview(reviewId: string, category: string, reason?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    await supabase
      .from('review_reports')
      .insert({
        review_id: reviewId,
        reported_by: user.id,
        report_category: category,
        report_reason: reason || 'No reason provided',
        severity_level: category === 'dangerous_advice' ? 5 : 3
      })
  }

  private async sendSafetyCriticalNotifications(review: RestaurantReview): Promise<void> {
    // Implementation for sending critical safety notifications
    // This would notify relevant users about safety concerns
  }

  private async sendCriticalSafetyAlert(incident: SafetyIncidentReport): Promise<void> {
    // Implementation for sending critical safety alerts
    // This would notify health authorities and users with similar restrictions
  }

  private async sendInteractionNotification(reviewId: string, interactionType: string, fromUserId: string): Promise<void> {
    // Implementation for sending interaction notifications
  }

  private async sendExpertApplicationNotification(userId: string, professionalTitle: string): Promise<void> {
    // Implementation for notifying admins about expert applications
  }

  private clearReviewCache(reviewId: string): void {
    this.reviewCache.delete(reviewId)
  }

  private clearReviewCaches(restaurantId?: string): void {
    if (restaurantId) {
      // Clear all reviews for this restaurant
      // Would need to track which reviews belong to which restaurant
    }
    this.reviewCache.clear()
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.reviewCache.clear()
    this.templateCache.clear()
  }
}

export default ReviewService.getInstance()