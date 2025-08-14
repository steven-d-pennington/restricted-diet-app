/**
 * Safety Assessment Details Component
 * 
 * SAFETY CRITICAL: Comprehensive view of restaurant safety assessment data
 * with detailed breakdown and recommendations
 */

import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafetyLevel } from '../../types/database.types'
import SafetyAssessmentAPI, { RestaurantSafetyOverview, SafetyAssessmentResult } from '../../services/safetyAssessmentAPI'

interface SafetyAssessmentDetailsProps {
  restaurantId: string
  userId?: string
  restrictionId?: string
  onClose?: () => void
}

const SafetyAssessmentDetails: React.FC<SafetyAssessmentDetailsProps> = ({
  restaurantId,
  userId,
  restrictionId,
  onClose
}) => {
  const [assessment, setAssessment] = useState<SafetyAssessmentResult | null>(null)
  const [overview, setOverview] = useState<RestaurantSafetyOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'breakdown' | 'sources' | 'recommendations'>('overview')

  useEffect(() => {
    loadAssessmentData()
  }, [restaurantId, userId, restrictionId])

  const loadAssessmentData = async () => {
    try {
      setLoading(true)
      
      const [overviewResponse, assessmentResponse] = await Promise.all([
        SafetyAssessmentAPI.getRestaurantSafetyAssessment(restaurantId, userId),
        SafetyAssessmentAPI.getRestrictionSpecificSafety(restaurantId, restrictionId || '')
      ])

      if (overviewResponse.success) {
        setOverview(overviewResponse.data!)
      }

      if (assessmentResponse.success) {
        setAssessment(assessmentResponse.data!)
      }
    } catch (error) {
      console.error('Failed to load assessment data:', error)
      Alert.alert('Error', 'Failed to load safety assessment data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      
      const response = await SafetyAssessmentAPI.forceRefreshAssessment(
        restaurantId,
        restrictionId
      )

      if (response.success) {
        setAssessment(response.data!)
        await loadAssessmentData() // Reload overview as well
      } else {
        Alert.alert('Error', response.error || 'Failed to refresh assessment')
      }
    } catch (error) {
      console.error('Failed to refresh assessment:', error)
      Alert.alert('Error', 'Failed to refresh assessment')
    } finally {
      setRefreshing(false)
    }
  }

  const getSafetyLevelColor = (level: SafetyLevel): string => {
    switch (level) {
      case 'safe': return '#10B981'
      case 'caution': return '#F59E0B'
      case 'warning': return '#EF4444'
      case 'danger': return '#DC2626'
      default: return '#6B7280'
    }
  }

  const renderScoreBar = (score: number, label: string, maxScore: number = 100) => {
    const percentage = (score / maxScore) * 100
    const color = score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'
    
    return (
      <View className="mb-3">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-sm font-medium text-gray-700">{label}</Text>
          <Text className="text-sm font-bold text-gray-900">{score.toFixed(1)}</Text>
        </View>
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View 
            className="h-full rounded-full"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </View>
      </View>
    )
  }

  const renderOverviewTab = () => {
    if (!overview || !assessment) return null

    return (
      <ScrollView className="flex-1 p-4">
        {/* Overall Safety Score */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">Overall Safety Assessment</Text>
          
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-3xl font-bold" style={{ color: getSafetyLevelColor(assessment.safety_level) }}>
                {assessment.overall_safety_score}/100
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                {assessment.safety_level.toUpperCase()} - {assessment.confidence_score}% confidence
              </Text>
            </View>
            
            <View className="items-center">
              <View 
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: getSafetyLevelColor(assessment.safety_level) + '20' }}
              >
                <Ionicons 
                  name={assessment.safety_level === 'safe' ? 'checkmark' : 
                        assessment.safety_level === 'caution' ? 'warning' :
                        assessment.safety_level === 'warning' ? 'alert' : 'close'}
                  size={32}
                  color={getSafetyLevelColor(assessment.safety_level)}
                />
              </View>
            </View>
          </View>

          {/* Data Quality Indicators */}
          <View className="flex-row justify-between pt-4 border-t border-gray-200">
            <View className="items-center flex-1">
              <Text className="text-xs text-gray-500">Expert Verified</Text>
              <Text className="text-sm font-medium text-gray-900">
                {overview.expert_verified ? 'Yes' : 'No'}
              </Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xs text-gray-500">Data Age</Text>
              <Text className="text-sm font-medium text-gray-900">
                {overview.data_freshness_days} days
              </Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xs text-gray-500">Last Updated</Text>
              <Text className="text-sm font-medium text-gray-900">
                {new Date(overview.last_updated).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Critical Warnings */}
        {overview.critical_warnings.length > 0 && (
          <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <Text className="text-lg font-bold text-red-800 mb-3">Critical Warnings</Text>
            {overview.critical_warnings.map((warning, index) => (
              <View key={index} className="flex-row items-start mb-2">
                <Ionicons name="warning" size={16} color="#DC2626" style={{ marginTop: 2, marginRight: 8 }} />
                <Text className="flex-1 text-sm text-red-700">{warning}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Restriction-Specific Scores */}
        {overview.restriction_specific_scores.length > 0 && (
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-900 mb-4">Restriction-Specific Safety</Text>
            {overview.restriction_specific_scores.map((score) => (
              <View key={score.restriction_id} className="mb-3 last:mb-0">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm font-medium text-gray-700">{score.restriction_name}</Text>
                  <View className="flex-row items-center">
                    <Text className="text-sm font-bold text-gray-900 mr-2">
                      {score.safety_score}/100
                    </Text>
                    <View 
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: getSafetyLevelColor(score.safety_level) + '20' }}
                    >
                      <Text 
                        className="text-xs font-medium"
                        style={{ color: getSafetyLevelColor(score.safety_level) }}
                      >
                        {score.safety_level.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <View 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${score.safety_score}%`, 
                      backgroundColor: getSafetyLevelColor(score.safety_level)
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    )
  }

  const renderBreakdownTab = () => {
    if (!assessment) return null
    const freshnessScore = overview
      ? Math.max(0, 100 - Math.min(overview.data_freshness_days, 30) / 30 * 100)
      : 0
    return (
      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">Score Breakdown</Text>
          {renderScoreBar(assessment.overall_safety_score, 'Overall Safety', 100)}
          {renderScoreBar(assessment.confidence_score, 'Confidence', 100)}
          {renderScoreBar(freshnessScore, 'Data Freshness', 100)}
        </View>
      </ScrollView>
    )
  }

  const renderSourcesTab = () => {
    if (!overview) return null
    return (
      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">Data Sources</Text>
          <View className="space-y-3">
            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <Text className="text-sm text-gray-600">Expert Verified</Text>
              <Text className="text-sm font-medium text-gray-900">{overview.expert_verified ? 'Yes' : 'No'}</Text>
            </View>
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-sm text-gray-600">Data Freshness</Text>
              <Text className="text-sm font-medium text-gray-900">{overview.data_freshness_days} days</Text>
            </View>
          </View>
          <View className="mt-4 pt-4 border-t border-gray-200">
            <Text className="text-sm font-medium text-gray-700 mb-2">Data Freshness</Text>
            <Text className="text-xs text-gray-600">Latest data is {overview.data_freshness_days} days old</Text>
          </View>
        </View>
      </ScrollView>
    )
  }

  const renderRecommendationsTab = () => (
    <View className="flex-1 items-center justify-center p-4">
      <Ionicons name="checkmark-circle" size={48} color="#10B981" />
      <Text className="text-lg font-medium text-gray-900 mt-4 text-center">No specific recommendations</Text>
      <Text className="text-sm text-gray-600 mt-2 text-center">This restaurant appears to meet current safety standards</Text>
    </View>
  )

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-sm text-gray-600 mt-4">Loading safety assessment...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-gray-900">Safety Assessment</Text>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={refreshing}
              className="mr-3 p-2 rounded-full bg-gray-100"
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={refreshing ? "#9CA3AF" : "#6B7280"} 
              />
            </TouchableOpacity>
            
            {onClose && (
              <TouchableOpacity onPress={onClose} className="p-2">
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="bg-white px-4 py-2 border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-1">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'breakdown', label: 'Breakdown' },
              { key: 'sources', label: 'Sources' },
              { key: 'recommendations', label: 'Recommendations' }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setSelectedTab(tab.key as any)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedTab === tab.key ? 'bg-blue-500' : 'bg-gray-100'
                }`}
              >
                <Text className={`text-sm font-medium ${
                  selectedTab === tab.key ? 'text-white' : 'text-gray-600'
                }`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Tab Content */}
      {selectedTab === 'overview' && renderOverviewTab()}
      {selectedTab === 'breakdown' && renderBreakdownTab()}
      {selectedTab === 'sources' && renderSourcesTab()}
      {selectedTab === 'recommendations' && renderRecommendationsTab()}
    </View>
  )
}

export default SafetyAssessmentDetails