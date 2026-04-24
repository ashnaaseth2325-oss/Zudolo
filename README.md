# 🎮 Multi-Game Web Platform (Sudoku + Ludo)

A modern, interactive browser-based gaming platform featuring **Sudoku** and **Ludo** in a single unified dashboard. Built with **HTML, CSS, and JavaScript**, enhanced with **Three.js animations**, and designed to deliver a smooth, premium gaming experience.

Deployment Link: https://zudolo22.netlify.app/

---

## 🚀 Features

### 🌐 Platform

* Single Page Application (SPA)
* Beautiful **Gaming Dashboard** with game selection
* 🌙 Dark / ☀️ Light mode (saved using localStorage)
* Fully responsive (desktop + mobile)
* Smooth page transitions & animations

---

## 🧩 Sudoku Game

### Core Features

* 9x9 grid with valid puzzle generator
* Difficulty levels: Easy, Medium, Hard
* Real-time validation & rule enforcement

### Gameplay Enhancements

* ⏱ Timer (pause/resume)
* ❌ Mistake counter
* ✏️ Notes mode (pencil input)
* 🔁 Undo / Redo
* 💡 Hint system
* ✅ Auto-check toggle
* 💾 Save & Resume game

### UX

* Highlight row, column, and 3×3 box
* Conflict detection
* Win animation

---

## 🎲 Ludo Game

### Core Gameplay

* 2–4 Player local multiplayer
* 🎲 Dice roll (randomized logic)
* Full Ludo rules:

  * Enter token on rolling 6
  * Capture opponent tokens
  * Safe zones
  * Exact roll to finish

### Features

* Turn-based system with clear UI
* Animated dice and token movement
* Player colors: 🔴 🔵 🟢 🟡
* Win detection & celebration

### Advanced

* Basic AI (optional)
* Sound effects (toggle)
* Highlight valid moves

---

## 🎨 UI / UX

* Clean, modern interface inspired by gaming apps
* Glassmorphism / soft UI styling
* Smooth hover effects & transitions
* Accessible design (contrast, focus states)

---

## ⚡ Three.js Enhancements

* Animated background (particles / gradients)
* 3D hover effects on dashboard cards
* Smooth screen transitions
* Win celebration animations (confetti / burst)

> Note: Three.js is used subtly to ensure performance remains smooth.

---

## 🧠 State Management

* Modular JavaScript architecture
* localStorage used for:

  * Theme preference
  * Saved Sudoku game
  * Leaderboards / stats

---

## ⌨️ Controls

* Keyboard support (Sudoku)
* Touch-friendly UI for mobile
* Intuitive interactions across games

---

## 🏆 Extra Features

* 📊 Leaderboards (best times & wins)
* ⚙️ Settings panel:

  * Theme toggle
  * Sound toggle
  * Difficulty selection
* ⏳ Loading animations
* 🎉 Elegant result / win screens

---

## 📁 Project Structure

```
📦 project-root
 ┣ 📜 index.html
 ┣ 📜 styles.css
 ┣ 📜 script.js
 ┣ 📂 js/
 ┃ ┣ 📜 sudoku.js
 ┃ ┣ 📜 ludo.js
 ┃ ┣ 📜 ui.js
 ┃ ┗ 📜 state.js
 ┗ 📜 README.md
```

---

## 🛠️ Tech Stack

* **Frontend:** HTML, CSS, JavaScript (ES6+)
* **Graphics & Animations:** Three.js
* **Storage:** localStorage

---

## ⚙️ Setup & Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/your-repo-name.git
```

2. Navigate to the project folder:

```bash
cd your-repo-name
```

3. Open in browser:

```bash
Open index.html
```

---

## 📸 Screenshots

> Add screenshots of:

* Dashboard
* Sudoku gameplay
* Ludo gameplay
* Dark/Light mode

---

## 🚀 Future Improvements

* 🌍 Online multiplayer for Ludo (WebSockets)
* 🤖 Advanced AI opponent
* 🧠 More puzzle games (Chess, Tic-Tac-Toe, etc.)
* 🔐 User authentication & cloud saves

---

## 🤝 Contributing

Contributions are welcome!
Feel free to fork the repo, create a branch, and submit a PR.

---

## 📄 License

This project is licensed under the MIT License.

---

## 💡 Inspiration

Built to create a **fun, engaging, and polished gaming experience** combining classic board and puzzle games into a single modern platform.
