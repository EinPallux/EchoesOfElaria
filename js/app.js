/**
 * Echoes of Elaria - Simplified Main Application Entry Point
 * Basic version that works without ES6 modules
 */

// Simple fallback implementation when modules aren't available
class SimpleEchoesGame {
    constructor() {
        this.currentScreen = 'loading-screen';
        this.selectedClass = null;
        this.selectedFaction = null;
        this.metaProgression = {
            echoes: 0,
            totalRuns: 0,
            buildings: {
                forge: { level: 1 },
                library: { level: 1 },
                altar: { level: 1 },
                faction: { level: 1 }
            }
        };
        
        // Load saved data from localStorage
        this.loadSavedData();
    }

    async init() {
        try {
            console.log('🎮 Initializing Echoes of Elaria (Simple Mode)...');
            
            // Show loading screen
            this.showScreen('loading-screen');
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update UI with saved data
            this.updateUI();
            
            // Simulate loading time
            await this.delay(2000);
            
            // Show main menu
            this.showScreen('main-menu');
            
            console.log('✅ Game initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize game:', error);
            this.showError('Failed to initialize game. Please refresh the page.');
        }
    }

    setupEventListeners() {
        // Main Menu buttons
        this.getElementById('new-game-btn')?.addEventListener('click', () => {
            this.startNewRun();
        });
        
        this.getElementById('hub-btn')?.addEventListener('click', () => {
            this.showScreen('hub-screen');
        });
        
        // Hub screen buttons
        this.getElementById('hub-back-btn')?.addEventListener('click', () => {
            this.showScreen('main-menu');
        });
        
        // Building upgrade buttons
        this.getElementById('forge-upgrade-btn')?.addEventListener('click', () => {
            this.upgradeBuilding('forge');
        });
        
        this.getElementById('library-upgrade-btn')?.addEventListener('click', () => {
            this.upgradeBuilding('library');
        });
        
        this.getElementById('altar-upgrade-btn')?.addEventListener('click', () => {
            this.upgradeBuilding('altar');
        });
        
        this.getElementById('faction-upgrade-btn')?.addEventListener('click', () => {
            this.upgradeBuilding('faction');
        });

        // Character Creation
        this.getElementById('char-back-btn')?.addEventListener('click', () => {
            this.showScreen('main-menu');
        });
        
        this.getElementById('start-run-btn')?.addEventListener('click', () => {
            this.beginRun();
        });

        // Class selection
        document.querySelectorAll('.class-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectClass(card.dataset.class);
            });
        });

        // Faction selection
        document.querySelectorAll('.faction-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectFaction(card.dataset.faction);
            });
        });

        // Crafting screen
        this.getElementById('crafting-back-btn')?.addEventListener('click', () => {
            this.showScreen('hub-screen');
        });

        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveGameData();
        }, 30000);

        console.log('🎯 Event listeners set up');
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            
            // Add fade-in animation
            targetScreen.classList.add('fade-in');
            setTimeout(() => {
                targetScreen.classList.remove('fade-in');
            }, 300);
            
            console.log(`📺 Switched to screen: ${screenId}`);
        } else {
            console.error(`❌ Screen not found: ${screenId}`);
        }
    }

    startNewRun() {
        console.log('🚀 Starting new run...');
        this.showScreen('character-creation');
        this.resetCharacterCreation();
    }

    resetCharacterCreation() {
        // Clear previous selections
        document.querySelectorAll('.class-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        document.querySelectorAll('.faction-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Disable start button
        const startBtn = this.getElementById('start-run-btn');
        if (startBtn) startBtn.disabled = true;
        
        // Reset selection state
        this.selectedClass = null;
        this.selectedFaction = null;
    }

    selectClass(className) {
        // Remove previous selection
        document.querySelectorAll('.class-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Add selection to clicked card
        const selectedCard = document.querySelector(`[data-class="${className}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
        
        this.selectedClass = className;
        this.checkCanStartRun();
        
        console.log(`⚔️ Selected class: ${className}`);
    }

    selectFaction(factionName) {
        // Remove previous selection
        document.querySelectorAll('.faction-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Add selection to clicked card
        const selectedCard = document.querySelector(`[data-faction="${factionName}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
        
        this.selectedFaction = factionName;
        this.checkCanStartRun();
        
        console.log(`🏛️ Selected faction: ${factionName}`);
    }

    checkCanStartRun() {
        const canStart = this.selectedClass && this.selectedFaction;
        const startBtn = this.getElementById('start-run-btn');
        if (startBtn) {
            startBtn.disabled = !canStart;
        }
    }

    beginRun() {
        if (!this.selectedClass || !this.selectedFaction) {
            console.warn('⚠️ Class and faction must be selected');
            return;
        }
        
        console.log(`🎯 Beginning run: ${this.selectedClass} of ${this.selectedFaction}`);
        
        // Create a simple demo run
        this.createDemoRun();
        
        // Switch to game screen
        this.showScreen('game-screen');
        this.showMapView();
        
        // Update progression
        this.metaProgression.totalRuns++;
        this.saveGameData();
        
        this.showNotification(`Started new run as ${this.selectedClass}!`, 'success');
    }

    createDemoRun() {
        // Create a simple demo map with a few nodes
        const mapContainer = this.getElementById('map-container');
        if (!mapContainer) return;
        
        mapContainer.innerHTML = '';
        
        const demoNodes = [
            { name: 'Forest Entrance', icon: '🌲', description: 'A peaceful grove' },
            { name: 'Goblin Camp', icon: '⚔️', description: 'Hostile creatures ahead' },
            { name: 'Ancient Shrine', icon: '⛪', description: 'A mysterious monument' },
            { name: 'Treasure Chest', icon: '💎', description: 'Shimmering rewards' },
            { name: 'Forest Guardian', icon: '👹', description: 'The final challenge' }
        ];
        
        demoNodes.forEach((node, index) => {
            const nodeDiv = document.createElement('div');
            nodeDiv.className = 'map-node';
            if (index === 0) nodeDiv.classList.add('current');
            
            nodeDiv.innerHTML = `
                <div class="node-icon">${node.icon}</div>
                <div class="node-info">
                    <h3>${node.name}</h3>
                    <p>${node.description}</p>
                    ${index === 0 ? '<span class="node-status">Current</span>' : ''}
                </div>
            `;
            
            // Add click handler for demo
            nodeDiv.addEventListener('click', () => {
                this.handleDemoNodeClick(node, index);
            });
            
            mapContainer.appendChild(nodeDiv);
        });
    }

    handleDemoNodeClick(node, index) {
        if (index === 0) {
            this.showNotification('You explore the peaceful grove and find some herbs.', 'info');
        } else if (index === 1) {
            this.showNotification('You defeated the goblins and earned 50 gold!', 'success');
        } else if (index === 4) {
            // Boss encounter
            this.showNotification('You defeated the Forest Guardian! Run complete!', 'success');
            this.completeRun();
        } else {
            this.showNotification(`You completed the ${node.name}.`, 'info');
        }
        
        // Mark current node as completed and advance
        const nodes = document.querySelectorAll('.map-node');
        if (nodes[index]) {
            nodes[index].classList.remove('current');
            nodes[index].classList.add('completed');
        }
        if (nodes[index + 1] && index < 4) {
            nodes[index + 1].classList.add('current');
        }
    }

    completeRun() {
        // Award echoes and return to hub
        const echoesEarned = 75;
        this.metaProgression.echoes += echoesEarned;
        this.saveGameData();
        this.updateUI();
        
        setTimeout(() => {
            this.showNotification(`Earned ${echoesEarned} Echoes! Returning to hub.`, 'success');
            setTimeout(() => {
                this.showScreen('hub-screen');
            }, 2000);
        }, 1000);
    }

    showMapView() {
        // Show map view in game screen
        const views = document.querySelectorAll('.game-view');
        views.forEach(view => view.classList.remove('active'));
        
        const mapView = this.getElementById('map-view');
        if (mapView) {
            mapView.classList.add('active');
        }
    }

    upgradeBuilding(buildingType) {
        const cost = this.getBuildingUpgradeCost(buildingType);
        
        if (this.metaProgression.echoes >= cost) {
            this.metaProgression.echoes -= cost;
            this.metaProgression.buildings[buildingType].level++;
            
            this.updateUI();
            this.saveGameData();
            
            this.showNotification(`${buildingType.charAt(0).toUpperCase() + buildingType.slice(1)} upgraded!`, 'success');
        } else {
            this.showNotification('Insufficient Echoes', 'warning');
        }
    }

    getBuildingUpgradeCost(buildingType) {
        const building = this.metaProgression.buildings[buildingType];
        const baseCosts = {
            forge: 100,
            library: 150,
            altar: 200,
            faction: 250
        };
        
        const baseCost = baseCosts[buildingType] || 100;
        return Math.floor(baseCost * Math.pow(1.5, building.level - 1));
    }

    updateUI() {
        // Update echoes display
        const echoesElements = document.querySelectorAll('#echoes-count, #hub-echoes');
        echoesElements.forEach(el => {
            if (el) el.textContent = this.metaProgression.echoes;
        });
        
        // Update building levels and costs
        Object.keys(this.metaProgression.buildings).forEach(buildingType => {
            const building = this.metaProgression.buildings[buildingType];
            
            // Update level display
            const levelEl = this.getElementById(`${buildingType}-level`);
            if (levelEl) {
                levelEl.textContent = building.level;
            }
            
            // Update upgrade button
            const upgradeBtn = this.getElementById(`${buildingType}-upgrade-btn`);
            if (upgradeBtn) {
                const cost = this.getBuildingUpgradeCost(buildingType);
                const canAfford = this.metaProgression.echoes >= cost;
                
                upgradeBtn.disabled = !canAfford;
                upgradeBtn.textContent = `Upgrade (${cost} ✦)`;
            }
        });
    }

    saveGameData() {
        try {
            localStorage.setItem('echoes_meta_progression', JSON.stringify(this.metaProgression));
            console.log('💾 Game data saved');
        } catch (error) {
            console.error('❌ Failed to save game data:', error);
        }
    }

    loadSavedData() {
        try {
            const saved = localStorage.getItem('echoes_meta_progression');
            if (saved) {
                this.metaProgression = { ...this.metaProgression, ...JSON.parse(saved) };
                console.log('💾 Game data loaded');
            }
        } catch (error) {
            console.error('❌ Failed to load game data:', error);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '10000',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease'
        });
        
        // Set background color based on type
        const colors = {
            success: '#228B22',
            danger: '#DC143C',
            warning: '#FF8C00',
            info: '#4169E1'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    showError(message) {
        this.showNotification(message, 'danger');
    }

    getElementById(id) {
        return document.getElementById(id);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌟 Echoes of Elaria - Starting up...');
    
    try {
        // Try to load the full modular version first
        const { EchoesOfElaria } = await import('./app-modules.js').catch(() => null);
        
        if (EchoesOfElaria) {
            console.log('🎮 Loading full version with modules...');
            const game = new EchoesOfElaria();
            await game.init();
            window.EchoesGame = game;
        } else {
            throw new Error('Modules not available');
        }
        
    } catch (error) {
        console.log('🎮 Loading simplified version...');
        
        // Fallback to simple version
        const game = new SimpleEchoesGame();
        await game.init();
        
        // Make game instance available globally
        window.EchoesGame = game;
        
        // Show info about simplified mode
        setTimeout(() => {
            game.showNotification('Running in simplified mode. For full features, ensure all JS files are present.', 'info');
        }, 3000);
    }
});

// Handle page visibility changes (pause/resume)
document.addEventListener('visibilitychange', () => {
    if (window.EchoesGame) {
        if (document.hidden) {
            console.log('⏸️ Game paused (tab hidden)');
            if (window.EchoesGame.saveGameData) {
                window.EchoesGame.saveGameData();
            }
        } else {
            console.log('▶️ Game resumed (tab visible)');
        }
    }
});