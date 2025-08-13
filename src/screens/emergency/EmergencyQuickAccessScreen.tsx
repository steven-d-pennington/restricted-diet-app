/**
 * Emergency Quick Access Screen
 * LIFE CRITICAL: Instant access to emergency information
 * 
 * This screen provides immediate access to the most critical emergency cards
 * and is optimized for emergency situations where seconds count.
 */

import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, Alert, BackHandler } from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import { useEmergencyCards } from '../../hooks/useEmergencyCards'
import { useFamilyMembers } from '../../hooks/useFamilyMembers'
import { EmergencyCard as EmergencyCardComponent } from '../../components/emergency/EmergencyCard'
import { EmergencyCardViewer } from '../../components/emergency/EmergencyCardViewer'
import { SafetyButton } from '../../components/SafetyButton'
import { getAccessibilityProps } from '../../utils/designSystem'
import { EmergencyCard } from '../../types/database.types'

interface EmergencyQuickAccessScreenProps {
  selectedCardId?: string
  onClose: () => void
  onCreateCard?: () => void
}

export const EmergencyQuickAccessScreen: React.FC<EmergencyQuickAccessScreenProps> = ({
  selectedCardId,
  onClose,
  onCreateCard,
}) => {
  const { user } = useAuth()
  const [selectedCard, setSelectedCard] = useState<EmergencyCard | null>(null)
  const [showCardViewer, setShowCardViewer] = useState(false)
  
  // Get user emergency cards
  const {
    emergencyCards: userCards,
    criticalCards: userCriticalCards,
    loading: userLoading,
  } = useEmergencyCards()

  // Get family member cards
  const { familyMembers } = useFamilyMembers()
  const [familyCards, setFamilyCards] = useState<EmergencyCard[]>([])
  const [familyLoading, setFamilyLoading] = useState(false)

  // Combine all critical cards
  const allCriticalCards = [...userCriticalCards, ...familyCards].sort((a, b) => {
    // Sort by severity priority
    const severityOrder = { life_threatening: 4, severe: 3, moderate: 2, mild: 1 }
    const aPriority = severityOrder[a.severity_level]
    const bPriority = severityOrder[b.severity_level]
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority
    }
    
    return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
  })

  // Load family member emergency cards
  useEffect(() => {
    const loadFamilyEmergencyCards = async () => {
      if (familyMembers.length === 0) return

      setFamilyLoading(true)
      try {
        // In a real implementation, we'd load cards for all family members
        // For now, we'll simulate this
        console.log('Loading family emergency cards for', familyMembers.length, 'family members')
        setFamilyCards([])
      } catch (error) {
        console.error('Error loading family emergency cards:', error)
      } finally {
        setFamilyLoading(false)
      }
    }

    loadFamilyEmergencyCards()
  }, [familyMembers])

  // Auto-select card if specified
  useEffect(() => {
    if (selectedCardId && allCriticalCards.length > 0) {
      const card = allCriticalCards.find(c => c.id === selectedCardId)
      if (card) {
        setSelectedCard(card)
        setShowCardViewer(true)
      }
    }
  }, [selectedCardId, allCriticalCards])

  // Handle hardware back button on Android
  useEffect(() => {
    const backAction = () => {
      if (showCardViewer) {
        setShowCardViewer(false)
        setSelectedCard(null)
        return true
      }
      return false
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)
    return () => backHandler.remove()
  }, [showCardViewer])

  const handleCardPress = (card: EmergencyCard) => {
    setSelectedCard(card)
    setShowCardViewer(true)
  }

  const handleCloseViewer = () => {
    setShowCardViewer(false)
    setSelectedCard(null)
  }

  const handleCall911 = () => {
    Alert.alert(
      'Emergency Services',
      'Call 911 for immediate emergency assistance?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 911',
          style: 'destructive',
          onPress: () => {
            console.log('Calling 911...')
            // In real app: Linking.openURL('tel:911')
          }
        }
      ]
    )
  }

  const handleCall = (phoneNumber: string, contactName?: string) => {
    Alert.alert(
      'Call Emergency Contact',
      `Call ${contactName || 'contact'} at ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            console.log(`Calling ${contactName}: ${phoneNumber}`)
            // In real app: Linking.openURL(`tel:${phoneNumber}`)
          }
        }
      ]
    )
  }

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-8">
      <Text className="text-6xl mb-6">🚨</Text>
      <Text className="text-gray-800 text-2xl font-bold mb-4 text-center">
        No Emergency Cards
      </Text>
      <Text className="text-gray-600 text-base text-center mb-8 leading-relaxed">
        Emergency cards provide critical medical information to first responders. 
        Create an emergency card now to ensure your safety information is always accessible.
      </Text>
      
      <SafetyButton
        title="Create Emergency Card"
        variant="primary"
        size="lg"
        onPress={onCreateCard}
        icon="+"
        style={{ marginBottom: 16 }}
      />
      
      <SafetyButton
        title="Call 911"
        variant="error"
        size="lg"
        onPress={handleCall911}
        icon="📞"
      />
    </View>
  )

  if (showCardViewer && selectedCard) {
    return (
      <EmergencyCardViewer
        card={selectedCard}
        onClose={handleCloseViewer}
        onCall={handleCall}
      />
    )
  }

  const loading = userLoading || familyLoading

  return (
    <View className="flex-1 bg-red-50">
      {/* Emergency Header */}
      <View className="bg-red-600 px-4 py-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Text className="text-5xl mr-4">🚨</Text>
            <View>
              <Text className="text-white text-xl font-bold">EMERGENCY ACCESS</Text>
              <Text className="text-red-100 text-sm">
                {allCriticalCards.length} Critical Card{allCriticalCards.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          
          <Pressable
            onPress={onClose}
            className="bg-red-800 px-4 py-2 rounded-lg"
            {...getAccessibilityProps('Close emergency access', '', 'button')}
          >
            <Text className="text-white font-bold">✕ CLOSE</Text>
          </Pressable>
        </View>
      </View>

      {/* Emergency Actions Bar */}
      <View className="bg-red-700 px-4 py-3">
        <View className="flex-row justify-around">
          <Pressable
            onPress={handleCall911}
            className="bg-red-800 px-6 py-3 rounded-lg flex-1 mr-2 items-center"
            {...getAccessibilityProps('Call 911 emergency services', '', 'button')}
          >
            <Text className="text-white text-lg font-bold">📞 CALL 911</Text>
          </Pressable>
          
          {allCriticalCards.length > 0 && allCriticalCards[0].emergency_contact_1_phone && (
            <Pressable
              onPress={() => handleCall(
                allCriticalCards[0].emergency_contact_1_phone!,
                allCriticalCards[0].emergency_contact_1_name || undefined
              )}
              className="bg-orange-600 px-6 py-3 rounded-lg flex-1 ml-2 items-center"
              {...getAccessibilityProps('Call emergency contact', '', 'button')}
            >
              <Text className="text-white text-lg font-bold">📱 EMERGENCY CONTACT</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Loading State */}
      {loading && allCriticalCards.length === 0 && (
        <View className="flex-1 justify-center items-center">
          <Text className="text-4xl mb-4">⏳</Text>
          <Text className="text-gray-600 text-lg">Loading emergency information...</Text>
        </View>
      )}

      {/* Empty State */}
      {!loading && allCriticalCards.length === 0 && renderEmptyState()}

      {/* Critical Cards List */}
      {allCriticalCards.length > 0 && (
        <View className="flex-1 px-4 py-4">
          <Text className="text-gray-800 text-lg font-bold mb-4">
            Critical Emergency Cards
          </Text>
          
          {allCriticalCards.map((card) => (
            <EmergencyCardComponent
              key={card.id}
              card={card}
              onPress={() => handleCardPress(card)}
              viewMode="list"
            />
          ))}

          {/* Quick Actions for Life-Threatening Cards */}
          {allCriticalCards.some(card => card.severity_level === 'life_threatening') && (
            <View className="mt-6 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4">
              <Text className="text-yellow-800 text-lg font-bold mb-3">⚠️ LIFE-THREATENING ALLERGIES DETECTED</Text>
              <Text className="text-yellow-700 text-base mb-4 leading-relaxed">
                This person has severe allergies that can be life-threatening. 
                If you suspect an allergic reaction, call 911 immediately.
              </Text>
              
              <View className="flex-row">
                <SafetyButton
                  title="View Instructions"
                  variant="warning"
                  size="sm"
                  onPress={() => {
                    const lifeThreateningCard = allCriticalCards.find(c => c.severity_level === 'life_threatening')
                    if (lifeThreateningCard) {
                      handleCardPress(lifeThreateningCard)
                    }
                  }}
                  style={{ flex: 1, marginRight: 8 }}
                />
                
                <SafetyButton
                  title="Call 911"
                  variant="error"
                  size="sm"
                  onPress={handleCall911}
                  style={{ flex: 1, marginLeft: 8 }}
                />
              </View>
            </View>
          )}

          {/* Additional Actions */}
          <View className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Text className="text-blue-800 font-semibold mb-2">Need Help?</Text>
            <Text className="text-blue-700 text-sm mb-3">
              This emergency access provides critical medical information for first responders.
            </Text>
            
            {onCreateCard && (
              <SafetyButton
                title="Create New Emergency Card"
                variant="secondary"
                size="sm"
                onPress={onCreateCard}
                icon="+"
              />
            )}
          </View>
        </View>
      )}
    </View>
  )
}

export default EmergencyQuickAccessScreen