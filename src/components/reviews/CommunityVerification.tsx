/**
 * Community Verification Component
 * 
 * SAFETY CRITICAL: Community-driven review verification and credibility system
 * Enables users to vote on review helpfulness and report false information
 */

import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, Alert, Modal, TextInput } from 'react-native'
import {
  RestaurantReviewWithDetails,
  ReviewInteractionSummary,
  ExpertReviewerProfile,
  ReviewCredibilityScore
} from '../../types/database.types'
import ReviewService from '../../services/reviewService'
import { useAuth } from '../../contexts/AuthContext'

interface CommunityVerificationProps {
  review: RestaurantReviewWithDetails
  interactionSummary: ReviewInteractionSummary
  onInteractionUpdate: () => void
  compact?: boolean
}

interface ReportModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: (category: string, reason: string, details?: string) => void
}

const REPORT_CATEGORIES = [
  { value: 'false_information', label: 'False Information', description: 'Contains incorrect or misleading information' },
  { value: 'inappropriate_content', label: 'Inappropriate Content', description: 'Contains offensive or inappropriate language' },
  { value: 'spam', label: 'Spam', description: 'Appears to be spam or promotional content' },
  { value: 'dangerous_advice', label: 'Dangerous Advice', description: 'Provides potentially harmful safety advice' },
  { value: 'fake_review', label: 'Fake Review', description: 'Appears to be a fake or fraudulent review' },
  { value: 'duplicate', label: 'Duplicate Review', description: 'This review appears to be a duplicate' }
]

function ReportModal({ visible, onClose, onSubmit }: ReportModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [reason, setReason] = useState('')
  const [additionalDetails, setAdditionalDetails] = useState('')

  const handleSubmit = () => {
    if (!selectedCategory || !reason.trim()) {
      Alert.alert('Missing Information', 'Please select a category and provide a reason.')
      return
    }

    onSubmit(selectedCategory, reason, additionalDetails.trim() || undefined)
    
    // Reset form
    setSelectedCategory('')
    setReason('')
    setAdditionalDetails('')
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        <View className="p-4 border-b border-gray-200">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-bold text-gray-900">Report Review</Text>
            <Pressable onPress={onClose}>
              <Text className="text-lg text-gray-500">✕</Text>
            </Pressable>
          </View>
        </View>

        <View className="flex-1 p-4">
          <Text className="text-lg font-medium text-gray-900 mb-4">
            Why are you reporting this review?
          </Text>

          <View className="space-y-3 mb-6">
            {REPORT_CATEGORIES.map(category => (
              <Pressable
                key={category.value}
                onPress={() => setSelectedCategory(category.value)}
                className={`p-4 rounded-lg border ${
                  selectedCategory === category.value
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 bg-white'
                }`}
              >
                <Text className={`font-medium ${
                  selectedCategory === category.value ? 'text-red-800' : 'text-gray-900'
                }`}>
                  {category.label}
                </Text>
                <Text className={`text-sm mt-1 ${
                  selectedCategory === category.value ? 'text-red-700' : 'text-gray-600'
                }`}>
                  {category.description}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-lg font-medium text-gray-900 mb-2">
            Please explain your concern:
          </Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Describe why you're reporting this review..."
            multiline
            numberOfLines={3}
            className="border border-gray-300 rounded-lg p-3 text-gray-900 mb-4"
            style={{ textAlignVertical: 'top' }}
          />

          <Text className="text-lg font-medium text-gray-900 mb-2">
            Additional details (optional):
          </Text>
          <TextInput
            value={additionalDetails}
            onChangeText={setAdditionalDetails}
            placeholder="Any additional context or evidence..."
            multiline
            numberOfLines={2}
            className="border border-gray-300 rounded-lg p-3 text-gray-900"
            style={{ textAlignVertical: 'top' }}
          />
        </View>

        <View className="p-4 border-t border-gray-200 flex-row space-x-3">
          <Pressable
            onPress={onClose}
            className="flex-1 py-3 rounded-lg border border-gray-300 bg-gray-50"
          >
            <Text className="text-center text-gray-700 font-medium">Cancel</Text>
          </Pressable>
          
          <Pressable
            onPress={handleSubmit}
            className="flex-1 py-3 rounded-lg bg-red-600"
          >
            <Text className="text-center text-white font-medium">Submit Report</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

export default function CommunityVerification({
  review,
  interactionSummary,
  onInteractionUpdate,
  compact = false
}: CommunityVerificationProps) {
  
  const { user } = useAuth()
  const [showReportModal, setShowReportModal] = useState(false)
  const [processing, setProcessing] = useState(false)

  const isExpertReview = !!review.user_profile.expert_profile?.credentials_verified
  const credibilityScore = review.credibility_score?.credibility_score || 50
  const verificationLevel = review.credibility_score?.verification_level || 'unverified'
  const userInteraction = interactionSummary.user_interaction

  const handleInteraction = async (type: 'helpful' | 'not_helpful' | 'thank') => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to interact with reviews.')
      return
    }

    if (processing) return

    try {
      setProcessing(true)
      
      await ReviewService.submitReviewInteraction(review.id, { type })
      onInteractionUpdate()

      // Show confirmation for thank you
      if (type === 'thank') {
        Alert.alert(
          'Thank You Sent',
          'Your appreciation has been sent to the reviewer.'
        )
      }

    } catch (error) {
      console.error('Interaction error:', error)
      Alert.alert('Error', 'Failed to submit interaction. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleReport = async (category: string, reason: string, details?: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to report reviews.')
      return
    }

    try {
      setProcessing(true)
      
      await ReviewService.submitReviewInteraction(review.id, {
        type: 'report',
        reason: category,
        explanation: `${reason}${details ? '\n\nAdditional details: ' + details : ''}`
      })

      setShowReportModal(false)
      onInteractionUpdate()

      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep our community safe. We\'ll review your report promptly.'
      )

    } catch (error) {
      console.error('Report error:', error)
      Alert.alert('Error', 'Failed to submit report. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const renderCredibilityIndicator = () => {
    const getCredibilityColor = (score: number) => {
      if (score >= 80) return 'text-green-600'
      if (score >= 60) return 'text-yellow-600'
      if (score >= 40) return 'text-orange-600'
      return 'text-red-600'
    }

    const getCredibilityLabel = (score: number) => {
      if (score >= 80) return 'Highly Credible'
      if (score >= 60) return 'Credible'
      if (score >= 40) return 'Moderately Credible'
      return 'Low Credibility'
    }

    return (
      <View className="flex-row items-center">
        <View className="mr-3">
          <Text className={`text-lg font-bold ${getCredibilityColor(credibilityScore)}`}>
            {Math.round(credibilityScore)}%
          </Text>
          <Text className="text-xs text-gray-500 text-center">
            credible
          </Text>
        </View>
        <View className="flex-1">
          <Text className={`text-sm font-medium ${getCredibilityColor(credibilityScore)}`}>
            {getCredibilityLabel(credibilityScore)}
          </Text>
          <Text className="text-xs text-gray-600">
            Based on community feedback
          </Text>
        </View>
      </View>
    )
  }

  const renderVerificationBadges = () => {
    return (
      <View className="flex-row flex-wrap mt-2">
        {isExpertReview && (
          <View className="mr-2 mb-2 px-2 py-1 bg-purple-100 rounded">
            <Text className="text-xs font-medium text-purple-800">
              ✓ Expert Review
            </Text>
          </View>
        )}
        
        {verificationLevel === 'expert_verified' && (
          <View className="mr-2 mb-2 px-2 py-1 bg-green-100 rounded">
            <Text className="text-xs font-medium text-green-800">
              ✓ Expert Verified
            </Text>
          </View>
        )}
        
        {verificationLevel === 'restaurant_confirmed' && (
          <View className="mr-2 mb-2 px-2 py-1 bg-blue-100 rounded">
            <Text className="text-xs font-medium text-blue-800">
              ✓ Restaurant Confirmed
            </Text>
          </View>
        )}
        
        {interactionSummary.helpful_count >= 5 && (
          <View className="mr-2 mb-2 px-2 py-1 bg-yellow-100 rounded">
            <Text className="text-xs font-medium text-yellow-800">
              ✓ Community Validated
            </Text>
          </View>
        )}
      </View>
    )
  }

  const renderInteractionButtons = () => {
    if (compact) return null

    return (
      <View className="mt-4 pt-3 border-t border-gray-200">
        <View className="flex-row justify-between items-center">
          <View className="flex-row space-x-3">
            <Pressable
              onPress={() => handleInteraction('helpful')}
              disabled={processing}
              className={`flex-row items-center px-3 py-2 rounded-lg ${
                userInteraction?.type === 'helpful'
                  ? 'bg-green-100'
                  : 'bg-gray-100'
              } ${processing ? 'opacity-50' : ''}`}
            >
              <Text className="text-sm mr-1">👍</Text>
              <Text className={`text-sm font-medium ${
                userInteraction?.type === 'helpful'
                  ? 'text-green-800'
                  : 'text-gray-700'
              }`}>
                {interactionSummary.helpful_count}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleInteraction('not_helpful')}
              disabled={processing}
              className={`flex-row items-center px-3 py-2 rounded-lg ${
                userInteraction?.type === 'not_helpful'
                  ? 'bg-red-100'
                  : 'bg-gray-100'
              } ${processing ? 'opacity-50' : ''}`}
            >
              <Text className="text-sm mr-1">👎</Text>
              <Text className={`text-sm font-medium ${
                userInteraction?.type === 'not_helpful'
                  ? 'text-red-800'
                  : 'text-gray-700'
              }`}>
                {interactionSummary.not_helpful_count}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleInteraction('thank')}
              disabled={processing}
              className={`flex-row items-center px-3 py-2 rounded-lg ${
                userInteraction?.type === 'thank'
                  ? 'bg-blue-100'
                  : 'bg-gray-100'
              } ${processing ? 'opacity-50' : ''}`}
            >
              <Text className="text-sm mr-1">🙏</Text>
              <Text className={`text-sm font-medium ${
                userInteraction?.type === 'thank'
                  ? 'text-blue-800'
                  : 'text-gray-700'
              }`}>
                {interactionSummary.thank_count}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => setShowReportModal(true)}
            disabled={processing}
            className={`px-3 py-2 rounded-lg bg-gray-100 ${processing ? 'opacity-50' : ''}`}
          >
            <Text className="text-sm text-gray-700">Report</Text>
          </Pressable>
        </View>

        {/* Helpfulness ratio */}
        {(interactionSummary.helpful_count > 0 || interactionSummary.not_helpful_count > 0) && (
          <View className="mt-3">
            <Text className="text-xs text-gray-600 mb-1">
              Helpfulness: {Math.round(interactionSummary.helpfulness_ratio * 100)}% of users found this helpful
            </Text>
            <View className="w-full h-2 bg-gray-200 rounded-full">
              <View
                className="h-2 bg-green-500 rounded-full"
                style={{ width: `${interactionSummary.helpfulness_ratio * 100}%` }}
              />
            </View>
          </View>
        )}
      </View>
    )
  }

  return (
    <View className="bg-gray-50 rounded-lg p-3 mt-3">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          {renderCredibilityIndicator()}
          {!compact && renderVerificationBadges()}
        </View>
        
        {compact && (
          <View className="flex-row space-x-2">
            <Pressable
              onPress={() => handleInteraction('helpful')}
              disabled={processing}
              className={`px-2 py-1 rounded ${
                userInteraction?.type === 'helpful' ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              <Text className="text-xs">👍 {interactionSummary.helpful_count}</Text>
            </Pressable>
            
            <Pressable
              onPress={() => setShowReportModal(true)}
              disabled={processing}
              className="px-2 py-1 rounded bg-gray-100"
            >
              <Text className="text-xs">⚠️</Text>
            </Pressable>
          </View>
        )}
      </View>

      {renderInteractionButtons()}

      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReport}
      />
    </View>
  )
}