<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Redirect all catch-all routes to the main game page
	// This handles deep links from platforms like Stake Engine
	onMount(() => {
		goto('/', { replaceState: true });
	});
</script>

<svelte:head>
	<title>Revolver Survival | Redirecting...</title>
</svelte:head>

<div class="redirect-container">
	<div class="spinner"></div>
	<p>Redirecting...</p>
</div>

<style>
	.redirect-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: var(--color-bg);
		color: var(--color-text-muted);
		gap: 1rem;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 2px solid var(--color-bg-tertiary);
		border-top-color: var(--color-accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
