# 📸 Photo booth

A vintage-inspired browser photo booth built with pure HTML, CSS and JavaScript — no libraries, no frameworks.

---

## What it does

- Opens your webcam and lets you take **2, 4 or 6 photos** in a session
- Choose your **format** — classic film strip or scattered polaroids
- Pick a **filter** before shooting — warm film, faded, light leak, vivid, b&w or cool blue
- Every photo gets that filter applied via pixel-level Canvas manipulation
- **Confetti bursts** and a coloured flash on every shot
- Builds a final downloadable **film strip** (dark reel with sprocket holes) or **polaroid layout** (cream scrapbook page with rotated prints)
- Save your strip as a PNG

---

## Built with

| Tech | Purpose |
|---|---|
| HTML / CSS / JavaScript | Everything — no libraries used |
| Canvas 2D API | Webcam capture, pixel filter manipulation, strip/polaroid rendering |
| `getUserMedia` API | Webcam access |
| Google Fonts — Fredoka + Architects Daughter | Typography |
| CSS animations | Confetti, floating doodles, pop-in reveals |

---

## Filters explained

Each filter works by reading every pixel's RGB values and mathematically transforming them:

| Filter | What it does |
|---|---|
| Warm Film | Converts to greyscale then adds sepia toning — boosts red, reduces blue |
| Faded | Pulls all values toward the midrange — washed out pastel look |
| Light Leak | Adds a warm orange gradient bleed from the right side |
| Vivid | Cross-processed — boosts greens and contrast, punchy colours |
| B&W | True greyscale with boosted contrast |
| Cool Blue | Reduces red, boosts blue channel — moody and cinematic |

All filters also add a subtle random grain per pixel to simulate real film.

---

## How to run

Just open `index.html` in Chrome or Firefox. Allow camera access when prompted. No installs needed.

```
cutie-booth/
├── index.html   — structure and screens
├── style.css    — all styling, pastel 2D aesthetic, animations
└── script.js    — webcam, filters, canvas rendering, download
```

---

## Live demo

🔗 https://MahajanAshlesha.github.io/Photo-Booth

---

*Built as a fun creative project — pure web tech, zero dependencies.*
