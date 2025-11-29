import Phaser from 'phaser';
import { TOWER } from '../config.js';

export default class Tower extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, lane, slotIndex, difficulty = 'easy') {
        // Use the sprite for this difficulty level
        super(scene, x, y, `turret_${difficulty}`);

        this.difficulty = difficulty;
        this.lane = lane;
        this.slotIndex = slotIndex;
        this.isActive = false;
        this.fireRate = TOWER.baseFireRate;
        this.fireRateMultiplier = 1;
        this.cooldown = 0;
        this.problem = null;

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true = static body

        // Scale sprite to match expected tower size
        this.setDisplaySize(TOWER.size, TOWER.size);
        // Tower starts invisible until activate() is called
        this.setAlpha(1);

        // Create problem text display below the turret
        this.problemText = scene.add.text(x, y + TOWER.size / 2 + 12, '', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
    }

    setProblem(problem) {
        this.problem = problem;
        this.problemText.setText(problem.expression_short);
    }

    activate() {
        this.isActive = true;
        this.setAlpha(1); // Full opacity when active
        this.cooldown = 0;
    }

    increaseFireRate() {
        this.fireRateMultiplier += 0.2;
    }

    getEffectiveCooldown() {
        return this.fireRate / this.fireRateMultiplier;
    }

    updateCooldown(delta) {
        if (this.isActive) {
            this.cooldown -= delta;
        }
    }

    canFire() {
        return this.active && this.isActive && this.cooldown <= 0;
    }

    resetCooldown() {
        this.cooldown = this.getEffectiveCooldown();
    }

    destroy() {
        if (this.problemText) {
            this.problemText.destroy();
            this.problemText = null;
        }
        super.destroy();
    }
}
