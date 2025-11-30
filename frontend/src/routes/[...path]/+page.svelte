<script lang="ts">
	import { Header, BetControls, GameActions, StickMan, GameDisclaimer } from '$lib';
	import { roundState, GAME_MODES } from '$lib/stores/gameStore';

	$: selectedMode = GAME_MODES.find(m => m.bullets === $roundState.selectedBullets);
	$: gameState = $roundState.gameState;
</script>

<svelte:head>
	<title>Revolver Survival | High Stakes Survival Game</title>
	<meta name="description" content="A high-stakes survival game inspired by Russian Roulette. Choose your risk, pull the trigger, survive and win!" />
</svelte:head>

<div class="game-container">
	<Header />

	<main class="game-main">
		<div class="game-layout">
			<!-- Left Panel: Bet Controls -->
			<aside class="left-panel">
				<BetControls />
			</aside>

			<!-- Center: Game Scene -->
			<section class="center-panel">
				<div class="game-scene">
					<StickMan />
				</div>

				{#if selectedMode}
					<div class="mode-badge" class:active={gameState !== 'idle'}>
						<span class="mode-bullets">{selectedMode.bullets} Bullet{selectedMode.bullets > 1 ? 's' : ''}</span>
						<span class="mode-odds">{(selectedMode.survivalRate * 100).toFixed(0)}% Survival</span>
					</div>
				{/if}
			</section>

			<!-- Right Panel: Game Actions -->
			<aside class="right-panel">
				<GameActions />
			</aside>
		</div>
	</main>

	<GameDisclaimer />
</div>

<style>
	.game-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background:
			radial-gradient(ellipse at center, var(--color-bg-secondary) 0%, var(--color-bg) 70%),
			var(--color-bg);
	}

	.game-main {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.game-layout {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 3rem;
		max-width: 1200px;
		width: 100%;
	}

	.left-panel, .right-panel {
		flex-shrink: 0;
	}

	.center-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.game-scene {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: radial-gradient(circle at 50% 40%, #2d3436 0%, var(--color-bg) 70%);
		border-radius: 20px;
		min-height: 350px;
	}

	.mode-badge {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem 1.5rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-bg-tertiary);
		border-radius: 8px;
		transition: all 0.3s ease;
	}

	.mode-badge.active {
		border-color: var(--color-accent);
		box-shadow: 0 0 20px rgba(255, 68, 68, 0.2);
	}

	.mode-bullets {
		font-size: 1.125rem;
		font-weight: bold;
		color: var(--color-accent);
	}

	.mode-odds {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	/* Responsive layout */
	@media (max-width: 1200px) {
		.game-layout {
			gap: 2rem;
		}
	}

	@media (max-width: 1024px) {
		.game-layout {
			flex-direction: column;
			gap: 1.5rem;
		}

		.left-panel, .right-panel {
			width: 100%;
			max-width: 400px;
		}

		.game-main {
			padding: 1rem;
		}
	}

	@media (max-width: 768px) {
		.game-scene {
			padding: 1.5rem;
			min-height: 280px;
			width: 100%;
		}

		.mode-badge {
			padding: 0.5rem 1rem;
		}

		.mode-bullets {
			font-size: 1rem;
		}

		.mode-odds {
			font-size: 0.75rem;
		}
	}

	@media (max-width: 480px) {
		.game-main {
			padding: 0.5rem;
		}

		.game-scene {
			padding: 1rem;
			min-height: 240px;
			border-radius: 12px;
		}

		.center-panel {
			gap: 1rem;
		}
	}

	@media (max-width: 360px) {
		.game-scene {
			min-height: 200px;
			padding: 0.75rem;
		}
	}
</style>
