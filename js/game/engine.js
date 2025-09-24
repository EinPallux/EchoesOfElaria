/**
 * Echoes of Elaria - Core Game Engine
 * Manages game state, run logic, meta-progression, and coordinates all game systems
 */

import { MapGenerator } from './mapgen.js';
import { Combat } from './combat.js';
import { Entities } from './entities.js';

export class GameEngine {
    constructor() {
        // Core systems
        this.mapGenerator = new MapGenerator();
        this.combat = new Combat();
        this.entities = new Entities();
        
        // External system references (injected)
        this.persistence = null;
        this.audioManager = null;
        this.ui = null;
        
        // Meta-progression state (persistent across runs)
        this.metaProgression = {
            echoes: 0,
            totalRuns: 0,
            totalVictories: 0,
            buildings: {
                forge: { level: 1, experience: 0 },
                library: { level: 1, experience: 0 },
                altar: { level: 1, experience: 0 },
                faction: { level: 1, experience: 0 }
            },
            unlockedRecipes: new Set(),
            unlockedClasses: new Set(['warrior', 'mage', 'rogue', 'healer']),
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
            }
        };
        
        // Current run state (temporary, resets each run)
        this.activeRun = null;
        this.isInRun = false;
        
        // Game loop and timing
        this.gameLoop = null;
        this.lastUpdate = 0;
        this.deltaTime = 0;
        
        // Event system
        this.eventCallbacks = new Map();
        
        console.log('🎮 GameEngine initialized');
    }

    /**
     * Initialize the game engine with external systems
     */
    init(persistence, audioManager, ui) {
        this.persistence = persistence;
        this.audioManager = audioManager;
        this.ui = ui;
        
        // Initialize subsystems with engine reference
        this.mapGenerator.init(this);
        this.combat.init(this);
        this.entities.init(this);
        
        console.log('⚙️ GameEngine systems connected');
    }

    /**
     * Start a new run with selected class and faction
     */
    async startNewRun(className, factionName) {
        console.log(`🚀 Starting new run: ${className} (${factionName})`);
        
        try {
            // Create new character
            const character = this.entities.createCharacter(className, factionName);
            
            // Apply meta-progression bonuses to character
            this.applyMetaProgressionBonuses(character);
            
            // Generate run data
            const runMap = this.mapGenerator.generateRun();
            
            // Create active run state
            this.activeRun = {
                id: Date.now() + Math.random(), // Unique run ID
                character: character,
                faction: factionName,
                map: runMap,
                currentNodeIndex: 0,
                inventory: [],
                resources: {
                    gold: 0,
                    ore: 0,
                    herbs: 0,
                    essences: 0
                },
                runStats: {
                    enemiesDefeated: 0,
                    damageDealt: 0,
                    damageTaken: 0,
                    itemsFound: 0,
                    startTime: Date.now()
                },
                flags: new Set(), // Story flags and achievements
                difficulty: this.calculateRunDifficulty()
            };
            
            this.isInRun = true;
            
            // Update meta stats
            this.metaProgression.totalRuns++;
            
            // Initialize UI for the run
            this.ui.initializeRun(this.activeRun);
            
            // Fire event
            this.fireEvent('runStarted', { 
                character: this.activeRun.character,
                faction: factionName 
            });
            
            console.log('✅ Run initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to start new run:', error);
            throw error;
        }
    }

    /**
     * Continue an existing run
     */
    continueRun() {
        if (!this.activeRun) {
            throw new Error('No active run to continue');
        }
        
        console.log('⏰ Continuing run...');
        
        this.isInRun = true;
        this.ui.initializeRun(this.activeRun);
        
        // Update UI to show current state
        this.ui.updateMapView();
        this.ui.updateCharacterInfo();
        
        this.fireEvent('runContinued', { run: this.activeRun });
    }

    /**
     * End the current run
     */
    async endRun(victory = false, rewards = null) {
        if (!this.isInRun || !this.activeRun) {
            console.warn('⚠️ No active run to end');
            return;
        }
        
        console.log(`🏁 Ending run (Victory: ${victory})`);
        
        try {
            // Calculate final rewards
            const finalRewards = rewards || this.calculateRunRewards(victory);
            
            // Apply rewards to meta-progression
            this.applyRunRewards(finalRewards, victory);
            
            // Update statistics
            this.updateRunStatistics(victory);
            
            // Save end state
            await this.persistence.saveMetaProgression(this.metaProgression);
            await this.persistence.clearActiveRun();
            
            // Clean up run state
            this.activeRun = null;
            this.isInRun = false;
            
            // Show run summary
            this.ui.showRunSummary(finalRewards, victory);
            
            // Fire event
            this.fireEvent('runEnded', { 
                victory, 
                rewards: finalRewards 
            });
            
            console.log('✅ Run ended successfully');
            
        } catch (error) {
            console.error('❌ Error ending run:', error);
            throw error;
        }
    }

    /**
     * Move to next node in the current run
     */
    async moveToNextNode() {
        if (!this.isInRun || !this.activeRun) {
            console.warn('⚠️ No active run');
            return false;
        }
        
        const currentIndex = this.activeRun.currentNodeIndex;
        const maxIndex = this.activeRun.map.nodes.length - 1;
        
        if (currentIndex >= maxIndex) {
            console.log('🎯 Reached end of run');
            // This is the final boss - end run on victory
            await this.endRun(true);
            return true;
        }
        
        // Move to next node
        this.activeRun.currentNodeIndex++;
        const nextNode = this.activeRun.map.nodes[this.activeRun.currentNodeIndex];
        
        console.log(`➡️ Moving to node: ${nextNode.type} (${this.activeRun.currentNodeIndex + 1}/${this.activeRun.map.nodes.length})`);
        
        // Update UI
        this.ui.updateMapView();
        
        // Handle node encounter
        await this.handleNodeEncounter(nextNode);
        
        return true;
    }

    /**
     * Handle encounter at current node
     */
    async handleNodeEncounter(node) {
        console.log(`🎲 Handling ${node.type} encounter`);
        
        switch (node.type) {
            case 'combat':
                await this.startCombat(node.enemy);
                break;
                
            case 'event':
                this.ui.showEvent(node.event);
                break;
                
            case 'resource':
                this.handleResourceNode(node);
                break;
                
            case 'boss':
                await this.startBossCombat(node.boss);
                break;
                
            case 'merchant':
                this.ui.showMerchant(node.merchant);
                break;
                
            case 'rest':
                this.handleRestNode(node);
                break;
                
            default:
                console.warn(`⚠️ Unknown node type: ${node.type}`);
                break;
        }
        
        // Mark node as visited
        node.visited = true;
    }

    /**
     * Start combat encounter
     */
    async startCombat(enemy) {
        if (!this.isInRun) return;
        
        console.log(`⚔️ Starting combat vs ${enemy.name}`);
        
        // Initialize combat system
        const combatResult = await this.combat.startCombat(
            this.activeRun.character,
            enemy
        );
        
        if (combatResult.victory) {
            // Handle combat victory
            this.handleCombatVictory(combatResult);
        } else {
            // Handle defeat
            await this.handleCombatDefeat(combatResult);
        }
    }

    /**
     * Start boss combat encounter
     */
    async startBossCombat(boss) {
        console.log(`👹 Starting boss combat vs ${boss.name}`);
        
        // Apply boss scaling based on run progress
        const scaledBoss = this.entities.scaleBoss(boss, this.activeRun.difficulty);
        
        const combatResult = await this.combat.startCombat(
            this.activeRun.character,
            scaledBoss,
            { isBoss: true }
        );
        
        if (combatResult.victory) {
            // Boss defeated - major rewards and run completion
            const bossRewards = this.calculateBossRewards(boss);
            await this.endRun(true, bossRewards);
        } else {
            // Boss defeated player
            await this.handleCombatDefeat(combatResult);
        }
    }

    /**
     * Handle combat victory
     */
    handleCombatVictory(combatResult) {
        const { enemy, rewards, experience } = combatResult;
        
        console.log(`🏆 Victory vs ${enemy.name}!`);
        
        // Add experience to character
        this.activeRun.character.addExperience(experience);
        
        // Add rewards to run
        this.addToInventory(rewards.items);
        this.addResources(rewards.resources);
        
        // Update run statistics
        this.activeRun.runStats.enemiesDefeated++;
        this.activeRun.runStats.damageDealt += combatResult.damageDealt || 0;
        this.activeRun.runStats.itemsFound += rewards.items.length;
        
        // Show victory UI
        this.ui.showCombatVictory(combatResult);
        
        // Fire event
        this.fireEvent('combatVictory', combatResult);
    }

    /**
     * Handle combat defeat
     */
    async handleCombatDefeat(combatResult) {
        console.log('💀 Combat defeat - ending run');
        
        // Update statistics
        this.activeRun.runStats.damageTaken += combatResult.damageTaken || 0;
        
        // End run with defeat
        await this.endRun(false);
    }

    /**
     * Handle resource node
     */
    handleResourceNode(node) {
        const { resourceType, amount } = node.resource;
        
        console.log(`💎 Found ${amount} ${resourceType}`);
        
        // Add resources
        this.activeRun.resources[resourceType] = (this.activeRun.resources[resourceType] || 0) + amount;
        
        // Show resource pickup UI
        this.ui.showResourcePickup(resourceType, amount);
        
        // Auto-advance to next node after short delay
        setTimeout(() => {
            this.moveToNextNode();
        }, 2000);
    }

    /**
     * Handle rest node (healing)
     */
    handleRestNode(node) {
        const healAmount = Math.floor(this.activeRun.character.maxHealth * 0.5);
        const manaAmount = Math.floor(this.activeRun.character.maxMana * 0.5);
        
        this.activeRun.character.heal(healAmount);
        this.activeRun.character.restoreMana(manaAmount);
        
        console.log(`💚 Rested: +${healAmount} HP, +${manaAmount} MP`);
        
        this.ui.showRestEffect(healAmount, manaAmount);
        
        // Auto-advance after rest
        setTimeout(() => {
            this.moveToNextNode();
        }, 2000);
    }

    /**
     * Apply meta-progression bonuses to new character
     */
    applyMetaProgressionBonuses(character) {
        const bonuses = this.metaProgression.globalBonuses;
        
        // Apply stat bonuses
        character.baseStats.strength += bonuses.startingStats;
        character.baseStats.agility += bonuses.startingStats;
        character.baseStats.intelligence += bonuses.startingStats;
        character.baseStats.vitality += bonuses.startingStats;
        
        // Recalculate derived stats
        character.recalculateStats();
        
        console.log('📈 Applied meta-progression bonuses to character');
    }

    /**
     * Calculate run difficulty based on meta-progression
     */
    calculateRunDifficulty() {
        const baseModifier = 1.0;
        const runsModifier = this.metaProgression.totalRuns * 0.05;
        const buildingModifier = Object.values(this.metaProgression.buildings)
            .reduce((sum, building) => sum + (building.level - 1) * 0.1, 0);
        
        return Math.max(0.5, baseModifier + runsModifier + buildingModifier);
    }

    /**
     * Calculate rewards for completing a run
     */
    calculateRunRewards(victory) {
        if (!this.activeRun) return { echoes: 0, items: [] };
        
        const baseEchoes = victory ? 50 : 20;
        const difficultyBonus = Math.floor(baseEchoes * this.activeRun.difficulty);
        const enemyBonus = this.activeRun.runStats.enemiesDefeated * 5;
        const timeBonus = this.calculateTimeBonus();
        
        const totalEchoes = baseEchoes + difficultyBonus + enemyBonus + timeBonus;
        
        return {
            echoes: Math.floor(totalEchoes * this.metaProgression.globalBonuses.goldMultiplier),
            items: this.generateRewardItems(victory),
            resources: { ...this.activeRun.resources }
        };
    }

    /**
     * Calculate boss-specific rewards
     */
    calculateBossRewards(boss) {
        const baseRewards = this.calculateRunRewards(true);
        
        return {
            echoes: Math.floor(baseRewards.echoes * 2), // Double echoes for boss
            items: [...baseRewards.items, ...this.generateBossItems(boss)],
            resources: baseRewards.resources,
            special: {
                bossDefeated: boss.name,
                runTime: Date.now() - this.activeRun.runStats.startTime
            }
        };
    }

    /**
     * Apply run rewards to meta-progression
     */
    applyRunRewards(rewards, victory) {
        // Add echoes
        this.metaProgression.echoes += rewards.echoes;
        
        // Update building experience
        Object.keys(this.metaProgression.buildings).forEach(buildingType => {
            const expGain = victory ? 10 : 5;
            this.metaProgression.buildings[buildingType].experience += expGain;
        });
        
        // Update faction reputation
        if (this.activeRun) {
            const faction = this.activeRun.faction;
            const repGain = victory ? 25 : 10;
            this.metaProgression.factionReputations[faction].reputation += repGain;
        }
        
        console.log(`💰 Applied rewards: ${rewards.echoes} echoes`);
    }

    /**
     * Update run statistics
     */
    updateRunStatistics(victory) {
        if (victory) {
            this.metaProgression.totalVictories++;
        }
        
        // Update global bonuses based on achievements
        this.updateGlobalBonuses();
    }

    /**
     * Update global bonuses based on progression
     */
    updateGlobalBonuses() {
        const bonuses = this.metaProgression.globalBonuses;
        
        // XP multiplier based on library level
        const libraryLevel = this.metaProgression.buildings.library.level;
        bonuses.xpMultiplier = 1.0 + (libraryLevel - 1) * 0.1;
        
        // Gold multiplier based on forge level
        const forgeLevel = this.metaProgression.buildings.forge.level;
        bonuses.goldMultiplier = 1.0 + (forgeLevel - 1) * 0.15;
        
        // Starting stats based on altar level
        const altarLevel = this.metaProgression.buildings.altar.level;
        bonuses.startingStats = (altarLevel - 1) * 2;
    }

    /**
     * Upgrade a building
     */
    upgradeBuilding(buildingType) {
        const building = this.metaProgression.buildings[buildingType];
        if (!building) return false;
        
        const cost = this.getBuildingUpgradeCost(buildingType);
        
        if (this.metaProgression.echoes >= cost) {
            this.metaProgression.echoes -= cost;
            building.level++;
            building.experience = 0;
            
            // Update global bonuses
            this.updateGlobalBonuses();
            
            console.log(`⬆️ Upgraded ${buildingType} to level ${building.level}`);
            return true;
        }
        
        return false;
    }

    /**
     * Get building upgrade cost
     */
    getBuildingUpgradeCost(buildingType) {
        const building = this.metaProgression.buildings[buildingType];
        if (!building) return Infinity;
        
        const baseCosts = {
            forge: 100,
            library: 150,
            altar: 200,
            faction: 250
        };
        
        const baseCost = baseCosts[buildingType] || 100;
        return Math.floor(baseCost * Math.pow(1.5, building.level - 1));
    }

    /**
     * Check if player can afford building upgrade
     */
    canAffordUpgrade(buildingType) {
        const cost = this.getBuildingUpgradeCost(buildingType);
        return this.metaProgression.echoes >= cost;
    }

    /**
     * Add items to run inventory
     */
    addToInventory(items) {
        if (!this.activeRun) return;
        
        items.forEach(item => {
            this.activeRun.inventory.push(item);
        });
        
        this.ui.updateInventoryView();
    }

    /**
     * Add resources to run
     */
    addResources(resources) {
        if (!this.activeRun) return;
        
        Object.keys(resources).forEach(resourceType => {
            const amount = resources[resourceType];
            this.activeRun.resources[resourceType] = 
                (this.activeRun.resources[resourceType] || 0) + amount;
        });
    }

    /**
     * Event system methods
     */
    addEventListener(eventType, callback) {
        if (!this.eventCallbacks.has(eventType)) {
            this.eventCallbacks.set(eventType, []);
        }
        this.eventCallbacks.get(eventType).push(callback);
    }

    removeEventListener(eventType, callback) {
        if (this.eventCallbacks.has(eventType)) {
            const callbacks = this.eventCallbacks.get(eventType);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    fireEvent(eventType, data) {
        if (this.eventCallbacks.has(eventType)) {
            this.eventCallbacks.get(eventType).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event callback for ${eventType}:`, error);
                }
            });
        }
    }

    /**
     * Utility methods for time calculation
     */
    calculateTimeBonus() {
        if (!this.activeRun) return 0;
        
        const runTime = Date.now() - this.activeRun.runStats.startTime;
        const targetTime = 30 * 60 * 1000; // 30 minutes target
        
        if (runTime < targetTime) {
            return Math.floor((targetTime - runTime) / 1000 / 60); // Bonus per minute saved
        }
        
        return 0;
    }

    generateRewardItems(victory) {
        // TODO: Implement item generation system
        return [];
    }

    generateBossItems(boss) {
        // TODO: Implement boss-specific item generation
        return [];
    }

    /**
     * Getters for external access
     */
    getMetaProgression() {
        return { ...this.metaProgression };
    }

    getActiveRun() {
        return this.activeRun ? { ...this.activeRun } : null;
    }

    getBuildings() {
        return { ...this.metaProgression.buildings };
    }

    setMetaProgression(data) {
        this.metaProgression = { ...this.metaProgression, ...data };
        this.updateGlobalBonuses();
    }

    setActiveRun(data) {
        this.activeRun = data;
        this.isInRun = true;
    }

    isRunActive() {
        return this.isInRun && this.activeRun !== null;
    }
}