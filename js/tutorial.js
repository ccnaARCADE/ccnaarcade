/**
 * Tutorial Module
 * Interactive onboarding for new players
 */
'use strict';

const Tutorial = {
    // Tutorial state
    active: false,
    currentStep: 0,
    mode: null, // 'speed' or 'scenario'

    // Check if user has completed tutorial
    completed: {
        speed: false,
        scenario: false
    },

    // Tutorial steps for Speed Subnet
    speedSteps: [
        {
            id: 'welcome',
            title: 'WELCOME TO SPEED SUBNET!',
            content: 'This mode trains your CIDR calculation skills with quick-fire questions.',
            highlight: null,
            position: 'center'
        },
        {
            id: 'question',
            title: 'THE QUESTION',
            content: 'Each question shows a value and asks you to find the answer. This could be hosts needed, CIDR notation, subnet masks, or network addresses.',
            highlight: '#speed-host-count',
            position: 'bottom'
        },
        {
            id: 'options',
            title: 'ANSWER OPTIONS',
            content: 'Click one of the four options to answer. Use keyboard keys 1-4 for faster responses!',
            highlight: '#speed-cidr-options',
            position: 'top'
        },
        {
            id: 'streak',
            title: 'BUILD STREAKS',
            content: 'Consecutive correct answers build your streak multiplier. Higher streaks mean more points!',
            highlight: '#speed-streak',
            position: 'bottom'
        },
        {
            id: 'mascot',
            title: 'MEET BIT!',
            content: 'Bit the mascot rides along the network cable. Watch Bit celebrate on correct answers and change color as your streak grows!',
            highlight: '#mascot-area',
            position: 'bottom'
        },
        {
            id: 'ready',
            title: 'READY TO START!',
            content: 'Answer 20 questions to complete a round. Good luck!',
            highlight: null,
            position: 'center'
        }
    ],

    // Tutorial steps for Client Scenarios
    scenarioSteps: [
        {
            id: 'welcome',
            title: 'CLIENT SCENARIOS',
            content: 'Help real clients set up their network by allocating subnets efficiently.',
            highlight: null,
            position: 'center'
        },
        {
            id: 'requirements',
            title: 'SUBNET REQUIREMENTS',
            content: 'Each client needs multiple subnets. Click a requirement to select it for placement.',
            highlight: '#requirements-area',
            position: 'left'
        },
        {
            id: 'cidr',
            title: 'SELECT CIDR SIZE',
            content: 'Choose the CIDR that fits the host requirement. Smaller CIDR numbers = more hosts. Use keys 1-7 for quick selection.',
            highlight: '#cidr-panel',
            position: 'left'
        },
        {
            id: 'grid',
            title: 'ADDRESS GRID',
            content: 'Click on the grid to place your subnet. Each cell represents part of the address space.',
            highlight: '#grid-wrapper',
            position: 'right'
        },
        {
            id: 'building',
            title: 'CLIENT BUILDING',
            content: 'Watch the building light up as you allocate subnets to each floor or department.',
            highlight: '#building-panel',
            position: 'right'
        },
        {
            id: 'efficiency',
            title: 'EFFICIENCY MATTERS',
            content: 'Get 3 stars by allocating efficiently - don\'t waste address space! The closer to the exact hosts needed, the better.',
            highlight: '#efficiency-display',
            position: 'bottom'
        },
        {
            id: 'undo',
            title: 'UNDO MISTAKES',
            content: 'Made a mistake? Press Z or click UNDO to remove the last placement.',
            highlight: '#btn-undo',
            position: 'top'
        },
        {
            id: 'ready',
            title: 'READY TO CONFIGURE!',
            content: 'Complete all subnet requirements to finish the scenario. Good luck!',
            highlight: null,
            position: 'center'
        }
    ],

    // UI elements
    overlay: null,
    tooltip: null,

    /**
     * Initialize tutorial system
     */
    init() {
        this.load();
        this.createOverlay();
    },

    /**
     * Create tutorial overlay elements
     */
    createOverlay() {
        // Create overlay container
        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorial-overlay';
        this.overlay.className = 'tutorial-overlay hidden';
        this.overlay.innerHTML = `
            <div class="tutorial-backdrop"></div>
            <div id="tutorial-tooltip" class="tutorial-tooltip">
                <div class="tutorial-header">
                    <span id="tutorial-step-count" class="tutorial-step-count"></span>
                    <button id="tutorial-skip" class="tutorial-skip">SKIP</button>
                </div>
                <h3 id="tutorial-title" class="tutorial-title"></h3>
                <p id="tutorial-content" class="tutorial-content"></p>
                <div class="tutorial-buttons">
                    <button id="tutorial-prev" class="tutorial-btn">BACK</button>
                    <button id="tutorial-next" class="tutorial-btn primary">NEXT</button>
                </div>
            </div>
            <div id="tutorial-highlight" class="tutorial-highlight"></div>
        `;

        document.body.appendChild(this.overlay);

        // Get references
        this.tooltip = document.getElementById('tutorial-tooltip');
        this.highlight = document.getElementById('tutorial-highlight');

        // Event listeners
        document.getElementById('tutorial-next').addEventListener('click', () => this.nextStep());
        document.getElementById('tutorial-prev').addEventListener('click', () => this.prevStep());
        document.getElementById('tutorial-skip').addEventListener('click', () => this.skip());
    },

    /**
     * Check if tutorial should be shown for a mode
     */
    shouldShow(mode) {
        return !this.completed[mode];
    },

    /**
     * Start tutorial for a mode
     */
    start(mode) {
        if (!this.shouldShow(mode)) {
            return false;
        }

        this.mode = mode;
        this.currentStep = 0;
        this.active = true;

        const steps = mode === 'speed' ? this.speedSteps : this.scenarioSteps;

        this.overlay.classList.remove('hidden');
        this.showStep(0);

        return true;
    },

    /**
     * Show a specific step
     */
    showStep(index) {
        const steps = this.mode === 'speed' ? this.speedSteps : this.scenarioSteps;

        if (index < 0 || index >= steps.length) return;

        this.currentStep = index;
        const step = steps[index];

        // Update content
        document.getElementById('tutorial-title').textContent = step.title;
        document.getElementById('tutorial-content').textContent = step.content;
        document.getElementById('tutorial-step-count').textContent = `${index + 1}/${steps.length}`;

        // Update buttons
        const prevBtn = document.getElementById('tutorial-prev');
        const nextBtn = document.getElementById('tutorial-next');

        prevBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
        nextBtn.textContent = index === steps.length - 1 ? 'START!' : 'NEXT';

        // Position tooltip and highlight
        this.positionTooltip(step);
    },

    /**
     * Position tooltip relative to highlighted element
     */
    positionTooltip(step) {
        const tooltip = this.tooltip;
        const highlight = this.highlight;

        // Reset
        tooltip.style.removeProperty('top');
        tooltip.style.removeProperty('bottom');
        tooltip.style.removeProperty('left');
        tooltip.style.removeProperty('right');
        tooltip.style.removeProperty('transform');
        highlight.style.display = 'none';

        if (!step.highlight) {
            // Center in screen
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            return;
        }

        const target = document.querySelector(step.highlight);
        if (!target) {
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            return;
        }

        const rect = target.getBoundingClientRect();
        const padding = 10;

        // Show highlight around target
        highlight.style.display = 'block';
        highlight.style.top = (rect.top - padding) + 'px';
        highlight.style.left = (rect.left - padding) + 'px';
        highlight.style.width = (rect.width + padding * 2) + 'px';
        highlight.style.height = (rect.height + padding * 2) + 'px';

        // Position tooltip based on position hint
        const tooltipWidth = 320;
        const tooltipHeight = 200;
        const margin = 20;

        switch (step.position) {
            case 'top':
                tooltip.style.bottom = (window.innerHeight - rect.top + margin) + 'px';
                tooltip.style.left = Math.max(margin, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - margin)) + 'px';
                break;
            case 'bottom':
                tooltip.style.top = (rect.bottom + margin) + 'px';
                tooltip.style.left = Math.max(margin, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - margin)) + 'px';
                break;
            case 'left':
                tooltip.style.top = Math.max(margin, rect.top + rect.height / 2 - tooltipHeight / 2) + 'px';
                tooltip.style.right = (window.innerWidth - rect.left + margin) + 'px';
                break;
            case 'right':
                tooltip.style.top = Math.max(margin, rect.top + rect.height / 2 - tooltipHeight / 2) + 'px';
                tooltip.style.left = (rect.right + margin) + 'px';
                break;
            default:
                tooltip.style.top = '50%';
                tooltip.style.left = '50%';
                tooltip.style.transform = 'translate(-50%, -50%)';
        }
    },

    /**
     * Go to next step
     */
    nextStep() {
        const steps = this.mode === 'speed' ? this.speedSteps : this.scenarioSteps;

        if (this.currentStep < steps.length - 1) {
            this.showStep(this.currentStep + 1);
            if (typeof Sounds !== 'undefined') {
                Sounds.play('click');
            }
        } else {
            this.complete();
        }
    },

    /**
     * Go to previous step
     */
    prevStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
            if (typeof Sounds !== 'undefined') {
                Sounds.play('click');
            }
        }
    },

    /**
     * Skip tutorial
     */
    skip() {
        this.complete();
    },

    /**
     * Complete tutorial
     */
    complete() {
        this.active = false;
        this.completed[this.mode] = true;
        this.save();

        this.overlay.classList.add('hidden');
        this.highlight.style.display = 'none';

        if (typeof Sounds !== 'undefined') {
            Sounds.play('select');
        }

        // Trigger callback if set
        if (this.onComplete) {
            this.onComplete(this.mode);
        }
    },

    /**
     * Reset tutorial progress
     */
    reset() {
        this.completed = {
            speed: false,
            scenario: false
        };
        this.save();
    },

    /**
     * Save to localStorage
     */
    save() {
        localStorage.setItem('subnetProTutorial', JSON.stringify({
            completed: this.completed
        }));
    },

    /**
     * Load from localStorage
     */
    load() {
        try {
            const data = JSON.parse(localStorage.getItem('subnetProTutorial'));
            if (data && data.completed) {
                this.completed = data.completed;
            }
        } catch (e) {
            // No saved tutorial data
        }
    },

    // Callback when tutorial completes
    onComplete: null
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Tutorial;
}
