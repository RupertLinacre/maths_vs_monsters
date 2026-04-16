import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_AREA_HEIGHT } from '../config.js';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    create(data) {
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);

        this.parentSceneKey = data.parentSceneKey || 'GameScene';

        const overlay = this.add.rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0x0d0d1a, 0.55)
            .setOrigin(0, 0)
            .setDepth(200);

        const panel = this.add.rectangle(CANVAS_WIDTH / 2, GAME_AREA_HEIGHT / 2, 320, 190, 0x1a1a2e, 0.96)
            .setStrokeStyle(2, 0x333355)
            .setDepth(201);

        const title = this.add.text(CANVAS_WIDTH / 2, GAME_AREA_HEIGHT / 2 - 35, 'Paused', {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#4ade80',
            fontStyle: 'bold'
        }).setOrigin(0.5)
            .setDepth(202);

        const subtitle = this.add.text(CANVAS_WIDTH / 2, GAME_AREA_HEIGHT / 2 - 2, 'Take a breather. The monsters are frozen.', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#888899'
        }).setOrigin(0.5)
            .setDepth(202);

        const resumeButton = this.add.text(CANVAS_WIDTH / 2, GAME_AREA_HEIGHT / 2 + 52, '▶ Resume', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#222233',
            padding: { x: 14, y: 10 }
        }).setOrigin(0.5)
            .setDepth(202)
            .setInteractive({ useHandCursor: true });

        resumeButton.on('pointerover', () => {
            resumeButton.setStyle({
                backgroundColor: '#333344',
                color: '#4ade80'
            });
        });

        resumeButton.on('pointerout', () => {
            resumeButton.setStyle({
                backgroundColor: '#222233',
                color: '#ffffff'
            });
        });

        resumeButton.on('pointerdown', () => {
            this.resumeParentScene();
        });

        this.input.keyboard.on('keydown-ESC', () => {
            this.resumeParentScene();
        });

        this.children.bringToTop(overlay);
        this.children.bringToTop(panel);
        this.children.bringToTop(title);
        this.children.bringToTop(subtitle);
        this.children.bringToTop(resumeButton);
    }

    resumeParentScene() {
        const parentScene = this.scene.get(this.parentSceneKey);

        if (parentScene && parentScene.resumeGameplay) {
            parentScene.resumeGameplay();
        }

        this.scene.resume(this.parentSceneKey);
        this.scene.stop();
    }

    handleShutdown() {
        if (this.input && this.input.keyboard) {
            this.input.keyboard.removeAllListeners('keydown-ESC');
        }
    }
}