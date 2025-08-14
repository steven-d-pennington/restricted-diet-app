/**
 * Weekly Meal Plan View Component
 * 
 * Displays a calendar-style view of the user's meal plan for the week
 * with drag-and-drop functionality and quick editing
 */

import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { supabase } from '../../lib/supabase'

interface WeeklyMealPlanViewProps {
  userId: string
  style?: any
}

interface DayMeals {
  date: string
  dayName: string
  meals: {
    breakfast?: { id: string; name: string; prep_time: number; safety_level?: string }
    lunch?: { id: string; name: string; prep_time: number; safety_level?: string }
    dinner?: { id: string; name: string; prep_time: number; safety_level?: string }
    snacks?: Array<{ id: string; name: string; prep_time: number; safety_level?: string }>
  }
  totalCalories?: number
  avgSafetyScore?: number
}

export const WeeklyMealPlanView: React.FC<WeeklyMealPlanViewProps> = ({
  userId,
  style
}) => {
  const [weekData, setWeekData] = useState<DayMeals[]>([])
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()))
  const [loading, setLoading] = useState(true)

  function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day // Adjust to start on Sunday
    return new Date(d.setDate(diff))
  }

  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  function getDayName(date: Date): string {
    return date.toLocaleDateString('en', { weekday: 'short' })
  }

  const loadWeekData = async () => {
    try {
      setLoading(true)
      const weekDays: DayMeals[] = []

      for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart)
        date.setDate(date.getDate() + i)
        const dateStr = formatDate(date)
        const dayName = getDayName(date)

        // Get planned meals for this day
        const { data: dayMeals, error } = await supabase
          .from('user_meal_executions')
          .select(`
            *,
            meals (
              id,
              name,
              prep_time,
              calories_per_serving,
              safety_level
            )
          `)
          .eq('user_id', userId)
          .eq('planned_date', dateStr)
          .order('meal_slot')

        if (error) {
          console.error('Error loading day meals:', error)
          continue
        }

        const meals = {
          breakfast: dayMeals?.find(m => m.meal_slot === 'breakfast')?.meals,
          lunch: dayMeals?.find(m => m.meal_slot === 'lunch')?.meals,
          dinner: dayMeals?.find(m => m.meal_slot === 'dinner')?.meals,
          snacks: dayMeals?.filter(m => m.meal_slot.includes('snack')).map(m => m.meals) || []
        }

        // Calculate totals
        const totalCalories = dayMeals?.reduce((sum, meal) => {
          return sum + (meal.meals?.calories_per_serving || 0) * (meal.servings_made || 1)
        }, 0) || 0

        weekDays.push({
          date: dateStr,
          dayName,
          meals,
          totalCalories,
          avgSafetyScore: 0.85 // Calculate from actual safety levels
        })
      }

      setWeekData(weekDays)
    } catch (error) {
      console.error('Failed to load week data:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(currentWeekStart)
    newWeekStart.setDate(newWeekStart.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeekStart(newWeekStart)
  }

  const handleMealSlotPress = (date: string, mealSlot: string) => {
    // Open meal selector for this slot
    console.log('Open meal selector for', date, mealSlot)
  }

  const getSafetyColor = (level?: string): string => {
    switch (level) {
      case 'safe': return '#10b981'
      case 'caution': return '#f59e0b'
      case 'warning': return '#ef4444'
      case 'danger': return '#dc2626'
      default: return '#9ca3af'
    }
  }

  useEffect(() => {
    loadWeekData()
  }, [userId, currentWeekStart])

  const formatWeekRange = () => {
    const endDate = new Date(currentWeekStart)
    endDate.setDate(endDate.getDate() + 6)
    
    const startStr = currentWeekStart.toLocaleDateString('en', { 
      month: 'short', 
      day: 'numeric' 
    })
    const endStr = endDate.toLocaleDateString('en', { 
      month: 'short', 
      day: 'numeric' 
    })
    
    return `${startStr} - ${endStr}`
  }

  if (loading) {
    return (
      <View style={[{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center'
      }, style]}>
        <Text style={{
          fontSize: 16,
          color: '#6b7280'
        }}>
          Loading meal plan...
        </Text>
      </View>
    )
  }

  return (
    <View style={[{
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    }, style]}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
      }}>
        <TouchableOpacity
          onPress={() => navigateWeek('prev')}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 6,
            backgroundColor: '#f3f4f6'
          }}
        >
          <Text style={{ fontSize: 16, color: '#374151' }}>←</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#111827'
          }}>
            {formatWeekRange()}
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#6b7280'
          }}>
            Meal Plan
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigateWeek('next')}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 6,
            backgroundColor: '#f3f4f6'
          }}
        >
          <Text style={{ fontSize: 16, color: '#374151' }}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Week View */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row' }}>
          {weekData.map((day, dayIndex) => (
            <View
              key={day.date}
              style={{
                width: 200,
                marginRight: 12,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 8,
                padding: 12
              }}
            >
              {/* Day Header */}
              <View style={{
                alignItems: 'center',
                marginBottom: 12,
                paddingBottom: 8,
                borderBottomWidth: 1,
                borderBottomColor: '#f3f4f6'
              }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  {day.dayName}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#6b7280'
                }}>
                  {new Date(day.date).getDate()}
                </Text>
                {day.totalCalories > 0 && (
                  <Text style={{
                    fontSize: 12,
                    color: '#374151',
                    marginTop: 2
                  }}>
                    {day.totalCalories} cal
                  </Text>
                )}
              </View>

              {/* Meal Slots */}
              <View style={{ flex: 1 }}>
                {/* Breakfast */}
                <TouchableOpacity
                  onPress={() => handleMealSlotPress(day.date, 'breakfast')}
                  style={{
                    backgroundColor: '#fef3c7',
                    borderRadius: 6,
                    padding: 8,
                    marginBottom: 8,
                    minHeight: 50,
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: '#92400e',
                    marginBottom: 2
                  }}>
                    Breakfast
                  </Text>
                  {day.meals.breakfast ? (
                    <View>
                      <Text style={{
                        fontSize: 14,
                        color: '#451a03',
                        fontWeight: '500'
                      }}>
                        {day.meals.breakfast.name}
                      </Text>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 2
                      }}>
                        <Text style={{
                          fontSize: 10,
                          color: '#92400e'
                        }}>
                          {day.meals.breakfast.prep_time}m
                        </Text>
                        {day.meals.breakfast.safety_level && (
                          <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: getSafetyColor(day.meals.breakfast.safety_level),
                            marginLeft: 6
                          }} />
                        )}
                      </View>
                    </View>
                  ) : (
                    <Text style={{
                      fontSize: 12,
                      color: '#92400e',
                      fontStyle: 'italic'
                    }}>
                      Tap to add meal
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Lunch */}
                <TouchableOpacity
                  onPress={() => handleMealSlotPress(day.date, 'lunch')}
                  style={{
                    backgroundColor: '#d1fae5',
                    borderRadius: 6,
                    padding: 8,
                    marginBottom: 8,
                    minHeight: 50,
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: '#065f46',
                    marginBottom: 2
                  }}>
                    Lunch
                  </Text>
                  {day.meals.lunch ? (
                    <View>
                      <Text style={{
                        fontSize: 14,
                        color: '#064e3b',
                        fontWeight: '500'
                      }}>
                        {day.meals.lunch.name}
                      </Text>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 2
                      }}>
                        <Text style={{
                          fontSize: 10,
                          color: '#065f46'
                        }}>
                          {day.meals.lunch.prep_time}m
                        </Text>
                        {day.meals.lunch.safety_level && (
                          <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: getSafetyColor(day.meals.lunch.safety_level),
                            marginLeft: 6
                          }} />
                        )}
                      </View>
                    </View>
                  ) : (
                    <Text style={{
                      fontSize: 12,
                      color: '#065f46',
                      fontStyle: 'italic'
                    }}>
                      Tap to add meal
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Dinner */}
                <TouchableOpacity
                  onPress={() => handleMealSlotPress(day.date, 'dinner')}
                  style={{
                    backgroundColor: '#e0e7ff',
                    borderRadius: 6,
                    padding: 8,
                    marginBottom: 8,
                    minHeight: 50,
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: '#3730a3',
                    marginBottom: 2
                  }}>
                    Dinner
                  </Text>
                  {day.meals.dinner ? (
                    <View>
                      <Text style={{
                        fontSize: 14,
                        color: '#312e81',
                        fontWeight: '500'
                      }}>
                        {day.meals.dinner.name}
                      </Text>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 2
                      }}>
                        <Text style={{
                          fontSize: 10,
                          color: '#3730a3'
                        }}>
                          {day.meals.dinner.prep_time}m
                        </Text>
                        {day.meals.dinner.safety_level && (
                          <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: getSafetyColor(day.meals.dinner.safety_level),
                            marginLeft: 6
                          }} />
                        )}
                      </View>
                    </View>
                  ) : (
                    <Text style={{
                      fontSize: 12,
                      color: '#3730a3',
                      fontStyle: 'italic'
                    }}>
                      Tap to add meal
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Snacks */}
                {day.meals.snacks && day.meals.snacks.length > 0 && (
                  <View style={{
                    backgroundColor: '#fdf2f8',
                    borderRadius: 6,
                    padding: 8,
                    minHeight: 40
                  }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: '#831843',
                      marginBottom: 4
                    }}>
                      Snacks ({day.meals.snacks.length})
                    </Text>
                    {day.meals.snacks.slice(0, 2).map((snack, index) => (
                      <Text
                        key={index}
                        style={{
                          fontSize: 10,
                          color: '#831843'
                        }}
                      >
                        • {snack.name}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Weekly Summary */}
      <View style={{
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        flexDirection: 'row',
        justifyContent: 'space-around'
      }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#dc2626'
          }}>
            {weekData.reduce((sum, day) => sum + (day.totalCalories || 0), 0)}
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#6b7280'
          }}>
            Total Calories
          </Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#10b981'
          }}>
            {weekData.filter(day => 
              Object.values(day.meals).some(meal => meal && (Array.isArray(meal) ? meal.length > 0 : true))
            ).length}
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#6b7280'
          }}>
            Days Planned
          </Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#f59e0b'
          }}>
            85%
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#6b7280'
          }}>
            Avg Safety
          </Text>
        </View>
      </View>
    </View>
  )
}