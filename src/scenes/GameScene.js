import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_AREA_HEIGHT, INPUT_AREA_HEIGHT, LANES, TOWER_SLOTS_X, COLORS, TOWER, GAME, POINTS, TOWER_PROGRESSION } from '../config.js';
import Monster from '../entities/Monster.js';
import Tower from '../entities/Tower.js';
import TowerSlot from '../entities/TowerSlot.js';
import Projectile from '../entities/Projectile.js';
import WaveManager from '../systems/WaveManager.js';
import MathsManager from '../systems/MathsManager.js';
import InputBox from '../ui/InputBox.js';
import HUD from '../ui/HUD.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Initialize game state
        this.lives = GAME.startLives;
        this.score = 0;

        // Track visible tower columns (starts with 1 column)
        this.visibleColumns = 1;

        // Set dark blue background
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Get selected year level from registry
        const baseYearLevel = this.registry.get('baseYearLevel') || 'year1';

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

        // Create wave manager to spawn monsters
        this.waveManager = new WaveManager(this);

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

        // Create HUD
        this.hud = new HUD(this, 10, 10);
    }

    createTowerSlots() {
        // Assign difficulties to slots in a pattern
        // Each lane has: easy, medium, hard, easy (or similar pattern)
        const slotDifficulties = ['easy', 'medium', 'hard', 'easy', 'medium'];

        for (let laneIndex = 0; laneIndex < LANES.length; laneIndex++) {
            for (let slotIndex = 0; slotIndex < TOWER_SLOTS_X.length; slotIndex++) {
                const x = TOWER_SLOTS_X[slotIndex];
                const y = LANES[laneIndex];

                // Rotate the difficulty pattern per lane for variety
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
     * Handle wave change event - reveal new tower columns if applicable
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
        // Update tower cooldowns and fire
        const towers = this.towers.getChildren().slice();
        for (const tower of towers) {
            if (tower && tower.active) {
                tower.updateCooldown(delta);

                if (tower.canFire()) {
                    this.fireTower(tower);
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

                // Check for game over
                if (this.lives <= 0) {
                    this.gameOver();
                    return;
                }
            }
        }

        // Update HUD
        this.hud.update(this.score, this.lives);
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

    fireTower(tower) {
        // Fire toward right side with slight random spread
        const velocityX = 300;
        const velocityY = Phaser.Math.Between(-30, 30); // Random spread

        try {
            const projectile = new Projectile(
                this,
                tower.x + 30, // Start slightly to the right of tower
                tower.y,
                tower.difficulty,
                velocityX,
                velocityY
            );
            this.projectiles.add(projectile);
        } catch (e) {
            console.error('Error creating projectile:', e);
        }
    }

    handleProjectileMonsterCollision(projectile, monster) {
        // DEBUG: Log collision
        console.log('COLLISION!', projectile.difficulty, 'projectile hit', monster.difficulty, 'monster');

        // Arcade Physics has already calculated the bounce and separation!
        // We just need to handle the game logic.

        // Safety checks
        if (!projectile.active || !monster.active) return;

        // Prevent multiple hits for the same projectile-monster pair (debounce)
        if (projectile.lastHitMonster === monster) return;
        projectile.lastHitMonster = monster;

        // Clear the ref after a short time so it can hit the same monster again if it bounces back
        this.time.delayedCall(500, () => {
            if (projectile.active) projectile.lastHitMonster = null;
        });

        // Check difficulty logic - only matching difficulties deal damage
        if (projectile.difficulty === monster.difficulty) {
            // Same type: inflict damage and destroy projectile
            const died = monster.takeDamage(1);
            if (died) {
                this.score += POINTS[monster.difficulty];
            }
            // Projectile disappears on successful hit
            projectile.destroy();
        } else {
            // Different type: projectile bounces off (physics already handled)
            // Apply knockback to slow/reverse the monster
            const knockbackForce = 15; // Positive = pushes monster to the right
            monster.applyKnockback(knockbackForce);

            // Register the bounce for projectile lifespan
            if (projectile.onBounce) {
                projectile.onBounce();
            }
        }
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

                        // Create the actual tower (already active)
                        const tower = new Tower(this, x, y, laneIndex, slotIndex, difficulty);
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

                        // Increase fire rate
                        tower.increaseFireRate();

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
        // Flash input box
        this.inputBox.flash(anyCorrect);
    }
}
