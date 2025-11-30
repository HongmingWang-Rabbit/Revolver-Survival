# Revolver Survival - Game Configuration
# A Russian Roulette inspired betting game for Stake Engine

# Game Constants
CHAMBERS = 6          # Total chambers in revolver cylinder
HOUSE_EDGE = 0.0233   # 2.33% house edge
BULLET_RANGE = (1, 5) # Valid bullet counts

# Multiplier precision for Stake Engine
# Stake Engine format: multiplier * 100 (e.g., 1150 = 11.5x, 117 = 1.17x)
PRECISION = 100

def calculate_multiplier(bullets: int) -> float:
    """
    Calculate the payout multiplier for a given number of bullets.

    Formula: Multiplier = (CHAMBERS / empty_chambers) * (1 - HOUSE_EDGE)

    Note: Mode 2 uses floor rounding (1.46 instead of 1.47) to keep
    RTP variation across all modes within 0.5% requirement.

    Args:
        bullets: Number of bullets loaded (1-5)

    Returns:
        Payout multiplier as float
    """
    if bullets < BULLET_RANGE[0] or bullets > BULLET_RANGE[1]:
        raise ValueError(f"Bullets must be between {BULLET_RANGE[0]} and {BULLET_RANGE[1]}")

    empty_chambers = CHAMBERS - bullets
    multiplier = (CHAMBERS / empty_chambers) * (1 - HOUSE_EDGE)

    # Use floor for mode 2 to reduce RTP variation across modes
    if bullets == 2:
        import math
        return math.floor(multiplier * 100) / 100

    return round(multiplier, 2)


def calculate_survival_probability(bullets: int) -> tuple[int, int]:
    """
    Calculate survival probability as a fraction.

    Args:
        bullets: Number of bullets loaded (1-5)

    Returns:
        Tuple of (win_weight, loss_weight) for weighted selection
    """
    empty_chambers = CHAMBERS - bullets
    return (empty_chambers, bullets)


# Pre-calculated game modes
GAME_MODES = {}
for b in range(BULLET_RANGE[0], BULLET_RANGE[1] + 1):
    empty = CHAMBERS - b
    survival_rate = empty / CHAMBERS
    multiplier = calculate_multiplier(b)

    GAME_MODES[b] = {
        "name": f"mode_{b}_bullet",
        "bullets": b,
        "empty_chambers": empty,
        "survival_rate": survival_rate,
        "survival_percent": f"{survival_rate * 100:.2f}%",
        "multiplier": multiplier,
        "multiplier_int": int(multiplier * PRECISION),
        "win_weight": empty,
        "loss_weight": b,
    }

if __name__ == "__main__":
    print("Revolver Survival Game Modes:")
    print("-" * 80)
    for bullets, mode in GAME_MODES.items():
        print(f"Mode {bullets} Bullet(s):")
        print(f"  Survival Rate: {mode['survival_percent']}")
        print(f"  Multiplier: x{mode['multiplier']}")
        print(f"  Weights: Win={mode['win_weight']}/6, Loss={mode['loss_weight']}/6")
        print()
