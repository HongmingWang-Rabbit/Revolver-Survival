<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { isSpinning, roundState, showResult } from '$lib/stores/gameStore';
	import { Application, Assets } from 'pixi.js';
	import { Spine } from '@esotericsoftware/spine-pixi-v8';
	import { spineConfig, getSpinningAnimation, getWinAnimation } from '$lib/config/spine';
	import { base } from '$app/paths';

	// Use SvelteKit's base path for asset resolution (works in both dev and production)
	const baseUrl = base || '';

	let container: HTMLDivElement;
	let app: Application | null = null;
	let spine: Spine | null = null;
	let currentAnimation = '';
	let currentPixelRatio = 1;
	let pixelRatioMediaQuery: MediaQueryList | null = null;
	let pixelRatioHandler: (() => void) | null = null;

	// Extract config values
	const {
		atlasPath,
		skeletonPath,
		animations,
		nonLoopingAnimations,
		canvas,
		scale: baseScale,
		position,
		rendering
	} = spineConfig;

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

	function getTargetAnimation(
		showingResult: boolean,
		survived: boolean,
		spinning: boolean,
		gameState: string,
		spinCount: number
	): string {
		if (showingResult && !survived) {
			return animations.death;
		}
		if (showingResult && survived) {
			return getWinAnimation(spinCount);
		}
		if (spinning) {
			return getSpinningAnimation(spinCount);
		}
		if (gameState === 'betting' || gameState === 'continue') {
			return animations.betting;
		}
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

	function getPixelRatio(): number {
		return Math.max(window.devicePixelRatio || 1, rendering.minPixelRatio);
	}

	function updateResolution() {
		if (!app) return;

		const newPixelRatio = getPixelRatio();
		if (newPixelRatio !== currentPixelRatio) {
			currentPixelRatio = newPixelRatio;
			app.renderer.resolution = newPixelRatio;
			// Force a full resize to apply new resolution
			resizeCanvas();
		}
	}

	function resizeCanvas() {
		if (!app || !spine || !container) return;

		const rect = container.getBoundingClientRect();
		const width = rect.width || canvas.width;
		const height = rect.height || canvas.height;

		// Resize the renderer with current resolution
		app.renderer.resize(width, height);

		// Calculate scale based on container size relative to base canvas size
		const scaleX = width / canvas.width;
		const scaleY = height / canvas.height;
		const scaleFactor = Math.min(scaleX, scaleY);

		// Apply scale to spine - center horizontally and vertically
		spine.scale.set(baseScale * scaleFactor);
		spine.x = width / 2;
		// Position from center, accounting for character's anchor point
		spine.y = height / 2 + (height * position.verticalOffset);
	}

	function setupPixelRatioListener() {
		// Listen for devicePixelRatio changes (browser zoom)
		const updateAndRelisten = () => {
			updateResolution();
			// Re-create media query for new pixel ratio
			if (pixelRatioMediaQuery && pixelRatioHandler) {
				pixelRatioMediaQuery.removeEventListener('change', pixelRatioHandler);
			}
			pixelRatioMediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
			pixelRatioMediaQuery.addEventListener('change', updateAndRelisten);
		};
		pixelRatioHandler = updateAndRelisten;
		updateAndRelisten();
	}

	let resizeObserver: ResizeObserver | null = null;

	onMount(async () => {
		try {
			const rect = container.getBoundingClientRect();
			const initialWidth = rect.width || canvas.width;
			const initialHeight = rect.height || canvas.height;

			// Initialize pixel ratio for high-DPI displays
			currentPixelRatio = getPixelRatio();

			app = new Application();
			await app.init({
				background: 'transparent',
				backgroundAlpha: 0,
				width: initialWidth,
				height: initialHeight,
				resolution: currentPixelRatio,
				autoDensity: true,
				antialias: rendering.antialias,
				roundPixels: rendering.roundPixels,
				resizeTo: container,
			});

			container.appendChild(app.canvas);

			// Construct URLs for assets using SvelteKit base path
			const atlasUrl = `${baseUrl}${atlasPath}`;
			const skeletonUrl = `${baseUrl}${skeletonPath}`;

			await Assets.load([
				{ alias: 'spineAtlas', src: atlasUrl },
				{ alias: 'spineData', src: skeletonUrl },
			]);

			spine = Spine.from({
				atlas: 'spineAtlas',
				skeleton: 'spineData',
			});

			spine.state.data.defaultMix = spineConfig.defaultMixDuration;
			app.stage.addChild(spine);

			// Initial positioning
			resizeCanvas();
			playAnimation(animations.idle);

			// Listen for resize
			window.addEventListener('resize', resizeCanvas);

			// Listen for browser zoom changes (devicePixelRatio)
			setupPixelRatioListener();

			// Use ResizeObserver for container size changes
			resizeObserver = new ResizeObserver(() => {
				resizeCanvas();
			});
			resizeObserver.observe(container);
		} catch {
			// Spine initialization failed - character won't be visible
		}
	});

	onDestroy(() => {
		window.removeEventListener('resize', resizeCanvas);
		if (pixelRatioMediaQuery && pixelRatioHandler) {
			pixelRatioMediaQuery.removeEventListener('change', pixelRatioHandler);
			pixelRatioMediaQuery = null;
			pixelRatioHandler = null;
		}
		if (resizeObserver) {
			resizeObserver.disconnect();
			resizeObserver = null;
		}
		if (app) {
			app.destroy(true, { children: true });
			app = null;
		}
		spine = null;
	});
</script>

<div class="spine-container" bind:this={container}></div>

<style>
	.spine-container {
		position: relative;
		width: 100%;
		height: 100%;
		min-width: 200px;
		min-height: 300px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.spine-container :global(canvas) {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
