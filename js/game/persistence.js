/**
 * Echoes of Elaria - Data Persistence System
 * Handles saving and loading game data using localStorage/IndexedDB with versioning
 */

export class Persistence {
    constructor() {
        this.storageType = 'localStorage'; // 'localStorage' or 'indexedDB'
        this.gameVersion = '1.0.0';
        this.dbName = 'EchoesOfElaria';
        this.dbVersion = 1;
        this.db = null;
        
        // Storage keys
        this.keys = {
            metaProgression: 'echoes_meta_progression',
            activeRun: 'echoes_active_run',
            settings: 'echoes_settings',
            statistics: 'echoes_statistics',
            version: 'echoes_version'
        };
        
        // Default data structures
        this.defaultMetaProgression = {
            version: this.gameVersion,
            echoes: 0,
            totalRuns: 0,
            totalVictories: 0,
            totalPlaytime: 0,
            buildings: {
                forge: { level: 1, experience: 0 },
                library: { level: 1, experience: 0 },
                altar: { level: 1, experience: 0 },
                faction: { level: 1, experience: 0 }
            },
            unlockedRecipes: [],
            unlockedClasses: ['warrior', 'mage', 'rogue', 'healer'],
            factionReputations: {
                order: { reputation: 0, level: 1 },
                shadow: { reputation: 0, level: 1 },
                nature: { reputation: 0, level: 1 }
            },
            globalBonuses: {
                xpMultiplier: 1.0,
                goldMultiplier: 1.0,
                craftingSpeed: 1.0,
                startingStats: 0
            },
            achievements: [],
            lastPlayed: null
        };
        
        this.defaultSettings = {
            version: this.gameVersion,
            audio: {
                masterVolume: 0.7,
                musicVolume: 0.5,
                sfxVolume: 0.8,
                muted: false
            },
            graphics: {
                animations: true,
                particles: true,
                screenShake: true
            },
            gameplay: {
                autoSave: true,
                autoSaveInterval: 30000, // 30 seconds
                confirmActions: true,
                fastCombat: false
            },
            controls: {
                keyboardShortcuts: true,
                mouseTooltips: true
            }
        };
        
        console.log('💾 Persistence system initialized');
    }

    /**
     * Initialize the persistence system
     */
    async init() {
        try {
            // Detect best storage option
            await this.detectStorageCapabilities();
            
            // Initialize storage
            if (this.storageType === 'indexedDB') {
                await this.initIndexedDB();
            }
            
            // Check for existing data and migrate if needed
            await this.checkAndMigrateData();
            
            console.log(`💾 Persistence initialized using ${this.storageType}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize persistence:', error);
            // Fallback to localStorage
            this.storageType = 'localStorage';
        }
    }

    /**
     * Detect available storage capabilities
     */
    async detectStorageCapabilities() {
        // Check if IndexedDB is available and functional
        if (!window.indexedDB) {
            console.log('💾 IndexedDB not available, using localStorage');
            this.storageType = 'localStorage';
            return;
        }

        try {
            // Test IndexedDB functionality
            const testRequest = indexedDB.open('test', 1);
            
            await new Promise((resolve, reject) => {
                testRequest.onerror = () => reject(testRequest.error);
                testRequest.onsuccess = () => {
                    testRequest.result.close();
                    indexedDB.deleteDatabase('test');
                    resolve();
                };
                testRequest.onupgradeneeded = () => {
                    // Database creation successful
                };
            });
            
            // If we get here, IndexedDB works
            this.storageType = 'indexedDB';
            console.log('💾 IndexedDB available and functional');
            
        } catch (error) {
            console.log('💾 IndexedDB test failed, using localStorage:', error.message);
            this.storageType = 'localStorage';
        }
    }

    /**
     * Initialize IndexedDB
     */
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                reject(new Error('Failed to open IndexedDB'));
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('💾 IndexedDB opened successfully');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                
                // Create object stores
                if (!this.db.objectStoreNames.contains('gameData')) {
                    const objectStore = this.db.createObjectStore('gameData', { keyPath: 'key' });
                    objectStore.createIndex('key', 'key', { unique: true });
                }
                
                console.log('💾 IndexedDB schema created');
            };
        });
    }

    /**
     * Check existing data and migrate if necessary
     */
    async checkAndMigrateData() {
        try {
            const storedVersion = await this.loadData(this.keys.version);
            
            if (!storedVersion) {
                // First time setup
                console.log('💾 First time setup - initializing default data');
                await this.saveData(this.keys.version, this.gameVersion);
                return;
            }
            
            if (storedVersion !== this.gameVersion) {
                console.log(`💾 Version mismatch: ${storedVersion} → ${this.gameVersion}`);
                await this.migrateData(storedVersion, this.gameVersion);
            }
            
        } catch (error) {
            console.error('❌ Error checking data version:', error);
        }
    }

    /**
     * Migrate data between versions
     */
    async migrateData(fromVersion, toVersion) {
        console.log(`🔄 Migrating data from ${fromVersion} to ${toVersion}`);
        
        try {
            // Load existing data
            const metaProgression = await this.loadMetaProgression();
            const settings = await this.loadSettings();
            
            // Apply version-specific migrations
            const migratedMeta = this.migrateMetaProgression(metaProgression, fromVersion, toVersion);
            const migratedSettings = this.migrateSettings(settings, fromVersion, toVersion);
            
            // Save migrated data
            await this.saveMetaProgression(migratedMeta);
            await this.saveSettings(migratedSettings);
            await this.saveData(this.keys.version, toVersion);
            
            console.log('✅ Data migration completed successfully');
            
        } catch (error) {
            console.error('❌ Data migration failed:', error);
            throw error;
        }
    }

    /**
     * Migrate meta progression data
     */
    migrateMetaProgression(data, fromVersion, toVersion) {
        if (!data) return this.defaultMetaProgression;
        
        let migrated = { ...data };
        
        // Version-specific migrations
        if (this.compareVersions(fromVersion, '1.0.0') < 0) {
            // Migrations for pre-1.0.0 versions
            migrated = { ...this.defaultMetaProgression, ...migrated };
        }
        
        // Always update version
        migrated.version = toVersion;
        
        return migrated;
    }

    /**
     * Migrate settings data
     */
    migrateSettings(data, fromVersion, toVersion) {
        if (!data) return this.defaultSettings;
        
        let migrated = { ...data };
        
        // Version-specific migrations
        if (this.compareVersions(fromVersion, '1.0.0') < 0) {
            // Merge with new default settings
            migrated = this.deepMerge(this.defaultSettings, migrated);
        }
        
        // Always update version
        migrated.version = toVersion;
        
        return migrated;
    }

    /**
     * Save meta progression data
     */
    async saveMetaProgression(data) {
        try {
            const dataToSave = {
                ...data,
                lastPlayed: new Date().toISOString()
            };
            
            await this.saveData(this.keys.metaProgression, dataToSave);
            console.log('💾 Meta progression saved');
            
        } catch (error) {
            console.error('❌ Failed to save meta progression:', error);
            throw error;
        }
    }

    /**
     * Load meta progression data
     */
    async loadMetaProgression() {
        try {
            const data = await this.loadData(this.keys.metaProgression);
            return data || this.defaultMetaProgression;
            
        } catch (error) {
            console.error('❌ Failed to load meta progression:', error);
            return this.defaultMetaProgression;
        }
    }

    /**
     * Save active run data
     */
    async saveActiveRun(runData) {
        try {
            if (!runData) {
                await this.clearActiveRun();
                return;
            }
            
            const dataToSave = {
                ...runData,
                lastSaved: new Date().toISOString()
            };
            
            await this.saveData(this.keys.activeRun, dataToSave);
            console.log('💾 Active run saved');
            
        } catch (error) {
            console.error('❌ Failed to save active run:', error);
            throw error;
        }
    }

    /**
     * Load active run data
     */
    async loadActiveRun() {
        try {
            const data = await this.loadData(this.keys.activeRun);
            return data || null;
            
        } catch (error) {
            console.error('❌ Failed to load active run:', error);
            return null;
        }
    }

    /**
     * Clear active run data
     */
    async clearActiveRun() {
        try {
            await this.removeData(this.keys.activeRun);
            console.log('💾 Active run cleared');
            
        } catch (error) {
            console.error('❌ Failed to clear active run:', error);
        }
    }

    /**
     * Save settings
     */
    async saveSettings(settings) {
        try {
            await this.saveData(this.keys.settings, settings);
            console.log('💾 Settings saved');
            
        } catch (error) {
            console.error('❌ Failed to save settings:', error);
            throw error;
        }
    }

    /**
     * Load settings
     */
    async loadSettings() {
        try {
            const data = await this.loadData(this.keys.settings);
            return data || this.defaultSettings;
            
        } catch (error) {
            console.error('❌ Failed to load settings:', error);
            return this.defaultSettings;
        }
    }

    /**
     * Save generic data based on storage type
     */
    async saveData(key, data) {
        if (this.storageType === 'indexedDB') {
            return this.saveToIndexedDB(key, data);
        } else {
            return this.saveToLocalStorage(key, data);
        }
    }

    /**
     * Load generic data based on storage type
     */
    async loadData(key) {
        if (this.storageType === 'indexedDB') {
            return this.loadFromIndexedDB(key);
        } else {
            return this.loadFromLocalStorage(key);
        }
    }

    /**
     * Remove data based on storage type
     */
    async removeData(key) {
        if (this.storageType === 'indexedDB') {
            return this.removeFromIndexedDB(key);
        } else {
            return this.removeFromLocalStorage(key);
        }
    }

    /**
     * Save to IndexedDB
     */
    async saveToIndexedDB(key, data) {
        if (!this.db) throw new Error('IndexedDB not initialized');
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gameData'], 'readwrite');
            const objectStore = transaction.objectStore('gameData');
            
            const request = objectStore.put({
                key: key,
                data: data,
                timestamp: Date.now()
            });
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Load from IndexedDB
     */
    async loadFromIndexedDB(key) {
        if (!this.db) throw new Error('IndexedDB not initialized');
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gameData'], 'readonly');
            const objectStore = transaction.objectStore('gameData');
            
            const request = objectStore.get(key);
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.data : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Remove from IndexedDB
     */
    async removeFromIndexedDB(key) {
        if (!this.db) throw new Error('IndexedDB not initialized');
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gameData'], 'readwrite');
            const objectStore = transaction.objectStore('gameData');
            
            const request = objectStore.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Save to localStorage
     */
    async saveToLocalStorage(key, data) {
        try {
            const serialized = JSON.stringify({
                data: data,
                timestamp: Date.now(),
                version: this.gameVersion
            });
            
            localStorage.setItem(key, serialized);
            
        } catch (error) {
            // Handle localStorage quota exceeded
            if (error.name === 'QuotaExceededError') {
                console.warn('💾 localStorage quota exceeded, cleaning old data');
                await this.cleanupOldData();
                // Retry save
                const serialized = JSON.stringify({
                    data: data,
                    timestamp: Date.now(),
                    version: this.gameVersion
                });
                localStorage.setItem(key, serialized);
            } else {
                throw error;
            }
        }
    }

    /**
     * Load from localStorage
     */
    async loadFromLocalStorage(key) {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;
            
            const parsed = JSON.parse(item);
            return parsed.data;
            
        } catch (error) {
            console.error(`❌ Failed to parse localStorage item ${key}:`, error);
            // Remove corrupted item
            localStorage.removeItem(key);
            return null;
        }
    }

    /**
     * Remove from localStorage
     */
    async removeFromLocalStorage(key) {
        localStorage.removeItem(key);
    }

    /**
     * Clean up old data to free space
     */
    async cleanupOldData() {
        console.log('🧹 Cleaning up old data...');
        
        // Remove old run data (keep only most recent)
        // This is a placeholder - implement based on your needs
        const keysToCheck = Object.values(this.keys);
        
        keysToCheck.forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                try {
                    const parsed = JSON.parse(item);
                    const age = Date.now() - parsed.timestamp;
                    
                    // Remove data older than 30 days (except meta progression)
                    if (age > 30 * 24 * 60 * 60 * 1000 && key !== this.keys.metaProgression) {
                        localStorage.removeItem(key);
                        console.log(`🧹 Removed old data: ${key}`);
                    }
                } catch (e) {
                    // Remove corrupted items
                    localStorage.removeItem(key);
                }
            }
        });
    }

    /**
     * Export save data
     */
    async exportSaveData() {
        try {
            const metaProgression = await this.loadMetaProgression();
            const activeRun = await this.loadActiveRun();
            const settings = await this.loadSettings();
            
            const exportData = {
                version: this.gameVersion,
                exportDate: new Date().toISOString(),
                metaProgression,
                activeRun,
                settings
            };
            
            return JSON.stringify(exportData, null, 2);
            
        } catch (error) {
            console.error('❌ Failed to export save data:', error);
            throw error;
        }
    }

    /**
     * Import save data
     */
    async importSaveData(jsonString) {
        try {
            const importData = JSON.parse(jsonString);
            
            // Validate import data
            if (!importData.version || !importData.metaProgression) {
                throw new Error('Invalid save data format');
            }
            
            // Save imported data
            await this.saveMetaProgression(importData.metaProgression);
            
            if (importData.activeRun) {
                await this.saveActiveRun(importData.activeRun);
            }
            
            if (importData.settings) {
                await this.saveSettings(importData.settings);
            }
            
            console.log('✅ Save data imported successfully');
            
        } catch (error) {
            console.error('❌ Failed to import save data:', error);
            throw error;
        }
    }

    /**
     * Clear all save data
     */
    async clearAllData() {
        try {
            const keys = Object.values(this.keys);
            
            for (const key of keys) {
                await this.removeData(key);
            }
            
            console.log('🗑️ All save data cleared');
            
        } catch (error) {
            console.error('❌ Failed to clear all data:', error);
            throw error;
        }
    }

    /**
     * Get storage info
     */
    async getStorageInfo() {
        const info = {
            type: this.storageType,
            version: this.gameVersion
        };
        
        if (this.storageType === 'localStorage') {
            // Estimate localStorage usage
            let totalSize = 0;
            for (const key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length;
                }
            }
            info.usage = `${Math.round(totalSize / 1024)} KB`;
        }
        
        return info;
    }

    /**
     * Utility functions
     */
    compareVersions(version1, version2) {
        const v1parts = version1.split('.').map(Number);
        const v2parts = version2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
            const v1part = v1parts[i] || 0;
            const v2part = v2parts[i] || 0;
            
            if (v1part < v2part) return -1;
            if (v1part > v2part) return 1;
        }
        
        return 0;
    }

    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * Backup and restore functionality
     */
    async createBackup() {
        try {
            const backupData = await this.exportSaveData();
            const backup = {
                id: Date.now(),
                date: new Date().toISOString(),
                data: backupData
            };
            
            // Save backup
            await this.saveData(`backup_${backup.id}`, backup);
            
            return backup.id;
            
        } catch (error) {
            console.error('❌ Failed to create backup:', error);
            throw error;
        }
    }

    async restoreBackup(backupId) {
        try {
            const backup = await this.loadData(`backup_${backupId}`);
            if (!backup) {
                throw new Error('Backup not found');
            }
            
            await this.importSaveData(backup.data);
            
            console.log('✅ Backup restored successfully');
            
        } catch (error) {
            console.error('❌ Failed to restore backup:', error);
            throw error;
        }
    }
}