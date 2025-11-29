// Canvas dimensions
export const CANVAS_WIDTH = 1600;
export const GAME_AREA_HEIGHT = 600;  // Height of the playable game area (where projectiles bounce)
export const INPUT_AREA_HEIGHT = 80;  // Height reserved for input box below game area
export const CANVAS_HEIGHT = GAME_AREA_HEIGHT + INPUT_AREA_HEIGHT;  // Total canvas height

// Lane configuration - 5 lanes evenly distributed within game area
const LANE_COUNT = 5;
const LANE_HEIGHT = GAME_AREA_HEIGHT / LANE_COUNT;
export const LANES = Array.from({ length: LANE_COUNT }, (_, i) =>
    LANE_HEIGHT * i + LANE_HEIGHT / 2
);

// Tower slot positions - 4 slots per lane on the left side
const SLOT_COUNT = 4;
const SLOT_START_X = 80;
const SLOT_SPACING = 100;
export const TOWER_SLOTS_X = Array.from({ length: SLOT_COUNT }, (_, i) =>
    SLOT_START_X + i * SLOT_SPACING
);

// Colors for difficulty tiers (hex values for Phaser)
export const COLORS = {
    easy: 0x4ade80,    // Green
    medium: 0xfb923c,  // Orange
    hard: 0xf87171     // Red
};

// Monster settings
export const MONSTER = {
    size: 40,
    speed: 50,
    health: {
        easy: 1,
        medium: 2,
        hard: 3
    }
};

// Tower settings
export const TOWER = {
    size: 48,
    baseFireRate: 2000  // ms between shots
};

// Projectile settings
export const PROJECTILE = {
    size: 12,
    speed: 300,
    maxBounces: 5
};

// Game settings
export const GAME = {
    startLives: 10,
    spawnInterval: 3000  // ms between monster spawns
};

// Scoring
export const POINTS = {
    easy: 10,
    medium: 25,
    hard: 50
};
