class Timer {
    constructor() {
        this.timeLeft = 1500; // Default 25 mins in seconds
        this.timerId = null;
        this.isRunning = false;
        this.currentMode = 'pomodoro'; // 'pomodoro', 'shortBreak', 'longBreak'

        // DOM Elements
        this.timeDisplay = document.getElementById('time-display');
        this.startBtn = document.getElementById('start-btn');
        this.modeBtns = document.querySelectorAll('.mode-btn');
        this.alarmSound = document.getElementById('alarm-sound');
        
        // Configuration for modes (in seconds)
        this.modes = {
            pomodoro: 25 * 60,
            shortBreak: 5 * 60,
            longBreak: 15 * 60
        };

        this.init();
    }

    init() {
        // Event Listeners
        document.getElementById('start-btn').addEventListener('click', () => this.toggleTimer());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetTimer());
        
        this.modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        if (this.timerId) return; // Prevent double intervals
        
        this.isRunning = true;
        this.startBtn.textContent = "Pause";
        this.startBtn.style.backgroundColor = "var(--card-color)"; // Dim button
        this.startBtn.style.border = "2px solid var(--text-secondary)";

        this.timerId = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            this.updateTitle();

            if (this.timeLeft === 0) {
                this.completeTimer();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isRunning = false;
        clearInterval(this.timerId);
        this.timerId = null;
        this.startBtn.textContent = "Start";
        this.startBtn.style.backgroundColor = "var(--accent-color)";
        this.startBtn.style.border = "none";
        document.title = "Focus Timer"; // Reset title
    }

    resetTimer() {
        this.pauseTimer();
        this.timeLeft = this.modes[this.currentMode];
        this.updateDisplay();
    }

    switchMode(mode) {
        this.currentMode = mode;
        this.timeLeft = this.modes[mode];
        
        // Update UI Tabs
        this.modeBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

        // Change Theme based on mode (Focus vs Break)
        if (mode === 'pomodoro') {
            document.body.classList.remove('break-mode');
        } else {
            document.body.classList.add('break-mode');
        }

        this.resetTimer();
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const displayString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        this.timeDisplay.textContent = displayString;
    }

    updateTitle() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const displayString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        document.title = `(${displayString}) - ${this.currentMode === 'pomodoro' ? 'Focus' : 'Break'}`;
    }

    completeTimer() {
        this.pauseTimer();
        if (this.alarmSound) this.alarmSound.play();
        alert("Time is up! Take a breather.");
        
        // Auto-switch logic could go here
    }
}

// Initialize the App
const myTimer = new Timer();