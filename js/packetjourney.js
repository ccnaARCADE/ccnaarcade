/**
 * Packet Journey Module
 * Interactive network packet visualization and training for CCNA Arcade
 *
 * This module provides an educational experience where users follow a packet
 * through various network scenarios, learning about:
 * - ARP resolution
 * - DNS lookups
 * - TCP handshakes
 * - Routing decisions
 * - OSI layer encapsulation
 * - VLAN concepts
 *
 * @module PacketJourney
 * @requires Sounds (optional) - for audio feedback
 * @requires Achievements (optional) - for tracking progress
 */
'use strict';

const PacketJourney = {
    // ========================================
    // GAME STATE
    // ========================================

    /** @type {boolean} Whether a scenario is currently active */
    active: false,

    /** @type {Object|null} The currently loaded scenario object */
    currentScenario: null,

    /** @type {number} Current step index within the scenario */
    currentStep: 0,

    /** @type {number} Player's current score */
    score: 0,

    /** @type {number} Number of correctly answered questions */
    correctAnswers: 0,

    /** @type {number} Total questions in current scenario */
    totalQuestions: 0,

    /** @type {Set} Set of completed scenario IDs for achievement tracking */
    completedScenarios: new Set(),

    // ========================================
    // RENDERING STATE
    // ========================================

    /** @type {Object|null} Deep copy of current scenario's topology */
    topology: null,

    /** @type {Object|null} Packet animation state (unused, reserved for future) */
    packet: null,

    /** @type {number|null} RequestAnimationFrame ID for cleanup */
    animationId: null,

    /** @type {HTMLCanvasElement|null} Network visualization canvas */
    canvas: null,

    /** @type {CanvasRenderingContext2D|null} Canvas 2D rendering context */
    ctx: null,

    // ========================================
    // MASCOT STATE - "Packie" the packet
    // ========================================
    mascot: {
        x: 0,           // Current X position
        y: 0,           // Current Y position
        targetX: 0,     // Target X for smooth movement
        targetY: 0,     // Target Y for smooth movement
        state: 'idle',  // Animation state: 'idle', 'moving', 'happy', 'sad'
        frame: 0        // Animation frame counter
    },

    // ========================================
    // DEVICE RENDERING CONFIGURATION
    // Each device type has visual properties for canvas drawing
    // ========================================
    deviceTypes: {
        pc:       { icon: 'PC',  color: '#00d4ff', width: 60, height: 40 },  // End user computer
        server:   { icon: 'SRV', color: '#00ff9d', width: 60, height: 50 },  // Server/host
        switch:   { icon: 'SW',  color: '#ffd400', width: 70, height: 30 },  // Layer 2 switch
        router:   { icon: 'RTR', color: '#ff6b9d', width: 70, height: 40 },  // Layer 3 router
        firewall: { icon: 'FW',  color: '#ff4444', width: 60, height: 45 },  // Security device
        cloud:    { icon: 'NET', color: '#9d00ff', width: 80, height: 50 }   // Internet/WAN cloud
    },

    // Scenario templates
    scenarios: [
        {
            id: 'local_web',
            name: 'Local Web Request',
            description: 'PC requests a webpage from a local server',
            difficulty: 'easy',
            topology: {
                devices: [
                    { id: 'pc1', type: 'pc', x: 80, y: 200, ip: '192.168.1.10', mac: 'AA:BB:CC:11:22:33', label: 'Your PC' },
                    { id: 'switch1', type: 'switch', x: 250, y: 200, label: 'Switch' },
                    { id: 'server1', type: 'server', x: 420, y: 200, ip: '192.168.1.100', mac: 'DD:EE:FF:44:55:66', label: 'Web Server' }
                ],
                connections: [
                    { from: 'pc1', to: 'switch1' },
                    { from: 'switch1', to: 'server1' }
                ],
                gateway: null,
                subnet: '192.168.1.0/24'
            },
            steps: [
                {
                    type: 'question',
                    prompt: 'You want to access http://192.168.1.100. What port does HTTP use?',
                    options: ['Port 80', 'Port 443', 'Port 22', 'Port 25'],
                    correct: 0,
                    explanation: 'HTTP uses port 80. HTTPS uses 443, SSH uses 22, SMTP uses 25.'
                },
                {
                    type: 'question',
                    prompt: 'Is 192.168.1.100 on the same network as your PC (192.168.1.10/24)?',
                    options: ['Yes, same network', 'No, different network'],
                    correct: 0,
                    explanation: 'Both IPs are in the 192.168.1.0/24 subnet, so they are on the same network.'
                },
                {
                    type: 'question',
                    prompt: 'Since they\'re on the same network, what destination MAC goes in the frame?',
                    options: ['Server\'s MAC (DD:EE:FF:44:55:66)', 'Router\'s MAC', 'Broadcast (FF:FF:FF:FF:FF:FF)', 'Your MAC'],
                    correct: 0,
                    explanation: 'For same-network communication, the frame goes directly to the destination\'s MAC address.'
                },
                {
                    type: 'question',
                    prompt: 'But wait - your PC doesn\'t know the server\'s MAC yet. What protocol resolves IP to MAC?',
                    options: ['ARP', 'DNS', 'DHCP', 'ICMP'],
                    correct: 0,
                    explanation: 'ARP (Address Resolution Protocol) resolves IP addresses to MAC addresses on the local network.'
                },
                {
                    type: 'animate',
                    action: 'send_arp',
                    description: 'PC sends ARP broadcast: "Who has 192.168.1.100?"'
                },
                {
                    type: 'animate',
                    action: 'receive_arp',
                    description: 'Server replies: "192.168.1.100 is at DD:EE:FF:44:55:66"'
                },
                {
                    type: 'question',
                    prompt: 'Now the packet can be sent! At which OSI layer is the MAC address added?',
                    options: ['Layer 2 - Data Link', 'Layer 3 - Network', 'Layer 4 - Transport', 'Layer 1 - Physical'],
                    correct: 0,
                    explanation: 'MAC addresses are part of the Layer 2 (Data Link) frame header.'
                },
                {
                    type: 'animate',
                    action: 'send_packet',
                    description: 'Packet travels: PC → Switch → Server'
                }
            ]
        },
        {
            id: 'remote_web',
            name: 'Internet Web Request',
            description: 'PC requests a webpage from the Internet',
            difficulty: 'medium',
            topology: {
                devices: [
                    { id: 'pc1', type: 'pc', x: 60, y: 200, ip: '10.0.0.50', mac: 'AA:BB:CC:11:22:33', label: 'Your PC' },
                    { id: 'switch1', type: 'switch', x: 180, y: 200, label: 'Switch' },
                    { id: 'router1', type: 'router', x: 300, y: 200, ip: '10.0.0.1', mac: '11:22:33:44:55:66', label: 'Router' },
                    { id: 'cloud1', type: 'cloud', x: 450, y: 200, ip: '8.8.8.8', label: 'Internet' }
                ],
                connections: [
                    { from: 'pc1', to: 'switch1' },
                    { from: 'switch1', to: 'router1' },
                    { from: 'router1', to: 'cloud1' }
                ],
                gateway: 'router1',
                subnet: '10.0.0.0/24'
            },
            steps: [
                {
                    type: 'question',
                    prompt: 'You want to visit google.com. First, what needs to happen?',
                    options: ['DNS lookup to get IP', 'ARP request for Google', 'Send HTTP directly', 'Ping the server'],
                    correct: 0,
                    explanation: 'DNS resolves the domain name "google.com" to an IP address.'
                },
                {
                    type: 'question',
                    prompt: 'DNS returned 8.8.8.8. Is this on the same network as 10.0.0.50/24?',
                    options: ['No, different network', 'Yes, same network'],
                    correct: 0,
                    explanation: '8.8.8.8 is not in the 10.0.0.0/24 range, so it\'s on a different network.'
                },
                {
                    type: 'question',
                    prompt: 'Since it\'s a different network, what destination MAC goes in the frame?',
                    options: ['Default gateway\'s MAC', 'Google\'s MAC', 'Broadcast MAC', 'Switch\'s MAC'],
                    correct: 0,
                    explanation: 'For remote destinations, packets go to the default gateway (router). The frame uses the router\'s MAC.'
                },
                {
                    type: 'question',
                    prompt: 'But the IP destination in the packet header is still:',
                    options: ['8.8.8.8 (Google)', '10.0.0.1 (Router)', '10.0.0.50 (Your PC)', '255.255.255.255'],
                    correct: 0,
                    explanation: 'The IP destination stays as the final destination. Only the MAC changes at each hop.'
                },
                {
                    type: 'animate',
                    action: 'send_to_router',
                    description: 'Frame sent to router (MAC: 11:22:33:44:55:66), IP dest: 8.8.8.8'
                },
                {
                    type: 'question',
                    prompt: 'When the router receives the frame, what does it do?',
                    options: ['Strips L2 header, checks L3, creates new frame', 'Forwards frame unchanged', 'Sends ARP to Google', 'Drops the packet'],
                    correct: 0,
                    explanation: 'The router removes the old frame header, looks at the IP destination, and creates a new frame for the next hop.'
                },
                {
                    type: 'animate',
                    action: 'route_packet',
                    description: 'Router forwards packet toward the Internet'
                }
            ]
        },
        {
            id: 'dns_lookup',
            name: 'DNS Resolution',
            description: 'Understanding how DNS resolves names to IPs',
            difficulty: 'easy',
            topology: {
                devices: [
                    { id: 'pc1', type: 'pc', x: 60, y: 200, ip: '192.168.1.10', label: 'Your PC' },
                    { id: 'router1', type: 'router', x: 220, y: 200, ip: '192.168.1.1', label: 'Router' },
                    { id: 'dns', type: 'server', x: 380, y: 120, ip: '8.8.8.8', label: 'DNS Server' },
                    { id: 'web', type: 'server', x: 380, y: 280, ip: '93.184.216.34', label: 'example.com' }
                ],
                connections: [
                    { from: 'pc1', to: 'router1' },
                    { from: 'router1', to: 'dns' },
                    { from: 'router1', to: 'web' }
                ],
                gateway: 'router1',
                subnet: '192.168.1.0/24'
            },
            steps: [
                {
                    type: 'question',
                    prompt: 'You type "example.com" in your browser. What happens first?',
                    options: ['DNS query is sent', 'TCP connection to website', 'ARP for example.com', 'HTTP GET request'],
                    correct: 0,
                    explanation: 'The browser needs to resolve the domain name to an IP address first using DNS.'
                },
                {
                    type: 'question',
                    prompt: 'What transport protocol does DNS typically use?',
                    options: ['UDP port 53', 'TCP port 53', 'UDP port 80', 'TCP port 443'],
                    correct: 0,
                    explanation: 'DNS queries typically use UDP port 53 for speed. TCP is used for zone transfers or large responses.'
                },
                {
                    type: 'animate',
                    action: 'dns_query',
                    description: 'PC sends DNS query: "What is the IP for example.com?"'
                },
                {
                    type: 'animate',
                    action: 'dns_response',
                    description: 'DNS server responds: "example.com = 93.184.216.34"'
                },
                {
                    type: 'question',
                    prompt: 'Now the browser knows the IP. What type of connection does HTTP/HTTPS use?',
                    options: ['TCP (reliable)', 'UDP (fast)', 'ICMP', 'ARP'],
                    correct: 0,
                    explanation: 'HTTP/HTTPS uses TCP because web pages need reliable, ordered delivery of data.'
                },
                {
                    type: 'question',
                    prompt: 'TCP needs to establish a connection first. What is this process called?',
                    options: ['Three-way handshake', 'ARP resolution', 'DNS lookup', 'DHCP lease'],
                    correct: 0,
                    explanation: 'TCP uses a three-way handshake (SYN, SYN-ACK, ACK) to establish a reliable connection.'
                }
            ]
        },
        {
            id: 'arp_discovery',
            name: 'ARP Discovery',
            description: 'Learn how ARP resolves IP to MAC addresses',
            difficulty: 'medium',
            topology: {
                devices: [
                    { id: 'pc1', type: 'pc', x: 60, y: 150, ip: '192.168.1.10', mac: 'AA:BB:CC:11:22:33', label: 'PC A' },
                    { id: 'pc2', type: 'pc', x: 60, y: 280, ip: '192.168.1.20', mac: 'DD:EE:FF:44:55:66', label: 'PC B' },
                    { id: 'switch1', type: 'switch', x: 250, y: 200, label: 'Switch' },
                    { id: 'pc3', type: 'pc', x: 440, y: 150, ip: '192.168.1.30', mac: '11:22:33:44:55:66', label: 'PC C' },
                    { id: 'pc4', type: 'pc', x: 440, y: 280, ip: '192.168.1.40', mac: '77:88:99:AA:BB:CC', label: 'PC D' }
                ],
                connections: [
                    { from: 'pc1', to: 'switch1' },
                    { from: 'pc2', to: 'switch1' },
                    { from: 'switch1', to: 'pc3' },
                    { from: 'switch1', to: 'pc4' }
                ],
                gateway: null,
                subnet: '192.168.1.0/24'
            },
            steps: [
                {
                    type: 'question',
                    prompt: 'PC A wants to ping PC C (192.168.1.30). What does PC A need to discover first?',
                    options: ['PC C\'s MAC address', 'PC C\'s hostname', 'The switch\'s MAC', 'The router\'s IP'],
                    correct: 0,
                    explanation: 'To send a frame on the local network, PC A needs to know the destination MAC address.'
                },
                {
                    type: 'question',
                    prompt: 'What type of frame does PC A send to discover the MAC address?',
                    options: ['ARP Request (broadcast)', 'ARP Reply (unicast)', 'ICMP Echo', 'DNS Query'],
                    correct: 0,
                    explanation: 'ARP requests are sent as broadcasts (FF:FF:FF:FF:FF:FF) so all hosts receive them.'
                },
                {
                    type: 'question',
                    prompt: 'What destination MAC is used in the ARP request frame?',
                    options: ['FF:FF:FF:FF:FF:FF (broadcast)', 'PC C\'s MAC', 'Switch\'s MAC', '00:00:00:00:00:00'],
                    correct: 0,
                    explanation: 'ARP requests use the broadcast MAC address so all devices on the network receive it.'
                },
                {
                    type: 'animate',
                    action: 'send_arp_broadcast',
                    description: 'PC A broadcasts: "Who has 192.168.1.30? Tell 192.168.1.10"'
                },
                {
                    type: 'question',
                    prompt: 'The switch receives the broadcast. What does it do?',
                    options: ['Floods it out all ports (except source)', 'Forwards to PC C only', 'Drops the frame', 'Sends to router'],
                    correct: 0,
                    explanation: 'Switches flood broadcast frames out all ports except the one it was received on.'
                },
                {
                    type: 'question',
                    prompt: 'PC B, C, and D all receive the ARP request. Who responds?',
                    options: ['Only PC C (192.168.1.30)', 'All PCs respond', 'The switch responds', 'No one responds'],
                    correct: 0,
                    explanation: 'Only the device with the requested IP address (PC C) sends an ARP reply.'
                },
                {
                    type: 'animate',
                    action: 'receive_arp',
                    description: 'PC C replies: "192.168.1.30 is at 11:22:33:44:55:66"'
                },
                {
                    type: 'question',
                    prompt: 'Where does PC A store the learned MAC address?',
                    options: ['ARP cache/table', 'DNS cache', 'Routing table', 'CAM table'],
                    correct: 0,
                    explanation: 'Hosts store IP-to-MAC mappings in their ARP cache for future use.'
                }
            ]
        },
        {
            id: 'tcp_handshake',
            name: 'TCP Three-Way Handshake',
            description: 'Understanding TCP connection establishment',
            difficulty: 'medium',
            topology: {
                devices: [
                    { id: 'client', type: 'pc', x: 80, y: 200, ip: '192.168.1.10', label: 'Client' },
                    { id: 'switch1', type: 'switch', x: 250, y: 200, label: 'Switch' },
                    { id: 'server', type: 'server', x: 420, y: 200, ip: '192.168.1.100', label: 'Web Server' }
                ],
                connections: [
                    { from: 'client', to: 'switch1' },
                    { from: 'switch1', to: 'server' }
                ],
                gateway: null,
                subnet: '192.168.1.0/24'
            },
            steps: [
                {
                    type: 'question',
                    prompt: 'Before HTTP data transfer, what must TCP establish?',
                    options: ['A connection (session)', 'A DNS record', 'An ARP entry', 'A VLAN'],
                    correct: 0,
                    explanation: 'TCP is connection-oriented - it establishes a session before transferring data.'
                },
                {
                    type: 'question',
                    prompt: 'What flag does the client set in the first TCP segment?',
                    options: ['SYN', 'ACK', 'FIN', 'RST'],
                    correct: 0,
                    explanation: 'SYN (Synchronize) initiates the connection and synchronizes sequence numbers.'
                },
                {
                    type: 'animate',
                    action: 'send_syn',
                    description: 'Client sends: SYN, Seq=100'
                },
                {
                    type: 'question',
                    prompt: 'What flags does the server respond with?',
                    options: ['SYN + ACK', 'ACK only', 'SYN only', 'FIN + ACK'],
                    correct: 0,
                    explanation: 'The server acknowledges the client\'s SYN and sends its own SYN in one segment.'
                },
                {
                    type: 'animate',
                    action: 'send_synack',
                    description: 'Server responds: SYN+ACK, Seq=300, Ack=101'
                },
                {
                    type: 'question',
                    prompt: 'What does the client send to complete the handshake?',
                    options: ['ACK', 'SYN', 'FIN', 'RST'],
                    correct: 0,
                    explanation: 'The final ACK completes the three-way handshake. Connection is now ESTABLISHED.'
                },
                {
                    type: 'animate',
                    action: 'send_ack',
                    description: 'Client sends: ACK, Seq=101, Ack=301'
                },
                {
                    type: 'question',
                    prompt: 'After the handshake, what can now happen?',
                    options: ['Data transfer begins', 'ARP resolution', 'DNS lookup', 'Another handshake'],
                    correct: 0,
                    explanation: 'With the connection established, HTTP requests and responses can be exchanged.'
                }
            ]
        },
        {
            id: 'vlan_basics',
            name: 'VLAN Basics',
            description: 'Understanding virtual LANs',
            difficulty: 'hard',
            topology: {
                devices: [
                    { id: 'pc1', type: 'pc', x: 60, y: 120, ip: '192.168.10.10', label: 'Sales PC', vlan: 10 },
                    { id: 'pc2', type: 'pc', x: 60, y: 280, ip: '192.168.20.10', label: 'IT PC', vlan: 20 },
                    { id: 'switch1', type: 'switch', x: 220, y: 200, label: 'Switch 1' },
                    { id: 'switch2', type: 'switch', x: 380, y: 200, label: 'Switch 2' },
                    { id: 'pc3', type: 'pc', x: 520, y: 120, ip: '192.168.10.20', label: 'Sales PC2', vlan: 10 },
                    { id: 'pc4', type: 'pc', x: 520, y: 280, ip: '192.168.20.20', label: 'IT PC2', vlan: 20 }
                ],
                connections: [
                    { from: 'pc1', to: 'switch1' },
                    { from: 'pc2', to: 'switch1' },
                    { from: 'switch1', to: 'switch2', trunk: true },
                    { from: 'switch2', to: 'pc3' },
                    { from: 'switch2', to: 'pc4' }
                ],
                gateway: null,
                subnet: '192.168.0.0/16'
            },
            steps: [
                {
                    type: 'question',
                    prompt: 'What does VLAN stand for?',
                    options: ['Virtual Local Area Network', 'Very Large Area Network', 'Virtual Link Access Node', 'Variable LAN'],
                    correct: 0,
                    explanation: 'VLANs create separate broadcast domains within a single physical switch.'
                },
                {
                    type: 'question',
                    prompt: 'Sales PC (VLAN 10) sends a broadcast. Who receives it?',
                    options: ['Only VLAN 10 devices', 'All devices on switch', 'Only same switch devices', 'No one'],
                    correct: 0,
                    explanation: 'VLANs segment broadcast domains - broadcasts stay within the VLAN.'
                },
                {
                    type: 'question',
                    prompt: 'Can Sales PC directly communicate with IT PC without a router?',
                    options: ['No - different VLANs/subnets', 'Yes - same switch', 'Yes - using ARP', 'Depends on switch'],
                    correct: 0,
                    explanation: 'Inter-VLAN routing requires a Layer 3 device (router or L3 switch).'
                },
                {
                    type: 'question',
                    prompt: 'What type of link connects Switch 1 to Switch 2?',
                    options: ['Trunk link', 'Access link', 'Console link', 'Crossover link'],
                    correct: 0,
                    explanation: 'Trunk links carry multiple VLANs between switches using 802.1Q tagging.'
                },
                {
                    type: 'question',
                    prompt: 'What does 802.1Q add to frames on a trunk?',
                    options: ['VLAN tag (4 bytes)', 'IP header', 'MAC address', 'CRC'],
                    correct: 0,
                    explanation: '802.1Q inserts a 4-byte tag containing the VLAN ID into the Ethernet frame.'
                },
                {
                    type: 'animate',
                    action: 'vlan_frame',
                    description: 'Frame tagged with VLAN 10 crosses trunk to reach Sales PC2'
                },
                {
                    type: 'question',
                    prompt: 'When does the switch remove the VLAN tag?',
                    options: ['When sending to access port', 'When sending to trunk', 'Never', 'When receiving from PC'],
                    correct: 0,
                    explanation: 'Tags are removed when frames exit access ports to end devices.'
                }
            ]
        }
    ],

    // UI Elements
    elements: {},

    /**
     * Initialize the module
     */
    init() {
        this.canvas = document.getElementById('pj-network-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
        }

        this.elements = {
            container: document.getElementById('packet-journey-screen'),
            scenarioTitle: document.getElementById('pj-scenario-title'),
            questionArea: document.getElementById('pj-question-area'),
            prompt: document.getElementById('pj-question-text'),
            options: document.getElementById('pj-options'),
            explanationArea: document.getElementById('pj-explanation-area'),
            explanationText: document.getElementById('pj-explanation-text'),
            continueBtn: document.getElementById('pj-continue-btn'),
            progressFill: document.getElementById('pj-progress-fill'),
            progressText: document.getElementById('pj-progress-text'),
            score: document.getElementById('pj-score'),
            layerDisplay: document.getElementById('pj-layer-display'),
            encStack: document.getElementById('pj-enc-stack'),
            mascotEl: document.getElementById('pj-mascot')
        };

        // Setup continue button handler
        if (this.elements.continueBtn) {
            this.elements.continueBtn.addEventListener('click', () => this.nextStep());
        }
    },

    /**
     * Alias for start() to match game.js calls
     */
    startScenario(scenarioId) {
        this.start(scenarioId);
    },

    /**
     * Start a scenario
     */
    start(scenarioId) {
        const scenario = this.scenarios.find(s => s.id === scenarioId);
        if (!scenario) {
            console.error('Scenario not found:', scenarioId);
            return;
        }

        this.active = true;
        this.currentScenario = scenario;
        this.currentStep = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.totalQuestions = scenario.steps.filter(s => s.type === 'question').length;
        this.topology = JSON.parse(JSON.stringify(scenario.topology));

        // Initialize mascot position at first device
        const firstDevice = this.topology.devices[0];
        this.mascot.x = firstDevice.x;
        this.mascot.y = firstDevice.y - 30;
        this.mascot.targetX = this.mascot.x;
        this.mascot.targetY = this.mascot.y;
        this.mascot.state = 'idle';

        // Update UI
        if (this.elements.scenarioTitle) {
            this.elements.scenarioTitle.textContent = scenario.name;
        }

        // Initialize encapsulation display
        this.updateEncapsulationDisplay('Application');

        // Hide explanation, show question area
        if (this.elements.explanationArea) {
            this.elements.explanationArea.classList.add('hidden');
        }
        if (this.elements.questionArea) {
            this.elements.questionArea.classList.remove('hidden');
        }

        this.setupCanvas();
        this.render();
        this.updateScore();
        this.showStep();
    },

    /**
     * Update the encapsulation stack display
     */
    updateEncapsulationDisplay(activeLayer) {
        if (!this.elements.encStack) return;

        const layers = [
            { name: 'Application', class: 'application' },
            { name: 'Transport', class: 'transport' },
            { name: 'Network', class: 'network' },
            { name: 'Data Link', class: 'datalink' },
            { name: 'Physical', class: 'physical' }
        ];

        this.elements.encStack.innerHTML = layers.map(layer => {
            const isActive = layer.name === activeLayer;
            return `<div class="pj-enc-layer ${layer.class}${isActive ? ' active' : ''}">${layer.name}</div>`;
        }).join('');

        if (this.elements.layerDisplay) {
            this.elements.layerDisplay.textContent = activeLayer;
        }
    },

    /**
     * Public method for game.js to call
     */
    nextStep() {
        this.currentStep++;
        this.showStep();
    },

    /**
     * Setup canvas size
     */
    setupCanvas() {
        if (!this.canvas) return;

        // Responsive canvas sizing
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = Math.min(container.clientWidth - 20, 550);
            this.canvas.height = 300;
        }
    },

    /**
     * Main render loop
     */
    render() {
        if (!this.ctx || !this.canvas) return;

        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, width, height);

        // Draw grid background
        this.drawGrid(ctx, width, height);

        // Draw connections
        this.drawConnections(ctx);

        // Draw devices
        this.drawDevices(ctx);

        // Draw mascot (Packie)
        this.drawMascot(ctx);

        // Draw any active animations
        this.drawAnimations(ctx);

        // Continue animation loop if active
        if (this.active) {
            this.animationId = requestAnimationFrame(() => this.render());
        }
    },

    /**
     * Draw background grid
     */
    drawGrid(ctx, width, height) {
        ctx.strokeStyle = '#1a1a3a';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x < width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y < height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    },

    /**
     * Draw network connections
     */
    drawConnections(ctx) {
        if (!this.topology) return;

        ctx.strokeStyle = '#333366';
        ctx.lineWidth = 3;

        for (const conn of this.topology.connections) {
            const fromDevice = this.topology.devices.find(d => d.id === conn.from);
            const toDevice = this.topology.devices.find(d => d.id === conn.to);

            if (fromDevice && toDevice) {
                const fromType = this.deviceTypes[fromDevice.type];
                const toType = this.deviceTypes[toDevice.type];

                ctx.beginPath();
                ctx.moveTo(fromDevice.x + fromType.width / 2, fromDevice.y);
                ctx.lineTo(toDevice.x + toType.width / 2, toDevice.y);
                ctx.stroke();

                // Connection glow
                ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
                ctx.lineWidth = 6;
                ctx.stroke();
                ctx.strokeStyle = '#333366';
                ctx.lineWidth = 3;
            }
        }
    },

    /**
     * Draw network devices
     */
    drawDevices(ctx) {
        if (!this.topology) return;

        for (const device of this.topology.devices) {
            const type = this.deviceTypes[device.type];

            const x = device.x;
            const y = device.y - type.height / 2;

            // Device shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(x + 3, y + 3, type.width, type.height);

            // Device body
            ctx.fillStyle = type.color;
            ctx.fillRect(x, y, type.width, type.height);

            // Device border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, type.width, type.height);

            // Device icon/label
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 10px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(type.icon, x + type.width / 2, y + type.height / 2);

            // Device name below
            ctx.fillStyle = '#ffffff';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.fillText(device.label || device.id, x + type.width / 2, y + type.height + 12);

            // IP address if present
            if (device.ip) {
                ctx.fillStyle = '#888888';
                ctx.font = '6px "Press Start 2P", monospace';
                ctx.fillText(device.ip, x + type.width / 2, y + type.height + 22);
            }
        }
    },

    /**
     * Draw the mascot (Packie)
     */
    drawMascot(ctx) {
        const m = this.mascot;

        // Smooth movement toward target
        if (m.targetX !== m.x || m.targetY !== m.y) {
            m.x += (m.targetX - m.x) * 0.1;
            m.y += (m.targetY - m.y) * 0.1;
        }

        // Packet shape
        const size = 20;

        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00d4ff';

        // Packet body
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.moveTo(m.x, m.y - size / 2);
        ctx.lineTo(m.x + size / 2, m.y);
        ctx.lineTo(m.x, m.y + size / 2);
        ctx.lineTo(m.x - size / 2, m.y);
        ctx.closePath();
        ctx.fill();

        // Eyes based on state
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000000';

        if (m.state === 'happy') {
            // Happy eyes (^_^)
            ctx.beginPath();
            ctx.arc(m.x - 4, m.y - 2, 2, 0, Math.PI, true);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(m.x + 4, m.y - 2, 2, 0, Math.PI, true);
            ctx.stroke();
        } else if (m.state === 'sad') {
            // Sad eyes
            ctx.fillRect(m.x - 5, m.y - 3, 3, 3);
            ctx.fillRect(m.x + 2, m.y - 3, 3, 3);
            // Sad mouth
            ctx.beginPath();
            ctx.arc(m.x, m.y + 4, 3, Math.PI, 0, true);
            ctx.stroke();
        } else {
            // Normal eyes
            ctx.fillRect(m.x - 5, m.y - 3, 3, 3);
            ctx.fillRect(m.x + 2, m.y - 3, 3, 3);
        }
    },

    /**
     * Draw animations (packet moving, etc.)
     */
    drawAnimations(ctx) {
        // Animation effects go here
    },

    /**
     * Show current step
     */
    showStep() {
        if (!this.currentScenario) return;

        const step = this.currentScenario.steps[this.currentStep];
        if (!step) {
            this.endJourney();
            return;
        }

        // Update progress
        this.updateProgress();

        if (step.type === 'question') {
            this.showQuestion(step);
        } else if (step.type === 'animate') {
            this.playAnimation(step);
        }
    },

    /**
     * Show a question
     */
    showQuestion(step) {
        // Show question area, hide explanation
        if (this.elements.questionArea) {
            this.elements.questionArea.classList.remove('hidden');
        }
        if (this.elements.explanationArea) {
            this.elements.explanationArea.classList.add('hidden');
        }

        if (this.elements.prompt) {
            this.elements.prompt.textContent = step.prompt;
        }

        if (this.elements.options) {
            this.elements.options.innerHTML = '';

            step.options.forEach((option, index) => {
                const btn = document.createElement('button');
                btn.className = 'pj-option';
                btn.textContent = option;
                btn.dataset.index = index;
                btn.addEventListener('click', () => this.selectAnswer(index, step));
                this.elements.options.appendChild(btn);
            });
        }

        // Update layer display based on question context
        if (step.prompt.toLowerCase().includes('mac')) {
            this.updateEncapsulationDisplay('Data Link');
        } else if (step.prompt.toLowerCase().includes('ip') || step.prompt.toLowerCase().includes('network')) {
            this.updateEncapsulationDisplay('Network');
        } else if (step.prompt.toLowerCase().includes('tcp') || step.prompt.toLowerCase().includes('udp') || step.prompt.toLowerCase().includes('port')) {
            this.updateEncapsulationDisplay('Transport');
        } else {
            this.updateEncapsulationDisplay('Application');
        }
    },

    /**
     * Handle answer selection
     */
    selectAnswer(index, step) {
        const isCorrect = index === step.correct;
        const buttons = this.elements.options.querySelectorAll('.pj-option');

        // Disable all buttons
        buttons.forEach(btn => btn.disabled = true);

        // Highlight correct/wrong
        buttons.forEach((btn, i) => {
            if (i === step.correct) {
                btn.classList.add('correct');
            } else if (i === index && !isCorrect) {
                btn.classList.add('wrong');
            }
        });

        // Update mascot state
        this.mascot.state = isCorrect ? 'happy' : 'sad';

        // Update score
        if (isCorrect) {
            this.correctAnswers++;
            this.score += 100;
        }
        this.updateScore();

        // Play sound
        if (typeof Sounds !== 'undefined') {
            Sounds.play(isCorrect ? 'correct' : 'wrong');
        }

        // Show explanation after brief delay
        setTimeout(() => {
            // Hide question area, show explanation
            if (this.elements.questionArea) {
                this.elements.questionArea.classList.add('hidden');
            }
            if (this.elements.explanationArea) {
                this.elements.explanationArea.classList.remove('hidden');
            }
            if (this.elements.explanationText) {
                this.elements.explanationText.textContent = step.explanation;
            }
            this.mascot.state = 'idle';
        }, 500);
    },

    /**
     * Play an animation step
     */
    playAnimation(step) {
        // Show explanation area with animation description
        if (this.elements.questionArea) {
            this.elements.questionArea.classList.add('hidden');
        }
        if (this.elements.explanationArea) {
            this.elements.explanationArea.classList.remove('hidden');
        }
        if (this.elements.explanationText) {
            this.elements.explanationText.textContent = step.description;
        }

        // Update layer based on animation
        if (step.action.includes('arp')) {
            this.updateEncapsulationDisplay('Data Link');
        } else if (step.action.includes('dns')) {
            this.updateEncapsulationDisplay('Application');
        } else if (step.action.includes('packet') || step.action.includes('route')) {
            this.updateEncapsulationDisplay('Network');
        }

        // Animate based on action type
        this.animateAction(step.action, () => {
            // Auto-advance for animations (user doesn't need to click continue)
            this.currentStep++;
            this.showStep();
        });
    },

    /**
     * Animate a specific action
     */
    animateAction(action, callback) {
        const devices = this.topology.devices;

        switch (action) {
            case 'send_arp':
            case 'dns_query':
            case 'send_syn':
                // Move mascot to second device (usually switch)
                if (devices.length > 1) {
                    const target = devices[1];
                    this.mascot.targetX = target.x + this.deviceTypes[target.type].width / 2;
                    this.mascot.targetY = target.y - 30;
                }
                setTimeout(callback, 1500);
                break;

            case 'send_arp_broadcast':
                // Broadcast animation - move to center then pulse
                if (devices.length > 2) {
                    const switchDev = devices.find(d => d.type === 'switch');
                    if (switchDev) {
                        this.mascot.targetX = switchDev.x + this.deviceTypes.switch.width / 2;
                        this.mascot.targetY = switchDev.y - 30;
                    }
                }
                setTimeout(callback, 2000);
                break;

            case 'receive_arp':
            case 'dns_response':
            case 'send_synack':
                // Response comes back - move from destination back
                if (devices.length > 0) {
                    const target = devices[0];
                    this.mascot.targetX = target.x + this.deviceTypes[target.type].width / 2;
                    this.mascot.targetY = target.y - 30;
                }
                setTimeout(callback, 1500);
                break;

            case 'send_packet':
            case 'send_to_router':
            case 'send_ack':
                // Move mascot through devices
                this.animateThroughDevices(devices.slice(0, 3), callback);
                break;

            case 'route_packet':
            case 'vlan_frame':
                // Move to last device
                if (devices.length > 2) {
                    const target = devices[devices.length - 1];
                    this.mascot.targetX = target.x + this.deviceTypes[target.type].width / 2;
                    this.mascot.targetY = target.y - 30;
                }
                setTimeout(callback, 1500);
                break;

            default:
                setTimeout(callback, 1000);
        }
    },

    /**
     * Animate mascot through multiple devices
     */
    animateThroughDevices(devices, callback) {
        let index = 0;

        const moveNext = () => {
            if (index >= devices.length) {
                callback();
                return;
            }

            const device = devices[index];
            const type = this.deviceTypes[device.type];
            this.mascot.targetX = device.x + type.width / 2;
            this.mascot.targetY = device.y - 30;

            index++;
            setTimeout(moveNext, 800);
        };

        moveNext();
    },

    /**
     * Update progress display
     */
    updateProgress() {
        if (!this.currentScenario) return;

        const totalSteps = this.currentScenario.steps.length;
        const currentStepNum = Math.min(this.currentStep + 1, totalSteps);
        const percentage = (currentStepNum / totalSteps) * 100;

        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${percentage}%`;
        }

        if (this.elements.progressText) {
            this.elements.progressText.textContent = `Step ${currentStepNum} of ${totalSteps}`;
        }
    },

    /**
     * Update score display
     */
    updateScore() {
        if (this.elements.score) {
            this.elements.score.textContent = this.score.toString();
        }
    },

    /**
     * End the journey
     */
    endJourney() {
        this.active = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        const accuracy = this.totalQuestions > 0
            ? Math.round((this.correctAnswers / this.totalQuestions) * 100)
            : 0;

        // Track achievements
        if (typeof Achievements !== 'undefined') {
            Achievements.unlock('packet_journey_first');

            if (accuracy === 100) {
                Achievements.unlock('packet_journey_perfect');
            }

            // Track completed scenarios (Set is initialized at module level)
            this.completedScenarios.add(this.currentScenario.id);

            if (this.completedScenarios.size >= this.scenarios.length) {
                Achievements.unlock('packet_journey_all');
            }
        }

        if (this.onComplete) {
            this.onComplete({
                scenario: this.currentScenario.id,
                score: this.score,
                correctAnswers: this.correctAnswers,
                totalQuestions: this.totalQuestions,
                accuracy: accuracy
            });
        }
    },

    /**
     * Get scenario list for menu
     */
    getScenarioList() {
        return this.scenarios.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
            difficulty: s.difficulty
        }));
    },

    /**
     * Stop the journey
     */
    stop() {
        this.active = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PacketJourney;
}
