<script lang="ts">
	let showDisclaimer = false;

	function toggleDisclaimer() {
		showDisclaimer = !showDisclaimer;
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
				<h3>Game Rules & Disclaimer</h3>
				<p class="disclaimer-text">
					Malfunction voids all wins and plays. A consistent internet connection is required.
					In the event of a disconnection, reload the game to finish any uncompleted rounds.
					The expected return is calculated over many plays. The game display is not representative
					of any physical device and is for illustrative purposes only. Winnings are settled
					according to the amount received from the Remote Game Server and not from events within
					the web browser. TM and &copy; 2025 Stake Engine.
				</p>
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
	}

	.disclaimer-modal {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-bg-tertiary);
		border-radius: 12px;
		padding: 1.5rem;
		max-width: 500px;
		width: 100%;
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

	.disclaimer-text {
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.6;
		margin: 0;
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
		}

		h3 {
			font-size: 1rem;
		}

		.disclaimer-text {
			font-size: 0.75rem;
		}
	}
</style>
