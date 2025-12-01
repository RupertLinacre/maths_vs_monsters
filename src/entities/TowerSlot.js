import Phaser from 'phaser';
import { TOWER, COLORS } from '../config.js';

/**
 * TowerSlot represents an empty tower slot with a verb conjugation prompt.
 * When the prompt is answered correctly, the slot spawns a Tower and is destroyed.
 */
export default class TowerSlot extends Phaser.GameObjects.Container {
    constructor(scene, x, y, lane, slotIndex, difficulty = 'easy') {
        super(scene, x, y);

        this.difficulty = difficulty;
        this.lane = lane;
        this.slotIndex = slotIndex;
        this.prompt = null; // Changed from problem to prompt

        // Add to scene
        scene.add.existing(this);

        // Create colored circle outline for the slot
        this.slotBg = scene.add.graphics();
        this.slotBg.lineStyle(3, COLORS[difficulty], 0.8);
        this.slotBg.strokeCircle(0, 0, TOWER.size / 2);
        this.add(this.slotBg);

        // Create prompt text display (wider for verb prompts)
        this.problemText = scene.add.text(0, 0, '', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: 90 }
        }).setOrigin(0.5);
        this.add(this.problemText);
    }

    setPrompt(prompt) {
        this.prompt = prompt;
        this.promptSetTime = this.scene.time.now; // Track when prompt was set for rotation
        // Use displayText from VerbPrompt (e.g., "hablar (yo, present)")
        this.problemText.setText(prompt.displayText);
    }

    // Keep setProblem for backward compatibility during transition
    setProblem(problem) {
        if (problem.displayText) {
            // It's actually a prompt
            this.setPrompt(problem);
        } else {
            // Old maths problem format
            this.problem = problem;
            this.problemText.setText(problem.expression_short || problem.expression);
        }
    }

    destroy() {
        // Clean up child elements
        if (this.slotBg) this.slotBg.destroy();
        if (this.problemText) this.problemText.destroy();
        super.destroy();
    }
}
