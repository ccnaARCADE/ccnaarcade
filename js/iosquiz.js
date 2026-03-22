/**
 * IOS Quiz Module
 * Cisco IOS commands and configuration quiz
 */
'use strict';

const IOSQuiz = {
    // Quiz state
    active: false,
    currentQuestion: 0,
    score: 0,
    shuffledQuestions: [],
    answered: false,

    // Answer encryption helpers
    _k: "CCNA2024",
    _a: [
        "eQ==","eQ==","eQ==","fg==","dA==","eQ==","fg==","dA==","eQ==","dA==",
        "eQ==","ew==","eQ==","dA==","fg==","CQ==","fg==","dA==","eQ==","fg==",
        "dA==","eQ==","Fg==","eQ==","eQ==","dA==","eQ==","eQ==","eQ==","eQ==",
        "fg==","fg==","dA==","eQ==","dA==","eQ==","eQ==","eQ==","fg==","eQ==",
        "dA==","eQ==","eQ==","eQ==","eQ==","dA==","eQ==","dA==","eQ==","eQ=="
    ],

    // Question bank
    questions: [
        {
            question: "Which command enters global configuration mode from privileged EXEC mode?",
            options: ["enable", "configure terminal", "config mode", "setup"],
            explanation: "'configure terminal' (or 'conf t') enters global config mode from privileged EXEC."
        },
        {
            question: "What prompt indicates you are in privileged EXEC mode?",
            options: ["Router>", "Router#", "Router(config)#", "Router(config-if)#"],
            explanation: "The # symbol indicates privileged EXEC mode; > indicates user EXEC mode."
        },
        {
            question: "Which command moves from user EXEC mode to privileged EXEC mode?",
            options: ["login", "enable", "privilege", "escalate"],
            explanation: "'enable' elevates from user EXEC (>) to privileged EXEC (#) mode."
        },
        {
            question: "What command returns you to privileged EXEC mode from any config mode?",
            options: ["exit", "quit", "end", "disable"],
            explanation: "'end' (or Ctrl+Z) returns directly to privileged EXEC from any config mode."
        },
        {
            question: "Which command enters interface configuration mode for GigabitEthernet0/1?",
            options: ["interface gigabitethernet 0/1", "config interface g0/1", "enter g0/1", "select interface 0/1"],
            explanation: "'interface gigabitethernet 0/1' (or 'int g0/1') enters interface config mode."
        },
        {
            question: "Which command displays the running configuration?",
            options: ["show config", "show running-config", "display config", "view running"],
            explanation: "'show running-config' (or 'sh run') displays the active configuration in RAM."
        },
        {
            question: "Which command shows the IOS version and hardware information?",
            options: ["show system", "show hardware", "show version", "show info"],
            explanation: "'show version' displays IOS version, uptime, hardware, and license info."
        },
        {
            question: "What command displays all interfaces and their IP addresses?",
            options: ["show ip interface brief", "show interfaces all", "show ip addresses", "display interfaces"],
            explanation: "'show ip interface brief' shows a summary of interfaces, IPs, and status."
        },
        {
            question: "Which command shows the routing table?",
            options: ["show routes", "show ip route", "display routing", "show routing-table"],
            explanation: "'show ip route' displays the IP routing table with all learned routes."
        },
        {
            question: "What command displays the MAC address table on a switch?",
            options: ["show mac-address-table", "show mac table", "show arp", "show addresses"],
            explanation: "'show mac-address-table' displays the switch's MAC address to port mappings."
        },
        {
            question: "Which command shows detailed information about a specific interface?",
            options: ["show interface detail g0/1", "show interfaces g0/1", "display interface g0/1", "show g0/1 status"],
            explanation: "'show interfaces <interface>' shows detailed statistics and configuration."
        },
        {
            question: "What command displays the ARP cache?",
            options: ["show arp", "show ip arp", "show arp-cache", "show arp table"],
            explanation: "'show ip arp' (or 'show arp') displays the ARP cache in Cisco IOS."
        },
        {
            question: "Which command sets the hostname of a device to 'CoreRouter'?",
            options: ["set hostname CoreRouter", "hostname CoreRouter", "name CoreRouter", "device-name CoreRouter"],
            explanation: "'hostname <name>' sets the device hostname in global config mode."
        },
        {
            question: "What command assigns IP address 192.168.1.1/24 to an interface?",
            options: ["ip address 192.168.1.1 255.255.255.0", "set ip 192.168.1.1/24", "ipaddress 192.168.1.1 /24", "address 192.168.1.1 mask 24"],
            explanation: "'ip address <ip> <subnet-mask>' assigns an IP in interface config mode."
        },
        {
            question: "Which command enables an interface that is administratively down?",
            options: ["enable", "activate", "no shutdown", "start"],
            explanation: "'no shutdown' (or 'no shut') enables an interface."
        },
        {
            question: "What command saves the running configuration to NVRAM?",
            options: ["save config", "write memory", "copy running-config startup-config", "write config memory"],
            explanation: "'copy running-config startup-config' (or 'wr') saves the config to NVRAM."
        },
        {
            question: "Which command sets the enable secret password to 'cisco123'?",
            options: ["password cisco123", "enable password cisco123", "enable secret cisco123", "secret enable cisco123"],
            explanation: "'enable secret' sets an encrypted password for privileged EXEC access."
        },
        {
            question: "What command configures a description on an interface?",
            options: ["description Link to WAN", "name Link to WAN", "label Link to WAN", "comment Link to WAN"],
            explanation: "'description <text>' adds a description to an interface."
        },
        {
            question: "Which command disables DNS lookup on a router?",
            options: ["no dns lookup", "no ip domain-lookup", "dns disable", "ip dns off"],
            explanation: "'no ip domain-lookup' prevents the router from trying to resolve typos as hostnames."
        },
        {
            question: "What command encrypts all plain-text passwords in the config?",
            options: ["encrypt passwords", "password encryption", "service password-encryption", "enable encryption"],
            explanation: "'service password-encryption' encrypts passwords using type 7 encryption."
        },
        {
            question: "Which command enters console line configuration mode?",
            options: ["line console 0", "console line 0", "config console", "line con"],
            explanation: "'line console 0' enters console line configuration mode."
        },
        {
            question: "What command configures VTY lines 0-4 for remote access?",
            options: ["vty 0 4", "line vty 0 4", "remote-access 0-4", "telnet lines 0 4"],
            explanation: "'line vty 0 4' configures virtual terminal lines for SSH/Telnet."
        },
        {
            question: "Which command sets a console password and enables login?",
            options: ["password cisco", "login", "password cisco, login", "console password cisco"],
            explanation: "Use 'password <pwd>' followed by 'login' to require password on console."
        },
        {
            question: "What command prevents console messages from interrupting your typing?",
            options: ["no messages", "logging synchronous", "quiet mode", "disable logging"],
            explanation: "'logging synchronous' re-displays your command after syslog messages."
        },
        {
            question: "Which command sets the console timeout to 10 minutes?",
            options: ["timeout 10", "exec-timeout 10 0", "session-timeout 10", "idle-timeout 10"],
            explanation: "'exec-timeout <minutes> <seconds>' sets the idle timeout period."
        },
        {
            question: "Which command creates VLAN 100 on a switch?",
            options: ["vlan 100", "create vlan 100", "add vlan 100", "new vlan 100"],
            explanation: "'vlan 100' in global config mode creates the VLAN and enters VLAN config."
        },
        {
            question: "What command assigns a name to a VLAN?",
            options: ["vlan name Sales", "name Sales", "description Sales", "label Sales"],
            explanation: "'name <name>' assigns a name to a VLAN in VLAN configuration mode."
        },
        {
            question: "Which command assigns an interface to VLAN 10 as an access port?",
            options: ["vlan 10", "switchport access vlan 10", "access vlan 10", "port vlan 10"],
            explanation: "'switchport access vlan 10' assigns the port to VLAN 10."
        },
        {
            question: "What command configures a port as an access port?",
            options: ["port mode access", "switchport mode access", "access mode enable", "mode access"],
            explanation: "'switchport mode access' sets the port to access mode (single VLAN)."
        },
        {
            question: "Which command displays all VLANs and their port assignments?",
            options: ["show vlans", "show vlan brief", "display vlan", "show vlan all"],
            explanation: "'show vlan brief' displays a summary of VLANs and assigned ports."
        },
        {
            question: "What command configures an interface as a trunk port?",
            options: ["switchport trunk", "trunk enable", "switchport mode trunk", "mode trunk"],
            explanation: "'switchport mode trunk' configures the port to carry multiple VLANs."
        },
        {
            question: "Which command sets the native VLAN on a trunk to VLAN 99?",
            options: ["native vlan 99", "switchport native vlan 99", "switchport trunk native vlan 99", "trunk native 99"],
            explanation: "'switchport trunk native vlan 99' sets VLAN 99 as the native VLAN."
        },
        {
            question: "What command restricts a trunk to only allow VLANs 10, 20, and 30?",
            options: ["switchport trunk allowed vlan 10,20,30", "trunk vlan 10 20 30", "vlan allow 10,20,30", "permit vlan 10,20,30"],
            explanation: "'switchport trunk allowed vlan 10,20,30' restricts the trunk to specific VLANs."
        },
        {
            question: "Which command configures a Layer 3 switch interface with an IP address?",
            options: ["ip address 192.168.1.1 255.255.255.0", "no switchport", "layer3 mode enable", "switchport no shutdown"],
            explanation: "'no switchport' converts a switch port to a routed port for layer 3 operation."
        },
        {
            question: "What command creates a switch virtual interface for VLAN 10?",
            options: ["interface vlan 10", "vlan interface 10", "svi vlan 10", "create svi 10"],
            explanation: "'interface vlan 10' creates an SVI for inter-VLAN routing."
        },
        {
            question: "Which command displays spanning tree information?",
            options: ["show stp", "show spanning-tree", "show tree", "display spanning-tree"],
            explanation: "'show spanning-tree' displays STP status, root bridge, and port states."
        },
        {
            question: "What command sets a switch as the root bridge for VLAN 1?",
            options: ["spanning-tree root primary", "spanning-tree vlan 1 root primary", "stp vlan 1 priority 0", "root-bridge vlan 1"],
            explanation: "'spanning-tree vlan 1 root primary' sets low priority to become root."
        },
        {
            question: "Which command enables PortFast on an access port?",
            options: ["portfast enable", "spanning-tree portfast", "stp portfast", "fast-port"],
            explanation: "'spanning-tree portfast' skips STP listening/learning states."
        },
        {
            question: "What command enables BPDU Guard on a PortFast-enabled port?",
            options: ["bpdu-guard enable", "spanning-tree guard bpdu", "spanning-tree bpduguard enable", "stp bpdu guard"],
            explanation: "'spanning-tree bpduguard enable' shuts down port if BPDU is received."
        },
        {
            question: "Which command changes STP mode to Rapid PVST+?",
            options: ["spanning-tree mode rapid", "spanning-tree mode rapid-pvst", "stp mode rstp", "rapid-pvst enable"],
            explanation: "'spanning-tree mode rapid-pvst' enables Rapid PVST+ on the switch."
        },
        {
            question: "What command manually sets the STP priority to 4096 for VLAN 10?",
            options: ["spanning-tree vlan 10 priority 4096", "stp priority 4096 vlan 10", "spanning-tree priority 4096", "vlan 10 stp-priority 4096"],
            explanation: "'spanning-tree vlan 10 priority 4096' sets specific priority (must be multiple of 4096)."
        },
        {
            question: "Which command enables OSPF process 1 on a router?",
            options: ["ospf 1", "router ospf 1", "enable ospf 1", "protocol ospf 1"],
            explanation: "'router ospf 1' enters OSPF router configuration mode with process ID 1."
        },
        {
            question: "What command advertises network 10.0.0.0/24 in OSPF area 0?",
            options: ["network 10.0.0.0 255.255.255.0 area 0", "network 10.0.0.0 0.0.0.255 area 0", "advertise 10.0.0.0/24 area 0", "ospf network 10.0.0.0 area 0"],
            explanation: "OSPF uses wildcard masks. '0.0.0.255' is the wildcard for /24."
        },
        {
            question: "Which command displays OSPF neighbor relationships?",
            options: ["show ospf neighbors", "show ip ospf neighbor", "show ospf adjacency", "display ospf peers"],
            explanation: "'show ip ospf neighbor' displays OSPF adjacencies and their states."
        },
        {
            question: "What command sets the OSPF router ID to 1.1.1.1?",
            options: ["ospf router-id 1.1.1.1", "router-id 1.1.1.1", "id 1.1.1.1", "set router-id 1.1.1.1"],
            explanation: "'router-id 1.1.1.1' manually sets the OSPF router ID."
        },
        {
            question: "Which command shows the OSPF link-state database?",
            options: ["show ip ospf database", "show ospf lsdb", "show ip ospf lsa", "display ospf database"],
            explanation: "'show ip ospf database' displays the LSDB with all LSAs."
        },
        {
            question: "What command changes the OSPF cost on an interface to 100?",
            options: ["ospf cost 100", "ip ospf cost 100", "cost 100", "bandwidth cost 100"],
            explanation: "'ip ospf cost 100' manually sets the OSPF cost in interface config."
        },
        {
            question: "Which command configures OSPF authentication using MD5 on an interface?",
            options: ["ip ospf authentication message-digest", "ospf auth md5", "authentication ospf md5", "ip ospf md5 enable"],
            explanation: "'ip ospf authentication message-digest' enables MD5 authentication."
        },
        {
            question: "What command makes an interface passive in OSPF (no hellos sent)?",
            options: ["passive interface g0/1", "passive-interface g0/1", "interface g0/1 passive", "ospf passive g0/1"],
            explanation: "'passive-interface <int>' stops OSPF from sending hellos on that interface."
        },
        {
            question: "Which command enables EIGRP with AS number 100?",
            options: ["eigrp 100", "router eigrp 100", "enable eigrp 100", "protocol eigrp 100"],
            explanation: "'router eigrp 100' enters EIGRP configuration with AS 100."
        }
    ],

    // DOM element cache
    elements: {},

    /**
     * Initialize the quiz module
     */
    init() {
        // Cache DOM elements
        this.elements = {
            screen: document.getElementById('ios-quiz-screen'),
            startArea: document.getElementById('ios-start-area'),
            quizArea: document.getElementById('ios-quiz-area'),
            resultsArea: document.getElementById('ios-results-area'),
            currentNum: document.getElementById('ios-current-num'),
            totalNum: document.getElementById('ios-total-num'),
            score: document.getElementById('ios-score'),
            progressFill: document.getElementById('ios-progress-fill'),
            questionNumber: document.getElementById('ios-question-number'),
            questionText: document.getElementById('ios-question-text'),
            options: document.getElementById('ios-options'),
            explanation: document.getElementById('ios-explanation'),
            explanationText: document.getElementById('ios-explanation-text'),
            nextBtn: document.getElementById('ios-next-btn'),
            finalScore: document.getElementById('ios-final-score'),
            grade: document.getElementById('ios-grade'),
            gradeMessage: document.getElementById('ios-grade-message')
        };

        // Setup event listener for next button
        if (this.elements.nextBtn) {
            this.elements.nextBtn.addEventListener('click', () => this.nextQuestion());
        }
    },

    /**
     * Decrypt correct answer index
     */
    getCorrectAnswer(originalIndex) {
        const s = this._a[originalIndex];
        const i = originalIndex;
        return (atob(s).charCodeAt(0) ^ (i % 256) ^ this._k.charCodeAt(i % this._k.length)) - 48;
    },

    /**
     * Shuffle array and maintain original indices
     */
    shuffleArray(array) {
        const indices = array.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        return indices.map(i => ({ ...array[i], _origIdx: i }));
    },

    /**
     * Start the quiz
     */
    start() {
        this.shuffledQuestions = this.shuffleArray(this.questions);
        this.currentQuestion = 0;
        this.score = 0;
        this.answered = false;
        this.active = true;

        // Show quiz area, hide start and results
        this.elements.startArea.classList.add('hidden');
        this.elements.resultsArea.classList.add('hidden');
        this.elements.quizArea.classList.remove('hidden');

        this.elements.totalNum.textContent = this.shuffledQuestions.length;

        this.showQuestion();

        if (typeof Sounds !== 'undefined') {
            Sounds.play('select');
        }
    },

    /**
     * Show current question
     */
    showQuestion() {
        const q = this.shuffledQuestions[this.currentQuestion];
        this.answered = false;

        this.elements.currentNum.textContent = this.currentQuestion + 1;
        this.elements.questionNumber.textContent = `Question ${this.currentQuestion + 1}`;
        this.elements.questionText.textContent = q.question;
        this.elements.score.textContent = this.score;

        const progress = (this.currentQuestion / this.shuffledQuestions.length) * 100;
        this.elements.progressFill.style.width = progress + '%';

        // Build options
        this.elements.options.innerHTML = '';
        const letters = ['A', 'B', 'C', 'D'];

        q.options.forEach((option, index) => {
            const optionEl = document.createElement('div');
            optionEl.className = 'ios-option';
            optionEl.dataset.index = index;

            const letterSpan = document.createElement('span');
            letterSpan.className = 'option-letter';
            letterSpan.textContent = letters[index];

            optionEl.appendChild(letterSpan);
            optionEl.appendChild(document.createTextNode(option));

            optionEl.addEventListener('click', () => this.selectAnswer(index));

            this.elements.options.appendChild(optionEl);
        });

        this.elements.explanation.classList.remove('show');
        this.elements.nextBtn.classList.remove('show');
    },

    /**
     * Handle answer selection
     */
    selectAnswer(selected) {
        if (this.answered) return;
        this.answered = true;

        const q = this.shuffledQuestions[this.currentQuestion];
        const correctAnswer = this.getCorrectAnswer(q._origIdx);
        const options = this.elements.options.querySelectorAll('.ios-option');

        options.forEach((opt, index) => {
            opt.classList.add('disabled');
            if (index === correctAnswer) {
                opt.classList.add('correct');
            } else if (index === selected) {
                opt.classList.add('incorrect');
            }
        });

        if (selected === correctAnswer) {
            this.score++;
            this.elements.score.textContent = this.score;
            if (typeof Sounds !== 'undefined') {
                Sounds.play('correct');
            }
        } else {
            if (typeof Sounds !== 'undefined') {
                Sounds.play('wrong');
            }
        }

        this.elements.explanationText.textContent = q.explanation;
        this.elements.explanation.classList.add('show');

        const nextBtn = this.elements.nextBtn;
        if (this.currentQuestion === this.shuffledQuestions.length - 1) {
            nextBtn.textContent = 'See Results';
        } else {
            nextBtn.textContent = 'Next Question';
        }
        nextBtn.classList.add('show');
    },

    /**
     * Go to next question
     */
    nextQuestion() {
        this.currentQuestion++;

        if (this.currentQuestion >= this.shuffledQuestions.length) {
            this.showResults();
        } else {
            this.showQuestion();
        }

        if (typeof Sounds !== 'undefined') {
            Sounds.play('click');
        }
    },

    /**
     * Show final results
     */
    showResults() {
        this.elements.quizArea.classList.add('hidden');
        this.elements.resultsArea.classList.remove('hidden');

        const percentage = Math.round((this.score / this.shuffledQuestions.length) * 100);
        this.elements.finalScore.textContent = percentage + '%';
        this.elements.grade.textContent = `${this.score} / ${this.shuffledQuestions.length} correct`;

        let message = '';
        if (percentage >= 90) {
            message = "Excellent! You're well prepared for the CCNA!";
        } else if (percentage >= 80) {
            message = "Great job! A bit more practice and you'll ace it!";
        } else if (percentage >= 70) {
            message = "Good effort! Review the topics you missed.";
        } else if (percentage >= 60) {
            message = "Keep studying! Focus on the areas where you struggled.";
        } else {
            message = "More practice needed. Review the Cisco IOS fundamentals.";
        }
        this.elements.gradeMessage.textContent = message;

        // Record stats
        if (typeof Stats !== 'undefined') {
            Stats.recordIOSQuiz({
                score: this.score,
                total: this.shuffledQuestions.length,
                percentage: percentage
            });
        }

        // Record to leaderboard
        if (typeof Leaderboard !== 'undefined') {
            Leaderboard.addIOSQuizScore(this.score, percentage);
        }

        this.active = false;

        if (typeof Sounds !== 'undefined') {
            Sounds.play('levelComplete');
        }
    },

    /**
     * Restart the quiz
     */
    restart() {
        this.start();
    },

    /**
     * Stop the quiz
     */
    stop() {
        this.active = false;

        // Reset to start screen
        this.elements.quizArea.classList.add('hidden');
        this.elements.resultsArea.classList.add('hidden');
        this.elements.startArea.classList.remove('hidden');
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IOSQuiz;
}
