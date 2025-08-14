/**
 * Restaurant Detail Component
 * 
 * SAFETY CRITICAL: Displays comprehensive restaurant information with safety details
 * Shows menu items, reviews, safety protocols, and emergency contact information
 */

import React, { useState, useEffect, useCallback } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Linking,
  Alert,
  Modal
} from 'react-native'
import { SafetyBadge } from '../SafetyBadge'
import { SafetyButton } from '../SafetyButton'
import { SafetyCard } from '../SafetyCard'
import { SafetyAssessmentCard, SafetyAssessmentDetails } from '../safety'
import { 
  RestaurantWithReviews, 
  MenuItemWithSafety,
  SafetyLevel,
  RestaurantReview, 
  RestaurantWithSafetyInfo 
} from '../../types/database.types'
import SafetyAssessmentAPI, { RestaurantSafetyOverview } from '../../services/safetyAssessmentAPI'
import { useAuth } from '../../contexts/AuthContext'

interface RestaurantDetailProps {
  restaurant: RestaurantWithReviews | RestaurantWithSafetyInfo
  menu?: MenuItemWithSafety[]
  onFavoriteToggle: () => void
  onCallRestaurant?: () => void
  onGetDirections?: () => void
  onWriteReview?: () => void
  onViewMenu?: () => void
  onViewAllReviews?: () => void
  onViewPhotos?: () => void
  onReportIncident?: () => void
  loading?: boolean
}

export const RestaurantDetail: React.FC<RestaurantDetailProps> = ({
  restaurant,
  menu = [],
  onFavoriteToggle,
  onCallRestaurant,
  onGetDirections,
  onWriteReview,
  onViewMenu,
  onViewAllReviews,
  onViewPhotos,
  onReportIncident,
  loading = false
}) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'reviews' | 'safety' | 'photos'>('overview')
  const [safetyAssessment, setSafetyAssessment] = useState<RestaurantSafetyOverview | null>(null)
  const [safetyLoading, setSafetyLoading] = useState(false)
  const [showSafetyDetails, setShowSafetyDetails] = useState(false)
  const [showEmergencyActions, setShowEmergencyActions] = useState(false)

  // Load safety assessment on component mount
  useEffect(() => {
    loadSafetyAssessment()
  }, [restaurant.id, user?.id])

  const loadSafetyAssessment = async () => {
    try {
      setSafetyLoading(true)
      const response = await SafetyAssessmentAPI.getRestaurantSafetyAssessment(
        restaurant.id,
        user?.id
      )
      
      if (response.success) {
        setSafetyAssessment(response.data!)
      }
    } catch (error) {
      console.error('Failed to load safety assessment:', error)
    } finally {
      setSafetyLoading(false)
    }
  }

  const handleRefreshSafety = async () => {
    try {
      setSafetyLoading(true)
      const response = await SafetyAssessmentAPI.forceRefreshAssessment(restaurant.id)
      
      if (response.success) {
        await loadSafetyAssessment() // Reload with user-specific data
      } else {
        Alert.alert('Error', response.error || 'Failed to refresh safety assessment')
      }
    } catch (error) {
      console.error('Failed to refresh safety assessment:', error)
      Alert.alert('Error', 'Failed to refresh safety assessment')
    } finally {
      setSafetyLoading(false)
    }
  }

  const formatPriceRange = (range: number): string => {
    return '$'.repeat(range)
  }

  const formatHours = (hours: any): string => {
    // This would format operating hours from the JSON structure
    // For now, return a placeholder
    return "Open today 11:00 AM - 10:00 PM"
  }

  const getSafetyColor = (level: SafetyLevel): string => {
    switch (level) {
      case 'safe': return 'text-green-600'
      case 'caution': return 'text-blue-600'
      case 'warning': return 'text-yellow-600'
      case 'danger': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const handleCall = async () => {
    if (!restaurant.phone_number) return

    const phoneUrl = `tel:${restaurant.phone_number}`
    const canOpen = await Linking.canOpenURL(phoneUrl)
    
    if (canOpen) {
      Alert.alert(
        'Call Restaurant',
        `Call ${restaurant.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => Linking.openURL(phoneUrl)
          }
        ]
      )
    } else {
      Alert.alert('Error', 'Unable to make phone calls on this device')
    }
  }

  const handleDirections = () => {
    const address = `${restaurant.address}, ${restaurant.city}`
    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`
    Linking.openURL(mapsUrl)
  }

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

  const handleReportSafetyIncident = useCallback(() => {
    if (onReportIncident) {
      onReportIncident()
    } else {
      Alert.alert(
        'Report Safety Incident',
        'Navigate to incident reporting?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Report', onPress: () => console.log('Navigate to incident report') }
        ]
      )
    }
  }, [onReportIncident])

  const renderTabButton = (tab: typeof activeTab, title: string, badge?: boolean, icon?: string) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      className={`flex-1 py-3 px-2 border-b-2 ${
        activeTab === tab 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-transparent'
      }`}
      accessibilityRole="tab"
      accessibilityLabel={`${title} tab`}
      accessibilityState={{ selected: activeTab === tab }}
    >
      <View className="items-center relative">
        {icon && (
          <Text className="text-xs mb-1">{icon}</Text>
        )}
        <Text className={`text-center font-medium text-xs ${
          activeTab === tab ? 'text-blue-600' : 'text-gray-600'
        }`}>
          {title}
        </Text>
        {badge && safetyAssessment && (
          <View className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </View>
    </TouchableOpacity>
  )

  const renderOverview = () => (
    <View className="p-4">
      {/* Basic Info */}
      <View className="mb-6">
        <Text className="text-gray-600 text-sm mb-2">About</Text>
        <Text className="text-gray-900 leading-6">
          {restaurant.description || `${restaurant.name} serves ${restaurant.cuisine_types?.join(', ')} cuisine.`}
        </Text>
      </View>

      {/* Contact & Hours */}
      <View className="mb-6">
        <Text className="text-gray-600 text-sm mb-3">Contact & Hours</Text>
        
        {restaurant.phone_number && (
          <TouchableOpacity 
            onPress={handleCall}
            className="flex-row items-center py-2"
            accessibilityRole="button"
            accessibilityLabel={`Call ${restaurant.name}`}
          >
            <Text className="text-blue-600 mr-2">📞</Text>
            <Text className="text-blue-600">{restaurant.phone_number}</Text>
          </TouchableOpacity>
        )}

        <View className="flex-row items-center py-2">
          <Text className="text-gray-600 mr-2">🕒</Text>
          <Text className="text-gray-900">{formatHours(restaurant.hours_of_operation)}</Text>
        </View>

        <TouchableOpacity 
          onPress={handleDirections}
          className="flex-row items-start py-2"
          accessibilityRole="button"
          accessibilityLabel="Get directions"
        >
          <Text className="text-blue-600 mr-2">📍</Text>
          <Text className="text-blue-600 flex-1">
            {restaurant.address}, {restaurant.city}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amenities */}
      <View className="mb-6">
        <Text className="text-gray-600 text-sm mb-3">Amenities</Text>
        <View className="flex-row flex-wrap">
          {restaurant.wheelchair_accessible && (
            <View className="bg-green-100 px-3 py-1 rounded-full mr-2 mb-2">
              <Text className="text-green-800 text-sm">♿ Accessible</Text>
            </View>
          )}
          {restaurant.parking_available && (
            <View className="bg-blue-100 px-3 py-1 rounded-full mr-2 mb-2">
              <Text className="text-blue-800 text-sm">🅿️ Parking</Text>
            </View>
          )}
          {restaurant.outdoor_seating && (
            <View className="bg-green-100 px-3 py-1 rounded-full mr-2 mb-2">
              <Text className="text-green-800 text-sm">🌿 Outdoor Seating</Text>
            </View>
          )}
          {restaurant.delivery_available && (
            <View className="bg-yellow-100 px-3 py-1 rounded-full mr-2 mb-2">
              <Text className="text-yellow-800 text-sm">🚚 Delivery</Text>
            </View>
          )}
          {restaurant.takeout_available && (
            <View className="bg-purple-100 px-3 py-1 rounded-full mr-2 mb-2">
              <Text className="text-purple-800 text-sm">📦 Takeout</Text>
            </View>
          )}
        </View>
      </View>

      {/* Comprehensive Safety Assessment */}
      {safetyAssessment ? (
        <SafetyAssessmentCard
          assessment={safetyAssessment}
          onPress={() => setShowSafetyDetails(true)}
          onRefresh={handleRefreshSafety}
          showDetails={true}
          userSeverity={undefined}
        />
      ) : (
        <SafetyCard
          title="Safety Assessment Loading..."
          level="caution"
          className="mb-6"
        >
          <View className="items-center py-4">
            <Text className="text-gray-600 text-sm">
              Loading comprehensive safety assessment...
            </Text>
          </View>
        </SafetyCard>
      )}
    </View>
  )

  const renderMenu = () => (
    <View className="p-4">
      {menu.length > 0 ? (
        <View>
          {menu.slice(0, 5).map((item, index) => (
            <View key={item.id} className="border-b border-gray-200 py-4">
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-gray-900 font-semibold flex-1 mr-2">
                  {item.name}
                </Text>
                {item.price && (
                  <Text className="text-gray-900 font-medium">
                    ${item.price.toFixed(2)}
                  </Text>
                )}
              </View>
              
              {item.description && (
                <Text className="text-gray-600 text-sm mb-2">
                  {item.description}
                </Text>
              )}

              {/* Safety indicators for menu item */}
              {item.safety_assessment && item.safety_assessment.length > 0 && (
                <View className="flex-row flex-wrap">
                  {item.safety_assessment.map((assessment, idx) => (
                    <SafetyBadge
                      key={idx}
                      level={assessment.safety_level}
                      size="small"
                      className="mr-2 mb-1"
                    />
                  ))}
                </View>
              )}
            </View>
          ))}

          {menu.length > 5 && onViewMenu && (
            <TouchableOpacity
              onPress={onViewMenu}
              className="mt-4 bg-blue-500 py-3 rounded-lg"
              accessibilityRole="button"
              accessibilityLabel="View full menu"
            >
              <Text className="text-white text-center font-semibold">
                View Full Menu ({menu.length - 5} more items)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View className="items-center py-8">
          <Text className="text-gray-500 text-center">
            Menu information not available.
          </Text>
          {onViewMenu && (
            <TouchableOpacity
              onPress={onViewMenu}
              className="mt-4 bg-blue-500 px-6 py-2 rounded-lg"
              accessibilityRole="button"
              accessibilityLabel="Check for menu updates"
            >
              <Text className="text-white font-semibold">Check for Updates</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )

  const renderReviews = () => (
    <View className="p-4">
      {(() => {
        const reviews = (restaurant as any).reviews as RestaurantWithReviews['reviews'] | undefined
        return Array.isArray(reviews) && reviews.length > 0
      })() ? (
        <View>
          {(((restaurant as any).reviews as RestaurantWithReviews['reviews']) || []).slice(0, 3).map((review: any, index: number) => (
            <View key={review.id ?? index} className="border-b border-gray-200 py-4">
              <View className="flex-row items-center mb-2">
                <View className="flex-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Text key={star} className={`text-sm ${
                      star <= review.rating ? 'text-yellow-500' : 'text-gray-300'
                    }`}>
                      ⭐
                    </Text>
                  ))}
                </View>
                <Text className="text-gray-600 text-sm ml-2">
                  by {review.user?.full_name || 'Anonymous'}
                </Text>
                {review.user?.is_verified && (
                  <Text className="text-blue-600 text-sm ml-1">✓</Text>
                )}
              </View>

              {review.review_text && (
                <Text className="text-gray-900 mb-2">
                  {review.review_text}
                </Text>
              )}

              {review.safety_rating && (
                <View className="flex-row items-center">
                  <Text className="text-gray-600 text-sm mr-2">Safety:</Text>
                  <SafetyBadge
                    level={review.safety_rating >= 4 ? 'safe' : review.safety_rating >= 3 ? 'caution' : 'warning'}
                    text={`${review.safety_rating}/5`}
                    size="small"
                  />
                </View>
              )}
            </View>
          ))}

          {(((restaurant as any).reviews as RestaurantWithReviews['reviews']) || []).length > 3 && onViewAllReviews && (
            <TouchableOpacity
              onPress={onViewAllReviews}
              className="mt-4 bg-blue-500 py-3 rounded-lg"
              accessibilityRole="button"
              accessibilityLabel="View all reviews"
            >
              <Text className="text-white text-center font-semibold">
                View All Reviews {((((restaurant as any).reviews as RestaurantWithReviews['reviews']) || []).length - 3) > 0 ? `(${(((restaurant as any).reviews as RestaurantWithReviews['reviews']) || []).length - 3} more)` : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View className="items-center py-8">
          <Text className="text-gray-500 text-center mb-4">
            No reviews yet. Be the first to share your experience!
          </Text>
          {onWriteReview && (
            <TouchableOpacity
              onPress={onWriteReview}
              className="bg-blue-500 px-6 py-2 rounded-lg"
              accessibilityRole="button"
              accessibilityLabel="Write first review"
            >
              <Text className="text-white font-semibold">Write Review</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )

  const renderSafetyTab = () => {
    if (!safetyAssessment) {
      return (
        <View className="p-4">
          <View className="items-center py-8">
            <Text className="text-gray-500 text-center mb-4">
              {safetyLoading ? 'Loading safety assessment...' : 'Safety assessment not available'}
            </Text>
            <TouchableOpacity
              onPress={loadSafetyAssessment}
              className="bg-blue-500 px-6 py-2 rounded-lg"
              accessibilityRole="button"
              accessibilityLabel="Load safety assessment"
            >
              <Text className="text-white font-semibold">
                {safetyLoading ? 'Loading...' : 'Load Assessment'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    return (
      <View className="p-4">
        {/* Quick Safety Overview */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-4">Safety Overview</Text>
          
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-3xl font-bold" style={{ 
                color: safetyAssessment.safety_level === 'safe' ? '#10B981' :
                       safetyAssessment.safety_level === 'caution' ? '#F59E0B' :
                       safetyAssessment.safety_level === 'warning' ? '#EF4444' : '#DC2626'
              }}>
                {safetyAssessment.overall_safety_score}/100
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                {safetyAssessment.safety_level.toUpperCase()} - {safetyAssessment.confidence_score}% confidence
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={() => setShowSafetyDetails(true)}
              className="bg-blue-500 px-4 py-2 rounded-lg"
              accessibilityRole="button"
              accessibilityLabel="View detailed safety assessment"
            >
              <Text className="text-white font-semibold">View Details</Text>
            </TouchableOpacity>
          </View>

          {/* Critical Warnings */}
          {safetyAssessment.critical_warnings.length > 0 && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <Text className="text-red-800 font-medium mb-2">
                ⚠️ {safetyAssessment.critical_warnings.length} Critical Warning(s)
              </Text>
              {safetyAssessment.critical_warnings.slice(0, 2).map((warning, index) => (
                <Text key={index} className="text-red-700 text-sm mb-1">
                  • {warning}
                </Text>
              ))}
              {safetyAssessment.critical_warnings.length > 2 && (
                <Text className="text-red-600 text-sm font-medium">
                  +{safetyAssessment.critical_warnings.length - 2} more warnings
                </Text>
              )}
            </View>
          )}

          {/* Quick Stats */}
          <View className="flex-row justify-between pt-4 border-t border-gray-200">
            <View className="items-center flex-1">
              <Text className="text-xs text-gray-500">Expert Verified</Text>
              <Text className="text-sm font-medium text-gray-900">
                {safetyAssessment.expert_verified ? 'Yes' : 'No'}
              </Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xs text-gray-500">Data Age</Text>
              <Text className="text-sm font-medium text-gray-900">
                {safetyAssessment.data_freshness_days} days
              </Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xs text-gray-500">Restrictions</Text>
              <Text className="text-sm font-medium text-gray-900">
                {safetyAssessment.restriction_specific_scores.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Restriction-Specific Safety Scores */}
        {safetyAssessment.restriction_specific_scores.length > 0 && (
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-4">Restriction-Specific Safety</Text>
            {safetyAssessment.restriction_specific_scores.map((score) => {
              const safetyColor = score.safety_level === 'safe' ? '#10B981' :
                                score.safety_level === 'caution' ? '#F59E0B' :
                                score.safety_level === 'warning' ? '#EF4444' : '#DC2626'
              
              return (
                <View key={score.restriction_id} className="mb-4 last:mb-0">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm font-medium text-gray-700">{score.restriction_name}</Text>
                    <View className="flex-row items-center">
                      <Text className="text-sm font-bold text-gray-900 mr-2">
                        {score.safety_score}/100
                      </Text>
                      <View 
                        className="px-2 py-1 rounded-full"
                        style={{ backgroundColor: safetyColor + '20' }}
                      >
                        <Text 
                          className="text-xs font-medium"
                          style={{ color: safetyColor }}
                        >
                          {score.safety_level.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${score.safety_score}%`, 
                        backgroundColor: safetyColor
                      }}
                    />
                  </View>
                  <Text className="text-xs text-gray-500 mt-1">
                    {score.confidence_score}% confidence
                  </Text>
                </View>
              )
            })}
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row space-x-3">
          <TouchableOpacity
            onPress={handleRefreshSafety}
            disabled={safetyLoading}
            className="flex-1 bg-gray-100 py-3 rounded-lg"
            accessibilityRole="button"
            accessibilityLabel="Refresh safety assessment"
          >
            <Text className="text-gray-700 text-center font-semibold">
              {safetyLoading ? '🔄 Refreshing...' : '🔄 Refresh'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setShowSafetyDetails(true)}
            className="flex-1 bg-blue-500 py-3 rounded-lg"
            accessibilityRole="button"
            accessibilityLabel="View detailed safety assessment"
          >
            <Text className="text-white text-center font-semibold">📊 Full Details</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Text className="text-xs text-yellow-800 text-center">
            ⚠️ Always verify safety information directly with restaurant staff. 
            This assessment is based on available data and community input.
          </Text>
        </View>
      </View>
    )
  }

  const renderPhotos = () => {
    // Collect photos from reviews (if available in data model)
    const reviewPhotos = ((((restaurant as any).reviews as RestaurantWithReviews['reviews']) || []) as any[])
      .flatMap((review: any) => (review.photos || []).map((photo: any) => ({
        ...photo,
        reviewer: review.user?.full_name || 'Anonymous',
        review_id: review.id
      })))

    return (
      <View className="p-4">
        {reviewPhotos.length > 0 ? (
          <View>
            <Text className="text-gray-900 text-lg font-bold mb-4">
              Community Photos ({reviewPhotos.length})
            </Text>
            
            <View className="flex-row flex-wrap justify-between">
              {reviewPhotos.slice(0, 6).map((photo: any, index: number) => (
                <TouchableOpacity
                  key={photo.id}
                  className="w-[48%] aspect-square mb-3 rounded-lg overflow-hidden bg-gray-200"
                  onPress={() => {
                    if (onViewPhotos) {
                      onViewPhotos()
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`View photo by ${photo.reviewer}`}
                >
                  <Image
                    source={{ uri: photo.photo_url }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  
                  {/* Photo overlay with reviewer info */}
                  <View className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                    <Text className="text-white text-xs font-medium">
                      by {photo.reviewer}
                    </Text>
                  </View>
                  
                  {/* Safety indicator if photo has safety context */}
                  {photo.safety_context && (
                    <View className="absolute top-2 right-2">
                      <SafetyBadge
                        level={photo.safety_context === 'safe' ? 'safe' : 'caution'}
                        size="small"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {reviewPhotos.length > 6 && onViewPhotos && (
              <TouchableOpacity
                onPress={onViewPhotos}
                className="mt-4 bg-blue-500 py-3 rounded-lg"
                accessibilityRole="button"
                accessibilityLabel="View all photos"
              >
                <Text className="text-white text-center font-semibold">
                  View All Photos ({reviewPhotos.length - 6} more)
                </Text>
              </TouchableOpacity>
            )}

            {/* Photo guidelines */}
            <View className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Text className="text-blue-800 font-medium text-sm mb-2">
                📸 Photo Guidelines
              </Text>
              <Text className="text-blue-700 text-xs leading-4">
                • Focus on menu items, ingredient lists, and allergen information
                • Include preparation areas if visible
                • Avoid photos of other customers for privacy
                • Report any safety concerns you observe
              </Text>
            </View>
          </View>
        ) : (
          <View className="items-center py-8">
            <Text className="text-gray-500 text-center mb-4">
              No photos yet. Help the community by sharing photos of menu items and allergen information!
            </Text>
            {onWriteReview && (
              <TouchableOpacity
                onPress={onWriteReview}
                className="bg-blue-500 px-6 py-2 rounded-lg"
                accessibilityRole="button"
                accessibilityLabel="Add photos in review"
              >
                <Text className="text-white font-semibold">📸 Add Photos</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header Image */}
      <View className="h-64 bg-gray-200 relative">
        <View className="w-full h-full bg-gray-200 items-center justify-center">
          <Text className="text-gray-500 text-5xl">🍽️</Text>
        </View>

        {/* Overlay Actions */}
        <View className="absolute top-4 right-4">
          <TouchableOpacity
            onPress={onFavoriteToggle}
            className="w-12 h-12 bg-white/90 rounded-full items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={restaurant.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Text className={`text-2xl ${restaurant.is_favorite ? 'text-red-500' : 'text-gray-400'}`}>
              {restaurant.is_favorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Restaurant Info Header */}
      <View className="p-4 border-b border-gray-200">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-4">
            <Text className="text-gray-900 text-2xl font-bold mb-1">
              {restaurant.name}
            </Text>
            {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
              <Text className="text-gray-600">
                {restaurant.cuisine_types.join(', ')}
              </Text>
            )}
          </View>

          <View className="items-end">
            <Text className="text-gray-900 text-xl font-bold">
              {formatPriceRange(restaurant.price_range || 2)}
            </Text>
            {restaurant.average_rating && (
              <View className="flex-row items-center mt-1">
                <Text className="text-yellow-500 mr-1">⭐</Text>
                <Text className="text-gray-700">
                  {restaurant.average_rating.toFixed(1)}
                </Text>
                <Text className="text-gray-500 ml-1">
                  ({restaurant.total_reviews})
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-3 mt-4">
          {restaurant.phone_number && (
            <TouchableOpacity
              onPress={handleCall}
              className="flex-1 bg-blue-500 py-3 rounded-lg"
              accessibilityRole="button"
              accessibilityLabel="Call restaurant"
            >
              <Text className="text-white text-center font-semibold">📞 Call</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={handleDirections}
            className="flex-1 bg-green-500 py-3 rounded-lg"
            accessibilityRole="button"
            accessibilityLabel="Get directions"
          >
            <Text className="text-white text-center font-semibold">🧭 Directions</Text>
          </TouchableOpacity>

          {onWriteReview && (
            <TouchableOpacity
              onPress={onWriteReview}
              className="flex-1 bg-yellow-500 py-3 rounded-lg"
              accessibilityRole="button"
              accessibilityLabel="Write review"
            >
              <Text className="text-white text-center font-semibold">✍️ Review</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Emergency Actions Bar */}
      <View className="bg-red-50 border-b border-red-200 px-4 py-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-red-600 text-sm font-medium mr-2">🚨 Emergency Actions</Text>
            {Boolean(safetyAssessment && safetyAssessment.critical_warnings && safetyAssessment.critical_warnings.length > 0) && (
              <SafetyBadge level="danger" size="small" text={`${safetyAssessment!.critical_warnings.length} WARNINGS`} />
            )}
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
              onPress={handleReportSafetyIncident}
              className="flex-1 bg-red-500 py-2 rounded-lg"
              accessibilityRole="button"
              accessibilityLabel="Report safety incident"
            >
              <Text className="text-white text-center font-bold text-sm">⚠️ Report Incident</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Tab Navigation */}
      <View className="flex-row bg-white border-b border-gray-200">
        {renderTabButton('overview', 'Overview', false, '📋')}
  {renderTabButton('safety', 'Safety', Boolean(safetyAssessment && safetyAssessment.critical_warnings && safetyAssessment.critical_warnings.length > 0), '🛡️')}
        {renderTabButton('menu', 'Menu', false, '📄')}
        {renderTabButton('photos', 'Photos', false, '📸')}
        {renderTabButton('reviews', 'Reviews', false, '⭐')}
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'safety' && renderSafetyTab()}
      {activeTab === 'menu' && renderMenu()}
      {activeTab === 'photos' && renderPhotos()}
      {activeTab === 'reviews' && renderReviews()}
      
      {/* Safety Details Modal */}
      <Modal
        visible={showSafetyDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSafetyDetails(false)}
      >
        <SafetyAssessmentDetails
          restaurantId={restaurant.id}
          userId={user?.id}
          onClose={() => setShowSafetyDetails(false)}
        />
      </Modal>
    </ScrollView>
  )
}