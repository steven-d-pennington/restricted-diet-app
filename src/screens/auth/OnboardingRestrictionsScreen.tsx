/**
 * Onboarding Dietary Restrictions Selection Screen
 * 
 * SAFETY CRITICAL: Main screen for selecting dietary restrictions and allergies
 * Organized by category with search functionality and detailed descriptions
 */

import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SectionList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useOnboarding, getStepInfo, SelectedRestriction } from '../../contexts/OnboardingContext'
import { RestrictionType } from '../../types/database.types'
import { 
  useButtonClasses, 
  useInputClasses, 
  useAlertClasses,
  getSafetyInfo,
  cn 
} from '../../utils/designSystem'

interface RestrictionOption {
  id: string
  name: string
  category: RestrictionType
  description: string
  commonNames: string[]
  isCommonAllergen: boolean
  requiresVerification: boolean
  crossContaminationRisk: boolean
  medicalSeverityDefault: 'mild' | 'moderate' | 'severe' | 'life_threatening'
}

// Comprehensive list of dietary restrictions and allergies
const DIETARY_RESTRICTIONS: RestrictionOption[] = [
  // Food Allergies - Top 9 allergens
  {
    id: 'dairy',
    name: 'Dairy/Milk',
    category: 'allergy',
    description: 'Allergy to milk proteins (casein, whey)',
    commonNames: ['Milk', 'Lactose', 'Casein', 'Whey', 'Butter', 'Cream', 'Cheese'],
    isCommonAllergen: true,
    requiresVerification: true,
    crossContaminationRisk: true,
    medicalSeverityDefault: 'severe',
  },
  {
    id: 'eggs',
    name: 'Eggs',
    category: 'allergy',
    description: 'Allergy to egg proteins',
    commonNames: ['Egg', 'Albumin', 'Lecithin', 'Mayonnaise'],
    isCommonAllergen: true,
    requiresVerification: true,
    crossContaminationRisk: true,
    medicalSeverityDefault: 'severe',
  },
  {
    id: 'peanuts',
    name: 'Peanuts',
    category: 'allergy',
    description: 'Allergy to peanuts (legume family)',
    commonNames: ['Peanut', 'Groundnut', 'Arachis oil'],
    isCommonAllergen: true,
    requiresVerification: true,
    crossContaminationRisk: true,
    medicalSeverityDefault: 'life_threatening',
  },
  {
    id: 'tree_nuts',
    name: 'Tree Nuts',
    category: 'allergy',
    description: 'Allergy to tree nuts (almonds, walnuts, cashews, etc.)',
    commonNames: ['Almond', 'Walnut', 'Cashew', 'Pecan', 'Hazelnut', 'Pistachio', 'Macadamia'],
    isCommonAllergen: true,
    requiresVerification: true,
    crossContaminationRisk: true,
    medicalSeverityDefault: 'life_threatening',
  },
  {
    id: 'shellfish',
    name: 'Shellfish',
    category: 'allergy',
    description: 'Allergy to crustaceans and mollusks',
    commonNames: ['Shrimp', 'Crab', 'Lobster', 'Scallop', 'Oyster', 'Clam', 'Mussel'],
    isCommonAllergen: true,
    requiresVerification: true,
    crossContaminationRisk: true,
    medicalSeverityDefault: 'severe',
  },
  {
    id: 'fish',
    name: 'Fish',
    category: 'allergy',
    description: 'Allergy to finned fish',
    commonNames: ['Salmon', 'Tuna', 'Bass', 'Anchovy', 'Fish sauce'],
    isCommonAllergen: true,
    requiresVerification: true,
    crossContaminationRisk: true,
    medicalSeverityDefault: 'severe',
  },
  {
    id: 'soy',
    name: 'Soy',
    category: 'allergy',
    description: 'Allergy to soy proteins',
    commonNames: ['Soybean', 'Tofu', 'Tempeh', 'Soy sauce', 'Lecithin', 'Edamame'],
    isCommonAllergen: true,
    requiresVerification: true,
    crossContaminationRisk: true,
    medicalSeverityDefault: 'moderate',
  },
  {
    id: 'wheat',
    name: 'Wheat',
    category: 'allergy',
    description: 'Allergy to wheat proteins (different from celiac disease)',
    commonNames: ['Wheat', 'Flour', 'Gluten', 'Semolina', 'Spelt'],
    isCommonAllergen: true,
    requiresVerification: true,
    crossContaminationRisk: true,
    medicalSeverityDefault: 'moderate',
  },
  {
    id: 'sesame',
    name: 'Sesame',
    category: 'allergy',
    description: 'Allergy to sesame seeds',
    commonNames: ['Sesame', 'Tahini', 'Sesame oil', 'Halvah'],
    isCommonAllergen: true,
    requiresVerification: true,
    crossContaminationRisk: true,
    medicalSeverityDefault: 'severe',
  },

  // Food Intolerances
  {
    id: 'lactose_intolerance',
    name: 'Lactose Intolerance',
    category: 'intolerance',
    description: 'Inability to digest lactose sugar in dairy products',
    commonNames: ['Lactose', 'Milk sugar'],
    isCommonAllergen: false,
    requiresVerification: false,
    crossContaminationRisk: false,
    medicalSeverityDefault: 'mild',
  },
  {
    id: 'gluten_intolerance',
    name: 'Gluten Sensitivity (Non-Celiac)',
    category: 'intolerance',
    description: 'Sensitivity to gluten proteins without celiac disease',
    commonNames: ['Gluten', 'Wheat protein', 'Barley', 'Rye'],
    isCommonAllergen: false,
    requiresVerification: false,
    crossContaminationRisk: true,
    medicalSeverityDefault: 'moderate',
  },
  {
    id: 'fodmap',
    name: 'FODMAP Sensitivity',
    category: 'intolerance',
    description: 'Sensitivity to fermentable carbohydrates',
    commonNames: ['Fructose', 'Sorbitol', 'Mannitol', 'Inulin'],
    isCommonAllergen: false,
    requiresVerification: false,
    crossContaminationRisk: false,
    medicalSeverityDefault: 'moderate',
  },
  {
    id: 'histamine_intolerance',
    name: 'Histamine Intolerance',
    category: 'intolerance',
    description: 'Inability to break down histamine in foods',
    commonNames: ['Aged cheese', 'Wine', 'Fermented foods', 'Cured meats'],
    isCommonAllergen: false,
    requiresVerification: false,
    crossContaminationRisk: false,
    medicalSeverityDefault: 'moderate',
  },

  // Medical Diets
  {
    id: 'celiac',
    name: 'Celiac Disease',
    category: 'medical',
    description: 'Autoimmune disorder requiring strict gluten-free diet',
    commonNames: ['Gluten', 'Wheat', 'Barley', 'Rye', 'Malt'],
    isCommonAllergen: false,
    requiresVerification: true,
    crossContaminationRisk: true,
    medicalSeverityDefault: 'severe',
  },
  {
    id: 'diabetes',
    name: 'Diabetes Management',
    category: 'medical',
    description: 'Blood sugar management requiring carbohydrate awareness',
    commonNames: ['Sugar', 'Carbohydrates', 'High glycemic foods'],
    isCommonAllergen: false,
    requiresVerification: false,
    crossContaminationRisk: false,
    medicalSeverityDefault: 'moderate',
  },
  {
    id: 'kidney_disease',
    name: 'Renal Diet',
    category: 'medical',
    description: 'Kidney disease requiring potassium, phosphorus, and sodium restriction',
    commonNames: ['Potassium', 'Phosphorus', 'Sodium', 'Protein'],
    isCommonAllergen: false,
    requiresVerification: true,
    crossContaminationRisk: false,
    medicalSeverityDefault: 'severe',
  },
  {
    id: 'heart_disease',
    name: 'Heart-Healthy Diet',
    category: 'medical',
    description: 'Low sodium, low saturated fat diet for cardiovascular health',
    commonNames: ['Sodium', 'Salt', 'Saturated fat', 'Trans fat'],
    isCommonAllergen: false,
    requiresVerification: false,
    crossContaminationRisk: false,
    medicalSeverityDefault: 'moderate',
  },

  // Lifestyle Diets
  {
    id: 'vegan',
    name: 'Vegan',
    category: 'lifestyle',
    description: 'Plant-based diet excluding all animal products',
    commonNames: ['Animal products', 'Meat', 'Dairy', 'Eggs', 'Honey'],
    isCommonAllergen: false,
    requiresVerification: false,
    crossContaminationRisk: false,
    medicalSeverityDefault: 'mild',
  },
  {
    id: 'vegetarian',
    name: 'Vegetarian',
    category: 'lifestyle',
    description: 'Diet excluding meat and fish',
    commonNames: ['Meat', 'Poultry', 'Fish', 'Seafood'],
    isCommonAllergen: false,
    requiresVerification: false,
    crossContaminationRisk: false,
    medicalSeverityDefault: 'mild',
  },
  {
    id: 'keto',
    name: 'Ketogenic Diet',
    category: 'lifestyle',
    description: 'Very low carbohydrate, high fat diet',
    commonNames: ['Carbohydrates', 'Sugar', 'Grains', 'High-carb foods'],
    isCommonAllergen: false,
    requiresVerification: false,
    crossContaminationRisk: false,
    medicalSeverityDefault: 'mild',
  },
  {
    id: 'paleo',
    name: 'Paleo Diet',
    category: 'lifestyle',
    description: 'Diet based on presumed ancient human diet',
    commonNames: ['Grains', 'Legumes', 'Dairy', 'Processed foods'],
    isCommonAllergen: false,
    requiresVerification: false,
    crossContaminationRisk: false,
    medicalSeverityDefault: 'mild',
  },

  // Religious Diets
  {
    id: 'kosher',
    name: 'Kosher',
    category: 'religious',
    description: 'Jewish dietary laws',
    commonNames: ['Non-kosher foods', 'Pork', 'Shellfish', 'Meat and dairy combinations'],
    isCommonAllergen: false,
    requiresVerification: false,
    crossContaminationRisk: false,
    medicalSeverityDefault: 'mild',
  },
  {
    id: 'halal',
    name: 'Halal',
    category: 'religious',
    description: 'Islamic dietary laws',
    commonNames: ['Pork', 'Alcohol', 'Non-halal meat'],
    isCommonAllergen: false,
    requiresVerification: false,
    crossContaminationRisk: false,
    medicalSeverityDefault: 'mild',
  },
]

const CATEGORY_INFO = {
  allergy: {
    title: 'Food Allergies',
    description: 'Immune system reactions to specific foods',
    icon: '⚠️',
    color: 'safety-danger',
  },
  intolerance: {
    title: 'Food Intolerances',
    description: 'Digestive issues with certain foods',
    icon: '⚡',
    color: 'safety-caution',
  },
  medical: {
    title: 'Medical Diets',
    description: 'Medically prescribed dietary restrictions',
    icon: '🏥',
    color: 'primary',
  },
  lifestyle: {
    title: 'Lifestyle Diets',
    description: 'Personal dietary choices and preferences',
    icon: '🌱',
    color: 'safety-safe',
  },
  religious: {
    title: 'Religious Diets',
    description: 'Faith-based dietary requirements',
    icon: '🕊️',
    color: 'neutral',
  },
  preference: {
    title: 'Food Preferences',
    description: 'Personal taste preferences',
    icon: '👤',
    color: 'neutral',
  },
}

export const OnboardingRestrictionsScreen: React.FC = () => {
  const { state, dispatch, goToNextStep, goToPreviousStep, getStepProgress } = useOnboarding()
  const { getButtonClass, getOutlineButtonClass } = useButtonClasses()
  const { getInputClass } = useInputClasses()
  const { getAlertClass } = useAlertClasses()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<RestrictionType | 'all'>('all')
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)

  const stepInfo = getStepInfo('restrictions_category')
  const progress = getStepProgress()

  // Filter restrictions based on search and category
  const filteredRestrictions = useMemo(() => {
    let filtered = DIETARY_RESTRICTIONS

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(r => r.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.commonNames.some(name => name.toLowerCase().includes(query))
      )
    }

    // Show selected only if toggled
    if (showSelectedOnly) {
      filtered = filtered.filter(r => 
        state.selectedRestrictions.some(sr => sr.id === r.id)
      )
    }

    // Group by category for section list
    const grouped = filtered.reduce((acc, restriction) => {
      const category = restriction.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(restriction)
      return acc
    }, {} as Record<RestrictionType, RestrictionOption[]>)

    // Convert to section list format
    return Object.entries(grouped).map(([category, restrictions]) => ({
      title: category as RestrictionType,
      data: restrictions,
    }))
  }, [searchQuery, selectedCategory, showSelectedOnly, state.selectedRestrictions])

  const handleRestrictionToggle = (restriction: RestrictionOption) => {
    const isSelected = state.selectedRestrictions.some(sr => sr.id === restriction.id)
    
    if (isSelected) {
      dispatch({ type: 'REMOVE_RESTRICTION', payload: restriction.id })
    } else {
      const selectedRestriction: SelectedRestriction = {
        id: restriction.id,
        name: restriction.name,
        category: restriction.category,
        severity: restriction.medicalSeverityDefault,
        doctorVerified: false,
        crossContaminationSensitive: restriction.crossContaminationRisk,
      }
      
      // Show warning for high-risk allergies
      if (restriction.medicalSeverityDefault === 'life_threatening' || restriction.medicalSeverityDefault === 'severe') {
        Alert.alert(
          'Important Safety Notice',
          `You're adding ${restriction.name} as a ${restriction.medicalSeverityDefault} restriction. Please ensure you have appropriate emergency medications (like an EpiPen) and emergency contacts configured.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Add Restriction',
              style: 'default',
              onPress: () => dispatch({ type: 'ADD_RESTRICTION', payload: selectedRestriction }),
            },
          ]
        )
      } else {
        dispatch({ type: 'ADD_RESTRICTION', payload: selectedRestriction })
      }
    }
  }

  const handleContinue = () => {
    if (state.selectedRestrictions.length === 0) {
      Alert.alert(
        'No Restrictions Selected',
        'You haven\'t selected any dietary restrictions. You can skip this step if you have no restrictions, or continue to add them later in your profile settings.\n\nWould you like to continue without restrictions?',
        [
          {
            text: 'Add Restrictions',
            style: 'cancel',
          },
          {
            text: 'Continue Without',
            style: 'default',
            onPress: goToNextStep,
          },
        ]
      )
      return
    }

    goToNextStep()
  }

  const renderCategoryFilter = () => {
    const categories: Array<{ key: 'all' | RestrictionType; label: string }> = [
      { key: 'all', label: 'All' },
      { key: 'allergy', label: 'Allergies' },
      { key: 'intolerance', label: 'Intolerances' },
      { key: 'medical', label: 'Medical' },
      { key: 'lifestyle', label: 'Lifestyle' },
      { key: 'religious', label: 'Religious' },
    ]

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        contentContainerStyle={{ paddingHorizontal: 0 }}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category.key}
            className={cn(
              'px-4 py-2 rounded-full mr-2 border',
              selectedCategory === category.key 
                ? 'bg-primary-500 border-primary-500' 
                : 'bg-white border-neutral-300'
            )}
            onPress={() => setSelectedCategory(category.key)}
          >
            <Text className={cn(
              'text-sm font-medium',
              selectedCategory === category.key 
                ? 'text-white' 
                : 'text-neutral-700'
            )}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    )
  }

  const renderRestrictionItem = (restriction: RestrictionOption) => {
    const isSelected = state.selectedRestrictions.some(sr => sr.id === restriction.id)
    const categoryInfo = CATEGORY_INFO[restriction.category]
    
    return (
      <TouchableOpacity
        key={restriction.id}
        className={cn(
          'border rounded-xl p-4 mb-3',
          isSelected 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-neutral-200 bg-white'
        )}
        onPress={() => handleRestrictionToggle(restriction)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={restriction.name}
        accessibilityHint={restriction.description}
      >
        <View className="flex-row items-start">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-1">
              <Text className="text-lg mr-2">{categoryInfo.icon}</Text>
              <Text className={cn(
                'text-lg font-semibold',
                isSelected ? 'text-primary-700' : 'text-neutral-900'
              )}>
                {restriction.name}
              </Text>
              {restriction.isCommonAllergen && (
                <View className="bg-safety-caution-100 px-2 py-1 rounded-full ml-2">
                  <Text className="text-xs font-medium text-safety-caution-700">
                    Common Allergen
                  </Text>
                </View>
              )}
            </View>
            
            <Text className="text-sm text-neutral-600 mb-2">
              {restriction.description}
            </Text>
            
            {restriction.commonNames.length > 0 && (
              <Text className="text-xs text-neutral-500">
                Also known as: {restriction.commonNames.slice(0, 4).join(', ')}
                {restriction.commonNames.length > 4 && '...'}
              </Text>
            )}
            
            <View className="flex-row items-center mt-2">
              {restriction.crossContaminationRisk && (
                <View className="bg-safety-caution-100 px-2 py-1 rounded-full mr-2">
                  <Text className="text-xs text-safety-caution-700">Cross-contamination risk</Text>
                </View>
              )}
              {restriction.requiresVerification && (
                <View className="bg-info-100 px-2 py-1 rounded-full">
                  <Text className="text-xs text-info-700">Medical verification recommended</Text>
                </View>
              )}
            </View>
          </View>
          
          <View className={cn(
            'w-6 h-6 rounded-full border-2 items-center justify-center',
            isSelected 
              ? 'border-primary-500 bg-primary-500' 
              : 'border-neutral-300 bg-white'
          )}>
            {isSelected && (
              <Text className="text-white text-sm font-bold">✓</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderSectionHeader = ({ section }: { section: { title: RestrictionType } }) => {
    const categoryInfo = CATEGORY_INFO[section.title]
    
    return (
      <View className="bg-white py-3">
        <View className="flex-row items-center">
          <Text className="text-2xl mr-2">{categoryInfo.icon}</Text>
          <View>
            <Text className="text-lg font-semibold text-neutral-900">
              {categoryInfo.title}
            </Text>
            <Text className="text-sm text-neutral-600">
              {categoryInfo.description}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with Progress */}
      <View className="border-b border-neutral-200 px-6 py-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm text-neutral-500">
            Step {progress.current} of {progress.total}
          </Text>
          <Text className="text-sm text-neutral-500">
            {progress.percentage}% Complete
          </Text>
        </View>
        <View className="w-full h-2 bg-neutral-200 rounded-full">
          <View 
            className="h-2 bg-primary-500 rounded-full"
            style={{ width: `${progress.percentage}%` }}
          />
        </View>
        <Text className="text-2xl font-bold text-neutral-900 mt-4">
          {stepInfo.title}
        </Text>
        <Text className="text-base text-neutral-600">
          {stepInfo.subtitle}
        </Text>
      </View>

      {/* Search and Filters */}
      <View className="px-6 py-4 border-b border-neutral-100">
        <TextInput
          className={cn(getInputClass(false), 'mb-4')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search restrictions..."
          returnKeyType="search"
        />
        
        {renderCategoryFilter()}
        
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => setShowSelectedOnly(!showSelectedOnly)}
          >
            <View className={cn(
              'w-5 h-5 rounded border-2 mr-2 items-center justify-center',
              showSelectedOnly ? 'bg-primary-500 border-primary-500' : 'border-neutral-300'
            )}>
              {showSelectedOnly && (
                <Text className="text-white text-xs font-bold">✓</Text>
              )}
            </View>
            <Text className="text-sm text-neutral-700">
              Show selected only
            </Text>
          </TouchableOpacity>
          
          <Text className="text-sm text-neutral-500">
            {state.selectedRestrictions.length} selected
          </Text>
        </View>
      </View>

      {/* Selected Restrictions Summary */}
      {state.selectedRestrictions.length > 0 && (
        <View className={cn(getAlertClass('info'), 'm-4')}>
          <Text className="text-sm font-medium text-info-800 mb-1">
            Selected Restrictions ({state.selectedRestrictions.length}):
          </Text>
          <Text className="text-sm text-info-700">
            {state.selectedRestrictions.map(r => r.name).join(', ')}
          </Text>
        </View>
      )}

      {/* Restrictions List */}
      <SectionList
        sections={filteredRestrictions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderRestrictionItem(item)}
        renderSectionHeader={renderSectionHeader}
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />

      {/* Bottom Action Bar */}
      <View className="border-t border-neutral-200 p-4 bg-white">
        <View className="flex-row space-x-3">
          <TouchableOpacity
            className={cn(getOutlineButtonClass('secondary', 'lg'), 'flex-1')}
            onPress={goToPreviousStep}
            accessibilityRole="button"
            accessibilityLabel="Go back to basic information"
          >
            <Text className="text-base font-medium text-neutral-700">
              Back
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={cn(getButtonClass('primary', 'lg'), 'flex-2')}
            onPress={handleContinue}
            accessibilityRole="button"
            accessibilityLabel="Continue to severity configuration"
          >
            <Text className="text-base font-medium text-white">
              Continue ({state.selectedRestrictions.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}