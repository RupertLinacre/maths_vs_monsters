import Phaser from 'phaser';
import { MONSTER, COLORS } from '../config.js';

export default class Monster extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, difficulty = 'easy') {
        super(scene, x, y, 'pixel');

        this.difficulty = difficulty;
        this.maxHealth = MONSTER.health[difficulty];
        this.health = this.maxHealth;

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set appearance
        this.setTint(COLORS[difficulty]);
        this.setDisplaySize(MONSTER.size, MONSTER.size);

        // Set up physics body
        this.body.setSize(MONSTER.size, MONSTER.size);

        // Set movement - move left toward base
        this.body.setVelocityX(-MONSTER.speed);

        // Create health bar
        this.createHealthBar();
    }

    createHealthBar() {
        const barWidth = MONSTER.size;
        const barHeight = 6;
        const barY = -MONSTER.size / 2 - 8;

        // Background (dark)
        this.healthBarBg = this.scene.add.rectangle(
            this.x,
            this.y + barY,
            barWidth,
            barHeight,
            0x333333
        );

        // Foreground (health - green)
        this.healthBarFg = this.scene.add.rectangle(
            this.x,
            this.y + barY,
            barWidth,
            barHeight,
            0x4ade80
        );
    }

    updateHealthBar() {
        // Safety check
        if (!this.healthBarBg || !this.healthBarFg) return;

        const healthPercent = this.health / this.maxHealth;
        const barWidth = MONSTER.size * healthPercent;
        const barY = -MONSTER.size / 2 - 8;

        // Update position
        this.healthBarBg.setPosition(this.x, this.y + barY);
        this.healthBarFg.setPosition(
            this.x - (MONSTER.size - barWidth) / 2,
            this.y + barY
        );

        // Update width
        this.healthBarFg.setSize(barWidth, 6);

        // Change color based on health
        if (healthPercent <= 0.33) {
            this.healthBarFg.setFillStyle(0xf87171); // Red
        } else if (healthPercent <= 0.66) {
            this.healthBarFg.setFillStyle(0xfb923c); // Orange
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.active) {
            this.updateHealthBar();
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();

        if (this.health <= 0) {
            this.destroy();
            return true; // Monster died
        }
        return false;
    }

    destroy() {
        // Clean up health bar graphics
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.healthBarFg) this.healthBarFg.destroy();
        super.destroy();
    }
}
