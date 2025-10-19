// main.ts

import { Plugin } from 'obsidian';
import { PomoLogSettingTab } from './src/ui/SettingsTab';
import { DEFAULT_SETTINGS, PomoLogSettings, LogEntry, TimerState } from './src/types';
import { TimerManager } from './src/core/TimerManager';
import { DataManager } from './src/core/DataManager';
import { StartTimerModal } from './src/ui/StartTimerModal';
import { TimerView, TIMER_VIEW_TYPE } from './src/ui/TimerView';
import { SoundManager } from './src/core/SoundManager';
import { StatsModal } from './src/ui/StatsModal';

export default class PomoLog extends Plugin {
    settings: PomoLogSettings;
    timerManager: TimerManager;
    dataManager: DataManager;
    statusBarItemEl: HTMLElement;
    soundManager: SoundManager;

    async onload() {
        await this.loadSettings();

        this.timerManager = new TimerManager();
        this.dataManager = new DataManager(this.app, this.settings.logFilePath);
        this.soundManager = new SoundManager(this); // Pass the plugin instance
        this.soundManager.setVolume(this.settings.volume);

        this.registerView(
            TIMER_VIEW_TYPE,
            (leaf) => new TimerView(leaf, this)
        );

        this.statusBarItemEl = this.addStatusBarItem();
        this.updateStatusBar();

        this.addRibbonIcon('tomato', 'Open PomoLog Timer', () => this.activateView());

        this.addCommand({ id: 'open-pomolog-timer-view', name: 'Open timer view', callback: () => this.activateView() });
        this.addCommand({ id: 'start-pomolog-timer', name: 'Start a new timer session', callback: () => this.openStartTimerModal() });
        this.addCommand({ id: 'pause-resume-pomolog-timer', name: 'Pause/Resume timer', callback: () => this.timerManager.pauseResume() });
        this.addCommand({ id: 'stop-pomolog-timer', name: 'Stop timer', callback: () => this.timerManager.stop() });
        this.addCommand({ id: 'show-pomolog-stats', name: 'Show statistics',
            callback: async () => {
                const stats = await this.dataManager.getStats();
                new StatsModal(this.app, stats).open();
            },
        });

        this.addSettingTab(new PomoLogSettingTab(this.app, this));

        this.timerManager.on('stateChange', (state: TimerState) => {
            this.updateStatusBar();
            if (this.settings.enableWhiteNoise) {
                if (state === 'pomo') {
                    this.soundManager.playWhiteNoise(this.settings.whiteNoiseFile);
                } else {
                    this.soundManager.stopWhiteNoise();
                }
            }
        });

        this.timerManager.on('tick', () => {
            this.updateStatusBar();
            if (this.settings.enableTicking && this.timerManager.getState().state !== 'idle') {
                this.soundManager.playTick();
            }
        });

        this.timerManager.on('phase_end', () => {
            if (this.settings.enableCompletionSound) {
                this.soundManager.playCompletionSound();
            }
        });
        
        this.timerManager.on('sessionEnd', (log: LogEntry) => {
            this.dataManager.logSession(log);
        });
    }

    async activateView() {
        this.app.workspace.detachLeavesOfType(TIMER_VIEW_TYPE);

        // --- THE FIX IS HERE ---
        // Get the leaf, which might be null according to the types.
        const leaf = this.app.workspace.getRightLeaf(true);

        // Add the 'if' check to ensure leaf is not null before using it.
        if (leaf) {
            await leaf.setViewState({
                type: TIMER_VIEW_TYPE,
                active: true,
            });

            this.app.workspace.revealLeaf(leaf);
        }
    }

    openStartTimerModal() {
        new StartTimerModal(this.app, this.settings.presets, this.dataManager, (preset, tag) => {
            this.soundManager.unlockAudio();
            this.timerManager.start(preset.pomo, preset.break, tag);
        }).open();
    }
    
    updateStatusBar() {
        if (!this.settings.showStatusBar) {
            this.statusBarItemEl.setText('');
            return;
        }
        const { state, timeLeft } = this.timerManager.getState();
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        let icon = '';
        switch (state) {
            case 'pomo': icon = '🍅 '; break;
            case 'break': icon = '☕ '; break;
            case 'paused': icon = '⏸️ '; break;
            default: this.statusBarItemEl.setText('🍅 PomoLog'); return;
        }
        this.statusBarItemEl.setText(`${icon} ${timeFormatted}`);
    }

    onunload() {
        this.timerManager.stop(false);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.dataManager = new DataManager(this.app, this.settings.logFilePath);
    }
}