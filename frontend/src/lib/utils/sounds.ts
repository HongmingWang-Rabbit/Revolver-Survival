/**
 * Sound Effects Manager
 *
 * Handles audio playback for game events.
 * Uses Web Audio API for low-latency playback.
 */

type SoundName = 'click' | 'spin' | 'empty' | 'bang' | 'win' | 'cashout' | 'bet';

class SoundManager {
	private audioContext: AudioContext | null = null;
	private sounds: Map<SoundName, AudioBuffer> = new Map();
	private enabled: boolean = true;

	constructor() {
		if (typeof window !== 'undefined') {
			this.init();
		}
	}

	private async init() {
		try {
			this.audioContext = new AudioContext();
			// In production, load actual sound files
			// For now, we'll generate simple tones
			await this.generateSounds();
		} catch (e) {
			console.warn('Audio not available:', e);
		}
	}

	private async generateSounds() {
		if (!this.audioContext) return;

		// Generate simple procedural sounds
		const ctx = this.audioContext;

		// Click sound - short high frequency
		this.sounds.set('click', this.createTone(ctx, 800, 0.05));

		// Spin sound - descending frequency
		this.sounds.set('spin', this.createTone(ctx, 400, 0.3, 200));

		// Empty chamber - click
		this.sounds.set('empty', this.createTone(ctx, 1000, 0.1));

		// Bang - gunshot sound
		this.sounds.set('bang', this.createGunshot(ctx));

		// Win sound - ascending tone
		this.sounds.set('win', this.createTone(ctx, 440, 0.5, 880));

		// Cash out - coin sound
		this.sounds.set('cashout', this.createTone(ctx, 1200, 0.2, 1400));

		// Bet placed
		this.sounds.set('bet', this.createTone(ctx, 600, 0.1));
	}

	private createTone(
		ctx: AudioContext,
		startFreq: number,
		duration: number,
		endFreq?: number
	): AudioBuffer {
		const sampleRate = ctx.sampleRate;
		const length = Math.floor(sampleRate * duration);
		const buffer = ctx.createBuffer(1, length, sampleRate);
		const data = buffer.getChannelData(0);

		for (let i = 0; i < length; i++) {
			const t = i / sampleRate;
			const freq = endFreq
				? startFreq + (endFreq - startFreq) * (i / length)
				: startFreq;

			// Sine wave with envelope
			const envelope = 1 - (i / length);
			data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
		}

		return buffer;
	}

	private createNoise(ctx: AudioContext, duration: number): AudioBuffer {
		const sampleRate = ctx.sampleRate;
		const length = Math.floor(sampleRate * duration);
		const buffer = ctx.createBuffer(1, length, sampleRate);
		const data = buffer.getChannelData(0);

		for (let i = 0; i < length; i++) {
			// White noise with envelope
			const envelope = 1 - (i / length);
			data[i] = (Math.random() * 2 - 1) * envelope * 0.8;
		}

		return buffer;
	}

	private createGunshot(ctx: AudioContext): AudioBuffer {
		const sampleRate = ctx.sampleRate;
		const duration = 0.6;
		const length = Math.floor(sampleRate * duration);
		const buffer = ctx.createBuffer(1, length, sampleRate);
		const data = buffer.getChannelData(0);

		for (let i = 0; i < length; i++) {
			const t = i / sampleRate;
			const progress = i / length;

			// Sharp attack (first 10ms)
			const attackEnd = 0.01;
			let amplitude = 0;

			if (t < attackEnd) {
				// Sharp crack - instant attack
				amplitude = 1.0;
			} else {
				// Exponential decay
				amplitude = Math.exp(-8 * (t - attackEnd));
			}

			// Combine multiple elements for realistic gunshot:
			// 1. Initial crack (noise burst)
			const noise = (Math.random() * 2 - 1);

			// 2. Low frequency thump (bass)
			const bass = Math.sin(2 * Math.PI * 60 * t) * Math.exp(-10 * t);

			// 3. Mid-range punch
			const mid = Math.sin(2 * Math.PI * 150 * t) * Math.exp(-15 * t);

			// 4. High frequency crack
			const high = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-30 * t);

			// Mix together
			const mix = (noise * 0.5 + bass * 0.8 + mid * 0.4 + high * 0.3) * amplitude;

			// Clamp and apply
			data[i] = Math.max(-1, Math.min(1, mix));
		}

		return buffer;
	}

	play(name: SoundName) {
		if (!this.enabled || !this.audioContext) return;

		const buffer = this.sounds.get(name);
		if (!buffer) return;

		try {
			// Resume context if suspended (browser autoplay policy)
			if (this.audioContext.state === 'suspended') {
				this.audioContext.resume();
			}

			const source = this.audioContext.createBufferSource();
			source.buffer = buffer;
			source.connect(this.audioContext.destination);
			source.start();
		} catch (e) {
			console.warn('Failed to play sound:', e);
		}
	}

	setEnabled(enabled: boolean) {
		this.enabled = enabled;
	}

	get isEnabled(): boolean {
		return this.enabled;
	}

	toggle() {
		this.enabled = !this.enabled;
		return this.enabled;
	}
}

// Singleton instance
export const SFX = new SoundManager();
