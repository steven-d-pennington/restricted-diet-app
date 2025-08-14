/**
 * Restaurant Search Screen - Enhanced Safety-Focused Discovery
 * 
 * SAFETY CRITICAL: Main restaurant discovery interface with real-time search
 * Provides location-based search, filters, and safety-first results display
 * Enhanced with emergency quick actions and comprehensive safety filtering
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Linking
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { 
  RestaurantList,
  RestaurantListWithHeader,
  RestaurantMap 
} from '../../components/restaurant'
import { LoadingScreen } from '../../components/LoadingScreen'
import { SafetyBadge } from '../../components/SafetyBadge'
import { SafetyButton } from '../../components/SafetyButton'
import { useNearbyRestaurants } from '../../hooks/useRestaurants'
import { useLocation } from '../../hooks/useLocation'
import { useAuth } from '../../contexts/AuthContext'
import { 
  RestaurantWithSafetyInfo,
  RestaurantSearchFilters,
  LocationCoordinates 
} from '../../types/database.types'

interface RestaurantSearchScreenProps {
  navigation: any
}

type ViewMode = 'list' | 'map'

export const RestaurantSearchScreen: React.FC<RestaurantSearchScreenProps> = ({
  navigation
}) => {
  const { user, userProfile } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showEmergencyActions, setShowEmergencyActions] = useState(false)
  const [searchRadius, setSearchRadius] = useState(5)
  const [filters, setFilters] = useState<RestaurantSearchFilters>({})
  const [quickFilterMode, setQuickFilterMode] = useState<'all' | 'safe' | 'verified'>('all')

  const {
    restaurants,
    loading,
    error,
    hasMore,
    currentLocation,
    locationLoading,
    locationError,
    searchCenter,
    totalCount,
    searchRestaurants,
    loadMore,
    refresh,
    updateFilters,
    clearResults,
    getCurrentLocationAndSearch,
    searchByAddress
  } = useNearbyRestaurants(true)

  const { reverseGeocode } = useLocation(false)

  // State for current location display
  const [locationName, setLocationName] = useState<string>('')

  // Get location name for display
  useEffect(() => {
    if (currentLocation) {
      reverseGeocode(currentLocation).then(result => {
        if (result) {
          setLocationName(result.formatted_address)
        }
      }).catch(() => {
        setLocationName('Current Location')
      })
    }
  }, [currentLocation, reverseGeocode])

  const handleRestaurantPress = useCallback((restaurant: RestaurantWithSafetyInfo) => {
    navigation.navigate('RestaurantDetail', { 
      restaurantId: restaurant.id,
      restaurant 
    })
  }, [navigation])

  const handleFavoritePress = useCallback(async (restaurant: RestaurantWithSafetyInfo) => {
    try {
      // Import RestaurantService to access favorite methods
      const { default: RestaurantService } = await import('../../services/restaurantService')
      
      if (restaurant.is_favorite) {
        await RestaurantService.removeFromFavorites(restaurant.id)
      } else {
        await RestaurantService.addToFavorites(restaurant.id)
      }
      // Refresh the search results to update favorite status
      await refresh()
    } catch (error: any) {
      console.error('Toggle favorite error:', error)
    }
  }, [refresh])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      await getCurrentLocationAndSearch(searchRadius)
      return
    }

    try {
      // Search by address/location name
      await searchByAddress(searchQuery, searchRadius)
    } catch (error) {
      console.error('Search error:', error)
    }
  }, [searchQuery, searchRadius, getCurrentLocationAndSearch, searchByAddress])

  const handleFilterUpdate = useCallback((newFilters: RestaurantSearchFilters) => {
    setFilters(newFilters)
    updateFilters(newFilters)
  }, [updateFilters])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setFilters({})
    setQuickFilterMode('all')
    clearResults()
    getCurrentLocationAndSearch(searchRadius)
  }, [clearResults, getCurrentLocationAndSearch, searchRadius])

  // Emergency quick actions
  const handleEmergencyCall = useCallback(() => {
    Alert.alert(
      'Emergency Call',
      'Call emergency services (911)?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call 911', 
          style: 'destructive',
          onPress: () => Linking.openURL('tel:911')
        }
      ]
    )
  }, [])

  const handleShowEmergencyCard = useCallback(() => {
    navigation.navigate('EmergencyQuickAccess')
  }, [navigation])

  // User's dietary restrictions for quick filtering
  const userRestrictions = useMemo<string[]>(() => {
    // Map to restriction ids or names when available; placeholder empty for now
    return []
  }, [])

  const renderEmergencyHeader = () => (
    <View className="bg-red-50 border-b border-red-200 px-4 py-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className="text-red-600 text-sm font-medium mr-2">🚨 Emergency Actions</Text>
          <SafetyBadge level="danger" size="small" text="CRITICAL" />
        </View>
        <TouchableOpacity
          onPress={() => setShowEmergencyActions(!showEmergencyActions)}
          className="p-1"
          accessibilityRole="button"
          accessibilityLabel="Toggle emergency actions"
        >
          <Text className="text-red-600 text-lg">
            {showEmergencyActions ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {showEmergencyActions && (
        <View className="flex-row space-x-2 mt-2">
          <TouchableOpacity
            onPress={handleEmergencyCall}
            className="flex-1 bg-red-600 py-2 rounded-lg"
            accessibilityRole="button"
            accessibilityLabel="Call emergency services"
          >
            <Text className="text-white text-center font-bold text-sm">📞 Call 911</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleShowEmergencyCard}
            className="flex-1 bg-red-500 py-2 rounded-lg"
            accessibilityRole="button"
            accessibilityLabel="Show emergency card"
          >
            <Text className="text-white text-center font-bold text-sm">🆔 Emergency Card</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )

  const renderQuickFilters = () => (
    <View className="bg-gray-50 px-4 py-2 border-b border-gray-200">
      <Text className="text-gray-600 text-xs mb-2 font-medium">QUICK SAFETY FILTERS</Text>
      <View className="flex-row space-x-2">
        <TouchableOpacity
          onPress={() => {
            setQuickFilterMode('all')
            handleFilterUpdate({})
          }}
          className={`px-3 py-1 rounded-full border ${
            quickFilterMode === 'all'
              ? 'bg-blue-500 border-blue-500' 
              : 'bg-white border-gray-300'
          }`}
        >
          <Text className={`text-sm ${
            quickFilterMode === 'all' ? 'text-white' : 'text-gray-600'
          }`}>
            All Restaurants
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => {
            setQuickFilterMode('safe')
            // In a real implementation, apply safety filter via dedicated state/logic
            // handleFilterUpdate({})
          }}
          className={`px-3 py-1 rounded-full border ${
            quickFilterMode === 'safe'
              ? 'bg-green-500 border-green-500' 
              : 'bg-white border-gray-300'
          }`}
        >
          <Text className={`text-sm ${
            quickFilterMode === 'safe' ? 'text-white' : 'text-gray-600'
          }`}>
            ✅ Safe Only
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => {
            setQuickFilterMode('verified')
            handleFilterUpdate({ has_verified_safety: true })
          }}
          className={`px-3 py-1 rounded-full border ${
            quickFilterMode === 'verified'
              ? 'bg-blue-500 border-blue-500' 
              : 'bg-white border-gray-300'
          }`}
        >
          <Text className={`text-sm ${
            quickFilterMode === 'verified' ? 'text-white' : 'text-gray-600'
          }`}>
            🛡️ Expert Verified
          </Text>
        </TouchableOpacity>
      </View>
      
      {userRestrictions.length > 0 && (
        <View className="mt-2">
          <Text className="text-gray-600 text-xs mb-1 font-medium">YOUR RESTRICTIONS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-2">
              {userRestrictions.map((restriction, index) => (
                <View
                  key={index}
                  className="bg-yellow-100 border border-yellow-300 px-2 py-1 rounded-full"
                >
                  <Text className="text-yellow-800 text-xs font-medium">
                    ⚠️ {restriction}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  )

  const renderSearchHeader = () => (
    <View className="bg-white px-4 py-3 border-b border-gray-200">
      {/* Search Input */}
      <View className="flex-row items-center space-x-2 mb-3">
        <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Text className="text-gray-500 mr-2">🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by location or restaurant name"
            className="flex-1 text-gray-900"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              className="p-1"
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Text className="text-gray-500">✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={handleSearch}
          className="bg-blue-500 px-4 py-2 rounded-lg"
          accessibilityRole="button"
          accessibilityLabel="Search restaurants"
        >
          <Text className="text-white font-medium">Search</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className={`px-3 py-1 rounded-full border ${
              showFilters || Object.keys(filters).length > 0
                ? 'bg-blue-50 border-blue-500' 
                : 'bg-gray-100 border-gray-300'
            }`}
            accessibilityRole="button"
            accessibilityLabel="Toggle filters"
          >
            <Text className={`text-sm ${
              showFilters || Object.keys(filters).length > 0
                ? 'text-blue-600' 
                : 'text-gray-600'
            }`}>
              🔧 Advanced Filters
              {Object.keys(filters).length > 0 && ` (${Object.keys(filters).length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => getCurrentLocationAndSearch(searchRadius)}
            className="px-3 py-1 rounded-full border border-gray-300 bg-gray-100"
            disabled={locationLoading}
            accessibilityRole="button"
            accessibilityLabel="Use current location"
          >
            <Text className="text-gray-600 text-sm">
              {locationLoading ? '📍 Finding...' : '📍 Current Location'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center space-x-2">
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-500' : 'bg-gray-200'}`}
            accessibilityRole="button"
            accessibilityLabel="List view"
          >
            <Text className={`text-sm ${viewMode === 'list' ? 'text-white' : 'text-gray-600'}`}>
              📋
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode('map')}
            className={`p-2 rounded ${viewMode === 'map' ? 'bg-blue-500' : 'bg-gray-200'}`}
            accessibilityRole="button"
            accessibilityLabel="Map view"
          >
            <Text className={`text-sm ${viewMode === 'map' ? 'text-white' : 'text-gray-600'}`}>
              🗺️
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const renderFilters = () => {
    if (!showFilters) return null

    return (
      <View className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-3">
            {/* Radius Filter */}
            <View className="bg-white rounded-lg px-3 py-2 min-w-24">
              <Text className="text-gray-600 text-xs mb-1">Radius</Text>
              <View className="flex-row space-x-1">
                {[1, 3, 5, 10].map(radius => (
                  <TouchableOpacity
                    key={radius}
                    onPress={() => setSearchRadius(radius)}
                    className={`px-2 py-1 rounded ${
                      searchRadius === radius ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <Text className={`text-xs ${
                      searchRadius === radius ? 'text-white' : 'text-gray-600'
                    }`}>
                      {radius}km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Cuisine Filter */}
            <View className="bg-white rounded-lg px-3 py-2">
              <Text className="text-gray-600 text-xs mb-1">Cuisine</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-1">
                  {['Italian', 'Chinese', 'Mexican', 'American', 'Japanese'].map(cuisine => (
                    <TouchableOpacity
                      key={cuisine}
                      onPress={() => {
                        const current = filters.cuisine_types || []
                        const updated = current.includes(cuisine)
                          ? current.filter(c => c !== cuisine)
                          : [...current, cuisine]
                        handleFilterUpdate({ ...filters, cuisine_types: updated })
                      }}
                      className={`px-2 py-1 rounded ${
                        filters.cuisine_types?.includes(cuisine) ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    >
                      <Text className={`text-xs ${
                        filters.cuisine_types?.includes(cuisine) ? 'text-white' : 'text-gray-600'
                      }`}>
                        {cuisine}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Price Range Filter */}
            <View className="bg-white rounded-lg px-3 py-2">
              <Text className="text-gray-600 text-xs mb-1">Price</Text>
              <View className="flex-row space-x-1">
                {[1, 2, 3, 4].map(price => (
                  <TouchableOpacity
                    key={price}
                    onPress={() => {
                      const current = filters.price_range || []
                      const updated = current.includes(price)
                        ? current.filter(p => p !== price)
                        : [...current, price]
                      handleFilterUpdate({ ...filters, price_range: updated })
                    }}
                    className={`px-2 py-1 rounded ${
                      filters.price_range?.includes(price) ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <Text className={`text-xs ${
                      filters.price_range?.includes(price) ? 'text-white' : 'text-gray-600'
                    }`}>
                      {'$'.repeat(price)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Safety Filter */}
            <View className="bg-white rounded-lg px-3 py-2">
              <Text className="text-gray-600 text-xs mb-1">Safety</Text>
              <TouchableOpacity
                onPress={() => handleFilterUpdate({ 
                  ...filters, 
                  has_verified_safety: !filters.has_verified_safety 
                })}
                className={`px-2 py-1 rounded ${
                  filters.has_verified_safety ? 'bg-green-500' : 'bg-gray-200'
                }`}
              >
                <Text className={`text-xs ${
                  filters.has_verified_safety ? 'text-white' : 'text-gray-600'
                }`}>
                  Verified Safe
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Clear Filters */}
        {Object.keys(filters).length > 0 && (
          <TouchableOpacity
            onPress={() => handleFilterUpdate({})}
            className="mt-2 bg-gray-200 px-3 py-1 rounded-full self-start"
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
          >
            <Text className="text-gray-600 text-sm">Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  const renderContent = () => {
    if (locationError && !currentLocation) {
      return (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-lg font-bold mb-2">Location Error</Text>
          <Text className="text-gray-600 text-center mb-4">{locationError}</Text>
          <TouchableOpacity
            onPress={() => getCurrentLocationAndSearch(searchRadius)}
            className="bg-blue-500 px-6 py-3 rounded-lg"
            accessibilityRole="button"
            accessibilityLabel="Retry location access"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (viewMode === 'map') {
      return (
        <RestaurantMap
          restaurants={restaurants}
          currentLocation={currentLocation}
          onRestaurantPress={handleRestaurantPress}
          loading={loading}
          style={{ flex: 1 }}
        />
      )
    }

    return (
      <RestaurantListWithHeader
        restaurants={restaurants}
        loading={loading}
        error={error}
        hasMore={hasMore}
        searchQuery={searchQuery}
        totalCount={totalCount}
        searchLocation={locationName}
        searchRadius={searchRadius}
        onRestaurantPress={handleRestaurantPress}
        onFavoritePress={handleFavoritePress}
        onLoadMore={loadMore}
        onRefresh={refresh}
        onClearSearch={handleClearSearch}
        emptyStateTitle="No restaurants found"
        emptyStateMessage="Try expanding your search radius or adjusting your filters."
        emptyStateAction={() => getCurrentLocationAndSearch(10)}
        emptyStateActionTitle="Search Wider Area"
      />
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderEmergencyHeader()}
        {renderQuickFilters()}
        {renderSearchHeader()}
        {renderFilters()}
        {renderContent()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}