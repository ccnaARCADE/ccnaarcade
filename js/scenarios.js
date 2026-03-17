/**
 * Scenarios Module
 * Customizable client/business scenarios for puzzle mode
 */
'use strict';

const Scenarios = {
    // Default scenarios - can be overridden with custom data
    scenarios: [
        {
            id: 1,
            client: "Sunrise Coffee Co.",
            location: "Downtown Cafe",
            type: "retail",
            networkClass: "C",
            baseNetwork: "192.168.1.0/24",
            description: "Small coffee shop with POS systems and guest WiFi",
            difficulty: 1,
            subnets: [
                { name: "POS Systems", hosts: 6, context: "4 registers + 2 card readers" },
                { name: "Guest WiFi", hosts: 30, context: "Customer hotspot" },
                { name: "Back Office", hosts: 5, context: "Manager PC, printer, safe" }
            ]
        },
        {
            id: 2,
            client: "Greenfield Law Firm",
            location: "Main Office",
            type: "office",
            networkClass: "C",
            baseNetwork: "192.168.10.0/24",
            description: "Mid-size law firm requiring secure network segmentation",
            difficulty: 1,
            subnets: [
                { name: "Legal Staff", hosts: 25, context: "Attorney workstations" },
                { name: "Admin Pool", hosts: 10, context: "Reception, billing, HR" },
                { name: "Conference Rooms", hosts: 8, context: "Presentation systems" },
                { name: "Printers/MFPs", hosts: 6, context: "Network printers" }
            ]
        },
        {
            id: 3,
            client: "Metro Medical Clinic",
            location: "Primary Care Center",
            type: "healthcare",
            networkClass: "C",
            baseNetwork: "10.10.0.0/22",
            description: "Medical clinic with HIPAA compliance requirements",
            difficulty: 2,
            subnets: [
                { name: "Medical Records", hosts: 50, context: "EMR workstations - isolated" },
                { name: "Clinical Staff", hosts: 30, context: "Nurse stations" },
                { name: "Medical Devices", hosts: 20, context: "Diagnostic equipment" },
                { name: "Admin/Billing", hosts: 15, context: "Front desk, billing dept" },
                { name: "Guest WiFi", hosts: 60, context: "Patient waiting area" }
            ]
        },
        {
            id: 4,
            client: "TechStart Inc.",
            location: "Innovation Hub",
            type: "tech",
            networkClass: "B",
            baseNetwork: "172.16.0.0/20",
            description: "Growing startup with dev, staging, and production environments",
            difficulty: 2,
            subnets: [
                { name: "Development", hosts: 100, context: "Developer workstations" },
                { name: "Staging Servers", hosts: 30, context: "Test environment" },
                { name: "Production", hosts: 50, context: "Live servers" },
                { name: "Corporate WiFi", hosts: 80, context: "Employee devices" },
                { name: "IoT/Sensors", hosts: 25, context: "Building automation" },
                { name: "Management", hosts: 15, context: "C-suite, HR, Finance" }
            ]
        },
        {
            id: 5,
            client: "Riverside Manufacturing",
            location: "Plant Floor A",
            type: "industrial",
            networkClass: "B",
            baseNetwork: "10.100.0.0/18",
            description: "Industrial facility with OT/IT network separation",
            difficulty: 3,
            subnets: [
                { name: "SCADA Systems", hosts: 200, context: "Industrial control - air-gapped" },
                { name: "PLCs", hosts: 150, context: "Programmable logic controllers" },
                { name: "HMI Stations", hosts: 50, context: "Operator interfaces" },
                { name: "Office IT", hosts: 80, context: "Administrative staff" },
                { name: "Security Cameras", hosts: 100, context: "Surveillance system" },
                { name: "Maintenance", hosts: 25, context: "Tech support devices" },
                { name: "Guest/Contractor", hosts: 40, context: "Visitor network" }
            ]
        },
        {
            id: 6,
            client: "Bayview School District",
            location: "Central High School",
            type: "education",
            networkClass: "B",
            baseNetwork: "172.20.0.0/16",
            description: "Large high school with student and staff networks",
            difficulty: 3,
            subnets: [
                { name: "Student Chromebooks", hosts: 1500, context: "1:1 device program" },
                { name: "Staff Devices", hosts: 200, context: "Teacher laptops/desktops" },
                { name: "Computer Labs", hosts: 300, context: "Shared lab machines" },
                { name: "Admin Systems", hosts: 50, context: "Office staff, SIS" },
                { name: "IoT Devices", hosts: 100, context: "Smart boards, projectors" },
                { name: "Security/Cameras", hosts: 80, context: "Access control, CCTV" },
                { name: "BYOD WiFi", hosts: 500, context: "Personal devices" }
            ]
        },
        {
            id: 7,
            client: "Summit Financial Group",
            location: "Corporate HQ",
            type: "finance",
            networkClass: "B",
            baseNetwork: "10.50.0.0/16",
            description: "Financial services firm with strict compliance requirements",
            difficulty: 3,
            subnets: [
                { name: "Trading Floor", hosts: 500, context: "Trader workstations" },
                { name: "Back Office", hosts: 300, context: "Operations, settlements" },
                { name: "IT Infrastructure", hosts: 100, context: "Servers, management" },
                { name: "Executive Suite", hosts: 30, context: "C-level, board room" },
                { name: "Compliance", hosts: 50, context: "Audit, legal, risk" },
                { name: "DMZ Services", hosts: 20, context: "Public-facing servers" },
                { name: "Dev/Test", hosts: 80, context: "Application development" },
                { name: "Guest Network", hosts: 100, context: "Visitor WiFi" }
            ]
        },
        {
            id: 8,
            client: "Harbor Hotel Group",
            location: "Beachfront Resort",
            type: "hospitality",
            networkClass: "C",
            baseNetwork: "192.168.50.0/24",
            description: "Luxury hotel with multiple guest and operations networks",
            difficulty: 1,
            subnets: [
                { name: "Guest WiFi", hosts: 100, context: "Hotel rooms and common areas" },
                { name: "Front Desk", hosts: 8, context: "Check-in terminals" },
                { name: "Restaurant POS", hosts: 12, context: "Bar and dining" },
                { name: "Housekeeping", hosts: 15, context: "Staff tablets" }
            ]
        },
        {
            id: 9,
            client: "City Public Library",
            location: "Main Branch",
            type: "education",
            networkClass: "C",
            baseNetwork: "192.168.100.0/23",
            description: "Public library with patron and staff networks",
            difficulty: 1,
            subnets: [
                { name: "Public PCs", hosts: 60, context: "Patron computer lab" },
                { name: "Staff Workstations", hosts: 25, context: "Librarian desks" },
                { name: "Catalog Systems", hosts: 10, context: "OPAC terminals" },
                { name: "Public WiFi", hosts: 120, context: "Patron devices" },
                { name: "Printers", hosts: 8, context: "Public and staff printers" }
            ]
        },
        {
            id: 10,
            client: "AutoMax Dealership",
            location: "Sales & Service Center",
            type: "retail",
            networkClass: "C",
            baseNetwork: "10.20.0.0/22",
            description: "Car dealership with showroom and service departments",
            difficulty: 2,
            subnets: [
                { name: "Sales Floor", hosts: 40, context: "Sales associate tablets" },
                { name: "Service Bay", hosts: 25, context: "Diagnostic systems" },
                { name: "Parts Dept", hosts: 15, context: "Inventory management" },
                { name: "Finance Office", hosts: 10, context: "F&I workstations" },
                { name: "Customer WiFi", hosts: 50, context: "Showroom guests" },
                { name: "Security Cameras", hosts: 30, context: "Lot surveillance" }
            ]
        },
        {
            id: 11,
            client: "FreshMart Grocery",
            location: "Supermarket #42",
            type: "retail",
            networkClass: "C",
            baseNetwork: "192.168.200.0/24",
            description: "Grocery store with self-checkout and IoT refrigeration",
            difficulty: 2,
            subnets: [
                { name: "POS Registers", hosts: 20, context: "Checkout lanes" },
                { name: "Self-Checkout", hosts: 12, context: "Customer kiosks" },
                { name: "Refrigeration", hosts: 30, context: "IoT temp sensors" },
                { name: "Back Office", hosts: 8, context: "Manager systems" },
                { name: "Deli/Bakery", hosts: 6, context: "Scale systems" }
            ]
        },
        {
            id: 12,
            client: "Wellness Spa Resort",
            location: "Mountain Retreat",
            type: "hospitality",
            networkClass: "B",
            baseNetwork: "172.25.0.0/20",
            description: "Luxury spa with smart room controls and wellness tracking",
            difficulty: 2,
            subnets: [
                { name: "Guest Rooms IoT", hosts: 200, context: "Smart thermostats, lighting" },
                { name: "Guest WiFi", hosts: 300, context: "High-speed internet" },
                { name: "Spa Equipment", hosts: 40, context: "Treatment room systems" },
                { name: "Fitness Center", hosts: 50, context: "Exercise machines" },
                { name: "Restaurant/Bar", hosts: 25, context: "POS and inventory" },
                { name: "Staff Network", hosts: 60, context: "Employee devices" }
            ]
        },
        {
            id: 13,
            client: "Regional Airport Authority",
            location: "Terminal B",
            type: "transport",
            networkClass: "B",
            baseNetwork: "10.200.0.0/17",
            description: "Airport terminal with passenger services and operations",
            difficulty: 3,
            subnets: [
                { name: "Flight Displays", hosts: 100, context: "FIDS screens" },
                { name: "Check-in Kiosks", hosts: 80, context: "Self-service terminals" },
                { name: "Gate Systems", hosts: 50, context: "Boarding equipment" },
                { name: "Retail/Food Court", hosts: 150, context: "Concession POS" },
                { name: "Security Systems", hosts: 200, context: "TSA, cameras, access" },
                { name: "Passenger WiFi", hosts: 2000, context: "Free terminal WiFi" },
                { name: "Airline Operations", hosts: 120, context: "Ground crew" },
                { name: "Baggage Systems", hosts: 60, context: "Handling equipment" }
            ]
        },
        {
            id: 14,
            client: "DataVault Colocation",
            location: "Tier 3 Data Center",
            type: "tech",
            networkClass: "A",
            baseNetwork: "10.0.0.0/12",
            description: "Data center with multi-tenant infrastructure",
            difficulty: 3,
            subnets: [
                { name: "Customer Cage A", hosts: 500, context: "Enterprise client" },
                { name: "Customer Cage B", hosts: 250, context: "Mid-market client" },
                { name: "Customer Cage C", hosts: 1000, context: "Large enterprise" },
                { name: "Shared Hosting", hosts: 2000, context: "Virtual servers" },
                { name: "Management Network", hosts: 100, context: "NOC and BMC" },
                { name: "Security/Monitoring", hosts: 50, context: "SIEM, cameras" },
                { name: "Building Systems", hosts: 200, context: "HVAC, power, UPS" }
            ]
        },
        {
            id: 15,
            client: "Metro Transit Authority",
            location: "Operations Center",
            type: "transport",
            networkClass: "B",
            baseNetwork: "172.30.0.0/16",
            description: "Public transit with vehicle tracking and passenger info",
            difficulty: 3,
            subnets: [
                { name: "Bus Fleet GPS", hosts: 500, context: "Real-time tracking" },
                { name: "Train Systems", hosts: 200, context: "Rail operations" },
                { name: "Station Displays", hosts: 150, context: "Arrival boards" },
                { name: "Fare Collection", hosts: 300, context: "Ticket machines, validators" },
                { name: "Security Cameras", hosts: 400, context: "Platform surveillance" },
                { name: "Staff Radios", hosts: 100, context: "Driver communication" },
                { name: "Passenger WiFi", hosts: 1000, context: "On-board and station" },
                { name: "Admin Offices", hosts: 80, context: "Corporate staff" }
            ]
        },
        {
            id: 16,
            client: "Your Custom Client",
            location: "Custom Location",
            type: "custom",
            networkClass: "C",
            baseNetwork: "192.168.0.0/24",
            description: "Add your own client scenarios in scenarios.js",
            difficulty: 1,
            subnets: [
                { name: "Department A", hosts: 50, context: "Example subnet" },
                { name: "Department B", hosts: 25, context: "Example subnet" }
            ]
        }
    ],

    // Custom scenarios loaded from localStorage or external source
    customScenarios: [],

    /**
     * Initialize scenarios
     */
    init() {
        this.loadCustomScenarios();
    },

    /**
     * Get all scenarios (default + custom)
     */
    getAll() {
        return [...this.scenarios, ...this.customScenarios];
    },

    /**
     * Get scenarios by difficulty
     */
    getByDifficulty(difficulty) {
        return this.getAll().filter(s => s.difficulty === difficulty);
    },

    /**
     * Get a scenario by ID
     */
    getById(id) {
        return this.getAll().find(s => s.id === id);
    },

    /**
     * Add a custom scenario
     */
    addCustomScenario(scenario) {
        scenario.id = Date.now(); // Unique ID
        scenario.custom = true;
        this.customScenarios.push(scenario);
        this.saveCustomScenarios();
        return scenario;
    },

    /**
     * Remove a custom scenario
     */
    removeCustomScenario(id) {
        this.customScenarios = this.customScenarios.filter(s => s.id !== id);
        this.saveCustomScenarios();
    },

    /**
     * Import scenarios from JSON
     */
    importScenarios(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const scenarios = Array.isArray(data) ? data : [data];

            scenarios.forEach(s => {
                s.id = Date.now() + Math.random();
                s.custom = true;
                this.customScenarios.push(s);
            });

            this.saveCustomScenarios();
            return { success: true, count: scenarios.length };
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    /**
     * Export all custom scenarios as JSON
     */
    exportScenarios() {
        return JSON.stringify(this.customScenarios, null, 2);
    },

    /**
     * Save custom scenarios to localStorage
     */
    saveCustomScenarios() {
        localStorage.setItem('networkTetrisCustomScenarios', JSON.stringify(this.customScenarios));
    },

    /**
     * Load custom scenarios from localStorage
     */
    loadCustomScenarios() {
        try {
            const data = localStorage.getItem('networkTetrisCustomScenarios');
            if (data) {
                this.customScenarios = JSON.parse(data);
            }
        } catch (e) {
            // No custom scenarios found
        }
    },

    /**
     * Get network class info
     */
    getNetworkClassInfo(classLetter) {
        const classes = {
            'A': {
                name: 'Class A',
                range: '1.0.0.0 - 126.255.255.255',
                defaultMask: '/8',
                hosts: '16,777,214',
                use: 'Very large networks'
            },
            'B': {
                name: 'Class B',
                range: '128.0.0.0 - 191.255.255.255',
                defaultMask: '/16',
                hosts: '65,534',
                use: 'Medium to large networks'
            },
            'C': {
                name: 'Class C',
                range: '192.0.0.0 - 223.255.255.255',
                defaultMask: '/24',
                hosts: '254',
                use: 'Small networks'
            }
        };
        return classes[classLetter.toUpperCase()] || classes['C'];
    },

    /**
     * Determine network class from IP
     */
    getClassFromIP(ip) {
        const firstOctet = parseInt(ip.split('.')[0], 10);
        if (firstOctet >= 1 && firstOctet <= 126) return 'A';
        if (firstOctet >= 128 && firstOctet <= 191) return 'B';
        if (firstOctet >= 192 && firstOctet <= 223) return 'C';
        return 'C'; // Default
    },

    /**
     * Get icon/emoji for business type
     */
    getTypeIcon(type) {
        const icons = {
            'retail': '☕',
            'office': '⚖️',
            'healthcare': '🏥',
            'tech': '💻',
            'industrial': '🏭',
            'education': '🎓',
            'finance': '🏦',
            'hospitality': '🏨',
            'transport': '✈️',
            'custom': '⚙️'
        };
        return icons[type] || '🏢';
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Scenarios;
}
