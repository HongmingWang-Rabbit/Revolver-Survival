/**
 * Revolver Survival - Type Definitions
 * Single source of truth for all game types
 */

// ============================================
// Game Configuration Types
// ============================================

export interface GameMode {
	name: string;
	bullets: number;
	survivalRate: number;
	multiplier: number;
	displayName: string;
}

export interface GameConfig {
	game: string;
	version: string;
	chambers: number;
	modes: GameMode[];
}

// ============================================
// Game Event Types
// ============================================

export interface SpinEvent {
	type: 'spin';
	chamber: number;
	result: 'empty' | 'live';
	bullets_loaded: number;
}

export interface OutcomeEvent {
	type: 'outcome';
	status: 'survived' | 'death';
	message: string;
}

export interface GenericGameEvent {
	type: string;
	chamber?: number;
	result?: string;
	bullets_loaded?: number;
	status?: string;
	message?: string;
}

export type GameEvent = SpinEvent | OutcomeEvent | GenericGameEvent;

// ============================================
// Game State Types
// ============================================

export type GameState =
	| 'idle'       // Ready to place bet
	| 'betting'    // Bet placed, ready to spin
	| 'spinning'   // Cylinder spinning
	| 'result'     // Showing result
	| 'continue';  // Won - can continue or cash out

export interface PlayResponse {
	id: number | string;
	events: GameEvent[];
	payoutMultiplier: number;
	balance: number;
}

export interface RoundState {
	gameState: GameState;
	selectedBullets: number;
	betAmount: number;
	currentPot: number;
	lastResult: PlayResponse | null;
	roundHistory: PlayResponse[];
	currentRoundId?: string;
}

// ============================================
// RGS (Remote Gaming Server) Types
// ============================================

export interface BetLevel {
	amount: number;
	default?: boolean;
}

export interface RGSConfig {
	initialized: boolean;
	loading: boolean;
	error: string | null;
	minBet: number;
	maxBet: number;
	stepBet: number;
	defaultBet: number;
	betLevels: BetLevel[];
	currency: string;
	isDemo: boolean;
}

export interface Balance {
	amount: number;
	currency: string;
}

export interface WalletState {
	balance: number;
	currency: string;
}

// ============================================
// RGS API Response Types
// ============================================

export interface RGSClientConfig {
	sessionID: string;
	rgsUrl: string;
	language: string;
	currency: string;
}

export interface RoundData {
	roundID: string;
	id: number;
	events: GameEvent[];
	payoutMultiplier: number;
}

export interface AuthResponse {
	balance: Balance;
	config: {
		betLevels: number[];
		minBet: number;
		maxBet: number;
		stepBet?: number;
		defaultBetLevel?: number;
	};
	jurisdiction?: {
		socialCasino?: boolean;
		disabledFullscreen?: boolean;
		disabledTurbo?: boolean;
	};
	round?: RoundData | null;
	status?: {
		statusCode: string;
		statusMessage?: string;
	};
}

export interface RGSPlayResponse {
	balance: Balance;
	round: RoundData;
	status?: {
		statusCode: string;
		statusMessage?: string;
	};
}

export interface EndRoundResponse {
	balance: Balance;
	payout: number;
}
