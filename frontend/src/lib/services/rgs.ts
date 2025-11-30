/**
 * RGS (Remote Gaming Server) Client for Stake Engine
 * Handles all communication with the Stake Engine RGS API
 */

import type {
	RGSClientConfig,
	Balance,
	BetLevel,
	RoundData,
	GameEvent,
	AuthResponse,
	RGSPlayResponse,
	EndRoundResponse
} from '$lib/types';

// Re-export types that are needed by other modules
export type { Balance, BetLevel, AuthResponse, RGSPlayResponse as PlayResponse, EndRoundResponse, GameEvent };

// Monetary conversion: RGS uses 6 decimal places (1,000,000 = $1)
const PRECISION = 1000000;

export function toRGSAmount(amount: number): number {
	return Math.round(amount * PRECISION);
}

export function fromRGSAmount(amount: number): number {
	return amount / PRECISION;
}

// Parse URL parameters provided by Stake Engine
export function getRGSConfig(): RGSClientConfig | null {
	if (typeof window === 'undefined') return null;

	const params = new URLSearchParams(window.location.search);

	const sessionID = params.get('sessionID');
	const rgsUrl = params.get('rgs_url') || params.get('rgsUrl');
	const language = params.get('lang') || params.get('language') || 'en';
	const currency = params.get('currency') || 'USD';

	if (!sessionID || !rgsUrl) {
		console.warn('RGS: Missing required URL parameters (sessionID, rgs_url)');
		return null;
	}

	// Ensure rgsUrl has protocol
	const fullRgsUrl = rgsUrl.startsWith('http') ? rgsUrl : `https://${rgsUrl}`;

	return {
		sessionID,
		rgsUrl: fullRgsUrl,
		language,
		currency
	};
}

// Custom error class for RGS errors
export class RGSError extends Error {
	code: string;
	httpStatus: number;

	constructor(code: string, message: string, httpStatus: number) {
		super(message);
		this.name = 'RGSError';
		this.code = code;
		this.httpStatus = httpStatus;
	}

	isInvalidSession(): boolean {
		return this.code === 'ERR_IS';
	}

	isInsufficientBalance(): boolean {
		return this.code === 'ERR_IPB';
	}

	isGamblingLimitExceeded(): boolean {
		return this.code === 'ERR_GLE';
	}
}

// RGS Client class
class RGSClient {
	private config: RGSClientConfig | null = null;
	private initialized = false;

	init(): boolean {
		this.config = getRGSConfig();
		this.initialized = this.config !== null;
		return this.initialized;
	}

	isInitialized(): boolean {
		return this.initialized && this.config !== null;
	}

	getConfig(): RGSClientConfig | null {
		return this.config;
	}

	private async request<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
		if (!this.config) {
			throw new Error('RGS client not initialized');
		}

		const url = `${this.config.rgsUrl}${endpoint}`;

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					sessionID: this.config.sessionID,
					...body
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new RGSError(
					errorData.code || 'ERR_UNKNOWN',
					errorData.message || `HTTP ${response.status}`,
					response.status
				);
			}

			return await response.json();
		} catch (error) {
			if (error instanceof RGSError) throw error;
			throw new RGSError('ERR_NETWORK', `Network error: ${error}`, 0);
		}
	}

	async authenticate(): Promise<AuthResponse> {
		if (!this.config) {
			throw new Error('RGS client not initialized');
		}

		return this.request<AuthResponse>('/wallet/authenticate', {
			language: this.config.language,
			currency: this.config.currency
		});
	}

	async getBalance(): Promise<Balance> {
		const response = await this.request<{ balance: Balance }>('/wallet/balance', {});
		return response.balance;
	}

	async play(amount: number, mode: string): Promise<RGSPlayResponse> {
		return this.request<RGSPlayResponse>('/wallet/play', {
			amount: toRGSAmount(amount),
			mode
		});
	}

	async endRound(roundId?: string): Promise<EndRoundResponse> {
		return this.request<EndRoundResponse>('/wallet/end-round', {
			roundId
		});
	}
}

// Singleton instance
export const rgsClient = new RGSClient();
