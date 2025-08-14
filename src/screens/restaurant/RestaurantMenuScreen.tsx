/**
 * Restaurant Menu Screen
 * 
 * SAFETY CRITICAL: Browse restaurant menu with comprehensive safety indicators
 * Provides detailed allergen information and personalized safety assessments
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Modal,
  SectionList
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SafetyBadge } from '../../components/SafetyBadge'
import { SafetyCard } from '../../components/SafetyCard'
import { LoadingScreen } from '../../components/LoadingScreen'
import { useAuthContext } from '../../contexts/AuthContext'
import { MenuItemWithSafety, SafetyLevel } from '../../types/database.types'

interface RestaurantMenuScreenProps {
  navigation: any
  route: {
    params: {
      restaurantId: string
      restaurantName: string
    }
  }
}

interface MenuSection {
  title: string
  data: MenuItemWithSafety[]
  icon?: string
}

interface DetailedMenuItem extends MenuItemWithSafety {
  allergens?: string[]
  ingredients?: string[]
  preparation_notes?: string
  dietary_tags?: string[]
  safety_confidence?: number
  last_verified?: string
}

export const RestaurantMenuScreen: React.FC<RestaurantMenuScreenProps> = ({
  navigation,
  route
}) => {
  const { restaurantId, restaurantName } = route.params
  const { user } = useAuthContext()
  const [menu, setMenu] = useState<DetailedMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<DetailedMenuItem | null>(null)
  const [showItemDetail, setShowItemDetail] = useState(false)
  const [safetyFilter, setSafetyFilter] = useState<'all' | 'safe' | 'caution' | 'warning'>('all')

  // Set navigation title
  useEffect(() => {
    navigation.setOptions({
      title: `${restaurantName} Menu`,
      headerTitleStyle: { fontSize: 16 }
    })
  }, [restaurantName, navigation])

  // Load menu data
  useEffect(() => {
    loadMenu()
  }, [])

  const loadMenu = async () => {
    try {
      setLoading(true)
      
      // Mock menu data - in real app, this would fetch from API
      const mockMenu: DetailedMenuItem[] = [
        {
          id: '1',
          name: 'Grilled Chicken Caesar Salad',
          description: 'Fresh romaine lettuce, grilled chicken, parmesan cheese, croutons',
          price: 14.99,
          category: 'Salads',
          safety_assessment: [{
            restriction_id: 'gluten',
            restriction_name: 'Gluten',
            safety_level: 'warning',
            confidence_score: 85,
            notes: 'Contains croutons which typically contain gluten'
          }],
          allergens: ['Gluten', 'Dairy', 'Eggs'],
          ingredients: ['Romaine lettuce', 'Chicken breast', 'Parmesan cheese', 'Caesar dressing', 'Croutons'],
          preparation_notes: 'Prepared on shared surfaces with gluten-containing items',
          dietary_tags: ['High Protein'],
          safety_confidence: 85,
          last_verified: '2024-01-10T10:00:00Z'
        },
        {
          id: '2',
          name: 'Quinoa Buddha Bowl',
          description: 'Quinoa, roasted vegetables, avocado, tahini dressing',
          price: 16.99,
          category: 'Bowls',
          safety_assessment: [{
            restriction_id: 'gluten',
            restriction_name: 'Gluten',
            safety_level: 'safe',
            confidence_score: 95,
            notes: 'Naturally gluten-free ingredients'
          }],
          allergens: ['Sesame'],
          ingredients: ['Quinoa', 'Sweet potato', 'Broccoli', 'Avocado', 'Tahini', 'Lemon'],
          preparation_notes: 'Prepared in dedicated gluten-free area',
          dietary_tags: ['Vegan', 'Gluten-Free', 'High Fiber'],
          safety_confidence: 95,
          last_verified: '2024-01-12T14:30:00Z'
        },
        {
          id: '3',
          name: 'Salmon with Almond Crust',
          description: 'Pan-seared salmon with almond coating, served with rice',
          price: 22.99,
          category: 'Seafood',
          safety_assessment: [{
            restriction_id: 'nuts',
            restriction_name: 'Tree Nuts',
            safety_level: 'danger',
            confidence_score: 100,
            notes: 'Contains almonds - dangerous for tree nut allergies'
          }],
          allergens: ['Fish', 'Tree Nuts'],
          ingredients: ['Salmon', 'Almonds', 'Jasmine rice', 'Herbs', 'Olive oil'],
          preparation_notes: 'Nuts are processed in the same facility',
          dietary_tags: ['High Protein', 'Omega-3'],
          safety_confidence: 100,
          last_verified: '2024-01-11T09:15:00Z'
        }
      ]
      
      setMenu(mockMenu)
    } catch (error) {
      console.error('Failed to load menu:', error)
      Alert.alert('Error', 'Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  // Get user's dietary restrictions
  const userRestrictions = useMemo(() => {
    return user?.profile?.dietary_restrictions?.map(r => r.restriction_name.toLowerCase()) || []
  }, [user?.profile?.dietary_restrictions])

  // Filter and categorize menu items
  const filteredMenu = useMemo(() => {
    let filtered = menu

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ingredients?.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Apply safety filter
    if (safetyFilter !== 'all') {
      filtered = filtered.filter(item => {
        const userSafetyLevels = item.safety_assessment?.filter(assessment => 
          userRestrictions.includes(assessment.restriction_name.toLowerCase())
        ).map(assessment => assessment.safety_level)
        
        if (safetyFilter === 'safe') {
          return userSafetyLevels?.every(level => level === 'safe') || userSafetyLevels?.length === 0
        } else {
          return userSafetyLevels?.includes(safetyFilter)
        }
      })
    }

    return filtered
  }, [menu, searchQuery, selectedCategory, safetyFilter, userRestrictions])

  // Group filtered menu by category
  const menuSections: MenuSection[] = useMemo(() => {
    const categories = Array.from(new Set(filteredMenu.map(item => item.category || 'Other')))
    
    return categories.map(category => ({
      title: category,
      data: filteredMenu.filter(item => (item.category || 'Other') === category),
      icon: getCategoryIcon(category)
    }))
  }, [filteredMenu])

  const getCategoryIcon = (category: string): string => {
    const iconMap: { [key: string]: string } = {
      'Salads': '🥗',
      'Bowls': '🍲',
      'Seafood': '🐟',
      'Appetizers': '🍤',
      'Entrees': '🍽️',
      'Desserts': '🍰',
      'Beverages': '🥤',
      'Other': '🍴'
    }
    return iconMap[category] || '🍴'
  }

  const getSafetyLevelForUser = (item: DetailedMenuItem): SafetyLevel => {
    if (!item.safety_assessment) return 'unknown'
    
    const userAssessments = item.safety_assessment.filter(assessment => 
      userRestrictions.includes(assessment.restriction_name.toLowerCase())
    )
    
    if (userAssessments.length === 0) return 'safe'
    
    // Return the most restrictive level
    if (userAssessments.some(a => a.safety_level === 'danger')) return 'danger'
    if (userAssessments.some(a => a.safety_level === 'warning')) return 'warning'
    if (userAssessments.some(a => a.safety_level === 'caution')) return 'caution'
    return 'safe'
  }

  const handleItemPress = useCallback((item: DetailedMenuItem) => {
    setSelectedItem(item)
    setShowItemDetail(true)
  }, [])

  const handleReportIssue = useCallback((item: DetailedMenuItem) => {
    Alert.alert(
      'Report Menu Issue',
      `Report an issue with "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Incorrect Information', 
          onPress: () => console.log('Report incorrect info')
        },
        { 
          text: 'Safety Concern', 
          style: 'destructive',
          onPress: () => console.log('Report safety concern')
        }
      ]
    )
  }, [])

  const renderFilterButton = (type: string, label: string, count?: number) => (
    <TouchableOpacity
      onPress={() => setSelectedCategory(type)}
      className={`px-3 py-2 rounded-full mr-2 border ${
        selectedCategory === type
          ? 'bg-blue-500 border-blue-500' 
          : 'bg-white border-gray-300'
      }`}
    >
      <Text className={`text-sm ${
        selectedCategory === type ? 'text-white' : 'text-gray-600'
      }`}>
        {label} {count !== undefined && `(${count})`}
      </Text>
    </TouchableOpacity>
  )

  const renderSafetyFilterButton = (level: typeof safetyFilter, label: string, color: string) => (
    <TouchableOpacity
      onPress={() => setSafetyFilter(level)}
      className={`px-3 py-2 rounded-full mr-2 border ${
        safetyFilter === level
          ? `bg-${color}-500 border-${color}-500` 
          : 'bg-white border-gray-300'
      }`}
    >
      <Text className={`text-sm ${
        safetyFilter === level ? 'text-white' : 'text-gray-600'
      }`}>
        {label}
      </Text>
    </TouchableOpacity>
  )

  const renderMenuItem = ({ item }: { item: DetailedMenuItem }) => {
    const userSafetyLevel = getSafetyLevelForUser(item)
    const hasCriticalWarning = userSafetyLevel === 'danger' || userSafetyLevel === 'warning'

    return (
      <TouchableOpacity
        onPress={() => handleItemPress(item)}
        className={`bg-white rounded-lg p-4 mb-3 shadow-sm border ${
          hasCriticalWarning ? 'border-red-200 bg-red-50' : 'border-gray-200'
        }`}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${item.name}`}
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-gray-900 font-semibold text-lg">
              {item.name}
            </Text>
            {item.description && (
              <Text className="text-gray-600 text-sm mt-1">
                {item.description}
              </Text>
            )}
          </View>
          
          <View className="items-end">
            <Text className="text-gray-900 font-bold text-lg">
              ${item.price?.toFixed(2)}
            </Text>
            <SafetyBadge
              level={userSafetyLevel}
              size="sm"
              className="mt-1"
            />
          </View>
        </View>

        {/* Safety indicators for user's restrictions */}
        {userRestrictions.length > 0 && item.safety_assessment && (
          <View className="mb-2">
            <View className="flex-row flex-wrap">
              {item.safety_assessment
                .filter(assessment => userRestrictions.includes(assessment.restriction_name.toLowerCase()))
                .map((assessment, index) => (
                  <View
                    key={index}
                    className={`mr-2 mb-1 px-2 py-1 rounded-full ${
                      assessment.safety_level === 'danger' ? 'bg-red-100' :
                      assessment.safety_level === 'warning' ? 'bg-yellow-100' :
                      assessment.safety_level === 'caution' ? 'bg-blue-100' :
                      'bg-green-100'
                    }`}
                  >
                    <Text className={`text-xs font-medium ${
                      assessment.safety_level === 'danger' ? 'text-red-800' :
                      assessment.safety_level === 'warning' ? 'text-yellow-800' :
                      assessment.safety_level === 'caution' ? 'text-blue-800' :
                      'text-green-800'
                    }`}>
                      {assessment.restriction_name}: {assessment.safety_level.toUpperCase()}
                    </Text>
                  </View>
                ))
              }
            </View>
          </View>
        )}

        {/* Dietary tags */}
        {item.dietary_tags && item.dietary_tags.length > 0 && (
          <View className="flex-row flex-wrap">
            {item.dietary_tags.map((tag, index) => (
              <View
                key={index}
                className="bg-green-100 px-2 py-1 rounded-full mr-2 mb-1"
              >
                <Text className="text-green-800 text-xs font-medium">
                  ✓ {tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Critical warning banner */}
        {hasCriticalWarning && (
          <View className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
            <Text className="text-red-800 font-medium text-sm">
              ⚠️ May contain allergens you're sensitive to
            </Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const renderSectionHeader = ({ section }: { section: MenuSection }) => (
    <View className="bg-gray-100 px-4 py-2 border-b border-gray-200">
      <Text className="text-gray-700 font-semibold">
        {section.icon} {section.title} ({section.data.length})
      </Text>
    </View>
  )

  if (loading) {
    return (
      <LoadingScreen 
        title="Loading menu..."
        subtitle="Getting menu items and safety information"
      />
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Search and Filter Bar */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        {/* Search Input */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-3">
          <Text className="text-gray-500 mr-2">🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search menu items, ingredients..."
            className="flex-1 text-gray-900"
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              className="p-1"
            >
              <Text className="text-gray-500">✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row">
            {renderFilterButton('all', 'All Items', filteredMenu.length)}
            {Array.from(new Set(menu.map(item => item.category || 'Other'))).map(category => (
              renderFilterButton(
                category, 
                category, 
                menu.filter(item => (item.category || 'Other') === category).length
              )
            ))}
          </View>
        </ScrollView>

        {/* Safety Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row">
            {renderSafetyFilterButton('all', '🔍 All Safety Levels', 'gray')}
            {renderSafetyFilterButton('safe', '✅ Safe', 'green')}
            {renderSafetyFilterButton('caution', '⚠️ Caution', 'yellow')}
            {renderSafetyFilterButton('warning', '🚨 Warning', 'red')}
          </View>
        </ScrollView>
      </View>

      {/* Results Summary */}
      <View className="bg-blue-50 px-4 py-2 border-b border-blue-200">
        <Text className="text-blue-800 text-sm">
          {filteredMenu.length} items found
          {userRestrictions.length > 0 && ` • Filtered for your ${userRestrictions.length} restriction${userRestrictions.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* Menu Items */}
      {menuSections.length > 0 ? (
        <SectionList
          sections={menuSections}
          renderItem={renderMenuItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-500 text-lg text-center mb-4">
            No menu items found
          </Text>
          <Text className="text-gray-400 text-center">
            Try adjusting your search or filters
          </Text>
        </View>
      )}

      {/* Item Detail Modal */}
      <Modal
        visible={showItemDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowItemDetail(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          {selectedItem && (
            <ScrollView className="flex-1">
              {/* Header */}
              <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                <View className="flex-1">
                  <Text className="text-gray-900 text-xl font-bold">
                    {selectedItem.name}
                  </Text>
                  <Text className="text-gray-900 text-lg font-medium">
                    ${selectedItem.price?.toFixed(2)}
                  </Text>
                </View>
                
                <TouchableOpacity
                  onPress={() => setShowItemDetail(false)}
                  className="p-2"
                >
                  <Text className="text-gray-500 text-xl">✕</Text>
                </TouchableOpacity>
              </View>

              <View className="p-4">
                {/* Description */}
                {selectedItem.description && (
                  <View className="mb-6">
                    <Text className="text-gray-900 leading-6">
                      {selectedItem.description}
                    </Text>
                  </View>
                )}

                {/* Safety Assessment */}
                <SafetyCard
                  title="Safety Assessment"
                  level={getSafetyLevelForUser(selectedItem)}
                  className="mb-6"
                >
                  {selectedItem.safety_assessment?.map((assessment, index) => (
                    <View key={index} className="mb-3 last:mb-0">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="font-medium">{assessment.restriction_name}</Text>
                        <SafetyBadge level={assessment.safety_level} size="sm" />
                      </View>
                      <Text className="text-gray-600 text-sm">
                        {assessment.notes}
                      </Text>
                      <Text className="text-gray-500 text-xs mt-1">
                        Confidence: {assessment.confidence_score}%
                      </Text>
                    </View>
                  ))}
                </SafetyCard>

                {/* Allergens */}
                {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                  <View className="mb-6">
                    <Text className="text-gray-700 font-semibold mb-2">Allergens</Text>
                    <View className="flex-row flex-wrap">
                      {selectedItem.allergens.map((allergen, index) => (
                        <View
                          key={index}
                          className="bg-red-100 border border-red-300 px-3 py-1 rounded-full mr-2 mb-2"
                        >
                          <Text className="text-red-800 font-medium">⚠️ {allergen}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Ingredients */}
                {selectedItem.ingredients && selectedItem.ingredients.length > 0 && (
                  <View className="mb-6">
                    <Text className="text-gray-700 font-semibold mb-2">Ingredients</Text>
                    <Text className="text-gray-600 leading-5">
                      {selectedItem.ingredients.join(', ')}
                    </Text>
                  </View>
                )}

                {/* Preparation Notes */}
                {selectedItem.preparation_notes && (
                  <View className="mb-6">
                    <Text className="text-gray-700 font-semibold mb-2">Preparation Notes</Text>
                    <Text className="text-gray-600 leading-5">
                      {selectedItem.preparation_notes}
                    </Text>
                  </View>
                )}

                {/* Dietary Tags */}
                {selectedItem.dietary_tags && selectedItem.dietary_tags.length > 0 && (
                  <View className="mb-6">
                    <Text className="text-gray-700 font-semibold mb-2">Dietary Information</Text>
                    <View className="flex-row flex-wrap">
                      {selectedItem.dietary_tags.map((tag, index) => (
                        <View
                          key={index}
                          className="bg-green-100 px-3 py-1 rounded-full mr-2 mb-2"
                        >
                          <Text className="text-green-800 font-medium">✓ {tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Verification Info */}
                <View className="bg-gray-50 p-3 rounded-lg mb-6">
                  <Text className="text-gray-600 text-sm">
                    Last verified: {selectedItem.last_verified ? 
                      new Date(selectedItem.last_verified).toLocaleDateString() : 
                      'Unknown'
                    }
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    Safety confidence: {selectedItem.safety_confidence}%
                  </Text>
                </View>

                {/* Action Buttons */}
                <View className="space-y-3">
                  <TouchableOpacity
                    onPress={() => handleReportIssue(selectedItem)}
                    className="bg-red-500 py-3 rounded-lg"
                  >
                    <Text className="text-white text-center font-semibold">
                      ⚠️ Report Issue with This Item
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}