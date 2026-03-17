/**
 * Game Engine Module
 * Main game loop and state management
 */
'use strict';

const Game = {
    // Game state
    state: 'MENU', // MENU, PLAYING, PAUSED, GAME_OVER
    mode: null, // 'speed' or 'scenario'

    // Game objects
    grid: null,
    requirements: null,

    // Game stats
    score: 0,
    highScore: 0,

    // Scenario mode specifics
    currentScenario: null,
    scenarioProgress: {},
    selectedRequirementIndex: null, // Which requirement is selected for placement
    placementHistory: [], // Track placements for undo

    // Timing
    lastTime: 0,
    animationFrame: null,

    // Selected CIDR
    selectedCidr: 24,

    // Settings from pause
    settingsFromGame: false,

    /**
     * Initialize the game
     */
    init() {
        // Setup accessibility - detect keyboard vs mouse navigation
        this.setupAccessibility();

        // Load saved data
        this.loadProgress();

        // Load settings, scenarios and achievements
        Settings.load();
        Scenarios.init();
        Achievements.init();

        // Initialize Sound system
        if (typeof Sounds !== 'undefined') {
            Sounds.init();
        }

        // Initialize Tutorial system
        if (typeof Tutorial !== 'undefined') {
            Tutorial.init();
            Tutorial.onComplete = (mode) => {
                // Start the actual game after tutorial completes
                if (mode === 'speed') {
                    this.actuallyStartSpeedSubnet();
                }
                // Scenario tutorial completes in the game screen, so no action needed
            };
        }

        // Initialize Themes system
        if (typeof Themes !== 'undefined') {
            Themes.init();
        }

        // Initialize Stats tracking
        if (typeof Stats !== 'undefined') {
            Stats.init();
        }

        // Initialize Leaderboard
        if (typeof Leaderboard !== 'undefined') {
            Leaderboard.init();
        }

        // Initialize Daily Challenge
        if (typeof DailyChallenge !== 'undefined') {
            DailyChallenge.init();
            DailyChallenge.onComplete = (results) => this.handleDailyChallengeComplete(results);
        }

        // Set achievement unlock callback
        Achievements.onUnlock = (achievement) => {
            UI.showAchievementPopup(achievement);
            if (typeof Sounds !== 'undefined') {
                Sounds.play('achievement');
            }
        };

        // Initialize Speed Subnet
        SpeedSubnet.init();
        SpeedSubnet.onGameOver = (results) => this.handleSpeedGameOver(results);

        // Initialize Building Renderer
        BuildingRenderer.init('building-canvas');

        // Initialize UI
        UI.init();
        UI.updateHighScore(this.highScore);
        UI.updateDifficultyDisplay(Settings.getConfig().name);

        // Setup event listeners
        this.setupEventListeners();

        // Initial render - show launch panel and update stats
        UI.showScreen('launchPanel');
        this.updateLaunchPanelStats();
    },

    /**
     * Setup accessibility - detect keyboard navigation
     */
    setupAccessibility() {
        // Detect keyboard navigation for showing keyboard hints
        document.addEventListener('keydown', (e) => {
            // Only for Tab or number keys used for navigation
            if (e.key === 'Tab' || (e.key >= '1' && e.key <= '4')) {
                document.body.classList.add('keyboard-nav');
            }
        });

        // Switch back to mouse mode on mouse use
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-nav');
        });
    },

    /**
     * Helper to safely add click listener
     */
    addClickListener(elementId, handler) {
        const el = document.getElementById(elementId);
        if (el) {
            el.addEventListener('click', handler);
        }
    },

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // ========================================
        // LAUNCH PANEL BUTTONS
        // ========================================
        this.addClickListener('btn-launch-subnet', () => this.showSubnetHub());
        this.addClickListener('btn-launch-packet', () => this.showPacketJourneySelect());
        this.addClickListener('btn-launch-osi', () => this.startOSITrainer());
        this.addClickListener('btn-launch-binary', () => this.startBinaryMunchers());
        this.addClickListener('btn-lp-settings', () => this.showSettingsFromLaunch());
        this.addClickListener('btn-lp-stats', () => this.showStatisticsFromLaunch());
        this.addClickListener('btn-lp-achievements', () => this.showAchievementsFromLaunch());
        this.addClickListener('btn-lp-help', () => this.showHelpFromLaunch());

        // Module card click handlers (whole card clickable)
        this.addClickListener('card-subnet', () => this.showSubnetHub());
        this.addClickListener('card-packet', () => this.showPacketJourneySelect());
        this.addClickListener('card-osi', () => this.startOSITrainer());
        this.addClickListener('card-binary', () => this.startBinaryMunchers());

        // ========================================
        // SUBNET HUB BUTTONS (formerly main-menu)
        // ========================================
        this.addClickListener('btn-back-to-launch', () => UI.showScreen('launchPanel'));
        this.addClickListener('btn-arcade', () => this.startSpeedSubnet());
        this.addClickListener('btn-puzzle', () => this.showScenarioSelect());
        this.addClickListener('btn-practice', () => this.showPracticeMode());
        this.addClickListener('btn-help', () => UI.showScreen('helpScreen'));
        this.addClickListener('btn-back-help', () => this.goBackFromHelp());
        this.addClickListener('btn-back-scenarios', () => UI.showScreen('mainMenu'));
        this.addClickListener('btn-back-practice', () => UI.showScreen('mainMenu'));
        this.addClickListener('btn-start-practice', () => this.startPracticeSession());

        // Speed Subnet quit
        this.addClickListener('btn-speed-quit', () => this.quitSpeedSubnet());

        // Game buttons
        this.addClickListener('btn-pause', () => this.togglePause());
        this.addClickListener('btn-resume', () => this.togglePause());
        this.addClickListener('btn-restart', () => this.restart());
        this.addClickListener('btn-quit', () => this.quit());
        this.addClickListener('btn-undo', () => this.undoLastPlacement());
        this.addClickListener('btn-pause-settings', () => {
            UI.hideOverlay('pauseMenu');
            this.showSettings();
        });

        // Game over buttons
        this.addClickListener('btn-play-again', () => this.restart());
        this.addClickListener('btn-menu', () => this.quit());
        this.addClickListener('btn-next-level', () => this.nextScenario());

        // Settings and achievements
        this.addClickListener('btn-settings', () => this.showSettings());
        this.addClickListener('btn-back-settings', () => this.exitSettings());
        this.addClickListener('btn-achievements', () => this.showAchievements());
        this.addClickListener('btn-back-achievements', () => this.exitAchievements());

        // Daily Challenge
        this.addClickListener('btn-daily', () => this.showDailyChallenge());
        this.addClickListener('btn-back-daily', () => this.exitDailyChallenge());
        this.addClickListener('btn-start-daily', () => this.startDailyChallenge());

        // Statistics
        this.addClickListener('btn-stats', () => this.showStatistics());
        this.addClickListener('btn-back-stats', () => this.exitStatistics());

        // Packet Journey
        this.addClickListener('btn-packet-journey', () => this.showPacketJourneySelect());
        this.addClickListener('btn-back-pj-select', () => UI.showScreen('mainMenu'));
        this.addClickListener('btn-pj-quit', () => this.quitPacketJourney());
        this.addClickListener('pj-continue-btn', () => this.continuePacketJourney());
        this.setupPacketJourneyScenarioHandlers();

        // OSI Trainer
        this.addClickListener('btn-osi-trainer', () => this.startOSITrainer());
        this.addClickListener('btn-osi-quit', () => this.quitOSITrainer());

        // Binary Munchers
        this.addClickListener('btn-bm-quit', () => this.quitBinaryMunchers());

        // Leaderboard
        this.addClickListener('btn-leaderboard', () => this.showLeaderboard());
        this.addClickListener('btn-back-leaderboard', () => UI.showScreen('mainMenu'));

        // Leaderboard tabs
        document.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.leaderboard-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.leaderboard-table').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const tabId = `leaderboard-${tab.dataset.tab}`;
                document.getElementById(tabId)?.classList.add('active');
                if (typeof Sounds !== 'undefined') {
                    Sounds.play('click');
                }
            });
        });

        // Settings interactions
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!btn.classList.contains('locked')) {
                    this.setDifficulty(btn.dataset.difficulty);
                }
            });
        });

        const hintsToggle = document.getElementById('toggle-hints');
        if (hintsToggle) {
            hintsToggle.addEventListener('change', () => {
                Settings.showHints = hintsToggle.checked;
                Settings.save();
            });
        }

        // Sound settings
        const soundToggle = document.getElementById('toggle-sound');
        if (soundToggle && typeof Sounds !== 'undefined') {
            soundToggle.checked = !Sounds.muted;
            soundToggle.addEventListener('change', () => {
                Sounds.setMuted(!soundToggle.checked);
                if (!Sounds.muted) {
                    Sounds.play('click');
                }
            });
        }

        const volumeSlider = document.getElementById('volume-slider');
        const volumeDisplay = document.getElementById('volume-display');
        if (volumeSlider && typeof Sounds !== 'undefined') {
            volumeSlider.value = Sounds.volume * 100;
            if (volumeDisplay) {
                volumeDisplay.textContent = Math.round(Sounds.volume * 100) + '%';
            }
            volumeSlider.addEventListener('input', () => {
                const vol = volumeSlider.value / 100;
                Sounds.setVolume(vol);
                if (volumeDisplay) {
                    volumeDisplay.textContent = Math.round(vol * 100) + '%';
                }
            });
        }

        // Scenario import/export
        this.addClickListener('btn-import-scenarios', () => {
            const fileInput = document.getElementById('scenario-file-input');
            if (fileInput) fileInput.click();
        });

        const fileInput = document.getElementById('scenario-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const result = Scenarios.importScenarios(e.target.result);
                        if (result.success) {
                            UI.showMessage(`Imported ${result.count} scenarios!`, 2000, 'success');
                        } else {
                            UI.showMessage('Import failed: ' + result.error, 3000, 'error');
                        }
                    };
                    reader.onerror = () => {
                        UI.showMessage('Failed to read file', 3000, 'error');
                    };
                    reader.readAsText(file);
                }
            });
        }

        this.addClickListener('btn-export-scenarios', () => {
            const data = Scenarios.exportScenarios();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'custom-scenarios.json';
            a.click();
            URL.revokeObjectURL(url);
        });

        // Reset progress buttons
        this.addClickListener('btn-reset-scenarios', () => {
            if (confirm('Reset all scenario progress? This will clear all stars earned.')) {
                this.resetScenarioProgress();
                UI.showMessage('Scenario progress reset!', 2000, 'success');
            }
        });

        this.addClickListener('btn-reset-all', () => {
            if (confirm('Reset EVERYTHING? This will clear all progress, achievements, and high scores.')) {
                this.resetAllProgress();
                UI.showMessage('All progress reset!', 2000, 'success');
            }
        });

        // Replay tutorials button
        this.addClickListener('btn-replay-tutorials', () => {
            if (typeof Tutorial !== 'undefined') {
                Tutorial.reset();
                UI.showMessage('Tutorials will replay on next game!', 2000, 'success');
            }
        });

        // Save data export/import
        this.addClickListener('btn-export-save', () => {
            if (typeof SaveData !== 'undefined') {
                SaveData.downloadSave();
                UI.showMessage('Save data exported!', 2000, 'success');
            }
        });

        this.addClickListener('btn-import-save', () => {
            const fileInput = document.getElementById('save-file-input');
            if (fileInput) fileInput.click();
        });

        const saveFileInput = document.getElementById('save-file-input');
        if (saveFileInput) {
            saveFileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file && typeof SaveData !== 'undefined') {
                    const result = await SaveData.importFromFile(file);
                    if (result.success) {
                        UI.showMessage('Save data imported! Reloading...', 2000, 'success');
                        setTimeout(() => window.location.reload(), 2000);
                    } else {
                        UI.showMessage('Import failed: ' + result.error, 3000, 'error');
                    }
                }
            });
        }

        // CIDR buttons
        const cidrButtons = document.getElementById('cidr-buttons');
        if (cidrButtons) {
            cidrButtons.addEventListener('click', (e) => {
                if (e.target.classList.contains('cidr-btn')) {
                    this.selectCidr(parseInt(e.target.dataset.cidr));
                }
            });
        }

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Scenario select callback
        UI.onScenarioSelect = (scenarioId) => this.startScenario(scenarioId);
    },

    /**
     * Handle keyboard input
     */
    handleKeydown(e) {
        // Speed Subnet mode
        if (this.mode === 'speed' && SpeedSubnet.active) {
            SpeedSubnet.handleKeypress(e.key);
            return;
        }

        if (this.state !== 'PLAYING') return;

        // Number keys for CIDR selection
        if (e.key >= '1' && e.key <= '7') {
            const cidrs = [24, 25, 26, 27, 28, 29, 30];
            this.selectCidr(cidrs[parseInt(e.key) - 1]);
        }

        // Undo (Ctrl+Z or just Z)
        if (e.key === 'z' || e.key === 'Z') {
            if (this.mode === 'scenario') {
                this.undoLastPlacement();
            }
        }

        // Pause
        if (e.key === ' ' || e.key === 'Escape') {
            e.preventDefault();
            this.togglePause();
        }

        // Restart
        if (e.key === 'r' || e.key === 'R') {
            this.restart();
        }
    },

    /**
     * Select a CIDR value
     */
    selectCidr(cidr) {
        this.selectedCidr = cidr;
        UI.setSelectedCidr(cidr);
        if (this.grid) {
            this.grid.setSelectedCidr(cidr);
        }
    },

    /**
     * Start Speed Subnet (Arcade) mode
     */
    startSpeedSubnet() {
        // Show tutorial for first-time players
        if (typeof Tutorial !== 'undefined' && Tutorial.shouldShow('speed')) {
            UI.showScreen('speedSubnetScreen');
            // Wait a moment for screen to render, then show tutorial
            setTimeout(() => {
                Tutorial.start('speed');
            }, 100);
            return;
        }

        this.actuallyStartSpeedSubnet();
    },

    /**
     * Actually start Speed Subnet game (after tutorial)
     */
    actuallyStartSpeedSubnet() {
        this.mode = 'speed';
        this.state = 'PLAYING';

        const config = Settings.getConfig();

        // Map difficulty names to SpeedSubnet difficulty levels
        let difficulty = 'easy';
        if (Settings.difficulty === 'intermediate') difficulty = 'medium';
        else if (Settings.difficulty === 'expert') difficulty = 'hard';
        else if (Settings.difficulty === 'master') difficulty = 'hard';
        else if (Settings.difficulty === 'nightmare') difficulty = 'nightmare';

        UI.showScreen('speedSubnetScreen');
        SpeedSubnet.start({
            difficulty,
            maxQuestions: config.speedQuestions || 20,
            categories: config.questionCategories
        });
    },

    /**
     * Quit Speed Subnet
     */
    quitSpeedSubnet() {
        SpeedSubnet.active = false;
        this.state = 'MENU';
        UI.showScreen('mainMenu');
    },

    // ========================================
    // LAUNCH PANEL NAVIGATION
    // ========================================

    /**
     * Show the Subnet Mastery hub (formerly main menu)
     */
    showSubnetHub() {
        this.updateLaunchPanelStats();
        UI.showScreen('mainMenu');
    },

    /**
     * Show settings from launch panel
     */
    showSettingsFromLaunch() {
        this.settingsFromLaunch = true;
        this.showSettings();
    },

    /**
     * Show statistics from launch panel
     */
    showStatisticsFromLaunch() {
        this.statsFromLaunch = true;
        this.showStatistics();
    },

    /**
     * Show achievements from launch panel
     */
    showAchievementsFromLaunch() {
        this.achievementsFromLaunch = true;
        this.showAchievements();
    },

    /**
     * Show help from launch panel
     */
    showHelpFromLaunch() {
        this.helpFromLaunch = true;
        UI.showScreen('helpScreen');
    },

    /**
     * Go back from help screen (context-aware)
     */
    goBackFromHelp() {
        if (this.helpFromLaunch) {
            this.helpFromLaunch = false;
            UI.showScreen('launchPanel');
        } else {
            UI.showScreen('mainMenu');
        }
    },

    /**
     * Update launch panel statistics display
     */
    updateLaunchPanelStats() {
        // Update total score
        const totalScoreEl = document.getElementById('total-score');
        if (totalScoreEl) {
            totalScoreEl.textContent = this.highScore.toLocaleString();
        }

        // Update achievements count
        const achieveCountEl = document.getElementById('achievements-count');
        if (achieveCountEl && typeof Achievements !== 'undefined') {
            const unlocked = Achievements.list.filter(a => a.unlocked).length;
            achieveCountEl.textContent = unlocked;
        }

        // Update day streak
        const streakEl = document.getElementById('streak-count');
        if (streakEl && typeof DailyChallenge !== 'undefined') {
            streakEl.textContent = DailyChallenge.currentStreak || 0;
        }

        // Update module progress bars
        this.updateModuleProgress();
    },

    /**
     * Update progress bars on launch panel module cards
     */
    updateModuleProgress() {
        // Subnet progress (based on scenarios completed)
        const subnetProgressEl = document.getElementById('subnet-progress');
        if (subnetProgressEl) {
            const totalScenarios = Scenarios.getAll().length;
            const completed = Object.keys(this.scenarioProgress).length;
            const pct = totalScenarios > 0 ? Math.round((completed / totalScenarios) * 100) : 0;
            subnetProgressEl.style.width = pct + '%';
            const label = subnetProgressEl.parentElement?.nextElementSibling;
            if (label) label.textContent = `${pct}% Complete`;
        }

        // Packet Journey progress
        const packetProgressEl = document.getElementById('packet-progress');
        if (packetProgressEl && typeof PacketJourney !== 'undefined') {
            const totalScenarios = PacketJourney.scenarios?.length || 6;
            const completed = PacketJourney.completedScenarios?.size || 0;
            const pct = Math.round((completed / totalScenarios) * 100);
            packetProgressEl.style.width = pct + '%';
            const label = packetProgressEl.parentElement?.nextElementSibling;
            if (label) label.textContent = `${completed}/${totalScenarios} Scenarios`;
        }

        // OSI progress (high score based)
        const osiProgressEl = document.getElementById('osi-progress-bar');
        if (osiProgressEl && typeof Leaderboard !== 'undefined') {
            const osiScores = Leaderboard.osiTrainer || [];
            const highScore = osiScores.length > 0 ? osiScores[0].score : 0;
            // Use 2000 as the "mastery" score target
            const pct = Math.min(100, Math.round((highScore / 2000) * 100));
            osiProgressEl.style.width = pct + '%';
            const label = osiProgressEl.parentElement?.nextElementSibling;
            if (label) label.textContent = `High: ${highScore}`;
        }
    },

    /**
     * Handle Speed Subnet game over
     */
    handleSpeedGameOver(results) {
        this.state = 'GAME_OVER';
        this.score = results.score;

        const isHighScore = results.score > this.highScore;
        if (isHighScore) {
            this.highScore = results.score;
            this.saveProgress();
            UI.updateHighScore(this.highScore);
        }

        // Record stats
        if (typeof Stats !== 'undefined') {
            Stats.recordSpeedSubnetGame(results);
        }

        // Record to leaderboard
        if (typeof Leaderboard !== 'undefined') {
            Leaderboard.addSpeedSubnetScore(results.score, results.accuracy, results.bestStreak);
        }

        // Update achievements
        if (results.totalCorrect >= 1) {
            Achievements.unlock('first_subnet');
        }
        if (results.bestStreak >= 10) {
            Achievements.unlock('combo_master');
        }
        if (results.score >= 10000) {
            Achievements.unlock('high_score_10k');
        }

        // Check for master difficulty unlock
        if (results.score >= 15000) {
            Achievements.checkMasterUnlock(results.score);
        }
        Achievements.updateProgress('arcade_50', results.totalCorrect);

        // Show game over
        document.getElementById('game-over-title').textContent = 'ROUND COMPLETE';
        document.getElementById('final-score').textContent = results.score.toLocaleString();
        document.getElementById('final-accuracy').textContent = `Accuracy: ${results.accuracy}%`;
        document.getElementById('final-accuracy').style.display = 'block';
        document.getElementById('final-efficiency').textContent = `Best Streak: ${results.bestStreak}x`;
        document.getElementById('final-efficiency').style.display = 'block';
        document.getElementById('stars-display').style.display = 'none';
        document.getElementById('btn-next-level').classList.add('hidden');
        document.getElementById('new-high-score').classList.toggle('hidden', !isHighScore);

        UI.showScreen('speedSubnetScreen');
        UI.showOverlay('gameOver');
    },

    /**
     * Show Practice Mode screen
     */
    showPracticeMode() {
        if (typeof Practice === 'undefined') {
            UI.showMessage('Practice mode not available', 2000, 'error');
            return;
        }

        Practice.init();
        this.renderPracticeCategories();
        UI.showScreen('practiceScreen');
    },

    /**
     * Render practice category selection
     */
    renderPracticeCategories() {
        const container = document.getElementById('practice-categories');
        if (!container) return;

        const stats = Practice.getCategoryStats();

        container.innerHTML = `
            <div class="practice-select-buttons" style="grid-column: 1 / -1;">
                <button class="practice-select-btn" id="btn-select-weak">SELECT WEAK</button>
                <button class="practice-select-btn" id="btn-select-all">SELECT ALL</button>
                <button class="practice-select-btn" id="btn-select-none">CLEAR</button>
            </div>
        ` + stats.map(cat => {
            const isSelected = Practice.isSelected(cat.id);
            const accuracyDisplay = cat.accuracy !== null ? `${cat.accuracy}%` : 'No data';
            const attemptsDisplay = cat.total > 0 ? `${cat.total} attempts` : 'Not tried';

            let recommendText = '';
            if (cat.recommendation === 'critical') {
                recommendText = '<span class="practice-cat-recommend critical">NEEDS FOCUS</span>';
            } else if (cat.recommendation === 'needs-work') {
                recommendText = '<span class="practice-cat-recommend needs-work">PRACTICE MORE</span>';
            }

            return `
                <div class="practice-category ${cat.recommendation} ${isSelected ? 'selected' : ''}"
                     data-category="${cat.id}">
                    <div class="practice-cat-header">
                        <span class="practice-cat-name">${cat.name}</span>
                        <span class="practice-cat-icon">${cat.icon}</span>
                    </div>
                    <div class="practice-cat-stats">
                        <span class="practice-cat-accuracy ${cat.recommendation}">${accuracyDisplay}</span>
                        <span class="practice-cat-attempts">${attemptsDisplay}</span>
                    </div>
                    ${recommendText}
                </div>
            `;
        }).join('');

        // Add click handlers
        container.querySelectorAll('.practice-category').forEach(el => {
            el.addEventListener('click', () => {
                const catId = el.dataset.category;
                const hasSelection = Practice.toggleCategory(catId);
                el.classList.toggle('selected');
                this.updatePracticeButton(hasSelection);
                if (typeof Sounds !== 'undefined') {
                    Sounds.play('click');
                }
            });
        });

        // Selection buttons
        document.getElementById('btn-select-weak')?.addEventListener('click', () => {
            Practice.selectWeakCategories();
            this.renderPracticeCategories();
            this.updatePracticeButton(Practice.getSelectedCategories().length > 0);
        });

        document.getElementById('btn-select-all')?.addEventListener('click', () => {
            Practice.selectedCategories = Object.keys(Practice.categories);
            this.renderPracticeCategories();
            this.updatePracticeButton(true);
        });

        document.getElementById('btn-select-none')?.addEventListener('click', () => {
            Practice.clearSelection();
            this.renderPracticeCategories();
            this.updatePracticeButton(false);
        });

        this.updatePracticeButton(Practice.getSelectedCategories().length > 0);
    },

    /**
     * Update practice start button state
     */
    updatePracticeButton(enabled) {
        const btn = document.getElementById('btn-start-practice');
        if (btn) {
            btn.disabled = !enabled;
        }
    },

    /**
     * Start practice session
     */
    startPracticeSession() {
        if (!Practice.startPractice()) {
            UI.showMessage('Select at least one category', 2000, 'error');
            return;
        }

        this.mode = 'practice';
        this.state = 'PLAYING';

        UI.showScreen('speedSubnetScreen');
        SpeedSubnet.start({
            difficulty: 'easy',
            maxQuestions: 15
        });
    },

    /**
     * Show scenario select screen
     */
    showScenarioSelect() {
        UI.populateScenarioGrid(Scenarios.getAll(), this.scenarioProgress);
        UI.showScreen('scenarioSelect');
    },

    /**
     * Start a specific scenario
     */
    startScenario(scenarioId) {
        const scenario = Scenarios.getById(scenarioId);
        if (!scenario) {
            UI.showMessage('Scenario not found', 2000, 'error');
            return;
        }

        // Validate required scenario properties
        if (!scenario.baseNetwork || !scenario.subnets || !Array.isArray(scenario.subnets)) {
            UI.showMessage('Invalid scenario data', 2000, 'error');
            return;
        }

        this.mode = 'scenario';
        this.currentScenario = scenario;
        this.score = 0;
        this.selectedRequirementIndex = null;
        this.placementHistory = [];

        // Initialize grid with scenario's network
        const canvas = document.getElementById('grid-canvas');
        if (!canvas) {
            UI.showMessage('Game canvas not found', 2000, 'error');
            return;
        }

        try {
            this.grid = new AddressGrid(canvas, scenario.baseNetwork);
            this.grid.onCellClick = (offset, cidr) => this.handlePlacement(offset, cidr);
        } catch (e) {
            UI.showMessage('Failed to initialize grid', 2000, 'error');
            return;
        }

        // Setup building visualization
        BuildingRenderer.setupForScenario(scenario);

        // Setup requirements list (new simplified approach)
        this.scenarioRequirements = scenario.subnets.map((subnet, index) => ({
            id: index,
            name: subnet.name || `Subnet ${index + 1}`,
            hosts: subnet.hosts || 10,
            context: subnet.context || '',
            minCidr: SubnetCalculator.hostCountToCidr(subnet.hosts || 10),
            fulfilled: false,
            efficiency: 0
        }));

        this.renderRequirementsList();

        // Update UI
        UI.setupCidrButtons(Settings.shouldShowHints());
        UI.showScreen('gameScreen');
        UI.updateScenarioHeader(scenario);
        UI.updateScore(this.score);
        UI.updateSubnetsProgress(0, scenario.subnets.length);
        UI.updateEfficiency(0);
        this.selectCidr(24);

        // Show network class info
        const classInfo = Scenarios.getNetworkClassInfo(scenario.networkClass);
        const classDetails = document.getElementById('class-details');
        if (classDetails) {
            classDetails.innerHTML = `
                <div><strong>${classInfo.name}</strong></div>
                <div>Range: ${classInfo.range}</div>
                <div>Default: ${classInfo.defaultMask}</div>
            `;
        }

        // Clear any previous feedback
        this.hideFeedback();

        // Start game loop
        this.state = 'PLAYING';
        this.lastTime = performance.now();
        this.gameLoop();

        // Show tutorial for first-time scenario players
        if (typeof Tutorial !== 'undefined' && Tutorial.shouldShow('scenario')) {
            setTimeout(() => {
                Tutorial.start('scenario');
            }, 500);
        }
    },

    /**
     * Render the requirements list
     */
    renderRequirementsList() {
        const container = document.getElementById('requirements-list');
        if (!container) return;

        container.innerHTML = '';
        const config = Settings.getConfig();

        // Auto-select first unfulfilled if nothing selected
        if (this.selectedRequirementIndex === null ||
            this.scenarioRequirements[this.selectedRequirementIndex]?.fulfilled) {
            this.selectedRequirementIndex = this.getActiveRequirementIndex();
        }

        this.scenarioRequirements.forEach((req, index) => {
            const item = document.createElement('div');
            const isSelected = index === this.selectedRequirementIndex;
            item.className = `requirement-item ${req.fulfilled ? 'fulfilled' : ''} ${isSelected ? 'selected' : ''}`;
            item.dataset.id = req.id;
            item.dataset.index = index;

            let cidrHint = '';
            if (config.showMinCidrOnRequests && !req.fulfilled) {
                cidrHint = `<div class="req-cidr-hint">Min: /${req.minCidr}</div>`;
            }

            item.innerHTML = `
                <div class="req-header">
                    <span class="req-name">${req.name}</span>
                    <span class="req-hosts">${req.hosts} hosts</span>
                </div>
                <div class="req-context">${req.context}</div>
                ${cidrHint}
            `;

            // Click to select this requirement
            if (!req.fulfilled) {
                item.addEventListener('click', () => this.selectRequirement(index));
            }

            container.appendChild(item);
        });

        // Update undo button state
        this.updateUndoButton();
    },

    /**
     * Select a requirement for placement
     */
    selectRequirement(index) {
        const req = this.scenarioRequirements[index];
        if (!req || req.fulfilled) return;

        this.selectedRequirementIndex = index;
        this.renderRequirementsList();

        // Clear any error feedback
        this.hideFeedback();

        // Auto-select appropriate CIDR for this requirement
        this.selectCidr(req.minCidr);

        // Show helpful info about this requirement
        const minCidr = req.minCidr;
        const maxHosts = SubnetCalculator.cidrToHostCount(minCidr);
        this.showFeedback(
            'success',
            `SELECTED: ${req.name}`,
            `Needs ${req.hosts} hosts. Using /${minCidr} which provides ${maxHosts} usable hosts.`,
            `Click on the grid to place this subnet. Press Z to undo if needed.`
        );
    },

    /**
     * Get index of first unfulfilled requirement
     */
    getActiveRequirementIndex() {
        return this.scenarioRequirements.findIndex(r => !r.fulfilled);
    },

    /**
     * Update undo button enabled/disabled state
     */
    updateUndoButton() {
        const undoBtn = document.getElementById('btn-undo');
        if (undoBtn) {
            undoBtn.disabled = this.placementHistory.length === 0;
        }
    },

    /**
     * Show settings screen
     */
    showSettings() {
        this.settingsFromGame = (this.state === 'PAUSED');

        const unlockedDifficulties = ['beginner'];
        if (Achievements.isUnlocked('intermediate_unlocked')) {
            unlockedDifficulties.push('intermediate');
        }
        if (Achievements.isUnlocked('expert_unlocked')) {
            unlockedDifficulties.push('expert');
        }
        if (Achievements.isUnlocked('master_unlocked')) {
            unlockedDifficulties.push('master');
        }
        if (Achievements.isUnlocked('nightmare_unlocked')) {
            unlockedDifficulties.push('nightmare');
        }

        UI.updateSettingsUI(Settings.difficulty, Settings.showHints, unlockedDifficulties);

        // Render theme selector
        this.renderThemeSelector();

        // Render save data summary
        this.renderSaveSummary();

        UI.showScreen('settingsScreen');
    },

    /**
     * Render save data summary
     */
    renderSaveSummary() {
        const container = document.getElementById('save-summary');
        if (!container || typeof SaveData === 'undefined') return;

        const summary = SaveData.getSummary();

        if (!summary.hasData) {
            container.innerHTML = '<div class="no-data">No save data yet</div>';
            container.classList.add('no-data');
        } else {
            container.classList.remove('no-data');
            container.innerHTML = `
                <div class="save-stat">
                    <span>High Score:</span>
                    <span class="save-stat-value">${summary.stats.highScore.toLocaleString()}</span>
                </div>
                <div class="save-stat">
                    <span>Scenarios:</span>
                    <span class="save-stat-value">${summary.stats.scenariosCompleted}</span>
                </div>
                <div class="save-stat">
                    <span>Achievements:</span>
                    <span class="save-stat-value">${summary.stats.achievementsUnlocked}</span>
                </div>
                <div class="save-stat">
                    <span>Speed Games:</span>
                    <span class="save-stat-value">${summary.stats.speedGames}</span>
                </div>
            `;
        }
    },

    /**
     * Render theme selector in settings
     */
    renderThemeSelector() {
        const container = document.getElementById('theme-selector');
        if (!container || typeof Themes === 'undefined') return;

        const themes = Themes.getAll();

        container.innerHTML = themes.map(theme => {
            const isActive = Themes.current === theme.id;
            const isLocked = !theme.unlocked;

            return `
                <div class="theme-option ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}"
                     data-theme="${theme.id}">
                    <div class="theme-preview">
                        <div class="theme-color" style="background: ${theme.colors.primary}"></div>
                        <div class="theme-color" style="background: ${theme.colors.secondary}"></div>
                        <div class="theme-color" style="background: ${theme.colors.success}"></div>
                        <div class="theme-color" style="background: ${theme.colors.background}"></div>
                    </div>
                    <div class="theme-name">${theme.name}</div>
                    <div class="theme-desc">${theme.description}</div>
                    ${isLocked ? `<div class="theme-lock-msg">${theme.unlockCondition}</div>` : ''}
                </div>
            `;
        }).join('');

        // Add click handlers
        container.querySelectorAll('.theme-option:not(.locked)').forEach(el => {
            el.addEventListener('click', () => {
                const themeId = el.dataset.theme;
                if (Themes.apply(themeId)) {
                    this.renderThemeSelector();
                    if (typeof Sounds !== 'undefined') {
                        Sounds.play('select');
                    }
                }
            });
        });
    },

    /**
     * Exit settings screen (context-aware)
     */
    exitSettings() {
        if (this.settingsFromGame) {
            UI.showScreen('gameScreen');
            UI.showOverlay('pauseMenu');
        } else if (this.settingsFromLaunch) {
            UI.showScreen('launchPanel');
        } else {
            UI.showScreen('mainMenu');
        }
        this.settingsFromGame = false;
        this.settingsFromLaunch = false;
    },

    /**
     * Show achievements screen
     */
    showAchievements() {
        UI.populateAchievements(Achievements.getAll());
        UI.showScreen('achievementsScreen');
    },

    /**
     * Exit achievements screen (context-aware)
     */
    exitAchievements() {
        if (this.achievementsFromLaunch) {
            this.achievementsFromLaunch = false;
            UI.showScreen('launchPanel');
        } else {
            UI.showScreen('mainMenu');
        }
    },

    /**
     * Show Daily Challenge screen
     */
    showDailyChallenge() {
        if (typeof DailyChallenge === 'undefined') {
            UI.showMessage('Daily Challenge not available', 2000, 'error');
            return;
        }

        const info = DailyChallenge.getTodayInfo();

        // Update UI elements
        const dateEl = document.getElementById('daily-date');
        const themeEl = document.getElementById('daily-theme');
        const streakEl = document.getElementById('daily-streak-count');
        const statusEl = document.getElementById('daily-status');
        const startBtn = document.getElementById('btn-start-daily');
        const gameArea = document.getElementById('daily-game-area');
        const startArea = document.getElementById('daily-start-area');
        const resultsArea = document.getElementById('daily-results');

        if (dateEl) {
            const today = new Date();
            dateEl.textContent = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        }

        if (themeEl) {
            themeEl.innerHTML = `<span style="color: ${info.theme.color}">${info.theme.name}</span>`;
        }

        if (streakEl) {
            streakEl.textContent = info.streak;
        }

        if (statusEl) {
            if (info.completed) {
                statusEl.innerHTML = '<span class="completed-badge">COMPLETED TODAY</span>';
                if (startBtn) startBtn.style.display = 'none';
            } else {
                statusEl.innerHTML = `
                    <div class="challenge-info">
                        <div>${info.totalQuestions} Questions</div>
                        <div>Time Limit: ${Math.floor(info.timeLimit / 60)}:${(info.timeLimit % 60).toString().padStart(2, '0')}</div>
                        ${info.bonusMultiplier > 1 ? `<div class="bonus-badge">Weekend Bonus: ${info.bonusMultiplier}x</div>` : ''}
                    </div>
                `;
                if (startBtn) startBtn.style.display = 'block';
            }
        }

        // Show/hide areas
        if (gameArea) gameArea.classList.add('hidden');
        if (startArea) startArea.classList.remove('hidden');
        if (resultsArea) resultsArea.classList.add('hidden');

        UI.showScreen('dailyChallengeScreen');
    },

    /**
     * Start Daily Challenge
     */
    startDailyChallenge() {
        const result = DailyChallenge.start();

        if (result.error) {
            UI.showMessage(result.message, 2000, 'error');
            return;
        }

        const gameArea = document.getElementById('daily-game-area');
        const startArea = document.getElementById('daily-start-area');

        if (gameArea) gameArea.classList.remove('hidden');
        if (startArea) startArea.classList.add('hidden');

        this.mode = 'daily';
        this.state = 'PLAYING';
    },

    /**
     * Exit Daily Challenge
     */
    exitDailyChallenge() {
        if (DailyChallenge.isActive) {
            if (!confirm('Leave challenge? Progress will be lost.')) {
                return;
            }
            DailyChallenge.isActive = false;
            clearInterval(DailyChallenge.timerInterval);
        }
        this.state = 'MENU';
        this.mode = null;
        UI.showScreen('mainMenu');
    },

    /**
     * Handle Daily Challenge completion
     */
    handleDailyChallengeComplete(results) {
        const resultsArea = document.getElementById('daily-results');
        const gameArea = document.getElementById('daily-game-area');
        const finalScoreEl = document.getElementById('daily-final-score');
        const statsEl = document.getElementById('daily-results-stats');

        if (gameArea) gameArea.classList.add('hidden');
        if (resultsArea) resultsArea.classList.remove('hidden');

        if (finalScoreEl) {
            finalScoreEl.textContent = results.score.toLocaleString();
        }

        if (statsEl) {
            let bonusHtml = '';
            if (results.perfectBonus > 0) {
                bonusHtml += `<div class="bonus">Perfect Bonus: +${results.perfectBonus}</div>`;
            }
            if (results.speedBonus > 0) {
                bonusHtml += `<div class="bonus">Speed Bonus: +${results.speedBonus}</div>`;
            }
            if (results.streakBonus > 0) {
                bonusHtml += `<div class="bonus">Streak Bonus: +${results.streakBonus}</div>`;
            }

            statsEl.innerHTML = `
                <div>Correct: ${results.correctAnswers}/${results.totalQuestions}</div>
                <div>Accuracy: ${results.accuracy}%</div>
                <div>Time: ${Math.floor(results.timeElapsed / 60)}:${(results.timeElapsed % 60).toString().padStart(2, '0')}</div>
                ${bonusHtml}
                <div class="streak-result">Current Streak: ${results.streak} days</div>
            `;
        }

        // Record to leaderboard
        if (typeof Leaderboard !== 'undefined') {
            Leaderboard.addDailyScore(results.score, results.accuracy);
        }

        // Check for nightmare difficulty unlock
        if (typeof Stats !== 'undefined' && typeof Achievements !== 'undefined') {
            const dailyCompleted = Stats.data.dailyChallenge.totalCompleted || 0;
            Achievements.checkNightmareUnlock(dailyCompleted);
        }

        this.state = 'GAME_OVER';
    },

    /**
     * Show Leaderboard screen
     */
    showLeaderboard() {
        if (typeof Leaderboard === 'undefined') {
            UI.showMessage('Leaderboard not available', 2000, 'error');
            return;
        }

        this.renderLeaderboard();
        UI.showScreen('leaderboardScreen');
    },

    /**
     * Render leaderboard entries
     */
    renderLeaderboard() {
        // Speed Subnet scores
        const speedScores = Leaderboard.getSpeedSubnetScores();
        const speedContainer = document.getElementById('leaderboard-speed-entries');
        if (speedContainer) {
            if (speedScores.length === 0) {
                speedContainer.innerHTML = '<div class="leaderboard-entry"><span style="grid-column: 1/-1; text-align: center; color: #666;">No scores yet</span></div>';
            } else {
                speedContainer.innerHTML = speedScores.map((entry, i) => {
                    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
                    return `
                        <div class="leaderboard-entry ${rankClass}">
                            <span class="lb-rank">${entry.rank}</span>
                            <span class="lb-score">${entry.score.toLocaleString()}</span>
                            <span class="lb-acc">${entry.accuracy}%</span>
                            <span class="lb-streak">${entry.streak}x</span>
                            <span class="lb-date">${entry.date}</span>
                        </div>
                    `;
                }).join('');
            }
        }

        // Daily scores
        const dailyScores = Leaderboard.getDailyScores();
        const dailyContainer = document.getElementById('leaderboard-daily-entries');
        if (dailyContainer) {
            if (dailyScores.length === 0) {
                dailyContainer.innerHTML = '<div class="leaderboard-entry"><span style="grid-column: 1/-1; text-align: center; color: #666;">No scores yet</span></div>';
            } else {
                dailyContainer.innerHTML = dailyScores.map((entry, i) => {
                    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
                    return `
                        <div class="leaderboard-entry ${rankClass}">
                            <span class="lb-rank">${entry.rank}</span>
                            <span class="lb-score">${entry.score.toLocaleString()}</span>
                            <span class="lb-acc">${entry.accuracy}%</span>
                            <span class="lb-date">${entry.date}</span>
                        </div>
                    `;
                }).join('');
            }
        }

        // Show/hide empty message
        const hasScores = speedScores.length > 0 || dailyScores.length > 0;
        document.getElementById('leaderboard-empty')?.classList.toggle('hidden', hasScores);
        document.getElementById('leaderboard-content')?.classList.toggle('hidden', !hasScores);
    },

    /**
     * Show Statistics screen
     */
    showStatistics() {
        if (typeof Stats === 'undefined') {
            UI.showMessage('Statistics not available', 2000, 'error');
            return;
        }

        const summary = Stats.getSummary();
        const categories = Stats.getCategoryBreakdown();

        // Update overview stats
        const setStatText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setStatText('stat-total-games', summary.totalGames);
        setStatText('stat-play-time', summary.playTime);
        setStatText('stat-accuracy', summary.overallAccuracy + '%');
        setStatText('stat-best-streak', summary.bestStreak);
        setStatText('stat-speed-best', summary.bestSpeedScore);
        setStatText('stat-speed-games', Stats.data.speedSubnet.gamesPlayed);
        setStatText('stat-scenarios-completed', summary.scenariosCompleted);
        setStatText('stat-three-stars', summary.threeStars);
        setStatText('stat-avg-efficiency', summary.avgEfficiency + '%');
        setStatText('stat-daily-completed', summary.dailyChallengesCompleted);
        setStatText('stat-daily-streak', summary.dailyChallengeStreak);
        setStatText('stat-daily-best-streak', Stats.data.dailyChallenge.bestStreak);

        // Category breakdown
        const breakdownEl = document.getElementById('category-breakdown');
        if (breakdownEl) {
            breakdownEl.innerHTML = categories.map(cat => `
                <div class="category-stat">
                    <span class="cat-name">${cat.name}</span>
                    <span class="cat-accuracy ${cat.accuracy === null ? 'no-data' : cat.accuracy >= 70 ? 'good' : 'needs-work'}">
                        ${cat.accuracy !== null ? cat.accuracy + '%' : '-'}
                    </span>
                    <span class="cat-count">(${cat.total} attempts)</span>
                </div>
            `).join('');
        }

        UI.showScreen('statsScreen');
    },

    /**
     * Exit statistics screen (context-aware)
     */
    exitStatistics() {
        if (this.statsFromLaunch) {
            this.statsFromLaunch = false;
            UI.showScreen('launchPanel');
        } else {
            UI.showScreen('mainMenu');
        }
    },

    /**
     * Set game difficulty
     */
    setDifficulty(level) {
        Settings.setDifficulty(level);
        UI.updateDifficultyDisplay(Settings.getConfig().name);
        this.showSettings();
    },

    /**
     * Main game loop
     */
    gameLoop() {
        if (this.state !== 'PLAYING') {
            return;
        }

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    },

    /**
     * Update game state
     */
    update(deltaTime) {
        // Scenario mode doesn't need continuous updates
        // Win condition is checked after each placement
    },

    /**
     * Show feedback panel with error or success info
     */
    showFeedback(type, title, details, tip) {
        const panel = document.getElementById('feedback-panel');
        const content = document.getElementById('feedback-content');
        if (!panel || !content) return;

        panel.classList.remove('hidden', 'success');
        if (type === 'success') {
            panel.classList.add('success');
        }

        let html = `<div class="feedback-title">${title}</div>`;
        if (details) {
            html += `<div class="feedback-detail">${details}</div>`;
        }
        if (tip) {
            html += `<div class="feedback-tip">${tip}</div>`;
        }
        content.innerHTML = html;
    },

    /**
     * Hide the feedback panel
     */
    hideFeedback() {
        const panel = document.getElementById('feedback-panel');
        if (panel) {
            panel.classList.add('hidden');
        }
    },

    /**
     * Handle subnet placement
     */
    handlePlacement(offset, cidr) {
        if (this.state !== 'PLAYING') return;

        const availableHosts = SubnetCalculator.cidrToHostCount(cidr);

        // Check if placement is valid on grid
        if (!this.grid.canPlace(offset, cidr)) {
            this.showFeedback(
                'error',
                'INVALID PLACEMENT',
                `Cannot place /${cidr} subnet here. The space is either already occupied or extends beyond the network boundary.`,
                'TIP: Look for empty (dark) areas on the grid. Subnets must fit within the address space.'
            );
            UI.shakeGrid();
            if (typeof Sounds !== 'undefined') {
                Sounds.play('wrong');
            }
            return;
        }

        // Use selected requirement, or find a matching one
        let req = null;
        if (this.selectedRequirementIndex !== null) {
            const selected = this.scenarioRequirements[this.selectedRequirementIndex];
            if (selected && !selected.fulfilled) {
                if (selected.hosts <= availableHosts) {
                    req = selected;
                } else {
                    const neededCidr = SubnetCalculator.hostCountToCidr(selected.hosts);
                    this.showFeedback(
                        'error',
                        'CIDR TOO SMALL',
                        `"${selected.name}" needs ${selected.hosts} hosts, but /${cidr} only provides ${availableHosts} usable hosts.`,
                        `TIP: Use /${neededCidr} or larger (smaller number = more hosts). Press ${neededCidr - 23} key or click the CIDR button.`
                    );
                    UI.shakeGrid();
                    return;
                }
            }
        }

        // Fallback to auto-find if no selection
        if (!req) {
            req = this.findMatchingRequirement(cidr);
        }

        if (!req) {
            // Find unfulfilled requirements and explain
            const unfulfilled = this.scenarioRequirements.filter(r => !r.fulfilled);
            if (unfulfilled.length === 0) {
                this.showFeedback(
                    'error',
                    'ALL REQUIREMENTS MET',
                    'All subnet requirements have been fulfilled!',
                    null
                );
            } else {
                const smallest = unfulfilled.reduce((a, b) => a.hosts < b.hosts ? a : b);
                const largest = unfulfilled.reduce((a, b) => a.hosts > b.hosts ? a : b);
                this.showFeedback(
                    'error',
                    'NO MATCHING REQUIREMENT',
                    `/${cidr} provides ${availableHosts} hosts. Remaining requirements need between ${smallest.hosts} and ${largest.hosts} hosts.`,
                    `TIP: Click on a requirement in the list to select it, then the correct CIDR will be chosen automatically.`
                );
            }
            UI.shakeGrid();
            return;
        }

        // Clear any error feedback on successful placement
        this.hideFeedback();

        // Play placement sound
        if (typeof Sounds !== 'undefined') {
            Sounds.play('place');
        }

        // Place the subnet - get the snapped offset for consistency
        const floorColor = BuildingRenderer.getFloorColor(req.id);
        const snappedOffset = this.grid.snapToBoundary(offset, cidr);
        this.grid.allocate(offset, cidr, req.id, floorColor);

        // Save to history for undo - use snapped offset to match what's stored in grid
        this.placementHistory.push({
            offset: snappedOffset,
            cidr: cidr,
            reqIndex: req.id,
            points: 0 // Will be updated below
        });

        // Mark requirement as fulfilled
        req.fulfilled = true;
        const allocatedHosts = SubnetCalculator.cidrToHostCount(cidr);
        req.efficiency = Math.round((req.hosts / allocatedHosts) * 100);

        // Update building visualization
        BuildingRenderer.allocateFloor(req.id);

        // Calculate score
        const efficiency = req.efficiency;
        let points = 100 + Math.floor(efficiency * 2);

        if (efficiency >= 90) points += 50;
        else if (efficiency >= 70) points += 25;

        // Save points to history for undo
        this.placementHistory[this.placementHistory.length - 1].points = points;

        this.score += points;
        UI.updateScore(this.score);
        UI.flashScore();

        // Clear selection and update requirements list
        this.selectedRequirementIndex = null;
        this.renderRequirementsList();

        // Update progress
        const fulfilled = this.scenarioRequirements.filter(r => r.fulfilled).length;
        const total = this.scenarioRequirements.length;
        const avgEfficiency = this.calculateAverageEfficiency();

        UI.updateSubnetsProgress(fulfilled, total);
        UI.updateEfficiency(avgEfficiency);

        // Show feedback
        const message = efficiency >= 90 ? 'PERFECT!' :
                       efficiency >= 70 ? 'GREAT!' :
                       efficiency >= 50 ? 'GOOD' : 'OK';
        UI.showMessage(`${message} +${points}`, 1500, 'success');

        // Achievements
        Achievements.unlock('first_subnet');
        if (efficiency >= 90) {
            Achievements.updateProgress('perfect_10');
            Achievements.updateProgress('efficiency_expert');
        }

        // Check win condition
        if (this.scenarioRequirements.every(r => r.fulfilled)) {
            if (typeof Sounds !== 'undefined') {
                Sounds.play('levelComplete');
            }
            setTimeout(() => this.scenarioComplete(), 500);
        }
    },

    /**
     * Undo the last placement
     */
    undoLastPlacement() {
        if (this.placementHistory.length === 0) return;

        const lastPlacement = this.placementHistory.pop();

        // Remove from grid
        this.grid.deallocate(lastPlacement.offset);

        // Mark requirement as unfulfilled
        const req = this.scenarioRequirements[lastPlacement.reqIndex];
        if (req) {
            req.fulfilled = false;
            req.efficiency = 0;

            // Update building - mark floor as unallocated
            if (BuildingRenderer.floors[lastPlacement.reqIndex]) {
                BuildingRenderer.floors[lastPlacement.reqIndex].allocated = false;
                BuildingRenderer.allocatedFloors = BuildingRenderer.allocatedFloors.filter(
                    i => i !== lastPlacement.reqIndex
                );
                BuildingRenderer.render();
                BuildingRenderer.updateLegend();
            }
        }

        // Subtract points
        this.score = Math.max(0, this.score - lastPlacement.points);
        UI.updateScore(this.score);

        // Update UI
        this.renderRequirementsList();

        const fulfilled = this.scenarioRequirements.filter(r => r.fulfilled).length;
        const total = this.scenarioRequirements.length;
        const avgEfficiency = this.calculateAverageEfficiency();

        UI.updateSubnetsProgress(fulfilled, total);
        UI.updateEfficiency(avgEfficiency);

        // Clear feedback and show undo message
        this.hideFeedback();
        UI.showMessage('UNDO - Placement removed', 1500, 'info');
        if (typeof Sounds !== 'undefined') {
            Sounds.play('undo');
        }
    },

    /**
     * Find a matching requirement for the given CIDR
     */
    findMatchingRequirement(cidr) {
        const availableHosts = SubnetCalculator.cidrToHostCount(cidr);

        // Find unfulfilled requirements that fit
        const matching = this.scenarioRequirements
            .filter(r => !r.fulfilled && r.hosts <= availableHosts)
            .sort((a, b) => b.hosts - a.hosts); // Largest first

        return matching[0] || null;
    },

    /**
     * Calculate average efficiency of fulfilled requirements
     */
    calculateAverageEfficiency() {
        const fulfilled = this.scenarioRequirements.filter(r => r.fulfilled);
        if (fulfilled.length === 0) return 0;

        const total = fulfilled.reduce((sum, r) => sum + r.efficiency, 0);
        return Math.round(total / fulfilled.length);
    },

    /**
     * Scenario complete
     */
    scenarioComplete() {
        this.state = 'GAME_OVER';

        const efficiency = this.calculateAverageEfficiency();

        // Calculate stars
        let stars = 1;
        if (efficiency >= 90) stars = 3;
        else if (efficiency >= 70) stars = 2;

        // Update progress
        const previousStars = this.scenarioProgress[this.currentScenario.id] || 0;
        const isNewCompletion = previousStars === 0;

        if (stars > previousStars) {
            this.scenarioProgress[this.currentScenario.id] = stars;
            this.saveProgress();
        }

        // Final score
        this.score += stars * 500;
        this.score += efficiency * 10;

        // Record in stats
        if (typeof Stats !== 'undefined') {
            const perfectCount = this.scenarioRequirements.filter(r => r.efficiency >= 90).length;
            Stats.recordScenarioComplete(
                this.currentScenario.id,
                stars,
                efficiency,
                this.scenarioRequirements.length,
                perfectCount
            );
        }

        // Record to leaderboard
        if (typeof Leaderboard !== 'undefined') {
            Leaderboard.addScenarioScore(this.currentScenario.id, this.score, efficiency, stars);
        }

        // Achievements
        if (isNewCompletion) {
            Achievements.updateProgress('puzzle_solver');
        }
        if (stars === 3) {
            Achievements.unlock('three_stars');
        }

        const allScenarios = Scenarios.getAll();
        const all3Stars = allScenarios.every(s => this.scenarioProgress[s.id] >= 3);
        if (all3Stars) {
            Achievements.unlock('all_stars');
        }

        Achievements.checkDifficultyUnlocks();

        // Show game over
        document.getElementById('game-over-title').textContent = 'SCENARIO COMPLETE';
        document.getElementById('final-score').textContent = this.score.toLocaleString();
        document.getElementById('final-accuracy').style.display = 'none';
        document.getElementById('final-efficiency').textContent = `Efficiency: ${efficiency}%`;
        document.getElementById('final-efficiency').style.display = 'block';
        document.getElementById('new-high-score').classList.add('hidden');

        // Stars
        const starsDisplay = document.getElementById('stars-display');
        starsDisplay.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = `star ${i < stars ? 'earned' : 'empty'}`;
            star.textContent = i < stars ? '\u2605' : '\u2606';
            starsDisplay.appendChild(star);
        }
        starsDisplay.style.display = 'block';

        // Next level button
        const nextBtn = document.getElementById('btn-next-level');
        const nextScenario = this.getNextScenario();
        if (nextScenario) {
            nextBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.add('hidden');
        }

        UI.showOverlay('gameOver');
    },

    /**
     * Get next unlocked scenario
     */
    getNextScenario() {
        const all = Scenarios.getAll();
        const currentIndex = all.findIndex(s => s.id === this.currentScenario.id);
        if (currentIndex < all.length - 1) {
            return all[currentIndex + 1];
        }
        return null;
    },

    /**
     * Go to next scenario
     */
    nextScenario() {
        const next = this.getNextScenario();
        if (next) {
            UI.hideOverlay('gameOver');
            this.startScenario(next.id);
        }
    },

    /**
     * Render game
     */
    render() {
        if (this.grid) this.grid.render();
    },

    /**
     * Toggle pause
     */
    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            cancelAnimationFrame(this.animationFrame);
            UI.showOverlay('pauseMenu');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            UI.hideOverlay('pauseMenu');
            this.lastTime = performance.now();
            this.gameLoop();
        }
    },

    /**
     * Restart current game
     */
    restart() {
        UI.hideOverlay('pauseMenu');
        UI.hideOverlay('gameOver');
        cancelAnimationFrame(this.animationFrame);

        if (this.mode === 'speed') {
            this.startSpeedSubnet();
        } else if (this.mode === 'scenario' && this.currentScenario) {
            this.startScenario(this.currentScenario.id);
        }
    },

    /**
     * Quit to main menu
     */
    quit() {
        this.state = 'MENU';
        this.mode = null;
        cancelAnimationFrame(this.animationFrame);
        UI.hideOverlay('pauseMenu');
        UI.hideOverlay('gameOver');
        UI.showScreen('mainMenu');
    },

    /**
     * Save progress to localStorage
     */
    saveProgress() {
        const data = {
            highScore: this.highScore,
            scenarioProgress: this.scenarioProgress
        };
        localStorage.setItem('subnetProProgress', JSON.stringify(data));
    },

    /**
     * Load progress from localStorage
     */
    loadProgress() {
        try {
            const data = JSON.parse(localStorage.getItem('subnetProProgress'));
            if (data) {
                this.highScore = data.highScore || 0;
                this.scenarioProgress = data.scenarioProgress || {};
            }
        } catch (e) {
            // No saved progress found, using defaults
        }
    },

    /**
     * Reset scenario progress only
     */
    resetScenarioProgress() {
        this.scenarioProgress = {};
        this.saveProgress();
    },

    /**
     * Reset all progress including achievements and high scores
     */
    resetAllProgress() {
        // Reset game progress
        this.highScore = 0;
        this.scenarioProgress = {};
        this.saveProgress();

        // Reset achievements
        Achievements.unlocked = {};
        Achievements.progress = {};
        Achievements.save();

        // Reset settings to defaults
        Settings.difficulty = 'beginner';
        Settings.showHints = true;
        Settings.save();

        // Update UI
        UI.updateHighScore(0);
        UI.updateDifficultyDisplay('BEGINNER');
    },

    // ============================================
    // PACKET JOURNEY METHODS
    // ============================================

    /**
     * Show Packet Journey scenario select screen
     */
    showPacketJourneySelect() {
        if (typeof Sounds !== 'undefined') {
            Sounds.play('click');
        }
        UI.showScreen('packetJourneySelect');
    },

    /**
     * Setup Packet Journey scenario card handlers
     */
    setupPacketJourneyScenarioHandlers() {
        document.querySelectorAll('.pj-scenario-card').forEach(card => {
            card.addEventListener('click', () => {
                if (card.classList.contains('locked')) {
                    if (typeof Sounds !== 'undefined') {
                        Sounds.play('wrong');
                    }
                    return;
                }

                const scenarioId = card.dataset.scenario;
                this.startPacketJourney(scenarioId);
            });
        });
    },

    /**
     * Start a Packet Journey scenario
     */
    startPacketJourney(scenarioId) {
        if (typeof Sounds !== 'undefined') {
            Sounds.play('click');
        }

        UI.showScreen('packetJourneyScreen');

        // Initialize Packet Journey module if available
        if (typeof PacketJourney !== 'undefined') {
            PacketJourney.init();
            PacketJourney.startScenario(scenarioId);
        } else {
            console.error('PacketJourney module not loaded');
        }
    },

    /**
     * Quit Packet Journey and return to select screen
     */
    quitPacketJourney() {
        if (typeof Sounds !== 'undefined') {
            Sounds.play('click');
        }

        if (typeof PacketJourney !== 'undefined') {
            PacketJourney.stop();
        }

        UI.showScreen('packetJourneySelect');
    },

    /**
     * Continue to next step in Packet Journey
     */
    continuePacketJourney() {
        if (typeof PacketJourney !== 'undefined') {
            PacketJourney.nextStep();
        }
    },

    // ============================================
    // OSI TRAINER METHODS
    // ============================================

    /**
     * Start OSI Trainer
     */
    startOSITrainer() {
        if (typeof Sounds !== 'undefined') {
            Sounds.play('click');
        }

        UI.showScreen('osiTrainerScreen');

        if (typeof OSITrainer !== 'undefined') {
            OSITrainer.init();
            OSITrainer.onComplete = (results) => this.handleOSIComplete(results);
            OSITrainer.start();
        } else {
            console.error('OSITrainer module not loaded');
        }
    },

    /**
     * Quit OSI Trainer
     */
    quitOSITrainer() {
        if (typeof Sounds !== 'undefined') {
            Sounds.play('click');
        }

        if (typeof OSITrainer !== 'undefined') {
            OSITrainer.stop();
        }

        UI.showScreen('mainMenu');
    },

    /**
     * Handle OSI Trainer completion
     */
    handleOSIComplete(results) {
        // Update stats if available
        if (typeof Stats !== 'undefined') {
            Stats.trackOSI(results);
        }

        // Show game over overlay
        const finalScore = document.getElementById('final-score');
        const finalAccuracy = document.getElementById('final-accuracy');
        const gameOverTitle = document.getElementById('game-over-title');

        if (finalScore) finalScore.textContent = results.score;
        if (finalAccuracy) finalAccuracy.textContent = `Accuracy: ${results.accuracy}%`;
        if (gameOverTitle) gameOverTitle.textContent = 'OSI TRAINING COMPLETE';

        UI.showOverlay('gameOver');
    },

    // ========================================
    // BINARY MUNCHERS
    // ========================================

    /**
     * Start Binary Munchers game
     */
    startBinaryMunchers() {
        if (typeof Sounds !== 'undefined') {
            Sounds.play('click');
        }

        if (typeof BinaryMunchers !== 'undefined') {
            BinaryMunchers.init();
            BinaryMunchers.onGameOver = (results) => this.handleBinaryMunchersComplete(results);
            UI.showScreen('binaryMunchersScreen');
            // Small delay to ensure screen is rendered before starting
            setTimeout(() => {
                BinaryMunchers.start();
            }, 100);
        } else {
            console.error('BinaryMunchers module not loaded');
        }
    },

    /**
     * Quit Binary Munchers
     */
    quitBinaryMunchers() {
        if (typeof Sounds !== 'undefined') {
            Sounds.play('click');
        }

        if (typeof BinaryMunchers !== 'undefined') {
            BinaryMunchers.stop();
        }

        UI.showScreen('launchPanel');
    },

    /**
     * Handle Binary Munchers game over
     */
    handleBinaryMunchersComplete(results) {
        // Update stats if available
        if (typeof Stats !== 'undefined') {
            Stats.trackBinaryMunchers(results);
        }

        // Record to leaderboard
        if (typeof Leaderboard !== 'undefined') {
            Leaderboard.addBinaryMunchersScore(results.score, results.level);
        }

        // Show game over overlay
        const finalScore = document.getElementById('final-score');
        const finalAccuracy = document.getElementById('final-accuracy');
        const finalEfficiency = document.getElementById('final-efficiency');
        const gameOverTitle = document.getElementById('game-over-title');
        const starsDisplay = document.getElementById('stars-display');
        const nextLevelBtn = document.getElementById('btn-next-level');

        if (finalScore) finalScore.textContent = results.score;
        if (finalAccuracy) {
            finalAccuracy.textContent = `Level Reached: ${results.level}`;
            finalAccuracy.style.display = 'block';
        }
        if (finalEfficiency) finalEfficiency.style.display = 'none';
        if (gameOverTitle) gameOverTitle.textContent = 'GAME OVER';
        if (starsDisplay) starsDisplay.style.display = 'none';
        if (nextLevelBtn) nextLevelBtn.classList.add('hidden');

        UI.showOverlay('gameOver');
    }
};

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
