<script lang="ts">
	import { isSpinning, roundState, showResult } from '$lib/stores/gameStore';

	const CHAMBERS = 6;

	// Reactive state
	$: spinning = $isSpinning;
	$: bullets = $roundState.selectedBullets;
	$: result = $roundState.lastResult;
	$: showingResult = $showResult;

	// Get result chamber (the one that was fired) - 1 indexed from result, convert to 0-indexed
	$: resultChamber = result?.events.find(e => e.type === 'spin')?.chamber ?? 0;
	$: resultChamberIndex = resultChamber - 1; // Convert to 0-indexed
	$: survived = result?.events.find(e => e.type === 'outcome')?.status === 'survived';

	// Calculate which chambers have bullets (for visual)
	// Must match the result: if died, fired chamber has bullet; if survived, it doesn't
	function getBulletChambers(bulletCount: number, firedIndex: number, didSurvive: boolean, hasResult: boolean): number[] {
		const chambers: number[] = [];

		if (hasResult && firedIndex >= 0) {
			// We have a result - place bullets to match outcome
			if (!didSurvive) {
				// Player died - fired chamber MUST have a bullet
				chambers.push(firedIndex);
				// Distribute remaining bullets to other chambers
				const otherChambers = [0, 1, 2, 3, 4, 5].filter(c => c !== firedIndex);
				for (let i = 1; i < bulletCount; i++) {
					const idx = Math.floor(Math.random() * otherChambers.length);
					chambers.push(otherChambers.splice(idx, 1)[0]);
				}
			} else {
				// Player survived - fired chamber MUST be empty
				const otherChambers = [0, 1, 2, 3, 4, 5].filter(c => c !== firedIndex);
				for (let i = 0; i < bulletCount; i++) {
					const idx = Math.floor(Math.random() * otherChambers.length);
					chambers.push(otherChambers.splice(idx, 1)[0]);
				}
			}
		} else {
			// No result yet - randomly distribute bullets
			const available = [0, 1, 2, 3, 4, 5];
			for (let i = 0; i < bulletCount; i++) {
				const idx = Math.floor(Math.random() * available.length);
				chambers.push(available.splice(idx, 1)[0]);
			}
		}

		return chambers;
	}

	$: bulletChambers = getBulletChambers(bullets, resultChamberIndex, survived, showingResult);
</script>

<div class="revolver-container" class:spinning class:survived={showingResult && survived} class:death={showingResult && !survived}>
	<!-- Cylinder -->
	<div class="cylinder" class:spin-animation={spinning}>
		{#each Array(CHAMBERS) as _, i}
			<div
				class="chamber"
				class:has-bullet={bulletChambers.includes(i)}
				class:fired={showingResult && resultChamber === i + 1}
				style="--angle: {i * 60}deg"
			>
				<div class="chamber-inner">
					{#if bulletChambers.includes(i)}
						<div class="bullet"></div>
					{/if}
				</div>
			</div>
		{/each}

		<!-- Center spindle -->
		<div class="spindle"></div>
	</div>

	<!-- Result indicator -->
	{#if showingResult}
		<div class="result-indicator animate-slide-up">
			{#if survived}
				<span class="click-text">CLICK!</span>
			{:else}
				<span class="bang-text">BANG!</span>
			{/if}
		</div>
	{/if}

	<!-- Firing hammer indicator -->
	<div class="hammer" class:fired={showingResult}></div>
</div>

<style>
	.revolver-container {
		position: relative;
		width: 280px;
		height: 280px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: filter 0.3s ease;
	}

	.revolver-container.spinning {
		filter: blur(1px);
	}

	.revolver-container.survived {
		filter: drop-shadow(0 0 20px var(--color-success));
	}

	.revolver-container.death {
		filter: drop-shadow(0 0 30px var(--color-accent));
	}

	.cylinder {
		position: relative;
		width: 220px;
		height: 220px;
		border-radius: 50%;
		background: linear-gradient(145deg, #3a3a3a, #1a1a1a);
		box-shadow:
			inset 0 5px 15px rgba(0, 0, 0, 0.5),
			0 10px 30px rgba(0, 0, 0, 0.8);
		transition: transform 0.1s ease;
	}

	.spin-animation {
		animation: cylinderSpin 1.5s cubic-bezier(0.17, 0.67, 0.12, 0.99);
	}

	@keyframes cylinderSpin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(1440deg);
		}
	}

	.chamber {
		position: absolute;
		width: 45px;
		height: 45px;
		left: 50%;
		top: 50%;
		margin-left: -22.5px;
		margin-top: -22.5px;
		transform: rotate(var(--angle)) translateY(-70px);
	}

	.chamber-inner {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: linear-gradient(145deg, #1a1a1a, #0a0a0a);
		border: 2px solid #444;
		box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}

	.chamber.fired .chamber-inner {
		box-shadow:
			inset 0 2px 8px rgba(0, 0, 0, 0.8),
			0 0 15px rgba(255, 68, 68, 0.6);
		border-color: var(--color-accent);
	}

	.chamber.has-bullet .chamber-inner {
		background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
	}

	.bullet {
		width: 20px;
		height: 20px;
		border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
		background: linear-gradient(145deg, #d4a574, #8b6914);
		box-shadow:
			inset 0 2px 4px rgba(255, 255, 255, 0.3),
			0 2px 4px rgba(0, 0, 0, 0.4);
	}

	.spindle {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 40px;
		height: 40px;
		margin-left: -20px;
		margin-top: -20px;
		border-radius: 50%;
		background: linear-gradient(145deg, #4a4a4a, #2a2a2a);
		border: 2px solid #555;
		box-shadow:
			inset 0 2px 6px rgba(0, 0, 0, 0.6),
			0 4px 10px rgba(0, 0, 0, 0.6);
	}

	.spindle::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		width: 15px;
		height: 15px;
		margin-left: -7.5px;
		margin-top: -7.5px;
		border-radius: 50%;
		background: linear-gradient(145deg, #3a3a3a, #1a1a1a);
		border: 1px solid #444;
	}

	.result-indicator {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 2.5rem;
		font-weight: bold;
		text-shadow: 0 0 20px currentColor;
		z-index: 10;
	}

	.click-text {
		color: var(--color-success);
	}

	.bang-text {
		color: var(--color-accent);
		animation: bangPulse 0.5s ease-out;
	}

	@keyframes bangPulse {
		0% {
			transform: scale(0.5);
			opacity: 0;
		}
		50% {
			transform: scale(1.3);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	.hammer {
		position: absolute;
		right: -10px;
		top: 50%;
		width: 25px;
		height: 40px;
		margin-top: -20px;
		background: linear-gradient(90deg, #4a4a4a, #3a3a3a);
		border-radius: 5px 10px 10px 5px;
		transform-origin: bottom center;
		transition: transform 0.1s ease;
	}

	.hammer.fired {
		transform: rotate(-30deg);
	}
</style>
