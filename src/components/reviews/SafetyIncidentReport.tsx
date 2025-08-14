/**
 * Safety Incident Report Component
 * 
 * SAFETY CRITICAL: Comprehensive incident reporting for allergic reactions and safety concerns
 * Captures detailed medical and safety information for community protection
 */

import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, ScrollView, TextInput, Switch, Alert, Modal } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import {
  SafetyIncidentReport,
  IncidentSeverity,
  DietaryRestriction
} from '../../types/database.types'
import ReviewService from '../../services/reviewService'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface SafetyIncidentReportProps {
  visible: boolean
  onClose: () => void
  restaurantId: string
  reviewId?: string
  onSubmit?: (incident: SafetyIncidentReport) => void
  initialData?: Partial<SafetyIncidentReport>
}

const SEVERITY_LEVELS: Array<{ value: IncidentSeverity, label: string, description: string }> = [
  {
    value: 'minor',
    label: 'Minor Reaction',
    description: 'Mild discomfort, easily managed without medical attention'
  },
  {
    value: 'moderate',
    label: 'Moderate Reaction',
    description: 'Noticeable symptoms requiring medication or attention'
  },
  {
    value: 'severe',
    label: 'Severe Reaction',
    description: 'Serious symptoms requiring immediate medical attention'
  },
  {
    value: 'critical',
    label: 'Life-Threatening',
    description: 'Emergency situation requiring immediate medical intervention'
  }
]

const SYMPTOMS_OPTIONS = [
  'Itching or tingling in mouth',
  'Swelling of lips, face, tongue',
  'Hives or skin rash',
  'Difficulty breathing',
  'Wheezing or chest tightness',
  'Nausea or vomiting',
  'Diarrhea or stomach cramps',
  'Dizziness or lightheadedness',
  'Rapid or weak pulse',
  'Loss of consciousness',
  'Anxiety or feeling of doom',
  'Other symptoms'
]

const MEDICATION_OPTIONS = [
  'EpiPen/Epinephrine auto-injector',
  'Antihistamine (Benadryl, etc.)',
  'Corticosteroids',
  'Bronchodilator/Inhaler',
  'Other prescription medication',
  'No medication used'
]

export default function SafetyIncidentReport({
  visible,
  onClose,
  restaurantId,
  reviewId,
  onSubmit,
  initialData = {}
}: SafetyIncidentReportProps) {
  
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryRestriction[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  // Form state
  const [incidentData, setIncidentData] = useState<Partial<SafetyIncidentReport>>({
    restaurant_id: restaurantId,
    severity: 'minor',
    restriction_ids: [],
    incident_description: '',
    medical_attention_required: false,
    epipen_used: false,
    ambulance_called: false,
    emergency_contact_made: false,
    follow_up_required: false,
    ...initialData
  })

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [selectedMedications, setSelectedMedications] = useState<string[]>([])
  const [customSymptom, setCustomSymptom] = useState('')
  const [customMedication, setCustomMedication] = useState('')

  useEffect(() => {
    if (visible) {
      loadDietaryRestrictions()
    }
  }, [visible])

  const loadDietaryRestrictions = async () => {
    try {
      const { data } = await supabase
        .from('dietary_restrictions')
        .select('*')
        .order('name')

      if (data) {
        setDietaryRestrictions(data)
      }
    } catch (error) {
      console.error('Failed to load dietary restrictions:', error)
    }
  }

  const updateIncidentData = (updates: Partial<SafetyIncidentReport>) => {
    setIncidentData(prev => ({ ...prev, ...updates }))
  }

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    )
  }

  const toggleMedication = (medication: string) => {
    setSelectedMedications(prev =>
      prev.includes(medication)
        ? prev.filter(m => m !== medication)
        : [...prev, medication]
    )
  }

  const toggleRestriction = (restrictionId: string) => {
    updateIncidentData({
      restriction_ids: incidentData.restriction_ids?.includes(restrictionId)
        ? incidentData.restriction_ids.filter(id => id !== restrictionId)
        : [...(incidentData.restriction_ids || []), restrictionId]
    })
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(incidentData.severity && incidentData.restriction_ids?.length)
      case 2:
        return !!(selectedSymptoms.length && incidentData.incident_description?.trim())
      case 3:
        return true // Medical response is optional
      case 4:
        return !!(incidentData.restaurant_response || incidentData.restaurant_response === '')
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    } else {
      Alert.alert('Required Information', 'Please complete all required fields before continuing.')
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to submit an incident report.')
      return
    }

    if (!validateStep(4)) {
      Alert.alert('Required Information', 'Please complete all required fields.')
      return
    }

    const completeIncident: SafetyIncidentReport = {
      restaurant_id: restaurantId,
      severity: incidentData.severity!,
      restriction_ids: incidentData.restriction_ids!,
      incident_description: incidentData.incident_description!,
      symptoms_experienced: [
        ...selectedSymptoms,
        ...(customSymptom ? [customSymptom] : [])
      ].join('; '),
      medical_attention_required: incidentData.medical_attention_required!,
      epipen_used: incidentData.epipen_used || false,
      ambulance_called: incidentData.ambulance_called || false,
      reaction_onset_minutes: incidentData.reaction_onset_minutes,
      reaction_duration_minutes: incidentData.reaction_duration_minutes,
      emergency_contact_made: incidentData.emergency_contact_made || false,
      restaurant_response: incidentData.restaurant_response,
      follow_up_required: incidentData.follow_up_required!
    }

    try {
      setLoading(true)

      if (onSubmit) {
        await onSubmit(completeIncident)
      } else {
        await ReviewService.createSafetyIncident({
          ...completeIncident,
          review_id: reviewId
        })
      }

      Alert.alert(
        'Report Submitted',
        'Your safety incident report has been submitted. Thank you for helping keep our community safe.',
        [{ text: 'OK', onPress: onClose }]
      )

    } catch (error) {
      console.error('Submit incident error:', error)
      Alert.alert('Error', 'Failed to submit incident report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Incident Severity</Text>
      <Text className="text-gray-600 mb-6">
        Please select the severity of the reaction or incident you experienced.
      </Text>

      <View className="space-y-3 mb-6">
        {SEVERITY_LEVELS.map(level => (
          <Pressable
            key={level.value}
            onPress={() => updateIncidentData({ severity: level.value })}
            className={`p-4 rounded-lg border ${
              incidentData.severity === level.value
                ? level.value === 'critical'
                  ? 'border-red-500 bg-red-50'
                  : level.value === 'severe'
                  ? 'border-orange-500 bg-orange-50'
                  : level.value === 'moderate'
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-white'
            }`}
          >
            <Text className={`font-semibold ${
              incidentData.severity === level.value
                ? level.value === 'critical'
                  ? 'text-red-800'
                  : level.value === 'severe'
                  ? 'text-orange-800'
                  : level.value === 'moderate'
                  ? 'text-yellow-800'
                  : 'text-green-800'
                : 'text-gray-900'
            }`}>
              {level.label}
            </Text>
            <Text className={`text-sm mt-1 ${
              incidentData.severity === level.value
                ? level.value === 'critical'
                  ? 'text-red-700'
                  : level.value === 'severe'
                  ? 'text-orange-700'
                  : level.value === 'moderate'
                  ? 'text-yellow-700'
                  : 'text-green-700'
                : 'text-gray-600'
            }`}>
              {level.description}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-lg font-semibold text-gray-900 mb-3">
        Which dietary restrictions were involved? *
      </Text>
      <View className="space-y-2">
        {dietaryRestrictions
          .filter(r => r.category === 'allergy' || r.medical_severity_default === 'life_threatening')
          .map(restriction => (
            <View key={restriction.id} className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Text className="text-gray-900 flex-1">{restriction.name}</Text>
              <Switch
                value={incidentData.restriction_ids?.includes(restriction.id) || false}
                onValueChange={() => toggleRestriction(restriction.id)}
                trackColor={{ false: "#D1D5DB", true: "#EF4444" }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
      </View>
    </View>
  )

  const renderStep2 = () => (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Symptoms & Details</Text>
      <Text className="text-gray-600 mb-6">
        Please describe what happened and what symptoms you experienced.
      </Text>

      <Text className="text-lg font-semibold text-gray-900 mb-3">
        Symptoms experienced: *
      </Text>
      <View className="space-y-2 mb-6">
        {SYMPTOMS_OPTIONS.map(symptom => (
          <Pressable
            key={symptom}
            onPress={() => toggleSymptom(symptom)}
            className={`flex-row items-center p-3 rounded-lg ${
              selectedSymptoms.includes(symptom)
                ? 'bg-red-50 border border-red-300'
                : 'bg-gray-50 border border-gray-300'
            }`}
          >
            <Text className={`flex-1 ${
              selectedSymptoms.includes(symptom) ? 'text-red-800' : 'text-gray-900'
            }`}>
              {symptom}
            </Text>
            {selectedSymptoms.includes(symptom) && (
              <Text className="text-red-600">✓</Text>
            )}
          </Pressable>
        ))}
      </View>

      {selectedSymptoms.includes('Other symptoms') && (
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Please describe other symptoms:
          </Text>
          <TextInput
            value={customSymptom}
            onChangeText={setCustomSymptom}
            placeholder="Describe other symptoms..."
            className="border border-gray-300 rounded-lg p-3 text-gray-900"
          />
        </View>
      )}

      <Text className="text-lg font-semibold text-gray-900 mb-3">
        Detailed description of the incident: *
      </Text>
      <TextInput
        value={incidentData.incident_description}
        onChangeText={(text) => updateIncidentData({ incident_description: text })}
        placeholder="Please describe what you ate, when symptoms started, and what happened..."
        multiline
        numberOfLines={4}
        className="border border-gray-300 rounded-lg p-3 text-gray-900 mb-4"
        style={{ textAlignVertical: 'top' }}
      />

      <View className="flex-row space-x-4">
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Reaction onset (minutes):
          </Text>
          <TextInput
            value={incidentData.reaction_onset_minutes?.toString() || ''}
            onChangeText={(text) => updateIncidentData({ 
              reaction_onset_minutes: text ? parseInt(text) : undefined 
            })}
            placeholder="5"
            keyboardType="numeric"
            className="border border-gray-300 rounded-lg p-3 text-gray-900"
          />
        </View>
        
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Duration (minutes):
          </Text>
          <TextInput
            value={incidentData.reaction_duration_minutes?.toString() || ''}
            onChangeText={(text) => updateIncidentData({ 
              reaction_duration_minutes: text ? parseInt(text) : undefined 
            })}
            placeholder="30"
            keyboardType="numeric"
            className="border border-gray-300 rounded-lg p-3 text-gray-900"
          />
        </View>
      </View>
    </View>
  )

  const renderStep3 = () => (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Medical Response</Text>
      <Text className="text-gray-600 mb-6">
        Please tell us about any medical treatment or medication used.
      </Text>

      <View className="space-y-4 mb-6">
        <View className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg">
          <Text className="text-gray-900">Did you seek medical attention?</Text>
          <Switch
            value={incidentData.medical_attention_required || false}
            onValueChange={(value) => updateIncidentData({ medical_attention_required: value })}
            trackColor={{ false: "#D1D5DB", true: "#EF4444" }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg">
          <Text className="text-gray-900">Did you use an EpiPen?</Text>
          <Switch
            value={incidentData.epipen_used || false}
            onValueChange={(value) => updateIncidentData({ epipen_used: value })}
            trackColor={{ false: "#D1D5DB", true: "#EF4444" }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg">
          <Text className="text-gray-900">Was an ambulance called?</Text>
          <Switch
            value={incidentData.ambulance_called || false}
            onValueChange={(value) => updateIncidentData({ ambulance_called: value })}
            trackColor={{ false: "#D1D5DB", true: "#EF4444" }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg">
          <Text className="text-gray-900">Did you contact emergency contacts?</Text>
          <Switch
            value={incidentData.emergency_contact_made || false}
            onValueChange={(value) => updateIncidentData({ emergency_contact_made: value })}
            trackColor={{ false: "#D1D5DB", true: "#EF4444" }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <Text className="text-lg font-semibold text-gray-900 mb-3">
        Medications used:
      </Text>
      <View className="space-y-2 mb-6">
        {MEDICATION_OPTIONS.map(medication => (
          <Pressable
            key={medication}
            onPress={() => toggleMedication(medication)}
            className={`flex-row items-center p-3 rounded-lg ${
              selectedMedications.includes(medication)
                ? 'bg-blue-50 border border-blue-300'
                : 'bg-gray-50 border border-gray-300'
            }`}
          >
            <Text className={`flex-1 ${
              selectedMedications.includes(medication) ? 'text-blue-800' : 'text-gray-900'
            }`}>
              {medication}
            </Text>
            {selectedMedications.includes(medication) && (
              <Text className="text-blue-600">✓</Text>
            )}
          </Pressable>
        ))}
      </View>

      {selectedMedications.includes('Other prescription medication') && (
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Please specify other medication:
          </Text>
          <TextInput
            value={customMedication}
            onChangeText={setCustomMedication}
            placeholder="Specify other medication used..."
            className="border border-gray-300 rounded-lg p-3 text-gray-900"
          />
        </View>
      )}
    </View>
  )

  const renderStep4 = () => (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Restaurant Response</Text>
      <Text className="text-gray-600 mb-6">
        How did the restaurant staff respond to the incident?
      </Text>

      <Text className="text-lg font-semibold text-gray-900 mb-3">
        Restaurant's response:
      </Text>
      <TextInput
        value={incidentData.restaurant_response}
        onChangeText={(text) => updateIncidentData({ restaurant_response: text })}
        placeholder="Describe how the restaurant staff responded to the incident..."
        multiline
        numberOfLines={4}
        className="border border-gray-300 rounded-lg p-3 text-gray-900 mb-6"
        style={{ textAlignVertical: 'top' }}
      />

      <View className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg mb-6">
        <View className="flex-1">
          <Text className="text-gray-900 font-medium">
            Do you need follow-up assistance?
          </Text>
          <Text className="text-sm text-gray-600">
            Would you like help reporting this to health authorities?
          </Text>
        </View>
        <Switch
          value={incidentData.follow_up_required || false}
          onValueChange={(value) => updateIncidentData({ follow_up_required: value })}
          trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
        <Text className="text-yellow-800 font-medium mb-2">
          Important Safety Notice
        </Text>
        <Text className="text-sm text-yellow-700">
          This report will be shared with the restaurant and may be visible to other users to help them make informed safety decisions. For serious incidents, consider reporting to your local health department.
        </Text>
      </View>
    </View>
  )

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        <View className="p-4 border-b border-gray-200">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-bold text-gray-900">Safety Incident Report</Text>
            <Pressable onPress={onClose}>
              <Text className="text-lg text-gray-500">✕</Text>
            </Pressable>
          </View>
          
          {/* Progress indicator */}
          <View className="flex-row mt-4">
            {[1, 2, 3, 4].map(step => (
              <View key={step} className="flex-1 flex-row items-center">
                <View className={`w-8 h-8 rounded-full items-center justify-center ${
                  step <= currentStep ? 'bg-red-600' : 'bg-gray-300'
                }`}>
                  <Text className={`text-sm font-medium ${
                    step <= currentStep ? 'text-white' : 'text-gray-600'
                  }`}>
                    {step}
                  </Text>
                </View>
                {step < 4 && (
                  <View className={`flex-1 h-1 ml-2 ${
                    step < currentStep ? 'bg-red-600' : 'bg-gray-300'
                  }`} />
                )}
              </View>
            ))}
          </View>
        </View>

        <ScrollView className="flex-1 p-4">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </ScrollView>

        <View className="p-4 border-t border-gray-200 flex-row space-x-3">
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
              disabled={!validateStep(currentStep)}
              className={`flex-1 py-3 rounded-lg ${
                validateStep(currentStep) ? 'bg-red-600' : 'bg-gray-300'
              }`}
            >
              <Text className={`text-center font-medium ${
                validateStep(currentStep) ? 'text-white' : 'text-gray-500'
              }`}>
                Next
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleSubmit}
              disabled={loading || !validateStep(currentStep)}
              className={`flex-1 py-3 rounded-lg ${
                loading || !validateStep(currentStep) ? 'bg-gray-300' : 'bg-red-600'
              }`}
            >
              <Text className={`text-center font-medium ${
                loading || !validateStep(currentStep) ? 'text-gray-500' : 'text-white'
              }`}>
                {loading ? 'Submitting...' : 'Submit Report'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  )
}