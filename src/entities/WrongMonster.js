import Phaser from 'phaser';
import { WRONG_MONSTER, MONSTER, GAME_AREA_HEIGHT } from '../config.js';

// Static counter for unique monster IDs
let wrongMonsterIdCounter = 0;

/**
 * WrongMonster - spawned when player answers incorrectly.
 * Moves at an angle and bounces off top/bottom walls.
 */
export default class WrongMonster extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, angleDegrees = 45, baseSpeedMultiplier = 1.0, wrongSpeedMultiplier = 2.0, health = 3) {
        // Use the wrong monster sprite
        super(scene, x, y, 'monster_wrong');

        // Assign unique monster ID for targeting
        this.monsterId = ++wrongMonsterIdCounter;

        this.difficulty = 'wrong';
        this.maxHealth = health;
        this.health = this.maxHealth;

        // Combined speed: base game difficulty * wrong monster multiplier
        this.speedMultiplier = baseSpeedMultiplier * wrongSpeedMultiplier;

        // Store angle for bouncing calculations
        this.moveAngle = angleDegrees;

        // Effects array for future projectile types (slow, poison, etc.)
        this.effects = [];

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set immovable so projectiles bounce off without pushing the monster
        this.body.setImmovable(true);

        // Scale sprite to match expected monster size and refresh physics body
        const size = WRONG_MONSTER.size || MONSTER.size;
        this.setDisplaySize(size, size);
        this.refreshBody();

        // Calculate velocity based on angle
        // Angle 0 = straight left, positive = downward component, negative = upward component
        const angleRadians = Phaser.Math.DegToRad(angleDegrees);
        const baseSpeed = MONSTER.speed * this.speedMultiplier;

        // Moving left (negative X) with vertical component based on angle
        this.body.setVelocity(
            -baseSpeed * Math.cos(angleRadians),  // X velocity (always moving left)
            baseSpeed * Math.sin(angleRadians)    // Y velocity (up or down based on angle)
        );

        // Do NOT use setCollideWorldBounds - it would bounce off left/right too
        // We handle top/bottom bouncing manually in preUpdate
        this.body.setCollideWorldBounds(false);

        // Create health bar
        this.createHealthBar();
    }

    createHealthBar() {
        const size = WRONG_MONSTER.size || MONSTER.size;
        const barWidth = size;
        const barHeight = 6;
        const barY = -size / 2 - 8;

        // Background (dark)
        this.healthBarBg = this.scene.add.rectangle(
            this.x,
            this.y + barY,
            barWidth,
            barHeight,
            0x333333
        );

        // Foreground (health - red for wrong monsters)
        this.healthBarFg = this.scene.add.rectangle(
            this.x,
            this.y + barY,
            barWidth,
            barHeight,
            0xff4444  // Red color for wrong monsters
        );
    }

    updateHealthBar() {
        // Safety check
        if (!this.healthBarBg || !this.healthBarFg) return;

        const size = WRONG_MONSTER.size || MONSTER.size;
        const healthPercent = this.health / this.maxHealth;
        const barWidth = size * healthPercent;
        const barY = -size / 2 - 8;

        // Update position
        this.healthBarBg.setPosition(this.x, this.y + barY);
        this.healthBarFg.setPosition(
            this.x - (size - barWidth) / 2,
            this.y + barY
        );

        // Update width
        this.healthBarFg.setSize(barWidth, 6);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (this.active) {
            this.updateHealthBar();

            // Manual boundary check for top/bottom bouncing within game area
            // (world bounds might include the input area, so we check manually)
            const size = WRONG_MONSTER.size || MONSTER.size;
            const halfSize = size / 2;

            // Bounce off top
            if (this.y < halfSize) {
                this.y = halfSize;
                this.body.velocity.y = Math.abs(this.body.velocity.y);
            }

            // Bounce off bottom of game area (not canvas bottom)
            if (this.y > GAME_AREA_HEIGHT - halfSize) {
                this.y = GAME_AREA_HEIGHT - halfSize;
                this.body.velocity.y = -Math.abs(this.body.velocity.y);
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();

        if (this.health <= 0) {
            if (this.scene.registry.get('soundEnabled')) {
                this.scene.sound.play('monster_death');
            }
            this.destroy();
            return true; // Monster died
        }
        if (this.scene.registry.get('soundEnabled')) {
            this.scene.sound.play('monster_hurt');
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
