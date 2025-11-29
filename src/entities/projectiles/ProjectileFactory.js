import Projectile from './Projectile.js';

/**
 * ProjectileFactory - Creates projectiles based on configuration.
 * This allows for future expansion to different projectile types.
 */
export function createProjectile(scene, x, y, config, difficulty, velocityX, velocityY) {
    const type = config.type || 'bullet';

    // For now, all projectiles use the base Projectile class
    // In the future, we can add different projectile types here
    switch (type) {
        case 'bullet':
        default:
            return new Projectile(scene, x, y, config, difficulty, velocityX, velocityY);
    }
}

export default { createProjectile };
