// src/core/SoundManager.ts

import { Plugin } from 'obsidian';

export class SoundManager {
    private tickAudio: HTMLAudioElement;
    private bellAudio: HTMLAudioElement;
    private whiteNoiseAudio: HTMLAudioElement | null = null;
    private volume: number = 0.5;
    private plugin: Plugin;

    constructor(plugin: Plugin) {
        this.plugin = plugin;

        // --- THE DEFINITIVE FIX IS HERE ---

        // 1. Construct the full, vault-relative path to each asset.
        // this.plugin.manifest.dir gives us the path like ".obsidian/plugins/PomoLog"
        const tickPath = `${this.plugin.manifest.dir}/media/tick.mp3`;
        const bellPath = `${this.plugin.manifest.dir}/media/bell.mp3`;

        // 2. Ask the Obsidian adapter to convert these full paths into valid, usable URLs.
        // This is the most reliable way to get a working asset URL.
        const tickUrl = this.plugin.app.vault.adapter.getResourcePath(tickPath);
        const bellUrl = this.plugin.app.vault.adapter.getResourcePath(bellPath);

        // 3. Create the audio elements with the corrected URLs.
        this.tickAudio = new Audio(tickUrl);
        this.bellAudio = new Audio(bellUrl);
    }

    // This function is kept for conceptual consistency, though not strictly needed
    // for the file-based tick/bell sounds.
    unlockAudio() {}

    setVolume(volume: number) {
        this.volume = volume;
        this.tickAudio.volume = this.volume * 0.5; // Ticks should be quieter
        this.bellAudio.volume = this.volume;
        if (this.whiteNoiseAudio) {
            this.whiteNoiseAudio.volume = this.volume;
        }
    }

    playTick() {
        this.tickAudio.currentTime = 0;
        this.tickAudio.play().catch(e => console.error("PomoLog: Tick audio play failed.", e));
    }
    
    playCompletionSound() {
        this.bellAudio.currentTime = 0;
        this.bellAudio.play().catch(e => console.error("PomoLog: Bell audio play failed.", e));
    }

    // The white noise logic is fine as it loads files from the vault root.
    async playWhiteNoise(filePath: string) {
        if (!filePath) return;
        this.stopWhiteNoise();

        const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
        if (!file) {
            console.error(`PomoLog: White noise file not found at path: ${filePath}`);
            return;
        }

        const resourcePath = this.plugin.app.vault.adapter.getResourcePath(filePath);
        this.whiteNoiseAudio = new Audio(resourcePath);
        this.whiteNoiseAudio.loop = true;
        this.whiteNoiseAudio.volume = this.volume;
        this.whiteNoiseAudio.play().catch(e => console.error("PomoLog: White noise play failed.", e));
    }

    stopWhiteNoise() {
        if (this.whiteNoiseAudio) {
            this.whiteNoiseAudio.pause();
            this.whiteNoiseAudio = null;
        }
    }
}