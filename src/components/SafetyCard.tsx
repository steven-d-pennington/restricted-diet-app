/**
 * SafetyCard Component - React Native Version
 * 
 * SAFETY CRITICAL: Displays product/ingredient information with safety status
 * Primary component for communicating safety information to users
 */

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'

interface SafetyCardProps {
  title?: string
  description?: string
  details?: string[]
  onPress?: () => void
  style?: ViewStyle
  testID?: string
  children?: React.ReactNode
}

export const SafetyCard: React.FC<SafetyCardProps> = ({
  title,
  description,
  details = [],
  onPress,
  style,
  testID,
  children,
}) => {
  const CardContent = () => (
    <View style={[styles.card, style]} testID={testID}>
      {/* Header */}
      {(title || description) && (
        <View style={styles.header}>
          {title && (
            <Text style={styles.title}>
              {title}
            </Text>
          )}
          {description && (
            <Text style={styles.description}>
              {description}
            </Text>
          )}
        </View>
      )}

      {/* Details list */}
      {details.length > 0 && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Details</Text>
          {details.map((detail, index) => (
            <View key={index} style={styles.detailItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.detailText}>{detail}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Custom children content */}
      {children && (
        <View style={styles.childrenContainer}>
          {children}
        </View>
      )}

      {/* Tap indicator for interactive cards */}
      {onPress && (
        <View style={styles.tapIndicator}>
          <Text style={styles.tapIndicatorText}>
            Tap for more information
          </Text>
        </View>
      )}
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={styles.touchable}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={description}
      >
        <CardContent />
      </TouchableOpacity>
    )
  }

  return (
    <View accessibilityRole="text" accessibilityLabel={title}>
      <CardContent />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  touchable: {
    borderRadius: 12,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bullet: {
    color: '#999999',
    marginRight: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  childrenContainer: {
    marginTop: 12,
  },
  tapIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    alignItems: 'center',
  },
  tapIndicatorText: {
    fontSize: 12,
    color: '#999999',
  },
})

export default SafetyCard