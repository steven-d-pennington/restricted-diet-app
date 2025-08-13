/**
 * Camera Service - Handles camera permissions and device compatibility
 * 
 * SAFETY CRITICAL: Ensures reliable camera access for product scanning
 */

import { Camera, CameraType, FlashMode } from 'expo-camera'
import { BarCodeScanner } from 'expo-barcode-scanner'
import { Platform, Alert, Linking } from 'react-native'

export interface CameraPermissionStatus {
  granted: boolean
  canAskAgain: boolean
  status: string
}

export interface CameraCapabilities {
  hasCamera: boolean
  hasFrontCamera: boolean
  hasBackCamera: boolean
  hasFlash: boolean
  supportedBarcodeTypes: string[]
}

class CameraService {
  private static instance: CameraService
  private permissionStatus: CameraPermissionStatus | null = null
  private capabilities: CameraCapabilities | null = null

  private constructor() {}

  static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService()
    }
    return CameraService.instance
  }

  /**
   * Request camera permissions with comprehensive error handling
   */
  async requestPermissions(): Promise<CameraPermissionStatus> {
    try {
      const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync()
      
      this.permissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
      }

      return this.permissionStatus
    } catch (error) {
      console.error('Failed to request camera permissions:', error)
      throw new Error('Camera permission request failed')
    }
  }

  /**
   * Check current camera permission status
   */
  async checkPermissions(): Promise<CameraPermissionStatus> {
    try {
      const { status, canAskAgain } = await Camera.getCameraPermissionsAsync()
      
      this.permissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
      }

      return this.permissionStatus
    } catch (error) {
      console.error('Failed to check camera permissions:', error)
      throw new Error('Camera permission check failed')
    }
  }

  /**
   * Get device camera capabilities
   */
  async getCameraCapabilities(): Promise<CameraCapabilities> {
    if (this.capabilities) {
      return this.capabilities
    }

    try {
      const hasCamera = await Camera.isAvailableAsync()
      
      let hasFrontCamera = false
      let hasBackCamera = false
      let hasFlash = false

      if (hasCamera) {
        try {
          // Check for back camera
          hasBackCamera = await Camera.isAvailableAsync()
          
          // Check for front camera (this is a simplified check)
          hasFrontCamera = Platform.OS === 'ios' || Platform.OS === 'android'
          
          // Check for flash
          hasFlash = Platform.OS === 'ios' || Platform.OS === 'android'
        } catch (error) {
          console.warn('Failed to check camera features:', error)
        }
      }

      const supportedBarcodeTypes = this.getSupportedBarcodeTypes()

      this.capabilities = {
        hasCamera,
        hasFrontCamera,
        hasBackCamera,
        hasFlash,
        supportedBarcodeTypes,
      }

      return this.capabilities
    } catch (error) {
      console.error('Failed to get camera capabilities:', error)
      throw new Error('Camera capability check failed')
    }
  }

  /**
   * Get supported barcode types for the device
   */
  getSupportedBarcodeTypes(): string[] {
    return [
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
    ]
  }

  /**
   * Handle permission denied scenarios
   */
  async handlePermissionDenied(): Promise<void> {
    const permissionStatus = await this.checkPermissions()
    
    if (!permissionStatus.canAskAgain) {
      // Permission permanently denied - guide user to settings
      Alert.alert(
        'Camera Access Required',
        'Camera access is required to scan product barcodes. Please enable it in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => this.openAppSettings(),
          },
        ]
      )
    } else {
      // Can ask again - show explanation and retry
      Alert.alert(
        'Camera Permission Needed',
        'This app needs camera access to scan product barcodes for your safety. This helps identify ingredients that may be harmful to you.',
        [
          { text: 'Not Now', style: 'cancel' },
          { 
            text: 'Allow Camera', 
            onPress: () => this.requestPermissions(),
          },
        ]
      )
    }
  }

  /**
   * Open device settings for the app
   */
  async openAppSettings(): Promise<void> {
    try {
      await Linking.openSettings()
    } catch (error) {
      console.error('Failed to open app settings:', error)
      Alert.alert(
        'Settings Unavailable',
        'Unable to open settings. Please manually enable camera access in your device settings.'
      )
    }
  }

  /**
   * Validate barcode data format
   */
  validateBarcode(data: string, type: string): { isValid: boolean; error?: string } {
    // Remove whitespace
    const cleanData = data.replace(/\s/g, '')
    
    // Check if data exists
    if (!cleanData || cleanData.length === 0) {
      return { isValid: false, error: 'Empty barcode data' }
    }

    // Check length constraints based on barcode type
    switch (type) {
      case BarCodeScanner.Constants.BarCodeType.upc_a:
        if (cleanData.length !== 12) {
          return { isValid: false, error: 'Invalid UPC-A barcode length' }
        }
        break
      case BarCodeScanner.Constants.BarCodeType.upc_e:
        if (cleanData.length !== 8) {
          return { isValid: false, error: 'Invalid UPC-E barcode length' }
        }
        break
      case BarCodeScanner.Constants.BarCodeType.ean13:
        if (cleanData.length !== 13) {
          return { isValid: false, error: 'Invalid EAN-13 barcode length' }
        }
        break
      case BarCodeScanner.Constants.BarCodeType.ean8:
        if (cleanData.length !== 8) {
          return { isValid: false, error: 'Invalid EAN-8 barcode length' }
        }
        break
    }

    // Check if it's numeric for UPC/EAN codes
    const isUPCOrEAN = [
      BarCodeScanner.Constants.BarCodeType.upc_a,
      BarCodeScanner.Constants.BarCodeType.upc_e,
      BarCodeScanner.Constants.BarCodeType.ean13,
      BarCodeScanner.Constants.BarCodeType.ean8,
    ].includes(type)

    if (isUPCOrEAN && !/^\d+$/.test(cleanData)) {
      return { isValid: false, error: 'Invalid barcode format - must be numeric' }
    }

    // General length check
    if (cleanData.length < 4 || cleanData.length > 20) {
      return { isValid: false, error: 'Invalid barcode length' }
    }

    return { isValid: true }
  }

  /**
   * Format barcode for consistent display
   */
  formatBarcode(data: string, type: string): string {
    const cleanData = data.replace(/\s/g, '')
    
    switch (type) {
      case BarCodeScanner.Constants.BarCodeType.upc_a:
        // Format as X-XXXXX-XXXXX-X
        if (cleanData.length === 12) {
          return `${cleanData[0]}-${cleanData.slice(1, 6)}-${cleanData.slice(6, 11)}-${cleanData[11]}`
        }
        break
      case BarCodeScanner.Constants.BarCodeType.ean13:
        // Format as X-XXXXXX-XXXXXX-X
        if (cleanData.length === 13) {
          return `${cleanData[0]}-${cleanData.slice(1, 7)}-${cleanData.slice(7, 12)}-${cleanData[12]}`
        }
        break
    }
    
    return cleanData
  }

  /**
   * Get user-friendly barcode type name
   */
  getBarcodeTypeName(type: string): string {
    const typeNames: Record<string, string> = {
      [BarCodeScanner.Constants.BarCodeType.upc_a]: 'UPC-A',
      [BarCodeScanner.Constants.BarCodeType.upc_e]: 'UPC-E',
      [BarCodeScanner.Constants.BarCodeType.ean13]: 'EAN-13',
      [BarCodeScanner.Constants.BarCodeType.ean8]: 'EAN-8',
      [BarCodeScanner.Constants.BarCodeType.code128]: 'Code 128',
      [BarCodeScanner.Constants.BarCodeType.code39]: 'Code 39',
      [BarCodeScanner.Constants.BarCodeType.code93]: 'Code 93',
      [BarCodeScanner.Constants.BarCodeType.codabar]: 'Codabar',
      [BarCodeScanner.Constants.BarCodeType.datamatrix]: 'Data Matrix',
      [BarCodeScanner.Constants.BarCodeType.pdf417]: 'PDF417',
      [BarCodeScanner.Constants.BarCodeType.qr]: 'QR Code',
    }

    return typeNames[type] || 'Unknown'
  }

  /**
   * Check if device supports camera and barcode scanning
   */
  async isDeviceSupported(): Promise<{ supported: boolean; reason?: string }> {
    try {
      const capabilities = await this.getCameraCapabilities()
      
      if (!capabilities.hasCamera) {
        return { supported: false, reason: 'No camera available on this device' }
      }

      if (!capabilities.hasBackCamera) {
        return { supported: false, reason: 'Back camera not available' }
      }

      if (capabilities.supportedBarcodeTypes.length === 0) {
        return { supported: false, reason: 'Barcode scanning not supported on this device' }
      }

      return { supported: true }
    } catch (error) {
      console.error('Failed to check device support:', error)
      return { supported: false, reason: 'Unable to determine device capabilities' }
    }
  }

  /**
   * Reset cached data (useful for testing or permission changes)
   */
  reset(): void {
    this.permissionStatus = null
    this.capabilities = null
  }
}

export default CameraService.getInstance()