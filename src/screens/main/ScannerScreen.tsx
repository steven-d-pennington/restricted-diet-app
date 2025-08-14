/**
 * Scanner Screen - Real-time barcode scanning interface
 * 
 * SAFETY CRITICAL: Primary interface for product safety assessment
 * Must provide clear safety indicators and emergency access
 */

import React, { useState, useEffect, useCallback } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  Alert,
  Dimensions,
  StatusBar,
  ActivityIndicator
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { ScannerStackScreenProps } from '../../types/navigation.types'
import { BarcodeCamera } from '../../components/BarcodeCamera'
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner'
import { useProductSafety } from '../../hooks/useProductSafety'
import productLookupService from '../../services/productLookupService'

type Props = ScannerStackScreenProps<'ScannerCamera'>

export const ScannerScreen: React.FC<Props> = ({ navigation }) => {
  const {
    state: scannerState,
    startScanning,
    stopScanning,
    resetScanner,
    handleBarcodeScanned,
  } = useBarcodeScanner()

  const {
    currentProduct,
    loading: productLoading,
    error: productError,
    scanProduct,
  } = useProductSafety()

  const [processingBarcode, setProcessingBarcode] = useState(false)
  const [lastProcessedBarcode, setLastProcessedBarcode] = useState<string | null>(null)

  // Handle screen focus/unfocus
  useFocusEffect(
    useCallback(() => {
      startScanning()
      return () => {
        stopScanning()
      }
    }, [])
  )

  // Handle successful product lookup
  useEffect(() => {
    if (currentProduct && !productLoading && !processingBarcode) {
      // Navigate to scan result with product data
      navigation.navigate('ScanResult', {
        barcode: currentProduct.barcode,
        productName: currentProduct.name,
      })
    }
  }, [currentProduct, productLoading, processingBarcode, navigation])

  // Handle barcode scanning
  const onBarcodeScanned = useCallback(async (barcode: string, type: string) => {
    // Prevent duplicate processing
    if (processingBarcode || barcode === lastProcessedBarcode) {
      return
    }

    setProcessingBarcode(true)
    setLastProcessedBarcode(barcode)

    try {
      // Use the scanner hook to handle barcode
      await handleBarcodeScanned(barcode, type)

      // Lookup product with comprehensive service
      const lookupResult = await productLookupService.lookupProduct(barcode)
      
      if (lookupResult.product) {
        // Scan the product for safety assessment
        await scanProduct(barcode)
      } else {
        // Product not found - navigate to manual entry
        navigation.navigate('ManualEntry', { barcode, barcodeType: type })
      }
    } catch (error) {
      console.error('Barcode processing failed:', error)
      Alert.alert(
        'Scan Error',
        'Failed to process barcode. Please try again or enter product information manually.',
        [
          { text: 'Try Again', onPress: () => resetScanner() },
          { text: 'Manual Entry', onPress: () => navigation.navigate({ name: 'ManualEntry', params: { barcode } }) }
        ]
      )
    } finally {
      setProcessingBarcode(false)
    }
  }, [processingBarcode, lastProcessedBarcode, handleBarcodeScanned, scanProduct, navigation, resetScanner])

  // Handle camera errors
  const onCameraError = useCallback((error: string) => {
    Alert.alert(
      'Camera Error',
      error,
      [
  { text: 'OK', onPress: () => resetScanner() },
  { text: 'Manual Entry', onPress: () => navigation.navigate({ name: 'ManualEntry', params: {} }) }
      ]
    )
  }, [navigation, resetScanner])

  const handleManualEntry = () => {
  navigation.navigate({ name: 'ManualEntry', params: {} })
  }

  const handleEmergencyAccess = () => {
    navigation.getParent()?.navigate('Emergency')
  }

  // Simulate barcode scan for development
  const simulateScan = () => {
    const sampleBarcodes = [
      '012000005107', // Coca-Cola
      '028400064057', // Lay's Chips
      '041220576210', // Oreos
      '123456789012', // Test barcode
    ]
    const randomBarcode = sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)]
    onBarcodeScanned(randomBarcode, 'ean13')
  }

  // Show loading screen while initializing
  if (scannerState.hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E53E3E" />
          <Text style={styles.loadingText}>Initializing camera...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Show permission denied screen
  if (scannerState.hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Camera access is needed to scan product barcodes for your safety.
            This helps identify ingredients that may be harmful to you.
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={handleManualEntry}
          >
            <Text style={styles.permissionButtonText}>Continue with Manual Entry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Camera View */}
      <BarcodeCamera
        onBarcodeScanned={onBarcodeScanned}
        onError={onCameraError}
        isActive={scannerState.isActive && !processingBarcode}
      >
        {/* Header Overlay */}
        <View style={styles.headerOverlay}>
          <Text style={styles.title}>Scan Product Barcode</Text>
          <Text style={styles.subtitle}>
            Point your camera at the product barcode
          </Text>
          {scannerState.error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {scannerState.error}</Text>
            </View>
          )}
        </View>

        {/* Processing Indicator */}
        {(processingBarcode || productLoading) && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.processingText}>
                {processingBarcode ? 'Processing barcode...' : 'Looking up product...'}
              </Text>
            </View>
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              💡 Hold steady • Good lighting • Keep barcode in frame
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.manualButton]} 
              onPress={handleManualEntry}
              accessibilityLabel="Enter product information manually"
            >
              <Text style={styles.manualButtonText}>Manual Entry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.emergencyButton]} 
              onPress={handleEmergencyAccess}
              accessibilityLabel="Access emergency information"
            >
              <Text style={styles.emergencyButtonText}>🆘 Emergency</Text>
            </TouchableOpacity>
          </View>

          {/* Development: Simulate scan button */}
          {__DEV__ && (
            <TouchableOpacity 
              style={styles.devButton} 
              onPress={simulateScan}
            >
              <Text style={styles.devButtonText}>
                🔧 Simulate Scan (Dev)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </BarcodeCamera>
    </View>
  )
}

const { width, height } = Dimensions.get('window')

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#E53E3E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#EF4444',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingBottom: 40,
  },
  instructions: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  manualButton: {
    backgroundColor: '#6C757D',
    marginRight: 8,
  },
  manualButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emergencyButton: {
    backgroundColor: '#E53E3E',
    marginLeft: 8,
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  devButton: {
    backgroundColor: '#F59E0B',
    marginHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  devButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
})