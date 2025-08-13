/**
 * Emergency Card List Component
 * Displays a list of emergency cards with management actions
 */

import React, { useState } from 'react'
import { View, Text, FlatList, Pressable, Alert } from 'react-native'
import { EmergencyCard as EmergencyCardType } from '../../types/database.types'
import { EmergencyCard } from './EmergencyCard'
import { SafetyButton } from '../SafetyButton'
import { getAccessibilityProps } from '../../utils/designSystem'

interface EmergencyCardListProps {
  cards: EmergencyCardType[]
  loading?: boolean
  onCardPress: (card: EmergencyCardType) => void
  onCreateNew: () => void
  onEditCard: (card: EmergencyCardType) => void
  onDeleteCard: (card: EmergencyCardType) => void
  onActivateCard: (card: EmergencyCardType) => void
  onDeactivateCard: (card: EmergencyCardType) => void
  showInactive?: boolean
}

export const EmergencyCardList: React.FC<EmergencyCardListProps> = ({
  cards,
  loading = false,
  onCardPress,
  onCreateNew,
  onEditCard,
  onDeleteCard,
  onActivateCard,
  onDeactivateCard,
  showInactive = false,
}) => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  // Filter cards based on showInactive setting
  const displayCards = showInactive ? cards : cards.filter(card => card.is_active)

  // Sort cards by priority (life-threatening first, then by date)
  const sortedCards = [...displayCards].sort((a, b) => {
    // Priority by severity
    const severityOrder = { life_threatening: 4, severe: 3, moderate: 2, mild: 1 }
    const aPriority = severityOrder[a.severity_level]
    const bPriority = severityOrder[b.severity_level]
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority
    }
    
    // Then by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const handleCardLongPress = (card: EmergencyCardType) => {
    setSelectedCard(selectedCard === card.id ? null : card.id)
  }

  const handleDeletePress = (card: EmergencyCardType) => {
    Alert.alert(
      'Delete Emergency Card',
      `Are you sure you want to delete "${card.card_name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDeleteCard(card)
            setSelectedCard(null)
          }
        }
      ]
    )
  }

  const handleActivatePress = (card: EmergencyCardType) => {
    if (card.is_active) {
      Alert.alert(
        'Deactivate Emergency Card',
        `Deactivate "${card.card_name}"? It will no longer appear in emergency situations.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Deactivate',
            style: 'destructive',
            onPress: () => {
              onDeactivateCard(card)
              setSelectedCard(null)
            }
          }
        ]
      )
    } else {
      onActivateCard(card)
      setSelectedCard(null)
    }
  }

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-8 py-12">
      <Text className="text-6xl mb-4">🚨</Text>
      <Text className="text-gray-800 text-xl font-bold mb-2 text-center">
        No Emergency Cards
      </Text>
      <Text className="text-gray-600 text-base text-center mb-6 leading-relaxed">
        Emergency cards provide critical medical information to first responders. 
        Create one now to ensure your safety information is always accessible.
      </Text>
      <SafetyButton
        title="Create Emergency Card"
        variant="primary"
        size="lg"
        onPress={onCreateNew}
        icon="+"
      />
    </View>
  )

  const renderCard = ({ item: card }: { item: EmergencyCardType }) => (
    <View>
      <EmergencyCard
        card={card}
        viewMode="list"
        onPress={() => onCardPress(card)}
        onLongPress={() => handleCardLongPress(card)}
      />
      
      {/* Action buttons when card is selected */}
      {selectedCard === card.id && (
        <View className="bg-gray-100 px-4 py-3 rounded-b-lg -mt-2 mb-2">
          <View className="flex-row justify-around">
            <Pressable
              onPress={() => {
                onEditCard(card)
                setSelectedCard(null)
              }}
              className="flex-1 flex-row items-center justify-center bg-blue-500 py-2 px-4 rounded-lg mx-1"
              {...getAccessibilityProps('Edit emergency card', '', 'button')}
            >
              <Text className="text-white font-semibold mr-2">✏️</Text>
              <Text className="text-white font-semibold">Edit</Text>
            </Pressable>

            <Pressable
              onPress={() => handleActivatePress(card)}
              className={`flex-1 flex-row items-center justify-center py-2 px-4 rounded-lg mx-1 ${
                card.is_active ? 'bg-orange-500' : 'bg-green-500'
              }`}
              {...getAccessibilityProps(
                card.is_active ? 'Deactivate emergency card' : 'Activate emergency card',
                '',
                'button'
              )}
            >
              <Text className="text-white font-semibold mr-2">
                {card.is_active ? '⏸️' : '▶️'}
              </Text>
              <Text className="text-white font-semibold">
                {card.is_active ? 'Deactivate' : 'Activate'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleDeletePress(card)}
              className="flex-1 flex-row items-center justify-center bg-red-500 py-2 px-4 rounded-lg mx-1"
              {...getAccessibilityProps('Delete emergency card', '', 'button')}
            >
              <Text className="text-white font-semibold mr-2">🗑️</Text>
              <Text className="text-white font-semibold">Delete</Text>
            </Pressable>
          </View>
          
          <Pressable
            onPress={() => setSelectedCard(null)}
            className="mt-2 py-1 px-4 items-center"
            {...getAccessibilityProps('Cancel actions', '', 'button')}
          >
            <Text className="text-gray-600 text-sm">Cancel</Text>
          </Pressable>
        </View>
      )}
    </View>
  )

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-4xl mb-4">⏳</Text>
        <Text className="text-gray-600 text-base">Loading emergency cards...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-gray-800 text-lg font-bold">Emergency Cards</Text>
            <Text className="text-gray-600 text-sm">
              {displayCards.length} card{displayCards.length !== 1 ? 's' : ''} 
              {!showInactive && cards.some(c => !c.is_active) && ' (active only)'}
            </Text>
          </View>
          
          <SafetyButton
            title="New Card"
            variant="primary"
            size="sm"
            onPress={onCreateNew}
            icon="+"
          />
        </View>
      </View>

      {sortedCards.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={sortedCards}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          {...getAccessibilityProps('Emergency cards list', 'Swipe to scroll through cards')}
        />
      )}

      {/* Critical cards count indicator */}
      {sortedCards.length > 0 && (
        <View className="bg-red-600 px-4 py-2">
          <Text className="text-white text-center text-sm font-semibold">
            {sortedCards.filter(c => c.severity_level === 'life_threatening').length} Life-Threatening • {' '}
            {sortedCards.filter(c => c.severity_level === 'severe').length} Severe • {' '}
            {sortedCards.filter(c => !c.is_active).length} Inactive
          </Text>
        </View>
      )}
    </View>
  )
}

export default EmergencyCardList