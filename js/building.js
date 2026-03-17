/**
 * Building Visualization Module
 * Renders a building that fills up as subnets are allocated
 * Shows "internet turning on" with network cables, data pulses, and connectivity animations
 */
'use strict';

const BuildingRenderer = {
    canvas: null,
    ctx: null,

    // Building configuration
    buildingType: 'office', // office, retail, industrial, hospital, school
    floors: [],
    allocatedFloors: [],

    // Animation state
    animationFrame: 0,
    dataPulses: [],
    wifiWaves: [],
    lastAllocatedFloor: null,
    connectionAnimation: 0,

    // Colors for different subnet types
    floorColors: [
        '#00d4ff', // Cyan
        '#00ff9d', // Green
        '#ffd400', // Yellow
        '#ff6b9d', // Pink
        '#9d6bff', // Purple
        '#ff9d00', // Orange
        '#6bff9d', // Light green
        '#ff6b6b'  // Red
    ],

    // Building type configurations
    buildingTypes: {
        retail: {
            icon: '☕',
            baseColor: '#8B4513',
            windowColor: '#FFD700',
            roofStyle: 'awning',
            floors: 2
        },
        office: {
            icon: '🏢',
            baseColor: '#4a5568',
            windowColor: '#87CEEB',
            roofStyle: 'flat',
            floors: 5
        },
        healthcare: {
            icon: '🏥',
            baseColor: '#ffffff',
            windowColor: '#ADD8E6',
            roofStyle: 'cross',
            floors: 4
        },
        tech: {
            icon: '💻',
            baseColor: '#2d3748',
            windowColor: '#00d4ff',
            roofStyle: 'modern',
            floors: 6
        },
        industrial: {
            icon: '🏭',
            baseColor: '#6b7280',
            windowColor: '#ffd400',
            roofStyle: 'industrial',
            floors: 3
        },
        education: {
            icon: '🎓',
            baseColor: '#8B0000',
            windowColor: '#FFFACD',
            roofStyle: 'peaked',
            floors: 3
        },
        finance: {
            icon: '🏦',
            baseColor: '#1a365d',
            windowColor: '#ffd700',
            roofStyle: 'columns',
            floors: 8
        }
    },

    /**
     * Initialize the building renderer
     */
    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.startAnimation();
    },

    /**
     * Start the animation loop
     * Uses setInterval at 10fps to save CPU resources
     */
    startAnimation() {
        // Avoid creating multiple intervals
        if (this.animationInterval) return;

        this.animationInterval = setInterval(() => {
            this.animationFrame++;
            this.updatePulses();
            this.render();
        }, 100);
    },

    /**
     * Stop the animation loop
     */
    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    },

    /**
     * Update data pulses and animations
     */
    updatePulses() {
        // Update existing pulses
        this.dataPulses = this.dataPulses.filter(pulse => {
            pulse.progress += pulse.speed;
            return pulse.progress < 1;
        });

        // Update WiFi waves
        this.wifiWaves = this.wifiWaves.filter(wave => {
            wave.radius += 2;
            wave.opacity -= 0.02;
            return wave.opacity > 0;
        });

        // Add random data pulses on cables if we have allocations
        if (this.allocatedFloors.length > 0 && Math.random() < 0.1) {
            const maxFloor = Math.max(...this.allocatedFloors);
            this.dataPulses.push({
                startFloor: 0,
                endFloor: maxFloor,
                progress: 0,
                speed: 0.05 + Math.random() * 0.05,
                color: this.floorColors[Math.floor(Math.random() * this.floorColors.length)],
                side: Math.random() > 0.5 ? 'left' : 'right'
            });
        }

        // Connection animation counter
        if (this.connectionAnimation > 0) {
            this.connectionAnimation--;
        }
    },

    /**
     * Trigger connection animation when a floor is allocated
     */
    triggerConnectionEffect(floorIndex) {
        this.connectionAnimation = 30;
        this.lastAllocatedFloor = floorIndex;

        // Add burst of data pulses
        for (let i = 0; i < 5; i++) {
            this.dataPulses.push({
                startFloor: 0,
                endFloor: floorIndex,
                progress: Math.random() * 0.3,
                speed: 0.08 + Math.random() * 0.05,
                color: this.floorColors[floorIndex % this.floorColors.length],
                side: i % 2 === 0 ? 'left' : 'right'
            });
        }

        // Add WiFi waves if fully connected
        if (this.allocatedFloors.length === this.floors.length) {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    this.wifiWaves.push({
                        radius: 10,
                        opacity: 1,
                        delay: i * 0.2
                    });
                }, i * 200);
            }
        }
    },

    /**
     * Setup building for a scenario
     */
    setupForScenario(scenario) {
        const typeConfig = this.buildingTypes[scenario.type] || this.buildingTypes.office;
        this.buildingType = scenario.type;

        // Create floors from subnet requirements
        this.floors = scenario.subnets.map((subnet, index) => ({
            id: index,
            name: subnet.name,
            hosts: subnet.hosts,
            context: subnet.context,
            allocated: false,
            color: this.floorColors[index % this.floorColors.length]
        }));

        this.allocatedFloors = [];
        this.render();
        this.updateLegend();
    },

    /**
     * Mark a floor as allocated
     */
    allocateFloor(index) {
        if (this.floors[index]) {
            this.floors[index].allocated = true;
            this.allocatedFloors.push(index);
            this.triggerConnectionEffect(index);
            this.render();
            this.updateLegend();
        }
    },

    /**
     * Mark a floor by name as allocated
     */
    allocateFloorByName(name) {
        const floor = this.floors.find(f => f.name === name);
        if (floor) {
            floor.allocated = true;
            this.allocatedFloors.push(floor.id);
            this.render();
            this.updateLegend();
        }
    },

    /**
     * Render the building
     */
    render() {
        if (!this.ctx) return;

        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, width, height);

        // Draw sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, '#0a0a2a');
        skyGrad.addColorStop(1, '#1a1a3a');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // Draw stars (static based on seed for consistency)
        ctx.fillStyle = '#ffffff';
        const starSeed = 12345;
        for (let i = 0; i < 20; i++) {
            const x = ((starSeed * (i + 1) * 7) % 1000) / 1000 * width;
            const y = ((starSeed * (i + 1) * 13) % 1000) / 1000 * (height * 0.4);
            ctx.fillRect(x, y, 2, 2);
        }

        // Building dimensions
        const buildingWidth = width * 0.6;
        const buildingX = (width - buildingWidth) / 2;
        const groundY = height - 30;
        const floorHeight = Math.min(35, (groundY - 50) / Math.max(this.floors.length, 3));
        const buildingHeight = floorHeight * this.floors.length;
        const buildingY = groundY - buildingHeight;

        // Draw ground with cable trench
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(0, groundY, width, height - groundY);

        // Draw underground cable (fiber optic)
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, groundY + 15);
        ctx.lineTo(buildingX - 5, groundY + 15);
        ctx.lineTo(buildingX - 5, groundY);
        ctx.stroke();

        // Draw building base shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(buildingX + 10, groundY, buildingWidth, 10);

        // Draw building body
        const typeConfig = this.buildingTypes[this.buildingType] || this.buildingTypes.office;
        ctx.fillStyle = typeConfig.baseColor;
        ctx.fillRect(buildingX, buildingY, buildingWidth, buildingHeight);

        // Draw building outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(buildingX, buildingY, buildingWidth, buildingHeight);

        // Draw network cables on the left side of building
        this.drawNetworkCables(ctx, buildingX, buildingY, buildingWidth, buildingHeight, groundY, floorHeight);

        // Draw floors (bottom to top for visual order)
        const floorsReversed = [...this.floors].reverse();
        floorsReversed.forEach((floor, visualIndex) => {
            const actualIndex = this.floors.length - 1 - visualIndex;
            const floorY = buildingY + (visualIndex * floorHeight);

            // Floor background - now shows as "network connected" glow instead of solid color
            if (floor.allocated) {
                // Subtle network glow instead of solid fill
                const gradient = ctx.createLinearGradient(buildingX, floorY, buildingX + buildingWidth, floorY);
                gradient.addColorStop(0, floor.color + '66');
                gradient.addColorStop(0.5, floor.color + '33');
                gradient.addColorStop(1, floor.color + '66');
                ctx.fillStyle = gradient;
                ctx.fillRect(buildingX + 2, floorY + 2, buildingWidth - 4, floorHeight - 4);
            }

            // Draw windows
            const windowWidth = 15;
            const windowHeight = floorHeight * 0.6;
            const windowY = floorY + (floorHeight - windowHeight) / 2;
            const windowCount = Math.floor((buildingWidth - 20) / 25);
            const windowSpacing = (buildingWidth - 20) / windowCount;

            for (let w = 0; w < windowCount; w++) {
                const windowX = buildingX + 10 + (w * windowSpacing) + (windowSpacing - windowWidth) / 2;

                if (floor.allocated) {
                    // Lit window with screen glow effect
                    const screenGlow = (Math.sin(this.animationFrame * 0.1 + w) + 1) * 0.1;
                    ctx.fillStyle = `rgba(0, 212, 255, ${0.7 + screenGlow})`;
                    ctx.fillRect(windowX, windowY, windowWidth, windowHeight);

                    // Computer screen inner glow
                    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + screenGlow})`;
                    ctx.fillRect(windowX + 2, windowY + 2, windowWidth - 4, windowHeight - 6);
                } else {
                    // Dark window
                    ctx.fillStyle = '#1a1a2e';
                    ctx.fillRect(windowX, windowY, windowWidth, windowHeight);

                    // Window frame
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(windowX, windowY, windowWidth, windowHeight);
                }
            }

            // Draw router/switch icon for allocated floors
            if (floor.allocated) {
                this.drawRouterIcon(ctx, buildingX + buildingWidth - 20, floorY + floorHeight / 2, floor.color);
            }

            // Floor divider
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(buildingX, floorY + floorHeight);
            ctx.lineTo(buildingX + buildingWidth, floorY + floorHeight);
            ctx.stroke();
        });

        // Draw data pulses on cables
        this.drawDataPulses(ctx, buildingX, buildingY, buildingWidth, buildingHeight, groundY, floorHeight);

        // Draw roof based on type
        this.drawRoof(buildingX, buildingY, buildingWidth, typeConfig);

        // Draw WiFi antenna on roof
        this.drawWifiAntenna(ctx, buildingX + buildingWidth / 2, buildingY - 5);

        // Draw WiFi waves if any
        this.drawWifiWaves(ctx, buildingX + buildingWidth / 2, buildingY - 15);

        // Draw entrance with network connection point
        const doorWidth = 30;
        const doorHeight = 25;
        const doorX = buildingX + (buildingWidth - doorWidth) / 2;
        const doorY = groundY - doorHeight;

        ctx.fillStyle = '#1a365d';
        ctx.fillRect(doorX, doorY, doorWidth, doorHeight);
        ctx.strokeStyle = this.allocatedFloors.length > 0 ? '#00d4ff' : '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(doorX, doorY, doorWidth, doorHeight);

        // Connection status indicator
        this.drawConnectionStatus(ctx, buildingX + buildingWidth + 10, buildingY + buildingHeight / 2);

        // Progress indicator
        const progress = this.allocatedFloors.length / Math.max(this.floors.length, 1);
        this.drawProgressBar(10, 10, width - 20, 8, progress);
    },

    /**
     * Draw network cables running up the building
     */
    drawNetworkCables(ctx, buildingX, buildingY, buildingWidth, buildingHeight, groundY, floorHeight) {
        const cableX = buildingX - 8;

        // Main vertical cable
        const hasConnection = this.allocatedFloors.length > 0;
        ctx.strokeStyle = hasConnection ? '#00d4ff' : '#333';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cableX, groundY);
        ctx.lineTo(cableX, buildingY);
        ctx.stroke();

        // Cable glow if connected
        if (hasConnection) {
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(cableX, groundY);
            ctx.lineTo(cableX, buildingY);
            ctx.stroke();
        }

        // Horizontal branches to each floor
        this.floors.forEach((floor, index) => {
            const floorY = groundY - (index + 1) * floorHeight + floorHeight / 2;
            const isConnected = floor.allocated;

            ctx.strokeStyle = isConnected ? floor.color : '#444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cableX, floorY);
            ctx.lineTo(buildingX + 5, floorY);
            ctx.stroke();

            // Connection node
            ctx.fillStyle = isConnected ? floor.color : '#444';
            ctx.beginPath();
            ctx.arc(cableX, floorY, 4, 0, Math.PI * 2);
            ctx.fill();

            // Glow for connected nodes
            if (isConnected) {
                ctx.fillStyle = floor.color + '44';
                ctx.beginPath();
                ctx.arc(cableX, floorY, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    },

    /**
     * Draw data pulses traveling through cables
     */
    drawDataPulses(ctx, buildingX, buildingY, buildingWidth, buildingHeight, groundY, floorHeight) {
        const cableX = buildingX - 8;

        this.dataPulses.forEach(pulse => {
            const startY = groundY;
            const endFloorY = groundY - (pulse.endFloor + 1) * floorHeight + floorHeight / 2;
            const currentY = startY + (endFloorY - startY) * pulse.progress;

            // Draw pulse
            ctx.fillStyle = pulse.color;
            ctx.beginPath();
            ctx.arc(cableX, currentY, 5, 0, Math.PI * 2);
            ctx.fill();

            // Pulse glow
            ctx.fillStyle = pulse.color + '66';
            ctx.beginPath();
            ctx.arc(cableX, currentY, 10, 0, Math.PI * 2);
            ctx.fill();

            // Trail
            ctx.strokeStyle = pulse.color + '44';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cableX, currentY);
            ctx.lineTo(cableX, currentY + 20);
            ctx.stroke();
        });
    },

    /**
     * Draw router/switch icon
     */
    drawRouterIcon(ctx, x, y, color) {
        // Small router box
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x - 6, y - 4, 12, 8);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 6, y - 4, 12, 8);

        // Blinking lights
        const blink = Math.sin(this.animationFrame * 0.2) > 0;
        ctx.fillStyle = blink ? '#00ff00' : '#003300';
        ctx.fillRect(x - 4, y - 2, 3, 3);
        ctx.fillStyle = '#00d4ff';
        ctx.fillRect(x + 1, y - 2, 3, 3);
    },

    /**
     * Draw WiFi antenna on roof
     */
    drawWifiAntenna(ctx, x, y) {
        const hasFullConnection = this.allocatedFloors.length === this.floors.length && this.floors.length > 0;

        // Antenna pole
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - 15);
        ctx.stroke();

        // Antenna top
        ctx.fillStyle = hasFullConnection ? '#00ff00' : '#666';
        ctx.beginPath();
        ctx.arc(x, y - 17, 4, 0, Math.PI * 2);
        ctx.fill();

        // Glow if active
        if (hasFullConnection) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(x, y - 17, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    /**
     * Draw WiFi waves emanating from antenna
     */
    drawWifiWaves(ctx, x, y) {
        this.wifiWaves.forEach(wave => {
            ctx.strokeStyle = `rgba(0, 255, 0, ${wave.opacity})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, wave.radius, -Math.PI * 0.8, -Math.PI * 0.2);
            ctx.stroke();
        });

        // Continuous waves if fully connected
        if (this.allocatedFloors.length === this.floors.length && this.floors.length > 0) {
            for (let i = 0; i < 3; i++) {
                const waveRadius = 15 + i * 12 + (this.animationFrame % 20);
                const opacity = 0.5 - (i * 0.15) - ((this.animationFrame % 20) / 40);
                if (opacity > 0) {
                    ctx.strokeStyle = `rgba(0, 255, 0, ${opacity})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(x, y, waveRadius, -Math.PI * 0.8, -Math.PI * 0.2);
                    ctx.stroke();
                }
            }
        }
    },

    /**
     * Draw connection status indicator
     */
    drawConnectionStatus(ctx, x, y) {
        const connected = this.allocatedFloors.length;
        const total = this.floors.length;

        if (total === 0) return;

        // Status text
        ctx.font = '8px "Press Start 2P"';
        ctx.fillStyle = connected === total ? '#00ff00' : '#00d4ff';
        ctx.textAlign = 'left';

        if (connected === total) {
            ctx.fillText('ONLINE', x, y - 10);
            // Pulsing indicator
            const pulse = (Math.sin(this.animationFrame * 0.15) + 1) / 2;
            ctx.fillStyle = `rgba(0, 255, 0, ${0.5 + pulse * 0.5})`;
            ctx.beginPath();
            ctx.arc(x + 35, y - 13, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (connected > 0) {
            ctx.fillText('PARTIAL', x, y - 10);
            ctx.fillStyle = '#ffd400';
            ctx.beginPath();
            ctx.arc(x + 40, y - 13, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#ff4444';
            ctx.fillText('OFFLINE', x, y - 10);
        }
    },

    /**
     * Draw roof based on building type
     */
    drawRoof(x, y, width, config) {
        const ctx = this.ctx;

        switch (config.roofStyle) {
            case 'peaked':
                ctx.fillStyle = '#4a5568';
                ctx.beginPath();
                ctx.moveTo(x - 5, y);
                ctx.lineTo(x + width / 2, y - 25);
                ctx.lineTo(x + width + 5, y);
                ctx.closePath();
                ctx.fill();
                break;

            case 'awning':
                ctx.fillStyle = '#ff6b6b';
                ctx.fillRect(x - 10, y - 10, width + 20, 10);
                break;

            case 'industrial':
                // Smokestacks
                ctx.fillStyle = '#6b7280';
                ctx.fillRect(x + 20, y - 30, 15, 30);
                ctx.fillRect(x + width - 35, y - 40, 15, 40);
                break;

            case 'cross':
                // Medical cross on roof
                ctx.fillStyle = '#ff0000';
                const crossX = x + width / 2 - 10;
                ctx.fillRect(crossX, y - 25, 20, 5);
                ctx.fillRect(crossX + 7.5, y - 32, 5, 20);
                break;

            case 'columns':
                // Classical columns at entrance (drawn separately)
                break;

            default:
                // Flat roof with AC units
                ctx.fillStyle = '#4a5568';
                ctx.fillRect(x + 10, y - 8, 20, 8);
                ctx.fillRect(x + width - 30, y - 12, 20, 12);
        }
    },

    /**
     * Draw progress bar
     */
    drawProgressBar(x, y, width, height, progress) {
        const ctx = this.ctx;

        // Background
        ctx.fillStyle = '#333366';
        ctx.fillRect(x, y, width, height);

        // Progress
        const progressColor = progress >= 1 ? '#00ff9d' : '#00d4ff';
        ctx.fillStyle = progressColor;
        ctx.fillRect(x, y, width * progress, height);

        // Border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    },

    /**
     * Update the floor legend
     */
    updateLegend() {
        const legend = document.getElementById('floor-legend');
        if (!legend) return;

        legend.innerHTML = '';

        // Show floors from bottom to top (reversed for display)
        [...this.floors].reverse().forEach(floor => {
            const item = document.createElement('div');
            item.className = `floor-item ${floor.allocated ? 'allocated' : 'pending'}`;

            item.innerHTML = `
                <div class="floor-color" style="background: ${floor.allocated ? floor.color : '#333'}"></div>
                <div class="floor-name">${floor.name}</div>
            `;

            legend.appendChild(item);
        });
    },

    /**
     * Get floor color by index
     */
    getFloorColor(index) {
        return this.floorColors[index % this.floorColors.length];
    },

    /**
     * Reset building
     */
    reset() {
        this.floors = [];
        this.allocatedFloors = [];
        this.dataPulses = [];
        this.wifiWaves = [];
        this.lastAllocatedFloor = null;
        this.connectionAnimation = 0;
        if (this.ctx) {
            this.ctx.fillStyle = '#0a0a1a';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BuildingRenderer;
}
