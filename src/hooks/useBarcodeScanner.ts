/**
 * Barcode Scanner Hook - Manages barcode scanning workflow
 * 
 * SAFETY CRITICAL: Coordinates camera, permissions, and product lookup
 * for reliable dietary restriction safety assessment
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import cameraService, { CameraPermissionStatus, CameraCapabilities } from '../services/cameraService'
import { useProductSafety } from './useProductSafety'

export interface ScanResult {
  barcode: string
  type: string
  timestamp: Date
  formatted: string
  typeName: string
}

export interface ScannerState {
  isActive: boolean
  isScanning: boolean
  hasPermission: boolean | null
  permissionStatus: CameraPermissionStatus | null
  capabilities: CameraCapabilities | null
  error: string | null
  lastScan: ScanResult | null
}

export interface UseBarcodeScanner {
  // State
  state: ScannerState
  
  // Actions
  startScanning: () => Promise<boolean>
  stopScanning: () => void
  resetScanner: () => void
  handleBarcodeScanned: (barcode: string, type: string) => Promise<void>
  requestPermissions: () => Promise<boolean>
  
  // Utilities
  validateBarcode: (barcode: string, type: string) => { isValid: boolean; error?: string }
  formatBarcode: (barcode: string, type: string) => string
  isDeviceSupported: () => Promise<boolean>
}

export const useBarcodeScanner = (): UseBarcodeScanner => {
  const { scanProduct, loading: productLoading, error: productError } = useProductSafety()
  
  // Scanner state
  const [state, setState] = useState<ScannerState>({
    isActive: false,
    isScanning: false,
    hasPermission: null,
    permissionStatus: null,
    capabilities: null,
    error: null,
    lastScan: null,
  })

  const appStateRef = useRef(AppState.currentState)
  const scanTimeoutRef = useRef<NodeJS.Timeout>()
  const debounceRef = useRef<NodeJS.Timeout>()

  // Update error from product service
  useEffect(() => {
    if (productError) {
      setState(prev => ({ ...prev, error: productError }))
    }
  }, [productError])

  // Handle app state changes (pause scanning when app goes to background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        stopScanning()
      } else if (nextAppState === 'active' && state.isActive) {
        // Re-check permissions when app becomes active
        checkPermissions()
      }
      appStateRef.current = nextAppState
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    
    return () => {
      subscription?.remove()
    }
  }, [state.isActive])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current)
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const checkPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const permissionStatus = await cameraService.checkPermissions()
      const capabilities = await cameraService.getCameraCapabilities()
      
      setState(prev => ({
        ...prev,
        hasPermission: permissionStatus.granted,
        permissionStatus,
        capabilities,
        error: null,
      }))

      return permissionStatus.granted
    } catch (error) {
      console.error('Failed to check camera permissions:', error)
      setError('Failed to check camera permissions')
      return false
    }
  }, [setError])

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }))
      
      const permissionStatus = await cameraService.requestPermissions()
      const capabilities = await cameraService.getCameraCapabilities()
      
      setState(prev => ({
        ...prev,
        hasPermission: permissionStatus.granted,
        permissionStatus,
        capabilities,
      }))

      if (!permissionStatus.granted) {
        await cameraService.handlePermissionDenied()
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to request camera permissions:', error)
      setError('Failed to request camera permissions')
      return false
    }
  }, [setError])

  const isDeviceSupported = useCallback(async (): Promise<boolean> => {
    try {
      const { supported, reason } = await cameraService.isDeviceSupported()
      
      if (!supported && reason) {
        setError(reason)
      }
      
      return supported
    } catch (error) {
      console.error('Failed to check device support:', error)
      setError('Unable to determine device capabilities')
      return false
    }
  }, [setError])

  const startScanning = useCallback(async (): Promise<boolean> => {
    try {
      // Check device support first
      const deviceSupported = await isDeviceSupported()
      if (!deviceSupported) {
        return false
      }

      // Check permissions
      const hasPermissions = await checkPermissions()
      if (!hasPermissions) {
        const granted = await requestPermissions()
        if (!granted) {
          return false
        }
      }

      setState(prev => ({
        ...prev,
        isActive: true,
        isScanning: true,
        error: null,
      }))

      return true
    } catch (error) {
      console.error('Failed to start scanning:', error)
      setError('Failed to start camera')
      return false
    }
  }, [checkPermissions, requestPermissions, isDeviceSupported, setError])

  const stopScanning = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      isScanning: false,
    }))

    // Clear any pending timeouts
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
  }, [])

  const resetScanner = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      lastScan: null,
      isScanning: prev.isActive, // Keep scanning if active
    }))

    // Clear timeouts
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
  }, [])

  const validateBarcode = useCallback((barcode: string, type: string) => {
    return cameraService.validateBarcode(barcode, type)
  }, [])

  const formatBarcode = useCallback((barcode: string, type: string) => {
    return cameraService.formatBarcode(barcode, type)
  }, [])

  const handleBarcodeScanned = useCallback(async (barcode: string, type: string) => {
    // Prevent duplicate scans with debouncing
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!state.isActive || !state.isScanning) {
      return
    }

    // Validate barcode
    const validation = validateBarcode(barcode, type)
    if (!validation.isValid) {
      setError(validation.error || 'Invalid barcode format')
      
      // Allow scanning again after a delay
      scanTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, isScanning: true, error: null }))
      }, 2000)
      
      return
    }

    // Create scan result
    const scanResult: ScanResult = {
      barcode: barcode.replace(/\s/g, ''),
      type,
      timestamp: new Date(),
      formatted: formatBarcode(barcode, type),
      typeName: cameraService.getBarcodeTypeName(type),
    }

    // Update state
    setState(prev => ({
      ...prev,
      lastScan: scanResult,
      isScanning: false,
      error: null,
    }))

    // Debounce to prevent immediate re-scanning
    debounceRef.current = setTimeout(async () => {
      try {
        // Attempt to lookup product
        await scanProduct(scanResult.barcode)
      } catch (error) {
        console.error('Failed to process scanned barcode:', error)
        setError('Failed to process barcode')
        
        // Allow scanning again
        setState(prev => ({ ...prev, isScanning: true }))
      }
    }, 500) // 500ms debounce
  }, [state.isActive, state.isScanning, validateBarcode, formatBarcode, scanProduct, setError])

  // Initialize permissions check on mount
  useEffect(() => {
    checkPermissions()
  }, [checkPermissions])

  return {
    state,
    startScanning,
    stopScanning,
    resetScanner,
    handleBarcodeScanned,
    requestPermissions,
    validateBarcode,
    formatBarcode,
    isDeviceSupported,
  }
}