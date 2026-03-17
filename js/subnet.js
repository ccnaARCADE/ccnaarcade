/**
 * Subnet Calculator Module
 * Handles all CIDR/VLSM calculations for the game
 */
'use strict';

const SubnetCalculator = {
    /**
     * Convert CIDR prefix length to number of total addresses
     * @param {number} cidr - CIDR prefix (e.g., 24)
     * @returns {number} Total addresses in the subnet
     */
    cidrToTotalAddresses(cidr) {
        return Math.pow(2, 32 - cidr);
    },

    /**
     * Convert CIDR prefix to usable host count
     * Subtracts 2 for network and broadcast addresses
     * @param {number} cidr - CIDR prefix (e.g., 24)
     * @returns {number} Usable host addresses
     */
    cidrToHostCount(cidr) {
        const total = this.cidrToTotalAddresses(cidr);
        // For /31 and /32, special handling (point-to-point links)
        if (cidr >= 31) return cidr === 31 ? 2 : 1;
        return total - 2;
    },

    /**
     * Find minimum CIDR that can accommodate N hosts
     * @param {number} hosts - Required number of hosts
     * @returns {number} CIDR prefix length
     */
    hostCountToCidr(hosts) {
        // Need hosts + 2 (network + broadcast)
        const needed = hosts + 2;
        // Find the smallest power of 2 that fits
        const bits = Math.ceil(Math.log2(needed));
        return 32 - bits;
    },

    /**
     * Parse an IP address string to a 32-bit integer
     * @param {string} ip - IP address (e.g., "10.0.0.0")
     * @returns {number} 32-bit integer representation
     */
    ipToInt(ip) {
        const parts = ip.split('.').map(Number);
        return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
    },

    /**
     * Convert a 32-bit integer to IP address string
     * @param {number} int - 32-bit integer
     * @returns {string} IP address string
     */
    intToIp(int) {
        return [
            (int >>> 24) & 255,
            (int >>> 16) & 255,
            (int >>> 8) & 255,
            int & 255
        ].join('.');
    },

    /**
     * Parse CIDR notation to base address and prefix
     * @param {string} cidrNotation - CIDR notation (e.g., "10.0.0.0/20")
     * @returns {{baseIp: string, baseInt: number, prefix: number}}
     */
    parseCidr(cidrNotation) {
        const [ip, prefix] = cidrNotation.split('/');
        return {
            baseIp: ip,
            baseInt: this.ipToInt(ip),
            prefix: parseInt(prefix, 10)
        };
    },

    /**
     * Check if an address is on a valid VLSM boundary for a given CIDR
     * @param {number} address - Address as integer
     * @param {number} cidr - CIDR prefix for the subnet
     * @returns {boolean} True if address is on valid boundary
     */
    isValidBoundary(address, cidr) {
        const blockSize = this.cidrToTotalAddresses(cidr);
        return (address % blockSize) === 0;
    },

    /**
     * Get the network range for a subnet
     * @param {number} baseAddress - Starting address as integer
     * @param {number} cidr - CIDR prefix length
     * @returns {{start: number, end: number, size: number}}
     */
    getNetworkRange(baseAddress, cidr) {
        const size = this.cidrToTotalAddresses(cidr);
        return {
            start: baseAddress,
            end: baseAddress + size - 1,
            size: size
        };
    },

    /**
     * Find the next valid boundary for a CIDR block starting from an address
     * @param {number} address - Starting address
     * @param {number} cidr - CIDR prefix
     * @returns {number} Next valid boundary address
     */
    findNextValidBoundary(address, cidr) {
        const blockSize = this.cidrToTotalAddresses(cidr);
        return Math.ceil(address / blockSize) * blockSize;
    },

    /**
     * Check if two ranges overlap
     * @param {number} start1 - First range start
     * @param {number} end1 - First range end
     * @param {number} start2 - Second range start
     * @param {number} end2 - Second range end
     * @returns {boolean} True if ranges overlap
     */
    rangesOverlap(start1, end1, start2, end2) {
        return start1 <= end2 && start2 <= end1;
    },

    /**
     * Check if a subnet fits within a parent network
     * @param {number} subnetStart - Subnet start address
     * @param {number} subnetCidr - Subnet CIDR
     * @param {number} parentStart - Parent network start
     * @param {number} parentCidr - Parent CIDR
     * @returns {boolean} True if subnet fits within parent
     */
    fitsWithinParent(subnetStart, subnetCidr, parentStart, parentCidr) {
        const subnetRange = this.getNetworkRange(subnetStart, subnetCidr);
        const parentRange = this.getNetworkRange(parentStart, parentCidr);

        return subnetRange.start >= parentRange.start &&
               subnetRange.end <= parentRange.end;
    },

    /**
     * Get available CIDR sizes for a given parent network
     * @param {number} parentCidr - Parent network CIDR
     * @returns {number[]} Array of valid CIDR values
     */
    getAvailableCidrs(parentCidr) {
        const cidrs = [];
        // Can subnet from parent CIDR down to /30 (minimum useful)
        for (let cidr = parentCidr + 1; cidr <= 30; cidr++) {
            cidrs.push(cidr);
        }
        return cidrs;
    },

    /**
     * Calculate efficiency percentage
     * @param {number} hostsNeeded - Hosts required
     * @param {number} cidr - CIDR used
     * @returns {number} Efficiency percentage (0-100)
     */
    calculateEfficiency(hostsNeeded, cidr) {
        const available = this.cidrToHostCount(cidr);
        return Math.round((hostsNeeded / available) * 100);
    },

    /**
     * Get a human-readable description of a subnet
     * @param {number} address - Network address as integer
     * @param {number} cidr - CIDR prefix
     * @returns {string} Description string
     */
    describeSubnet(address, cidr) {
        const ip = this.intToIp(address);
        const hosts = this.cidrToHostCount(cidr);
        const total = this.cidrToTotalAddresses(cidr);
        return `${ip}/${cidr} (${hosts} usable hosts, ${total} total addresses)`;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubnetCalculator;
}
