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
    hard: 0xf87171,    // Red
    cluster: 0x9966ff  // Purple
};

// Monster settings
export const MONSTER = {
    size: 40,
    speed: 25,
    health: {
        easy: 1,
        medium: 4,
        hard: 9,
        cluster: 16
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
            { fireRate: 400 },   // Level 4
            { fireRate: 300 },   // Level 5
            { fireRate: 250 },   // Level 6
            { fireRate: 200 },   // Level 6
            { fireRate: 150 },   // Level 6
            { fireRate: 125 },   // Level 6
            { fireRate: 100 },   // Level 6
            { fireRate: 75 },   // Level 6
            { fireRate: 66 },   // Level 6
            { fireRate: 50 },   // Level 6
            { fireRate: 20 },   // Level 6
            { fireRate: 10 },   // Level 6
            { fireRate: 5 },   // Level 6


        ]
    },
    medium: {
        classType: 'Spread', // Maps to SpreadTower class
        name: 'Multi-Shot',
        baseStats: {
            damage: 2,
            fireRate: 2000,
            projectileCount: 2, // Initial spread count
            spreadAngle: 30,
            projectileSpeed: 300,
            range: 1000
        },
        projectileConfig: { type: 'bullet' },
        upgradeDuration: 600000,
        // Explicit upgrade path: +1 projectile count per level
        upgrades: [
            { projectileCount: 3 },
            { projectileCount: 4 },
            { projectileCount: 5 },
            { projectileCount: 6 },
            { projectileCount: 7 },
            { projectileCount: 8 },
            { projectileCount: 9 },
            { projectileCount: 10 },
            { projectileCount: 12 },
            { projectileCount: 14 },
            { projectileCount: 16 },
            { projectileCount: 18 },
            { projectileCount: 20 },

        ]
    },
    hard: {
        classType: 'Sniper', // Maps to SniperTower class
        name: 'Sniper',
        baseStats: {
            damage: 3,
            fireRate: 2000, // Slower
            projectileSpeed: 600, // 2x speed of standard
            range: 2000
        },
        projectileConfig: { type: 'bullet' },
        upgradeDuration: 600000,
        // Explicit upgrade path: Increase Damage AND Speed simultaneously
        upgrades: [
            { damage: 4, projectileSpeed: 750, fireRate: 1500 },
            { damage: 5, projectileSpeed: 900, fireRate: 1000 },
            { damage: 6, projectileSpeed: 1050, fireRate: 750 },
            { damage: 6, projectileSpeed: 1050, fireRate: 500 },
            { damage: 6, projectileSpeed: 1150, fireRate: 400 },
            { damage: 6, projectileSpeed: 1250, fireRate: 300 },
            { damage: 6, projectileSpeed: 1350, fireRate: 250 },
            { damage: 6, projectileSpeed: 1450, fireRate: 200 },
            { damage: 6, projectileSpeed: 2000, fireRate: 150 },
        ]
    },
    cluster: {
        classType: 'Cluster', // Maps to ClusterTower class
        name: 'Cluster',
        baseStats: {
            damage: 0,              // Main projectile does no damage
            fireRate: 2500,         // Slower fire rate
            projectileSpeed: 250,   // Slower main projectile
            range: 1000,
            clusterCount: 6,        // Number of sub-projectiles on explosion
            clusterDamage: 2,       // Damage per sub-projectile (same as easy turret)
            clusterSpeed: 300       // Sub-projectile speed (same as easy turret)
        },
        projectileConfig: { type: 'cluster' },
        upgradeDuration: 600000,
        // Explicit upgrade path: Increase cluster count
        upgrades: [
            { clusterCount: 9 },
            { clusterCount: 12 },
            { clusterCount: 15 },
            { clusterCount: 18 },
            { clusterCount: 21 },
            { clusterCount: 25 },
            { clusterCount: 30 },
            { clusterCount: 35 },
            { clusterCount: 45 },
            { clusterCount: 60 },
            { clusterCount: 75 },
            { clusterCount: 90 },
            { clusterCount: 100 },
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
    hard: 50,
    cluster: 100
};

// Game difficulty settings
export const DIFFICULTY_SETTINGS = {
    veryEasy: {
        label: 'Very Easy',
        waveDelay: 4000,      // 4 second delay before each wave
        speedMultiplier: 0.5
    },
    easy: {
        label: 'Easy',
        waveDelay: 2000,      // 2 second delay before each wave
        speedMultiplier: 0.75
    },
    medium: {
        label: 'Medium',
        waveDelay: 0,         // No delay
        speedMultiplier: 1.0
    },
    hard: {
        label: 'Hard',
        waveDelay: 0,         // No delay
        speedMultiplier: 1.5
    },
    veryHard: {
        label: 'Very Hard',
        waveDelay: 0,         // No delay
        speedMultiplier: 2.0
    }
};
