/**
 * Social Mode Utilities
 * Handles Stake.us social gaming terminology requirements
 */

import { writable, derived } from 'svelte/store';

// Social mode store - can be set based on RGS config or URL params
export const isSocialMode = writable<boolean>(false);

/**
 * Initialize social mode detection from URL or config
 */
export function initSocialMode(): void {
	if (typeof window === 'undefined') return;

	const params = new URLSearchParams(window.location.search);
	const socialParam = params.get('social') || params.get('socialCasino');

	if (socialParam === 'true' || socialParam === '1') {
		isSocialMode.set(true);
	}
}

/**
 * Set social mode from RGS jurisdiction config
 */
export function setSocialModeFromConfig(socialCasino: boolean): void {
	isSocialMode.set(socialCasino);
}

/**
 * Social-compliant text mappings
 * Maps standard gambling terms to social gaming alternatives
 */
const textMappings: Record<string, string> = {
	// Bet-related
	'bet': 'play',
	'Bet': 'Play',
	'BET': 'PLAY',
	'bets': 'plays',
	'Bets': 'Plays',
	'BETS': 'PLAYS',
	'betting': 'playing',
	'Betting': 'Playing',
	'BETTING': 'PLAYING',
	'Place your bet': 'Place your play',
	'PLACE BET': 'PLAY NOW',
	'BET PLACED': 'PLAYING',
	'BET AMOUNT': 'PLAY AMOUNT',
	'total bet': 'total play',
	'Total Bet': 'Total Play',
	'TOTAL BET': 'TOTAL PLAY',

	// Cash-related
	'cash': 'coins',
	'Cash': 'Coins',
	'CASH': 'COINS',
	'CASH OUT': 'COLLECT',
	'Cash Out': 'Collect',
	'cash out': 'collect',

	// Money-related
	'money': 'coins',
	'Money': 'Coins',
	'MONEY': 'COINS',

	// Currency
	'currency': 'token',
	'Currency': 'Token',
	'CURRENCY': 'TOKEN',

	// Other gambling terms
	'gamble': 'play',
	'Gamble': 'Play',
	'GAMBLE': 'PLAY',
	'wager': 'play',
	'Wager': 'Play',
	'WAGER': 'PLAY',
	'deposit': 'get coins',
	'Deposit': 'Get Coins',
	'DEPOSIT': 'GET COINS',
	'withdraw': 'redeem',
	'Withdraw': 'Redeem',
	'WITHDRAW': 'REDEEM',
	'credit': 'coins',
	'Credit': 'Coins',
	'CREDIT': 'COINS',

	// Payout-related
	'pay out': 'win',
	'Pay Out': 'Win',
	'PAY OUT': 'WIN',
	'paid out': 'won',
	'Paid Out': 'Won',
	'PAID OUT': 'WON',
	'pays out': 'wins',
	'Pays Out': 'Wins',
	'PAYS OUT': 'WINS',

	// Buy-related
	'buy bonus': 'get bonus',
	'Buy Bonus': 'Get Bonus',
	'BUY BONUS': 'GET BONUS',
	'bonus buy': 'bonus',
	'Bonus Buy': 'Bonus',
	'BONUS BUY': 'BONUS',
};

/**
 * Get social-compliant text based on current mode
 * @param standardText - The standard gambling terminology
 * @param socialText - Optional override for social mode text
 * @returns Appropriate text based on mode
 */
export function getText(standardText: string, socialText?: string): string {
	let isSocial = false;
	isSocialMode.subscribe(value => isSocial = value)();

	if (!isSocial) {
		return standardText;
	}

	// Use provided social text if available
	if (socialText) {
		return socialText;
	}

	// Check mappings
	if (textMappings[standardText]) {
		return textMappings[standardText];
	}

	return standardText;
}

/**
 * Create a derived store for reactive social text
 */
export function createSocialText(standardText: string, socialText?: string) {
	return derived(isSocialMode, ($isSocial) => {
		if (!$isSocial) {
			return standardText;
		}

		if (socialText) {
			return socialText;
		}

		if (textMappings[standardText]) {
			return textMappings[standardText];
		}

		return standardText;
	});
}

// Pre-defined reactive text stores for common UI elements
export const TEXT = {
	placeBet: createSocialText('Place your bet', 'Place your play'),
	betAmount: createSocialText('BET AMOUNT', 'PLAY AMOUNT'),
	placeBetBtn: createSocialText('PLACE BET', 'PLAY NOW'),
	betPlaced: createSocialText('BET PLACED', 'PLAYING'),
	cashOut: createSocialText('CASH OUT', 'COLLECT'),
	balance: createSocialText('BALANCE', 'COINS'),
};
