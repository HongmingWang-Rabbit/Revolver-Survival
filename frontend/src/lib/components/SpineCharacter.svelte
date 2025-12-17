<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { isSpinning, roundState, showResult } from '$lib/stores/gameStore';
	import { Application, Assets } from 'pixi.js';
	import { Spine } from '@esotericsoftware/spine-pixi-v8';
	import { spineConfig, getSpinningAnimation, getWinAnimation } from '$lib/config/spine';

	let container: HTMLDivElement;
	let app: Application | null = null;
	let spine: Spine | null = null;
	let currentAnimation = '';

	const { animations, nonLoopingAnimations } = spineConfig;

	$: spinning = $isSpinning;
	$: result = $roundState.lastResult;
	$: showingResult = $showResult;
	$: gameState = $roundState.gameState;
	$: spinCount = $roundState.spinCount;

	$: survived = (result?.payoutMultiplier || 0) > 0;
	$: targetAnimation = getTargetAnimation(showingResult, survived, spinning, gameState, spinCount);

	$: if (spine && targetAnimation !== currentAnimation) {
		playAnimation(targetAnimation);
	}

	/**
	 * Determine the correct animation based on game state and spin count
	 *
	 * Animation flow:
	 * - A1: Default idle
	 * - A2: Loading bullets (betting state)
	 * - B1/B2/B3_2: Aiming (based on spin count)
	 * - A3/A4: Survival idle (based on survival count)
	 * - B3_1: Death (gun fires)
	 */
	function getTargetAnimation(
		showingResult: boolean,
		survived: boolean,
		spinning: boolean,
		gameState: string,
		spinCount: number
	): string {
		// Death - always B3_1
		if (showingResult && !survived) {
			return animations.death;
		}

		// Survived - use appropriate survival idle (A3 or A4)
		if (showingResult && survived) {
			// spinCount represents how many times we've spun, which equals survival count when showing result
			return getWinAnimation(spinCount);
		}

		// Currently spinning/aiming - use appropriate aiming animation (B1, B2, or B3_2)
		if (spinning) {
			return getSpinningAnimation(spinCount);
		}

		// Betting state - loading bullets animation
		if (gameState === 'betting' || gameState === 'continue') {
			return animations.betting;
		}

		// Default idle
		return animations.idle;
	}

	function playAnimation(name: string) {
		if (!spine) return;

		const animation = spine.skeleton.data.findAnimation(name);
		if (!animation) {
			name = animations.idle;
		}

		const loop = !nonLoopingAnimations.includes(name);
		spine.state.setAnimation(0, name, loop);
		currentAnimation = name;
	}

	onMount(async () => {
		try {
			app = new Application();
			await app.init({
				background: 'transparent',
				backgroundAlpha: 0,
				width: spineConfig.canvas.width,
				height: spineConfig.canvas.height,
				resolution: window.devicePixelRatio || 1,
				autoDensity: true,
			});

			container.appendChild(app.canvas);

			await Assets.load([
				{ alias: 'spineAtlas', src: spineConfig.atlasPath },
				{ alias: 'spineData', src: spineConfig.skeletonPath },
			]);

			spine = Spine.from({
				atlas: 'spineAtlas',
				skeleton: 'spineData',
			});

			spine.state.data.defaultMix = spineConfig.defaultMixDuration;
			spine.scale.set(spineConfig.scale);
			spine.x = app.screen.width / 2;
			spine.y = app.screen.height - 20;

			app.stage.addChild(spine);
			playAnimation(animations.idle);
		} catch {
			// Spine initialization failed - character won't be visible
		}
	});

	onDestroy(() => {
		if (app) {
			app.destroy(true, { children: true });
			app = null;
		}
		spine = null;
	});
</script>

<div class="spine-container" bind:this={container}>
	<div class="status-msg">
		{#if showingResult && !survived}
			<span class="dead">GAME OVER</span>
		{:else if showingResult && survived}
			<span class="alive">SURVIVED!</span>
		{:else if spinning}
			<span class="aiming">Aiming...</span>
		{:else if gameState === 'betting' || gameState === 'continue'}
			<span class="ready">Spinning cylinder...</span>
		{:else}
			<span class="idle">Ready</span>
		{/if}
	</div>
</div>

<style>
	.spine-container {
		position: relative;
		width: 300px;
		height: 400px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.spine-container :global(canvas) {
		display: block;
	}

	.status-msg {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		font-size: 1rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		white-space: nowrap;
		z-index: 10;
	}

	.status-msg .dead {
		color: var(--color-accent);
		text-shadow: 0 0 20px var(--color-accent);
	}
	.status-msg .alive {
		color: var(--color-success);
		text-shadow: 0 0 20px var(--color-success);
	}
	.status-msg .aiming {
		color: var(--color-warning);
		animation: blink 0.3s infinite;
	}
	.status-msg .ready {
		color: var(--color-info);
	}
	.status-msg .idle {
		color: var(--color-text-muted);
	}

	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
