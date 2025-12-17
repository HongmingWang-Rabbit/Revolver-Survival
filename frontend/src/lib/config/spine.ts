/**
 * Spine Animation Configuration
 *
 * Configure animation mappings and settings for the Spine character.
 * Update animation names here when the Spine file changes.
 */

export interface SpineConfig {
	/** Path to Spine atlas file (relative to static folder) */
	atlasPath: string;
	/** Path to Spine skeleton JSON file (relative to static folder) */
	skeletonPath: string;
	/** Default mix duration for animation transitions (seconds) */
	defaultMixDuration: number;
	/** Character scale factor */
	scale: number;
	/** Canvas dimensions */
	canvas: {
		width: number;
		height: number;
	};
	/** Animation name mappings for game states */
	animations: {
		idle: string;
		betting: string;
		spinning: string;
		win: string;
		death: string;
	};
	/** Animations that should not loop */
	nonLoopingAnimations: string[];
}

export const spineConfig: SpineConfig = {
	atlasPath: '/spine/demo.atlas',
	skeletonPath: '/spine/demo.json',
	defaultMixDuration: 0.3,
	scale: 0.35,
	canvas: {
		width: 300,
		height: 400,
	},
	animations: {
		idle: 'A1',
		betting: 'A2',
		spinning: 'A3',
		win: 'B1',
		death: 'B3_1',
	},
	nonLoopingAnimations: ['B3_1', 'B3_2'],
};
