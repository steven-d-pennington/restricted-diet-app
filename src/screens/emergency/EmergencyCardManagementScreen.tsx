/**
 * Emergency Card Management Screen
 * Main screen for creating, editing, and managing emergency cards
 */

import React, { useState, useEffect } from 'react'
import { View, Alert } from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import { useEmergencyCards } from '../../hooks/useEmergencyCards'
import { useUserRestrictions } from '../../hooks/useUserProfile'
import { EmergencyCardList } from '../../components/emergency/EmergencyCardList'
import { EmergencyCardEditor } from '../../components/emergency/EmergencyCardEditor'
import { EmergencyCardViewer } from '../../components/emergency/EmergencyCardViewer'
import { LoadingScreen } from '../../components/LoadingScreen'
import {
  EmergencyCard,
  EmergencyCardInsert,
  EmergencyCardUpdate,
} from '../../types/database.types'

type ScreenMode = 'list' | 'create' | 'edit' | 'view'

interface EmergencyCardManagementScreenProps {
  familyMemberId?: string
  onBack?: () => void
}

export const EmergencyCardManagementScreen: React.FC<EmergencyCardManagementScreenProps> = ({
  familyMemberId,
  onBack,
}) => {
  const { user } = useAuth()
  const { restrictions } = useUserRestrictions()
  
  const {
    emergencyCards,
    activeCards,
    loading,
    error,
    createEmergencyCard,
    updateEmergencyCard,
    deleteEmergencyCard,
    activateCard,
    deactivateCard,
    generateCardFromRestrictions,
    generateQRCode,
    refreshCards,
  } = useEmergencyCards(familyMemberId)

  const [screenMode, setScreenMode] = useState<ScreenMode>('list')
  const [selectedCard, setSelectedCard] = useState<EmergencyCard | null>(null)
  const [showInactiveCards, setShowInactiveCards] = useState(false)

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error)
    }
  }, [error])

  const handleCreateCard = () => {
    setSelectedCard(null)
    setScreenMode('create')
  }

  const handleEditCard = (card: EmergencyCard) => {
    setSelectedCard(card)
    setScreenMode('edit')
  }

  const handleViewCard = (card: EmergencyCard) => {
    setSelectedCard(card)
    setScreenMode('view')
  }

  const handleSaveCard = async (cardData: EmergencyCardInsert | EmergencyCardUpdate): Promise<boolean> => {
    try {
      let success = false

      if (screenMode === 'create') {
        success = await createEmergencyCard(cardData as EmergencyCardInsert, familyMemberId)
      } else if (screenMode === 'edit' && selectedCard) {
        success = await updateEmergencyCard(selectedCard.id, cardData as EmergencyCardUpdate)
      }

      if (success) {
        setScreenMode('list')
        setSelectedCard(null)
        return true
      } else {
        Alert.alert('Error', 'Failed to save emergency card. Please try again.')
        return false
      }
    } catch (error) {
      console.error('Error saving emergency card:', error)
      Alert.alert('Error', 'An unexpected error occurred while saving the card.')
      return false
    }
  }

  const handleDeleteCard = async (card: EmergencyCard) => {
    try {
      const success = await deleteEmergencyCard(card.id)
      if (!success) {
        Alert.alert('Error', 'Failed to delete emergency card. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting emergency card:', error)
      Alert.alert('Error', 'An unexpected error occurred while deleting the card.')
    }
  }

  const handleActivateCard = async (card: EmergencyCard) => {
    try {
      const success = await activateCard(card.id)
      if (!success) {
        Alert.alert('Error', 'Failed to activate emergency card. Please try again.')
      }
    } catch (error) {
      console.error('Error activating emergency card:', error)
      Alert.alert('Error', 'An unexpected error occurred while activating the card.')
    }
  }

  const handleDeactivateCard = async (card: EmergencyCard) => {
    try {
      const success = await deactivateCard(card.id)
      if (!success) {
        Alert.alert('Error', 'Failed to deactivate emergency card. Please try again.')
      }
    } catch (error) {
      console.error('Error deactivating emergency card:', error)
      Alert.alert('Error', 'An unexpected error occurred while deactivating the card.')
    }
  }

  const handleGenerateFromRestrictions = (): EmergencyCardInsert => {
    return generateCardFromRestrictions(restrictions)
  }

  const handleGenerateQR = async (): Promise<string | null> => {
    if (!selectedCard) return null
    
    try {
      return await generateQRCode(selectedCard.id)
    } catch (error) {
      console.error('Error generating QR code:', error)
      Alert.alert('Error', 'Failed to generate QR code.')
      return null
    }
  }

  const handleBackToList = () => {
    setScreenMode('list')
    setSelectedCard(null)
  }

  const handleShare = async () => {
    if (!selectedCard) return

    try {
      // In a real implementation, this would use platform-specific sharing
      console.log('Sharing emergency card:', selectedCard.card_name)
      Alert.alert('Share', 'Emergency card sharing would be implemented here.')
    } catch (error) {
      console.error('Error sharing emergency card:', error)
      Alert.alert('Error', 'Failed to share emergency card.')
    }
  }

  const handleCall = (phoneNumber: string, contactName?: string) => {
    // In a real implementation, this would initiate a phone call
    Alert.alert(
      'Call Contact',
      `Call ${contactName || 'contact'} at ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call',
          onPress: () => {
            console.log('Calling:', phoneNumber)
            // Linking.openURL(`tel:${phoneNumber}`)
          }
        }
      ]
    )
  }

  if (loading && emergencyCards.length === 0) {
    return <LoadingScreen message="Loading emergency cards..." />
  }

  // Render different screens based on mode
  switch (screenMode) {
    case 'create':
    case 'edit':
      return (
        <EmergencyCardEditor
          card={selectedCard}
          userRestrictions={restrictions}
          onSave={handleSaveCard}
          onCancel={handleBackToList}
          onGenerateFromRestrictions={restrictions.length > 0 ? handleGenerateFromRestrictions : undefined}
          loading={loading}
          familyMemberId={familyMemberId}
        />
      )

    case 'view':
      return selectedCard ? (
        <EmergencyCardViewer
          card={selectedCard}
          onClose={handleBackToList}
          onEdit={() => handleEditCard(selectedCard)}
          onGenerateQR={handleGenerateQR}
          onShare={handleShare}
          onCall={handleCall}
        />
      ) : null

    case 'list':
    default:
      return (
        <View className="flex-1">
          <EmergencyCardList
            cards={emergencyCards}
            loading={loading}
            onCardPress={handleViewCard}
            onCreateNew={handleCreateCard}
            onEditCard={handleEditCard}
            onDeleteCard={handleDeleteCard}
            onActivateCard={handleActivateCard}
            onDeactivateCard={handleDeactivateCard}
            showInactive={showInactiveCards}
          />
        </View>
      )
  }
}

export default EmergencyCardManagementScreen