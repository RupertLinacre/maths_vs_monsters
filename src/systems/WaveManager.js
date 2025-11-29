import { CANVAS_WIDTH, LANES, GAME } from '../config.js';
import Monster from '../entities/Monster.js';

export default class WaveManager {
    constructor(scene) {
        this.scene = scene;
        this.spawnInterval = GAME.spawnInterval;
        this.waveNumber = 1;
        this.monstersSpawned = 0;
        this.monstersPerWave = 10;

        // Difficulty weights (easy, medium, hard)
        this.difficultyWeights = [0.7, 0.25, 0.05];

        // Start spawning monsters
        this.spawnTimer = scene.time.addEvent({
            delay: this.spawnInterval,
            callback: this.spawnRandomMonster,
            callbackScope: this,
            loop: true
        });

        // Spawn first monster immediately for testing
        this.spawnRandomMonster();
    }

    spawnMonster(lane, difficulty) {
        try {
            const monster = new Monster(
                this.scene,
                CANVAS_WIDTH + 20, // Spawn just off right edge
                lane,
                difficulty
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
        // Pick random lane
        const laneIndex = Phaser.Math.Between(0, LANES.length - 1);
        const lane = LANES[laneIndex];

        // Pick difficulty based on weights
        const difficulty = this.pickDifficulty();

        this.spawnMonster(lane, difficulty);
        this.monstersSpawned++;

        // Check for wave progression
        if (this.monstersSpawned >= this.monstersPerWave) {
            this.nextWave();
        }
    }

    pickDifficulty() {
        const rand = Math.random();
        if (rand < this.difficultyWeights[0]) {
            return 'easy';
        } else if (rand < this.difficultyWeights[0] + this.difficultyWeights[1]) {
            return 'medium';
        } else {
            return 'hard';
        }
    }

    nextWave() {
        this.waveNumber++;
        this.monstersSpawned = 0;

        // Increase difficulty
        // Reduce easy probability, increase hard probability
        this.difficultyWeights[0] = Math.max(0.3, this.difficultyWeights[0] - 0.05);
        this.difficultyWeights[2] = Math.min(0.4, this.difficultyWeights[2] + 0.05);
        this.difficultyWeights[1] = 1 - this.difficultyWeights[0] - this.difficultyWeights[2];

        // Increase spawn rate (reduce interval)
        this.spawnInterval = Math.max(1000, this.spawnInterval - 200);

        // Update spawn timer
        this.spawnTimer.delay = this.spawnInterval;

        // Emit wave change event for other systems to respond
        this.scene.events.emit('waveChanged', this.waveNumber);

        // Show wave notification
        this.showWaveNotification();
    }

    showWaveNotification() {
        const text = this.scene.add.text(400, 300, `Wave ${this.waveNumber}`, {
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
