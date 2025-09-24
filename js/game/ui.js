/**
 * Echoes of Elaria - UI Management System
 * Handles all visual updates, screen transitions, and user interactions
 */

export class UI {
    constructor() {
        // Current UI state
        this.currentView = 'map';
        this.isInventoryOpen = false;
        this.combatState = null;
        
        // UI elements cache
        this.elements = {};
        
        // Animation timers
        this.animationTimers = new Map();
        
        // Combat log messages
        this.combatLogMessages = [];
        this.maxCombatLogMessages = 50;
        
        console.log('🎨 UI system initialized');
    }

    /**
     * Initialize UI system and cache elements
     */
    init() {
        this.cacheElements();
        this.setupUIEventListeners();
        console.log('🎨 UI system ready');
    }

    /**
     * Cache frequently used DOM elements
     */
    cacheElements() {
        // Character info elements
        this.elements.charName = document.getElementById('char-name');
        this.elements.charLevel = document.getElementById('char-level');
        this.elements.charClassDisplay = document.getElementById('char-class-display');
        this.elements.combatCharName = document.getElementById('combat-char-name');
        
        // Health and mana bars
        this.elements.playerHpBar = document.getElementById('player-hp-bar');
        this.elements.playerHpText = document.getElementById('player-hp-text');
        this.elements.playerMpBar = document.getElementById('player-mp-bar');
        this.elements.playerMpText = document.getElementById('player-mp-text');
        
        this.elements.enemyHpBar = document.getElementById('enemy-hp-bar');
        this.elements.enemyHpText = document.getElementById('enemy-hp-text');
        this.elements.enemyName = document.getElementById('enemy-name');
        
        // Combat elements
        this.elements.skillButtons = document.getElementById('skill-buttons');
        this.elements.combatLog = document.getElementById('combat-log');
        this.elements.combatTurnIndicator = document.getElementById('combat-turn-indicator');
        this.elements.playerSprite = document.getElementById('player-sprite');
        this.elements.enemySprite = document.getElementById('enemy-sprite');
        
        // Map elements
        this.elements.mapContainer = document.getElementById('map-container');
        this.elements.currentRegion = document.getElementById('current-region');
        
        // Game views
        this.elements.mapView = document.getElementById('map-view');
        this.elements.combatView = document.getElementById('combat-view');
        this.elements.eventView = document.getElementById('event-view');
        this.elements.inventoryView = document.getElementById('inventory-view');
        
        // Event elements
        this.elements.eventTitle = document.getElementById('event-title');
        this.elements.eventDescription = document.getElementById('event-description');
        this.elements.eventImage = document.getElementById('event-image');
        this.elements.eventChoices = document.getElementById('event-choices');
        
        // Inventory elements
        this.elements.inventoryGrid = document.getElementById('inventory-grid');
        this.elements.statStrength = document.getElementById('stat-strength');
        this.elements.statAgility = document.getElementById('stat-agility');
        this.elements.statIntelligence = document.getElementById('stat-intelligence');
        this.elements.statVitality = document.getElementById('stat-vitality');
    }

    /**
     * Set up UI-specific event listeners
     */
    setupUIEventListeners() {
        // Skill button clicks (delegated to parent)
        if (this.elements.skillButtons) {
            this.elements.skillButtons.addEventListener('click', (e) => {
                if (e.target.classList.contains('skill-btn')) {
                    const skillIndex = parseInt(e.target.dataset.skillIndex);
                    this.handleSkillClick(skillIndex);
                }
            });
        }

        // Inventory toggle hotkey
        document.addEventListener('keydown', (e) => {
            if (e.key === 'i' || e.key === 'I') {
                if (this.currentView === 'map') {
                    this.toggleInventory();
                }
            }
        });

        // Map node clicks (delegated)
        if (this.elements.mapContainer) {
            this.elements.mapContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('map-node') || e.target.closest('.map-node')) {
                    const nodeElement = e.target.classList.contains('map-node') ? 
                        e.target : e.target.closest('.map-node');
                    const nodeIndex = parseInt(nodeElement.dataset.nodeIndex);
                    this.handleNodeClick(nodeIndex);
                }
            });
        }
    }

    /**
     * Initialize run UI with character and map data
     */
    initializeRun(runData) {
        this.updateCharacterInfo(runData.character);
        this.updateMapView(runData);
        this.updateResourceDisplay(runData.resources);
        
        console.log('🎨 Run UI initialized');
    }

    /**
     * Update character information display
     */
    updateCharacterInfo(character) {
        if (!character) return;

        // Update character name and level
        if (this.elements.charName) {
            this.elements.charName.textContent = character.name || 'Hero';
        }
        if (this.elements.charLevel) {
            this.elements.charLevel.textContent = character.level || 1;
        }
        if (this.elements.charClassDisplay) {
            this.elements.charClassDisplay.textContent = character.className || 'Adventurer';
        }
        if (this.elements.combatCharName) {
            this.elements.combatCharName.textContent = character.name || 'Hero';
        }

        // Update health and mana bars
        this.updatePlayerHealthMana(character);
        
        // Update stats in inventory view
        this.updateCharacterStats(character);
    }

    /**
     * Update player health and mana displays
     */
    updatePlayerHealthMana(character) {
        const hpPercent = (character.hp / character.maxHealth) * 100;
        const mpPercent = (character.mana / character.maxMana) * 100;

        if (this.elements.playerHpBar) {
            this.elements.playerHpBar.style.width = `${Math.max(0, hpPercent)}%`;
        }
        if (this.elements.playerHpText) {
            this.elements.playerHpText.textContent = `${character.hp}/${character.maxHealth}`;
        }
        if (this.elements.playerMpBar) {
            this.elements.playerMpBar.style.width = `${Math.max(0, mpPercent)}%`;
        }
        if (this.elements.playerMpText) {
            this.elements.playerMpText.textContent = `${character.mana}/${character.maxMana}`;
        }
    }

    /**
     * Update character stats display
     */
    updateCharacterStats(character) {
        if (this.elements.statStrength) {
            this.elements.statStrength.textContent = character.strength || 0;
        }
        if (this.elements.statAgility) {
            this.elements.statAgility.textContent = character.agility || 0;
        }
        if (this.elements.statIntelligence) {
            this.elements.statIntelligence.textContent = character.intelligence || 0;
        }
        if (this.elements.statVitality) {
            this.elements.statVitality.textContent = character.vitality || 0;
        }
    }

    /**
     * Update map view with current run data
     */
    updateMapView(runData) {
        if (!runData || !this.elements.mapContainer) return;

        // Update current region display
        if (this.elements.currentRegion && runData.map) {
            const currentNode = runData.map.nodes[runData.currentNodeIndex];
            if (currentNode) {
                this.elements.currentRegion.textContent = currentNode.regionKey || 'Unknown';
            }
        }

        // Clear existing nodes
        this.elements.mapContainer.innerHTML = '';

        // Generate node elements
        if (runData.map && runData.map.nodes) {
            runData.map.nodes.forEach((node, index) => {
                const nodeElement = this.createMapNodeElement(node, index, runData.currentNodeIndex);
                this.elements.mapContainer.appendChild(nodeElement);
            });
        }
    }

    /**
     * Create a map node element
     */
    createMapNodeElement(node, index, currentNodeIndex) {
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'map-node';
        nodeDiv.dataset.nodeIndex = index;

        // Add state classes
        if (index < currentNodeIndex) {
            nodeDiv.classList.add('completed');
        } else if (index === currentNodeIndex) {
            nodeDiv.classList.add('current');
        }

        // Create node content
        nodeDiv.innerHTML = `
            <div class="node-icon">${node.icon || '❓'}</div>
            <div class="node-info">
                <h3>${node.name || 'Unknown'}</h3>
                <p>${node.description || 'A mysterious location'}</p>
                ${index === currentNodeIndex ? '<span class="node-status">Current</span>' : ''}
                ${node.completed ? '<span class="node-status completed">Completed</span>' : ''}
            </div>
        `;

        return nodeDiv;
    }

    /**
     * Update resource display
     */
    updateResourceDisplay(resources) {
        // TODO: Implement resource display in UI
        // This would show gold, ore, herbs, essences, etc.
    }

    /**
     * Show different game views
     */
    showMapView() {
        this.hideAllGameViews();
        if (this.elements.mapView) {
            this.elements.mapView.classList.add('active');
        }
        this.currentView = 'map';
    }

    showCombatView() {
        this.hideAllGameViews();
        if (this.elements.combatView) {
            this.elements.combatView.classList.add('active');
        }
        this.currentView = 'combat';
    }

    showEventView() {
        this.hideAllGameViews();
        if (this.elements.eventView) {
            this.elements.eventView.classList.add('active');
        }
        this.currentView = 'event';
    }

    hideAllGameViews() {
        const views = [
            this.elements.mapView,
            this.elements.combatView,
            this.elements.eventView,
            this.elements.inventoryView
        ];

        views.forEach(view => {
            if (view) {
                view.classList.remove('active');
            }
        });
    }

    /**
     * Initialize combat UI
     */
    initializeCombat(player, enemy, options = {}) {
        this.combatState = { player, enemy, options };
        
        // Update enemy info
        if (this.elements.enemyName) {
            this.elements.enemyName.textContent = enemy.name || 'Enemy';
        }
        
        // Update enemy sprite
        if (this.elements.enemySprite) {
            this.elements.enemySprite.textContent = this.getEnemySprite(enemy);
        }
        
        // Update player sprite
        if (this.elements.playerSprite) {
            this.elements.playerSprite.textContent = this.getPlayerSprite(player);
        }
        
        // Create skill buttons
        this.createSkillButtons(player.skills);
        
        // Clear combat log
        this.combatLogMessages = [];
        this.updateCombatLog();
        
        // Update health bars
        this.updateCombatHealthBars();
    }

    /**
     * Create skill buttons for combat
     */
    createSkillButtons(skills) {
        if (!this.elements.skillButtons || !skills) return;

        this.elements.skillButtons.innerHTML = '';

        skills.filter(skill => skill.unlocked).forEach((skill, index) => {
            const button = document.createElement('button');
            button.className = 'skill-btn';
            button.dataset.skillIndex = index;
            
            // Add cooldown class if needed
            if (skill.currentCooldown > 0) {
                button.classList.add('on-cooldown');
                button.disabled = true;
            }

            button.innerHTML = `
                <div class="skill-icon">${skill.icon || '⚡'}</div>
                <div class="skill-info">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-cost">${skill.manaCost} MP</div>
                    ${skill.currentCooldown > 0 ? `<div class="skill-cooldown">${skill.currentCooldown}</div>` : ''}
                </div>
            `;

            // Add tooltip
            button.title = skill.description;

            this.elements.skillButtons.appendChild(button);
        });
    }

    /**
     * Update combat info (health bars, turn indicator, etc.)
     */
    updateCombatInfo(combatData) {
        if (!combatData) return;

        // Update turn indicator
        if (this.elements.combatTurnIndicator) {
            const turnText = combatData.currentTurn === 'player' ? 'Your Turn' : 'Enemy Turn';
            this.elements.combatTurnIndicator.textContent = turnText;
            
            // Update turn indicator styling
            this.elements.combatTurnIndicator.className = 
                combatData.currentTurn === 'player' ? 'player-turn' : 'enemy-turn';
        }

        // Update health bars
        this.updatePlayerHealthMana(combatData.player);
        this.updateEnemyHealth(combatData.enemy);
        
        // Update skill buttons (cooldowns, mana costs)
        this.updateSkillButtons(combatData.player);
    }

    /**
     * Update enemy health bar
     */
    updateEnemyHealth(enemy) {
        if (!enemy) return;

        const hpPercent = (enemy.hp / enemy.maxHp) * 100;

        if (this.elements.enemyHpBar) {
            this.elements.enemyHpBar.style.width = `${Math.max(0, hpPercent)}%`;
        }
        if (this.elements.enemyHpText) {
            this.elements.enemyHpText.textContent = `${enemy.hp}/${enemy.maxHp}`;
        }
    }

    /**
     * Update skill button states
     */
    updateSkillButtons(player) {
        if (!this.elements.skillButtons || !player.skills) return;

        const skillButtons = this.elements.skillButtons.querySelectorAll('.skill-btn');
        
        skillButtons.forEach((button, index) => {
            const skill = player.skills[index];
            if (!skill) return;

            // Update cooldown state
            if (skill.currentCooldown > 0) {
                button.classList.add('on-cooldown');
                button.disabled = true;
                
                const cooldownElement = button.querySelector('.skill-cooldown');
                if (cooldownElement) {
                    cooldownElement.textContent = skill.currentCooldown;
                }
            } else {
                button.classList.remove('on-cooldown');
                
                // Check if player has enough mana
                button.disabled = player.mana < skill.manaCost;
                
                const cooldownElement = button.querySelector('.skill-cooldown');
                if (cooldownElement) {
                    cooldownElement.remove();
                }
            }
        });
    }

    /**
     * Update combat health bars
     */
    updateCombatHealthBars() {
        if (this.combatState) {
            this.updatePlayerHealthMana(this.combatState.player);
            this.updateEnemyHealth(this.combatState.enemy);
        }
    }

    /**
     * Add message to combat log
     */
    addCombatLogMessage(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        
        this.combatLogMessages.push({
            message,
            type,
            timestamp
        });

        // Limit log size
        if (this.combatLogMessages.length > this.maxCombatLogMessages) {
            this.combatLogMessages.shift();
        }

        this.updateCombatLog();
    }

    /**
     * Update combat log display
     */
    updateCombatLog() {
        if (!this.elements.combatLog) return;

        this.elements.combatLog.innerHTML = '';

        this.combatLogMessages.forEach(logEntry => {
            const p = document.createElement('p');
            p.className = `log-${logEntry.type}`;
            p.textContent = logEntry.message;
            this.elements.combatLog.appendChild(p);
        });

        // Auto-scroll to bottom
        this.elements.combatLog.scrollTop = this.elements.combatLog.scrollHeight;
    }

    /**
     * Show event screen
     */
    showEvent(event) {
        if (!event) return;

        // Update event content
        if (this.elements.eventTitle) {
            this.elements.eventTitle.textContent = event.title || 'Strange Encounter';
        }
        
        if (this.elements.eventDescription) {
            this.elements.eventDescription.innerHTML = event.description || 'Something interesting happens...';
        }
        
        if (this.elements.eventImage) {
            this.elements.eventImage.textContent = event.image || '❓';
        }

        // Create choice buttons
        this.createEventChoices(event.choices || []);

        // Show event view
        this.showEventView();
    }

    /**
     * Create event choice buttons
     */
    createEventChoices(choices) {
        if (!this.elements.eventChoices) return;

        this.elements.eventChoices.innerHTML = '';

        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'event-choice';
            button.textContent = choice.text;
            
            button.addEventListener('click', () => {
                this.handleEventChoice(index, choice);
            });

            this.elements.eventChoices.appendChild(button);
        });
    }

    /**
     * Show damage effect animation
     */
    showDamageEffect(target, damage, critical = false) {
        const targetElement = target === this.combatState?.player ? 
            this.elements.playerSprite : this.elements.enemySprite;
        
        if (!targetElement) return;

        // Create damage number
        const damageNumber = document.createElement('div');
        damageNumber.className = `damage-number ${critical ? 'critical' : ''}`;
        damageNumber.textContent = `-${damage}`;
        damageNumber.style.position = 'absolute';
        damageNumber.style.pointerEvents = 'none';
        damageNumber.style.color = critical ? '#FFD700' : '#FF4500';
        damageNumber.style.fontWeight = 'bold';
        damageNumber.style.fontSize = critical ? '1.5rem' : '1.2rem';
        damageNumber.style.zIndex = '1000';

        // Position the damage number
        const rect = targetElement.getBoundingClientRect();
        damageNumber.style.left = `${rect.left + rect.width / 2}px`;
        damageNumber.style.top = `${rect.top}px`;

        document.body.appendChild(damageNumber);

        // Animate the damage number
        let y = 0;
        const animate = () => {
            y -= 2;
            damageNumber.style.transform = `translateY(${y}px)`;
            damageNumber.style.opacity = Math.max(0, 1 - Math.abs(y) / 50);
            
            if (Math.abs(y) < 50) {
                requestAnimationFrame(animate);
            } else {
                document.body.removeChild(damageNumber);
            }
        };
        
        requestAnimationFrame(animate);

        // Add hit flash effect
        targetElement.classList.add('hit-flash');
        setTimeout(() => {
            targetElement.classList.remove('hit-flash');
        }, 300);
    }

    /**
     * Show heal effect animation
     */
    showHealEffect(target, healing) {
        const targetElement = target === this.combatState?.player ? 
            this.elements.playerSprite : this.elements.enemySprite;
        
        if (!targetElement) return;

        // Create heal number
        const healNumber = document.createElement('div');
        healNumber.className = 'heal-number';
        healNumber.textContent = `+${healing}`;
        healNumber.style.position = 'absolute';
        healNumber.style.pointerEvents = 'none';
        healNumber.style.color = '#32CD32';
        healNumber.style.fontWeight = 'bold';
        healNumber.style.fontSize = '1.2rem';
        healNumber.style.zIndex = '1000';

        // Position and animate similar to damage numbers
        const rect = targetElement.getBoundingClientRect();
        healNumber.style.left = `${rect.left + rect.width / 2}px`;
        healNumber.style.top = `${rect.top}px`;

        document.body.appendChild(healNumber);

        // Animate
        let y = 0;
        const animate = () => {
            y -= 1.5;
            healNumber.style.transform = `translateY(${y}px)`;
            healNumber.style.opacity = Math.max(0, 1 - Math.abs(y) / 40);
            
            if (Math.abs(y) < 40) {
                requestAnimationFrame(animate);
            } else {
                document.body.removeChild(healNumber);
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * Show telegraph warning for powerful attacks
     */
    showTelegraphWarning(attackType, duration = 2000) {
        const warning = document.createElement('div');
        warning.className = 'telegraph-warning';
        warning.innerHTML = `
            <div class="warning-icon">⚠️</div>
            <div class="warning-text">Incoming ${attackType}!</div>
        `;
        
        warning.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 1.5rem;
            font-weight: bold;
            text-align: center;
            z-index: 10000;
            animation: pulse 0.5s ease-in-out infinite alternate;
        `;

        document.body.appendChild(warning);

        setTimeout(() => {
            if (document.body.contains(warning)) {
                document.body.removeChild(warning);
            }
        }, duration);
    }

    /**
     * Show boss phase transition
     */
    showBossPhaseTransition(message) {
        const transition = document.createElement('div');
        transition.className = 'boss-phase-transition';
        transition.textContent = message;
        
        transition.style.cssText = `
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #8B0000, #DC143C);
            color: white;
            padding: 20px 40px;
            border-radius: 15px;
            font-size: 1.8rem;
            font-weight: bold;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 0 30px rgba(139, 0, 0, 0.8);
            animation: fadeIn 0.5s ease-out;
        `;

        document.body.appendChild(transition);

        setTimeout(() => {
            if (document.body.contains(transition)) {
                transition.style.animation = 'fadeOut 0.5s ease-out';
                setTimeout(() => {
                    if (document.body.contains(transition)) {
                        document.body.removeChild(transition);
                    }
                }, 500);
            }
        }, 3000);
    }

    /**
     * Show combat victory screen
     */
    showCombatVictory(result) {
        const victory = document.createElement('div');
        victory.className = 'combat-result victory';
        victory.innerHTML = `
            <h2>Victory! 🎉</h2>
            <p>Defeated ${result.enemy.name}</p>
            <div class="rewards">
                <p>Experience: +${result.experience}</p>
                <p>Gold: +${result.rewards?.resources?.gold || 0}</p>
            </div>
            <button onclick="this.parentElement.remove()">Continue</button>
        `;
        
        victory.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(34, 139, 34, 0.95);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        `;

        document.body.appendChild(victory);
    }

    /**
     * Toggle inventory view
     */
    toggleInventory() {
        this.isInventoryOpen = !this.isInventoryOpen;
        
        if (this.isInventoryOpen) {
            this.showInventory();
        } else {
            this.hideInventory();
        }
    }

    showInventory() {
        if (this.elements.inventoryView) {
            this.elements.inventoryView.classList.add('active');
        }
        this.isInventoryOpen = true;
    }

    hideInventory() {
        if (this.elements.inventoryView) {
            this.elements.inventoryView.classList.remove('active');
        }
        this.isInventoryOpen = false;
    }

    /**
     * Update inventory display
     */
    updateInventoryView(inventory) {
        if (!this.elements.inventoryGrid || !inventory) return;

        this.elements.inventoryGrid.innerHTML = '';

        // Create inventory slots
        for (let i = 0; i < 20; i++) { // 20 inventory slots
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            
            if (inventory[i]) {
                slot.classList.add('has-item');
                slot.innerHTML = `
                    <div class="item-icon">${inventory[i].icon || '📦'}</div>
                `;
                slot.title = inventory[i].name;
            }
            
            this.elements.inventoryGrid.appendChild(slot);
        }
    }

    /**
     * Show run summary
     */
    showRunSummary(rewards, victory) {
        const summary = document.createElement('div');
        summary.className = 'run-summary';
        summary.innerHTML = `
            <h2>${victory ? 'Run Complete!' : 'Run Failed'}</h2>
            <div class="summary-content">
                <h3>Rewards Earned:</h3>
                <p>Echoes: ${rewards.echoes}</p>
                <p>Items: ${rewards.items?.length || 0}</p>
            </div>
            <button onclick="this.parentElement.remove(); window.EchoesGame.showScreen('main-menu');">Return to Menu</button>
        `;
        
        summary.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            z-index: 10000;
            min-width: 400px;
        `;

        document.body.appendChild(summary);
    }

    /**
     * Get sprite representation for entities
     */
    getPlayerSprite(player) {
        const sprites = {
            warrior: '🛡️',
            mage: '🔮',
            rogue: '🗡️',
            healer: '✨'
        };
        return sprites[player.className] || '⚔️';
    }

    getEnemySprite(enemy) {
        const sprites = {
            goblin: '👹',
            wolf: '🐺',
            spider: '🕷️',
            dragon: '🐉',
            skeleton: '💀',
            ghost: '👻'
        };
        
        // Try to match enemy type to sprite
        for (const [type, sprite] of Object.entries(sprites)) {
            if (enemy.type?.includes(type) || enemy.name?.toLowerCase().includes(type)) {
                return sprite;
            }
        }
        
        return enemy.isBoss ? '👹' : '👾';
    }

    /**
     * Event handlers for UI interactions
     */
    handleSkillClick(skillIndex) {
        console.log(`🎯 Skill clicked: ${skillIndex}`);
        
        if (window.EchoesGame?.gameEngine?.combat) {
            window.EchoesGame.gameEngine.combat.useSkill(skillIndex);
        }
    }

    handleNodeClick(nodeIndex) {
        console.log(`🗺️ Node clicked: ${nodeIndex}`);
        
        if (window.EchoesGame?.gameEngine) {
            window.EchoesGame.gameEngine.moveToNextNode();
        }
    }

    handleEventChoice(choiceIndex, choice) {
        console.log(`📝 Event choice: ${choiceIndex}`);
        
        // TODO: Implement event choice handling
        // For now, just return to map
        setTimeout(() => {
            this.showMapView();
        }, 1000);
    }

    /**
     * Utility method to check if in combat
     */
    isInCombat() {
        return this.currentView === 'combat' && this.combatState !== null;
    }
}