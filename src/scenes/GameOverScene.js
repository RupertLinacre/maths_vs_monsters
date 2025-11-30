import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config.js';
import AudioControls from '../ui/AudioControls.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        // Get final score from registry
        const finalScore = this.registry.get('finalScore') || 0;

        // Create semi-transparent dark overlay with red tint
        const overlay = this.add.graphics();
        overlay.fillStyle(0x1a0d0d, 0.90);
        overlay.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        overlay.setDepth(-5);

        // Game Over text
        this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ff6666',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Final score
        this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, `Final Score: ${finalScore}`, {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Play Again button
        const playAgainBtn = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.7, 'Play Again', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#44ff44',
            backgroundColor: '#224422',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        playAgainBtn.on('pointerover', () => {
            playAgainBtn.setStyle({ backgroundColor: '#336633' });
        });

        playAgainBtn.on('pointerout', () => {
            playAgainBtn.setStyle({ backgroundColor: '#224422' });
        });

        playAgainBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        // Audio controls (bottom right)
        this.audioControls = new AudioControls(this);
    }
}
