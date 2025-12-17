<script lang="ts">
	import { balance, rgsConfig } from '$lib/stores/gameStore';
	import { SFX } from '$lib/utils/sounds';
	import { isSocialMode } from '$lib/utils/socialMode';
	import { getCurrencySymbol } from '$lib/utils/currency';

	let soundEnabled = true;

	function toggleSound() {
		soundEnabled = SFX.toggle();
	}

	$: currencySymbol = $isSocialMode ? '' : getCurrencySymbol($rgsConfig.currency);
</script>

<header class="header">
	<div class="header-left">
		<button class="icon-btn" on:click={toggleSound} aria-label="Toggle Sound">
			{#if soundEnabled}
				<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
					<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
					<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
				</svg>
			{/if}
		</button>
	</div>

	<div class="header-right">
		<div class="balance-display">
			<span class="balance-label">Balance</span>
			<span class="balance-amount">{currencySymbol}{$balance.toFixed(2)}</span>
		</div>
	</div>
</header>

<style>
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 20px;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.icon-btn {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-panel);
		border: 1px solid var(--color-bg-tertiary);
		border-radius: 8px;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.icon-btn:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}

	.balance-display {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		padding: 8px 14px;
		background: var(--color-panel);
		border-radius: 8px;
	}

	.balance-label {
		font-size: 10px;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.balance-amount {
		font-size: 16px;
		font-weight: 600;
		color: var(--color-text);
	}

	@media (max-width: 480px) {
		.header {
			padding: 8px 12px;
		}

		.icon-btn {
			width: 32px;
			height: 32px;
		}

		.balance-display {
			padding: 6px 10px;
		}

		.balance-label {
			font-size: 9px;
		}

		.balance-amount {
			font-size: 14px;
		}
	}

	/* Compact mode for landscape popouts */
	@media (max-height: 500px) {
		.header {
			padding: 6px 12px;
		}

		.icon-btn {
			width: 28px;
			height: 28px;
		}

		.icon-btn svg {
			width: 14px;
			height: 14px;
		}

		.balance-display {
			padding: 4px 8px;
		}

		.balance-label {
			font-size: 8px;
		}

		.balance-amount {
			font-size: 12px;
		}
	}

	/* Very small landscape */
	@media (max-height: 300px) {
		.header {
			padding: 4px 8px;
		}

		.icon-btn {
			width: 24px;
			height: 24px;
		}

		.balance-display {
			padding: 2px 6px;
		}

		.balance-amount {
			font-size: 11px;
		}
	}
</style>
