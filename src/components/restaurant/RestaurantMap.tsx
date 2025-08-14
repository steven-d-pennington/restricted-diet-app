/**
 * Restaurant Map Component
 * 
 * SAFETY CRITICAL: Interactive map showing restaurants with safety-color-coded markers
 * Displays restaurant locations, safety indicators, and clustering for performance
 */

import React, { useState, useCallback, useMemo, useRef } from 'react'
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native'
import MapView, { 
  Marker, 
  Callout, 
  Region, 
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT 
} from 'react-native-maps'
import { SafetyBadge } from '../SafetyBadge'
import { 
  RestaurantWithSafetyInfo, 
  LocationCoordinates,
  SafetyLevel 
} from '../../types/database.types'

interface RestaurantMapProps {
  restaurants: RestaurantWithSafetyInfo[]
  currentLocation?: LocationCoordinates | null
  initialRegion?: Region
  onRestaurantPress: (restaurant: RestaurantWithSafetyInfo) => void
  onMapPress?: (coordinate: LocationCoordinates) => void
  onRegionChange?: (region: Region) => void
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
  const [region, setRegion] = useState<Region>(initialRegion || {
    latitude: currentLocation?.latitude || 37.7749,
    longitude: currentLocation?.longitude || -122.4194,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  })

  const mapRef = useRef<MapView>(null)

  // Generate clusters for performance
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

    // Simple clustering algorithm - group nearby restaurants
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

      // Find nearby restaurants to cluster
      restaurants.forEach(other => {
        if (processed.has(other.id) || other.id === restaurant.id) return

        const distance = calculateDistance(
          { latitude: restaurant.latitude, longitude: restaurant.longitude },
          { latitude: other.latitude, longitude: other.longitude }
        )

        // Cluster if within 200 meters
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
    const R = 6371 // Earth's radius in kilometers
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
      case 'safe': return '#10B981' // green-500
      case 'caution': return '#3B82F6' // blue-500
      case 'warning': return '#F59E0B' // yellow-500
      case 'danger': return '#EF4444' // red-500
      default: return '#6B7280' // gray-500
    }
  }

  const getClusterColor = (restaurants: RestaurantWithSafetyInfo[]): string => {
    const safetyLevels = restaurants.map(r => 
      r.safety_rating_details?.user_specific_safety || 'safe'
    )
    
    // Use the most restrictive safety level in the cluster
    if (safetyLevels.includes('danger')) return '#EF4444'
    if (safetyLevels.includes('warning')) return '#F59E0B'
    if (safetyLevels.includes('caution')) return '#3B82F6'
    return '#10B981'
  }

  const handleMarkerPress = useCallback((cluster: MarkerCluster) => {
    if (cluster.restaurants.length === 1) {
      onRestaurantPress(cluster.restaurants[0])
    } else {
      // Show cluster selection
      Alert.alert(
        'Multiple Restaurants',
        `${cluster.restaurants.length} restaurants at this location`,
        cluster.restaurants.map(restaurant => ({
          text: restaurant.name,
          onPress: () => onRestaurantPress(restaurant)
        })).concat([
          { text: 'Cancel', style: 'cancel' }
        ])
      )
    }
  }, [onRestaurantPress])

  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
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
        edgePadding: {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50,
        },
        animated: true,
      })
    }
  }, [restaurants])

  const renderMarker = useCallback((cluster: MarkerCluster, index: number) => {
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
        {/* Custom marker view for clusters */}
        {isCluster && (
          <View className="bg-white rounded-full p-2 border-2 shadow-lg items-center justify-center"
                style={{ 
                  borderColor: getClusterColor(cluster.restaurants),
                  width: 40,
                  height: 40
                }}>
            <Text className="text-gray-900 font-bold text-sm">
              {cluster.restaurants.length}
            </Text>
          </View>
        )}

        {/* Callout for individual restaurants */}
        {!isCluster && (
          <Callout tooltip>
            <View className="bg-white rounded-lg p-3 shadow-lg max-w-64">
              <Text className="text-gray-900 font-bold text-base mb-1">
                {restaurant.name}
              </Text>
              {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
                <Text className="text-gray-600 text-sm mb-2">
                  {restaurant.cuisine_types[0]}
                </Text>
              )}
              <View className="flex-row items-center justify-between">
                <SafetyBadge 
                  level={safetyLevel}
                  size="sm"
                  showIcon={true}
                />
                {restaurant.distance_km && (
                  <Text className="text-gray-500 text-sm">
                    {restaurant.distance_km < 1 
                      ? `${Math.round(restaurant.distance_km * 1000)}m`
                      : `${restaurant.distance_km.toFixed(1)}km`
                    }
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
        onPress={(event) => {
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
        {/* Current location marker */}
        {currentLocation && !showCurrentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            pinColor="#007AFF"
            accessibilityLabel="Your current location"
          />
        )}

        {/* Restaurant markers */}
        {clusters.map(renderMarker)}
      </MapView>

      {/* Map Controls */}
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

      {/* Safety Legend */}
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

      {/* Loading Overlay */}
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