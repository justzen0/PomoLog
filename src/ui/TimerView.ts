// src/ui/TimerView.ts

import { ItemView, WorkspaceLeaf } from 'obsidian';
import PomoLog from '../../main';
import { TimerState } from '../types';

export const TIMER_VIEW_TYPE = 'pomolog-timer-view';

export class TimerView extends ItemView {
    plugin: PomoLog;
    private timerContainer: HTMLElement;

    // References to our UI elements
    private timeDisplayEl: HTMLElement;
    private statusLabelEl: HTMLElement;
    private pauseResumeButton: HTMLButtonElement; // <-- ADD THIS PROPERTY

    constructor(leaf: WorkspaceLeaf, plugin: PomoLog) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return 'pomolog-timer-view';
    }

    getDisplayText(): string {
        return 'PomoLog Timer';
    }



    getIcon(): string {
        return 'timer';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('pomolog-timer-view');
        this.timerContainer = container as HTMLElement;

        this.drawUI();
        this.setupEventListeners();
        this.updateInitialState();
    }

    async onClose() {
        this.plugin.timerManager.off('tick', this.updateDisplay);
        this.plugin.timerManager.off('stateChange', this.onStateChange);
    }

    private setupEventListeners() {
        this.plugin.timerManager.on('tick', this.updateDisplay);
        this.plugin.timerManager.on('stateChange', this.onStateChange);
    }
    
    private updateDisplay = (timeLeft: number) => {
        this.updateClock(timeLeft);
    }
    private onStateChange = (state: TimerState, timeLeft: number) => {
        this.setTimerState(state, timeLeft);
    }

    private updateInitialState() {
        const { state, timeLeft } = this.plugin.timerManager.getState();
        this.setTimerState(state, timeLeft);
    }

    private setTimerState(state: TimerState, timeLeft: number) {
        let color: string;
        let label: string;

        // --- FIX IS HERE: UPDATE BUTTON TEXT BASED ON STATE ---
        switch (state) {
            case 'pomo':
            case 'break':
                color = state === 'pomo' ? this.plugin.settings.pomoColor : this.plugin.settings.breakColor;
                label = state === 'pomo' ? 'Session' : 'Break';
                this.pauseResumeButton.textContent = 'Pause'; // When running, show "Pause"
                break;
            case 'paused':
                color = 'var(--text-muted)';
                label = 'Paused';
                this.pauseResumeButton.textContent = 'Resume'; // When paused, show "Resume"
                break;
            default: // idle
                color = 'var(--text-muted)';
                label = 'Session';
                this.pauseResumeButton.textContent = 'Pause'; // Default to "Pause"
                break;
        }

        this.timerContainer.style.setProperty('--timer-color', color);
        this.statusLabelEl.textContent = label;

        this.updateClock(timeLeft);
    }

    private updateClock(timeLeft: number) {
        if (!this.timeDisplayEl) return;

        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        if (timeLeft <= 0 && this.plugin.timerManager.getState().state === 'idle') {
            const defaultPomo = this.plugin.settings.presets[0]?.pomo || 25;
            this.timeDisplayEl.textContent = `${String(defaultPomo).padStart(2, '0')}:00`;
        } else {
            this.timeDisplayEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }

    private drawUI() {
        const container = this.timerContainer.createDiv({ cls: 'pomolog-container' });
        const screen = container.createDiv({ cls: 'timer-screen' });

        this.statusLabelEl = screen.createDiv({ cls: 'timer-label', text: 'Session' });
        this.timeDisplayEl = screen.createDiv({ cls: 'timer-display', text: '25:00' });
        
        const controls = screen.createDiv({ cls: 'timer-controls' });
        
        controls.createEl('button', { text: 'Start' }).onclick = () => this.plugin.openStartTimerModal();
        
        // --- FIX IS HERE: STORE THE BUTTON REFERENCE ---
        this.pauseResumeButton = controls.createEl('button', { text: 'Pause' });
        this.pauseResumeButton.onclick = () => this.plugin.timerManager.pauseResume();
        
        controls.createEl('button', { text: 'Stop' }).onclick = () => this.plugin.timerManager.stop();
    }
}