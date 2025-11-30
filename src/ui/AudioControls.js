import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config.js';

/**
 * AudioControls - A reusable component for music and sound toggle buttons
 * Displays in the bottom-right corner of the screen
 */
export default class AudioControls {
    constructor(scene) {
        this.scene = scene;

        // Get current audio states from registry (default to enabled)
        this.musicEnabled = scene.registry.get('musicEnabled') ?? true;
        this.soundEnabled = scene.registry.get('soundEnabled') ?? true;

        this.createButtons();
        this.applyAudioSettings();
    }

    createButtons() {
        const buttonY = CANVAS_HEIGHT - 30;
        const buttonSpacing = 100;
        const rightEdge = CANVAS_WIDTH - 20;

        // Sound toggle button (rightmost)
        this.soundBtn = this.scene.add.text(rightEdge, buttonY, this.getSoundLabel(), {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: this.soundEnabled ? '#4ade80' : '#888899',
            backgroundColor: '#222233',
            padding: { x: 8, y: 6 }
        }).setOrigin(1, 0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(100);

        this.soundBtn.on('pointerover', () => {
            this.soundBtn.setStyle({ backgroundColor: '#333344' });
        });

        this.soundBtn.on('pointerout', () => {
            this.soundBtn.setStyle({ backgroundColor: '#222233' });
        });

        this.soundBtn.on('pointerdown', () => {
            this.toggleSound();
        });

        // Music toggle button (left of sound button)
        this.musicBtn = this.scene.add.text(rightEdge - buttonSpacing, buttonY, this.getMusicLabel(), {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: this.musicEnabled ? '#4ade80' : '#888899',
            backgroundColor: '#222233',
            padding: { x: 8, y: 6 }
        }).setOrigin(1, 0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(100);

        this.musicBtn.on('pointerover', () => {
            this.musicBtn.setStyle({ backgroundColor: '#333344' });
        });

        this.musicBtn.on('pointerout', () => {
            this.musicBtn.setStyle({ backgroundColor: '#222233' });
        });

        this.musicBtn.on('pointerdown', () => {
            this.toggleMusic();
        });
    }

    getMusicLabel() {
        return this.musicEnabled ? '🎵 Music: ON' : '🎵 Music: OFF';
    }

    getSoundLabel() {
        return this.soundEnabled ? '🔊 Sound: ON' : '🔊 Sound: OFF';
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        this.scene.registry.set('musicEnabled', this.musicEnabled);

        this.musicBtn.setText(this.getMusicLabel());
        this.musicBtn.setStyle({
            color: this.musicEnabled ? '#4ade80' : '#888899',
            backgroundColor: '#222233'
        });

        this.applyMusicSetting();
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.scene.registry.set('soundEnabled', this.soundEnabled);

        this.soundBtn.setText(this.getSoundLabel());
        this.soundBtn.setStyle({
            color: this.soundEnabled ? '#4ade80' : '#888899',
            backgroundColor: '#222233'
        });

        this.applySoundSetting();
    }

    applyAudioSettings() {
        this.applyMusicSetting();
        this.applySoundSetting();
    }

    applyMusicSetting() {
        const music = this.scene.registry.get('themeMusic');
        if (music) {
            if (this.musicEnabled) {
                if (!music.isPlaying) {
                    music.play();
                }
            } else {
                music.pause();
            }
        }
    }

    applySoundSetting() {
        // Store sound enabled state - GameScene will check this before playing sounds
        // The registry value is already set, scenes should check registry.get('soundEnabled')
        // before calling this.sound.play() for sound effects
    }

    destroy() {
        if (this.musicBtn) {
            this.musicBtn.destroy();
        }
        if (this.soundBtn) {
            this.soundBtn.destroy();
        }
    }
}
