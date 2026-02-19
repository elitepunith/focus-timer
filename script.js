'use strict';

class FocusTimer {

    static DEFAULTS = Object.freeze({
        pomodoro: 25,
        shortBreak: 5,
        longBreak: 15,
        sound: 'digital',
        theme: 'cyberpunk',
        notifications: false,
        autoBreak: false
    });

    static LIMITS = Object.freeze({
        pomodoro:   { min: 1, max: 120 },
        shortBreak: { min: 1, max: 60 },
        longBreak:  { min: 1, max: 60 }
    });

    static STORAGE_KEY = 'focusTimerConfig';

    constructor() {
        this.config = { ...FocusTimer.DEFAULTS };

        this.state = {
            timeLeft: this.config.pomodoro * 60,
            totalTime: this.config.pomodoro * 60,
            isRunning: false,
            mode: 'pomodoro',
            animFrameId: null,
            lastTick: null,
            sessionsCompleted: 0,
            taskLabel: ''
        };

        this.dom = {};
        this.circumference = 0;
        this._faviconCanvas = null;
        this._faviconCtx = null;
    }

    init() {
        this._cacheDOM();
        this._loadConfig();
        this._bindEvents();
        this._applyTheme(this.config.theme);
        this._setupFaviconCanvas();
        this._renderSessionDots();
        this.reset();
    }

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
            taskInput:      document.getElementById('task-label'),
            sessionTracker: document.getElementById('session-tracker'),
            themeToggle:    document.getElementById('theme-toggle'),
            shortcutHint:   document.getElementById('shortcut-hint'),
            inputs: {
                pomodoro:  document.getElementById('setting-focus'),
                short:     document.getElementById('setting-short'),
                long:      document.getElementById('setting-long'),
                sound:     document.getElementById('setting-sound'),
                theme:     document.getElementById('setting-theme'),
                notif:     document.getElementById('setting-notif'),
                autoBreak: document.getElementById('setting-auto-break')
            }
        };

        const radius = this.dom.progressCircle.r.baseVal.value;
        this.circumference = 2 * Math.PI * radius;
        this.dom.progressCircle.style.strokeDasharray = `${this.circumference}`;
    }

    _bindEvents() {
        this.dom.startBtn.addEventListener('click', () => this.toggle());
        this.dom.resetBtn.addEventListener('click', () => this.reset());

        this.dom.pills.forEach(btn => {
            btn.addEventListener('click', (e) => this.setMode(e.target.dataset.mode));
        });

        this.dom.themeToggle.addEventListener('click', () => this._cycleTheme());

        document.getElementById('settings-trigger').addEventListener('click', () => {
            this.dom.modal.classList.remove('hidden');
        });

        this.dom.modal.querySelector('.close-btn').addEventListener('click', () => {
            this.dom.modal.classList.add('hidden');
        });

        this.dom.modal.addEventListener('click', (e) => {
            if (e.target === this.dom.modal) {
                this.dom.modal.classList.add('hidden');
            }
        });

        document.getElementById('save-settings').addEventListener('click', () => {
            this._saveConfig();
            this.dom.modal.classList.add('hidden');
            this.reset();
        });

        this.dom.taskInput.addEventListener('input', () => {
            this.state.taskLabel = this.dom.taskInput.value.trim();
        });

        // let the user press enter or escape to leave the task input
        this.dom.taskInput.addEventListener('keydown', (e) => {
            if (e.code === 'Enter' || e.code === 'Escape') {
                e.preventDefault();
                this.dom.taskInput.blur();
            }
        });

        document.addEventListener('keydown', (e) => this._handleKeyboard(e));
    }

    _handleKeyboard(e) {
        // escape always closes the settings panel regardless of context
        if (e.code === 'Escape' && !this.dom.modal.classList.contains('hidden')) {
            this.dom.modal.classList.add('hidden');
            return;
        }

        // don't hijack keys while the settings panel is open
        const modalOpen = !this.dom.modal.classList.contains('hidden');
        if (modalOpen) return;

        // if the user is inside the task input let them type normally
        if (document.activeElement === this.dom.taskInput) return;

        // block shortcuts while interacting with any other input or select
        const tag = document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

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
            case 'KeyT':
                this._cycleTheme();
                break;
            case 'KeyS':
                this.dom.modal.classList.remove('hidden');
                break;
        }
    }

    _loadConfig() {
        const raw = localStorage.getItem(FocusTimer.STORAGE_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                this.config = { ...FocusTimer.DEFAULTS, ...parsed };
            } catch (_) {
                this.config = { ...FocusTimer.DEFAULTS };
            }
        }

        this.dom.inputs.pomodoro.value  = this.config.pomodoro;
        this.dom.inputs.short.value     = this.config.shortBreak;
        this.dom.inputs.long.value      = this.config.longBreak;
        this.dom.inputs.sound.value     = this.config.sound;
        this.dom.inputs.theme.value     = this.config.theme;
        this.dom.inputs.notif.checked   = this.config.notifications;
        this.dom.inputs.autoBreak.checked = this.config.autoBreak;

        const sessionData = localStorage.getItem('focusTimerSessions');
        if (sessionData) {
            try {
                const s = JSON.parse(sessionData);
                this.state.sessionsCompleted = s.count || 0;
            } catch (_) {}
        }
    }

    _saveConfig() {
        this.config.pomodoro   = this._clamp(this.dom.inputs.pomodoro.value, FocusTimer.LIMITS.pomodoro, FocusTimer.DEFAULTS.pomodoro);
        this.config.shortBreak = this._clamp(this.dom.inputs.short.value,    FocusTimer.LIMITS.shortBreak, FocusTimer.DEFAULTS.shortBreak);
        this.config.longBreak  = this._clamp(this.dom.inputs.long.value,     FocusTimer.LIMITS.longBreak, FocusTimer.DEFAULTS.longBreak);
        this.config.sound      = this.dom.inputs.sound.value;
        this.config.theme      = this.dom.inputs.theme.value;
        this.config.notifications = this.dom.inputs.notif.checked;
        this.config.autoBreak  = this.dom.inputs.autoBreak.checked;

        this.dom.inputs.pomodoro.value = this.config.pomodoro;
        this.dom.inputs.short.value    = this.config.shortBreak;
        this.dom.inputs.long.value     = this.config.longBreak;

        localStorage.setItem(FocusTimer.STORAGE_KEY, JSON.stringify(this.config));
        this._applyTheme(this.config.theme);

        if (this.config.notifications && 'Notification' in window) {
            Notification.requestPermission().catch(() => {});
        }
    }

    _clamp(value, limits, fallback) {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < limits.min) return fallback;
        if (num > limits.max) return limits.max;
        return num;
    }

    _applyTheme(theme) {
        if (theme === 'cyberpunk') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }

        const metaTheme = document.querySelector('meta[name="theme-color"]');
        const themeColors = {
            'cyberpunk':     '#050505',
            'neon-blue':     '#050505',
            'retro-orange':  '#050505',
            'minimal-light': '#f5f5f5',
            'purple-haze':   '#050505'
        };
        if (metaTheme) metaTheme.content = themeColors[theme] || '#050505';
    }

    _cycleTheme() {
        const themes = ['cyberpunk', 'neon-blue', 'retro-orange', 'minimal-light', 'purple-haze'];
        const currentIdx = themes.indexOf(this.config.theme);
        const nextIdx = (currentIdx + 1) % themes.length;
        this.config.theme = themes[nextIdx];
        this.dom.inputs.theme.value = this.config.theme;
        this._applyTheme(this.config.theme);
        localStorage.setItem(FocusTimer.STORAGE_KEY, JSON.stringify(this.config));
    }

    setMode(mode) {
        if (this.state.mode === mode) return;

        this.state.mode = mode;

        this.dom.pills.forEach(pill => {
            const isActive = pill.dataset.mode === mode;
            pill.classList.toggle('active', isActive);
            pill.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        this.dom.timerWrapper.classList.remove('mode-switching');
        void this.dom.timerWrapper.offsetWidth;
        this.dom.timerWrapper.classList.add('mode-switching');

        setTimeout(() => {
            this.dom.timerWrapper.classList.remove('mode-switching');
        }, 500);

        this.reset();
    }

    toggle() {
        this.state.isRunning ? this.pause() : this.start();
    }

    start() {
        if (this.state.animFrameId) return;

        this.state.isRunning = true;
        this.state.lastTick = performance.now();
        this.dom.startBtn.textContent = 'PAUSE';
        this.dom.startBtn.style.opacity = '0.85';
        this.dom.status.textContent = 'RUNNING';

        this.dom.timerWrapper.classList.remove('completed', 'paused');
        this.dom.timerWrapper.classList.add('running');

        const tick = (now) => {
            const elapsed = now - this.state.lastTick;

            if (elapsed >= 1000) {
                const secondsPassed = Math.floor(elapsed / 1000);
                this.state.timeLeft = Math.max(0, this.state.timeLeft - secondsPassed);
                this.state.lastTick += secondsPassed * 1000;

                this._render();
                this._updateProgressRing();
                this._updateFavicon();

                if (this.state.timeLeft <= 0) {
                    this._complete();
                    return;
                }
            }

            this.state.animFrameId = requestAnimationFrame(tick);
        };

        this.state.animFrameId = requestAnimationFrame(tick);
    }

    pause() {
        this.state.isRunning = false;

        if (this.state.animFrameId) {
            cancelAnimationFrame(this.state.animFrameId);
            this.state.animFrameId = null;
        }

        this.state.lastTick = null;
        this.dom.startBtn.textContent = 'RESUME';
        this.dom.startBtn.style.opacity = '1';

        this.dom.timerWrapper.classList.remove('running');

        if (this.state.timeLeft > 0 && this.state.timeLeft < this.state.totalTime) {
            this.dom.status.textContent = 'PAUSED';
            this.dom.timerWrapper.classList.add('paused');
        }
    }

    reset() {
        this.pause();
        this.dom.startBtn.textContent = 'START';
        this.state.totalTime = this.config[this.state.mode] * 60;
        this.state.timeLeft  = this.state.totalTime;
        this.dom.status.textContent = 'READY';
        this.dom.timerWrapper.classList.remove('completed', 'paused', 'running');
        this._render();
        this._updateProgressRing();
        this._updateFavicon();
    }

    _render() {
        const minutes = Math.floor(this.state.timeLeft / 60);
        const seconds = this.state.timeLeft % 60;
        const formatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        this.dom.time.textContent = formatted;

        let title = `${formatted} — Focus Timer`;
        if (this.state.taskLabel) {
            title = `${formatted} — ${this.state.taskLabel}`;
        }
        document.title = title;
    }

    _updateProgressRing() {
        const progress = this.state.timeLeft / this.state.totalTime;
        const offset = this.circumference * (1 - progress);
        this.dom.progressCircle.style.strokeDashoffset = `${offset}`;
    }

    _renderSessionDots() {
        const tracker = this.dom.sessionTracker;
        tracker.innerHTML = '';

        for (let i = 0; i < 4; i++) {
            const dot = document.createElement('span');
            dot.className = 'dot';
            if (i < (this.state.sessionsCompleted % 4)) {
                dot.classList.add('filled');
            }
            tracker.appendChild(dot);
        }
    }

    _advanceSession() {
        this.state.sessionsCompleted++;
        localStorage.setItem('focusTimerSessions', JSON.stringify({ count: this.state.sessionsCompleted }));
        this._renderSessionDots();
    }

    _setupFaviconCanvas() {
        this._faviconCanvas = document.getElementById('favicon-canvas');
        this._faviconCtx = this._faviconCanvas.getContext('2d');
    }

    _updateFavicon() {
        const ctx = this._faviconCtx;
        const size = 32;

        if (!ctx) return;

        ctx.clearRect(0, 0, size, size);

        ctx.beginPath();
        ctx.arc(16, 16, 15, 0, 2 * Math.PI);
        ctx.fillStyle = '#111';
        ctx.fill();

        const progress = this.state.timeLeft / this.state.totalTime;
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (2 * Math.PI * progress);

        ctx.beginPath();
        ctx.arc(16, 16, 15, startAngle, endAngle);
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00ff9d';
        ctx.lineWidth = 3;
        ctx.stroke();

        const minutes = Math.floor(this.state.timeLeft / 60);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(minutes.toString(), 16, 17);

        const link = document.getElementById('dynamic-favicon');
        if (link) {
            link.href = this._faviconCanvas.toDataURL('image/png');
        }
    }

    _complete() {
        this.pause();
        this.dom.status.textContent = 'COMPLETED';
        this.dom.startBtn.textContent = 'START';

        this.dom.timerWrapper.classList.add('completed');

        this._playSound();
        this._sendNotification();

        if (this.state.mode === 'pomodoro') {
            this._advanceSession();
            this._autoStartBreak();
        } else {
            this._autoStartFocus();
        }
    }

    _autoStartBreak() {
        if (!this.config.autoBreak) return;

        const isLongBreakTime = (this.state.sessionsCompleted % 4) === 0;

        setTimeout(() => {
            if (isLongBreakTime) {
                this.setMode('longBreak');
            } else {
                this.setMode('shortBreak');
            }
            this.start();
        }, 2000);
    }

    _autoStartFocus() {
        if (!this.config.autoBreak) return;

        setTimeout(() => {
            this.setMode('pomodoro');
            this.start();
        }, 2000);
    }

    _sendNotification() {
        if (!this.config.notifications || !('Notification' in window) || Notification.permission !== 'granted') return;

        const modeLabels = {
            pomodoro:   'Focus session',
            shortBreak: 'Short break',
            longBreak:  'Long break'
        };

        let body = `${modeLabels[this.state.mode]} complete! Nice work.`;

        if (this.state.taskLabel) {
            body = `${modeLabels[this.state.mode]} complete for "${this.state.taskLabel}"`;
        }

        if (this.state.mode === 'pomodoro' && (this.state.sessionsCompleted % 4) === 0) {
            body += '\nYou earned a long break!';
        }

        new Notification('Focus Timer', { body, icon: 'favicon.ico' });
    }

    _playSound() {
        this.dom.audio.src = `assets/alarm-${this.config.sound}.mp3`;
        this.dom.audio.play().catch(() => {});
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new FocusTimer();
    app.init();
});