/**
 * Revolver Survival - Library Exports
 */

// Components
export { default as BetControls } from './components/BetControls.svelte';
export { default as GameActions } from './components/GameActions.svelte';
export { default as GameDisclaimer } from './components/GameDisclaimer.svelte';
export { default as SpineCharacter } from './components/SpineCharacter.svelte';

// Config
export { spineConfig, getSpinningAnimation, getWinAnimation } from './config/spine';
export type { SpineConfig } from './config/spine';
export { gameConfig } from './config/game';
export type { GameConfig } from './config/game';

// Stores
export * from './stores/gameStore';

// Types
export * from './types';

// Utils
export { SFX } from './utils/sounds';
export * from './utils/socialMode';
export * from './utils/currency';
