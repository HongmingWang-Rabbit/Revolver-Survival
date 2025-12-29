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
	let autoContinueShots = 0;

	// Advanced settings
	let showAdvanced = false;
	let onWinMode: 'reset' | 'increase' = 'reset';
	let onWinIncrease = 0;
	let onLossMode: 'reset' | 'increase' = 'reset';
	let onLossIncrease = 0;
	let stopOnProfit = 0;
	let stopOnLoss = 0;

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

	async function handlePlaceBet() {
		if (canBet) {
			placeBet();
			SFX.play('bet');
			// Automatically start the round after placing bet
			await handleSpin();
		}
	}

	async function handleSpin() {
		if (!$canSpin) return;
		SFX.play('spin');
		await spin();
	}

	async function handleContinue() {
		SFX.play('click');
		continueBetting();
		// Also trigger spin immediately after continuing
		await handleSpin();
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
			stopOnWins: 0,
			continueShots: autoContinueShots,
		});

		SFX.play('click');

		// Run the auto bet loop
		await executeAutoBetLoop();
	}

	async function executeAutoBetLoop() {
		const initialBetAmount = $roundState.betAmount;

		while (!shouldStopAutoBet()) {
			try {
				// Check advanced stop conditions
				if (showAdvanced) {
					const { profit } = $autoBetConfig;
					if (stopOnProfit > 0 && profit >= stopOnProfit) {
						break;
					}
					if (stopOnLoss > 0 && profit <= -stopOnLoss) {
						break;
					}
				}

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

						// Apply advanced on-win bet adjustment
						if (showAdvanced) {
							if (onWinMode === 'reset') {
								setBetAmount(initialBetAmount);
							} else if (onWinMode === 'increase' && onWinIncrease > 0) {
								const newBet = betAmount * (1 + onWinIncrease / 100);
								setBetAmount(Math.min(newBet, maxBet));
							}
						}

						// Wait before next bet
						await delay(gameConfig.timing.autoBetRoundDelay);
					}
				} else {
					// Lost - update stats
					updateAutoBetStats(false, 0, betAmount);
					resetContinueCount();

					// Apply advanced on-loss bet adjustment
					if (showAdvanced) {
						if (onLossMode === 'reset') {
							setBetAmount(initialBetAmount);
						} else if (onLossMode === 'increase' && onLossIncrease > 0) {
							const newBet = betAmount * (1 + onLossIncrease / 100);
							setBetAmount(Math.min(newBet, maxBet));
						}
					}

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
		<div class="tab-container">
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
				<div class="bet-input-group">
					<input
						type="number"
						bind:value={betInput}
						on:change={handleBetInput}
						min={minBet}
						max={maxBet}
						step="0.01"
						disabled={gameState !== 'idle'}
					/>
					<div class="adjust-buttons">
						<button class="adjust-btn" on:click={() => adjustBet(0.5)} disabled={gameState !== 'idle'}>1/2</button>
						<button class="adjust-btn" on:click={() => adjustBet(2)} disabled={gameState !== 'idle'}>2X</button>
					</div>
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
								{mode.bullets} Bullet{mode.bullets > 1 ? 's' : ''}
							</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="action-buttons">
				<!-- Place Bet / Cash Out button -->
				{#if gameState !== 'idle' && currentPot > 0}
					<button
						class="action-btn primary"
						on:click={handleCashOut}
						disabled={spinning}
					>
						Cash Out {currencySymbol}{currentPot.toFixed(2)}
					</button>
				{:else}
					<button
						class="action-btn primary"
						on:click={handlePlaceBet}
						disabled={gameState !== 'idle' || !canBet}
					>
						Place Bet
					</button>
				{/if}

				<!-- Start button -->
				<button
					class="action-btn secondary"
					class:spinning
					on:click={() => {
						if (gameState === 'betting' || gameState === 'continue') {
							handleSpin();
						} else if (gameState === 'result' && showingResult && survived) {
							handleContinue();
						}
					}}
					disabled={gameState === 'idle' || spinning || (gameState === 'result' && !survived)}
				>
					{#if spinning}
						Spinning...
					{:else if gameState === 'result' && survived}
						Continue {currencySymbol}{(currentPot * (currentMode?.multiplier || 2)).toFixed(2)}
					{:else}
						Start
					{/if}
				</button>
			</div>

			<!-- Payout Info -->
			{#if currentMode}
				<div class="payout-section">
					<span class="payout-label">Payout</span>
					<div class="payout-row">
						<span class="payout-item">
							<span class="payout-key">Multiplier:</span>
							<span class="payout-value">{currentMode.multiplier}x</span>
						</span>
						<span class="payout-item">
							<span class="payout-key">Probability:</span>
							<span class="payout-value">{(currentMode.survivalRate * 100).toFixed(0)}%</span>
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
				<div class="bet-input-group">
					<input
						type="number"
						bind:value={betInput}
						on:change={handleBetInput}
						min={minBet}
						max={maxBet}
						step="0.01"
						disabled={gameState !== 'idle' || isAutoBetting}
					/>
					<div class="adjust-buttons">
						<button class="adjust-btn" on:click={() => adjustBet(0.5)} disabled={gameState !== 'idle' || isAutoBetting}>1/2</button>
						<button class="adjust-btn" on:click={() => adjustBet(2)} disabled={gameState !== 'idle' || isAutoBetting}>2X</button>
					</div>
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
								{mode.bullets} Bullet{mode.bullets > 1 ? 's' : ''}
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

			<!-- Advanced Toggle -->
			<div class="advanced-toggle">
				<span class="advanced-label">Advanced</span>
				<button
					class="toggle-switch"
					class:active={showAdvanced}
					on:click={() => { showAdvanced = !showAdvanced; SFX.play('click'); }}
					disabled={isAutoBetting}
					aria-label="Toggle advanced settings"
				>
					<span class="toggle-knob"></span>
				</button>
			</div>

			<!-- Advanced Settings Panel -->
			{#if showAdvanced}
				<div class="advanced-panel">
					<!-- On Win -->
					<div class="form-section">
						<span class="form-label">On Win</span>
						<div class="toggle-input-group">
							<button
								class="mode-btn"
								class:active={onWinMode === 'reset'}
								on:click={() => { onWinMode = 'reset'; SFX.play('click'); }}
								disabled={isAutoBetting}
							>
								Reset
							</button>
							<button
								class="mode-btn"
								class:active={onWinMode === 'increase'}
								on:click={() => { onWinMode = 'increase'; SFX.play('click'); }}
								disabled={isAutoBetting}
							>
								Increase:
							</button>
							<div class="percent-input">
								<input
									type="number"
									bind:value={onWinIncrease}
									min="0"
									max="100"
									disabled={isAutoBetting || onWinMode === 'reset'}
								/>
								<span class="percent-sign">%</span>
							</div>
						</div>
					</div>

					<!-- On Loss -->
					<div class="form-section">
						<span class="form-label">On Loss</span>
						<div class="toggle-input-group">
							<button
								class="mode-btn"
								class:active={onLossMode === 'reset'}
								on:click={() => { onLossMode = 'reset'; SFX.play('click'); }}
								disabled={isAutoBetting}
							>
								Reset
							</button>
							<button
								class="mode-btn"
								class:active={onLossMode === 'increase'}
								on:click={() => { onLossMode = 'increase'; SFX.play('click'); }}
								disabled={isAutoBetting}
							>
								Increase:
							</button>
							<div class="percent-input">
								<input
									type="number"
									bind:value={onLossIncrease}
									min="0"
									max="100"
									disabled={isAutoBetting || onLossMode === 'reset'}
								/>
								<span class="percent-sign">%</span>
							</div>
						</div>
					</div>

					<!-- Stop on Profit -->
					<div class="form-section">
						<div class="form-label">
							<span>Stop on Profit</span>
							<span class="balance-value">{currencySymbol}{stopOnProfit.toFixed(2)}</span>
						</div>
						<div class="input-field">
							<input
								type="number"
								bind:value={stopOnProfit}
								min="0"
								step="0.01"
								disabled={isAutoBetting}
							/>
						</div>
					</div>

					<!-- Stop on Loss -->
					<div class="form-section">
						<div class="form-label">
							<span>Stop on Loss</span>
							<span class="balance-value">{currencySymbol}{stopOnLoss.toFixed(2)}</span>
						</div>
						<div class="input-field">
							<input
								type="number"
								bind:value={stopOnLoss}
								min="0"
								step="0.01"
								disabled={isAutoBetting}
							/>
						</div>
					</div>
				</div>
			{/if}

			<!-- Auto Bet Button -->
			<div class="action-buttons">
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
			</div>
		</div>
	{/if}
</div>

<style>
	.control-panel {
		display: flex;
		flex-direction: column;
		background: var(--color-panel-game);
		border-radius: 12px;
		min-width: 320px;
		max-width: 380px;
		height: 100%;
		overflow: hidden;
	}

	/* Tab Toggle */
	.tab-toggle {
		display: flex;
		justify-content: center;
		background: var(--color-panel-game);
		padding: 12px 16px;
	}

	.tab-container {
		display: flex;
		width: 100%;
		background: var(--color-panel-dark);
		border-radius: 24px;
		padding: 4px;
		gap: 4px;
	}

	.tab-btn {
		flex: 1;
		padding: 10px 20px;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 14px;
		font-weight: 500;
		border-radius: 20px;
		border: none;
		transition: all 0.2s ease;
		text-align: center;
	}

	.tab-btn:hover:not(:disabled) {
		color: var(--color-text);
	}

	.tab-btn.active {
		background: var(--color-panel-active);
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
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE/Edge */
	}

	.panel-content::-webkit-scrollbar {
		display: none; /* Chrome/Safari */
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
	.bet-input-group {
		display: flex;
		align-items: stretch;
		background: var(--color-input-wrapper);
		border-radius: 8px;
		overflow: hidden;
	}

	.bet-input-group input {
		flex: 1;
		padding: 12px;
		background: var(--color-input);
		border: none;
		color: var(--color-text);
		font-size: 14px;
		outline: none;
		min-width: 0;
	}

	.bet-input-group input[type="number"]::-webkit-inner-spin-button,
	.bet-input-group input[type="number"]::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.adjust-buttons {
		display: flex;
		align-items: stretch;
		border-left: 1px solid var(--color-bg-tertiary);
	}

	.adjust-btn {
		padding: 12px 16px;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 12px;
		font-weight: 600;
		border-radius: 0;
		white-space: nowrap;
		border-left: 1px solid var(--color-bg-tertiary);
	}

	.adjust-btn:first-child {
		border-left: none;
	}

	.adjust-btn:hover:not(:disabled) {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
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

	/* Action Buttons */
	.action-buttons {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

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
		background: var(--color-panel-dark);
		color: var(--color-gold);
		border: none;
	}

	.action-btn.secondary:hover:not(:disabled) {
		background: var(--color-bg-tertiary);
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
		background: var(--color-panel-dark);
		color: var(--color-gold);
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

	/* Advanced Toggle */
	.advanced-toggle {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0;
	}

	.advanced-label {
		font-size: 12px;
		color: var(--color-text-muted);
	}

	.toggle-switch {
		position: relative;
		width: 44px;
		height: 24px;
		background: var(--color-input);
		border-radius: 12px;
		padding: 2px;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.toggle-switch.active {
		background: var(--color-accent);
	}

	.toggle-switch:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.toggle-knob {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 20px;
		height: 20px;
		background: white;
		border-radius: 50%;
		transition: transform 0.2s ease;
	}

	.toggle-switch.active .toggle-knob {
		transform: translateX(20px);
	}

	/* Advanced Panel */
	.advanced-panel {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding-top: 8px;
	}

	.toggle-input-group {
		display: flex;
		align-items: stretch;
		background: var(--color-input);
		border-radius: 8px;
		overflow: hidden;
	}

	.mode-btn {
		padding: 10px 12px;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 12px;
		font-weight: 500;
		border: none;
		border-radius: 0;
		transition: all 0.2s ease;
	}

	.mode-btn.active {
		background: var(--color-input-wrapper);
		color: var(--color-text);
	}

	.mode-btn:hover:not(:disabled):not(.active) {
		color: var(--color-text);
	}

	.percent-input {
		flex: 1;
		display: flex;
		align-items: center;
		background: var(--color-input);
		border-left: 1px solid var(--color-bg-tertiary);
	}

	.percent-input input {
		flex: 1;
		padding: 10px 8px;
		background: transparent;
		border: none;
		color: var(--color-text);
		font-size: 14px;
		outline: none;
		min-width: 0;
		text-align: center;
	}

	.percent-input input:disabled {
		opacity: 0.5;
	}

	.percent-input input[type="number"]::-webkit-inner-spin-button,
	.percent-input input[type="number"]::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.percent-sign {
		padding-right: 12px;
		color: var(--color-text-muted);
		font-size: 14px;
	}

	/* Payout Section */
	.payout-section {
		margin-top: 4px;
	}

	.payout-label {
		display: block;
		font-size: 10px;
		color: var(--color-text-muted);
		margin-bottom: 4px;
	}

	.payout-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--color-input-wrapper);
		border-radius: 6px;
		padding: 8px 10px;
		gap: 8px;
	}

	.payout-item {
		display: flex;
		align-items: center;
		gap: 3px;
		font-size: 10px;
		white-space: nowrap;
	}

	.payout-key {
		color: var(--color-text-muted);
	}

	.payout-value {
		color: var(--color-text);
		font-weight: 500;
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
