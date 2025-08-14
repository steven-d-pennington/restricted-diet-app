/**
 * Review List Component
 * 
 * SAFETY CRITICAL: Displays filtered and sorted restaurant reviews
 * Provides comprehensive filtering for safety-focused review discovery
 */

import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, Pressable, Alert } from 'react-native'
import {
  RestaurantReviewWithDetails,
  ReviewFilterOptions,
  ReviewCategory,
  ReviewVerificationLevel
} from '../../types/database.types'
import type { ReviewSearchResult } from '../../services/reviewService'
import ReviewCard from './ReviewCard'
import ReviewFilters from './ReviewFilters'
import ReviewService from '../../services/reviewService'
import { useAuth } from '../../contexts/AuthContext'

interface ReviewListProps {
  restaurantId: string
  initialFilters?: ReviewFilterOptions
  onReviewSelect?: (review: RestaurantReviewWithDetails) => void
  onCreateReview?: () => void
  showFilters?: boolean
  highlightSafety?: boolean
  emptyStateMessage?: string
}

const DEFAULT_FILTERS: ReviewFilterOptions = {
  sort_by: 'date',
  sort_order: 'desc'
}

export default function ReviewList({
  restaurantId,
  initialFilters = DEFAULT_FILTERS,
  onReviewSelect,
  onCreateReview,
  showFilters = true,
  highlightSafety = false,
  emptyStateMessage = 'No reviews yet. Be the first to share your experience!'
}: ReviewListProps) {
  
  const { user } = useAuth()
  const [reviews, setReviews] = useState<RestaurantReviewWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [filters, setFilters] = useState<ReviewFilterOptions>(initialFilters)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [aggregatedStats, setAggregatedStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const REVIEWS_PER_PAGE = 10

  const loadReviews = useCallback(async (
    appliedFilters: ReviewFilterOptions = filters,
    offset: number = 0,
    append: boolean = false
  ) => {
    try {
      setError(null)
      
      const result = await ReviewService.getRestaurantReviews(
        restaurantId,
        appliedFilters,
        REVIEWS_PER_PAGE,
        offset
      )

      if (append) {
        setReviews(prev => [...prev, ...result.reviews])
      } else {
        setReviews(result.reviews)
      }

      setHasMore(result.has_more)
      setAggregatedStats(result.aggregated_stats)

    } catch (error) {
      console.error('Load reviews error:', error)
      setError('Failed to load reviews. Please try again.')
    }
  }, [restaurantId, filters])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadReviews(filters, 0, false)
    setRefreshing(false)
  }, [loadReviews, filters])

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    await loadReviews(filters, reviews.length, true)
    setLoadingMore(false)
  }, [loadReviews, loadingMore, hasMore, filters, reviews.length])

  const handleFiltersApply = useCallback(async (newFilters: ReviewFilterOptions) => {
    setFilters(newFilters)
    setLoading(true)
    await loadReviews(newFilters, 0, false)
    setLoading(false)
    setShowFilterPanel(false)
  }, [loadReviews])

  const handleReviewInteraction = useCallback(async (
    reviewId: string,
    interactionType: 'helpful' | 'not_helpful' | 'report' | 'thank'
  ) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to interact with reviews.')
      return
    }

    try {
      await ReviewService.submitReviewInteraction(reviewId, {
        type: interactionType
      })

      // Refresh the specific review's interaction data
      // In a real implementation, you'd update the specific review in the list
      handleRefresh()

    } catch (error) {
      console.error('Review interaction error:', error)
      Alert.alert('Error', 'Failed to submit interaction. Please try again.')
    }
  }, [user, handleRefresh])

  const handleReviewDetails = useCallback((review: RestaurantReviewWithDetails) => {
    if (onReviewSelect) {
      onReviewSelect(review)
    }
  }, [onReviewSelect])

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true)
      await loadReviews()
      setLoading(false)
    }

    initialLoad()
  }, []) // Only run on mount

  const renderReviewItem = ({ item, index }: { item: RestaurantReviewWithDetails, index: number }) => (
    <View className={index === 0 ? '' : 'mt-4'}>
      <ReviewCard
        review={item}
        onInteraction={(type) => handleReviewInteraction(item.id, type)}
        onViewDetails={() => handleReviewDetails(item)}
        highlightSafety={highlightSafety}
      />
    </View>
  )

  const renderHeader = () => (
    <View className="mb-4">
      {/* Stats Summary */}
      {aggregatedStats && (
        <View className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Review Summary
          </Text>
          
          <View className="flex-row justify-between mb-3">
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">
                {aggregatedStats.average_rating.toFixed(1)}
              </Text>
              <Text className="text-sm text-gray-600">Overall</Text>
            </View>
            
            {aggregatedStats.average_safety_rating > 0 && (
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-600">
                  {aggregatedStats.average_safety_rating.toFixed(1)}
                </Text>
                <Text className="text-sm text-gray-600">Safety</Text>
              </View>
            )}
            
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-600">
                {aggregatedStats.expert_reviews_count}
              </Text>
              <Text className="text-sm text-gray-600">Expert</Text>
            </View>
            
            {aggregatedStats.incident_reports_count > 0 && (
              <View className="items-center">
                <Text className="text-2xl font-bold text-red-600">
                  {aggregatedStats.incident_reports_count}
                </Text>
                <Text className="text-sm text-gray-600">Incidents</Text>
              </View>
            )}
          </View>

          {aggregatedStats.incident_reports_count > 0 && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-3">
              <View className="flex-row items-center">
                <Text className="text-red-600 text-lg mr-2">⚠️</Text>
                <Text className="text-sm font-medium text-red-800">
                  {aggregatedStats.incident_reports_count} safety incident(s) reported
                </Text>
              </View>
              <Text className="text-sm text-red-700 mt-1">
                Review incidents carefully before visiting this restaurant.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Filter and Sort Controls */}
      {showFilters && (
        <View className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-gray-900">
              Reviews ({reviews.length})
            </Text>
            
            <View className="flex-row space-x-2">
              <Pressable
                onPress={() => setShowFilterPanel(!showFilterPanel)}
                className={`px-3 py-2 rounded-lg border ${
                  showFilterPanel 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <Text className={`text-sm font-medium ${
                  showFilterPanel ? 'text-blue-800' : 'text-gray-700'
                }`}>
                  Filters
                </Text>
              </Pressable>
              
              {onCreateReview && (
                <Pressable
                  onPress={onCreateReview}
                  className="px-3 py-2 rounded-lg bg-blue-600"
                >
                  <Text className="text-sm font-medium text-white">
                    Write Review
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Quick Filter Tags */}
          <View className="flex-row flex-wrap">
            <Pressable
              onPress={() => handleFiltersApply({
                ...filters,
                incident_reports_only: !filters.incident_reports_only
              })}
              className={`mr-2 mb-2 px-3 py-1 rounded-full ${
                filters.incident_reports_only
                  ? 'bg-red-100 border border-red-300'
                  : 'bg-gray-100 border border-gray-300'
              }`}
            >
              <Text className={`text-sm ${
                filters.incident_reports_only ? 'text-red-800' : 'text-gray-700'
              }`}>
                ⚠️ Incidents Only
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleFiltersApply({
                ...filters,
                is_expert_review: !filters.is_expert_review
              })}
              className={`mr-2 mb-2 px-3 py-1 rounded-full ${
                filters.is_expert_review
                  ? 'bg-purple-100 border border-purple-300'
                  : 'bg-gray-100 border border-gray-300'
              }`}
            >
              <Text className={`text-sm ${
                filters.is_expert_review ? 'text-purple-800' : 'text-gray-700'
              }`}>
                👨‍⚕️ Expert Reviews
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleFiltersApply({
                ...filters,
                has_photos: !filters.has_photos
              })}
              className={`mr-2 mb-2 px-3 py-1 rounded-full ${
                filters.has_photos
                  ? 'bg-blue-100 border border-blue-300'
                  : 'bg-gray-100 border border-gray-300'
              }`}
            >
              <Text className={`text-sm ${
                filters.has_photos ? 'text-blue-800' : 'text-gray-700'
              }`}>
                📷 With Photos
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Advanced Filters Panel */}
      {showFilterPanel && (
        <ReviewFilters
          filters={filters}
          onApply={handleFiltersApply}
          onClose={() => setShowFilterPanel(false)}
        />
      )}
    </View>
  )

  const renderFooter = () => {
    if (!loadingMore) return null
    
    return (
      <View className="py-4">
        <Text className="text-center text-gray-500">Loading more reviews...</Text>
      </View>
    )
  }

  const renderEmptyState = () => (
    <View className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <Text className="text-center text-gray-500 text-lg mb-2">
        {emptyStateMessage}
      </Text>
      {onCreateReview && (
        <Pressable
          onPress={onCreateReview}
          className="mt-4 bg-blue-600 px-6 py-3 rounded-lg self-center"
        >
          <Text className="text-white font-medium">Write First Review</Text>
        </Pressable>
      )}
    </View>
  )

  const renderError = () => (
    <View className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <Text className="text-center text-red-600 text-lg mb-4">
        {error}
      </Text>
      <Pressable
        onPress={handleRefresh}
        className="bg-blue-600 px-6 py-3 rounded-lg self-center"
      >
        <Text className="text-white font-medium">Retry</Text>
      </Pressable>
    </View>
  )

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-500">Loading reviews...</Text>
      </View>
    )
  }

  if (error && reviews.length === 0) {
    return (
      <View className="flex-1 p-4">
        {renderError()}
      </View>
    )
  }

  return (
    <View className="flex-1">
      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      />
    </View>
  )
}