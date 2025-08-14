/**
 * Restaurant Data Hooks
 * 
 * SAFETY CRITICAL: React hooks for managing restaurant data and user interactions
 * Provides cached, real-time restaurant information with safety assessments
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Storage } from '../utils/storage'
import RestaurantService from '../services/restaurantService'
import LocationService from '../services/locationService'
import { useUserProfile } from './useUserProfile'
import {
  RestaurantSearchParams,
  
  RestaurantWithSafetyInfo,
  RestaurantWithReviews,
  MenuItemWithSafety,
  LocationCoordinates,
  RestaurantSearchFilters
} from '../types/database.types'

interface UseRestaurantSearchState {
  restaurants: RestaurantWithSafetyInfo[]
  loading: boolean
  error: string | null
  hasMore: boolean
  searchCenter: LocationCoordinates | null
  searchRadius: number
  totalCount: number
}

interface UseRestaurantSearchActions {
  searchRestaurants: (params: RestaurantSearchParams) => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  clearResults: () => void
  updateFilters: (filters: RestaurantSearchFilters) => void
}

/**
 * Hook for restaurant search functionality
 */
export const useRestaurantSearch = (
  initialLocation?: LocationCoordinates,
  initialRadius: number = 5
): UseRestaurantSearchState & UseRestaurantSearchActions => {
  const [state, setState] = useState<UseRestaurantSearchState>({
    restaurants: [],
    loading: false,
    error: null,
    hasMore: false,
    searchCenter: initialLocation || null,
    searchRadius: initialRadius,
    totalCount: 0
  })

  const [currentParams, setCurrentParams] = useState<RestaurantSearchParams | null>(null)
  const { userProfile } = useUserProfile()
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get user's dietary restrictions for safety assessment
  const getUserRestrictions = useCallback(async (): Promise<string[]> => {
    try {
      // This would typically come from useUserProfile hook
      // For now, return empty array - will be populated when user profile hook is integrated
      return []
    } catch (error) {
      console.error('Error getting user restrictions:', error)
      return []
    }
  }, [])

  const searchRestaurants = useCallback(async (params: RestaurantSearchParams) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      // Get user's dietary restrictions
      const userRestrictions = await getUserRestrictions()
      const searchParams = { ...params, user_restrictions: userRestrictions }

      const result = await RestaurantService.searchRestaurants(searchParams)

      setState(prev => ({
        ...prev,
        restaurants: result.restaurants,
        loading: false,
        hasMore: result.has_more,
        searchCenter: result.search_center,
        searchRadius: result.search_radius_km,
        totalCount: result.total_count
      }))

      setCurrentParams(searchParams)

      // Cache recent search
      await Storage.setItem(
        'recent_restaurant_search',
        JSON.stringify({
          params: searchParams,
          timestamp: Date.now()
        })
      )

    } catch (error: any) {
      console.error('Restaurant search error:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to search restaurants'
      }))
    }
  }, [getUserRestrictions])

  const loadMore = useCallback(async () => {
    if (!currentParams || !state.hasMore || state.loading) return

    try {
      setState(prev => ({ ...prev, loading: true }))

      const nextParams = {
        ...currentParams,
        offset: (currentParams.offset || 0) + (currentParams.limit || 20)
      }

      const result = await RestaurantService.searchRestaurants(nextParams)

      setState(prev => ({
        ...prev,
        restaurants: [...prev.restaurants, ...result.restaurants],
        loading: false,
        hasMore: result.has_more
      }))

      setCurrentParams(nextParams)

    } catch (error: any) {
      console.error('Load more restaurants error:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load more restaurants'
      }))
    }
  }, [currentParams, state.hasMore, state.loading])

  const refresh = useCallback(async () => {
    if (!currentParams) return

    const refreshParams = { ...currentParams, offset: 0 }
    await searchRestaurants(refreshParams)
  }, [currentParams, searchRestaurants])

  const clearResults = useCallback(() => {
    setState({
      restaurants: [],
      loading: false,
      error: null,
      hasMore: false,
      searchCenter: null,
      searchRadius: initialRadius,
      totalCount: 0
    })
    setCurrentParams(null)
  }, [initialRadius])

  const updateFilters = useCallback((filters: RestaurantSearchFilters) => {
    if (!currentParams) return

    // Debounce filter updates
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      const updatedParams = {
        ...currentParams,
        filters,
        offset: 0 // Reset to first page
      }
      searchRestaurants(updatedParams)
    }, 500)
  }, [currentParams, searchRestaurants])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  return {
    ...state,
    searchRestaurants,
    loadMore,
    refresh,
    clearResults,
    updateFilters
  }
}

/**
 * Hook for restaurant details and management
 */
export const useRestaurant = (restaurantId: string) => {
  const [restaurant, setRestaurant] = useState<RestaurantWithReviews | null>(null)
  const [menu, setMenu] = useState<MenuItemWithSafety[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  const getUserRestrictions = useCallback(async (): Promise<string[]> => {
    try {
      // This would typically come from useUserProfile hook
      return []
    } catch (error) {
      console.error('Error getting user restrictions:', error)
      return []
    }
  }, [])

  const loadRestaurant = useCallback(async () => {
    if (!restaurantId) return

    try {
      setLoading(true)
      setError(null)

      const [restaurantDetails, userRestrictions] = await Promise.all([
        RestaurantService.getRestaurantDetails(restaurantId),
        getUserRestrictions()
      ])

      setRestaurant(restaurantDetails)
      setIsFavorite(restaurantDetails.is_favorite || false)

      // Load menu if needed
      const menuItems = await RestaurantService.getRestaurantMenu(
        restaurantId,
        userRestrictions
      )
      setMenu(menuItems)

    } catch (error: any) {
      console.error('Load restaurant error:', error)
      setError(error.message || 'Failed to load restaurant details')
    } finally {
      setLoading(false)
    }
  }, [restaurantId, getUserRestrictions])

  const toggleFavorite = useCallback(async (notes?: string) => {
    try {
      if (isFavorite) {
        await RestaurantService.removeFromFavorites(restaurantId)
        setIsFavorite(false)
      } else {
        await RestaurantService.addToFavorites(restaurantId, notes)
        setIsFavorite(true)
      }

      // Update restaurant object
      if (restaurant) {
        setRestaurant(prev => prev ? { ...prev, is_favorite: !isFavorite } : null)
      }

    } catch (error: any) {
      console.error('Toggle favorite error:', error)
      setError(error.message || 'Failed to update favorite status')
    }
  }, [restaurantId, isFavorite, restaurant])

  const refreshReviews = useCallback(async () => {
    if (!restaurantId) return

    try {
      const updatedRestaurant = await RestaurantService.getRestaurantDetails(restaurantId)
      setRestaurant(updatedRestaurant)
    } catch (error: any) {
      console.error('Refresh reviews error:', error)
    }
  }, [restaurantId])

  // Load restaurant on mount and when ID changes
  useEffect(() => {
    loadRestaurant()
  }, [loadRestaurant])

  return {
    restaurant,
    menu,
    loading,
    error,
    isFavorite,
    loadRestaurant,
    toggleFavorite,
    refreshReviews
  }
}

/**
 * Hook for user's favorite restaurants
 */
export const useFavoriteRestaurants = () => {
  const [favorites, setFavorites] = useState<RestaurantWithSafetyInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const favoriteRestaurants = await RestaurantService.getFavoriteRestaurants()
      setFavorites(favoriteRestaurants)

    } catch (error: any) {
      console.error('Load favorites error:', error)
      setError(error.message || 'Failed to load favorite restaurants')
    } finally {
      setLoading(false)
    }
  }, [])

  const addFavorite = useCallback(async (restaurantId: string, notes?: string) => {
    try {
      await RestaurantService.addToFavorites(restaurantId, notes)
      await loadFavorites() // Refresh the list
    } catch (error: any) {
      console.error('Add favorite error:', error)
      setError(error.message || 'Failed to add favorite restaurant')
    }
  }, [loadFavorites])

  const removeFavorite = useCallback(async (restaurantId: string) => {
    try {
      await RestaurantService.removeFromFavorites(restaurantId)
      setFavorites(prev => prev.filter(restaurant => restaurant.id !== restaurantId))
    } catch (error: any) {
      console.error('Remove favorite error:', error)
      setError(error.message || 'Failed to remove favorite restaurant')
    }
  }, [])

  // Calculate distances when location is available
  const updateDistances = useCallback(async (currentLocation: LocationCoordinates) => {
    setFavorites(prev => prev.map(restaurant => {
      if (restaurant.latitude && restaurant.longitude) {
        const restaurantCoords: LocationCoordinates = {
          latitude: restaurant.latitude,
          longitude: restaurant.longitude
        }
        const distance = LocationService.calculateDistance(currentLocation, restaurantCoords)
        return { ...restaurant, distance_km: distance }
      }
      return restaurant
    }))
  }, [])

  // Load favorites on mount
  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  return {
    favorites,
    loading,
    error,
    loadFavorites,
    addFavorite,
    removeFavorite,
    updateDistances
  }
}

/**
 * Hook for location-based restaurant discovery
 */
export const useNearbyRestaurants = (autoSearch: boolean = true) => {
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const searchHook = useRestaurantSearch()

  const getCurrentLocationAndSearch = useCallback(async (radius: number = 5) => {
    try {
      setLocationLoading(true)
      setLocationError(null)

      const location = await LocationService.getCurrentLocation(true)
      setCurrentLocation(location)

      if (autoSearch) {
        await searchHook.searchRestaurants({
          location,
          radius_km: radius,
          sort_by: 'distance',
          limit: 20
        })
      }

    } catch (error: any) {
      console.error('Get location and search error:', error)
      setLocationError(error.message || 'Failed to get current location')
    } finally {
      setLocationLoading(false)
    }
  }, [autoSearch, searchHook])

  const searchByAddress = useCallback(async (
    address: string,
    radius: number = 5
  ) => {
    try {
      setLocationLoading(true)
      setLocationError(null)

      const geocodeResult = await LocationService.geocodeAddress(address)
      setCurrentLocation(geocodeResult.coordinates)

      await searchHook.searchRestaurants({
        location: geocodeResult.coordinates,
        radius_km: radius,
        sort_by: 'distance',
        limit: 20
      })

    } catch (error: any) {
      console.error('Search by address error:', error)
      setLocationError(error.message || 'Failed to find location')
    } finally {
      setLocationLoading(false)
    }
  }, [searchHook])

  // Auto-search on mount if enabled
  useEffect(() => {
    if (autoSearch) {
      getCurrentLocationAndSearch()
    }
  }, [autoSearch, getCurrentLocationAndSearch])

  return {
    currentLocation,
    locationLoading,
    locationError,
    getCurrentLocationAndSearch,
    searchByAddress,
    ...searchHook
  }
}

/**
 * Hook for restaurant safety assessment
 */
export const useRestaurantSafety = (restaurantId: string) => {
  const [safetyAssessment, setSafetyAssessment] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getUserRestrictions = useCallback(async (): Promise<string[]> => {
    try {
      // This would typically come from useUserProfile hook
      return []
    } catch (error) {
      console.error('Error getting user restrictions:', error)
      return []
    }
  }, [])

  const assessSafety = useCallback(async () => {
    if (!restaurantId) return

    try {
      setLoading(true)
      setError(null)

      const userRestrictions = await getUserRestrictions()
      const assessment = await RestaurantService.assessRestaurantSafety(
        restaurantId,
        userRestrictions
      )

      setSafetyAssessment(assessment)

    } catch (error: any) {
      console.error('Safety assessment error:', error)
      setError(error.message || 'Failed to assess restaurant safety')
    } finally {
      setLoading(false)
    }
  }, [restaurantId, getUserRestrictions])

  // Assess safety on mount and when restaurant ID changes
  useEffect(() => {
    assessSafety()
  }, [assessSafety])

  return {
    safetyAssessment,
    loading,
    error,
    reassess: assessSafety
  }
}