/**
 * Statistics Tracking Module
 * Tracks player performance across all game modes
 */

const Stats = {
    // Statistics data structure
    data: {
        // Overall stats
        totalGamesPlayed: 0,
        totalTimePlayed: 0, // in seconds

        // Speed Subnet stats
        speedSubnet: {
            gamesPlayed: 0,
            totalQuestions: 0,
            totalCorrect: 0,
            bestScore: 0,
            bestStreak: 0,
            totalTime: 0,
            fastestCorrectAnswer: null, // in ms
            categoryStats: {} // Per-category accuracy
        },

        // Client Scenarios stats
        scenarios: {
            gamesPlayed: 0,
            scenariosCompleted: 0,
            totalSubnetsPlaced: 0,
            perfectPlacements: 0, // 90%+ efficiency
            totalEfficiency: 0,
            efficiencyCount: 0,
            bestTime: null, // fastest scenario completion
            threeStarCount: 0
        },

        // Daily Challenge stats
        dailyChallenge: {
            totalCompleted: 0,
            currentStreak: 0,
            bestStreak: 0,
            lastCompletedDate: null,
            totalScore: 0
        },

        // Practice Mode stats
        practice: {
            sessionsCompleted: 0,
            categoryProgress: {} // Track improvement per category
        },

        // Session tracking
        currentSessionStart: null,

        // History for graphs (last 30 entries)
        history: {
            speedSubnetScores: [],
            dailyAccuracy: [],
            streaks: []
        }
    },

    /**
     * Initialize stats module
     */
    init() {
        this.load();
        this.startSession();
    },

    /**
     * Start a new session
     */
    startSession() {
        this.data.currentSessionStart = Date.now();
    },

    /**
     * End current session
     */
    endSession() {
        if (this.data.currentSessionStart) {
            const sessionTime = Math.floor((Date.now() - this.data.currentSessionStart) / 1000);
            this.data.totalTimePlayed += sessionTime;
            this.data.currentSessionStart = null;
            this.save();
        }
    },

    /**
     * Record a Speed Subnet game result
     */
    recordSpeedSubnetGame(results) {
        const ss = this.data.speedSubnet;

        ss.gamesPlayed++;
        ss.totalQuestions += results.totalQuestions;
        ss.totalCorrect += results.totalCorrect;

        if (results.score > ss.bestScore) {
            ss.bestScore = results.score;
        }

        if (results.bestStreak > ss.bestStreak) {
            ss.bestStreak = results.bestStreak;
        }

        // Track category stats
        if (results.categoryBreakdown) {
            for (const [category, data] of Object.entries(results.categoryBreakdown)) {
                if (!ss.categoryStats[category]) {
                    ss.categoryStats[category] = { correct: 0, total: 0 };
                }
                ss.categoryStats[category].correct += data.correct;
                ss.categoryStats[category].total += data.total;
            }
        }

        // Add to history
        this.data.history.speedSubnetScores.push({
            date: Date.now(),
            score: results.score,
            accuracy: results.accuracy
        });

        // Keep only last 30 entries
        if (this.data.history.speedSubnetScores.length > 30) {
            this.data.history.speedSubnetScores.shift();
        }

        this.data.totalGamesPlayed++;
        this.save();
    },

    /**
     * Record a scenario completion
     */
    recordScenarioComplete(scenarioId, stars, efficiency, subnetsPlaced, perfectCount) {
        const s = this.data.scenarios;

        s.gamesPlayed++;
        s.scenariosCompleted++;
        s.totalSubnetsPlaced += subnetsPlaced;
        s.perfectPlacements += perfectCount;
        s.totalEfficiency += efficiency;
        s.efficiencyCount++;

        if (stars === 3) {
            s.threeStarCount++;
        }

        this.data.totalGamesPlayed++;
        this.save();
    },

    /**
     * Record daily challenge completion
     */
    recordDailyChallenge(score, date) {
        const dc = this.data.dailyChallenge;
        const today = this.getDateString(date || new Date());
        const yesterday = this.getDateString(new Date(Date.now() - 86400000));

        dc.totalCompleted++;
        dc.totalScore += score;

        // Check streak
        if (dc.lastCompletedDate === yesterday) {
            dc.currentStreak++;
        } else if (dc.lastCompletedDate !== today) {
            dc.currentStreak = 1;
        }

        if (dc.currentStreak > dc.bestStreak) {
            dc.bestStreak = dc.currentStreak;
        }

        dc.lastCompletedDate = today;
        this.save();
    },

    /**
     * Record practice session
     */
    recordPracticeSession(category, correct, total) {
        const p = this.data.practice;

        p.sessionsCompleted++;

        if (!p.categoryProgress[category]) {
            p.categoryProgress[category] = { sessions: 0, correct: 0, total: 0 };
        }

        p.categoryProgress[category].sessions++;
        p.categoryProgress[category].correct += correct;
        p.categoryProgress[category].total += total;

        this.save();
    },

    /**
     * Record fastest answer time
     */
    recordAnswerTime(timeMs) {
        const ss = this.data.speedSubnet;
        if (ss.fastestCorrectAnswer === null || timeMs < ss.fastestCorrectAnswer) {
            ss.fastestCorrectAnswer = timeMs;
            this.save();
        }
    },

    /**
     * Get overall accuracy percentage
     */
    getOverallAccuracy() {
        const ss = this.data.speedSubnet;
        if (ss.totalQuestions === 0) return 0;
        return Math.round((ss.totalCorrect / ss.totalQuestions) * 100);
    },

    /**
     * Get accuracy for a specific category
     */
    getCategoryAccuracy(category) {
        const stats = this.data.speedSubnet.categoryStats[category];
        if (!stats || stats.total === 0) return null;
        return Math.round((stats.correct / stats.total) * 100);
    },

    /**
     * Get weakest categories (for practice mode suggestions)
     */
    getWeakestCategories(count = 3) {
        const stats = this.data.speedSubnet.categoryStats;
        const categories = Object.entries(stats)
            .filter(([_, data]) => data.total >= 5) // Need at least 5 attempts
            .map(([cat, data]) => ({
                category: cat,
                accuracy: Math.round((data.correct / data.total) * 100),
                total: data.total
            }))
            .sort((a, b) => a.accuracy - b.accuracy);

        return categories.slice(0, count);
    },

    /**
     * Get average scenario efficiency
     */
    getAverageEfficiency() {
        const s = this.data.scenarios;
        if (s.efficiencyCount === 0) return 0;
        return Math.round(s.totalEfficiency / s.efficiencyCount);
    },

    /**
     * Get formatted play time
     */
    getFormattedPlayTime() {
        let seconds = this.data.totalTimePlayed;

        // Add current session time if active
        if (this.data.currentSessionStart) {
            seconds += Math.floor((Date.now() - this.data.currentSessionStart) / 1000);
        }

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    },

    /**
     * Get summary statistics for display
     */
    getSummary() {
        return {
            totalGames: this.data.totalGamesPlayed,
            playTime: this.getFormattedPlayTime(),
            overallAccuracy: this.getOverallAccuracy(),
            bestSpeedScore: this.data.speedSubnet.bestScore,
            bestStreak: this.data.speedSubnet.bestStreak,
            scenariosCompleted: this.data.scenarios.scenariosCompleted,
            threeStars: this.data.scenarios.threeStarCount,
            avgEfficiency: this.getAverageEfficiency(),
            dailyChallengeStreak: this.data.dailyChallenge.currentStreak,
            dailyChallengesCompleted: this.data.dailyChallenge.totalCompleted
        };
    },

    /**
     * Get detailed category breakdown
     */
    getCategoryBreakdown() {
        const categoryNames = {
            hosts_to_cidr: "Hosts to CIDR",
            cidr_to_hosts: "CIDR to Hosts",
            subnet_mask: "Subnet Masks",
            network_class: "Network Classes",
            binary_bits: "Binary Math",
            network_address: "Network Address",
            broadcast: "Broadcast Address",
            first_host: "First Usable Host",
            last_host: "Last Usable Host"
        };

        const result = [];
        for (const [key, name] of Object.entries(categoryNames)) {
            const stats = this.data.speedSubnet.categoryStats[key];
            result.push({
                id: key,
                name: name,
                accuracy: stats ? Math.round((stats.correct / stats.total) * 100) : null,
                total: stats ? stats.total : 0,
                correct: stats ? stats.correct : 0
            });
        }

        return result;
    },

    /**
     * Get date string in YYYY-MM-DD format
     */
    getDateString(date) {
        return date.toISOString().split('T')[0];
    },

    /**
     * Check if daily challenge was completed today
     */
    isDailyChallengeCompletedToday() {
        const today = this.getDateString(new Date());
        return this.data.dailyChallenge.lastCompletedDate === today;
    },

    /**
     * Save stats to localStorage
     */
    save() {
        try {
            localStorage.setItem('subnetProStats', JSON.stringify(this.data));
        } catch (e) {
            console.warn('Failed to save stats:', e);
        }
    },

    /**
     * Load stats from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem('subnetProStats');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Deep merge with defaults
                this.data = this.mergeDeep(this.data, parsed);
            }
        } catch (e) {
            console.warn('Failed to load stats:', e);
        }
    },

    /**
     * Deep merge objects
     */
    mergeDeep(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.mergeDeep(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    },

    /**
     * Reset all stats
     */
    reset() {
        localStorage.removeItem('subnetProStats');
        this.data = {
            totalGamesPlayed: 0,
            totalTimePlayed: 0,
            speedSubnet: {
                gamesPlayed: 0,
                totalQuestions: 0,
                totalCorrect: 0,
                bestScore: 0,
                bestStreak: 0,
                totalTime: 0,
                fastestCorrectAnswer: null,
                categoryStats: {}
            },
            scenarios: {
                gamesPlayed: 0,
                scenariosCompleted: 0,
                totalSubnetsPlaced: 0,
                perfectPlacements: 0,
                totalEfficiency: 0,
                efficiencyCount: 0,
                bestTime: null,
                threeStarCount: 0
            },
            dailyChallenge: {
                totalCompleted: 0,
                currentStreak: 0,
                bestStreak: 0,
                lastCompletedDate: null,
                totalScore: 0
            },
            practice: {
                sessionsCompleted: 0,
                categoryProgress: {}
            },
            currentSessionStart: null,
            history: {
                speedSubnetScores: [],
                dailyAccuracy: [],
                streaks: []
            }
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Stats;
}
