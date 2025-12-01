import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_AREA_HEIGHT, INPUT_AREA_HEIGHT, LANES, TOWER_SLOTS_X, COLORS, TOWER, GAME, POINTS, TOWER_PROGRESSION, DIFFICULTY_SETTINGS } from '../config.js';
import Monster from '../entities/Monster.js';
import { createTower } from '../entities/towers/TowerFactory.js';
import { createProjectile } from '../entities/projectiles/ProjectileFactory.js';
import TowerSlot from '../entities/TowerSlot.js';
import WaveManager from '../systems/WaveManager.js';
import VerbManager from '../systems/VerbManager.js';
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

        // Get selected base difficulty from registry (for verb tenses)
        const baseDifficulty = this.registry.get('baseDifficulty') || 'Beginner';

        // Get selected difficulty from registry (for game speed/wave delay)
        const difficultyKey = this.registry.get('gameDifficulty') || 'medium';
        this.difficultySettings = DIFFICULTY_SETTINGS[difficultyKey];

        // Create verb manager with selected base difficulty
        this.verbManager = new VerbManager(baseDifficulty);

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

        // Create HUD in the input area (bottom left)
        this.hud = new HUD(this, 10, GAME_AREA_HEIGHT + 10);

        // Audio controls (bottom right of game area)
        this.audioControls = new AudioControls(this);

        // Track last rotation time for staggered prompt updates
        this.lastRotationTime = 0;
    }

    createTowerSlots() {
        // Assign difficulties to slots in a pattern
        // First column uses simpler difficulties, cluster only appears from column 2 onwards
        const firstColumnDifficulties = ['easy', 'medium', 'hard', 'easy', 'medium'];
        const laterColumnDifficulties = ['easy', 'medium', 'hard', 'hard', 'easy', 'medium'];

        for (let laneIndex = 0; laneIndex < LANES.length; laneIndex++) {
            for (let slotIndex = 0; slotIndex < TOWER_SLOTS_X.length; slotIndex++) {
                const x = TOWER_SLOTS_X[slotIndex];
                const y = LANES[laneIndex];

                // Use different difficulty patterns for first column vs later columns
                const slotDifficulties = slotIndex === 0 ? firstColumnDifficulties : laterColumnDifficulties;
                const difficultyIndex = (slotIndex + laneIndex) % slotDifficulties.length;
                const difficulty = slotDifficulties[difficultyIndex];

                // Create tower slot with verb prompt
                const towerSlot = new TowerSlot(this, x, y, laneIndex, slotIndex, difficulty);
                const prompt = this.verbManager.generatePromptForDifficulty(difficulty);
                towerSlot.setPrompt(prompt);

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

                // Create a new tower slot with a fresh verb prompt
                const towerSlot = new TowerSlot(this, x, y, laneIndex, slotIndex, difficulty);
                const prompt = this.verbManager.generatePromptForDifficulty(difficulty);
                towerSlot.setPrompt(prompt);

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

        // Check for expired prompts and rotate (staggered, one at a time)
        if (time > this.lastRotationTime + GAME.rotationCooldown) {
            this.checkAndRotatePrompts(time);
        }
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

        // Create a new tower slot with a fresh verb prompt
        const towerSlot = new TowerSlot(this, x, y, laneIndex, slotIndex, difficulty);
        const prompt = this.verbManager.generatePromptForDifficulty(difficulty);
        towerSlot.setPrompt(prompt);

        this.towerSlots[laneIndex][slotIndex] = towerSlot;

        console.log(`Tower removed at lane ${laneIndex}, slot ${slotIndex} - slot recreated`);
    }

    handleAnswerSubmit(answer) {
        console.log('Answer submitted:', answer);
        let anyCorrect = false;
        let totalBonusPoints = 0;
        let feedbackShown = false;
        let allPrompts = []; // Collect all prompts for feedback

        // First, check answer against tower slots (to spawn new towers)
        // Only check visible columns
        for (let laneIndex = 0; laneIndex < LANES.length; laneIndex++) {
            for (let slotIndex = 0; slotIndex < this.visibleColumns; slotIndex++) {
                const towerSlot = this.towerSlots[laneIndex][slotIndex];

                if (towerSlot && towerSlot.prompt) {
                    allPrompts.push(towerSlot.prompt); // Collect prompt
                    const result = this.verbManager.validateAnswer(towerSlot.prompt, answer);

                    if (result.isCorrect) {
                        anyCorrect = true;
                        totalBonusPoints += result.bonusPoints;

                        // Show feedback for correct answer
                        if (!feedbackShown) {
                            this.showFeedback(result.correctForm, result.hasAccents, result.bonusPoints, true);
                            feedbackShown = true;
                        }

                        const x = TOWER_SLOTS_X[slotIndex];
                        const y = LANES[laneIndex];
                        const difficulty = towerSlot.difficulty;

                        // Destroy the tower slot
                        towerSlot.destroy();
                        this.towerSlots[laneIndex][slotIndex] = null;

                        // Create the actual tower using factory (polymorphic based on difficulty)
                        const tower = createTower(this, x, y, laneIndex, slotIndex, difficulty);
                        tower.activate(); // Tower starts active immediately

                        // Assign a new verb prompt to the tower
                        const newPrompt = this.verbManager.generatePromptForDifficulty(difficulty);
                        tower.setPrompt(newPrompt);

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
                if (tower.prompt) {
                    allPrompts.push(tower.prompt); // Collect prompt
                    console.log('Checking tower prompt:', tower.prompt.displayText);
                    const result = this.verbManager.validateAnswer(tower.prompt, answer);
                    console.log('Is correct:', result.isCorrect);

                    if (result.isCorrect) {
                        anyCorrect = true;
                        totalBonusPoints += result.bonusPoints;

                        // Show feedback for correct answer (only once per submission)
                        if (!feedbackShown) {
                            this.showFeedback(result.correctForm, result.hasAccents, result.bonusPoints, true);
                            feedbackShown = true;
                        }

                        // Apply upgrade using config-driven upgrade path
                        const upgraded = tower.applyUpgrade();

                        if (upgraded) {
                            console.log(`Tower upgraded! Level: ${tower.upgradeLevel}, Stats:`, tower.stats);
                        } else {
                            console.log('Tower at max level, no upgrade applied');
                        }

                        // Assign new verb prompt
                        const newPrompt = this.verbManager.generatePromptForDifficulty(tower.difficulty);
                        tower.setPrompt(newPrompt);
                        console.log('New prompt assigned:', newPrompt.displayText);

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
        
        // No immediate feedback on incorrect answers - let timeout rotation handle it
        
        // Increment questions answered and add bonus points if any were correct
        if (anyCorrect) {
            this.questionsAnswered++;
            if (totalBonusPoints > 0) {
                this.addScore(totalBonusPoints);
                console.log(`Bonus points awarded: ${totalBonusPoints}`);
            }
        }
        
        // Flash input box
        this.inputBox.flash(anyCorrect);
    }

    /**
     * Show feedback overlay with correct answer
     * @param {string} correctForm - Correct answer with accents
     * @param {boolean} userHadAccents - Whether user included accents
     * @param {number} bonusPoints - Bonus points awarded
     * @param {boolean} wasCorrect - Whether the answer was correct
     */
    showFeedback(correctForm, userHadAccents, bonusPoints, wasCorrect) {
        // For correct answers with bonus points, show bonus indicator
        if (wasCorrect && bonusPoints > 0) {
            this.hud.showBonus(bonusPoints);
        }
        
        // Always show the correct form as educational feedback
        // Use different colors: green for correct, yellow for incorrect
        this.inputBox.showFeedback(correctForm, wasCorrect);
    }

    /**
     * Find the oldest expired prompt and rotate it with educational feedback.
     * Only rotates ONE prompt at a time with cooldown for learning.
     * @param {number} time - Current game time from scene.time.now
     */
    checkAndRotatePrompts(time) {
        let oldestExpired = null;
        let maxAge = -1;
        const lifetime = GAME.promptLifetime;

        // Helper to check if a prompt has expired
        const checkCandidate = (candidate) => {
            if (candidate && candidate.visible && candidate.prompt && candidate.promptSetTime) {
                const age = time - candidate.promptSetTime;
                if (age > lifetime && age > maxAge) {
                    maxAge = age;
                    oldestExpired = candidate;
                }
            }
        };

        // Check all visible tower slots
        for (let l = 0; l < LANES.length; l++) {
            for (let s = 0; s < this.visibleColumns; s++) {
                checkCandidate(this.towerSlots[l][s]);
            }
        }

        // Check all active towers
        this.towers.children.each(tower => {
            if (tower.active) {
                checkCandidate(tower);
            }
        });

        // If we found an expired prompt, rotate it
        if (oldestExpired) {
            // Show the correct answer as educational feedback (red for timeout)
            const correctForm = oldestExpired.prompt.correctAnswers[0];
            this.showFeedback(correctForm, false, 0, false);

            // Generate a new prompt for this slot/tower
            const newPrompt = this.verbManager.generatePromptForDifficulty(oldestExpired.difficulty);
            oldestExpired.setPrompt(newPrompt);
            
            // Visual feedback - brief flash to show the change
            if (oldestExpired.problemText) {
                this.tweens.add({
                    targets: oldestExpired.problemText,
                    alpha: 0.3,
                    duration: 150,
                    yoyo: true
                });
            }

            // Update rotation timer to enforce cooldown
            this.lastRotationTime = time;
            console.log('Rotated expired prompt:', correctForm, '→', newPrompt.displayText);
        }
    }
}
