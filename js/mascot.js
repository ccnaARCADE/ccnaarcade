/**
 * Mascot Module
 * Renders "Bit" - a cute data packet mascot that rides network cables
 */
'use strict';

const Mascot = {
    // Mascot state
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    speed: 2,
    baseSpeed: 2,
    streak: 0,
    state: 'idle', // idle, riding, celebrating, crashed
    direction: 1, // 1 = right, -1 = left
    frame: 0,
    crashTimer: 0,
    celebrateTimer: 0,
    trailParticles: [],

    // Animation colors
    colors: {
        body: '#00d4ff',
        bodyGlow: '#00d4ff44',
        eye: '#ffffff',
        pupil: '#0a0a1a',
        highlight: '#ffffff',
        blush: '#ff6b9d'
    },

    // Pixel art sprite data for different states
    sprites: {
        // 8x8 pixel art represented as strings
        // '.' = transparent, '#' = body, 'E' = eye, 'P' = pupil, 'H' = highlight
        idle: [
            '..####..',
            '.######.',
            '##E##E##',
            '##P##P##',
            '########',
            '.######.',
            '..####..',
            '...##...'
        ],
        happy: [
            '..####..',
            '.######.',
            '##^##^##',
            '########',
            '##....##',
            '.######.',
            '..####..',
            '...##...'
        ],
        riding: [
            '..####..',
            '.######.',
            '##E##E##',
            '##P##P##',
            '########',
            '.#....#.',
            '..####..',
            '.##..##.'
        ],
        crashed: [
            '..####..',
            '.######.',
            '##X##X##',
            '########',
            '##....##',
            '.######.',
            '...##...',
            '..#..#..'
        ]
    },

    /**
     * Initialize mascot at a position
     */
    init(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.state = 'idle';
        this.streak = 0;
        this.speed = this.baseSpeed;
        this.frame = 0;
        this.trailParticles = [];
    },

    /**
     * Update streak and speed
     */
    setStreak(streak) {
        this.streak = streak;
        // Speed increases with streak, max 3x speed at streak 10
        this.speed = this.baseSpeed * (1 + Math.min(streak, 10) * 0.2);
    },

    /**
     * Move mascot to target position
     */
    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
        if (this.state !== 'crashed' && this.state !== 'celebrating') {
            this.state = 'riding';
        }
        this.direction = x > this.x ? 1 : -1;
    },

    /**
     * Trigger celebration animation
     */
    celebrate() {
        this.state = 'celebrating';
        this.celebrateTimer = 30;

        // Add celebration particles
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.trailParticles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 20,
                color: ['#00d4ff', '#00ff9d', '#ffd400', '#ff6b9d'][i % 4]
            });
        }
    },

    /**
     * Trigger crash animation
     */
    crash() {
        this.state = 'crashed';
        this.crashTimer = 45;
        this.speed = this.baseSpeed;

        // Add crash particles
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.trailParticles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 15 + Math.random() * 10,
                color: '#ff4444'
            });
        }
    },

    /**
     * Update mascot state
     */
    update() {
        this.frame++;

        // Move towards target
        if (this.state === 'riding' || this.state === 'idle') {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > this.speed) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;

                // Add trail particles when moving fast
                if (this.streak >= 3 && this.frame % 3 === 0) {
                    this.trailParticles.push({
                        x: this.x - this.direction * 10,
                        y: this.y,
                        vx: -this.direction * (0.5 + Math.random()),
                        vy: (Math.random() - 0.5) * 2,
                        life: 10,
                        color: this.colors.body
                    });
                }
            } else {
                this.x = this.targetX;
                this.y = this.targetY;
                if (this.state === 'riding') {
                    this.state = 'idle';
                }
            }
        }

        // Update crash state
        if (this.state === 'crashed') {
            this.crashTimer--;
            if (this.crashTimer <= 0) {
                this.state = 'idle';
            }
        }

        // Update celebration state
        if (this.state === 'celebrating') {
            this.celebrateTimer--;
            if (this.celebrateTimer <= 0) {
                this.state = 'idle';
            }
        }

        // Update particles
        this.trailParticles = this.trailParticles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // gravity
            p.life--;
            return p.life > 0;
        });
    },

    /**
     * Render the mascot
     */
    render(ctx) {
        this.update();

        // Draw trail particles
        this.trailParticles.forEach(p => {
            const alpha = p.life / 20;
            ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Choose sprite based on state
        let sprite;
        switch (this.state) {
            case 'crashed':
                sprite = this.sprites.crashed;
                break;
            case 'celebrating':
                sprite = this.sprites.happy;
                break;
            case 'riding':
                sprite = this.sprites.riding;
                break;
            default:
                sprite = this.sprites.idle;
        }

        // Calculate bob animation
        const bob = Math.sin(this.frame * 0.1) * 2;
        const wobble = this.state === 'crashed' ? Math.sin(this.frame * 0.5) * 3 : 0;

        // Draw glow when riding fast
        if (this.streak >= 5) {
            const glowSize = 20 + this.streak;
            const gradient = ctx.createRadialGradient(
                this.x + wobble, this.y + bob,
                0,
                this.x + wobble, this.y + bob,
                glowSize
            );
            gradient.addColorStop(0, this.colors.body + '44');
            gradient.addColorStop(1, this.colors.body + '00');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x + wobble, this.y + bob, glowSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw sprite (pixel art style)
        const pixelSize = 3;
        const spriteSize = sprite.length * pixelSize;
        const startX = this.x - spriteSize / 2 + wobble;
        const startY = this.y - spriteSize / 2 + bob;

        // Mirror if facing left
        ctx.save();
        if (this.direction === -1) {
            ctx.translate(this.x * 2, 0);
            ctx.scale(-1, 1);
        }

        sprite.forEach((row, rowIndex) => {
            [...row].forEach((pixel, colIndex) => {
                let color = null;

                switch (pixel) {
                    case '#':
                        // Body color changes based on streak
                        if (this.streak >= 10) {
                            color = '#ffd400'; // Gold at max streak
                        } else if (this.streak >= 5) {
                            color = '#00ff9d'; // Green at mid streak
                        } else {
                            color = this.colors.body;
                        }
                        break;
                    case 'E':
                        color = this.colors.eye;
                        break;
                    case 'P':
                        color = this.colors.pupil;
                        break;
                    case 'H':
                        color = this.colors.highlight;
                        break;
                    case '^':
                        color = this.colors.eye; // Happy eyes
                        break;
                    case 'X':
                        color = '#ff4444'; // Crash X eyes
                        break;
                    case '.':
                    default:
                        color = null;
                }

                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        startX + colIndex * pixelSize,
                        startY + rowIndex * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            });
        });

        ctx.restore();

        // Draw streak indicator above mascot
        if (this.streak > 0) {
            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = this.streak >= 10 ? '#ffd400' : '#00d4ff';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.streak}x`, this.x, this.y - 20 + bob);
        }

        // Draw speed lines when fast
        if (this.state === 'riding' && this.streak >= 3) {
            ctx.strokeStyle = this.colors.body + '66';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                const lineY = this.y - 5 + i * 5 + bob;
                ctx.beginPath();
                ctx.moveTo(this.x - this.direction * 15 - i * 5, lineY);
                ctx.lineTo(this.x - this.direction * 25 - i * 5, lineY);
                ctx.stroke();
            }
        }
    },

    /**
     * Get current sprite for use elsewhere
     */
    getSprite(state = 'idle') {
        return this.sprites[state] || this.sprites.idle;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Mascot;
}
