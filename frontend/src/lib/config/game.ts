/**
 * Game Configuration
 *
 * Centralized configuration for game constants, timing, and demo settings.
 * Modify values here instead of hardcoding throughout the codebase.
 */

export interface GameConfig {
	/** Number of chambers in the revolver */
	chambers: number;
	/** House edge percentage (e.g., 0.04 = 4%) */
	houseEdge: number;
	/** Per-mode maximum bet limits */
	modeBetLimits: Record<number, number>;
	/** Demo mode settings */
	demo: {
		/** Starting balance in demo mode */
		startingBalance: number;
		/** Default bet amount */
		defaultBet: number;
		/** Bet levels available in demo mode */
		betLevels: number[];
	};
	/** Timing configuration (milliseconds) */
	timing: {
		/** Duration of spin animation before result */
		spinDuration: number;
		/** Delay before resetting after death */
		deathResetDelay: number;
		/** Result display duration */
		resultDisplayDuration: number;
	};
}

export const gameConfig: GameConfig = {
	chambers: 6,
	houseEdge: 0.04,
	modeBetLimits: {
		1: 1000,  // 1 bullet max bet
		2: 1000,  // 2 bullets max bet
		3: 1000,  // 3 bullets max bet
		4: 500,   // 4 bullets max bet
		5: 200,   // 5 bullets max bet
	},
	demo: {
		startingBalance: 100.0,
		defaultBet: 1.0,
		betLevels: [0.1, 0.5, 1.0, 5.0, 10.0, 50.0, 100.0],
	},
	timing: {
		spinDuration: 1500,
		deathResetDelay: 3000,
		resultDisplayDuration: 2000,
	},
};

/** Default bet level index (1.00 = index 2) */
export const DEFAULT_BET_LEVEL_INDEX = 2;
