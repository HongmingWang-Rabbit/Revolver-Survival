/**
 * Game Configuration
 *
 * Centralized configuration for game constants, timing, and demo settings.
 * Modify values here instead of hardcoding throughout the codebase.
 */

/** Sound effect identifiers */
export type SoundName =
  | "click"
  | "spin"
  | "empty"
  | "bang"
  | "win"
  | "cashout"
  | "bet"
  | "death";

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
    /** Minimum bet step increment */
    stepBet: number;
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
    /** Delay before empty chamber click sound */
    emptySoundDelay: number;
    /** Delay before win sound after empty chamber */
    winSoundDelay: number;
    /** Delay before gunshot sound (to match animation) */
    bangSoundDelay: number;
    /** Delay before death feedback sound after gunshot */
    deathSoundDelay: number;
    /** Delay before spin in auto bet */
    autoBetSpinDelay: number;
    /** Delay between auto bet rounds */
    autoBetRoundDelay: number;
  };
  /** Auto bet configuration */
  autoBet: {
    /** Default number of bets */
    defaultBets: number;
    /** Maximum number of bets allowed */
    maxBets: number;
    /** Maximum continue shots allowed */
    maxContinueShots: number;
  };
  /** Sound configuration */
  sounds: {
    /** Base path for sound files */
    basePath: string;
    /** Sound file mappings */
    files: Record<SoundName, string>;
  };
}

export const gameConfig: GameConfig = {
  chambers: 6,
  houseEdge: 0.04,
  modeBetLimits: {
    1: 1000, // 1 bullet max bet
    2: 1000, // 2 bullets max bet
    3: 1000, // 3 bullets max bet
    4: 500, // 4 bullets max bet
    5: 200, // 5 bullets max bet
  },
  demo: {
    startingBalance: 100.0,
    defaultBet: 1.0,
    stepBet: 0.01,
    betLevels: [0.1, 0.5, 1.0, 5.0, 10.0, 50.0, 100.0],
  },
  timing: {
    spinDuration: 1500,
    deathResetDelay: 3000,
    resultDisplayDuration: 2000,
    emptySoundDelay: 600,
    winSoundDelay: 800,
    bangSoundDelay: 1500,
    deathSoundDelay: 200,
    autoBetSpinDelay: 500,
    autoBetRoundDelay: 800,
  },
  autoBet: {
    defaultBets: 10,
    maxBets: 100,
    maxContinueShots: 10,
  },
  sounds: {
    basePath: "./sounds",
    files: {
      click: "Tap.mp3",
      bet: "Tap.mp3",
      spin: "Reload.mp3",
      empty: "ShootFailed.mp3",
      bang: "Shooting.mp3",
      win: "WinA.mp3",
      cashout: "WinB.mp3",
      death: "Failed.mp3",
    },
  },
};
