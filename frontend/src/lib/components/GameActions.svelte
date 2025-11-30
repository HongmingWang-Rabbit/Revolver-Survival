<script lang="ts">
	import {
		roundState,
		isSpinning,
		showResult,
		spin,
		continueBetting,
		cashOut,
		canSpin,
		potentialWin
	} from '$lib/stores/gameStore';
	import { SFX } from '$lib/utils/sounds';
	import { TEXT } from '$lib/utils/socialMode';

	// Social text stores
	const betAmountText = TEXT.betAmount;
	const cashOutText = TEXT.cashOut;

	$: gameState = $roundState.gameState;
	$: currentPot = $roundState.currentPot;
	$: spinning = $isSpinning;
	$: result = $roundState.lastResult;
	$: showingResult = $showResult;
	$: canSpinNow = $canSpin;
	$: potential = $potentialWin;

	// Use payoutMultiplier to determine survival - more reliable than events
	$: survived = (result?.payoutMultiplier || 0) > 0;

	// Track if we've played the result sound for this result
	let lastPlayedResultId: number | string | null = null;

	// Play sound when result is shown
	$: if (showingResult && result && result.id !== lastPlayedResultId) {
		lastPlayedResultId = result.id;
		if (result.payoutMultiplier > 0) {
			SFX.play('empty');
			setTimeout(() => SFX.play('win'), 100);
		} else {
			SFX.play('bang');
		}
	}

	async function handleSpin() {
		if (!canSpinNow) return;
		SFX.play('spin');
		await spin();
	}

	function handleContinue() {
		SFX.play('click');
		continueBetting();
	}

	async function handleCashOut() {
		SFX.play('cashout');
		await cashOut(); // Call RGS to end round and update balance
	}
</script>

<div class="game-actions">
	{#if gameState === 'idle'}
		<!-- Empty state - message moved to BetControls -->
	{:else if gameState === 'betting' || gameState === 'continue'}
		<!-- Spin Button -->
		<div class="action-group">
			<div class="pot-display">
				<span class="pot-label">{gameState === 'continue' ? 'POT AT RISK' : $betAmountText}</span>
				<span class="pot-value">${currentPot.toFixed(2)}</span>
			</div>

			<button
				class="spin-btn"
				class:spinning
				on:click={handleSpin}
				disabled={spinning}
			>
				{#if spinning}
					<span class="spinner"></span>
					SPINNING...
				{:else}
					PULL TRIGGER
				{/if}
			</button>

			<div class="potential-win">
				Win up to <span class="win-amount">${potential.toFixed(2)}</span>
			</div>

			{#if gameState === 'continue'}
				<button class="cashout-btn" on:click={handleCashOut}>
					{$cashOutText} ${currentPot.toFixed(2)}
				</button>
			{/if}
		</div>
	{:else if gameState === 'spinning'}
		<div class="spinning-message">
			<span class="spinner large"></span>
			<p>The cylinder spins...</p>
		</div>
	{:else if gameState === 'result' && showingResult}
		<div class="result-actions animate-fade-in">
			{#if survived}
				<div class="win-display">
					<span class="win-label">YOU SURVIVED!</span>
					<span class="win-value">${currentPot.toFixed(2)}</span>
				</div>
				<div class="action-buttons">
					<button class="continue-btn" on:click={handleContinue}>
						DOUBLE OR NOTHING
					</button>
					<button class="cashout-btn" on:click={handleCashOut}>
						{$cashOutText}
					</button>
				</div>
			{:else}
				<div class="loss-display">
					<span class="loss-label">GAME OVER</span>
					<span class="loss-message">You lost ${currentPot.toFixed(2)}</span>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.game-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem;
		min-width: 260px;
		max-width: 320px;
		background: var(--color-bg-secondary);
		border-radius: 12px;
		border: 1px solid var(--color-bg-tertiary);
	}

	.action-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		width: 100%;
	}

	.pot-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.pot-label {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		letter-spacing: 0.1em;
	}

	.pot-value {
		font-size: 2rem;
		font-weight: bold;
		color: var(--color-gold);
	}

	.spin-btn {
		width: 100%;
		padding: 1.25rem 2rem;
		background: linear-gradient(145deg, var(--color-accent), #aa2222);
		color: white;
		font-size: 1.25rem;
		font-weight: bold;
		letter-spacing: 0.15em;
		border-radius: 12px;
		box-shadow:
			0 6px 20px rgba(255, 68, 68, 0.4),
			inset 0 2px 4px rgba(255, 255, 255, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition: all 0.2s ease;
	}

	.spin-btn:hover:not(:disabled) {
		transform: translateY(-3px);
		box-shadow:
			0 10px 30px rgba(255, 68, 68, 0.5),
			inset 0 2px 4px rgba(255, 255, 255, 0.1);
	}

	.spin-btn:active:not(:disabled) {
		transform: translateY(-1px);
	}

	.spin-btn.spinning {
		background: var(--color-bg-tertiary);
		box-shadow: none;
	}

	.potential-win {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.win-amount {
		color: var(--color-success);
		font-weight: bold;
	}

	.cashout-btn {
		width: 100%;
		padding: 1rem;
		background: linear-gradient(145deg, var(--color-success), #22aa22);
		color: white;
		font-size: 1rem;
		font-weight: bold;
		letter-spacing: 0.1em;
		border-radius: 8px;
		box-shadow: 0 4px 15px rgba(68, 255, 68, 0.3);
	}

	.cashout-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(68, 255, 68, 0.4);
	}

	.continue-btn {
		width: 100%;
		padding: 1rem;
		background: linear-gradient(145deg, var(--color-warning), #cc8833);
		color: white;
		font-size: 1rem;
		font-weight: bold;
		letter-spacing: 0.1em;
		border-radius: 8px;
		box-shadow: 0 4px 15px rgba(255, 170, 68, 0.3);
	}

	.continue-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(255, 170, 68, 0.4);
	}

	.spinning-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		color: var(--color-text-muted);
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid transparent;
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.spinner.large {
		width: 40px;
		height: 40px;
		border-width: 3px;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.result-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		width: 100%;
	}

	.win-display, .loss-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		text-align: center;
	}

	.win-label {
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--color-success);
		text-shadow: 0 0 20px var(--color-success);
	}

	.win-value {
		font-size: 2.5rem;
		font-weight: bold;
		color: var(--color-gold);
		text-shadow: 0 0 15px var(--color-gold);
	}

	.loss-label {
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--color-accent);
		text-shadow: 0 0 20px var(--color-accent);
	}

	.loss-message {
		color: var(--color-text-muted);
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.game-actions {
			max-width: 100%;
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		.game-actions {
			padding: 1rem;
			min-width: unset;
		}

		.pot-value {
			font-size: 1.5rem;
		}

		.spin-btn {
			padding: 1rem;
			font-size: 1rem;
		}

		.win-label, .loss-label {
			font-size: 1.25rem;
		}

		.win-value {
			font-size: 2rem;
		}
	}
</style>
