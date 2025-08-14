/**
 * Location Management Hook
 * 
 * SAFETY CRITICAL: Manages device location for finding safe restaurants
 * Handles permissions, location tracking, and geocoding functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Storage } from '../utils/storage'
import LocationService, { LocationServiceError, GeocodeResult, LocationPermissionStatus } from '../services/locationService'
import { LocationCoordinates } from '../types/database.types'

interface UseLocationState {
  currentLocation: LocationCoordinates | null
  lastKnownLocation: LocationCoordinates | null
  permissions: LocationPermissionStatus | null
  loading: boolean
  error: string | null
  isTracking: boolean
}

interface UseLocationActions {
  requestPermissions: () => Promise<boolean>
  getCurrentLocation: (highAccuracy?: boolean) => Promise<LocationCoordinates | null>
  startTracking: (callback?: (location: LocationCoordinates) => void) => Promise<void>
  stopTracking: () => void
  geocodeAddress: (address: string) => Promise<GeocodeResult | null>
  reverseGeocode: (coordinates: LocationCoordinates) => Promise<GeocodeResult | null>
  clearError: () => void
  refreshLocation: () => Promise<void>
}

const LOCATION_CACHE_KEY = 'last_known_location'
const LOCATION_CACHE_EXPIRY = 30 * 60 * 1000 // 30 minutes

/**
 * Hook for managing device location and permissions
 */
export const useLocation = (
  autoRequest: boolean = true,
  enableTracking: boolean = false
): UseLocationState & UseLocationActions => {
  const [state, setState] = useState<UseLocationState>({
    currentLocation: null,
    lastKnownLocation: null,
    permissions: null,
    loading: false,
    error: null,
    isTracking: false
  })

  const trackingCallbackRef = useRef<((location: LocationCoordinates) => void) | null>(null)

  // Load cached location on mount
  useEffect(() => {
    loadCachedLocation()
  }, [])

  // Auto-request permissions and location on mount
  useEffect(() => {
    if (autoRequest) {
      checkPermissionsAndGetLocation()
    }
  }, [autoRequest])

  const loadCachedLocation = useCallback(async () => {
    try {
      const cached = await Storage.getItem(LOCATION_CACHE_KEY)
      if (cached) {
        const { location, timestamp } = JSON.parse(cached)
        const age = Date.now() - timestamp
        
        if (age < LOCATION_CACHE_EXPIRY) {
          setState(prev => ({ ...prev, lastKnownLocation: location }))
          return location
        } else {
          // Remove expired cache
          await Storage.removeItem(LOCATION_CACHE_KEY)
        }
      }
    } catch (error) {
      console.error('Error loading cached location:', error)
    }
    return null
  }, [])

  const cacheLocation = useCallback(async (location: LocationCoordinates) => {
    try {
      const cacheData = {
        location,
        timestamp: Date.now()
      }
      await Storage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.error('Error caching location:', error)
    }
  }, [])

  const checkPermissionsAndGetLocation = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      // Check current permissions
      const permissionStatus = await LocationService.getLocationPermissionStatus()
      setState(prev => ({ ...prev, permissions: permissionStatus }))

      if (!permissionStatus.granted) {
        const newPermissions = await LocationService.requestLocationPermissions()
        setState(prev => ({ ...prev, permissions: newPermissions }))
        
        if (!newPermissions.granted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Location permission is required to find nearby restaurants'
          }))
          return
        }
      }

      // Get current location
      const location = await LocationService.getCurrentLocation()
      setState(prev => ({
        ...prev,
        currentLocation: location,
        lastKnownLocation: location,
        loading: false
      }))

      // Cache the location
      await cacheLocation(location)

      // Start tracking if enabled
      if (enableTracking) {
        await startTracking()
      }

    } catch (error: any) {
      console.error('Check permissions and get location error:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to get location'
      }))
    }
  }, [enableTracking, cacheLocation])

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const permissions = await LocationService.requestLocationPermissions()
      setState(prev => ({ ...prev, permissions, loading: false }))

      return permissions.granted
    } catch (error: any) {
      console.error('Request permissions error:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to request location permissions'
      }))
      return false
    }
  }, [])

  const getCurrentLocation = useCallback(async (
    highAccuracy: boolean = true
  ): Promise<LocationCoordinates | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const location = await LocationService.getCurrentLocation(highAccuracy)
      setState(prev => ({
        ...prev,
        currentLocation: location,
        lastKnownLocation: location,
        loading: false
      }))

      // Cache the new location
      await cacheLocation(location)

      return location
    } catch (error: any) {
      console.error('Get current location error:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to get current location'
      }))
      return null
    }
  }, [cacheLocation])

  const startTracking = useCallback(async (
    callback?: (location: LocationCoordinates) => void
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      // Store callback for internal tracking
      trackingCallbackRef.current = callback || null

      await LocationService.startLocationTracking(
        (location: LocationCoordinates) => {
          setState(prev => ({
            ...prev,
            currentLocation: location,
            lastKnownLocation: location
          }))

          // Cache updated location
          cacheLocation(location)

          // Call external callback if provided
          if (trackingCallbackRef.current) {
            trackingCallbackRef.current(location)
          }
        },
        false // Use balanced accuracy for tracking
      )

      setState(prev => ({ ...prev, isTracking: true, loading: false }))
    } catch (error: any) {
      console.error('Start tracking error:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to start location tracking'
      }))
    }
  }, [cacheLocation])

  const stopTracking = useCallback(() => {
    try {
      LocationService.stopLocationTracking()
      setState(prev => ({ ...prev, isTracking: false }))
      trackingCallbackRef.current = null
    } catch (error) {
      console.error('Stop tracking error:', error)
    }
  }, [])

  const geocodeAddress = useCallback(async (
    address: string
  ): Promise<GeocodeResult | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const result = await LocationService.geocodeAddress(address)
      setState(prev => ({ ...prev, loading: false }))

      return result
    } catch (error: any) {
      console.error('Geocode address error:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to find location for address'
      }))
      return null
    }
  }, [])

  const reverseGeocode = useCallback(async (
    coordinates: LocationCoordinates
  ): Promise<GeocodeResult | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const result = await LocationService.reverseGeocode(coordinates)
      setState(prev => ({ ...prev, loading: false }))

      return result
    } catch (error: any) {
      console.error('Reverse geocode error:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to find address for location'
      }))
      return null
    }
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const refreshLocation = useCallback(async () => {
    await getCurrentLocation(true)
  }, [getCurrentLocation])

  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      if (state.isTracking) {
        stopTracking()
      }
    }
  }, [state.isTracking, stopTracking])

  return {
    ...state,
    requestPermissions,
    getCurrentLocation,
    startTracking,
    stopTracking,
    geocodeAddress,
    reverseGeocode,
    clearError,
    refreshLocation
  }
}

/**
 * Hook for address search and geocoding
 */
export const useAddressSearch = () => {
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchAddresses = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      // For now, we'll use single geocoding result
      // In a production app, you might use a more sophisticated address search service
      const result = await LocationService.geocodeAddress(query)
      setSearchResults([result])

    } catch (error: any) {
      console.error('Address search error:', error)
      setError(error.message || 'Failed to search addresses')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setSearchResults([])
    setError(null)
  }, [])

  return {
    searchResults,
    loading,
    error,
    searchAddresses,
    clearResults
  }
}

/**
 * Hook for distance calculations
 */
export const useDistanceCalculator = () => {
  const calculateDistance = useCallback((
    from: LocationCoordinates,
    to: LocationCoordinates
  ): number => {
    return LocationService.calculateDistance(from, to)
  }, [])

  const calculateDistances = useCallback((
    from: LocationCoordinates,
    locations: Array<{ coordinates: LocationCoordinates; [key: string]: any }>
  ) => {
    return locations.map(location => ({
      ...location,
      distance_km: calculateDistance(from, location.coordinates)
    }))
  }, [calculateDistance])

  const sortByDistance = useCallback(<T extends { distance_km?: number }>(
    items: T[]
  ): T[] => {
    return [...items].sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0))
  }, [])

  const filterByDistance = useCallback(<T extends { distance_km?: number }>(
    items: T[],
    maxDistance: number
  ): T[] => {
    return items.filter(item => (item.distance_km || 0) <= maxDistance)
  }, [])

  return {
    calculateDistance,
    calculateDistances,
    sortByDistance,
    filterByDistance
  }
}