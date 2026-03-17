/**
 * Speed Subnet Module
 * Educational CIDR training arcade mode with varied question types
 *
 * @module SpeedSubnet
 * @version 3.0
 *
 * QUESTION CATEGORIES:
 * - hosts_to_cidr:    Given host count, find minimum CIDR
 * - cidr_to_hosts:    Given CIDR, calculate usable hosts
 * - subnet_mask:      Match CIDR to subnet mask
 * - network_class:    Identify IP address class (A/B/C)
 * - binary_bits:      Calculate host bits needed
 * - network_address:  Find network address from IP/CIDR
 * - broadcast:        Find broadcast address
 * - first_host:       First usable host IP
 * - last_host:        Last usable host IP
 * - port_number:      Protocol to port mapping (new in v3.0)
 * - wildcard_mask:    Calculate wildcard from subnet mask (new in v3.0)
 * - private_ip:       Identify RFC 1918 private IPs (new in v3.0)
 * - binary_convert:   Decimal to binary conversion (new in v3.0)
 * - subnet_in_subnet: Calculate subnet divisions (new in v3.0)
 *
 * DIFFICULTY LEVELS:
 * - Easy:      hosts_to_cidr, cidr_to_hosts, network_class, private_ip
 * - Medium:    + subnet_mask, binary_bits, port_number
 * - Hard:      + network_address, broadcast, wildcard_mask, binary_convert, subnet_in_subnet
 * - Nightmare: All categories with harder questions
 *
 * KEY FEATURES:
 * - Weighted random category selection based on category weights
 * - Streak-based scoring with multipliers
 * - Mascot animation ("Bit" rides network cables)
 * - Keyboard support (1-4 keys for answer selection)
 * - Achievement tracking integration
 *
 * DEDUPLICATION:
 * All question generators use ensureUniqueOptions() which guarantees
 * exactly 4 unique options through:
 * 1. Set-based tracking with string normalization
 * 2. Type-aware fallback generation (numeric, IP, string)
 * 3. Emergency "Option N" fallback as final safety net
 */
'use strict';

const SpeedSubnet = {
    // Game state
    active: false,
    currentQuestion: null,
    questionNumber: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    totalCorrect: 0,
    totalQuestions: 0,

    // Question categories
    categories: {
        hosts_to_cidr: {
            name: "Hosts → CIDR",
            description: "Given hosts needed, find minimum CIDR",
            weight: 3
        },
        cidr_to_hosts: {
            name: "CIDR → Hosts",
            description: "Given CIDR, calculate usable hosts",
            weight: 2
        },
        subnet_mask: {
            name: "Subnet Masks",
            description: "Match CIDR to subnet mask",
            weight: 2
        },
        network_class: {
            name: "Network Classes",
            description: "Identify IP address class",
            weight: 1
        },
        binary_bits: {
            name: "Binary Math",
            description: "Calculate host bits needed",
            weight: 1
        },
        network_address: {
            name: "Network Address",
            description: "Find network address from IP/CIDR",
            weight: 2
        },
        broadcast: {
            name: "Broadcast Address",
            description: "Find broadcast address from network/CIDR",
            weight: 2
        },
        first_host: {
            name: "First Usable Host",
            description: "Find first usable IP in subnet",
            weight: 1
        },
        last_host: {
            name: "Last Usable Host",
            description: "Find last usable IP in subnet",
            weight: 1
        },
        port_number: {
            name: "Port Numbers",
            description: "Match protocol to port number",
            weight: 2
        },
        wildcard_mask: {
            name: "Wildcard Masks",
            description: "Calculate wildcard from subnet mask",
            weight: 1
        },
        private_ip: {
            name: "Private IPs",
            description: "Identify private IP address ranges",
            weight: 1
        },
        binary_convert: {
            name: "Binary Conversion",
            description: "Convert between decimal and binary",
            weight: 1
        },
        subnet_in_subnet: {
            name: "Subnets in Subnet",
            description: "Calculate how many smaller subnets fit",
            weight: 1
        }
    },

    // Common port numbers for training
    portNumbers: [
        { port: 20, protocol: 'FTP Data', description: 'FTP data transfer' },
        { port: 21, protocol: 'FTP Control', description: 'FTP command/control' },
        { port: 22, protocol: 'SSH', description: 'Secure Shell' },
        { port: 23, protocol: 'Telnet', description: 'Unencrypted remote access' },
        { port: 25, protocol: 'SMTP', description: 'Email sending' },
        { port: 53, protocol: 'DNS', description: 'Domain Name System' },
        { port: 67, protocol: 'DHCP Server', description: 'Dynamic IP assignment (server)' },
        { port: 68, protocol: 'DHCP Client', description: 'Dynamic IP assignment (client)' },
        { port: 69, protocol: 'TFTP', description: 'Trivial File Transfer' },
        { port: 80, protocol: 'HTTP', description: 'Web traffic (unencrypted)' },
        { port: 110, protocol: 'POP3', description: 'Email retrieval' },
        { port: 123, protocol: 'NTP', description: 'Network Time Protocol' },
        { port: 143, protocol: 'IMAP', description: 'Email access' },
        { port: 161, protocol: 'SNMP', description: 'Network management' },
        { port: 443, protocol: 'HTTPS', description: 'Secure web traffic' },
        { port: 445, protocol: 'SMB', description: 'Windows file sharing' },
        { port: 3389, protocol: 'RDP', description: 'Remote Desktop Protocol' }
    ],

    // Current settings
    difficulty: 'easy',
    enabledCategories: [],
    maxQuestions: 20,

    // UI elements
    elements: {},

    // Mascot canvas
    mascotCanvas: null,
    mascotCtx: null,
    mascotAnimationId: null,
    cableNodes: [], // Points along the cable for mascot to travel

    /**
     * Initialize the Speed Subnet game
     */
    init() {
        this.elements = {
            container: document.getElementById('speed-subnet-container'),
            hostCount: document.getElementById('speed-host-count'),
            cidrOptions: document.getElementById('speed-cidr-options'),
            feedback: document.getElementById('speed-feedback'),
            score: document.getElementById('speed-score'),
            streak: document.getElementById('speed-streak'),
            progress: document.getElementById('speed-progress'),
            prompt: document.querySelector('.speed-prompt'),
            subtext: document.querySelector('.speed-subtext')
        };

        // Initialize mascot canvas
        this.mascotCanvas = document.getElementById('mascot-canvas');
        if (this.mascotCanvas) {
            this.mascotCtx = this.mascotCanvas.getContext('2d');
            this.setupCableNodes();
        }
    },

    /**
     * Setup the cable nodes that the mascot travels along
     */
    setupCableNodes() {
        if (!this.mascotCanvas) return;

        const width = this.mascotCanvas.width;
        const height = this.mascotCanvas.height;

        // Create a wavy cable path across the canvas
        this.cableNodes = [];
        const nodeCount = 20;
        for (let i = 0; i <= nodeCount; i++) {
            const x = (i / nodeCount) * width;
            const y = height / 2 + Math.sin(i * 0.5) * 15;
            this.cableNodes.push({ x, y });
        }
    },

    /**
     * Start mascot animation loop
     */
    startMascotAnimation() {
        // Re-get canvas in case DOM wasn't ready during init
        if (!this.mascotCanvas) {
            this.mascotCanvas = document.getElementById('mascot-canvas');
            if (this.mascotCanvas) {
                this.mascotCtx = this.mascotCanvas.getContext('2d');
            }
        }

        if (!this.mascotCanvas || !this.mascotCtx) {
            console.warn('Mascot canvas not found');
            return;
        }

        // Setup cable nodes if not already done
        if (!this.cableNodes || this.cableNodes.length === 0) {
            this.setupCableNodes();
        }

        // Initialize mascot at the start of the cable
        if (typeof Mascot !== 'undefined' && this.cableNodes && this.cableNodes.length > 0) {
            Mascot.init(this.cableNodes[0].x, this.cableNodes[0].y);
        }

        // Stop any existing animation
        this.stopMascotAnimation();

        const animate = () => {
            if (!this.active) {
                this.stopMascotAnimation();
                return;
            }

            this.renderMascotScene();
            this.mascotAnimationId = requestAnimationFrame(animate);
        };

        animate();
    },

    /**
     * Stop mascot animation
     */
    stopMascotAnimation() {
        if (this.mascotAnimationId) {
            cancelAnimationFrame(this.mascotAnimationId);
            this.mascotAnimationId = null;
        }
    },

    /**
     * Render the mascot scene (cable + mascot)
     */
    renderMascotScene() {
        if (!this.mascotCtx || !this.mascotCanvas) return;

        const ctx = this.mascotCtx;
        const width = this.mascotCanvas.width;
        const height = this.mascotCanvas.height;

        // Skip if canvas has no size
        if (width <= 0 || height <= 0) return;

        // Clear canvas
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, width, height);

        // Draw the network cable
        if (this.cableNodes && this.cableNodes.length > 0) {
            this.drawNetworkCable(ctx);
            this.drawDataPackets(ctx);
        }

        // Draw the mascot
        if (typeof Mascot !== 'undefined') {
            Mascot.render(ctx);
        }
    },

    /**
     * Draw the network cable
     */
    drawNetworkCable(ctx) {
        if (this.cableNodes.length < 2) return;

        // Cable glow
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(this.cableNodes[0].x, this.cableNodes[0].y);
        for (let i = 1; i < this.cableNodes.length; i++) {
            ctx.lineTo(this.cableNodes[i].x, this.cableNodes[i].y);
        }
        ctx.stroke();

        // Main cable
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.cableNodes[0].x, this.cableNodes[0].y);
        for (let i = 1; i < this.cableNodes.length; i++) {
            ctx.lineTo(this.cableNodes[i].x, this.cableNodes[i].y);
        }
        ctx.stroke();

        // Draw connection nodes
        for (let i = 0; i < this.cableNodes.length; i += 4) {
            ctx.fillStyle = '#00d4ff';
            ctx.beginPath();
            ctx.arc(this.cableNodes[i].x, this.cableNodes[i].y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    /**
     * Draw background data packets
     */
    drawDataPackets(ctx) {
        const time = Date.now() * 0.002;

        for (let i = 0; i < 5; i++) {
            const progress = ((time + i * 0.2) % 1);
            const nodeIndex = Math.floor(progress * (this.cableNodes.length - 1));
            const node = this.cableNodes[nodeIndex];

            if (node) {
                ctx.fillStyle = `rgba(0, 212, 255, ${0.3 - i * 0.05})`;
                ctx.beginPath();
                ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },

    /**
     * Move mascot to a position based on question progress
     */
    moveMascotToQuestion() {
        if (typeof Mascot === 'undefined' || this.cableNodes.length === 0) return;

        // Calculate position based on question progress
        const progress = this.questionNumber / this.maxQuestions;
        const nodeIndex = Math.floor(progress * (this.cableNodes.length - 1));
        const node = this.cableNodes[Math.min(nodeIndex, this.cableNodes.length - 1)];

        if (node) {
            Mascot.moveTo(node.x, node.y);
        }
    },

    /**
     * Start a new game
     */
    start(options = {}) {
        this.active = true;
        this.score = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.totalCorrect = 0;
        this.totalQuestions = 0;
        this.questionNumber = 0;

        this.difficulty = options.difficulty || 'easy';
        this.maxQuestions = options.maxQuestions || 20;

        // If specific categories provided, use them
        if (options.categories && options.categories !== 'all') {
            this.enabledCategories = options.categories;
        } else if (options.categories === 'all') {
            this.enabledCategories = Object.keys(this.categories);
        } else {
            // Set enabled categories based on difficulty
            this.setEnabledCategories();
        }

        // Initialize and start mascot animation
        this.setupCableNodes();
        this.startMascotAnimation();
        if (typeof Mascot !== 'undefined') {
            Mascot.setStreak(0);
        }

        this.updateUI();
        this.nextQuestion();
    },

    /**
     * Set which question categories are enabled based on difficulty
     */
    setEnabledCategories() {
        if (this.difficulty === 'easy') {
            // Basics only - subnetting fundamentals
            this.enabledCategories = ['hosts_to_cidr', 'cidr_to_hosts', 'network_class', 'private_ip'];
        } else if (this.difficulty === 'medium') {
            // Add subnet masks, binary, and ports
            this.enabledCategories = [
                'hosts_to_cidr', 'cidr_to_hosts', 'subnet_mask',
                'network_class', 'binary_bits', 'port_number', 'private_ip'
            ];
        } else if (this.difficulty === 'hard') {
            // Add network calculations and advanced topics
            this.enabledCategories = [
                'hosts_to_cidr', 'cidr_to_hosts', 'subnet_mask',
                'network_class', 'binary_bits', 'network_address',
                'broadcast', 'port_number', 'wildcard_mask', 'private_ip',
                'binary_convert', 'subnet_in_subnet'
            ];
        } else if (this.difficulty === 'nightmare') {
            // All categories with harder questions
            this.enabledCategories = Object.keys(this.categories);
            this.harderQuestions = true;
        } else {
            // All categories
            this.enabledCategories = Object.keys(this.categories);
        }
    },

    /**
     * Generate next question
     */
    nextQuestion() {
        if (this.questionNumber >= this.maxQuestions) {
            this.endGame();
            return;
        }

        // Pick weighted random category
        const category = this.pickWeightedCategory();
        const question = this.generateQuestion(category);

        this.currentQuestion = question;
        this.questionNumber++;

        // Move mascot along the cable
        this.moveMascotToQuestion();

        this.displayQuestion();
    },

    /**
     * Pick a category with weighting
     */
    pickWeightedCategory() {
        let totalWeight = 0;
        for (const cat of this.enabledCategories) {
            totalWeight += this.categories[cat].weight;
        }

        let random = Math.random() * totalWeight;
        for (const cat of this.enabledCategories) {
            random -= this.categories[cat].weight;
            if (random <= 0) return cat;
        }

        return this.enabledCategories[0];
    },

    /**
     * Generate a question for a specific category
     */
    generateQuestion(category) {
        switch (category) {
            case 'hosts_to_cidr':
                return this.generateHostsToCidr();
            case 'cidr_to_hosts':
                return this.generateCidrToHosts();
            case 'subnet_mask':
                return this.generateSubnetMask();
            case 'network_class':
                return this.generateNetworkClass();
            case 'binary_bits':
                return this.generateBinaryBits();
            case 'network_address':
                return this.generateNetworkAddress();
            case 'broadcast':
                return this.generateBroadcast();
            case 'first_host':
                return this.generateFirstHost();
            case 'last_host':
                return this.generateLastHost();
            case 'port_number':
                return this.generatePortNumber();
            case 'wildcard_mask':
                return this.generateWildcardMask();
            case 'private_ip':
                return this.generatePrivateIP();
            case 'binary_convert':
                return this.generateBinaryConvert();
            case 'subnet_in_subnet':
                return this.generateSubnetInSubnet();
            default:
                return this.generateHostsToCidr();
        }
    },

    /**
     * Generate Hosts → CIDR question
     */
    generateHostsToCidr() {
        const hostOptions = this.difficulty === 'easy'
            ? [2, 6, 14, 30, 62, 126, 254]
            : [5, 10, 20, 33, 50, 75, 100, 150, 200, 300, 500];

        const hosts = hostOptions[Math.floor(Math.random() * hostOptions.length)];
        const answer = SubnetCalculator.hostCountToCidr(hosts);

        // Generate options
        const options = this.generateCidrOptions(answer);

        return {
            category: 'hosts_to_cidr',
            prompt: "How many hosts?",
            display: hosts.toString(),
            subtext: "Select minimum CIDR",
            answer: answer,
            answerDisplay: `/${answer}`,
            options: options.map(c => ({ value: c, display: `/${c}` })),
            explanation: `${hosts} hosts need /${answer} (${SubnetCalculator.cidrToHostCount(answer)} max hosts)`
        };
    },

    /**
     * Generate CIDR → Hosts question
     */
    generateCidrToHosts() {
        const cidrOptions = [24, 25, 26, 27, 28, 29, 30];
        const cidr = cidrOptions[Math.floor(Math.random() * cidrOptions.length)];
        const answer = SubnetCalculator.cidrToHostCount(cidr);

        // Generate wrong answers (nearby values)
        const wrongAnswers = [
            answer + 2,
            answer - 2,
            Math.pow(2, 32 - cidr), // Total addresses (common mistake)
            answer + Math.floor(answer / 2),
            answer * 2,
            Math.floor(answer / 2)
        ].filter(a => a > 0);

        // Ensure unique options
        const options = this.ensureUniqueOptions(answer, wrongAnswers, () => {
            return answer + Math.floor(Math.random() * 50) + 1;
        });

        return {
            category: 'cidr_to_hosts',
            prompt: "How many usable hosts?",
            display: `/${cidr}`,
            subtext: "Calculate usable host addresses",
            answer: answer,
            answerDisplay: answer.toString(),
            options: options.map(h => ({ value: h, display: h.toString() })),
            explanation: `/${cidr} = ${Math.pow(2, 32 - cidr)} addresses - 2 = ${answer} usable hosts`
        };
    },

    /**
     * Generate Subnet Mask question
     */
    generateSubnetMask() {
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
        const cidr = cidrs[Math.floor(Math.random() * cidrs.length)];
        const answer = masks[cidr];

        // Get all other masks as wrong answers
        const allMasks = Object.values(masks);
        const wrongMasks = allMasks.filter(m => m !== answer);

        // Shuffle and take 3 for wrong options
        wrongMasks.sort(() => Math.random() - 0.5);

        // Ensure unique options with a fallback generator
        const allMasksCopy = [...allMasks];
        const options = this.ensureUniqueOptions(answer, wrongMasks.slice(0, 3), () => {
            // Return a random mask from the pool
            const available = allMasksCopy.filter(m => m !== answer);
            return available[Math.floor(Math.random() * available.length)];
        });

        return {
            category: 'subnet_mask',
            prompt: "What is the subnet mask?",
            display: `/${cidr}`,
            subtext: "Select the correct mask",
            answer: answer,
            answerDisplay: answer,
            options: options.map(m => ({ value: m, display: m })),
            explanation: `/${cidr} = ${answer}`
        };
    },

    /**
     * Generate Network Class question
     */
    generateNetworkClass() {
        const examples = [
            { ip: '10.0.0.1', class: 'A', range: '1-126' },
            { ip: '45.67.89.1', class: 'A', range: '1-126' },
            { ip: '126.1.2.3', class: 'A', range: '1-126' },
            { ip: '128.0.0.1', class: 'B', range: '128-191' },
            { ip: '172.16.0.1', class: 'B', range: '128-191' },
            { ip: '191.255.0.1', class: 'B', range: '128-191' },
            { ip: '192.168.1.1', class: 'C', range: '192-223' },
            { ip: '200.100.50.1', class: 'C', range: '192-223' },
            { ip: '223.0.0.1', class: 'C', range: '192-223' }
        ];

        const example = examples[Math.floor(Math.random() * examples.length)];
        const options = ['A', 'B', 'C', 'D'];

        return {
            category: 'network_class',
            prompt: "What network class?",
            display: example.ip,
            subtext: "Identify the IP class",
            answer: example.class,
            answerDisplay: `Class ${example.class}`,
            options: options.map(c => ({ value: c, display: `Class ${c}` })),
            explanation: `First octet ${example.ip.split('.')[0]} is in range ${example.range} = Class ${example.class}`
        };
    },

    /**
     * Generate Binary Bits question
     */
    generateBinaryBits() {
        const scenarios = [
            { hosts: 2, bits: 2, addresses: 4 },
            { hosts: 6, bits: 3, addresses: 8 },
            { hosts: 14, bits: 4, addresses: 16 },
            { hosts: 30, bits: 5, addresses: 32 },
            { hosts: 62, bits: 6, addresses: 64 },
            { hosts: 126, bits: 7, addresses: 128 },
            { hosts: 254, bits: 8, addresses: 256 }
        ];

        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

        const wrongBits = [
            scenario.bits - 1,
            scenario.bits + 1,
            scenario.bits + 2,
            scenario.bits - 2
        ].filter(b => b > 0 && b <= 8);

        // Ensure unique options
        const options = this.ensureUniqueOptions(scenario.bits, wrongBits, () => {
            let candidate;
            do {
                candidate = Math.floor(Math.random() * 7) + 2; // 2-8 bits
            } while (candidate === scenario.bits);
            return candidate;
        });

        // Sort numerically for display
        options.sort((a, b) => a - b);

        return {
            category: 'binary_bits',
            prompt: "Host bits needed?",
            display: `${scenario.hosts} hosts`,
            subtext: "How many bits for the host portion?",
            answer: scenario.bits,
            answerDisplay: `${scenario.bits} bits`,
            options: options.map(b => ({ value: b, display: `${b} bits` })),
            explanation: `${scenario.hosts} hosts needs ${scenario.bits} bits (2^${scenario.bits} = ${scenario.addresses} addresses)`
        };
    },

    /**
     * Generate Network Address question
     */
    generateNetworkAddress() {
        const scenarios = [
            { ip: '192.168.1.50', cidr: 24, network: '192.168.1.0' },
            { ip: '192.168.1.100', cidr: 25, network: '192.168.1.0' },
            { ip: '192.168.1.150', cidr: 25, network: '192.168.1.128' },
            { ip: '10.0.0.45', cidr: 26, network: '10.0.0.0' },
            { ip: '172.16.5.200', cidr: 27, network: '172.16.5.192' },
            { ip: '192.168.10.67', cidr: 26, network: '192.168.10.64' }
        ];

        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

        // Generate plausible wrong answers using distinct network boundaries
        const parts = scenario.network.split('.').map(Number);
        const blockSize = Math.pow(2, 32 - scenario.cidr);
        const wrongNets = new Set();

        // Add the host IP as a common mistake
        wrongNets.add(scenario.ip);

        // Generate other network boundaries that are wrong
        const offsets = [-2, -1, 1, 2, 3, 4].map(n => n * blockSize);
        for (const offset of offsets) {
            const newLast = parts[3] + offset;
            if (newLast >= 0 && newLast <= 255 && newLast !== parts[3]) {
                wrongNets.add(`${parts[0]}.${parts[1]}.${parts[2]}.${newLast}`);
            }
        }

        // Ensure unique options
        const options = this.ensureUniqueOptions(scenario.network, Array.from(wrongNets), () => {
            const randomOffset = (Math.floor(Math.random() * 7) + 1) * blockSize;
            const newLast = (parts[3] + randomOffset) % 256;
            return `${parts[0]}.${parts[1]}.${parts[2]}.${newLast}`;
        });

        return {
            category: 'network_address',
            prompt: "What is the network address?",
            display: `${scenario.ip}/${scenario.cidr}`,
            subtext: "Find the network ID",
            answer: scenario.network,
            answerDisplay: scenario.network,
            options: options.map(n => ({ value: n, display: n })),
            explanation: `${scenario.ip}/${scenario.cidr} belongs to network ${scenario.network}`
        };
    },

    /**
     * Generate Broadcast Address question
     */
    generateBroadcast() {
        const scenarios = [
            { network: '192.168.1.0', cidr: 24, broadcast: '192.168.1.255' },
            { network: '192.168.1.0', cidr: 25, broadcast: '192.168.1.127' },
            { network: '192.168.1.128', cidr: 25, broadcast: '192.168.1.255' },
            { network: '10.0.0.0', cidr: 26, broadcast: '10.0.0.63' },
            { network: '172.16.5.192', cidr: 27, broadcast: '172.16.5.223' },
            { network: '192.168.10.64', cidr: 26, broadcast: '192.168.10.127' }
        ];

        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

        // Generate plausible wrong answers using subnet boundaries
        const parts = scenario.broadcast.split('.').map(Number);
        const blockSize = Math.pow(2, 32 - scenario.cidr);
        const wrongBCs = new Set();

        // Add the network address as a common mistake
        wrongBCs.add(scenario.network);

        // Generate other broadcast addresses from neighboring subnets
        const offsets = [-2, -1, 1, 2, 3].map(n => n * blockSize);
        for (const offset of offsets) {
            const newLast = parts[3] + offset;
            if (newLast >= 0 && newLast <= 255 && newLast !== parts[3]) {
                wrongBCs.add(`${parts[0]}.${parts[1]}.${parts[2]}.${newLast}`);
            }
        }

        // Also add some common mistake values
        if (parts[3] !== 255) wrongBCs.add(`${parts[0]}.${parts[1]}.${parts[2]}.255`);
        if (parts[3] !== 0) wrongBCs.add(`${parts[0]}.${parts[1]}.${parts[2]}.0`);

        // Ensure unique options
        const options = this.ensureUniqueOptions(scenario.broadcast, Array.from(wrongBCs), () => {
            const randomOffset = (Math.floor(Math.random() * 6) + 1) * blockSize;
            const direction = Math.random() > 0.5 ? 1 : -1;
            const newLast = ((parts[3] + direction * randomOffset) % 256 + 256) % 256;
            return `${parts[0]}.${parts[1]}.${parts[2]}.${newLast}`;
        });

        return {
            category: 'broadcast',
            prompt: "What is the broadcast address?",
            display: `${scenario.network}/${scenario.cidr}`,
            subtext: "Find the broadcast address",
            answer: scenario.broadcast,
            answerDisplay: scenario.broadcast,
            options: options.map(b => ({ value: b, display: b })),
            explanation: `${scenario.network}/${scenario.cidr} broadcast is ${scenario.broadcast}`
        };
    },

    /**
     * Generate First Host question
     */
    generateFirstHost() {
        const scenarios = [
            { network: '192.168.1.0', cidr: 24, first: '192.168.1.1' },
            { network: '192.168.1.128', cidr: 25, first: '192.168.1.129' },
            { network: '10.0.0.64', cidr: 26, first: '10.0.0.65' },
            { network: '172.16.5.192', cidr: 27, first: '172.16.5.193' }
        ];

        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        const prefix = scenario.first.split('.').slice(0, 3).join('.');
        const lastOctet = parseInt(scenario.first.split('.')[3]);
        const blockSize = Math.pow(2, 32 - scenario.cidr);

        const wrongAnswers = new Set();

        // Add common mistakes
        wrongAnswers.add(scenario.network); // Using network address

        // Add nearby values that are distinct
        const offsets = [1, 2, -1, 3, 4, 5, -2];
        for (const offset of offsets) {
            const newLast = lastOctet + offset;
            if (newLast >= 0 && newLast <= 255 && newLast !== lastOctet) {
                wrongAnswers.add(`${prefix}.${newLast}`);
            }
        }

        // Add first hosts from other subnets
        for (let i = 1; i <= 3; i++) {
            const otherFirst = (lastOctet - 1 + i * blockSize) % 256 + 1;
            if (otherFirst !== lastOctet && otherFirst <= 255) {
                wrongAnswers.add(`${prefix}.${otherFirst}`);
            }
        }

        // Ensure unique options
        const options = this.ensureUniqueOptions(scenario.first, Array.from(wrongAnswers), () => {
            const offset = Math.floor(Math.random() * 20) + 2;
            return `${prefix}.${Math.min(254, lastOctet + offset)}`;
        });

        return {
            category: 'first_host',
            prompt: "First usable host IP?",
            display: `${scenario.network}/${scenario.cidr}`,
            subtext: "Network address + 1",
            answer: scenario.first,
            answerDisplay: scenario.first,
            options: options.map(h => ({ value: h, display: h })),
            explanation: `First host = network address + 1 = ${scenario.first}`
        };
    },

    /**
     * Generate Last Host question
     */
    generateLastHost() {
        const scenarios = [
            { network: '192.168.1.0', cidr: 24, last: '192.168.1.254' },
            { network: '192.168.1.128', cidr: 25, last: '192.168.1.254' },
            { network: '10.0.0.64', cidr: 26, last: '10.0.0.126' },
            { network: '172.16.5.192', cidr: 27, last: '172.16.5.222' }
        ];

        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

        const prefix = scenario.last.split('.').slice(0, 3).join('.');
        const lastOctet = parseInt(scenario.last.split('.')[3]);
        const blockSize = Math.pow(2, 32 - scenario.cidr);

        const wrongAnswers = new Set();

        // Add broadcast address as common mistake
        wrongAnswers.add(`${prefix}.${Math.min(255, lastOctet + 1)}`);

        // Add nearby values that are distinct
        const offsets = [-1, -2, 2, 3, -3, -4, 4];
        for (const offset of offsets) {
            const newLast = lastOctet + offset;
            if (newLast >= 0 && newLast <= 255 && newLast !== lastOctet) {
                wrongAnswers.add(`${prefix}.${newLast}`);
            }
        }

        // Add last hosts from other subnets
        for (let i = 1; i <= 3; i++) {
            const otherLast = (lastOctet + 1 + i * blockSize) % 256 - 1;
            if (otherLast !== lastOctet && otherLast >= 0) {
                wrongAnswers.add(`${prefix}.${otherLast}`);
            }
        }

        // Ensure unique options
        const options = this.ensureUniqueOptions(scenario.last, Array.from(wrongAnswers), () => {
            const offset = Math.floor(Math.random() * 20) + 2;
            return `${prefix}.${Math.max(1, lastOctet - offset)}`;
        });

        return {
            category: 'last_host',
            prompt: "Last usable host IP?",
            display: `${scenario.network}/${scenario.cidr}`,
            subtext: "Broadcast address - 1",
            answer: scenario.last,
            answerDisplay: scenario.last,
            options: options.map(h => ({ value: h, display: h })),
            explanation: `Last host = broadcast - 1 = ${scenario.last}`
        };
    },

    /**
     * Generate Port Number question
     * Tests knowledge of common TCP/UDP port numbers and their protocols.
     * Randomly alternates between:
     * - Given protocol name, find port number
     * - Given port number, find protocol name
     *
     * Uses portNumbers array which includes 17 CCNA-relevant ports
     * @returns {Object} Question object with prompt, options, answer, explanation
     */
    generatePortNumber() {
        // Decide whether to ask port->protocol or protocol->port
        const askPort = Math.random() > 0.5;
        const selected = this.portNumbers[Math.floor(Math.random() * this.portNumbers.length)];
        const wrongPorts = this.portNumbers.filter(p => p.port !== selected.port);

        if (askPort) {
            // Given protocol, find port
            const wrongOptions = wrongPorts.sort(() => Math.random() - 0.5).slice(0, 3).map(p => p.port);

            return {
                category: 'port_number',
                prompt: 'What port number?',
                display: selected.protocol,
                subtext: selected.description,
                answer: selected.port,
                answerDisplay: `Port ${selected.port}`,
                options: this.ensureUniqueOptions(selected.port, wrongOptions, () => {
                    const ports = [20, 21, 22, 23, 25, 53, 80, 110, 143, 443, 3389];
                    return ports[Math.floor(Math.random() * ports.length)];
                }).map(p => ({ value: p, display: `Port ${p}` })),
                explanation: `${selected.protocol} uses port ${selected.port}`
            };
        } else {
            // Given port, find protocol
            const wrongOptions = wrongPorts.sort(() => Math.random() - 0.5).slice(0, 3).map(p => p.protocol);

            return {
                category: 'port_number',
                prompt: 'What protocol?',
                display: `Port ${selected.port}`,
                subtext: 'Identify the protocol',
                answer: selected.protocol,
                answerDisplay: selected.protocol,
                options: this.ensureUniqueOptions(selected.protocol, wrongOptions, () => {
                    const protocols = ['HTTP', 'HTTPS', 'SSH', 'FTP', 'DNS', 'SMTP', 'Telnet'];
                    return protocols[Math.floor(Math.random() * protocols.length)];
                }).map(p => ({ value: p, display: p })),
                explanation: `Port ${selected.port} is ${selected.protocol}: ${selected.description}`
            };
        }
    },

    /**
     * Generate Wildcard Mask question
     * Tests ability to calculate wildcard masks from subnet masks.
     * Wildcard = 255.255.255.255 - Subnet Mask
     * Used in ACLs and OSPF network statements.
     *
     * @returns {Object} Question object with prompt, options, answer, explanation
     */
    generateWildcardMask() {
        const masks = [
            { subnet: '255.255.255.0', wildcard: '0.0.0.255', cidr: 24 },
            { subnet: '255.255.255.128', wildcard: '0.0.0.127', cidr: 25 },
            { subnet: '255.255.255.192', wildcard: '0.0.0.63', cidr: 26 },
            { subnet: '255.255.255.224', wildcard: '0.0.0.31', cidr: 27 },
            { subnet: '255.255.255.240', wildcard: '0.0.0.15', cidr: 28 },
            { subnet: '255.255.255.248', wildcard: '0.0.0.7', cidr: 29 },
            { subnet: '255.255.255.252', wildcard: '0.0.0.3', cidr: 30 },
            { subnet: '255.255.0.0', wildcard: '0.0.255.255', cidr: 16 },
            { subnet: '255.0.0.0', wildcard: '0.255.255.255', cidr: 8 }
        ];

        const selected = masks[Math.floor(Math.random() * masks.length)];
        const wrongMasks = masks.filter(m => m.wildcard !== selected.wildcard);
        const wrongOptions = wrongMasks.sort(() => Math.random() - 0.5).slice(0, 3).map(m => m.wildcard);

        return {
            category: 'wildcard_mask',
            prompt: 'What is the wildcard mask?',
            display: selected.subnet,
            subtext: 'Subnet mask shown above',
            answer: selected.wildcard,
            answerDisplay: selected.wildcard,
            options: this.ensureUniqueOptions(selected.wildcard, wrongOptions, () => {
                const wildcards = ['0.0.0.255', '0.0.0.127', '0.0.0.63', '0.0.0.31', '0.0.0.15'];
                return wildcards[Math.floor(Math.random() * wildcards.length)];
            }).map(w => ({ value: w, display: w })),
            explanation: `Wildcard = 255.255.255.255 - ${selected.subnet} = ${selected.wildcard}`
        };
    },

    /**
     * Generate Private IP question
     * Tests knowledge of RFC 1918 private IP address ranges:
     * - Class A: 10.0.0.0 - 10.255.255.255 (10.0.0.0/8)
     * - Class B: 172.16.0.0 - 172.31.255.255 (172.16.0.0/12)
     * - Class C: 192.168.0.0 - 192.168.255.255 (192.168.0.0/16)
     *
     * Includes edge cases like 172.32.x.x (public) and 192.169.x.x (public)
     * @returns {Object} Question object with Yes/No/Loopback/Link-local options
     */
    generatePrivateIP() {
        const privateRanges = [
            { range: '10.0.0.0 - 10.255.255.255', cidr: '10.0.0.0/8', class: 'A' },
            { range: '172.16.0.0 - 172.31.255.255', cidr: '172.16.0.0/12', class: 'B' },
            { range: '192.168.0.0 - 192.168.255.255', cidr: '192.168.0.0/16', class: 'C' }
        ];

        const examples = [
            { ip: '10.50.100.1', isPrivate: true, range: privateRanges[0] },
            { ip: '172.20.5.100', isPrivate: true, range: privateRanges[1] },
            { ip: '192.168.1.50', isPrivate: true, range: privateRanges[2] },
            { ip: '8.8.8.8', isPrivate: false, reason: 'Public IP (Google DNS)' },
            { ip: '1.1.1.1', isPrivate: false, reason: 'Public IP (Cloudflare)' },
            { ip: '172.32.1.1', isPrivate: false, reason: '172.32.x.x is outside private range' },
            { ip: '192.169.1.1', isPrivate: false, reason: '192.169.x.x is not in 192.168.0.0/16' },
            { ip: '11.0.0.1', isPrivate: false, reason: 'Public IP (11.x.x.x is not private)' }
        ];

        const example = examples[Math.floor(Math.random() * examples.length)];

        return {
            category: 'private_ip',
            prompt: 'Is this a private IP address?',
            display: example.ip,
            subtext: 'RFC 1918 private ranges',
            answer: example.isPrivate ? 'Yes (Private)' : 'No (Public)',
            answerDisplay: example.isPrivate ? 'Yes (Private)' : 'No (Public)',
            options: [
                { value: 'Yes (Private)', display: 'Yes (Private)' },
                { value: 'No (Public)', display: 'No (Public)' }
            ].concat([
                { value: 'Loopback', display: 'Loopback' },
                { value: 'Link-local', display: 'Link-local' }
            ].sort(() => Math.random() - 0.5).slice(0, 2)),
            explanation: example.isPrivate
                ? `${example.ip} is in the private range ${example.range.range}`
                : example.reason
        };
    },

    /**
     * Generate Binary Conversion question
     * Tests decimal <-> binary conversion for 8-bit values.
     * Focuses on subnet-relevant values: 0, 128, 192, 224, 240, 248, 252, 254, 255
     * These appear in subnet masks and are essential for mental math.
     *
     * Randomly alternates between:
     * - Decimal to binary (e.g., 192 -> 11000000)
     * - Binary to decimal (e.g., 11000000 -> 192)
     *
     * @returns {Object} Question object with prompt, options, answer, explanation
     */
    generateBinaryConvert() {
        const type = Math.random() > 0.5 ? 'dec_to_bin' : 'bin_to_dec';

        // Common subnet-related decimal values
        const decimalValues = [0, 128, 192, 224, 240, 248, 252, 254, 255, 64, 32, 16, 127, 191, 223];
        const decimal = decimalValues[Math.floor(Math.random() * decimalValues.length)];
        const binary = decimal.toString(2).padStart(8, '0');

        if (type === 'dec_to_bin') {
            // Generate wrong binary options
            const wrongBinaries = [];
            for (let i = 0; i < 6; i++) {
                const wrongDec = decimalValues[(decimalValues.indexOf(decimal) + i + 1) % decimalValues.length];
                wrongBinaries.push(wrongDec.toString(2).padStart(8, '0'));
            }

            return {
                category: 'binary_convert',
                prompt: 'Convert to binary (8-bit)',
                display: decimal.toString(),
                subtext: 'Decimal to binary',
                answer: binary,
                answerDisplay: binary,
                options: this.ensureUniqueOptions(binary, wrongBinaries, () => {
                    const randDec = Math.floor(Math.random() * 256);
                    return randDec.toString(2).padStart(8, '0');
                }).map(b => ({ value: b, display: b })),
                explanation: `${decimal} in binary = ${binary}`
            };
        } else {
            // Generate wrong decimal options
            const wrongDecimals = [];
            for (let i = 0; i < 6; i++) {
                const wrongDec = decimalValues[(decimalValues.indexOf(decimal) + i + 1) % decimalValues.length];
                wrongDecimals.push(wrongDec);
            }

            return {
                category: 'binary_convert',
                prompt: 'Convert to decimal',
                display: binary,
                subtext: 'Binary to decimal',
                answer: decimal,
                answerDisplay: decimal.toString(),
                options: this.ensureUniqueOptions(decimal, wrongDecimals, () => {
                    return Math.floor(Math.random() * 256);
                }).map(d => ({ value: d, display: d.toString() })),
                explanation: `${binary} in decimal = ${decimal}`
            };
        }
    },

    /**
     * Generate Subnet-in-Subnet question
     * Tests VLSM understanding - how many smaller subnets fit in a larger one.
     * Formula: 2^(smallCIDR - largeCIDR) = number of smaller subnets
     *
     * Example: /24 contains 4 x /26 subnets (2^(26-24) = 2^2 = 4)
     *
     * Randomly alternates between:
     * - How many /small fit in /large?
     * - What CIDR to divide /large into N subnets?
     *
     * @returns {Object} Question object with prompt, options, answer, explanation
     */
    generateSubnetInSubnet() {
        const scenarios = [
            { large: 24, small: 26, count: 4, largeHosts: 254, smallHosts: 62 },
            { large: 24, small: 27, count: 8, largeHosts: 254, smallHosts: 30 },
            { large: 24, small: 28, count: 16, largeHosts: 254, smallHosts: 14 },
            { large: 16, small: 24, count: 256, largeHosts: 65534, smallHosts: 254 },
            { large: 25, small: 27, count: 4, largeHosts: 126, smallHosts: 30 },
            { large: 26, small: 28, count: 4, largeHosts: 62, smallHosts: 14 },
            { large: 23, small: 26, count: 8, largeHosts: 510, smallHosts: 62 }
        ];

        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

        // Randomly choose question type
        const questionType = Math.floor(Math.random() * 2);

        if (questionType === 0) {
            // How many /small fit in /large?
            const wrongCounts = [
                scenario.count * 2,
                scenario.count / 2,
                scenario.count + 2,
                scenario.count - 2,
                Math.pow(2, scenario.small - scenario.large + 1),
                Math.pow(2, scenario.small - scenario.large - 1)
            ].filter(c => c > 0 && c !== scenario.count && Number.isInteger(c));

            return {
                category: 'subnet_in_subnet',
                prompt: `How many /${scenario.small} fit in a /${scenario.large}?`,
                display: `/${scenario.large} → /${scenario.small}`,
                subtext: 'Calculate subnet divisions',
                answer: scenario.count,
                answerDisplay: scenario.count.toString(),
                options: this.ensureUniqueOptions(scenario.count, wrongCounts, () => {
                    return Math.pow(2, Math.floor(Math.random() * 5) + 1);
                }).map(c => ({ value: c, display: c.toString() })),
                explanation: `/${scenario.large} (${scenario.largeHosts} hosts) divides into ${scenario.count} x /${scenario.small} (${scenario.smallHosts} hosts each)`
            };
        } else {
            // What CIDR to divide /large into N subnets?
            const wrongCidrs = [
                scenario.small - 1,
                scenario.small + 1,
                scenario.small - 2,
                scenario.small + 2,
                scenario.large + 1
            ].filter(c => c >= 16 && c <= 30 && c !== scenario.small);

            return {
                category: 'subnet_in_subnet',
                prompt: `To get ${scenario.count} equal subnets from /${scenario.large}?`,
                display: `/${scenario.large} ÷ ${scenario.count}`,
                subtext: 'What CIDR for each subnet?',
                answer: scenario.small,
                answerDisplay: `/${scenario.small}`,
                options: this.ensureUniqueOptions(scenario.small, wrongCidrs, () => {
                    return Math.floor(Math.random() * 8) + 23; // 23-30
                }).map(c => ({ value: c, display: `/${c}` })),
                explanation: `/${scenario.large} ÷ ${scenario.count} = /${scenario.small} (borrow ${scenario.small - scenario.large} bits)`
            };
        }
    },

    /**
     * Generate CIDR options for hosts_to_cidr questions
     */
    generateCidrOptions(correct) {
        const nearby = [correct - 2, correct - 1, correct + 1, correct + 2, correct + 3, correct - 3]
            .filter(c => c >= 20 && c <= 30 && c !== correct);

        return this.ensureUniqueOptions(correct, nearby, () => {
            // Generate a random valid CIDR value that isn't the correct answer
            let val;
            do {
                val = Math.floor(Math.random() * 11) + 20; // 20-30
            } while (val === correct);
            return val;
        });
    },

    /**
     * Helper to ensure exactly 4 unique options with the correct answer included.
     * This function is critical for preventing the "3-answer bug" where duplicate
     * options would reduce the visible choices.
     *
     * @param {*} answer - The correct answer (will always be included)
     * @param {Array} wrongOptions - Array of potential wrong answers
     * @param {Function} generateMoreFn - Function to generate additional options if needed
     * @returns {Array} Array of exactly 4 unique, shuffled options
     *
     * DEDUPLICATION STRATEGY:
     * 1. Normalize all values to strings for consistent comparison
     * 2. Use Set to track seen values
     * 3. Add wrong options, filtering duplicates
     * 4. If still < 4, use generateMoreFn for type-aware generation
     * 5. If still < 4, use type-aware fallback (numeric offset, IP modification)
     * 6. Final emergency fallback: "Option N" strings (should never happen)
     */
    ensureUniqueOptions(answer, wrongOptions, generateMoreFn) {
        // Normalize values to strings for consistent comparison
        const normalize = (val) => String(val).trim();
        const answerStr = normalize(answer);

        // Use a Set to track what we've seen (normalized strings)
        const seen = new Set([answerStr]);
        // Array to hold our options (original values)
        const options = [answer];

        // Add wrong options, filtering duplicates and the answer
        for (const opt of wrongOptions) {
            if (options.length >= 4) break;
            if (opt === null || opt === undefined || opt === '') continue;
            const optStr = normalize(opt);
            if (!seen.has(optStr)) {
                seen.add(optStr);
                options.push(opt);
            }
        }

        // If we need more options, use the generator function
        let attempts = 0;
        while (options.length < 4 && attempts < 100) {
            if (generateMoreFn) {
                const extra = generateMoreFn();
                if (extra !== null && extra !== undefined) {
                    const extraStr = normalize(extra);
                    if (!seen.has(extraStr)) {
                        seen.add(extraStr);
                        options.push(extra);
                    }
                }
            } else {
                break;
            }
            attempts++;
        }

        // If we still don't have 4 options, generate guaranteed unique fallbacks
        let fallbackIdx = 1;
        while (options.length < 4 && fallbackIdx <= 50) {
            let fallback;
            if (typeof answer === 'number') {
                fallback = answer + (fallbackIdx * 13);
            } else if (String(answer).includes('.') && String(answer).split('.').length === 4) {
                // IP address format
                const parts = String(answer).split('.');
                const lastOctet = parseInt(parts[3]) || 0;
                const newOctet = (lastOctet + fallbackIdx * 17) % 256;
                fallback = `${parts[0]}.${parts[1]}.${parts[2]}.${newOctet}`;
            } else {
                fallback = answer + fallbackIdx;
            }
            const fallbackStr = normalize(fallback);
            if (!seen.has(fallbackStr)) {
                seen.add(fallbackStr);
                options.push(fallback);
            }
            fallbackIdx++;
        }

        // SAFEGUARD: If we STILL don't have 4 options, force-add generic fallbacks
        // This should never happen but guarantees 4 options no matter what
        let emergencyIdx = 1;
        while (options.length < 4) {
            const emergencyVal = `Option ${emergencyIdx}`;
            if (!seen.has(emergencyVal)) {
                seen.add(emergencyVal);
                options.push(emergencyVal);
                console.warn(`[SpeedSubnet] Emergency fallback used: ${emergencyVal}`);
            }
            emergencyIdx++;
            if (emergencyIdx > 10) break; // Absolute safety limit
        }

        // Shuffle (keeping exactly 4)
        const finalOptions = options.slice(0, 4);
        for (let i = finalOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [finalOptions[i], finalOptions[j]] = [finalOptions[j], finalOptions[i]];
        }

        // Final guarantee: if somehow still not 4, log error
        if (finalOptions.length < 4) {
            console.error(`[SpeedSubnet] CRITICAL: Only ${finalOptions.length} options generated for answer:`, answer);
        }

        return finalOptions;
    },

    /**
     * Display current question
     */
    displayQuestion() {
        const q = this.currentQuestion;
        if (!this.elements.hostCount) return;

        // Update prompt text
        if (this.elements.prompt) {
            this.elements.prompt.textContent = q.prompt;
        }

        // Show main display value with animation
        // Wrap in a span with white-space:pre to absolutely prevent line breaks
        this.elements.hostCount.innerHTML = `<span style="white-space:pre;display:inline-block">${q.display}</span>`;
        this.elements.hostCount.classList.add('pop');
        setTimeout(() => {
            this.elements.hostCount.classList.remove('pop');
        }, 200);

        // Update subtext
        if (this.elements.subtext) {
            this.elements.subtext.textContent = q.subtext;
        }

        // Generate option buttons
        this.elements.cidrOptions.innerHTML = '';

        // Debug: Ensure we have exactly 4 options
        if (q.options.length !== 4) {
            console.error(`[SpeedSubnet] Question has ${q.options.length} options instead of 4:`, q.category, q.options);
        }

        q.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'speed-option';
            btn.textContent = opt.display;
            btn.dataset.value = opt.value;
            btn.dataset.key = (index + 1).toString(); // For keyboard hint display
            btn.setAttribute('aria-label', `Option ${index + 1}: ${opt.display}`);
            btn.addEventListener('click', () => this.selectAnswer(opt.value));
            this.elements.cidrOptions.appendChild(btn);
        });

        // Update progress
        if (this.elements.progress) {
            this.elements.progress.textContent = `${this.questionNumber}/${this.maxQuestions}`;
        }

        // Show category indicator
        const categoryName = this.categories[q.category].name;
        if (this.elements.feedback) {
            this.elements.feedback.textContent = categoryName;
            this.elements.feedback.className = 'speed-feedback category';
        }
    },

    /**
     * Handle answer selection
     */
    selectAnswer(value) {
        if (!this.active || !this.currentQuestion) return;

        const q = this.currentQuestion;
        const isCorrect = value === q.answer;

        this.totalQuestions++;

        // Update buttons to show correct/wrong
        const buttons = this.elements.cidrOptions.querySelectorAll('.speed-option');
        buttons.forEach(btn => {
            const btnValue = btn.dataset.value;
            btn.disabled = true;

            // Handle both string and number comparison
            if (btnValue == q.answer) {
                btn.classList.add('correct');
            } else if (btnValue == value && !isCorrect) {
                btn.classList.add('wrong');
            }
        });

        if (isCorrect) {
            this.handleCorrect();
        } else {
            this.handleWrong();
        }

        // Next question after delay (longer for wrong to read explanation)
        setTimeout(() => {
            this.nextQuestion();
        }, isCorrect ? 1000 : 2500);
    },

    /**
     * Handle correct answer
     */
    handleCorrect() {
        this.totalCorrect++;
        this.streak++;
        if (this.streak > this.bestStreak) {
            this.bestStreak = this.streak;
        }

        // Calculate points
        let points = 100;
        points *= (1 + this.streak * 0.1); // Streak bonus

        this.score += Math.round(points);

        // Show feedback
        if (this.elements.feedback) {
            const messages = ['Correct!', 'Nice!', 'Perfect!', 'Great!'];
            let msg = messages[Math.floor(Math.random() * messages.length)];
            if (this.streak >= 3) {
                msg += ` ${this.streak}x streak!`;
            }
            this.elements.feedback.textContent = msg;
            this.elements.feedback.className = 'speed-feedback correct';
        }

        // Play sound
        if (typeof Sounds !== 'undefined') {
            if (this.streak >= 5) {
                Sounds.play('streak');
            } else {
                Sounds.play('correct');
            }
        }

        // Mascot celebrates and speeds up
        if (typeof Mascot !== 'undefined') {
            Mascot.setStreak(this.streak);
            Mascot.celebrate();
        }

        this.updateUI();

        // Achievement tracking
        if (typeof Achievements !== 'undefined') {
            Achievements.unlock('first_subnet');
            if (this.streak >= 10) {
                Achievements.unlock('combo_master');
            }

            // Track category-specific achievements
            const category = this.currentQuestion?.category;
            if (category === 'port_number') {
                Achievements.updateProgress('port_expert');
            } else if (category === 'binary_convert') {
                Achievements.updateProgress('binary_wizard');
            }
        }
    },

    /**
     * Handle wrong answer
     */
    handleWrong() {
        this.streak = 0;

        // Show explanation
        if (this.elements.feedback) {
            this.elements.feedback.innerHTML = `
                <div class="wrong-header">Incorrect</div>
                <div class="explanation">${this.currentQuestion.explanation}</div>
            `;
            this.elements.feedback.className = 'speed-feedback wrong';
        }

        // Play wrong sound
        if (typeof Sounds !== 'undefined') {
            Sounds.play('wrong');
        }

        // Mascot crashes
        if (typeof Mascot !== 'undefined') {
            Mascot.setStreak(0);
            Mascot.crash();
        }

        this.updateUI();
    },

    /**
     * Update UI elements
     */
    updateUI() {
        if (this.elements.score) {
            this.elements.score.textContent = this.score.toLocaleString();
        }
        if (this.elements.streak) {
            this.elements.streak.textContent = `${this.streak}x`;
            this.elements.streak.classList.toggle('hot', this.streak >= 5);
        }
    },

    /**
     * End the game
     */
    endGame() {
        this.active = false;

        // Stop mascot animation
        this.stopMascotAnimation();

        const accuracy = this.totalQuestions > 0
            ? Math.round((this.totalCorrect / this.totalQuestions) * 100)
            : 0;

        if (this.onGameOver) {
            this.onGameOver({
                score: this.score,
                accuracy: accuracy,
                bestStreak: this.bestStreak,
                totalCorrect: this.totalCorrect,
                totalQuestions: this.totalQuestions
            });
        }
    },

    /**
     * Keyboard support
     */
    handleKeypress(key) {
        if (!this.active) return;

        const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3 };
        if (keyMap[key] !== undefined) {
            const buttons = this.elements.cidrOptions.querySelectorAll('.speed-option');
            if (buttons[keyMap[key]] && !buttons[keyMap[key]].disabled) {
                buttons[keyMap[key]].click();
            }
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpeedSubnet;
}
