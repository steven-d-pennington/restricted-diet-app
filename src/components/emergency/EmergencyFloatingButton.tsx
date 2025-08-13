/**
 * Emergency Floating Action Button
 * LIFE CRITICAL: Always-visible emergency access button
 * 
 * This component provides instant access to emergency cards from anywhere in the app.
 * It appears as a floating button that users can tap for immediate emergency access.
 */

import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  Pressable, 
  Animated, 
  Dimensions,
  Alert 
} from 'react-native'
import { EmergencyCard } from '../../types/database.types'
import { getAccessibilityProps, getTouchTargetClass } from '../../utils/designSystem'

interface EmergencyFloatingButtonProps {
  emergencyCards: EmergencyCard[]
  onEmergencyPress: (card?: EmergencyCard) => void
  onCreateCard?: () => void
  visible?: boolean
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  style?: any
}

export const EmergencyFloatingButton: React.FC<EmergencyFloatingButtonProps> = ({
  emergencyCards,
  onEmergencyPress,
  onCreateCard,
  visible = true,
  position = 'bottom-right',
  style,
}) => {
  const [expanded, setExpanded] = useState(false)
  const [animation] = useState(new Animated.Value(0))
  const [pulseAnimation] = useState(new Animated.Value(1))

  const screenWidth = Dimensions.get('window').width
  const screenHeight = Dimensions.get('window').height

  // Filter to active critical cards
  const criticalCards = emergencyCards.filter(card => 
    card.is_active && (card.severity_level === 'life_threatening' || card.severity_level === 'severe')
  )
  
  const hasLifeThreateningCards = criticalCards.some(card => 
    card.severity_level === 'life_threatening'
  )

  // Pulse animation for life-threatening cards
  useEffect(() => {
    if (hasLifeThreateningCards && visible) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Continue pulsing
          setTimeout(pulse, 2000)
        })
      }
      pulse()
    }
  }, [hasLifeThreateningCards, visible, pulseAnimation])

  // Expansion animation
  useEffect(() => {
    Animated.timing(animation, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [expanded, animation])

  if (!visible) {
    return null
  }

  const handleMainPress = () => {
    if (criticalCards.length === 0) {
      // No emergency cards - offer to create one
      Alert.alert(
        'No Emergency Cards',
        'You don\'t have any emergency cards set up. Would you like to create one now?',
        [
          { text: 'Later', style: 'cancel' },
          { 
            text: 'Create Card', 
            onPress: onCreateCard,
            style: 'default'
          }
        ]
      )
      return
    }

    if (criticalCards.length === 1) {
      // Single card - open directly
      onEmergencyPress(criticalCards[0])
    } else {
      // Multiple cards - show selection
      setExpanded(!expanded)
    }
  }

  const handleCardPress = (card: EmergencyCard) => {
    setExpanded(false)
    onEmergencyPress(card)
  }

  // Position styles
  const getPositionStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      bottom: 20,
      zIndex: 1000,
    }

    switch (position) {
      case 'bottom-left':
        return { ...baseStyle, left: 20 }
      case 'bottom-center':
        return { ...baseStyle, left: screenWidth / 2 - 30 }
      case 'bottom-right':
      default:
        return { ...baseStyle, right: 20 }
    }
  }

  // Button colors based on severity
  const getButtonColor = () => {
    if (hasLifeThreateningCards) {
      return 'bg-red-600'
    } else if (criticalCards.length > 0) {
      return 'bg-orange-500'
    } else {
      return 'bg-blue-600'
    }
  }

  const getButtonIcon = () => {
    if (hasLifeThreateningCards) {
      return '🚨'
    } else if (criticalCards.length > 0) {
      return '⚠️'
    } else {
      return '📋'
    }
  }

  return (
    <View style={[getPositionStyle(), style]}>
      {/* Expanded card options */}
      {expanded && criticalCards.length > 1 && (
        <View style={{
          position: 'absolute',
          bottom: 80,
          right: 0,
          width: 250,
        }}>
          {criticalCards.slice(0, 3).map((card, index) => (
            <Animated.View
              key={card.id}
              style={{
                transform: [
                  {
                    translateY: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50 * (index + 1), 0],
                    })
                  }
                ],
                opacity: animation,
                marginBottom: 8,
              }}
            >
              <Pressable
                onPress={() => handleCardPress(card)}
                className={`${card.severity_level === 'life_threatening' ? 'bg-red-600' : 'bg-orange-500'} 
                           rounded-full px-4 py-3 flex-row items-center shadow-lg`}
                {...getAccessibilityProps(
                  `Emergency card for ${card.card_name}`,
                  `Severity: ${card.severity_level}`,
                  'button'
                )}
              >
                <Text className="text-2xl mr-2">
                  {card.severity_level === 'life_threatening' ? '🚨' : '⚠️'}
                </Text>
                <Text className="text-white font-bold text-sm flex-1" numberOfLines={1}>
                  {card.card_name.replace('Emergency Card - ', '')}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
          
          {criticalCards.length > 3 && (
            <Animated.View
              style={{
                transform: [
                  {
                    translateY: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [200, 0],
                    })
                  }
                ],
                opacity: animation,
              }}
            >
              <Pressable
                onPress={() => onEmergencyPress()}
                className="bg-gray-600 rounded-full px-4 py-3 flex-row items-center shadow-lg"
                {...getAccessibilityProps('View all emergency cards', '', 'button')}
              >
                <Text className="text-white font-bold text-sm">
                  +{criticalCards.length - 3} More Cards
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      )}

      {/* Main Emergency Button */}
      <Animated.View
        style={{
          transform: [{ scale: pulseAnimation }],
        }}
      >
        <Pressable
          onPress={handleMainPress}
          className={`${getButtonColor()} w-16 h-16 rounded-full items-center justify-center shadow-lg 
                     border-4 border-white active:opacity-80`}
          {...getAccessibilityProps(
            'Emergency access button',
            criticalCards.length === 0 
              ? 'No emergency cards available. Tap to create one.'
              : `${criticalCards.length} emergency card${criticalCards.length > 1 ? 's' : ''} available.`,
            'button'
          )}
        >
          <View className="items-center">
            <Text className="text-2xl">{getButtonIcon()}</Text>
            {criticalCards.length > 1 && (
              <View className="absolute -top-2 -right-2 bg-white rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-xs font-bold text-gray-800">
                  {Math.min(criticalCards.length, 9)}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>

      {/* Emergency indicator text */}
      {hasLifeThreateningCards && (
        <View className="absolute -top-8 right-0">
          <Text className="text-red-600 text-xs font-bold text-center">
            EMERGENCY
          </Text>
        </View>
      )}

      {/* Quick 911 access - always visible for critical cards */}
      {criticalCards.length > 0 && (
        <View className="absolute -left-16 top-2">
          <Pressable
            onPress={() => {
              Alert.alert(
                'Call 911',
                'Do you need to call emergency services?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Call 911', 
                    style: 'destructive',
                    onPress: () => {
                      // In a real app, this would initiate a phone call
                      console.log('Calling 911...')
                    }
                  }
                ]
              )
            }}
            className="bg-red-800 w-12 h-12 rounded-full items-center justify-center shadow-lg"
            {...getAccessibilityProps('Call 911 emergency services', '', 'button')}
          >
            <Text className="text-white text-lg font-bold">911</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

export default EmergencyFloatingButton