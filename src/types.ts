// src/types.ts

export interface TimerPreset {
    name: string;
    pomo: number; // minutes
    break: number; // minutes
}

export interface PomoLogSettings {
    logFilePath: string;
    presets: TimerPreset[];
    showStatusBar: boolean;
    pomoColor: string;   // <-- Add this
    breakColor: string;
    volume: number; // A value from 0 to 1
    enableTicking: boolean;
    enableWhiteNoise: boolean;
    whiteNoiseFile: string;
    enableCompletionSound: boolean;
}

export const DEFAULT_SETTINGS: PomoLogSettings = {
    logFilePath: 'PomoLog.md',
    presets: [
        { name: 'Default (25/5)', pomo: 25, break: 5 },
        { name: 'Study (50/10)', pomo: 50, break: 10 },
    ],
    showStatusBar: true,
    pomoColor: '#e55642',   // <-- Add this (a nice tomato red)
    breakColor: '#36a8e5',
    volume: 0.5,
    enableTicking: true,
    enableWhiteNoise: false,
    whiteNoiseFile: '',
    enableCompletionSound: true,
};

export type TimerState = 'pomo' | 'break' | 'paused' | 'idle';

export interface LogEntry {
    startTime: string; // ISO format
    endTime: string;   // ISO format
    duration: number;  // minutes
    tag: string;
}