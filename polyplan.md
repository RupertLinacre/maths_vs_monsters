Here is the updated implementation plan.

./plan.md
---
# Architectural Refactor Plan: Data-Driven Polymorphism

## 1. Project Aims & Objectives

The primary goal of this refactor is to transition the game from a **hard-coded, logic-heavy architecture** to a **flexible, configuration-driven system**.

Currently, game balance and logic are scattered across classes using conditional statements (e.g., `if (difficulty === 'medium')`). This makes it difficult to tune gameplay or add new variations.

**Specific Objectives:**
1.  **Centralized Control:** Move all gameplay constants (damage, speed, fire rates) and behavior definitions into `config.js`. This allows balancing the game without touching the engine code.
2.  **Explicit Progression:** Replace mathematical upgrade formulas (e.g., `rate * 1.2`) with **discrete, hand-crafted upgrade paths**. We want exact control over what "Level 2" means for every tower type.
3.  **Polymorphic Design:** Decouple the **Tower** (which determines *how* shots are fired) from the **Projectile** (which determines *what* happens on impact).
4.  **Persistence:** Ensure that a tower's specific configuration state persists until explicitly overridden by the next upgrade step.

---

## Phase 1: The Configuration Schema
*Goal: Define the "Brain" of the system. This file acts as the single source of truth for game balance.*

### Step 1.1: Define TOWER_CONFIG
**Action:** Replace the old `TOWER` constants in `src/config.js` with a robust `TOWER_CONFIG` object.

Structure the config to map Difficulty -> Archetype.

```javascript
// src/config.js logic outline
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
            projectileSpeed: 300
        },
        projectileConfig: { type: 'bullet' },
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
        // Explicit upgrade path: Increase Damage AND Speed simultaneously
        upgrades: [
            { damage: 4, projectileSpeed: 750 },
            { damage: 5, projectileSpeed: 900 },
            { damage: 6, projectileSpeed: 1050 }
        ]
    }
};
```

---

## Phase 2: The Foundation (Entities)
*Goal: Ensure Monsters and Projectiles can support the data coming from the config.*

### Step 2.1: Monster Preparation
**Action:** Update `Monster.js`.
1.  Add `monsterId` (static counter + instance var) to allow targeting logic to identify specific monsters.
2.  (Optional but recommended) Add basic `effects` array structure to support future projectile types.

### Step 2.2: Projectile System
**Action:**
1.  Create `src/entities/projectiles/Projectile.js` (Abstract Base) and `ProjectileFactory.js`.
2.  Ensure `Projectile` constructor accepts a merged config object (combining `baseStats` and `projectileConfig` from the tower).
    *   *Crucial:* Projectile must read `damage` and `speed` from this passed config, not from global constants.

---

## Phase 3: The Data-Driven Tower
*Goal: Create a Tower class that acts as a state machine for the configuration.*

### Step 3.1: Base Tower Class Refactor
**Action:** Rewrite `src/entities/Tower.js`.
1.  **Constructor:** Accepts `difficulty` (easy/medium/hard).
2.  **Initialization:**
    *   Look up `TOWER_CONFIG[difficulty]`.
    *   Initialize `this.stats = { ...config.baseStats }`.
    *   Initialize `this.upgradeLevel = 0`.
    *   Initialize `this.maxUpgradeLevel = config.upgrades.length`.
3.  **Upgrade Method:**
    *   Create `applyUpgrade()`.
    *   Check `if (this.upgradeLevel < this.maxUpgradeLevel)`.
    *   Get the specific upgrade object: `const changes = config.upgrades[this.upgradeLevel]`.
    *   Merge changes: `Object.assign(this.stats, changes)`.
    *   Increment `this.upgradeLevel`.
4.  **Helper:** `getProjectileConfig()` returns a merged object of `this.stats` and `config.projectileConfig`.

### Step 3.2: Targeting Logic (For Sniper)
**Action:** Add targeting method to `Tower.js`.
1.  Add `findTarget(monstersGroup)`.
2.  Default behavior (Standard/Spread): Return `null` (implies "fire blindly to the right").
3.  We will override this in the Sniper subclass to find the closest active monster.

---

## Phase 4: Tower Subclasses & Factory
*Goal: Implement the specific firing behaviors (not stats).*

### Step 4.1: Standard Tower
**Action:** Create `src/entities/towers/StandardTower.js`.
1.  `fire(scene)`: Gets config. Creates 1 projectile. Velocity `(stats.projectileSpeed, 0)`.

### Step 4.2: Spread Tower
**Action:** Create `src/entities/towers/SpreadTower.js`.
1.  `fire(scene)`:
    *   Read `this.stats.projectileCount` and `this.stats.spreadAngle`.
    *   Loop `count` times. Calculate angle offsets.
    *   Create projectiles with calculated velocities.

### Step 4.3: Sniper Tower
**Action:** Create `src/entities/towers/SniperTower.js`.
1.  Override `findTarget(monsters)`:
    *   Iterate monsters. Find the one with smallest `distance` to tower. Return that monster.
2.  `fire(scene)`:
    *   Call `this.findTarget`.
    *   If no target, do nothing (or fire straight).
    *   If target exists, calculate angle to target using `Phaser.Math.Angle.Between`.
    *   Fire single projectile at that angle with `this.stats.projectileSpeed`.

### Step 4.4: Tower Factory
**Action:** Create `src/entities/towers/TowerFactory.js`.
1.  Import config and subclasses.
2.  Function `createTower(scene, x, y, lane, slot, difficulty)`.
3.  Look up `TOWER_CONFIG[difficulty].classType`.
4.  Switch/Case to instantiate the correct class (`Standard`, `Spread`, or `Sniper`).

---

## Phase 5: Integration
*Goal: Connect the new system to the Game Loop.*

### Step 5.1: Spawn Logic
**Action:** Update `GameScene.js`.
1.  Use `TowerFactory.createTower` when a slot is solved.

### Step 5.2: Firing Loop
**Action:** Update `GameScene.update()`.
1.  Iterate towers.
2.  Call `tower.updateCooldown(delta)`.
3.  If `canFire`, call `tower.fire(this)`. *Note: Pass `this` (the scene) so the tower can access `this.monsters` for targeting.*

### Step 5.3: Upgrade Event
**Action:** Update `handleAnswerSubmit` in `GameScene.js`.
1.  When a question is answered for an existing tower:
    *   Call `tower.applyUpgrade()`.
    *   (Optional) Update the Tower UI (e.g., change color or show level star) to reflect the new state.

---

## Verification Checklist

1.  **Config Check:** Do Easy towers start at 2000ms fire rate?
2.  **Upgrade Check (Easy):** Answer a question. Does fire rate double (1000ms)? Answer again. Does it hit 666ms?
3.  **Spread Check (Medium):** Do they fire 3 shots initially? Answer a question. Do they fire 4?
4.  **Sniper Check (Hard):** Do they look for the closest enemy? Do the projectiles move fast (600)?
5.  **Multi-Stat Upgrade Check (Hard):** Answer a question for a Sniper. Does Damage go up AND Speed go up simultaneously?
6.  **Cap Check:** Answer 10 questions on a tower. It should stop upgrading after the defined array in `config.js` runs out, without crashing.