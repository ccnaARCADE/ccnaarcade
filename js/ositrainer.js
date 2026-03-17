/**
 * TCP/IP & OSI Model Trainer Module
 * Interactive network model training for CCNA Arcade
 *
 * This module teaches BOTH models:
 *
 * TCP/IP 5-LAYER MODEL (Primary - used in practice):
 * 5. Application    - HTTP, FTP, DNS, DHCP, SSH, Telnet, SMTP
 * 4. Transport      - TCP, UDP (Segments)
 * 3. Network        - IP, ICMP, ARP, routing protocols (Packets)
 * 2. Data Link      - Ethernet, Wi-Fi, switching (Frames)
 * 1. Physical       - Cables, hubs, signals (Bits)
 *
 * OSI 7-LAYER MODEL (Reference - historical/theoretical):
 * 7. Application    - User interface, HTTP, FTP, DNS
 * 6. Presentation   - Data formatting, encryption (SSL/TLS)
 * 5. Session        - Session management (NetBIOS, RPC)
 * 4. Transport      - TCP, UDP
 * 3. Network        - IP, routing
 * 2. Data Link      - Ethernet, switching
 * 1. Physical       - Physical transmission
 *
 * The TCP/IP model combines OSI layers 5-7 into a single Application layer,
 * which better reflects how modern protocols actually work.
 *
 * Question Types:
 * - layer_name: Identify layer by number (both models)
 * - layer_number: Identify number by layer name
 * - pdu: Match PDU to layer (Segment, Packet, Frame, Bits)
 * - protocol_layer: Match protocol to its layer
 * - device_layer: Match network device to operating layer
 * - encapsulation: Encapsulation order questions
 * - layer_function: Layer responsibilities
 * - model_comparison: Differences between OSI and TCP/IP models
 *
 * @module OSITrainer
 * @version 3.1
 * @requires Sounds (optional) - for audio feedback
 * @requires Achievements (optional) - for tracking progress
 */
'use strict';

const OSITrainer = {
    // ========================================
    // GAME STATE
    // ========================================

    /** @type {boolean} Whether trainer is currently active */
    active: false,

    /** @type {Object|null} Current question object */
    currentQuestion: null,

    /** @type {number} Current question number (1-indexed for display) */
    questionNumber: 0,

    /** @type {number} Player's current score */
    score: 0,

    /** @type {number} Current answer streak */
    streak: 0,

    /** @type {number} Total correct answers this session */
    totalCorrect: 0,

    /** @type {number} Total questions answered this session */
    totalQuestions: 0,

    /** @type {number} Maximum questions per session */
    maxQuestions: 15,

    // ========================================
    // TCP/IP 5-LAYER MODEL (Primary)
    // This is the practical model used in real networking
    // ========================================
    tcpipLayers: [
        {
            num: 5,
            name: 'Application',
            pdu: 'Data',
            protocols: ['HTTP', 'HTTPS', 'FTP', 'SMTP', 'DNS', 'DHCP', 'Telnet', 'SSH', 'SNMP', 'POP3', 'IMAP'],
            devices: ['Firewall (L7)', 'Load Balancer'],
            description: 'User applications and network services',
            osiEquivalent: 'OSI Layers 5-7 (Session, Presentation, Application)'
        },
        {
            num: 4,
            name: 'Transport',
            pdu: 'Segment',
            protocols: ['TCP', 'UDP'],
            devices: ['Firewall (L4)'],
            description: 'End-to-end connections, reliability, flow control',
            osiEquivalent: 'OSI Layer 4'
        },
        {
            num: 3,
            name: 'Network',
            pdu: 'Packet',
            protocols: ['IP', 'ICMP', 'ARP', 'OSPF', 'EIGRP', 'BGP', 'RIP'],
            devices: ['Router', 'L3 Switch'],
            description: 'Logical addressing and routing between networks',
            osiEquivalent: 'OSI Layer 3'
        },
        {
            num: 2,
            name: 'Data Link',
            pdu: 'Frame',
            protocols: ['Ethernet', '802.11 (Wi-Fi)', 'PPP', 'HDLC', '802.1Q (VLAN)'],
            devices: ['Switch', 'Bridge', 'NIC'],
            description: 'Physical addressing (MAC), framing, error detection',
            osiEquivalent: 'OSI Layer 2'
        },
        {
            num: 1,
            name: 'Physical',
            pdu: 'Bits',
            protocols: ['Ethernet (physical)', 'DSL', 'Fiber', '802.11 (radio)'],
            devices: ['Hub', 'Repeater', 'Cables', 'Wireless AP (physical)'],
            description: 'Physical transmission of raw bits over media',
            osiEquivalent: 'OSI Layer 1'
        }
    ],

    // ========================================
    // OSI 7-LAYER MODEL (Reference/Historical)
    // The theoretical model - important for exams
    // ========================================
    osiLayers: [
        { num: 7, name: 'Application', pdu: 'Data', description: 'User interface and application services' },
        { num: 6, name: 'Presentation', pdu: 'Data', description: 'Data formatting, encryption, compression' },
        { num: 5, name: 'Session', pdu: 'Data', description: 'Session establishment, maintenance, termination' },
        { num: 4, name: 'Transport', pdu: 'Segment', description: 'End-to-end connections, reliability' },
        { num: 3, name: 'Network', pdu: 'Packet', description: 'Logical addressing and routing' },
        { num: 2, name: 'Data Link', pdu: 'Frame', description: 'Physical addressing, framing' },
        { num: 1, name: 'Physical', pdu: 'Bits', description: 'Physical transmission of bits' }
    ],

    // Use TCP/IP model as primary for questions
    get layers() {
        return this.tcpipLayers;
    },

    // Question categories
    categories: {
        layer_name: { name: 'Layer Names', weight: 3 },
        layer_number: { name: 'Layer Numbers', weight: 2 },
        pdu: { name: 'PDU Names', weight: 3 },
        protocol_layer: { name: 'Protocol → Layer', weight: 4 },
        device_layer: { name: 'Device → Layer', weight: 2 },
        encapsulation: { name: 'Encapsulation Order', weight: 2 },
        layer_function: { name: 'Layer Functions', weight: 2 },
        model_comparison: { name: 'OSI vs TCP/IP', weight: 3 }
    },

    enabledCategories: [],
    elements: {},

    /**
     * Initialize the module
     */
    init() {
        this.elements = {
            container: document.getElementById('osi-trainer-screen'),
            questionArea: document.getElementById('osi-question-area'),
            prompt: document.getElementById('osi-question-text'),
            options: document.getElementById('osi-options'),
            feedback: document.getElementById('osi-feedback'),
            score: document.getElementById('osi-score'),
            streak: document.getElementById('osi-streak'),
            progress: document.getElementById('osi-progress'),
            layerDiagram: document.getElementById('osi-layer-diagram')
        };

        this.enabledCategories = Object.keys(this.categories);
    },

    /**
     * Start the trainer
     */
    start(options = {}) {
        this.active = true;
        this.score = 0;
        this.streak = 0;
        this.totalCorrect = 0;
        this.totalQuestions = 0;
        this.questionNumber = 0;
        this.maxQuestions = options.maxQuestions || 15;

        if (options.categories) {
            this.enabledCategories = options.categories;
        }

        this.updateUI();
        this.nextQuestion();
    },

    /**
     * Generate next question
     */
    nextQuestion() {
        if (this.questionNumber >= this.maxQuestions) {
            this.endGame();
            return;
        }

        const category = this.pickWeightedCategory();
        const question = this.generateQuestion(category);

        this.currentQuestion = question;
        this.questionNumber++;

        this.displayQuestion();
    },

    /**
     * Pick a weighted random category
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
     * Generate a question for a category
     */
    generateQuestion(category) {
        switch (category) {
            case 'layer_name':
                return this.generateLayerNameQuestion();
            case 'layer_number':
                return this.generateLayerNumberQuestion();
            case 'pdu':
                return this.generatePDUQuestion();
            case 'protocol_layer':
                return this.generateProtocolLayerQuestion();
            case 'device_layer':
                return this.generateDeviceLayerQuestion();
            case 'encapsulation':
                return this.generateEncapsulationQuestion();
            case 'layer_function':
                return this.generateLayerFunctionQuestion();
            case 'model_comparison':
                return this.generateModelComparisonQuestion();
            default:
                return this.generateLayerNameQuestion();
        }
    },

    /**
     * Generate layer name question (TCP/IP model)
     */
    generateLayerNameQuestion() {
        const layer = this.layers[Math.floor(Math.random() * this.layers.length)];
        const wrongLayers = this.layers.filter(l => l.num !== layer.num);
        const wrongOptions = wrongLayers.sort(() => Math.random() - 0.5).slice(0, 3).map(l => l.name);

        return {
            category: 'layer_name',
            prompt: `In the TCP/IP model, what is Layer ${layer.num} called?`,
            answer: layer.name,
            options: this.shuffleOptions(layer.name, wrongOptions),
            explanation: `Layer ${layer.num} is the ${layer.name} layer: ${layer.description}`
        };
    },

    /**
     * Generate layer number question
     */
    generateLayerNumberQuestion() {
        const layer = this.layers[Math.floor(Math.random() * this.layers.length)];
        const wrongNumbers = [1, 2, 3, 4, 5].filter(n => n !== layer.num);
        const wrongOptions = wrongNumbers.sort(() => Math.random() - 0.5).slice(0, 3).map(n => `Layer ${n}`);

        return {
            category: 'layer_number',
            prompt: `In the TCP/IP model, what layer number is the ${layer.name} layer?`,
            answer: `Layer ${layer.num}`,
            options: this.shuffleOptions(`Layer ${layer.num}`, wrongOptions),
            explanation: `The ${layer.name} layer is Layer ${layer.num} in the TCP/IP model.`
        };
    },

    /**
     * Generate PDU question
     */
    generatePDUQuestion() {
        // Focus on layers with distinct PDUs
        const pduLayers = this.layers.filter(l => ['Segment', 'Packet', 'Frame', 'Bits'].includes(l.pdu));
        const layer = pduLayers[Math.floor(Math.random() * pduLayers.length)];

        const allPDUs = ['Data', 'Segment', 'Packet', 'Frame', 'Bits'];
        const wrongPDUs = allPDUs.filter(p => p !== layer.pdu).slice(0, 3);

        return {
            category: 'pdu',
            prompt: `What is the PDU (Protocol Data Unit) at the ${layer.name} layer?`,
            answer: layer.pdu,
            options: this.shuffleOptions(layer.pdu, wrongPDUs),
            explanation: `At Layer ${layer.num} (${layer.name}), the PDU is called a ${layer.pdu}.`
        };
    },

    /**
     * Generate protocol to layer question
     */
    generateProtocolLayerQuestion() {
        // Collect all protocols with their layers
        const protocolOptions = [];
        for (const layer of this.layers) {
            for (const protocol of layer.protocols) {
                protocolOptions.push({ protocol, layer });
            }
        }

        const selected = protocolOptions[Math.floor(Math.random() * protocolOptions.length)];
        const wrongLayers = this.layers.filter(l => l.num !== selected.layer.num);
        const wrongOptions = wrongLayers.sort(() => Math.random() - 0.5).slice(0, 3).map(l => l.name);

        return {
            category: 'protocol_layer',
            prompt: `At which layer does ${selected.protocol} operate?`,
            answer: selected.layer.name,
            options: this.shuffleOptions(selected.layer.name, wrongOptions),
            explanation: `${selected.protocol} operates at Layer ${selected.layer.num} (${selected.layer.name}).`
        };
    },

    /**
     * Generate device to layer question
     */
    generateDeviceLayerQuestion() {
        // Collect all devices with their layers
        const deviceOptions = [];
        for (const layer of this.layers) {
            for (const device of layer.devices) {
                deviceOptions.push({ device, layer });
            }
        }

        if (deviceOptions.length === 0) {
            return this.generateLayerNameQuestion();
        }

        const selected = deviceOptions[Math.floor(Math.random() * deviceOptions.length)];
        const wrongLayers = this.layers.filter(l => l.num !== selected.layer.num);
        const wrongOptions = wrongLayers.sort(() => Math.random() - 0.5).slice(0, 3).map(l => `Layer ${l.num}`);

        return {
            category: 'device_layer',
            prompt: `At which layer does a ${selected.device} primarily operate?`,
            answer: `Layer ${selected.layer.num}`,
            options: this.shuffleOptions(`Layer ${selected.layer.num}`, wrongOptions),
            explanation: `A ${selected.device} operates at Layer ${selected.layer.num} (${selected.layer.name}).`
        };
    },

    /**
     * Generate encapsulation order question
     */
    generateEncapsulationQuestion() {
        const questions = [
            {
                prompt: 'When sending data, which layer adds its header FIRST?',
                answer: 'Application layer',
                wrong: ['Transport layer', 'Network layer', 'Data Link layer'],
                explanation: 'Encapsulation starts at the Application layer (top) and works down to Physical.'
            },
            {
                prompt: 'When receiving data, which layer processes the data FIRST?',
                answer: 'Physical layer',
                wrong: ['Application layer', 'Transport layer', 'Network layer'],
                explanation: 'De-encapsulation starts at the Physical layer (bottom) and works up to Application.'
            },
            {
                prompt: 'What is the correct encapsulation order from top to bottom?',
                answer: 'Data → Segment → Packet → Frame → Bits',
                wrong: ['Bits → Frame → Packet → Segment → Data', 'Packet → Frame → Data → Segment → Bits', 'Segment → Data → Frame → Packet → Bits'],
                explanation: 'Data (L5) → Segment (L4) → Packet (L3) → Frame (L2) → Bits (L1)'
            },
            {
                prompt: 'A TCP header is added to create what PDU?',
                answer: 'Segment',
                wrong: ['Packet', 'Frame', 'Data'],
                explanation: 'TCP operates at Layer 4 (Transport), which creates Segments.'
            },
            {
                prompt: 'An IP header is added to create what PDU?',
                answer: 'Packet',
                wrong: ['Segment', 'Frame', 'Data'],
                explanation: 'IP operates at Layer 3 (Network), which creates Packets.'
            }
        ];

        const q = questions[Math.floor(Math.random() * questions.length)];
        return {
            category: 'encapsulation',
            prompt: q.prompt,
            answer: q.answer,
            options: this.shuffleOptions(q.answer, q.wrong),
            explanation: q.explanation
        };
    },

    /**
     * Generate layer function question
     */
    generateLayerFunctionQuestion() {
        const layer = this.layers[Math.floor(Math.random() * this.layers.length)];
        const wrongLayers = this.layers.filter(l => l.num !== layer.num);
        const wrongOptions = wrongLayers.sort(() => Math.random() - 0.5).slice(0, 3).map(l => l.description);

        return {
            category: 'layer_function',
            prompt: `Which describes the ${layer.name} layer?`,
            answer: layer.description,
            options: this.shuffleOptions(layer.description, wrongOptions),
            explanation: `The ${layer.name} layer (Layer ${layer.num}): ${layer.description}`
        };
    },

    /**
     * Generate model comparison question (OSI vs TCP/IP)
     */
    generateModelComparisonQuestion() {
        const questions = [
            {
                prompt: 'How many layers does the TCP/IP model have?',
                answer: '5 layers',
                wrong: ['4 layers', '7 layers', '6 layers'],
                explanation: 'The TCP/IP model has 5 layers: Physical, Data Link, Network, Transport, and Application.'
            },
            {
                prompt: 'How many layers does the OSI model have?',
                answer: '7 layers',
                wrong: ['5 layers', '4 layers', '6 layers'],
                explanation: 'The OSI model has 7 layers. The TCP/IP model combines layers 5-7 into one Application layer.'
            },
            {
                prompt: 'Which OSI layers does the TCP/IP Application layer combine?',
                answer: 'Session, Presentation, Application',
                wrong: ['Physical, Data Link, Network', 'Transport, Network, Data Link', 'Only Application'],
                explanation: 'TCP/IP combines OSI layers 5 (Session), 6 (Presentation), and 7 (Application) into one Application layer.'
            },
            {
                prompt: 'Which model is used more in real-world networking?',
                answer: 'TCP/IP model',
                wrong: ['OSI model', 'Both equally', 'Neither'],
                explanation: 'The TCP/IP model is the practical model used in real networking. OSI is primarily a reference model for understanding concepts.'
            },
            {
                prompt: 'What layer in OSI handles encryption and compression?',
                answer: 'Presentation (Layer 6)',
                wrong: ['Application (Layer 7)', 'Session (Layer 5)', 'Transport (Layer 4)'],
                explanation: 'In OSI, the Presentation layer (L6) handles data formatting, encryption, and compression. In TCP/IP, this is part of the Application layer.'
            },
            {
                prompt: 'What layer in OSI manages sessions between applications?',
                answer: 'Session (Layer 5)',
                wrong: ['Application (Layer 7)', 'Transport (Layer 4)', 'Presentation (Layer 6)'],
                explanation: 'In OSI, the Session layer (L5) manages sessions. In TCP/IP, session management is part of the Application layer.'
            },
            {
                prompt: 'Why was the TCP/IP model created?',
                answer: 'For practical implementation',
                wrong: ['For theoretical study', 'To replace all networks', 'For certification exams'],
                explanation: 'TCP/IP was designed for practical implementation of the Internet. OSI was more theoretical and came later as a reference model.'
            },
            {
                prompt: 'Which model came first historically?',
                answer: 'TCP/IP model',
                wrong: ['OSI model', 'They were created together', 'Neither - they evolved separately'],
                explanation: 'TCP/IP (1970s) predates OSI (1984). TCP/IP was developed for ARPANET, while OSI was created as an international standard reference model.'
            }
        ];

        const q = questions[Math.floor(Math.random() * questions.length)];
        return {
            category: 'model_comparison',
            prompt: q.prompt,
            answer: q.answer,
            options: this.shuffleOptions(q.answer, q.wrong),
            explanation: q.explanation
        };
    },

    /**
     * Shuffle options with correct answer
     */
    shuffleOptions(correct, wrong) {
        const options = [correct, ...wrong];
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        return options.map(opt => ({ value: opt, display: opt }));
    },

    /**
     * Display current question
     */
    displayQuestion() {
        const q = this.currentQuestion;
        if (!this.elements.prompt) return;

        this.elements.prompt.textContent = q.prompt;

        if (this.elements.options) {
            this.elements.options.innerHTML = '';

            q.options.forEach((opt, index) => {
                const btn = document.createElement('button');
                btn.className = 'osi-option';
                btn.textContent = opt.display;
                btn.dataset.value = opt.value;
                btn.addEventListener('click', () => this.selectAnswer(opt.value));
                this.elements.options.appendChild(btn);
            });
        }

        // Clear any previous highlights (don't highlight answer yet - that would give it away!)
        this.clearLayerHighlights();

        this.updateUI();
    },

    /**
     * Clear all layer highlights
     */
    clearLayerHighlights() {
        if (!this.elements.layerDiagram) return;
        const layers = this.elements.layerDiagram.querySelectorAll('.osi-layer');
        layers.forEach(l => l.classList.remove('highlight'));
    },

    /**
     * Highlight relevant layer in the diagram
     */
    highlightLayer(question) {
        if (!this.elements.layerDiagram) return;

        // Remove all highlights
        const layers = this.elements.layerDiagram.querySelectorAll('.osi-layer');
        layers.forEach(l => l.classList.remove('highlight'));

        // Try to determine which layer to highlight based on the answer
        const answer = question.answer;
        let layerNum = null;

        // Check if answer contains layer number
        const layerMatch = answer.match(/Layer (\d)/);
        if (layerMatch) {
            layerNum = parseInt(layerMatch[1]);
        }

        // Check if answer is a layer name
        const layer = this.layers.find(l => l.name === answer);
        if (layer) {
            layerNum = layer.num;
        }

        // Highlight the layer
        if (layerNum && layerNum >= 1 && layerNum <= 5) {
            const layerEl = this.elements.layerDiagram.querySelector(`.osi-l${layerNum}`);
            if (layerEl) {
                layerEl.classList.add('highlight');
            }
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

        const buttons = this.elements.options.querySelectorAll('.osi-option');
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.value === q.answer) {
                btn.classList.add('correct');
            } else if (btn.dataset.value === value && !isCorrect) {
                btn.classList.add('wrong');
            }
        });

        if (isCorrect) {
            this.handleCorrect();
        } else {
            this.handleWrong();
        }

        // Show feedback and highlight the correct layer
        if (this.elements.feedback) {
            this.elements.feedback.textContent = q.explanation;
            this.elements.feedback.className = 'osi-feedback ' + (isCorrect ? 'correct' : 'wrong');
        }

        // Now highlight the relevant layer to help learning
        this.highlightLayer(q);

        setTimeout(() => {
            this.nextQuestion();
        }, isCorrect ? 1500 : 2500);
    },

    /**
     * Handle correct answer
     */
    handleCorrect() {
        this.totalCorrect++;
        this.streak++;

        let points = 100;
        points *= (1 + this.streak * 0.1);
        this.score += Math.round(points);

        if (typeof Sounds !== 'undefined') {
            Sounds.play('correct');
        }

        this.updateUI();
    },

    /**
     * Handle wrong answer
     */
    handleWrong() {
        this.streak = 0;

        if (typeof Sounds !== 'undefined') {
            Sounds.play('wrong');
        }

        this.updateUI();
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
            this.elements.progress.textContent = `${this.questionNumber}/${this.maxQuestions}`;
        }
    },

    /**
     * End the game
     */
    endGame() {
        this.active = false;

        const accuracy = this.totalQuestions > 0
            ? Math.round((this.totalCorrect / this.totalQuestions) * 100)
            : 0;

        // Track achievements
        if (typeof Achievements !== 'undefined') {
            Achievements.unlock('osi_first');

            if (this.score >= 1000) {
                Achievements.unlock('osi_master');
            }
        }

        if (this.onComplete) {
            this.onComplete({
                score: this.score,
                accuracy: accuracy,
                totalCorrect: this.totalCorrect,
                totalQuestions: this.totalQuestions
            });
        }
    },

    /**
     * Stop the trainer
     */
    stop() {
        this.active = false;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OSITrainer;
}
