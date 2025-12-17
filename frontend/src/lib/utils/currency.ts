/**
 * Currency Utilities
 *
 * Shared functions for formatting and displaying currency values.
 */

/** Common currency symbols mapping */
const CURRENCY_SYMBOLS: Record<string, string> = {
	USD: '$',
	EUR: '€',
	GBP: '£',
	JPY: '¥',
	CNY: '¥',
	KRW: '₩',
	INR: '₹',
	BRL: 'R$',
	CAD: 'C$',
	AUD: 'A$',
};

/**
 * Get the symbol for a currency code.
 * Returns the symbol (e.g., '$') or the currency code with a space (e.g., 'CHF ') if no symbol is defined.
 */
export function getCurrencySymbol(currency: string): string {
	return CURRENCY_SYMBOLS[currency] || `${currency} `;
}

/**
 * Format a numeric amount with currency symbol.
 */
export function formatCurrency(amount: number, currency: string, showSymbol = true): string {
	const symbol = showSymbol ? getCurrencySymbol(currency) : '';
	return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Format a bet amount for compact display.
 * Shows amounts >= 1000 as 'K' format (e.g., 1.5K).
 */
export function formatBetAmount(amount: number): string {
	if (amount >= 1000) {
		return `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
	}
	if (amount >= 1) {
		return amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
	}
	return amount.toFixed(2);
}
