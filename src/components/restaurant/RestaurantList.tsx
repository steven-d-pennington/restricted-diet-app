/**
 * Restaurant List Component
 * 
 * SAFETY CRITICAL: Displays a scrollable list of restaurants with safety indicators
 * Supports infinite scrolling, filtering, and accessibility features
 */

import React, { useCallback } from 'react'
import { 
  FlatList, 
  View, 
  Text, 
  RefreshControl, 
  ActivityIndicator,
  TouchableOpacity 
} from 'react-native'
import { RestaurantCard } from './RestaurantCard'
import { LoadingScreen } from '../LoadingScreen'
import { RestaurantWithSafetyInfo } from '../../types/database.types'

interface RestaurantListProps {
  restaurants: RestaurantWithSafetyInfo[]
  loading: boolean
  error: string | null
  hasMore: boolean
  onRestaurantPress: (restaurant: RestaurantWithSafetyInfo) => void
  onFavoritePress?: (restaurant: RestaurantWithSafetyInfo) => void
  onLoadMore?: () => void
  onRefresh?: () => void
  showDistance?: boolean
  showSafetyDetails?: boolean
  compact?: boolean
  emptyStateTitle?: string
  emptyStateMessage?: string
  emptyStateAction?: () => void
  emptyStateActionTitle?: string
}

export const RestaurantList: React.FC<RestaurantListProps> = ({
  restaurants,
  loading,
  error,
  hasMore,
  onRestaurantPress,
  onFavoritePress,
  onLoadMore,
  onRefresh,
  showDistance = true,
  showSafetyDetails = true,
  compact = false,
  emptyStateTitle = "No restaurants found",
  emptyStateMessage = "Try adjusting your search criteria or expanding your search radius.",
  emptyStateAction,
  emptyStateActionTitle = "Retry Search"
}) => {
  const renderRestaurant = useCallback(({ item }: { item: RestaurantWithSafetyInfo }) => (
    <RestaurantCard
      restaurant={item}
      onPress={() => onRestaurantPress(item)}
      onFavoritePress={onFavoritePress ? () => onFavoritePress(item) : undefined}
      showDistance={showDistance}
      showSafetyDetails={showSafetyDetails}
      compact={compact}
    />
  ), [onRestaurantPress, onFavoritePress, showDistance, showSafetyDetails, compact])

  const renderLoadMoreFooter = useCallback(() => {
    if (!hasMore || loading) return null

    return (
      <View className="py-4">
        <TouchableOpacity
          onPress={onLoadMore}
          className="bg-blue-500 mx-4 py-3 rounded-lg items-center"
          accessibilityRole="button"
          accessibilityLabel="Load more restaurants"
        >
          <Text className="text-white font-semibold">Load More Restaurants</Text>
        </TouchableOpacity>
      </View>
    )
  }, [hasMore, loading, onLoadMore])

  const renderLoadingFooter = useCallback(() => {
    if (!loading || restaurants.length === 0) return null

    return (
      <View className="py-6 items-center">
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text className="text-gray-600 text-sm mt-2">Loading more restaurants...</Text>
      </View>
    )
  }, [loading, restaurants.length])

  const renderEmptyState = useCallback(() => (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4">
        <Text className="text-gray-400 text-3xl">🔍</Text>
      </View>
      
      <Text className="text-gray-900 text-xl font-bold text-center mb-2">
        {emptyStateTitle}
      </Text>
      
      <Text className="text-gray-600 text-center mb-6 leading-6">
        {emptyStateMessage}
      </Text>

      {emptyStateAction && (
        <TouchableOpacity
          onPress={emptyStateAction}
          className="bg-blue-500 px-6 py-3 rounded-lg"
          accessibilityRole="button"
          accessibilityLabel={emptyStateActionTitle}
        >
          <Text className="text-white font-semibold">{emptyStateActionTitle}</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [emptyStateTitle, emptyStateMessage, emptyStateAction, emptyStateActionTitle])

  const renderErrorState = useCallback(() => (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <View className="w-24 h-24 bg-red-100 rounded-full items-center justify-center mb-4">
        <Text className="text-red-500 text-3xl">⚠️</Text>
      </View>
      
      <Text className="text-gray-900 text-xl font-bold text-center mb-2">
        Something went wrong
      </Text>
      
      <Text className="text-gray-600 text-center mb-6 leading-6">
        {error}
      </Text>

      {onRefresh && (
        <TouchableOpacity
          onPress={onRefresh}
          className="bg-blue-500 px-6 py-3 rounded-lg"
          accessibilityRole="button"
          accessibilityLabel="Retry loading restaurants"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [error, onRefresh])

  const keyExtractor = useCallback((item: RestaurantWithSafetyInfo) => item.id, [])

  const handleEndReached = useCallback(() => {
    if (hasMore && !loading && onLoadMore) {
      onLoadMore()
    }
  }, [hasMore, loading, onLoadMore])

  // Show loading screen for initial load
  if (loading && restaurants.length === 0 && !error) {
    return (
      <LoadingScreen 
        title="Finding restaurants..."
        subtitle="Searching for safe dining options near you"
      />
    )
  }

  // Show error state
  if (error && restaurants.length === 0) {
    return renderErrorState()
  }

  // Show empty state
  if (!loading && restaurants.length === 0) {
    return renderEmptyState()
  }

  return (
    <View className="flex-1">
      <FlatList
        data={restaurants}
        renderItem={renderRestaurant}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ 
          padding: compact ? 8 : 16,
          paddingBottom: 32 
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? (
          <RefreshControl
            refreshing={loading && restaurants.length > 0}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        ) : undefined}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => (
          <>
            {renderLoadingFooter()}
            {renderLoadMoreFooter()}
          </>
        )}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        getItemLayout={compact ? (data, index) => ({
          length: 80, // Approximate height for compact cards
          offset: 80 * index,
          index,
        }) : undefined}
        accessibilityLabel="Restaurant list"
      />
    </View>
  )
}

/**
 * Restaurant List with Search Header
 */
interface RestaurantListWithHeaderProps extends RestaurantListProps {
  searchQuery?: string
  totalCount?: number
  searchLocation?: string
  searchRadius?: number
  onClearSearch?: () => void
}

export const RestaurantListWithHeader: React.FC<RestaurantListWithHeaderProps> = ({
  searchQuery,
  totalCount,
  searchLocation,
  searchRadius,
  onClearSearch,
  restaurants,
  ...listProps
}) => {
  const renderHeader = useCallback(() => (
    <View className="bg-white border-b border-gray-200 px-4 py-3">
      {/* Search Info */}
      {searchLocation && (
        <View className="flex-row items-center mb-2">
          <Text className="text-gray-600 text-sm">📍 Near </Text>
          <Text className="text-gray-900 text-sm font-medium">{searchLocation}</Text>
          {searchRadius && (
            <Text className="text-gray-600 text-sm"> within {searchRadius}km</Text>
          )}
        </View>
      )}

      {/* Results Count */}
      <View className="flex-row items-center justify-between">
        <Text className="text-gray-900 font-semibold">
          {totalCount !== undefined 
            ? `${totalCount} restaurant${totalCount === 1 ? '' : 's'} found`
            : `${restaurants.length} restaurant${restaurants.length === 1 ? '' : 's'}`
          }
        </Text>

        {searchQuery && onClearSearch && (
          <TouchableOpacity
            onPress={onClearSearch}
            className="bg-gray-100 px-3 py-1 rounded-full"
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Text className="text-gray-600 text-sm">Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Active Search Query */}
      {searchQuery && (
        <View className="mt-2">
          <Text className="text-gray-600 text-sm">
            Searching for: <Text className="font-medium">{searchQuery}</Text>
          </Text>
        </View>
      )}
    </View>
  ), [searchQuery, totalCount, searchLocation, searchRadius, onClearSearch, restaurants.length])

  return (
    <View className="flex-1">
      {renderHeader()}
      <RestaurantList restaurants={restaurants} {...listProps} />
    </View>
  )
}