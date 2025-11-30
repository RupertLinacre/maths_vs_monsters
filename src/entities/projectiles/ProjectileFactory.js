import Projectile from './Projectile.js';
import ClusterProjectile from './ClusterProjectile.js';

/**
 * ProjectileFactory - Creates projectiles based on configuration.
 * This allows for future expansion to different projectile types.
 */
export function createProjectile(scene, x, y, config, difficulty, velocityX, velocityY) {
    const type = config.type || 'bullet';

    switch (type) {
        case 'cluster':
            return new ClusterProjectile(scene, x, y, config, difficulty, velocityX, velocityY);
        case 'bullet':
        default:
            return new Projectile(scene, x, y, config, difficulty, velocityX, velocityY);
    }
}

export default { createProjectile };
