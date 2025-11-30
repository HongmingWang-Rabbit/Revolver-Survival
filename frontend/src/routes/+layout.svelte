<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { initializeRGS, rgsConfig } from '$lib/stores/gameStore';
	import { initSocialMode } from '$lib/utils/socialMode';

	let mounted = false;

	onMount(async () => {
		initSocialMode();
		await initializeRGS();
		mounted = true;
	});
</script>

{#if !mounted || $rgsConfig.loading}
	<div class="loading-screen">
		<div class="loading-content">
			<div class="spinner"></div>
			<p>Loading game...</p>
		</div>
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

{#if $rgsConfig.isDemo && mounted}
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
</style>
