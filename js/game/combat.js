/**
 * Echoes of Elaria - Combat System
 * Turn-based combat with skills, enemy AI, boss mechanics, and telegraphed attacks
 */

export class Combat {
    constructor() {
        this.gameEngine = null;
        
        // Combat state
        this.isActive = false;
        this.currentTurn = 'player'; // 'player' | 'enemy'
        this.turnCounter = 0;
        this.combatData = null;
        
        // Combat participants
        this.player = null;
        this.enemy = null;
        
        // Combat options and flags
        this.combatOptions = {
            isBoss: false,
            allowFlee: true,
            timeLimit: null
        };
        
        // Status effects system
        this.statusEffects = {
            // Buffs
            strength_boost: { duration: 3, effect: { attack: 1.2 } },
            defense_boost: { duration: 3, effect: { defense: 1.3 } },
            speed_boost: { duration: 2, effect: { speed: 1.5 } },
            regeneration: { duration: 5, effect: { healPerTurn: 0.1 } },
            
            // Debuffs
            poison: { duration: 4, effect: { damagePerTurn: 0.08 } },
            weakness: { duration: 3, effect: { attack: 0.7 } },
            slow: { duration: 2, effect: { speed: 0.6 } },
            curse: { duration: 4, effect: { allStats: 0.8 } },
            
            // Special
            stunned: { duration: 1, effect: { skipTurn: true } },
            bleeding: { duration: 3, effect: { damagePerTurn: 0.05 } },
            burning: { duration: 2, effect: { damagePerTurn: 0.12 } },
            frozen: { duration: 1, effect: { skipTurn: true, defense: 0.5 } }
        };
        
        // Boss phase system
        this.bossPhases = {
            forest_guardian: {
                phases: [
                    { hpThreshold: 0.75, abilities: ['nature_heal'], message: 'The Forest Guardian calls upon nature!' },
                    { hpThreshold: 0.5, abilities: ['root_entangle'], message: 'Roots burst from the ground!' },
                    { hpThreshold: 0.25, abilities: ['forest_fury'], message: 'The Guardian enters a primal rage!' }
                ]
            },
            sand_dragon: {
                phases: [
                    { hpThreshold: 0.66, abilities: ['sand_breath'], message: 'The dragon inhales deeply...' },
                    { hpThreshold: 0.33, abilities: ['dune_dive'], message: 'The dragon burrows into the sand!' },
                    { hpThreshold: 0.1, abilities: ['desert_rage'], message: 'The dragon unleashes its final fury!' }
                ]
            },
            ice_queen: {
                phases: [
                    { hpThreshold: 0.8, abilities: ['frost_armor'], message: 'Ice crystals form around the Queen!' },
                    { hpThreshold: 0.6, abilities: ['ice_storm'], message: 'The Queen summons a freezing storm!' },
                    { hpThreshold: 0.4, abilities: ['frozen_heart'], message: 'The Queen\'s heart turns to ice!' },
                    { hpThreshold: 0.2, abilities: ['absolute_zero'], message: 'The temperature drops to absolute zero!' }
                ]
            }
        };
        
        // Enemy AI patterns
        this.aiPatterns = {
            aggressive: {
                priorities: ['attack', 'special', 'buff'],
                weights: [0.6, 0.3, 0.1]
            },
            defensive: {
                priorities: ['defend', 'attack', 'heal'],
                weights: [0.4, 0.4, 0.2]
            },
            tactical: {
                priorities: ['debuff', 'attack', 'special'],
                weights: [0.3, 0.4, 0.3]
            },
            berserker: {
                priorities: ['attack', 'attack', 'special'],
                weights: [0.5, 0.3, 0.2]
            }
        };
        
        console.log('⚔️ Combat system initialized');
    }

    /**
     * Initialize with game engine reference
     */
    init(gameEngine) {
        this.gameEngine = gameEngine;
        console.log('⚔️ Combat system connected to engine');
    }

    /**
     * Start a combat encounter
     */
    async startCombat(player, enemy, options = {}) {
        console.log(`⚔️ Starting combat: ${player.name} vs ${enemy.name}`);
        
        try {
            // Set up combat state
            this.player = this.cloneEntity(player);
            this.enemy = this.cloneEntity(enemy);
            this.combatOptions = { ...this.combatOptions, ...options };
            this.isActive = true;
            this.currentTurn = 'player';
            this.turnCounter = 1;
            
            // Initialize status effects
            this.player.statusEffects = new Map();
            this.enemy.statusEffects = new Map();
            
            // Initialize boss data if needed
            if (this.combatOptions.isBoss) {
                this.initializeBoss();
            }
            
            // Set up UI
            this.gameEngine.ui.initializeCombat(this.player, this.enemy, this.combatOptions);
            this.gameEngine.ui.showCombatView();
            
            // Log combat start
            this.logMessage(`Combat begins! ${this.player.name} faces ${this.enemy.name}!`, 'info');
            
            // Determine first turn based on speed
            if (this.enemy.speed > this.player.speed) {
                this.currentTurn = 'enemy';
                this.logMessage(`${this.enemy.name} is faster and goes first!`, 'info');
                setTimeout(() => this.executeEnemyTurn(), 1000);
            } else {
                this.logMessage(`${this.player.name} goes first!`, 'info');
            }
            
            // Update combat UI
            this.updateCombatUI();
            
            return new Promise((resolve) => {
                this.combatResolve = resolve;
            });
            
        } catch (error) {
            console.error('❌ Error starting combat:', error);
            throw error;
        }
    }

    /**
     * Initialize boss-specific mechanics
     */
    initializeBoss() {
        const bossType = this.enemy.type;
        const bossData = this.bossPhases[bossType];
        
        if (bossData) {
            this.enemy.bossData = {
                ...bossData,
                currentPhase: 0,
                triggeredPhases: new Set()
            };
        }
        
        // Bosses get additional resistance and abilities
        this.enemy.statusResistance = 0.5; // 50% resistance to status effects
        this.enemy.criticalResistance = 0.3; // 30% resistance to critical hits
    }

    /**
     * Execute player's skill
     */
    async useSkill(skillIndex) {
        if (!this.isActive || this.currentTurn !== 'player') {
            console.warn('⚠️ Not player\'s turn');
            return false;
        }
        
        const skill = this.player.skills[skillIndex];
        if (!skill || !this.canUseSkill(skill)) {
            console.warn('⚠️ Cannot use skill');
            return false;
        }
        
        console.log(`🎯 Player uses ${skill.name}`);
        
        try {
            // Execute the skill
            const result = await this.executeSkill(this.player, this.enemy, skill);
            
            // Apply skill results
            this.applySkillResult(result);
            
            // End player turn
            this.endPlayerTurn();
            
            return true;
            
        } catch (error) {
            console.error('❌ Error using skill:', error);
            return false;
        }
    }

    /**
     * Check if skill can be used
     */
    canUseSkill(skill) {
        // Check mana cost
        if (this.player.mana < skill.manaCost) {
            this.logMessage(`Not enough mana! (Need ${skill.manaCost}, have ${this.player.mana})`, 'warning');
            return false;
        }
        
        // Check cooldown
        if (skill.currentCooldown > 0) {
            this.logMessage(`${skill.name} is on cooldown! (${skill.currentCooldown} turns)`, 'warning');
            return false;
        }
        
        // Check status effects
        if (this.player.statusEffects.has('stunned') || this.player.statusEffects.has('frozen')) {
            this.logMessage('You are unable to act!', 'warning');
            return false;
        }
        
        return true;
    }

    /**
     * Execute a skill
     */
    async executeSkill(caster, target, skill) {
        const result = {
            skill: skill,
            caster: caster,
            target: target,
            damage: 0,
            healing: 0,
            statusEffects: [],
            critical: false,
            hit: true,
            message: ''
        };
        
        // Calculate base damage
        if (skill.damage > 0) {
            result.damage = this.calculateDamage(caster, target, skill);
            result.critical = this.checkCritical(caster, skill);
            result.hit = this.checkHit(caster, target, skill);
            
            if (result.critical) {
                result.damage *= skill.criticalMultiplier || 2.0;
                result.message += ' Critical hit!';
            }
            
            if (!result.hit) {
                result.damage = 0;
                result.message = 'Miss!';
            }
        }
        
        // Calculate healing
        if (skill.healing > 0) {
            result.healing = this.calculateHealing(caster, skill);
        }
        
        // Apply status effects
        if (skill.statusEffects && skill.statusEffects.length > 0) {
            skill.statusEffects.forEach(effect => {
                if (Math.random() < effect.chance) {
                    result.statusEffects.push(effect);
                }
            });
        }
        
        // Special skill effects
        await this.applySpecialSkillEffects(skill, result);
        
        return result;
    }

    /**
     * Apply skill result to combat
     */
    applySkillResult(result) {
        const { skill, caster, target, damage, healing, statusEffects, critical, hit } = result;
        
        // Apply damage
        if (damage > 0 && hit) {
            this.dealDamage(target, damage);
            this.logMessage(
                `${skill.name} deals ${damage} damage to ${target.name}${critical ? ' (Critical!)' : ''}!`,
                'damage'
            );
            
            // Visual feedback
            this.gameEngine.ui.showDamageEffect(target, damage, critical);
        } else if (!hit) {
            this.logMessage(`${skill.name} misses ${target.name}!`, 'info');
        }
        
        // Apply healing
        if (healing > 0) {
            this.healEntity(caster, healing);
            this.logMessage(`${skill.name} heals ${caster.name} for ${healing} HP!`, 'heal');
            this.gameEngine.ui.showHealEffect(caster, healing);
        }
        
        // Apply status effects
        statusEffects.forEach(effect => {
            this.applyStatusEffect(target, effect.type, effect.duration);
        });
        
        // Consume mana and set cooldown
        caster.mana -= skill.manaCost;
        skill.currentCooldown = skill.cooldown;
    }

    /**
     * Apply special skill effects (telegraphed attacks, area effects, etc.)
     */
    async applySpecialSkillEffects(skill, result) {
        switch (skill.name.toLowerCase()) {
            case 'charge':
                // Telegraphed attack - enemy can see it coming
                if (result.caster === this.enemy) {
                    this.logMessage(`${this.enemy.name} prepares a devastating charge!`, 'warning');
                    this.gameEngine.ui.showTelegraphWarning('charge', 2000);
                    await this.delay(2000);
                }
                break;
                
            case 'fireball':
                // Area effect - can't be fully dodged
                result.hit = true; // Fireball always hits (area effect)
                if (Math.random() < 0.3) {
                    result.statusEffects.push({ type: 'burning', duration: 2 });
                }
                break;
                
            case 'ice_storm':
                // Boss ability - affects entire battlefield
                if (result.caster === this.enemy && this.enemy.isBoss) {
                    this.logMessage('An ice storm engulfs the battlefield!', 'warning');
                    if (Math.random() < 0.4) {
                        result.statusEffects.push({ type: 'frozen', duration: 1 });
                    }
                }
                break;
                
            case 'shadow_step':
                // Teleport attack - very hard to dodge
                result.hit = true;
                this.logMessage(`${result.caster.name} vanishes into shadow!`, 'info');
                break;
        }
    }

    /**
     * Calculate damage
     */
    calculateDamage(attacker, defender, skill) {
        const baseDamage = skill.damage;
        const attackStat = this.getRelevantAttackStat(attacker, skill);
        const defenseStat = defender.defense;
        
        // Base damage calculation
        let damage = baseDamage + (attackStat * skill.scalingFactor);
        
        // Apply defense
        const damageReduction = defenseStat / (defenseStat + 100);
        damage *= (1 - damageReduction);
        
        // Apply random variance (±15%)
        const variance = 0.85 + (Math.random() * 0.3);
        damage *= variance;
        
        // Apply status effect modifiers
        if (attacker.statusEffects.has('strength_boost')) {
            damage *= 1.2;
        }
        if (attacker.statusEffects.has('weakness')) {
            damage *= 0.7;
        }
        if (defender.statusEffects.has('defense_boost')) {
            damage *= 0.7;
        }
        
        return Math.max(1, Math.floor(damage));
    }

    /**
     * Get relevant attack stat for skill
     */
    getRelevantAttackStat(entity, skill) {
        switch (skill.type) {
            case 'physical': return entity.strength;
            case 'magic': return entity.intelligence;
            case 'ranged': return entity.agility;
            default: return entity.attack || entity.strength;
        }
    }

    /**
     * Calculate healing
     */
    calculateHealing(caster, skill) {
        const baseHealing = skill.healing;
        const relevantStat = skill.type === 'magic' ? caster.intelligence : caster.vitality;
        
        let healing = baseHealing + (relevantStat * skill.scalingFactor);
        
        // Apply status effects
        if (caster.statusEffects.has('blessed')) {
            healing *= 1.3;
        }
        if (caster.statusEffects.has('curse')) {
            healing *= 0.7;
        }
        
        return Math.floor(healing);
    }

    /**
     * Check for critical hit
     */
    checkCritical(attacker, skill) {
        let critChance = skill.criticalChance || 0.1;
        
        // Agility affects crit chance
        critChance += attacker.agility * 0.001;
        
        // Status effects
        if (attacker.statusEffects.has('focused')) {
            critChance *= 1.5;
        }
        
        return Math.random() < critChance;
    }

    /**
     * Check if attack hits
     */
    checkHit(attacker, defender, skill) {
        let hitChance = skill.accuracy || 0.9;
        
        // Speed affects hit/dodge chance
        const speedDiff = attacker.speed - defender.speed;
        hitChance += speedDiff * 0.01;
        
        // Status effects
        if (defender.statusEffects.has('blinded')) {
            hitChance *= 1.3;
        }
        if (defender.statusEffects.has('speed_boost')) {
            hitChance *= 0.8;
        }
        
        return Math.random() < Math.max(0.1, Math.min(0.95, hitChance));
    }

    /**
     * Deal damage to entity
     */
    dealDamage(target, damage) {
        target.hp = Math.max(0, target.hp - damage);
        
        // Check for death
        if (target.hp <= 0) {
            this.logMessage(`${target.name} is defeated!`, 'info');
            
            if (target === this.player) {
                this.endCombat(false, 'Player defeated');
            } else {
                this.endCombat(true, 'Enemy defeated');
            }
        }
        
        // Check boss phase transitions
        if (target.isBoss && target.bossData) {
            this.checkBossPhaseTransition(target);
        }
    }

    /**
     * Heal entity
     */
    healEntity(target, healing) {
        const actualHealing = Math.min(healing, target.maxHp - target.hp);
        target.hp += actualHealing;
        return actualHealing;
    }

    /**
     * Apply status effect
     */
    applyStatusEffect(target, effectType, duration) {
        const resistance = target.statusResistance || 0;
        
        if (Math.random() < resistance) {
            this.logMessage(`${target.name} resists ${effectType}!`, 'info');
            return;
        }
        
        target.statusEffects.set(effectType, {
            ...this.statusEffects[effectType],
            duration: duration
        });
        
        this.logMessage(`${target.name} is affected by ${effectType}!`, 'warning');
    }

    /**
     * End player turn
     */
    endPlayerTurn() {
        // Process player status effects
        this.processStatusEffects(this.player);
        
        // Reduce skill cooldowns
        this.updateCooldowns(this.player);
        
        // Switch to enemy turn
        this.currentTurn = 'enemy';
        this.updateCombatUI();
        
        // Execute enemy turn after short delay
        setTimeout(() => {
            if (this.isActive) {
                this.executeEnemyTurn();
            }
        }, 1500);
    }

    /**
     * Execute enemy turn with AI
     */
    async executeEnemyTurn() {
        if (!this.isActive || this.currentTurn !== 'enemy') {
            return;
        }
        
        console.log(`🤖 Enemy turn: ${this.enemy.name}`);
        
        try {
            // Check if enemy can act
            if (this.enemy.statusEffects.has('stunned') || this.enemy.statusEffects.has('frozen')) {
                this.logMessage(`${this.enemy.name} is unable to act!`, 'info');
                this.endEnemyTurn();
                return;
            }
            
            // Choose action based on AI
            const action = this.chooseEnemyAction();
            
            // Execute the action
            await this.executeEnemyAction(action);
            
            // End enemy turn
            this.endEnemyTurn();
            
        } catch (error) {
            console.error('❌ Error in enemy turn:', error);
            this.endEnemyTurn();
        }
    }

    /**
     * Choose enemy action using AI
     */
    chooseEnemyAction() {
        const enemy = this.enemy;
        const player = this.player;
        
        // Boss AI - check for phase abilities first
        if (enemy.isBoss && enemy.bossData) {
            const phaseAction = this.checkBossPhaseAction();
            if (phaseAction) {
                return phaseAction;
            }
        }
        
        // Determine AI pattern based on enemy type
        let aiPattern = this.aiPatterns.aggressive; // Default
        
        if (enemy.type.includes('giant') || enemy.type.includes('tank')) {
            aiPattern = this.aiPatterns.defensive;
        } else if (enemy.type.includes('mage') || enemy.type.includes('lich')) {
            aiPattern = this.aiPatterns.tactical;
        } else if (enemy.type.includes('berserker') || enemy.hp < enemy.maxHp * 0.3) {
            aiPattern = this.aiPatterns.berserker;
        }
        
        // Choose action based on pattern
        const random = Math.random();
        let cumulativeWeight = 0;
        
        for (let i = 0; i < aiPattern.priorities.length; i++) {
            cumulativeWeight += aiPattern.weights[i];
            if (random < cumulativeWeight) {
                return this.getEnemyActionOfType(aiPattern.priorities[i]);
            }
        }
        
        // Fallback to basic attack
        return { type: 'attack', skill: this.getEnemyBasicAttack() };
    }

    /**
     * Get enemy action of specific type
     */
    getEnemyActionOfType(actionType) {
        switch (actionType) {
            case 'attack':
                return { type: 'attack', skill: this.getEnemyBasicAttack() };
                
            case 'special':
                const specialSkill = this.getEnemySpecialSkill();
                return specialSkill ? { type: 'special', skill: specialSkill } : { type: 'attack', skill: this.getEnemyBasicAttack() };
                
            case 'defend':
                return { type: 'defend' };
                
            case 'heal':
                if (this.enemy.hp < this.enemy.maxHp * 0.5 && this.enemyCanHeal()) {
                    return { type: 'heal' };
                }
                return { type: 'attack', skill: this.getEnemyBasicAttack() };
                
            case 'buff':
                const buffSkill = this.getEnemyBuffSkill();
                return buffSkill ? { type: 'buff', skill: buffSkill } : { type: 'attack', skill: this.getEnemyBasicAttack() };
                
            case 'debuff':
                const debuffSkill = this.getEnemyDebuffSkill();
                return debuffSkill ? { type: 'debuff', skill: debuffSkill } : { type: 'attack', skill: this.getEnemyBasicAttack() };
                
            default:
                return { type: 'attack', skill: this.getEnemyBasicAttack() };
        }
    }

    /**
     * Get enemy's basic attack
     */
    getEnemyBasicAttack() {
        return {
            name: 'Attack',
            damage: this.enemy.attack || 10,
            manaCost: 0,
            cooldown: 0,
            currentCooldown: 0,
            type: 'physical',
            scalingFactor: 0.1,
            criticalChance: 0.1,
            accuracy: 0.9
        };
    }

    /**
     * Execute enemy action
     */
    async executeEnemyAction(action) {
        switch (action.type) {
            case 'attack':
            case 'special':
            case 'buff':
            case 'debuff':
                const result = await this.executeSkill(this.enemy, this.player, action.skill);
                this.applySkillResult(result);
                break;
                
            case 'defend':
                this.applyStatusEffect(this.enemy, 'defense_boost', 1);
                this.logMessage(`${this.enemy.name} takes a defensive stance!`, 'info');
                break;
                
            case 'heal':
                const healAmount = Math.floor(this.enemy.maxHp * 0.2);
                this.healEntity(this.enemy, healAmount);
                this.logMessage(`${this.enemy.name} heals for ${healAmount} HP!`, 'heal');
                break;
        }
    }

    /**
     * End enemy turn
     */
    endEnemyTurn() {
        // Process enemy status effects
        this.processStatusEffects(this.enemy);
        
        // Reduce skill cooldowns
        this.updateCooldowns(this.enemy);
        
        // Switch to player turn
        this.currentTurn = 'player';
        this.turnCounter++;
        
        // Update UI
        this.updateCombatUI();
        
        this.logMessage(`Turn ${this.turnCounter} - Your turn!`, 'info');
    }

    /**
     * Process status effects for entity
     */
    processStatusEffects(entity) {
        const expiredEffects = [];
        
        entity.statusEffects.forEach((effect, type) => {
            // Apply effect
            this.applyStatusEffectTick(entity, type, effect);
            
            // Reduce duration
            effect.duration--;
            
            // Mark for removal if expired
            if (effect.duration <= 0) {
                expiredEffects.push(type);
            }
        });
        
        // Remove expired effects
        expiredEffects.forEach(type => {
            entity.statusEffects.delete(type);
            this.logMessage(`${entity.name} recovers from ${type}.`, 'info');
        });
    }

    /**
     * Apply status effect tick
     */
    applyStatusEffectTick(entity, effectType, effect) {
        const template = this.statusEffects[effectType];
        if (!template || !template.effect) return;
        
        const effectData = template.effect;
        
        // Damage over time
        if (effectData.damagePerTurn) {
            const damage = Math.floor(entity.maxHp * effectData.damagePerTurn);
            this.dealDamage(entity, damage);
            this.logMessage(`${entity.name} takes ${damage} ${effectType} damage!`, 'damage');
        }
        
        // Healing over time
        if (effectData.healPerTurn) {
            const healing = Math.floor(entity.maxHp * effectData.healPerTurn);
            this.healEntity(entity, healing);
            this.logMessage(`${entity.name} heals ${healing} HP from ${effectType}!`, 'heal');
        }
    }

    /**
     * Update skill cooldowns
     */
    updateCooldowns(entity) {
        if (entity.skills) {
            entity.skills.forEach(skill => {
                if (skill.currentCooldown > 0) {
                    skill.currentCooldown--;
                }
            });
        }
    }

    /**
     * Check boss phase transition
     */
    checkBossPhaseTransition(boss) {
        if (!boss.bossData || !boss.bossData.phases) return;
        
        const currentHpPercent = boss.hp / boss.maxHp;
        const phases = boss.bossData.phases;
        
        for (let i = boss.bossData.currentPhase; i < phases.length; i++) {
            const phase = phases[i];
            
            if (currentHpPercent <= phase.hpThreshold && !boss.bossData.triggeredPhases.has(i)) {
                boss.bossData.triggeredPhases.add(i);
                boss.bossData.currentPhase = i + 1;
                
                this.logMessage(phase.message, 'warning');
                this.gameEngine.ui.showBossPhaseTransition(phase.message);
                
                // Add phase abilities
                if (phase.abilities) {
                    boss.phaseAbilities = [...(boss.phaseAbilities || []), ...phase.abilities];
                }
                
                break;
            }
        }
    }

    /**
     * Check for boss phase action
     */
    checkBossPhaseAction() {
        if (!this.enemy.phaseAbilities || this.enemy.phaseAbilities.length === 0) {
            return null;
        }
        
        // 30% chance to use phase ability
        if (Math.random() < 0.3) {
            const abilityName = this.randomChoice(this.enemy.phaseAbilities);
            const skill = this.getBossSkill(abilityName);
            if (skill) {
                return { type: 'special', skill: skill };
            }
        }
        
        return null;
    }

    /**
     * Get boss skill by name
     */
    getBossSkill(skillName) {
        const bossSkills = {
            nature_heal: {
                name: 'Nature\'s Blessing',
                healing: 50,
                manaCost: 0,
                cooldown: 3,
                currentCooldown: 0,
                type: 'magic',
                scalingFactor: 0.5
            },
            root_entangle: {
                name: 'Root Entangle',
                damage: 25,
                statusEffects: [{ type: 'stunned', duration: 1, chance: 0.8 }],
                manaCost: 0,
                cooldown: 4,
                currentCooldown: 0,
                type: 'nature'
            },
            ice_storm: {
                name: 'Ice Storm',
                damage: 40,
                statusEffects: [{ type: 'frozen', duration: 1, chance: 0.4 }],
                manaCost: 0,
                cooldown: 5,
                currentCooldown: 0,
                type: 'magic'
            }
        };
        
        return bossSkills[skillName] || null;
    }

    /**
     * Attempt to flee from combat
     */
    attemptFlee() {
        if (!this.combatOptions.allowFlee) {
            this.logMessage('You cannot flee from this battle!', 'warning');
            return false;
        }
        
        const fleeChance = 0.7; // Base 70% chance
        
        if (Math.random() < fleeChance) {
            this.logMessage('You successfully flee from combat!', 'info');
            this.endCombat(false, 'Player fled');
            return true;
        } else {
            this.logMessage('Failed to flee!', 'warning');
            // Fleeing takes your turn
            this.endPlayerTurn();
            return false;
        }
    }

    /**
     * End combat
     */
    endCombat(victory, reason) {
        console.log(`🏁 Combat ended: ${victory ? 'Victory' : 'Defeat'} (${reason})`);
        
        this.isActive = false;
        
        // Calculate combat results
        const results = {
            victory: victory,
            reason: reason,
            enemy: this.cloneEntity(this.enemy),
            player: this.cloneEntity(this.player),
            turnCount: this.turnCounter,
            damageDealt: 0, // TODO: Track damage dealt
            damageTaken: 0  // TODO: Track damage taken
        };
        
        if (victory) {
            // Calculate experience and rewards
            results.experience = this.calculateExperienceGain();
            results.rewards = this.calculateCombatRewards();
            
            this.logMessage(`Victory! Gained ${results.experience} experience!`, 'success');
        }
        
        // Clean up combat state
        this.cleanup();
        
        // Resolve the combat promise
        if (this.combatResolve) {
            this.combatResolve(results);
            this.combatResolve = null;
        }
    }

    /**
     * Calculate experience gain from combat
     */
    calculateExperienceGain() {
        const baseExp = this.enemy.level * 10;
        const difficultyBonus = Math.floor(baseExp * (this.enemy.difficulty || 1.0));
        const bossBonus = this.enemy.isBoss ? baseExp : 0;
        
        return baseExp + difficultyBonus + bossBonus;
    }

    /**
     * Calculate combat rewards
     */
    calculateCombatRewards() {
        const rewards = {
            items: [],
            resources: {}
        };
        
        // Basic gold reward
        const goldAmount = this.randomInt(5, 15) + this.enemy.level;
        rewards.resources.gold = goldAmount;
        
        // Chance for item drops
        const dropChance = this.enemy.isBoss ? 0.8 : 0.3;
        if (Math.random() < dropChance) {
            rewards.items.push(this.generateRandomItem());
        }
        
        // Boss-specific rewards
        if (this.enemy.isBoss) {
            rewards.items.push(this.generateBossItem());
            rewards.resources.essences = this.randomInt(2, 5);
        }
        
        return rewards;
    }

    /**
     * Generate random item drop
     */
    generateRandomItem() {
        const itemTypes = ['health_potion', 'mana_potion', 'strength_elixir'];
        const randomType = this.randomChoice(itemTypes);
        
        return {
            name: randomType.replace('_', ' '),
            type: 'consumable',
            description: 'A useful consumable item'
        };
    }

    /**
     * Generate boss-specific item
     */
    generateBossItem() {
        return {
            name: `${this.enemy.name}'s Trophy`,
            type: 'trophy',
            description: `A trophy proving your victory over ${this.enemy.name}`
        };
    }

    /**
     * Update combat UI
     */
    updateCombatUI() {
        if (!this.gameEngine || !this.gameEngine.ui) return;
        
        this.gameEngine.ui.updateCombatInfo({
            player: this.player,
            enemy: this.enemy,
            currentTurn: this.currentTurn,
            turnCounter: this.turnCounter
        });
    }

    /**
     * Log combat message
     */
    logMessage(message, type = 'info') {
        console.log(`💬 ${message}`);
        
        if (this.gameEngine && this.gameEngine.ui) {
            this.gameEngine.ui.addCombatLogMessage(message, type);
        }
    }

    /**
     * Clone entity for combat (to avoid modifying original)
     */
    cloneEntity(entity) {
        return JSON.parse(JSON.stringify(entity));
    }

    /**
     * Clean up combat resources
     */
    cleanup() {
        this.player = null;
        this.enemy = null;
        this.combatData = null;
        this.currentTurn = 'player';
        this.turnCounter = 0;
    }

    /**
     * Utility methods for enemy AI
     */
    getEnemySpecialSkill() {
        // TODO: Implement enemy special skills
        return null;
    }

    getEnemyBuffSkill() {
        // TODO: Implement enemy buff skills
        return null;
    }

    getEnemyDebuffSkill() {
        // TODO: Implement enemy debuff skills
        return null;
    }

    enemyCanHeal() {
        // TODO: Check if enemy has healing abilities
        return false;
    }

    /**
     * Utility functions
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current combat state (for external access)
     */
    getCombatState() {
        return {
            isActive: this.isActive,
            currentTurn: this.currentTurn,
            turnCounter: this.turnCounter,
            player: this.player ? { ...this.player } : null,
            enemy: this.enemy ? { ...this.enemy } : null
        };
    }
}