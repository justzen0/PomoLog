// src/core/DataManager.ts

import { App, TFile, moment } from 'obsidian';
import { LogEntry } from '../types';

export interface PomoStats {
    today: { totalMinutes: number; byTag: Record<string, number> };
    week: { totalMinutes: number; byTag: Record<string, number> };
    allTime: { totalMinutes: number; byTag: Record<string, number> };
}

export class DataManager {
    app: App;
    logFilePath: string;

    constructor(app: App, logFilePath: string) {
        this.app = app;
        this.logFilePath = logFilePath;
    }

    async getStats(): Promise<PomoStats> {
        const file = await this.getLogFile();
        const content = await this.app.vault.read(file);
        const lines = content.split('\n');

        const stats: PomoStats = {
            today: { totalMinutes: 0, byTag: {} },
            week: { totalMinutes: 0, byTag: {} },
            allTime: { totalMinutes: 0, byTag: {} },
        };

        let currentDate: moment.Moment | null = null;
        const now = moment();

        for (const line of lines) {
            // Check for a date header
            const dateMatch = line.match(/^##\s*(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
                currentDate = moment(dateMatch[1], 'YYYY-MM-DD');
                continue;
            }

            // Check for a table row with data
            const rowMatch = line.match(/^\|\s*[\d:]+\s*\|\s*[\d:]+\s*\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|/);
            if (rowMatch && currentDate) {
                const duration = parseInt(rowMatch[1], 10);
                const tag = rowMatch[2].trim();

                // Aggregate for All Time
                stats.allTime.totalMinutes += duration;
                stats.allTime.byTag[tag] = (stats.allTime.byTag[tag] || 0) + duration;

                // Aggregate for This Week
                if (now.isSame(currentDate, 'week')) {
                    stats.week.totalMinutes += duration;
                    stats.week.byTag[tag] = (stats.week.byTag[tag] || 0) + duration;
                }

                // Aggregate for Today
                if (now.isSame(currentDate, 'day')) {
                    stats.today.totalMinutes += duration;
                    stats.today.byTag[tag] = (stats.today.byTag[tag] || 0) + duration;
                }
            }
        }
        return stats;
    }
    
    async logSession(log: LogEntry): Promise<void> {
        const file = await this.getLogFile();
        const dateHeader = `## ${moment(log.startTime).format('YYYY-MM-DD')}`;
        const tableHeader = `| Start Time | End Time   | Duration (min) | Tag        |\n|------------|------------|----------------|------------|`;
        
        let content = await this.app.vault.read(file);
        
        const logRow = `| ${moment(log.startTime).format('HH:mm:ss')}   | ${moment(log.endTime).format('HH:mm:ss')}   | ${log.duration}             | ${log.tag} |`;
        
        if (!content.includes(dateHeader)) {
            // Add new date section to the top
            const newSection = `${dateHeader}\n${tableHeader}\n${logRow}\n\n`;
            content = newSection + content;
        } else {
            // Find the correct date header and insert the row
            const lines = content.split('\n');
            const headerIndex = lines.findIndex(line => line.trim() === dateHeader);
            let insertIndex = -1;

            // Find the end of the table for that day
            for (let i = headerIndex + 2; i < lines.length; i++) {
                if (!lines[i].startsWith('|')) {
                    insertIndex = i;
                    break;
                }
            }
            if (insertIndex === -1) insertIndex = lines.length; // End of file

            lines.splice(insertIndex, 0, logRow);
            content = lines.join('\n');
        }
        
        await this.app.vault.modify(file, content);
    }

    async getLogFile(): Promise<TFile> {
        const file = this.app.vault.getAbstractFileByPath(this.logFilePath);
        if (file instanceof TFile) {
            return file;
        }
        // File does not exist, create it
        const fileContent = `# PomoLog Database\n\n`;
        const newFile = await this.app.vault.create(this.logFilePath, fileContent);
        return newFile;
    }
    
    async getAllTags(): Promise<string[]> {
        try {
            const file = await this.getLogFile();
            const content = await this.app.vault.read(file);
            const tagRegex = /\|\s*([^|]+?)\s*\|$/gm;
            const matches = content.matchAll(tagRegex);
            const tags = new Set<string>();
            for (const match of matches) {
                const tag = match[1].trim();
                if (tag !== 'Tag') { // Exclude header
                    tags.add(tag);
                }
            }
            return Array.from(tags);
        } catch (error) {
            console.error("PomoLog: Could not read tags from log file.", error);
            return [];
        }
    }
}