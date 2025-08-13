/**
 * Scan Result Screen - Product safety assessment display
 * 
 * SAFETY CRITICAL: Displays product safety information with clear visual indicators
 * Must prioritize user safety with prominent warnings and clear guidance
 */

import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { ScannerStackScreenProps } from '../../types/navigation.types'
import { useProductSafety } from '../../hooks/useProductSafety'
import { SafetyBadge } from '../../components/SafetyBadge'
import { SafetyCard } from '../../components/SafetyCard'
import { Product, ProductSafetyAssessment, SafetyLevel } from '../../types/database.types'

type Props = ScannerStackScreenProps<'ScanResult'>

interface RiskFactor {
  ingredient_name: string
  risk_level: SafetyLevel
  restrictions_affected: string[]
  description?: string
}

export const ScanResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const { barcode, productName } = route.params
  
  const {
    currentProduct,
    safetyAssessment,
    loading,
    error,
    getSafetyLevel,
    getSafetyColor,
    getSafetyMessage,
    getRiskFactors,
    isSafeForUser,
    hasWarnings,
    hasDangers,
    criticalIngredients,
    scanProduct,
  } = useProductSafety()

  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Load product data when screen mounts
  useFocusEffect(
    useCallback(() => {
      if (barcode) {
        scanProduct(barcode)
      }
    }, [barcode, scanProduct])
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await scanProduct(barcode)
    } catch (error) {
      console.error('Failed to refresh product data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleScanAnother = () => {
    navigation.goBack()
  }

  const handleReportIssue = () => {
    Alert.alert(
      'Report Product Issue',
      'Would you like to report incorrect information about this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report Issue', 
          onPress: () => {
            // Navigate to issue reporting screen
            Alert.alert('Thank you', 'Your report will help improve product safety for everyone.')
          }
        }
      ]
    )
  }

  const handleViewAlternatives = () => {
    Alert.alert(
      'Alternative Products',
      'This feature will show safer alternatives for this product.',
      [{ text: 'OK' }]
    )
  }

  const handleAddToFavorites = () => {
    Alert.alert(
      'Add to Favorites',
      'This product will be added to your favorites for quick access.',
      [{ text: 'OK' }]
    )
  }

  const renderLoadingState = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E53E3E" />
        <Text style={styles.loadingText}>Analyzing product safety...</Text>
        <Text style={styles.loadingSubtext}>
          Checking ingredients against your dietary restrictions
        </Text>
      </View>
    </SafeAreaView>
  )

  const renderErrorState = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Analysis Failed</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <View style={styles.errorActions}>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.scanButton} onPress={handleScanAnother}>
            <Text style={styles.scanButtonText}>Scan Another</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )

  const renderSafetyHeader = () => {
    const safetyLevel = getSafetyLevel()
    const safetyColor = getSafetyColor()
    const safetyMessage = getSafetyMessage()

    return (
      <View style={[styles.safetyHeader, { backgroundColor: safetyColor }]}>
        <View style={styles.safetyIconContainer}>
          <Text style={styles.safetyIcon}>
            {safetyLevel === 'safe' ? '✅' : 
             safetyLevel === 'caution' ? '⚠️' : 
             safetyLevel === 'warning' ? '⚠️' : '🚫'}
          </Text>
        </View>
        <View style={styles.safetyContent}>
          <Text style={styles.safetyTitle}>
            {safetyLevel === 'safe' ? 'SAFE TO CONSUME' :
             safetyLevel === 'caution' ? 'USE CAUTION' :
             safetyLevel === 'warning' ? 'WARNING' : 'DANGER - DO NOT CONSUME'}
          </Text>
          <Text style={styles.safetyMessage}>{safetyMessage}</Text>
        </View>
      </View>
    )
  }

  const renderProductInfo = () => (
    <SafetyCard style={styles.productCard}>
      <Text style={styles.productName}>{currentProduct?.name || productName || 'Unknown Product'}</Text>
      {currentProduct?.brand && (
        <Text style={styles.productBrand}>{currentProduct.brand}</Text>
      )}
      <Text style={styles.productBarcode}>Barcode: {barcode}</Text>
      
      {currentProduct?.category && (
        <View style={styles.productMeta}>
          <Text style={styles.productCategory}>{currentProduct.category}</Text>
          {currentProduct.package_size && (
            <Text style={styles.productSize}>{currentProduct.package_size}</Text>
          )}
        </View>
      )}
    </SafetyCard>
  )

  const renderRiskFactors = () => {
    const riskFactors = getRiskFactors() as RiskFactor[]
    
    if (!riskFactors || riskFactors.length === 0) {
      return null
    }

    return (
      <SafetyCard style={styles.riskCard}>
        <Text style={styles.sectionTitle}>Risk Factors</Text>
        {riskFactors.map((risk, index) => (
          <View key={index} style={styles.riskItem}>
            <View style={styles.riskHeader}>
              <SafetyBadge 
                level={risk.risk_level} 
                text={risk.ingredient_name}
                size="small"
              />
            </View>
            {risk.description && (
              <Text style={styles.riskDescription}>{risk.description}</Text>
            )}
          </View>
        ))}
      </SafetyCard>
    )
  }

  const renderIngredientsList = () => {
    if (!currentProduct?.ingredients_list) {
      return null
    }

    return (
      <SafetyCard style={styles.ingredientsCard}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        <Text style={styles.ingredientsText}>{currentProduct.ingredients_list}</Text>
        
        {currentProduct.allergen_warnings && currentProduct.allergen_warnings.length > 0 && (
          <View style={styles.allergenSection}>
            <Text style={styles.allergenTitle}>⚠️ Allergen Information:</Text>
            {currentProduct.allergen_warnings.map((allergen, index) => (
              <Text key={index} style={styles.allergenText}>• {allergen}</Text>
            ))}
          </View>
        )}
      </SafetyCard>
    )
  }

  const renderAssessmentDetails = () => {
    if (!safetyAssessment) {
      return null
    }

    return (
      <SafetyCard style={styles.assessmentCard}>
        <Text style={styles.sectionTitle}>Assessment Details</Text>
        
        <View style={styles.assessmentStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{safetyAssessment.safe_ingredients_count}</Text>
            <Text style={styles.statLabel}>Safe Ingredients</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{safetyAssessment.warning_ingredients_count}</Text>
            <Text style={styles.statLabel}>Warning Ingredients</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{safetyAssessment.dangerous_ingredients_count}</Text>
            <Text style={styles.statLabel}>Dangerous Ingredients</Text>
          </View>
        </View>

        <View style={styles.confidenceSection}>
          <Text style={styles.confidenceLabel}>Confidence Score</Text>
          <View style={styles.confidenceBar}>
            <View 
              style={[
                styles.confidenceFill, 
                { width: `${safetyAssessment.confidence_score}%` }
              ]} 
            />
          </View>
          <Text style={styles.confidenceText}>{safetyAssessment.confidence_score}%</Text>
        </View>
      </SafetyCard>
    )
  }

  const renderActions = () => (
    <View style={styles.actions}>
      <View style={styles.primaryActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.scanAnotherButton]} 
          onPress={handleScanAnother}
        >
          <Text style={styles.scanAnotherText}>Scan Another Product</Text>
        </TouchableOpacity>

        {!isSafeForUser && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.alternativesButton]} 
            onPress={handleViewAlternatives}
          >
            <Text style={styles.alternativesText}>Find Safe Alternatives</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.secondaryActions}>
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={handleAddToFavorites}
        >
          <Text style={styles.secondaryButtonText}>❤️ Add to Favorites</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={handleReportIssue}
        >
          <Text style={styles.secondaryButtonText}>📋 Report Issue</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  if (loading && !currentProduct) {
    return renderLoadingState()
  }

  if (error && !currentProduct) {
    return renderErrorState()
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        {renderSafetyHeader()}
        {renderProductInfo()}
        {renderRiskFactors()}
        {renderIngredientsList()}
        {showDetailedAnalysis && renderAssessmentDetails()}
        
        {safetyAssessment && (
          <TouchableOpacity 
            style={styles.detailsToggle}
            onPress={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
          >
            <Text style={styles.detailsToggleText}>
              {showDetailedAnalysis ? 'Hide' : 'Show'} Detailed Analysis
            </Text>
          </TouchableOpacity>
        )}

        {renderActions()}
      </ScrollView>
    </SafeAreaView>
  )
}

const { width } = Dimensions.get('window')

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#E53E3E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: '#6C757D',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  safetyIconContainer: {
    marginRight: 16,
  },
  safetyIcon: {
    fontSize: 32,
  },
  safetyContent: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  safetyMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 18,
  },
  productCard: {
    margin: 16,
    marginTop: 0,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  productBarcode: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productCategory: {
    fontSize: 14,
    color: '#666666',
    backgroundColor: '#E9ECEF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    flex: 1,
    textAlign: 'center',
  },
  productSize: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  riskCard: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  riskItem: {
    marginBottom: 12,
  },
  riskHeader: {
    marginBottom: 4,
  },
  riskDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
    paddingLeft: 12,
  },
  ingredientsCard: {
    margin: 16,
    marginTop: 0,
  },
  ingredientsText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 12,
  },
  allergenSection: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  allergenTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  allergenText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 2,
  },
  assessmentCard: {
    margin: 16,
    marginTop: 0,
  },
  assessmentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 4,
  },
  confidenceSection: {
    marginTop: 16,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#28A745',
  },
  confidenceText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
    marginTop: 4,
  },
  detailsToggle: {
    margin: 16,
    marginTop: 0,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  detailsToggleText: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '600',
  },
  actions: {
    margin: 16,
    marginTop: 0,
  },
  primaryActions: {
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanAnotherButton: {
    backgroundColor: '#007BFF',
  },
  scanAnotherText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  alternativesButton: {
    backgroundColor: '#28A745',
  },
  alternativesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  secondaryButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '600',
  },
})