/**
 * Daily Challenge Module
 * A special daily puzzle with unique rewards and leaderboard
 */

const DailyChallenge = {
    // Challenge state
    currentChallenge: null,
    challengeDate: null,
    isActive: false,

    // Challenge results
    score: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    startTime: null,
    timeElapsed: 0,

    // UI Elements
    elements: {},

    // Callbacks
    onComplete: null,

    /**
     * Initialize daily challenge
     */
    init() {
        this.elements = {
            container: document.getElementById('daily-game-area'),
            dateDisplay: document.getElementById('daily-date'),
            timerDisplay: document.getElementById('daily-timer-display'),
            scoreDisplay: document.getElementById('daily-score'),
            progressDisplay: document.getElementById('daily-progress-text'),
            progressFill: document.getElementById('daily-progress-fill'),
            questionArea: document.getElementById('daily-question'),
            promptDisplay: document.getElementById('daily-prompt'),
            valueDisplay: document.getElementById('daily-value'),
            optionsArea: document.getElementById('daily-options'),
            feedbackArea: document.getElementById('daily-feedback'),
            rewardDisplay: document.getElementById('daily-reward'),
            streakDisplay: document.getElementById('daily-streak-count')
        };

        // Setup keyboard navigation
        this.setupKeyboardNav();
    },

    /**
     * Setup keyboard navigation for accessibility
     */
    setupKeyboardNav() {
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;

            const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3 };
            if (keyMap[e.key] !== undefined) {
                const buttons = this.elements.optionsArea?.querySelectorAll('.daily-option');
                if (buttons && buttons[keyMap[e.key]] && !buttons[keyMap[e.key]].disabled) {
                    buttons[keyMap[e.key]].click();
                }
            }
        });
    },

    /**
     * Generate today's challenge seed
     * Uses date to ensure same challenge for everyone on same day
     */
    getDailySeed() {
        const today = new Date();
        const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        let hash = 0;
        for (let i = 0; i < dateString.length; i++) {
            const char = dateString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    },

    /**
     * Seeded random number generator
     */
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    },

    /**
     * Generate today's challenge
     */
    generateChallenge() {
        const seed = this.getDailySeed();
        const today = new Date();
        this.challengeDate = today.toISOString().split('T')[0];

        // Create a deterministic challenge based on the seed
        const categories = [
            'hosts_to_cidr', 'cidr_to_hosts', 'subnet_mask',
            'network_class', 'binary_bits', 'network_address',
            'broadcast', 'first_host', 'last_host'
        ];

        // Generate 15 questions for daily challenge
        const questions = [];
        for (let i = 0; i < 15; i++) {
            const catIndex = Math.floor(this.seededRandom(seed + i) * categories.length);
            const category = categories[catIndex];
            questions.push({
                index: i,
                category: category,
                seed: seed + i * 100
            });
        }

        // Calculate difficulty modifier based on day of week
        // Weekend challenges are slightly harder
        const dayOfWeek = today.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        this.currentChallenge = {
            date: this.challengeDate,
            questions: questions,
            totalQuestions: 15,
            timeLimit: isWeekend ? 180 : 240, // 3 or 4 minutes
            bonusMultiplier: isWeekend ? 1.5 : 1.0,
            theme: this.getDailyTheme(dayOfWeek),
            rewards: this.calculatePotentialRewards(isWeekend)
        };

        return this.currentChallenge;
    },

    /**
     * Get daily theme based on day of week
     */
    getDailyTheme(dayOfWeek) {
        const themes = {
            0: { name: "Sunday Subnet Sprint", color: "#ff6b9d", icon: "S" },
            1: { name: "CIDR Monday", color: "#00d4ff", icon: "M" },
            2: { name: "Binary Tuesday", color: "#ffd400", icon: "T" },
            3: { name: "Wildcard Wednesday", color: "#00ff9d", icon: "W" },
            4: { name: "Throughput Thursday", color: "#ff9d00", icon: "T" },
            5: { name: "Full Stack Friday", color: "#9d00ff", icon: "F" },
            6: { name: "Saturday Challenge", color: "#ff4444", icon: "S" }
        };
        return themes[dayOfWeek];
    },

    /**
     * Calculate potential rewards
     */
    calculatePotentialRewards(isWeekend) {
        const baseReward = 500;
        const perfectBonus = 1000;
        const speedBonus = 500;

        return {
            base: Math.floor(baseReward * (isWeekend ? 1.5 : 1)),
            perfect: Math.floor(perfectBonus * (isWeekend ? 1.5 : 1)),
            speed: Math.floor(speedBonus * (isWeekend ? 1.5 : 1)),
            streakBonus: 100 // Per day of streak
        };
    },

    /**
     * Start the daily challenge
     */
    start() {
        // Check if Stats module is available
        if (typeof Stats === 'undefined') {
            return { error: 'stats_unavailable', message: 'Statistics module not loaded.' };
        }

        // Check if already completed today
        if (Stats.isDailyChallengeCompletedToday()) {
            return { error: 'already_completed', message: 'You have already completed today\'s challenge!' };
        }

        this.generateChallenge();
        this.isActive = true;
        this.score = 0;
        this.questionsAnswered = 0;
        this.correctAnswers = 0;
        this.startTime = Date.now();
        this.timeElapsed = 0;

        this.updateUI();
        this.startTimer();
        this.showQuestion(0);

        // Play start sound
        if (typeof Sounds !== 'undefined') {
            Sounds.play('dailyStart');
        }

        return { success: true };
    },

    /**
     * Start the challenge timer
     */
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (!this.isActive) {
                clearInterval(this.timerInterval);
                return;
            }

            this.timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const remaining = Math.max(0, this.currentChallenge.timeLimit - this.timeElapsed);

            this.updateTimerDisplay(remaining);

            if (remaining <= 0) {
                this.endChallenge(true);
            }
        }, 1000);
    },

    /**
     * Update timer display
     */
    updateTimerDisplay(seconds) {
        if (this.elements.timerDisplay) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            this.elements.timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

            // Warning colors
            if (seconds <= 30) {
                this.elements.timerDisplay.classList.add('danger');
                // Play warning sound at 30 and 10 seconds
                if (typeof Sounds !== 'undefined' && (seconds === 30 || seconds === 10)) {
                    Sounds.play('timeWarning');
                }
            } else if (seconds <= 60) {
                this.elements.timerDisplay.classList.add('warning');
                this.elements.timerDisplay.classList.remove('danger');
            }
        }
    },

    /**
     * Show a specific question
     */
    showQuestion(index) {
        if (index >= this.currentChallenge.questions.length) {
            this.endChallenge(false);
            return;
        }

        const questionData = this.currentChallenge.questions[index];
        const question = this.generateQuestionFromSeed(questionData.category, questionData.seed);

        this.currentQuestion = question;
        this.currentQuestionIndex = index;
        this.questionStartTime = Date.now();

        this.renderQuestion(question, index);
    },

    /**
     * Generate a deterministic question from seed
     */
    generateQuestionFromSeed(category, seed) {
        // Use SpeedSubnet's question generators with seeded values
        const random = () => this.seededRandom(seed++);

        switch (category) {
            case 'hosts_to_cidr':
                return this.generateHostsToCidrSeeded(random);
            case 'cidr_to_hosts':
                return this.generateCidrToHostsSeeded(random);
            case 'subnet_mask':
                return this.generateSubnetMaskSeeded(random);
            case 'network_class':
                return this.generateNetworkClassSeeded(random);
            case 'binary_bits':
                return this.generateBinaryBitsSeeded(random);
            case 'network_address':
                return this.generateNetworkAddressSeeded(random);
            case 'broadcast':
                return this.generateBroadcastSeeded(random);
            case 'first_host':
                return this.generateFirstHostSeeded(random);
            case 'last_host':
                return this.generateLastHostSeeded(random);
            default:
                return this.generateHostsToCidrSeeded(random);
        }
    },

    /**
     * Seeded question generators (similar to SpeedSubnet but deterministic)
     */
    generateHostsToCidrSeeded(random) {
        const hostOptions = [5, 10, 20, 33, 50, 75, 100, 150, 200, 300];
        const hosts = hostOptions[Math.floor(random() * hostOptions.length)];
        const answer = SubnetCalculator.hostCountToCidr(hosts);
        const options = this.generateCidrOptionsSeeded(answer, random);

        return {
            category: 'hosts_to_cidr',
            prompt: "How many hosts?",
            display: hosts.toString(),
            subtext: "Select minimum CIDR",
            answer: answer,
            answerDisplay: `/${answer}`,
            options: options.map(c => ({ value: c, display: `/${c}` }))
        };
    },

    generateCidrToHostsSeeded(random) {
        const cidrOptions = [24, 25, 26, 27, 28, 29, 30];
        const cidr = cidrOptions[Math.floor(random() * cidrOptions.length)];
        const answer = SubnetCalculator.cidrToHostCount(cidr);

        const wrongAnswers = [
            answer + 2, answer - 2,
            Math.pow(2, 32 - cidr),
            answer * 2, Math.floor(answer / 2),
            answer + 10, answer + 20
        ].filter(a => a > 0 && a !== answer);

        const options = this.ensureUniqueOptions(answer, wrongAnswers, random);

        return {
            category: 'cidr_to_hosts',
            prompt: "How many usable hosts?",
            display: `/${cidr}`,
            subtext: "Calculate usable host addresses",
            answer: answer,
            answerDisplay: answer.toString(),
            options: options.map(h => ({ value: h, display: h.toString() }))
        };
    },

    generateSubnetMaskSeeded(random) {
        const masks = {
            24: '255.255.255.0',
            25: '255.255.255.128',
            26: '255.255.255.192',
            27: '255.255.255.224',
            28: '255.255.255.240',
            29: '255.255.255.248',
            30: '255.255.255.252'
        };

        const cidrs = Object.keys(masks);
        const cidr = cidrs[Math.floor(random() * cidrs.length)];
        const answer = masks[cidr];
        const allMasks = Object.values(masks);
        const wrongMasks = allMasks.filter(m => m !== answer);
        const options = this.ensureUniqueOptions(answer, wrongMasks, random);

        return {
            category: 'subnet_mask',
            prompt: "What is the subnet mask?",
            display: `/${cidr}`,
            subtext: "Select the correct mask",
            answer: answer,
            answerDisplay: answer,
            options: options.map(m => ({ value: m, display: m }))
        };
    },

    generateNetworkClassSeeded(random) {
        const examples = [
            { ip: '10.0.0.1', class: 'A' },
            { ip: '45.67.89.1', class: 'A' },
            { ip: '128.0.0.1', class: 'B' },
            { ip: '172.16.0.1', class: 'B' },
            { ip: '192.168.1.1', class: 'C' },
            { ip: '200.100.50.1', class: 'C' }
        ];

        const example = examples[Math.floor(random() * examples.length)];
        const options = ['A', 'B', 'C', 'D'];

        return {
            category: 'network_class',
            prompt: "What network class?",
            display: example.ip,
            subtext: "Identify the IP class",
            answer: example.class,
            answerDisplay: `Class ${example.class}`,
            options: options.map(c => ({ value: c, display: `Class ${c}` }))
        };
    },

    generateBinaryBitsSeeded(random) {
        const scenarios = [
            { hosts: 2, bits: 2 },
            { hosts: 6, bits: 3 },
            { hosts: 14, bits: 4 },
            { hosts: 30, bits: 5 },
            { hosts: 62, bits: 6 },
            { hosts: 126, bits: 7 }
        ];

        const scenario = scenarios[Math.floor(random() * scenarios.length)];
        const wrongBits = [
            scenario.bits - 1, scenario.bits + 1,
            scenario.bits + 2, scenario.bits - 2,
            scenario.bits + 3
        ].filter(b => b > 0 && b <= 8);
        const options = this.ensureUniqueOptions(scenario.bits, wrongBits, random);

        return {
            category: 'binary_bits',
            prompt: "Host bits needed?",
            display: `${scenario.hosts} hosts`,
            subtext: "How many bits for the host portion?",
            answer: scenario.bits,
            answerDisplay: `${scenario.bits} bits`,
            options: options.map(b => ({ value: b, display: `${b} bits` }))
        };
    },

    generateNetworkAddressSeeded(random) {
        const scenarios = [
            { ip: '192.168.1.50', cidr: 24, network: '192.168.1.0' },
            { ip: '192.168.1.150', cidr: 25, network: '192.168.1.128' },
            { ip: '10.0.0.45', cidr: 26, network: '10.0.0.0' },
            { ip: '172.16.5.200', cidr: 27, network: '172.16.5.192' }
        ];

        const scenario = scenarios[Math.floor(random() * scenarios.length)];
        const parts = scenario.network.split('.').map(Number);
        const blockSize = Math.pow(2, 32 - scenario.cidr);
        const wrongNets = [
            scenario.ip,
            `${parts[0]}.${parts[1]}.${parts[2]}.${(parts[3] + blockSize) % 256}`,
            `${parts[0]}.${parts[1]}.${parts[2]}.${(parts[3] + blockSize * 2) % 256}`,
            `${parts[0]}.${parts[1]}.${parts[2]}.${Math.max(0, parts[3] - blockSize)}`
        ];

        const options = this.ensureUniqueOptions(scenario.network, wrongNets, random);

        return {
            category: 'network_address',
            prompt: "What is the network address?",
            display: `${scenario.ip}/${scenario.cidr}`,
            subtext: "Find the network ID",
            answer: scenario.network,
            answerDisplay: scenario.network,
            options: options.map(n => ({ value: n, display: n }))
        };
    },

    generateBroadcastSeeded(random) {
        const scenarios = [
            { network: '192.168.1.0', cidr: 24, broadcast: '192.168.1.255' },
            { network: '192.168.1.0', cidr: 25, broadcast: '192.168.1.127' },
            { network: '10.0.0.0', cidr: 26, broadcast: '10.0.0.63' },
            { network: '172.16.5.192', cidr: 27, broadcast: '172.16.5.223' }
        ];

        const scenario = scenarios[Math.floor(random() * scenarios.length)];
        const parts = scenario.broadcast.split('.').map(Number);
        const blockSize = Math.pow(2, 32 - scenario.cidr);
        const wrongBCs = [
            scenario.network,
            `${parts[0]}.${parts[1]}.${parts[2]}.${(parts[3] + blockSize) % 256}`,
            `${parts[0]}.${parts[1]}.${parts[2]}.${Math.max(0, parts[3] - blockSize)}`,
            `${parts[0]}.${parts[1]}.${parts[2]}.255`,
            `${parts[0]}.${parts[1]}.${parts[2]}.0`
        ];

        const options = this.ensureUniqueOptions(scenario.broadcast, wrongBCs, random);

        return {
            category: 'broadcast',
            prompt: "What is the broadcast address?",
            display: `${scenario.network}/${scenario.cidr}`,
            subtext: "Find the broadcast address",
            answer: scenario.broadcast,
            answerDisplay: scenario.broadcast,
            options: options.map(b => ({ value: b, display: b }))
        };
    },

    generateFirstHostSeeded(random) {
        const scenarios = [
            { network: '192.168.1.0', cidr: 24, first: '192.168.1.1' },
            { network: '192.168.1.128', cidr: 25, first: '192.168.1.129' },
            { network: '10.0.0.64', cidr: 26, first: '10.0.0.65' }
        ];

        const scenario = scenarios[Math.floor(random() * scenarios.length)];
        const prefix = scenario.first.split('.').slice(0, 3).join('.');
        const lastOctet = parseInt(scenario.first.split('.')[3]);
        const wrongAnswers = [
            scenario.network,
            `${prefix}.${lastOctet + 1}`,
            `${prefix}.${lastOctet + 2}`,
            `${prefix}.${lastOctet + 3}`,
            `${prefix}.${Math.max(0, lastOctet - 1)}`
        ];

        const options = this.ensureUniqueOptions(scenario.first, wrongAnswers, random);

        return {
            category: 'first_host',
            prompt: "First usable host IP?",
            display: `${scenario.network}/${scenario.cidr}`,
            subtext: "Network address + 1",
            answer: scenario.first,
            answerDisplay: scenario.first,
            options: options.map(h => ({ value: h, display: h }))
        };
    },

    generateLastHostSeeded(random) {
        const scenarios = [
            { network: '192.168.1.0', cidr: 24, last: '192.168.1.254' },
            { network: '192.168.1.128', cidr: 25, last: '192.168.1.254' },
            { network: '10.0.0.64', cidr: 26, last: '10.0.0.126' }
        ];

        const scenario = scenarios[Math.floor(random() * scenarios.length)];
        const prefix = scenario.last.split('.').slice(0, 3).join('.');
        const lastOctet = parseInt(scenario.last.split('.')[3]);
        const wrongAnswers = [
            `${prefix}.${Math.min(255, lastOctet + 1)}`,
            `${prefix}.${Math.max(0, lastOctet - 1)}`,
            `${prefix}.${Math.max(0, lastOctet - 2)}`,
            `${prefix}.255`,
            `${prefix}.0`
        ];

        const options = this.ensureUniqueOptions(scenario.last, wrongAnswers, random);

        return {
            category: 'last_host',
            prompt: "Last usable host IP?",
            display: `${scenario.network}/${scenario.cidr}`,
            subtext: "Broadcast address - 1",
            answer: scenario.last,
            answerDisplay: scenario.last,
            options: options.map(h => ({ value: h, display: h }))
        };
    },

    /**
     * Generate CIDR options with seeded randomness
     */
    generateCidrOptionsSeeded(correct, random) {
        const nearby = [correct - 2, correct - 1, correct + 1, correct + 2, correct + 3, correct - 3]
            .filter(c => c >= 20 && c <= 30 && c !== correct);
        return this.ensureUniqueOptions(correct, nearby, random);
    },

    /**
     * Shuffle array with seeded random
     */
    shuffleWithSeed(array, random) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    },

    /**
     * Ensure exactly 4 unique options with answer included
     */
    ensureUniqueOptions(answer, wrongOptions, random) {
        const seen = new Set([String(answer)]);
        const options = [answer];

        for (const opt of wrongOptions) {
            if (options.length >= 4) break;
            const key = String(opt);
            if (!seen.has(key)) {
                seen.add(key);
                options.push(opt);
            }
        }

        // Generate fallbacks if needed
        let fallbackIdx = 1;
        while (options.length < 4 && fallbackIdx < 50) {
            let fallback;
            if (typeof answer === 'number') {
                fallback = answer + (fallbackIdx * 13);
            } else if (String(answer).includes('.')) {
                const parts = String(answer).split('.');
                if (parts.length === 4) {
                    const newOctet = (parseInt(parts[3]) + fallbackIdx * 17) % 256;
                    fallback = `${parts[0]}.${parts[1]}.${parts[2]}.${newOctet}`;
                } else {
                    fallback = answer + fallbackIdx;
                }
            } else {
                fallback = answer + fallbackIdx;
            }
            const key = String(fallback);
            if (!seen.has(key)) {
                seen.add(key);
                options.push(fallback);
            }
            fallbackIdx++;
        }

        return this.shuffleWithSeed(options.slice(0, 4), random);
    },

    /**
     * Render the current question
     */
    renderQuestion(question, index) {
        // Update progress text and bar
        if (this.elements.progressDisplay) {
            this.elements.progressDisplay.textContent = `Question ${index + 1}/${this.currentChallenge.totalQuestions}`;
        }
        if (this.elements.progressFill) {
            const progress = ((index) / this.currentChallenge.totalQuestions) * 100;
            this.elements.progressFill.style.width = progress + '%';
        }

        // Display question prompt and value
        if (this.elements.promptDisplay) {
            this.elements.promptDisplay.textContent = question.prompt;
        }
        if (this.elements.valueDisplay) {
            // Wrap in span with white-space:pre to prevent line breaks on IP addresses
            this.elements.valueDisplay.innerHTML = `<span style="white-space:pre;display:inline-block">${question.display}</span>`;
        }

        // Display options
        if (this.elements.optionsArea) {
            this.elements.optionsArea.innerHTML = '';
            question.options.forEach((opt, i) => {
                const btn = document.createElement('button');
                btn.className = 'daily-option';
                btn.textContent = opt.display;
                btn.dataset.value = opt.value;
                btn.dataset.key = (i + 1).toString(); // For keyboard hint display
                btn.setAttribute('aria-label', `Option ${i + 1}: ${opt.display}`);
                btn.addEventListener('click', () => this.selectAnswer(opt.value));
                this.elements.optionsArea.appendChild(btn);
            });
        }
    },

    /**
     * Handle answer selection
     */
    selectAnswer(value) {
        if (!this.isActive || !this.currentQuestion) return;

        const isCorrect = value === this.currentQuestion.answer;
        const answerTime = Date.now() - this.questionStartTime;

        this.questionsAnswered++;
        if (isCorrect) {
            this.correctAnswers++;
            // Bonus points for fast answers
            let points = 100;
            if (answerTime < 3000) points += 50;
            else if (answerTime < 5000) points += 25;
            this.score += points;

            // Play correct sound
            if (typeof Sounds !== 'undefined') {
                Sounds.play('correct');
            }
        } else {
            // Play wrong sound
            if (typeof Sounds !== 'undefined') {
                Sounds.play('wrong');
            }
        }

        // Update UI
        this.showAnswerFeedback(isCorrect, value);

        // Update score display
        if (this.elements.scoreDisplay) {
            this.elements.scoreDisplay.textContent = this.score.toLocaleString();
        }

        // Next question after delay
        setTimeout(() => {
            this.showQuestion(this.currentQuestionIndex + 1);
        }, isCorrect ? 800 : 1500);
    },

    /**
     * Show answer feedback
     */
    showAnswerFeedback(isCorrect, selectedValue) {
        if (!this.elements.optionsArea) return;

        const buttons = this.elements.optionsArea.querySelectorAll('.daily-option');
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.value == this.currentQuestion.answer) {
                btn.classList.add('correct');
            } else if (btn.dataset.value == selectedValue && !isCorrect) {
                btn.classList.add('wrong');
            }
        });
    },

    /**
     * Update UI elements
     */
    updateUI() {
        if (this.elements.dateDisplay) {
            const theme = this.currentChallenge.theme;
            this.elements.dateDisplay.innerHTML = `
                <span class="theme-icon" style="color: ${theme.color}">${theme.icon}</span>
                ${theme.name}
            `;
        }

        if (this.elements.scoreDisplay) {
            this.elements.scoreDisplay.textContent = this.score.toLocaleString();
        }

        if (this.elements.streakDisplay && typeof Stats !== 'undefined') {
            const streak = Stats.data.dailyChallenge.currentStreak;
            this.elements.streakDisplay.textContent = streak.toString();
        }
    },

    /**
     * End the challenge
     */
    endChallenge(timedOut = false) {
        this.isActive = false;
        clearInterval(this.timerInterval);

        // Calculate final score with bonuses
        const accuracy = this.questionsAnswered > 0
            ? Math.round((this.correctAnswers / this.questionsAnswered) * 100)
            : 0;

        const rewards = this.currentChallenge.rewards;
        let finalScore = this.score;

        // Perfect bonus
        if (this.correctAnswers === this.currentChallenge.totalQuestions) {
            finalScore += rewards.perfect;
        }

        // Speed bonus (finished with time remaining)
        if (!timedOut && this.timeElapsed < this.currentChallenge.timeLimit * 0.7) {
            finalScore += rewards.speed;
        }

        // Streak bonus
        const currentStreak = typeof Stats !== 'undefined' ? Stats.data.dailyChallenge.currentStreak : 0;
        finalScore += currentStreak * rewards.streakBonus;

        // Apply multiplier
        finalScore = Math.floor(finalScore * this.currentChallenge.bonusMultiplier);

        // Record in stats
        if (typeof Stats !== 'undefined') {
            Stats.recordDailyChallenge(finalScore, new Date());
        }

        // Trigger achievements
        if (typeof Achievements !== 'undefined') {
            Achievements.unlock('daily_first');
            if (this.correctAnswers === this.currentChallenge.totalQuestions) {
                Achievements.unlock('daily_perfect');
            }
            if (typeof Stats !== 'undefined') {
                if (Stats.data.dailyChallenge.currentStreak >= 7) {
                    Achievements.unlock('daily_streak_7');
                }
                if (Stats.data.dailyChallenge.currentStreak >= 30) {
                    Achievements.unlock('daily_streak_30');
                }
            }
        }

        // Show results
        const results = {
            score: finalScore,
            baseScore: this.score,
            correctAnswers: this.correctAnswers,
            totalQuestions: this.currentChallenge.totalQuestions,
            accuracy: accuracy,
            timeElapsed: this.timeElapsed,
            timedOut: timedOut,
            streak: typeof Stats !== 'undefined' ? Stats.data.dailyChallenge.currentStreak : 0,
            perfectBonus: this.correctAnswers === this.currentChallenge.totalQuestions ? rewards.perfect : 0,
            speedBonus: (!timedOut && this.timeElapsed < this.currentChallenge.timeLimit * 0.7) ? rewards.speed : 0,
            streakBonus: currentStreak * rewards.streakBonus
        };

        if (this.onComplete) {
            this.onComplete(results);
        }

        return results;
    },

    /**
     * Get today's challenge info without starting
     */
    getTodayInfo() {
        const challenge = this.generateChallenge();
        const completed = typeof Stats !== 'undefined' ? Stats.isDailyChallengeCompletedToday() : false;
        const streak = typeof Stats !== 'undefined' ? Stats.data.dailyChallenge.currentStreak : 0;

        return {
            theme: challenge.theme,
            totalQuestions: challenge.totalQuestions,
            timeLimit: challenge.timeLimit,
            bonusMultiplier: challenge.bonusMultiplier,
            rewards: challenge.rewards,
            completed: completed,
            streak: streak
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DailyChallenge;
}
