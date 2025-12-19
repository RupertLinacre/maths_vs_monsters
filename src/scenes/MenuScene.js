import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, DIFFICULTY_SETTINGS } from '../config.js';
import { YEAR_LEVELS, PROBLEM_TYPE_OPTIONS } from '../systems/MathsManager.js';
import AudioControls from '../ui/AudioControls.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Create semi-transparent dark overlay to let HTML background show through
        const overlay = this.add.graphics();
        overlay.fillStyle(0x0d0d1a, 0.9);
        overlay.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        overlay.setDepth(-5);

        // Game title
        this.add.text(CANVAS_WIDTH / 2, 100, 'MATHS vs MONSTERS', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#4ade80',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(CANVAS_WIDTH / 2, 160, 'Solve problems. Defend your base.', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#888899'
        }).setOrigin(0.5);

        // Year level label
        this.add.text(CANVAS_WIDTH / 2, 210, 'Select Year Level:', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Create year level buttons
        this.selectedYearIndex = 1; // Default to Year 1
        this.yearButtons = [];

        // Create difficulty selection
        this.selectedDifficultyKey = 'medium'; // Default to Medium
        this.difficultyButtons = [];

        const yearLabels = ['Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'];
        const buttonWidth = 90;
        const buttonSpacing = 10;
        const totalWidth = yearLabels.length * buttonWidth + (yearLabels.length - 1) * buttonSpacing;
        const startX = (CANVAS_WIDTH - totalWidth) / 2 + buttonWidth / 2;

        yearLabels.forEach((label, index) => {
            const x = startX + index * (buttonWidth + buttonSpacing);
            const y = 260;

            const btn = this.add.text(x, y, label, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: index === this.selectedYearIndex ? '#1a1a2e' : '#ffffff',
                backgroundColor: index === this.selectedYearIndex ? '#4ade80' : '#333355',
                padding: { x: 10, y: 8 }
            }).setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            btn.yearIndex = index;

            btn.on('pointerover', () => {
                if (index !== this.selectedYearIndex) {
                    btn.setStyle({ backgroundColor: '#444466' });
                }
            });

            btn.on('pointerout', () => {
                if (index !== this.selectedYearIndex) {
                    btn.setStyle({ backgroundColor: '#333355' });
                }
            });

            btn.on('pointerdown', () => {
                this.selectYear(index);
            });

            this.yearButtons.push(btn);
        });

        // Difficulty label
        this.add.text(CANVAS_WIDTH / 2, 320, 'Select Difficulty:', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Create difficulty buttons
        const difficultyKeys = Object.keys(DIFFICULTY_SETTINGS);
        const diffButtonWidth = 100;
        const diffButtonSpacing = 10;
        const diffTotalWidth = difficultyKeys.length * diffButtonWidth + (difficultyKeys.length - 1) * diffButtonSpacing;
        const diffStartX = (CANVAS_WIDTH - diffTotalWidth) / 2 + diffButtonWidth / 2;

        difficultyKeys.forEach((key, index) => {
            const setting = DIFFICULTY_SETTINGS[key];
            const x = diffStartX + index * (diffButtonWidth + diffButtonSpacing);
            const y = 360;

            const isSelected = key === this.selectedDifficultyKey;
            const btn = this.add.text(x, y, setting.label, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: isSelected ? '#1a1a2e' : '#ffffff',
                backgroundColor: isSelected ? '#fbbf24' : '#333355',
                padding: { x: 10, y: 8 }
            }).setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            btn.difficultyKey = key;

            btn.on('pointerover', () => {
                if (key !== this.selectedDifficultyKey) {
                    btn.setStyle({ backgroundColor: '#444466' });
                }
            });

            btn.on('pointerout', () => {
                if (key !== this.selectedDifficultyKey) {
                    btn.setStyle({ backgroundColor: '#333355' });
                }
            });

            btn.on('pointerdown', () => {
                this.selectDifficulty(key);
            });

            this.difficultyButtons.push(btn);
        });

        // Problem type label
        this.add.text(CANVAS_WIDTH / 2, 420, 'Select Problem Type:', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Create problem type buttons
        this.selectedProblemType = 'all';
        this.problemTypeButtons = [];

        const typeButtonWidth = 120;
        const typeButtonSpacing = 10;
        const typeButtonsPerRow = 5;
        const typeRowSpacing = 40;

        PROBLEM_TYPE_OPTIONS.forEach((option, index) => {
            const row = Math.floor(index / typeButtonsPerRow);
            const col = index % typeButtonsPerRow;
            const remaining = PROBLEM_TYPE_OPTIONS.length - row * typeButtonsPerRow;
            const rowCount = Math.min(typeButtonsPerRow, remaining);
            const rowWidth = rowCount * typeButtonWidth + (rowCount - 1) * typeButtonSpacing;
            const rowStartX = (CANVAS_WIDTH - rowWidth) / 2 + typeButtonWidth / 2;

            const x = rowStartX + col * (typeButtonWidth + typeButtonSpacing);
            const y = 460 + row * typeRowSpacing;

            const isSelected = option.key === this.selectedProblemType;
            const btn = this.add.text(x, y, option.label, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: isSelected ? '#1a1a2e' : '#ffffff',
                backgroundColor: isSelected ? '#60a5fa' : '#333355',
                padding: { x: 10, y: 8 }
            }).setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            btn.problemTypeKey = option.key;

            btn.on('pointerover', () => {
                if (option.key !== this.selectedProblemType) {
                    btn.setStyle({ backgroundColor: '#444466' });
                }
            });

            btn.on('pointerout', () => {
                if (option.key !== this.selectedProblemType) {
                    btn.setStyle({ backgroundColor: '#333355' });
                }
            });

            btn.on('pointerdown', () => {
                this.selectProblemType(option.key);
            });

            this.problemTypeButtons.push(btn);
        });

        // Start Game button
        const startBtn = this.add.text(CANVAS_WIDTH / 2, 560, 'START GAME', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#4ade80',
            padding: { x: 30, y: 15 }
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        startBtn.on('pointerover', () => {
            startBtn.setStyle({ backgroundColor: '#5bef91' });
        });

        startBtn.on('pointerout', () => {
            startBtn.setStyle({ backgroundColor: '#4ade80' });
        });

        startBtn.on('pointerdown', () => {
            this.startGame();
        });

        // Instructions
        this.add.text(CANVAS_WIDTH / 2, 620,
            'Answer maths questions to activate towers.  Answer more questions to powerup towers', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#2fff00ff'
        }).setOrigin(0.5);

        // Audio controls (bottom right)
        this.audioControls = new AudioControls(this);
    }

    selectYear(index) {
        this.selectedYearIndex = index;

        // Update button styles
        this.yearButtons.forEach((btn, i) => {
            if (i === index) {
                btn.setStyle({
                    color: '#1a1a2e',
                    backgroundColor: '#4ade80'
                });
            } else {
                btn.setStyle({
                    color: '#ffffff',
                    backgroundColor: '#333355'
                });
            }
        });
    }

    selectDifficulty(key) {
        this.selectedDifficultyKey = key;

        // Update button styles
        this.difficultyButtons.forEach((btn) => {
            if (btn.difficultyKey === key) {
                btn.setStyle({
                    color: '#1a1a2e',
                    backgroundColor: '#fbbf24'
                });
            } else {
                btn.setStyle({
                    color: '#ffffff',
                    backgroundColor: '#333355'
                });
            }
        });
    }

    selectProblemType(key) {
        this.selectedProblemType = key;

        this.problemTypeButtons.forEach((btn) => {
            if (btn.problemTypeKey === key) {
                btn.setStyle({
                    color: '#1a1a2e',
                    backgroundColor: '#60a5fa'
                });
            } else {
                btn.setStyle({
                    color: '#ffffff',
                    backgroundColor: '#333355'
                });
            }
        });
    }

    startGame() {
        // Store selected year level in registry
        this.registry.set('baseYearLevel', YEAR_LEVELS[this.selectedYearIndex]);

        // Store selected difficulty in registry
        this.registry.set('gameDifficulty', this.selectedDifficultyKey);

        // Store selected problem type in registry
        this.registry.set('problemType', this.selectedProblemType);

        // Start game scene
        this.scene.start('GameScene');
    }
}
