/**
 * Practice Mode Module
 * Focused training on weak categories
 */
'use strict';

const Practice = {
    // Selected categories for practice
    selectedCategories: [],

    // Category definitions with display names
    categories: {
        hosts_to_cidr: { name: "Hosts to CIDR", icon: "H>C" },
        cidr_to_hosts: { name: "CIDR to Hosts", icon: "C>H" },
        subnet_mask: { name: "Subnet Masks", icon: "SM" },
        network_class: { name: "Network Classes", icon: "NC" },
        binary_bits: { name: "Binary Math", icon: "BIN" },
        network_address: { name: "Network Address", icon: "NET" },
        broadcast: { name: "Broadcast Address", icon: "BC" },
        first_host: { name: "First Host", icon: "1st" },
        last_host: { name: "Last Host", icon: "Lst" }
    },

    /**
     * Initialize practice mode
     */
    init() {
        this.selectedCategories = [];
    },

    /**
     * Get category stats with recommendations
     */
    getCategoryStats() {
        const stats = [];

        for (const [id, cat] of Object.entries(this.categories)) {
            let accuracy = null;
            let total = 0;
            let recommendation = 'none';

            // Get stats if available
            if (typeof Stats !== 'undefined' && Stats.data.categories[id]) {
                const catData = Stats.data.categories[id];
                total = catData.correct + catData.wrong;
                if (total > 0) {
                    accuracy = Math.round((catData.correct / total) * 100);

                    // Determine recommendation level
                    if (accuracy < 50) {
                        recommendation = 'critical';
                    } else if (accuracy < 70) {
                        recommendation = 'needs-work';
                    } else if (accuracy < 85) {
                        recommendation = 'good';
                    } else {
                        recommendation = 'excellent';
                    }
                }
            }

            stats.push({
                id,
                name: cat.name,
                icon: cat.icon,
                accuracy,
                total,
                recommendation
            });
        }

        // Sort by recommendation priority (worst first)
        const priority = { 'critical': 0, 'needs-work': 1, 'none': 2, 'good': 3, 'excellent': 4 };
        stats.sort((a, b) => priority[a.recommendation] - priority[b.recommendation]);

        return stats;
    },

    /**
     * Toggle category selection
     */
    toggleCategory(categoryId) {
        const index = this.selectedCategories.indexOf(categoryId);
        if (index > -1) {
            this.selectedCategories.splice(index, 1);
        } else {
            this.selectedCategories.push(categoryId);
        }
        return this.selectedCategories.length > 0;
    },

    /**
     * Select all weak categories (< 70% accuracy)
     */
    selectWeakCategories() {
        const stats = this.getCategoryStats();
        this.selectedCategories = stats
            .filter(s => s.recommendation === 'critical' || s.recommendation === 'needs-work' || s.recommendation === 'none')
            .map(s => s.id);

        // If all categories are good, select all untried
        if (this.selectedCategories.length === 0) {
            this.selectedCategories = stats
                .filter(s => s.total === 0)
                .map(s => s.id);
        }

        // If still empty, select all
        if (this.selectedCategories.length === 0) {
            this.selectedCategories = Object.keys(this.categories);
        }

        return this.selectedCategories;
    },

    /**
     * Clear all selections
     */
    clearSelection() {
        this.selectedCategories = [];
    },

    /**
     * Check if category is selected
     */
    isSelected(categoryId) {
        return this.selectedCategories.includes(categoryId);
    },

    /**
     * Get selected categories
     */
    getSelectedCategories() {
        return this.selectedCategories;
    },

    /**
     * Start practice session with SpeedSubnet
     */
    startPractice() {
        if (this.selectedCategories.length === 0) {
            return false;
        }

        // Configure SpeedSubnet with only selected categories
        SpeedSubnet.enabledCategories = [...this.selectedCategories];
        SpeedSubnet.maxQuestions = 15; // Shorter sessions for practice

        return true;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Practice;
}
