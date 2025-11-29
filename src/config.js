// Canvas dimensions
export const CANVAS_WIDTH = 1200;
export const GAME_AREA_HEIGHT = 600;  // Height of the playable game area (where projectiles bounce)
export const INPUT_AREA_HEIGHT = 80;  // Height reserved for input box below game area
export const CANVAS_HEIGHT = GAME_AREA_HEIGHT + INPUT_AREA_HEIGHT;  // Total canvas height

// Lane configuration - 5 lanes evenly distributed within game area
const LANE_COUNT = 5;
const LANE_HEIGHT = GAME_AREA_HEIGHT / LANE_COUNT;
export const LANES = Array.from({ length: LANE_COUNT }, (_, i) =>
    LANE_HEIGHT * i + LANE_HEIGHT / 2
);

// Tower slot positions - 5 slots per lane on the left side
const SLOT_COUNT = 5;
const SLOT_START_X = 80;
const SLOT_SPACING = 100;
export const TOWER_SLOTS_X = Array.from({ length: SLOT_COUNT }, (_, i) =>
    SLOT_START_X + i * SLOT_SPACING
);

// Tower column progression - columns unlock as waves progress
export const TOWER_PROGRESSION = {
    wavesPerColumn: 3,    // How many waves before another column appears
    maxColumns: 5         // Maximum number of tower columns (capped at SLOT_COUNT)
};

// Colors for difficulty tiers (hex values for Phaser)
export const COLORS = {
    easy: 0x4ade80,    // Green
    medium: 0xfb923c,  // Orange
    hard: 0xf87171     // Red
};

// Monster settings
export const MONSTER = {
    size: 40,
    speed: 25,
    health: {
        easy: 1,
        medium: 4,
        hard: 9
    }
};

// Tower settings (legacy - use TOWER_CONFIG for new system)
export const TOWER = {
    size: 48,
    baseFireRate: 2000  // ms between shots
};

// Data-driven tower configuration
// Maps difficulty -> archetype with explicit upgrade paths
export const TOWER_CONFIG = {
    easy: {
        classType: 'Standard', // Maps to StandardTower class
        name: 'Turret',
        baseStats: {
            damage: 1,
            fireRate: 2000, // ms
            range: 1000,
            projectileSpeed: 300
        },
        projectileConfig: { type: 'bullet' },
        upgradeDuration: 600000,
        // Explicit upgrade path: 1/n fire rate
        upgrades: [
            { fireRate: 1000 }, // Level 1 (1/2)
            { fireRate: 666 },  // Level 2 (1/3)
            { fireRate: 500 },  // Level 3 (1/4)
            { fireRate: 400 }   // Level 4 (1/5)
        ]
    },
    medium: {
        classType: 'Spread', // Maps to SpreadTower class
        name: 'Multi-Shot',
        baseStats: {
            damage: 2,
            fireRate: 2000,
            projectileCount: 3, // Initial spread count
            spreadAngle: 30,
            projectileSpeed: 300,
            range: 1000
        },
        projectileConfig: { type: 'bullet' },
        upgradeDuration: 600000,
        // Explicit upgrade path: +1 projectile count per level
        upgrades: [
            { projectileCount: 4 },
            { projectileCount: 5 },
            { projectileCount: 6 }
        ]
    },
    hard: {
        classType: 'Sniper', // Maps to SniperTower class
        name: 'Sniper',
        baseStats: {
            damage: 3,
            fireRate: 3000, // Slower
            projectileSpeed: 600, // 2x speed of standard
            range: 2000
        },
        projectileConfig: { type: 'bullet' },
        upgradeDuration: 600000,
        // Explicit upgrade path: Increase Damage AND Speed simultaneously
        upgrades: [
            { damage: 4, projectileSpeed: 750 },
            { damage: 5, projectileSpeed: 900 },
            { damage: 6, projectileSpeed: 1050 }
        ]
    }
};

// Projectile settings
export const PROJECTILE = {
    size: 12,
    speed: 300,
    maxBounces: 5,
    damage: {
        easy: 1,
        medium: 2,
        hard: 3
    }
};

// Game settings
export const GAME = {
    startLives: 10
};

// Wave configuration
export const WAVE = {
    startingMonsters: 30,           // Number of monsters in wave 1
    additionalMonstersPerWave: 5,   // How many more monsters each subsequent wave

    // Spawn rate as percentage of total wave monsters per second
    // e.g., 0.05 = 5% of wave spawns per second at start
    spawnRateStart: 0.01,           // Slow spawn rate at wave start (5% per second)
    spawnRateEnd: 0.05,             // Fast spawn rate at wave end (25% per second)

    // Difficulty distribution at start of wave [easy, medium, hard]
    difficultyStart: [0.9, 0.08, 0.02],
    // Difficulty distribution at end of wave [easy, medium, hard]
    difficultyEnd: [0.0, 0.5, 0.5]
};

// Scoring
export const POINTS = {
    easy: 10,
    medium: 25,
    hard: 50
};
