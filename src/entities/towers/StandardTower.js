import Tower from '../Tower.js';
import { createProjectile } from '../projectiles/ProjectileFactory.js';

/**
 * StandardTower - fires a single projectile straight to the right.
 * Upgrades increase fire rate.
 */
export default class StandardTower extends Tower {
    constructor(scene, x, y, lane, slotIndex, difficulty = 'easy') {
        super(scene, x, y, lane, slotIndex, difficulty);
    }

    /**
     * Fire a single projectile to the right with slight random spread.
     * @param {Phaser.Scene} scene - The game scene
     */
    fire(scene) {
        const config = this.getProjectileConfig();
        const velocityX = config.projectileSpeed;
        const velocityY = Phaser.Math.Between(-30, 30); // Random spread

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
