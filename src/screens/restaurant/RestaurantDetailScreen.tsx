/**
 * Restaurant Detail Screen
 * 
 * SAFETY CRITICAL: Comprehensive restaurant information with safety assessment
 * Displays detailed safety protocols, menu items, and user reviews
 */

import React, { useEffect, useCallback } from 'react'
import { View, Alert, Share, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RestaurantDetail } from '../../components/restaurant'
import { LoadingScreen } from '../../components/LoadingScreen'
import { useRestaurant } from '../../hooks/useRestaurants'
import { RestaurantWithSafetyInfo } from '../../types/database.types'

interface RestaurantDetailScreenProps {
  navigation: any
  route: {
    params: {
      restaurantId: string
      restaurant?: RestaurantWithSafetyInfo
    }
  }
}

export const RestaurantDetailScreen: React.FC<RestaurantDetailScreenProps> = ({
  navigation,
  route
}) => {
  const { restaurantId, restaurant: routeRestaurant } = route.params

  const {
    restaurant,
    menu,
    loading,
    error,
    isFavorite,
    loadRestaurant,
    toggleFavorite,
    refreshReviews
  } = useRestaurant(restaurantId)

  // Set navigation title
  useEffect(() => {
    if (restaurant?.name) {
      navigation.setOptions({
        title: restaurant.name,
        headerTitleStyle: { fontSize: 16 }
      })
    }
  }, [restaurant?.name, navigation])

  // Set header right button for sharing
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', marginRight: 10 }}>
          {/* Share button would go here */}
        </View>
      )
    })
  }, [navigation, restaurant])

  const handleFavoriteToggle = useCallback(async () => {
    try {
      await toggleFavorite()
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to update favorite status',
        [{ text: 'OK' }]
      )
    }
  }, [toggleFavorite])

  const handleCallRestaurant = useCallback(() => {
    // This will be handled by the RestaurantDetail component
  }, [])

  const handleGetDirections = useCallback(() => {
    // This will be handled by the RestaurantDetail component
  }, [])

  const handleWriteReview = useCallback(() => {
    if (!restaurant) return

    navigation.navigate('WriteReview', {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name
    })
  }, [navigation, restaurant])

  const handleViewMenu = useCallback(() => {
    if (!restaurant) return

    navigation.navigate('RestaurantMenu', {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name
    })
  }, [navigation, restaurant])

  const handleViewAllReviews = useCallback(() => {
    if (!restaurant) return

    navigation.navigate('RestaurantReviews', {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name
    })
  }, [navigation, restaurant])

  const handleViewPhotos = useCallback(() => {
    if (!restaurant) return

    navigation.navigate('RestaurantPhotos', {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name
    })
  }, [navigation, restaurant])

  const handleReportIncident = useCallback(() => {
    if (!restaurant) return

    navigation.navigate('SafetyIncidentReport', {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name
    })
  }, [navigation, restaurant])

  const handleShare = useCallback(async () => {
    if (!restaurant) return

    try {
      const message = `Check out ${restaurant.name} - ${restaurant.address}, ${restaurant.city}`
      await Share.share({
        message,
        title: restaurant.name,
        url: restaurant.website || undefined
      })
    } catch (error) {
      console.error('Share error:', error)
    }
  }, [restaurant])

  // Handle error state
  if (error && !restaurant) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-24 h-24 bg-red-100 rounded-full items-center justify-center mb-4">
            <Text className="text-red-500 text-3xl">⚠️</Text>
          </View>
          
          <Text className="text-gray-900 text-xl font-bold text-center mb-2">
            Restaurant Not Found
          </Text>
          
          <Text className="text-gray-600 text-center mb-6 leading-6">
            {error}
          </Text>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-blue-500 px-6 py-3 rounded-lg"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // Show loading for initial load
  if (loading && !restaurant && !routeRestaurant) {
    return (
      <LoadingScreen 
        title="Loading restaurant..."
        subtitle="Getting the latest information and safety details"
      />
    )
  }

  // Use route restaurant data while loading full details
  const displayRestaurant = restaurant || routeRestaurant

  if (!displayRestaurant) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Restaurant data not available</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <RestaurantDetail
        restaurant={displayRestaurant}
        menu={menu}
        onFavoriteToggle={handleFavoriteToggle}
        onCallRestaurant={handleCallRestaurant}
        onGetDirections={handleGetDirections}
        onWriteReview={handleWriteReview}
        onViewMenu={handleViewMenu}
        onViewAllReviews={handleViewAllReviews}
        onViewPhotos={handleViewPhotos}
        onReportIncident={handleReportIncident}
        loading={loading}
      />
    </SafeAreaView>
  )
}