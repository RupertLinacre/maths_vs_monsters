import { TOWER_CONFIG } from '../../config.js';
import StandardTower from './StandardTower.js';
import SpreadTower from './SpreadTower.js';
import SniperTower from './SniperTower.js';

/**
 * TowerFactory - Creates the appropriate tower subclass based on difficulty.
 * Uses TOWER_CONFIG to determine which class to instantiate.
 */

// Map of class types to constructors
const TOWER_CLASSES = {
    'Standard': StandardTower,
    'Spread': SpreadTower,
    'Sniper': SniperTower
};

/**
 * Create a tower of the appropriate type for the given difficulty.
 * @param {Phaser.Scene} scene - The game scene
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} lane - Lane index
 * @param {number} slotIndex - Slot index within lane
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @returns {Tower} The created tower instance
 */
export function createTower(scene, x, y, lane, slotIndex, difficulty) {
    const config = TOWER_CONFIG[difficulty];

    if (!config) {
        console.error(`Unknown difficulty: ${difficulty}, defaulting to easy`);
        return new StandardTower(scene, x, y, lane, slotIndex, 'easy');
    }

    const TowerClass = TOWER_CLASSES[config.classType];

    if (!TowerClass) {
        console.error(`Unknown tower class type: ${config.classType}, defaulting to Standard`);
        return new StandardTower(scene, x, y, lane, slotIndex, difficulty);
    }

    return new TowerClass(scene, x, y, lane, slotIndex, difficulty);
}

export default { createTower };
