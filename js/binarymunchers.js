/**
 * Binary Munchers Module
 * Number Munchers-style arcade game for binary/decimal training
 *
 * Classic gameplay: Navigate a grid, "munch" correct values, avoid enemies.
 *
 * CHALLENGE TYPES:
 * - decimal_to_binary: "Munch binary for 192" → find 11000000
 * - binary_to_decimal: "Munch decimal for 11110000" → find 240
 * - powers_of_two: "Munch all powers of 2" → 2, 4, 8, 16...
 * - subnet_values: "Munch subnet mask values" → 128, 192, 224, 240, 248, 252, 254, 255
 * - bit_count: "Munch values with exactly 4 bits set"
 * - bit_position: "Munch values with bit 7 set" → 128-255
 * - greater_than: "Munch values > 127"
 * - octet_range: "Munch valid first octets for Class C" → 192-223
 *
 * @module BinaryMunchers
 * @version 1.0
 */
'use strict';

const BinaryMunchers = {
    // ========================================
    // GAME STATE
    // ========================================
    active: false,
    paused: false,
    level: 1,
    score: 0,
    lives: 3,

    // Grid state
    gridWidth: 7,
    gridHeight: 5,
    cells: [],
    correctCells: [],
    munchedCount: 0,
    targetCount: 0,

    // Player state
    player: { x: 3, y: 2 },
    boosting: false,
    boostCooldown: false,

    // Enemy state
    enemies: [],
    maxEnemies: 2,
    enemySpeed: 1500, // ms between moves

    // Current challenge
    challenge: null,
    challengeTypes: [
        'decimal_to_binary',
        'binary_to_decimal',
        'powers_of_two',
        'subnet_values',
        'bit_count',
        'bit_position'
    ],

    // Timing
    enemyTimer: null,
    gameLoop: null,

    // DOM elements cache
    elements: {},

    // Callbacks
    onGameOver: null,

    // ========================================
    // SUBNET-RELEVANT VALUES
    // ========================================
    subnetValues: [0, 128, 192, 224, 240, 248, 252, 254, 255],
    powersOfTwo: [1, 2, 4, 8, 16, 32, 64, 128, 256],

    /**
     * Initialize the module
     */
    init() {
        this.elements = {
            screen: document.getElementById('binary-munchers-screen'),
            grid: document.getElementById('bm-grid'),
            player: document.getElementById('bm-player'),
            enemies: document.getElementById('bm-enemies'),
            score: document.getElementById('bm-score'),
            lives: document.getElementById('bm-lives'),
            level: document.getElementById('bm-level'),
            challengeText: document.getElementById('bm-challenge-text'),
            munchedCount: document.getElementById('bm-munched-count'),
            targetCount: document.getElementById('bm-target-count'),
            powerupDisplay: document.getElementById('bm-powerup-display')
        };

        this.setupKeyboardControls();
    },

    /**
     * Setup keyboard controls
     */
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.active || this.paused) return;

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    this.movePlayer(0, -1);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    this.movePlayer(0, 1);
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.movePlayer(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.movePlayer(1, 0);
                    break;
                case ' ':
                    e.preventDefault();
                    this.activateBoost();
                    break;
            }
        });
    },

    /**
     * Start a new game
     */
    start(options = {}) {
        this.active = true;
        this.paused = false;
        this.level = options.level || 1;
        this.score = 0;
        this.lives = 3;
        this.munchedCount = 0;

        // Reset player position
        this.player = { x: 3, y: 2 };

        // Configure difficulty based on level
        this.maxEnemies = Math.min(1 + Math.floor(this.level / 2), 4);
        this.enemySpeed = Math.max(800, 1500 - (this.level * 100));

        this.updateUI();
        this.startLevel();
    },

    /**
     * Start a new level
     */
    startLevel() {
        // Generate challenge
        this.challenge = this.generateChallenge();

        // Generate grid with values
        this.generateGrid();

        // Reset player to center
        this.player = { x: 3, y: 2 };
        this.munchedCount = 0;

        // Spawn enemies
        this.spawnEnemies();

        // Render everything
        this.renderGrid();
        this.renderPlayer();
        this.renderEnemies();
        this.updateUI();

        // Start enemy movement
        this.startEnemyAI();
    },

    /**
     * Generate a challenge based on level
     */
    generateChallenge() {
        // Early levels focus on basic conversions
        let availableTypes = this.challengeTypes.slice(0, 2);
        if (this.level >= 3) availableTypes.push('powers_of_two');
        if (this.level >= 4) availableTypes.push('subnet_values');
        if (this.level >= 5) availableTypes = this.challengeTypes;

        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];

        switch (type) {
            case 'decimal_to_binary':
                return this.createDecimalToBinaryChallenge();
            case 'binary_to_decimal':
                return this.createBinaryToDecimalChallenge();
            case 'powers_of_two':
                return this.createPowersOfTwoChallenge();
            case 'subnet_values':
                return this.createSubnetValuesChallenge();
            case 'bit_count':
                return this.createBitCountChallenge();
            case 'bit_position':
                return this.createBitPositionChallenge();
            default:
                return this.createDecimalToBinaryChallenge();
        }
    },

    /**
     * Create decimal to binary challenge
     */
    createDecimalToBinaryChallenge() {
        const targetDecimal = this.subnetValues[Math.floor(Math.random() * this.subnetValues.length)];
        const targetBinary = targetDecimal.toString(2).padStart(8, '0');

        return {
            type: 'decimal_to_binary',
            prompt: `Binary for ${targetDecimal}`,
            targetValue: targetBinary,
            isCorrect: (value) => value === targetBinary,
            generateCorrect: () => targetBinary,
            generateWrong: () => {
                // Generate wrong binary values
                const wrong = Math.floor(Math.random() * 256);
                return wrong.toString(2).padStart(8, '0');
            },
            displayType: 'binary'
        };
    },

    /**
     * Create binary to decimal challenge
     */
    createBinaryToDecimalChallenge() {
        const targetDecimal = this.subnetValues[Math.floor(Math.random() * this.subnetValues.length)];
        const targetBinary = targetDecimal.toString(2).padStart(8, '0');

        return {
            type: 'binary_to_decimal',
            prompt: `Decimal for ${targetBinary}`,
            targetValue: targetDecimal,
            isCorrect: (value) => parseInt(value) === targetDecimal,
            generateCorrect: () => targetDecimal.toString(),
            generateWrong: () => Math.floor(Math.random() * 256).toString(),
            displayType: 'decimal'
        };
    },

    /**
     * Create powers of two challenge
     */
    createPowersOfTwoChallenge() {
        return {
            type: 'powers_of_two',
            prompt: 'Powers of 2 (1-256)',
            targetValue: null,
            isCorrect: (value) => {
                const num = parseInt(value);
                return this.powersOfTwo.includes(num);
            },
            generateCorrect: () => {
                return this.powersOfTwo[Math.floor(Math.random() * this.powersOfTwo.length)].toString();
            },
            generateWrong: () => {
                let val;
                do {
                    val = Math.floor(Math.random() * 256) + 1;
                } while (this.powersOfTwo.includes(val));
                return val.toString();
            },
            displayType: 'decimal',
            multiTarget: true,
            correctCount: 5
        };
    },

    /**
     * Create subnet values challenge
     */
    createSubnetValuesChallenge() {
        return {
            type: 'subnet_values',
            prompt: 'Subnet mask octets',
            targetValue: null,
            isCorrect: (value) => {
                const num = parseInt(value);
                return this.subnetValues.includes(num);
            },
            generateCorrect: () => {
                return this.subnetValues[Math.floor(Math.random() * this.subnetValues.length)].toString();
            },
            generateWrong: () => {
                let val;
                do {
                    val = Math.floor(Math.random() * 256);
                } while (this.subnetValues.includes(val));
                return val.toString();
            },
            displayType: 'decimal',
            multiTarget: true,
            correctCount: 5
        };
    },

    /**
     * Create bit count challenge
     */
    createBitCountChallenge() {
        const targetBitCount = Math.floor(Math.random() * 5) + 2; // 2-6 bits

        const countBits = (n) => {
            let count = 0;
            while (n) {
                count += n & 1;
                n >>= 1;
            }
            return count;
        };

        return {
            type: 'bit_count',
            prompt: `Values with exactly ${targetBitCount} bits set`,
            targetValue: targetBitCount,
            isCorrect: (value) => countBits(parseInt(value)) === targetBitCount,
            generateCorrect: () => {
                // Generate a number with exactly targetBitCount bits
                let val = 0;
                const positions = [];
                while (positions.length < targetBitCount) {
                    const pos = Math.floor(Math.random() * 8);
                    if (!positions.includes(pos)) {
                        positions.push(pos);
                        val |= (1 << pos);
                    }
                }
                return val.toString();
            },
            generateWrong: () => {
                let val;
                do {
                    val = Math.floor(Math.random() * 256);
                } while (countBits(val) === targetBitCount);
                return val.toString();
            },
            displayType: 'decimal',
            multiTarget: true,
            correctCount: 4
        };
    },

    /**
     * Create bit position challenge
     */
    createBitPositionChallenge() {
        const bitPosition = Math.floor(Math.random() * 8); // 0-7
        const bitName = bitPosition === 7 ? 'high bit (128)' : `bit ${bitPosition}`;

        return {
            type: 'bit_position',
            prompt: `Values with ${bitName} set`,
            targetValue: bitPosition,
            isCorrect: (value) => (parseInt(value) & (1 << bitPosition)) !== 0,
            generateCorrect: () => {
                // Generate number with that bit set
                let val = (1 << bitPosition);
                val |= Math.floor(Math.random() * 256);
                val |= (1 << bitPosition); // Ensure bit is set
                return (val & 255).toString();
            },
            generateWrong: () => {
                // Generate number without that bit
                let val = Math.floor(Math.random() * 256);
                val &= ~(1 << bitPosition); // Clear the bit
                return val.toString();
            },
            displayType: 'decimal',
            multiTarget: true,
            correctCount: 5
        };
    },

    /**
     * Generate the game grid with values
     */
    generateGrid() {
        this.cells = [];
        this.correctCells = [];

        const totalCells = this.gridWidth * this.gridHeight;
        const correctCount = this.challenge.multiTarget
            ? this.challenge.correctCount
            : Math.floor(Math.random() * 3) + 3; // 3-5 correct answers

        this.targetCount = correctCount;

        // Generate correct cell positions
        const correctPositions = new Set();
        while (correctPositions.size < correctCount) {
            const pos = Math.floor(Math.random() * totalCells);
            correctPositions.add(pos);
        }

        // Generate all cells
        for (let i = 0; i < totalCells; i++) {
            const isCorrect = correctPositions.has(i);
            let value;

            if (isCorrect) {
                value = this.challenge.generateCorrect();
                this.correctCells.push(i);
            } else {
                // Generate wrong value, ensure it's actually wrong
                do {
                    value = this.challenge.generateWrong();
                } while (this.challenge.isCorrect(value));
            }

            this.cells.push({
                value: value,
                isCorrect: isCorrect,
                munched: false,
                displayType: this.challenge.displayType
            });
        }
    },

    /**
     * Render the grid
     */
    renderGrid() {
        if (!this.elements.grid) return;

        this.elements.grid.innerHTML = '';

        this.cells.forEach((cell, index) => {
            const cellEl = document.createElement('div');
            cellEl.className = 'bm-cell';

            if (cell.displayType === 'binary') {
                cellEl.classList.add('binary');
            }

            if (cell.munched) {
                cellEl.classList.add('munched');
                cellEl.textContent = '';
            } else {
                cellEl.textContent = cell.value;
            }

            cellEl.dataset.index = index;
            this.elements.grid.appendChild(cellEl);
        });
    },

    /**
     * Render player position
     */
    renderPlayer() {
        if (!this.elements.player || !this.elements.grid) return;

        const gridRect = this.elements.grid.getBoundingClientRect();
        const cellWidth = gridRect.width / this.gridWidth;
        const cellHeight = gridRect.height / this.gridHeight;

        const x = this.player.x * cellWidth + cellWidth / 2 - 25;
        const y = this.player.y * cellHeight + cellHeight / 2 - 25;

        this.elements.player.style.left = x + 'px';
        this.elements.player.style.top = y + 'px';

        if (this.boosting) {
            this.elements.player.classList.add('boosting');
        } else {
            this.elements.player.classList.remove('boosting');
        }
    },

    /**
     * Move player
     */
    movePlayer(dx, dy) {
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;

        // Bounds check
        if (newX < 0 || newX >= this.gridWidth) return;
        if (newY < 0 || newY >= this.gridHeight) return;

        this.player.x = newX;
        this.player.y = newY;

        this.renderPlayer();
        this.checkMunch();
        this.checkEnemyCollision();
    },

    /**
     * Check if player can munch current cell
     */
    checkMunch() {
        const cellIndex = this.player.y * this.gridWidth + this.player.x;
        const cell = this.cells[cellIndex];

        if (cell.munched) return;

        if (this.challenge.isCorrect(cell.value)) {
            // Correct munch!
            cell.munched = true;
            this.munchedCount++;
            this.score += 100 * this.level;

            if (typeof Sounds !== 'undefined') {
                Sounds.play('correct');
            }

            this.renderGrid();
            this.updateUI();

            // Check if level complete
            if (this.munchedCount >= this.targetCount) {
                this.levelComplete();
            }
        } else {
            // Wrong munch!
            this.loseLife('Wrong value!');
        }
    },

    /**
     * Activate speed boost
     */
    activateBoost() {
        if (this.boostCooldown) return;

        this.boosting = true;
        this.boostCooldown = true;

        this.renderPlayer();

        // Boost lasts 2 seconds
        setTimeout(() => {
            this.boosting = false;
            this.renderPlayer();
        }, 2000);

        // Cooldown is 5 seconds
        setTimeout(() => {
            this.boostCooldown = false;
        }, 5000);
    },

    /**
     * Spawn enemies
     */
    spawnEnemies() {
        this.enemies = [];

        for (let i = 0; i < this.maxEnemies; i++) {
            // Spawn in corners away from player
            const corners = [
                { x: 0, y: 0 },
                { x: this.gridWidth - 1, y: 0 },
                { x: 0, y: this.gridHeight - 1 },
                { x: this.gridWidth - 1, y: this.gridHeight - 1 }
            ];

            const corner = corners[i % corners.length];

            this.enemies.push({
                x: corner.x,
                y: corner.y,
                hunting: false,
                sprite: ['👾', '🐛', '💀', '👻'][i % 4]
            });
        }
    },

    /**
     * Render enemies
     */
    renderEnemies() {
        if (!this.elements.enemies || !this.elements.grid) return;

        const gridRect = this.elements.grid.getBoundingClientRect();
        const cellWidth = gridRect.width / this.gridWidth;
        const cellHeight = gridRect.height / this.gridHeight;

        this.elements.enemies.innerHTML = '';

        this.enemies.forEach(enemy => {
            const enemyEl = document.createElement('div');
            enemyEl.className = 'bm-enemy' + (enemy.hunting ? ' hunting' : '');

            const x = enemy.x * cellWidth + cellWidth / 2 - 25;
            const y = enemy.y * cellHeight + cellHeight / 2 - 25;

            enemyEl.style.left = x + 'px';
            enemyEl.style.top = y + 'px';

            enemyEl.innerHTML = `<span class="bm-enemy-sprite">${enemy.sprite}</span>`;
            this.elements.enemies.appendChild(enemyEl);
        });
    },

    /**
     * Start enemy AI movement
     */
    startEnemyAI() {
        if (this.enemyTimer) {
            clearInterval(this.enemyTimer);
        }

        this.enemyTimer = setInterval(() => {
            if (!this.active || this.paused) return;
            this.moveEnemies();
        }, this.enemySpeed);
    },

    /**
     * Move all enemies
     */
    moveEnemies() {
        this.enemies.forEach(enemy => {
            // 50% chance to hunt player, otherwise random
            enemy.hunting = Math.random() < 0.5;

            if (enemy.hunting && !this.boosting) {
                // Move toward player
                const dx = Math.sign(this.player.x - enemy.x);
                const dy = Math.sign(this.player.y - enemy.y);

                // Randomly choose to move horizontally or vertically
                if (Math.random() < 0.5 && dx !== 0) {
                    enemy.x += dx;
                } else if (dy !== 0) {
                    enemy.y += dy;
                } else if (dx !== 0) {
                    enemy.x += dx;
                }
            } else {
                // Random movement
                const moves = [
                    { dx: 0, dy: -1 },
                    { dx: 0, dy: 1 },
                    { dx: -1, dy: 0 },
                    { dx: 1, dy: 0 }
                ];
                const move = moves[Math.floor(Math.random() * moves.length)];

                const newX = enemy.x + move.dx;
                const newY = enemy.y + move.dy;

                if (newX >= 0 && newX < this.gridWidth) enemy.x = newX;
                if (newY >= 0 && newY < this.gridHeight) enemy.y = newY;
            }
        });

        this.renderEnemies();
        this.checkEnemyCollision();
    },

    /**
     * Check collision with enemies
     */
    checkEnemyCollision() {
        if (this.boosting) return; // Invincible while boosting

        for (const enemy of this.enemies) {
            if (enemy.x === this.player.x && enemy.y === this.player.y) {
                this.loseLife('Caught by Glitch!');
                return;
            }
        }
    },

    /**
     * Lose a life
     */
    loseLife(reason) {
        this.lives--;

        if (typeof Sounds !== 'undefined') {
            Sounds.play('wrong');
        }

        this.updateUI();

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset player position
            this.player = { x: 3, y: 2 };
            this.renderPlayer();

            // Brief pause
            this.paused = true;
            setTimeout(() => {
                this.paused = false;
            }, 1000);
        }
    },

    /**
     * Level complete
     */
    levelComplete() {
        this.paused = true;

        if (this.enemyTimer) {
            clearInterval(this.enemyTimer);
        }

        // Bonus points for remaining time/lives
        const bonus = this.lives * 200;
        this.score += bonus;

        if (typeof Sounds !== 'undefined') {
            Sounds.play('win');
        }

        // Show level complete message
        this.showLevelComplete(bonus);
    },

    /**
     * Show level complete overlay
     */
    showLevelComplete(bonus) {
        const overlay = document.createElement('div');
        overlay.className = 'bm-level-complete';
        overlay.innerHTML = `
            <div class="bm-level-title">LEVEL ${this.level} COMPLETE!</div>
            <div class="bm-level-stats">
                <div>Score: <span>${this.score}</span></div>
                <div>Bonus: <span>+${bonus}</span></div>
            </div>
            <button class="menu-btn" id="btn-bm-next">NEXT LEVEL</button>
        `;

        this.elements.screen.querySelector('.bm-game-container').appendChild(overlay);

        document.getElementById('btn-bm-next').addEventListener('click', () => {
            overlay.remove();
            this.level++;
            this.maxEnemies = Math.min(1 + Math.floor(this.level / 2), 4);
            this.enemySpeed = Math.max(800, 1500 - (this.level * 100));
            this.startLevel();
        });
    },

    /**
     * Game over
     */
    gameOver() {
        this.active = false;

        if (this.enemyTimer) {
            clearInterval(this.enemyTimer);
        }

        if (typeof Sounds !== 'undefined') {
            Sounds.play('gameOver');
        }

        // Track achievements
        if (typeof Achievements !== 'undefined') {
            Achievements.unlock('binary_first');
            if (this.level >= 5) {
                Achievements.unlock('binary_master');
            }
        }

        if (this.onGameOver) {
            this.onGameOver({
                score: this.score,
                level: this.level
            });
        }
    },

    /**
     * Update UI elements
     */
    updateUI() {
        if (this.elements.score) {
            this.elements.score.textContent = this.score;
        }
        if (this.elements.lives) {
            this.elements.lives.textContent = '♥'.repeat(this.lives) + '♡'.repeat(3 - this.lives);
        }
        if (this.elements.level) {
            this.elements.level.textContent = this.level;
        }
        if (this.elements.challengeText) {
            this.elements.challengeText.textContent = this.challenge?.prompt || '';
        }
        if (this.elements.munchedCount) {
            this.elements.munchedCount.textContent = this.munchedCount;
        }
        if (this.elements.targetCount) {
            this.elements.targetCount.textContent = this.targetCount;
        }
    },

    /**
     * Stop the game
     */
    stop() {
        this.active = false;
        this.paused = false;

        if (this.enemyTimer) {
            clearInterval(this.enemyTimer);
            this.enemyTimer = null;
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BinaryMunchers;
}
