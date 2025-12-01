<!--
=============================================================================
SYNC IMPACT REPORT
=============================================================================
Version Change: [UNVERSIONED] → 1.0.0
Constitution Type: INITIAL RATIFICATION

Modified Principles:
- All principles newly defined (initial version)

Added Sections:
- Core Principles (5 principles defined)
- Additional Constraints
- Development Workflow
- Governance

Removed Sections: N/A (initial version)

Templates Requiring Updates:
- ✅ plan-template.md: Reviewed - generic structure compatible
- ✅ spec-template.md: Reviewed - user story approach compatible
- ✅ tasks-template.md: Reviewed - phase structure compatible
- ⚠️ No testing templates exist yet (project has no tests currently)

Follow-up TODOs:
- Consider adding testing framework if project grows beyond educational scope
- Ratification date set to today as initial adoption
- Project name clarified as "Maths vs Monsters" (based on package.json)

Notes:
- This is a simple educational game project with intentionally minimal complexity
- Constitution reflects pragmatic approach suitable for small-scope learning project
- Testing requirements relaxed given educational context and small scope
=============================================================================
-->

# Maths vs Monsters Constitution

## Core Principles

### I. Simplicity First

Every feature and implementation must justify its complexity. This is an educational game project with a strict scope: buildable in a couple of days maximum. We prioritize:

- **Minimal dependencies**: Only essential libraries (Phaser 3, maths-game-problem-generator, Vite)
- **No premature optimization**: Start with placeholder graphics, simple mechanics
- **YAGNI strictly enforced**: Features planned for "Post-MVP" must stay there until core is stable
- **Clear upgrade paths**: Design allows adding sprites/sounds later without refactoring (e.g., texture swap pattern)

**Rationale**: Small educational projects die from feature creep. Simplicity ensures completion and maintainability for learning purposes.

### II. Incremental Development

All work proceeds in small, verifiable steps with clear checkpoints:

- **Phase-based implementation**: Each phase in plan.md must have explicit verification step
- **Commit after each milestone**: Small, atomic commits with descriptive messages (no "Generated with Claude" boilerplate)
- **Working state maintained**: Game must remain playable after each phase completes
- **No bundled changes**: One feature per commit, explicit file staging (never `git add .`)

**Rationale**: Educational projects benefit from clear progress tracking. Small steps enable learning and debugging.

### III. Progressive Enhancement Pattern

Features must be designed for graceful capability addition:

- **Texture swap pattern**: Use tinted pixels initially, real sprites loadable by changing texture key only
- **Configuration externalized**: Game constants in `config.js` for easy tuning
- **Manager pattern for systems**: WaveManager, MathsManager separate concerns clearly
- **Scene-based architecture**: Phaser scenes enable clean separation (Boot, Menu, Game, GameOver)

**Rationale**: Enables adding polish (sprites, sounds, effects) without structural rewrites, supporting iterative learning.

### IV. Player-Focused Mechanics

Game mechanics must prioritize playability and educational value:

- **No artificial friction**: Single persistent input box, automatic tower matching, immediate feedback
- **Clear visual feedback**: Health bars, HUD updates, difficulty color coding (green/orange/red)
- **Educational core preserved**: Maths problems drive all tower activation and progression
- **Difficulty scaffolding**: Base year level + tiered problems (easy/medium/hard = +0/+1/+2 years)

**Rationale**: Educational game succeeds when learning mechanics feel natural and rewarding, not frustrating.

### V. Browser-First Constraints

As a statically-hosted browser game, all design respects web platform limitations:

- **No server required**: Pure client-side, deployable to GitHub Pages or Netlify
- **Canvas-based input**: Phaser keyboard handling preferred over HTML forms (except menu year selection)
- **Focus management**: Explicit keyboard enable/disable patterns when HTML inputs used
- **Mobile considerations**: Touch support and responsive scaling planned but not Phase 1 requirements
- **Asset loading**: BootScene centralizes asset loading, supports lazy sprite addition

**Rationale**: Static hosting requirement drives architectural decisions; reduces deployment complexity to zero.

## Additional Constraints

### Technology Stack (Non-Negotiable)

- **Language**: JavaScript (ES6+ modules) - no TypeScript, no transpilation beyond Vite
- **Game Engine**: Phaser 3 with Arcade Physics (not Matter.js - simpler)
- **Build Tool**: Vite (fast dev server, zero config)
- **Maths Library**: `maths-game-problem-generator` (UK curriculum-aligned)
- **Hosting**: Static file hosting (GitHub Pages, Netlify, or similar)

**Justification**: Chosen for minimal setup, fast iteration, and suitability for educational scope.

### Scope Boundaries

#### In Scope
- Lane-based tower defense (Plants vs Zombies style)
- Maths problem solving as core mechanic
- Three difficulty tiers (easy/medium/hard)
- Basic progression (waves, score, lives)
- Placeholder-to-sprite upgrade path
- Single-player only

#### Out of Scope (Unless Justified)
- Multiplayer or leaderboards (requires backend)
- Complex tower types beyond agreed MVP (sniper, cluster towers OK if designed simply)
- Problem type filtering (addition-only mode, etc.)
- Saving/loading game state
- Tutorial system
- Achievements or meta-progression

**Enforcement**: Any out-of-scope feature requires explicit constitution amendment before implementation.

## Development Workflow

### Planning and Specification

1. **Feature specifications** use user story format (spec-template.md) with priorities (P1/P2/P3)
2. **Implementation plans** (plan-template.md) include:
   - Phase breakdown with verification steps
   - Explicit decision log (e.g., "Arcade physics vs Matter", "Fixed lanes vs free-form")
   - Complexity justification if needed
3. **Task lists** (tasks-template.md) organize by user story for independent testing

### Implementation Rules

1. **Constitution supersedes convenience**: If a shortcut violates principles, reject it
2. **Checkpoints are mandatory**: Never skip "Verify: [expected behavior]" steps in plan
3. **Asset strategy**: Placeholder first (tinted pixel textures), sprites second (texture key swap only)
4. **Input handling**: Canvas-first (Phaser keyboard), HTML fallback only for menus with explicit focus management
5. **Commit hygiene**: 
   - Descriptive messages focused on "why" not "what"
   - No generic messages ("Update", "Fix")
   - No AI attribution in commits
   - Explicit file staging (never `git add .`)

### Testing Strategy (Pragmatic)

Given educational scope and time constraints:

- **Manual verification mandatory**: Every phase checkpoint must be tested by running the game
- **Automated tests optional**: Not required for MVP, but if added:
  - Use Jest or Vitest (Vite-native)
  - Focus on game logic (MathsManager, WaveManager), not Phaser rendering
  - Contract tests for problem generation integration
- **Browser testing**: Chrome/Firefox/Safari checks before declaring "done"

**Rationale**: Manual testing sufficient for small scope; automated tests add value only if project grows.

### Code Review Standards

Since this is a learning project, code review focuses on:

1. **Adherence to simplicity principle**: Is this the simplest solution?
2. **Checkpoint verification**: Did all "Verify:" steps pass?
3. **Educational value**: Can the learner (son) understand this code?
4. **Future-proofing**: Does this respect progressive enhancement pattern?

## Governance

### Amendment Process

1. **Proposal**: Document principle addition/change with rationale
2. **Impact analysis**: Check all templates and existing code for conflicts
3. **Version bump**: 
   - MAJOR: Remove or redefine core principle (breaks compatibility)
   - MINOR: Add new principle or section (expands governance)
   - PATCH: Clarify wording, fix typos, refine examples
4. **Sync propagation**: Update affected templates, code, and documentation
5. **Commit**: Single commit with all constitution + template changes

### Compliance Enforcement

- **All pull requests** (if used) must include constitution compliance check
- **Complexity must be justified**: Use "Complexity Tracking" table in plan-template.md if violating principles
- **No silent principle violations**: If constitution blocks progress, amend constitution first
- **Periodic review**: After each major feature, review if principles still serve project

### Versioning Policy

- **Semantic versioning**: MAJOR.MINOR.PATCH
- **Change log**: Maintain Sync Impact Report at top of constitution file
- **Date tracking**: 
  - Ratification date: Original adoption (does not change)
  - Last amended date: Most recent modification (ISO 8601 format)

### Living Document Commitment

This constitution serves the project, not vice versa. If a principle consistently blocks progress or no longer applies, amend it. Document the "why" of changes to preserve institutional knowledge.

**Version**: 1.0.0 | **Ratified**: 2025-12-01 | **Last Amended**: 2025-12-01
