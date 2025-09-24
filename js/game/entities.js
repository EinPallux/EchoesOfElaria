/**
 * Echoes of Elaria - Entities and Character System
 * Defines character classes, skills, progression, and enemy templates
 */

export class Entities {
    constructor() {
        this.gameEngine = null;
        
        // Base character class templates
        this.classTemplates = {
            warrior: {
                name: 'Warrior',
                description: 'Master of melee combat and defense',
                icon: '⚔️',
                baseStats: {
                    strength: 15,
                    agility: 8,
                    intelligence: 5,
                    vitality: 12
                },
                growthRates: {
                    strength: 2.5,
                    agility: 1.2,
                    intelligence: 0.8,
                    vitality: 2.0
                },
                baseHealth: 100,
                baseMana: 30,
                healthPerLevel: 15,
                manaPerLevel: 3,
                skills: [
                    'slash', 'shield_bash', 'defensive_stance', 'charge', 
                    'whirlwind', 'taunt', 'berserker_rage', 'guardian_strike'
                ]
            },
            mage: {
                name: 'Mage',
                description: 'Wielder of elemental magic',
                icon: '🔮',
                baseStats: {
                    strength: 5,
                    agility: 7,
                    intelligence: 15,
                    vitality: 8
                },
                growthRates: {
                    strength: 0.8,
                    agility: 1.5,
                    intelligence: 2.8,
                    vitality: 1.2
                },
                baseHealth: 60,
                baseMana: 80,
                healthPerLevel: 8,
                manaPerLevel: 12,
                skills: [
                    'magic_missile', 'fireball', 'ice_shard', 'lightning_bolt',
                    'meteor', 'teleport', 'mana_shield', 'elemental_mastery'
                ]
            },
            rogue: {
                name: 'Rogue',
                description: 'Swift assassin and scout',
                icon: '🗡️',
                baseStats: {
                    strength: 10,
                    agility: 15,
                    intelligence: 8,
                    vitality: 7
                },
                growthRates: {
                    strength: 1.8,
                    agility: 2.5,
                    intelligence: 1.3,
                    vitality: 1.0
                },
                baseHealth: 70,
                baseMana: 50,
                healthPerLevel: 10,
                manaPerLevel: 7,
                skills: [
                    'backstab', 'poison_blade', 'stealth', 'throwing_knife',
                    'shadow_step', 'evasion', 'assassinate', 'smoke_bomb'
                ]
            },
            healer: {
                name: 'Healer',
                description: 'Support and restoration expert',
                icon: '✨',
                baseStats: {
                    strength: 6,
                    agility: 9,
                    intelligence: 12,
                    vitality: 13
                },
                growthRates: {
                    strength: 1.0,
                    agility: 1.5,
                    intelligence: 2.2,
                    vitality: 2.3
                },
                baseHealth: 80,
                baseMana: 70,
                healthPerLevel: 12,
                manaPerLevel: 10,
                skills: [
                    'heal', 'greater_heal', 'blessing', 'purify',
                    'divine_shield', 'resurrection', 'holy_light', 'sanctuary'
                ]
            }
        };

        // Skill definitions for all classes
        this.skillTemplates = {
            // Warrior Skills
            slash: {
                name: 'Slash',
                description: 'A powerful sword strike',
                icon: '⚔️',
                manaCost: 0,
                cooldown: 0,
                damage: 25,
                type: 'physical',
                scalingFactor: 1.2,
                criticalChance: 0.15,
                accuracy: 0.95
            },
            shield_bash: {
                name: 'Shield Bash',
                description: 'Bash with shield, chance to stun',
                icon: '🛡️',
                manaCost: 10,
                cooldown: 2,
                damage: 15,
                type: 'physical',
                scalingFactor: 0.8,
                statusEffects: [{ type: 'stunned', duration: 1, chance: 0.3 }],
                accuracy: 0.9
            },
            defensive_stance: {
                name: 'Defensive Stance',
                description: 'Increase defense for several turns',
                icon: '🛡️',
                manaCost: 15,
                cooldown: 4,
                damage: 0,
                type: 'buff',
                statusEffects: [{ type: 'defense_boost', duration: 3, chance: 1.0 }]
            },
            charge: {
                name: 'Charge',
                description: 'Rush forward with devastating force',
                icon: '💨',
                manaCost: 20,
                cooldown: 3,
                damage: 40,
                type: 'physical',
                scalingFactor: 1.5,
                criticalChance: 0.25,
                accuracy: 0.85
            },
            whirlwind: {
                name: 'Whirlwind',
                description: 'Spin attack hitting all nearby enemies',
                icon: '🌪️',
                manaCost: 25,
                cooldown: 4,
                damage: 30,
                type: 'physical',
                scalingFactor: 1.0,
                areaEffect: true,
                accuracy: 0.9
            },
            taunt: {
                name: 'Taunt',
                description: 'Force enemy to attack you',
                icon: '😤',
                manaCost: 5,
                cooldown: 2,
                damage: 0,
                type: 'debuff',
                statusEffects: [{ type: 'taunted', duration: 2, chance: 0.8 }]
            },
            berserker_rage: {
                name: 'Berserker Rage',
                description: 'Increase attack but reduce defense',
                icon: '😡',
                manaCost: 30,
                cooldown: 6,
                damage: 0,
                type: 'buff',
                statusEffects: [
                    { type: 'strength_boost', duration: 4, chance: 1.0 },
                    { type: 'defense_weakness', duration: 4, chance: 1.0 }
                ]
            },
            guardian_strike: {
                name: 'Guardian Strike',
                description: 'Powerful attack that heals allies',
                icon: '✨',
                manaCost: 35,
                cooldown: 5,
                damage: 35,
                healing: 20,
                type: 'physical',
                scalingFactor: 1.3,
                criticalChance: 0.2
            },

            // Mage Skills
            magic_missile: {
                name: 'Magic Missile',
                description: 'Basic magical projectile',
                icon: '✨',
                manaCost: 8,
                cooldown: 0,
                damage: 20,
                type: 'magic',
                scalingFactor: 1.5,
                accuracy: 0.98
            },
            fireball: {
                name: 'Fireball',
                description: 'Explosive fire magic',
                icon: '🔥',
                manaCost: 20,
                cooldown: 2,
                damage: 35,
                type: 'magic',
                scalingFactor: 1.8,
                statusEffects: [{ type: 'burning', duration: 2, chance: 0.4 }],
                areaEffect: true
            },
            ice_shard: {
                name: 'Ice Shard',
                description: 'Sharp ice projectile that can slow',
                icon: '❄️',
                manaCost: 15,
                cooldown: 1,
                damage: 25,
                type: 'magic',
                scalingFactor: 1.4,
                statusEffects: [{ type: 'slow', duration: 2, chance: 0.5 }]
            },
            lightning_bolt: {
                name: 'Lightning Bolt',
                description: 'Fast electric attack',
                icon: '⚡',
                manaCost: 25,
                cooldown: 3,
                damage: 40,
                type: 'magic',
                scalingFactor: 1.6,
                criticalChance: 0.3,
                accuracy: 1.0 // Lightning never misses
            },
            meteor: {
                name: 'Meteor',
                description: 'Devastating area magic attack',
                icon: '☄️',
                manaCost: 45,
                cooldown: 6,
                damage: 60,
                type: 'magic',
                scalingFactor: 2.0,
                areaEffect: true,
                accuracy: 0.8
            },
            teleport: {
                name: 'Teleport',
                description: 'Instantly move to avoid attacks',
                icon: '💫',
                manaCost: 20,
                cooldown: 4,
                damage: 0,
                type: 'utility',
                statusEffects: [{ type: 'evasion_boost', duration: 2, chance: 1.0 }]
            },
            mana_shield: {
                name: 'Mana Shield',
                description: 'Use mana to absorb damage',
                icon: '🔵',
                manaCost: 30,
                cooldown: 5,
                damage: 0,
                type: 'buff',
                statusEffects: [{ type: 'mana_shield', duration: 4, chance: 1.0 }]
            },
            elemental_mastery: {
                name: 'Elemental Mastery',
                description: 'Boost all elemental damage',
                icon: '🌟',
                manaCost: 40,
                cooldown: 7,
                damage: 0,
                type: 'buff',
                statusEffects: [{ type: 'elemental_boost', duration: 5, chance: 1.0 }]
            },

            // Rogue Skills
            backstab: {
                name: 'Backstab',
                description: 'High critical chance attack',
                icon: '🗡️',
                manaCost: 10,
                cooldown: 1,
                damage: 20,
                type: 'physical',
                scalingFactor: 1.3,
                criticalChance: 0.5,
                accuracy: 0.9
            },
            poison_blade: {
                name: 'Poison Blade',
                description: 'Attack that applies poison',
                icon: '☠️',
                manaCost: 15,
                cooldown: 2,
                damage: 18,
                type: 'physical',
                scalingFactor: 1.0,
                statusEffects: [{ type: 'poison', duration: 4, chance: 0.8 }]
            },
            stealth: {
                name: 'Stealth',
                description: 'Become harder to hit',
                icon: '👤',
                manaCost: 20,
                cooldown: 4,
                damage: 0,
                type: 'buff',
                statusEffects: [{ type: 'stealth', duration: 3, chance: 1.0 }]
            },
            throwing_knife: {
                name: 'Throwing Knife',
                description: 'Ranged attack with bleeding',
                icon: '🔪',
                manaCost: 12,
                cooldown: 1,
                damage: 22,
                type: 'ranged',
                scalingFactor: 1.1,
                statusEffects: [{ type: 'bleeding', duration: 3, chance: 0.6 }],
                accuracy: 0.95
            },
            shadow_step: {
                name: 'Shadow Step',
                description: 'Teleport behind enemy for guaranteed hit',
                icon: '🌑',
                manaCost: 25,
                cooldown: 3,
                damage: 30,
                type: 'physical',
                scalingFactor: 1.4,
                accuracy: 1.0, // Always hits
                criticalChance: 0.3
            },
            evasion: {
                name: 'Evasion',
                description: 'Greatly increase dodge chance',
                icon: '💨',
                manaCost: 18,
                cooldown: 3,
                damage: 0,
                type: 'buff',
                statusEffects: [{ type: 'speed_boost', duration: 3, chance: 1.0 }]
            },
            assassinate: {
                name: 'Assassinate',
                description: 'Extremely high damage single target',
                icon: '💀',
                manaCost: 40,
                cooldown: 6,
                damage: 80,
                type: 'physical',
                scalingFactor: 2.0,
                criticalChance: 0.7,
                accuracy: 0.8
            },
            smoke_bomb: {
                name: 'Smoke Bomb',
                description: 'Blind enemies and boost evasion',
                icon: '💨',
                manaCost: 30,
                cooldown: 5,
                damage: 0,
                type: 'debuff',
                statusEffects: [
                    { type: 'blinded', duration: 2, chance: 0.9 },
                    { type: 'stealth', duration: 2, chance: 1.0 }
                ]
            },

            // Healer Skills
            heal: {
                name: 'Heal',
                description: 'Restore health to yourself',
                icon: '💚',
                manaCost: 15,
                cooldown: 0,
                damage: 0,
                healing: 35,
                type: 'magic',
                scalingFactor: 1.5
            },
            greater_heal: {
                name: 'Greater Heal',
                description: 'Powerful healing spell',
                icon: '💚',
                manaCost: 30,
                cooldown: 2,
                damage: 0,
                healing: 70,
                type: 'magic',
                scalingFactor: 2.0
            },
            blessing: {
                name: 'Blessing',
                description: 'Boost all stats temporarily',
                icon: '✨',
                manaCost: 25,
                cooldown: 4,
                damage: 0,
                type: 'buff',
                statusEffects: [{ type: 'blessed', duration: 4, chance: 1.0 }]
            },
            purify: {
                name: 'Purify',
                description: 'Remove negative status effects',
                icon: '🌟',
                manaCost: 20,
                cooldown: 3,
                damage: 0,
                type: 'utility',
                statusEffects: [{ type: 'purified', duration: 1, chance: 1.0 }]
            },
            divine_shield: {
                name: 'Divine Shield',
                description: 'Temporary immunity to damage',
                icon: '🛡️',
                manaCost: 40,
                cooldown: 6,
                damage: 0,
                type: 'buff',
                statusEffects: [{ type: 'divine_shield', duration: 2, chance: 1.0 }]
            },
            resurrection: {
                name: 'Resurrection',
                description: 'Revive with low health if defeated',
                icon: '⚱️',
                manaCost: 50,
                cooldown: 10,
                damage: 0,
                type: 'utility',
                statusEffects: [{ type: 'resurrection', duration: 10, chance: 1.0 }]
            },
            holy_light: {
                name: 'Holy Light',
                description: 'Damage undead and heal living',
                icon: '☀️',
                manaCost: 35,
                cooldown: 4,
                damage: 50, // vs undead
                healing: 25, // to self
                type: 'magic',
                scalingFactor: 1.8
            },
            sanctuary: {
                name: 'Sanctuary',
                description: 'Create a healing zone',
                icon: '⛪',
                manaCost: 45,
                cooldown: 7,
                damage: 0,
                healing: 15,
                type: 'magic',
                statusEffects: [{ type: 'regeneration', duration: 5, chance: 1.0 }]
            }
        };

        // Faction bonuses
        this.factionBonuses = {
            order: {
                name: 'Order of Light',
                description: 'Bonus healing and defense',
                bonuses: {
                    healingBonus: 1.2,
                    defenseBonus: 1.15,
                    lightDamageBonus: 1.3
                },
                skills: ['divine_protection', 'light_beam']
            },
            shadow: {
                name: 'Shadow Guild',
                description: 'Bonus critical hits and stealth',
                bonuses: {
                    criticalBonus: 1.5,
                    stealthBonus: 1.3,
                    darkDamageBonus: 1.25
                },
                skills: ['shadow_strike', 'darkness']
            },
            nature: {
                name: 'Nature\'s Circle',
                description: 'Bonus resources and regeneration',
                bonuses: {
                    resourceBonus: 1.4,
                    regenerationBonus: 1.3,
                    natureDamageBonus: 1.2
                },
                skills: ['nature_blessing', 'thorn_armor']
            }
        };

        console.log('👥 Entities system initialized');
    }

    /**
     * Initialize with game engine reference
     */
    init(gameEngine) {
        this.gameEngine = gameEngine;
        console.log('👥 Entities system connected to engine');
    }

    /**
     * Create a new character
     */
    createCharacter(className, factionName) {
        const classTemplate = this.classTemplates[className];
        if (!classTemplate) {
            throw new Error(`Unknown class: ${className}`);
        }

        const character = {
            name: classTemplate.name,
            className: className,
            faction: factionName,
            level: 1,
            experience: 0,
            experienceToNext: 100,

            // Base stats (will be modified by equipment/buffs)
            baseStats: { ...classTemplate.baseStats },
            
            // Current effective stats
            strength: classTemplate.baseStats.strength,
            agility: classTemplate.baseStats.agility,
            intelligence: classTemplate.baseStats.intelligence,
            vitality: classTemplate.baseStats.vitality,

            // Derived stats
            maxHealth: classTemplate.baseHealth + (classTemplate.baseStats.vitality * 5),
            maxMana: classTemplate.baseMana + (classTemplate.baseStats.intelligence * 3),
            attack: classTemplate.baseStats.strength,
            defense: Math.floor(classTemplate.baseStats.vitality * 0.8),
            speed: classTemplate.baseStats.agility,

            // Current resources
            hp: 0, // Will be set to max after creation
            mana: 0, // Will be set to max after creation

            // Skills
            skills: this.createCharacterSkills(className),
            
            // Equipment and inventory (for future expansion)
            equipment: {},
            
            // Status effects
            statusEffects: new Map(),

            // Growth rates for leveling
            growthRates: { ...classTemplate.growthRates }
        };

        // Set current HP/MP to max
        character.hp = character.maxHealth;
        character.mana = character.maxMana;

        // Apply faction bonuses
        this.applyFactionBonuses(character, factionName);

        console.log(`👤 Created ${className} character: ${character.name}`);
        return character;
    }

    /**
     * Create skills for character class
     */
    createCharacterSkills(className) {
        const classTemplate = this.classTemplates[className];
        const skills = [];

        classTemplate.skills.forEach(skillName => {
            const skillTemplate = this.skillTemplates[skillName];
            if (skillTemplate) {
                skills.push({
                    ...skillTemplate,
                    currentCooldown: 0,
                    level: 1,
                    unlocked: true
                });
            }
        });

        return skills;
    }

    /**
     * Apply faction bonuses to character
     */
    applyFactionBonuses(character, factionName) {
        const faction = this.factionBonuses[factionName];
        if (!faction) return;

        character.factionBonuses = faction.bonuses;
        
        // Apply immediate bonuses
        if (faction.bonuses.defenseBonus) {
            character.defense = Math.floor(character.defense * faction.bonuses.defenseBonus);
        }

        console.log(`✨ Applied ${faction.name} bonuses to character`);
    }

    /**
     * Add experience to character and handle level up
     */
    addExperienceToCharacter(character, experience) {
        character.experience += experience;

        while (character.experience >= character.experienceToNext) {
            this.levelUpCharacter(character);
        }
    }

    /**
     * Level up character
     */
    levelUpCharacter(character) {
        const oldLevel = character.level;
        character.level++;
        character.experience -= character.experienceToNext;
        character.experienceToNext = Math.floor(character.experienceToNext * 1.2);

        // Increase stats based on growth rates
        Object.keys(character.growthRates).forEach(stat => {
            const increase = Math.floor(character.growthRates[stat] + Math.random());
            character.baseStats[stat] += increase;
            character[stat] += increase;
        });

        // Increase health and mana
        const classTemplate = this.classTemplates[character.className];
        const healthIncrease = classTemplate.healthPerLevel + Math.floor(character.vitality * 0.5);
        const manaIncrease = classTemplate.manaPerLevel + Math.floor(character.intelligence * 0.3);

        character.maxHealth += healthIncrease;
        character.maxMana += manaIncrease;
        character.hp += healthIncrease; // Level up heals
        character.mana += manaIncrease;

        // Recalculate derived stats
        this.recalculateCharacterStats(character);

        console.log(`📈 ${character.name} leveled up! ${oldLevel} → ${character.level}`);
        
        // Unlock new skills at certain levels
        this.checkSkillUnlocks(character);

        return {
            oldLevel,
            newLevel: character.level,
            statGains: {
                health: healthIncrease,
                mana: manaIncrease
            }
        };
    }

    /**
     * Check and unlock new skills
     */
    checkSkillUnlocks(character) {
        character.skills.forEach(skill => {
            if (!skill.unlocked) {
                const requiredLevel = skill.requiredLevel || 1;
                if (character.level >= requiredLevel) {
                    skill.unlocked = true;
                    console.log(`🆕 ${character.name} unlocked skill: ${skill.name}`);
                }
            }
        });
    }

    /**
     * Recalculate all character stats
     */
    recalculateCharacterStats(character) {
        character.attack = character.strength + Math.floor(character.level * 0.5);
        character.defense = Math.floor(character.vitality * 0.8) + Math.floor(character.level * 0.3);
        character.speed = character.agility + Math.floor(character.level * 0.2);

        // Apply faction bonuses
        if (character.factionBonuses) {
            if (character.factionBonuses.defenseBonus) {
                character.defense = Math.floor(character.defense * character.factionBonuses.defenseBonus);
            }
        }
    }

    /**
     * Heal character
     */
    healCharacter(character, amount) {
        const oldHp = character.hp;
        character.hp = Math.min(character.maxHealth, character.hp + amount);
        return character.hp - oldHp; // Actual healing done
    }

    /**
     * Restore character mana
     */
    restoreMana(character, amount) {
        const oldMp = character.mana;
        character.mana = Math.min(character.maxMana, character.mana + amount);
        return character.mana - oldMp; // Actual mana restored
    }

    /**
     * Scale boss for difficulty
     */
    scaleBoss(boss, difficulty) {
        const scaledBoss = { ...boss };
        
        scaledBoss.hp = Math.floor(boss.hp * difficulty);
        scaledBoss.maxHp = scaledBoss.hp;
        scaledBoss.attack = Math.floor(boss.attack * difficulty);
        scaledBoss.defense = Math.floor(boss.defense * difficulty);
        scaledBoss.level = Math.max(boss.level, Math.floor(difficulty * 5));

        // Bosses get extra abilities at higher difficulties
        if (difficulty > 1.5) {
            scaledBoss.abilities = [...(boss.abilities || []), 'enraged'];
        }

        console.log(`👹 Scaled ${boss.name} for difficulty ${difficulty.toFixed(2)}`);
        return scaledBoss;
    }

    /**
     * Get character info summary
     */
    getCharacterInfo(character) {
        return {
            name: character.name,
            className: character.className,
            faction: character.faction,
            level: character.level,
            hp: character.hp,
            maxHp: character.maxHealth,
            mp: character.mana,
            maxMp: character.maxMana,
            stats: {
                strength: character.strength,
                agility: character.agility,
                intelligence: character.intelligence,
                vitality: character.vitality,
                attack: character.attack,
                defense: character.defense,
                speed: character.speed
            },
            experience: character.experience,
            experienceToNext: character.experienceToNext,
            skills: character.skills.filter(skill => skill.unlocked)
        };
    }

    /**
     * Get skill by name
     */
    getSkillByName(skillName) {
        return this.skillTemplates[skillName] || null;
    }

    /**
     * Get class info
     */
    getClassInfo(className) {
        return this.classTemplates[className] || null;
    }

    /**
     * Get faction info
     */
    getFactionInfo(factionName) {
        return this.factionBonuses[factionName] || null;
    }

    /**
     * Utility methods
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}