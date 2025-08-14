/**
 * Restaurant Photos Screen
 * 
 * SAFETY CRITICAL: Displays community photos with safety context
 * Allows users to view, filter, and report photos related to food safety
 */

import React, { useState, useCallback, useEffect } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Modal,
  Alert,
  Dimensions,
  FlatList
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SafetyBadge } from '../../components/SafetyBadge'
import { SafetyButton } from '../../components/SafetyButton'
import { LoadingScreen } from '../../components/LoadingScreen'

interface RestaurantPhotosScreenProps {
  navigation: any
  route: {
    params: {
      restaurantId: string
      restaurantName: string
    }
  }
}

interface PhotoWithContext {
  id: string
  photo_url: string
  reviewer: string
  review_id: string
  created_at: string
  safety_context?: 'safe' | 'caution' | 'warning'
  description?: string
  tags?: string[]
}

export const RestaurantPhotosScreen: React.FC<RestaurantPhotosScreenProps> = ({
  navigation,
  route
}) => {
  const { restaurantId, restaurantName } = route.params
  const [photos, setPhotos] = useState<PhotoWithContext[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithContext | null>(null)
  const [showFullScreen, setShowFullScreen] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'safety' | 'menu' | 'environment'>('all')

  const screenWidth = Dimensions.get('window').width

  // Set navigation title
  useEffect(() => {
    navigation.setOptions({
      title: `${restaurantName} Photos`,
      headerTitleStyle: { fontSize: 16 }
    })
  }, [restaurantName, navigation])

  // Load photos (mock data for now)
  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    try {
      setLoading(true)
      
      // Mock data - in real app, this would fetch from API
      const mockPhotos: PhotoWithContext[] = [
        {
          id: '1',
          photo_url: 'https://picsum.photos/400/400?random=1',
          reviewer: 'Sarah M.',
          review_id: 'review1',
          created_at: '2024-01-15T10:30:00Z',
          safety_context: 'safe',
          description: 'Allergen-free menu section clearly marked',
          tags: ['menu', 'allergen-info']
        },
        {
          id: '2',
          photo_url: 'https://picsum.photos/400/400?random=2',
          reviewer: 'Mike R.',
          review_id: 'review2',
          created_at: '2024-01-14T15:45:00Z',
          safety_context: 'caution',
          description: 'Food preparation area - cross contamination possible',
          tags: ['kitchen', 'preparation']
        },
        {
          id: '3',
          photo_url: 'https://picsum.photos/400/400?random=3',
          reviewer: 'Emma L.',
          review_id: 'review3',
          created_at: '2024-01-13T12:20:00Z',
          safety_context: 'safe',
          description: 'Detailed ingredient list posted',
          tags: ['ingredients', 'allergen-info']
        }
      ]
      
      setPhotos(mockPhotos)
    } catch (error) {
      console.error('Failed to load photos:', error)
      Alert.alert('Error', 'Failed to load photos')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoPress = useCallback((photo: PhotoWithContext) => {
    setSelectedPhoto(photo)
    setShowFullScreen(true)
  }, [])

  const handleReportPhoto = useCallback((photo: PhotoWithContext) => {
    Alert.alert(
      'Report Photo',
      'Why are you reporting this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Inappropriate Content', 
          onPress: () => console.log('Report inappropriate content')
        },
        { 
          text: 'Safety Misinformation', 
          style: 'destructive',
          onPress: () => console.log('Report safety misinformation')
        }
      ]
    )
  }, [])

  const handleAddPhoto = useCallback(() => {
    navigation.navigate('WriteReview', {
      restaurantId,
      restaurantName,
      focusOnPhotos: true
    })
  }, [navigation, restaurantId, restaurantName])

  const filteredPhotos = photos.filter(photo => {
    if (filterType === 'all') return true
    if (filterType === 'safety') return photo.safety_context && photo.safety_context !== 'safe'
    if (filterType === 'menu') return photo.tags?.includes('menu') || photo.tags?.includes('ingredients')
    if (filterType === 'environment') return photo.tags?.includes('kitchen') || photo.tags?.includes('preparation')
    return true
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const renderFilterButton = (type: typeof filterType, label: string, icon: string) => (
    <TouchableOpacity
      onPress={() => setFilterType(type)}
      className={`px-3 py-2 rounded-full mr-2 border ${
        filterType === type
          ? 'bg-blue-500 border-blue-500' 
          : 'bg-white border-gray-300'
      }`}
    >
      <Text className={`text-sm ${
        filterType === type ? 'text-white' : 'text-gray-600'
      }`}>
        {icon} {label}
      </Text>
    </TouchableOpacity>
  )

  const renderPhotoItem = ({ item: photo, index }: { item: PhotoWithContext, index: number }) => (
    <TouchableOpacity
      onPress={() => handlePhotoPress(photo)}
      className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      accessibilityRole="button"
      accessibilityLabel={`Photo by ${photo.reviewer}`}
    >
      <Image
        source={{ uri: photo.photo_url }}
        style={{ width: screenWidth - 32, height: 200 }}
        resizeMode="cover"
      />
      
      {/* Photo overlay with safety indicator */}
      <View className="absolute top-2 right-2 flex-row space-x-1">
        {photo.safety_context && (
          <SafetyBadge
            level={photo.safety_context}
            size="small"
          />
        )}
      </View>
      
      {/* Photo info */}
      <View className="p-3">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-gray-900 font-medium">
              by {photo.reviewer}
            </Text>
            <Text className="text-gray-500 text-sm">
              {formatDate(photo.created_at)}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => handleReportPhoto(photo)}
            className="p-1"
            accessibilityRole="button"
            accessibilityLabel="Report photo"
          >
            <Text className="text-gray-400">⚠️</Text>
          </TouchableOpacity>
        </View>
        
        {photo.description && (
          <Text className="text-gray-700 text-sm mb-2">
            {photo.description}
          </Text>
        )}
        
        {photo.tags && photo.tags.length > 0 && (
          <View className="flex-row flex-wrap">
            {photo.tags.map((tag, tagIndex) => (
              <View
                key={tagIndex}
                className="bg-gray-100 px-2 py-1 rounded-full mr-1 mb-1"
              >
                <Text className="text-gray-600 text-xs">#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <LoadingScreen 
        title="Loading photos..."
        subtitle="Getting community photos and safety information"
      />
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Filter Bar */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row">
            {renderFilterButton('all', 'All Photos', '📷')}
            {renderFilterButton('safety', 'Safety Concerns', '⚠️')}
            {renderFilterButton('menu', 'Menu & Ingredients', '📋')}
            {renderFilterButton('environment', 'Kitchen & Prep', '🏪')}
          </View>
        </ScrollView>
        
        <View className="flex-row justify-between items-center mt-3">
          <Text className="text-gray-600 text-sm">
            {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''}
          </Text>
          
          <TouchableOpacity
            onPress={handleAddPhoto}
            className="bg-blue-500 px-4 py-2 rounded-lg"
            accessibilityRole="button"
            accessibilityLabel="Add photos"
          >
            <Text className="text-white font-medium text-sm">📸 Add Photos</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Photos List */}
      {filteredPhotos.length > 0 ? (
        <FlatList
          data={filteredPhotos}
          renderItem={renderPhotoItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-500 text-lg text-center mb-4">
            No photos found for this filter
          </Text>
          <TouchableOpacity
            onPress={handleAddPhoto}
            className="bg-blue-500 px-6 py-3 rounded-lg"
            accessibilityRole="button"
            accessibilityLabel="Be first to add photos"
          >
            <Text className="text-white font-semibold">Be the First to Add Photos</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Full Screen Photo Modal */}
      <Modal
        visible={showFullScreen}
        animationType="fade"
        onRequestClose={() => setShowFullScreen(false)}
      >
        <SafeAreaView className="flex-1 bg-black">
          {selectedPhoto && (
            <View className="flex-1">
              {/* Header */}
              <View className="flex-row justify-between items-center p-4">
                <TouchableOpacity
                  onPress={() => setShowFullScreen(false)}
                  className="bg-black/50 p-2 rounded-full"
                  accessibilityRole="button"
                  accessibilityLabel="Close full screen"
                >
                  <Text className="text-white text-lg">✕</Text>
                </TouchableOpacity>
                
                <View className="flex-row space-x-2">
                  {selectedPhoto.safety_context && (
                    <SafetyBadge
                      level={selectedPhoto.safety_context}
                      size="medium"
                    />
                  )}
                  
                  <TouchableOpacity
                    onPress={() => handleReportPhoto(selectedPhoto)}
                    className="bg-red-500/80 px-3 py-2 rounded-lg"
                    accessibilityRole="button"
                    accessibilityLabel="Report photo"
                  >
                    <Text className="text-white font-medium text-sm">⚠️ Report</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Full Screen Image */}
              <View className="flex-1 items-center justify-center">
                <Image
                  source={{ uri: selectedPhoto.photo_url }}
                  style={{ 
                    width: screenWidth, 
                    height: screenWidth,
                    maxHeight: '70%'
                  }}
                  resizeMode="contain"
                />
              </View>
              
              {/* Photo Info */}
              <View className="bg-black/80 p-4">
                <View className="flex-row justify-between items-start mb-2">
                  <View>
                    <Text className="text-white font-medium">
                      by {selectedPhoto.reviewer}
                    </Text>
                    <Text className="text-gray-300 text-sm">
                      {formatDate(selectedPhoto.created_at)}
                    </Text>
                  </View>
                </View>
                
                {selectedPhoto.description && (
                  <Text className="text-white mb-2">
                    {selectedPhoto.description}
                  </Text>
                )}
                
                {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                  <View className="flex-row flex-wrap">
                    {selectedPhoto.tags.map((tag, tagIndex) => (
                      <View
                        key={tagIndex}
                        className="bg-gray-700 px-2 py-1 rounded-full mr-1 mb-1"
                      >
                        <Text className="text-gray-200 text-xs">#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}