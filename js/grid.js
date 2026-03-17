/**
 * Address Grid Module
 * Handles rendering and interaction with the IP address space grid
 */
'use strict';

class AddressGrid {
    constructor(canvas, baseNetwork) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Parse base network
        const parsed = SubnetCalculator.parseCidr(baseNetwork);
        this.baseAddress = parsed.baseInt;
        this.baseCidr = parsed.prefix;
        this.totalAddresses = SubnetCalculator.cidrToTotalAddresses(this.baseCidr);

        // Grid dimensions - use power of 2 for nice alignment
        this.gridSize = 64; // 64x64 = 4096 cells (good for /20)
        this.cellSize = this.width / this.gridSize;

        // Allocated subnets
        this.allocations = [];

        // Hover state
        this.hoverCell = null;
        this.selectedCidr = 24; // Default selection

        // Colors for different subnet sizes (retro palette)
        this.colors = {
            21: '#ff6b9d', // Pink
            22: '#c44dff', // Purple
            23: '#6b5bff', // Indigo
            24: '#00d4ff', // Cyan
            25: '#00ff9d', // Mint
            26: '#9dff00', // Lime
            27: '#ffd400', // Yellow
            28: '#ff9d00', // Orange
            29: '#ff4d4d', // Red
            30: '#ff6b6b', // Coral
        };

        // Setup event listeners
        this.setupEvents();
    }

    setupEvents() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }

    /**
     * Convert mouse position to grid cell
     */
    getCell(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.cellSize);
        const y = Math.floor((e.clientY - rect.top) / this.cellSize);
        return { x, y };
    }

    /**
     * Convert cell coordinates to address offset
     */
    cellToOffset(x, y) {
        return y * this.gridSize + x;
    }

    /**
     * Convert address offset to cell coordinates
     */
    offsetToCell(offset) {
        return {
            x: offset % this.gridSize,
            y: Math.floor(offset / this.gridSize)
        };
    }

    /**
     * Get the address for a cell
     */
    cellToAddress(x, y) {
        const offset = this.cellToOffset(x, y);
        // Scale offset to actual address space
        const addressOffset = Math.floor(offset * (this.totalAddresses / (this.gridSize * this.gridSize)));
        return this.baseAddress + addressOffset;
    }

    /**
     * Get cells covered by a subnet placed at a position
     */
    getSubnetCells(startOffset, cidr) {
        // Bounds validation
        if (startOffset < 0 || startOffset >= this.gridSize * this.gridSize) {
            return [];
        }

        const subnetSize = SubnetCalculator.cidrToTotalAddresses(cidr);
        const cellsPerAddress = (this.gridSize * this.gridSize) / this.totalAddresses;
        // Use Math.floor for consistent cell count calculation (matches canPlace)
        const cellCount = Math.max(1, Math.floor(subnetSize * cellsPerAddress));

        const cells = [];
        for (let i = 0; i < cellCount; i++) {
            const offset = startOffset + i;
            if (offset >= 0 && offset < this.gridSize * this.gridSize) {
                cells.push(this.offsetToCell(offset));
            }
        }
        return cells;
    }

    /**
     * Snap to valid VLSM boundary
     */
    snapToBoundary(offset, cidr) {
        const subnetSize = SubnetCalculator.cidrToTotalAddresses(cidr);
        const cellsPerAddress = (this.gridSize * this.gridSize) / this.totalAddresses;
        // Use Math.floor for consistent calculation across all methods
        const cellsPerSubnet = Math.max(1, Math.floor(subnetSize * cellsPerAddress));

        // Snap to nearest valid boundary
        return Math.floor(offset / cellsPerSubnet) * cellsPerSubnet;
    }

    handleMouseMove(e) {
        const cell = this.getCell(e);
        const offset = this.cellToOffset(cell.x, cell.y);
        const snappedOffset = this.snapToBoundary(offset, this.selectedCidr);

        if (this.hoverCell !== snappedOffset) {
            this.hoverCell = snappedOffset;
            this.render();
        }
    }

    handleMouseLeave() {
        this.hoverCell = null;
        this.render();
    }

    handleClick(e) {
        if (this.hoverCell === null) return;

        // This will be handled by the game engine
        if (this.onCellClick) {
            this.onCellClick(this.hoverCell, this.selectedCidr);
        }
    }

    /**
     * Check if a placement would be valid
     */
    canPlace(offset, cidr) {
        // Snap offset to valid CIDR boundary first
        const snappedOffset = this.snapToBoundary(offset, cidr);
        const cells = this.getSubnetCells(snappedOffset, cidr);

        // Check bounds
        if (cells.length === 0) return false;
        const lastCell = cells[cells.length - 1];
        if (lastCell.y >= this.gridSize) return false;

        // Check for overlaps with existing allocations using offset ranges
        // This is more efficient and accurate than cell-by-cell comparison
        const subnetSize = SubnetCalculator.cidrToTotalAddresses(cidr);
        const cellsPerAddress = (this.gridSize * this.gridSize) / this.totalAddresses;
        const cellCount = Math.max(1, Math.floor(subnetSize * cellsPerAddress));
        const newStart = snappedOffset;
        const newEnd = snappedOffset + cellCount - 1;

        for (const alloc of this.allocations) {
            const allocSize = SubnetCalculator.cidrToTotalAddresses(alloc.cidr);
            const allocCellCount = Math.max(1, Math.floor(allocSize * cellsPerAddress));
            const allocStart = alloc.offset;
            const allocEnd = alloc.offset + allocCellCount - 1;

            // Check if ranges overlap
            if (newStart <= allocEnd && newEnd >= allocStart) {
                return false;
            }
        }

        return true;
    }

    /**
     * Add an allocation
     */
    allocate(offset, cidr, requirementId = null, customColor = null) {
        // Snap offset to valid CIDR boundary first
        const snappedOffset = this.snapToBoundary(offset, cidr);

        if (!this.canPlace(snappedOffset, cidr)) return false;

        this.allocations.push({
            offset: snappedOffset,
            cidr,
            requirementId,
            color: customColor || this.colors[cidr] || '#ffffff'
        });

        this.render();
        return true;
    }

    /**
     * Remove an allocation
     */
    deallocate(offset) {
        this.allocations = this.allocations.filter(a => a.offset !== offset);
        this.render();
    }

    /**
     * Clear all allocations
     */
    clearAllocations() {
        this.allocations = [];
        this.render();
    }

    /**
     * Set the selected CIDR for placement
     */
    setSelectedCidr(cidr) {
        this.selectedCidr = cidr;
        // Re-snap hover cell to new CIDR boundary to avoid misalignment
        if (this.hoverCell !== null) {
            this.hoverCell = this.snapToBoundary(this.hoverCell, cidr);
        }
        this.render();
    }

    /**
     * Calculate total waste
     */
    calculateWaste() {
        let usedAddresses = 0;
        let neededAddresses = 0;

        for (const alloc of this.allocations) {
            usedAddresses += SubnetCalculator.cidrToTotalAddresses(alloc.cidr);
            // Would need requirement info to calculate actual needed
        }

        return {
            used: usedAddresses,
            total: this.totalAddresses,
            percentage: Math.round((usedAddresses / this.totalAddresses) * 100)
        };
    }

    /**
     * Main render function
     */
    render() {
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid lines
        ctx.strokeStyle = '#1a1a3a';
        ctx.lineWidth = 1;

        for (let i = 0; i <= this.gridSize; i++) {
            const pos = i * this.cellSize;

            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, this.height);
            ctx.stroke();

            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(this.width, pos);
            ctx.stroke();
        }

        // Draw allocations
        for (const alloc of this.allocations) {
            this.drawAllocation(alloc);
        }

        // Draw hover preview
        if (this.hoverCell !== null) {
            this.drawHoverPreview();
        }
    }

    drawAllocation(alloc) {
        const ctx = this.ctx;
        const cells = this.getSubnetCells(alloc.offset, alloc.cidr);

        if (!cells || cells.length === 0) return;

        // Find bounding box
        const minX = Math.min(...cells.map(c => c.x));
        const maxX = Math.max(...cells.map(c => c.x));
        const minY = Math.min(...cells.map(c => c.y));
        const maxY = Math.max(...cells.map(c => c.y));

        const x = minX * this.cellSize;
        const y = minY * this.cellSize;
        const w = (maxX - minX + 1) * this.cellSize;
        const h = (maxY - minY + 1) * this.cellSize;

        // Fill
        ctx.fillStyle = alloc.color + 'cc'; // Semi-transparent
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

        // Border
        ctx.strokeStyle = alloc.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const label = `/${alloc.cidr}`;
        const centerX = x + w / 2;
        const centerY = y + h / 2;

        // Shadow for readability
        ctx.fillStyle = '#000000';
        ctx.fillText(label, centerX + 1, centerY + 1);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, centerX, centerY);
    }

    drawHoverPreview() {
        const ctx = this.ctx;
        const cells = this.getSubnetCells(this.hoverCell, this.selectedCidr);

        if (cells.length === 0) return;

        const canPlace = this.canPlace(this.hoverCell, this.selectedCidr);
        const color = canPlace ? '#00ff00' : '#ff0000';

        // Find bounding box
        const minX = Math.min(...cells.map(c => c.x));
        const maxX = Math.max(...cells.map(c => c.x));
        const minY = Math.min(...cells.map(c => c.y));
        const maxY = Math.max(...cells.map(c => c.y));

        const x = minX * this.cellSize;
        const y = minY * this.cellSize;
        const w = (maxX - minX + 1) * this.cellSize;
        const h = (maxY - minY + 1) * this.cellSize;

        // Preview fill
        ctx.fillStyle = color + '44';
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

        // Preview border (dashed)
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
        ctx.setLineDash([]);
    }

    /**
     * Reset the grid to a new network
     */
    reset(baseNetwork) {
        const parsed = SubnetCalculator.parseCidr(baseNetwork);
        this.baseAddress = parsed.baseInt;
        this.baseCidr = parsed.prefix;
        this.totalAddresses = SubnetCalculator.cidrToTotalAddresses(this.baseCidr);
        this.allocations = [];
        this.hoverCell = null;
        this.render();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AddressGrid;
}
