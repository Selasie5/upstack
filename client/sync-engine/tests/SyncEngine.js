/**
 * FEAT-002: Client Sync Engine
 * Core synchronization logic for cloud storage system
 * 
 * Based on CPU Scheduling principles (OS Concepts Chapter 6)
 * Author: [Your Name]
 */

// ============================================================================
// CONSTANTS & ENUMS
// ============================================================================

export const SyncState = {
  IDLE: 'IDLE',
  SCANNING: 'SCANNING',
  DECIDING: 'DECIDING',
  UPLOADING: 'UPLOADING',
  DOWNLOADING: 'DOWNLOADING',
  RETRYING: 'RETRYING',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS'
};

export const ChangeType = {
  CREATE: 'CREATE',
  MODIFY: 'MODIFY',
  DELETE: 'DELETE'
};

export const SyncAction = {
  UPLOAD: 'UPLOAD',
  DOWNLOAD: 'DOWNLOAD',
  SKIP: 'SKIP',
  CONFLICT: 'CONFLICT'
};

// ============================================================================
// MAIN SYNC ENGINE CLASS
// ============================================================================

/**
 * ClientSyncEngine
 * 
 * Manages file synchronization between client and server.
 * Implements scheduling logic similar to CPU process scheduling.
 * 
 * Key responsibilities:
 * - State management (IDLE → SCANNING → DECIDING → SYNCING)
 * - Sync scheduling (event-based + periodic)
 * - Decision logic (upload/download/skip/conflict)
 * - Retry handling (exponential backoff)
 * - Event emission for integration with other features
 */
export class ClientSyncEngine {
  /**
   * Initialize sync engine
   * @param {Object} config - Configuration options
   * @param {number} config.maxRetries - Maximum retry attempts (default: 3)
   * @param {number} config.scanInterval - Milliseconds between scans (default: 5000)
   * @param {number} config.backoffBase - Exponential backoff base (default: 2)
   */
  constructor(config = {}) {
    this.state = SyncState.IDLE;
    this.syncQueue = []; // Like CPU ready queue
    this.retryQueue = [];
    this.maxRetries = config.maxRetries || 3;
    this.scanInterval = config.scanInterval || 5000;
    this.backoffBase = config.backoffBase || 2;
    this.isOnline = true;
    this.listeners = [];
    this.schedulerRunning = false;
    
    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      retriesUsed: 0
    };
  }

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  /**
   * Transition to new state and notify listeners
   * Maps to process state transitions in CPU scheduling
   */
  transitionTo(newState, data = {}) {
    const oldState = this.state;
    this.state = newState;
    this.notifyListeners({ 
      type: 'STATE_CHANGE', 
      oldState, 
      newState, 
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }

  // ==========================================================================
  // EVENT SYSTEM (For integration with other features)
  // ==========================================================================

  /**
   * Subscribe to engine events
   * @param {Function} listener - Event handler function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of an event
   */
  notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  // ==========================================================================
  // SYNC SCHEDULER (Main Loop)
  // ==========================================================================

  /**
   * Start the sync scheduler
   * Runs continuously, checking for changes at regular intervals
   * Similar to CPU scheduler dispatch loop
   */
  async startScheduler() {
    if (this.schedulerRunning) {
      console.warn('Scheduler already running');
      return;
    }

    this.schedulerRunning = true;
    this.notifyListeners({ 
      type: 'SCHEDULER_STARTED',
      timestamp: Date.now()
    });

    while (this.schedulerRunning) {
      if (this.isOnline) {
        await this.runSyncCycle();
      } else {
        this.transitionTo(SyncState.IDLE, { reason: 'offline' });
      }
      await this.sleep(this.scanInterval);
    }
  }

  /**
   * Stop the sync scheduler
   */
  stopScheduler() {
    this.schedulerRunning = false;
    this.transitionTo(SyncState.IDLE);
    this.notifyListeners({ 
      type: 'SCHEDULER_STOPPED',
      timestamp: Date.now()
    });
  }

  /**
   * Check if scheduler is running
   */
  isRunning() {
    return this.schedulerRunning;
  }

  // ==========================================================================
  // SYNC CYCLE (3 Phases)
  // ==========================================================================

  /**
   * Complete sync cycle
   * Phase 1: SCAN for changes
   * Phase 2: DECIDE what to do
   * Phase 3: EXECUTE sync operations
   */
  async runSyncCycle() {
    try {
      // Phase 1: SCANNING
      this.transitionTo(SyncState.SCANNING);
      await this.scanForChanges();

      // Phase 2: DECIDING
      if (this.syncQueue.length > 0) {
        this.transitionTo(SyncState.DECIDING);
        await this.makeDecisions();

        // Phase 3: EXECUTING
        await this.executeSyncOperations();
      }

      this.transitionTo(SyncState.IDLE);
    } catch (error) {
      this.transitionTo(SyncState.ERROR, { 
        error: error.message,
        stack: error.stack
      });
      this.notifyListeners({
        type: 'CYCLE_ERROR',
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  // ==========================================================================
  // PHASE 1: SCAN FOR CHANGES
  // ==========================================================================

  /**
   * Scan for file changes
   * In production: connects to FEAT-001 (File Watcher)
   * Current: simulates file system changes
   */
  async scanForChanges() {
    try {
      // TODO: Replace with actual file watcher integration (FEAT-001)
      const changes = await this.detectFileChanges();
      
      changes.forEach(change => {
        this.addToSyncQueue({
          id: `${Date.now()}-${Math.random()}`,
          filePath: change.filePath,
          changeType: change.type,
          localVersion: change.version,
          timestamp: Date.now(),
          retries: 0
        });
      });

      if (changes.length > 0) {
        this.notifyListeners({
          type: 'CHANGES_DETECTED',
          count: changes.length,
          changes: changes,
          queueSize: this.syncQueue.length,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Scan error:', error);
      throw error;
    }
  }

  /**
   * Add item to sync queue
   * Queue is sorted by timestamp (FIFO) like CPU ready queue
   */
  addToSyncQueue(item) {
    this.syncQueue.push(item);
  }

  /**
   * Detect file changes (SIMULATION)
   * TODO: Replace with actual FEAT-001 integration
   */
  async detectFileChanges() {
    // Simulate file watcher detecting changes
    await this.sleep(100);
    
    const fileNames = [
      'document.txt', 
      'image.png', 
      'report.pdf', 
      'data.csv',
      'presentation.pptx'
    ];
    const types = [ChangeType.CREATE, ChangeType.MODIFY, ChangeType.DELETE];
    
    // Randomly generate 0-2 changes
    const numChanges = Math.random() > 0.5 ? 1 : 0;
    const changes = [];
    
    for (let i = 0; i < numChanges; i++) {
      changes.push({
        filePath: fileNames[Math.floor(Math.random() * fileNames.length)],
        type: types[Math.floor(Math.random() * types.length)],
        version: Math.floor(Math.random() * 5) + 1
      });
    }
    
    return changes;
  }

  // ==========================================================================
  // PHASE 2: DECISION LOGIC
  // ==========================================================================

  /**
   * Make sync decisions for all queued items
   * Determines action: UPLOAD / DOWNLOAD / SKIP / CONFLICT
   */
  async makeDecisions() {
    for (let item of this.syncQueue) {
      try {
        const serverMeta = await this.fetchServerMetadata(item.filePath);
        const action = this.determineAction(item, serverMeta);
        item.action = action;
        
        this.notifyListeners({
          type: 'DECISION_MADE',
          file: item.filePath,
          action: action,
          localVersion: item.localVersion,
          serverVersion: serverMeta?.version,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error(`Decision error for ${item.filePath}:`, error);
        item.action = SyncAction.SKIP;
      }
    }
  }

  /**
   * Core decision algorithm
   * Implements priority-based scheduling logic
   * 
   * Decision rules:
   * 1. If server doesn't have file → UPLOAD (unless local is DELETE)
   * 2. If local version > server → UPLOAD
   * 3. If server version > local → DOWNLOAD
   * 4. If both changed simultaneously → CONFLICT
   * 5. Otherwise → SKIP
   */
  determineAction(localItem, serverMeta) {
    // Case 1: File doesn't exist on server
    if (!serverMeta) {
      return localItem.changeType === ChangeType.DELETE 
        ? SyncAction.SKIP 
        : SyncAction.UPLOAD;
    }

    // Case 2: Local deletion
    if (localItem.changeType === ChangeType.DELETE) {
      return SyncAction.UPLOAD; // Propagate deletion to server
    }

    // Case 3: Version comparison
    if (localItem.localVersion > serverMeta.version) {
      return SyncAction.UPLOAD;
    } else if (localItem.localVersion < serverMeta.version) {
      return SyncAction.DOWNLOAD;
    } else {
      // Same version but check timestamp for conflict
      if (Math.abs(localItem.timestamp - serverMeta.lastModified) > 1000) {
        return SyncAction.CONFLICT;
      }
    }

    return SyncAction.SKIP;
  }

  /**
   * Fetch server metadata (SIMULATION)
   * TODO: Replace with actual FEAT-005 API call
   */
  async fetchServerMetadata(filePath) {
    // Simulate API call to server
    await this.sleep(100);
    
    // Randomly simulate file existence on server
    if (Math.random() > 0.3) {
      return {
        version: Math.floor(Math.random() * 5) + 1,
        lastModified: Date.now() - Math.random() * 10000,
        size: Math.floor(Math.random() * 1000000)
      };
    }
    
    return null; // File doesn't exist on server
  }

  // ==========================================================================
  // PHASE 3: EXECUTE SYNC OPERATIONS
  // ==========================================================================

  /**
   * Execute all sync operations in queue
   * Similar to CPU dispatcher executing ready processes
   */
  async executeSyncOperations() {
    while (this.syncQueue.length > 0) {
      const item = this.syncQueue.shift();
      
      try {
        switch (item.action) {
          case SyncAction.UPLOAD:
            await this.executeUpload(item);
            break;
          case SyncAction.DOWNLOAD:
            await this.executeDownload(item);
            break;
          case SyncAction.CONFLICT:
            await this.handleConflict(item);
            break;
          case SyncAction.SKIP:
            // Do nothing
            break;
        }
        
        this.stats.successfulSyncs++;
        this.stats.totalSyncs++;
        
      } catch (error) {
        await this.handleSyncFailure(item, error);
      }
    }
  }

  /**
   * Execute upload operation
   * TODO: Integrate with FEAT-005 (Server API) and FEAT-003 (Delta Sync)
   */
  async executeUpload(item) {
    this.transitionTo(SyncState.UPLOADING, { file: item.filePath });
    
    // Simulate upload to server
    await this.simulateNetworkOperation();
    
    this.notifyListeners({
      type: 'UPLOAD_COMPLETE',
      file: item.filePath,
      version: item.localVersion,
      timestamp: Date.now()
    });
  }

  /**
   * Execute download operation
   * TODO: Integrate with FEAT-005 (Server API) and FEAT-003 (Delta Sync)
   */
  async executeDownload(item) {
    this.transitionTo(SyncState.DOWNLOADING, { file: item.filePath });
    
    // Simulate download from server
    await this.simulateNetworkOperation();
    
    this.notifyListeners({
      type: 'DOWNLOAD_COMPLETE',
      file: item.filePath,
      timestamp: Date.now()
    });
  }

  /**
   * Handle version conflict
   * TODO: Integrate with FEAT-004 (Conflict Resolution)
   */
  async handleConflict(item) {
    this.notifyListeners({
      type: 'CONFLICT_DETECTED',
      file: item.filePath,
      localVersion: item.localVersion,
      timestamp: Date.now()
    });
    
    // In production: delegate to FEAT-004
    // For now: log the conflict
    console.warn(`Conflict detected for ${item.filePath}`);
  }

  // ==========================================================================
  // RETRY LOGIC (Exponential Backoff)
  // ==========================================================================

  /**
   * Handle sync failure with retry logic
   * Implements exponential backoff to prevent system overload
   * Similar to aging in CPU scheduling to prevent starvation
   */
  async handleSyncFailure(item, error) {
    item.retries++;
    
    if (item.retries <= this.maxRetries) {
      this.transitionTo(SyncState.RETRYING, { 
        file: item.filePath, 
        attempt: item.retries,
        maxRetries: this.maxRetries
      });
      
      // Calculate exponential backoff: 2^n seconds
      const backoffTime = Math.pow(this.backoffBase, item.retries) * 1000;
      
      this.notifyListeners({
        type: 'RETRY_SCHEDULED',
        file: item.filePath,
        attempt: item.retries,
        maxRetries: this.maxRetries,
        backoffTime: backoffTime,
        error: error.message,
        timestamp: Date.now()
      });
      
      this.stats.retriesUsed++;
      
      // Wait for backoff period
      await this.sleep(backoffTime);
      
      // Re-queue the item
      this.syncQueue.push(item);
      
    } else {
      // Max retries exceeded
      this.stats.failedSyncs++;
      this.stats.totalSyncs++;
      
      this.notifyListeners({
        type: 'SYNC_FAILED',
        file: item.filePath,
        error: error.message,
        retries: item.retries,
        timestamp: Date.now()
      });
      
      console.error(`Sync failed for ${item.filePath} after ${item.retries} retries`);
    }
  }

  // ==========================================================================
  // NETWORK SIMULATION & HELPERS
  // ==========================================================================

  /**
   * Simulate network operation
   * TODO: Replace with actual HTTP requests
   */
  async simulateNetworkOperation() {
    const delay = 800 + Math.random() * 400;
    await this.sleep(delay);
    
    // Simulate 10% failure rate
    if (Math.random() < 0.1) {
      throw new Error('Network timeout');
    }
  }

  /**
   * Set network status
   */
  setOnlineStatus(status) {
    this.isOnline = status;
    this.notifyListeners({ 
      type: 'NETWORK_STATUS', 
      isOnline: status,
      timestamp: Date.now()
    });
  }

  /**
   * Get network status
   */
  getOnlineStatus() {
    return this.isOnline;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // STATISTICS & MONITORING
  // ==========================================================================

  /**
   * Get current statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueSize: this.syncQueue.length,
      state: this.state,
      isOnline: this.isOnline
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      retriesUsed: 0
    };
  }

  /**
   * Get sync queue status
   */
  getQueueStatus() {
    return {
      size: this.syncQueue.length,
      items: this.syncQueue.map(item => ({
        file: item.filePath,
        action: item.action,
        retries: item.retries
      }))
    };
  }
}

export default ClientSyncEngine;