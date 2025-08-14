/**
 * Meal Planning Dashboard Component
 * 
 * Main dashboard for meal planning features including:
 * - AI recommendations
 * - Active meal plans
 * - Quick meal planning tools
 * - Analytics and insights
 */

import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { MealRecommendations } from './MealRecommendations'
import { MealPlanCard } from './MealPlanCard'
import { WeeklyMealPlanView } from './WeeklyMealPlanView'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface DashboardStats {
  active_meal_plans: number
  meals_planned_this_week: number
  avg_safety_score: number
  calories_target_met: boolean
  favorite_cuisine: string
  cooking_streak: number
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  color: string
  action: () => void
}

export const MealPlanningDashboard: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activeMealPlans, setActiveMealPlans] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [selectedView, setSelectedView] = useState<'recommendations' | 'plans' | 'week'>('recommendations')

  const quickActions: QuickAction[] = [
    {
      id: 'ai_meal_plan',
      title: 'AI Meal Plan',
      description: 'Generate a personalized meal plan',
      icon: '🤖',
      color: '#3b82f6',
      action: () => handleCreateAIMealPlan()
    },
    {
      id: 'quick_meal',
      title: 'Quick Meal',
      description: 'Find a meal for right now',
      icon: '⚡',
      color: '#f59e0b',
      action: () => handleQuickMeal()
    },
    {
      id: 'scan_ingredient',
      title: 'Scan Ingredient',
      description: 'Check ingredient safety',
      icon: '📱',
      color: '#10b981',
      action: () => handleScanIngredient()
    },
    {
      id: 'meal_prep',
      title: 'Meal Prep',
      description: 'Plan meals for the week',
      icon: '📅',
      color: '#8b5cf6',
      action: () => handleMealPrep()
    }
  ]

  const loadDashboardData = async (isRefresh = false) => {
    if (!user) return

    try {
      if (isRefresh) setRefreshing(true)

      // Load user stats
      const [statsResult, plansResult] = await Promise.all([
        loadUserStats(),
        loadActiveMealPlans()
      ])

      setStats(statsResult)
      setActiveMealPlans(plansResult)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const loadUserStats = async (): Promise<DashboardStats> => {
    // Get user meal planning statistics
    const { data: userPlans } = await supabase
      .from('user_meal_plans')
      .select('*')
      .eq('user_id', user!.id)
      .eq('status', 'active')

    const { data: recentExecutions } = await supabase
      .from('user_meal_executions')
      .select('*')
      .eq('user_id', user!.id)
      .gte('planned_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    return {
      active_meal_plans: userPlans?.length || 0,
      meals_planned_this_week: recentExecutions?.length || 0,
      avg_safety_score: 0.85, // Calculate from actual data
      calories_target_met: true, // Calculate from actual data
      favorite_cuisine: 'Mediterranean', // Calculate from actual data
      cooking_streak: 5 // Calculate from actual data
    }
  }

  const loadActiveMealPlans = async () => {
    const { data, error } = await supabase
      .from('user_meal_plans')
      .select(`
        *,
        meal_plans (
          id,
          name,
          description,
          duration_days,
          difficulty_level,
          calorie_target,
          avg_rating,
          image_url
        )
      `)
      .eq('user_id', user!.id)
      .in('status', ['active', 'planned'])
      .order('created_at', { ascending: false })
      .limit(3)

    if (error) throw error
    return data || []
  }

  const handleCreateAIMealPlan = () => {
    // Navigate to AI meal plan creation
    console.log('Create AI meal plan')
  }

  const handleQuickMeal = () => {
    // Navigate to quick meal finder
    console.log('Quick meal finder')
  }

  const handleScanIngredient = () => {
    // Navigate to ingredient scanner
    console.log('Scan ingredient')
  }

  const handleMealPrep = () => {
    // Navigate to meal prep planner
    console.log('Meal prep planner')
  }

  const handleMealPlanPress = (planId: string) => {
    // Navigate to meal plan details
    console.log('Meal plan pressed:', planId)
  }

  const handleMealPlanStart = (planId: string) => {
    // Start following the meal plan
    console.log('Start meal plan:', planId)
  }

  useEffect(() => {
    loadDashboardData()
  }, [user])

  if (!user) return null

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadDashboardData(true)}
          tintColor="#dc2626"
        />
      }
    >
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
          Meal Planning
        </Text>
        <Text style={{
          fontSize: 16,
          color: '#6b7280',
          lineHeight: 24
        }}>
          AI-powered meal planning for your dietary needs
        </Text>
      </View>

      {/* Stats Overview */}
      {stats && (
        <View style={{
          backgroundColor: '#ffffff',
          marginHorizontal: 16,
          marginTop: 16,
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#111827',
            marginBottom: 16
          }}>
            Your Progress
          </Text>

          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#dc2626'
              }}>
                {stats.active_meal_plans}
              </Text>
              <Text style={{
                fontSize: 12,
                color: '#6b7280',
                textAlign: 'center'
              }}>
                Active Plans
              </Text>
            </View>

            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#10b981'
              }}>
                {stats.meals_planned_this_week}
              </Text>
              <Text style={{
                fontSize: 12,
                color: '#6b7280',
                textAlign: 'center'
              }}>
                This Week
              </Text>
            </View>

            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#f59e0b'
              }}>
                {Math.round(stats.avg_safety_score * 100)}%
              </Text>
              <Text style={{
                fontSize: 12,
                color: '#6b7280',
                textAlign: 'center'
              }}>
                Safety Score
              </Text>
            </View>

            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#8b5cf6'
              }}>
                {stats.cooking_streak}
              </Text>
              <Text style={{
                fontSize: 12,
                color: '#6b7280',
                textAlign: 'center'
              }}>
                Day Streak
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={{
        marginHorizontal: 16,
        marginTop: 16
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: '#111827',
          marginBottom: 12
        }}>
          Quick Actions
        </Text>

        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              onPress={action.action}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 12,
                padding: 16,
                width: '48%',
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2
              }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: action.color + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12
              }}>
                <Text style={{ fontSize: 20 }}>{action.icon}</Text>
              </View>

              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 4
              }}>
                {action.title}
              </Text>

              <Text style={{
                fontSize: 12,
                color: '#6b7280',
                lineHeight: 16
              }}>
                {action.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* View Selector */}
      <View style={{
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 24,
        marginBottom: 16,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        padding: 4
      }}>
        {[
          { key: 'recommendations', label: 'Recommendations' },
          { key: 'plans', label: 'My Plans' },
          { key: 'week', label: 'This Week' }
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            onPress={() => setSelectedView(option.key as any)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: selectedView === option.key ? '#ffffff' : 'transparent'
            }}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: selectedView === option.key ? '600' : '500',
              color: selectedView === option.key ? '#111827' : '#6b7280',
              textAlign: 'center'
            }}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content Based on Selected View */}
      {selectedView === 'recommendations' && (
        <MealRecommendations
          title="AI Recommendations"
          subtitle="Personalized meal suggestions based on your preferences and safety requirements"
          maxRecommendations={10}
          showSafetyFirst={true}
          style={{ marginBottom: 32 }}
        />
      )}

      {selectedView === 'plans' && (
        <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
          {activeMealPlans.length === 0 ? (
            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: 32,
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 8,
                textAlign: 'center'
              }}>
                No Active Meal Plans
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#6b7280',
                textAlign: 'center',
                lineHeight: 20,
                marginBottom: 16
              }}>
                Create your first AI-powered meal plan to get started with organized, safe meal planning.
              </Text>
              <TouchableOpacity
                onPress={handleCreateAIMealPlan}
                style={{
                  backgroundColor: '#dc2626',
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 8
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#ffffff'
                }}>
                  Create Meal Plan
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            activeMealPlans.map((userPlan) => (
              <MealPlanCard
                key={userPlan.id}
                mealPlan={{
                  id: userPlan.meal_plans.id,
                  name: userPlan.meal_plans.name,
                  description: userPlan.meal_plans.description,
                  duration_days: userPlan.meal_plans.duration_days,
                  difficulty_level: userPlan.meal_plans.difficulty_level,
                  calorie_target: userPlan.meal_plans.calorie_target,
                  avg_rating: userPlan.meal_plans.avg_rating,
                  image_url: userPlan.meal_plans.image_url
                }}
                onPress={() => handleMealPlanPress(userPlan.meal_plans.id)}
                onStart={() => handleMealPlanStart(userPlan.meal_plans.id)}
              />
            ))
          )}
        </View>
      )}

      {selectedView === 'week' && (
        <WeeklyMealPlanView
          userId={user.id}
          style={{ marginHorizontal: 16, marginBottom: 32 }}
        />
      )}
    </ScrollView>
  )
}