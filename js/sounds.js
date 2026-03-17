/**
 * Sound Effects Module
 * Synthesized audio effects using Web Audio API
 */
'use strict';

const Sounds = {
    // Audio context
    ctx: null,
    masterGain: null,

    // Settings
    muted: false,
    volume: 0.5,

    // Sound definitions (frequencies and durations for synthesis)
    definitions: {
        correct: {
            type: 'success',
            notes: [523.25, 659.25, 783.99], // C5, E5, G5
            duration: 0.1,
            gap: 0.05
        },
        wrong: {
            type: 'error',
            notes: [200, 150],
            duration: 0.15,
            gap: 0.1
        },
        streak: {
            type: 'fanfare',
            notes: [523.25, 587.33, 659.25, 783.99], // C5, D5, E5, G5
            duration: 0.08,
            gap: 0.03
        },
        click: {
            type: 'click',
            notes: [800],
            duration: 0.03,
            gap: 0
        },
        select: {
            type: 'select',
            notes: [440, 550],
            duration: 0.05,
            gap: 0.02
        },
        achievement: {
            type: 'achievement',
            notes: [523.25, 659.25, 783.99, 1046.50], // C5, E5, G5, C6
            duration: 0.15,
            gap: 0.08
        },
        levelComplete: {
            type: 'fanfare',
            notes: [392, 440, 523.25, 659.25, 783.99], // G4, A4, C5, E5, G5
            duration: 0.12,
            gap: 0.06
        },
        star: {
            type: 'sparkle',
            notes: [880, 1108.73, 1318.51], // A5, C#6, E6
            duration: 0.08,
            gap: 0.04
        },
        countdown: {
            type: 'beep',
            notes: [440],
            duration: 0.1,
            gap: 0
        },
        timeWarning: {
            type: 'warning',
            notes: [350, 300],
            duration: 0.2,
            gap: 0.1
        },
        gameOver: {
            type: 'descend',
            notes: [440, 392, 349.23, 293.66], // A4, G4, F4, D4
            duration: 0.2,
            gap: 0.1
        },
        place: {
            type: 'place',
            notes: [300, 450],
            duration: 0.06,
            gap: 0.02
        },
        undo: {
            type: 'undo',
            notes: [450, 300],
            duration: 0.06,
            gap: 0.02
        },
        menuHover: {
            type: 'hover',
            notes: [600],
            duration: 0.02,
            gap: 0
        },
        menuSelect: {
            type: 'select',
            notes: [400, 600],
            duration: 0.05,
            gap: 0.03
        },
        dailyStart: {
            type: 'fanfare',
            notes: [392, 523.25, 659.25, 783.99, 1046.50],
            duration: 0.1,
            gap: 0.05
        },
        perfect: {
            type: 'perfect',
            notes: [523.25, 659.25, 783.99, 1046.50, 1318.51],
            duration: 0.1,
            gap: 0.04
        }
    },

    /**
     * Initialize the audio system
     */
    init() {
        this.load();

        // Create audio context on first user interaction
        const initAudio = () => {
            if (!this.ctx) {
                try {
                    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                    this.masterGain = this.ctx.createGain();
                    this.masterGain.connect(this.ctx.destination);
                    this.updateVolume();
                } catch (e) {
                    console.warn('Web Audio API not supported');
                }
            }
            // Remove listeners after first interaction
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
        };

        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);
    },

    /**
     * Play a sound effect
     */
    play(soundName) {
        if (this.muted || !this.ctx) return;

        const def = this.definitions[soundName];
        if (!def) return;

        // Resume context if suspended (browser autoplay policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const now = this.ctx.currentTime;
        let time = now;

        def.notes.forEach((freq, i) => {
            this.playTone(freq, time, def.duration, def.type);
            time += def.duration + def.gap;
        });
    },

    /**
     * Play a single tone
     */
    playTone(frequency, startTime, duration, type) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Set oscillator type based on sound type
        switch (type) {
            case 'success':
            case 'fanfare':
            case 'perfect':
                osc.type = 'sine';
                break;
            case 'error':
            case 'warning':
                osc.type = 'sawtooth';
                break;
            case 'click':
            case 'select':
            case 'hover':
                osc.type = 'square';
                break;
            case 'achievement':
            case 'sparkle':
                osc.type = 'triangle';
                break;
            case 'beep':
            case 'place':
            case 'undo':
                osc.type = 'sine';
                break;
            case 'descend':
                osc.type = 'sawtooth';
                break;
            default:
                osc.type = 'sine';
        }

        osc.frequency.setValueAtTime(frequency, startTime);

        // Envelope
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);
    },

    /**
     * Toggle mute
     */
    toggleMute() {
        this.muted = !this.muted;
        this.save();
        return this.muted;
    },

    /**
     * Set mute state
     */
    setMuted(muted) {
        this.muted = muted;
        this.save();
    },

    /**
     * Set volume (0-1)
     */
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        this.updateVolume();
        this.save();
    },

    /**
     * Update master volume
     */
    updateVolume() {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(
                this.muted ? 0 : this.volume,
                this.ctx.currentTime
            );
        }
    },

    /**
     * Save settings to localStorage
     */
    save() {
        localStorage.setItem('subnetProSound', JSON.stringify({
            muted: this.muted,
            volume: this.volume
        }));
    },

    /**
     * Load settings from localStorage
     */
    load() {
        try {
            const data = JSON.parse(localStorage.getItem('subnetProSound'));
            if (data) {
                this.muted = data.muted || false;
                this.volume = data.volume !== undefined ? data.volume : 0.5;
            }
        } catch (e) {
            // Using default settings
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sounds;
}
