import React, { useState } from 'react'
import { View } from 'react-native'
import { EmergencyCardManagementScreen } from '../emergency/EmergencyCardManagementScreen'
import { EmergencyQuickAccessScreen } from '../emergency/EmergencyQuickAccessScreen'
import { useEmergencyCards } from '../../hooks/useEmergencyCards'

export const EmergencyScreen: React.FC = () => {
  const [showQuickAccess, setShowQuickAccess] = useState(false)
  const { criticalCards, hasLifeThreateningCards } = useEmergencyCards()

  const handleCreateCard = () => {
    setShowQuickAccess(false)
    // The management screen will handle creation
  }

  if (showQuickAccess) {
    return (
      <EmergencyQuickAccessScreen
        onClose={() => setShowQuickAccess(false)}
        onCreateCard={handleCreateCard}
      />
    )
  }

  return (
    <View className="flex-1">
      <EmergencyCardManagementScreen />
    </View>
  )
}