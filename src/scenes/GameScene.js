import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_AREA_HEIGHT, INPUT_AREA_HEIGHT, LANES, TOWER_SLOTS_X, COLORS, TOWER, GAME, POINTS, TOWER_PROGRESSION, DIFFICULTY_SETTINGS } from '../config.js';
import Monster from '../entities/Monster.js';
import { createTower } from '../entities/towers/TowerFactory.js';
import { createProjectile } from '../entities/projectiles/ProjectileFactory.js';
import TowerSlot from '../entities/TowerSlot.js';
import WaveManager from '../systems/WaveManager.js';
import MathsManager from '../systems/MathsManager.js';
import InputBox from '../ui/InputBox.js';
import HUD from '../ui/HUD.js';
import AudioControls from '../ui/AudioControls.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Initialize game state
        this.lives = GAME.startLives;
        this.score = 0;
        this.totalMonstersKilled = 0;
        this.questionsAnswered = 0;

        // Track visible tower columns (starts with 1 column)
        this.visibleColumns = 1;

        // Create semi-transparent dark overlay to let HTML background show through
        const overlay = this.add.graphics();
        overlay.fillStyle(0x0d0d1a, 0.9);
        overlay.fillRect(0, 0, CANVAS_WIDTH, GAME_AREA_HEIGHT);
        overlay.fillStyle(0x0a0a15, 0.9);
        overlay.fillRect(0, GAME_AREA_HEIGHT, CANVAS_WIDTH, INPUT_AREA_HEIGHT);
        overlay.setDepth(-5);

        // Get selected year level from registry
        const baseYearLevel = this.registry.get('baseYearLevel') || 'year1';

        // Get selected difficulty from registry
        const difficultyKey = this.registry.get('gameDifficulty') || 'medium';
        this.difficultySettings = DIFFICULTY_SETTINGS[difficultyKey];

        // Create maths manager with selected year level
        this.mathsManager = new MathsManager(baseYearLevel);

        // Draw lane grid
        this.drawLaneGrid();

        // Create monsters group - simple group, monsters handle their own physics
        this.monsters = this.add.group();

        // Create towers group
        this.towers = this.add.group();

        // Create projectiles group - simple group, projectiles handle their own physics
        this.projectiles = this.add.group();

        // Track tower slots: slots[laneIndex][slotIndex] = tower or null
        this.slots = [];
        // Track tower slot UI (maths problems before tower spawns)
        this.towerSlots = [];
        for (let l = 0; l < LANES.length; l++) {
            this.slots[l] = [];
            this.towerSlots[l] = [];
            for (let s = 0; s < TOWER_SLOTS_X.length; s++) {
                this.slots[l][s] = null;
                this.towerSlots[l][s] = null;
            }
        }

        // Create tower slots with maths problems (towers spawn when solved)
        this.createTowerSlots();

        // Create wave manager to spawn monsters (pass difficulty settings)
        this.waveManager = new WaveManager(this, this.difficultySettings);

        // Listen for wave changes to reveal new tower columns
        this.events.on('waveChanged', this.onWaveChanged, this);

        // Set up world bounds to game area only (projectiles handle their own bouncing)
        this.physics.world.setBounds(0, 0, CANVAS_WIDTH, GAME_AREA_HEIGHT);

        // Register the collision handler - works with standard groups as long as children have physics bodies
        // The engine handles spatial optimization (QuadTree) and proper bounce/separation
        this.physics.add.collider(
            this.projectiles,
            this.monsters,
            this.handleProjectileMonsterCollision,
            null,
            this
        );

        // Create input box in the input area below the game area
        this.inputBox = new InputBox(this, CANVAS_WIDTH / 2, GAME_AREA_HEIGHT + INPUT_AREA_HEIGHT / 2);

        // Listen for answer submissions
        this.events.on('answerSubmitted', this.handleAnswerSubmit, this);

        // Listen for cluster projectile auto-explosion (at halfway across map)
        this.events.on('clusterAutoExplode', this.handleClusterAutoExplode, this);

        // Create HUD in the input area (bottom left)
        this.hud = new HUD(this, 10, GAME_AREA_HEIGHT + 10);

        // Audio controls (bottom right of game area)
        this.audioControls = new AudioControls(this);
    }

    createTowerSlots() {
        // Assign difficulties to slots in a pattern
        // First column uses simpler difficulties, cluster only appears from column 2 onwards
        const firstColumnDifficulties = ['easy', 'medium', 'hard', 'easy', 'medium'];
        const laterColumnDifficulties = ['easy', 'medium', 'hard', 'cluster', 'easy', 'medium'];

        for (let laneIndex = 0; laneIndex < LANES.length; laneIndex++) {
            for (let slotIndex = 0; slotIndex < TOWER_SLOTS_X.length; slotIndex++) {
                const x = TOWER_SLOTS_X[slotIndex];
                const y = LANES[laneIndex];

                // Use different difficulty patterns for first column vs later columns
                const slotDifficulties = slotIndex === 0 ? firstColumnDifficulties : laterColumnDifficulties;
                const difficultyIndex = (slotIndex + laneIndex) % slotDifficulties.length;
                const difficulty = slotDifficulties[difficultyIndex];

                // Create tower slot with maths problem
                const towerSlot = new TowerSlot(this, x, y, laneIndex, slotIndex, difficulty);
                const problem = this.mathsManager.generateProblemForDifficulty(difficulty);
                towerSlot.setProblem(problem);

                // Initially hide slots beyond the first column
                if (slotIndex >= this.visibleColumns) {
                    towerSlot.setVisible(false);
                }

                this.towerSlots[laneIndex][slotIndex] = towerSlot;
            }
        }
    }

    /**
     * Calculate how many tower columns should be visible for a given wave
     */
    getVisibleColumnsForWave(waveNumber) {
        const maxColumns = Math.min(TOWER_PROGRESSION.maxColumns, TOWER_SLOTS_X.length);
        // Wave 1 = 1 column, then add one every wavesPerColumn waves
        const columns = 1 + Math.floor((waveNumber - 1) / TOWER_PROGRESSION.wavesPerColumn);
        return Math.min(columns, maxColumns);
    }

    /**
     * Handle wave change event - reveal new tower columns and reset towers
     */
    onWaveChanged(waveNumber) {
        const newVisibleColumns = this.getVisibleColumnsForWave(waveNumber);

        if (newVisibleColumns > this.visibleColumns) {
            // Reveal newly visible columns
            for (let col = this.visibleColumns; col < newVisibleColumns; col++) {
                this.revealTowerColumn(col);
            }
            this.visibleColumns = newVisibleColumns;
        }

        // Reset all towers to tower slots at the start of each wave
        this.resetAllTowers();
    }

    /**
     * Reset all existing towers back to tower slots (starting state)
     */
    resetAllTowers() {
        // Get all towers and reset them
        const towers = this.towers.getChildren().slice();

        for (const tower of towers) {
            if (tower && tower.active) {
                const laneIndex = tower.lane;
                const slotIndex = tower.slotIndex;
                const difficulty = tower.difficulty;
                const x = TOWER_SLOTS_X[slotIndex];
                const y = LANES[laneIndex];

                // Clear the slot reference
                this.slots[laneIndex][slotIndex] = null;

                // Destroy the tower
                tower.destroy();

                // Create a new tower slot with a fresh problem
                const towerSlot = new TowerSlot(this, x, y, laneIndex, slotIndex, difficulty);
                const problem = this.mathsManager.generateProblemForDifficulty(difficulty);
                towerSlot.setProblem(problem);

                // Only show if within visible columns
                if (slotIndex < this.visibleColumns) {
                    towerSlot.setVisible(true);
                } else {
                    towerSlot.setVisible(false);
                }

                this.towerSlots[laneIndex][slotIndex] = towerSlot;
            }
        }

        console.log('All towers reset to tower slots for new wave');
    }

    /**
     * Reveal a column of tower slots with animation
     */
    revealTowerColumn(columnIndex) {
        for (let laneIndex = 0; laneIndex < LANES.length; laneIndex++) {
            const towerSlot = this.towerSlots[laneIndex][columnIndex];
            if (towerSlot) {
                // Fade in with a slight delay per lane for cascading effect
                towerSlot.setVisible(true);
                towerSlot.setAlpha(0);
                this.tweens.add({
                    targets: towerSlot,
                    alpha: 1,
                    duration: 300,
                    delay: laneIndex * 50,
                    ease: 'Power2'
                });
            }
        }
    }

    drawLaneGrid() {
        const graphics = this.add.graphics();

        // Draw horizontal lane divider lines within game area
        graphics.lineStyle(2, 0x333355, 0.5);
        const laneHeight = GAME_AREA_HEIGHT / LANES.length;

        for (let i = 1; i < LANES.length; i++) {
            const y = i * laneHeight;
            graphics.beginPath();
            graphics.moveTo(0, y);
            graphics.lineTo(CANVAS_WIDTH, y);
            graphics.strokePath();
        }

        // Draw a separator line between game area and input area
        graphics.lineStyle(2, 0x4466aa, 0.8);
        graphics.beginPath();
        graphics.moveTo(0, GAME_AREA_HEIGHT);
        graphics.lineTo(CANVAS_WIDTH, GAME_AREA_HEIGHT);
        graphics.strokePath();
    }

    update(time, delta) {
        // Update tower cooldowns, check for upgrade expiry, and fire
        const towers = this.towers.getChildren().slice();
        for (const tower of towers) {
            if (tower && tower.active) {
                // Check for expired upgrades
                const shouldRemove = tower.checkUpgradeExpiry(time);
                if (shouldRemove) {
                    this.removeTowerAndCreateSlot(tower);
                    continue; // Skip to next tower
                }

                tower.updateCooldown(delta);

                if (tower.canFire()) {
                    tower.fire(this); // Use polymorphic fire method
                    if (this.registry.get('soundEnabled')) {
                        this.sound.play('turret_fire');
                    }
                    tower.resetCooldown();
                }
            }
        }

        // Collision detection is handled by physics.add.collider (registered in create)

        // Check if any monster reached the left edge
        const monsters = this.monsters.getChildren().slice();
        for (const monster of monsters) {
            if (monster && monster.active && monster.x < 0) {
                this.lives--;
                monster.destroy();
                // Notify wave manager that a monster was killed (escaped counts as killed for wave tracking)
                this.waveManager.onMonsterKilled();

                // Check for game over
                if (this.lives <= 0) {
                    this.gameOver();
                    return;
                }
            }
        }

        // Update HUD with wave info
        const waveInfo = this.waveManager ? {
            wave: this.waveManager.waveNumber,
            remaining: this.waveManager.monstersPerWave - this.waveManager.monstersKilled,
            totalKills: this.getTotalKills(),
            questionsAnswered: this.questionsAnswered
        } : null;
        this.hud.update(this.score, this.lives, waveInfo);
    }

    gameOver() {
        // Store final score
        this.registry.set('finalScore', this.score);

        // Clean up
        if (this.waveManager) {
            this.waveManager.destroy();
        }

        // Transition to game over scene
        this.scene.start('GameOverScene');
    }

    handleProjectileMonsterCollision(projectile, monster) {
        // Safety checks
        if (!projectile.active || !monster.active) return;

        // Check if this is a cluster projectile
        if (projectile.projectileType === 'cluster') {
            // Spawn cluster explosion with particle burst and sub-projectiles
            this.spawnClusterExplosion(projectile, monster);
            projectile.destroy();
            return;
        }

        // Get damage from projectile (reads from config-based damage)
        const damage = projectile.getDamage();

        // Deal damage to monster
        const died = monster.takeDamage(damage);
        if (died) {
            this.score += POINTS[monster.difficulty];
            this.totalMonstersKilled++;
            // Notify wave manager that a monster was killed
            this.waveManager.onMonsterKilled();
        }

        // Projectile is destroyed on hit
        projectile.destroy();
    }

    /**
     * Spawn cluster explosion effect and sub-projectiles at the monster's position.
     * @param {ClusterProjectile} clusterProjectile - The cluster projectile that hit
     * @param {Monster} monster - The monster that was hit
     */
    spawnClusterExplosion(clusterProjectile, monster) {
        const clusterConfig = clusterProjectile.getClusterConfig();
        const count = clusterConfig.count;
        const damage = clusterConfig.damage;
        const speed = clusterConfig.speed;

        // Create particle burst effect
        this.createClusterParticles(monster.x, monster.y);

        // Spawn sub-projectiles in a radial pattern
        const angleStep = (Math.PI * 2) / count;

        for (let i = 0; i < count; i++) {
            const angle = i * angleStep;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;

            // Create sub-projectile using standard bullet type with cluster damage
            const subProjectile = createProjectile(
                this,
                monster.x,
                monster.y,
                {
                    type: 'bullet',
                    damage: damage,
                    projectileSpeed: speed
                },
                'easy', // Sub-projectiles are green like easy turret bullets
                velocityX,
                velocityY
            );

            this.projectiles.add(subProjectile);
        }
    }

    /**
     * Handle cluster projectile auto-explosion when it reaches halfway across the map.
     * @param {ClusterProjectile} clusterProjectile - The cluster projectile that triggered auto-explosion
     */
    handleClusterAutoExplode(clusterProjectile) {
        if (!clusterProjectile.active) return;

        const clusterConfig = clusterProjectile.getClusterConfig();
        const count = clusterConfig.count;
        const damage = clusterConfig.damage;
        const speed = clusterConfig.speed;

        // Use the projectile's current position for explosion
        const explosionX = clusterProjectile.x;
        const explosionY = clusterProjectile.y;

        // Create particle burst effect at projectile position
        this.createClusterParticles(explosionX, explosionY);

        // Spawn sub-projectiles in a radial pattern
        const angleStep = (Math.PI * 2) / count;

        for (let i = 0; i < count; i++) {
            const angle = i * angleStep;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;

            // Create sub-projectile using standard bullet type with cluster damage
            const subProjectile = createProjectile(
                this,
                explosionX,
                explosionY,
                {
                    type: 'bullet',
                    damage: damage,
                    projectileSpeed: speed
                },
                'easy', // Sub-projectiles are green like easy turret bullets
                velocityX,
                velocityY
            );

            this.projectiles.add(subProjectile);
        }

        // Destroy the cluster projectile
        clusterProjectile.destroy();
    }

    /**
     * Get total monsters killed across all waves
     */
    getTotalKills() {
        return this.totalMonstersKilled;
    }

    /**
     * Create particle burst effect at the cluster explosion location.
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    createClusterParticles(x, y) {
        // Create a simple particle burst using graphics
        const particleCount = 12;
        const colors = [0x9966ff, 0xbb88ff, 0xddaaff]; // Purple variations

        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = Phaser.Math.Between(100, 200);
            const color = Phaser.Utils.Array.GetRandom(colors);

            // Create a small circle as a particle
            const particle = this.add.circle(x, y, 4, color);
            particle.setDepth(10);

            // Animate the particle outward and fade
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 60,
                y: y + Math.sin(angle) * 60,
                alpha: 0,
                scale: 0.5,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }

        // Add a central flash
        const flash = this.add.circle(x, y, 20, 0xffffff, 0.8);
        flash.setDepth(9);
        this.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                flash.destroy();
            }
        });
    }

    /**
     * Remove a tower and recreate the tower slot at its position.
     * Called when a tower's upgrades all expire and it downgrades below base level.
     */
    removeTowerAndCreateSlot(tower) {
        const laneIndex = tower.lane;
        const slotIndex = tower.slotIndex;
        const difficulty = tower.difficulty;
        const x = TOWER_SLOTS_X[slotIndex];
        const y = LANES[laneIndex];

        // Clear the slot reference
        this.slots[laneIndex][slotIndex] = null;

        // Destroy the tower
        tower.destroy();

        // Create a new tower slot with a fresh problem
        const towerSlot = new TowerSlot(this, x, y, laneIndex, slotIndex, difficulty);
        const problem = this.mathsManager.generateProblemForDifficulty(difficulty);
        towerSlot.setProblem(problem);

        this.towerSlots[laneIndex][slotIndex] = towerSlot;

        console.log(`Tower removed at lane ${laneIndex}, slot ${slotIndex} - slot recreated`);
    }

    handleAnswerSubmit(answer) {
        console.log('Answer submitted:', answer);
        let anyCorrect = false;

        // First, check answer against tower slots (to spawn new towers)
        // Only check visible columns
        for (let laneIndex = 0; laneIndex < LANES.length; laneIndex++) {
            for (let slotIndex = 0; slotIndex < this.visibleColumns; slotIndex++) {
                const towerSlot = this.towerSlots[laneIndex][slotIndex];

                if (towerSlot && towerSlot.problem) {
                    const isCorrect = this.mathsManager.checkAnswer(towerSlot.problem, answer);

                    if (isCorrect) {
                        anyCorrect = true;

                        const x = TOWER_SLOTS_X[slotIndex];
                        const y = LANES[laneIndex];
                        const difficulty = towerSlot.difficulty;

                        // Destroy the tower slot
                        towerSlot.destroy();
                        this.towerSlots[laneIndex][slotIndex] = null;

                        // Create the actual tower using factory (polymorphic based on difficulty)
                        const tower = createTower(this, x, y, laneIndex, slotIndex, difficulty);
                        tower.activate(); // Tower starts active immediately

                        // Assign a new problem to the tower
                        const newProblem = this.mathsManager.generateProblemForDifficulty(difficulty);
                        tower.setProblem(newProblem);

                        this.towers.add(tower);
                        this.slots[laneIndex][slotIndex] = tower;

                        console.log('Tower spawned at lane', laneIndex, 'slot', slotIndex);

                        // Visual feedback
                        this.tweens.add({
                            targets: tower,
                            scaleX: 1.3,
                            scaleY: 1.3,
                            duration: 100,
                            yoyo: true
                        });
                    }
                }
            }
        }

        // Then, check answer against existing towers (to boost fire rate)
        const towers = this.towers.getChildren().slice();
        console.log('Checking against', towers.length, 'towers');

        for (const tower of towers) {
            try {
                if (tower.problem) {
                    console.log('Checking tower problem:', tower.problem.expression, 'answer:', tower.problem.answer);
                    const isCorrect = this.mathsManager.checkAnswer(tower.problem, answer);
                    console.log('Is correct:', isCorrect);

                    if (isCorrect) {
                        anyCorrect = true;

                        // Apply upgrade using config-driven upgrade path
                        const upgraded = tower.applyUpgrade();

                        if (upgraded) {
                            console.log(`Tower upgraded! Level: ${tower.upgradeLevel}, Stats:`, tower.stats);
                        } else {
                            console.log('Tower at max level, no upgrade applied');
                        }

                        // Assign new problem
                        const newProblem = this.mathsManager.generateProblemForDifficulty(tower.difficulty);
                        tower.setProblem(newProblem);
                        console.log('New problem assigned:', newProblem.expression);

                        // Visual feedback - pulse effect on the problem text
                        this.tweens.add({
                            targets: tower.problemText,
                            scaleX: 1.3,
                            scaleY: 1.3,
                            duration: 100,
                            yoyo: true
                        });
                    }
                }
            } catch (e) {
                console.error('Error checking answer:', e);
            }
        }

        console.log('Any correct:', anyCorrect);
        // Increment questions answered if any were correct
        if (anyCorrect) {
            this.questionsAnswered++;
        }
        // Flash input box
        this.inputBox.flash(anyCorrect);
    }
}
