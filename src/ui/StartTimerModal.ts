// src/ui/StartTimerModal.ts

import { App, Modal, Setting } from 'obsidian';
import { TimerPreset } from '../types';
import { DataManager } from '../core/DataManager';

export class StartTimerModal extends Modal {
    presets: TimerPreset[];
    dataManager: DataManager;
    onSubmit: (preset: TimerPreset, tag: string) => void;

    private selectedPreset: TimerPreset;
    private tag = '';

    constructor(app: App, presets: TimerPreset[], dataManager: DataManager, onSubmit: (preset: TimerPreset, tag: string) => void) {
        super(app);
        this.presets = presets;
        this.dataManager = dataManager;
        this.onSubmit = onSubmit;
        this.selectedPreset = presets[0];
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Start a Pomodoro Session' });

        new Setting(contentEl)
            .setName('Timer Preset')
            .addDropdown(dropdown => {
                this.presets.forEach(preset => {
                    dropdown.addOption(preset.name, preset.name);
                });
                dropdown.onChange(value => {
                    this.selectedPreset = this.presets.find(p => p.name === value) || this.presets[0];
                });
            });

        new Setting(contentEl)
            .setName('Tag')
            .setDesc('What are you working on? (e.g., #project-x)')
            .addText((text) => {
                // Future enhancement: Add autocomplete here using dataManager.getAllTags()
                text.inputEl.onkeyup = () => {
                    this.tag = text.getValue();
                };
                text.setPlaceholder('#writing');
            });
            
        new Setting(contentEl)
            .addButton(button => button
                .setButtonText('Start Timer')
                .setCta()
                .onClick(() => {
                    if (this.tag.trim() === '') {
                        return;
                    }
                    this.onSubmit(this.selectedPreset, this.tag);
                    this.close();
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}