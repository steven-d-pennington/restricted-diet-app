/**
 * Safety Incident Report Screen
 * 
 * SAFETY CRITICAL: Report safety incidents and allergen exposures
 * Provides structured incident reporting with emergency escalation
 */

import React, { useState, useCallback, useEffect } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Switch,
  Modal,
  Linking
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SafetyBadge } from '../../components/SafetyBadge'
import { SafetyCard } from '../../components/SafetyCard'
import { SafetyButton } from '../../components/SafetyButton'
import { useAuthContext } from '../../contexts/AuthContext'

interface SafetyIncidentReportScreenProps {
  navigation: any
  route: {
    params: {
      restaurantId: string
      restaurantName: string
      incidentType?: 'exposure' | 'mislabeling' | 'contamination' | 'other'
    }
  }
}

interface IncidentReport {
  incidentType: 'exposure' | 'mislabeling' | 'contamination' | 'other'
  severity: 'mild' | 'moderate' | 'severe' | 'emergency'
  description: string
  specificAllergen?: string
  menuItem?: string
  dateTime: string
  symptoms: string[]
  medicalAttentionSought: boolean
  photoEvidence: string[]
  anonymousReport: boolean
  contactable: boolean
  emergencyServices: boolean
}

export const SafetyIncidentReportScreen: React.FC<SafetyIncidentReportScreenProps> = ({
  navigation,
  route
}) => {
  const { restaurantId, restaurantName, incidentType } = route.params
  const { user } = useAuthContext()
  
  const [report, setReport] = useState<IncidentReport>({
    incidentType: incidentType || 'exposure',
    severity: 'mild',
    description: '',
    dateTime: new Date().toISOString(),
    symptoms: [],
    medicalAttentionSought: false,
    photoEvidence: [],
    anonymousReport: false,
    contactable: true,
    emergencyServices: false
  })
  
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Set navigation title
  useEffect(() => {
    navigation.setOptions({
      title: 'Report Safety Incident',
      headerTitleStyle: { fontSize: 16 }
    })
  }, [navigation])

  // Check if this is an emergency situation
  useEffect(() => {
    if (report.severity === 'emergency' || report.emergencyServices) {
      setShowEmergencyModal(true)
    }
  }, [report.severity, report.emergencyServices])

  const incidentTypes = [
    { id: 'exposure', label: 'Allergen Exposure', icon: '⚠️', description: 'Consumed something that triggered allergic reaction' },
    { id: 'mislabeling', label: 'Menu Mislabeling', icon: '📋', description: 'Menu or staff provided incorrect allergen information' },
    { id: 'contamination', label: 'Cross-Contamination', icon: '🔄', description: 'Food prepared unsafely with allergen contact' },
    { id: 'other', label: 'Other Safety Issue', icon: '🚨', description: 'Other food safety or preparation concern' }
  ]

  const severityLevels = [
    { id: 'mild', label: 'Mild', color: 'yellow', description: 'Minor discomfort, manageable symptoms' },
    { id: 'moderate', label: 'Moderate', color: 'orange', description: 'Notable symptoms, some concern' },
    { id: 'severe', label: 'Severe', color: 'red', description: 'Serious symptoms, medical attention needed' },
    { id: 'emergency', label: 'Emergency', color: 'red', description: 'Life-threatening, call 911 immediately' }
  ]

  const symptomOptions = [
    'Hives/Rash', 'Swelling', 'Difficulty Breathing', 'Nausea/Vomiting', 
    'Diarrhea', 'Stomach Pain', 'Dizziness', 'Throat Closing', 
    'Anaphylaxis', 'Other Allergic Reaction'
  ]

  const handleEmergencyCall = useCallback(() => {
    Alert.alert(
      'Emergency Call',
      'Call emergency services (911) immediately?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call 911', 
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:911')
            setReport(prev => ({ ...prev, emergencyServices: true }))
          }
        }
      ]
    )
  }, [])

  const handleSubmitReport = useCallback(async () => {
    if (!report.description.trim()) {
      Alert.alert('Missing Information', 'Please provide a description of the incident.')
      return
    }

    try {
      setSubmitting(true)

      // In real app, this would submit to API
      console.log('Submitting incident report:', {
        restaurantId,
        userId: user?.id,
        ...report
      })

      Alert.alert(
        'Report Submitted',
        'Your safety incident report has been submitted. We take these reports seriously and will investigate promptly.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      )
    } catch (error) {
      console.error('Failed to submit report:', error)
      Alert.alert('Error', 'Failed to submit report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [report, restaurantId, user?.id, navigation])

  const toggleSymptom = useCallback((symptom: string) => {
    setReport(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }))
  }, [])

  const renderIncidentTypeCard = (type: typeof incidentTypes[0]) => (
    <TouchableOpacity
      key={type.id}
      onPress={() => setReport(prev => ({ ...prev, incidentType: type.id as any }))}
      className={`p-4 rounded-lg border mb-3 ${
        report.incidentType === type.id
          ? 'bg-blue-50 border-blue-500'
          : 'bg-white border-gray-300'
      }`}
    >
      <View className="flex-row items-center mb-2">
        <Text className="text-2xl mr-3">{type.icon}</Text>
        <Text className={`font-semibold ${
          report.incidentType === type.id ? 'text-blue-700' : 'text-gray-900'
        }`}>
          {type.label}
        </Text>
      </View>
      <Text className="text-gray-600 text-sm">{type.description}</Text>
    </TouchableOpacity>
  )

  const renderSeverityCard = (severity: typeof severityLevels[0]) => (
    <TouchableOpacity
      key={severity.id}
      onPress={() => setReport(prev => ({ ...prev, severity: severity.id as any }))}
      className={`p-3 rounded-lg border mb-2 ${
        report.severity === severity.id
          ? `bg-${severity.color}-50 border-${severity.color}-500`
          : 'bg-white border-gray-300'
      }`}
    >
      <View className="flex-row justify-between items-center mb-1">
        <Text className={`font-semibold ${
          report.severity === severity.id 
            ? `text-${severity.color}-700` 
            : 'text-gray-900'
        }`}>
          {severity.label}
        </Text>
        {severity.id === 'emergency' && (
          <SafetyBadge level="danger" size="sm" text="CRITICAL" />
        )}
      </View>
      <Text className="text-gray-600 text-sm">{severity.description}</Text>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Warning Banner */}
        <SafetyCard
          title="Safety Incident Reporting"
          level="warning"
          className="mb-6"
        >
          <Text className="text-yellow-800 text-sm leading-5">
            If you are experiencing a medical emergency, call 911 immediately. 
            This form is for documenting incidents and improving restaurant safety.
          </Text>
          
          <TouchableOpacity
            onPress={handleEmergencyCall}
            className="bg-red-600 py-2 px-4 rounded-lg mt-3"
          >
            <Text className="text-white text-center font-bold">🚨 CALL 911 NOW</Text>
          </TouchableOpacity>
        </SafetyCard>

        {/* Restaurant Info */}
        <View className="bg-white p-4 rounded-lg mb-6 border border-gray-200">
          <Text className="text-gray-600 text-sm mb-1">Reporting incident at:</Text>
          <Text className="text-gray-900 font-semibold text-lg">{restaurantName}</Text>
        </View>

        {/* Incident Type */}
        <View className="mb-6">
          <Text className="text-gray-900 font-semibold text-lg mb-3">
            What type of incident occurred?
          </Text>
          {incidentTypes.map(renderIncidentTypeCard)}
        </View>

        {/* Severity Level */}
        <View className="mb-6">
          <Text className="text-gray-900 font-semibold text-lg mb-3">
            How severe was the incident?
          </Text>
          {severityLevels.map(renderSeverityCard)}
        </View>

        {/* Specific Details */}
        <View className="bg-white p-4 rounded-lg mb-6 border border-gray-200">
          <Text className="text-gray-900 font-semibold mb-3">Incident Details</Text>
          
          {/* Allergen */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Specific allergen involved (if applicable)</Text>
            <TextInput
              value={report.specificAllergen}
              onChangeText={(text) => setReport(prev => ({ ...prev, specificAllergen: text }))}
              placeholder="e.g., Peanuts, Shellfish, Gluten"
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
            />
          </View>

          {/* Menu Item */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Menu item involved</Text>
            <TextInput
              value={report.menuItem}
              onChangeText={(text) => setReport(prev => ({ ...prev, menuItem: text }))}
              placeholder="Name of dish or item"
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
            />
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">
              Detailed description <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={report.description}
              onChangeText={(text) => setReport(prev => ({ ...prev, description: text }))}
              placeholder="Please describe what happened, when it occurred, and any relevant details..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 h-24"
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Symptoms */}
        <View className="bg-white p-4 rounded-lg mb-6 border border-gray-200">
          <Text className="text-gray-900 font-semibold mb-3">Symptoms experienced</Text>
          <View className="flex-row flex-wrap">
            {symptomOptions.map((symptom) => (
              <TouchableOpacity
                key={symptom}
                onPress={() => toggleSymptom(symptom)}
                className={`px-3 py-2 rounded-full mr-2 mb-2 border ${
                  report.symptoms.includes(symptom)
                    ? 'bg-red-500 border-red-500'
                    : 'bg-gray-100 border-gray-300'
                }`}
              >
                <Text className={`text-sm ${
                  report.symptoms.includes(symptom) ? 'text-white' : 'text-gray-700'
                }`}>
                  {symptom}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Medical Attention */}
        <View className="bg-white p-4 rounded-lg mb-6 border border-gray-200">
          <Text className="text-gray-900 font-semibold mb-3">Medical Response</Text>
          
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-gray-700">Did you seek medical attention?</Text>
            <Switch
              value={report.medicalAttentionSought}
              onValueChange={(value) => setReport(prev => ({ ...prev, medicalAttentionSought: value }))}
            />
          </View>
          
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-gray-700">Did you call emergency services?</Text>
            <Switch
              value={report.emergencyServices}
              onValueChange={(value) => setReport(prev => ({ ...prev, emergencyServices: value }))}
            />
          </View>
        </View>

        {/* Privacy Options */}
        <View className="bg-white p-4 rounded-lg mb-6 border border-gray-200">
          <Text className="text-gray-900 font-semibold mb-3">Privacy & Contact</Text>
          
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-gray-700">Submit anonymously</Text>
            <Switch
              value={report.anonymousReport}
              onValueChange={(value) => setReport(prev => ({ ...prev, anonymousReport: value }))}
            />
          </View>
          
          {!report.anonymousReport && (
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-gray-700">OK to contact for follow-up</Text>
              <Switch
                value={report.contactable}
                onValueChange={(value) => setReport(prev => ({ ...prev, contactable: value }))}
              />
            </View>
          )}
        </View>

        {/* Submit Button */}
        <SafetyButton
          title={submitting ? "Submitting Report..." : "Submit Safety Report"}
          onPress={handleSubmitReport}
          disabled={submitting || !report.description.trim()}
          className="mb-6"
        />

        {/* Disclaimer */}
        <View className="bg-gray-100 p-3 rounded-lg">
          <Text className="text-gray-600 text-xs text-center leading-4">
            Reports are reviewed by safety experts and may be shared with health authorities. 
            False reports may have legal consequences. This system is not for medical emergencies.
          </Text>
        </View>
      </ScrollView>

      {/* Emergency Modal */}
      <Modal
        visible={showEmergencyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmergencyModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-6">
          <View className="bg-white rounded-xl p-6 w-full max-w-sm">
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-3">
                <Text className="text-red-500 text-3xl">🚨</Text>
              </View>
              <Text className="text-red-600 text-xl font-bold text-center">
                Emergency Detected
              </Text>
            </View>
            
            <Text className="text-gray-700 text-center mb-6 leading-5">
              You've indicated this is an emergency situation. Please call 911 immediately 
              if you need medical assistance.
            </Text>
            
            <View className="space-y-3">
              <TouchableOpacity
                onPress={() => {
                  handleEmergencyCall()
                  setShowEmergencyModal(false)
                }}
                className="bg-red-600 py-3 rounded-lg"
              >
                <Text className="text-white text-center font-bold">📞 Call 911 Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setShowEmergencyModal(false)}
                className="bg-gray-200 py-3 rounded-lg"
              >
                <Text className="text-gray-700 text-center font-medium">Continue Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}