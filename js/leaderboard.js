/**
 * Leaderboard Module
 * Local high score tracking for all game modes
 */
'use strict';

const Leaderboard = {
    // Maximum entries per category
    maxEntries: 10,

    // Score data
    data: {
        speedSubnet: [],
        daily: [],
        scenarios: {}
    },

    /**
     * Initialize leaderboard
     */
    init() {
        this.load();
    },

    /**
     * Add a Speed Subnet score
     */
    addSpeedSubnetScore(score, accuracy, streak) {
        const entry = {
            score,
            accuracy,
            streak,
            date: Date.now()
        };

        this.data.speedSubnet.push(entry);
        this.data.speedSubnet.sort((a, b) => b.score - a.score);
        this.data.speedSubnet = this.data.speedSubnet.slice(0, this.maxEntries);

        this.save();

        // Return rank (1-based)
        return this.data.speedSubnet.findIndex(e => e.date === entry.date) + 1;
    },

    /**
     * Add a Daily Challenge score
     */
    addDailyScore(score, accuracy, date) {
        const entry = {
            score,
            accuracy,
            date: date || Date.now(),
            dateStr: new Date(date || Date.now()).toISOString().split('T')[0]
        };

        // Only one entry per day
        const existingIndex = this.data.daily.findIndex(e => e.dateStr === entry.dateStr);
        if (existingIndex > -1) {
            // Update only if better
            if (score > this.data.daily[existingIndex].score) {
                this.data.daily[existingIndex] = entry;
            }
        } else {
            this.data.daily.push(entry);
        }

        this.data.daily.sort((a, b) => b.score - a.score);
        this.data.daily = this.data.daily.slice(0, this.maxEntries);

        this.save();

        return this.data.daily.findIndex(e => e.dateStr === entry.dateStr) + 1;
    },

    /**
     * Add a Scenario score
     */
    addScenarioScore(scenarioId, score, efficiency, stars) {
        if (!this.data.scenarios[scenarioId]) {
            this.data.scenarios[scenarioId] = [];
        }

        const entry = {
            score,
            efficiency,
            stars,
            date: Date.now()
        };

        this.data.scenarios[scenarioId].push(entry);
        this.data.scenarios[scenarioId].sort((a, b) => b.score - a.score);
        this.data.scenarios[scenarioId] = this.data.scenarios[scenarioId].slice(0, this.maxEntries);

        this.save();

        return this.data.scenarios[scenarioId].findIndex(e => e.date === entry.date) + 1;
    },

    /**
     * Get Speed Subnet leaderboard
     */
    getSpeedSubnetScores() {
        return this.data.speedSubnet.map((entry, index) => ({
            rank: index + 1,
            score: entry.score,
            accuracy: entry.accuracy,
            streak: entry.streak,
            date: this.formatDate(entry.date)
        }));
    },

    /**
     * Get Daily Challenge leaderboard
     */
    getDailyScores() {
        return this.data.daily.map((entry, index) => ({
            rank: index + 1,
            score: entry.score,
            accuracy: entry.accuracy,
            date: entry.dateStr
        }));
    },

    /**
     * Get Scenario leaderboard
     */
    getScenarioScores(scenarioId) {
        if (!this.data.scenarios[scenarioId]) {
            return [];
        }

        return this.data.scenarios[scenarioId].map((entry, index) => ({
            rank: index + 1,
            score: entry.score,
            efficiency: entry.efficiency,
            stars: entry.stars,
            date: this.formatDate(entry.date)
        }));
    },

    /**
     * Get best score for Speed Subnet
     */
    getSpeedSubnetBest() {
        if (this.data.speedSubnet.length === 0) return null;
        return this.data.speedSubnet[0];
    },

    /**
     * Get best score for a scenario
     */
    getScenarioBest(scenarioId) {
        if (!this.data.scenarios[scenarioId] || this.data.scenarios[scenarioId].length === 0) {
            return null;
        }
        return this.data.scenarios[scenarioId][0];
    },

    /**
     * Check if score is a new high score
     */
    isNewHighScore(mode, score, scenarioId = null) {
        if (mode === 'speed') {
            return this.data.speedSubnet.length === 0 || score > this.data.speedSubnet[0].score;
        } else if (mode === 'daily') {
            return this.data.daily.length === 0 || score > this.data.daily[0].score;
        } else if (mode === 'scenario' && scenarioId) {
            const scores = this.data.scenarios[scenarioId];
            return !scores || scores.length === 0 || score > scores[0].score;
        }
        return false;
    },

    /**
     * Format date for display
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${month}/${day}`;
    },

    /**
     * Get all-time stats summary
     */
    getSummary() {
        const speedBest = this.getSpeedSubnetBest();
        const dailyBest = this.data.daily.length > 0 ? this.data.daily[0] : null;

        let scenarioBestScore = 0;
        let totalScenarioGames = 0;

        for (const scores of Object.values(this.data.scenarios)) {
            if (scores.length > 0) {
                if (scores[0].score > scenarioBestScore) {
                    scenarioBestScore = scores[0].score;
                }
                totalScenarioGames += scores.length;
            }
        }

        return {
            speedSubnet: {
                best: speedBest ? speedBest.score : 0,
                games: this.data.speedSubnet.length
            },
            daily: {
                best: dailyBest ? dailyBest.score : 0,
                challenges: this.data.daily.length
            },
            scenarios: {
                best: scenarioBestScore,
                games: totalScenarioGames
            }
        };
    },

    /**
     * Save to localStorage
     */
    save() {
        localStorage.setItem('subnetProLeaderboard', JSON.stringify(this.data));
    },

    /**
     * Load from localStorage
     */
    load() {
        try {
            const data = JSON.parse(localStorage.getItem('subnetProLeaderboard'));
            if (data) {
                this.data.speedSubnet = data.speedSubnet || [];
                this.data.daily = data.daily || [];
                this.data.scenarios = data.scenarios || {};
            }
        } catch (e) {
            // No saved leaderboard data
        }
    },

    /**
     * Reset all leaderboard data
     */
    reset() {
        this.data = {
            speedSubnet: [],
            daily: [],
            scenarios: {}
        };
        this.save();
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Leaderboard;
}
