import Phaser from 'phaser';
import { TOWER, TOWER_CONFIG } from '../config.js';

/**
 * Base Tower class - data-driven tower that reads from TOWER_CONFIG.
 * Subclasses implement specific firing behaviors.
 */
export default class Tower extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, lane, slotIndex, difficulty = 'easy') {
        // Use the sprite for this difficulty level
        super(scene, x, y, `turret_${difficulty}`);

        this.difficulty = difficulty;
        this.lane = lane;
        this.slotIndex = slotIndex;
        this.isActive = false;
        this.problem = null;

        // Load configuration from TOWER_CONFIG
        this.config = TOWER_CONFIG[difficulty];

        // Initialize stats from baseStats (deep copy to avoid mutation)
        this.stats = { ...this.config.baseStats };

        // Track upgrade level
        this.upgradeLevel = 0;
        this.maxUpgradeLevel = this.config.upgrades.length;

        // Track upgrade expiry times - array of timestamps when each upgrade expires
        this.upgradeTimers = [];

        // Cooldown tracking
        this.cooldown = 0;

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true = static body

        // Scale sprite to match expected tower size
        this.setDisplaySize(TOWER.size, TOWER.size);
        // Tower starts invisible until activate() is called
        this.setAlpha(1);

        // Create problem text display below the turret
        this.problemText = scene.add.text(x, y + TOWER.size / 2 + 12, '', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Create upgrade level indicator
        this.levelText = scene.add.text(x + TOWER.size / 2 - 5, y - TOWER.size / 2 + 5, '', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#ffff00',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
    }

    setProblem(problem) {
        this.problem = problem;
        this.problemText.setText(problem.expression_short);
    }

    activate() {
        this.isActive = true;
        this.setAlpha(1); // Full opacity when active
        this.cooldown = 0;
    }

    /**
     * Apply the next upgrade from the config's upgrade path.
     * Merges upgrade changes into this.stats.
     * @returns {boolean} True if upgrade was applied, false if at max level
     */
    applyUpgrade() {
        if (this.upgradeLevel >= this.maxUpgradeLevel) {
            console.log(`Tower at max upgrade level (${this.maxUpgradeLevel})`);
            return false;
        }

        const upgradeChanges = this.config.upgrades[this.upgradeLevel];
        Object.assign(this.stats, upgradeChanges);
        this.upgradeLevel++;

        // Track when this upgrade expires
        const expiryTime = this.scene.time.now + this.config.upgradeDuration;
        this.upgradeTimers.push(expiryTime);

        // Update visual indicator
        this.updateLevelIndicator();

        console.log(`Tower upgraded to level ${this.upgradeLevel}:`, this.stats);
        return true;
    }

    /**
     * Apply a downgrade - revert to previous upgrade level.
     * Recalculates stats from base + remaining upgrades.
     * @returns {boolean} True if downgrade applied, false if at base level (tower should be removed)
     */
    applyDowngrade() {
        if (this.upgradeLevel <= 0) {
            // At base level - tower should be removed
            return false;
        }

        this.upgradeLevel--;

        // Recalculate stats from base + all upgrades up to current level
        this.stats = { ...this.config.baseStats };
        for (let i = 0; i < this.upgradeLevel; i++) {
            Object.assign(this.stats, this.config.upgrades[i]);
        }

        // Update visual indicator
        this.updateLevelIndicator();

        console.log(`Tower downgraded to level ${this.upgradeLevel}:`, this.stats);
        return true;
    }

    /**
     * Check for expired upgrades and apply downgrades.
     * @param {number} currentTime - Current game time from scene.time.now
     * @returns {boolean} True if tower should be removed (downgraded below base level)
     */
    checkUpgradeExpiry(currentTime) {
        // Process all expired timers
        while (this.upgradeTimers.length > 0 && this.upgradeTimers[0] <= currentTime) {
            this.upgradeTimers.shift(); // Remove expired timer
            
            const stillAlive = this.applyDowngrade();
            if (!stillAlive) {
                // Tower has no more upgrades and should be removed
                return true; // Signal removal
            }
        }
        return false; // Tower still alive
    }

    /**
     * Update the level indicator text
     */
    updateLevelIndicator() {
        if (this.upgradeLevel > 0) {
            // Show stars or level number
            this.levelText.setText('★'.repeat(Math.min(this.upgradeLevel, 5)));
        } else {
            // No upgrades - clear the indicator
            this.levelText.setText('');
        }
    }

    /**
     * Get merged config for creating projectiles.
     * Combines current stats with projectile config.
     */
    getProjectileConfig() {
        return {
            ...this.config.projectileConfig,
            damage: this.stats.damage,
            projectileSpeed: this.stats.projectileSpeed,
            range: this.stats.range
        };
    }

    /**
     * Find a target monster. Default behavior returns null (fire blindly).
     * Subclasses like SniperTower override this for targeting.
     * @param {Phaser.GameObjects.Group} monstersGroup - The monsters group
     * @returns {Monster|null} Target monster or null
     */
    findTarget(monstersGroup) {
        return null;
    }

    /**
     * Fire projectiles. Subclasses implement specific behavior.
     * @param {Phaser.Scene} scene - The game scene
     */
    fire(scene) {
        // Base implementation does nothing - subclasses override
        console.warn('Tower.fire() called on base class - should be overridden');
    }

    getEffectiveCooldown() {
        return this.stats.fireRate;
    }

    updateCooldown(delta) {
        if (this.isActive) {
            this.cooldown -= delta;
        }
    }

    canFire() {
        return this.active && this.isActive && this.cooldown <= 0;
    }

    resetCooldown() {
        this.cooldown = this.getEffectiveCooldown();
    }

    destroy() {
        if (this.problemText) {
            this.problemText.destroy();
            this.problemText = null;
        }
        if (this.levelText) {
            this.levelText.destroy();
            this.levelText = null;
        }
        super.destroy();
    }
}
