/**
 * Review Filters Component
 * 
 * SAFETY CRITICAL: Advanced filtering for restaurant reviews
 * Provides comprehensive filtering options for safety-focused review discovery
 */

import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, ScrollView, Switch } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import Slider from '@react-native-community/slider'
import {
  ReviewFilterOptions,
  ReviewCategory,
  ReviewVerificationLevel,
  DietaryRestriction
} from '../../types/database.types'
import { supabase } from '../../lib/supabase'

interface ReviewFiltersProps {
  filters: ReviewFilterOptions
  onApply: (filters: ReviewFilterOptions) => void
  onClose: () => void
  restaurantId?: string
}

const SORT_OPTIONS = [
  { value: 'date', label: 'Most Recent' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'helpfulness', label: 'Most Helpful' },
  { value: 'credibility', label: 'Most Credible' },
  { value: 'safety', label: 'Safety Rating' }
]

const VERIFICATION_LEVELS: Array<{ value: ReviewVerificationLevel, label: string }> = [
  { value: 'expert_verified', label: 'Expert Verified' },
  { value: 'restaurant_confirmed', label: 'Restaurant Confirmed' },
  { value: 'user_verified', label: 'Community Verified' },
  { value: 'incident_verified', label: 'Incident Verified' },
  { value: 'unverified', label: 'Unverified' }
]

const REVIEW_CATEGORIES: Array<{ value: ReviewCategory, label: string }> = [
  { value: 'safety', label: 'Safety & Allergen Handling' },
  { value: 'service', label: 'Service Quality' },
  { value: 'food_quality', label: 'Food Quality' },
  { value: 'cleanliness', label: 'Cleanliness' },
  { value: 'communication', label: 'Staff Communication' },
  { value: 'accommodation', label: 'Special Accommodations' }
]

export default function ReviewFilters({
  filters,
  onApply,
  onClose,
  restaurantId
}: ReviewFiltersProps) {
  
  const [localFilters, setLocalFilters] = useState<ReviewFilterOptions>(filters)
  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryRestriction[]>([])
  const [expanded, setExpanded] = useState({
    sorting: false,
    ratings: false,
    verification: false,
    categories: false,
    restrictions: false,
    timeframe: false,
    safety: false
  })

  useEffect(() => {
    loadDietaryRestrictions()
  }, [])

  const loadDietaryRestrictions = async () => {
    try {
      const { data } = await supabase
        .from('dietary_restrictions')
        .select('*')
        .order('name')

      if (data) {
        setDietaryRestrictions(data)
      }
    } catch (error) {
      console.error('Failed to load dietary restrictions:', error)
    }
  }

  const handleApply = () => {
    onApply(localFilters)
  }

  const handleReset = () => {
    const resetFilters: ReviewFilterOptions = {
      sort_by: 'date',
      sort_order: 'desc'
    }
    setLocalFilters(resetFilters)
  }

  const updateFilters = (updates: Partial<ReviewFilterOptions>) => {
    setLocalFilters(prev => ({ ...prev, ...updates }))
  }

  const toggleExpanded = (section: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleArrayFilter = <T,>(
    filterKey: keyof ReviewFilterOptions,
    value: T,
    currentArray: T[] | undefined
  ) => {
    const array = currentArray || []
    const newArray = array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value]
    
    updateFilters({ [filterKey]: newArray.length > 0 ? newArray : undefined })
  }

  const renderSection = (
    title: string,
    sectionKey: keyof typeof expanded,
    content: React.ReactNode,
    badge?: string
  ) => (
    <View className="bg-gray-50 rounded-lg p-4 mb-3">
      <Pressable
        onPress={() => toggleExpanded(sectionKey)}
        className="flex-row justify-between items-center"
      >
        <View className="flex-row items-center">
          <Text className="text-lg font-medium text-gray-900">{title}</Text>
          {badge && (
            <View className="ml-2 bg-blue-100 px-2 py-1 rounded">
              <Text className="text-xs font-medium text-blue-800">{badge}</Text>
            </View>
          )}
        </View>
        <Text className={`text-lg ${expanded[sectionKey] ? 'rotate-180' : ''}`}>
          ▼
        </Text>
      </Pressable>
      
      {expanded[sectionKey] && (
        <View className="mt-4">
          {content}
        </View>
      )}
    </View>
  )

  return (
    <View className="bg-white rounded-lg shadow-lg border border-gray-200 mb-4">
      <View className="p-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-bold text-gray-900">Filter Reviews</Text>
          <Pressable onPress={onClose}>
            <Text className="text-lg text-gray-500">✕</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="max-h-96 p-4">
        {/* Sorting */}
        {renderSection(
          'Sort & Order',
          'sorting',
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Sort by:</Text>
            <View className="border border-gray-300 rounded-lg">
              <Picker
                selectedValue={localFilters.sort_by || 'date'}
                onValueChange={(value) => updateFilters({ sort_by: value as any })}
                style={{ height: 50 }}
              >
                {SORT_OPTIONS.map(option => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
            
            <View className="flex-row items-center mt-3">
              <Text className="text-sm text-gray-700 mr-3">Order:</Text>
              <Pressable
                onPress={() => updateFilters({ sort_order: 'desc' })}
                className={`px-3 py-2 rounded-lg mr-2 ${
                  localFilters.sort_order === 'desc'
                    ? 'bg-blue-100 border border-blue-300'
                    : 'bg-gray-100 border border-gray-300'
                }`}
              >
                <Text className={`text-sm ${
                  localFilters.sort_order === 'desc' ? 'text-blue-800' : 'text-gray-700'
                }`}>
                  Highest First
                </Text>
              </Pressable>
              <Pressable
                onPress={() => updateFilters({ sort_order: 'asc' })}
                className={`px-3 py-2 rounded-lg ${
                  localFilters.sort_order === 'asc'
                    ? 'bg-blue-100 border border-blue-300'
                    : 'bg-gray-100 border border-gray-300'
                }`}
              >
                <Text className={`text-sm ${
                  localFilters.sort_order === 'asc' ? 'text-blue-800' : 'text-gray-700'
                }`}>
                  Lowest First
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Rating Filters */}
        {renderSection(
          'Rating Range',
          'ratings',
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Minimum Rating: {localFilters.min_rating || 1} stars
            </Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={localFilters.min_rating || 1}
              onValueChange={(value) => updateFilters({ min_rating: value })}
              minimumTrackTintColor="#3B82F6"
              maximumTrackTintColor="#D1D5DB"
              thumbTintColor="#3B82F6"
            />
            
            <Text className="text-sm font-medium text-gray-700 mb-2 mt-4">
              Maximum Rating: {localFilters.max_rating || 5} stars
            </Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={localFilters.max_rating || 5}
              onValueChange={(value) => updateFilters({ max_rating: value })}
              minimumTrackTintColor="#3B82F6"
              maximumTrackTintColor="#D1D5DB"
              thumbTintColor="#3B82F6"
            />
          </View>,
          (localFilters.min_rating && localFilters.min_rating > 1) || 
          (localFilters.max_rating && localFilters.max_rating < 5) 
            ? 'Active' : undefined
        )}

        {/* Verification Levels */}
        {renderSection(
          'Verification Level',
          'verification',
          <View className="space-y-2">
            {VERIFICATION_LEVELS.map(level => (
              <View key={level.value} className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-700">{level.label}</Text>
                <Switch
                  value={localFilters.verification_level?.includes(level.value) || false}
                  onValueChange={() => toggleArrayFilter(
                    'verification_level',
                    level.value,
                    localFilters.verification_level
                  )}
                  trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>,
          localFilters.verification_level?.length ? `${localFilters.verification_level.length} selected` : undefined
        )}

        {/* Review Categories */}
        {renderSection(
          'Review Categories',
          'categories',
          <View className="space-y-2">
            {REVIEW_CATEGORIES.map(category => (
              <View key={category.value} className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-700 flex-1">{category.label}</Text>
                <Switch
                  value={localFilters.categories?.includes(category.value) || false}
                  onValueChange={() => toggleArrayFilter(
                    'categories',
                    category.value,
                    localFilters.categories
                  )}
                  trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>,
          localFilters.categories?.length ? `${localFilters.categories.length} selected` : undefined
        )}

        {/* Dietary Restrictions */}
        {renderSection(
          'Dietary Restrictions',
          'restrictions',
          <View className="space-y-2">
            {dietaryRestrictions.map(restriction => (
              <View key={restriction.id} className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-700 flex-1">{restriction.name}</Text>
                <Switch
                  value={localFilters.restriction_ids?.includes(restriction.id) || false}
                  onValueChange={() => toggleArrayFilter(
                    'restriction_ids',
                    restriction.id,
                    localFilters.restriction_ids
                  )}
                  trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>,
          localFilters.restriction_ids?.length ? `${localFilters.restriction_ids.length} selected` : undefined
        )}

        {/* Safety Filters */}
        {renderSection(
          'Safety & Content',
          'safety',
          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-700">Only reviews with photos</Text>
              <Switch
                value={localFilters.has_photos || false}
                onValueChange={(value) => updateFilters({ has_photos: value })}
                trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-700">Only safety assessments</Text>
              <Switch
                value={localFilters.has_safety_assessment || false}
                onValueChange={(value) => updateFilters({ has_safety_assessment: value })}
                trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-700">Only expert reviews</Text>
              <Switch
                value={localFilters.is_expert_review || false}
                onValueChange={(value) => updateFilters({ is_expert_review: value })}
                trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-700">Only incident reports</Text>
              <Switch
                value={localFilters.incident_reports_only || false}
                onValueChange={(value) => updateFilters({ incident_reports_only: value })}
                trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                thumbColor="#FFFFFF"
              />
            </View>

            {localFilters.min_credibility_score !== undefined && (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Minimum Credibility: {localFilters.min_credibility_score}%
                </Text>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={0}
                  maximumValue={100}
                  step={10}
                  value={localFilters.min_credibility_score}
                  onValueChange={(value) => updateFilters({ min_credibility_score: value })}
                  minimumTrackTintColor="#3B82F6"
                  maximumTrackTintColor="#D1D5DB"
                  thumbTintColor="#3B82F6"
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View className="p-4 border-t border-gray-200 flex-row space-x-3">
        <Pressable
          onPress={handleReset}
          className="flex-1 py-3 rounded-lg border border-gray-300 bg-gray-50"
        >
          <Text className="text-center text-gray-700 font-medium">Reset</Text>
        </Pressable>
        
        <Pressable
          onPress={handleApply}
          className="flex-1 py-3 rounded-lg bg-blue-600"
        >
          <Text className="text-center text-white font-medium">Apply Filters</Text>
        </Pressable>
      </View>
    </View>
  )
}