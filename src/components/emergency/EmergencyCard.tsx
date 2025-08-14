/**
 * Emergency Card Component
 * LIFE CRITICAL: Displays medical emergency information for first responders
 * 
 * This component renders emergency allergy information in a format optimized
 * for quick recognition by medical personnel and first responders.
 */

import React from 'react'
import { View, Text, Pressable, Image } from 'react-native'
import { EmergencyCard as EmergencyCardType, RestrictionSeverity } from '../../types/database.types'
import { SafetyColors, Typography, getAccessibilityProps } from '../../utils/designSystem'

interface EmergencyCardProps {
  card: EmergencyCardType
  onPress?: () => void
  onLongPress?: () => void
  showQRCode?: boolean
  compactMode?: boolean
  viewMode?: 'card' | 'responder' | 'list'
}

export const EmergencyCard: React.FC<EmergencyCardProps> = ({
  card,
  onPress,
  onLongPress,
  showQRCode = false,
  compactMode = false,
  viewMode = 'card'
}) => {
  const isLifeThreatening = card.severity_level === 'life_threatening'
  const isSevere = card.severity_level === 'severe'
  const isCritical = isLifeThreatening || isSevere

  // Emergency mode styling for first responders
  if (viewMode === 'responder') {
    return (
      <View className="emergency-card-responder bg-red-600 p-6 m-4 rounded-lg border-4 border-red-800">
        {/* Medical Alert Header */}
        <View className="flex-row items-center mb-4">
          <Text className="text-6xl mr-3">🚨</Text>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">MEDICAL ALERT</Text>
            <Text className="text-red-100 text-lg">LIFE-THREATENING ALLERGIES</Text>
          </View>
        </View>

        {/* Patient Name */}
        <Text className="text-white text-3xl font-bold mb-4 text-center">
          {card.card_name.replace('Emergency Card - ', '').toUpperCase()}
        </Text>

        {/* Critical Allergies */}
        <View className="bg-white p-4 rounded-lg mb-4">
          <Text className="text-red-800 text-xl font-bold mb-2">SEVERE ALLERGIES:</Text>
          <Text className="text-red-900 text-2xl font-bold leading-tight">
            {card.restrictions_summary.replace('Severe allergies: ', '').toUpperCase()}
          </Text>
        </View>

        {/* Emergency Instructions */}
        <View className="bg-yellow-400 p-4 rounded-lg mb-4">
          <Text className="text-black text-lg font-bold mb-2">EMERGENCY INSTRUCTIONS:</Text>
          <Text className="text-black text-base font-medium leading-tight">
            {card.emergency_instructions}
          </Text>
        </View>

        {/* Critical Information Grid */}
        <View className="flex-row flex-wrap">
          {/* Emergency Contact */}
          {card.emergency_contact_1_phone && (
            <View className="w-1/2 pr-2 mb-3">
              <View className="bg-white p-3 rounded-lg">
                <Text className="text-red-800 font-bold text-sm">EMERGENCY CONTACT:</Text>
                <Text className="text-black text-lg font-bold">
                  {card.emergency_contact_1_name || 'Primary Contact'}
                </Text>
                <Text className="text-black text-xl font-bold">{card.emergency_contact_1_phone}</Text>
              </View>
            </View>
          )}

          {/* Medications */}
          {card.medications && card.medications.length > 0 && (
            <View className="w-1/2 pl-2 mb-3">
              <View className="bg-white p-3 rounded-lg">
                <Text className="text-red-800 font-bold text-sm">MEDICATIONS:</Text>
                {card.medications.slice(0, 2).map((med, index) => (
                  <Text key={index} className="text-black text-base font-bold leading-tight">
                    {med}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Doctor */}
          {card.doctor_phone && (
            <View className="w-full mb-3">
              <View className="bg-white p-3 rounded-lg">
                <Text className="text-red-800 font-bold text-sm">DOCTOR:</Text>
                <Text className="text-black text-base font-bold">
                  {card.doctor_name} - {card.doctor_phone}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* QR Code for digital access */}
        {showQRCode && card.qr_code_url && (
          <View className="bg-white p-4 rounded-lg items-center">
            <Text className="text-black font-bold mb-2">SCAN FOR FULL MEDICAL INFO</Text>
            <Image
              source={{ uri: card.qr_code_url }}
              style={{ width: 120, height: 120 }}
              className="rounded"
            />
          </View>
        )}
      </View>
    )
  }

  // Compact list mode
  if (viewMode === 'list' || compactMode) {
    const severityColor = isCritical 
      ? isLifeThreatening ? 'bg-red-100 border-red-300' : 'bg-orange-100 border-orange-300'
      : 'bg-gray-100 border-gray-300'

    const severityTextColor = isCritical
      ? isLifeThreatening ? 'text-red-800' : 'text-orange-800'
      : 'text-gray-800'

    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        className={`${severityColor} border-l-4 p-4 mb-2 rounded-lg active:opacity-70`}
        {...getAccessibilityProps(
          `Emergency card for ${card.card_name}. Severity: ${card.severity_level}`,
          'Tap to view full emergency card details',
          'button'
        )}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="text-2xl mr-2">
                {isLifeThreatening ? '🚨' : isSevere ? '⚠️' : '📋'}
              </Text>
              <Text className={`${severityTextColor} text-base font-bold flex-1`}>
                {card.card_name}
              </Text>
            </View>
            
            <Text className={`${severityTextColor} text-sm mb-1`}>
              {card.restrictions_summary}
            </Text>
            
            <Text className="text-gray-600 text-xs">
              Updated: {new Date(card.last_updated).toLocaleDateString()}
            </Text>
          </View>

          {card.is_active && (
            <View className="ml-3">
              <View className={`px-2 py-1 rounded-full ${isCritical ? 'bg-red-200' : 'bg-green-200'}`}>
                <Text className={`text-xs font-bold ${isCritical ? 'text-red-800' : 'text-green-800'}`}>
                  {card.severity_level.toUpperCase().replace('_', ' ')}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Pressable>
    )
  }

  // Full card mode (default)
  const cardBackgroundColor = isCritical 
    ? isLifeThreatening ? 'bg-red-50' : 'bg-orange-50'
    : 'bg-white'

  const cardBorderColor = isCritical
    ? isLifeThreatening ? 'border-red-300' : 'border-orange-300'
    : 'border-gray-200'

  const headerColor = isCritical
    ? isLifeThreatening ? 'bg-red-600' : 'bg-orange-500'
    : 'bg-blue-500'

  return (
    <Pressable
      onPress={onPress}
      className={`${cardBackgroundColor} ${cardBorderColor} border-2 rounded-lg shadow-lg mb-4 overflow-hidden active:opacity-90`}
      {...getAccessibilityProps(
        `Emergency medical card for ${card.card_name}`,
        'Double tap to open emergency viewer mode',
        'button'
      )}
    >
      {/* Header with severity indicator */}
      <View className={`${headerColor} px-4 py-3`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Text className="text-3xl mr-3">
              {isLifeThreatening ? '🚨' : isSevere ? '⚠️' : '📋'}
            </Text>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">{card.card_name}</Text>
              <Text className="text-white text-sm opacity-90">
                {card.severity_level.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          
          {!card.is_active && (
            <View className="bg-black bg-opacity-20 px-2 py-1 rounded">
              <Text className="text-white text-xs font-bold">INACTIVE</Text>
            </View>
          )}
        </View>
      </View>

      {/* Card content */}
      <View className="p-4">
        {/* Restrictions summary */}
        <View className="mb-4">
          <Text className={`${isCritical ? 'text-red-800' : 'text-gray-800'} text-base font-semibold mb-1`}>
            Medical Restrictions:
          </Text>
          <Text className={`${isCritical ? 'text-red-700' : 'text-gray-700'} text-lg leading-tight`}>
            {card.restrictions_summary}
          </Text>
        </View>

        {/* Emergency instructions preview */}
        {card.emergency_instructions && (
          <View className="mb-4">
            <Text className="text-gray-800 text-sm font-semibold mb-1">Emergency Instructions:</Text>
            <Text className="text-gray-700 text-sm leading-tight" numberOfLines={2}>
              {card.emergency_instructions}
            </Text>
          </View>
        )}

        {/* Key information grid */}
        <View className="flex-row flex-wrap">
          {/* Emergency contact */}
          {card.emergency_contact_1_phone && (
            <View className="w-1/2 pr-2 mb-3">
              <Text className="text-gray-600 text-xs font-semibold mb-1">EMERGENCY CONTACT</Text>
              <Text className="text-gray-800 text-sm font-bold">
                {card.emergency_contact_1_name || 'Primary Contact'}
              </Text>
              <Text className="text-gray-700 text-sm">{card.emergency_contact_1_phone}</Text>
            </View>
          )}

          {/* Medications */}
          {card.medications && card.medications.length > 0 && (
            <View className="w-1/2 pl-2 mb-3">
              <Text className="text-gray-600 text-xs font-semibold mb-1">MEDICATIONS</Text>
              {card.medications.slice(0, 2).map((med, index) => (
                <Text key={index} className="text-gray-700 text-sm leading-tight">
                  {med}
                </Text>
              ))}
              {card.medications.length > 2 && (
                <Text className="text-gray-500 text-xs">
                  +{card.medications.length - 2} more
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Footer with last updated and QR code indicator */}
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-200">
          <Text className="text-gray-500 text-xs">
            Updated: {new Date(card.last_updated).toLocaleDateString()}
          </Text>
          
          {card.qr_code_url && (
            <View className="flex-row items-center">
              <Text className="text-2xl mr-1">📱</Text>
              <Text className="text-gray-500 text-xs">QR Available</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  )
}

export default EmergencyCard