<script lang="ts">
	import { onMount } from 'svelte';
	import {
		balance,
		roundState,
		rgsConfig,
		setBetAmount,
		setSelectedBullets,
		placeBet,
		spin,
		cashOut,
		continueBetting,
		canPlaceBet,
		canSpin,
		isSpinning,
		showResult,
		autoBetConfig,
		startAutoBet,
		stopAutoBet,
		updateAutoBetStats,
		shouldStopAutoBet,
		finalizeAutoBet,
		incrementContinueCount,
		resetContinueCount,
		GAME_MODES
	} from '$lib/stores/gameStore';
	import { SFX } from '$lib/utils/sounds';
	import { isSocialMode } from '$lib/utils/socialMode';
	import { getCurrencySymbol } from '$lib/utils/currency';
	import { gameConfig } from '$lib/config/game';

	// Tab mode: 'manual' or 'auto'
	let activeTab: 'manual' | 'auto' = 'manual';

	// Auto bet settings
	let autoBetCount = gameConfig.autoBet.defaultBets;
	let autoStopOnWin = 0;
	let autoContinueShots = 0;

	// Mobile detection
	let isMobilePortrait = false;
	let isCompact = false;
	onMount(() => {
		const check = () => {
			isMobilePortrait = window.innerWidth <= 1024 && window.innerHeight > 500;
			isCompact = window.innerHeight <= 500;
		};
		check();
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	});

	$: currencySymbol = $isSocialMode ? '' : getCurrencySymbol($rgsConfig.currency);

	// Local input value for manual entry
	let betInput = '1.00';

	$: currentBet = $roundState.betAmount;
	$: selectedBullets = $roundState.selectedBullets;
	$: gameState = $roundState.gameState;
	$: canBet = $canPlaceBet;
	$: spinning = $isSpinning;
	$: minBet = $rgsConfig.minBet;
	$: maxBet = $rgsConfig.maxBet;
	$: currentPot = $roundState.currentPot;
	$: result = $roundState.lastResult;
	$: showingResult = $showResult;
	$: survived = (result?.payoutMultiplier || 0) > 0;
	$: isAutoBetting = $autoBetConfig.isRunning;

	// Sync input with store
	$: betInput = currentBet.toFixed(2);

	// Get mode info for selected bullets
	$: currentMode = GAME_MODES.find(m => m.bullets === selectedBullets);

	// Hide on portrait mobile when game is active
	$: hideOnMobile = isMobilePortrait && gameState !== 'idle';

	// Track if we've played the result sound for this result
	let lastPlayedResultId: number | string | null = null;

	// Play sound when result is shown
	$: if (showingResult && result && result.id !== lastPlayedResultId) {
		lastPlayedResultId = result.id;
		const { timing } = gameConfig;
		if (result.payoutMultiplier > 0) {
			setTimeout(() => SFX.play('empty'), timing.emptySoundDelay);
			setTimeout(() => SFX.play('win'), timing.winSoundDelay);
		} else {
			setTimeout(() => SFX.play('bang'), timing.bangSoundDelay);
			setTimeout(() => SFX.play('death'), timing.bangSoundDelay + timing.deathSoundDelay);
		}
	}

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

	async function handleSpin() {
		if (!$canSpin) return;
		SFX.play('spin');
		await spin();
	}

	function handleContinue() {
		SFX.play('click');
		continueBetting();
	}

	async function handleCashOut() {
		SFX.play('cashout');
		await cashOut();
	}

	// Auto bet implementation
	async function runAutoBet() {
		if (isAutoBetting) {
			// Stop auto bet
			stopAutoBet();
			return;
		}

		// Validate settings
		if (autoBetCount < 1 || autoBetCount > gameConfig.autoBet.maxBets) {
			return;
		}

		// Start auto bet
		startAutoBet({
			totalBets: autoBetCount,
			stopOnWins: autoStopOnWin,
			continueShots: autoContinueShots,
		});

		SFX.play('click');

		// Run the auto bet loop
		await executeAutoBetLoop();
	}

	async function executeAutoBetLoop() {
		while (!shouldStopAutoBet()) {
			try {
				// Place bet (only if not continuing)
				if ($roundState.gameState === 'idle') {
					const betPlaced = await placeBet();
					if (!betPlaced) {
						break;
					}
					SFX.play('bet');
				} else if ($roundState.gameState === 'result') {
					// Continue from previous win
					continueBetting();
					SFX.play('click');
				}

				// Small delay before spin
				await delay(gameConfig.timing.autoBetSpinDelay);

				// Spin
				SFX.play('spin');
				const result = await spin();

				if (!result) {
					break;
				}

				const won = result.payoutMultiplier > 0;
				const betAmount = $roundState.betAmount;

				// Wait for result animation
				await delay(gameConfig.timing.resultDisplayDuration);

				if (won) {
					const { continueShots, currentContinueCount } = $autoBetConfig;

					// Check if we should continue or cash out
					if (continueShots > 0 && currentContinueCount < continueShots) {
						// Continue betting
						incrementContinueCount();
						// Don't update stats yet - will update when we finally cash out or lose
					} else {
						// Cash out - update stats with final payout
						const payout = $roundState.currentPot;
						updateAutoBetStats(true, payout, betAmount);
						SFX.play('cashout');
						await cashOut();
						resetContinueCount();

						// Wait before next bet
						await delay(gameConfig.timing.autoBetRoundDelay);
					}
				} else {
					// Lost - update stats
					updateAutoBetStats(false, 0, betAmount);
					resetContinueCount();

					// Wait before next bet
					await delay(gameConfig.timing.autoBetRoundDelay);
				}

				// Check stop conditions
				if (shouldStopAutoBet()) {
					break;
				}
			} catch {
				// Error during auto bet - stop gracefully
				break;
			}
		}

		// Finalize auto bet
		finalizeAutoBet();
		SFX.play('click');
	}

	function delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
</script>

<div class="control-panel" class:compact={isCompact} style={hideOnMobile ? 'display: none !important;' : ''}>
	<!-- Tab Toggle -->
	<div class="tab-toggle">
		<button
			class="tab-btn"
			class:active={activeTab === 'manual'}
			on:click={() => { activeTab = 'manual'; SFX.play('click'); }}
			disabled={isAutoBetting}
		>
			Manual
		</button>
		<button
			class="tab-btn"
			class:active={activeTab === 'auto'}
			on:click={() => { activeTab = 'auto'; SFX.play('click'); }}
			disabled={isAutoBetting}
		>
			Auto
		</button>
	</div>

	{#if activeTab === 'manual'}
		<!-- Manual Bet Tab -->
		<div class="panel-content">
			<!-- Bet Amount Section -->
			<div class="form-section">
				<div class="form-label">
					<span>Bet Amount</span>
					<span class="balance-value">{currencySymbol}{$balance.toFixed(2)}</span>
				</div>
				<div class="bet-input-row">
					<div class="input-field">
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
					<button class="adjust-btn" on:click={() => adjustBet(0.5)} disabled={gameState !== 'idle'}>1/2</button>
					<button class="adjust-btn" on:click={() => adjustBet(2)} disabled={gameState !== 'idle'}>2X</button>
				</div>
			</div>

			<!-- Difficulty Selection -->
			<div class="form-section">
				<div class="form-label">
					<span>Difficulty</span>
				</div>
				<div class="input-field select-field">
					<select
						bind:value={selectedBullets}
						on:change={(e) => selectBullets(parseInt(e.currentTarget.value))}
						disabled={gameState !== 'idle'}
					>
						{#each GAME_MODES as mode}
							<option value={mode.bullets}>
								{mode.bullets} Bullet{mode.bullets > 1 ? 's' : ''} - {mode.multiplier}x
							</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Action Buttons -->
			{#if gameState === 'idle'}
				<button
					class="action-btn primary"
					on:click={handlePlaceBet}
					disabled={!canBet}
				>
					Place Bet
				</button>
			{:else if gameState === 'betting' || gameState === 'continue'}
				{#if gameState === 'continue'}
					<button
						class="action-btn cashout"
						on:click={handleCashOut}
					>
						Cash Out {currencySymbol}{currentPot.toFixed(2)}
					</button>
				{/if}
				<button
					class="action-btn {gameState === 'continue' ? 'secondary' : 'primary'}"
					class:spinning
					on:click={handleSpin}
					disabled={spinning}
				>
					{#if spinning}
						Spinning...
					{:else}
						{gameState === 'continue' ? `Continue ${currencySymbol}${(currentPot * (currentMode?.multiplier || 2)).toFixed(2)}` : 'Start'}
					{/if}
				</button>
			{:else if gameState === 'result' && showingResult}
				{#if survived}
					<button
						class="action-btn cashout"
						on:click={handleCashOut}
					>
						Cash Out {currencySymbol}{currentPot.toFixed(2)}
					</button>
					<button
						class="action-btn secondary"
						on:click={handleContinue}
					>
						Continue {currencySymbol}{(currentPot * (currentMode?.multiplier || 2)).toFixed(2)}
					</button>
				{/if}
			{/if}

			<!-- Info Section -->
			{#if currentMode}
				<div class="info-section">
					<span class="info-label">Win Rate</span>
					<div class="info-row">
						<span class="info-item">
							<span class="info-key">Multiplier:</span>
							<span class="info-value">{currentMode.multiplier}x</span>
						</span>
						<span class="info-item">
							<span class="info-key">Probability:</span>
							<span class="info-value">{(currentMode.survivalRate * 100).toFixed(0)}%</span>
						</span>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Auto Bet Tab -->
		<div class="panel-content">
			<!-- Auto Bet Progress (when running) -->
			{#if isAutoBetting}
				<div class="auto-progress">
					<div class="progress-header">
						<span class="progress-title">Auto Betting...</span>
						<span class="progress-count">{$autoBetConfig.completedBets}/{$autoBetConfig.totalBets}</span>
					</div>
					<div class="progress-bar">
						<div
							class="progress-fill"
							style="width: {($autoBetConfig.completedBets / $autoBetConfig.totalBets) * 100}%"
						></div>
					</div>
					<div class="progress-stats">
						<span class="stat win">W: {$autoBetConfig.wins}</span>
						<span class="stat loss">L: {$autoBetConfig.losses}</span>
						{#if $autoBetConfig.continueShots > 0}
							<span class="stat continue">x{$autoBetConfig.currentContinueCount}/{$autoBetConfig.continueShots}</span>
						{/if}
						<span class="stat profit" class:positive={$autoBetConfig.profit >= 0} class:negative={$autoBetConfig.profit < 0}>
							{$autoBetConfig.profit >= 0 ? '+' : ''}{currencySymbol}{$autoBetConfig.profit.toFixed(2)}
						</span>
					</div>
				</div>
			{/if}

			<!-- Bet Amount Section -->
			<div class="form-section">
				<div class="form-label">
					<span>Bet Amount</span>
					<span class="balance-value">{currencySymbol}{$balance.toFixed(2)}</span>
				</div>
				<div class="bet-input-row">
					<div class="input-field">
						<input
							type="number"
							bind:value={betInput}
							on:change={handleBetInput}
							min={minBet}
							max={maxBet}
							step="0.01"
							disabled={gameState !== 'idle' || isAutoBetting}
						/>
					</div>
					<button class="adjust-btn" on:click={() => adjustBet(0.5)} disabled={gameState !== 'idle' || isAutoBetting}>1/2</button>
					<button class="adjust-btn" on:click={() => adjustBet(2)} disabled={gameState !== 'idle' || isAutoBetting}>2X</button>
				</div>
			</div>

			<!-- Difficulty Selection -->
			<div class="form-section">
				<div class="form-label">
					<span>Difficulty</span>
				</div>
				<div class="input-field select-field">
					<select
						bind:value={selectedBullets}
						on:change={(e) => selectBullets(parseInt(e.currentTarget.value))}
						disabled={gameState !== 'idle' || isAutoBetting}
					>
						{#each GAME_MODES as mode}
							<option value={mode.bullets}>
								{mode.bullets} Bullet{mode.bullets > 1 ? 's' : ''} - {mode.multiplier}x
							</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Number of Bets -->
			<div class="form-section">
				<div class="form-label">
					<span>Number of Bets</span>
				</div>
				<div class="input-field">
					<input
						type="number"
						bind:value={autoBetCount}
						min="1"
						max={gameConfig.autoBet.maxBets}
						disabled={isAutoBetting}
					/>
				</div>
			</div>

			<!-- Stop on Wins -->
			<div class="form-section">
				<div class="form-label">
					<span>Stop after Wins</span>
					<span class="form-hint">0 = disabled</span>
				</div>
				<div class="input-field">
					<input
						type="number"
						bind:value={autoStopOnWin}
						min="0"
						max={autoBetCount}
						disabled={isAutoBetting}
					/>
				</div>
			</div>

			<!-- Continue Shots before Cash Out -->
			<div class="form-section">
				<div class="form-label">
					<span>Continue Shots</span>
					<span class="form-hint">0 = cash out immediately</span>
				</div>
				<div class="input-field">
					<input
						type="number"
						bind:value={autoContinueShots}
						min="0"
						max={gameConfig.autoBet.maxContinueShots}
						disabled={isAutoBetting}
					/>
				</div>
			</div>

			<!-- Auto Bet Button -->
			<button
				class="action-btn {isAutoBetting ? 'danger' : 'primary'}"
				on:click={runAutoBet}
				disabled={!isAutoBetting && (gameState !== 'idle' || $balance < currentBet)}
			>
				{#if isAutoBetting}
					Stop Auto Bet
				{:else}
					Start Auto Bet
				{/if}
			</button>

			<!-- Info Section -->
			{#if currentMode && !isAutoBetting}
				<div class="info-section">
					<span class="info-label">Win Rate</span>
					<div class="info-row">
						<span class="info-item">
							<span class="info-key">Multiplier:</span>
							<span class="info-value">{currentMode.multiplier}x</span>
						</span>
						<span class="info-item">
							<span class="info-key">Probability:</span>
							<span class="info-value">{(currentMode.survivalRate * 100).toFixed(0)}%</span>
						</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.control-panel {
		display: flex;
		flex-direction: column;
		background: var(--color-panel);
		border-radius: 16px;
		min-width: 280px;
		max-width: 340px;
		height: 100%;
		overflow: hidden;
	}

	/* Tab Toggle */
	.tab-toggle {
		display: flex;
		background: var(--color-bg-secondary);
		padding: 8px;
		gap: 4px;
	}

	.tab-btn {
		flex: 1;
		padding: 10px 16px;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 14px;
		font-weight: 500;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.tab-btn:hover:not(:disabled) {
		color: var(--color-text);
	}

	.tab-btn.active {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}

	.tab-btn:disabled {
		opacity: 0.5;
	}

	/* Panel Content */
	.panel-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 16px;
		flex: 1;
		overflow-y: auto;
	}

	/* Form Sections */
	.form-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.form-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 12px;
		color: var(--color-text-muted);
	}

	.form-hint {
		font-size: 10px;
		opacity: 0.7;
	}

	.balance-value {
		color: var(--color-gold);
		font-weight: 600;
	}

	/* Input Fields */
	.bet-input-row {
		display: flex;
		gap: 8px;
	}

	.input-field {
		flex: 1;
		background: var(--color-input);
		border: 1px solid var(--color-bg-tertiary);
		border-radius: 8px;
		overflow: hidden;
	}

	.input-field input,
	.input-field select {
		width: 100%;
		padding: 12px;
		background: transparent;
		border: none;
		color: var(--color-text);
		font-size: 14px;
		outline: none;
	}

	.input-field select {
		cursor: pointer;
		appearance: none;
		-webkit-appearance: none;
	}

	.select-field {
		position: relative;
	}

	.select-field::after {
		content: '▼';
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color-text-muted);
		font-size: 10px;
		pointer-events: none;
	}

	.input-field input[type="number"]::-webkit-inner-spin-button,
	.input-field input[type="number"]::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.adjust-btn {
		padding: 12px 16px;
		background: var(--color-bg-tertiary);
		color: var(--color-text);
		font-size: 12px;
		font-weight: 600;
		border-radius: 8px;
		white-space: nowrap;
	}

	.adjust-btn:hover:not(:disabled) {
		background: var(--color-accent);
	}

	/* Action Buttons */
	.action-btn {
		width: 100%;
		padding: 14px;
		font-size: 14px;
		font-weight: 600;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.action-btn.primary {
		background: linear-gradient(180deg, var(--color-accent) 0%, var(--color-accent-dark) 100%);
		color: white;
		box-shadow: 0 4px 12px rgba(0, 200, 83, 0.3);
	}

	.action-btn.primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(0, 200, 83, 0.4);
	}

	.action-btn.secondary {
		background: transparent;
		color: var(--color-accent);
		border: 1px solid var(--color-accent);
	}

	.action-btn.secondary:hover:not(:disabled) {
		background: rgba(0, 200, 83, 0.1);
	}

	.action-btn.cashout {
		background: linear-gradient(180deg, var(--color-accent) 0%, var(--color-accent-dark) 100%);
		color: white;
		box-shadow: 0 4px 12px rgba(0, 200, 83, 0.3);
	}

	.action-btn.danger {
		background: linear-gradient(180deg, var(--color-danger) 0%, var(--color-danger-dark) 100%);
		color: white;
		box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
	}

	.action-btn.danger:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(255, 68, 68, 0.4);
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none !important;
	}

	.action-btn.spinning {
		background: var(--color-bg-tertiary);
		box-shadow: none;
	}

	/* Auto Bet Progress */
	.auto-progress {
		background: var(--color-input);
		border-radius: 8px;
		padding: 12px;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.progress-title {
		font-size: 12px;
		color: var(--color-accent);
		font-weight: 600;
	}

	.progress-count {
		font-size: 12px;
		color: var(--color-text-muted);
	}

	.progress-bar {
		height: 4px;
		background: var(--color-bg-tertiary);
		border-radius: 2px;
		overflow: hidden;
		margin-bottom: 8px;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-accent);
		border-radius: 2px;
		transition: width 0.3s ease;
	}

	.progress-stats {
		display: flex;
		justify-content: space-between;
		font-size: 11px;
	}

	.stat {
		padding: 2px 6px;
		border-radius: 4px;
	}

	.stat.win {
		color: var(--color-success);
		background: rgba(0, 200, 83, 0.1);
	}

	.stat.loss {
		color: var(--color-danger);
		background: rgba(255, 68, 68, 0.1);
	}

	.stat.continue {
		color: var(--color-info);
		background: rgba(52, 152, 219, 0.1);
	}

	.stat.profit {
		font-weight: 600;
	}

	.stat.profit.positive {
		color: var(--color-success);
	}

	.stat.profit.negative {
		color: var(--color-danger);
	}

	/* Info Section */
	.info-section {
		margin-top: auto;
		padding-top: 12px;
		border-top: 1px solid var(--color-bg-tertiary);
	}

	.info-label {
		display: block;
		font-size: 12px;
		color: var(--color-text-muted);
		margin-bottom: 8px;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		background: var(--color-input);
		border-radius: 8px;
		padding: 10px 12px;
	}

	.info-item {
		display: flex;
		gap: 6px;
		font-size: 12px;
	}

	.info-key {
		color: var(--color-text-muted);
	}

	.info-value {
		color: var(--color-text);
		font-weight: 600;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.control-panel {
			max-width: 100%;
			width: 100%;
		}
	}

	/* Compact mode for landscape popouts */
	.control-panel.compact {
		min-width: 200px;
		max-width: 240px;
		font-size: 12px;
	}

	.compact .tab-toggle {
		padding: 4px;
	}

	.compact .tab-btn {
		padding: 6px 10px;
		font-size: 11px;
	}

	.compact .panel-content {
		gap: 10px;
		padding: 10px;
	}

	.compact .form-label {
		font-size: 10px;
	}

	.compact .input-field input,
	.compact .input-field select {
		padding: 8px;
		font-size: 12px;
	}

	.compact .adjust-btn {
		padding: 8px 10px;
		font-size: 10px;
	}

	.compact .action-btn {
		padding: 10px;
		font-size: 12px;
	}

	.compact .info-row {
		padding: 8px;
	}

	.compact .info-item {
		font-size: 10px;
	}

	.compact .auto-progress {
		padding: 8px;
	}

	.compact .progress-title,
	.compact .progress-count {
		font-size: 10px;
	}

	.compact .progress-stats {
		font-size: 9px;
	}
</style>
