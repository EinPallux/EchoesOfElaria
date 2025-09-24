/**
 * Echoes of Elaria - Audio Management System
 * Handles background music, sound effects, and audio settings with Web Audio API fallback
 */

export class AudioManager {
    constructor() {
        // Audio context and nodes
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        
        // Audio elements
        this.backgroundMusic = null;
        this.sfxAudio = null;
        
        // Current audio state
        this.currentMusicTrack = null;
        this.musicPlaying = false;
        this.isMuted = false;
        
        // Volume settings (0.0 to 1.0)
        this.volumes = {
            master: 0.7,
            music: 0.5,
            sfx: 0.8
        };
        
        // Audio library - using placeholder data since we can't load actual files
        this.musicTracks = {
            menu: {
                name: 'Main Menu',
                file: null, // Would be path to audio file
                loop: true,
                volume: 0.6
            },
            hub: {
                name: 'Fortress Hub',
                file: null,
                loop: true,
                volume: 0.5
            },
            forest: {
                name: 'Whispering Woods',
                file: null,
                loop: true,
                volume: 0.4
            },
            desert: {
                name: 'Scorching Sands',
                file: null,
                loop: true,
                volume: 0.5
            },
            ice: {
                name: 'Frozen Peaks',
                file: null,
                loop: true,
                volume: 0.4
            },
            ruins: {
                name: 'Ancient Echoes',
                file: null,
                loop: true,
                volume: 0.3
            },
            combat: {
                name: 'Battle Theme',
                file: null,
                loop: true,
                volume: 0.7
            },
            boss: {
                name: 'Epic Confrontation',
                file: null,
                loop: true,
                volume: 0.8
            },
            victory: {
                name: 'Triumph',
                file: null,
                loop: false,
                volume: 0.6
            },
            defeat: {
                name: 'Defeat',
                file: null,
                loop: false,
                volume: 0.5
            }
        };
        
        this.soundEffects = {
            // UI Sounds
            button_click: { file: null, volume: 0.3 },
            menu_navigate: { file: null, volume: 0.2 },
            page_turn: { file: null, volume: 0.4 },
            notification: { file: null, volume: 0.5 },
            
            // Combat Sounds
            sword_hit: { file: null, volume: 0.6 },
            magic_cast: { file: null, volume: 0.5 },
            arrow_shoot: { file: null, volume: 0.4 },
            shield_block: { file: null, volume: 0.5 },
            critical_hit: { file: null, volume: 0.8 },
            heal_cast: { file: null, volume: 0.4 },
            
            // Environmental Sounds
            item_pickup: { file: null, volume: 0.3 },
            chest_open: { file: null, volume: 0.5 },
            door_open: { file: null, volume: 0.4 },
            footsteps: { file: null, volume: 0.2 },
            
            // Special Effects
            level_up: { file: null, volume: 0.7 },
            achievement: { file: null, volume: 0.6 },
            boss_roar: { file: null, volume: 0.9 },
            teleport: { file: null, volume: 0.5 }
        };
        
        // Procedural audio generation patterns
        this.synthPatterns = {
            button_click: { freq: 800, duration: 0.1, type: 'sine' },
            sword_hit: { freq: 200, duration: 0.2, type: 'sawtooth' },
            magic_cast: { freq: 600, duration: 0.3, type: 'sine', sweep: true },
            heal_cast: { freq: 880, duration: 0.5, type: 'sine', fade: true },
            critical_hit: { freq: 1200, duration: 0.15, type: 'square' },
            level_up: { freq: 440, duration: 1.0, type: 'sine', chord: true },
            notification: { freq: 880, duration: 0.2, type: 'sine', repeat: 2 }
        };
        
        // Audio loading queue
        this.loadingQueue = [];
        this.loadedAudio = new Map();
        
        console.log('🔊 Audio Manager initialized');
    }

    /**
     * Initialize the audio system
     */
    async init() {
        try {
            // Initialize Web Audio API
            await this.initWebAudio();
            
            // Initialize HTML5 Audio elements
            this.initHTMLAudio();
            
            // Set initial volumes
            this.updateVolumes();
            
            console.log('🔊 Audio system initialized successfully');
            
        } catch (error) {
            console.warn('⚠️ Audio initialization failed:', error);
            // Continue without audio
        }
    }

    /**
     * Initialize Web Audio API context
     */
    async initWebAudio() {
        try {
            // Create audio context
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Create gain nodes for volume control
            this.masterGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();
            
            // Connect gain nodes
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);
            
            // Handle audio context suspension (browser policy)
            if (this.audioContext.state === 'suspended') {
                // Wait for user interaction to resume
                const resumeAudio = async () => {
                    await this.audioContext.resume();
                    document.removeEventListener('click', resumeAudio);
                    document.removeEventListener('keydown', resumeAudio);
                    console.log('🔊 Audio context resumed');
                };
                
                document.addEventListener('click', resumeAudio);
                document.addEventListener('keydown', resumeAudio);
            }
            
            console.log('🎵 Web Audio API initialized');
            
        } catch (error) {
            console.warn('⚠️ Web Audio API not available:', error);
            throw error;
        }
    }

    /**
     * Initialize HTML5 Audio elements as fallback
     */
    initHTMLAudio() {
        // Background music element
        this.backgroundMusic = document.getElementById('audio-background');
        if (!this.backgroundMusic) {
            this.backgroundMusic = document.createElement('audio');
            this.backgroundMusic.id = 'audio-background';
            this.backgroundMusic.loop = true;
            this.backgroundMusic.preload = 'none';
            document.body.appendChild(this.backgroundMusic);
        }
        
        // Sound effects element
        this.sfxAudio = document.getElementById('audio-sfx');
        if (!this.sfxAudio) {
            this.sfxAudio = document.createElement('audio');
            this.sfxAudio.id = 'audio-sfx';
            this.sfxAudio.preload = 'none';
            document.body.appendChild(this.sfxAudio);
        }
        
        console.log('🎵 HTML5 Audio elements initialized');
    }

    /**
     * Play background music
     */
    async playMusic(trackName, fadeIn = true) {
        if (this.isMuted || !trackName) return;
        
        const track = this.musicTracks[trackName];
        if (!track) {
            console.warn(`🎵 Music track not found: ${trackName}`);
            return;
        }
        
        try {
            // Stop current music if different track
            if (this.currentMusicTrack !== trackName && this.musicPlaying) {
                await this.stopMusic(true); // Fade out current track
            }
            
            // Don't restart the same track
            if (this.currentMusicTrack === trackName && this.musicPlaying) {
                return;
            }
            
            // Since we don't have actual audio files, we'll simulate music playing
            console.log(`🎵 Playing music: ${track.name}`);
            
            this.currentMusicTrack = trackName;
            this.musicPlaying = true;
            
            // Simulate fade in
            if (fadeIn) {
                await this.fadeMusicIn();
            }
            
        } catch (error) {
            console.error('🎵 Failed to play music:', error);
        }
    }

    /**
     * Stop background music
     */
    async stopMusic(fadeOut = true) {
        if (!this.musicPlaying) return;
        
        try {
            if (fadeOut) {
                await this.fadeMusicOut();
            }
            
            if (this.backgroundMusic) {
                this.backgroundMusic.pause();
                this.backgroundMusic.currentTime = 0;
            }
            
            this.musicPlaying = false;
            this.currentMusicTrack = null;
            
            console.log('🎵 Music stopped');
            
        } catch (error) {
            console.error('🎵 Failed to stop music:', error);
        }
    }

    /**
     * Play sound effect
     */
    async playSFX(effectName, options = {}) {
        if (this.isMuted) return;
        
        const effect = this.soundEffects[effectName];
        const synthPattern = this.synthPatterns[effectName];
        
        if (!effect && !synthPattern) {
            console.warn(`🔊 Sound effect not found: ${effectName}`);
            return;
        }
        
        try {
            // Use Web Audio API for procedural generation
            if (this.audioContext && synthPattern) {
                await this.generateSynthSound(synthPattern, options);
            } else {
                // Fallback to HTML5 audio (would load actual files)
                console.log(`🔊 Playing SFX: ${effectName}`);
            }
            
        } catch (error) {
            console.error('🔊 Failed to play SFX:', error);
        }
    }

    /**
     * Generate procedural sound using Web Audio API
     */
    async generateSynthSound(pattern, options = {}) {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const duration = options.duration || pattern.duration || 0.2;
        const volume = options.volume || 0.3;
        
        // Create oscillator
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        // Configure oscillator
        oscillator.type = pattern.type || 'sine';
        oscillator.frequency.setValueAtTime(pattern.freq || 440, now);
        
        // Configure gain (volume envelope)
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); // Quick attack
        
        if (pattern.fade) {
            // Gradual fade out
            gainNode.gain.linearRampToValueAtTime(0, now + duration);
        } else {
            // Hold and quick release
            gainNode.gain.setValueAtTime(volume, now + duration - 0.05);
            gainNode.gain.linearRampToValueAtTime(0, now + duration);
        }
        
        // Frequency modulation for special effects
        if (pattern.sweep) {
            oscillator.frequency.linearRampToValueAtTime(
                pattern.freq * 0.5, 
                now + duration
            );
        }
        
        // Start and stop
        oscillator.start(now);
        oscillator.stop(now + duration);
        
        // Handle chord (multiple frequencies)
        if (pattern.chord) {
            // Play additional notes for chord effect
            const chordFreqs = [pattern.freq * 1.25, pattern.freq * 1.5]; // Major chord
            
            chordFreqs.forEach((freq, index) => {
                setTimeout(() => {
                    this.generateSynthSound({ 
                        ...pattern, 
                        freq: freq, 
                        chord: false 
                    }, { 
                        ...options, 
                        volume: volume * 0.7 
                    });
                }, index * 100);
            });
        }
        
        // Handle repeat
        if (pattern.repeat && pattern.repeat > 1) {
            for (let i = 1; i < pattern.repeat; i++) {
                setTimeout(() => {
                    this.generateSynthSound({ 
                        ...pattern, 
                        repeat: 1 
                    }, options);
                }, i * (duration * 1000 + 50));
            }
        }
    }

    /**
     * Play contextual music based on game state
     */
    async playContextualMusic(context, subContext = null) {
        let trackName = 'menu'; // Default fallback
        
        switch (context) {
            case 'menu':
                trackName = 'menu';
                break;
                
            case 'hub':
                trackName = 'hub';
                break;
                
            case 'run':
                // Choose music based on current region
                if (subContext) {
                    trackName = this.musicTracks[subContext] ? subContext : 'forest';
                } else {
                    trackName = 'forest';
                }
                break;
                
            case 'combat':
                trackName = subContext === 'boss' ? 'boss' : 'combat';
                break;
                
            case 'victory':
                trackName = 'victory';
                break;
                
            case 'defeat':
                trackName = 'defeat';
                break;
        }
        
        await this.playMusic(trackName);
    }

    /**
     * Play UI sound effects
     */
    playUISound(action) {
        const soundMap = {
            'button_click': 'button_click',
            'navigate': 'menu_navigate',
            'page_turn': 'page_turn',
            'notification': 'notification',
            'level_up': 'level_up',
            'achievement': 'achievement'
        };
        
        const soundEffect = soundMap[action];
        if (soundEffect) {
            this.playSFX(soundEffect);
        }
    }

    /**
     * Play combat sound effects
     */
    playCombatSound(action, options = {}) {
        const soundMap = {
            'attack': 'sword_hit',
            'magic': 'magic_cast',
            'ranged': 'arrow_shoot',
            'block': 'shield_block',
            'critical': 'critical_hit',
            'heal': 'heal_cast',
            'boss_ability': 'boss_roar'
        };
        
        const soundEffect = soundMap[action];
        if (soundEffect) {
            this.playSFX(soundEffect, options);
        }
    }

    /**
     * Update volume settings
     */
    updateVolumes() {
        try {
            // Update Web Audio API gains
            if (this.masterGain) {
                this.masterGain.gain.value = this.volumes.master;
            }
            if (this.musicGain) {
                this.musicGain.gain.value = this.volumes.music;
            }
            if (this.sfxGain) {
                this.sfxGain.gain.value = this.volumes.sfx;
            }
            
            // Update HTML5 audio volumes
            if (this.backgroundMusic) {
                this.backgroundMusic.volume = this.volumes.master * this.volumes.music;
            }
            if (this.sfxAudio) {
                this.sfxAudio.volume = this.volumes.master * this.volumes.sfx;
            }
            
        } catch (error) {
            console.error('🔊 Failed to update volumes:', error);
        }
    }

    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        this.volumes.master = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
    }

    /**
     * Set music volume
     */
    setMusicVolume(volume) {
        this.volumes.music = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
    }

    /**
     * Set SFX volume
     */
    setSFXVolume(volume) {
        this.volumes.sfx = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
    }

    /**
     * Mute/unmute all audio
     */
    setMuted(muted) {
        this.isMuted = muted;
        
        if (muted) {
            this.stopMusic(false);
            if (this.masterGain) {
                this.masterGain.gain.value = 0;
            }
        } else {
            this.updateVolumes();
            // Resume contextual music if needed
        }
        
        console.log(`🔊 Audio ${muted ? 'muted' : 'unmuted'}`);
    }

    /**
     * Fade music in
     */
    async fadeMusicIn(duration = 2.0) {
        if (!this.musicGain) return;
        
        const now = this.audioContext.currentTime;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.setValueAtTime(0, now);
        this.musicGain.gain.linearRampToValueAtTime(this.volumes.music, now + duration);
        
        return new Promise(resolve => {
            setTimeout(resolve, duration * 1000);
        });
    }

    /**
     * Fade music out
     */
    async fadeMusicOut(duration = 1.0) {
        if (!this.musicGain) return;
        
        const now = this.audioContext.currentTime;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
        this.musicGain.gain.linearRampToValueAtTime(0, now + duration);
        
        return new Promise(resolve => {
            setTimeout(resolve, duration * 1000);
        });
    }

    /**
     * Cross-fade between music tracks
     */
    async crossFade(newTrackName, duration = 3.0) {
        if (this.currentMusicTrack === newTrackName) return;
        
        // Start fade out of current track
        const fadeOutPromise = this.stopMusic(true);
        
        // Wait half the duration, then start new track
        setTimeout(async () => {
            await this.playMusic(newTrackName, true);
        }, (duration * 500)); // Half duration in milliseconds
        
        await fadeOutPromise;
    }

    /**
     * Create ambient soundscape
     */
    createAmbientSounds(environment) {
        // This would create subtle background sounds for different environments
        const ambientMap = {
            'forest': ['wind_through_trees', 'distant_birds', 'rustling_leaves'],
            'desert': ['desert_wind', 'distant_thunder', 'sand_shifting'],
            'ice': ['ice_cracking', 'cold_wind', 'distant_howl'],
            'ruins': ['stone_creaking', 'mysterious_whispers', 'distant_echo']
        };
        
        const sounds = ambientMap[environment];
        if (sounds) {
            // Play subtle ambient sounds at random intervals
            sounds.forEach(sound => {
                setTimeout(() => {
                    this.playSFX(sound, { volume: 0.1 });
                }, Math.random() * 10000);
            });
        }
    }

    /**
     * Get current audio state
     */
    getAudioState() {
        return {
            musicPlaying: this.musicPlaying,
            currentTrack: this.currentMusicTrack,
            isMuted: this.isMuted,
            volumes: { ...this.volumes },
            contextState: this.audioContext ? this.audioContext.state : 'unavailable'
        };
    }

    /**
     * Apply audio settings from persistence
     */
    applySettings(settings) {
        if (!settings || !settings.audio) return;
        
        const audioSettings = settings.audio;
        
        this.volumes.master = audioSettings.masterVolume || 0.7;
        this.volumes.music = audioSettings.musicVolume || 0.5;
        this.volumes.sfx = audioSettings.sfxVolume || 0.8;
        this.isMuted = audioSettings.muted || false;
        
        this.updateVolumes();
        
        if (this.isMuted) {
            this.setMuted(true);
        }
        
        console.log('🔊 Audio settings applied');
    }

    /**
     * Get audio settings for persistence
     */
    getAudioSettings() {
        return {
            masterVolume: this.volumes.master,
            musicVolume: this.volumes.music,
            sfxVolume: this.volumes.sfx,
            muted: this.isMuted
        };
    }

    /**
     * Cleanup audio resources
     */
    dispose() {
        try {
            // Stop all audio
            this.stopMusic(false);
            
            // Close audio context
            if (this.audioContext && this.audioContext.state !== 'closed') {
                this.audioContext.close();
            }
            
            // Clear references
            this.audioContext = null;
            this.masterGain = null;
            this.musicGain = null;
            this.sfxGain = null;
            
            console.log('🔊 Audio resources disposed');
            
        } catch (error) {
            console.error('🔊 Error disposing audio resources:', error);
        }
    }
}