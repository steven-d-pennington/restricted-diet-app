/**
 * Barcode Camera Component - Real-time barcode scanning with camera
 * 
 * SAFETY CRITICAL: Primary interface for product identification
 * Must provide reliable barcode scanning with clear visual feedback
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native'

// Platform-specific imports
let Camera: any
let CameraType: any
let FlashMode: any
let BarCodeScanner: any
let BarCodeScannerResult: any

if (Platform.OS !== 'web') {
  try {
    const CameraComponents = require('expo-camera')
    Camera = CameraComponents.Camera
    CameraType = CameraComponents.CameraType
    FlashMode = CameraComponents.FlashMode
    
    const ScannerComponents = require('expo-barcode-scanner')
    BarCodeScanner = ScannerComponents.BarCodeScanner
    BarCodeScannerResult = ScannerComponents.BarCodeScannerResult
  } catch (error) {
    console.warn('Camera/Scanner modules not available:', error)
  }
}

interface BarcodeCameraProps {
  onBarcodeScanned: (barcode: string, type: string) => void
  onError: (error: string) => void
  isActive: boolean
  children?: React.ReactNode
}

// Web fallback component
const WebCameraFallback: React.FC<BarcodeCameraProps> = ({
  onError,
  children
}) => {
  useEffect(() => {
    onError('Camera scanning is not available on web platform. Please use the manual entry option.')
  }, [onError])

  return (
    <View style={[styles.container, styles.webFallbackContainer]}>
      <View style={styles.webFallbackContent}>
        <Text style={styles.webFallbackTitle}>Camera Not Available</Text>
        <Text style={styles.webFallbackText}>
          Camera scanning is not supported on web browsers.{"\n"}
          Please use manual barcode entry instead.
        </Text>
        <TouchableOpacity 
          style={styles.webFallbackButton}
          onPress={() => {
            Alert.alert('Manual Entry', 'Use the manual entry option in the main menu')
          }}
        >
          <Text style={styles.webFallbackButtonText}>Manual Entry</Text>
        </TouchableOpacity>
      </View>
      {children}
    </View>
  )
}

export const BarcodeCamera: React.FC<BarcodeCameraProps> = ({
  onBarcodeScanned,
  onError,
  isActive,
  children,
}) => {
  // Web fallback
  if (Platform.OS === 'web' || !Camera || !BarCodeScanner) {
    return (
      <WebCameraFallback
        onBarcodeScanned={onBarcodeScanned}
        onError={onError}
        isActive={isActive}
      >
        {children}
      </WebCameraFallback>
    )
  }
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanned, setScanned] = useState(false)
  const [flashMode, setFlashMode] = useState(FlashMode?.off || 'off')
  const [cameraReady, setCameraReady] = useState(false)
  const cameraRef = useRef<any>(null)

  // Request camera permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        if (!Camera) {
          onError('Camera not available on this platform')
          return
        }
        
        const { status } = await Camera.requestCameraPermissionsAsync()
        setHasPermission(status === 'granted')
        
        if (status !== 'granted') {
          onError('Camera permission denied. Please enable camera access in Settings.')
        }
      } catch (error) {
        onError('Failed to request camera permissions')
      }
    }

    requestPermissions()
  }, [onError])

  // Reset scanned state when camera becomes active
  useEffect(() => {
    if (isActive) {
      setScanned(false)
    }
  }, [isActive])

  const handleBarCodeScanned = ({ type, data }: any) => {
    if (scanned || !isActive) return

    setScanned(true)
    
    // Validate barcode data
    if (!data || data.trim().length === 0) {
      onError('Invalid barcode detected')
      setTimeout(() => setScanned(false), 2000)
      return
    }

    // Additional validation for common barcode formats
    const validBarcodePattern = /^[0-9]{8,14}$/ // UPC/EAN format
    if (!validBarcodePattern.test(data.replace(/\s/g, ''))) {
      onError('Unsupported barcode format')
      setTimeout(() => setScanned(false), 2000)
      return
    }

    onBarcodeScanned(data, type)
  }

  const toggleFlash = () => {
    if (!FlashMode) return
    
    setFlashMode(prev => 
      prev === FlashMode.off ? FlashMode.torch : FlashMode.off
    )
  }

  const handleCameraReady = () => {
    setCameraReady(true)
  }

  const resetScanning = () => {
    setScanned(false)
  }

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permissions...</Text>
      </View>
    )
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          This app needs camera access to scan product barcodes for safety analysis.
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={() => {
            Alert.alert(
              'Camera Permission',
              'Please go to Settings > Apps > Restricted Diet > Permissions and enable Camera access.',
              [{ text: 'OK' }]
            )
          }}
        >
          <Text style={styles.permissionButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={CameraType?.back || 'back'}
        flashMode={flashMode}
        onCameraReady={handleCameraReady}
        onBarCodeScanned={isActive ? handleBarCodeScanned : undefined}
        barCodeScannerSettings={BarCodeScanner ? {
          barCodeTypes: [
            BarCodeScanner.Constants.BarCodeType.upc_a,
            BarCodeScanner.Constants.BarCodeType.upc_e,
            BarCodeScanner.Constants.BarCodeType.ean13,
            BarCodeScanner.Constants.BarCodeType.ean8,
            BarCodeScanner.Constants.BarCodeType.code128,
            BarCodeScanner.Constants.BarCodeType.code39,
            BarCodeScanner.Constants.BarCodeType.code93,
            BarCodeScanner.Constants.BarCodeType.codabar,
            BarCodeScanner.Constants.BarCodeType.datamatrix,
            BarCodeScanner.Constants.BarCodeType.pdf417,
            BarCodeScanner.Constants.BarCodeType.qr,
          ],
        } : undefined}
      >
        {/* Camera overlay with scan area */}
        <View style={styles.overlay}>
          {/* Top overlay */}
          <View style={styles.overlaySection} />
          
          {/* Middle section with scan frame */}
          <View style={styles.middleSection}>
            <View style={styles.overlaySection} />
            
            {/* Scan frame */}
            <View style={styles.scanFrame}>
              {/* Corner markers */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Scanning animation line */}
              {isActive && !scanned && cameraReady && (
                <View style={styles.scanLine} />
              )}
              
              {/* Scanned indicator */}
              {scanned && (
                <View style={styles.scannedIndicator}>
                  <Text style={styles.scannedText}>✓ Scanned!</Text>
                </View>
              )}
            </View>
            
            <View style={styles.overlaySection} />
          </View>
          
          {/* Bottom overlay */}
          <View style={styles.overlaySection} />
          
          {/* Flash toggle button */}
          <TouchableOpacity
            style={styles.flashButton}
            onPress={toggleFlash}
            accessibilityLabel={`Turn flash ${flashMode === (FlashMode?.off || 'off') ? 'on' : 'off'}`}
          >
            <Text style={styles.flashButtonText}>
              {flashMode === (FlashMode?.off || 'off') ? '🔦' : '💡'}
            </Text>
          </TouchableOpacity>

          {/* Rescan button when scanned */}
          {scanned && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={resetScanning}
              accessibilityLabel="Scan another barcode"
            >
              <Text style={styles.rescanButtonText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Additional overlay content */}
        {children}
      </Camera>
    </View>
  )
}

const { width, height } = Dimensions.get('window')
const scanFrameSize = Math.min(width * 0.7, 250)
const scanFrameHeight = scanFrameSize * 0.4

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlaySection: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleSection: {
    flexDirection: 'row',
  },
  scanFrame: {
    width: scanFrameSize,
    height: scanFrameHeight,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#E53E3E',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#E53E3E',
    opacity: 0.8,
    // Animation would be handled by Animated API or CSS animations
  },
  scannedIndicator: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  scannedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  flashButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashButtonText: {
    fontSize: 24,
  },
  rescanButton: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    marginLeft: -60,
    backgroundColor: '#E53E3E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  rescanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Web fallback styles
  webFallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  webFallbackContent: {
    backgroundColor: '#2A2A2A',
    padding: 32,
    borderRadius: 12,
    maxWidth: 400,
    alignItems: 'center',
  },
  webFallbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  webFallbackText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  webFallbackButton: {
    backgroundColor: '#E53E3E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  webFallbackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})