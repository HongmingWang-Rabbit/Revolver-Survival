/**
 * Game Store - Manages all game state for Revolver Survival
 */

import { writable, derived, get } from 'svelte/store';
import { rgsClient, fromRGSAmount, RGSError } from '$lib/services/rgs';
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

export const CHAMBERS = 6;
export const HOUSE_EDGE = 0.0233;

// Pre-calculated game modes (match the math engine)
// Note: Mode 2 uses 1.46x (floor) instead of 1.47x (round) to keep RTP variation within 0.5%
export const GAME_MODES: GameMode[] = [
	{ name: 'mode_1_bullet', bullets: 1, survivalRate: 0.8333, multiplier: 1.17, displayName: '1 Bullet' },
	{ name: 'mode_2_bullet', bullets: 2, survivalRate: 0.6667, multiplier: 1.46, displayName: '2 Bullets' },
	{ name: 'mode_3_bullet', bullets: 3, survivalRate: 0.5000, multiplier: 1.95, displayName: '3 Bullets' },
	{ name: 'mode_4_bullet', bullets: 4, survivalRate: 0.3333, multiplier: 2.93, displayName: '4 Bullets' },
	{ name: 'mode_5_bullet', bullets: 5, survivalRate: 0.1667, multiplier: 5.86, displayName: '5 Bullets' },
];

// ============================================
// Default Configurations
// ============================================

const DEMO_CONFIG: RGSConfig = {
	initialized: true,
	loading: false,
	error: null,
	minBet: 0.01,
	maxBet: 1000,
	stepBet: 0.01,
	defaultBet: 1.00,
	betLevels: [
		{ amount: 0.10 },
		{ amount: 0.50 },
		{ amount: 1.00, default: true },
		{ amount: 5.00 },
		{ amount: 10.00 },
		{ amount: 50.00 },
		{ amount: 100.00 }
	],
	currency: 'USD',
	isDemo: true
};

const initialRoundState: RoundState = {
	gameState: 'idle',
	selectedBullets: 1,
	betAmount: 1.00,
	currentPot: 0,
	lastResult: null,
	roundHistory: [],
};

const initialRGSConfig: RGSConfig = {
	initialized: false,
	loading: false,
	error: null,
	minBet: 0.01,
	maxBet: 1000,
	stepBet: 0.01,
	defaultBet: 1.00,
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
// Derived Stores
// ============================================

export const currentMode = derived(
	roundState,
	($roundState) => GAME_MODES.find(m => m.bullets === $roundState.selectedBullets) || GAME_MODES[0]
);

export const canPlaceBet = derived(
	[balance, roundState, rgsConfig],
	([$balance, $roundState, $rgsConfig]) =>
		$rgsConfig.initialized &&
		$roundState.gameState === 'idle' &&
		$roundState.betAmount >= $rgsConfig.minBet &&
		$roundState.betAmount <= $rgsConfig.maxBet &&
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

// ============================================
// Initialization
// ============================================

export async function initializeRGS(): Promise<boolean> {
	rgsConfig.update(c => ({ ...c, loading: true, error: null }));

	const hasRGS = rgsClient.init();

	if (!hasRGS) {
		// No RGS params - use demo mode
		rgsConfig.set(DEMO_CONFIG);
		balance.set(100.00);
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
			} catch (error) {
				console.warn('RGS: Failed to end active round', error);
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
		balance.set(100.00);
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
	if (bullets >= 1 && bullets <= 5) {
		roundState.update(state => ({
			...state,
			selectedBullets: bullets
		}));
	}
}

export function selectBetLevel(amount: number) {
	setBetAmount(amount);
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
	roundState.update(s => ({ ...s, gameState: 'spinning' }));

	try {
		let result: PlayResponse;

		if (config.isDemo) {
			// Demo mode - simulate locally
			await new Promise(resolve => setTimeout(resolve, 1500));

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
			}, 3000);
		}

		return result;
	} catch (error) {
		console.error('Spin error:', error);
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
		console.error('Cash out error:', error);
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
	} catch (error) {
		console.error('Failed to refresh balance:', error);
	}
}
