/**
 * Restaurant Map Component (Native)
 *
 * Uses react-native-maps for iOS/Android.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react'
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native'
import MapView, { Marker, Callout, PROVIDER_GOOGLE, PROVIDER_DEFAULT, Region } from 'react-native-maps'
import { SafetyBadge } from '../SafetyBadge'
import {
  RestaurantWithSafetyInfo,
  LocationCoordinates,
  SafetyLevel
} from '../../types/database.types'

interface RestaurantMapProps {
  restaurants: RestaurantWithSafetyInfo[]
  currentLocation?: LocationCoordinates | null
  initialRegion?: Region | any
  onRestaurantPress: (restaurant: RestaurantWithSafetyInfo) => void
  onMapPress?: (coordinate: LocationCoordinates) => void
  onRegionChange?: (region: Region | any) => void
  showCurrentLocation?: boolean
  showClusterIcons?: boolean
  style?: any
  loading?: boolean
}

interface MarkerCluster {
  coordinate: LocationCoordinates
  restaurants: RestaurantWithSafetyInfo[]
  id: string
}

export const RestaurantMap: React.FC<RestaurantMapProps> = ({
  restaurants,
  currentLocation,
  initialRegion,
  onRestaurantPress,
  onMapPress,
  onRegionChange,
  showCurrentLocation = true,
  showClusterIcons = true,
  style,
  loading = false
}) => {
  const [region, setRegion] = useState<Region | any>(initialRegion || {
    latitude: currentLocation?.latitude || 37.7749,
    longitude: currentLocation?.longitude || -122.4194,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  })

  const mapRef = useRef<MapView>(null)

  const clusters = useMemo(() => {
    if (!showClusterIcons || restaurants.length < 10) {
      return restaurants.map(restaurant => ({
        coordinate: {
          latitude: restaurant.latitude,
          longitude: restaurant.longitude
        },
        restaurants: [restaurant],
        id: restaurant.id
      }))
    }

    const clustered: MarkerCluster[] = []
    const processed = new Set<string>()

    restaurants.forEach(restaurant => {
      if (processed.has(restaurant.id)) return

      const cluster: MarkerCluster = {
        coordinate: {
          latitude: restaurant.latitude,
          longitude: restaurant.longitude
        },
        restaurants: [restaurant],
        id: restaurant.id
      }

      restaurants.forEach(other => {
        if (processed.has(other.id) || other.id === restaurant.id) return

        const distance = calculateDistance(
          { latitude: restaurant.latitude, longitude: restaurant.longitude },
          { latitude: other.latitude, longitude: other.longitude }
        )

        if (distance < 0.2) {
          cluster.restaurants.push(other)
          processed.add(other.id)
        }
      })

      processed.add(restaurant.id)
      clustered.push(cluster)
    })

    return clustered
  }, [restaurants, showClusterIcons])

  const calculateDistance = (coord1: LocationCoordinates, coord2: LocationCoordinates): number => {
    const R = 6371
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const getMarkerColor = (safety: SafetyLevel): string => {
    switch (safety) {
      case 'safe': return '#10B981'
      case 'caution': return '#3B82F6'
      case 'warning': return '#F59E0B'
      case 'danger': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const getClusterColor = (restaurants: RestaurantWithSafetyInfo[]): string => {
    const safetyLevels = restaurants.map(r =>
      r.safety_rating_details?.user_specific_safety || 'safe'
    )
    if (safetyLevels.includes('danger')) return '#EF4444'
    if (safetyLevels.includes('warning')) return '#F59E0B'
    if (safetyLevels.includes('caution')) return '#3B82F6'
    return '#10B981'
  }

  const handleMarkerPress = useCallback((cluster: MarkerCluster) => {
    if (cluster.restaurants.length === 1) {
      onRestaurantPress(cluster.restaurants[0])
    } else {
      Alert.alert(
        'Multiple Restaurants',
        `${cluster.restaurants.length} restaurants at this location`,
        cluster.restaurants.map(restaurant => ({
          text: restaurant.name,
          onPress: () => onRestaurantPress(restaurant)
        })).concat([
          { text: 'Cancel', onPress: () => {} }
        ])
      )
    }
  }, [onRestaurantPress])

  const handleRegionChangeComplete = useCallback((newRegion: Region | any) => {
    setRegion(newRegion)
    onRegionChange?.(newRegion)
  }, [onRegionChange])

  const animateToCurrentLocation = useCallback(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000)
    }
  }, [currentLocation])

  const animateToRestaurants = useCallback(() => {
    if (restaurants.length > 0 && mapRef.current) {
      const coords = restaurants.map(r => ({
        latitude: r.latitude,
        longitude: r.longitude
      }))

      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      })
    }
  }, [restaurants])

  const renderMarker = useCallback((cluster: MarkerCluster) => {
    const isCluster = cluster.restaurants.length > 1
    const restaurant = cluster.restaurants[0]
    const safetyLevel = restaurant.safety_rating_details?.user_specific_safety || 'safe'

    return (
      <Marker
        key={cluster.id}
        coordinate={cluster.coordinate}
        onPress={() => handleMarkerPress(cluster)}
        pinColor={getMarkerColor(safetyLevel)}
        accessibilityLabel={`${restaurant.name} restaurant`}
      >
        {isCluster && (
          <View className="bg-white rounded-full p-2 border-2 shadow-lg items-center justify-center"
                style={{ borderColor: getClusterColor(cluster.restaurants), width: 40, height: 40 }}>
            <Text className="text-gray-900 font-bold text-sm">
              {cluster.restaurants.length}
            </Text>
          </View>
        )}

        {!isCluster && (
          <Callout tooltip>
            <View className="bg-white rounded-lg p-3 shadow-lg max-w-64">
              <Text className="text-gray-900 font-bold text-base mb-1">{restaurant.name}</Text>
              {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
                <Text className="text-gray-600 text-sm mb-2">{restaurant.cuisine_types[0]}</Text>
              )}
              <View className="flex-row items-center justify-between">
                <SafetyBadge level={safetyLevel} size="small" showIcon={true} />
                {restaurant.distance_km && (
                  <Text className="text-gray-500 text-sm">
                    {restaurant.distance_km < 1
                      ? `${Math.round(restaurant.distance_km * 1000)}m`
                      : `${restaurant.distance_km.toFixed(1)}km`}
                  </Text>
                )}
              </View>
              {restaurant.average_rating && (
                <View className="flex-row items-center mt-1">
                  <Text className="text-yellow-500 mr-1">⭐</Text>
                  <Text className="text-gray-700 text-sm">
                    {restaurant.average_rating.toFixed(1)} ({restaurant.total_reviews})
                  </Text>
                </View>
              )}
            </View>
          </Callout>
        )}
      </Marker>
    )
  }, [handleMarkerPress])

  return (
    <View className="flex-1" style={style}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        region={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        onPress={(event: any) => {
          if (onMapPress) {
            onMapPress(event.nativeEvent.coordinate)
          }
        }}
        showsUserLocation={showCurrentLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        loadingEnabled={loading}
        accessibilityLabel="Restaurant map"
      >
        {currentLocation && !showCurrentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            pinColor="#007AFF"
            accessibilityLabel="Your current location"
          />
        )}

        {clusters.map(renderMarker)}
      </MapView>

      <View className="absolute top-4 right-4 space-y-2">
        {currentLocation && (
          <TouchableOpacity
            onPress={animateToCurrentLocation}
            className="w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Go to current location"
          >
            <Text className="text-blue-500 text-lg">📍</Text>
          </TouchableOpacity>
        )}

        {restaurants.length > 0 && (
          <TouchableOpacity
            onPress={animateToRestaurants}
            className="w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Show all restaurants"
          >
            <Text className="text-blue-500 text-lg">🎯</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg">
        <Text className="text-gray-900 font-semibold text-sm mb-2">Safety Legend</Text>
        <View className="space-y-1">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
            <Text className="text-gray-700 text-xs">Safe</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
            <Text className="text-gray-700 text-xs">Caution</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
            <Text className="text-gray-700 text-xs">Warning</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
            <Text className="text-gray-700 text-xs">Danger</Text>
          </View>
        </View>
      </View>

      {loading && (
        <View className="absolute inset-0 bg-white/50 items-center justify-center">
          <View className="bg-white rounded-lg p-4 shadow-lg">
            <Text className="text-gray-900 font-medium">Loading restaurants...</Text>
          </View>
        </View>
      )}
    </View>
  )
}
