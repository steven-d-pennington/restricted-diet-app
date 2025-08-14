/**
 * Restaurant Card Component
 * 
 * SAFETY CRITICAL: Displays restaurant information with prominent safety indicators
 * Shows safety status, verification badges, and user-specific risk assessments
 */

import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { SafetyBadge } from '../SafetyBadge'
import { SafetyButton } from '../SafetyButton'
import { RestaurantWithSafetyInfo, SafetyLevel } from '../../types/database.types'
import type { ComponentVariant } from '../../utils/designSystem'

interface RestaurantCardProps {
  restaurant: RestaurantWithSafetyInfo
  onPress: () => void
  onFavoritePress?: () => void
  showDistance?: boolean
  showSafetyDetails?: boolean
  compact?: boolean
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  onPress,
  onFavoritePress,
  showDistance = true,
  showSafetyDetails = true,
  compact = false
}) => {
  const safetyDetails = restaurant.safety_rating_details
  const primarySafety = safetyDetails?.user_specific_safety || 'safe'
  // Derive a simple safety score from the primary safety level (fallback when no numeric score provided)
  const derivedSafetyScore = (() => {
    switch (primarySafety) {
      case 'safe':
        return 90
      case 'caution':
        return 65
      case 'warning':
        return 45
      case 'danger':
        return 20
      default:
        return 60
    }
  })()

  const formatDistance = (distance?: number): string => {
    if (!distance) return ''
    return distance < 1 
      ? `${Math.round(distance * 1000)}m`
      : `${distance.toFixed(1)}km`
  }

  const formatPriceRange = (range: number): string => {
    return '$'.repeat(range)
  }

  const getButtonVariantFromSafety = (safety: SafetyLevel): ComponentVariant => {
    switch (safety) {
      case 'safe':
        return 'success'
      case 'caution':
      case 'warning':
        return 'warning'
      case 'danger':
        return 'error'
      default:
        return 'primary'
    }
  }

  const getSafetyText = (safety: SafetyLevel): string => {
    switch (safety) {
      case 'safe': return 'Safe'
      case 'caution': return 'Caution'
      case 'warning': return 'Warning'
      case 'danger': return 'Danger'
      default: return 'Unknown'
    }
  }

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        className="bg-white p-3 mb-2 rounded-lg border border-gray-200 flex-row items-center"
        accessibilityRole="button"
        accessibilityLabel={`${restaurant.name} restaurant, ${getSafetyText(primarySafety)} safety level`}
      >
        {/* Restaurant Image */}
        <View className="w-12 h-12 rounded-lg bg-gray-200 mr-3 overflow-hidden">
          <View className="w-full h-full bg-gray-200 items-center justify-center">
            <Text className="text-gray-500 text-xs">🍽️</Text>
          </View>
        </View>

        {/* Restaurant Info */}
        <View className="flex-1">
          <Text className="text-gray-900 font-semibold text-sm" numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View className="flex-row items-center mt-1">
            {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
              <Text className="text-gray-600 text-xs mr-2">
                {restaurant.cuisine_types[0]}
              </Text>
            )}
            {showDistance && restaurant.distance_km && (
              <Text className="text-gray-500 text-xs">
                {formatDistance(restaurant.distance_km)}
              </Text>
            )}
          </View>
        </View>

        {/* Safety Badge */}
        <View className="ml-2">
          <SafetyBadge 
            level={primarySafety}
            size="small"
          />
        </View>

        {/* Favorite Button */}
        {onFavoritePress && (
          <TouchableOpacity
            onPress={onFavoritePress}
            className="ml-2 p-1"
            accessibilityRole="button"
            accessibilityLabel={restaurant.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Text className={`text-lg ${restaurant.is_favorite ? 'text-red-500' : 'text-gray-400'}`}>
              {restaurant.is_favorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 overflow-hidden"
      accessibilityRole="button"
      accessibilityLabel={`${restaurant.name} restaurant, ${getSafetyText(primarySafety)} safety level`}
    >
      {/* Restaurant Image */}
      <View className="h-48 bg-gray-200 relative">
        <View className="w-full h-full bg-gray-200 items-center justify-center">
          <Text className="text-gray-500 text-4xl">🍽️</Text>
          <Text className="text-gray-500 text-sm mt-2">No image available</Text>
        </View>

        {/* Overlay badges */}
        <View className="absolute top-3 left-3 flex-row">
          {restaurant.is_verified && (
            <View className="bg-blue-500 px-2 py-1 rounded-full mr-2">
              <Text className="text-white text-xs font-medium">✓ Verified</Text>
            </View>
          )}
          {restaurant.is_favorite && (
            <View className="bg-red-500 px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-medium">❤️ Favorite</Text>
            </View>
          )}
        </View>

        {/* Favorite button */}
        {onFavoritePress && (
          <TouchableOpacity
            onPress={onFavoritePress}
            className="absolute top-3 right-3 w-10 h-10 bg-white/90 rounded-full items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={restaurant.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Text className={`text-xl ${restaurant.is_favorite ? 'text-red-500' : 'text-gray-400'}`}>
              {restaurant.is_favorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Restaurant Details */}
      <View className="p-4">
        {/* Header Row */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-gray-900 font-bold text-lg" numberOfLines={1}>
              {restaurant.name}
            </Text>
            {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
              <Text className="text-gray-600 text-sm mt-1">
                {restaurant.cuisine_types.slice(0, 2).join(', ')}
              </Text>
            )}
          </View>

          {/* Price Range */}
          <View className="items-end">
            <Text className="text-gray-900 font-semibold">
              {formatPriceRange(restaurant.price_range || 2)}
            </Text>
            {restaurant.average_rating && (
              <View className="flex-row items-center mt-1">
                <Text className="text-yellow-500 mr-1">⭐</Text>
                <Text className="text-gray-700 text-sm">
                  {restaurant.average_rating.toFixed(1)}
                </Text>
                {restaurant.total_reviews > 0 && (
                  <Text className="text-gray-500 text-sm ml-1">
                    ({restaurant.total_reviews})
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Distance and Status */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            {showDistance && restaurant.distance_km && (
              <>
                <Text className="text-gray-600 text-sm">📍 {formatDistance(restaurant.distance_km)}</Text>
                <Text className="text-gray-400 mx-2">•</Text>
              </>
            )}
            {restaurant.delivery_available && (
              <>
                <Text className="text-green-600 text-sm">🚚 Delivery</Text>
                <Text className="text-gray-400 mx-2">•</Text>
              </>
            )}
            {restaurant.takeout_available && (
              <Text className="text-blue-600 text-sm">📦 Takeout</Text>
            )}
          </View>
        </View>

        {/* Safety Information */}
        {showSafetyDetails && safetyDetails && (
          <View className="border-t border-gray-100 pt-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-900 font-semibold text-sm">Safety Assessment</Text>
              <SafetyBadge 
                level={primarySafety}
                showIcon={true}
              />
            </View>

            {/* Safety Score (derived) */}
            <View className="flex-row items-center mb-2">
              <Text className="text-gray-600 text-sm mr-2">Safety Score:</Text>
              <View className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                <View 
                  className={`h-2 rounded-full ${
                    derivedSafetyScore >= 80 ? 'bg-green-500' :
                    derivedSafetyScore >= 60 ? 'bg-yellow-500' :
                    derivedSafetyScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${derivedSafetyScore}%` }}
                />
              </View>
              <Text className="text-gray-700 text-sm font-medium">{derivedSafetyScore}%</Text>
            </View>

            {/* Safety Details */}
            {safetyDetails.verified_restrictions.length > 0 && (
              <View className="flex-row items-center mb-1">
                <Text className="text-green-600 text-xs">✓ {safetyDetails.verified_restrictions.length} verified safe</Text>
              </View>
            )}
            {safetyDetails.warning_restrictions.length > 0 && (
              <View className="flex-row items-center mb-1">
                <Text className="text-yellow-600 text-xs">⚠️ {safetyDetails.warning_restrictions.length} need caution</Text>
              </View>
            )}
            {safetyDetails.dangerous_restrictions.length > 0 && (
              <View className="flex-row items-center">
                <Text className="text-red-600 text-xs">⚠️ {safetyDetails.dangerous_restrictions.length} high risk</Text>
              </View>
            )}

            {/* Action Button */}
            <View className="mt-3">
              <SafetyButton
                title="View Safety Details"
                onPress={onPress}
                size="sm"
                variant={getButtonVariantFromSafety(primarySafety)}
                fullWidth={true}
              />
            </View>
          </View>
        )}

        {/* Address */}
        {restaurant.address && (
          <View className="mt-3 pt-3 border-t border-gray-100">
            <Text className="text-gray-600 text-sm" numberOfLines={2}>
              📍 {restaurant.address}, {restaurant.city}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}