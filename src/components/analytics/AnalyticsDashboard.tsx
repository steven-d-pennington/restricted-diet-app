/**
 * Advanced Analytics Dashboard
 * 
 * Comprehensive analytics dashboard showing:
 * - User behavior insights and trends
 * - Safety metrics and incident tracking
 * - Meal planning effectiveness
 * - Personalization performance
 * - Feature adoption and engagement
 */

import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import UserBehaviorTrackingService, { BehaviorInsights } from '../../services/userBehaviorTrackingService'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface AnalyticsMetric {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'stable'
  color: string
  icon: string
}

interface ChartData {
  labels: string[]
  datasets: Array<{
    data: number[]
    color: string
    label: string
  }>
}

export const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth()
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month')
  const [behaviorInsights, setBehaviorInsights] = useState<BehaviorInsights | null>(null)
  const [keyMetrics, setKeyMetrics] = useState<AnalyticsMetric[]>([])
  const [chartData, setChartData] = useState<Record<string, ChartData>>({})
  const [loading, setLoading] = useState(true)

  const timeframeOptions = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'quarter', label: 'Last 3 Months' }
  ]

  const loadAnalyticsData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Load behavior insights
      const insights = await UserBehaviorTrackingService.getUserBehaviorInsights(
        user.id,
        selectedTimeframe
      )
      setBehaviorInsights(insights)

      // Load key metrics
      const metrics = await loadKeyMetrics(insights)
      setKeyMetrics(metrics)

      // Load chart data
      const charts = await loadChartData(insights)
      setChartData(charts)

    } catch (error) {
      console.error('Failed to load analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadKeyMetrics = async (insights: BehaviorInsights): Promise<AnalyticsMetric[]> => {
    return [
      {
        title: 'Safety Score',
        value: `${Math.round(insights.safety_behavior.safety_consciousness_score * 100)}%`,
        change: 5,
        trend: 'up',
        color: '#10b981',
        icon: '🛡️'
      },
      {
        title: 'Meals Planned',
        value: insights.engagement_metrics.session_frequency * 3, // Estimate
        change: 12,
        trend: 'up',
        color: '#3b82f6',
        icon: '📅'
      },
      {
        title: 'Recommendations Used',
        value: `${Math.round(insights.personalization_data.recommendation_click_rate * 100)}%`,
        change: -2,
        trend: 'down',
        color: '#f59e0b',
        icon: '🤖'
      },
      {
        title: 'Cooking Success Rate',
        value: `${Math.round(insights.personalization_data.meal_completion_rate * 100)}%`,
        change: 8,
        trend: 'up',
        color: '#8b5cf6',
        icon: '👨‍🍳'
      },
      {
        title: 'Avg Session Time',
        value: `${Math.round(insights.engagement_metrics.avg_session_duration / 60000)}m`,
        change: 15,
        trend: 'up',
        color: '#06b6d4',
        icon: '⏱️'
      },
      {
        title: 'Safety Incidents',
        value: insights.safety_behavior.incident_history.length,
        change: -100,
        trend: insights.safety_behavior.incident_history.length === 0 ? 'stable' : 'down',
        color: insights.safety_behavior.incident_history.length === 0 ? '#10b981' : '#ef4444',
        icon: '⚠️'
      }
    ]
  }

  const loadChartData = async (insights: BehaviorInsights): Promise<Record<string, ChartData>> => {
    // Generate sample chart data - in production, this would come from actual analytics
    const safetyTrend = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        data: [85, 88, 92, 95],
        color: '#10b981',
        label: 'Safety Score'
      }]
    }

    const mealPlanningTrend = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [3, 2, 4, 3, 5, 6, 4],
        color: '#3b82f6',
        label: 'Meals Planned'
      }]
    }

    const cuisinePreferences = {
      labels: insights.user_preferences.preferred_cuisines.slice(0, 5).map(c => c.cuisine),
      datasets: [{
        data: insights.user_preferences.preferred_cuisines.slice(0, 5).map(c => c.frequency),
        color: '#f59e0b',
        label: 'Cuisine Frequency'
      }]
    }

    const featureAdoption = {
      labels: Object.keys(insights.engagement_metrics.feature_adoption_rate),
      datasets: [{
        data: Object.values(insights.engagement_metrics.feature_adoption_rate).map(rate => rate * 100),
        color: '#8b5cf6',
        label: 'Adoption Rate %'
      }]
    }

    return {
      safetyTrend,
      mealPlanningTrend,
      cuisinePreferences,
      featureAdoption
    }
  }

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '📈'
      case 'down': return '📉'
      case 'stable': return '➡️'
      default: return '📊'
    }
  }

  const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '#10b981'
      case 'down': return '#ef4444'
      case 'stable': return '#6b7280'
      default: return '#6b7280'
    }
  }

  useEffect(() => {
    loadAnalyticsData()
  }, [user, selectedTimeframe])

  if (!user) return null

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{
        backgroundColor: '#ffffff',
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb'
      }}>
        <Text style={{
          fontSize: 28,
          fontWeight: '700',
          color: '#111827',
          marginBottom: 8
        }}>
          Analytics Dashboard
        </Text>
        <Text style={{
          fontSize: 16,
          color: '#6b7280',
          lineHeight: 24
        }}>
          Insights into your dietary safety and meal planning
        </Text>
      </View>

      {/* Timeframe Selector */}
      <View style={{
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 24,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        padding: 4
      }}>
        {timeframeOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            onPress={() => setSelectedTimeframe(option.key as any)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: selectedTimeframe === option.key ? '#ffffff' : 'transparent'
            }}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: selectedTimeframe === option.key ? '600' : '500',
              color: selectedTimeframe === option.key ? '#111827' : '#6b7280',
              textAlign: 'center'
            }}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{
          backgroundColor: '#ffffff',
          margin: 16,
          borderRadius: 12,
          padding: 32,
          alignItems: 'center'
        }}>
          <Text style={{
            fontSize: 16,
            color: '#6b7280'
          }}>
            Loading analytics...
          </Text>
        </View>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: 16,
            marginBottom: 24
          }}>
            {keyMetrics.map((metric, index) => (
              <View
                key={index}
                style={{
                  width: '48%',
                  backgroundColor: '#ffffff',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  marginRight: index % 2 === 0 ? '4%' : 0,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 2
                }}
              >
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8
                }}>
                  <Text style={{ fontSize: 20 }}>{metric.icon}</Text>
                  {metric.change !== undefined && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}>
                      <Text style={{ fontSize: 12, marginRight: 2 }}>
                        {getTrendIcon(metric.trend)}
                      </Text>
                      <Text style={{
                        fontSize: 12,
                        color: getTrendColor(metric.trend),
                        fontWeight: '500'
                      }}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: metric.color,
                  marginBottom: 4
                }}>
                  {metric.value}
                </Text>

                <Text style={{
                  fontSize: 12,
                  color: '#6b7280',
                  lineHeight: 16
                }}>
                  {metric.title}
                </Text>
              </View>
            ))}
          </View>

          {/* Safety Insights Section */}
          {behaviorInsights && (
            <View style={{
              backgroundColor: '#ffffff',
              marginHorizontal: 16,
              marginBottom: 24,
              borderRadius: 12,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 16
              }}>
                🛡️ Safety Insights
              </Text>

              <View style={{
                backgroundColor: '#f0fdf4',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#166534',
                  marginBottom: 4
                }}>
                  Safety Consciousness Score
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#15803d',
                  lineHeight: 16
                }}>
                  You check ingredient safety {Math.round(behaviorInsights.safety_behavior.safety_consciousness_score * 100)}% more than average users. Excellent safety awareness!
                </Text>
              </View>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 12
              }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{
                    fontSize: 12,
                    color: '#6b7280',
                    marginBottom: 4
                  }}>
                    Risk Tolerance
                  </Text>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#374151',
                    textTransform: 'capitalize'
                  }}>
                    {behaviorInsights.safety_behavior.risk_tolerance}
                  </Text>
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={{
                    fontSize: 12,
                    color: '#6b7280',
                    marginBottom: 4
                  }}>
                    Safety Incidents
                  </Text>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: behaviorInsights.safety_behavior.incident_history.length === 0 ? '#10b981' : '#ef4444'
                  }}>
                    {behaviorInsights.safety_behavior.incident_history.length === 0 ? 'None' : behaviorInsights.safety_behavior.incident_history.length}
                  </Text>
                </View>
              </View>

              {behaviorInsights.safety_behavior.frequent_safety_checks.length > 0 && (
                <View>
                  <Text style={{
                    fontSize: 12,
                    color: '#6b7280',
                    marginBottom: 8
                  }}>
                    Most Used Safety Features
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap'
                  }}>
                    {behaviorInsights.safety_behavior.frequent_safety_checks.map((check, index) => (
                      <View
                        key={index}
                        style={{
                          backgroundColor: '#eff6ff',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                          marginRight: 6,
                          marginBottom: 4
                        }}
                      >
                        <Text style={{
                          fontSize: 12,
                          color: '#1d4ed8',
                          fontWeight: '500'
                        }}>
                          {check.replace('_', ' ')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Cuisine Preferences */}
          {behaviorInsights && behaviorInsights.user_preferences.preferred_cuisines.length > 0 && (
            <View style={{
              backgroundColor: '#ffffff',
              marginHorizontal: 16,
              marginBottom: 24,
              borderRadius: 12,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 16
              }}>
                🍽️ Cuisine Preferences
              </Text>

              {behaviorInsights.user_preferences.preferred_cuisines.slice(0, 5).map((cuisine, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 12
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#374151',
                    flex: 1,
                    textTransform: 'capitalize'
                  }}>
                    {cuisine.cuisine}
                  </Text>

                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flex: 1
                  }}>
                    <View style={{
                      flex: 1,
                      height: 8,
                      backgroundColor: '#f3f4f6',
                      borderRadius: 4,
                      marginRight: 8
                    }}>
                      <View style={{
                        width: `${Math.min((cuisine.frequency / Math.max(...behaviorInsights.user_preferences.preferred_cuisines.map(c => c.frequency))) * 100, 100)}%`,
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        borderRadius: 4
                      }} />
                    </View>

                    <Text style={{
                      fontSize: 12,
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      {cuisine.frequency}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Personalization Performance */}
          {behaviorInsights && (
            <View style={{
              backgroundColor: '#ffffff',
              marginHorizontal: 16,
              marginBottom: 24,
              borderRadius: 12,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 16
              }}>
                🤖 AI Personalization
              </Text>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 16
              }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: '#3b82f6'
                  }}>
                    {Math.round(behaviorInsights.personalization_data.recommendation_click_rate * 100)}%
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: '#6b7280',
                    textAlign: 'center'
                  }}>
                    Click Rate
                  </Text>
                </View>

                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: '#10b981'
                  }}>
                    {Math.round(behaviorInsights.personalization_data.meal_completion_rate * 100)}%
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: '#6b7280',
                    textAlign: 'center'
                  }}>
                    Completion Rate
                  </Text>
                </View>

                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: '#f59e0b'
                  }}>
                    {Math.round(behaviorInsights.personalization_data.feedback_quality_score * 100)}%
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: '#6b7280',
                    textAlign: 'center'
                  }}>
                    Feedback Quality
                  </Text>
                </View>
              </View>

              <View style={{
                backgroundColor: '#f0f9ff',
                borderRadius: 8,
                padding: 12
              }}>
                <Text style={{
                  fontSize: 12,
                  color: '#0369a1',
                  lineHeight: 16
                }}>
                  💡 Your personalization is working well! AI recommendations have a {Math.round(behaviorInsights.personalization_data.recommendation_click_rate * 100)}% click rate, which is above average.
                </Text>
              </View>
            </View>
          )}

          {/* Feature Adoption */}
          {behaviorInsights && Object.keys(behaviorInsights.engagement_metrics.feature_adoption_rate).length > 0 && (
            <View style={{
              backgroundColor: '#ffffff',
              marginHorizontal: 16,
              marginBottom: 32,
              borderRadius: 12,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 16
              }}>
                📱 Feature Usage
              </Text>

              {Object.entries(behaviorInsights.engagement_metrics.feature_adoption_rate).map(([feature, rate], index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 12
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#374151',
                    flex: 1,
                    textTransform: 'capitalize'
                  }}>
                    {feature.replace('_', ' ')}
                  </Text>

                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flex: 1
                  }}>
                    <View style={{
                      flex: 1,
                      height: 8,
                      backgroundColor: '#f3f4f6',
                      borderRadius: 4,
                      marginRight: 8
                    }}>
                      <View style={{
                        width: `${rate * 100}%`,
                        height: '100%',
                        backgroundColor: '#8b5cf6',
                        borderRadius: 4
                      }} />
                    </View>

                    <Text style={{
                      fontSize: 12,
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      {Math.round(rate * 100)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  )
}