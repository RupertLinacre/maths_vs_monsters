# Maths vs Monsters - Implementation Plan

A lane-based tower defence game where solving maths problems activates towers that shoot bouncing balls at monsters.

## Tech Stack

| Component | Choice |
|-----------|--------|
| **Build Tool** | Vite |
| **Game Engine** | Phaser 3 with Arcade Physics |
| **Maths Problems** | `maths-game-problem-generator` |
| **Hosting** | Static (GitHub Pages / Netlify) |

## Game Overview

- **Style**: Plants vs Zombies lane-based layout
- **Monsters**: Spawn from right, walk left across lanes (squares: green/orange/red by difficulty)
- **Towers**: Fixed slots per lane (circles: green/orange/red by difficulty)
- **Projectiles**: Balls that bounce/deflect off monsters, dealing damage on each hit
- **Core mechanic**: Solve maths problems to activate towers and increase fire rate

### Game Mechanics

#### Difficulty Tiers
| Tier | Colour | Monster Health | Points | Year Level Offset |
|------|--------|----------------|--------|-------------------|
| Easy | Green | 1 HP | 10 | Base year |
| Medium | Orange | 2 HP | 25 | Base year + 1 |
| Hard | Red | 3 HP | 50 | Base year + 2 |

#### User input

- **Input box within phasar game allows maths questions to be answereed**.  The game handles working out whether the answer is correct for any of the towers and which ones

#### Monsters
- **Spawn**: From right edge, random lane, every 3 seconds (speeds up over time)
- **Movement**: Walk left at constant speed (~50 px/sec)
- **Damage**: Reach left edge = lose 1 life
- **Difficulty matching**: Only damaged by projectiles of same difficulty tier.

#### Towers
- **Placement**: Click empty slot to cycle through: empty → easy → medium → hard → empty
- **Visuals**: Maths problem displayed on top of tower
- **Activation**: Inactive until maths problem solved; permanently active until maths problem
- **Fire rate**: Starts at fire 1 ball per 2 seconds.  each correct answer adds +0.2x multiplier
- **Targeting**: Fires toward right side of own lane with slight random spread
- **Difficulty matching**: Only damages monsters of same difficulty tier.  'Bounces' off other monsters (y speed inverse)

#### Projectiles
- **Damage**: 1 HP per hit
- **Bouncing**: Elastic bounce off monsters and screen edges
- **Lifespan**: Destroyed after 5 bounces or leaving screen
- **Multi-hit**: Can damage multiple monsters in one flight (same difficulty only)

#### Scoring
- **Kill points**: Easy=10, Medium=25, Hard=50
- **Multi-hit bonus**: 2x points for each monster killed by same projectile after the first

#### Player State
- **Lives**: Start with 10; lose 1 when monster reaches left edge
- **Game over**: Lives reach 0

## Project Structure

```
maths_vs_monsters/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js                 # Entry point, Phaser game config
│   ├── config.js               # Game constants (lanes, speeds, colours)
│   ├── scenes/
│   │   ├── BootScene.js        # Asset loading
│   │   ├── MenuScene.js        # Year level selection
│   │   ├── GameScene.js        # Main gameplay
│   │   └── GameOverScene.js    # End screen
│   ├── entities/
│   │   ├── Monster.js          # Monster class
│   │   ├── Tower.js            # Tower class
│   │   └── Projectile.js       # Bouncing ball class
│   ├── systems/
│   │   ├── WaveManager.js      # Monster spawning logic
│   │   ├── MathsManager.js     # Problem generation wrapper
│   │   └── TowerManager.js     # Tower placement & shooting
│   └── ui/
│       ├── HUD.js              # Score, lives display
│       └── InputBox.js         # Persistent answer input field
└── public/
    └── (placeholder for future assets)
```

---

## Implementation Steps

### Phase 1: Project Setup

#### Step 1.1: Initialize Vite project
**Goal**: Empty Vite project runs in browser

**Actions**:
1. Run `npm create vite@latest . -- --template vanilla`
2. Run `npm install`
3. Run `npm run dev`

**Verify**: Browser shows Vite default page at `localhost:5173`

---

#### Step 1.2: Install dependencies
**Goal**: Phaser and maths library installed

**Actions**:
1. Run `npm install phaser maths-game-problem-generator`

**Verify**: `package.json` lists both dependencies

---

#### Step 1.3: Create Phaser game shell
**Goal**: Empty Phaser game renders a coloured background

**Actions**:
1. Replace `index.html` content with minimal HTML (just a `<div id="game">`)
2. Create `src/scenes/BootScene.js` to load shared assets:
   - Create a 1x1 white pixel texture programmatically for tinting placeholder shapes
3. Replace `src/main.js` with Phaser config:
   - 800x600 canvas
   - Arcade physics enabled
   - Boot scene → placeholder GameScene that sets background colour

**Verify**: Browser shows solid colour canvas (e.g., dark blue)

---

### Phase 2: Core Game Scene

#### Step 2.1: Create config file with lane definitions
**Goal**: Central config for game constants

**Actions**:
1. Create `src/config.js` with:
   - `CANVAS_WIDTH`, `CANVAS_HEIGHT`
   - `LANES`: array of 5 y-positions
   - `TOWER_SLOTS_X`: array of 4 x-positions per lane
   - `COLORS`: object mapping difficulty to hex colours (easy=green, medium=orange, hard=red)

**Verify**: Config imports correctly in main.js (no console errors)

---

#### Step 2.2: Draw lane grid
**Goal**: Visual grid showing lanes and tower slots

**Actions**:
1. In GameScene `create()`, draw horizontal lane lines using Phaser graphics
2. Draw small circles at each tower slot position

**Verify**: Browser shows 5 horizontal lanes with 4 slot markers each

---

### Phase 3: Monster System

#### Step 3.1: Create static monster
**Goal**: Single coloured square appears on screen

**Actions**:
1. In BootScene, load a 1x1 white pixel as `'pixel'` texture (for tinting)
2. Create `src/entities/Monster.js` class extending `Phaser.Physics.Arcade.Sprite`
   - Use the `'pixel'` texture with `setTint()` for colour
   - Use `setDisplaySize(40, 40)` so it's easy to swap for real sprites later
3. In GameScene `create()`, instantiate one monster at right edge of lane 3

**Verify**: Green square visible on right side of middle lane

**Note**: Using `Arcade.Sprite` with a tinted pixel means swapping to real sprites later just requires changing the texture key—no class refactoring needed.

---

#### Step 3.2: Monster movement
**Goal**: Monster moves left across screen

**Actions**:
1. Set monster `body.velocity.x` to negative value (e.g., -50)
2. Monster should move smoothly left

**Verify**: Square moves from right to left continuously

---

#### Step 3.3: Monster reaches base (game over condition)
**Goal**: Detect when monster reaches left edge

**Actions**:
1. In GameScene `update()`, check if any monster's x < 0
2. When triggered, log "Monster reached base!" to console
3. Destroy the monster

**Verify**: Console logs message when monster reaches left edge

---

#### Step 3.4: Monster group and spawning
**Goal**: Multiple monsters spawn over time

**Actions**:
1. Create Phaser physics group for monsters
2. Create `src/systems/WaveManager.js` with `spawnMonster(lane, difficulty)` method
3. Use `this.time.addEvent()` to spawn a monster every 3 seconds in random lane

**Verify**: New monsters appear every 3 seconds in different lanes

---

#### Step 3.5: Monster health and visual feedback
**Goal**: Monsters have health that can be reduced

**Actions**:
1. Add `health` and `maxHealth` properties to Monster
2. Add `takeDamage(amount)` method
3. Draw simple health bar above monster (two overlapping rectangles)
4. Destroy monster when health <= 0

**Verify**: Monsters display health bars

---

#### Step 3.6: Monster difficulty tiers
**Goal**: Easy/medium/hard monsters with different colours

**Actions**:
1. Add `difficulty` property to Monster (easy/medium/hard)
2. Set fill colour based on difficulty from config
3. Set health based on difficulty (easy=1, medium=2, hard=3 hits)
4. Update WaveManager to randomly pick difficulty

**Verify**: Monsters spawn in green, orange, or red

---

### Phase 4: Tower System

#### Step 4.1: Create static tower
**Goal**: Single tower circle appears in a slot

**Actions**:
1. Create `src/entities/Tower.js` class extending `Phaser.Physics.Arcade.Sprite`
   - Use `'pixel'` texture with `setTint()` and `setDisplaySize(48, 48)`
   - Towers are static bodies (don't move)
2. Add properties: `difficulty`, `lane`, `slotIndex`, `isActive`
3. Add Phaser Text object as child to display maths problem on tower
4. In GameScene, place one tower in slot position

**Verify**: Coloured square visible at a tower slot with problem text (e.g., "3+2") displayed on it

---

#### Step 4.2: Tower placement UI
**Goal**: Click empty slot to place tower

**Actions**:
1. Create invisible interactive zones at each slot
2. On click, cycle through: empty → easy tower → medium tower → hard tower → empty
3. Match tower colour to difficulty

**Verify**: Clicking slots cycles through tower types

---

#### Step 4.3: Tower stores maths problem
**Goal**: Each tower has a current problem

**Actions**:
1. Create `src/systems/MathsManager.js` wrapping `generateProblem()`
2. When tower placed, assign it a problem matching its difficulty
3. Store problem on tower object

**Verify**: `console.log(tower.problem.expression)` shows maths problem

---

### Phase 5: Projectile System

#### Step 5.1: Create projectile
**Goal**: Ball appears and moves

**Actions**:
1. Create `src/entities/Projectile.js` class extending `Phaser.Physics.Arcade.Sprite`
   - Use `'pixel'` texture with `setTint()` and `setDisplaySize(12, 12)`
   - Set `body.setCircle()` for round collision shape
2. In GameScene, create test projectile on spacebar press
3. Projectile moves right-to-left with velocity

**Verify**: Pressing space spawns a moving ball

---

#### Step 5.2: Projectile bouncing
**Goal**: Ball bounces off world bounds

**Actions**:
1. Set `body.collideWorldBounds = true`
2. Set `body.bounce.set(1, 1)` for elastic collision
3. Set world bounds to canvas size

**Verify**: Ball bounces off screen edges indefinitely

---

#### Step 5.3: Projectile-monster collision
**Goal**: Ball bounces off monsters and deals damage

**Actions**:
1. Add collider between projectile group and monster group
2. On collision callback: call `monster.takeDamage(1)`, ball deflects naturally
3. Projectile `bounceCount++` on each collision

**Verify**: Ball bounces off monster, monster health decreases

---

#### Step 5.4: Projectile lifespan
**Goal**: Balls despawn after max bounces or time

**Actions**:
1. Add `maxBounces` (default 5) to Projectile
2. Destroy projectile when `bounceCount >= maxBounces`
3. Also destroy if off-screen for 2+ seconds

**Verify**: Balls disappear after bouncing 5 times

---

#### Step 5.5: Difficulty matching
**Goal**: Balls only damage same-difficulty monsters

**Actions**:
1. Add `difficulty` to Projectile (inherited from firing tower)
2. In collision callback:
   - If `projectile.difficulty === monster.difficulty`: deal damage, normal elastic bounce
   - If difficulties don't match: no damage, invert y-velocity only (ball deflects vertically)
3. This creates interesting gameplay where balls can bounce between lanes

**Verify**: Green balls damage green monsters; bounce vertically off orange/red monsters without damage

---

### Phase 6: Tower Shooting

#### Step 6.1: Tower fires projectile
**Goal**: Active tower periodically shoots

**Actions**:
1. Add `fireRate`, `cooldown`, `isActive` to Tower
2. In GameScene `update()`, for each active tower:
   - Decrease cooldown by delta time
   - When cooldown <= 0, spawn projectile, reset cooldown
3. Initially set one tower to `isActive = true` for testing

**Verify**: Tower automatically fires balls at regular interval

---

#### Step 6.2: Tower targets lane
**Goal**: Projectiles aim toward monsters in same lane

**Actions**:
1. When tower fires, set projectile velocity toward right side of lane
2. Add slight random angle variation for natural spread

**Verify**: Balls travel roughly horizontally along their lane

---

### Phase 7: Maths Integration

#### Step 7.1: Persistent input box UI
**Goal**: Single input field always visible for answering any tower's problem

**Actions**:
1. Create `src/ui/InputBox.js` as a Phaser game object (NOT HTML `<input>`)
   - Use Phaser's `this.input.keyboard.on('keydown', ...)` to capture keystrokes
   - Draw input box background using Phaser Graphics
   - Display typed text using Phaser Text object
   - Handle backspace, enter (submit), and number keys
2. Position input box at bottom of screen (always visible during gameplay)
3. Show current typed value and a visual "submit" indicator
4. Game does NOT pause while typing—action continues
5. All input stays within the canvas, avoiding HTML focus issues

**Verify**: Input box visible at bottom of game screen, typing numbers shows in-game text, Enter submits

---

#### Step 7.2: Answer validation across all towers
**Goal**: Submitting answer checks against ALL tower problems

**Actions**:
1. On form submit, iterate through all placed towers
2. For each tower, use `checkAnswer(tower.problem, userInput)`
3. If answer matches any tower:
   - Activate that tower (set `isActive = true`)
   - Assign new problem to that tower
   - Visual feedback (tower pulses, problem text updates)
4. If answer matches multiple towers, activate all of them
5. If no match: brief shake/flash on input, clear it

**Verify**: Typing "12" activates any tower showing "7+5" or "3×4" etc.

---

#### Step 7.3: Fire rate boost
**Goal**: Solving more problems increases fire rate

**Actions**:
1. Add `fireRateMultiplier` to Tower (starts at 1)
2. Each correct answer increases multiplier by 0.2 (no cap, or high cap like 5x)
3. Cooldown = baseCooldown / fireRateMultiplier
4. Tower remains permanently active once first problem solved
5. Problem text on tower always shows current problem for further boosts

**Verify**: Repeatedly solving problems makes tower fire faster; tower never deactivates

---

### Phase 8: Game State

#### Step 8.1: Lives and game over
**Goal**: Track lives, end game at 0

**Actions**:
1. Add `lives` to GameScene (start at 10)
2. When monster reaches base, decrement lives, destroy monster
3. When lives <= 0, transition to GameOverScene

**Verify**: Letting 10 monsters through ends the game

---

#### Step 8.2: Score
**Goal**: Earn points for killing monsters

**Actions**:
1. Add `score` to GameScene
2. Award points when monster dies: easy=10, medium=25, hard=50
3. Multi-hit bonus: if one ball kills multiple monsters, 2x points each

**Verify**: Score increases when monsters die

---

#### Step 8.3: HUD display
**Goal**: Show score and lives on screen

**Actions**:
1. Create `src/ui/HUD.js` adding Phaser text objects
2. Position in top-left corner
3. Update each frame

**Verify**: "Score: 0 | Lives: 10" visible and updates

---

### Phase 9: Menus and Flow

#### Step 9.1: Menu scene with HTML difficulty selector
**Goal**: Start screen with year level selection

**Actions**:
1. Create `src/scenes/MenuScene.js`
2. Display game title using Phaser Text
3. Add HTML `<select>` dropdown above the canvas for year level selection:
   - Options: Reception, Year 1, Year 2, Year 3, Year 4, Year 5, Year 6
   - This is the ONLY HTML input element in the game
   - Position it above/outside the canvas to avoid focus conflicts during gameplay
4. Add Phaser "Start Game" button (in-canvas)
5. On start, read selected year level, store in game registry, start GameScene
6. Hide the HTML dropdown when game starts

**Verify**: Can select year level from dropdown and start game

---

#### Step 9.2: Difficulty mapping
**Goal**: Base year affects problem difficulty

**Actions**:
1. In MathsManager, map base year to difficulty:
   - Easy = base year
   - Medium = base year + 1
   - Hard = base year + 2
2. Cap at Year 6

**Verify**: Selecting Year 2 means easy=Year2, medium=Year3, hard=Year4 problems

---

#### Step 9.3: Game over scene
**Goal**: Show final score, restart option

**Actions**:
1. Create `src/scenes/GameOverScene.js`
2. Display "Game Over" and final score
3. "Play Again" button returns to MenuScene

**Verify**: Game over shows score; can restart

---

### Phase 10: Polish

#### Step 10.1: Wave progression
**Goal**: Difficulty increases over time

**Actions**:
1. Track wave number in WaveManager
2. Each wave: increase spawn rate, increase hard monster probability
3. Short pause between waves with "Wave X" text

**Verify**: Game gets harder over time

---

#### Step 10.2: Sound effects (optional)
**Goal**: Audio feedback

**Actions**:
1. Add placeholder sounds: shoot, hit, monster death, correct answer, wrong answer
2. Use Phaser audio system

**Verify**: Sounds play on appropriate events

---

#### Step 10.3: Visual juice
**Goal**: Game feels satisfying

**Actions**:
1. Add screen shake on monster reaching base
2. Add particle burst on monster death
3. Tower pulses when activated
4. Problem text briefly shows on tower after solving

**Verify**: Game feels more responsive and alive

---

#### Step 10.4: Add real sprites
**Goal**: Swap placeholder pixels for actual graphics

**Actions**:
1. Create/obtain sprite assets matching entity sizes:
   - Monsters: 40x40 (or 64x64 scaled down)
   - Towers: 48x48
   - Projectiles: 12x12 (or 16x16 scaled)
2. Load sprites in BootScene
3. Change texture key in each entity constructor (e.g., `'monster_easy'` instead of `'pixel'`)
4. Remove `setTint()` calls (colours now baked into sprites)

**Verify**: Game looks the same but with real graphics instead of coloured squares

**Note**: Because all entities extend `Arcade.Sprite` and use `setDisplaySize()`, this is just texture key changes—no structural refactoring needed.

---

## Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Game engine | Phaser 3 | Deflection physics worth the framework overhead |
| Physics | Arcade (not Matter) | Simpler, sufficient for bouncing balls |
| Lane system | Fixed lanes (PvZ style) | Simpler than free-form TD paths |
| Tower slots | Fixed grid positions | Faster to implement than drag-drop placement |
| Ball behaviour | Multi-hit, 5 bounce limit | Fun and rewards good positioning |
| Tower activation | Permanent once solved | Simpler; engagement via fire rate boosts |
| Answer input | Single persistent box | Faster gameplay; matches any tower's problem |
| Non-matching bounce | Y-velocity inversion | Balls can travel between lanes for combos |
| Build tool | Vite | Fast dev server, simple config |

---

## Future Enhancements (Post-MVP)

- [ ] Different tower types (splash damage, slow, sniper)
- [ ] Boss monsters requiring multiple hits
- [ ] Power-ups from streaks of correct answers
- [ ] Problem type selection (addition only, multiplication only, etc.)
- [ ] Mobile touch support
- [ ] Leaderboard (would need simple backend)
- [ ] Sprite graphics and animations
- [ ] Background music
