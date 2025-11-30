import Tower from '../Tower.js';
import { createProjectile } from '../projectiles/ProjectileFactory.js';

/**
 * ClusterTower - fires a single projectile that does no direct damage,
 * but explodes into a cluster of sub-projectiles when it hits a monster.
 * Upgrades increase the number of sub-projectiles.
 */
export default class ClusterTower extends Tower {
    constructor(scene, x, y, lane, slotIndex, difficulty = 'cluster') {
        super(scene, x, y, lane, slotIndex, difficulty);
    }

    /**
     * Fire a single cluster projectile to the right.
     * @param {Phaser.Scene} scene - The game scene
     */
    fire(scene) {
        const config = this.getProjectileConfig();
        const velocityX = config.projectileSpeed;
        const velocityY = Phaser.Math.Between(-20, 20); // Slight random spread

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
