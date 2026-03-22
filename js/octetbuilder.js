/**
 * Octet Builder Module
 * Convert binary octets to build complete IP addresses
 *
 * Gameplay:
 * - See 4 binary octets (8 bits each)
 * - Type the decimal value for each octet
 * - Build complete IP addresses
 * - Binary Frog mascot hops between octets as you solve them
 *
 * @module OctetBuilder
 * @version 1.0
 */
'use strict';

const OctetBuilder = {
    // ========================================
    // STATE
    // ========================================
    active: false,
    currentOctet: 0,  // 0-3 (which octet we're on)
    currentRound: 0,
    totalRounds: 10,
    score: 0,
    streak: 0,
    maxStreak: 0,
    correctAnswers: 0,
    wrongAnswers: 0,

    // Current IP address challenge
    currentIP: [],  // Array of 4 decimal values
    userAnswers: [null, null, null, null],

    // Timer
    timeRemaining: 0,
    timerInterval: null,
    timePerOctet: 15, // seconds per octet

    // DOM elements cache
    elements: {},

    // Frog position for animation
    frogPosition: 0,

    // ========================================
    // IP ADDRESS POOLS (realistic addresses)
    // ========================================
    ipPools: {
        easy: [
            [192, 168, 1, 1],
            [10, 0, 0, 1],
            [172, 16, 0, 1],
            [192, 168, 0, 254],
            [10, 10, 10, 10],
            [8, 8, 8, 8],
            [1, 1, 1, 1],
            [255, 255, 255, 0],
            [192, 168, 100, 1],
            [10, 20, 30, 40]
        ],
        medium: [
            [192, 168, 137, 1],
            [172, 31, 255, 254],
            [10, 127, 64, 32],
            [255, 255, 240, 0],
            [192, 168, 99, 100],
            [172, 20, 128, 64],
            [10, 200, 150, 75],
            [255, 255, 192, 0],
            [192, 168, 50, 200],
            [172, 16, 224, 128]
        ],
        hard: [
            [192, 168, 173, 219],
            [172, 29, 187, 93],
            [10, 237, 156, 78],
            [255, 255, 248, 0],
            [192, 168, 213, 147],
            [172, 19, 139, 201],
            [10, 189, 243, 67],
            [255, 255, 252, 0],
            [192, 168, 91, 183],
            [172, 24, 167, 249]
        ]
    },

    // ========================================
    // INITIALIZATION
    // ========================================
    init() {
        this.cacheElements();
        this.bindEvents();
        console.log('[OctetBuilder] Initialized');
    },

    cacheElements() {
        this.elements = {
            screen: document.getElementById('octet-builder-screen'),
            startArea: document.getElementById('octet-start-area'),
            gameArea: document.getElementById('octet-game-area'),
            resultsArea: document.getElementById('octet-results-area'),

            // Stats display
            scoreDisplay: document.getElementById('octet-score'),
            roundDisplay: document.getElementById('octet-round'),
            streakDisplay: document.getElementById('octet-streak'),
            timerDisplay: document.getElementById('octet-timer'),

            // Binary octets display
            octets: [
                document.getElementById('octet-0'),
                document.getElementById('octet-1'),
                document.getElementById('octet-2'),
                document.getElementById('octet-3')
            ],

            // User input fields
            inputs: [
                document.getElementById('octet-input-0'),
                document.getElementById('octet-input-1'),
                document.getElementById('octet-input-2'),
                document.getElementById('octet-input-3')
            ],

            // Octet containers (for highlighting current)
            containers: [
                document.getElementById('octet-container-0'),
                document.getElementById('octet-container-1'),
                document.getElementById('octet-container-2'),
                document.getElementById('octet-container-3')
            ],

            // Frog mascot
            frog: document.getElementById('binary-frog'),

            // IP display
            ipPreview: document.getElementById('ip-preview'),

            // Results
            finalScore: document.getElementById('octet-final-score'),
            accuracy: document.getElementById('octet-accuracy'),
            bestStreak: document.getElementById('octet-best-streak'),
            gradeMessage: document.getElementById('octet-grade-message'),

            // Buttons
            startBtn: document.getElementById('btn-start-octet'),
            quitBtn: document.getElementById('btn-octet-quit'),
            restartBtn: document.getElementById('btn-restart-octet'),
            backBtn: document.getElementById('btn-octet-back')
        };
    },

    bindEvents() {
        // Start button
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => this.start());
        }

        // Quit button
        if (this.elements.quitBtn) {
            this.elements.quitBtn.addEventListener('click', () => this.quit());
        }

        // Restart button
        if (this.elements.restartBtn) {
            this.elements.restartBtn.addEventListener('click', () => this.start());
        }

        // Back button
        if (this.elements.backBtn) {
            this.elements.backBtn.addEventListener('click', () => this.quit());
        }

        // Input fields
        this.elements.inputs.forEach((input, index) => {
            if (input) {
                input.addEventListener('input', (e) => this.handleInput(e, index));
                input.addEventListener('keydown', (e) => this.handleKeydown(e, index));
            }
        });
    },

    // ========================================
    // GAME FLOW
    // ========================================
    start() {
        this.active = true;
        this.currentRound = 0;
        this.score = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.correctAnswers = 0;
        this.wrongAnswers = 0;

        // Show game area
        if (this.elements.startArea) this.elements.startArea.classList.add('hidden');
        if (this.elements.resultsArea) this.elements.resultsArea.classList.add('hidden');
        if (this.elements.gameArea) this.elements.gameArea.classList.remove('hidden');

        this.updateDisplay();
        this.nextRound();

        if (typeof Sounds !== 'undefined') {
            Sounds.play('gameStart');
        }
    },

    nextRound() {
        this.currentRound++;
        this.currentOctet = 0;
        this.userAnswers = [null, null, null, null];

        if (this.currentRound > this.totalRounds) {
            this.showResults();
            return;
        }

        // Select difficulty based on round
        let pool = 'easy';
        if (this.currentRound > 6) pool = 'hard';
        else if (this.currentRound > 3) pool = 'medium';

        // Pick random IP from pool
        const poolIPs = this.ipPools[pool];
        this.currentIP = [...poolIPs[Math.floor(Math.random() * poolIPs.length)]];

        // Display binary octets
        this.displayBinaryOctets();

        // Clear inputs
        this.elements.inputs.forEach(input => {
            if (input) {
                input.value = '';
                input.classList.remove('correct', 'incorrect');
                input.disabled = true;
            }
        });

        // Enable first input
        if (this.elements.inputs[0]) {
            this.elements.inputs[0].disabled = false;
            this.elements.inputs[0].focus();
        }

        // Highlight first octet
        this.highlightCurrentOctet();

        // Move frog to first position
        this.moveFrog(0);

        // Update IP preview
        this.updateIPPreview();

        // Start timer
        this.startTimer();

        // Update display
        this.updateDisplay();
    },

    displayBinaryOctets() {
        this.currentIP.forEach((decimal, index) => {
            const binary = decimal.toString(2).padStart(8, '0');
            if (this.elements.octets[index]) {
                // Display with styled bits
                let html = '';
                for (let i = 0; i < 8; i++) {
                    const bit = binary[i];
                    html += `<span class="bit bit-${bit}">${bit}</span>`;
                    if (i === 3) html += '<span class="bit-separator"></span>';
                }
                this.elements.octets[index].innerHTML = html;
            }
        });
    },

    highlightCurrentOctet() {
        this.elements.containers.forEach((container, index) => {
            if (container) {
                container.classList.remove('active', 'completed');
                if (index < this.currentOctet) {
                    container.classList.add('completed');
                } else if (index === this.currentOctet) {
                    container.classList.add('active');
                }
            }
        });
    },

    moveFrog(position) {
        this.frogPosition = position;
        if (this.elements.frog) {
            // Calculate position based on octet containers
            const container = this.elements.containers[position];
            if (container) {
                const rect = container.getBoundingClientRect();
                const parentRect = this.elements.frog.parentElement.getBoundingClientRect();
                const left = rect.left - parentRect.left + (rect.width / 2) - 30;
                this.elements.frog.style.left = `${left}px`;
                this.elements.frog.classList.add('hopping');
                setTimeout(() => {
                    this.elements.frog.classList.remove('hopping');
                }, 300);
            }
        }
    },

    updateIPPreview() {
        if (this.elements.ipPreview) {
            const parts = this.userAnswers.map((val, i) => {
                if (val !== null) return val;
                return '___';
            });
            this.elements.ipPreview.textContent = parts.join('.');
        }
    },

    startTimer() {
        this.stopTimer();
        this.timeRemaining = this.timePerOctet;
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            if (this.timeRemaining <= 0) {
                this.handleTimeout();
            }
        }, 1000);
    },

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    updateTimerDisplay() {
        if (this.elements.timerDisplay) {
            this.elements.timerDisplay.textContent = this.timeRemaining;

            // Add warning class when low
            if (this.timeRemaining <= 5) {
                this.elements.timerDisplay.classList.add('warning');
            } else {
                this.elements.timerDisplay.classList.remove('warning');
            }
        }
    },

    handleTimeout() {
        // Mark current octet as wrong
        this.handleWrongAnswer();
    },

    // ========================================
    // INPUT HANDLING
    // ========================================
    handleInput(e, index) {
        const input = e.target;
        let value = input.value.replace(/[^0-9]/g, '');

        // Limit to 3 digits (max 255)
        if (value.length > 3) {
            value = value.slice(0, 3);
        }

        // Clamp to 0-255
        if (parseInt(value) > 255) {
            value = '255';
        }

        input.value = value;
    },

    handleKeydown(e, index) {
        if (e.key === 'Enter') {
            this.submitAnswer(index);
        } else if (e.key === 'Tab') {
            // Let tab work naturally for accessibility
        }
    },

    submitAnswer(index) {
        if (index !== this.currentOctet) return;

        const input = this.elements.inputs[index];
        if (!input) return;

        const userValue = parseInt(input.value) || 0;
        const correctValue = this.currentIP[index];

        this.userAnswers[index] = userValue;

        if (userValue === correctValue) {
            this.handleCorrectAnswer(index);
        } else {
            this.handleWrongAnswer(index, correctValue);
        }
    },

    handleCorrectAnswer(index) {
        const input = this.elements.inputs[index];
        input.classList.add('correct');
        input.disabled = true;

        // Update score
        const timeBonus = Math.floor(this.timeRemaining * 10);
        const streakBonus = this.streak * 50;
        const pointsEarned = 100 + timeBonus + streakBonus;
        this.score += pointsEarned;
        this.streak++;
        this.maxStreak = Math.max(this.maxStreak, this.streak);
        this.correctAnswers++;

        // Sound
        if (typeof Sounds !== 'undefined') {
            Sounds.play('correct');
        }

        // Update display
        this.updateDisplay();
        this.updateIPPreview();

        // Move to next octet or next round
        this.currentOctet++;

        if (this.currentOctet >= 4) {
            // Completed all 4 octets!
            this.stopTimer();
            this.celebrateIPComplete();
            setTimeout(() => this.nextRound(), 1500);
        } else {
            // Move to next octet
            this.highlightCurrentOctet();
            this.moveFrog(this.currentOctet);
            this.startTimer();

            const nextInput = this.elements.inputs[this.currentOctet];
            if (nextInput) {
                nextInput.disabled = false;
                nextInput.focus();
            }
        }
    },

    handleWrongAnswer(index, correctValue) {
        if (index === undefined) index = this.currentOctet;
        if (correctValue === undefined) correctValue = this.currentIP[index];

        const input = this.elements.inputs[index];
        if (input) {
            input.classList.add('incorrect');
            input.value = correctValue; // Show correct answer
            input.disabled = true;
        }

        this.userAnswers[index] = correctValue;
        this.streak = 0;
        this.wrongAnswers++;

        // Sound
        if (typeof Sounds !== 'undefined') {
            Sounds.play('wrong');
        }

        // Update display
        this.updateDisplay();
        this.updateIPPreview();

        // Frog sad animation
        if (this.elements.frog) {
            this.elements.frog.classList.add('sad');
            setTimeout(() => {
                this.elements.frog.classList.remove('sad');
            }, 500);
        }

        // Move to next octet
        this.currentOctet++;

        if (this.currentOctet >= 4) {
            this.stopTimer();
            setTimeout(() => this.nextRound(), 1500);
        } else {
            this.highlightCurrentOctet();
            this.moveFrog(this.currentOctet);
            this.startTimer();

            const nextInput = this.elements.inputs[this.currentOctet];
            if (nextInput) {
                nextInput.disabled = false;
                nextInput.focus();
            }
        }
    },

    celebrateIPComplete() {
        // Flash the IP preview
        if (this.elements.ipPreview) {
            this.elements.ipPreview.classList.add('complete');
            setTimeout(() => {
                this.elements.ipPreview.classList.remove('complete');
            }, 1000);
        }

        // Frog celebration
        if (this.elements.frog) {
            this.elements.frog.classList.add('celebrating');
            setTimeout(() => {
                this.elements.frog.classList.remove('celebrating');
            }, 1000);
        }

        // Bonus points for completing IP
        this.score += 500;
        this.updateDisplay();

        if (typeof Sounds !== 'undefined') {
            Sounds.play('levelComplete');
        }
    },

    // ========================================
    // DISPLAY UPDATES
    // ========================================
    updateDisplay() {
        if (this.elements.scoreDisplay) {
            this.elements.scoreDisplay.textContent = this.score;
        }
        if (this.elements.roundDisplay) {
            this.elements.roundDisplay.textContent = `${this.currentRound}/${this.totalRounds}`;
        }
        if (this.elements.streakDisplay) {
            this.elements.streakDisplay.textContent = `${this.streak}x`;
        }
    },

    // ========================================
    // RESULTS
    // ========================================
    showResults() {
        this.active = false;
        this.stopTimer();

        if (this.elements.gameArea) this.elements.gameArea.classList.add('hidden');
        if (this.elements.resultsArea) this.elements.resultsArea.classList.remove('hidden');

        const totalAttempts = this.correctAnswers + this.wrongAnswers;
        const accuracy = totalAttempts > 0 ? Math.round((this.correctAnswers / totalAttempts) * 100) : 0;

        if (this.elements.finalScore) {
            this.elements.finalScore.textContent = this.score;
        }
        if (this.elements.accuracy) {
            this.elements.accuracy.textContent = `${accuracy}%`;
        }
        if (this.elements.bestStreak) {
            this.elements.bestStreak.textContent = `${this.maxStreak}x`;
        }

        // Grade message
        let message = '';
        if (accuracy >= 90) {
            message = "IP Master! You're ready to subnet any network!";
        } else if (accuracy >= 80) {
            message = "Great work! Binary conversion is becoming second nature.";
        } else if (accuracy >= 70) {
            message = "Good progress! Keep practicing those octets.";
        } else if (accuracy >= 60) {
            message = "Getting there! Focus on the tricky bit patterns.";
        } else {
            message = "Keep practicing! Binary to decimal takes time to master.";
        }

        if (this.elements.gradeMessage) {
            this.elements.gradeMessage.textContent = message;
        }

        // Save stats
        if (typeof Stats !== 'undefined') {
            Stats.recordOctetBuilder({
                score: this.score,
                accuracy: accuracy,
                streak: this.maxStreak
            });
        }

        if (typeof Sounds !== 'undefined') {
            Sounds.play('gameOver');
        }
    },

    // ========================================
    // QUIT / CLEANUP
    // ========================================
    quit() {
        this.active = false;
        this.stopTimer();

        // Switch back to launch panel
        if (typeof UI !== 'undefined') {
            UI.showScreen('launchPanel');
        }
    },

    // ========================================
    // BINARY FROG HELPER
    // ========================================
    createFrogSVG() {
        // ASCII-style frog made of 1s and 0s
        return `
        <div class="binary-frog-body">
            <div class="frog-row">  1 0 1  </div>
            <div class="frog-row">1 0 0 0 1</div>
            <div class="frog-row"> 0 1 1 0 </div>
            <div class="frog-row">  1 0 1  </div>
        </div>
        `;
    }
};

// Auto-initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => OctetBuilder.init());
} else {
    OctetBuilder.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OctetBuilder;
}
