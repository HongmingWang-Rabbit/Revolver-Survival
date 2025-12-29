/**
 * Spine Animation Configuration
 *
 * Configure animation mappings and settings for the Spine character.
 * Update animation names here when the Spine file changes.
 *
 * Animation Reference:
 * - A1: Default idle
 * - A2: Loading bullets transition (spinning cylinder)
 * - A3: First survival idle (after surviving once)
 * - A4: Second survival idle (after surviving twice)
 * - B1: First aiming after loading
 * - B2: Second aiming (after first survival)
 * - B3_1: Third aiming → successful shot (DEATH)
 * - B3_2: Third aiming → failed shot (SURVIVE)
 */

export interface SpineConfig {
	/** Path to Spine atlas file (relative to static folder) */
	atlasPath: string;
	/** Path to Spine skeleton JSON file (relative to static folder) */
	skeletonPath: string;
	/** Default mix duration for animation transitions (seconds) */
	defaultMixDuration: number;
	/** Character scale factor at base dimensions */
	scale: number;
	/** Base canvas dimensions for scaling calculations */
	canvas: {
		width: number;
		height: number;
	};
	/** Character positioning within canvas */
	position: {
		/** Vertical offset from center (0 = centered, positive = lower) */
		verticalOffset: number;
	};
	/** Rendering settings for PixiJS canvas */
	rendering: {
		/** Minimum pixel ratio for high-DPI rendering (default: 2) */
		minPixelRatio: number;
		/** Enable anti-aliasing for smoother edges */
		antialias: boolean;
		/** Round pixel positions for sharper rendering */
		roundPixels: boolean;
	};
	/** Animation name mappings for game states */
	animations: {
		/** Default idle animation */
		idle: string;
		/** Loading bullets / spinning cylinder */
		betting: string;
		/** Aiming animations (by spin count: 1, 2, 3+) */
		spinning: string[];
		/** Survival idle animations (by survival count: 1, 2+) */
		win: string[];
		/** Death animation (gun fires) */
		death: string;
		/** Survival animation for third spin (gun clicks empty) */
		surviveThird: string;
	};
	/** Animations that should not loop */
	nonLoopingAnimations: string[];
}

export const spineConfig: SpineConfig = {
	atlasPath: 'https://raw.githubusercontent.com/HongmingWang-Rabbit/Revolver-Survival/main/frontend/static/spine/demo.atlas',
	skeletonPath: 'https://raw.githubusercontent.com/HongmingWang-Rabbit/Revolver-Survival/main/frontend/static/spine/demo.json',
	defaultMixDuration: 0.3,
	scale: 0.55,
	canvas: {
		width: 300,
		height: 400,
	},
	position: {
		verticalOffset: 0.45,
	},
	rendering: {
		minPixelRatio: 2,
		antialias: true,
		roundPixels: true,
	},
	animations: {
		idle: 'A1',
		betting: 'A2',
		// Aiming animations based on which spin this is
		spinning: ['B1', 'B2', 'B3_2'], // First, Second, Third+ spin
		// Survival idle animations based on how many times survived
		win: ['A3', 'A4'], // First survival, Second+ survival
		death: 'B3_1',
		surviveThird: 'B3_2',
	},
	nonLoopingAnimations: ['B3_1', 'B3_2'],
};

/**
 * Get the appropriate spinning/aiming animation based on spin count
 * @param spinCount - Number of spins so far in this round (1, 2, 3+)
 */
export function getSpinningAnimation(spinCount: number): string {
	const { spinning } = spineConfig.animations;
	if (spinCount <= 1) return spinning[0]; // B1 - first aim
	if (spinCount === 2) return spinning[1]; // B2 - second aim
	return spinning[2]; // B3_2 - third+ aim
}

/**
 * Get the appropriate win/survival animation based on survival count
 * @param survivalCount - Number of times survived this round (1, 2+)
 */
export function getWinAnimation(survivalCount: number): string {
	const { win } = spineConfig.animations;
	if (survivalCount <= 1) return win[0]; // A3 - first survival idle
	return win[1]; // A4 - second+ survival idle
}
