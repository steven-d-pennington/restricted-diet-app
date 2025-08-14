/**
 * SafetyBadge Component - React Native Version
 * 
 * SAFETY CRITICAL: Visual indicator for ingredient/product safety status
 * Uses standardized colors for consistent safety communication across the app
 */

import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { SafetyLevel } from '../types/database.types'

interface SafetyBadgeProps {
  level?: SafetyLevel
  /**
   * Back-compat alias used in some screens. If provided, overrides level.
   */
  status?: 'safe' | 'caution' | 'warning' | 'danger' | 'unknown'
  text?: string
  size?: 'small' | 'medium' | 'large'
  showIcon?: boolean
  style?: ViewStyle
  /**
   * nativewind passes className; accept it to satisfy TS (not used directly here)
   */
  className?: string
  testID?: string
}

interface SafetyInfo {
  color: string
  backgroundColor: string
  icon: string
  label: string
  description: string
}

const getSafetyInfo = (level: SafetyLevel): SafetyInfo => {
  switch (level) {
    case 'safe':
      return {
        color: '#FFFFFF',
        backgroundColor: '#10B981',
        icon: '✅',
        label: 'SAFE',
        description: 'Safe for consumption',
      }
    case 'caution':
      return {
        color: '#000000',
        backgroundColor: '#F59E0B',
        icon: '⚠️',
        label: 'CAUTION',
        description: 'Use with caution',
      }
    case 'warning':
      return {
        color: '#FFFFFF',
        backgroundColor: '#F97316',
        icon: '⚠️',
        label: 'WARNING',
        description: 'May cause reaction',
      }
    case 'danger':
      return {
        color: '#FFFFFF',
        backgroundColor: '#EF4444',
        icon: '🚫',
        label: 'DANGER',
        description: 'Do not consume',
      }
    default:
      return {
        color: '#000000',
        backgroundColor: '#6B7280',
        icon: '❓',
        label: 'UNKNOWN',
        description: 'Safety unknown',
      }
  }
}

export const SafetyBadge: React.FC<SafetyBadgeProps> = ({
  level,
  status,
  text,
  size = 'medium',
  showIcon = true,
  style,
  testID,
}) => {
  const effectiveLevel: SafetyLevel = ((status as SafetyLevel) || level || 'caution') as SafetyLevel
  const safetyInfo = getSafetyInfo(effectiveLevel)
  
  const sizeStyles = {
    small: {
      container: styles.smallContainer,
      text: styles.smallText,
      icon: styles.smallIcon,
    },
    medium: {
      container: styles.mediumContainer,
      text: styles.mediumText,
      icon: styles.mediumIcon,
    },
    large: {
      container: styles.largeContainer,
      text: styles.largeText,
      icon: styles.largeIcon,
    },
  }

  const currentSizeStyles = sizeStyles[size]

  return (
    <View
      style={[
        styles.container,
        currentSizeStyles.container,
        {
          backgroundColor: safetyInfo.backgroundColor,
        },
        style,
      ]}
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={`${safetyInfo.label}: ${safetyInfo.description}`}
    >
      <View style={styles.content}>
        {showIcon && (
          <Text style={[currentSizeStyles.icon, { color: safetyInfo.color }]}>
            {safetyInfo.icon}
          </Text>
        )}
        <Text style={[currentSizeStyles.text, { color: safetyInfo.color }]}>
          {text || safetyInfo.label}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mediumContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  largeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  mediumText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  largeText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  smallIcon: {
    fontSize: 10,
    marginRight: 3,
  },
  mediumIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  largeIcon: {
    fontSize: 14,
    marginRight: 5,
  },
})

export default SafetyBadge