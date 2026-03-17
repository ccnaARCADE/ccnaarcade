/**
 * Levels Module
 * Defines puzzle mode levels with progressive difficulty
 */
'use strict';

const Levels = {
    /**
     * Level definitions
     * Each level has:
     * - name: Display name
     * - network: Base network in CIDR notation
     * - requirements: Array of host counts needed
     * - description: Brief description
     * - thresholds: Star rating thresholds (efficiency %)
     */
    levels: [
        // Tutorial / Easy levels
        {
            id: 1,
            name: "FIRST STEPS",
            network: "192.168.0.0/24",
            requirements: [50, 20],
            description: "A simple office with two departments",
            thresholds: { three: 85, two: 70 },
            hint: "Use /26 for 50 hosts, /27 for 20 hosts"
        },
        {
            id: 2,
            name: "SMALL OFFICE",
            network: "192.168.0.0/24",
            requirements: [100, 50, 25],
            description: "Growing company needs three subnets",
            thresholds: { three: 80, two: 65 }
        },
        {
            id: 3,
            name: "TIGHT FIT",
            network: "10.0.0.0/24",
            requirements: [60, 60, 60, 60],
            description: "Four equal departments - can you fit them all?",
            thresholds: { three: 95, two: 80 },
            hint: "Each department needs exactly /26"
        },

        // Medium difficulty
        {
            id: 4,
            name: "BRANCH OFFICE",
            network: "172.16.0.0/22",
            requirements: [200, 100, 50, 25, 10],
            description: "HQ and four branch offices of varying sizes",
            thresholds: { three: 75, two: 60 }
        },
        {
            id: 5,
            name: "DATA CENTER",
            network: "10.10.0.0/20",
            requirements: [500, 250, 125, 60, 30, 14],
            description: "Allocate subnets for different server tiers",
            thresholds: { three: 70, two: 55 }
        },
        {
            id: 6,
            name: "EFFICIENCY TEST",
            network: "192.168.0.0/23",
            requirements: [126, 62, 30, 30, 14, 14, 6, 6],
            description: "Match subnet sizes perfectly",
            thresholds: { three: 98, two: 85 },
            hint: "These requirements match CIDR boundaries exactly"
        },

        // Hard levels
        {
            id: 7,
            name: "CAMPUS NETWORK",
            network: "10.0.0.0/16",
            requirements: [2000, 1000, 500, 250, 100, 50, 50, 25, 25, 10],
            description: "Large campus with many buildings",
            thresholds: { three: 65, two: 50 }
        },
        {
            id: 8,
            name: "TETRIS MASTER",
            network: "172.16.0.0/20",
            requirements: [1000, 500, 254, 126, 62, 30, 14, 6, 6, 6],
            description: "Fit everything perfectly like Tetris blocks",
            thresholds: { three: 90, two: 75 }
        },
        {
            id: 9,
            name: "THE PUZZLE",
            network: "10.100.0.0/18",
            requirements: [4000, 2000, 1000, 500, 250, 125, 60, 30, 14, 6, 6, 2],
            description: "The ultimate subnetting challenge",
            thresholds: { three: 85, two: 70 }
        },
        {
            id: 10,
            name: "IMPOSSIBLE?",
            network: "192.168.0.0/20",
            requirements: [1000, 500, 500, 250, 250, 100, 100, 50, 50, 25, 25, 10, 10, 6, 6],
            description: "For subnet masters only",
            thresholds: { three: 80, two: 65 }
        }
    ],

    /**
     * Get a level by ID
     */
    getLevel(id) {
        return this.levels.find(l => l.id === id) || null;
    },

    /**
     * Get all levels
     */
    getAllLevels() {
        return this.levels;
    },

    /**
     * Calculate star rating for a level
     * @param {number} levelId - Level ID
     * @param {number} efficiency - Achieved efficiency percentage
     * @returns {number} Stars (1-3)
     */
    calculateStars(levelId, efficiency) {
        const level = this.getLevel(levelId);
        if (!level) return 0;

        if (efficiency >= level.thresholds.three) return 3;
        if (efficiency >= level.thresholds.two) return 2;
        return 1;
    },

    /**
     * Calculate efficiency for a level completion
     * @param {number} levelId - Level ID
     * @param {Array} allocations - Array of {cidr, hostCount}
     */
    calculateLevelEfficiency(levelId, allocations) {
        const level = this.getLevel(levelId);
        if (!level) return 0;

        let totalNeeded = 0;
        let totalUsed = 0;

        for (const alloc of allocations) {
            totalNeeded += alloc.hostCount;
            totalUsed += SubnetCalculator.cidrToHostCount(alloc.cidr);
        }

        // Also factor in unused address space
        const networkSize = SubnetCalculator.cidrToTotalAddresses(
            SubnetCalculator.parseCidr(level.network).prefix
        );
        const allocatedSize = allocations.reduce(
            (sum, a) => sum + SubnetCalculator.cidrToTotalAddresses(a.cidr),
            0
        );

        // Efficiency is based on how well hosts fill the allocated space
        const hostEfficiency = totalUsed > 0 ? (totalNeeded / totalUsed) * 100 : 0;

        return Math.round(hostEfficiency);
    },

    /**
     * Check if level requirements can theoretically be met
     */
    isLevelSolvable(levelId) {
        const level = this.getLevel(levelId);
        if (!level) return false;

        const networkSize = SubnetCalculator.cidrToTotalAddresses(
            SubnetCalculator.parseCidr(level.network).prefix
        );

        // Calculate minimum addresses needed
        let minAddressesNeeded = 0;
        for (const hostCount of level.requirements) {
            const minCidr = SubnetCalculator.hostCountToCidr(hostCount);
            minAddressesNeeded += SubnetCalculator.cidrToTotalAddresses(minCidr);
        }

        return minAddressesNeeded <= networkSize;
    },

    /**
     * Get next unlocked level
     * @param {Object} progress - Player progress {levelId: stars}
     */
    getNextLevel(progress) {
        for (const level of this.levels) {
            if (!progress[level.id] || progress[level.id] === 0) {
                return level;
            }
        }
        return null; // All completed
    },

    /**
     * Get total stars earned
     */
    getTotalStars(progress) {
        return Object.values(progress).reduce((sum, stars) => sum + (stars || 0), 0);
    },

    /**
     * Get maximum possible stars
     */
    getMaxStars() {
        return this.levels.length * 3;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Levels;
}
