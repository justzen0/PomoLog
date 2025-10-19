// src/core/TimerManager.ts

import { moment } from 'obsidian';
import { EventEmitter } from 'events';
import { LogEntry, TimerState } from '../types';

export class TimerManager extends EventEmitter {
    private state: TimerState = 'idle';
    private intervalId: number | null = null;
    private timeLeft = 0; // in seconds
    private prePauseState: TimerState = 'idle';

    // Session details
    private pomoDuration = 0;
    private breakDuration = 0;
    private sessionTag = '';
    private sessionStartTime = '';

    constructor() {
        super();
    }

    start(pomo: number, breakTime: number, tag: string) {
        if (this.state !== 'idle') return;

        this.pomoDuration = pomo;
        this.breakDuration = breakTime;
        this.sessionTag = tag;
        
        this.startPomo();
    }

    private startPomo() {
        this.state = 'pomo';
        this.timeLeft = this.pomoDuration * 60;
        this.sessionStartTime = moment().toISOString();
        this.startInterval();
        this.emit('stateChange', this.state, this.timeLeft);
    }

    private startBreak() {
        this.state = 'break';
        this.timeLeft = this.breakDuration * 60;
        this.startInterval();
        this.emit('stateChange', this.state, this.timeLeft);
    }

    private startInterval() {
        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = window.setInterval(() => this.tick(), 1000);
    }

    private tick() {
        this.timeLeft--;
        this.emit('tick', this.timeLeft);

        if (this.timeLeft <= 0) {
            this.emit('phase_end');
            if (this.state === 'pomo') {
                this.logCompletedPomo();
                this.startBreak();
            } else if (this.state === 'break') {
                this.stop(false);
            }
        }
    }
    
    pauseResume() {
        if (this.state === 'pomo' || this.state === 'break') {
            this.prePauseState = this.state;
            this.state = 'paused';
            if (this.intervalId) clearInterval(this.intervalId);
            this.intervalId = null;
            this.emit('stateChange', this.state, this.timeLeft);
        } else if (this.state === 'paused') {
            this.state = this.prePauseState;
            this.startInterval();
            this.emit('stateChange', this.state, this.timeLeft);
        }
    }

    stop(log = true) {
        if (this.state === 'pomo' && log) {
            this.logCompletedPomo(true); // Log partial pomo
        }
        
        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = null;
        this.state = 'idle';
        this.timeLeft = 0;
        this.emit('stateChange', this.state, this.timeLeft);
    }
    
    private logCompletedPomo(isPartial = false) {
        const endTime = moment();
        const duration = isPartial 
            ? Math.round(endTime.diff(moment(this.sessionStartTime), 'minutes')) 
            : this.pomoDuration;

        const log: LogEntry = {
            startTime: this.sessionStartTime,
            endTime: endTime.toISOString(),
            duration: duration,
            tag: this.sessionTag,
        };
        this.emit('sessionEnd', log);
    }

    getState(): { state: TimerState, timeLeft: number } {
        return { state: this.state, timeLeft: this.timeLeft };
    }
}