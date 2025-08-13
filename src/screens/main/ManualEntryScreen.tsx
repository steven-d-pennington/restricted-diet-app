/**
 * Manual Product Entry Screen - Manual product information entry
 * 
 * SAFETY CRITICAL: Allows users to manually enter product information
 * when barcode scanning fails or products are not in the database
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { ScannerStackScreenProps } from '../../types/navigation.types'
import { SafetyCard } from '../../components/SafetyCard'
import { ProductInsert } from '../../types/database.types'
import { productService } from '../../services/database'
import { useProductSafety } from '../../hooks/useProductSafety'

type Props = ScannerStackScreenProps<'ManualEntry'>

interface ProductFormData {
  barcode?: string
  name: string
  brand: string
  manufacturer: string
  category: string
  ingredients_list: string
  allergen_warnings: string[]
  package_size: string
  country_of_origin: string
}

export const ManualEntryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { barcode, barcodeType } = route.params || {}
  const { addProduct, loading, error } = useProductSafety()

  const [formData, setFormData] = useState<ProductFormData>({
    barcode: barcode || '',
    name: '',
    brand: '',
    manufacturer: '',
    category: '',
    ingredients_list: '',
    allergen_warnings: [],
    package_size: '',
    country_of_origin: '',
  })

  const [allergenInput, setAllergenInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (barcode) {
      setFormData(prev => ({ ...prev, barcode }))
    }
  }, [barcode])

  const updateFormField = useCallback((field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [errors])

  const addAllergenWarning = useCallback(() => {
    if (allergenInput.trim()) {
      setFormData(prev => ({
        ...prev,
        allergen_warnings: [...prev.allergen_warnings, allergenInput.trim()]
      }))
      setAllergenInput('')
    }
  }, [allergenInput])

  const removeAllergenWarning = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      allergen_warnings: prev.allergen_warnings.filter((_, i) => i !== index)
    }))
  }, [])

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Product category is required'
    }

    if (!formData.ingredients_list.trim()) {
      newErrors.ingredients_list = 'Ingredients list is required for safety analysis'
    }

    if (formData.barcode && !/^\d{8,14}$/.test(formData.barcode)) {
      newErrors.barcode = 'Barcode must be 8-14 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors below and try again.')
      return
    }

    setSaving(true)

    try {
      const productData: ProductInsert = {
        barcode: formData.barcode || `manual-${Date.now()}`,
        name: formData.name.trim(),
        brand: formData.brand.trim() || null,
        manufacturer: formData.manufacturer.trim() || null,
        category: formData.category.trim(),
        ingredients_list: formData.ingredients_list.trim(),
        allergen_warnings: formData.allergen_warnings.length > 0 ? formData.allergen_warnings : null,
        package_size: formData.package_size.trim() || null,
        country_of_origin: formData.country_of_origin.trim() || null,
        data_source: 'user_entry',
        data_quality_score: 75, // User-entered data gets moderate quality score
        last_verified_date: new Date().toISOString(),
        verification_count: 1,
        is_active: true,
      }

      const product = await addProduct(productData)

      if (product) {
        Alert.alert(
          'Product Added',
          'Thank you for contributing! The product has been added and is being analyzed for safety.',
          [
            {
              text: 'View Results',
              onPress: () => navigation.navigate('ScanResult', {
                barcode: product.barcode,
                productName: product.name,
              })
            }
          ]
        )
      } else {
        throw new Error('Failed to add product')
      }
    } catch (error) {
      console.error('Failed to add product:', error)
      Alert.alert(
        'Error',
        'Failed to add product. Please check your information and try again.',
        [{ text: 'OK' }]
      )
    } finally {
      setSaving(false)
    }
  }, [formData, validateForm, addProduct, navigation])

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Discard Changes?',
      'Are you sure you want to discard the product information you entered?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', onPress: () => navigation.goBack() }
      ]
    )
  }, [navigation])

  const renderFormField = (
    label: string,
    field: keyof ProductFormData,
    placeholder: string,
    required = false,
    multiline = false
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.requiredMark}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.multilineInput,
          errors[field] && styles.inputError
        ]}
        value={formData[field] as string}
        onChangeText={(value) => updateFormField(field, value)}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <SafetyCard style={styles.headerCard}>
            <Text style={styles.headerTitle}>Add Product Manually</Text>
            <Text style={styles.headerSubtitle}>
              Help us build a safer database by adding this product's information.
              Your contribution helps protect everyone with dietary restrictions.
            </Text>
            {barcode && (
              <View style={styles.barcodeInfo}>
                <Text style={styles.barcodeLabel}>Scanned Barcode:</Text>
                <Text style={styles.barcodeValue}>{barcode}</Text>
                {barcodeType && (
                  <Text style={styles.barcodeType}>({barcodeType.toUpperCase()})</Text>
                )}
              </View>
            )}
          </SafetyCard>

          {/* Basic Information */}
          <SafetyCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            {renderFormField('Product Name', 'name', 'e.g., Organic Whole Milk', true)}
            {renderFormField('Brand', 'brand', 'e.g., Organic Valley')}
            {renderFormField('Manufacturer', 'manufacturer', 'e.g., Organic Valley Cooperative')}
            {renderFormField('Category', 'category', 'e.g., Dairy Products', true)}
            {renderFormField('Package Size', 'package_size', 'e.g., 32 fl oz (946 mL)')}
            {renderFormField('Country of Origin', 'country_of_origin', 'e.g., United States')}
            
            {!barcode && renderFormField('Barcode (Optional)', 'barcode', 'Enter barcode if available')}
          </SafetyCard>

          {/* Ingredients */}
          <SafetyCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Ingredients & Allergens</Text>
            
            {renderFormField(
              'Ingredients List',
              'ingredients_list',
              'List all ingredients separated by commas (e.g., Organic Grade A Milk, Vitamin D3)',
              true,
              true
            )}

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Allergen Warnings</Text>
              <View style={styles.allergenInputContainer}>
                <TextInput
                  style={[styles.textInput, styles.allergenInput]}
                  value={allergenInput}
                  onChangeText={setAllergenInput}
                  placeholder="Add allergen warning (e.g., Contains milk)"
                  placeholderTextColor="#999999"
                  onSubmitEditing={addAllergenWarning}
                />
                <TouchableOpacity
                  style={styles.addAllergenButton}
                  onPress={addAllergenWarning}
                >
                  <Text style={styles.addAllergenButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              
              {formData.allergen_warnings.length > 0 && (
                <View style={styles.allergenList}>
                  {formData.allergen_warnings.map((allergen, index) => (
                    <View key={index} style={styles.allergenItem}>
                      <Text style={styles.allergenText}>{allergen}</Text>
                      <TouchableOpacity
                        style={styles.removeAllergenButton}
                        onPress={() => removeAllergenWarning(index)}
                      >
                        <Text style={styles.removeAllergenButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </SafetyCard>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={saving || loading}
            >
              <Text style={styles.submitButtonText}>
                {saving || loading ? 'Adding Product...' : 'Add Product'}
              </Text>
            </TouchableOpacity>
          </View>

          {error && (
            <SafetyCard style={styles.errorCard}>
              <Text style={styles.errorCardText}>⚠️ {error}</Text>
            </SafetyCard>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  barcodeInfo: {
    backgroundColor: '#E9ECEF',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  barcodeLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  barcodeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'monospace',
    marginRight: 8,
  },
  barcodeType: {
    fontSize: 12,
    color: '#666666',
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  requiredMark: {
    color: '#E53E3E',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#E53E3E',
  },
  errorText: {
    fontSize: 12,
    color: '#E53E3E',
    marginTop: 4,
  },
  allergenInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allergenInput: {
    flex: 1,
    marginRight: 8,
  },
  addAllergenButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addAllergenButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  allergenList: {
    marginTop: 12,
  },
  allergenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  allergenText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
  },
  removeAllergenButton: {
    padding: 4,
  },
  removeAllergenButtonText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#28A745',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    marginTop: 16,
    backgroundColor: '#F8D7DA',
    borderWidth: 1,
    borderColor: '#F5C6CB',
  },
  errorCardText: {
    color: '#721C24',
    fontSize: 14,
    textAlign: 'center',
  },
})