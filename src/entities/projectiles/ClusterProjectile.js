import Phaser from 'phaser';
import { PROJECTILE, COLORS, CANVAS_WIDTH, GAME_AREA_HEIGHT } from '../../config.js';

/**
 * ClusterProjectile - A projectile that does no direct damage but explodes
 * into a cluster of sub-projectiles when it hits a monster.
 * The sub-projectile spawning is handled by GameScene's collision handler.
 */
export default class ClusterProjectile extends Phaser.Physics.Arcade.Sprite {
    /**
     * @param {Phaser.Scene} scene - The game scene
     * @param {number} x - Starting x position
     * @param {number} y - Starting y position
     * @param {Object} config - Projectile configuration from tower
     * @param {number} config.damage - Damage dealt on hit (0 for cluster)
     * @param {number} config.projectileSpeed - Speed of the projectile
     * @param {number} config.clusterCount - Number of sub-projectiles to spawn
     * @param {number} config.clusterDamage - Damage per sub-projectile
     * @param {number} config.clusterSpeed - Speed of sub-projectiles
     * @param {string} difficulty - Difficulty level for coloring
     * @param {number} velocityX - Initial X velocity
     * @param {number} velocityY - Initial Y velocity
     */
    constructor(scene, x, y, config, difficulty = 'cluster', velocityX = 250, velocityY = 0) {
        // Use the projectile texture
        super(scene, x, y, 'projectile');

        this.config = config;
        this.difficulty = difficulty;
        this.damage = 0; // Cluster projectiles do no direct damage
        this.speed = config.projectileSpeed || 250;
        this.projectileType = 'cluster';

        // Store cluster-specific configuration
        this.clusterCount = config.clusterCount || 5;
        this.clusterDamage = config.clusterDamage || 1;
        this.clusterSpeed = config.clusterSpeed || 300;

        this.bounceCount = 0;
        this.maxBounces = PROJECTILE.maxBounces;

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set appearance - purple tint for cluster, slightly larger
        this.setTint(COLORS.cluster);
        this.setScale(1.3); // Slightly larger to distinguish from regular bullets

        // Body is automatically sized to texture
        this.body.setCircle(PROJECTILE.size / 2);

        // Don't use world bounds - we'll handle top/bottom bouncing manually
        this.body.setCollideWorldBounds(false);
        this.body.setBounce(1, 1);

        // Set initial velocity
        this.body.setVelocity(velocityX, velocityY);
    }

    /**
     * Get the damage this projectile deals (0 for cluster)
     */
    getDamage() {
        return this.damage;
    }

    /**
     * Get cluster configuration for spawning sub-projectiles
     */
    getClusterConfig() {
        return {
            count: this.clusterCount,
            damage: this.clusterDamage,
            speed: this.clusterSpeed
        };
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
