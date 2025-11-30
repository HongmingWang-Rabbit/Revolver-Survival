<script lang="ts">
	import { isSpinning, roundState, showResult } from '$lib/stores/gameStore';

	$: spinning = $isSpinning;
	$: result = $roundState.lastResult;
	$: showingResult = $showResult;
	$: gameState = $roundState.gameState;
	$: bullets = $roundState.selectedBullets;

	// Use payoutMultiplier to determine survival - more reliable than events
	$: survived = (result?.payoutMultiplier || 0) > 0;

	// Determine pose based on game state
	$: pose = (() => {
		if (showingResult && !survived) return 'pose-dead';
		if (showingResult && survived) return 'pose-win';
		if (spinning) return 'pose-aim';
		if (gameState === 'betting' || gameState === 'continue') return 'pose-spin';
		return 'pose-idle';
	})();

	// Show gun when game is active
	$: showGun = gameState !== 'idle';

	// Show muzzle flash on death
	$: showFlash = showingResult && !survived;
</script>

<div class="stickman-container">
	<div class="stickman {pose}">
		<!-- Torso is the root element -->
		<div class="torso limb">
			<!-- Head -->
			<div class="head">
				{#if showingResult && !survived}
					<!-- X eyes when dead -->
					<div class="eyes-dead">
						<span class="x-eye left"></span>
						<span class="x-eye right"></span>
					</div>
				{:else if showingResult && survived}
					<!-- Happy eyes -->
					<div class="eyes-happy">
						<span class="eye left"></span>
						<span class="eye right"></span>
						<span class="mouth happy"></span>
					</div>
				{:else if spinning}
					<!-- Scared eyes -->
					<div class="eyes-scared">
						<span class="eye left"></span>
						<span class="eye right"></span>
						<span class="sweat"></span>
					</div>
				{:else}
					<!-- Normal eyes -->
					<div class="eyes">
						<span class="eye left"></span>
						<span class="eye right"></span>
					</div>
				{/if}
			</div>

			<!-- Left Leg -->
			<div class="limb leg-l">
				<div class="limb shin-l"></div>
			</div>

			<!-- Right Leg -->
			<div class="limb leg-r">
				<div class="limb shin-r"></div>
			</div>

			<!-- Left Arm -->
			<div class="limb arm-l">
				<div class="limb forearm-l"></div>
			</div>

			<!-- Right Arm (holds gun) -->
			<div class="limb arm-r">
				<div class="limb forearm-r">
					<!-- Gun -->
					<div class="gun" class:gun-hidden={!showGun}>
						<div class="gun-body">
							<div class="gun-grip"></div>
							<div class="gun-cylinder">
								<!-- Bullet chambers -->
								{#each Array(6) as _, i}
									<div class="chamber" class:has-bullet={i < bullets}></div>
								{/each}
							</div>
							<div class="gun-barrel"></div>
						</div>
						<div class="muzzle-flash" class:show={showFlash}></div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Blood splatter on death -->
	{#if showingResult && !survived}
		<div class="blood-effects">
			<div class="blood-splatter s1"></div>
			<div class="blood-splatter s2"></div>
			<div class="blood-splatter s3"></div>
			<div class="blood-pool"></div>
		</div>
	{/if}

	<!-- Status message -->
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
	.stickman-container {
		position: relative;
		width: 200px;
		height: 320px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.stickman {
		position: relative;
		width: 0;
		height: 0;
		transform: scale(1.2);
		transition: all 0.5s ease;
	}

	/* Base limb styling */
	.limb {
		position: absolute;
		background-color: #dfe6e9;
		border-radius: 10px;
		width: 6px;
		transform-origin: top center;
		transition: transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), background-color 0.3s;
		box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
	}

	/* Torso */
	.torso {
		width: 8px;
		height: 60px;
		top: -60px;
		left: -4px;
		transform-origin: bottom center;
	}

	/* Head */
	.head {
		width: 36px;
		height: 36px;
		border: 4px solid #dfe6e9;
		border-radius: 50%;
		position: absolute;
		top: -48px;
		left: -18px;
		background: var(--color-bg);
		z-index: 5;
		transition: transform 0.4s, border-color 0.3s;
	}

	/* Eyes */
	.eyes, .eyes-happy, .eyes-scared {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.eye {
		position: absolute;
		width: 4px;
		height: 4px;
		background: #dfe6e9;
		border-radius: 50%;
		top: 12px;
	}
	.eye.left { left: 8px; }
	.eye.right { right: 8px; }

	.eyes-dead {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.x-eye {
		position: absolute;
		top: 10px;
		width: 10px;
		height: 10px;
	}
	.x-eye.left { left: 5px; }
	.x-eye.right { right: 5px; }
	.x-eye::before, .x-eye::after {
		content: '';
		position: absolute;
		width: 10px;
		height: 2px;
		background: var(--color-accent);
		top: 4px;
	}
	.x-eye::before { transform: rotate(45deg); }
	.x-eye::after { transform: rotate(-45deg); }

	.mouth {
		position: absolute;
		bottom: 8px;
		left: 50%;
		transform: translateX(-50%);
		width: 12px;
		height: 6px;
		border: 2px solid #dfe6e9;
		border-top: none;
		border-radius: 0 0 10px 10px;
	}

	.sweat {
		position: absolute;
		right: -8px;
		top: 8px;
		width: 6px;
		height: 10px;
		background: #74b9ff;
		border-radius: 50% 50% 50% 50% / 30% 30% 70% 70%;
		animation: drip 0.5s infinite;
	}

	@keyframes drip {
		0%, 100% { transform: translateY(0); opacity: 1; }
		100% { transform: translateY(8px); opacity: 0; }
	}

	/* Legs */
	.leg-l {
		height: 50px;
		top: 55px;
		left: 0;
		transform: rotate(15deg);
	}
	.shin-l {
		height: 50px;
		top: 45px;
		left: 0;
		transform: rotate(-5deg);
	}
	.leg-r {
		height: 50px;
		top: 55px;
		left: 0;
		transform: rotate(-15deg);
	}
	.shin-r {
		height: 50px;
		top: 45px;
		left: 0;
		transform: rotate(5deg);
	}

	/* Arms */
	.arm-l {
		height: 45px;
		top: 2px;
		left: -4px;
		transform: rotate(20deg);
		z-index: 1;
	}
	.forearm-l {
		height: 40px;
		top: 40px;
		left: 0;
		transform: rotate(10deg);
	}
	.arm-r {
		height: 45px;
		top: 2px;
		left: 4px;
		transform: rotate(-20deg);
		z-index: 4;
	}
	.forearm-r {
		height: 40px;
		top: 40px;
		left: 0;
		transform: rotate(-10deg);
	}

	/* Gun */
	.gun {
		position: absolute;
		bottom: -5px;
		left: -8px;
		transform-origin: 5px 4px;
		transform: rotate(90deg);
		opacity: 1;
		transition: opacity 0.3s, transform 0.4s;
	}
	.gun-hidden {
		opacity: 0;
	}

	.gun-body {
		position: relative;
		width: 35px;
		height: 10px;
		background: linear-gradient(180deg, #b2bec3, #636e72);
		border-radius: 2px;
	}

	.gun-grip {
		position: absolute;
		width: 10px;
		height: 18px;
		background: linear-gradient(90deg, #4a3728, #2d1f15);
		left: 2px;
		top: 8px;
		border-radius: 2px;
	}

	.gun-cylinder {
		position: absolute;
		width: 18px;
		height: 18px;
		background: #b2bec3;
		border-radius: 50%;
		left: 12px;
		top: -3px;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		padding: 3px;
		box-sizing: border-box;
	}

	.chamber {
		width: 4px;
		height: 4px;
		background: #1e272e;
		border-radius: 50%;
		margin: 0.5px;
	}
	.chamber.has-bullet {
		background: #d4a574;
		box-shadow: inset 0 1px 2px rgba(0,0,0,0.3);
	}

	.gun-barrel {
		position: absolute;
		width: 18px;
		height: 6px;
		background: linear-gradient(180deg, #636e72, #2d3436);
		right: 0;
		top: 3px;
		border-radius: 0 3px 3px 0;
	}

	.muzzle-flash {
		position: absolute;
		right: -40px;
		top: -20px;
		width: 50px;
		height: 50px;
		background: radial-gradient(circle, #fff 10%, #fdcb6e 40%, transparent 70%);
		opacity: 0;
		pointer-events: none;
		border-radius: 50%;
	}
	.muzzle-flash.show {
		animation: flash 0.15s forwards;
	}

	@keyframes flash {
		0% { opacity: 1; transform: scale(1.5); }
		100% { opacity: 0; transform: scale(0.5); }
	}

	/* === POSES === */

	/* Idle - breathing, gun down */
	.pose-idle .torso {
		animation: breathe 2.5s infinite ease-in-out;
	}
	.pose-idle .arm-r { transform: rotate(-15deg); }
	.pose-idle .forearm-r { transform: rotate(-10deg); }
	.pose-idle .gun { transform: rotate(80deg); }

	@keyframes breathe {
		0%, 100% { transform: scaleY(1); }
		50% { transform: scaleY(1.02); }
	}

	/* Spin - spinning cylinder */
	.pose-spin .arm-r { transform: rotate(-60deg); }
	.pose-spin .forearm-r { transform: rotate(-80deg); }
	.pose-spin .gun { transform: rotate(0deg); animation: spinGun 0.3s infinite linear; }
	.pose-spin .arm-l { transform: rotate(50deg); }
	.pose-spin .forearm-l { transform: rotate(70deg); }
	.pose-spin .head { transform: rotate(8deg) translateY(2px); }

	@keyframes spinGun {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* Aim - pointing gun at own temple, shivering */
	.pose-aim .arm-r { transform: rotate(-110deg); transition-duration: 0.8s; }
	.pose-aim .forearm-r { transform: rotate(-80deg); transition-duration: 0.8s; }
	.pose-aim .gun { transform: rotate(180deg) scaleX(-1); transition-duration: 0.8s; }
	.pose-aim .arm-l { transform: rotate(20deg); }
	.pose-aim .forearm-l { transform: rotate(10deg); }
	.pose-aim .head { transform: rotate(10deg); transition-delay: 0.3s; }
	.pose-aim .torso { animation: shiver 0.1s infinite; }

	@keyframes shiver {
		0% { transform: translate(0, 0); }
		25% { transform: translate(1px, 0); }
		75% { transform: translate(-1px, 0); }
	}

	/* Win - arms up celebration */
	.pose-win .arm-r { transform: rotate(160deg); }
	.pose-win .forearm-r { transform: rotate(0deg); }
	.pose-win .gun { transform: rotate(0deg); }
	.pose-win .arm-l { transform: rotate(-160deg); }
	.pose-win .forearm-l { transform: rotate(0deg); }
	.pose-win .head { transform: rotate(0deg); }
	.pose-win .torso { animation: jump 0.3s infinite alternate; }

	@keyframes jump {
		0% { transform: translateY(0); }
		100% { transform: translateY(-10px); }
	}

	/* Dead - collapsed, red, stays centered */
	.pose-dead .limb {
		background-color: var(--color-accent) !important;
	}
	.pose-dead .head {
		border-color: var(--color-accent) !important;
	}
	.pose-dead .torso {
		transform: rotate(0deg);
		transition: 0.3s cubic-bezier(0.6, 0.04, 0.98, 0.335);
	}
	.pose-dead .leg-l { transform: rotate(30deg); }
	.pose-dead .leg-r { transform: rotate(-30deg); }
	.pose-dead .shin-l { transform: rotate(20deg); }
	.pose-dead .shin-r { transform: rotate(-20deg); }
	.pose-dead .arm-l { transform: rotate(45deg); }
	.pose-dead .arm-r { transform: rotate(-45deg); }
	.pose-dead .forearm-l { transform: rotate(30deg); }
	.pose-dead .forearm-r { transform: rotate(-30deg); }
	.pose-dead .gun { opacity: 0; }
	.pose-dead .head { transform: rotate(25deg) translateY(5px); }

	/* Blood effects */
	.blood-effects {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	.blood-splatter {
		position: absolute;
		background: var(--color-accent);
		border-radius: 50%;
		animation: splatter 0.4s ease-out forwards;
	}
	.blood-splatter.s1 { width: 20px; height: 20px; top: -80px; left: -10px; animation-delay: 0.1s; }
	.blood-splatter.s2 { width: 15px; height: 15px; top: -70px; left: 15px; animation-delay: 0.15s; }
	.blood-splatter.s3 { width: 25px; height: 25px; top: -90px; left: -25px; animation-delay: 0.2s; }

	@keyframes splatter {
		0% { transform: scale(0); opacity: 0; }
		50% { transform: scale(1.3); opacity: 1; }
		100% { transform: scale(1); opacity: 0.9; }
	}

	.blood-pool {
		position: absolute;
		width: 80px;
		height: 20px;
		background: var(--color-accent);
		border-radius: 50%;
		top: 80px;
		left: -40px;
		opacity: 0;
		animation: poolSpread 0.8s ease-out 0.3s forwards;
	}

	@keyframes poolSpread {
		0% { transform: scaleX(0); opacity: 0; }
		100% { transform: scaleX(1); opacity: 0.8; }
	}

	/* Status message */
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
	}

	.status-msg .dead { color: var(--color-accent); text-shadow: 0 0 20px var(--color-accent); }
	.status-msg .alive { color: var(--color-success); text-shadow: 0 0 20px var(--color-success); }
	.status-msg .aiming { color: var(--color-warning); animation: blink 0.3s infinite; }
	.status-msg .ready { color: #3498db; }
	.status-msg .idle { color: var(--color-text-muted); }

	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
</style>
