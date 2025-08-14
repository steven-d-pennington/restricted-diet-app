/**
 * Create Review Screen
 * 
 * SAFETY CRITICAL: Comprehensive review creation with safety-focused templates
 * Guides users through structured review process with photo evidence and incident reporting
 */

import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, Alert, Modal } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import {
  ReviewTemplate,
  ReviewTemplateStructure,
  ReviewTemplateQuestion,
  ReviewCategory,
  PhotoEvidenceType,
  DietaryRestriction
} from '../../types/database.types'
import type { ReviewCreationData } from '../../services/reviewService'
import type { SafetyIncidentReport as SafetyIncidentReportData } from '../../types/database.types'
import ReviewService from '../../services/reviewService'
import ReviewTemplateService from '../../services/reviewTemplateService'
import PhotoService from '../../services/photoService'
import SafetyIncidentReport from '../../components/reviews/SafetyIncidentReport'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { MainTabParamList } from '../../types/navigation.types'

type Props = NativeStackScreenProps<any>

interface QuestionResponse {
  questionId: string
  value: any
  category?: ReviewCategory
}

export default function CreateReviewScreen({ route, navigation }: Props) {
  const { restaurantId, restaurantName } = (route?.params as any) || {}
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [templates, setTemplates] = useState<ReviewTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ReviewTemplate | null>(null)
  const [userRestrictions, setUserRestrictions] = useState<string[]>([])
  
  // Review data
  const [reviewData, setReviewData] = useState<Partial<ReviewCreationData>>({
    restaurant_id: restaurantId,
    rating: 5,
    category_ratings: [],
    safety_assessments: [],
    photos: [],
    template_responses: []
  })
  
  // Template responses
  const [templateResponses, setTemplateResponses] = useState<{ [key: string]: any }>({})
  
  // Photo uploads
  const [selectedPhotos, setSelectedPhotos] = useState<Array<{
    file: File
    type: PhotoEvidenceType
    caption?: string
    preview: string
  }>>([])
  
  // Incident reporting
  const [showIncidentReport, setShowIncidentReport] = useState(false)
  const [incidentData, setIncidentData] = useState<Partial<SafetyIncidentReportData> | null>(null)

  const totalSteps = selectedTemplate ? 4 : 3

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Load user's dietary restrictions
      const { data: restrictions } = await supabase
        .from('user_restrictions')
        .select('restriction_id')
        .eq('user_id', user?.id)
        .eq('is_active', true)

      const restrictionIds = restrictions?.map(r => r.restriction_id) || []
      setUserRestrictions(restrictionIds)

      // Get recommended templates
      const recommendedTemplates = await ReviewTemplateService.getRecommendedTemplates(restrictionIds)
      setTemplates(recommendedTemplates)

    } catch (error) {
      console.error('Load initial data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (template: ReviewTemplate) => {
    setSelectedTemplate(template)
    setCurrentStep(2)
  }

  const handleSkipTemplate = () => {
    setSelectedTemplate(null)
    setCurrentStep(2)
  }

  const handleQuestionResponse = (questionId: string, value: any, category?: ReviewCategory) => {
    setTemplateResponses(prev => ({ ...prev, [questionId]: value }))
    
    // Update review data based on question type
    if (questionId === 'overall_rating') {
      setReviewData(prev => ({ ...prev, rating: value }))
    } else if (questionId === 'safety_rating') {
      setReviewData(prev => ({ ...prev, safety_rating: value }))
    } else if (category) {
      setReviewData(prev => {
        const existingRatings = prev.category_ratings || []
        const updatedRatings = existingRatings.filter(r => r.category !== category)
        if (typeof value === 'number') {
          updatedRatings.push({ category, rating: value })
        }
        return { ...prev, category_ratings: updatedRatings }
      })
    }
  }

  const handlePhotoAdd = () => {
    // This would typically open a photo picker
    // For now, we'll simulate the functionality
    Alert.alert(
      'Add Photo',
      'What type of photo evidence would you like to add?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Menu Item', onPress: () => addPhotoPlaceholder('menu_item') },
        { text: 'Menu Display', onPress: () => addPhotoPlaceholder('menu_display') },
        { text: 'Ingredient Label', onPress: () => addPhotoPlaceholder('ingredient_label') },
        { text: 'General Photo', onPress: () => addPhotoPlaceholder('general') }
      ]
    )
  }

  const addPhotoPlaceholder = (type: PhotoEvidenceType) => {
    // In a real implementation, this would handle actual photo selection
    const newPhoto = {
      file: new File([], 'placeholder.jpg'),
      type,
      caption: '',
      preview: 'https://via.placeholder.com/300x200'
    }
    setSelectedPhotos(prev => [...prev, newPhoto])
  }

  const handleIncidentAdd = () => {
    setShowIncidentReport(true)
  }

  const handleIncidentSubmit = (incident: SafetyIncidentReportData) => {
    setIncidentData(incident)
    setShowIncidentReport(false)
    // Update review data to reflect incident
    setReviewData(prev => ({
      ...prev,
      incident_report: incident,
      safety_rating: Math.min(prev.safety_rating || 5, 2) // Lower safety rating for incidents
    }))
  }

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return true // Template selection is optional
      case 2:
        return selectedTemplate ? Object.keys(templateResponses).length > 0 : !!(reviewData.rating && reviewData.review_text)
      case 3:
        return true // Photos and incidents are optional
      case 4:
        return true // Final review
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    } else {
      Alert.alert('Required Information', 'Please complete the required fields before continuing.')
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to submit a review.')
      return
    }

    try {
      setLoading(true)

      // Prepare template responses
      const templateResponseData = selectedTemplate
        ? Object.entries(templateResponses).map(([questionId, value]) => ({
            template_id: selectedTemplate.id,
            question_id: questionId,
            response_value: value
          }))
        : []

      // Prepare photo uploads
      const photoUploads = selectedPhotos.map(photo => ({
        file: photo.file,
        photo_type: photo.type,
        caption: photo.caption
      }))

      // Create complete review data
  const completeReviewData: ReviewCreationData = {
        ...reviewData,
        template_id: selectedTemplate?.id,
        template_responses: templateResponseData,
        photos: photoUploads,
        incident_report: incidentData || undefined
  } as ReviewCreationData

      const review = await ReviewService.createReview(completeReviewData)

      Alert.alert(
        'Review Submitted',
        'Thank you for sharing your experience! Your review will help others make safe dining decisions.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      )

    } catch (error) {
      console.error('Submit review error:', error)
      Alert.alert('Error', 'Failed to submit review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderTemplateSelection = () => (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Choose Review Type</Text>
      <Text className="text-gray-600 mb-6">
        Select a review template that matches your dining experience for more detailed guidance.
      </Text>

      <View className="space-y-3 mb-6">
        {templates.map(template => (
          <Pressable
            key={template.id}
            onPress={() => handleTemplateSelect(template)}
            className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <Text className="text-lg font-semibold text-gray-900 mb-1">
              {template.template_name}
            </Text>
            <Text className="text-sm text-gray-600">
              {template.template_type === 'allergy_focused' && 'Focused on allergy safety and cross-contamination'}
              {template.template_type === 'incident_report' && 'For reporting safety incidents or allergic reactions'}
              {template.template_type === 'expert_assessment' && 'Professional safety assessment'}
              {template.template_type === 'general' && 'General dining experience review'}
            </Text>
            <View className="mt-2 flex-row">
              <View className="bg-blue-100 px-2 py-1 rounded">
                <Text className="text-xs font-medium text-blue-800">
                  {template.restriction_types?.length || 0} restriction types
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={handleSkipTemplate}
        className="p-4 border border-gray-300 rounded-lg bg-gray-50"
      >
        <Text className="text-center text-gray-700 font-medium">
          Skip - Write a simple review
        </Text>
      </Pressable>
    </View>
  )

  const renderTemplateQuestions = () => {
    if (!selectedTemplate) {
      return renderBasicReview()
    }

  const structure = selectedTemplate.template_structure as unknown as ReviewTemplateStructure

    return (
      <View className="flex-1">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          {selectedTemplate.template_name}
        </Text>
        <Text className="text-gray-600 mb-6">
          Please answer the following questions about your dining experience.
        </Text>

        <ScrollView className="flex-1 space-y-6">
          {structure.sections.map(section => (
            <View key={section.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                {section.title}
              </Text>
              {section.description && (
                <Text className="text-sm text-gray-600 mb-4">
                  {section.description}
                </Text>
              )}

              {section.questions.map(question => (
                <View key={question.id} className="mb-4">
                  <Text className="text-sm font-medium text-gray-900 mb-2">
                    {question.question}
                    {question.required && <Text className="text-red-500"> *</Text>}
                  </Text>

                  {question.type === 'rating' && (
                    <View className="flex-row space-x-2">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <Pressable
                          key={rating}
                          onPress={() => handleQuestionResponse(question.id, rating, question.category)}
                          className={`w-10 h-10 rounded-full border-2 items-center justify-center ${
                            templateResponses[question.id] === rating
                              ? 'border-yellow-500 bg-yellow-50'
                              : 'border-gray-300'
                          }`}
                        >
                          <Text className={`text-lg ${
                            templateResponses[question.id] === rating
                              ? 'text-yellow-500'
                              : 'text-gray-400'
                          }`}>
                            ★
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {question.type === 'text' && (
                    <TextInput
                      value={templateResponses[question.id] || ''}
                      onChangeText={(text) => handleQuestionResponse(question.id, text)}
                      placeholder="Enter your response..."
                      multiline={true}
                      numberOfLines={3}
                      className="border border-gray-300 rounded-lg p-3 text-gray-900"
                      style={{ textAlignVertical: 'top' }}
                    />
                  )}

                  {question.type === 'boolean' && (
                    <View className="flex-row space-x-3">
                      <Pressable
                        onPress={() => handleQuestionResponse(question.id, true)}
                        className={`flex-1 py-3 rounded-lg border ${
                          templateResponses[question.id] === true
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        <Text className={`text-center font-medium ${
                          templateResponses[question.id] === true
                            ? 'text-green-800'
                            : 'text-gray-700'
                        }`}>
                          Yes
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleQuestionResponse(question.id, false)}
                        className={`flex-1 py-3 rounded-lg border ${
                          templateResponses[question.id] === false
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        <Text className={`text-center font-medium ${
                          templateResponses[question.id] === false
                            ? 'text-red-800'
                            : 'text-gray-700'
                        }`}>
                          No
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  {question.type === 'multiple_choice' && question.options && (
                    <View className="space-y-2">
                      {question.options.map(option => (
                        <Pressable
                          key={option}
                          onPress={() => handleQuestionResponse(question.id, option)}
                          className={`p-3 rounded-lg border ${
                            templateResponses[question.id] === option
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          <Text className={`${
                            templateResponses[question.id] === option
                              ? 'text-blue-800 font-medium'
                              : 'text-gray-700'
                          }`}>
                            {option}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {question.help_text && (
                    <Text className="text-xs text-gray-500 mt-1">
                      {question.help_text}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    )
  }

  const renderBasicReview = () => (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Write Your Review</Text>
      <Text className="text-gray-600 mb-6">
        Share your dining experience at {restaurantName}.
      </Text>

      <View className="space-y-6">
        <View>
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Overall Rating *
          </Text>
          <View className="flex-row space-x-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <Pressable
                key={rating}
                onPress={() => setReviewData(prev => ({ ...prev, rating }))}
                className="items-center"
              >
                <Text className={`text-3xl ${
                  (reviewData.rating || 0) >= rating ? 'text-yellow-500' : 'text-gray-300'
                }`}>
                  ★
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Safety Rating (for dietary restrictions)
          </Text>
          <View className="flex-row space-x-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <Pressable
                key={rating}
                onPress={() => setReviewData(prev => ({ ...prev, safety_rating: rating }))}
                className="items-center"
              >
                <Text className={`text-3xl ${
                  (reviewData.safety_rating || 0) >= rating ? 'text-green-500' : 'text-gray-300'
                }`}>
                  🛡️
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Your Experience *
          </Text>
          <TextInput
            value={reviewData.review_text || ''}
            onChangeText={(text) => setReviewData(prev => ({ ...prev, review_text: text }))}
            placeholder="Describe your dining experience, especially any safety considerations for dietary restrictions..."
            multiline
            numberOfLines={6}
            className="border border-gray-300 rounded-lg p-3 text-gray-900"
            style={{ textAlignVertical: 'top' }}
          />
        </View>

        <View>
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Visit Date
          </Text>
          <TextInput
            value={reviewData.visit_date || ''}
            onChangeText={(text) => setReviewData(prev => ({ ...prev, visit_date: text }))}
            placeholder="When did you visit? (YYYY-MM-DD)"
            className="border border-gray-300 rounded-lg p-3 text-gray-900"
          />
        </View>
      </View>
    </View>
  )

  const renderPhotosAndIncidents = () => (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Evidence & Incidents</Text>
      <Text className="text-gray-600 mb-6">
        Add photos and report any safety incidents to help others make informed decisions.
      </Text>

      <View className="space-y-6">
        {/* Photos Section */}
        <View>
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Photo Evidence
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Photos help verify your experience and provide valuable information to other users.
          </Text>

          {selectedPhotos.length > 0 && (
            <View className="space-y-2 mb-4">
              {selectedPhotos.map((photo, index) => (
                <View key={index} className="flex-row items-center p-3 bg-gray-50 rounded-lg">
                  <Text className="flex-1 text-gray-800">
                    {photo.type.replace('_', ' ').toUpperCase()} Photo
                  </Text>
                  <Pressable
                    onPress={() => setSelectedPhotos(prev => prev.filter((_, i) => i !== index))}
                    className="ml-2 p-1"
                  >
                    <Text className="text-red-600">Remove</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Pressable
            onPress={handlePhotoAdd}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg items-center"
          >
            <Text className="text-gray-600">+ Add Photo Evidence</Text>
          </Pressable>
        </View>

        {/* Incident Reporting Section */}
        <View>
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Safety Incidents
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Did you experience an allergic reaction or safety concern? Report it to help protect others.
          </Text>

          {incidentData && (
            <View className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <Text className="font-medium text-red-800">Incident Reported</Text>
              <Text className="text-sm text-red-700">
                Severity: {incidentData.severity}
              </Text>
              <Pressable
                onPress={() => setIncidentData(null)}
                className="mt-2"
              >
                <Text className="text-red-600 text-sm">Remove Report</Text>
              </Pressable>
            </View>
          )}

          {!incidentData && (
            <Pressable
              onPress={handleIncidentAdd}
              className="p-4 border border-red-300 bg-red-50 rounded-lg"
            >
              <Text className="text-red-800 font-medium text-center">
                Report Safety Incident
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  )

  const renderReviewSummary = () => (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Review Summary</Text>
      <Text className="text-gray-600 mb-6">
        Please review your submission before posting.
      </Text>

      <ScrollView className="flex-1">
        <View className="space-y-4">
          <View className="bg-white p-4 rounded-lg border border-gray-200">
            <Text className="font-semibold text-gray-900 mb-2">Restaurant</Text>
            <Text className="text-gray-700">{restaurantName}</Text>
          </View>

          <View className="bg-white p-4 rounded-lg border border-gray-200">
            <Text className="font-semibold text-gray-900 mb-2">Ratings</Text>
            <Text className="text-gray-700">
              Overall: {reviewData.rating}/5 stars
            </Text>
            {reviewData.safety_rating && (
              <Text className="text-gray-700">
                Safety: {reviewData.safety_rating}/5 stars
              </Text>
            )}
          </View>

          {reviewData.review_text && (
            <View className="bg-white p-4 rounded-lg border border-gray-200">
              <Text className="font-semibold text-gray-900 mb-2">Review</Text>
              <Text className="text-gray-700">{reviewData.review_text}</Text>
            </View>
          )}

          {selectedTemplate && (
            <View className="bg-white p-4 rounded-lg border border-gray-200">
              <Text className="font-semibold text-gray-900 mb-2">Template Used</Text>
              <Text className="text-gray-700">{selectedTemplate.template_name}</Text>
              <Text className="text-sm text-gray-600">
                {Object.keys(templateResponses).length} questions answered
              </Text>
            </View>
          )}

          {selectedPhotos.length > 0 && (
            <View className="bg-white p-4 rounded-lg border border-gray-200">
              <Text className="font-semibold text-gray-900 mb-2">Photos</Text>
              <Text className="text-gray-700">{selectedPhotos.length} photos attached</Text>
            </View>
          )}

          {incidentData && (
            <View className="bg-red-50 p-4 rounded-lg border border-red-200">
              <Text className="font-semibold text-red-800 mb-2">Safety Incident</Text>
              <Text className="text-red-700">Severity: {incidentData.severity}</Text>
              <Text className="text-sm text-red-600 mt-1">
                This incident will be reported to help protect other users.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-4 border-b border-gray-200 bg-white">
        <View className="flex-row justify-between items-center">
          <Pressable onPress={() => navigation.goBack()}>
            <Text className="text-blue-600 text-lg">Cancel</Text>
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">Write Review</Text>
          <View className="w-16" />
        </View>
        
        {/* Progress indicator */}
        <View className="flex-row mt-4">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
            <View key={step} className="flex-1 flex-row items-center">
              <View className={`w-8 h-8 rounded-full items-center justify-center ${
                step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <Text className={`text-sm font-medium ${
                  step <= currentStep ? 'text-white' : 'text-gray-600'
                }`}>
                  {step}
                </Text>
              </View>
              {step < totalSteps && (
                <View className={`flex-1 h-1 ml-2 ${
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </View>
          ))}
        </View>
      </View>

      <View className="flex-1 p-4">
        {currentStep === 1 && renderTemplateSelection()}
        {currentStep === 2 && renderTemplateQuestions()}
        {currentStep === 3 && renderPhotosAndIncidents()}
        {currentStep === 4 && renderReviewSummary()}
      </View>

      <View className="p-4 border-t border-gray-200 bg-white flex-row space-x-3">
        {currentStep > 1 && (
          <Pressable
            onPress={handlePrevious}
            className="flex-1 py-3 rounded-lg border border-gray-300 bg-gray-50"
          >
            <Text className="text-center text-gray-700 font-medium">Previous</Text>
          </Pressable>
        )}
        
        {currentStep < totalSteps ? (
          <Pressable
            onPress={handleNext}
            disabled={!validateCurrentStep()}
            className={`flex-1 py-3 rounded-lg ${
              validateCurrentStep() ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <Text className={`text-center font-medium ${
              validateCurrentStep() ? 'text-white' : 'text-gray-500'
            }`}>
              Next
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className={`flex-1 py-3 rounded-lg ${
              loading ? 'bg-gray-300' : 'bg-blue-600'
            }`}
          >
            <Text className={`text-center font-medium ${
              loading ? 'text-gray-500' : 'text-white'
            }`}>
              {loading ? 'Submitting...' : 'Submit Review'}
            </Text>
          </Pressable>
        )}
      </View>

      <SafetyIncidentReport
        visible={showIncidentReport}
        onClose={() => setShowIncidentReport(false)}
        restaurantId={restaurantId}
        onSubmit={handleIncidentSubmit}
      />
    </View>
  )
}