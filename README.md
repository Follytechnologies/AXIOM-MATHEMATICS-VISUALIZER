# Axiom — Interactive Mathematics Visualizer

> A pure frontend mathematics visualizer with four interactive tools — built with zero libraries, zero frameworks, and zero dependencies.

---

## ✨ Four Visualizers

### 1. f(x) Grapher
- Plot multiple functions simultaneously in different colors
- Pan (drag) and zoom (scroll wheel) the canvas
- Live coordinate readout on hover
- 8 preset functions including sinc, Gaussian, cubic
- Adjustable view window

### 2. Complex Plane — Domain Coloring
- Visualize complex functions f(z) using domain coloring
- Hue encodes the **argument** of f(z); brightness encodes the **modulus**
- Supports z², z³, 1/z, sin(z), exp(z), z²+c (Julia set seed)
- Hover to see z values in real-time

### 3. Fourier Series Animator
- Watch rotating circles (epicycles) approximate wave shapes
- Choose: Square, Sawtooth, Triangle, Pulse waves
- Adjust number of harmonics (1–50) with live slider
- Adjust animation speed
- Wave trace drawn in real-time on the right panel

### 4. Polar Curves
- Plot r(θ) curves in polar coordinates
- Cardioid, Rose curves, Archimedes' Spiral, Hyperbolic spiral, and more
- Animated drawing from θ=0
- Adjustable θ range (up to 8π)

---

## 🖥️ Live Demo

> **[View Live Demo](#)** ← *((https://github.com/Follytechnologies))*

---

## 🚀 Getting Started

No installation needed.

```bash
git clone https://github.com/Follytechnologies/axiom-math-visualizer.git
cd axiom-math-visualizer
open index.html
```

Or just double-click `index.html` — it works offline with no internet required (after first font load).

---

## 🌐 Deploy to GitHub Pages (Free, 1 minute)

1. Push to GitHub
2. **Settings → Pages → Source: main / root**
3. Live at: `https://Follytechnologies.github.io/axiom-math-visualizer`

---

## 📁 Project Structure

```
axiom-math-visualizer/
│
├── index.html    ← Markup & tab structure
├── style.css     ← Chalk-on-blackboard aesthetic, all styles
├── app.js        ← All four visualizers, math engine, Canvas API
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styles | CSS3 (custom properties, grid, animations) |
| Logic | Vanilla JavaScript (ES6+) |
| Rendering | HTML5 Canvas API |
| Math | Custom expression parser + complex evaluator |
| Fonts | Google Fonts — Crimson Pro, JetBrains Mono |

**Zero npm. Zero libraries. Zero build step.**

---

## ⚙️ How It Works

### Expression Parser
Functions are parsed with a custom `safeEval()` that preprocesses common math notation:
- `^` → `**` (exponentiation)
- Implicit multiplication: `2x` → `2*x`
- Supports: `sin`, `cos`, `tan`, `sqrt`, `abs`, `exp`, `log`, `floor`, `ceil`

### Fourier Series
Each harmonic is computed analytically for square, sawtooth, triangle, and pulse waves using their known Fourier coefficients. The epicycles are animated using `requestAnimationFrame`.

### Domain Coloring
Each pixel maps to a complex number z. f(z) is evaluated, and the result is mapped to a color using:
- **Hue** = arg(f(z)) / 2π
- **Lightness** = function of log|f(z)|

### Polar Curves
r(θ) is evaluated at 2000 sample points. The result is converted from polar to Cartesian coordinates and drawn on canvas.

---

## 🔧 Supported Function Syntax

| Input | Meaning |
|---|---|
| `sin(x)`, `cos(x)`, `tan(x)` | Trig functions |
| `x^2`, `x^3` | Powers (use `^`) |
| `sqrt(x)`, `abs(x)` | Square root, absolute value |
| `exp(x)`, `log(x)` | Exponential, natural log |
| `1/x` | Reciprocal |
| `sin(x)/x` | Sinc function |
| `theta` | Polar angle variable |

---

## 📄 License

MIT — free to use and modify.

---

## 👤 Author

**Abdulhakeem** — Pure Mathematics student & Software Developer  
🖨️ Founder of **Folly Technologies & D'BEST Design & Prints**

- GitHub: [@Abdulhakeem Ahmad Folorunso](https://github.com/Follytechnologies)

---