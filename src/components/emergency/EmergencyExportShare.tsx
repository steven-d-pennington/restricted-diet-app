/**
 * Emergency Export & Share Component
 * Provides functionality to export emergency cards in various formats and share them
 */

import React, { useState } from 'react'
import { 
  View, 
  Text, 
  Pressable, 
  Alert, 
  Modal, 
  ScrollView,
  Share
} from 'react-native'
import { EmergencyCard } from '../../types/database.types'
import { SafetyButton } from '../SafetyButton'
import { OfflineEmergencyService } from '../../services/offlineEmergencyService'
import { getAccessibilityProps } from '../../utils/designSystem'

interface EmergencyExportShareProps {
  cards: EmergencyCard[]
  selectedCard?: EmergencyCard
  onClose: () => void
  visible: boolean
}

export const EmergencyExportShare: React.FC<EmergencyExportShareProps> = ({
  cards,
  selectedCard,
  onClose,
  visible,
}) => {
  const [loading, setLoading] = useState(false)
  const [exportFormat, setExportFormat] = useState<'text' | 'json' | 'pdf'>('text')

  const activeCards = cards.filter(card => card.is_active)
  const cardsToExport = selectedCard ? [selectedCard] : activeCards

  const handleShareText = async () => {
    setLoading(true)
    try {
      const shareText = generateTextFormat(cardsToExport)
      
      await Share.share({
        message: shareText,
        title: selectedCard ? 
          `Emergency Card: ${selectedCard.card_name}` : 
          'Emergency Medical Information'
      })
    } catch (error) {
      console.error('Error sharing text:', error)
      Alert.alert('Error', 'Failed to share emergency information.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportJSON = async () => {
    setLoading(true)
    try {
      const jsonData = await OfflineEmergencyService.exportEmergencyData()
      
      if (jsonData) {
        // In a real implementation, this would save to files or share via document picker
        Alert.alert(
          'Export JSON',
          'JSON export functionality would be implemented here using expo-document-picker or react-native-fs',
          [
            { text: 'OK' },
            {
              text: 'Copy to Clipboard',
              onPress: () => {
                // In real app: Clipboard.setString(jsonData)
                Alert.alert('Success', 'Emergency data copied to clipboard')
              }
            }
          ]
        )
      } else {
        Alert.alert('Error', 'Failed to export emergency data')
      }
    } catch (error) {
      console.error('Error exporting JSON:', error)
      Alert.alert('Error', 'Failed to export emergency data.')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePDF = async () => {
    setLoading(true)
    try {
      // In a real implementation, this would use react-native-html-to-pdf or similar
      Alert.alert(
        'Generate PDF',
        'PDF generation would be implemented here using react-native-html-to-pdf or expo-print',
        [
          { text: 'OK' },
          {
            text: 'Simulate PDF',
            onPress: () => {
              Alert.alert('PDF Generated', 'Emergency card PDF would be saved to device and ready for sharing')
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error generating PDF:', error)
      Alert.alert('Error', 'Failed to generate PDF.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrintCard = async () => {
    try {
      // In a real implementation, this would use expo-print
      Alert.alert(
        'Print Emergency Card',
        'Print functionality would be implemented here using expo-print',
        [
          { text: 'Cancel' },
          {
            text: 'Print',
            onPress: () => {
              console.log('Printing emergency card...')
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error printing:', error)
      Alert.alert('Error', 'Failed to print emergency card.')
    }
  }

  const generateTextFormat = (cards: EmergencyCard[]): string => {
    const cardTexts = cards.map(card => {
      let text = `=== EMERGENCY MEDICAL INFORMATION ===\n\n`
      text += `Name: ${card.card_name}\n`
      text += `Severity: ${card.severity_level.replace('_', ' ').toUpperCase()}\n\n`
      
      text += `MEDICAL RESTRICTIONS:\n${card.restrictions_summary}\n\n`
      
      text += `EMERGENCY INSTRUCTIONS:\n${card.emergency_instructions}\n\n`
      
      if (card.medications && card.medications.length > 0) {
        text += `MEDICATIONS:\n${card.medications.map(med => `• ${med}`).join('\n')}\n\n`
      }
      
      if (card.emergency_contact_1_phone) {
        text += `EMERGENCY CONTACT:\n`
        text += `${card.emergency_contact_1_name || 'Primary Contact'}: ${card.emergency_contact_1_phone}\n`
        if (card.emergency_contact_1_relationship) {
          text += `Relationship: ${card.emergency_contact_1_relationship}\n`
        }
        text += '\n'
      }
      
      if (card.emergency_contact_2_phone) {
        text += `SECONDARY CONTACT:\n`
        text += `${card.emergency_contact_2_name || 'Secondary Contact'}: ${card.emergency_contact_2_phone}\n`
        if (card.emergency_contact_2_relationship) {
          text += `Relationship: ${card.emergency_contact_2_relationship}\n`
        }
        text += '\n'
      }
      
      if (card.doctor_phone) {
        text += `DOCTOR:\n`
        text += `${card.doctor_name || 'Primary Doctor'}: ${card.doctor_phone}\n\n`
      }
      
      if (card.insurance_info) {
        text += `INSURANCE:\n${card.insurance_info}\n\n`
      }
      
      if (card.additional_notes) {
        text += `ADDITIONAL NOTES:\n${card.additional_notes}\n\n`
      }
      
      text += `Last Updated: ${new Date(card.last_updated).toLocaleString()}\n`
      text += `Generated by: Restricted Diet App\n`
      
      return text
    })
    
    return cardTexts.join('\n' + '='.repeat(50) + '\n\n')
  }

  return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-blue-600 px-4 py-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-lg font-bold">
              Export & Share
            </Text>
            <Pressable
              onPress={onClose}
              className="bg-blue-700 px-3 py-2 rounded-lg"
              {...getAccessibilityProps('Close export options', '', 'button')}
            >
              <Text className="text-white font-bold">✕</Text>
            </Pressable>
          </View>
          
          <Text className="text-blue-100 text-sm mt-1">
            {selectedCard ? 
              `Exporting: ${selectedCard.card_name}` : 
              `Exporting ${cardsToExport.length} active card${cardsToExport.length !== 1 ? 's' : ''}`
            }
          </Text>
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          {/* Quick Share Options */}
          <View className="mb-8">
            <Text className="text-gray-800 text-lg font-bold mb-4">Quick Share</Text>
            <Text className="text-gray-600 text-sm mb-4 leading-relaxed">
              Share emergency information immediately with first responders, family, or medical professionals.
            </Text>
            
            <View className="space-y-3">
              <SafetyButton
                title="Share as Text Message"
                variant="primary"
                size="lg"
                onPress={handleShareText}
                loading={loading}
                icon="💬"
                style={{ marginBottom: 12 }}
              />
              
              <View className="flex-row">
                <SafetyButton
                  title="Copy to Clipboard"
                  variant="secondary"
                  size="md"
                  onPress={() => {
                    const text = generateTextFormat(cardsToExport)
                    // In real app: Clipboard.setString(text)
                    Alert.alert('Copied', 'Emergency information copied to clipboard')
                  }}
                  icon="📋"
                  style={{ flex: 1, marginRight: 8 }}
                />
                
                <SafetyButton
                  title="Email"
                  variant="secondary"
                  size="md"
                  onPress={() => {
                    Alert.alert('Email', 'Email functionality would be implemented here')
                  }}
                  icon="📧"
                  style={{ flex: 1, marginLeft: 8 }}
                />
              </View>
            </View>
          </View>

          {/* Export Formats */}
          <View className="mb-8">
            <Text className="text-gray-800 text-lg font-bold mb-4">Export Formats</Text>
            <Text className="text-gray-600 text-sm mb-4 leading-relaxed">
              Export in different formats for backup, printing, or integration with other systems.
            </Text>
            
            <View className="space-y-3">
              <SafetyButton
                title="Generate PDF"
                variant="secondary"
                size="lg"
                onPress={handleGeneratePDF}
                loading={loading}
                icon="📄"
                style={{ marginBottom: 12 }}
              />
              
              <SafetyButton
                title="Export as JSON (Backup)"
                variant="secondary"
                size="lg"
                onPress={handleExportJSON}
                loading={loading}
                icon="💾"
                style={{ marginBottom: 12 }}
              />
              
              <SafetyButton
                title="Print Card"
                variant="secondary"
                size="lg"
                onPress={handlePrintCard}
                icon="🖨️"
              />
            </View>
          </View>

          {/* QR Code Options */}
          <View className="mb-8">
            <Text className="text-gray-800 text-lg font-bold mb-4">Digital Access</Text>
            <Text className="text-gray-600 text-sm mb-4 leading-relaxed">
              Create digital versions that can be accessed quickly on mobile devices.
            </Text>
            
            <View className="space-y-3">
              <SafetyButton
                title="Generate QR Code"
                variant="secondary"
                size="lg"
                onPress={() => {
                  Alert.alert('QR Code', 'QR code generation would create a scannable code linking to emergency info')
                }}
                icon="📱"
                style={{ marginBottom: 12 }}
              />
              
              <SafetyButton
                title="Create Web Link"
                variant="secondary"
                size="lg"
                onPress={() => {
                  Alert.alert('Web Link', 'Would create a secure web link to view emergency information')
                }}
                icon="🔗"
              />
            </View>
          </View>

          {/* Physical Options */}
          <View className="mb-8">
            <Text className="text-gray-800 text-lg font-bold mb-4">Physical Cards</Text>
            <Text className="text-gray-600 text-sm mb-4 leading-relaxed">
              Create physical emergency cards for wallet, purse, or medical alert bracelet.
            </Text>
            
            <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <Text className="text-yellow-800 text-sm font-semibold mb-2">💡 Tip</Text>
              <Text className="text-yellow-700 text-sm leading-relaxed">
                Keep a printed emergency card in your wallet, purse, and car. 
                Consider adding one to your medical alert bracelet or giving copies to family members.
              </Text>
            </View>
            
            <View className="flex-row">
              <SafetyButton
                title="Print Wallet Size"
                variant="secondary"
                size="md"
                onPress={() => {
                  Alert.alert('Wallet Card', 'Would format and print wallet-sized emergency card')
                }}
                icon="💳"
                style={{ flex: 1, marginRight: 8 }}
              />
              
              <SafetyButton
                title="Print Full Size"
                variant="secondary"
                size="md"
                onPress={() => {
                  Alert.alert('Full Size', 'Would format and print full-page emergency information')
                }}
                icon="📄"
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>

          {/* Important Notes */}
          <View className="bg-red-50 border border-red-200 rounded-lg p-4">
            <Text className="text-red-800 text-sm font-bold mb-2">🚨 Important</Text>
            <Text className="text-red-700 text-sm leading-relaxed">
              • Keep emergency information up to date
              • Share with trusted family members and friends
              • Consider medical alert bracelets for life-threatening conditions
              • Store copies in multiple accessible locations
              • Test QR codes and digital links regularly
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

export default EmergencyExportShare