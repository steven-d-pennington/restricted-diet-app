/**
 * Location Service
 * 
 * SAFETY CRITICAL: Provides accurate location data for finding safe restaurants
 * Handles GPS permissions, geocoding, and location-based calculations
 */

import * as Location from 'expo-location'
import { LocationCoordinates } from '../types/database.types'

export interface LocationServiceError {
  code: 'PERMISSION_DENIED' | 'LOCATION_UNAVAILABLE' | 'TIMEOUT' | 'GEOCODING_FAILED'
  message: string
  details?: any
}

export interface GeocodeResult {
  coordinates: LocationCoordinates
  formatted_address: string
  address_components: {
    street_number?: string
    route?: string
    locality?: string
    administrative_area_level_1?: string
    postal_code?: string
    country?: string
  }
}

export interface LocationPermissionStatus {
  granted: boolean
  canAskAgain: boolean
  status: Location.LocationPermissionResponse['status']
}

class LocationService {
  private static instance: LocationService
  private currentLocation: LocationCoordinates | null = null
  private watchId: Location.LocationSubscription | null = null
  private geocodeCache: Map<string, GeocodeResult> = new Map()

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService()
    }
    return LocationService.instance
  }

  /**
   * Request location permissions from the user
   */
  async requestLocationPermissions(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync()
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status
      }
    } catch (error) {
      console.error('Error requesting location permissions:', error)
      throw {
        code: 'PERMISSION_DENIED',
        message: 'Failed to request location permissions',
        details: error
      } as LocationServiceError
    }
  }

  /**
   * Check current location permission status
   */
  async getLocationPermissionStatus(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync()
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status
      }
    } catch (error) {
      console.error('Error checking location permissions:', error)
      throw {
        code: 'PERMISSION_DENIED',
        message: 'Failed to check location permissions',
        details: error
      } as LocationServiceError
    }
  }

  /**
   * Get the user's current location
   */
  async getCurrentLocation(highAccuracy: boolean = true): Promise<LocationCoordinates> {
    try {
      const permissions = await this.getLocationPermissionStatus()
      if (!permissions.granted) {
        const newPermissions = await this.requestLocationPermissions()
        if (!newPermissions.granted) {
          throw {
            code: 'PERMISSION_DENIED',
            message: 'Location permission is required to find nearby restaurants'
          } as LocationServiceError
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
        timeInterval: 10000, // 10 seconds
        distanceInterval: 10, // 10 meters
      })

      const coordinates: LocationCoordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }

      this.currentLocation = coordinates
      return coordinates

    } catch (error: any) {
      console.error('Error getting current location:', error)
      
      if (error.code === 'PERMISSION_DENIED') {
        throw error
      }

      throw {
        code: 'LOCATION_UNAVAILABLE',
        message: 'Unable to retrieve your current location. Please check your device settings.',
        details: error
      } as LocationServiceError
    }
  }

  /**
   * Watch for location changes (for real-time updates)
   */
  async startLocationTracking(
    callback: (location: LocationCoordinates) => void,
    highAccuracy: boolean = false
  ): Promise<void> {
    try {
      const permissions = await this.getLocationPermissionStatus()
      if (!permissions.granted) {
        throw {
          code: 'PERMISSION_DENIED',
          message: 'Location permission is required for location tracking'
        } as LocationServiceError
      }

      // Stop existing tracking
      if (this.watchId) {
        this.stopLocationTracking()
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
          timeInterval: 30000, // 30 seconds
          distanceInterval: 50, // 50 meters
        },
        (location) => {
          const coordinates: LocationCoordinates = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          }
          this.currentLocation = coordinates
          callback(coordinates)
        }
      )

    } catch (error) {
      console.error('Error starting location tracking:', error)
      throw {
        code: 'LOCATION_UNAVAILABLE',
        message: 'Unable to start location tracking',
        details: error
      } as LocationServiceError
    }
  }

  /**
   * Stop location tracking
   */
  stopLocationTracking(): void {
    if (this.watchId) {
      this.watchId.remove()
      this.watchId = null
    }
  }

  /**
   * Convert address string to coordinates (geocoding)
   */
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    try {
      // Check cache first
      const cacheKey = address.toLowerCase().trim()
      if (this.geocodeCache.has(cacheKey)) {
        return this.geocodeCache.get(cacheKey)!
      }

      const results = await Location.geocodeAsync(address)
      
      if (results.length === 0) {
        throw {
          code: 'GEOCODING_FAILED',
          message: 'No results found for the provided address'
        } as LocationServiceError
      }

      const result = results[0]
      const coordinates: LocationCoordinates = {
        latitude: result.latitude,
        longitude: result.longitude
      }

      // Get reverse geocoding for formatted address
      const reverseResults = await Location.reverseGeocodeAsync(coordinates)
      const reverseResult = reverseResults[0]

      const geocodeResult: GeocodeResult = {
        coordinates,
        formatted_address: this.formatAddress(reverseResult),
        address_components: {
          street_number: reverseResult.streetNumber || undefined,
          route: reverseResult.street || undefined,
          locality: reverseResult.city || undefined,
          administrative_area_level_1: reverseResult.region || undefined,
          postal_code: reverseResult.postalCode || undefined,
          country: reverseResult.country || undefined,
        }
      }

      // Cache the result
      this.geocodeCache.set(cacheKey, geocodeResult)
      
      return geocodeResult

    } catch (error: any) {
      console.error('Geocoding error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'GEOCODING_FAILED',
        message: 'Unable to find location for the provided address',
        details: error
      } as LocationServiceError
    }
  }

  /**
   * Convert coordinates to address (reverse geocoding)
   */
  async reverseGeocode(coordinates: LocationCoordinates): Promise<GeocodeResult> {
    try {
      const results = await Location.reverseGeocodeAsync(coordinates)
      
      if (results.length === 0) {
        throw {
          code: 'GEOCODING_FAILED',
          message: 'No address found for the provided coordinates'
        } as LocationServiceError
      }

      const result = results[0]
      
      return {
        coordinates,
        formatted_address: this.formatAddress(result),
        address_components: {
          street_number: result.streetNumber || undefined,
          route: result.street || undefined,
          locality: result.city || undefined,
          administrative_area_level_1: result.region || undefined,
          postal_code: result.postalCode || undefined,
          country: result.country || undefined,
        }
      }

    } catch (error: any) {
      console.error('Reverse geocoding error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'GEOCODING_FAILED',
        message: 'Unable to find address for the provided location',
        details: error
      } as LocationServiceError
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(
    coord1: LocationCoordinates,
    coord2: LocationCoordinates
  ): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude)
    const dLon = this.toRadians(coord2.longitude - coord1.longitude)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) *
        Math.cos(this.toRadians(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in kilometers
  }

  /**
   * Get last known location (cached)
   */
  getLastKnownLocation(): LocationCoordinates | null {
    return this.currentLocation
  }

  /**
   * Clear location cache
   */
  clearCache(): void {
    this.geocodeCache.clear()
    this.currentLocation = null
  }

  /**
   * Helper method to format address from reverse geocoding result
   */
  private formatAddress(result: Location.LocationGeocodedAddress): string {
    const parts: string[] = []
    
    if (result.streetNumber && result.street) {
      parts.push(`${result.streetNumber} ${result.street}`)
    } else if (result.street) {
      parts.push(result.street)
    }
    
    if (result.city) {
      parts.push(result.city)
    }
    
    if (result.region) {
      parts.push(result.region)
    }
    
    if (result.postalCode) {
      parts.push(result.postalCode)
    }
    
    if (result.country) {
      parts.push(result.country)
    }
    
    return parts.join(', ')
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

export default LocationService.getInstance()