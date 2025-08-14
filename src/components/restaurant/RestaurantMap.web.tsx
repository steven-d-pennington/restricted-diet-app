/**
 * Restaurant Map Component (Web)
 *
 * Wraps the web-friendly list/map substitute without importing native modules.
 */

import React from 'react'
import { RestaurantMapWeb } from './RestaurantMapWeb'
import {
  RestaurantWithSafetyInfo,
  LocationCoordinates,
} from '../../types/database.types'

interface RestaurantMapProps {
  restaurants: RestaurantWithSafetyInfo[]
  currentLocation?: LocationCoordinates | null
  initialRegion?: any
  onRestaurantPress: (restaurant: RestaurantWithSafetyInfo) => void
  onMapPress?: (coordinate: LocationCoordinates) => void
  onRegionChange?: (region: any) => void
  showCurrentLocation?: boolean
  showClusterIcons?: boolean
  style?: any
  loading?: boolean
}

export const RestaurantMap: React.FC<RestaurantMapProps> = ({
  restaurants,
  currentLocation,
  onRestaurantPress,
  style,
  loading = false,
}) => {
  return (
    <RestaurantMapWeb
      restaurants={restaurants}
      currentLocation={currentLocation}
      onRestaurantPress={onRestaurantPress}
      style={style}
      loading={loading}
    />
  )
}
