import Phaser from 'phaser';
import { PROJECTILE, COLORS, CANVAS_WIDTH, GAME_AREA_HEIGHT } from '../../config.js';

/**
 * Base Projectile class - handles physics, bouncing, and rendering.
 * Reads damage and speed from the passed config object.
 */
export default class Projectile extends Phaser.Physics.Arcade.Sprite {
    /**
     * @param {Phaser.Scene} scene - The game scene
     * @param {number} x - Starting x position
     * @param {number} y - Starting y position
     * @param {Object} config - Projectile configuration from tower
     * @param {number} config.damage - Damage dealt on hit
     * @param {number} config.projectileSpeed - Speed of the projectile
     * @param {string} config.type - Type of projectile (bullet, etc.)
     * @param {string} difficulty - Difficulty level for coloring
     * @param {number} velocityX - Initial X velocity
     * @param {number} velocityY - Initial Y velocity
     */
    constructor(scene, x, y, config, difficulty = 'easy', velocityX = 300, velocityY = 0) {
        // Use the properly-sized projectile texture
        super(scene, x, y, 'projectile');

        this.config = config;
        this.difficulty = difficulty;
        this.damage = config.damage || PROJECTILE.damage[difficulty] || 1;
        this.speed = config.projectileSpeed || PROJECTILE.speed;
        this.projectileType = config.type || 'bullet';

        this.bounceCount = 0;
        this.maxBounces = PROJECTILE.maxBounces;

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set appearance - just tint, no scaling needed
        this.setTint(COLORS[difficulty]);

        // Body is automatically sized to texture
        // Make it a circle for better bounce physics
        this.body.setCircle(PROJECTILE.size / 2);

        // Don't use world bounds - we'll handle top/bottom bouncing manually
        // This allows projectiles to fly off left/right edges
        this.body.setCollideWorldBounds(false);
        this.body.setBounce(1, 1);

        // Set initial velocity
        this.body.setVelocity(velocityX, velocityY);
    }

    /**
     * Get the damage this projectile deals
     */
    getDamage() {
        return this.damage;
    }

    onBounce() {
        if (!this.active) return; // Already destroyed

        this.bounceCount++;
        if (this.bounceCount >= this.maxBounces) {
            this.destroy();
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (!this.active || !this.body) return;

        const radius = PROJECTILE.size / 2;

        // Manual top/bottom boundary bouncing (within game area only)
        if (this.y - radius <= 0) {
            // Hit top edge
            this.y = radius;
            this.body.velocity.y = Math.abs(this.body.velocity.y);
            this.onBounce();
        } else if (this.y + radius >= GAME_AREA_HEIGHT) {
            // Hit bottom edge of game area (not full canvas)
            this.y = GAME_AREA_HEIGHT - radius;
            this.body.velocity.y = -Math.abs(this.body.velocity.y);
            this.onBounce();
        }

        // Destroy if off-screen left/right (they fly through these edges)
        if (this.x < -50 || this.x > CANVAS_WIDTH + 50) {
            this.destroy();
        }
    }
}
