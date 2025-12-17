# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Revolver Survival is a Russian Roulette-inspired betting game built for the Stake Engine platform. Players bet on surviving shots from a six-chamber revolver with 1-5 bullets loaded. Outcomes are pre-determined via Stake Engine's simulation file system for provably fair gameplay.

## Commands

### Math Engine (Python)
```bash
cd math
make setup    # Create venv and install dependencies
make run      # Generate simulation files to library/publish_files/
make test     # Print game mode calculations
make clean    # Remove generated files and venv
```

### Frontend (SvelteKit)
```bash
cd frontend
pnpm install
pnpm dev              # Start dev server
pnpm build            # Production build (outputs to build/)
pnpm check            # TypeScript type checking
pnpm check:watch      # Watch mode type checking
```

## Architecture

### Two Independent Components

**Math Engine** (`math/`): Python generator that produces simulation files for Stake Engine:
- `games/revolver_survival/config.py` - Game constants and multiplier calculations
- `games/revolver_survival/generator.py` - Generates lookup tables (CSV), event sequences (JSONL.zst), and index.json
- Output goes to `library/publish_files/` for deployment

**Frontend** (`frontend/`): SvelteKit SPA using PixiJS + Spine for rendering:
- Static adapter builds to `build/` directory with relative paths
- Connects to Stake Engine RGS via URL parameters (`sessionID`, `rgs_url`)
- Falls back to demo mode when RGS params are missing

### Frontend State Management

All game state lives in Svelte stores (`src/lib/stores/gameStore.ts`):
- `balance` - Player balance
- `roundState` - Game state machine, bet amount, pot, spin count
- `rgsConfig` - RGS configuration and bet limits
- `isSpinning`, `showResult` - UI state flags

Game state flow: `idle` → `betting` → `spinning` → `result` → (`continue` → `spinning` → ...) → `idle`

### Auto Bet Feature

Auto bet allows players to automate multiple rounds with configurable settings:
- `autoBetConfig` store tracks running state, progress, wins/losses, and profit
- Settings: Number of bets, Stop after X wins, Continue shots before cash out
- Configuration in `gameConfig.autoBet` (default bets, max bets, max continue shots)
- Timing in `gameConfig.timing` (autoBetSpinDelay, autoBetRoundDelay)

### Configuration Files

- `frontend/src/lib/config/game.ts` - Demo settings, timing values, bet limits, sound mappings
- `frontend/src/lib/config/spine.ts` - Spine animation mappings, scale, canvas dimensions, positioning
- `frontend/src/app.css` - CSS custom properties (colors, fonts) - theme configuration
- `math/games/revolver_survival/config.py` - House edge, chamber count, multiplier formulas

### Key Integrations

**Spine Animations**: Character states map to animation names (A1=idle, A2=betting, B1-B3=spinning, etc.). The character is dynamically sized based on container dimensions. Update `spine.ts` when changing Spine files or adjusting character size/position.

**Sound Effects** (`src/lib/utils/sounds.ts`): Web Audio API-based sound manager. Sound files are in `static/sounds/`. Configuration in `game.ts` under `sounds` section maps sound names to files:

| Sound Name | File | Trigger |
|------------|------|---------|
| click | Tap.mp3 | UI interactions |
| bet | Tap.mp3 | Bet placed |
| spin | Reload.mp3 | Cylinder spin |
| empty | ShootFailed.mp3 | Survived (empty chamber) |
| bang | Shooting.mp3 | Death (live round) |
| win | WinA.mp3 | Win celebration |
| cashout | WinB.mp3 | Cash out |
| death | Failed.mp3 | Game over feedback |

To replace sounds, update files in `static/sounds/` and modify `gameConfig.sounds.files` in `game.ts`.

**RGS API** (`src/lib/services/rgs.ts`): Monetary values use 6 decimal precision (1,000,000 = $1.00). Endpoints: `/wallet/authenticate`, `/wallet/balance`, `/wallet/play`, `/wallet/end-round`.

**Theme Configuration** (`src/app.css`): CSS custom properties define the visual theme:

| Variable | Description | Default |
|----------|-------------|---------|
| `--color-bg` | Main background | #0d1b2a (dark navy) |
| `--color-accent` | Primary action color | #00c853 (green) |
| `--color-panel` | Panel background | rgba(20, 40, 60, 0.95) |
| `--color-danger` | Error/death color | #ff4444 (red) |
| `--font-primary` | Main font stack | System fonts |

## Game Math

House edge: ~2.33% (varies slightly by mode to keep RTP consistent)
Multiplier formula: `(CHAMBERS / empty_chambers) * (1 - HOUSE_EDGE)`

| Bullets | Survival Rate | Multiplier |
|---------|---------------|------------|
| 1       | 83.33%        | ~1.17x     |
| 2       | 66.67%        | ~1.46x     |
| 3       | 50.00%        | ~1.95x     |
| 4       | 33.33%        | ~2.93x     |
| 5       | 16.67%        | ~5.86x     |
