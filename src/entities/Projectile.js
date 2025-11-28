import Phaser from 'phaser';
import { PROJECTILE, COLORS } from '../config.js';

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, difficulty = 'easy', velocityX = 300, velocityY = 0) {
        super(scene, x, y, 'pixel');

        this.difficulty = difficulty;
        this.bounceCount = 0;
        this.maxBounces = PROJECTILE.maxBounces;

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set appearance
        this.setTint(COLORS[difficulty]);
        this.setDisplaySize(PROJECTILE.size, PROJECTILE.size);

        // Set up physics body as circle
        this.body.setCircle(PROJECTILE.size / 2);

        // Enable world bounds collision and bouncing
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(1, 1);
        this.body.onWorldBounds = true;

        // Set initial velocity
        this.body.setVelocity(velocityX, velocityY);
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

        // Destroy if off-screen (shouldn't happen with world bounds, but safety check)
        if (this.active && (this.x < -50 || this.x > 850 || this.y < -50 || this.y > 650)) {
            this.destroy();
        }
    }
}
