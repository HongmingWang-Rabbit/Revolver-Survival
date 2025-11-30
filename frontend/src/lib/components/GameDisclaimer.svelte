<script lang="ts">
	import { GAME_MODES } from '$lib/stores/gameStore';

	let showDisclaimer = false;
	let activeTab: 'rules' | 'payouts' | 'help' = 'rules';

	function toggleDisclaimer() {
		showDisclaimer = !showDisclaimer;
		if (showDisclaimer) activeTab = 'rules';
	}

	function setTab(tab: 'rules' | 'payouts' | 'help') {
		activeTab = tab;
	}
</script>

<div class="disclaimer-container">
	<button class="info-btn" on:click={toggleDisclaimer} aria-label="Game Rules">
		<span class="info-icon">i</span>
	</button>

	{#if showDisclaimer}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="disclaimer-overlay" on:click={toggleDisclaimer}>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="disclaimer-modal" on:click|stopPropagation>
				<button class="close-btn" on:click={toggleDisclaimer}>&times;</button>
				<h3>Game Information</h3>

				<div class="tabs">
					<button class:active={activeTab === 'rules'} on:click={() => setTab('rules')}>Rules</button>
					<button class:active={activeTab === 'payouts'} on:click={() => setTab('payouts')}>Payouts</button>
					<button class:active={activeTab === 'help'} on:click={() => setTab('help')}>Help</button>
				</div>

				<div class="tab-content">
					{#if activeTab === 'rules'}
						<div class="rules-section">
							<h4>How to Play</h4>
							<p>Revolver Survival is a high-stakes survival game. Load bullets into a 6-chamber revolver, place your play, and pull the trigger. Survive and win!</p>

							<h4>Game Modes</h4>
							<p>Choose 1-5 bullets to load. More bullets = higher risk = higher reward.</p>

							<h4>Double or Nothing</h4>
							<p>After surviving, you can continue with your winnings at risk for an even bigger payout, or collect your winnings.</p>

							<h4>Return to Player (RTP)</h4>
							<p>This game has an RTP of <strong>97.33% - 97.67%</strong> depending on mode selected.</p>

							<h4>Maximum Win</h4>
							<p>Maximum multiplier: <strong>5.86x</strong> (5 Bullets mode)</p>
						</div>

					{:else if activeTab === 'payouts'}
						<div class="payouts-section">
							<h4>Payout Table</h4>
							<table class="payout-table">
								<thead>
									<tr>
										<th>Mode</th>
										<th>Survival</th>
										<th>Multiplier</th>
										<th>RTP</th>
									</tr>
								</thead>
								<tbody>
									{#each GAME_MODES as mode}
										<tr>
											<td>{mode.bullets} Bullet{mode.bullets > 1 ? 's' : ''}</td>
											<td>{(mode.survivalRate * 100).toFixed(1)}%</td>
											<td class="multiplier">{mode.multiplier}x</td>
											<td>{(mode.survivalRate * mode.multiplier * 100).toFixed(2)}%</td>
										</tr>
									{/each}
								</tbody>
							</table>

							<div class="max-win-info">
								<span>Max Win:</span>
								<span class="highlight">5.86x your play amount</span>
							</div>
						</div>

					{:else if activeTab === 'help'}
						<div class="help-section">
							<h4>Controls</h4>
							<ul>
								<li><strong>Select Bullets:</strong> Choose 1-5 bullets to load</li>
								<li><strong>Set Amount:</strong> Use dropdown or +/- buttons</li>
								<li><strong>Place Play:</strong> Click button or press <kbd>Space</kbd></li>
								<li><strong>Pull Trigger:</strong> Click button or press <kbd>Space</kbd></li>
								<li><strong>Collect:</strong> Take your winnings</li>
								<li><strong>Double or Nothing:</strong> Risk winnings for more</li>
							</ul>

							<h4>Sound</h4>
							<p>Toggle sound on/off using the speaker icon in the top-right corner.</p>
						</div>
					{/if}
				</div>

				<div class="disclaimer-text">
					Malfunction voids all wins and plays. A consistent internet connection is required.
					In the event of a disconnection, reload the game to finish any uncompleted rounds.
					The expected return is calculated over many plays. The game display is not representative
					of any physical device and is for illustrative purposes only. Winnings are settled
					according to the amount received from the Remote Game Server and not from events within
					the web browser. TM and &copy; 2025 Stake Engine.
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.disclaimer-container {
		position: fixed;
		bottom: 1rem;
		left: 1rem;
		z-index: 100;
	}

	.info-btn {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-bg-tertiary);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.info-btn:hover {
		background: var(--color-bg-tertiary);
		border-color: var(--color-accent);
	}

	.info-icon {
		font-family: serif;
		font-style: italic;
		font-weight: bold;
		font-size: 1rem;
		color: var(--color-text-muted);
	}

	.info-btn:hover .info-icon {
		color: var(--color-text);
	}

	.disclaimer-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		z-index: 1000;
	}

	.disclaimer-modal {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-bg-tertiary);
		border-radius: 12px;
		padding: 1.5rem;
		max-width: 520px;
		width: 100%;
		max-height: 85vh;
		overflow-y: auto;
		position: relative;
	}

	.close-btn {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		background: none;
		border: none;
		font-size: 1.5rem;
		color: var(--color-text-muted);
		cursor: pointer;
		line-height: 1;
		padding: 0.25rem;
	}

	.close-btn:hover {
		color: var(--color-text);
	}

	h3 {
		margin: 0 0 1rem 0;
		color: var(--color-text);
		font-size: 1.125rem;
	}

	/* Tabs */
	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--color-bg-tertiary);
		padding-bottom: 0.5rem;
	}

	.tabs button {
		padding: 0.5rem 1rem;
		background: transparent;
		border: none;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.tabs button:hover {
		color: var(--color-text);
		background: var(--color-bg-tertiary);
	}

	.tabs button.active {
		color: var(--color-accent);
		background: var(--color-bg);
	}

	/* Tab Content */
	.tab-content {
		margin-bottom: 1rem;
		min-height: 200px;
	}

	.tab-content h4 {
		color: var(--color-text);
		font-size: 0.9375rem;
		margin: 0.75rem 0 0.375rem 0;
	}

	.tab-content h4:first-child {
		margin-top: 0;
	}

	.tab-content p {
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.5;
		margin: 0 0 0.5rem 0;
	}

	.tab-content strong {
		color: var(--color-gold);
	}

	/* Payout Table */
	.payout-table {
		width: 100%;
		border-collapse: collapse;
		margin: 0.5rem 0;
		font-size: 0.8125rem;
	}

	.payout-table th,
	.payout-table td {
		padding: 0.5rem;
		text-align: center;
		border-bottom: 1px solid var(--color-bg-tertiary);
	}

	.payout-table th {
		color: var(--color-text-muted);
		font-weight: normal;
		font-size: 0.75rem;
	}

	.payout-table td {
		color: var(--color-text);
	}

	.payout-table .multiplier {
		color: var(--color-gold);
		font-weight: bold;
	}

	.max-win-info {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem;
		background: var(--color-bg);
		border-radius: 6px;
		margin-top: 0.75rem;
		font-size: 0.875rem;
	}

	.max-win-info .highlight {
		color: var(--color-success);
		font-weight: bold;
	}

	/* Help Section */
	.help-section ul {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0;
	}

	.help-section li {
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		padding: 0.375rem 0;
		border-bottom: 1px solid var(--color-bg-tertiary);
	}

	.help-section li:last-child {
		border-bottom: none;
	}

	.help-section kbd {
		background: var(--color-bg);
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		font-family: inherit;
		font-size: 0.75rem;
		border: 1px solid var(--color-bg-tertiary);
	}

	/* Disclaimer */
	.disclaimer-text {
		color: var(--color-text-muted);
		font-size: 0.6875rem;
		line-height: 1.5;
		margin: 0;
		padding-top: 1rem;
		border-top: 1px solid var(--color-bg-tertiary);
	}

	@media (max-width: 480px) {
		.disclaimer-container {
			bottom: 0.5rem;
			left: 0.5rem;
		}

		.info-btn {
			width: 28px;
			height: 28px;
		}

		.info-icon {
			font-size: 0.875rem;
		}

		.disclaimer-modal {
			padding: 1.25rem;
			max-height: 90vh;
		}

		h3 {
			font-size: 1rem;
		}

		.tabs button {
			padding: 0.375rem 0.75rem;
			font-size: 0.8125rem;
		}

		.tab-content {
			min-height: 150px;
		}

		.payout-table {
			font-size: 0.75rem;
		}

		.payout-table th,
		.payout-table td {
			padding: 0.375rem 0.25rem;
		}
	}
</style>
