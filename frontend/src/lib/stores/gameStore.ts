import { writable, derived, get } from 'svelte/store';
import type { GameState, RoundState, PlayResponse, GameMode } from '$lib/types';

// Game configuration constants
export const CHAMBERS = 6;
export const HOUSE_EDGE = 0.0233;
export const MIN_BET = 0.01;
export const MAX_BET = 1000;

// Pre-calculated game modes
export const GAME_MODES: GameMode[] = [
	{ name: 'mode_1_bullet', bullets: 1, survivalRate: 0.8333, multiplier: 1.17, displayName: '1 Bullet' },
	{ name: 'mode_2_bullet', bullets: 2, survivalRate: 0.6667, multiplier: 1.47, displayName: '2 Bullets' },
	{ name: 'mode_3_bullet', bullets: 3, survivalRate: 0.5000, multiplier: 1.95, displayName: '3 Bullets' },
	{ name: 'mode_4_bullet', bullets: 4, survivalRate: 0.3333, multiplier: 2.93, displayName: '4 Bullets' },
	{ name: 'mode_5_bullet', bullets: 5, survivalRate: 0.1667, multiplier: 5.86, displayName: '5 Bullets' },
];

// Initial state
const initialRoundState: RoundState = {
	gameState: 'idle',
	selectedBullets: 1,
	betAmount: 1.00,
	currentPot: 0,
	lastResult: null,
	roundHistory: [],
};

// Stores
export const balance = writable<number>(100.00); // Demo balance
export const roundState = writable<RoundState>(initialRoundState);
export const isSpinning = writable<boolean>(false);
export const showResult = writable<boolean>(false);

// Derived stores
export const currentMode = derived(
	roundState,
	($roundState) => GAME_MODES.find(m => m.bullets === $roundState.selectedBullets) || GAME_MODES[0]
);

export const canPlaceBet = derived(
	[balance, roundState],
	([$balance, $roundState]) =>
		$roundState.gameState === 'idle' &&
		$roundState.betAmount >= MIN_BET &&
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
		const pot = $roundState.gameState === 'continue' ? $roundState.currentPot : $roundState.betAmount;
		return pot * $currentMode.multiplier;
	}
);

// Actions
export function setBetAmount(amount: number) {
	roundState.update(state => ({
		...state,
		betAmount: Math.max(MIN_BET, Math.min(MAX_BET, amount))
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

export function placeBet() {
	const state = get(roundState);
	const currentBalance = get(balance);

	if (state.betAmount > currentBalance) return;

	balance.update(b => b - state.betAmount);
	roundState.update(s => ({
		...s,
		gameState: 'betting',
		currentPot: state.betAmount,
	}));
}

export function continueBetting() {
	roundState.update(s => ({
		...s,
		gameState: 'continue',
	}));
	showResult.set(false);
}

export async function spin() {
	const state = get(roundState);
	const mode = get(currentMode);

	isSpinning.set(true);
	roundState.update(s => ({ ...s, gameState: 'spinning' }));

	// Simulate RGS call with local probability
	await new Promise(resolve => setTimeout(resolve, 1500)); // Animation delay

	// Simulate outcome based on survival rate
	const random = Math.random();
	const survived = random < mode.survivalRate;

	const result: PlayResponse = {
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
		payoutMultiplier: survived ? Math.round(mode.multiplier * 1000000) : 0,
		balance: get(balance)
	};

	const newPot = survived ? state.currentPot * mode.multiplier : 0;

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
		// Lost - reset after showing result
		setTimeout(() => {
			resetRound();
		}, 3000);
	}
}

export function cashOut() {
	const state = get(roundState);
	balance.update(b => b + state.currentPot);
	resetRound();
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
