import Phaser from 'phaser';
import Tower from '../Tower.js';
import { createProjectile } from '../projectiles/ProjectileFactory.js';

/**
 * SniperTower - fires a single high-speed projectile at the closest enemy.
 * Upgrades increase damage and projectile speed.
 */
export default class SniperTower extends Tower {
    constructor(scene, x, y, lane, slotIndex, difficulty = 'hard') {
        super(scene, x, y, lane, slotIndex, difficulty);
    }

    /**
     * Find the closest active monster to this tower.
     * @param {Phaser.GameObjects.Group} monstersGroup - The monsters group
     * @returns {Monster|null} The closest monster or null if none exist
     */
    findTarget(monstersGroup) {
        if (!monstersGroup) return null;

        const monsters = monstersGroup.getChildren();
        let closestMonster = null;
        let closestDistance = Infinity;

        for (const monster of monsters) {
            if (!monster.active) continue;

            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                monster.x, monster.y
            );

            // Check if within range and closer than current closest
            if (distance <= this.stats.range && distance < closestDistance) {
                closestDistance = distance;
                closestMonster = monster;
            }
        }

        return closestMonster;
    }

    /**
     * Fire a high-speed projectile at the closest enemy.
     * If no target, fires straight ahead.
     * @param {Phaser.Scene} scene - The game scene
     */
    fire(scene) {
        const config = this.getProjectileConfig();
        const speed = config.projectileSpeed;

        // Find closest target
        const target = this.findTarget(scene.monsters);

        let velocityX, velocityY;

        if (target) {
            // Calculate angle to target
            const angle = Phaser.Math.Angle.Between(
                this.x, this.y,
                target.x, target.y
            );

            velocityX = Math.cos(angle) * speed;
            velocityY = Math.sin(angle) * speed;
        } else {
            // No target - fire straight to the right
            velocityX = speed;
            velocityY = 0;
        }

        const projectile = createProjectile(
            scene,
            this.x + 30, // Start slightly to the right of tower
            this.y,
            config,
            this.difficulty,
            velocityX,
            velocityY
        );

        scene.projectiles.add(projectile);
    }
}
