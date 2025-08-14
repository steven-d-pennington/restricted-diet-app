/**
 * Emergency Photo Capture Component
 * Allows users to capture and manage profile photos for emergency cards
 */

import React, { useState } from 'react'
import { 
  View, 
  Text, 
  Pressable, 
  Image, 
  Alert, 
  Modal,
  Dimensions,
  Platform 
} from 'react-native'
import { SafetyButton } from '../SafetyButton'
import { getAccessibilityProps } from '../../utils/designSystem'

interface EmergencyPhotoCaptureProps {
  currentPhotoUrl?: string | null
  onPhotoSelected: (photoUri: string) => void
  onPhotoRemoved: () => void
  disabled?: boolean
  showLabel?: boolean
}

export const EmergencyPhotoCapture: React.FC<EmergencyPhotoCaptureProps> = ({
  currentPhotoUrl,
  onPhotoSelected,
  onPhotoRemoved,
  disabled = false,
  showLabel = true,
}) => {
  const [showModal, setShowModal] = useState(false)
  const [imageError, setImageError] = useState(false)

  const screenWidth = Dimensions.get('window').width

  const handleCameraPress = () => {
    if (disabled) return
    setShowModal(true)
  }

  const handleTakePhoto = async () => {
    setShowModal(false)
    
    try {
      if (Platform.OS === 'web') {
        // Web fallback - use HTML5 file input with camera capture
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.capture = 'environment' // Use back camera if available
        
        input.onchange = (event: any) => {
          const file = event.target.files[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
              if (e.target?.result) {
                onPhotoSelected(e.target.result as string)
              }
            }
            reader.readAsDataURL(file)
          }
        }
        
        input.click()
      } else {
        // Mobile implementation would use expo-camera or react-native-image-picker
        Alert.alert(
          'Photo Capture',
          'Camera functionality would be implemented here using expo-camera or react-native-image-picker',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Simulate Photo',
              onPress: () => {
                // Simulate a photo being taken
                const simulatedPhotoUri = `https://picsum.photos/300/300?random=${Date.now()}`
                onPhotoSelected(simulatedPhotoUri)
              }
            }
          ]
        )
      }
    } catch (error) {
      console.error('Error taking photo:', error)
      Alert.alert('Error', 'Failed to take photo. Please try again.')
    }
  }

  const handleSelectFromGallery = async () => {
    setShowModal(false)
    
    try {
      if (Platform.OS === 'web') {
        // Web fallback - use HTML5 file input
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        
        input.onchange = (event: any) => {
          const file = event.target.files[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
              if (e.target?.result) {
                onPhotoSelected(e.target.result as string)
              }
            }
            reader.readAsDataURL(file)
          }
        }
        
        input.click()
      } else {
        // Mobile implementation would use expo-image-picker
        Alert.alert(
          'Select Photo',
          'Photo gallery functionality would be implemented here using expo-image-picker',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Simulate Selection',
              onPress: () => {
                // Simulate a photo being selected
                const simulatedPhotoUri = `https://picsum.photos/300/300?random=${Date.now()}`
                onPhotoSelected(simulatedPhotoUri)
              }
            }
          ]
        )
      }
    } catch (error) {
      console.error('Error selecting photo:', error)
      Alert.alert('Error', 'Failed to select photo. Please try again.')
    }
  }

  const handleRemovePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo from your emergency card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: onPhotoRemoved
        }
      ]
    )
  }

  const photoSize = Math.min(screenWidth * 0.4, 150)

  return (
    <View className="items-center">
      {showLabel && (
        <Text className="text-gray-800 font-semibold text-base mb-3">Profile Photo</Text>
      )}
      
      <View className="items-center mb-4">
        {/* Photo Display */}
        <View 
          className="rounded-full border-4 border-gray-300 bg-gray-100 items-center justify-center"
          style={{ width: photoSize, height: photoSize }}
        >
          {currentPhotoUrl && !imageError ? (
            <Image
              source={{ uri: currentPhotoUrl }}
              style={{ width: photoSize - 8, height: photoSize - 8 }}
              className="rounded-full"
              onError={() => setImageError(true)}
              {...getAccessibilityProps('Profile photo', '')}
            />
          ) : (
            <View className="items-center justify-center">
              <Text className="text-6xl mb-2">👤</Text>
              <Text className="text-gray-600 text-sm text-center px-4">
                {currentPhotoUrl && imageError ? 'Photo failed to load' : 'No photo added'}
              </Text>
            </View>
          )}
        </View>

        {/* Photo Actions */}
        <View className="flex-row mt-3">
          <Pressable
            onPress={handleCameraPress}
            disabled={disabled}
            className={`${disabled ? 'bg-gray-300' : 'bg-blue-500'} px-4 py-2 rounded-lg mr-2`}
            {...getAccessibilityProps('Add or change profile photo', '', 'button')}
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-2">📷</Text>
              <Text className={`font-semibold ${disabled ? 'text-gray-500' : 'text-white'}`}>
                {currentPhotoUrl ? 'Change' : 'Add Photo'}
              </Text>
            </View>
          </Pressable>

          {currentPhotoUrl && !disabled && (
            <Pressable
              onPress={handleRemovePhoto}
              className="bg-red-500 px-4 py-2 rounded-lg"
              {...getAccessibilityProps('Remove profile photo', '', 'button')}
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-2">🗑️</Text>
                <Text className="text-white font-semibold">Remove</Text>
              </View>
            </Pressable>
          )}
        </View>
      </View>

      {/* Photo Options Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-center items-center">
          <View className="bg-white rounded-lg p-6 mx-8 w-80">
            <Text className="text-gray-800 text-lg font-bold mb-4 text-center">
              Add Profile Photo
            </Text>
            
            <Text className="text-gray-600 text-sm mb-6 text-center leading-relaxed">
              Adding a photo helps first responders quickly identify you in emergency situations.
              {Platform.OS === 'web' && '\n\nOn web browsers, you can upload a photo from your device.'}
            </Text>

            <View className="space-y-3">
              <SafetyButton
                title="Take Photo with Camera"
                variant="primary"
                size="md"
                onPress={handleTakePhoto}
                icon="📷"
                style={{ marginBottom: 12 }}
              />
              
              <SafetyButton
                title="Select from Gallery"
                variant="secondary"
                size="md"
                onPress={handleSelectFromGallery}
                icon="🖼️"
                style={{ marginBottom: 12 }}
              />
              
              <SafetyButton
                title="Cancel"
                variant="secondary"
                size="md"
                onPress={() => setShowModal(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Help Text */}
      {showLabel && (
        <Text className="text-gray-500 text-xs text-center px-6 leading-relaxed">
          A clear photo helps first responders identify you quickly. 
          Choose a recent photo where your face is clearly visible.
        </Text>
      )}
    </View>
  )
}

export default EmergencyPhotoCapture