/**
 * Design System Demo Component
 * 
 * Comprehensive showcase of the NativeWind design system for the dietary restriction app
 * Use this component to test and validate all styling patterns
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Alert } from 'react-native';
import { SafetyBadge } from './SafetyBadge';
import { SafetyCard } from './SafetyCard';
import { SafetyButton, SafeButton, DangerButton, CautionButton } from './SafetyButton';
import { 
  useSafetyClasses, 
  useMedicalClasses, 
  useInputClasses, 
  useAlertClasses,
  getSafetyInfo,
  getMedicalInfo
} from '../utils/designSystem';
import type { SafetyStatus, MedicalType, AlertType } from '../utils/designSystem';

export function DesignSystemDemo() {
  const [inputValue, setInputValue] = useState('');
  const [hasError, setHasError] = useState(false);
  
  const { getInputClass, getLabelClass, getErrorClass } = useInputClasses();
  const { getAlertClass } = useAlertClasses();
  
  const safetyStatuses: SafetyStatus[] = ['safe', 'danger', 'caution', 'unknown'];
  const medicalTypes: MedicalType[] = ['prescription', 'otc', 'supplement', 'natural'];
  const alertTypes: AlertType[] = ['info', 'success', 'warning', 'error'];
  
  const showAlert = (message: string) => {
    Alert.alert('Demo Action', message);
  };
  
  return (
    <ScrollView className="flex-1 bg-background safe-area-all">
      <View className="p-4">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-text-primary mb-2">
            Design System Demo
          </Text>
          <Text className="text-base text-text-secondary">
            Complete showcase of safety-focused styling components for the dietary restriction management app.
          </Text>
        </View>
        
        {/* Color Palette Section */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-text-primary mb-4">
            Safety Color Palette
          </Text>
          
          <View className="space-y-4">
            {safetyStatuses.map((status) => {
              const info = getSafetyInfo(status);
              return (
                <View key={status} className="medical-card">
                  <View className="flex-row items-center mb-2">
                    <View 
                      className={`w-6 h-6 rounded-full mr-3`}
                      style={{ backgroundColor: info.color }}
                    />
                    <Text className="text-lg font-medium capitalize">{status}</Text>
                  </View>
                  <Text className="text-sm text-text-secondary mb-2">
                    {info.description}
                  </Text>
                  <View className={`p-3 rounded-lg border ${status === 'safe' ? 'safety-safe' : status === 'danger' ? 'safety-danger' : status === 'caution' ? 'safety-caution' : 'safety-unknown'}`}>
                    <Text className="text-sm font-medium">
                      Example usage with {status} status
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Safety Badges Section */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-text-primary mb-4">
            Safety Badges
          </Text>
          
          <View className="medical-card">
            <Text className="text-sm font-medium text-text-secondary mb-3">
              Different sizes:
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              <SafetyBadge level="safe" status="safe" size="small" />
              <SafetyBadge level="danger" status="danger" size="medium" />
              <SafetyBadge level="caution" status="caution" size="large" />
            </View>
            
            <Text className="text-sm font-medium text-text-secondary mb-3">
              All safety statuses:
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {safetyStatuses.map((status) => (
                <SafetyBadge key={status} status={status} level={status === 'danger' ? 'danger' : status === 'caution' ? 'caution' : status === 'safe' ? 'safe' : 'caution'} />
              ))}
            </View>
          </View>
        </View>
        
        {/* Safety Cards Section */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-text-primary mb-4">
            Safety Cards
          </Text>
          
          <View className="space-y-4">
            <SafetyCard
              title="Organic Quinoa"
              description="Gluten-free grain alternative"
              status="safe"
              details={["100% organic", "No allergens detected", "Suitable for all diets"]}
              onPress={() => showAlert('Safe product selected')}
            />
            
            <SafetyCard
              title="Mixed Nuts"
              description="Trail mix with various nuts"
              status="danger"
              details={["Contains: Peanuts, Tree nuts", "May contain: Soy", "High allergen risk"]}
              onPress={() => showAlert('Dangerous product - contains allergens')}
            />
            
            <SafetyCard
              title="Artisan Bread"
              description="Locally made sourdough"
              status="caution"
              details={["Contains: Wheat, Gluten", "Made in facility with nuts", "Verify ingredients"]}
              onPress={() => showAlert('Caution - requires verification')}
            />
            
            <SafetyCard
              title="New Product"
              description="Recently scanned item"
              status="unknown"
              details={["Ingredients not yet analyzed", "Safety assessment pending"]}
            />
          </View>
        </View>
        
        {/* Buttons Section */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-text-primary mb-4">
            Safety Buttons
          </Text>
          
          <View className="medical-card space-y-4">
            <Text className="text-sm font-medium text-text-secondary">
              Primary Actions:
            </Text>
            <View className="space-y-3">
              <SafetyButton 
                title="Scan Product" 
                onPress={() => showAlert('Starting product scan')}
                fullWidth
              />
              <SafeButton 
                title="Mark as Safe" 
                onPress={() => showAlert('Marked as safe')}
                fullWidth
              />
              <DangerButton 
                title="Report Allergen" 
                onPress={() => showAlert('Reporting allergen')}
                fullWidth
              />
              <CautionButton 
                title="Needs Review" 
                onPress={() => showAlert('Flagged for review')}
                fullWidth
              />
            </View>
            
            <Text className="text-sm font-medium text-text-secondary mt-6">
              Different Sizes:
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <SafetyButton title="Small" size="sm" onPress={() => {}} />
              <SafetyButton title="Medium" size="md" onPress={() => {}} />
              <SafetyButton title="Large" size="lg" onPress={() => {}} />
            </View>
            
            <Text className="text-sm font-medium text-text-secondary mt-6">
              States:
            </Text>
            <View className="space-y-2">
              <SafetyButton title="Normal" onPress={() => {}} />
              <SafetyButton title="Loading" loading onPress={() => {}} />
              <SafetyButton title="Disabled" disabled onPress={() => {}} />
              <SafetyButton title="Outline" outline onPress={() => {}} />
            </View>
          </View>
        </View>
        
        {/* Form Elements Section */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-text-primary mb-4">
            Form Elements
          </Text>
          
          <View className="medical-card space-y-4">
            <View>
              <Text className={getLabelClass(false)}>
                Product Name
              </Text>
              <TextInput
                className={getInputClass(false)}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Enter product name..."
                placeholderTextColor="#94a3b8"
              />
            </View>
            
            <View>
              <Text className={getLabelClass(true)}>
                Allergen Information (Required)
              </Text>
              <TextInput
                className={getInputClass(true)}
                placeholder="This field has an error..."
                placeholderTextColor="#94a3b8"
              />
              <Text className={getErrorClass()}>
                Please specify any known allergens
              </Text>
            </View>
            
            <View className="flex-row space-x-3">
              <SafetyButton 
                title="Validate" 
                onPress={() => setHasError(!hasError)}
                variant="secondary"
                className="flex-1"
              />
              <SafetyButton 
                title="Submit" 
                onPress={() => showAlert('Form submitted')}
                className="flex-1"
              />
            </View>
          </View>
        </View>
        
        {/* Alert Messages Section */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-text-primary mb-4">
            Alert Messages
          </Text>
          
          <View className="space-y-4">
            {alertTypes.map((type) => (
              <View key={type} className={getAlertClass(type)}>
                <Text className="font-medium mb-1 capitalize">
                  {type} Alert
                </Text>
                <Text className="text-sm">
                  This is an example {type} message for user feedback and system status communication.
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Medical Categories Section */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-text-primary mb-4">
            Medical Categories
          </Text>
          
          <View className="space-y-4">
            {medicalTypes.map((type) => {
              const info = getMedicalInfo(type);
              return (
                <View key={type} className={`medical-card border-l-4 border-l-medical-${type}`}>
                  <View className="flex-row items-center mb-2">
                    <Text className="text-lg mr-2">{info.icon}</Text>
                    <Text className="text-lg font-medium">{info.label}</Text>
                  </View>
                  <Text className="text-sm text-text-secondary">
                    {info.description}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Typography Section */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-text-primary mb-4">
            Typography Scale
          </Text>
          
          <View className="medical-card space-y-3">
            <Text className="text-4xl font-bold text-text-primary">
              Heading 1 - Main titles
            </Text>
            <Text className="text-3xl font-semibold text-text-primary">
              Heading 2 - Section headers
            </Text>
            <Text className="text-2xl font-medium text-text-primary">
              Heading 3 - Subsections
            </Text>
            <Text className="text-xl font-medium text-text-primary">
              Heading 4 - Card titles
            </Text>
            <Text className="text-lg text-text-primary">
              Large body text
            </Text>
            <Text className="text-base text-text-primary">
              Regular body text - main content
            </Text>
            <Text className="text-sm text-text-secondary">
              Small text - secondary information
            </Text>
            <Text className="text-xs text-text-tertiary">
              Caption text - metadata and timestamps
            </Text>
          </View>
        </View>
        
        {/* Spacing and Layout Section */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-text-primary mb-4">
            Spacing & Layout
          </Text>
          
          <View className="medical-card">
            <Text className="text-sm font-medium text-text-secondary mb-3">
              Touch Target Examples:
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <View className="touch-target bg-primary-100 rounded-lg flex items-center justify-center">
                <Text className="text-xs text-primary-700">44px</Text>
              </View>
              <View className="touch-target-android bg-primary-200 rounded-lg flex items-center justify-center">
                <Text className="text-xs text-primary-800">48px</Text>
              </View>
            </View>
            
            <Text className="text-sm font-medium text-text-secondary mt-6 mb-3">
              Spacing Scale:
            </Text>
            <View className="space-y-2">
              <View className="h-2 bg-neutral-200 rounded" />
              <View className="h-4 bg-neutral-300 rounded" />
              <View className="h-6 bg-neutral-400 rounded" />
              <View className="h-8 bg-neutral-500 rounded" />
            </View>
          </View>
        </View>
        
        {/* Bottom Safe Area */}
        <View className="h-8" />
      </View>
    </ScrollView>
  );
}

export default DesignSystemDemo;