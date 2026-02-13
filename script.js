/**
 * @fileoverview Focus Timer — A Pomodoro-style productivity timer application.
 * Built with vanilla ES6 JavaScript using a class-based architecture.
 * Uses requestAnimationFrame for drift-free timing accuracy.
 *
 * @author elitepunith
 * @version 2.0.0
 * @license MIT
 */

'use strict';

/**
 * Main application class for the Focus Timer.
 * Manages timer state, user configuration, DOM updates, SVG progress ring,
 * and keyboard shortcuts using an event-driven architecture.
 */
class FocusTimer {

    /**
     * Default configuration values for the timer.
     * @static
     * @readonly
     * @type {Object}
     */
    static DEFAULTS = Object.freeze({
        pomodoro: 25,
        shortBreak: 5,
        longBreak: 15,
        sound: 'digital',
        notifications: false
    });

    /**
     * Validation constraints for user-configurable input fields.
     * @static
     * @readonly
     * @type {Object}
     */
    static LIMITS = Object.freeze({
        pomodoro:    { min: 1, max: 120 },
        shortBreak:  { min: 1, max: 60 },
        longBreak:   { min: 1, max: 60 }
    });

    /**
     * localStorage key used to persist user configuration.
     * @static
     * @readonly
     * @type {string}
     */
    static STORAGE_KEY = 'focusTimerConfig';

    /**
     * Creates a new FocusTimer instance and initializes internal state.
     * Does NOT touch the DOM — call {@link FocusTimer#init} after DOMContentLoaded.
     */
    constructor() {
        /** @type {{ pomodoro: number, shortBreak: number, longBreak: number, sound: string, notifications: boolean }} */
        this.config = { ...FocusTimer.DEFAULTS };

        /** @type {{ timeLeft: number, totalTime: number, isRunning: boolean, mode: string, animFrameId: number|null, lastTick: number|null }} */
        this.state = {
            timeLeft: this.config.pomodoro * 60,
            totalTime: this.config.pomodoro * 60,
            isRunning: false,
            mode: 'pomodoro',
            animFrameId: null,
            lastTick: null
        };

        /** @type {Object<string, HTMLElement>} Cached DOM element references */
        this.dom = {};

        /** @type {number} Circumference of the SVG progress ring in px */
        this.circumference = 0;
    }

    // ─── LIFECYCLE ──────────────────────────────────────────────────────

    /**
     * Bootstraps the application: caches DOM nodes, loads persisted config,
     * binds all event listeners, and renders the initial state.
     * Must be called after the DOM is fully loaded.
     * @returns {void}
     */
    init() {
        this._cacheDOM();
        this._loadConfig();
        this._bindEvents();
        this.reset();
    }

    // ─── PRIVATE — DOM & EVENTS ─────────────────────────────────────────

    /**
     * Queries and caches all required DOM elements for fast repeated access.
     * Also calculates the SVG progress ring circumference.
     * @private
     * @returns {void}
     */
    _cacheDOM() {
        this.dom = {
            time:           document.getElementById('time'),
            status:         document.getElementById('status-label'),
            startBtn:       document.getElementById('main-btn'),
            resetBtn:       document.getElementById('reset-btn'),
            audio:          document.getElementById('audio-player'),
            modal:          document.getElementById('settings-modal'),
            progressCircle: document.getElementById('progress-circle'),
            timerWrapper:   document.querySelector('.timer-wrapper'),
            pills:          document.querySelectorAll('.pill'),
            inputs: {
                pomodoro: document.getElementById('setting-focus'),
                short:    document.getElementById('setting-short'),
                long:     document.getElementById('setting-long'),
                sound:    document.getElementById('setting-sound'),
                notif:    document.getElementById('setting-notif')
            }
        };

        // Pre-calculate SVG ring circumference: C = 2πr
        const radius = this.dom.progressCircle.r.baseVal.value;
        this.circumference = 2 * Math.PI * radius;
        this.dom.progressCircle.style.strokeDasharray = `${this.circumference}`;
    }

    /**
     * Binds click, keyboard, and modal event listeners.
     * Uses arrow functions to preserve `this` context.
     * @private
     * @returns {void}
     */
    _bindEvents() {
        // Primary controls
        this.dom.startBtn.addEventListener('click', () => this.toggle());
        this.dom.resetBtn.addEventListener('click', () => this.reset());

        // Mode pills
        this.dom.pills.forEach(btn => {
            btn.addEventListener('click', (e) => this.setMode(e.target.dataset.mode));
        });

        // Settings modal — open
        document.getElementById('settings-trigger').addEventListener('click', () => {
            this.dom.modal.classList.remove('hidden');
        });

        // Settings modal — close via X button
        this.dom.modal.querySelector('.close-btn').addEventListener('click', () => {
            this.dom.modal.classList.add('hidden');
        });

        // Settings modal — close via backdrop click
        this.dom.modal.addEventListener('click', (e) => {
            if (e.target === this.dom.modal) {
                this.dom.modal.classList.add('hidden');
            }
        });

        // Settings modal — save & apply
        document.getElementById('save-settings').addEventListener('click', () => {
            this._saveConfig();
            this.dom.modal.classList.add('hidden');
            this.reset();
        });

        // Global keyboard shortcuts (disabled when modal is open)
        document.addEventListener('keydown', (e) => this._handleKeyboard(e));
    }

    /**
     * Handles global keyboard shortcuts for controlling the timer.
     *
     * | Key     | Action            |
     * |---------|-------------------|
     * | Space   | Start / Pause     |
     * | R       | Reset             |
     * | 1       | Focus mode        |
     * | 2       | Short break mode  |
     * | 3       | Long break mode   |
     * | Escape  | Close settings    |
     *
     * @private
     * @param {KeyboardEvent} e - The keyboard event
     * @returns {void}
     */
    _handleKeyboard(e) {
        // Close modal on Escape regardless of other state
        if (e.code === 'Escape' && !this.dom.modal.classList.contains('hidden')) {
            this.dom.modal.classList.add('hidden');
            return;
        }

        // Ignore shortcuts if modal is open or user is typing in an input
        const isModalOpen = !this.dom.modal.classList.contains('hidden');
        const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
        if (isModalOpen || isTyping) return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.toggle();
                break;
            case 'KeyR':
                this.reset();
                break;
            case 'Digit1':
                this.setMode('pomodoro');
                break;
            case 'Digit2':
                this.setMode('shortBreak');
                break;
            case 'Digit3':
                this.setMode('longBreak');
                break;
        }
    }

    // ─── CONFIGURATION ──────────────────────────────────────────────────

    /**
     * Loads persisted configuration from localStorage.
     * Falls back to {@link FocusTimer.DEFAULTS} on parse failure.
     * Populates the settings form inputs with current values.
     * @private
     * @returns {void}
     */
    _loadConfig() {
        const raw = localStorage.getItem(FocusTimer.STORAGE_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                this.config = { ...FocusTimer.DEFAULTS, ...parsed };
            } catch (err) {
                console.warn('[FocusTimer] Corrupt config in localStorage, using defaults.', err);
                this.config = { ...FocusTimer.DEFAULTS };
            }
        }

        // Sync form inputs with loaded config
        this.dom.inputs.pomodoro.value = this.config.pomodoro;
        this.dom.inputs.short.value    = this.config.shortBreak;
        this.dom.inputs.long.value     = this.config.longBreak;
        this.dom.inputs.sound.value    = this.config.sound;
        this.dom.inputs.notif.checked  = this.config.notifications;
    }

    /**
     * Validates user input, clamps values within allowed ranges, and
     * persists the configuration to localStorage.
     * Requests notification permission if notifications are enabled.
     * @private
     * @returns {void}
     */
    _saveConfig() {
        this.config.pomodoro   = this._clamp(this.dom.inputs.pomodoro.value, FocusTimer.LIMITS.pomodoro, FocusTimer.DEFAULTS.pomodoro);
        this.config.shortBreak = this._clamp(this.dom.inputs.short.value,    FocusTimer.LIMITS.shortBreak, FocusTimer.DEFAULTS.shortBreak);
        this.config.longBreak  = this._clamp(this.dom.inputs.long.value,     FocusTimer.LIMITS.longBreak, FocusTimer.DEFAULTS.longBreak);
        this.config.sound         = this.dom.inputs.sound.value;
        this.config.notifications = this.dom.inputs.notif.checked;

        // Write clamped values back to inputs so the user sees the correction
        this.dom.inputs.pomodoro.value = this.config.pomodoro;
        this.dom.inputs.short.value    = this.config.shortBreak;
        this.dom.inputs.long.value     = this.config.longBreak;

        localStorage.setItem(FocusTimer.STORAGE_KEY, JSON.stringify(this.config));

        if (this.config.notifications && 'Notification' in window) {
            Notification.requestPermission().catch((err) => {
                console.warn('[FocusTimer] Notification permission denied.', err);
            });
        }
    }

    /**
     * Parses a string value to an integer and clamps it within the given range.
     * @private
     * @param {string|number} value    - Raw input value
     * @param {{ min: number, max: number }} limits - Allowed range
     * @param {number} fallback        - Default if parsing fails
     * @returns {number} The clamped integer value
     */
    _clamp(value, limits, fallback) {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < limits.min) return fallback;
        if (num > limits.max) return limits.max;
        return num;
    }

    // ─── MODE SWITCHING ─────────────────────────────────────────────────

    /**
     * Switches the active timer mode (pomodoro / shortBreak / longBreak).
     * Triggers a CSS animation on the timer wrapper for visual feedback.
     * Updates ARIA attributes on mode pill buttons.
     * @param {string} mode - The mode key to switch to
     * @returns {void}
     */
    setMode(mode) {
        if (this.state.mode === mode) return;

        this.state.mode = mode;

        // Update pill active states + ARIA
        this.dom.pills.forEach(pill => {
            const isActive = pill.dataset.mode === mode;
            pill.classList.toggle('active', isActive);
            pill.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        // Trigger mode-switch CSS animation
        this.dom.timerWrapper.classList.remove('mode-switching');
        void this.dom.timerWrapper.offsetWidth; // force reflow to restart animation
        this.dom.timerWrapper.classList.add('mode-switching');

        setTimeout(() => {
            this.dom.timerWrapper.classList.remove('mode-switching');
        }, 500);

        this.reset();
    }

    // ─── TIMER CONTROLS ─────────────────────────────────────────────────

    /**
     * Toggles the timer between running and paused states.
     * @returns {void}
     */
    toggle() {
        this.state.isRunning ? this.pause() : this.start();
    }

    /**
     * Starts the timer using `requestAnimationFrame` for drift-free accuracy.
     *
     * Instead of `setInterval` (which can drift ±15ms per tick and accumulate
     * seconds of error over a 25-minute session), this implementation tracks
     * the real elapsed time via `performance.now()` and only decrements the
     * counter when a full 1000ms wall-clock second has passed.
     *
     * @returns {void}
     */
    start() {
        if (this.state.animFrameId) return;

        this.state.isRunning = true;
        this.state.lastTick = performance.now();
        this.dom.startBtn.textContent = 'PAUSE';
        this.dom.startBtn.style.opacity = '0.85';
        this.dom.status.textContent = 'RUNNING';

        // Remove completed animation if restarting after completion
        this.dom.timerWrapper.classList.remove('completed');

        /**
         * The rAF tick function. Compares wall-clock elapsed time against
         * 1000ms intervals so the displayed countdown stays accurate even
         * if individual frames are delayed (tab throttling, GC pauses, etc.).
         * @param {DOMHighResTimeStamp} now - Current timestamp from rAF
         */
        const tick = (now) => {
            const elapsed = now - this.state.lastTick;

            if (elapsed >= 1000) {
                // How many full seconds passed (handles cases where tab was throttled)
                const secondsPassed = Math.floor(elapsed / 1000);
                this.state.timeLeft = Math.max(0, this.state.timeLeft - secondsPassed);
                this.state.lastTick += secondsPassed * 1000;

                this._render();
                this._updateProgressRing();

                if (this.state.timeLeft <= 0) {
                    this._complete();
                    return; // stop the loop
                }
            }

            this.state.animFrameId = requestAnimationFrame(tick);
        };

        this.state.animFrameId = requestAnimationFrame(tick);
    }

    /**
     * Pauses the timer and cancels the animation frame loop.
     * Updates the button label and status indicator.
     * @returns {void}
     */
    pause() {
        this.state.isRunning = false;

        if (this.state.animFrameId) {
            cancelAnimationFrame(this.state.animFrameId);
            this.state.animFrameId = null;
        }

        this.state.lastTick = null;
        this.dom.startBtn.textContent = 'RESUME';
        this.dom.startBtn.style.opacity = '1';

        if (this.state.timeLeft > 0 && this.state.timeLeft < this.state.totalTime) {
            this.dom.status.textContent = 'PAUSED';
        }
    }

    /**
     * Resets the timer to the full duration of the current mode.
     * Clears any running animation frame, resets the progress ring,
     * and restores the UI to its idle state.
     * @returns {void}
     */
    reset() {
        this.pause();
        this.dom.startBtn.textContent = 'START';
        this.state.totalTime = this.config[this.state.mode] * 60;
        this.state.timeLeft  = this.state.totalTime;
        this.dom.status.textContent = 'READY';
        this.dom.timerWrapper.classList.remove('completed');
        this._render();
        this._updateProgressRing();
    }

    // ─── PRIVATE — RENDERING ────────────────────────────────────────────

    /**
     * Formats the remaining seconds as `M:SS` and updates the DOM display
     * and the browser tab title.
     * @private
     * @returns {void}
     */
    _render() {
        const minutes = Math.floor(this.state.timeLeft / 60);
        const seconds = this.state.timeLeft % 60;
        const formatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        this.dom.time.textContent = formatted;
        document.title = `${formatted} — Focus Timer`;
    }

    /**
     * Updates the SVG circular progress ring stroke offset to reflect
     * the percentage of time remaining.
     *
     * The ring uses `stroke-dashoffset` to reveal/hide the stroke:
     * - offset = 0           → full ring (100 %)
     * - offset = circumference → empty ring (0 %)
     *
     * @private
     * @returns {void}
     */
    _updateProgressRing() {
        const progress = this.state.timeLeft / this.state.totalTime;
        const offset = this.circumference * (1 - progress);
        this.dom.progressCircle.style.strokeDashoffset = `${offset}`;
    }

    // ─── PRIVATE — COMPLETION ───────────────────────────────────────────

    /**
     * Handles timer completion: pauses the loop, plays an alarm sound,
     * triggers the CSS completion animation, and sends a browser notification
     * (if permission was granted).
     * @private
     * @returns {void}
     */
    _complete() {
        this.pause();
        this.dom.status.textContent = 'COMPLETED';
        this.dom.startBtn.textContent = 'START';

        // CSS completion animation
        this.dom.timerWrapper.classList.add('completed');

        this._playSound();

        if (this.config.notifications && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Focus Timer', {
                body: 'Session complete! Great work. 🎉',
                icon: 'favicon.ico'
            });
        }
    }

    /**
     * Loads and plays the selected alarm sound file.
     * Logs a warning to the console if playback fails (e.g. file missing,
     * autoplay policy blocked).
     * @private
     * @returns {void}
     */
    _playSound() {
        this.dom.audio.src = `assets/alarm-${this.config.sound}.mp3`;
        this.dom.audio.play().catch((err) => {
            console.warn('[FocusTimer] Could not play alarm sound:', err.message);
        });
    }
}

// ─── BOOTSTRAP ──────────────────────────────────────────────────────────

/**
 * Wait for the DOM to be fully parsed, then create and initialize
 * the FocusTimer application instance.
 */
document.addEventListener('DOMContentLoaded', () => {
    const app = new FocusTimer();
    app.init();
});