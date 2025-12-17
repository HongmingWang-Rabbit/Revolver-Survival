/**
 * Game Store - Manages all game state for Revolver Survival
 */

import { writable, derived, get } from 'svelte/store';
import { rgsClient, fromRGSAmount, RGSError } from '$lib/services/rgs';
import { gameConfig } from '$lib/config/game';
import type {
	GameMode,
	GameState,
	PlayResponse,
	RoundState,
	RGSConfig,
	BetLevel
} from '$lib/types';

// Re-export types for convenience
export type { GameMode, GameState, PlayResponse, RoundState, RGSConfig };

// ============================================
// Game Configuration Constants
// ============================================

export const CHAMBERS = gameConfig.chambers;
export const HOUSE_EDGE = gameConfig.houseEdge;

// Pre-calculated game modes (match the math engine)
// House edge: 4% | Multiplier = (1 - houseEdge) / (bullets / chambers)
export const GAME_MODES: GameMode[] = [
	{ name: 'mode_1_bullet', bullets: 1, survivalRate: 0.8333, multiplier: 1.152, maxBet: 1000, displayName: '1 Bullet' },
	{ name: 'mode_2_bullet', bullets: 2, survivalRate: 0.6667, multiplier: 1.44, maxBet: 1000, displayName: '2 Bullets' },
	{ name: 'mode_3_bullet', bullets: 3, survivalRate: 0.5000, multiplier: 1.92, maxBet: 1000, displayName: '3 Bullets' },
	{ name: 'mode_4_bullet', bullets: 4, survivalRate: 0.3333, multiplier: 2.88, maxBet: 500, displayName: '4 Bullets' },
	{ name: 'mode_5_bullet', bullets: 5, survivalRate: 0.1667, multiplier: 5.76, maxBet: 200, displayName: '5 Bullets' },
];

// ============================================
// Default Configurations
// ============================================

const DEMO_CONFIG: RGSConfig = {
	initialized: true,
	loading: false,
	error: null,
	minBet: gameConfig.demo.betLevels[0],
	maxBet: gameConfig.demo.betLevels[gameConfig.demo.betLevels.length - 1],
	stepBet: gameConfig.demo.stepBet,
	defaultBet: gameConfig.demo.defaultBet,
	betLevels: gameConfig.demo.betLevels.map((amount) => ({
		amount,
		default: amount === gameConfig.demo.defaultBet
	})),
	currency: 'USD',
	isDemo: true
};

const initialRoundState: RoundState = {
	gameState: 'idle',
	selectedBullets: 1,
	betAmount: gameConfig.demo.defaultBet,
	currentPot: 0,
	lastResult: null,
	roundHistory: [],
	spinCount: 0,
};

const initialRGSConfig: RGSConfig = {
	initialized: false,
	loading: false,
	error: null,
	minBet: gameConfig.demo.betLevels[0],
	maxBet: gameConfig.demo.betLevels[gameConfig.demo.betLevels.length - 1],
	stepBet: gameConfig.demo.stepBet,
	defaultBet: gameConfig.demo.defaultBet,
	betLevels: [],
	currency: 'USD',
	isDemo: true
};

// ============================================
// Stores
// ============================================

export const balance = writable<number>(0);
export const roundState = writable<RoundState>(initialRoundState);
export const isSpinning = writable<boolean>(false);
export const showResult = writable<boolean>(false);
export const rgsConfig = writable<RGSConfig>(initialRGSConfig);

// ============================================
// Auto Bet State
// ============================================

export interface AutoBetConfig {
	isRunning: boolean;
	shouldStop: boolean;
	totalBets: number;
	completedBets: number;
	wins: number;
	losses: number;
	stopOnWins: number;
	continueShots: number;
	currentContinueCount: number;
	profit: number;
	startingBalance: number;
}

const initialAutoBetConfig: AutoBetConfig = {
	isRunning: false,
	shouldStop: false,
	totalBets: gameConfig.autoBet.defaultBets,
	completedBets: 0,
	wins: 0,
	losses: 0,
	stopOnWins: 0,
	continueShots: 0,
	currentContinueCount: 0,
	profit: 0,
	startingBalance: 0,
};

export const autoBetConfig = writable<AutoBetConfig>(initialAutoBetConfig);

// ============================================
// Derived Stores
// ============================================

export const currentMode = derived(
	roundState,
	($roundState) => GAME_MODES.find(m => m.bullets === $roundState.selectedBullets) || GAME_MODES[0]
);

export const canPlaceBet = derived(
	[balance, roundState, rgsConfig, currentMode],
	([$balance, $roundState, $rgsConfig, $currentMode]) =>
		$rgsConfig.initialized &&
		$roundState.gameState === 'idle' &&
		$roundState.betAmount >= $rgsConfig.minBet &&
		$roundState.betAmount <= Math.min($rgsConfig.maxBet, $currentMode.maxBet) &&
		$roundState.betAmount <= $balance
);

export const canSpin = derived(
	[roundState, isSpinning],
	([$roundState, $isSpinning]) =>
		($roundState.gameState === 'betting' || $roundState.gameState === 'continue') &&
		!$isSpinning
);

export const potentialWin = derived(
	[roundState, currentMode],
	([$roundState, $currentMode]) => {
		const amount = $roundState.gameState === 'continue' ? $roundState.currentPot : $roundState.betAmount;
		return amount * $currentMode.multiplier;
	}
);

export const MIN_BET = derived(rgsConfig, ($config) => $config.minBet);
export const MAX_BET = derived(rgsConfig, ($config) => $config.maxBet);

/** Effective max bet considering mode-specific limits */
export const effectiveMaxBet = derived(
	[rgsConfig, currentMode],
	([$config, $mode]) => Math.min($config.maxBet, $mode.maxBet)
);

// ============================================
// Initialization
// ============================================

export async function initializeRGS(): Promise<boolean> {
	rgsConfig.update(c => ({ ...c, loading: true, error: null }));

	const hasRGS = rgsClient.init();

	if (!hasRGS) {
		// No RGS params - use demo mode
		rgsConfig.set(DEMO_CONFIG);
		balance.set(gameConfig.demo.startingBalance);
		roundState.update(s => ({ ...s, betAmount: DEMO_CONFIG.defaultBet }));
		return true;
	}

	try {
		const auth = await rgsClient.authenticate();

		// Parse bet levels from RGS response
		const betLevels: BetLevel[] = (auth.config.betLevels || []).map(amount => ({
			amount: fromRGSAmount(amount),
			default: amount === auth.config.defaultBetLevel
		}));

		const defaultBetAmount = auth.config.defaultBetLevel
			? fromRGSAmount(auth.config.defaultBetLevel)
			: betLevels[0]?.amount || fromRGSAmount(auth.config.minBet);

		const config: RGSConfig = {
			initialized: true,
			loading: false,
			error: null,
			minBet: fromRGSAmount(auth.config.minBet),
			maxBet: fromRGSAmount(auth.config.maxBet),
			stepBet: fromRGSAmount(auth.config.stepBet || auth.config.minBet),
			defaultBet: defaultBetAmount,
			betLevels,
			currency: auth.balance.currency,
			isDemo: false
		};

		rgsConfig.set(config);
		balance.set(fromRGSAmount(auth.balance.amount));
		roundState.update(s => ({ ...s, betAmount: config.defaultBet }));

		// Handle active round from previous session
		if (auth.round) {
			try {
				const endResponse = await rgsClient.endRound(auth.round.roundID);
				balance.set(fromRGSAmount(endResponse.balance.amount));
			} catch {
				// Silent fail - active round cleanup is best-effort
			}
		}

		return true;
	} catch (error) {
		const errorMessage = error instanceof RGSError
			? `${error.code}: ${error.message}`
			: String(error);

		rgsConfig.update(c => ({
			...c,
			loading: false,
			error: errorMessage,
			initialized: false
		}));

		// Fall back to demo mode on error
		rgsConfig.set({ ...DEMO_CONFIG, error: errorMessage });
		balance.set(gameConfig.demo.startingBalance);
		roundState.update(s => ({ ...s, betAmount: DEMO_CONFIG.defaultBet }));

		return false;
	}
}

// ============================================
// Actions
// ============================================

export function setBetAmount(amount: number) {
	const config = get(rgsConfig);
	const stepped = Math.round(amount / config.stepBet) * config.stepBet;
	const clamped = Math.max(config.minBet, Math.min(config.maxBet, stepped));

	roundState.update(state => ({
		...state,
		betAmount: Math.round(clamped * 100) / 100
	}));
}

export function setSelectedBullets(bullets: number) {
	if (bullets >= 1 && bullets <= GAME_MODES.length) {
		roundState.update(state => ({
			...state,
			selectedBullets: bullets
		}));
	}
}

export async function placeBet(): Promise<boolean> {
	const state = get(roundState);
	const currentBalance = get(balance);
	const config = get(rgsConfig);

	if (state.betAmount > currentBalance) return false;
	if (state.betAmount < config.minBet || state.betAmount > config.maxBet) return false;

	if (config.isDemo) {
		balance.update(b => b - state.betAmount);
	}

	roundState.update(s => ({
		...s,
		gameState: 'betting',
		currentPot: state.betAmount,
	}));

	return true;
}

export function continueBetting() {
	roundState.update(s => ({
		...s,
		gameState: 'continue',
	}));
	showResult.set(false);
}

export async function spin(): Promise<PlayResponse | null> {
	const state = get(roundState);
	const mode = get(currentMode);
	const config = get(rgsConfig);

	isSpinning.set(true);
	roundState.update(s => ({ ...s, gameState: 'spinning', spinCount: s.spinCount + 1 }));

	try {
		let result: PlayResponse;

		if (config.isDemo) {
			// Demo mode - simulate locally
			await new Promise(resolve => setTimeout(resolve, gameConfig.timing.spinDuration));

			const random = Math.random();
			const survived = random < mode.survivalRate;

			result = {
				id: Date.now(),
				events: [
					{
						type: 'spin',
						chamber: Math.floor(Math.random() * CHAMBERS) + 1,
						result: survived ? 'empty' : 'live',
						bullets_loaded: mode.bullets
					},
					{
						type: 'outcome',
						status: survived ? 'survived' : 'death',
						message: survived ? 'Click! You survived!' : 'BANG! Game over.'
					}
				],
				payoutMultiplier: survived ? Math.round(mode.multiplier * 100) : 0,
				balance: get(balance)
			};
		} else {
			// RGS mode
			const betAmount = state.gameState === 'continue'
				? Math.round(state.currentPot * 100) / 100
				: state.betAmount;

			balance.update(b => b - betAmount);

			let rgsResponse;
			try {
				rgsResponse = await rgsClient.play(betAmount, mode.name);
			} catch (playError) {
				if (playError instanceof RGSError && playError.message.includes('active bet')) {
					try {
						const endResponse = await rgsClient.endRound();
						balance.set(fromRGSAmount(endResponse.balance.amount));
						rgsResponse = await rgsClient.play(betAmount, mode.name);
					} catch (endError) {
						throw playError;
					}
				} else {
					throw playError;
				}
			}

			balance.set(fromRGSAmount(rgsResponse.balance?.amount || 0));

			const roundData = rgsResponse.round;
			result = {
				id: roundData?.roundID || roundData?.id || Date.now(),
				events: roundData?.events || [],
				payoutMultiplier: roundData?.payoutMultiplier || 0,
				balance: fromRGSAmount(rgsResponse.balance?.amount || 0)
			};

			roundState.update(s => ({ ...s, currentRoundId: String(roundData?.roundID || roundData?.id || '') }));
		}

		// Calculate result
		const survived = result.payoutMultiplier > 0;
		const multiplier = result.payoutMultiplier > 10
			? result.payoutMultiplier / 100
			: result.payoutMultiplier;
		const betAmount = state.gameState === 'continue' ? state.currentPot : state.betAmount;
		const newPot = survived ? Math.round(betAmount * multiplier * 100) / 100 : 0;

		isSpinning.set(false);
		showResult.set(true);

		roundState.update(s => ({
			...s,
			gameState: 'result',
			currentPot: newPot,
			lastResult: result,
			roundHistory: [...s.roundHistory, result]
		}));

		if (!survived) {
			setTimeout(() => {
				resetRound();
			}, gameConfig.timing.deathResetDelay);
		}

		return result;
	} catch (error) {
		isSpinning.set(false);

		if (!config.isDemo && state.gameState !== 'continue') {
			balance.update(b => b + state.betAmount);
		}

		roundState.update(s => ({
			...s,
			gameState: 'idle',
		}));

		throw error;
	}
}

export async function cashOut(): Promise<boolean> {
	const state = get(roundState);
	const config = get(rgsConfig);

	if (config.isDemo) {
		balance.update(b => b + state.currentPot);
		resetRound();
		return true;
	}

	try {
		const response = await rgsClient.endRound(state.currentRoundId);
		balance.set(fromRGSAmount(response.balance.amount));
		resetRound();
		return true;
	} catch (error) {
		resetRound();
		throw error;
	}
}

export function resetRound() {
	const state = get(roundState);
	roundState.set({
		...initialRoundState,
		betAmount: state.betAmount,
		selectedBullets: state.selectedBullets,
	});
	showResult.set(false);
}

export async function refreshBalance(): Promise<void> {
	const config = get(rgsConfig);
	if (config.isDemo) return;

	try {
		const balanceResponse = await rgsClient.getBalance();
		balance.set(fromRGSAmount(balanceResponse.amount));
	} catch {
		// Silent fail - balance will sync on next successful operation
	}
}

// ============================================
// Auto Bet Actions
// ============================================

export function startAutoBet(config: { totalBets: number; stopOnWins: number; continueShots: number }) {
	const currentBalance = get(balance);

	autoBetConfig.set({
		isRunning: true,
		shouldStop: false,
		totalBets: config.totalBets,
		completedBets: 0,
		wins: 0,
		losses: 0,
		stopOnWins: config.stopOnWins,
		continueShots: config.continueShots,
		currentContinueCount: 0,
		profit: 0,
		startingBalance: currentBalance,
	});
}

export function incrementContinueCount() {
	autoBetConfig.update(c => ({ ...c, currentContinueCount: c.currentContinueCount + 1 }));
}

export function resetContinueCount() {
	autoBetConfig.update(c => ({ ...c, currentContinueCount: 0 }));
}

export function stopAutoBet() {
	autoBetConfig.update(c => ({ ...c, shouldStop: true }));
}

export function resetAutoBet() {
	autoBetConfig.set(initialAutoBetConfig);
}

export function updateAutoBetStats(won: boolean, payout: number, betAmount: number) {
	autoBetConfig.update(c => ({
		...c,
		completedBets: c.completedBets + 1,
		wins: won ? c.wins + 1 : c.wins,
		losses: won ? c.losses : c.losses + 1,
		profit: c.profit + (won ? payout - betAmount : -betAmount),
	}));
}

export function shouldStopAutoBet(): boolean {
	const config = get(autoBetConfig);

	// Check if manually stopped
	if (config.shouldStop) return true;

	// Check if completed all bets
	if (config.completedBets >= config.totalBets) return true;

	// Check stop on wins condition
	if (config.stopOnWins > 0 && config.wins >= config.stopOnWins) return true;

	// Check if balance is too low
	const currentBalance = get(balance);
	const state = get(roundState);
	if (currentBalance < state.betAmount) return true;

	return false;
}

export function finalizeAutoBet() {
	autoBetConfig.update(c => ({ ...c, isRunning: false, shouldStop: false }));
}
