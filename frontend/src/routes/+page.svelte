<script lang="ts">
	import { Header, BetControls, SpineCharacter, GameDisclaimer } from '$lib';
	import { roundState, GAME_MODES, placeBet, spin, canPlaceBet, canSpin, isSpinning } from '$lib/stores/gameStore';
	import { SFX } from '$lib/utils/sounds';

	$: selectedMode = GAME_MODES.find(m => m.bullets === $roundState.selectedBullets);
	$: gameState = $roundState.gameState;
	$: currentPot = $roundState.currentPot;

	// Space bar keyboard binding
	function handleKeydown(event: KeyboardEvent) {
		if (event.code === 'Space' && !event.repeat) {
			event.preventDefault();

			if ($roundState.gameState === 'idle' && $canPlaceBet) {
				placeBet();
				SFX.play('bet');
			} else if (($roundState.gameState === 'betting' || $roundState.gameState === 'continue') && $canSpin && !$isSpinning) {
				SFX.play('spin');
				spin();
			}
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

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

			<!-- Right: Game Scene -->
			<section class="right-panel">
				<div class="game-scene">
					<SpineCharacter />

					<!-- Multiplier badges shown during active game -->
					{#if gameState !== 'idle' && selectedMode}
						<div class="multiplier-badges">
							<div class="multiplier-badge potential">
								<span class="badge-value">{selectedMode.multiplier.toFixed(2)}X</span>
							</div>
							{#if gameState === 'continue' || gameState === 'result'}
								<div class="multiplier-badge current">
									<span class="badge-value">{(currentPot / $roundState.betAmount).toFixed(2)}X</span>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</section>
		</div>
	</main>

	<GameDisclaimer />
</div>

<style>
	.game-container {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--color-bg);
		overflow: hidden;
	}

	.game-main {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem 2rem 2rem;
		min-height: 0;
	}

	.game-layout {
		display: flex;
		align-items: stretch;
		justify-content: center;
		gap: 2rem;
		width: 100%;
		max-width: 1000px;
		height: 100%;
		max-height: 600px;
	}

	.left-panel {
		flex-shrink: 0;
		display: flex;
		align-items: stretch;
	}

	.right-panel {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
		min-width: 300px;
	}

	.game-scene {
		width: 100%;
		height: 100%;
		max-width: 500px;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	/* Multiplier Badges */
	.multiplier-badges {
		position: absolute;
		top: 20px;
		right: 20px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.multiplier-badge {
		padding: 8px 16px;
		border-radius: 8px;
		font-weight: 700;
		font-size: 14px;
	}

	.multiplier-badge.potential {
		background: var(--color-accent);
		color: white;
	}

	.multiplier-badge.current {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}

	.badge-value {
		font-family: var(--font-primary);
		font-variant-numeric: tabular-nums;
	}

	/* Responsive layout */
	@media (max-width: 1200px) {
		.game-layout {
			gap: 1.5rem;
		}
	}

	/* Portrait mobile and tablet - vertical stack */
	@media (max-width: 1024px) and (min-height: 500px) {
		.game-main {
			padding: 1rem;
		}

		.game-layout {
			flex-direction: column;
			gap: 1rem;
			max-height: none;
		}

		.left-panel {
			width: 100%;
			max-width: 400px;
			align-self: center;
		}

		.right-panel {
			flex: 1;
			min-height: 300px;
			max-height: 400px;
		}
	}

	/* Landscape popout/small screens - keep horizontal, compact */
	@media (max-height: 500px) {
		.game-main {
			padding: 0.5rem;
		}

		.game-layout {
			flex-direction: row;
			gap: 1rem;
			max-height: none;
			height: 100%;
		}

		.left-panel {
			width: auto;
			max-width: none;
		}

		.right-panel {
			flex: 1;
		}

		.multiplier-badges {
			top: 10px;
			right: 10px;
		}

		.multiplier-badge {
			padding: 4px 10px;
			font-size: 12px;
		}
	}

	/* Very small landscape - Popout S (400x225) */
	@media (max-height: 300px) {
		.game-main {
			padding: 0.25rem;
		}

		.game-layout {
			gap: 0.5rem;
		}

		.multiplier-badges {
			display: none;
		}
	}

	@media (max-width: 768px) and (min-height: 500px) {
		.right-panel {
			min-height: 280px;
		}
	}

	@media (max-width: 480px) and (min-height: 500px) {
		.game-main {
			padding: 0.5rem;
		}

		.right-panel {
			min-height: 260px;
		}
	}

	@media (max-width: 360px) and (min-height: 500px) {
		.right-panel {
			min-height: 220px;
		}
	}
</style>
