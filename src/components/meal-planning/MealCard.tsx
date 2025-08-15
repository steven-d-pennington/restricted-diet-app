/**
 * Meal Card Component
 * 
 * Displays individual meals with safety indicators, nutritional info,
 * and preparation details
 */

import React from 'react'
import { View, Text, TouchableOpacity, Image } from 'react-native'
import { SafetyBadge } from '../SafetyBadge'
import { SafetyLevel } from '../../types/database.types'

interface MealCardProps {
  meal: {
    id: string
    name: string
    description: string
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    prep_time: number
    cook_time?: number
    total_time: number
    difficulty_level: 'easy' | 'medium' | 'hard'
    servings?: number
    calories_per_serving?: number
    safety_level?: SafetyLevel
    safety_score?: number
    dietary_flags?: string[]
    image_url?: string
    avg_rating?: number
    is_ai_generated?: boolean
    creator_name?: string
    cost_per_serving?: number
  }
  onPress: () => void
  onSave?: () => void
  onCook?: () => void
  showQuickActions?: boolean
  compact?: boolean
  showSafetyFirst?: boolean
}

export const MealCard: React.FC<MealCardProps> = ({
  meal,
  onPress,
  onSave,
  onCook,
  showQuickActions = true,
  compact = false,
  showSafetyFirst = false
}) => {
  const getMealTypeIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return '🌅'
      case 'lunch': return '☀️'
      case 'dinner': return '🌙'
      case 'snack': return '🍪'
      default: return '🍽️'
    }
  }

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case 'breakfast': return '#f59e0b'
      case 'lunch': return '#10b981'
      case 'dinner': return '#6366f1'
      case 'snack': return '#f97316'
      default: return '#6b7280'
    }
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return '#22c55e'
      case 'medium': return '#f59e0b'
      case 'hard': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const formatCost = (cost?: number) => {
    if (!cost) return null
    return `$${cost.toFixed(2)}`
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden'
      }}
    >
      {/* Header Image */}
      {meal.image_url && (
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: meal.image_url }}
            style={{
              width: '100%',
              height: compact ? 120 : 160,
              backgroundColor: '#f3f4f6'
            }}
            resizeMode="cover"
          />
          
          {/* Overlay badges */}
          <View style={{
            position: 'absolute',
            top: 12,
            left: 12,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            {/* Meal Type Badge */}
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              marginRight: 8,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: 12, marginRight: 4 }}>
                {getMealTypeIcon(meal.meal_type)}
              </Text>
              <Text style={{
                fontSize: 12,
                fontWeight: '500',
                color: getMealTypeColor(meal.meal_type),
                textTransform: 'capitalize'
              }}>
                {meal.meal_type}
              </Text>
            </View>

            {/* AI Badge */}
            {meal.is_ai_generated && (
              <View style={{
                backgroundColor: 'rgba(59, 130, 246, 0.95)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: '#ffffff'
                }}>
                  AI
                </Text>
              </View>
            )}
          </View>

          {/* Safety Badge in Top Right */}
          {showSafetyFirst && meal.safety_level && (
            <View style={{
              position: 'absolute',
              top: 12,
              right: 12
            }}>
              <SafetyBadge
                level={meal.safety_level}
                size="small"
              />
            </View>
          )}
        </View>
      )}

      {/* Content */}
      <View style={{ padding: 16 }}>
        {/* Title and Rating Row */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 8
        }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#111827',
              lineHeight: 24
            }}>
              {meal.name}
            </Text>
            {meal.creator_name && (
              <Text style={{
                fontSize: 14,
                color: '#6b7280',
                marginTop: 2
              }}>
                by {meal.creator_name}
              </Text>
            )}
          </View>

          {/* Rating */}
          {meal.avg_rating && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f9fafb',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6
            }}>
              <Text style={{ fontSize: 14, color: '#f59e0b', marginRight: 4 }}>★</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                {meal.avg_rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        {!compact && meal.description && (
          <Text style={{
            fontSize: 14,
            color: '#6b7280',
            lineHeight: 20,
            marginBottom: 12
          }}>
            {meal.description}
          </Text>
        )}

        {/* Dietary Flags */}
        {meal.dietary_flags && meal.dietary_flags.length > 0 && (
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginBottom: 12
          }}>
            {meal.dietary_flags.slice(0, compact ? 2 : 4).map((flag, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: '#dcfce7',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  marginRight: 6,
                  marginBottom: 4
                }}
              >
                <Text style={{
                  fontSize: 12,
                  color: '#166534',
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}>
                  {flag.replace('_', ' ')}
                </Text>
              </View>
            ))}
            {meal.dietary_flags.length > (compact ? 2 : 4) && (
              <View style={{
                backgroundColor: '#f3f4f6',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                marginBottom: 4
              }}>
                <Text style={{
                  fontSize: 12,
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  +{meal.dietary_flags.length - (compact ? 2 : 4)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Details Row */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: showQuickActions ? 16 : 0
        }}>
          {/* Time and Difficulty */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ marginRight: 16 }}>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Time</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                {formatTime(meal.total_time)}
              </Text>
            </View>

            <View style={{ marginRight: 16 }}>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Difficulty</Text>
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: getDifficultyColor(meal.difficulty_level),
                textTransform: 'capitalize'
              }}>
                {meal.difficulty_level}
              </Text>
            </View>

            {/* Servings */}
            {meal.servings && (
              <View style={{ marginRight: 16 }}>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Serves</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                  {meal.servings}
                </Text>
              </View>
            )}
          </View>

          {/* Calories and Cost */}
          <View>
            {meal.calories_per_serving && (
              <Text style={{
                fontSize: 12,
                color: '#6b7280',
                textAlign: 'right'
              }}>
                {meal.calories_per_serving} cal
              </Text>
            )}
            {meal.cost_per_serving && (
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: '#374151',
                textAlign: 'right'
              }}>
                {formatCost(meal.cost_per_serving)}
              </Text>
            )}
          </View>
        </View>

        {/* Safety Row */}
        {!showSafetyFirst && meal.safety_level && (
          <View style={{ marginBottom: showQuickActions ? 16 : 0 }}>
            <SafetyBadge
              level={meal.safety_level}
              size="medium"
            />
          </View>
        )}

        {/* Quick Actions */}
        {showQuickActions && (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}>
            <TouchableOpacity
              onPress={onSave}
              style={{
                flex: 1,
                backgroundColor: '#f9fafb',
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 8,
                marginRight: 8,
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: '#374151'
              }}>
                Save Recipe
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onCook}
              style={{
                flex: 1,
                backgroundColor: '#dc2626',
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 8,
                marginLeft: 8,
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#ffffff'
              }}>
                Cook Now
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}