/**
 * Favorite Restaurants Screen - Enhanced Safety Management
 * 
 * SAFETY CRITICAL: Displays user's saved safe restaurants
 * Provides quick access to trusted dining options with safety assessments,
 * personal notes, and safety status updates
 */

import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RestaurantList } from '../../components/restaurant'
import { LoadingScreen } from '../../components/LoadingScreen'
import { SafetyBadge } from '../../components/SafetyBadge'
import { SafetyCard } from '../../components/SafetyCard'
import { useFavoriteRestaurants } from '../../hooks/useRestaurants'
import { useLocation } from '../../hooks/useLocation'
import { useAuthContext } from '../../contexts/AuthContext'
import { RestaurantWithSafetyInfo } from '../../types/database.types'

interface FavoriteRestaurantsScreenProps {
  navigation: any
}

interface FavoriteNote {
  id: string
  restaurantId: string
  note: string
  safetyRating: number
  lastVisited?: string
  personalSafetyLevel: 'safe' | 'caution' | 'warning' | 'avoid'
  createdAt: string
  updatedAt: string
}

export const FavoriteRestaurantsScreen: React.FC<FavoriteRestaurantsScreenProps> = ({
  navigation
}) => {
  const { user } = useAuthContext()
  const {
    favorites,
    loading,
    error,
    loadFavorites,
    removeFavorite,
    updateDistances
  } = useFavoriteRestaurants()

  const { currentLocation, getCurrentLocation } = useLocation(false)
  
  const [sortBy, setSortBy] = useState<'name' | 'distance' | 'safety' | 'lastVisited'>('name')
  const [filterBySafety, setFilterBySafety] = useState<'all' | 'safe' | 'caution' | 'warning'>('all')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantWithSafetyInfo | null>(null)
  const [notes, setNotes] = useState<FavoriteNote[]>([])
  const [currentNote, setCurrentNote] = useState('')
  const [currentSafetyRating, setCurrentSafetyRating] = useState(5)
  const [currentPersonalSafety, setCurrentPersonalSafety] = useState<'safe' | 'caution' | 'warning' | 'avoid'>('safe')

  // Update distances when location is available
  useEffect(() => {
    if (currentLocation && favorites.length > 0) {
      updateDistances(currentLocation)
    }
  }, [currentLocation, favorites.length, updateDistances])

  // Get current location for distance calculations
  useEffect(() => {
    getCurrentLocation()
  }, [getCurrentLocation])

  const handleRestaurantPress = useCallback((restaurant: RestaurantWithSafetyInfo) => {
    navigation.navigate('RestaurantDetail', { 
      restaurantId: restaurant.id,
      restaurant 
    })
  }, [navigation])

  const handleRemoveFavorite = useCallback(async (restaurant: RestaurantWithSafetyInfo) => {
    try {
      await removeFavorite(restaurant.id)
    } catch (error: any) {
      console.error('Remove favorite error:', error)
    }
  }, [removeFavorite])

  const handleSearchRestaurants = useCallback(() => {
    navigation.navigate('RestaurantSearch')
  }, [navigation])

  const renderHeader = () => (
    <View className="bg-white px-4 py-3 border-b border-gray-200">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-gray-900 text-xl font-bold">Favorite Restaurants</Text>
          <Text className="text-gray-600 text-sm">
            {favorites.length} saved restaurant{favorites.length === 1 ? '' : 's'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSearchRestaurants}
          className="bg-blue-500 px-4 py-2 rounded-lg"
          accessibilityRole="button"
          accessibilityLabel="Search for restaurants"
        >
          <Text className="text-white font-medium">+ Add More</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6">
      <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4">
        <Text className="text-gray-400 text-3xl">❤️</Text>
      </View>
      
      <Text className="text-gray-900 text-xl font-bold text-center mb-2">
        No Favorite Restaurants Yet
      </Text>
      
      <Text className="text-gray-600 text-center mb-6 leading-6">
        Save restaurants you trust for quick access to safe dining options.
      </Text>

      <TouchableOpacity
        onPress={handleSearchRestaurants}
        className="bg-blue-500 px-6 py-3 rounded-lg"
        accessibilityRole="button"
        accessibilityLabel="Find restaurants to add as favorites"
      >
        <Text className="text-white font-semibold">Find Restaurants</Text>
      </TouchableOpacity>
    </View>
  )

  const renderErrorState = () => (
    <View className="flex-1 items-center justify-center px-6">
      <View className="w-24 h-24 bg-red-100 rounded-full items-center justify-center mb-4">
        <Text className="text-red-500 text-3xl">⚠️</Text>
      </View>
      
      <Text className="text-gray-900 text-xl font-bold text-center mb-2">
        Unable to Load Favorites
      </Text>
      
      <Text className="text-gray-600 text-center mb-6 leading-6">
        {error}
      </Text>

      <TouchableOpacity
        onPress={loadFavorites}
        className="bg-blue-500 px-6 py-3 rounded-lg"
        accessibilityRole="button"
        accessibilityLabel="Retry loading favorites"
      >
        <Text className="text-white font-semibold">Try Again</Text>
      </TouchableOpacity>
    </View>
  )

  // Show loading screen for initial load
  if (loading && favorites.length === 0 && !error) {
    return (
      <LoadingScreen 
        title="Loading favorites..."
        subtitle="Getting your saved restaurants"
      />
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {renderHeader()}
      
      {error && favorites.length === 0 ? (
        renderErrorState()
      ) : favorites.length === 0 ? (
        renderEmptyState()
      ) : (
        <RestaurantList
          restaurants={favorites}
          loading={loading && favorites.length > 0}
          error={null}
          hasMore={false}
          onRestaurantPress={handleRestaurantPress}
          onFavoritePress={handleRemoveFavorite}
          onRefresh={loadFavorites}
          showDistance={!!currentLocation}
          showSafetyDetails={true}
          emptyStateTitle="No favorite restaurants"
          emptyStateMessage="Your saved restaurants will appear here."
          emptyStateAction={handleSearchRestaurants}
          emptyStateActionTitle="Find Restaurants"
        />
      )}
    </SafeAreaView>
  )
}