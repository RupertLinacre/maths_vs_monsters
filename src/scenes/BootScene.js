import Phaser from 'phaser';
import { PROJECTILE } from '../config.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    init() {
        // Initialize audio settings in registry (default to enabled)
        if (this.registry.get('musicEnabled') === undefined) {
            this.registry.set('musicEnabled', true);
        }
        if (this.registry.get('soundEnabled') === undefined) {
            this.registry.set('soundEnabled', true);
        }
    }

    preload() {
        // Create a 1x1 white pixel texture for general use
        const pixelGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        pixelGraphics.fillStyle(0xffffff);
        pixelGraphics.fillRect(0, 0, 1, 1);
        pixelGraphics.generateTexture('pixel', 1, 1);
        pixelGraphics.destroy();

        // Create projectile texture at actual size
        const projectileGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        projectileGraphics.fillStyle(0xffffff);
        projectileGraphics.fillCircle(PROJECTILE.size / 2, PROJECTILE.size / 2, PROJECTILE.size / 2);
        projectileGraphics.generateTexture('projectile', PROJECTILE.size, PROJECTILE.size);
        projectileGraphics.destroy();

        // Load monster sprites
        this.load.image('monster_easy', 'assets/monsters/monster_easy.png');
        this.load.image('monster_medium', 'assets/monsters/monster_medium.png');
        this.load.image('monster_hard', 'assets/monsters/monster_hard.png');

        // Load turret sprites (note: easy has typo 'turrent' in filename)
        this.load.image('turret_easy', 'assets/turrets/turrent_easy.png');
        this.load.image('turret_medium', 'assets/turrets/turret_medium.png');
        this.load.image('turret_hard', 'assets/turrets/turret_hard.png');

        // Load sound effects
        this.load.audio('turret_fire', 'assets/turrets/pop.mp3');
        this.load.audio('monster_hurt', 'assets/monsters/ow_hurt.mp3');
        this.load.audio('monster_death', 'assets/monsters/ow_death.mp3');

        // Load theme music
        this.load.audio('theme_music', 'assets/music/theme.mp3');
    }

    create() {
        // Create theme music instance and store in registry for cross-scene access
        const music = this.sound.add('theme_music', {
            loop: true,
            volume: 0.5
        });
        this.registry.set('themeMusic', music);

        // Start music if enabled
        if (this.registry.get('musicEnabled')) {
            music.play();
        }

        this.scene.start('MenuScene');
    }
}
