import { CANVAS_WIDTH, GAME_AREA_HEIGHT, LANES, WAVE } from '../config.js';
import Monster from '../entities/Monster.js';

export default class WaveManager {
    constructor(scene, difficultySettings = { waveDelay: 0, speedMultiplier: 1.0 }) {
        this.scene = scene;
        this.difficultySettings = difficultySettings;
        this.waveNumber = 1;
        this.monstersSpawned = 0;
        this.monstersKilled = 0;
        this.waveComplete = false;

        // Calculate monsters for current wave
        this.monstersPerWave = this.getMonstersForWave(this.waveNumber);

        // Timer for dynamic spawn intervals
        this.spawnTimer = null;
        this.scheduleNextSpawn();

        // Start first wave with delay if configured
        if (this.difficultySettings.waveDelay > 0) {
            this.showWaveNotification();
            this.scene.time.delayedCall(this.difficultySettings.waveDelay, () => {
                this.spawnRandomMonster();
            });
        } else {
            // Spawn first monster immediately
            this.spawnRandomMonster();
        }
    }

    /**
     * Get the number of monsters for a given wave
     */
    getMonstersForWave(waveNumber) {
        return WAVE.startingMonsters + (waveNumber - 1) * WAVE.additionalMonstersPerWave;
    }

    /**
     * Calculate spawn interval based on wave progress.
     * Spawn rate increases from spawnRateStart to spawnRateEnd as wave progresses.
     * Rate is specified as % of total wave monsters per second.
     * e.g., 0.05 = 5% means 5% of wave spawns per second
     * With 20 monsters at 5%, that's 1 monster/second (1000ms interval)
     * With 20 monsters at 25%, that's 5 monsters/second (200ms interval)
     */
    getSpawnInterval() {
        const progress = this.monstersSpawned / this.monstersPerWave;

        // Linearly interpolate spawn rate from start to end
        const currentRate = WAVE.spawnRateStart + progress * (WAVE.spawnRateEnd - WAVE.spawnRateStart);

        // monstersPerSecond = rate * totalMonsters
        // interval = 1000 / monstersPerSecond
        const monstersPerSecond = currentRate * this.monstersPerWave;
        const interval = 1000 / monstersPerSecond;

        console.log(`Spawn interval: progress=${(progress * 100).toFixed(1)}%, rate=${(currentRate * 100).toFixed(1)}%, monsters/sec=${monstersPerSecond.toFixed(2)}, interval=${interval.toFixed(0)}ms`);

        // Clamp to reasonable bounds (min 200ms, max 10s)
        return Math.max(200, Math.min(10000, interval));
    }

    /**
     * Schedule the next monster spawn with dynamic interval
     */
    scheduleNextSpawn() {
        if (this.spawnTimer) {
            this.spawnTimer.destroy();
        }

        if (this.monstersSpawned >= this.monstersPerWave) {
            // All monsters spawned, wait for them to be killed
            return;
        }

        const interval = this.getSpawnInterval();

        this.spawnTimer = this.scene.time.addEvent({
            delay: interval,
            callback: () => {
                this.spawnRandomMonster();
                this.scheduleNextSpawn();
            },
            callbackScope: this
        });
    }

    /**
     * Get difficulty weights based on wave progress.
     * Interpolates from difficultyStart to difficultyEnd as wave progresses.
     */
    getDifficultyWeights() {
        const progress = this.monstersSpawned / this.monstersPerWave;

        return [
            WAVE.difficultyStart[0] + progress * (WAVE.difficultyEnd[0] - WAVE.difficultyStart[0]),
            WAVE.difficultyStart[1] + progress * (WAVE.difficultyEnd[1] - WAVE.difficultyStart[1]),
            WAVE.difficultyStart[2] + progress * (WAVE.difficultyEnd[2] - WAVE.difficultyStart[2])
        ];
    }

    spawnMonster(lane, difficulty) {
        try {
            const monster = new Monster(
                this.scene,
                CANVAS_WIDTH + 20, // Spawn just off right edge
                lane,
                difficulty,
                this.difficultySettings.speedMultiplier
            );
            this.scene.monsters.add(monster);
            console.log('Monster spawned:', difficulty, 'at lane', lane, 'total monsters:', this.scene.monsters.getChildren().length);
            return monster;
        } catch (e) {
            console.error('Error spawning monster:', e);
            return null;
        }
    }

    spawnRandomMonster() {
        if (this.monstersSpawned >= this.monstersPerWave) {
            return; // Wave complete, don't spawn more
        }

        // Pick random lane
        const laneIndex = Phaser.Math.Between(0, LANES.length - 1);
        const lane = LANES[laneIndex];

        // Pick difficulty based on dynamic weights
        const difficulty = this.pickDifficulty();

        this.spawnMonster(lane, difficulty);
        this.monstersSpawned++;

        console.log(`Wave ${this.waveNumber}: Spawned ${this.monstersSpawned}/${this.monstersPerWave}`);
    }

    pickDifficulty() {
        const weights = this.getDifficultyWeights();
        const rand = Math.random();

        if (rand < weights[0]) {
            return 'easy';
        } else if (rand < weights[0] + weights[1]) {
            return 'medium';
        } else {
            return 'hard';
        }
    }

    /**
     * Called when a monster is killed. Checks if wave is complete.
     * If all monsters are dead and more need to spawn, fast-forward next spawn.
     */
    onMonsterKilled() {
        this.monstersKilled++;

        // Check if wave is complete (all spawned and all killed)
        if (this.monstersSpawned >= this.monstersPerWave &&
            this.monstersKilled >= this.monstersPerWave) {
            this.nextWave();
            return;
        }

        // Fast-forward: if no monsters alive and more to spawn, spawn immediately
        const aliveMonsters = this.scene.monsters.getChildren().filter(m => m && m.active).length;
        if (aliveMonsters === 0 && this.monstersSpawned < this.monstersPerWave) {
            // Cancel scheduled spawn and spawn immediately
            if (this.spawnTimer) {
                this.spawnTimer.destroy();
            }
            this.spawnRandomMonster();
            this.scheduleNextSpawn();
        }
    }

    nextWave() {
        this.waveNumber++;
        this.monstersSpawned = 0;
        this.monstersKilled = 0;
        this.monstersPerWave = this.getMonstersForWave(this.waveNumber);

        // Emit wave change event for other systems to respond (resets towers, reveals columns)
        this.scene.events.emit('waveChanged', this.waveNumber);

        // Show wave notification
        this.showWaveNotification();

        // Start spawning for new wave
        this.scheduleNextSpawn();

        // Spawn first monster of new wave after delay (uses difficulty delay or 1500ms default for notification)
        const spawnDelay = Math.max(1500, this.difficultySettings.waveDelay);
        this.scene.time.delayedCall(spawnDelay, () => {
            this.spawnRandomMonster();
        });
    }

    showWaveNotification() {
        const text = this.scene.add.text(CANVAS_WIDTH / 2, GAME_AREA_HEIGHT / 2, `Wave ${this.waveNumber}`, {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        this.scene.tweens.add({
            targets: text,
            alpha: 1,
            duration: 300,
            yoyo: true,
            hold: 800,
            onComplete: () => text.destroy()
        });
    }

    destroy() {
        if (this.spawnTimer) {
            this.spawnTimer.destroy();
        }
    }
}
