# Focus Timer

A Pomodoro-style productivity timer built from scratch with vanilla JavaScript. It features a cyberpunk dark UI, an animated SVG countdown ring, five color themes, session tracking, and drift-free timing powered by `requestAnimationFrame`.

No frameworks. No dependencies. No build step.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000?style=for-the-badge&logo=vercel&logoColor=white)](https://focus-timer-ivory-delta.vercel.app)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-00ff9d?style=for-the-badge)

**Live Demo:** [focus-timer-ivory-delta.vercel.app](https://focus-timer-ivory-delta.vercel.app)

---

## Preview

![Focus Timer Screenshot](assets/screenshot.png)

---

## Features

**Core Timer**

- Focus, Short Break, and Long Break modes with configurable durations
- Animated SVG circular progress ring that counts down in real time
- Drift-free timing using `requestAnimationFrame` and `performance.now()` -- no `setInterval` drift
- Auto-start breaks option: automatically transitions between focus and break sessions

**Session Tracking**

- Visual session tracker with four indicator dots
- After every four focus sessions, the app triggers a long break
- Session count persists across page reloads via `localStorage`

**Task Labels**

- Optional text input to label what you are working on
- The task name appears in the browser tab title alongside the countdown
- Included in browser notifications when a session completes

**Themes**

- Five built-in color themes: Cyberpunk Green, Neon Blue, Retro Orange, Minimal Light, and Purple Haze
- Quick-cycle through themes with the T key or select from the settings panel
- Theme preference is saved and restored automatically

**Dynamic Favicon**

- The browser tab favicon updates every second while the timer is running
- Displays a progress arc and the remaining minutes, drawn on a hidden canvas element

**Notifications and Sounds**

- Browser notifications with task-aware messages when a session finishes
- Three alarm sound options: Digital, Bell, and Nature
- Notifications require user permission and can be toggled in settings

**Animations**

- Smooth mode-switch transitions with scale and fade effects
- Running state glow on the progress ring
- Paused state blink on the time display
- Completion pulse and ring glow animation when a session ends

**Keyboard Shortcuts**

- Full keyboard control without needing to click anything
- Shortcuts are disabled when typing in input fields or when the settings modal is open

**Accessibility**

- ARIA roles, labels, and live regions for screen readers
- Focus-visible outlines on all interactive elements
- Noscript fallback for users with JavaScript disabled

**Responsive Design**

- Four breakpoints covering small phones, tablets, and desktop monitors
- Uses `100dvh` for correct mobile viewport height
- Shortcut hints auto-hide on short screens

---

## Getting Started

### Use the live app

Visit [focus-timer-ivory-delta.vercel.app](https://focus-timer-ivory-delta.vercel.app). Nothing to install.

### Run locally

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
| Space | Start or pause the timer |
| R | Reset the current session |
| 1 | Switch to Focus mode |
| 2 | Switch to Short Break mode |
| 3 | Switch to Long Break mode |
| T | Cycle to the next theme |
| S | Open the settings panel |
| Esc | Close the settings panel |

Shortcuts are automatically disabled while typing in the task label or any settings input.

---

## Configuration

Open settings by clicking the gear icon in the top-right corner or pressing S.

| Setting | Default | Range |
|---------|---------|-------|
| Focus duration | 25 min | 1 to 120 min |
| Short Break duration | 5 min | 1 to 60 min |
| Long Break duration | 15 min | 1 to 60 min |
| Alarm sound | Digital | Digital, Bell, Nature |
| Theme | Cyberpunk Green | 5 themes |
| Notifications | Off | On or Off |
| Auto-start breaks | Off | On or Off |

All numeric values are validated and clamped to their allowed range on save. Settings persist in `localStorage`.

---

## Project Structure

```
focus-timer/
├── index.html          Markup, SVG progress ring, settings modal, meta tags
├── style.css           Themes, animations, responsive breakpoints, state styles
├── script.js           FocusTimer class with rAF timing loop and all logic
├── assets/
│   ├── alarm-digital.mp3
│   ├── alarm-bell.mp3
│   └── alarm-bird.mp3
├── .gitignore
├── LICENSE
└── README.md
```

---

## Architecture

The entire application is a single ES6 class called `FocusTimer`. Key design decisions:

- **Static constants** for defaults, validation limits, and storage keys, all frozen with `Object.freeze`
- **DOM caching** on init to avoid repeated `getElementById` calls during the timing loop
- **Private methods** prefixed with underscore for internal logic (config, rendering, notifications)
- **Public API** limited to `init`, `start`, `pause`, `reset`, `toggle`, and `setMode`
- **Timing** uses `requestAnimationFrame` with `performance.now()` to track elapsed wall-clock seconds, making it immune to the drift that affects `setInterval`-based timers
- **Theming** via CSS custom properties on `:root`, switched by toggling a `data-theme` attribute on the document element
- **State classes** (`.running`, `.paused`, `.completed`, `.mode-switching`) on the timer wrapper drive all visual transitions through CSS

No external libraries. No build tools. The entire app runs from three files served as static assets.

---

## Deployment

This project is deployed on Vercel as a static site.

To deploy your own instance:

1. Push the repository to GitHub
2. Import it on [vercel.com](https://vercel.com)
3. Vercel auto-detects it as a static site with no build step
4. The app goes live at `your-project.vercel.app`

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT. See the [LICENSE](LICENSE) file for details.

---

Built by [elitepunith](https://github.com/elitepunith)