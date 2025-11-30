/**
 * Replay Support Utility
 * Handles replay functionality for reviewing past game rounds
 */

import { writable, get } from 'svelte/store';
import type { PlayResponse, GameEvent } from '$lib/types';

export interface ReplayConfig {
	enabled: boolean;
	roundId: string | null;
	events: GameEvent[];
	amount: number;
	currency: string;
	language: string;
	payoutMultiplier: number;
}

const initialReplayConfig: ReplayConfig = {
	enabled: false,
	roundId: null,
	events: [],
	amount: 0,
	currency: 'USD',
	language: 'en',
	payoutMultiplier: 0
};

export const replayConfig = writable<ReplayConfig>(initialReplayConfig);
export const isReplayMode = writable<boolean>(false);

/**
 * Parse replay parameters from URL
 */
export function parseReplayParams(): ReplayConfig | null {
	if (typeof window === 'undefined') return null;

	const params = new URLSearchParams(window.location.search);

	const replay = params.get('replay');
	const roundId = params.get('roundId') || params.get('round_id');

	if (!replay || replay !== 'true') {
		return null;
	}

	// Parse events from URL (base64 encoded JSON)
	let events: GameEvent[] = [];
	const eventsParam = params.get('events');
	if (eventsParam) {
		try {
			events = JSON.parse(atob(eventsParam));
		} catch (e) {
			console.warn('Failed to parse replay events:', e);
		}
	}

	const amount = parseFloat(params.get('amount') || '0');
	const currency = params.get('currency') || 'USD';
	const language = params.get('language') || params.get('lang') || 'en';
	const payoutMultiplier = parseFloat(params.get('multiplier') || params.get('payout_multiplier') || '0');

	return {
		enabled: true,
		roundId,
		events,
		amount,
		currency,
		language,
		payoutMultiplier
	};
}

/**
 * Initialize replay mode if replay params are present
 */
export function initReplayMode(): boolean {
	const config = parseReplayParams();

	if (config && config.enabled) {
		replayConfig.set(config);
		isReplayMode.set(true);
		return true;
	}

	return false;
}

/**
 * Get replay result for displaying
 */
export function getReplayResult(): PlayResponse | null {
	const config = get(replayConfig);

	if (!config.enabled || !config.roundId) {
		return null;
	}

	return {
		id: config.roundId,
		events: config.events,
		payoutMultiplier: config.payoutMultiplier,
		balance: 0 // Not relevant in replay
	};
}

/**
 * Check if current round survived based on events
 */
export function didSurvive(): boolean {
	const config = get(replayConfig);
	return config.payoutMultiplier > 0;
}

/**
 * Reset replay mode
 */
export function exitReplayMode(): void {
	replayConfig.set(initialReplayConfig);
	isReplayMode.set(false);
}

/**
 * Generate a replay URL for a given round
 */
export function generateReplayUrl(
	baseUrl: string,
	roundId: string,
	events: GameEvent[],
	amount: number,
	currency: string,
	payoutMultiplier: number
): string {
	const params = new URLSearchParams({
		replay: 'true',
		roundId,
		events: btoa(JSON.stringify(events)),
		amount: amount.toString(),
		currency,
		multiplier: payoutMultiplier.toString()
	});

	return `${baseUrl}?${params.toString()}`;
}
