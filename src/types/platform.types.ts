/**
 * Platform-Specific TypeScript Types
 * 
 * Defines type interfaces for platform-specific functionality
 * Ensures type safety across web, iOS, and Android platforms
 */

// Platform detection types
export type SupportedPlatform = 'web' | 'ios' | 'android' | 'native'

export interface PlatformInfo {
  OS: string
  Version?: string | number
  isWeb: boolean
  isNative: boolean
  isIOS: boolean
  isAndroid: boolean
}

// Camera and barcode scanning types
export interface CameraPermission {
  status: 'granted' | 'denied' | 'undetermined' | 'restricted'
  canAskAgain: boolean
  expires?: 'never' | number
}

export interface BarcodeType {
  aztec: string
  codabar: string
  code39: string
  code93: string
  code128: string
  datamatrix: string
  ean8: string
  ean13: string
  interleaved2of5: string
  itf14: string
  maxicode: string
  pdf417: string
  qr: string
  rss14: string
  rssexpanded: string
  upc_a: string
  upc_e: string
  upc_ean: string
}

export interface BarcodeScanResult {
  data: string
  type: keyof BarcodeType | string
  bounds?: {
    origin: { x: number; y: number }
    size: { width: number; height: number }
  }
  cornerPoints?: Array<{ x: number; y: number }>
}

export interface CameraProps {
  type?: 'front' | 'back'
  flashMode?: 'on' | 'off' | 'auto' | 'torch'
  autoFocus?: 'on' | 'off'
  whiteBalance?: 'auto' | 'sunny' | 'cloudy' | 'shadow' | 'incandescent' | 'fluorescent'
  onBarCodeScanned?: (result: BarcodeScanResult) => void
  barCodeScannerSettings?: {
    barCodeTypes: (keyof BarcodeType)[]
  }
}

// Location types
export interface LocationPermission {
  status: 'granted' | 'denied' | 'undetermined' | 'restricted'
  canAskAgain: boolean
  accuracy?: 'coarse' | 'fine'
}

export interface LocationCoordinates {
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  altitudeAccuracy?: number
  heading?: number
  speed?: number
}

export interface LocationOptions {
  accuracy?: 'lowest' | 'low' | 'balanced' | 'high' | 'highest' | 'passive'
  timeout?: number
  maximumAge?: number
  distanceFilter?: number
}

export interface GeolocationPosition {
  coords: LocationCoordinates
  timestamp: number
}

export interface GeolocationError {
  code: number
  message: string
  PERMISSION_DENIED: number
  POSITION_UNAVAILABLE: number
  TIMEOUT: number
}

// Map types
export interface MapRegion {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

export interface MapMarker {
  coordinate: LocationCoordinates
  title?: string
  description?: string
  pinColor?: string
  identifier?: string
}

export interface MapProps {
  region?: MapRegion
  initialRegion?: MapRegion
  onRegionChange?: (region: MapRegion) => void
  onRegionChangeComplete?: (region: MapRegion) => void
  onPress?: (event: { nativeEvent: { coordinate: LocationCoordinates } }) => void
  showsUserLocation?: boolean
  showsMyLocationButton?: boolean
  showsCompass?: boolean
  showsScale?: boolean
  loadingEnabled?: boolean
  mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain'
  provider?: 'google' | 'apple' | 'default'
  children?: React.ReactNode
}

// Storage types (already handled by our universal storage)
export interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
  clear?: () => Promise<void>
  getAllKeys?: () => Promise<string[]>
}

// File system and sharing types
export interface FilePickerOptions {
  mediaTypes: 'Images' | 'Videos' | 'All'
  allowsEditing?: boolean
  aspect?: [number, number]
  quality?: number
  base64?: boolean
  exif?: boolean
}

export interface FilePickerResult {
  cancelled: boolean
  uri?: string
  width?: number
  height?: number
  type?: 'image' | 'video'
  base64?: string
  exif?: Record<string, any>
  duration?: number
}

export interface ShareOptions {
  message?: string
  title?: string
  subject?: string
  url?: string
  files?: string[]
  type?: string
}

// Web-specific types
export interface WebFileInput {
  accept: string
  multiple: boolean
  capture?: boolean | string
  onChange: (files: FileList | null) => void
}

export interface WebShareData {
  title?: string
  text?: string
  url?: string
}

// Native module availability
export interface FeatureAvailability {
  camera: boolean
  location: boolean
  maps: boolean
  barcode: boolean
  fileSystem: boolean
  sharing: boolean
  notifications: boolean
  biometric: boolean
  vibration: boolean
  orientation: boolean
}

// Platform-specific component props
export interface PlatformSpecificComponentProps<T = any> {
  web?: React.ComponentType<T>
  native?: React.ComponentType<T>
  ios?: React.ComponentType<T>
  android?: React.ComponentType<T>
  fallback?: React.ComponentType<T>
  props?: T
}

// Error types
export interface PlatformError extends Error {
  platform: SupportedPlatform
  code?: string
  nativeError?: any
}

// Platform-specific navigation types
export interface WebNavigation {
  canGoBack: boolean
  canGoForward: boolean
  goBack: () => void
  goForward: () => void
  reload: () => void
  replace: (url: string) => void
  navigate: (url: string) => void
}

// Utility types
export type PlatformValue<T> = T | Partial<Record<SupportedPlatform, T>>

export interface ConditionalProps<T> {
  condition: boolean | (() => boolean)
  props: T
}

// Export type guards for runtime type checking
export const isPlatformWeb = (platform: string): platform is 'web' => platform === 'web'
export const isPlatformNative = (platform: string): boolean => platform !== 'web'
export const isPlatformIOS = (platform: string): platform is 'ios' => platform === 'ios'
export const isPlatformAndroid = (platform: string): platform is 'android' => platform === 'android'

// Export utility type for component props that vary by platform
export type WithPlatformProps<BaseProps, PlatformProps = {}> = BaseProps & {
  platformProps?: Partial<Record<SupportedPlatform, PlatformProps>>
}