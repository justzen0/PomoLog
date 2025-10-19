// src/ui/StatsModal.ts (New File)

import { App, Modal } from 'obsidian';
import { PomoStats } from '../core/DataManager';

export class StatsModal extends Modal {
    stats: PomoStats;

    constructor(app: App, stats: PomoStats) {
        super(app);
        this.stats = stats;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'PomoLog Statistics' });

        this.createSection(contentEl, 'Today', this.stats.today);
        this.createSection(contentEl, 'This Week', this.stats.week);
        this.createSection(contentEl, 'All Time', this.stats.allTime);
    }

    private createSection(container: HTMLElement, title: string, data: PomoStats['today']) {
        container.createEl('h3', { text: title });

        if (data.totalMinutes === 0) {
            container.createEl('p', { text: 'No sessions logged for this period.' });
            return;
        }

        const totalHours = (data.totalMinutes / 60).toFixed(1);
        container.createEl('p', { text: `Total focus time: ${data.totalMinutes} minutes (${totalHours} hours)` });

        const ul = container.createEl('ul');
        // Sort tags by duration, descending
        const sortedTags = Object.entries(data.byTag).sort((a, b) => b[1] - a[1]);

        for (const [tag, minutes] of sortedTags) {
            ul.createEl('li', { text: `${tag}: ${minutes} minutes` });
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}