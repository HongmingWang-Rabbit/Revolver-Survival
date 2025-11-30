// Game Types for Revolver Survival

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

export type GameEvent = SpinEvent | OutcomeEvent;

export interface PlayResponse {
	id: number;
	events: GameEvent[];
	payoutMultiplier: number;
	balance: number;
}

export interface WalletState {
	balance: number;
	currency: string;
}

export type GameState =
	| 'idle'           // Ready to place bet
	| 'betting'        // Bet placed, choosing bullets
	| 'spinning'       // Cylinder spinning
	| 'result'         // Showing result
	| 'continue';      // Won - can continue or cash out

export interface RoundState {
	gameState: GameState;
	selectedBullets: number;
	betAmount: number;
	currentPot: number;
	lastResult: PlayResponse | null;
	roundHistory: PlayResponse[];
}
