/**
 * Settings & Progression Module
 * Manages difficulty levels, hints, and achievements
 */
'use strict';

const Settings = {
    // Current settings
    difficulty: 'beginner', // beginner, intermediate, expert
    showHints: true,

    // Difficulty configurations
    difficulties: {
        beginner: {
            name: 'BEGINNER',
            description: 'Hints shown, slower pace',
            showCidrHints: true,
            showMinCidrOnRequests: true,
            arcadeSpawnInterval: 10000,
            arcadeMaxQueue: 6,
            puzzleTimeLimit: null,
            scoreMultiplier: 1,
            speedQuestions: 15,
            dailyTimeLimit: 180, // 3 minutes
            questionCategories: ['hosts_to_cidr', 'cidr_to_hosts', 'network_class']
        },
        intermediate: {
            name: 'INTERMEDIATE',
            description: 'No CIDR hints, moderate pace',
            showCidrHints: false,
            showMinCidrOnRequests: true,
            arcadeSpawnInterval: 7000,
            arcadeMaxQueue: 5,
            puzzleTimeLimit: null,
            scoreMultiplier: 1.5,
            speedQuestions: 20,
            dailyTimeLimit: 150, // 2.5 minutes
            questionCategories: ['hosts_to_cidr', 'cidr_to_hosts', 'subnet_mask', 'network_class', 'binary_bits']
        },
        expert: {
            name: 'EXPERT',
            description: 'No hints at all, fast pace',
            showCidrHints: false,
            showMinCidrOnRequests: false,
            arcadeSpawnInterval: 5000,
            arcadeMaxQueue: 4,
            puzzleTimeLimit: 180000, // 3 minutes per puzzle
            scoreMultiplier: 2,
            speedQuestions: 25,
            dailyTimeLimit: 120, // 2 minutes
            questionCategories: ['hosts_to_cidr', 'cidr_to_hosts', 'subnet_mask', 'network_class', 'binary_bits', 'network_address', 'broadcast']
        },
        master: {
            name: 'MASTER',
            description: 'All question types, tight time limits',
            showCidrHints: false,
            showMinCidrOnRequests: false,
            arcadeSpawnInterval: 4000,
            arcadeMaxQueue: 3,
            puzzleTimeLimit: 120000, // 2 minutes per puzzle
            scoreMultiplier: 3,
            speedQuestions: 30,
            dailyTimeLimit: 90, // 1.5 minutes
            questionCategories: 'all'
        },
        nightmare: {
            name: 'NIGHTMARE',
            description: 'Maximum challenge, no mercy',
            showCidrHints: false,
            showMinCidrOnRequests: false,
            arcadeSpawnInterval: 3000,
            arcadeMaxQueue: 2,
            puzzleTimeLimit: 90000, // 1.5 minutes per puzzle
            scoreMultiplier: 5,
            speedQuestions: 40,
            dailyTimeLimit: 60, // 1 minute
            questionCategories: 'all',
            harderQuestions: true
        }
    },

    /**
     * Get current difficulty config
     */
    getConfig() {
        return this.difficulties[this.difficulty];
    },

    /**
     * Set difficulty
     */
    setDifficulty(level) {
        if (this.difficulties[level]) {
            this.difficulty = level;
            this.save();
            return true;
        }
        return false;
    },

    /**
     * Toggle hints override
     */
    toggleHints() {
        this.showHints = !this.showHints;
        this.save();
    },

    /**
     * Check if hints should be shown
     */
    shouldShowHints() {
        const config = this.getConfig();
        return this.showHints && config.showCidrHints;
    },

    /**
     * Save settings to localStorage
     */
    save() {
        localStorage.setItem('networkTetrisSettings', JSON.stringify({
            difficulty: this.difficulty,
            showHints: this.showHints
        }));
    },

    /**
     * Load settings from localStorage
     */
    load() {
        try {
            const data = JSON.parse(localStorage.getItem('networkTetrisSettings'));
            if (data) {
                this.difficulty = data.difficulty || 'beginner';
                this.showHints = data.showHints !== false;
            }
        } catch (e) {
            // Using default settings
        }
    }
};

/**
 * Achievements System
 */
const Achievements = {
    // Achievement definitions
    definitions: {
        first_subnet: {
            id: 'first_subnet',
            name: 'FIRST ALLOCATION',
            description: 'Complete your first subnet allocation',
            icon: '1',
            hidden: false
        },
        perfect_10: {
            id: 'perfect_10',
            name: 'PERFECT 10',
            description: 'Get 10 perfect efficiency allocations',
            icon: '10',
            hidden: false,
            progress: { current: 0, target: 10 }
        },
        combo_master: {
            id: 'combo_master',
            name: 'COMBO MASTER',
            description: 'Reach a 10x combo',
            icon: 'x10',
            hidden: false
        },
        puzzle_solver: {
            id: 'puzzle_solver',
            name: 'PUZZLE SOLVER',
            description: 'Complete all puzzle levels',
            icon: 'P',
            hidden: false,
            progress: { current: 0, target: 10 }
        },
        three_stars: {
            id: 'three_stars',
            name: 'PERFECTIONIST',
            description: 'Get 3 stars on any puzzle level',
            icon: '3S',
            hidden: false
        },
        all_stars: {
            id: 'all_stars',
            name: 'STAR COLLECTOR',
            description: 'Get 3 stars on all puzzle levels',
            icon: '30S',
            hidden: false
        },
        arcade_50: {
            id: 'arcade_50',
            name: 'SUBNET CHAMPION',
            description: 'Complete 50 requests in arcade mode',
            icon: '50',
            hidden: false,
            progress: { current: 0, target: 50 }
        },
        arcade_level_5: {
            id: 'arcade_level_5',
            name: 'LEVEL 5',
            description: 'Reach level 5 in arcade mode',
            icon: 'L5',
            hidden: false
        },
        high_score_10k: {
            id: 'high_score_10k',
            name: 'HIGH ROLLER',
            description: 'Score 10,000 points',
            icon: '10K',
            hidden: false
        },
        efficiency_expert: {
            id: 'efficiency_expert',
            name: 'EFFICIENCY EXPERT',
            description: 'Complete 25 allocations with 90%+ efficiency',
            icon: '90%',
            hidden: false,
            progress: { current: 0, target: 25 }
        },
        intermediate_unlocked: {
            id: 'intermediate_unlocked',
            name: 'INTERMEDIATE',
            description: 'Unlock intermediate difficulty',
            icon: 'II',
            hidden: true
        },
        expert_unlocked: {
            id: 'expert_unlocked',
            name: 'EXPERT MODE',
            description: 'Unlock expert difficulty',
            icon: 'III',
            hidden: true
        },
        master_unlocked: {
            id: 'master_unlocked',
            name: 'MASTER MODE',
            description: 'Unlock master difficulty',
            icon: 'IV',
            hidden: true
        },
        nightmare_unlocked: {
            id: 'nightmare_unlocked',
            name: 'NIGHTMARE MODE',
            description: 'Unlock nightmare difficulty',
            icon: 'V',
            hidden: true
        },
        daily_first: {
            id: 'daily_first',
            name: 'DAILY CHALLENGER',
            description: 'Complete your first daily challenge',
            icon: 'D1',
            hidden: false
        },
        daily_perfect: {
            id: 'daily_perfect',
            name: 'FLAWLESS DAY',
            description: 'Get a perfect score on a daily challenge',
            icon: 'DP',
            hidden: false
        },
        daily_streak_7: {
            id: 'daily_streak_7',
            name: 'WEEKLY WARRIOR',
            description: 'Complete 7 daily challenges in a row',
            icon: '7D',
            hidden: false
        },
        daily_streak_30: {
            id: 'daily_streak_30',
            name: 'MONTHLY MASTER',
            description: 'Complete 30 daily challenges in a row',
            icon: '30D',
            hidden: false
        },
        packet_journey_first: {
            id: 'packet_journey_first',
            name: 'PACKET PIONEER',
            description: 'Complete your first Packet Journey scenario',
            icon: 'PJ',
            hidden: false
        },
        packet_journey_all: {
            id: 'packet_journey_all',
            name: 'NETWORK NAVIGATOR',
            description: 'Complete all Packet Journey scenarios',
            icon: 'PJ+',
            hidden: false
        },
        packet_journey_perfect: {
            id: 'packet_journey_perfect',
            name: 'PERFECT PACKET',
            description: 'Get 100% in a Packet Journey scenario',
            icon: 'PP',
            hidden: false
        },
        osi_first: {
            id: 'osi_first',
            name: 'LAYER LEARNER',
            description: 'Complete your first OSI training session',
            icon: 'OSI',
            hidden: false
        },
        osi_master: {
            id: 'osi_master',
            name: 'OSI MASTER',
            description: 'Score over 1000 in OSI training',
            icon: 'OSI+',
            hidden: false
        },
        port_expert: {
            id: 'port_expert',
            name: 'PORT EXPERT',
            description: 'Answer 20 port questions correctly',
            icon: 'PORT',
            hidden: false,
            progress: { current: 0, target: 20 }
        },
        binary_wizard: {
            id: 'binary_wizard',
            name: 'BINARY WIZARD',
            description: 'Answer 15 binary questions correctly',
            icon: '01',
            hidden: false,
            progress: { current: 0, target: 15 }
        }
    },

    // Unlocked achievements
    unlocked: {},

    // Progress tracking
    progress: {},

    // Callbacks
    onUnlock: null,

    /**
     * Initialize achievements
     */
    init() {
        this.load();
    },

    /**
     * Check and unlock an achievement
     */
    unlock(id) {
        if (this.unlocked[id]) return false;
        if (!this.definitions[id]) return false;

        this.unlocked[id] = {
            unlockedAt: Date.now()
        };
        this.save();

        if (this.onUnlock) {
            this.onUnlock(this.definitions[id]);
        }

        return true;
    },

    /**
     * Update progress for progressive achievements
     */
    updateProgress(id, increment = 1) {
        const def = this.definitions[id];
        if (!def || !def.progress) return;
        if (this.unlocked[id]) return;

        if (!this.progress[id]) {
            this.progress[id] = 0;
        }

        this.progress[id] += increment;

        if (this.progress[id] >= def.progress.target) {
            this.unlock(id);
        }

        this.save();
    },

    /**
     * Get progress for an achievement
     */
    getProgress(id) {
        const def = this.definitions[id];
        if (!def || !def.progress) return null;

        return {
            current: this.progress[id] || 0,
            target: def.progress.target
        };
    },

    /**
     * Check if achievement is unlocked
     */
    isUnlocked(id) {
        return !!this.unlocked[id];
    },

    /**
     * Get all achievements with status
     */
    getAll() {
        return Object.values(this.definitions).map(def => ({
            ...def,
            unlocked: this.isUnlocked(def.id),
            progress: this.getProgress(def.id)
        }));
    },

    /**
     * Get unlocked count
     */
    getUnlockedCount() {
        return Object.keys(this.unlocked).length;
    },

    /**
     * Get total count (non-hidden)
     */
    getTotalCount() {
        return Object.values(this.definitions).filter(d => !d.hidden).length;
    },

    /**
     * Save to localStorage
     */
    save() {
        localStorage.setItem('networkTetrisAchievements', JSON.stringify({
            unlocked: this.unlocked,
            progress: this.progress
        }));
    },

    /**
     * Load from localStorage
     */
    load() {
        try {
            const data = JSON.parse(localStorage.getItem('networkTetrisAchievements'));
            if (data) {
                this.unlocked = data.unlocked || {};
                this.progress = data.progress || {};
            }
        } catch (e) {
            // No achievements found, using defaults
        }
    },

    /**
     * Check for difficulty unlocks based on progress
     */
    checkDifficultyUnlocks() {
        const unlocked = [];

        // Unlock intermediate after completing 3 puzzle levels
        const puzzleProgress = this.progress['puzzle_solver'] || 0;
        if (puzzleProgress >= 3 && !this.isUnlocked('intermediate_unlocked')) {
            this.unlock('intermediate_unlocked');
            unlocked.push('intermediate');
        }

        // Unlock expert after all stars or high arcade level
        const arcadeLevel = this.progress['arcade_level_5'] || 0;
        if ((puzzleProgress >= 10 || arcadeLevel >= 5) && !this.isUnlocked('expert_unlocked')) {
            this.unlock('expert_unlocked');
            unlocked.push('expert');
        }

        // Unlock master after scoring 15000+ in Speed Subnet
        // This is checked externally when high score is achieved

        // Unlock nightmare after completing 10 daily challenges
        // This is checked externally in daily challenge completion

        return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
    },

    /**
     * Check and unlock master difficulty
     */
    checkMasterUnlock(highScore) {
        if (highScore >= 15000 && !this.isUnlocked('master_unlocked')) {
            this.unlock('master_unlocked');
            return true;
        }
        return false;
    },

    /**
     * Check and unlock nightmare difficulty
     */
    checkNightmareUnlock(dailyChallengesCompleted) {
        if (dailyChallengesCompleted >= 10 && !this.isUnlocked('nightmare_unlocked')) {
            this.unlock('nightmare_unlocked');
            return true;
        }
        return false;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Settings, Achievements };
}
