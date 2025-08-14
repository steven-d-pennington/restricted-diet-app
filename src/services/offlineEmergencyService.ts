/**
 * Offline Emergency Service
 * LIFE CRITICAL: Ensures emergency cards work without internet connection
 * 
 * This service manages local storage of emergency cards for offline access,
 * which is crucial during emergencies when network connectivity may be unreliable.
 */

import { Storage } from '../utils/storage'
import { EmergencyCard } from '../types/database.types'

const OFFLINE_EMERGENCY_CARDS_KEY = 'offline_emergency_cards'
const SYNC_QUEUE_KEY = 'emergency_card_sync_queue'
const LAST_SYNC_KEY = 'emergency_cards_last_sync'

export interface OfflineSyncItem {
  id: string
  action: 'create' | 'update' | 'delete'
  cardData: EmergencyCard | Partial<EmergencyCard>
  timestamp: string
}

export class OfflineEmergencyService {
  /**
   * Store emergency cards locally for offline access
   */
  static async storeEmergencyCards(cards: EmergencyCard[]): Promise<void> {
    try {
      const cardsWithTimestamp = {
        cards,
        lastUpdated: new Date().toISOString(),
        version: 1
      }
      
      await Storage.setItem(
        OFFLINE_EMERGENCY_CARDS_KEY, 
        JSON.stringify(cardsWithTimestamp)
      )
      
      console.log(`Stored ${cards.length} emergency cards offline`)
    } catch (error) {
      console.error('Failed to store emergency cards offline:', error)
      throw new Error('Failed to cache emergency cards for offline use')
    }
  }

  /**
   * Get emergency cards from local storage
   */
  static async getOfflineEmergencyCards(): Promise<{
    cards: EmergencyCard[]
    lastUpdated: string | null
    isStale: boolean
  }> {
    try {
      const storedData = await Storage.getItem(OFFLINE_EMERGENCY_CARDS_KEY)
      
      if (!storedData) {
        return { cards: [], lastUpdated: null, isStale: true }
      }

      const parsed = JSON.parse(storedData)
      const lastUpdated = parsed.lastUpdated
      const cards = parsed.cards || []
      
      // Check if data is stale (older than 24 hours)
      const isStale = lastUpdated ? 
        Date.now() - new Date(lastUpdated).getTime() > 24 * 60 * 60 * 1000 : 
        true

      return { cards, lastUpdated, isStale }
    } catch (error) {
      console.error('Failed to get offline emergency cards:', error)
      return { cards: [], lastUpdated: null, isStale: true }
    }
  }

  /**
   * Store a single card locally (for immediate offline access)
   */
  static async storeSingleCard(card: EmergencyCard): Promise<void> {
    try {
      const { cards } = await this.getOfflineEmergencyCards()
      const existingIndex = cards.findIndex(c => c.id === card.id)
      
      if (existingIndex >= 0) {
        cards[existingIndex] = card
      } else {
        cards.push(card)
      }
      
      await this.storeEmergencyCards(cards)
    } catch (error) {
      console.error('Failed to store single emergency card:', error)
      throw error
    }
  }

  /**
   * Remove a card from offline storage
   */
  static async removeOfflineCard(cardId: string): Promise<void> {
    try {
      const { cards } = await this.getOfflineEmergencyCards()
      const filteredCards = cards.filter(c => c.id !== cardId)
      await this.storeEmergencyCards(filteredCards)
    } catch (error) {
      console.error('Failed to remove offline emergency card:', error)
      throw error
    }
  }

  /**
   * Add item to sync queue for when connection is restored
   */
  static async addToSyncQueue(item: OfflineSyncItem): Promise<void> {
    try {
      const queueData = await Storage.getItem(SYNC_QUEUE_KEY)
      const queue: OfflineSyncItem[] = queueData ? JSON.parse(queueData) : []
      
      // Remove any existing sync items for the same card
      const filteredQueue = queue.filter(queueItem => queueItem.id !== item.id)
      filteredQueue.push(item)
      
      await Storage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filteredQueue))
    } catch (error) {
      console.error('Failed to add item to sync queue:', error)
    }
  }

  /**
   * Get pending sync queue
   */
  static async getSyncQueue(): Promise<OfflineSyncItem[]> {
    try {
      const queueData = await Storage.getItem(SYNC_QUEUE_KEY)
      return queueData ? JSON.parse(queueData) : []
    } catch (error) {
      console.error('Failed to get sync queue:', error)
      return []
    }
  }

  /**
   * Clear sync queue (after successful sync)
   */
  static async clearSyncQueue(): Promise<void> {
    try {
      await Storage.removeItem(SYNC_QUEUE_KEY)
    } catch (error) {
      console.error('Failed to clear sync queue:', error)
    }
  }

  /**
   * Process sync queue when connection is restored
   */
  static async processSyncQueue(
    onSyncItem: (item: OfflineSyncItem) => Promise<boolean>
  ): Promise<{ success: number; failed: number }> {
    const queue = await this.getSyncQueue()
    let success = 0
    let failed = 0

    for (const item of queue) {
      try {
        const result = await onSyncItem(item)
        if (result) {
          success++
        } else {
          failed++
        }
      } catch (error) {
        console.error('Sync item failed:', error)
        failed++
      }
    }

    // Clear queue only if all items succeeded
    if (failed === 0) {
      await this.clearSyncQueue()
    }

    return { success, failed }
  }

  /**
   * Get critical emergency cards for quick access
   */
  static async getCriticalCards(): Promise<EmergencyCard[]> {
    try {
      const { cards } = await this.getOfflineEmergencyCards()
      return cards.filter(card => 
        card.is_active && 
        (card.severity_level === 'life_threatening' || card.severity_level === 'severe')
      ).sort((a, b) => {
        // Sort by severity
        const severityOrder = { life_threatening: 4, severe: 3, moderate: 2, mild: 1 }
        return severityOrder[b.severity_level] - severityOrder[a.severity_level]
      })
    } catch (error) {
      console.error('Failed to get critical cards:', error)
      return []
    }
  }

  /**
   * Export emergency card data for sharing/backup
   */
  static async exportEmergencyData(): Promise<string | null> {
    try {
      const { cards } = await this.getOfflineEmergencyCards()
      const exportData = {
        emergencyCards: cards.filter(card => card.is_active),
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }
      
      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('Failed to export emergency data:', error)
      return null
    }
  }

  /**
   * Import emergency card data from backup
   */
  static async importEmergencyData(jsonData: string): Promise<{
    success: boolean
    importedCards: number
    errors: string[]
  }> {
    try {
      const importData = JSON.parse(jsonData)
      const errors: string[] = []
      
      if (!importData.emergencyCards || !Array.isArray(importData.emergencyCards)) {
        return { success: false, importedCards: 0, errors: ['Invalid data format'] }
      }

      const { cards: existingCards } = await this.getOfflineEmergencyCards()
      let importedCount = 0

      for (const cardData of importData.emergencyCards) {
        try {
          // Validate required fields
          if (!cardData.card_name || !cardData.restrictions_summary) {
            errors.push(`Invalid card data: missing required fields`)
            continue
          }

          // Generate new ID to avoid conflicts
          const newCard: EmergencyCard = {
            ...cardData,
            id: `imported_${Date.now()}_${importedCount}`,
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
          }

          existingCards.push(newCard)
          importedCount++
        } catch (error) {
          errors.push(`Failed to import card: ${error}`)
        }
      }

      if (importedCount > 0) {
        await this.storeEmergencyCards(existingCards)
      }

      return {
        success: importedCount > 0,
        importedCards: importedCount,
        errors
      }
    } catch (error) {
      console.error('Failed to import emergency data:', error)
      return {
        success: false,
        importedCards: 0,
        errors: ['Failed to parse import data']
      }
    }
  }

  /**
   * Clear all offline data (for testing/reset)
   */
  static async clearAllOfflineData(): Promise<void> {
    try {
      await Promise.all([
        Storage.removeItem(OFFLINE_EMERGENCY_CARDS_KEY),
        Storage.removeItem(SYNC_QUEUE_KEY),
        Storage.removeItem(LAST_SYNC_KEY),
      ])
      console.log('Cleared all offline emergency data')
    } catch (error) {
      console.error('Failed to clear offline data:', error)
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    totalCards: number
    criticalCards: number
    pendingSyncItems: number
    lastSync: string | null
    storageSize: number
  }> {
    try {
      const { cards, lastUpdated } = await this.getOfflineEmergencyCards()
      const syncQueue = await this.getSyncQueue()
      const criticalCards = cards.filter(card => 
        card.is_active && 
        (card.severity_level === 'life_threatening' || card.severity_level === 'severe')
      )

      // Estimate storage size
      const cardsData = await Storage.getItem(OFFLINE_EMERGENCY_CARDS_KEY)
      const queueData = await Storage.getItem(SYNC_QUEUE_KEY)
      const storageSize = (cardsData?.length || 0) + (queueData?.length || 0)

      return {
        totalCards: cards.length,
        criticalCards: criticalCards.length,
        pendingSyncItems: syncQueue.length,
        lastSync: lastUpdated,
        storageSize
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      return {
        totalCards: 0,
        criticalCards: 0,
        pendingSyncItems: 0,
        lastSync: null,
        storageSize: 0
      }
    }
  }

  /**
   * Check if emergency data needs sync
   */
  static async needsSync(): Promise<boolean> {
    try {
      const { isStale } = await this.getOfflineEmergencyCards()
      const syncQueue = await this.getSyncQueue()
      
      return isStale || syncQueue.length > 0
    } catch (error) {
      console.error('Failed to check sync status:', error)
      return true
    }
  }

  /**
   * Update last sync timestamp
   */
  static async updateLastSync(): Promise<void> {
    try {
      await Storage.setItem(LAST_SYNC_KEY, new Date().toISOString())
    } catch (error) {
      console.error('Failed to update last sync:', error)
    }
  }
}

export default OfflineEmergencyService