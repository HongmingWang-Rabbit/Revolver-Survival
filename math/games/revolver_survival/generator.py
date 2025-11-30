#!/usr/bin/env python3
"""
Revolver Survival - Simulation File Generator

Generates the required math files for Stake Engine:
1. Lookup tables (CSV) - probability and payout multipliers
2. Game logic files (JSONL) - event sequences
3. Index configuration (JSON) - mode definitions
"""

import json
import csv
import os
import zstandard as zstd
from pathlib import Path
from config import GAME_MODES, CHAMBERS, PRECISION

# Output directories
BASE_DIR = Path(__file__).parent.parent.parent
PUBLISH_DIR = BASE_DIR / "library" / "publish_files"
BOOKS_DIR = BASE_DIR / "library" / "books"

# Ensure directories exist
PUBLISH_DIR.mkdir(parents=True, exist_ok=True)
BOOKS_DIR.mkdir(parents=True, exist_ok=True)

# Number of simulations per mode (for diverse outcomes)
# In production, use 100k+ per Stake Engine recommendations
NUM_SIMULATIONS = 100000


def generate_weights(win_probability: int, loss_probability: int, num_sims: int) -> tuple[int, int]:
    """
    Calculate exact weights for win/loss simulations using 64-bit integers.

    Args:
        win_probability: Numerator for win (e.g., 5 for 5/6)
        loss_probability: Numerator for loss (e.g., 1 for 1/6)
        num_sims: Total number of simulations

    Returns:
        Tuple of (win_weight, loss_weight) as 64-bit integers
    """
    total = win_probability + loss_probability

    # Calculate number of each type of simulation
    win_count = (num_sims * win_probability) // total
    loss_count = num_sims - win_count

    # Use large integers for weight precision (avoid floating point)
    # Total weight space: 2^40 for sufficient precision
    weight_space = 2 ** 40

    win_weight = (weight_space * win_probability) // total
    loss_weight = weight_space - win_weight

    return win_weight, loss_weight, win_count, loss_count


def generate_simulation_events(outcome: str, bullets: int, sim_id: int) -> list[dict]:
    """
    Generate the events list for a single simulation.

    Args:
        outcome: "win" or "loss"
        bullets: Number of bullets in this mode
        sim_id: Simulation identifier

    Returns:
        List of event dictionaries
    """
    # Determine which chamber was hit
    chamber_position = sim_id % CHAMBERS + 1

    if outcome == "win":
        return [
            {
                "type": "spin",
                "chamber": chamber_position,
                "result": "empty",
                "bullets_loaded": bullets
            },
            {
                "type": "outcome",
                "status": "survived",
                "message": "Click! You survived!"
            }
        ]
    else:
        return [
            {
                "type": "spin",
                "chamber": chamber_position,
                "result": "live",
                "bullets_loaded": bullets
            },
            {
                "type": "outcome",
                "status": "death",
                "message": "BANG! Game over."
            }
        ]


def generate_mode_files(bullets: int, mode_config: dict):
    """
    Generate all required files for a single game mode.

    Args:
        bullets: Number of bullets for this mode
        mode_config: Configuration dictionary for this mode
    """
    mode_name = mode_config["name"]
    multiplier_int = mode_config["multiplier_int"]

    # Calculate weights
    win_weight, loss_weight, win_count, loss_count = generate_weights(
        mode_config["win_weight"],
        mode_config["loss_weight"],
        NUM_SIMULATIONS
    )

    print(f"\nGenerating {mode_name}:")
    print(f"  Win simulations: {win_count} (weight: {win_weight})")
    print(f"  Loss simulations: {loss_count} (weight: {loss_weight})")
    print(f"  Multiplier: {multiplier_int} ({mode_config['multiplier']}x)")

    # Generate lookup table CSV
    csv_filename = f"lookUpTable_{mode_name}.csv"
    csv_path = PUBLISH_DIR / csv_filename

    with open(csv_path, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)

        # Write all simulations with their weights
        sim_id = 1

        # Win simulations
        for i in range(win_count):
            # Distribute weight evenly across win simulations
            sim_weight = win_weight // win_count
            if i < win_weight % win_count:
                sim_weight += 1
            writer.writerow([sim_id, sim_weight, multiplier_int])
            sim_id += 1

        # Loss simulations
        for i in range(loss_count):
            sim_weight = loss_weight // loss_count
            if i < loss_weight % loss_count:
                sim_weight += 1
            writer.writerow([sim_id, sim_weight, 0])
            sim_id += 1

    print(f"  Created: {csv_filename}")

    # Generate game logic JSONL
    jsonl_filename = f"books_{mode_name}.jsonl"
    jsonl_path = BOOKS_DIR / jsonl_filename

    simulations = []
    sim_id = 1

    # Win simulations
    for i in range(win_count):
        sim_data = {
            "id": sim_id,
            "events": generate_simulation_events("win", bullets, sim_id),
            "payoutMultiplier": multiplier_int
        }
        simulations.append(json.dumps(sim_data))
        sim_id += 1

    # Loss simulations
    for i in range(loss_count):
        sim_data = {
            "id": sim_id,
            "events": generate_simulation_events("loss", bullets, sim_id),
            "payoutMultiplier": 0
        }
        simulations.append(json.dumps(sim_data))
        sim_id += 1

    # Write JSONL file
    with open(jsonl_path, 'w') as f:
        f.write('\n'.join(simulations))

    print(f"  Created: {jsonl_filename}")

    # Compress with zstandard
    zst_filename = f"books_{mode_name}.jsonl.zst"
    zst_path = PUBLISH_DIR / zst_filename

    cctx = zstd.ZstdCompressor(level=19)
    with open(jsonl_path, 'rb') as f_in:
        with open(zst_path, 'wb') as f_out:
            f_out.write(cctx.compress(f_in.read()))

    print(f"  Created: {zst_filename}")

    return {
        "csv": csv_filename,
        "jsonl_zst": zst_filename
    }


def generate_index_file(mode_files: dict):
    """
    Generate the index.json configuration file.

    Args:
        mode_files: Dictionary mapping bullet count to file names
    """
    modes = []

    for bullets in sorted(mode_files.keys()):
        mode_config = GAME_MODES[bullets]
        files = mode_files[bullets]

        modes.append({
            "name": mode_config["name"],
            "cost": 1.0,  # Base cost multiplier
            "events": files["jsonl_zst"],
            "weights": files["csv"],
            "meta": {
                "bullets": bullets,
                "survivalRate": mode_config["survival_rate"],
                "multiplier": mode_config["multiplier"],
                "displayName": f"{bullets} Bullet{'s' if bullets > 1 else ''}"
            }
        })

    index_data = {
        "game": "revolver_survival",
        "version": "1.0.0",
        "description": "Russian Roulette inspired survival betting game",
        "chambers": CHAMBERS,
        "modes": modes
    }

    index_path = PUBLISH_DIR / "index.json"
    with open(index_path, 'w') as f:
        json.dump(index_data, f, indent=2)

    print(f"\nCreated: index.json")


def main():
    """Generate all simulation files for Revolver Survival."""
    print("=" * 60)
    print("Revolver Survival - Simulation Generator")
    print("=" * 60)
    print(f"\nGenerating {NUM_SIMULATIONS} simulations per mode...")

    mode_files = {}

    for bullets, mode_config in GAME_MODES.items():
        files = generate_mode_files(bullets, mode_config)
        mode_files[bullets] = files

    generate_index_file(mode_files)

    print("\n" + "=" * 60)
    print("Generation complete!")
    print(f"Files saved to: {PUBLISH_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
