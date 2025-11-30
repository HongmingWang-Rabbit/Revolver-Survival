# Revolver Survival

A high-stakes betting game inspired by Russian Roulette, built for the [Stake Engine](https://stake-engine.com) platform.

## Game Concept

Players bet on surviving a round fired from a six-chamber revolver loaded with a chosen number of bullets. The outcome is pre-determined via Stake Engine's simulation file system, ensuring provably fair gameplay.

## Game Modes

| Bullets | Survival Rate | Multiplier |
|---------|---------------|------------|
| 1       | 83.33%        | x1.17      |
| 2       | 66.67%        | x1.47      |
| 3       | 50.00%        | x1.95      |
| 4       | 33.33%        | x2.93      |
| 5       | 16.67%        | x5.86      |

House edge: 2.33%

## Project Structure

```
Revolver-Survival/
├── math/                          # Math Engine (Python)
│   ├── games/revolver_survival/   # Game logic
│   │   ├── config.py              # Game configuration
│   │   └── generator.py           # Simulation file generator
│   ├── library/
│   │   ├── books/                 # Raw JSONL files
│   │   └── publish_files/         # Production-ready files
│   ├── requirements.txt
│   └── Makefile
│
├── frontend/                      # Frontend (SvelteKit)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/        # UI components
│   │   │   ├── stores/            # Game state management
│   │   │   ├── utils/             # RGS client, sounds
│   │   │   └── types.ts           # TypeScript types
│   │   └── routes/                # SvelteKit pages
│   ├── package.json
│   └── svelte.config.js
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

## Stake Engine Integration

### Required Files

The math engine generates these files in `math/library/publish_files/`:

1. **index.json** - Mode configuration
2. **lookUpTable_mode_X_bullet.csv** - Probability weights
3. **books_mode_X_bullet.jsonl.zst** - Compressed game events

### RGS API

The frontend integrates with Stake Engine RGS via:

- `/wallet/authenticate` - Session validation
- `/wallet/balance` - Balance retrieval
- `/wallet/play` - Round initiation
- `/wallet/end-round` - Payout processing

In demo mode (no RGS URL), the game simulates outcomes locally.

## Development

### Demo Mode

Run the frontend without RGS connection for testing:

```bash
cd frontend && pnpm dev
```

### Production Mode

When deployed to Stake Engine, the game receives:

- `sessionID` - Player session
- `rgs_url` - RGS endpoint
- `lang` - Language code
- `device` - mobile/desktop

## Technologies

- **Math Engine**: Python 3.11+, zstandard compression
- **Frontend**: SvelteKit 2.x, TypeScript, CSS
- **Platform**: Stake Engine RGS

## License

Proprietary - Built for Stake Engine platform.
