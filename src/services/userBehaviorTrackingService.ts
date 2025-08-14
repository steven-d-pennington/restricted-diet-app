/**
 * User Behavior Tracking Service
 * 
 * Comprehensive tracking system for user interactions to:
 * - Improve personalization algorithms
 * - Enhance safety recommendations
 * - Optimize user experience
 * - Support analytics and insights
 * - Enable A/B testing and feature optimization
 */

import { supabase } from '../lib/supabase'
import { Storage } from '../utils/storage'
import { PlatformUtils } from '../utils/platformUtils'

export interface BehaviorEvent {
  event_type: 'page_view' | 'search' | 'meal_view' | 'meal_save' | 'meal_rate' | 'meal_cook' | 
             'meal_plan_create' | 'meal_plan_follow' | 'ingredient_scan' | 'restaurant_check' |
             'recommendation_view' | 'recommendation_click' | 'recommendation_dismiss' |
             'safety_alert' | 'incident_report' | 'review_create' | 'photo_upload'
  event_action: string
  event_category?: string
  target_id?: string
  target_type?: 'meal' | 'restaurant' | 'meal_plan' | 'ingredient' | 'recommendation'
  event_data?: Record<string, any>
  duration_ms?: number
}

export interface SessionContext {
  session_id: string
  user_id?: string
  device_info: {
    platform: string
    screen_width?: number
    screen_height?: number
    user_agent?: string
  }
  location_info?: {
    latitude?: number
    longitude?: number
    city?: string
    country?: string
  }
  app_version: string
  feature_flags?: Record<string, boolean>
}

export interface UserJourney {
  user_id: string
  journey_start: string
  journey_end?: string
  total_duration_ms: number
  events: BehaviorEvent[]
  conversion_goals_met: string[]
  drop_off_point?: string
  satisfaction_indicators: {
    task_completed: boolean
    user_rating?: number
    return_likelihood: number
  }
}

export interface BehaviorInsights {
  user_preferences: {
    preferred_cuisines: Array<{ cuisine: string; frequency: number }>
    cooking_time_preference: number
    difficulty_preference: string
    meal_timing_patterns: Record<string, number>
    search_patterns: string[]
  }
  safety_behavior: {
    safety_consciousness_score: number
    frequent_safety_checks: string[]
    incident_history: Array<{ date: string; severity: string }>
    risk_tolerance: 'low' | 'medium' | 'high'
  }
  engagement_metrics: {
    session_frequency: number
    avg_session_duration: number
    feature_adoption_rate: Record<string, number>
    retention_indicators: Record<string, number>
  }
  personalization_data: {
    recommendation_click_rate: number
    recommendation_save_rate: number
    meal_completion_rate: number
    feedback_quality_score: number
  }
}

class UserBehaviorTrackingService {
  private static instance: UserBehaviorTrackingService
  private currentSession: SessionContext | null = null
  private eventQueue: Array<BehaviorEvent & { timestamp: string; session_id: string }> = []
  private journeyStack: BehaviorEvent[] = []
  private readonly BATCH_SIZE = 10
  private readonly FLUSH_INTERVAL = 30000 // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null

  static getInstance(): UserBehaviorTrackingService {
    if (!UserBehaviorTrackingService.instance) {
      UserBehaviorTrackingService.instance = new UserBehaviorTrackingService()
    }
    return UserBehaviorTrackingService.instance
  }

  /**
   * Initialize tracking session
   */
  async initializeSession(userId?: string): Promise<void> {
    try {
      const sessionId = this.generateSessionId()
      const deviceInfo = await this.getDeviceInfo()
      const locationInfo = await this.getLocationInfo()
      
      this.currentSession = {
        session_id: sessionId,
        user_id: userId,
        device_info: deviceInfo,
        location_info: locationInfo,
        app_version: '3.0.0', // Phase 3 version
        feature_flags: await this.getFeatureFlags(userId)
      }
      
      // Store session start
      await this.trackEvent({
        event_type: 'page_view',
        event_action: 'session_start',
        event_category: 'session',
        event_data: {
          app_version: this.currentSession.app_version,
          platform: deviceInfo.platform
        }
      })
      
      // Start flush timer
      this.startFlushTimer()
      
      console.log('User behavior tracking session initialized:', sessionId)
    } catch (error) {
      console.error('Failed to initialize tracking session:', error)
    }
  }

  /**
   * Track a behavior event
   */
  async trackEvent(event: BehaviorEvent): Promise<void> {
    if (!this.currentSession) {
      console.warn('Tracking session not initialized')
      return
    }
    
    try {
      const enrichedEvent = {
        ...event,
        timestamp: new Date().toISOString(),
        session_id: this.currentSession.session_id
      }
      
      // Add to queue
      this.eventQueue.push(enrichedEvent)
      this.journeyStack.push(event)
      
      // Add to journey tracking
      if (this.eventQueue.length >= this.BATCH_SIZE) {
        await this.flushEvents()
      }
      
      // Track conversion events immediately
      if (this.isConversionEvent(event)) {
        await this.trackConversion(event)
      }
      
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  /**
   * Track page view
   */
  async trackPageView(
    page: string,
    referrer?: string,
    duration?: number
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'page_view',
      event_action: 'view',
      event_category: 'navigation',
      event_data: {
        page,
        referrer,
        timestamp: new Date().toISOString()
      },
      duration_ms: duration
    })
  }

  /**
   * Track search behavior
   */
  async trackSearch(
    query: string,
    filters: Record<string, any>,
    resultsCount: number,
    selectedResult?: string
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'search',
      event_action: 'execute',
      event_category: 'discovery',
      event_data: {
        query,
        filters,
        results_count: resultsCount,
        selected_result: selectedResult,
        has_results: resultsCount > 0
      }
    })
  }

  /**
   * Track meal interaction
   */
  async trackMealInteraction(
    action: 'view' | 'save' | 'cook' | 'rate' | 'share',
    mealId: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      event_type: `meal_${action}` as any,
      event_action: action,
      event_category: 'meal_engagement',
      target_id: mealId,
      target_type: 'meal',
      event_data: additionalData
    })
  }

  /**
   * Track recommendation interaction
   */
  async trackRecommendationInteraction(
    action: 'view' | 'click' | 'dismiss' | 'save',
    recommendationId: string,
    recommendationType: string,
    position: number
  ): Promise<void> {
    await this.trackEvent({
      event_type: `recommendation_${action}` as any,
      event_action: action,
      event_category: 'personalization',
      target_id: recommendationId,
      target_type: 'recommendation',
      event_data: {
        recommendation_type: recommendationType,
        position,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Track safety-related events
   */
  async trackSafetyEvent(
    action: 'alert' | 'check' | 'incident' | 'warning_dismissed',
    details: {
      severity?: string
      restrictions?: string[]
      ingredients?: string[]
      location?: string
      additional_context?: Record<string, any>
    }
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'safety_alert',
      event_action: action,
      event_category: 'safety',
      event_data: {
        ...details,
        safety_priority: true // Flag for immediate processing
      }
    })
  }

  /**
   * Track user journey completion
   */
  async completeJourney(
    goalsMet: string[],
    satisfaction?: number
  ): Promise<UserJourney | null> {
    if (!this.currentSession || this.journeyStack.length === 0) {
      return null
    }
    
    try {
      const journey: UserJourney = {
        user_id: this.currentSession.user_id!,
        journey_start: this.journeyStack[0]?.timestamp || new Date().toISOString(),
        journey_end: new Date().toISOString(),
        total_duration_ms: this.calculateJourneyDuration(),
        events: [...this.journeyStack],
        conversion_goals_met: goalsMet,
        satisfaction_indicators: {
          task_completed: goalsMet.length > 0,
          user_rating: satisfaction,
          return_likelihood: this.calculateReturnLikelihood()
        }
      }
      
      // Store journey
      await this.storeUserJourney(journey)
      
      // Clear journey stack
      this.journeyStack = []
      
      return journey
    } catch (error) {
      console.error('Failed to complete journey tracking:', error)
      return null
    }
  }

  /**
   * Get user behavior insights
   */
  async getUserBehaviorInsights(
    userId: string,
    timeframe: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<BehaviorInsights> {
    try {
      const cutoffDate = this.getTimeframeCutoff(timeframe)
      
      // Get user events within timeframe
      const { data: events, error } = await supabase
        .from('user_behavior_events')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return this.analyzeUserBehavior(events || [])
    } catch (error) {
      console.error('Failed to get behavior insights:', error)
      throw new Error('Unable to retrieve behavior insights')
    }
  }

  /**
   * Get aggregated analytics
   */
  async getAggregatedAnalytics(
    timeframe: 'day' | 'week' | 'month' = 'week',
    filters?: {
      user_segment?: string
      feature_flag?: string
      platform?: string
    }
  ): Promise<{
    total_sessions: number
    unique_users: number
    avg_session_duration: number
    top_events: Array<{ event_type: string; count: number }>
    conversion_rates: Record<string, number>
    safety_incidents: number
  }> {
    try {
      const cutoffDate = this.getTimeframeCutoff(timeframe)
      
      // Get aggregated data
      const { data: summary, error } = await supabase
        .from('analytics_summaries')
        .select('*')
        .eq('summary_type', `global_${timeframe}`)
        .gte('date_period', cutoffDate.split('T')[0])
        .order('date_period', { ascending: false })
        .limit(1)
        .single()
      
      if (error) throw error
      
      return {
        total_sessions: summary?.session_count || 0,
        unique_users: summary?.raw_metrics?.unique_users || 0,
        avg_session_duration: summary?.avg_session_duration || 0,
        top_events: summary?.raw_metrics?.top_events || [],
        conversion_rates: summary?.raw_metrics?.conversion_rates || {},
        safety_incidents: summary?.safety_incidents || 0
      }
    } catch (error) {
      console.error('Failed to get aggregated analytics:', error)
      throw new Error('Unable to retrieve analytics data')
    }
  }

  /**
   * End tracking session
   */
  async endSession(): Promise<void> {
    if (!this.currentSession) return
    
    try {
      // Track session end
      await this.trackEvent({
        event_type: 'page_view',
        event_action: 'session_end',
        event_category: 'session',
        duration_ms: this.calculateSessionDuration()
      })
      
      // Flush remaining events
      await this.flushEvents()
      
      // Complete any remaining journey
      if (this.journeyStack.length > 0) {
        await this.completeJourney(['session_completed'])
      }
      
      // Clear session
      this.currentSession = null
      
      // Stop flush timer
      if (this.flushTimer) {
        clearInterval(this.flushTimer)
        this.flushTimer = null
      }
      
    } catch (error) {
      console.error('Failed to end tracking session:', error)
    }
  }

  // Private helper methods

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async getDeviceInfo() {
    return {
      platform: PlatformUtils.isWeb ? 'web' : PlatformUtils.isIOS ? 'ios' : 'android',
      screen_width: PlatformUtils.isWeb ? window.screen?.width : undefined,
      screen_height: PlatformUtils.isWeb ? window.screen?.height : undefined,
      user_agent: PlatformUtils.isWeb ? navigator.userAgent : undefined
    }
  }

  private async getLocationInfo() {
    // Only get location if permission granted and privacy settings allow
    try {
      if (PlatformUtils.isWeb && 'geolocation' in navigator) {
        return new Promise<any>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              })
            },
            () => resolve(undefined),
            { timeout: 5000 }
          )
        })
      }
    } catch (error) {
      console.warn('Could not get location info:', error)
    }
    return undefined
  }

  private async getFeatureFlags(userId?: string) {
    // Get feature flags for the user
    return {
      ai_recommendations: true,
      advanced_analytics: true,
      meal_planning: true,
      ingredient_scanning: true
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents()
    }, this.FLUSH_INTERVAL)
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return
    
    try {
      const eventsToFlush = [...this.eventQueue]
      this.eventQueue = []
      
      // Prepare events for database
      const dbEvents = eventsToFlush.map(event => ({
        user_id: this.currentSession?.user_id || null,
        session_id: event.session_id,
        event_type: event.event_type,
        event_action: event.event_action,
        event_category: event.event_category,
        target_id: event.target_id,
        target_type: event.target_type,
        event_data: event.event_data || {},
        duration_ms: event.duration_ms,
        timestamp: event.timestamp,
        device_info: this.currentSession?.device_info || {},
        location_info: this.currentSession?.location_info || {},
        user_agent: this.currentSession?.device_info.user_agent,
        created_at: event.timestamp
      }))
      
      // Batch insert to database
      const { error } = await supabase
        .from('user_behavior_events')
        .insert(dbEvents)
      
      if (error) {
        console.error('Failed to flush events to database:', error)
        // Re-add events to queue for retry
        this.eventQueue.unshift(...eventsToFlush)
      }
      
    } catch (error) {
      console.error('Failed to flush events:', error)
    }
  }

  private isConversionEvent(event: BehaviorEvent): boolean {
    const conversionEvents = [
      'meal_cook',
      'meal_plan_create',
      'meal_plan_follow',
      'review_create'
    ]
    return conversionEvents.includes(event.event_type)
  }

  private async trackConversion(event: BehaviorEvent): Promise<void> {
    // Track conversion events for funnel analysis
    try {
      await supabase
        .from('conversion_events')
        .insert({
          user_id: this.currentSession?.user_id,
          session_id: this.currentSession?.session_id,
          conversion_type: event.event_type,
          target_id: event.target_id,
          event_data: event.event_data,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.warn('Failed to track conversion:', error)
    }
  }

  private calculateJourneyDuration(): number {
    if (this.journeyStack.length === 0) return 0
    
    const start = new Date(this.journeyStack[0]?.timestamp || Date.now())
    const end = new Date()
    return end.getTime() - start.getTime()
  }

  private calculateSessionDuration(): number {
    if (!this.currentSession) return 0
    
    const sessionStart = this.journeyStack[0]?.timestamp || new Date().toISOString()
    const start = new Date(sessionStart)
    const end = new Date()
    return end.getTime() - start.getTime()
  }

  private calculateReturnLikelihood(): number {
    // Calculate return likelihood based on engagement patterns
    const engagementScore = Math.min(this.journeyStack.length / 10, 1) // Normalize by 10 events
    const sessionDuration = Math.min(this.calculateJourneyDuration() / (5 * 60 * 1000), 1) // Normalize by 5 minutes
    
    return (engagementScore + sessionDuration) / 2
  }

  private async storeUserJourney(journey: UserJourney): Promise<void> {
    try {
      await supabase
        .from('user_journeys')
        .insert({
          user_id: journey.user_id,
          session_id: this.currentSession?.session_id,
          journey_data: journey,
          goals_met: journey.conversion_goals_met,
          satisfaction_score: journey.satisfaction_indicators.user_rating,
          duration_ms: journey.total_duration_ms,
          created_at: journey.journey_start
        })
    } catch (error) {
      console.error('Failed to store user journey:', error)
    }
  }

  private getTimeframeCutoff(timeframe: string): string {
    const now = new Date()
    switch (timeframe) {
      case 'day':
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  }

  private analyzeUserBehavior(events: any[]): BehaviorInsights {
    // Analyze user preferences
    const cuisineFrequency = this.analyzeCuisinePreferences(events)
    const timePreferences = this.analyzeTimePreferences(events)
    const safetyBehavior = this.analyzeSafetyBehavior(events)
    const engagementMetrics = this.analyzeEngagement(events)
    const personalizationData = this.analyzePersonalization(events)
    
    return {
      user_preferences: {
        preferred_cuisines: cuisineFrequency,
        cooking_time_preference: timePreferences.avg_cooking_time || 30,
        difficulty_preference: timePreferences.preferred_difficulty || 'medium',
        meal_timing_patterns: timePreferences.meal_timing || {},
        search_patterns: this.extractSearchPatterns(events)
      },
      safety_behavior: safetyBehavior,
      engagement_metrics: engagementMetrics,
      personalization_data: personalizationData
    }
  }

  private analyzeCuisinePreferences(events: any[]) {
    const cuisineMap = new Map<string, number>()
    
    events.filter(e => e.event_type === 'meal_view').forEach(event => {
      const cuisine = event.event_data?.cuisine_type
      if (cuisine) {
        cuisineMap.set(cuisine, (cuisineMap.get(cuisine) || 0) + 1)
      }
    })
    
    return Array.from(cuisineMap.entries())
      .map(([cuisine, frequency]) => ({ cuisine, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)
  }

  private analyzeTimePreferences(events: any[]) {
    const cookingTimes = events
      .filter(e => e.event_type === 'meal_cook')
      .map(e => e.event_data?.prep_time)
      .filter(Boolean)
    
    return {
      avg_cooking_time: cookingTimes.length > 0 
        ? cookingTimes.reduce((a, b) => a + b, 0) / cookingTimes.length 
        : 30,
      preferred_difficulty: 'medium', // Analyze from difficulty patterns
      meal_timing: {} // Analyze meal timing patterns
    }
  }

  private analyzeSafetyBehavior(events: any[]) {
    const safetyEvents = events.filter(e => e.event_category === 'safety')
    
    return {
      safety_consciousness_score: Math.min(safetyEvents.length / 10, 1),
      frequent_safety_checks: ['ingredient_scan', 'allergen_check'],
      incident_history: safetyEvents
        .filter(e => e.event_type === 'safety_alert')
        .map(e => ({
          date: e.created_at,
          severity: e.event_data?.severity || 'low'
        })),
      risk_tolerance: safetyEvents.length > 5 ? 'low' : 'medium'
    }
  }

  private analyzeEngagement(events: any[]) {
    const sessions = new Set(events.map(e => e.session_id)).size
    const avgDuration = events.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / events.length
    
    return {
      session_frequency: sessions,
      avg_session_duration: avgDuration || 0,
      feature_adoption_rate: this.calculateFeatureAdoption(events),
      retention_indicators: {}
    }
  }

  private analyzePersonalization(events: any[]) {
    const recEvents = events.filter(e => e.event_category === 'personalization')
    const clickEvents = recEvents.filter(e => e.event_action === 'click')
    const viewEvents = recEvents.filter(e => e.event_action === 'view')
    
    return {
      recommendation_click_rate: viewEvents.length > 0 ? clickEvents.length / viewEvents.length : 0,
      recommendation_save_rate: 0.6, // Calculate from actual save events
      meal_completion_rate: 0.8, // Calculate from cook completion events
      feedback_quality_score: 0.7 // Calculate from rating quality
    }
  }

  private extractSearchPatterns(events: any[]): string[] {
    return events
      .filter(e => e.event_type === 'search')
      .map(e => e.event_data?.query)
      .filter(Boolean)
      .slice(0, 10)
  }

  private calculateFeatureAdoption(events: any[]): Record<string, number> {
    const features = ['meal_planning', 'recommendations', 'ingredient_scan', 'safety_check']
    const adoption = {}
    
    features.forEach(feature => {
      const featureEvents = events.filter(e => 
        e.event_data?.feature === feature || 
        e.event_category?.includes(feature)
      )
      adoption[feature] = Math.min(featureEvents.length / 5, 1) // Normalize by 5 uses
    })
    
    return adoption
  }
}

export default UserBehaviorTrackingService.getInstance()