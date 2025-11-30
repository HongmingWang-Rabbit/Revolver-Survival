<script lang="ts">
	import {
		balance,
		roundState,
		rgsConfig,
		setBetAmount,
		setSelectedBullets,
		placeBet,
		canPlaceBet,
		GAME_MODES
	} from '$lib/stores/gameStore';
	import { SFX } from '$lib/utils/sounds';
	import { TEXT } from '$lib/utils/socialMode';

	// Social text stores
	const placeBetText = TEXT.placeBet;
	const betAmountText = TEXT.betAmount;
	const placeBetBtnText = TEXT.placeBetBtn;
	const betPlacedText = TEXT.betPlaced;

	// Local input value
	let betInput = '1.00';

	$: currentBet = $roundState.betAmount;
	$: selectedBullets = $roundState.selectedBullets;
	$: gameState = $roundState.gameState;
	$: canBet = $canPlaceBet;
	$: minBet = $rgsConfig.minBet;
	$: maxBet = $rgsConfig.maxBet;
	$: currency = $rgsConfig.currency;
	$: betLevels = $rgsConfig.betLevels;

	// Sync input with store
	$: betInput = currentBet.toFixed(2);

	function handleBetInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = parseFloat(target.value);
		if (!isNaN(value)) {
			setBetAmount(value);
		}
	}

	function adjustBet(multiplier: number) {
		const newBet = currentBet * multiplier;
		setBetAmount(Math.max(minBet, Math.min(maxBet, newBet)));
		SFX.play('click');
	}

	function selectBetLevel(amount: number) {
		setBetAmount(amount);
		SFX.play('click');
	}

	function selectBullets(bullets: number) {
		setSelectedBullets(bullets);
		SFX.play('click');
	}

	function handlePlaceBet() {
		if (canBet) {
			placeBet();
			SFX.play('bet');
		}
	}

	// Format bet amount for display
	function formatBetAmount(amount: number): string {
		if (amount >= 1000) {
			return `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
		}
		if (amount >= 1) {
			return amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
		}
		return amount.toFixed(2);
	}

	// Get mode info for selected bullets
	$: currentMode = GAME_MODES.find(m => m.bullets === selectedBullets);
</script>

<div class="bet-controls" class:disabled={gameState !== 'idle'}>
	<!-- Title/Instruction -->
	{#if gameState === 'idle'}
		<div class="panel-header">
			<span class="panel-title">{$placeBetText}</span>
			<span class="panel-subtitle">Load the chamber and pull the trigger</span>
		</div>
	{/if}

	<!-- Play Amount Section -->
	<div class="bet-section">
		<span class="section-label">{$betAmountText}</span>
		<div class="bet-input-group">
			<button class="adjust-btn" on:click={() => adjustBet(0.5)}>1/2</button>

			{#if betLevels.length > 0}
				<!-- Dropdown for bet levels from RGS -->
				<div class="select-wrapper">
					<span class="currency">$</span>
					<select
						bind:value={currentBet}
						on:change={(e) => selectBetLevel(parseFloat(e.currentTarget.value))}
						disabled={gameState !== 'idle'}
					>
						{#each betLevels as level}
							<option value={level.amount}>
								{formatBetAmount(level.amount)}{level.default ? ' ★' : ''}
							</option>
						{/each}
					</select>
				</div>
			{:else}
				<!-- Manual input fallback -->
				<div class="input-wrapper">
					<span class="currency">$</span>
					<input
						type="number"
						bind:value={betInput}
						on:change={handleBetInput}
						min={minBet}
						max={maxBet}
						step="0.01"
						disabled={gameState !== 'idle'}
					/>
				</div>
			{/if}

			<button class="adjust-btn" on:click={() => adjustBet(2)}>2x</button>
		</div>

		<div class="balance-display">
			Balance: <span class="balance-value">${$balance.toFixed(2)}</span>
		</div>
	</div>

	<!-- Bullet Selection Section -->
	<div class="bullet-section">
		<span class="section-label">BULLETS</span>
		<div class="bullet-buttons">
			{#each GAME_MODES as mode}
				<button
					class="bullet-btn"
					class:selected={selectedBullets === mode.bullets}
					on:click={() => selectBullets(mode.bullets)}
					disabled={gameState !== 'idle'}
				>
					<span class="bullet-count">{mode.bullets}</span>
					<span class="bullet-mult">x{mode.multiplier}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Current Mode Info -->
	{#if currentMode}
		<div class="mode-info">
			<div class="info-row">
				<span class="info-label">Survival Rate:</span>
				<span class="info-value survival">{(currentMode.survivalRate * 100).toFixed(1)}%</span>
			</div>
			<div class="info-row">
				<span class="info-label">Potential Win:</span>
				<span class="info-value win">${(currentBet * currentMode.multiplier).toFixed(2)}</span>
			</div>
		</div>
	{/if}

	<!-- Place Play Button -->
	<button
		class="place-bet-btn"
		on:click={handlePlaceBet}
		disabled={!canBet}
	>
		{#if gameState === 'idle'}
			{$placeBetBtnText}
		{:else}
			{$betPlacedText}
		{/if}
	</button>
</div>

<style>
	.bet-controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		background: var(--color-bg-secondary);
		border-radius: 12px;
		border: 1px solid var(--color-bg-tertiary);
		min-width: 260px;
		max-width: 320px;
		transition: opacity 0.3s ease;
	}

	.bet-controls.disabled {
		opacity: 0.7;
		pointer-events: none;
	}

	.panel-header {
		text-align: center;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-bg-tertiary);
	}

	.panel-title {
		display: block;
		font-size: 1.125rem;
		font-weight: bold;
		color: var(--color-text);
		margin-bottom: 0.25rem;
	}

	.panel-subtitle {
		display: block;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.section-label {
		display: block;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		margin-bottom: 0.4rem;
		letter-spacing: 0.1em;
	}

	/* Bet Input */
	.bet-input-group {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.input-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		background: var(--color-bg);
		border: 1px solid var(--color-bg-tertiary);
		border-radius: 8px;
		padding: 0.75rem;
	}

	.currency {
		color: var(--color-text-muted);
		margin-right: 0.25rem;
	}

	input[type="number"] {
		flex: 1;
		background: transparent;
		color: var(--color-text);
		font-size: 1.25rem;
		width: 100%;
	}

	input[type="number"]::-webkit-inner-spin-button,
	input[type="number"]::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.adjust-btn {
		padding: 0.75rem 1rem;
		background: var(--color-bg-tertiary);
		color: var(--color-text);
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: bold;
	}

	.adjust-btn:hover:not(:disabled) {
		background: var(--color-accent);
	}

	/* Select Dropdown */
	.select-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		background: var(--color-bg);
		border: 1px solid var(--color-bg-tertiary);
		border-radius: 8px;
		padding: 0.75rem;
		position: relative;
	}

	.select-wrapper select {
		flex: 1;
		background: transparent;
		color: var(--color-text);
		font-size: 1.25rem;
		font-weight: bold;
		border: none;
		outline: none;
		cursor: pointer;
		appearance: none;
		-webkit-appearance: none;
		padding-right: 1.5rem;
	}

	.select-wrapper::after {
		content: '▼';
		position: absolute;
		right: 0.75rem;
		color: var(--color-text-muted);
		font-size: 0.625rem;
		pointer-events: none;
	}

	.select-wrapper select option {
		background: var(--color-bg-secondary);
		color: var(--color-text);
		padding: 0.5rem;
	}

	.select-wrapper select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.balance-display {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.balance-value {
		color: var(--color-gold);
		font-weight: bold;
	}

	/* Bullet Selection */
	.bullet-buttons {
		display: flex;
		gap: 0.35rem;
		width: 100%;
	}

	.bullet-btn {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.5rem 0.25rem;
		background: var(--color-bg);
		border: 2px solid var(--color-bg-tertiary);
		border-radius: 8px;
		color: var(--color-text);
		transition: all 0.2s ease;
	}

	.bullet-btn:hover:not(:disabled) {
		border-color: var(--color-accent);
	}

	.bullet-btn.selected {
		background: var(--color-accent);
		border-color: var(--color-accent);
	}

	.bullet-count {
		font-size: 1.1rem;
		font-weight: bold;
	}

	.bullet-mult {
		font-size: 0.65rem;
		color: var(--color-text-muted);
	}

	.bullet-btn.selected .bullet-mult {
		color: rgba(255, 255, 255, 0.8);
	}

	/* Mode Info */
	.mode-info {
		padding: 1rem;
		background: var(--color-bg);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.info-label {
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.info-value {
		font-weight: bold;
	}

	.info-value.survival {
		color: var(--color-warning);
	}

	.info-value.win {
		color: var(--color-success);
	}

	/* Place Bet Button */
	.place-bet-btn {
		width: 100%;
		padding: 1rem;
		background: linear-gradient(145deg, var(--color-accent), #cc3333);
		color: white;
		font-size: 1.125rem;
		font-weight: bold;
		letter-spacing: 0.1em;
		border-radius: 8px;
		box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3);
	}

	.place-bet-btn:hover:not(:disabled) {
		background: linear-gradient(145deg, var(--color-accent-hover), #dd4444);
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(255, 68, 68, 0.4);
	}

	.place-bet-btn:disabled {
		background: var(--color-bg-tertiary);
		box-shadow: none;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.bet-controls {
			max-width: 100%;
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		.bet-controls {
			padding: 1rem;
			gap: 0.875rem;
			min-width: unset;
		}

		.panel-title {
			font-size: 1rem;
		}

		.bullet-btn {
			padding: 0.5rem 0.25rem;
		}

		.bullet-count {
			font-size: 1rem;
		}

		.place-bet-btn {
			padding: 0.875rem;
			font-size: 1rem;
		}

		.select-wrapper select {
			font-size: 1rem;
		}
	}
</style>
