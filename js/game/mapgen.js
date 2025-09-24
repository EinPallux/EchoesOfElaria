/**
 * Echoes of Elaria - Map Generation System
 * Procedurally generates run maps with different regions, node types, and encounters
 */

export class MapGenerator {
    constructor() {
        this.gameEngine = null;
        
        // Region definitions with unique characteristics
        this.regions = {
            forest: {
                name: 'Whispering Forest',
                description: 'Ancient woods filled with mysterious creatures',
                color: '#228B22',
                icon: '🌲',
                enemyPool: ['goblin', 'wolf', 'spider', 'treant'],
                bossPool: ['forest_guardian', 'elder_treant'],
                resourcePool: ['herbs', 'wood'],
                eventPool: ['fairy_ring', 'abandoned_camp', 'ancient_tree'],
                difficulty: 1.0
            },
            desert: {
                name: 'Scorching Wastes',
                description: 'Endless dunes hiding ancient secrets',
                color: '#DAA520',
                icon: '🏜️',
                enemyPool: ['scorpion', 'bandit', 'sand_wraith', 'mummy'],
                bossPool: ['desert_king', 'sand_dragon'],
                resourcePool: ['ore', 'gems'],
                eventPool: ['oasis', 'buried_treasure', 'sandstorm'],
                difficulty: 1.2
            },
            ice: {
                name: 'Frozen Peaks',
                description: 'Icy mountains where few dare to tread',
                color: '#87CEEB',
                icon: '🏔️',
                enemyPool: ['ice_wolf', 'frost_giant', 'ice_elemental', 'yeti'],
                bossPool: ['ice_queen', 'frost_dragon'],
                resourcePool: ['ice_crystal', 'frost_herb'],
                eventPool: ['ice_cave', 'frozen_lake', 'avalanche'],
                difficulty: 1.4
            },
            ruins: {
                name: 'Ancient Ruins',
                description: 'Crumbling remnants of a forgotten civilization',
                color: '#8B4513',
                icon: '🏛️',
                enemyPool: ['skeleton', 'ghost', 'gargoyle', 'lich'],
                bossPool: ['ancient_king', 'shadow_lord'],
                resourcePool: ['essences', 'ancient_relic'],
                eventPool: ['magic_altar', 'trapped_chest', 'spirit_encounter'],
                difficulty: 1.6
            }
        };
        
        // Node type templates
        this.nodeTypes = {
            combat: {
                name: 'Combat',
                icon: '⚔️',
                description: 'Face dangerous enemies',
                weight: 40 // Relative spawn weight
            },
            event: {
                name: 'Event',
                icon: '❓',
                description: 'A mysterious encounter',
                weight: 25
            },
            resource: {
                name: 'Resource',
                icon: '💎',
                description: 'Gather valuable materials',
                weight: 20
            },
            merchant: {
                name: 'Merchant',
                icon: '🛒',
                description: 'Trade with a traveling merchant',
                weight: 10
            },
            rest: {
                name: 'Rest Site',
                icon: '🏕️',
                description: 'Rest and recover',
                weight: 15
            },
            boss: {
                name: 'Boss',
                icon: '👹',
                description: 'Face a powerful enemy',
                weight: 0 // Manually placed, not random
            }
        };
        
        // Event templates
        this.eventTemplates = {
            fairy_ring: {
                title: 'Fairy Ring',
                description: 'You discover a circle of mushrooms glowing with ethereal light. The fairies seem friendly, but their magic is unpredictable.',
                image: '🧚',
                choices: [
                    {
                        text: 'Enter the ring and ask for blessing',
                        outcomes: [
                            { type: 'stat_boost', value: { intelligence: 2 }, probability: 0.6 },
                            { type: 'curse', value: 'fairy_curse', probability: 0.4 }
                        ]
                    },
                    {
                        text: 'Leave offerings and ask for healing',
                        outcomes: [
                            { type: 'heal', value: 0.5, probability: 0.8 },
                            { type: 'nothing', probability: 0.2 }
                        ]
                    },
                    {
                        text: 'Walk away carefully',
                        outcomes: [
                            { type: 'nothing', probability: 1.0 }
                        ]
                    }
                ]
            },
            abandoned_camp: {
                title: 'Abandoned Camp',
                description: 'You find a campsite that looks hastily abandoned. Embers still glow in the fire pit, and supplies are scattered around.',
                image: '🏕️',
                choices: [
                    {
                        text: 'Search through the supplies carefully',
                        outcomes: [
                            { type: 'items', value: ['health_potion'], probability: 0.5 },
                            { type: 'gold', value: 25, probability: 0.3 },
                            { type: 'trap', value: 15, probability: 0.2 }
                        ]
                    },
                    {
                        text: 'Rest by the fire',
                        outcomes: [
                            { type: 'heal', value: 0.3, probability: 0.7 },
                            { type: 'ambush', value: 'bandit', probability: 0.3 }
                        ]
                    },
                    {
                        text: 'Leave immediately',
                        outcomes: [
                            { type: 'nothing', probability: 1.0 }
                        ]
                    }
                ]
            },
            oasis: {
                title: 'Desert Oasis',
                description: 'A shimmering oasis appears before you, its cool waters a welcome sight in the scorching desert.',
                image: '🏝️',
                choices: [
                    {
                        text: 'Drink deeply and rest',
                        outcomes: [
                            { type: 'full_heal', probability: 0.8 },
                            { type: 'mirage', probability: 0.2 }
                        ]
                    },
                    {
                        text: 'Fill your waterskins',
                        outcomes: [
                            { type: 'items', value: ['water_bottle'], probability: 1.0 }
                        ]
                    }
                ]
            },
            ice_cave: {
                title: 'Ice Cave',
                description: 'You discover a cave carved from pure ice. Strange blue crystals emit a cold light from within.',
                image: '🧊',
                choices: [
                    {
                        text: 'Mine the ice crystals',
                        outcomes: [
                            { type: 'resources', value: { ice_crystal: 3 }, probability: 0.6 },
                            { type: 'cave_in', value: 20, probability: 0.4 }
                        ]
                    },
                    {
                        text: 'Meditate in the cold silence',
                        outcomes: [
                            { type: 'mana_boost', value: 0.5, probability: 0.7 },
                            { type: 'frostbite', value: 10, probability: 0.3 }
                        ]
                    }
                ]
            },
            magic_altar: {
                title: 'Ancient Altar',
                description: 'A stone altar covered in glowing runes stands before you. Dark energy pulses around it.',
                image: '⛪',
                choices: [
                    {
                        text: 'Channel your power into the altar',
                        outcomes: [
                            { type: 'spell_upgrade', probability: 0.5 },
                            { type: 'magic_drain', value: 0.5, probability: 0.5 }
                        ]
                    },
                    {
                        text: 'Study the runes carefully',
                        outcomes: [
                            { type: 'knowledge', value: 'ancient_rune', probability: 0.8 },
                            { type: 'nothing', probability: 0.2 }
                        ]
                    }
                ]
            }
        };
        
        console.log('🗺️ MapGenerator initialized');
    }

    /**
     * Initialize with game engine reference
     */
    init(gameEngine) {
        this.gameEngine = gameEngine;
        console.log('🗺️ MapGenerator connected to engine');
    }

    /**
     * Generate a complete run with multiple regions
     */
    generateRun() {
        console.log('🎲 Generating new run...');
        
        const runData = {
            id: this.generateId(),
            regions: [],
            nodes: [],
            totalNodes: 0,
            estimatedDifficulty: 1.0
        };
        
        // Determine number of regions (2-4)
        const regionCount = this.randomInt(2, 4);
        const selectedRegions = this.selectRegions(regionCount);
        
        let nodeIndex = 0;
        
        // Generate each region
        selectedRegions.forEach((regionKey, regionIndex) => {
            const region = this.generateRegion(regionKey, regionIndex, regionCount);
            runData.regions.push(region);
            
            // Add region nodes to main node list with proper indexing
            region.nodes.forEach(node => {
                node.globalIndex = nodeIndex++;
                node.regionIndex = regionIndex;
                runData.nodes.push(node);
            });
        });
        
        runData.totalNodes = runData.nodes.length;
        runData.estimatedDifficulty = this.calculateRunDifficulty(selectedRegions);
        
        console.log(`✅ Generated run: ${regionCount} regions, ${runData.totalNodes} nodes`);
        return runData;
    }

    /**
     * Select regions for the run (no duplicates)
     */
    selectRegions(count) {
        const availableRegions = Object.keys(this.regions);
        const selectedRegions = [];
        
        // Always start with forest (easiest)
        selectedRegions.push('forest');
        count--;
        
        // Select remaining regions randomly
        while (count > 0 && availableRegions.length > selectedRegions.length) {
            const remaining = availableRegions.filter(r => !selectedRegions.includes(r));
            const randomRegion = this.randomChoice(remaining);
            selectedRegions.push(randomRegion);
            count--;
        }
        
        return selectedRegions;
    }

    /**
     * Generate a single region with nodes
     */
    generateRegion(regionKey, regionIndex, totalRegions) {
        const regionTemplate = this.regions[regionKey];
        const isLastRegion = regionIndex === totalRegions - 1;
        
        // Determine region length (4-7 nodes, +1 for boss if last region)
        const baseLength = this.randomInt(4, 7);
        const regionLength = isLastRegion ? baseLength + 1 : baseLength;
        
        const region = {
            key: regionKey,
            name: regionTemplate.name,
            description: regionTemplate.description,
            color: regionTemplate.color,
            icon: regionTemplate.icon,
            index: regionIndex,
            length: regionLength,
            difficulty: regionTemplate.difficulty + (regionIndex * 0.2),
            nodes: []
        };
        
        // Generate nodes for this region
        for (let i = 0; i < regionLength; i++) {
            const isLastNode = i === regionLength - 1;
            const isBossNode = isLastRegion && isLastNode;
            
            let node;
            if (isBossNode) {
                node = this.generateBossNode(regionTemplate, region.difficulty);
            } else {
                node = this.generateRegularNode(regionTemplate, region.difficulty, i, regionLength);
            }
            
            node.regionKey = regionKey;
            node.localIndex = i;
            region.nodes.push(node);
        }
        
        console.log(`🗺️ Generated region: ${region.name} (${region.length} nodes)`);
        return region;
    }

    /**
     * Generate a regular (non-boss) node
     */
    generateRegularNode(regionTemplate, difficulty, nodeIndex, regionLength) {
        // Determine node type based on weights and position
        const nodeType = this.selectNodeType(nodeIndex, regionLength);
        const template = this.nodeTypes[nodeType];
        
        const node = {
            type: nodeType,
            name: template.name,
            icon: template.icon,
            description: template.description,
            difficulty: difficulty + (nodeIndex * 0.1),
            visited: false,
            completed: false
        };
        
        // Add type-specific data
        switch (nodeType) {
            case 'combat':
                node.enemy = this.generateEnemy(regionTemplate, node.difficulty);
                break;
                
            case 'event':
                node.event = this.generateEvent(regionTemplate);
                break;
                
            case 'resource':
                node.resource = this.generateResource(regionTemplate);
                break;
                
            case 'merchant':
                node.merchant = this.generateMerchant(regionTemplate);
                break;
                
            case 'rest':
                node.rest = this.generateRestSite();
                break;
        }
        
        return node;
    }

    /**
     * Generate a boss node
     */
    generateBossNode(regionTemplate, difficulty) {
        const bossTemplate = this.randomChoice(regionTemplate.bossPool);
        
        return {
            type: 'boss',
            name: 'Final Challenge',
            icon: '👹',
            description: `Face the mighty ${bossTemplate}`,
            difficulty: difficulty * 1.5, // Bosses are significantly harder
            boss: this.generateBoss(bossTemplate, difficulty * 1.5),
            visited: false,
            completed: false
        };
    }

    /**
     * Select node type based on weights and position
     */
    selectNodeType(nodeIndex, regionLength) {
        // Modify weights based on position
        const weights = { ...this.nodeTypes };
        
        // First node is more likely to be combat or event
        if (nodeIndex === 0) {
            weights.combat.weight *= 1.5;
            weights.event.weight *= 1.2;
            weights.rest.weight *= 0.5;
        }
        
        // Middle nodes favor variety
        if (nodeIndex > 0 && nodeIndex < regionLength - 2) {
            weights.merchant.weight *= 1.5;
            weights.resource.weight *= 1.3;
        }
        
        // Near end, reduce merchant chance
        if (nodeIndex >= regionLength - 2) {
            weights.merchant.weight *= 0.3;
            weights.combat.weight *= 1.3;
        }
        
        return this.weightedRandomChoice(weights);
    }

    /**
     * Generate an enemy for combat node
     */
    generateEnemy(regionTemplate, difficulty) {
        const enemyType = this.randomChoice(regionTemplate.enemyPool);
        
        // Base enemy stats that will be scaled by difficulty
        const enemyTemplates = {
            // Forest enemies
            goblin: { name: 'Goblin Scout', hp: 35, attack: 8, defense: 2, speed: 6 },
            wolf: { name: 'Forest Wolf', hp: 45, attack: 12, defense: 4, speed: 8 },
            spider: { name: 'Giant Spider', hp: 30, attack: 10, defense: 1, speed: 7 },
            treant: { name: 'Young Treant', hp: 70, attack: 15, defense: 8, speed: 3 },
            
            // Desert enemies
            scorpion: { name: 'Desert Scorpion', hp: 40, attack: 14, defense: 6, speed: 5 },
            bandit: { name: 'Desert Bandit', hp: 50, attack: 11, defense: 3, speed: 6 },
            sand_wraith: { name: 'Sand Wraith', hp: 35, attack: 16, defense: 2, speed: 9 },
            mummy: { name: 'Ancient Mummy', hp: 60, attack: 13, defense: 7, speed: 4 },
            
            // Ice enemies
            ice_wolf: { name: 'Frost Wolf', hp: 55, attack: 14, defense: 5, speed: 7 },
            frost_giant: { name: 'Frost Giant', hp: 90, attack: 20, defense: 12, speed: 2 },
            ice_elemental: { name: 'Ice Elemental', hp: 40, attack: 18, defense: 3, speed: 8 },
            yeti: { name: 'Mountain Yeti', hp: 75, attack: 16, defense: 10, speed: 5 },
            
            // Ruins enemies
            skeleton: { name: 'Ancient Skeleton', hp: 45, attack: 12, defense: 8, speed: 4 },
            ghost: { name: 'Restless Ghost', hp: 30, attack: 20, defense: 1, speed: 10 },
            gargoyle: { name: 'Stone Gargoyle', hp: 80, attack: 18, defense: 15, speed: 3 },
            lich: { name: 'Minor Lich', hp: 65, attack: 22, defense: 6, speed: 6 }
        };
        
        const template = enemyTemplates[enemyType] || enemyTemplates.goblin;
        
        // Scale stats by difficulty
        return {
            ...template,
            hp: Math.floor(template.hp * difficulty),
            maxHp: Math.floor(template.hp * difficulty),
            attack: Math.floor(template.attack * difficulty),
            defense: Math.floor(template.defense * difficulty),
            speed: template.speed,
            level: Math.max(1, Math.floor(difficulty * 5)),
            type: enemyType
        };
    }

    /**
     * Generate a boss enemy
     */
    generateBoss(bossType, difficulty) {
        const bossTemplates = {
            forest_guardian: { 
                name: 'Forest Guardian', 
                hp: 150, attack: 25, defense: 15, speed: 5,
                abilities: ['nature_heal', 'root_entangle', 'forest_fury']
            },
            elder_treant: { 
                name: 'Elder Treant', 
                hp: 200, attack: 30, defense: 20, speed: 3,
                abilities: ['bark_armor', 'branch_slam', 'forest_blessing']
            },
            desert_king: { 
                name: 'Desert King', 
                hp: 180, attack: 28, defense: 12, speed: 6,
                abilities: ['sand_storm', 'mirage', 'scorching_strike']
            },
            sand_dragon: { 
                name: 'Sand Dragon', 
                hp: 250, attack: 35, defense: 18, speed: 7,
                abilities: ['sand_breath', 'dune_dive', 'desert_rage']
            },
            ice_queen: { 
                name: 'Ice Queen', 
                hp: 220, attack: 32, defense: 16, speed: 4,
                abilities: ['frost_armor', 'ice_storm', 'frozen_heart']
            },
            frost_dragon: { 
                name: 'Frost Dragon', 
                hp: 300, attack: 40, defense: 22, speed: 6,
                abilities: ['ice_breath', 'blizzard', 'absolute_zero']
            },
            ancient_king: { 
                name: 'Ancient King', 
                hp: 280, attack: 38, defense: 25, speed: 5,
                abilities: ['royal_command', 'ancient_curse', 'kingly_wrath']
            },
            shadow_lord: { 
                name: 'Shadow Lord', 
                hp: 200, attack: 45, defense: 10, speed: 9,
                abilities: ['shadow_step', 'dark_magic', 'void_strike']
            }
        };
        
        const template = bossTemplates[bossType] || bossTemplates.forest_guardian;
        
        return {
            ...template,
            hp: Math.floor(template.hp * difficulty),
            maxHp: Math.floor(template.hp * difficulty),
            attack: Math.floor(template.attack * difficulty),
            defense: Math.floor(template.defense * difficulty),
            speed: template.speed,
            level: Math.max(10, Math.floor(difficulty * 10)),
            type: bossType,
            isBoss: true
        };
    }

    /**
     * Generate an event
     */
    generateEvent(regionTemplate) {
        const eventType = this.randomChoice(regionTemplate.eventPool);
        const template = this.eventTemplates[eventType];
        
        if (!template) {
            // Fallback generic event
            return {
                title: 'Strange Encounter',
                description: 'You encounter something unusual...',
                image: '❓',
                choices: [
                    {
                        text: 'Investigate carefully',
                        outcomes: [
                            { type: 'gold', value: 15, probability: 0.7 },
                            { type: 'nothing', probability: 0.3 }
                        ]
                    },
                    {
                        text: 'Move on quickly',
                        outcomes: [{ type: 'nothing', probability: 1.0 }]
                    }
                ]
            };
        }
        
        return { ...template };
    }

    /**
     * Generate a resource node
     */
    generateResource(regionTemplate) {
        const resourceType = this.randomChoice(regionTemplate.resourcePool);
        const amount = this.randomInt(2, 5);
        
        return {
            type: resourceType,
            amount: amount,
            description: `You found ${amount} ${resourceType}`
        };
    }

    /**
     * Generate a merchant
     */
    generateMerchant(regionTemplate) {
        return {
            name: 'Traveling Merchant',
            greeting: 'Welcome, traveler! Care to see my wares?',
            items: this.generateMerchantItems(regionTemplate),
            haggle: this.randomFloat(0.8, 1.2) // Price multiplier
        };
    }

    /**
     * Generate merchant items
     */
    generateMerchantItems(regionTemplate) {
        const items = [];
        const itemCount = this.randomInt(3, 6);
        
        for (let i = 0; i < itemCount; i++) {
            items.push({
                name: 'Health Potion',
                description: 'Restores 50 HP',
                price: 25,
                type: 'consumable'
            });
        }
        
        return items;
    }

    /**
     * Generate a rest site
     */
    generateRestSite() {
        const restTypes = [
            { name: 'Campfire', bonus: 'warmth' },
            { name: 'Natural Spring', bonus: 'purity' },
            { name: 'Ancient Shrine', bonus: 'blessing' },
            { name: 'Peaceful Grove', bonus: 'nature' }
        ];
        
        return this.randomChoice(restTypes);
    }

    /**
     * Calculate overall run difficulty
     */
    calculateRunDifficulty(regionKeys) {
        let totalDifficulty = 0;
        regionKeys.forEach(key => {
            totalDifficulty += this.regions[key].difficulty;
        });
        
        return totalDifficulty / regionKeys.length;
    }

    /**
     * Utility functions for randomization
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    weightedRandomChoice(weights) {
        const totalWeight = Object.values(weights).reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [key, item] of Object.entries(weights)) {
            random -= item.weight;
            if (random <= 0) {
                return key;
            }
        }
        
        // Fallback
        return Object.keys(weights)[0];
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
}