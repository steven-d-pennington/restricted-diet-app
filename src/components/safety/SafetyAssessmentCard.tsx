/**
 * Safety Assessment Card Component
 * 
 * SAFETY CRITICAL: Displays comprehensive restaurant safety information
 * for life-critical decision making
 */

import React from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafetyLevel, RestrictionSeverity } from '../../types/database.types'
import { RestaurantSafetyOverview } from '../../services/safetyAssessmentAPI'

interface SafetyAssessmentCardProps {
  assessment: RestaurantSafetyOverview
  onPress?: () => void
  onRefresh?: () => void
  showDetails?: boolean
  restrictionName?: string
  userSeverity?: RestrictionSeverity
}

const SafetyAssessmentCard: React.FC<SafetyAssessmentCardProps> = ({
  assessment,
  onPress,
  onRefresh,
  showDetails = true,
  restrictionName,
  userSeverity
}) => {
  const getSafetyLevelColor = (level: SafetyLevel): string => {
    switch (level) {
      case 'safe': return '#10B981' // green-500
      case 'caution': return '#F59E0B' // amber-500
      case 'warning': return '#EF4444' // red-500
      case 'danger': return '#DC2626' // red-600
      default: return '#6B7280' // gray-500
    }
  }

  const getSafetyLevelIcon = (level: SafetyLevel): string => {
    switch (level) {
      case 'safe': return 'checkmark-circle'
      case 'caution': return 'warning'
      case 'warning': return 'alert-circle'
      case 'danger': return 'close-circle'
      default: return 'help-circle'
    }
  }

  const getSafetyLevelText = (level: SafetyLevel): string => {
    switch (level) {
      case 'safe': return 'Safe'
      case 'caution': return 'Caution'
      case 'warning': return 'Warning'
      case 'danger': return 'DANGER'
      default: return 'Unknown'
    }
  }

  const getConfidenceText = (score: number): string => {
    if (score >= 80) return 'High Confidence'
    if (score >= 60) return 'Medium Confidence'
    if (score >= 40) return 'Low Confidence'
    return 'Very Low Confidence'
  }

  const getDataFreshnessText = (days: number): string => {
    if (days <= 7) return 'Recent'
    if (days <= 30) return 'Current'
    if (days <= 90) return 'Aging'
    return 'Outdated'
  }

  const handleCriticalWarningPress = () => {
    if (assessment.critical_warnings.length > 0) {
      Alert.alert(
        'Critical Safety Warnings',
        assessment.critical_warnings.join('\n\n'),
        [{ text: 'Understood', style: 'default' }],
        { cancelable: true }
      )
    }
  }

  const isLifeThreatening = userSeverity === 'life_threatening'
  const hasExpertVerification = assessment.expert_verified
  const isDataFresh = assessment.data_freshness_days <= 30
  const hasHighConfidence = assessment.confidence_score >= 70

  // Determine if this is a concerning assessment
  const isConcerning = 
    assessment.safety_level === 'danger' ||
    (assessment.safety_level === 'warning' && isLifeThreatening) ||
    assessment.critical_warnings.length > 0 ||
    (!hasHighConfidence && isLifeThreatening)

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`mx-4 mb-4 rounded-xl p-4 shadow-lg ${
        isConcerning ? 'bg-red-50 border-2 border-red-200' : 'bg-white border border-gray-200'
      }`}
    >
      {/* Header with Safety Level */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons
            name={getSafetyLevelIcon(assessment.safety_level) as any}
            size={24}
            color={getSafetyLevelColor(assessment.safety_level)}
            style={{ marginRight: 8 }}
          />
          <Text
            className="text-lg font-bold"
            style={{ color: getSafetyLevelColor(assessment.safety_level) }}
          >
            {getSafetyLevelText(assessment.safety_level)}
          </Text>
          {isLifeThreatening && (
            <View className="ml-2 px-2 py-1 bg-red-100 rounded-full">
              <Text className="text-xs font-medium text-red-700">LIFE-THREATENING</Text>
            </View>
          )}
        </View>
        
        {onRefresh && (
          <TouchableOpacity
            onPress={onRefresh}
            className="p-2 rounded-full bg-gray-100"
          >
            <Ionicons name="refresh" size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Critical Warnings */}
      {assessment.critical_warnings.length > 0 && (
        <TouchableOpacity
          onPress={handleCriticalWarningPress}
          className="mb-3 p-3 bg-red-100 border border-red-300 rounded-lg"
        >
          <View className="flex-row items-center">
            <Ionicons name="warning" size={20} color="#DC2626" style={{ marginRight: 8 }} />
            <Text className="flex-1 text-sm font-medium text-red-800">
              {assessment.critical_warnings.length} Critical Warning{assessment.critical_warnings.length > 1 ? 's' : ''}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#DC2626" />
          </View>
          <Text className="text-xs text-red-600 mt-1">
            Tap to view details
          </Text>
        </TouchableOpacity>
      )}

      {/* Safety Score */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-gray-900">
            {assessment.overall_safety_score}/100
          </Text>
          <Text className="text-sm text-gray-600">
            Safety Score {restrictionName && `for ${restrictionName}`}
          </Text>
        </View>
        
        <View className="items-end">
          <Text className="text-sm font-medium text-gray-700">
            {getConfidenceText(assessment.confidence_score)}
          </Text>
          <Text className="text-xs text-gray-500">
            {assessment.confidence_score}% confidence
          </Text>
        </View>
      </View>

      {/* Verification Indicators */}
      <View className="flex-row items-center mb-3 space-x-3">
        <View className="flex-row items-center">
          <Ionicons
            name={hasExpertVerification ? 'checkmark-circle' : 'help-circle'}
            size={16}
            color={hasExpertVerification ? '#10B981' : '#6B7280'}
            style={{ marginRight: 4 }}
          />
          <Text className={`text-xs ${
            hasExpertVerification ? 'text-green-700' : 'text-gray-600'
          }`}>
            {hasExpertVerification ? 'Expert Verified' : 'No Expert Review'}
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <Ionicons
            name={isDataFresh ? 'time' : 'time-outline'}
            size={16}
            color={isDataFresh ? '#10B981' : '#F59E0B'}
            style={{ marginRight: 4 }}
          />
          <Text className={`text-xs ${
            isDataFresh ? 'text-green-700' : 'text-amber-600'
          }`}>
            {getDataFreshnessText(assessment.data_freshness_days)}
          </Text>
        </View>
      </View>

      {/* Restriction-Specific Scores */}
      {showDetails && assessment.restriction_specific_scores.length > 0 && (
        <View className="mt-3 pt-3 border-t border-gray-200">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Restriction-Specific Safety:
          </Text>
          {assessment.restriction_specific_scores.slice(0, 3).map((score, index) => (
            <View key={score.restriction_id} className="flex-row items-center justify-between mb-1">
              <Text className="text-sm text-gray-600">
                {score.restriction_name}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-sm font-medium text-gray-900 mr-2">
                  {score.safety_score}/100
                </Text>
                <Ionicons
                  name={getSafetyLevelIcon(score.safety_level) as any}
                  size={14}
                  color={getSafetyLevelColor(score.safety_level)}
                />
              </View>
            </View>
          ))}
          {assessment.restriction_specific_scores.length > 3 && (
            <Text className="text-xs text-gray-500 mt-1">
              +{assessment.restriction_specific_scores.length - 3} more restrictions
            </Text>
          )}
        </View>
      )}

      {/* Last Updated */}
      <View className="mt-3 pt-2 border-t border-gray-100">
        <Text className="text-xs text-gray-500">
          Last updated: {new Date(assessment.last_updated).toLocaleDateString()} 
          ({assessment.data_freshness_days} days ago)
        </Text>
      </View>

      {/* Life-Threatening Disclaimer */}
      {isLifeThreatening && (
        <View className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
          <Text className="text-xs text-red-700 text-center">
            ⚠️ Life-threatening allergy: Always verify with restaurant staff regardless of safety score
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

export default SafetyAssessmentCard