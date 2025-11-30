/**
 * RGS (Remote Gaming Server) Client
 *
 * Handles communication with Stake Engine RGS API.
 * In demo mode, uses local simulation. In production,
 * connects to the actual RGS endpoint.
 */

import type { PlayResponse, WalletState, GameMode } from '$lib/types';

// Get RGS URL from query params or use demo mode
function getRgsUrl(): string | null {
	if (typeof window === 'undefined') return null;
	const params = new URLSearchParams(window.location.search);
	return params.get('rgs_url');
}

function getSessionId(): string | null {
	if (typeof window === 'undefined') return null;
	const params = new URLSearchParams(window.location.search);
	return params.get('sessionID');
}

// Monetary precision: 6 decimal places
const PRECISION = 1000000;

function toApiAmount(amount: number): string {
	return Math.round(amount * PRECISION).toString();
}

function fromApiAmount(amount: string | number): number {
	const num = typeof amount === 'string' ? parseInt(amount, 10) : amount;
	return num / PRECISION;
}

export class RGSClient {
	private rgsUrl: string | null;
	private sessionId: string | null;
	private isDemoMode: boolean;

	constructor() {
		this.rgsUrl = getRgsUrl();
		this.sessionId = getSessionId();
		this.isDemoMode = !this.rgsUrl || !this.sessionId;

		if (this.isDemoMode) {
			console.log('RGS Client: Running in demo mode');
		} else {
			console.log('RGS Client: Connected to', this.rgsUrl);
		}
	}

	get isDemo(): boolean {
		return this.isDemoMode;
	}

	/**
	 * Authenticate and get wallet state
	 */
	async authenticate(): Promise<WalletState> {
		if (this.isDemoMode) {
			return {
				balance: 100.00,
				currency: 'USD'
			};
		}

		const response = await fetch(`${this.rgsUrl}/wallet/authenticate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				sessionID: this.sessionId
			})
		});

		if (!response.ok) {
			throw new Error(`Authentication failed: ${response.status}`);
		}

		const data = await response.json();
		return {
			balance: fromApiAmount(data.balance),
			currency: data.currency || 'USD'
		};
	}

	/**
	 * Get current balance
	 */
	async getBalance(): Promise<number> {
		if (this.isDemoMode) {
			return 100.00; // Demo mode returns static balance
		}

		const response = await fetch(`${this.rgsUrl}/wallet/balance`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				sessionID: this.sessionId
			})
		});

		if (!response.ok) {
			throw new Error(`Balance fetch failed: ${response.status}`);
		}

		const data = await response.json();
		return fromApiAmount(data.balance);
	}

	/**
	 * Place a bet and get round result
	 */
	async play(mode: GameMode, betAmount: number): Promise<PlayResponse> {
		if (this.isDemoMode) {
			// Simulate locally based on probability
			return this.simulatePlay(mode, betAmount);
		}

		const response = await fetch(`${this.rgsUrl}/wallet/play`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				sessionID: this.sessionId,
				mode: mode.name,
				amount: toApiAmount(betAmount)
			})
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({}));
			throw new Error(error.message || `Play failed: ${response.status}`);
		}

		const data = await response.json();
		return {
			id: data.simulationId,
			events: data.events,
			payoutMultiplier: data.payoutMultiplier,
			balance: fromApiAmount(data.balance)
		};
	}

	/**
	 * End round and process payout
	 */
	async endRound(payout: number): Promise<number> {
		if (this.isDemoMode) {
			return payout;
		}

		const response = await fetch(`${this.rgsUrl}/wallet/end-round`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				sessionID: this.sessionId,
				payout: toApiAmount(payout)
			})
		});

		if (!response.ok) {
			throw new Error(`End round failed: ${response.status}`);
		}

		const data = await response.json();
		return fromApiAmount(data.balance);
	}

	/**
	 * Local simulation for demo mode
	 */
	private simulatePlay(mode: GameMode, betAmount: number): PlayResponse {
		const random = Math.random();
		const survived = random < mode.survivalRate;
		const chamber = Math.floor(Math.random() * 6) + 1;

		return {
			id: Date.now(),
			events: [
				{
					type: 'spin',
					chamber,
					result: survived ? 'empty' : 'live',
					bullets_loaded: mode.bullets
				},
				{
					type: 'outcome',
					status: survived ? 'survived' : 'death',
					message: survived ? 'Click! You survived!' : 'BANG! Game over.'
				}
			],
			payoutMultiplier: survived ? Math.round(mode.multiplier * PRECISION) : 0,
			balance: 0 // Will be updated by store
		};
	}
}

// Singleton instance
let clientInstance: RGSClient | null = null;

export function getRGSClient(): RGSClient {
	if (!clientInstance) {
		clientInstance = new RGSClient();
	}
	return clientInstance;
}
