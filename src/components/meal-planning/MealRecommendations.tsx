/**
 * Meal Recommendations Component
 * 
 * Displays AI-powered meal recommendations with personalization
 * and safety-first filtering
 */

import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { MealCard } from './MealCard'
import RecommendationService, { RecommendationContext, ScoredRecommendation } from '../../services/recommendationService'
import { useAuth } from '../../contexts/AuthContext'

interface MealRecommendationsProps {
  context?: Partial<RecommendationContext>
  title?: string
  subtitle?: string
  maxRecommendations?: number
  showSafetyFirst?: boolean
  onMealPress?: (mealId: string) => void
  onMealSave?: (mealId: string) => void
  onMealCook?: (mealId: string) => void
  refreshTrigger?: number
  style?: any
}

export const MealRecommendations: React.FC<MealRecommendationsProps> = ({
  context = {},
  title = "Recommended for You",
  subtitle,
  maxRecommendations = 5,
  showSafetyFirst = true,
  onMealPress,
  onMealSave,
  onMealCook,
  refreshTrigger,
  style
}) => {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<ScoredRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRecommendations = async (isRefresh = false) => {
    if (!user) return

    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const fullContext: RecommendationContext = {
        user_id: user.id,
        meal_type: getCurrentMealType(),
        time_of_day: new Date().toTimeString(),
        day_of_week: new Date().toLocaleDateString('en', { weekday: 'long' }),
        ...context
      }

      const recs = await RecommendationService.getPersonalizedRecommendations(
        fullContext,
        {
          count: maxRecommendations,
          include_reasons: true,
          diversify: true,
          safety_threshold: showSafetyFirst ? 0.8 : 0.5,
          exclude_recent: true,
          boost_favorites: true
        }
      )

      setRecommendations(recs)
      setError(null)
    } catch (err) {
      console.error('Failed to load recommendations:', err)
      setError('Unable to load recommendations. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getCurrentMealType = (): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
    const hour = new Date().getHours()
    if (hour < 10) return 'breakfast'
    if (hour < 15) return 'lunch'
    if (hour > 18) return 'dinner'
    return 'snack'
  }

  const handleMealPress = (recommendation: ScoredRecommendation) => {
    // Track interaction for ML learning
    RecommendationService.updateUserPreferences(user!.id, {
      type: 'view',
      meal_id: recommendation.meal_id,
      context: { user_id: user!.id, ...context }
    })

    onMealPress?.(recommendation.meal_id)
  }

  const handleMealSave = (recommendation: ScoredRecommendation) => {
    // Track save interaction
    RecommendationService.updateUserPreferences(user!.id, {
      type: 'save',
      meal_id: recommendation.meal_id,
      context: { user_id: user!.id, ...context }
    })

    onMealSave?.(recommendation.meal_id)
  }

  const handleMealCook = (recommendation: ScoredRecommendation) => {
    // Track cook interaction
    RecommendationService.updateUserPreferences(user!.id, {
      type: 'cook',
      meal_id: recommendation.meal_id,
      context: { user_id: user!.id, ...context }
    })

    onMealCook?.(recommendation.meal_id)
  }

  useEffect(() => {
    loadRecommendations()
  }, [user, refreshTrigger])

  if (!user) return null

  return (
    <View style={[{ paddingHorizontal: 16 }, style]}>
      {/* Header */}
      <View style={{ marginBottom: 16 }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '600',
            color: '#111827'
          }}>
            {title}
          </Text>

          <TouchableOpacity
            onPress={() => loadRecommendations(true)}
            style={{
              backgroundColor: '#f3f4f6',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6
            }}
          >
            <Text style={{
              fontSize: 14,
              color: '#374151',
              fontWeight: '500'
            }}>
              Refresh
            </Text>
          </TouchableOpacity>
        </View>

        {subtitle && (
          <Text style={{
            fontSize: 14,
            color: '#6b7280',
            lineHeight: 20
          }}>
            {subtitle}
          </Text>
        )}

        {/* AI Personalization Indicator */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 8
        }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#10b981',
            marginRight: 8
          }} />
          <Text style={{
            fontSize: 12,
            color: '#6b7280'
          }}>
            Personalized using AI • Safety-first filtering
          </Text>
        </View>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={{
          backgroundColor: '#f9fafb',
          borderRadius: 12,
          padding: 32,
          alignItems: 'center'
        }}>
          <Text style={{
            fontSize: 16,
            color: '#6b7280',
            textAlign: 'center'
          }}>
            Loading personalized recommendations...
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={{
          backgroundColor: '#fef2f2',
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: '#fecaca'
        }}>
          <Text style={{
            fontSize: 14,
            color: '#dc2626',
            textAlign: 'center',
            marginBottom: 8
          }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => loadRecommendations()}
            style={{
              backgroundColor: '#dc2626',
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 6,
              alignSelf: 'center'
            }}
          >
            <Text style={{
              fontSize: 14,
              color: '#ffffff',
              fontWeight: '500'
            }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recommendations List */}
      {!loading && !error && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadRecommendations(true)}
              tintColor="#dc2626"
            />
          }
        >
          {recommendations.length === 0 ? (
            <View style={{
              backgroundColor: '#f9fafb',
              borderRadius: 12,
              padding: 32,
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 16,
                color: '#6b7280',
                textAlign: 'center',
                marginBottom: 8
              }}>
                No recommendations available
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#9ca3af',
                textAlign: 'center'
              }}>
                Try adjusting your dietary preferences or check back later
              </Text>
            </View>
          ) : (
            recommendations.map((recommendation, index) => (
              <View key={recommendation.meal_id} style={{ marginBottom: 16 }}>
                {/* Recommendation Score Indicator */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 8,
                  paddingHorizontal: 4
                }}>
                  <View style={{
                    backgroundColor: getScoreColor(recommendation.overall_score),
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    marginRight: 8
                  }} />
                  <Text style={{
                    fontSize: 12,
                    color: '#6b7280',
                    flex: 1
                  }}>
                    {Math.round(recommendation.overall_score * 100)}% match
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: '#9ca3af'
                  }}>
                    {recommendation.model_used}
                  </Text>
                </View>

                <MealCard
                  meal={{
                    id: recommendation.meal_id,
                    name: recommendation.meal_data.name,
                    description: recommendation.meal_data.description,
                    meal_type: recommendation.meal_data.meal_type,
                    prep_time: recommendation.meal_data.prep_time || 0,
                    cook_time: recommendation.meal_data.cook_time,
                    total_time: recommendation.meal_data.total_time || recommendation.meal_data.prep_time || 0,
                    difficulty_level: recommendation.meal_data.difficulty_level || 'medium',
                    servings: recommendation.meal_data.servings,
                    calories_per_serving: recommendation.meal_data.calories_per_serving,
                    safety_level: recommendation.meal_data.safety_level,
                    safety_score: recommendation.safety_score,
                    dietary_flags: recommendation.meal_data.dietary_flags,
                    image_url: recommendation.meal_data.image_url,
                    avg_rating: recommendation.meal_data.avg_rating,
                    is_ai_generated: recommendation.meal_data.ai_generated,
                    creator_name: recommendation.meal_data.creator_name,
                    cost_per_serving: recommendation.meal_data.cost_per_serving
                  }}
                  onPress={() => handleMealPress(recommendation)}
                  onSave={() => handleMealSave(recommendation)}
                  onCook={() => handleMealCook(recommendation)}
                  showSafetyFirst={showSafetyFirst}
                />

                {/* Recommendation Reasons */}
                {recommendation.recommendation_reasons.length > 0 && (
                  <View style={{
                    backgroundColor: '#f0f9ff',
                    borderRadius: 8,
                    padding: 12,
                    marginTop: -8,
                    marginBottom: 8,
                    marginHorizontal: 4
                  }}>
                    <Text style={{
                      fontSize: 12,
                      color: '#0369a1',
                      fontWeight: '500',
                      marginBottom: 4
                    }}>
                      Why we recommend this:
                    </Text>
                    {recommendation.recommendation_reasons.slice(0, 2).map((reason, reasonIndex) => (
                      <Text
                        key={reasonIndex}
                        style={{
                          fontSize: 12,
                          color: '#0284c7',
                          lineHeight: 16
                        }}
                      >
                        • {reason}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  )
}

const getScoreColor = (score: number): string => {
  if (score >= 0.8) return '#10b981'
  if (score >= 0.6) return '#f59e0b'
  return '#ef4444'
}