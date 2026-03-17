/**
 * Themes Module
 * Visual themes/skins for the game
 */
'use strict';

const Themes = {
    // Current theme
    current: 'default',

    // Theme definitions
    themes: {
        default: {
            id: 'default',
            name: 'CYBER BLUE',
            description: 'Classic neon cyber theme',
            colors: {
                primary: '#00d4ff',
                secondary: '#ff6b9d',
                success: '#00ff9d',
                warning: '#ffd400',
                danger: '#ff4444',
                background: '#0a0a1a',
                surface: '#1a1a3a',
                border: '#333366',
                textPrimary: '#ffffff',
                textSecondary: '#888888'
            },
            unlocked: true
        },
        matrix: {
            id: 'matrix',
            name: 'MATRIX GREEN',
            description: 'Classic hacker aesthetic',
            colors: {
                primary: '#00ff00',
                secondary: '#00cc00',
                success: '#00ff9d',
                warning: '#ccff00',
                danger: '#ff3300',
                background: '#000000',
                surface: '#0a1a0a',
                border: '#003300',
                textPrimary: '#00ff00',
                textSecondary: '#009900'
            },
            unlocked: true
        },
        sunset: {
            id: 'sunset',
            name: 'SUNSET ORANGE',
            description: 'Warm sunset colors',
            colors: {
                primary: '#ff6b35',
                secondary: '#f7c59f',
                success: '#2ec4b6',
                warning: '#ffbf00',
                danger: '#e71d36',
                background: '#1a0a0a',
                surface: '#2d1810',
                border: '#663322',
                textPrimary: '#ffffff',
                textSecondary: '#cc9966'
            },
            unlocked: true
        },
        purple: {
            id: 'purple',
            name: 'ROYAL PURPLE',
            description: 'Elegant purple tones',
            colors: {
                primary: '#9d4edd',
                secondary: '#e0aaff',
                success: '#57cc99',
                warning: '#ffdd00',
                danger: '#ff595e',
                background: '#10002b',
                surface: '#240046',
                border: '#5a189a',
                textPrimary: '#ffffff',
                textSecondary: '#c77dff'
            },
            unlocked: true
        },
        midnight: {
            id: 'midnight',
            name: 'MIDNIGHT BLUE',
            description: 'Deep midnight aesthetic',
            colors: {
                primary: '#4cc9f0',
                secondary: '#7209b7',
                success: '#06d6a0',
                warning: '#ffd166',
                danger: '#ef476f',
                background: '#03071e',
                surface: '#0d1b2a',
                border: '#1b263b',
                textPrimary: '#e0e1dd',
                textSecondary: '#778da9'
            },
            unlocked: true
        },
        retro: {
            id: 'retro',
            name: 'RETRO ARCADE',
            description: '80s arcade cabinet vibes',
            colors: {
                primary: '#ff00ff',
                secondary: '#00ffff',
                success: '#00ff00',
                warning: '#ffff00',
                danger: '#ff0000',
                background: '#1a0020',
                surface: '#2a0040',
                border: '#ff00ff',
                textPrimary: '#ffffff',
                textSecondary: '#ff80ff'
            },
            unlocked: false,
            unlockCondition: 'Score 5000+ in Speed Subnet'
        },
        monochrome: {
            id: 'monochrome',
            name: 'MONOCHROME',
            description: 'Classic black and white',
            colors: {
                primary: '#ffffff',
                secondary: '#cccccc',
                success: '#aaaaaa',
                warning: '#888888',
                danger: '#666666',
                background: '#000000',
                surface: '#1a1a1a',
                border: '#444444',
                textPrimary: '#ffffff',
                textSecondary: '#888888'
            },
            unlocked: false,
            unlockCondition: 'Complete 5 scenarios'
        },
        highContrast: {
            id: 'highContrast',
            name: 'HIGH CONTRAST',
            description: 'Accessibility-focused theme',
            colors: {
                primary: '#ffff00',
                secondary: '#00ffff',
                success: '#00ff00',
                warning: '#ff8800',
                danger: '#ff0000',
                background: '#000000',
                surface: '#000000',
                border: '#ffffff',
                textPrimary: '#ffffff',
                textSecondary: '#ffff00'
            },
            unlocked: true
        }
    },

    /**
     * Initialize themes
     */
    init() {
        this.load();
        this.checkUnlocks();
        this.apply(this.current);
    },

    /**
     * Get all themes
     */
    getAll() {
        return Object.values(this.themes);
    },

    /**
     * Get unlocked themes
     */
    getUnlocked() {
        return this.getAll().filter(t => t.unlocked);
    },

    /**
     * Apply a theme
     */
    apply(themeId) {
        const theme = this.themes[themeId];
        if (!theme || !theme.unlocked) return false;

        this.current = themeId;
        const root = document.documentElement;

        // Set CSS variables
        for (const [key, value] of Object.entries(theme.colors)) {
            root.style.setProperty(`--color-${this.camelToKebab(key)}`, value);
        }

        // Add theme class to body
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeId}`);

        this.save();
        return true;
    },

    /**
     * Check and unlock themes based on achievements
     */
    checkUnlocks() {
        // Retro theme - unlock with high score
        if (typeof Leaderboard !== 'undefined') {
            const speedBest = Leaderboard.getSpeedSubnetBest();
            if (speedBest && speedBest.score >= 5000) {
                this.themes.retro.unlocked = true;
            }
        }

        // Monochrome theme - unlock with scenario completions
        if (typeof Stats !== 'undefined') {
            const completed = Stats.data.scenarios.completed || 0;
            if (completed >= 5) {
                this.themes.monochrome.unlocked = true;
            }
        }

        this.save();
    },

    /**
     * Convert camelCase to kebab-case
     */
    camelToKebab(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    },

    /**
     * Save to localStorage
     */
    save() {
        const unlockedIds = this.getUnlocked().map(t => t.id);
        localStorage.setItem('subnetProTheme', JSON.stringify({
            current: this.current,
            unlocked: unlockedIds
        }));
    },

    /**
     * Load from localStorage
     */
    load() {
        try {
            const data = JSON.parse(localStorage.getItem('subnetProTheme'));
            if (data) {
                this.current = data.current || 'default';
                // Restore unlocked themes
                if (data.unlocked) {
                    data.unlocked.forEach(id => {
                        if (this.themes[id]) {
                            this.themes[id].unlocked = true;
                        }
                    });
                }
            }
        } catch (e) {
            // Using default theme
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Themes;
}
