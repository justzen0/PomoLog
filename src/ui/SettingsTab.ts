// src/ui/SettingsTab.ts

import { App, PluginSettingTab, Setting } from 'obsidian';
import PomoLog from '../../main';

export class PomoLogSettingTab extends PluginSettingTab {
    plugin: PomoLog;

    constructor(app: App, plugin: PomoLog) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'PomoLog Settings' });

        // --- General Settings ---
        new Setting(containerEl)
            .setName('Log file path')
            .setDesc('The file to store your Pomodoro logs.')
            .addText(text => text
                .setPlaceholder('PomoLog.md')
                .setValue(this.plugin.settings.logFilePath)
                .onChange(async (value) => {
                    this.plugin.settings.logFilePath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show status bar timer')
            .setDesc('Toggle the visibility of the timer in the status bar.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showStatusBar)
                .onChange(async (value) => {
                    this.plugin.settings.showStatusBar = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateStatusBar();
                }));

        // --- Appearance ---
        containerEl.createEl('h3', { text: 'Appearance' });
        new Setting(containerEl)
            .setName('Pomodoro color')
            .setDesc('The color of the timer during a Pomodoro session.')
            .addColorPicker(picker => picker
                .setValue(this.plugin.settings.pomoColor)
                .onChange(async (value) => {
                    this.plugin.settings.pomoColor = value;
                    await this.plugin.saveSettings();
                }));
        
        new Setting(containerEl)
            .setName('Break color')
            .setDesc('The color of the timer during a break session.')
            .addColorPicker(picker => picker
                .setValue(this.plugin.settings.breakColor)
                .onChange(async (value) => {
                    this.plugin.settings.breakColor = value;
                    await this.plugin.saveSettings();
                }));

        // --- Sounds ---
        containerEl.createEl('h3', { text: 'Sounds' });
        new Setting(containerEl)
            .setName('Volume')
            .addSlider(slider => slider
                .setLimits(0, 1, 0.1)
                .setValue(this.plugin.settings.volume)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.volume = value;
                    this.plugin.soundManager.setVolume(value);
                    await this.plugin.saveSettings();
                }));
        
        new Setting(containerEl)
            .setName('Enable ticking sound')
            .setDesc('Play a sound on every second of the timer.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableTicking)
                .onChange(async (value) => {
                    this.plugin.settings.enableTicking = value;
                    await this.plugin.saveSettings();
                }));
        
        new Setting(containerEl)
            .setName('Enable white noise')
            .setDesc('Play a background sound during Pomodoro sessions.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableWhiteNoise)
                .onChange(async (value) => {
                    this.plugin.settings.enableWhiteNoise = value;
                    if (!value) this.plugin.soundManager.stopWhiteNoise();
                    await this.plugin.saveSettings();
                }));
            

        new Setting(containerEl)
            .setName('Enable completion sound')
            .setDesc('Play a bell sound when a session or break ends.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableCompletionSound)
                .onChange(async (value) => {
                    this.plugin.settings.enableCompletionSound = value;
                    await this.plugin.saveSettings();
                }));

        
        new Setting(containerEl)
            .setName('White noise audio file')
            .setDesc('Path to an audio file inside your vault.')
            .addSearch(search => {
                const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'flac'];
                const audioFiles = this.app.vault.getFiles().filter(file => 
                    audioExtensions.includes(file.extension.toLowerCase())
                );

                search.setPlaceholder('Search for an audio file...');
                search.setValue(this.plugin.settings.whiteNoiseFile);

                // --- FIX IS HERE: Use .onChange() instead of .onChanged = ---
                search.onChange(async (value) => {
                    this.plugin.settings.whiteNoiseFile = value;
                    await this.plugin.saveSettings();
                });

                // This logic for suggestions is correct but undocumented, so we keep the 'any' cast.
                (search as any).onSuggestions = (text: string) => {
                    return audioFiles
                        .filter(file => file.path.toLowerCase().includes(text.toLowerCase()))
                        .map(file => file.path);
                };
            });

        // --- Timer Presets ---
        containerEl.createEl('h3', { text: 'Timer Presets' });
        this.plugin.settings.presets.forEach((preset, index) => {
            new Setting(containerEl)
                .setName(`Preset: ${preset.name}`)
                .addText(text => text
                    .setPlaceholder('Preset Name')
                    .setValue(preset.name)
                    .onChange(async (value) => {
                        this.plugin.settings.presets[index].name = value;
                        await this.plugin.saveSettings();
                    }))
                .addText(text => text
                    .setPlaceholder('Pomo (min)')
                    .setValue(String(preset.pomo))
                    .onChange(async (value) => {
                        this.plugin.settings.presets[index].pomo = Number(value) || 25;
                        await this.plugin.saveSettings();
                    }))
                .addText(text => text
                    .setPlaceholder('Break (min)')
                    .setValue(String(preset.break))
                    .onChange(async (value) => {
                        this.plugin.settings.presets[index].break = Number(value) || 5;
                        await this.plugin.saveSettings();
                    }))
                .addExtraButton(button => button
                    .setIcon('trash')
                    .setTooltip('Delete Preset')
                    .onClick(async () => {
                        this.plugin.settings.presets.splice(index, 1);
                        await this.plugin.saveSettings();
                        this.display();
                    }));
        });

        new Setting(containerEl)
            .addButton(button => button
                .setButtonText('Add New Preset')
                .onClick(async () => {
                    this.plugin.settings.presets.push({ name: 'New Preset', pomo: 25, break: 5 });
                    await this.plugin.saveSettings();
                    this.display();
                }));
    }
}