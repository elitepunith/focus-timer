# Focus Timer

A minimal, Pomodoro-style productivity timer built with vanilla HTML, CSS, and JavaScript. Features a cyberpunk-themed dark UI with a circular SVG progress ring, smooth mode-switch animations, and drift-free timing powered by requestAnimationFrame.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-00ff9d?style=for-the-badge)

---

## Features

| Feature | Description |
|---------|-------------|
| Pomodoro Timer | Focus, Short Break, and Long Break modes |
| SVG Progress Ring | Animated circular countdown around the timer |
| Drift-Free Timing | Uses requestAnimationFrame and performance.now() for accuracy |
| Cyberpunk UI | Neon green accents on a deep black background |
| Configurable Settings | Adjust durations, alarm sounds, and notifications |
| Persistent Config | Settings saved in localStorage across sessions |
| Browser Notifications | Get notified when sessions complete |
| Alarm Sounds | Digital, Bell, or Nature alarm options |
| Keyboard Shortcuts | Full keyboard control (see table below) |
| Smooth Animations | Mode-switch, completion pulse, and hover effects |
| Accessible | ARIA roles, labels, focus-visible outlines, and noscript fallback |
| Responsive | Works on mobile, tablet, and desktop |

---

## Getting Started

```bash
git clone https://github.com/elitepunith/focus-timer.git
cd focus-timer
open index.html
```

Or use the Live Server extension in VS Code.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Start / Pause |
| R | Reset Timer |
| 1 | Focus Mode |
| 2 | Short Break |
| 3 | Long Break |
| Esc | Close Settings |

---

## Project Structure

```
focus-timer/
├── index.html      -- Markup, SVG progress ring, meta tags
├── style.css       -- Styles, animations, responsive layout
├── script.js       -- ES6 class-based timer with rAF timing
├── .gitignore      -- Git ignore rules
├── LICENSE         -- MIT license
├── README.md       -- This file
└── assets/         -- Alarm sound files
    ├── alarm-digital.mp3
    ├── alarm-bell.mp3
    └── alarm-bird.mp3
```

---

## Architecture

The codebase uses a single ES6 class (FocusTimer) with:

- Static constants for defaults, validation limits, and storage keys
- Private methods (prefixed with underscore) for internal logic
- Public API: init, start, pause, reset, toggle, setMode
- Full JSDoc documentation on every method
- requestAnimationFrame timing loop that tracks real wall-clock seconds via performance.now(), making it immune to setInterval drift

---

## Configuration

Click the gear icon in the top-right corner to open settings:

| Setting | Default | Range |
|---------|---------|-------|
| Focus | 25 min | 1 to 120 min |
| Short Break | 5 min | 1 to 60 min |
| Long Break | 15 min | 1 to 60 min |
| Alarm Sound | Digital | Digital / Bell / Nature |
| Notifications | Off | On / Off |

All values are validated and clamped within their allowed ranges on save.

---

## Contributing

1. Fork the repository
2. Create a feature branch: git checkout -b feature/my-feature
3. Commit your changes: git commit -m "Add my feature"
4. Push to the branch: git push origin feature/my-feature
5. Open a Pull Request

---

## License

MIT -- see the LICENSE file for details.

---

Made by elitepunith -- https://github.com/elitepunith