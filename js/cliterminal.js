/**
 * CLI Terminal Simulator Module
 * Simulated Cisco IOS terminal for command typing practice
 *
 * Features:
 * - Authentic IOS prompts (Router>, Router#, Router(config)#)
 * - Command autocompletion hints
 * - Simulated IOS output responses
 * - Progressive difficulty with various command modes
 *
 * @module CLITerminal
 * @version 1.0
 */
'use strict';

const CLITerminal = {
    // ========================================
    // STATE
    // ========================================
    active: false,
    currentChallenge: 0,
    score: 0,
    streak: 0,
    maxStreak: 0,
    totalChallenges: 15,

    // Terminal state
    hostname: 'Router',
    mode: 'user',  // user, privileged, config, config-if, config-line, config-router
    history: [],
    historyIndex: -1,

    // DOM elements cache
    elements: {},

    // Challenge bank - command to type with expected mode and output
    challenges: [
        // Basic Navigation
        {
            prompt: "Enter privileged EXEC mode",
            expectedCommand: "enable",
            startMode: "user",
            acceptableVariants: ["enable", "en"],
            output: null,
            endMode: "privileged",
            category: "navigation",
            difficulty: 1
        },
        {
            prompt: "Enter global configuration mode",
            expectedCommand: "configure terminal",
            startMode: "privileged",
            acceptableVariants: ["configure terminal", "conf t", "conf term", "config t"],
            output: "Enter configuration commands, one per line.  End with CNTL/Z.",
            endMode: "config",
            category: "navigation",
            difficulty: 1
        },
        {
            prompt: "Return to privileged EXEC mode from any config mode",
            expectedCommand: "end",
            startMode: "config",
            acceptableVariants: ["end", "exit"],
            output: null,
            endMode: "privileged",
            category: "navigation",
            difficulty: 1
        },
        {
            prompt: "Enter interface configuration mode for GigabitEthernet0/1",
            expectedCommand: "interface gigabitethernet 0/1",
            startMode: "config",
            acceptableVariants: ["interface gigabitethernet 0/1", "int g0/1", "interface g0/1", "int gi0/1", "interface gigabitethernet0/1"],
            output: null,
            endMode: "config-if",
            category: "navigation",
            difficulty: 2
        },
        // Show Commands
        {
            prompt: "Display the running configuration",
            expectedCommand: "show running-config",
            startMode: "privileged",
            acceptableVariants: ["show running-config", "sh run", "show run"],
            output: "Building configuration...\n\nCurrent configuration : 1234 bytes\n!\nversion 15.1\n...",
            endMode: "privileged",
            category: "show",
            difficulty: 1
        },
        {
            prompt: "Display all interfaces with their IP addresses and status",
            expectedCommand: "show ip interface brief",
            startMode: "privileged",
            acceptableVariants: ["show ip interface brief", "sh ip int br", "sh ip int brief"],
            output: "Interface              IP-Address      OK? Method Status                Protocol\nGigabitEthernet0/0     192.168.1.1     YES manual up                    up\nGigabitEthernet0/1     unassigned      YES unset  administratively down down",
            endMode: "privileged",
            category: "show",
            difficulty: 1
        },
        {
            prompt: "Display the routing table",
            expectedCommand: "show ip route",
            startMode: "privileged",
            acceptableVariants: ["show ip route", "sh ip route", "sh ip ro"],
            output: "Codes: C - connected, S - static, R - RIP, O - OSPF\n\nGateway of last resort is 192.168.1.254\n\nC    192.168.1.0/24 is directly connected, GigabitEthernet0/0\nS*   0.0.0.0/0 [1/0] via 192.168.1.254",
            endMode: "privileged",
            category: "show",
            difficulty: 2
        },
        {
            prompt: "Display IOS version and hardware information",
            expectedCommand: "show version",
            startMode: "privileged",
            acceptableVariants: ["show version", "sh ver", "sh version"],
            output: "Cisco IOS Software, Version 15.1(4)M\nROM: System Bootstrap, Version 15.1(4)M\nRouter uptime is 2 days, 4 hours, 32 minutes\nSystem image file is \"flash:c2900-universalk9-mz.SPA.151-4.M.bin\"",
            endMode: "privileged",
            category: "show",
            difficulty: 1
        },
        // Configuration Commands
        {
            prompt: "Set the hostname to 'CoreRouter'",
            expectedCommand: "hostname CoreRouter",
            startMode: "config",
            acceptableVariants: ["hostname CoreRouter", "hostname corerouter"],
            output: null,
            endMode: "config",
            newHostname: "CoreRouter",
            category: "config",
            difficulty: 2
        },
        {
            prompt: "Assign IP address 192.168.1.1/24 to the current interface",
            expectedCommand: "ip address 192.168.1.1 255.255.255.0",
            startMode: "config-if",
            acceptableVariants: ["ip address 192.168.1.1 255.255.255.0", "ip addr 192.168.1.1 255.255.255.0"],
            output: null,
            endMode: "config-if",
            category: "config",
            difficulty: 2
        },
        {
            prompt: "Enable the interface (bring it up)",
            expectedCommand: "no shutdown",
            startMode: "config-if",
            acceptableVariants: ["no shutdown", "no shut"],
            output: "%LINK-3-UPDOWN: Interface GigabitEthernet0/1, changed state to up\n%LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/1, changed state to up",
            endMode: "config-if",
            category: "config",
            difficulty: 1
        },
        {
            prompt: "Save the running configuration to NVRAM",
            expectedCommand: "copy running-config startup-config",
            startMode: "privileged",
            acceptableVariants: ["copy running-config startup-config", "copy run start", "wr", "write memory", "write"],
            output: "Building configuration...\n[OK]",
            endMode: "privileged",
            category: "config",
            difficulty: 2
        },
        // VLAN Commands
        {
            prompt: "Create VLAN 100",
            expectedCommand: "vlan 100",
            startMode: "config",
            acceptableVariants: ["vlan 100"],
            output: null,
            endMode: "config-vlan",
            category: "vlan",
            difficulty: 2
        },
        {
            prompt: "Name the current VLAN 'Sales'",
            expectedCommand: "name Sales",
            startMode: "config-vlan",
            acceptableVariants: ["name Sales", "name sales"],
            output: null,
            endMode: "config-vlan",
            category: "vlan",
            difficulty: 2
        },
        {
            prompt: "Configure the port as an access port for VLAN 10",
            expectedCommand: "switchport access vlan 10",
            startMode: "config-if",
            acceptableVariants: ["switchport access vlan 10"],
            output: null,
            endMode: "config-if",
            category: "vlan",
            difficulty: 2
        },
        {
            prompt: "Set the port mode to trunk",
            expectedCommand: "switchport mode trunk",
            startMode: "config-if",
            acceptableVariants: ["switchport mode trunk"],
            output: null,
            endMode: "config-if",
            category: "vlan",
            difficulty: 2
        },
        {
            prompt: "Display all VLANs and their assignments",
            expectedCommand: "show vlan brief",
            startMode: "privileged",
            acceptableVariants: ["show vlan brief", "sh vlan br", "sh vlan brief"],
            output: "VLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n1    default                          active    Gi0/1, Gi0/2\n10   Sales                            active    Gi0/3, Gi0/4\n100  Management                       active    Gi0/5",
            endMode: "privileged",
            category: "vlan",
            difficulty: 2
        },
        // STP Commands
        {
            prompt: "Enable PortFast on this interface",
            expectedCommand: "spanning-tree portfast",
            startMode: "config-if",
            acceptableVariants: ["spanning-tree portfast"],
            output: "%Warning: portfast should only be enabled on ports connected to a single host.",
            endMode: "config-if",
            category: "stp",
            difficulty: 3
        },
        {
            prompt: "Enable BPDU Guard on this interface",
            expectedCommand: "spanning-tree bpduguard enable",
            startMode: "config-if",
            acceptableVariants: ["spanning-tree bpduguard enable"],
            output: null,
            endMode: "config-if",
            category: "stp",
            difficulty: 3
        },
        // OSPF Commands
        {
            prompt: "Enable OSPF with process ID 1",
            expectedCommand: "router ospf 1",
            startMode: "config",
            acceptableVariants: ["router ospf 1"],
            output: null,
            endMode: "config-router",
            category: "ospf",
            difficulty: 3
        },
        {
            prompt: "Advertise network 10.0.0.0/24 in OSPF area 0",
            expectedCommand: "network 10.0.0.0 0.0.0.255 area 0",
            startMode: "config-router",
            acceptableVariants: ["network 10.0.0.0 0.0.0.255 area 0"],
            output: null,
            endMode: "config-router",
            category: "ospf",
            difficulty: 3
        },
        {
            prompt: "Display OSPF neighbor relationships",
            expectedCommand: "show ip ospf neighbor",
            startMode: "privileged",
            acceptableVariants: ["show ip ospf neighbor", "sh ip ospf nei", "sh ip ospf neighbor"],
            output: "Neighbor ID     Pri   State           Dead Time   Address         Interface\n10.0.0.2          1   FULL/DR         00:00:38    10.0.0.2        GigabitEthernet0/0",
            endMode: "privileged",
            category: "ospf",
            difficulty: 3
        },
        // Security Commands
        {
            prompt: "Set the enable secret password to 'cisco123'",
            expectedCommand: "enable secret cisco123",
            startMode: "config",
            acceptableVariants: ["enable secret cisco123"],
            output: null,
            endMode: "config",
            category: "security",
            difficulty: 2
        },
        {
            prompt: "Enter console line configuration mode",
            expectedCommand: "line console 0",
            startMode: "config",
            acceptableVariants: ["line console 0", "line con 0"],
            output: null,
            endMode: "config-line",
            category: "security",
            difficulty: 2
        },
        {
            prompt: "Disable DNS lookup on the router",
            expectedCommand: "no ip domain-lookup",
            startMode: "config",
            acceptableVariants: ["no ip domain-lookup", "no ip domain lookup"],
            output: null,
            endMode: "config",
            category: "config",
            difficulty: 2
        },
        {
            prompt: "Encrypt all plaintext passwords in the configuration",
            expectedCommand: "service password-encryption",
            startMode: "config",
            acceptableVariants: ["service password-encryption"],
            output: null,
            endMode: "config",
            category: "security",
            difficulty: 2
        }
    ],

    // Shuffled challenges for current session
    sessionChallenges: [],

    /**
     * Initialize the module
     */
    init() {
        this.cacheElements();
        this.setupEventListeners();
    },

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            screen: document.getElementById('cli-terminal-screen'),
            terminalOutput: document.getElementById('cli-output'),
            terminalInput: document.getElementById('cli-input'),
            promptLabel: document.getElementById('cli-prompt-label'),
            challengeText: document.getElementById('cli-challenge-text'),
            hintBtn: document.getElementById('cli-hint-btn'),
            hintText: document.getElementById('cli-hint-text'),
            score: document.getElementById('cli-score'),
            streak: document.getElementById('cli-streak'),
            progress: document.getElementById('cli-progress'),
            quitBtn: document.getElementById('btn-cli-quit')
        };
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (this.elements.terminalInput) {
            this.elements.terminalInput.addEventListener('keydown', (e) => this.handleKeydown(e));
        }

        if (this.elements.hintBtn) {
            this.elements.hintBtn.addEventListener('click', () => this.showHint());
        }
    },

    /**
     * Start CLI Terminal session
     */
    start(options = {}) {
        this.active = true;
        this.currentChallenge = 0;
        this.score = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.hostname = 'Router';
        this.mode = 'privileged';
        this.history = [];
        this.historyIndex = -1;

        // Shuffle and select challenges
        this.sessionChallenges = this.shuffleChallenges();

        // Clear terminal
        this.clearTerminal();

        // Show welcome message
        this.printOutput(`
Cisco IOS Software Simulation
Router uptime is 0 minutes
System image file is "flash:ccna-arcade-ios.bin"

Type commands as prompted. Use Tab for hints.
-------------------------------------------`, 'system');

        // Load first challenge
        this.loadChallenge();

        // Update UI
        this.updateUI();

        // Focus input
        if (this.elements.terminalInput) {
            this.elements.terminalInput.focus();
        }

        if (typeof Sounds !== 'undefined') {
            Sounds.play('select');
        }
    },

    /**
     * Shuffle and select challenges
     */
    shuffleChallenges() {
        // Group by category to ensure variety
        const byCategory = {};
        this.challenges.forEach(c => {
            if (!byCategory[c.category]) byCategory[c.category] = [];
            byCategory[c.category].push(c);
        });

        // Shuffle each category
        Object.keys(byCategory).forEach(cat => {
            byCategory[cat] = this.shuffle(byCategory[cat]);
        });

        // Select challenges ensuring variety
        const selected = [];
        const categories = Object.keys(byCategory);
        let catIndex = 0;

        while (selected.length < this.totalChallenges) {
            const cat = categories[catIndex % categories.length];
            if (byCategory[cat].length > 0) {
                selected.push(byCategory[cat].shift());
            }
            catIndex++;

            // Safety check
            if (Object.values(byCategory).every(arr => arr.length === 0)) {
                break;
            }
        }

        // Final shuffle
        return this.shuffle(selected);
    },

    /**
     * Fisher-Yates shuffle
     */
    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    /**
     * Load current challenge
     */
    loadChallenge() {
        const challenge = this.sessionChallenges[this.currentChallenge];
        if (!challenge) return;

        // Set terminal mode
        this.mode = challenge.startMode;
        this.updatePrompt();

        // Update challenge text
        if (this.elements.challengeText) {
            this.elements.challengeText.textContent = challenge.prompt;
        }

        // Hide hint
        if (this.elements.hintText) {
            this.elements.hintText.classList.add('hidden');
            this.elements.hintText.textContent = '';
        }

        // Clear input
        if (this.elements.terminalInput) {
            this.elements.terminalInput.value = '';
        }
    },

    /**
     * Handle keydown events on input
     */
    handleKeydown(e) {
        if (!this.active) return;

        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                this.submitCommand();
                break;
            case 'Tab':
                e.preventDefault();
                this.showHint();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.navigateHistory(-1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.navigateHistory(1);
                break;
        }
    },

    /**
     * Submit command
     */
    submitCommand() {
        const input = this.elements.terminalInput.value.trim().toLowerCase();
        if (!input) return;

        const challenge = this.sessionChallenges[this.currentChallenge];

        // Add to history
        this.history.push(input);
        this.historyIndex = this.history.length;

        // Display command in terminal
        this.printCommand(input);

        // Check if command is correct
        const isCorrect = this.checkCommand(input, challenge);

        if (isCorrect) {
            this.handleCorrectAnswer(challenge);
        } else {
            this.handleWrongAnswer(input, challenge);
        }

        // Clear input
        this.elements.terminalInput.value = '';
    },

    /**
     * Check if command matches acceptable variants
     */
    checkCommand(input, challenge) {
        const normalized = input.toLowerCase().replace(/\s+/g, ' ').trim();
        return challenge.acceptableVariants.some(variant =>
            normalized === variant.toLowerCase()
        );
    },

    /**
     * Handle correct answer
     */
    handleCorrectAnswer(challenge) {
        // Display output if any
        if (challenge.output) {
            this.printOutput(challenge.output, 'success');
        }

        // Update hostname if changed
        if (challenge.newHostname) {
            this.hostname = challenge.newHostname;
        }

        // Update mode
        this.mode = challenge.endMode;
        this.updatePrompt();

        // Score calculation with streak bonus
        this.streak++;
        if (this.streak > this.maxStreak) {
            this.maxStreak = this.streak;
        }

        const basePoints = challenge.difficulty * 100;
        const streakBonus = Math.min(this.streak - 1, 5) * 20;
        const points = basePoints + streakBonus;
        this.score += points;

        // Success feedback
        this.printOutput(`Correct! +${points} points${this.streak > 1 ? ` (${this.streak}x streak!)` : ''}`, 'success');

        if (typeof Sounds !== 'undefined') {
            Sounds.play('correct');
        }

        // Next challenge or end
        this.currentChallenge++;
        this.updateUI();

        if (this.currentChallenge >= this.sessionChallenges.length) {
            setTimeout(() => this.showResults(), 1000);
        } else {
            setTimeout(() => this.loadChallenge(), 800);
        }
    },

    /**
     * Handle wrong answer
     */
    handleWrongAnswer(input, challenge) {
        this.streak = 0;

        // Check for common mistakes
        let feedback = this.getErrorFeedback(input, challenge);

        this.printOutput(feedback, 'error');

        if (typeof Sounds !== 'undefined') {
            Sounds.play('wrong');
        }

        this.updateUI();
    },

    /**
     * Get contextual error feedback
     */
    getErrorFeedback(input, challenge) {
        // Check if command exists but in wrong mode
        const allCommands = this.challenges.map(c => c.acceptableVariants).flat();
        const matchedOtherCommand = allCommands.find(cmd =>
            input.toLowerCase() === cmd.toLowerCase()
        );

        if (matchedOtherCommand) {
            return `% Invalid command for this prompt. Try a different approach.`;
        }

        // Check for partial match
        const expected = challenge.acceptableVariants[0].toLowerCase();
        if (expected.startsWith(input.split(' ')[0])) {
            return `% Incomplete command. ${challenge.prompt}`;
        }

        // Generic IOS-style error
        return `% Invalid input detected at '^' marker.\n         ${input}\n         ^`;
    },

    /**
     * Show hint for current challenge
     */
    showHint() {
        const challenge = this.sessionChallenges[this.currentChallenge];
        if (!challenge) return;

        // Get first few characters of expected command
        const expected = challenge.expectedCommand;
        const hintLength = Math.min(Math.ceil(expected.length / 2), 10);
        const hint = expected.substring(0, hintLength) + '...';

        if (this.elements.hintText) {
            this.elements.hintText.textContent = `Hint: ${hint}`;
            this.elements.hintText.classList.remove('hidden');
        }

        // Reduce score slightly for using hint
        this.score = Math.max(0, this.score - 10);
        this.updateUI();
    },

    /**
     * Navigate command history
     */
    navigateHistory(direction) {
        if (this.history.length === 0) return;

        this.historyIndex += direction;
        this.historyIndex = Math.max(0, Math.min(this.historyIndex, this.history.length));

        if (this.historyIndex < this.history.length) {
            this.elements.terminalInput.value = this.history[this.historyIndex];
        } else {
            this.elements.terminalInput.value = '';
        }
    },

    /**
     * Get current prompt string
     */
    getPrompt() {
        const prompts = {
            'user': `${this.hostname}>`,
            'privileged': `${this.hostname}#`,
            'config': `${this.hostname}(config)#`,
            'config-if': `${this.hostname}(config-if)#`,
            'config-line': `${this.hostname}(config-line)#`,
            'config-router': `${this.hostname}(config-router)#`,
            'config-vlan': `${this.hostname}(config-vlan)#`
        };
        return prompts[this.mode] || `${this.hostname}#`;
    },

    /**
     * Update prompt display
     */
    updatePrompt() {
        if (this.elements.promptLabel) {
            this.elements.promptLabel.textContent = this.getPrompt();
        }
    },

    /**
     * Print command to terminal output
     */
    printCommand(cmd) {
        const line = document.createElement('div');
        line.className = 'cli-line cli-command';
        line.innerHTML = `<span class="cli-prompt">${this.getPrompt()}</span>${this.escapeHtml(cmd)}`;
        this.elements.terminalOutput.appendChild(line);
        this.scrollToBottom();
    },

    /**
     * Print output to terminal
     */
    printOutput(text, type = '') {
        const lines = text.split('\n');
        lines.forEach(lineText => {
            const line = document.createElement('div');
            line.className = `cli-line cli-output ${type}`;
            line.textContent = lineText;
            this.elements.terminalOutput.appendChild(line);
        });
        this.scrollToBottom();
    },

    /**
     * Clear terminal output
     */
    clearTerminal() {
        if (this.elements.terminalOutput) {
            this.elements.terminalOutput.innerHTML = '';
        }
    },

    /**
     * Scroll terminal to bottom
     */
    scrollToBottom() {
        if (this.elements.terminalOutput) {
            this.elements.terminalOutput.scrollTop = this.elements.terminalOutput.scrollHeight;
        }
    },

    /**
     * Escape HTML entities
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Update UI elements
     */
    updateUI() {
        if (this.elements.score) {
            this.elements.score.textContent = this.score;
        }
        if (this.elements.streak) {
            this.elements.streak.textContent = `${this.streak}x`;
        }
        if (this.elements.progress) {
            this.elements.progress.textContent = `${this.currentChallenge + 1}/${this.totalChallenges}`;
        }
    },

    /**
     * Show results
     */
    showResults() {
        this.active = false;

        const accuracy = Math.round((this.currentChallenge / this.totalChallenges) * 100);

        // Clear and show results in terminal
        this.printOutput('\n========================================', 'system');
        this.printOutput('           SESSION COMPLETE!           ', 'success');
        this.printOutput('========================================', 'system');
        this.printOutput(`Final Score: ${this.score}`, 'system');
        this.printOutput(`Commands Completed: ${this.currentChallenge}/${this.totalChallenges}`, 'system');
        this.printOutput(`Best Streak: ${this.maxStreak}x`, 'system');
        this.printOutput('========================================\n', 'system');

        // Record stats
        if (typeof Stats !== 'undefined') {
            Stats.recordCLITerminal({
                score: this.score,
                completed: this.currentChallenge,
                total: this.totalChallenges,
                maxStreak: this.maxStreak
            });
        }

        // Check achievements
        if (typeof Achievements !== 'undefined') {
            Achievements.unlock('cli_first');
            if (this.currentChallenge === this.totalChallenges) {
                Achievements.unlock('cli_complete');
            }
            if (this.maxStreak >= 10) {
                Achievements.unlock('cli_streak_master');
            }
        }

        if (typeof Sounds !== 'undefined') {
            Sounds.play('levelComplete');
        }
    },

    /**
     * Stop the session
     */
    stop() {
        this.active = false;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CLITerminal;
}
