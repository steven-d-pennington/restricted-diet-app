/**
 * Meal Plan Card Component
 * 
 * Displays a meal plan with key information, safety indicators,
 * and quick action buttons
 */

import React from 'react'
import { View, Text, TouchableOpacity, Image } from 'react-native'
import { SafetyBadge } from '../SafetyBadge'
import { SafetyLevel } from '../../types/database.types'

interface MealPlanCardProps {
  mealPlan: {
    id: string
    name: string
    description: string
    duration_days: number
    difficulty_level: 'easy' | 'medium' | 'hard'
    calorie_target?: number
    avg_rating: number
    safety_score?: number
    safety_level?: SafetyLevel
    image_url?: string
    creator_name?: string
    is_ai_generated?: boolean
    target_restrictions?: string[]
    prep_time_total?: number
    cost_estimate?: number
  }
  onPress: () => void
  onSave?: () => void
  onStart?: () => void
  showQuickActions?: boolean
  compact?: boolean
}

export const MealPlanCard: React.FC<MealPlanCardProps> = ({
  mealPlan,
  onPress,
  onSave,
  onStart,
  showQuickActions = true,
  compact = false
}) => {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return '#22c55e'
      case 'medium': return '#f59e0b'
      case 'hard': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getDifficultyText = (level: string) => {
    switch (level) {
      case 'easy': return 'Easy'
      case 'medium': return 'Medium'
      case 'hard': return 'Advanced'
      default: return 'Unknown'
    }
  }

  const formatDuration = (days: number) => {
    if (days === 1) return '1 day'
    if (days === 7) return '1 week'
    if (days === 14) return '2 weeks'
    if (days === 30) return '1 month'
    return `${days} days`
  }

  const formatCost = (cost?: number) => {
    if (!cost) return null
    return `$${cost.toFixed(0)}`
  }

  const formatTime = (minutes?: number) => {
    if (!minutes) return null
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
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
      {mealPlan.image_url && (
        <Image
          source={{ uri: mealPlan.image_url }}
          style={{
            width: '100%',
            height: compact ? 120 : 160,
            backgroundColor: '#f3f4f6'
          }}
          resizeMode="cover"
        />
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
              {mealPlan.name}
            </Text>
            {mealPlan.creator_name && (
              <Text style={{
                fontSize: 14,
                color: '#6b7280',
                marginTop: 2
              }}>
                by {mealPlan.creator_name}
              </Text>
            )}
          </View>

          {/* Rating */}
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
              {mealPlan.avg_rating.toFixed(1)}
            </Text>
          </View>
        </View>

        {/* Description */}
        {!compact && mealPlan.description && (
          <Text style={{
            fontSize: 14,
            color: '#6b7280',
            lineHeight: 20,
            marginBottom: 12
          }}>
            {mealPlan.description}
          </Text>
        )}

        {/* Meta Information */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 12
        }}>
          {/* Duration */}
          <View style={{
            backgroundColor: '#eff6ff',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            marginRight: 8,
            marginBottom: 4
          }}>
            <Text style={{ fontSize: 12, color: '#1d4ed8', fontWeight: '500' }}>
              {formatDuration(mealPlan.duration_days)}
            </Text>
          </View>

          {/* Difficulty */}
          <View style={{
            backgroundColor: '#f3f4f6',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            marginRight: 8,
            marginBottom: 4
          }}>
            <Text style={{
              fontSize: 12,
              color: getDifficultyColor(mealPlan.difficulty_level),
              fontWeight: '500'
            }}>
              {getDifficultyText(mealPlan.difficulty_level)}
            </Text>
          </View>

          {/* AI Generated Badge */}
          {mealPlan.is_ai_generated && (
            <View style={{
              backgroundColor: '#f0f9ff',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              marginRight: 8,
              marginBottom: 4
            }}>
              <Text style={{ fontSize: 12, color: '#0284c7', fontWeight: '500' }}>
                AI Generated
              </Text>
            </View>
          )}

          {/* Safety Badge */}
          {mealPlan.safety_level && (
            <SafetyBadge
              level={mealPlan.safety_level}
              size="small"
            />
          )}
        </View>

        {/* Details Row */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: showQuickActions ? 16 : 0
        }}>
          {/* Calories */}
          {mealPlan.calorie_target && (
            <View style={{ marginRight: 16 }}>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Target</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                {mealPlan.calorie_target} cal/day
              </Text>
            </View>
          )}

          {/* Prep Time */}
          {mealPlan.prep_time_total && (
            <View style={{ marginRight: 16 }}>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Total Prep</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                {formatTime(mealPlan.prep_time_total)}
              </Text>
            </View>
          )}

          {/* Cost */}
          {mealPlan.cost_estimate && (
            <View>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Est. Cost</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                {formatCost(mealPlan.cost_estimate)}
              </Text>
            </View>
          )}
        </View>

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
                Save Plan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onStart}
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
                Start Plan
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}