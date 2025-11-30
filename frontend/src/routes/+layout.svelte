<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { initializeRGS, rgsConfig } from '$lib/stores/gameStore';
	import { initSocialMode } from '$lib/utils/socialMode';
	import { initReplayMode, isReplayMode, replayConfig } from '$lib/utils/replay';

	let mounted = false;

	onMount(async () => {
		initSocialMode();
		const isReplay = initReplayMode();

		if (!isReplay) {
			await initializeRGS();
		}
		mounted = true;
	});
</script>

{#if !mounted || ($rgsConfig.loading && !$isReplayMode)}
	<div class="loading-screen">
		<div class="loading-content">
			<div class="spinner"></div>
			<p>Loading game...</p>
		</div>
	</div>
{:else if $isReplayMode}
	<slot />
	<div class="replay-banner">
		<span class="replay-icon">▶</span>
		<span class="replay-text">REPLAY MODE</span>
		<span class="replay-info">Round: {$replayConfig.roundId} | Amount: {$replayConfig.currency} {$replayConfig.amount.toFixed(2)}</span>
	</div>
{:else if !$rgsConfig.initialized && $rgsConfig.error}
	<div class="error-screen">
		<div class="error-content">
			<h2>Connection Error</h2>
			<p>{$rgsConfig.error}</p>
			<p class="demo-notice">Playing in demo mode</p>
		</div>
	</div>
	<slot />
{:else}
	<slot />
{/if}

{#if $rgsConfig.isDemo && mounted && !$isReplayMode}
	<div class="demo-badge">DEMO</div>
{/if}

<style>
	.loading-screen,
	.error-screen {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg);
		z-index: 1000;
	}

	.loading-content,
	.error-content {
		text-align: center;
		color: var(--color-text);
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 3px solid var(--color-bg-tertiary);
		border-top-color: var(--color-accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error-content h2 {
		color: var(--color-accent);
		margin-bottom: 0.5rem;
	}

	.demo-notice {
		margin-top: 1rem;
		color: var(--color-warning);
		font-size: 0.875rem;
	}

	.demo-badge {
		position: fixed;
		top: 0.5rem;
		left: 0.5rem;
		padding: 0.25rem 0.75rem;
		background: var(--color-warning);
		color: var(--color-bg);
		font-size: 0.75rem;
		font-weight: bold;
		border-radius: 4px;
		z-index: 100;
	}

	.replay-banner {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 0.5rem 1rem;
		background: linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%);
		border-bottom: 2px solid var(--color-accent);
		z-index: 200;
	}

	.replay-icon {
		color: var(--color-accent);
		font-size: 1rem;
		animation: pulse 1.5s ease-in-out infinite;
	}

	.replay-text {
		color: var(--color-accent);
		font-weight: bold;
		font-size: 0.875rem;
		letter-spacing: 0.15em;
	}

	.replay-info {
		color: var(--color-text-muted);
		font-size: 0.75rem;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
</style>
