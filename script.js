const App = {
    // Default Configuration
    config: {
        pomodoro: 25,
        shortBreak: 5,
        longBreak: 15,
        sound: 'digital',
        notifications: false
    },
    
    state: {
        timeLeft: 1500,
        isRunning: false,
        mode: 'pomodoro',
        timerId: null
    },

    dom: {},

    init() {
        this.cacheDOM();
        this.loadConfig();
        this.bindEvents();
        this.resetTimer(); // Apply initial state
    },

    cacheDOM() {
        this.dom = {
            time: document.getElementById('time'),
            status: document.getElementById('status-label'),
            startBtn: document.getElementById('main-btn'),
            audio: document.getElementById('audio-player'),
            modal: document.getElementById('settings-modal'),
            inputs: {
                pomodoro: document.getElementById('setting-focus'),
                short: document.getElementById('setting-short'),
                long: document.getElementById('setting-long'),
                sound: document.getElementById('setting-sound'),
                notif: document.getElementById('setting-notif')
            }
        };
    },

    bindEvents() {
        // Main Actions
        this.dom.startBtn.addEventListener('click', () => this.toggle());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetTimer());

        // Tabs (Pills)
        document.querySelectorAll('.pill').forEach(btn => {
            btn.addEventListener('click', (e) => this.setMode(e.target.dataset.mode));
        });

        // Settings Modal
        document.getElementById('settings-trigger').addEventListener('click', () => {
            this.dom.modal.classList.remove('hidden');
        });

        this.dom.modal.querySelector('.close-btn').addEventListener('click', () => {
            this.dom.modal.classList.add('hidden');
        });
        
        // Close modal on click outside
        this.dom.modal.addEventListener('click', (e) => {
            if(e.target === this.dom.modal) this.dom.modal.classList.add('hidden');
        });

        // Save Settings
        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveConfig();
            this.dom.modal.classList.add('hidden');
            this.resetTimer();
        });
    },

    loadConfig() {
        const saved = localStorage.getItem('orbitConfig');
        if (saved) this.config = JSON.parse(saved);

        // Populate inputs
        this.dom.inputs.pomodoro.value = this.config.pomodoro;
        this.dom.inputs.short.value = this.config.shortBreak;
        this.dom.inputs.long.value = this.config.longBreak;
        this.dom.inputs.sound.value = this.config.sound;
        this.dom.inputs.notif.checked = this.config.notifications;
    },

    saveConfig() {
        this.config.pomodoro = parseInt(this.dom.inputs.pomodoro.value) || 25;
        this.config.shortBreak = parseInt(this.dom.inputs.short.value) || 5;
        this.config.longBreak = parseInt(this.dom.inputs.long.value) || 15;
        this.config.sound = this.dom.inputs.sound.value;
        this.config.notifications = this.dom.inputs.notif.checked;
        
        localStorage.setItem('orbitConfig', JSON.stringify(this.config));
        
        if (this.config.notifications) Notification.requestPermission();
    },

    setMode(mode) {
        this.state.mode = mode;
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        this.resetTimer();
    },

    toggle() {
        if (this.state.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    },

    start() {
        if (this.state.timerId) return;
        this.state.isRunning = true;
        this.dom.startBtn.textContent = 'PAUSE';
        this.dom.startBtn.style.opacity = '0.8';

        this.state.timerId = setInterval(() => {
            this.state.timeLeft--;
            this.render();
            if (this.state.timeLeft <= 0) this.complete();
        }, 1000);
    },

    pause() {
        this.state.isRunning = false;
        clearInterval(this.state.timerId);
        this.state.timerId = null;
        this.dom.startBtn.textContent = 'RESUME';
        this.dom.startBtn.style.opacity = '1';
    },

    resetTimer() {
        this.pause();
        this.dom.startBtn.textContent = 'START';
        this.state.timeLeft = this.config[this.state.mode] * 60;
        this.dom.status.textContent = 'READY';
        this.render();
    },

    render() {
        const m = Math.floor(this.state.timeLeft / 60);
        const s = this.state.timeLeft % 60;
        const fmt = `${m}:${s < 10 ? '0' : ''}${s}`;
        this.dom.time.textContent = fmt;
        document.title = `${fmt} - Orbit`;
    },

    complete() {
        this.pause();
        this.dom.status.textContent = 'COMPLETED';
        this.playSound();
        if (this.config.notifications) {
            new Notification("Orbit Focus", { body: "Timer Complete", icon: 'favicon.ico' });
        }
    },

    playSound() {
        this.dom.audio.src = `assets/alarm-${this.config.sound}.mp3`;
        this.dom.audio.play().catch(() => {});
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => App.init());