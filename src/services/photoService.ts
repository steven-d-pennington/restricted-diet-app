/**
 * Photo Management Service
 * 
 * SAFETY CRITICAL: Manages photo uploads, compression, and moderation for review evidence
 * Handles image optimization and secure storage for safety documentation
 */

import { supabase } from '../lib/supabase'
import {
  ReviewPhoto,
  ReviewPhotoInsert,
  ReviewPhotoUpdate,
  PhotoEvidenceType,
  ReviewModerationStatus
} from '../types/database.types'

export interface PhotoServiceError {
  code: 'NETWORK_ERROR' | 'PERMISSION_DENIED' | 'INVALID_PARAMS' | 'UPLOAD_ERROR' | 'COMPRESSION_ERROR' | 'STORAGE_ERROR' | 'NOT_FOUND'
  message: string
  details?: any
}

export interface PhotoUploadOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp' | 'png'
  maxSizeBytes?: number
}

export interface PhotoUploadResult {
  photo: ReviewPhoto
  compressed: boolean
  originalSize: number
  finalSize: number
  processingTime: number
}

export interface PhotoCompressionOptions {
  maxWidth: number
  maxHeight: number
  quality: number
  format: 'jpeg' | 'webp' | 'png'
}

class PhotoService {
  private static instance: PhotoService
  private readonly STORAGE_BUCKET = 'review-photos'
  private readonly DEFAULT_OPTIONS: PhotoUploadOptions = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    format: 'jpeg',
    maxSizeBytes: 5 * 1024 * 1024 // 5MB
  }

  static getInstance(): PhotoService {
    if (!PhotoService.instance) {
      PhotoService.instance = new PhotoService()
    }
    return PhotoService.instance
  }

  /**
   * Upload and process a single photo for a review
   */
  async uploadReviewPhoto(
    reviewId: string,
    file: File | Blob,
    photoType: PhotoEvidenceType,
    caption?: string,
    options: PhotoUploadOptions = {}
  ): Promise<PhotoUploadResult> {
    try {
      const startTime = Date.now()
      const uploadOptions = { ...this.DEFAULT_OPTIONS, ...options }
      
      // Validate file
      this.validatePhotoFile(file, uploadOptions)

      // Compress image if needed
      let processedFile = file
      let compressed = false
      const originalSize = file.size

      if (file.size > uploadOptions.maxSizeBytes! || this.shouldCompress(file, uploadOptions)) {
        processedFile = await this.compressImage(file, {
          maxWidth: uploadOptions.maxWidth!,
          maxHeight: uploadOptions.maxHeight!,
          quality: uploadOptions.quality!,
          format: uploadOptions.format!
        })
        compressed = true
      }

      // Generate unique filename
      const fileExtension = this.getFileExtension(uploadOptions.format!)
      const fileName = `reviews/${reviewId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(fileName, processedFile, {
          contentType: `image/${uploadOptions.format}`,
          upsert: false
        })

      if (uploadError) {
        throw {
          code: 'UPLOAD_ERROR',
          message: 'Failed to upload photo to storage',
          details: uploadError
        } as PhotoServiceError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(fileName)

      // Get image dimensions
      const dimensions = await this.getImageDimensions(processedFile)

      // Create photo record in database
      const { data: photoRecord, error: dbError } = await supabase
        .from('review_photos')
        .insert({
          review_id: reviewId,
          photo_url: publicUrl,
          photo_type: photoType,
          caption: caption || null,
          file_size_bytes: processedFile.size,
          image_width: dimensions.width,
          image_height: dimensions.height,
          compression_applied: compressed,
          moderation_status: this.determineInitialModerationStatus(photoType),
          upload_timestamp: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await this.deleteStorageFile(fileName)
        throw {
          code: 'STORAGE_ERROR',
          message: 'Failed to create photo record',
          details: dbError
        } as PhotoServiceError
      }

      const processingTime = Date.now() - startTime

      return {
        photo: photoRecord,
        compressed,
        originalSize,
        finalSize: processedFile.size,
        processingTime
      }

    } catch (error: any) {
      console.error('Photo upload error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'UPLOAD_ERROR',
        message: 'Failed to upload photo',
        details: error
      } as PhotoServiceError
    }
  }

  /**
   * Upload multiple photos for a review
   */
  async uploadMultiplePhotos(
    reviewId: string,
    photos: Array<{
      file: File | Blob
      photoType: PhotoEvidenceType
      caption?: string
      isPrimary?: boolean
    }>,
    options: PhotoUploadOptions = {}
  ): Promise<PhotoUploadResult[]> {
    const results: PhotoUploadResult[] = []
    const errors: Array<{ index: number, error: PhotoServiceError }> = []

    // Upload photos concurrently with a limit
    const CONCURRENT_UPLOADS = 3
    for (let i = 0; i < photos.length; i += CONCURRENT_UPLOADS) {
      const batch = photos.slice(i, i + CONCURRENT_UPLOADS)
      const batchPromises = batch.map(async (photo, batchIndex) => {
        const index = i + batchIndex
        try {
          const result = await this.uploadReviewPhoto(
            reviewId,
            photo.file,
            photo.photoType,
            photo.caption,
            options
          )

          // Set primary photo if specified
          if (photo.isPrimary) {
            await this.setPrimaryPhoto(result.photo.id)
          }

          return { index, result }
        } catch (error) {
          errors.push({ index, error: error as PhotoServiceError })
          return null
        }
      })

      const batchResults = await Promise.all(batchPromises)
      
      for (const item of batchResults) {
        if (item) {
          results[item.index] = item.result
        }
      }
    }

    // Log errors but don't fail the entire upload
    if (errors.length > 0) {
      console.error('Some photo uploads failed:', errors)
    }

    return results.filter(Boolean) // Remove null entries
  }

  /**
   * Compress an image file
   */
  async compressImage(
    file: File | Blob,
    options: PhotoCompressionOptions
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
          // Calculate new dimensions
          const { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            options.maxWidth,
            options.maxHeight
          )

          canvas.width = width
          canvas.height = height

          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Canvas compression failed'))
              }
            },
            `image/${options.format}`,
            options.quality
          )
        }

        img.onerror = () => {
          reject(new Error('Failed to load image for compression'))
        }

        // Load the image
        if (file instanceof File) {
          img.src = URL.createObjectURL(file)
        } else {
          const reader = new FileReader()
          reader.onload = (e) => {
            img.src = e.target?.result as string
          }
          reader.readAsDataURL(file)
        }

      } catch (error) {
        reject({
          code: 'COMPRESSION_ERROR',
          message: 'Failed to compress image',
          details: error
        } as PhotoServiceError)
      }
    })
  }

  /**
   * Get image dimensions from file
   */
  async getImageDimensions(file: File | Blob): Promise<{ width: number, height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
        URL.revokeObjectURL(img.src)
      }

      img.onerror = () => {
        reject(new Error('Failed to load image for dimension calculation'))
      }

      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Set a photo as the primary photo for a review
   */
  async setPrimaryPhoto(photoId: string): Promise<void> {
    try {
      // Get the review ID for this photo
      const { data: photo, error: photoError } = await supabase
        .from('review_photos')
        .select('review_id')
        .eq('id', photoId)
        .single()

      if (photoError || !photo) {
        throw {
          code: 'NOT_FOUND',
          message: 'Photo not found'
        } as PhotoServiceError
      }

      // Remove primary status from all other photos in this review
      await supabase
        .from('review_photos')
        .update({ is_primary: false })
        .eq('review_id', photo.review_id)

      // Set this photo as primary
      const { error: updateError } = await supabase
        .from('review_photos')
        .update({ is_primary: true })
        .eq('id', photoId)

      if (updateError) {
        throw {
          code: 'STORAGE_ERROR',
          message: 'Failed to set primary photo',
          details: updateError
        } as PhotoServiceError
      }

    } catch (error: any) {
      console.error('Set primary photo error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'STORAGE_ERROR',
        message: 'Failed to set primary photo',
        details: error
      } as PhotoServiceError
    }
  }

  /**
   * Delete a photo
   */
  async deletePhoto(photoId: string): Promise<void> {
    try {
      // Get photo details
      const { data: photo, error: photoError } = await supabase
        .from('review_photos')
        .select('photo_url')
        .eq('id', photoId)
        .single()

      if (photoError || !photo) {
        throw {
          code: 'NOT_FOUND',
          message: 'Photo not found'
        } as PhotoServiceError
      }

      // Extract file path from URL
      const filePath = this.extractFilePathFromUrl(photo.photo_url)

      // Delete from storage
      await this.deleteStorageFile(filePath)

      // Delete from database
      const { error: deleteError } = await supabase
        .from('review_photos')
        .delete()
        .eq('id', photoId)

      if (deleteError) {
        throw {
          code: 'STORAGE_ERROR',
          message: 'Failed to delete photo record',
          details: deleteError
        } as PhotoServiceError
      }

    } catch (error: any) {
      console.error('Delete photo error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'STORAGE_ERROR',
        message: 'Failed to delete photo',
        details: error
      } as PhotoServiceError
    }
  }

  /**
   * Update photo metadata
   */
  async updatePhotoMetadata(
    photoId: string,
    updates: Partial<Pick<ReviewPhotoUpdate, 'caption' | 'photo_type' | 'moderation_status'>>
  ): Promise<ReviewPhoto> {
    try {
      const { data: photo, error } = await supabase
        .from('review_photos')
        .update(updates)
        .eq('id', photoId)
        .select()
        .single()

      if (error) {
        throw {
          code: 'STORAGE_ERROR',
          message: 'Failed to update photo metadata',
          details: error
        } as PhotoServiceError
      }

      return photo

    } catch (error: any) {
      console.error('Update photo metadata error:', error)
      
      if (error.code && error.message) {
        throw error
      }

      throw {
        code: 'STORAGE_ERROR',
        message: 'Failed to update photo metadata',
        details: error
      } as PhotoServiceError
    }
  }

  /**
   * Get photos for a review
   */
  async getReviewPhotos(reviewId: string): Promise<ReviewPhoto[]> {
    try {
      const { data: photos, error } = await supabase
        .from('review_photos')
        .select('*')
        .eq('review_id', reviewId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true })

      if (error) {
        throw {
          code: 'STORAGE_ERROR',
          message: 'Failed to get review photos',
          details: error
        } as PhotoServiceError
      }

      return photos || []

    } catch (error: any) {
      console.error('Get review photos error:', error)
      return []
    }
  }

  /**
   * PRIVATE HELPER METHODS
   */

  private validatePhotoFile(file: File | Blob, options: PhotoUploadOptions): void {
    // Check file size
    if (file.size > options.maxSizeBytes!) {
      throw {
        code: 'INVALID_PARAMS',
        message: `File size exceeds maximum allowed size of ${options.maxSizeBytes! / 1024 / 1024}MB`
      } as PhotoServiceError
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      throw {
        code: 'INVALID_PARAMS',
        message: 'File must be an image'
      } as PhotoServiceError
    }

    // Check supported formats
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!supportedTypes.includes(file.type)) {
      throw {
        code: 'INVALID_PARAMS',
        message: 'Unsupported image format. Please use JPEG, PNG, or WebP'
      } as PhotoServiceError
    }
  }

  private shouldCompress(file: File | Blob, options: PhotoUploadOptions): boolean {
    // Always compress if file is too large
    if (file.size > options.maxSizeBytes!) {
      return true
    }

    // Compress large images even if under size limit
    if (file.size > 2 * 1024 * 1024) { // 2MB
      return true
    }

    return false
  }

  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number, height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight }

    // Calculate scaling factor
    const widthRatio = maxWidth / width
    const heightRatio = maxHeight / height
    const scalingFactor = Math.min(widthRatio, heightRatio, 1) // Don't upscale

    width = Math.round(width * scalingFactor)
    height = Math.round(height * scalingFactor)

    return { width, height }
  }

  private getFileExtension(format: string): string {
    switch (format) {
      case 'jpeg':
        return 'jpg'
      case 'webp':
        return 'webp'
      case 'png':
        return 'png'
      default:
        return 'jpg'
    }
  }

  private determineInitialModerationStatus(photoType: PhotoEvidenceType): ReviewModerationStatus {
    // Auto-approve general photos and menu items
    if (photoType === 'general' || photoType === 'menu_item' || photoType === 'menu_display') {
      return 'auto_approved'
    }

    // Require moderation for evidence photos
    return 'pending'
  }

  private extractFilePathFromUrl(url: string): string {
    try {
      const urlParts = url.split(`/${this.STORAGE_BUCKET}/`)
      return urlParts[1] || ''
    } catch (error) {
      console.error('Failed to extract file path from URL:', error)
      return ''
    }
  }

  private async deleteStorageFile(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([filePath])

      if (error) {
        console.error('Storage file deletion error:', error)
      }
    } catch (error) {
      console.error('Failed to delete storage file:', error)
    }
  }

  /**
   * Utility method to convert File to base64 for offline storage
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Utility method to convert base64 back to File
   */
  base64ToFile(base64: string, filename: string, mimeType: string): File {
    const byteString = atob(base64.split(',')[1])
    const arrayBuffer = new ArrayBuffer(byteString.length)
    const uint8Array = new Uint8Array(arrayBuffer)

    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i)
    }

    return new File([arrayBuffer], filename, { type: mimeType })
  }
}

export default PhotoService.getInstance()