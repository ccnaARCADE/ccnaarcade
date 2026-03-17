/**
 * UI Module
 * Handles all user interface elements
 * Optimized: DOM elements cached, reduced queries, efficient updates
 */
'use strict';

const UI = {
    screens: {},
    currentScreen: null,
    onScreenChange: null,
    onScenarioSelect: null,
    messageTimeout: null,
    _cidrButtonsCache: null,
    _screenValues: null,

    /**
     * Initialize UI elements
     */
    init() {
        // Cache screen elements
        this.screens = {
            launchPanel: document.getElementById('launch-panel'),
            mainMenu: document.getElementById('main-menu'),
            scenarioSelect: document.getElementById('scenario-select'),
            speedSubnetScreen: document.getElementById('speed-subnet-screen'),
            gameScreen: document.getElementById('game-screen'),
            pauseMenu: document.getElementById('pause-menu'),
            gameOver: document.getElementById('game-over'),
            helpScreen: document.getElementById('help-screen'),
            settingsScreen: document.getElementById('settings-screen'),
            achievementsScreen: document.getElementById('achievements-screen'),
            dailyChallengeScreen: document.getElementById('daily-challenge-screen'),
            statsScreen: document.getElementById('stats-screen'),
            packetJourneyScreen: document.getElementById('packet-journey-screen'),
            packetJourneySelect: document.getElementById('packet-journey-select'),
            osiTrainerScreen: document.getElementById('osi-trainer-screen')
        };

        // Pre-cache screen values array for faster iteration
        this._screenValues = Object.values(this.screens);

        // Cache all frequently accessed elements - expanded to reduce future queries
        this.elements = {
            scoreDisplay: document.getElementById('score-display'),
            efficiencyDisplay: document.getElementById('efficiency-display'),
            subnetsDisplay: document.getElementById('subnets-display'),
            networkDisplay: document.getElementById('network-display'),
            highScoreDisplay: document.getElementById('high-score-display'),
            finalScore: document.getElementById('final-score'),
            newHighScore: document.getElementById('new-high-score'),
            starsDisplay: document.getElementById('stars-display'),
            messageDisplay: document.getElementById('message-display'),
            cidrButtons: document.getElementById('cidr-buttons'),
            selectedCidr: document.getElementById('selected-cidr'),
            selectedHosts: document.getElementById('selected-hosts'),
            scenarioGrid: document.getElementById('scenario-grid'),
            requirementsContainer: document.getElementById('requirements-list'),
            clientIcon: document.getElementById('client-icon'),
            clientName: document.getElementById('client-name'),
            clientLocation: document.getElementById('client-location'),
            networkClassBadge: document.getElementById('network-class-badge'),
            gridCanvas: document.getElementById('grid-canvas'),
            difficultyDisplay: document.getElementById('difficulty-display'),
            achievementsGrid: document.getElementById('achievements-grid'),
            achievementsCount: document.getElementById('achievements-count'),
            achievementPopup: document.getElementById('achievement-popup'),
            popupIcon: document.getElementById('popup-icon'),
            popupName: document.getElementById('popup-name'),
            hintsToggle: document.getElementById('toggle-hints'),
            // Launch panel elements
            totalScoreDisplay: document.getElementById('total-score'),
            achievementsCountDisplay: document.getElementById('achievements-count'),
            streakCountDisplay: document.getElementById('streak-count'),
            subnetProgress: document.getElementById('subnet-progress'),
            packetProgress: document.getElementById('packet-progress'),
            osiProgressBar: document.getElementById('osi-progress-bar'),
            accuracyDisplay: document.getElementById('accuracy-display')
        };

        this.setupCidrButtons();
        this.showScreen('launchPanel');
    },

    /**
     * Show a specific screen - optimized with cached array
     */
    showScreen(screenName) {
        // Use cached array for faster iteration
        const screens = this._screenValues;
        const len = screens.length;
        for (let i = 0; i < len; i++) {
            if (screens[i]) screens[i].classList.remove('active');
        }

        const screen = this.screens[screenName];
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenName;

            if (this.onScreenChange) {
                this.onScreenChange(screenName);
            }
        }
    },

    /**
     * Show overlay
     */
    showOverlay(overlayName) {
        const overlay = this.screens[overlayName];
        if (overlay) {
            overlay.classList.add('active');
        }
    },

    /**
     * Hide overlay
     */
    hideOverlay(overlayName) {
        const overlay = this.screens[overlayName];
        if (overlay) {
            overlay.classList.remove('active');
        }
    },

    /**
     * Setup CIDR selection buttons - optimized with document fragment
     */
    setupCidrButtons(showHints = true) {
        const container = this.elements.cidrButtons;
        if (!container) return;

        // Use document fragment to batch DOM updates
        const fragment = document.createDocumentFragment();
        const cidrs = [24, 25, 26, 27, 28, 29, 30];

        for (let i = 0; i < cidrs.length; i++) {
            const cidr = cidrs[i];
            const btn = document.createElement('button');
            btn.className = cidr === 24 ? 'cidr-btn selected' : 'cidr-btn';
            btn.dataset.cidr = cidr;

            const hostCount = SubnetCalculator.cidrToHostCount(cidr);

            if (showHints) {
                btn.innerHTML = `<span class="cidr-label">/${cidr}</span><span class="cidr-hosts">${hostCount}</span>`;
            } else {
                btn.textContent = `/${cidr}`;
            }

            btn.title = `Key: ${i + 1}`;
            fragment.appendChild(btn);
        }

        container.innerHTML = '';
        container.appendChild(fragment);

        // Cache buttons for setSelectedCidr
        this._cidrButtonsCache = container.querySelectorAll('.cidr-btn');
    },

    /**
     * Set selected CIDR button - optimized with cached buttons
     */
    setSelectedCidr(cidr) {
        // Use cached buttons if available
        const buttons = this._cidrButtonsCache || document.querySelectorAll('.cidr-btn');
        const len = buttons.length;
        for (let i = 0; i < len; i++) {
            const btn = buttons[i];
            btn.classList.toggle('selected', parseInt(btn.dataset.cidr, 10) === cidr);
        }

        if (this.elements.selectedCidr) {
            this.elements.selectedCidr.textContent = `/${cidr}`;
        }
        if (this.elements.selectedHosts) {
            this.elements.selectedHosts.textContent = SubnetCalculator.cidrToHostCount(cidr);
        }
    },

    /**
     * Update score display
     */
    updateScore(score) {
        const el = this.elements.scoreDisplay;
        if (el) {
            el.textContent = score.toLocaleString();
        }
    },

    /**
     * Update efficiency display
     */
    updateEfficiency(efficiency) {
        const el = this.elements.efficiencyDisplay;
        if (el) {
            el.textContent = `${efficiency}%`;
        }
    },

    /**
     * Update subnets progress
     */
    updateSubnetsProgress(completed, total) {
        const el = this.elements.subnetsDisplay;
        if (el) {
            el.textContent = `${completed}/${total}`;
        }
    },

    /**
     * Update network display
     */
    updateNetwork(network) {
        const el = this.elements.networkDisplay;
        if (el) {
            el.textContent = network;
        }
    },

    /**
     * Update high score display
     */
    updateHighScore(score) {
        const el = this.elements.highScoreDisplay;
        if (el) {
            el.textContent = score.toLocaleString();
        }
    },

    /**
     * Update scenario header - optimized with local references
     */
    updateScenarioHeader(scenario) {
        const els = this.elements;
        if (els.clientIcon) {
            els.clientIcon.textContent = Scenarios.getTypeIcon(scenario.type);
        }
        if (els.clientName) {
            els.clientName.textContent = scenario.client;
        }
        if (els.clientLocation) {
            els.clientLocation.textContent = scenario.location;
        }
        if (els.networkClassBadge) {
            els.networkClassBadge.textContent = `CLASS ${scenario.networkClass}`;
            els.networkClassBadge.className = `network-class class-${scenario.networkClass.toLowerCase()}`;
        }
        if (els.networkDisplay) {
            els.networkDisplay.textContent = scenario.baseNetwork;
        }
    },

    /**
     * Show temporary message - optimized timeout handling
     */
    showMessage(message, duration = 2000, type = 'info') {
        const el = this.elements.messageDisplay;
        if (!el) return;

        el.textContent = message;
        el.className = `message ${type} visible`;

        // Clear existing timeout before setting new one
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }
        this.messageTimeout = setTimeout(() => {
            el.classList.remove('visible');
            this.messageTimeout = null;
        }, duration);
    },

    /**
     * Populate scenario grid - optimized with document fragment
     */
    populateScenarioGrid(scenarios, progress) {
        const container = this.elements.scenarioGrid;
        if (!container) return;

        if (!scenarios || scenarios.length === 0) {
            container.innerHTML = '<div style="color:#888;padding:20px;">No scenarios available</div>';
            return;
        }

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < scenarios.length; i++) {
            const scenario = scenarios[i];
            // Skip invalid scenarios
            if (!scenario || !scenario.id) continue;

            const card = document.createElement('div');
            card.className = 'scenario-card';
            card.dataset.scenarioId = scenario.id;

            const stars = progress[scenario.id] || 0;
            const icon = Scenarios.getTypeIcon(scenario.type || 'custom');
            const networkClass = scenario.networkClass || 'C';

            // Build stars HTML efficiently
            let starsHtml = '';
            for (let s = 1; s <= 3; s++) {
                starsHtml += `<span class="star ${s <= stars ? 'earned' : 'empty'}">${s <= stars ? '\u2605' : '\u2606'}</span>`;
            }

            card.innerHTML = `
                <div class="scenario-icon">${icon}</div>
                <div class="scenario-info">
                    <div class="scenario-client">${scenario.client || 'Unknown Client'}</div>
                    <div class="scenario-location">${scenario.location || 'Unknown Location'}</div>
                    <div class="scenario-network">
                        <span class="network-class-small class-${networkClass.toLowerCase()}">Class ${networkClass}</span>
                        ${scenario.baseNetwork || '192.168.0.0/24'}
                    </div>
                </div>
                <div class="scenario-stars">${starsHtml}</div>
            `;

            // Use closure-free event binding
            const scenarioId = scenario.id;
            const self = this;
            card.addEventListener('click', function() {
                if (self.onScenarioSelect) {
                    self.onScenarioSelect(scenarioId);
                }
            });

            fragment.appendChild(card);
        }

        container.innerHTML = '';
        container.appendChild(fragment);
    },

    /**
     * Flash effect for score increase - optimized with cached element
     */
    flashScore() {
        const el = this.elements.scoreDisplay;
        if (el) {
            el.classList.add('flash');
            setTimeout(() => {
                el.classList.remove('flash');
            }, 200);
        }
    },

    /**
     * Shake effect for errors - use cached element
     */
    shakeGrid() {
        const gridCanvas = this.elements.gridCanvas;
        if (gridCanvas) {
            gridCanvas.classList.add('shake');
            setTimeout(() => {
                gridCanvas.classList.remove('shake');
            }, 300);
        }
    },

    /**
     * Update difficulty display on main menu - use cached element
     */
    updateDifficultyDisplay(difficultyName) {
        const el = this.elements.difficultyDisplay;
        if (el) {
            el.textContent = difficultyName;
        }
    },

    /**
     * Update settings screen UI - optimized with cached toggle
     */
    updateSettingsUI(currentDifficulty, hintsEnabled, unlockedDifficulties) {
        const diffButtons = document.querySelectorAll('.difficulty-btn');
        const len = diffButtons.length;
        for (let i = 0; i < len; i++) {
            const btn = diffButtons[i];
            const diff = btn.dataset.difficulty;
            const isUnlocked = unlockedDifficulties.indexOf(diff) !== -1;
            const isSelected = diff === currentDifficulty;

            btn.classList.toggle('locked', !isUnlocked);
            btn.classList.toggle('selected', isSelected);
            btn.disabled = !isUnlocked;
        }

        const hintsToggle = this.elements.hintsToggle;
        if (hintsToggle) {
            hintsToggle.checked = hintsEnabled;
        }
    },

    /**
     * Populate achievements grid - optimized with document fragment
     */
    populateAchievements(achievements) {
        const grid = this.elements.achievementsGrid;
        const countEl = this.elements.achievementsCount;
        if (!grid) return;

        const fragment = document.createDocumentFragment();
        let unlockedCount = 0;
        let totalCount = 0;

        for (let i = 0; i < achievements.length; i++) {
            const ach = achievements[i];
            if (ach.hidden && !ach.unlocked) continue;

            totalCount++;
            if (ach.unlocked) unlockedCount++;

            const card = document.createElement('div');
            card.className = `achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`;

            let progressHtml = '';
            if (ach.progress && !ach.unlocked) {
                const pct = Math.round((ach.progress.current / ach.progress.target) * 100);
                progressHtml = `<div class="ach-progress"><div class="ach-progress-bar" style="width: ${pct}%"></div></div>`;
            }

            card.innerHTML = `
                <div class="ach-icon">${ach.unlocked ? ach.icon : '?'}</div>
                <div class="ach-info">
                    <div class="ach-name">${ach.unlocked ? ach.name : '???'}</div>
                    <div class="ach-desc">${ach.unlocked ? ach.description : 'Keep playing to unlock'}</div>
                    ${progressHtml}
                </div>
            `;

            fragment.appendChild(card);
        }

        grid.innerHTML = '';
        grid.appendChild(fragment);

        if (countEl) {
            countEl.textContent = `${unlockedCount}/${totalCount}`;
        }
    },

    /**
     * Show achievement unlock popup - use cached elements
     */
    showAchievementPopup(achievement) {
        const popup = this.elements.achievementPopup;
        const icon = this.elements.popupIcon;
        const name = this.elements.popupName;

        if (!popup || !icon || !name) return;

        icon.textContent = achievement.icon;
        name.textContent = achievement.name;

        popup.classList.remove('hidden');
        popup.classList.add('show');

        setTimeout(() => {
            popup.classList.remove('show');
            popup.classList.add('hidden');
        }, 3000);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}
