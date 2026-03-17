/**
 * Requirements Module
 * Handles falling network requirements in arcade mode
 */
'use strict';

class Requirement {
    constructor(id, hostCount, options = {}) {
        this.id = id;
        this.hostCount = hostCount;
        this.minCidr = SubnetCalculator.hostCountToCidr(hostCount);
        this.fulfilled = false;
        this.failed = false;

        // Position and animation (for arcade mode)
        this.y = options.startY || 0;
        this.targetY = options.targetY || 100;
        this.fallSpeed = options.fallSpeed || 0.5;

        // Timing
        this.createdAt = Date.now();
        this.deadline = options.deadline || null; // null = no deadline (puzzle mode)
        this.timeRemaining = this.deadline;

        // Visual
        this.width = 180;
        this.height = 60;
        this.x = options.x || 10;

        // Animation state
        this.pulsePhase = 0;
        this.shakeAmount = 0;
    }

    /**
     * Update requirement state
     * @param {number} deltaTime - Time since last update in ms
     * @returns {string} State: 'active', 'falling', 'urgent', 'expired'
     */
    update(deltaTime) {
        if (this.fulfilled) return 'fulfilled';
        if (this.failed) return 'failed';

        // Update animation
        this.pulsePhase += deltaTime * 0.005;

        // Update deadline timer if applicable
        if (this.deadline !== null) {
            this.timeRemaining -= deltaTime;
            if (this.timeRemaining <= 0) {
                this.failed = true;
                return 'expired';
            }

            // Urgency increases as deadline approaches
            const urgencyThreshold = this.deadline * 0.3;
            if (this.timeRemaining < urgencyThreshold) {
                this.shakeAmount = (1 - this.timeRemaining / urgencyThreshold) * 3;
                return 'urgent';
            }
        }

        // Fall animation
        if (this.y < this.targetY) {
            this.y += this.fallSpeed * deltaTime * 0.05;
            if (this.y >= this.targetY) {
                this.y = this.targetY;
            }
            return 'falling';
        }

        return 'active';
    }

    /**
     * Check if a CIDR allocation satisfies this requirement
     */
    isSatisfiedBy(cidr) {
        const availableHosts = SubnetCalculator.cidrToHostCount(cidr);
        return availableHosts >= this.hostCount;
    }

    /**
     * Mark as fulfilled
     */
    fulfill(cidr) {
        this.fulfilled = true;
        this.fulfilledWith = cidr;
        this.efficiency = SubnetCalculator.calculateEfficiency(this.hostCount, cidr);
    }

    /**
     * Get urgency level (0-1)
     */
    getUrgency() {
        if (this.deadline === null) return 0;
        if (this.timeRemaining <= 0) return 1;
        return 1 - (this.timeRemaining / this.deadline);
    }

    /**
     * Render the requirement card
     */
    render(ctx) {
        const shake = this.shakeAmount > 0
            ? Math.sin(Date.now() * 0.02) * this.shakeAmount
            : 0;

        const x = this.x + shake;
        const y = this.y;

        // Determine colors based on state
        let bgColor, borderColor, textColor;

        if (this.fulfilled) {
            bgColor = '#0a2a0a';
            borderColor = '#00ff00';
            textColor = '#00ff00';
        } else if (this.failed) {
            bgColor = '#2a0a0a';
            borderColor = '#ff0000';
            textColor = '#ff0000';
        } else {
            const urgency = this.getUrgency();
            if (urgency > 0.7) {
                // Urgent - pulsing red
                const pulse = 0.5 + 0.5 * Math.sin(this.pulsePhase * 4);
                bgColor = `rgba(42, 10, 10, ${0.8 + pulse * 0.2})`;
                borderColor = '#ff4444';
                textColor = '#ff6666';
            } else {
                bgColor = '#1a1a2e';
                borderColor = '#00d4ff';
                textColor = '#ffffff';
            }
        }

        // Card background
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, this.width, this.height);

        // Card border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, this.width, this.height);

        // Pixel corner decorations
        ctx.fillStyle = borderColor;
        ctx.fillRect(x, y, 8, 2);
        ctx.fillRect(x, y, 2, 8);
        ctx.fillRect(x + this.width - 8, y, 8, 2);
        ctx.fillRect(x + this.width - 2, y, 2, 8);
        ctx.fillRect(x, y + this.height - 2, 8, 2);
        ctx.fillRect(x, y + this.height - 8, 2, 8);
        ctx.fillRect(x + this.width - 8, y + this.height - 2, 8, 2);
        ctx.fillRect(x + this.width - 2, y + this.height - 8, 2, 8);

        // Host count text
        ctx.font = '14px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textColor;
        ctx.fillText(`${this.hostCount} HOSTS`, x + this.width / 2, y + 20);

        // Minimum CIDR hint (only if enabled)
        if (this.showMinCidr !== false) {
            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#888888';
            ctx.fillText(`MIN: /${this.minCidr}`, x + this.width / 2, y + 38);
        }

        // Timer bar (if deadline set)
        if (this.deadline !== null && !this.fulfilled && !this.failed) {
            const barWidth = this.width - 20;
            const progress = Math.max(0, this.timeRemaining / this.deadline);

            // Background
            ctx.fillStyle = '#333333';
            ctx.fillRect(x + 10, y + this.height - 12, barWidth, 6);

            // Progress
            const progressColor = progress > 0.3 ? '#00ff00' : '#ff4444';
            ctx.fillStyle = progressColor;
            ctx.fillRect(x + 10, y + this.height - 12, barWidth * progress, 6);
        }

        // Fulfilled checkmark
        if (this.fulfilled) {
            ctx.font = '20px "Press Start 2P"';
            ctx.fillStyle = '#00ff00';
            ctx.fillText('OK', x + this.width - 25, y + 20);
        }
    }
}

/**
 * Requirements Manager
 * Handles spawning and managing multiple requirements
 */
class RequirementsManager {
    constructor(container) {
        this.container = container;
        this.requirements = [];
        this.nextId = 1;

        // Spawn settings
        this.spawnInterval = 5000; // ms between spawns
        this.lastSpawnTime = 0;
        this.baseDeadline = 15000; // 15 seconds base deadline
        this.difficultyMultiplier = 1;

        // Hint settings
        this.showMinCidr = true; // Can be disabled for harder difficulty

        // Possible host counts for random generation
        this.hostCountOptions = [
            6, 10, 14,      // /29
            20, 25, 30,     // /27
            40, 50, 60,     // /26
            80, 100, 120,   // /25
            150, 200, 250,  // /24
        ];

        // Create canvas for rendering
        this.setupCanvas();
    }

    setupCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 200;
        this.canvas.height = 400;
        this.canvas.style.width = '200px';
        this.canvas.style.height = '400px';
        this.ctx = this.canvas.getContext('2d');

        if (this.container) {
            this.container.appendChild(this.canvas);
        }
    }

    /**
     * Add a requirement manually (for puzzle mode)
     */
    addRequirement(hostCount, options = {}) {
        const req = new Requirement(this.nextId++, hostCount, {
            startY: this.requirements.length * 70 + 10,
            targetY: this.requirements.length * 70 + 10,
            deadline: options.deadline || null,
            ...options
        });
        req.showMinCidr = this.showMinCidr;
        this.requirements.push(req);
        return req;
    }

    /**
     * Spawn a random requirement (for arcade mode)
     * @param {boolean} timed - Whether to use deadline timers (default: false for relaxed mode)
     */
    spawnRandom(timed = false) {
        const hostCount = this.hostCountOptions[
            Math.floor(Math.random() * this.hostCountOptions.length)
        ];

        const yPosition = this.getNextYPosition();

        const req = new Requirement(this.nextId++, hostCount, {
            startY: -70,
            targetY: yPosition,
            fallSpeed: 0.5,
            deadline: timed ? this.baseDeadline / this.difficultyMultiplier : null
        });
        req.showMinCidr = this.showMinCidr;

        this.requirements.push(req);
        return req;
    }

    /**
     * Get count of pending (unfulfilled, not failed) requirements
     */
    getPendingCount() {
        return this.requirements.filter(r => !r.fulfilled && !r.failed).length;
    }

    /**
     * Get the next available Y position for a requirement
     */
    getNextYPosition() {
        // Find gaps or use next slot
        const activeReqs = this.requirements.filter(r => !r.fulfilled && !r.failed);
        return activeReqs.length * 70 + 10;
    }

    /**
     * Update all requirements
     */
    update(deltaTime, currentTime) {
        let expired = false;

        // Update existing requirements
        for (const req of this.requirements) {
            const state = req.update(deltaTime);
            if (state === 'expired') {
                expired = true;
            }
        }

        // Reposition active requirements
        this.repositionRequirements();

        return { expired };
    }

    /**
     * Reposition requirements to fill gaps
     */
    repositionRequirements() {
        const activeReqs = this.requirements.filter(r => !r.fulfilled && !r.failed);
        activeReqs.forEach((req, index) => {
            req.targetY = index * 70 + 10;
        });
    }

    /**
     * Find a requirement that can be satisfied by a CIDR
     */
    findMatchingRequirement(cidr) {
        const availableHosts = SubnetCalculator.cidrToHostCount(cidr);

        // Find the best match (largest requirement that fits)
        return this.requirements
            .filter(r => !r.fulfilled && !r.failed && r.isSatisfiedBy(cidr))
            .sort((a, b) => b.hostCount - a.hostCount)[0] || null;
    }

    /**
     * Get the first unfulfilled requirement
     */
    getActiveRequirement() {
        return this.requirements.find(r => !r.fulfilled && !r.failed) || null;
    }

    /**
     * Fulfill a requirement
     */
    fulfillRequirement(id, cidr) {
        const req = this.requirements.find(r => r.id === id);
        if (req) {
            req.fulfill(cidr);
            return req;
        }
        return null;
    }

    /**
     * Check if all requirements are fulfilled
     */
    allFulfilled() {
        return this.requirements.every(r => r.fulfilled);
    }

    /**
     * Check if any requirement has failed/expired
     */
    anyFailed() {
        return this.requirements.some(r => r.failed);
    }

    /**
     * Get statistics
     */
    getStats() {
        const total = this.requirements.length;
        const fulfilled = this.requirements.filter(r => r.fulfilled).length;
        const failed = this.requirements.filter(r => r.failed).length;
        const pending = total - fulfilled - failed;

        let totalEfficiency = 0;
        const fulfilledReqs = this.requirements.filter(r => r.fulfilled);
        if (fulfilledReqs.length > 0) {
            totalEfficiency = fulfilledReqs.reduce((sum, r) => sum + r.efficiency, 0) / fulfilledReqs.length;
        }

        return {
            total,
            fulfilled,
            failed,
            pending,
            averageEfficiency: Math.round(totalEfficiency)
        };
    }

    /**
     * Clear all requirements
     */
    clear() {
        this.requirements = [];
        this.nextId = 1;
    }

    /**
     * Set difficulty
     */
    setDifficulty(multiplier) {
        this.difficultyMultiplier = multiplier;
    }

    /**
     * Render active requirements only
     */
    render() {
        const ctx = this.ctx;

        // Clear
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Only render active (unfulfilled, not failed) requirements
        const activeReqs = this.requirements.filter(r => !r.fulfilled && !r.failed);
        for (const req of activeReqs) {
            req.render(ctx);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Requirement, RequirementsManager };
}
