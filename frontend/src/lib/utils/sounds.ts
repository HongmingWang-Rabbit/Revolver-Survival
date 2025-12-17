/**
 * Sound Effects Manager
 *
 * Handles audio playback for game events.
 * Uses Web Audio API for low-latency playback.
 */

import { gameConfig, type SoundName } from '$lib/config/game';

class SoundManager {
	private audioContext: AudioContext | null = null;
	private sounds: Map<SoundName, AudioBuffer> = new Map();
	private enabled: boolean = true;
	private loaded: boolean = false;

	constructor() {
		if (typeof window !== 'undefined') {
			this.init();
		}
	}

	private async init() {
		try {
			this.audioContext = new AudioContext();
			await this.loadSounds();
		} catch {
			this.enabled = false;
		}
	}

	private async loadSounds() {
		if (!this.audioContext) return;

		const { basePath, files } = gameConfig.sounds;

		const loadPromises = (Object.entries(files) as [SoundName, string][]).map(
			async ([name, filename]) => {
				const path = `${basePath}/${filename}`;
				try {
					const response = await fetch(path);
					if (!response.ok) throw new Error(`HTTP ${response.status}`);
					const arrayBuffer = await response.arrayBuffer();
					const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
					this.sounds.set(name, audioBuffer);
				} catch {
					this.sounds.set(name, this.createFallbackTone(name));
				}
			}
		);

		await Promise.all(loadPromises);
		this.loaded = true;
	}

	private createFallbackTone(name: SoundName): AudioBuffer {
		if (!this.audioContext) {
			throw new Error('AudioContext not initialized');
		}

		const ctx = this.audioContext;

		if (name === 'bang') {
			return this.createFallbackGunshot(ctx);
		}

		const fallbackParams: Record<SoundName, { freq: number; duration: number }> = {
			click: { freq: 800, duration: 0.05 },
			bet: { freq: 800, duration: 0.05 },
			spin: { freq: 400, duration: 0.3 },
			empty: { freq: 1000, duration: 0.1 },
			bang: { freq: 200, duration: 0.6 },
			win: { freq: 880, duration: 0.3 },
			cashout: { freq: 1200, duration: 0.2 },
			death: { freq: 200, duration: 0.5 },
		};

		const { freq, duration } = fallbackParams[name];
		const sampleRate = ctx.sampleRate;
		const length = Math.floor(sampleRate * duration);
		const buffer = ctx.createBuffer(1, length, sampleRate);
		const data = buffer.getChannelData(0);

		for (let i = 0; i < length; i++) {
			const t = i / sampleRate;
			const envelope = 1 - i / length;
			data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
		}

		return buffer;
	}

	private createFallbackGunshot(ctx: AudioContext): AudioBuffer {
		const sampleRate = ctx.sampleRate;
		const duration = 0.6;
		const length = Math.floor(sampleRate * duration);
		const buffer = ctx.createBuffer(1, length, sampleRate);
		const data = buffer.getChannelData(0);

		const attackEnd = 0.01;

		for (let i = 0; i < length; i++) {
			const t = i / sampleRate;
			const amplitude = t < attackEnd ? 1.0 : Math.exp(-8 * (t - attackEnd));

			const noise = Math.random() * 2 - 1;
			const bass = Math.sin(2 * Math.PI * 60 * t) * Math.exp(-10 * t);
			const mid = Math.sin(2 * Math.PI * 150 * t) * Math.exp(-15 * t);
			const high = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-30 * t);

			const mix = (noise * 0.5 + bass * 0.8 + mid * 0.4 + high * 0.3) * amplitude;
			data[i] = Math.max(-1, Math.min(1, mix));
		}

		return buffer;
	}

	play(name: SoundName) {
		if (!this.enabled || !this.audioContext) return;

		const buffer = this.sounds.get(name);
		if (!buffer) return;

		try {
			if (this.audioContext.state === 'suspended') {
				this.audioContext.resume();
			}

			const source = this.audioContext.createBufferSource();
			source.buffer = buffer;
			source.connect(this.audioContext.destination);
			source.start();
		} catch {
			// Silent fail - sound playback is non-critical
		}
	}

	setEnabled(enabled: boolean) {
		this.enabled = enabled;
	}

	get isEnabled(): boolean {
		return this.enabled;
	}

	get isLoaded(): boolean {
		return this.loaded;
	}

	toggle(): boolean {
		this.enabled = !this.enabled;
		return this.enabled;
	}
}

export const SFX = new SoundManager();
