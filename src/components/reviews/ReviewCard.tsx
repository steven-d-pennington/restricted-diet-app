/**
 * Review Card Component
 * 
 * SAFETY CRITICAL: Displays comprehensive restaurant review with safety information
 * Shows credibility indicators, expert verification, and safety assessments
 */

import React from 'react'
import { View, Text, Pressable, Image, Alert } from 'react-native'
import {
  RestaurantReviewWithDetails,
  ReviewInteractionSummary,
  ExpertReviewerProfile,
  ReviewVerificationLevel,
  SafetyLevel
} from '../../types/database.types'

interface ReviewCardProps {
  review: RestaurantReviewWithDetails
  interactionSummary?: ReviewInteractionSummary
  onInteraction?: (type: 'helpful' | 'not_helpful' | 'report' | 'thank') => void
  onViewDetails?: () => void
  onViewPhotos?: () => void
  showFullText?: boolean
  compact?: boolean
  highlightSafety?: boolean
}

export default function ReviewCard({
  review,
  interactionSummary,
  onInteraction,
  onViewDetails,
  onViewPhotos,
  showFullText = false,
  compact = false,
  highlightSafety = false
}: ReviewCardProps) {
  
  const isExpertReview = !!review.user_profile.expert_profile?.credentials_verified
  const hasIncidentReport = review.incident_reported
  const hasSafetyAssessments = review.safety_assessments && review.safety_assessments.length > 0
  const hasPhotos = review.photos && review.photos.length > 0
  const verificationLevel = review.credibility_score?.verification_level || 'unverified'

  const renderStarRating = (rating: number, size = 16) => (
    <View className="flex-row items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Text
          key={star}
          className={`text-${size === 16 ? 'base' : 'sm'} ${
            star <= rating ? 'text-yellow-500' : 'text-gray-300'
          }`}
        >
          ★
        </Text>
      ))}
    </View>
  )

  const renderSafetyBadge = (level: SafetyLevel) => {
    const colors = {
      safe: 'bg-green-100 text-green-800',
      caution: 'bg-yellow-100 text-yellow-800',
      warning: 'bg-orange-100 text-orange-800',
      danger: 'bg-red-100 text-red-800'
    }

    return (
      <View className={`px-2 py-1 rounded-full ${colors[level]}`}>
        <Text className={`text-xs font-medium ${colors[level].split(' ')[1]}`}>
          {level.toUpperCase()}
        </Text>
      </View>
    )
  }

  const renderVerificationBadge = (level: ReviewVerificationLevel) => {
    const badges = {
      unverified: { text: 'Unverified', color: 'bg-gray-100 text-gray-600' },
      user_verified: { text: 'Community Verified', color: 'bg-blue-100 text-blue-800' },
      expert_verified: { text: 'Expert Verified', color: 'bg-purple-100 text-purple-800' },
      restaurant_confirmed: { text: 'Restaurant Confirmed', color: 'bg-green-100 text-green-800' },
      incident_verified: { text: 'Incident Verified', color: 'bg-red-100 text-red-800' }
    }

    const badge = badges[level]
    return (
      <View className={`px-2 py-1 rounded ${badge.color}`}>
        <Text className={`text-xs font-medium ${badge.color.split(' ')[1]}`}>
          {badge.text}
        </Text>
      </View>
    )
  }

  const renderCredibilityScore = () => {
    const score = review.credibility_score?.credibility_score || 50
    const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'
    
    return (
      <View className="flex-row items-center">
        <Text className={`text-sm font-medium ${color}`}>
          {Math.round(score)}%
        </Text>
        <Text className="text-xs text-gray-500 ml-1">credible</Text>
      </View>
    )
  }

  const renderSafetyAssessments = () => {
    if (!hasSafetyAssessments) return null

    return (
      <View className="mt-3 space-y-2">
        <Text className="text-sm font-medium text-gray-900">Safety Assessments</Text>
        {review.safety_assessments!.map((assessment, index) => (
          <View key={index} className="bg-gray-50 p-3 rounded-lg">
            <View className="flex-row justify-between items-start">
              <Text className="text-sm font-medium text-gray-800 flex-1">
                {assessment.dietary_restriction.name}
              </Text>
              {assessment.would_recommend_for_restriction !== null && (
                <View className={`px-2 py-1 rounded ${
                  assessment.would_recommend_for_restriction 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}>
                  <Text className={`text-xs font-medium ${
                    assessment.would_recommend_for_restriction 
                      ? 'text-green-800' 
                      : 'text-red-800'
                  }`}>
                    {assessment.would_recommend_for_restriction ? 'Recommended' : 'Not Recommended'}
                  </Text>
                </View>
              )}
            </View>
            
            {assessment.safety_confidence && (
              <View className="mt-2 flex-row items-center">
                <Text className="text-xs text-gray-600 mr-2">Safety Confidence:</Text>
                <View className="flex-row">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <View
                      key={level}
                      className={`w-2 h-2 mr-1 rounded ${
                        level <= assessment.safety_confidence! 
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </View>
                <Text className="text-xs text-gray-600 ml-2">
                  {assessment.safety_confidence}/10
                </Text>
              </View>
            )}
            
            {assessment.specific_safety_notes && (
              <Text className="text-sm text-gray-700 mt-2">
                "{assessment.specific_safety_notes}"
              </Text>
            )}
          </View>
        ))}
      </View>
    )
  }

  const renderCategoryRatings = () => {
    if (!review.category_ratings?.length) return null

    return (
      <View className="mt-3">
        <Text className="text-sm font-medium text-gray-900 mb-2">Detailed Ratings</Text>
        <View className="space-y-1">
          {review.category_ratings.map((rating, index) => (
            <View key={index} className="flex-row justify-between items-center">
              <Text className="text-sm text-gray-700 capitalize">
                {rating.category.replace('_', ' ')}
              </Text>
              {renderStarRating(rating.rating, 14)}
            </View>
          ))}
        </View>
      </View>
    )
  }

  const renderPhotos = () => {
    if (!hasPhotos) return null

    const primaryPhoto = review.photos!.find(p => p.is_primary) || review.photos![0]
    const photoCount = review.photos!.length

    return (
      <View className="mt-3">
        <Pressable
          onPress={onViewPhotos}
          className="relative"
        >
          <Image
            source={{ uri: primaryPhoto.photo_url }}
            className="w-full h-48 rounded-lg"
            resizeMode="cover"
          />
          {photoCount > 1 && (
            <View className="absolute top-2 right-2 bg-black bg-opacity-60 px-2 py-1 rounded">
              <Text className="text-white text-xs font-medium">
                +{photoCount - 1} more
              </Text>
            </View>
          )}
          {primaryPhoto.caption && (
            <View className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-60 p-2 rounded">
              <Text className="text-white text-xs">
                {primaryPhoto.caption}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    )
  }

  const renderInteractionButtons = () => {
    if (!interactionSummary || !onInteraction) return null

    const userInteraction = interactionSummary.user_interaction

    return (
      <View className="mt-4 pt-3 border-t border-gray-200 flex-row justify-between">
        <View className="flex-row space-x-4">
          <Pressable
            onPress={() => onInteraction('helpful')}
            className={`flex-row items-center px-3 py-2 rounded ${
              userInteraction?.type === 'helpful' 
                ? 'bg-green-100' 
                : 'bg-gray-100'
            }`}
          >
            <Text className="text-sm mr-1">👍</Text>
            <Text className={`text-sm ${
              userInteraction?.type === 'helpful' 
                ? 'text-green-800 font-medium' 
                : 'text-gray-700'
            }`}>
              Helpful ({interactionSummary.helpful_count})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onInteraction('thank')}
            className={`flex-row items-center px-3 py-2 rounded ${
              userInteraction?.type === 'thank' 
                ? 'bg-blue-100' 
                : 'bg-gray-100'
            }`}
          >
            <Text className="text-sm mr-1">🙏</Text>
            <Text className={`text-sm ${
              userInteraction?.type === 'thank' 
                ? 'text-blue-800 font-medium' 
                : 'text-gray-700'
            }`}>
              Thank ({interactionSummary.thank_count})
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => {
            Alert.alert(
              'Report Review',
              'Why are you reporting this review?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'False Information', onPress: () => onInteraction('report') },
                { text: 'Inappropriate Content', onPress: () => onInteraction('report') },
                { text: 'Dangerous Advice', onPress: () => onInteraction('report') }
              ]
            )
          }}
          className="px-3 py-2 rounded bg-gray-100"
        >
          <Text className="text-sm text-gray-700">Report</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <Pressable
      onPress={onViewDetails}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${
        highlightSafety && hasIncidentReport ? 'border-red-300 bg-red-50' : ''
      } ${compact ? 'p-3' : ''}`}
    >
      {/* Header with reviewer info and verification */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="font-medium text-gray-900">
              {review.user_profile.full_name || 'Anonymous'}
            </Text>
            {review.user_profile.is_verified && (
              <Text className="text-blue-500 ml-1">✓</Text>
            )}
            {isExpertReview && (
              <View className="ml-2 px-2 py-1 bg-purple-100 rounded">
                <Text className="text-xs font-medium text-purple-800">
                  {review.user_profile.expert_profile?.professional_title}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-gray-500">
            {new Date(review.created_at).toLocaleDateString()}
            {review.visit_date && review.visit_date !== review.created_at && (
              <Text> • Visited {new Date(review.visit_date).toLocaleDateString()}</Text>
            )}
          </Text>
        </View>
        
        <View className="items-end space-y-1">
          {renderVerificationBadge(verificationLevel)}
          {renderCredibilityScore()}
        </View>
      </View>

      {/* Safety alerts */}
      {hasIncidentReport && (
        <View className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <View className="flex-row items-center">
            <Text className="text-red-600 text-lg mr-2">⚠️</Text>
            <Text className="text-sm font-medium text-red-800">
              Safety Incident Reported
            </Text>
          </View>
          <Text className="text-sm text-red-700 mt-1">
            This review includes a report of an allergic reaction or safety concern.
          </Text>
        </View>
      )}

      {/* Main rating and review */}
      <View className="mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            {renderStarRating(review.rating)}
            <Text className="text-sm text-gray-600 ml-2">
              Overall
            </Text>
          </View>
          {review.safety_rating && (
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-600 mr-2">Safety:</Text>
              {renderStarRating(review.safety_rating)}
            </View>
          )}
        </View>

        {review.review_text && (
          <Text className={`text-gray-800 ${!showFullText ? 'line-clamp-3' : ''}`}>
            {review.review_text}
          </Text>
        )}
      </View>

      {/* Category ratings */}
      {!compact && renderCategoryRatings()}

      {/* Safety assessments */}
      {!compact && renderSafetyAssessments()}

      {/* Photos */}
      {!compact && renderPhotos()}

      {/* Interaction buttons */}
      {!compact && renderInteractionButtons()}

      {/* View more button for compact mode */}
      {compact && onViewDetails && (
        <Pressable
          onPress={onViewDetails}
          className="mt-2 py-2"
        >
          <Text className="text-blue-600 text-sm font-medium text-center">
            View Full Review
          </Text>
        </Pressable>
      )}
    </Pressable>
  )
}