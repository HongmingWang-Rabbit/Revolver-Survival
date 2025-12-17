# Revolver Survival

A high-stakes betting game inspired by Russian Roulette, built for the [Stake Engine](https://stake-engine.com) platform.

## Game Concept

Players bet on surviving a round fired from a six-chamber revolver loaded with a chosen number of bullets. The outcome is pre-determined via Stake Engine's simulation file system, ensuring provably fair gameplay.

## Game Modes

| Bullets | Survival Rate | Multiplier | Max Bet | RTP   |
|---------|---------------|------------|---------|-------|
| 1       | 83.33%        | x1.152     | 1000    | 96.0% |
| 2       | 66.67%        | x1.44      | 1000    | 96.0% |
| 3       | 50.00%        | x1.92      | 1000    | 96.0% |
| 4       | 33.33%        | x2.88      | 500     | 96.0% |
| 5       | 16.67%        | x5.76      | 200     | 96.0% |

House edge: 4%

## Project Structure

```
Revolver-Survival/
├── math/                          # Math Engine (Python)
│   ├── games/revolver_survival/
│   │   ├── config.py              # Game constants and calculations
│   │   └── generator.py           # Simulation file generator
│   ├── library/
│   │   ├── books/                 # Raw JSONL simulation files
│   │   └── publish_files/         # Production-ready compressed files
│   ├── requirements.txt
│   └── Makefile
│
├── frontend/                      # Frontend (SvelteKit)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/        # Svelte UI components
│   │   │   │   ├── BetControls.svelte     # Bet selection UI
│   │   │   │   ├── GameActions.svelte     # Spin/cashout controls
│   │   │   │   ├── GameDisclaimer.svelte  # Game info modal
│   │   │   │   ├── Header.svelte          # Balance display
│   │   │   │   ├── SpineCharacter.svelte  # Spine animation
│   │   │   │   └── StickMan.svelte        # CSS fallback character
│   │   │   ├── config/            # Configuration files
│   │   │   │   ├── game.ts        # Game timing and demo settings
│   │   │   │   └── spine.ts       # Spine animation mappings
│   │   │   ├── services/
│   │   │   │   └── rgs.ts         # RGS API client
│   │   │   ├── stores/
│   │   │   │   └── gameStore.ts   # Svelte stores and game logic
│   │   │   ├── utils/
│   │   │   │   ├── currency.ts    # Currency formatting
│   │   │   │   ├── replay.ts      # Replay mode support
│   │   │   │   ├── socialMode.ts  # Social casino compliance
│   │   │   │   └── sounds.ts      # Web Audio sound effects
│   │   │   ├── types.ts           # TypeScript definitions
│   │   │   └── index.ts           # Library exports
│   │   └── routes/                # SvelteKit pages
│   ├── static/
│   │   └── spine/                 # Spine animation assets
│   ├── package.json
│   └── svelte.config.js
│
├── assets/                        # Source assets (not deployed)
│   ├── 音效/                      # Sound effect source files
│   └── 番剧spine源文件/           # Spine source files
│
└── instruction.md                 # Game design document
```

## Setup

### Math Engine

```bash
cd math
make setup    # Create virtual environment and install dependencies
make run      # Generate simulation files
```

### Frontend

```bash
cd frontend
pnpm install  # Install dependencies
pnpm dev      # Start development server
pnpm build    # Build for production
```

## Configuration

### Game Settings (`frontend/src/lib/config/game.ts`)

Centralized configuration for:
- **Demo mode**: Starting balance, bet levels
- **Timing**: Spin duration, death reset delay
- **Game constants**: Chambers, house edge

### Spine Animation (`frontend/src/lib/config/spine.ts`)

Configure animation mappings:
- Asset paths (atlas, skeleton JSON)
- Animation names for each game state
- Mix duration for transitions
- Canvas dimensions and scale

### CSS Variables (`frontend/src/app.css`)

Theme colors:
- `--color-bg`, `--color-bg-secondary`, `--color-bg-tertiary`
- `--color-accent`, `--color-success`, `--color-warning`, `--color-gold`
- `--color-text`, `--color-text-muted`, `--color-info`

## Stake Engine Integration

### Required Files

The math engine generates these files in `math/library/publish_files/`:

1. **index.json** - Mode configuration and metadata
2. **lookUpTable_mode_X_bullet.csv** - Probability weights (64-bit precision)
3. **books_mode_X_bullet.jsonl.zst** - Compressed game events

### RGS API

The frontend integrates with Stake Engine RGS via:

- `/wallet/authenticate` - Session validation and config
- `/wallet/balance` - Balance retrieval
- `/wallet/play` - Round initiation with mode selection
- `/wallet/end-round` - Payout processing

In demo mode (no RGS URL), the game simulates outcomes locally.

### URL Parameters

| Parameter   | Description              |
|-------------|--------------------------|
| `sessionID` | Player session token     |
| `rgs_url`   | RGS endpoint URL         |
| `lang`      | Language code (e.g., en) |
| `currency`  | Currency code (e.g., USD)|
| `social`    | Enable social mode       |
| `replay`    | Enable replay mode       |

## Features

### Social Mode Compliance

For Stake.us and similar social casinos, the game automatically replaces gambling terminology:
- "Bet" → "Play"
- "Cash Out" → "Collect"
- Currency symbols hidden

Enable via `?social=true` URL parameter or RGS jurisdiction config.

### Replay Mode

Review past rounds with `?replay=true&roundId=XXX&events=BASE64&amount=1.00&currency=USD&multiplier=117`

### Currency Support

Automatic symbol formatting for: USD, EUR, GBP, JPY, CNY, KRW, INR, BRL, CAD, AUD. Unknown currencies display their code.

### Keyboard Controls

- **Space**: Place bet / Pull trigger

## Character Animation

### Animation Mappings

| Animation | Game State           | Description                    |
|-----------|---------------------|--------------------------------|
| A1        | Idle                | Default breathing idle          |
| A2        | Betting             | Loading bullets, spinning cylinder |
| A3        | 1st Survival        | Idle after surviving first shot |
| A4        | 2nd+ Survival       | Idle after surviving 2+ shots   |
| B1        | 1st Spin            | First aiming at temple          |
| B2        | 2nd Spin            | Second aiming                   |
| B3_1      | Death               | Gun fires, death animation      |
| B3_2      | 3rd+ Spin (survive) | Third+ aiming, click (empty)    |

### Animation Flow

```
A1 (idle) → A2 (load bullets) → B1 (1st aim) → A3 (survive) → B2 (2nd aim) → A4 (survive) → B3_2 (3rd aim) → ...
                                     ↓                              ↓                              ↓
                                  B3_1 (death)                   B3_1 (death)                   B3_1 (death)
```

### Updating Animations

1. Export new Spine files to `frontend/static/spine/`
2. Update animation names in `frontend/src/lib/config/spine.ts`
3. For smooth transitions, ensure animations have keyframed bones at frame 0

## Technologies

- **Math Engine**: Python 3.11+, zstandard compression
- **Frontend**: SvelteKit 2.x, TypeScript 5.x
- **Rendering**: PixiJS 8.x
- **Animation**: Spine 4.2 (spine-pixi-v8)
- **Audio**: Web Audio API (procedural sounds)
- **Platform**: Stake Engine RGS

## Architecture

### State Management

The game uses Svelte stores for reactive state:
- `balance` - Player balance
- `roundState` - Current game state, bet, pot
- `rgsConfig` - RGS configuration and bet limits
- `isSpinning`, `showResult` - UI state

### Code Quality

- Zero console.log statements in production code
- All hardcoded values extracted to configuration files
- CSS variables for consistent theming
- TypeScript strict mode for type safety
- Modular component architecture

## License

Proprietary - Built for Stake Engine platform.
