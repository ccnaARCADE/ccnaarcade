/**
 * Save Data Module
 * Export and import all game progress
 */
'use strict';

const SaveData = {
    // Keys to export/import
    storageKeys: [
        'subnetProProgress',
        'subnetProAchievements',
        'subnetProSettings',
        'subnetProStats',
        'subnetProLeaderboard',
        'subnetProSound',
        'subnetProTheme',
        'subnetProTutorial',
        'networkTetrisCustomScenarios'
    ],

    /**
     * Export all save data to JSON
     */
    exportAll() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            game: 'SubnetPro'
        };

        // Collect all storage data
        for (const key of this.storageKeys) {
            try {
                const value = localStorage.getItem(key);
                if (value) {
                    data[key] = JSON.parse(value);
                }
            } catch (e) {
                // Skip invalid data
            }
        }

        return JSON.stringify(data, null, 2);
    },

    /**
     * Download save data as file
     */
    downloadSave() {
        const data = this.exportAll();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const date = new Date().toISOString().split('T')[0];
        const filename = `subnetpro-save-${date}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
    },

    /**
     * Import save data from JSON string
     */
    importAll(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // Validate
            if (!data.game || data.game !== 'SubnetPro') {
                return { success: false, error: 'Invalid save file format' };
            }

            // Restore all keys
            let restored = 0;
            for (const key of this.storageKeys) {
                if (data[key]) {
                    localStorage.setItem(key, JSON.stringify(data[key]));
                    restored++;
                }
            }

            return {
                success: true,
                message: `Restored ${restored} data sections`,
                count: restored
            };
        } catch (e) {
            return { success: false, error: 'Failed to parse save file: ' + e.message };
        }
    },

    /**
     * Import from file input
     */
    importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = this.importAll(e.target.result);
                resolve(result);
            };
            reader.onerror = () => {
                reject({ success: false, error: 'Failed to read file' });
            };
            reader.readAsText(file);
        });
    },

    /**
     * Get save data summary
     */
    getSummary() {
        const summary = {
            hasData: false,
            stats: {}
        };

        try {
            // Progress
            const progress = JSON.parse(localStorage.getItem('subnetProProgress') || '{}');
            summary.stats.highScore = progress.highScore || 0;
            summary.stats.scenariosCompleted = Object.keys(progress.scenarioProgress || {}).length;

            // Achievements
            const achievements = JSON.parse(localStorage.getItem('subnetProAchievements') || '{}');
            summary.stats.achievementsUnlocked = Object.keys(achievements.unlocked || {}).length;

            // Leaderboard
            const leaderboard = JSON.parse(localStorage.getItem('subnetProLeaderboard') || '{}');
            summary.stats.speedGames = (leaderboard.speedSubnet || []).length;
            summary.stats.dailyGames = (leaderboard.daily || []).length;

            summary.hasData = summary.stats.highScore > 0 ||
                             summary.stats.scenariosCompleted > 0 ||
                             summary.stats.achievementsUnlocked > 0;
        } catch (e) {
            // No data
        }

        return summary;
    },

    /**
     * Clear all save data
     */
    clearAll() {
        for (const key of this.storageKeys) {
            localStorage.removeItem(key);
        }
        return true;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaveData;
}
