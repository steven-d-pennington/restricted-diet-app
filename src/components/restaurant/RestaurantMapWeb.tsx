/**
 * Restaurant Map Component - Web Fallback
 * 
 * SAFETY CRITICAL: Web-compatible alternative for showing restaurants without native maps
 * Provides a list-based view with safety indicators and distance information
 */

import React, { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { SafetyBadge } from '../SafetyBadge'
import { 
  RestaurantWithSafetyInfo, 
  LocationCoordinates,
  SafetyLevel 
} from '../../types/database.types'

interface RestaurantMapWebProps {
  restaurants: RestaurantWithSafetyInfo[]
  currentLocation?: LocationCoordinates | null
  onRestaurantPress: (restaurant: RestaurantWithSafetyInfo) => void
  showCurrentLocation?: boolean
  style?: any
  loading?: boolean
}

export const RestaurantMapWeb: React.FC<RestaurantMapWebProps> = ({
  restaurants,
  currentLocation,
  onRestaurantPress,
  style,
  loading = false
}) => {
  const [sortBy, setSortBy] = useState<'distance' | 'safety' | 'rating'>('distance')

  // Calculate distances and sort restaurants
  const processedRestaurants = useMemo(() => {
    let processed = restaurants.map(restaurant => {
      let distance_km = restaurant.distance_km
      
      // Calculate distance if not provided and current location is available
      if (!distance_km && currentLocation) {
        const R = 6371 // Earth's radius in kilometers
        const dLat = (restaurant.latitude - currentLocation.latitude) * Math.PI / 180
        const dLon = (restaurant.longitude - currentLocation.longitude) * Math.PI / 180
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(currentLocation.latitude * Math.PI / 180) * Math.cos(restaurant.latitude * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        distance_km = R * c
      }

      return {
        ...restaurant,
        distance_km
      }
    })

    // Sort based on selected criteria
    switch (sortBy) {
      case 'distance':
        processed.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999))
        break
      case 'safety':
        const safetyOrder: Record<SafetyLevel, number> = {
          'safe': 1,
          'caution': 2,
          'warning': 3,
          'danger': 4
        }
        processed.sort((a, b) => {
          const aSafety = a.safety_rating_details?.user_specific_safety || 'safe'
          const bSafety = b.safety_rating_details?.user_specific_safety || 'safe'
          return safetyOrder[aSafety] - safetyOrder[bSafety]
        })
        break
      case 'rating':
        processed.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
        break
    }

    return processed
  }, [restaurants, currentLocation, sortBy])

  const getSafetyStats = () => {
    const stats = {
      safe: 0,
      caution: 0,
      warning: 0,
      danger: 0
    }
    
    restaurants.forEach(restaurant => {
      const safety = restaurant.safety_rating_details?.user_specific_safety || 'safe'
      stats[safety]++
    })
    
    return stats
  }

  const safetyStats = getSafetyStats()

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50" style={style}>
        <View className="bg-white rounded-lg p-6 shadow-lg">
          <Text className="text-gray-900 font-medium text-center">Loading restaurants...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50" style={style}>
      {/* Header with location info and controls */}
      <View className="bg-white border-b border-gray-200 p-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-gray-900">
            Nearby Restaurants ({restaurants.length})
          </Text>
          
          {currentLocation && (
            <Text className="text-sm text-gray-600">
              📍 Current Location Available
            </Text>
          )}
        </View>

        {/* Safety Statistics */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm font-medium text-gray-700">Safety Overview:</Text>
          <View className="flex-row space-x-3">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-green-500 mr-1" />
              <Text className="text-xs text-gray-600">{safetyStats.safe}</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-blue-500 mr-1" />
              <Text className="text-xs text-gray-600">{safetyStats.caution}</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-yellow-500 mr-1" />
              <Text className="text-xs text-gray-600">{safetyStats.warning}</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-red-500 mr-1" />
              <Text className="text-xs text-gray-600">{safetyStats.danger}</Text>
            </View>
          </View>
        </View>

        {/* Sort Controls */}
        <View className="flex-row items-center">
          <Text className="text-sm text-gray-600 mr-3">Sort by:</Text>
          <View className="flex-row space-x-2">
            {[
              { key: 'distance', label: 'Distance' },
              { key: 'safety', label: 'Safety' },
              { key: 'rating', label: 'Rating' }
            ].map(option => (
              <TouchableOpacity
                key={option.key}
                onPress={() => setSortBy(option.key as typeof sortBy)}
                className={`px-3 py-1 rounded-full ${
                  sortBy === option.key 
                    ? 'bg-blue-500' 
                    : 'bg-gray-200'
                }`}
              >
                <Text className={`text-xs font-medium ${
                  sortBy === option.key 
                    ? 'text-white' 
                    : 'text-gray-700'
                }`}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Restaurant List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {processedRestaurants.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-gray-500 text-center">
              No restaurants found in this area.
            </Text>
          </View>
        ) : (
          <View className="p-4 space-y-3">
            {processedRestaurants.map((restaurant, index) => {
              const safetyLevel = restaurant.safety_rating_details?.user_specific_safety || 'safe'
              
              return (
                <TouchableOpacity
                  key={restaurant.id}
                  onPress={() => onRestaurantPress(restaurant)}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                  accessibilityRole="button"
                  accessibilityLabel={`View details for ${restaurant.name}`}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-lg font-bold text-gray-900 mb-1">
                        {restaurant.name}
                      </Text>
                      
                      {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
                        <Text className="text-sm text-gray-600 mb-2">
                          {restaurant.cuisine_types.slice(0, 2).join(', ')}
                        </Text>
                      )}
                      
                      <View className="flex-row items-center flex-wrap gap-2">
                        <SafetyBadge 
                          level={safetyLevel}
                          size="small"
                          showIcon={true}
                        />
                        
                        {restaurant.distance_km && (
                          <View className="bg-gray-100 px-2 py-1 rounded">
                            <Text className="text-xs text-gray-700">
                              {restaurant.distance_km < 1 
                                ? `${Math.round(restaurant.distance_km * 1000)}m`
                                : `${restaurant.distance_km.toFixed(1)}km`
                              }
                            </Text>
                          </View>
                        )}
                        
                        {restaurant.average_rating && (
                          <View className="flex-row items-center bg-yellow-50 px-2 py-1 rounded">
                            <Text className="text-yellow-600 text-xs mr-1">⭐</Text>
                            <Text className="text-xs text-gray-700">
                              {restaurant.average_rating.toFixed(1)} ({restaurant.total_reviews})
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    <View className="items-center">
                      <Text className="text-gray-400 text-lg">📍</Text>
                      <Text className="text-xs text-gray-500 mt-1">#{index + 1}</Text>
                    </View>
                  </View>
                  
                  {restaurant.address && (
                    <Text className="text-sm text-gray-500 mt-2">
                      {restaurant.address}
                    </Text>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* Web Notice */}
      <View className="bg-blue-50 border-t border-blue-200 p-3">
        <Text className="text-xs text-blue-700 text-center">
          💻 Web Version: Interactive map available on mobile app
        </Text>
      </View>
    </View>
  )
}