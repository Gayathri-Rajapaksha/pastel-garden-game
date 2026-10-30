# 🌸 Pastel Match Garden 🌸

> A whimsical, pastel-themed memory card matching game featuring virtual player identities, RESTful backend persistence with SQLite, audio management, and third-party API integration for math puzzle mini-games!

---

## 📖 Table of Contents
- [✨ Overview](#-overview)
- [🎮 Gameplay & Rules](#-gameplay--rules)
  - [Difficulty Levels](#difficulty-levels)
  - [Scoring System](#scoring-system)
  - [Magic Heart Puzzle (Bonus Time)](#magic-heart-puzzle-bonus-time)
- [🌟 Key Features](#-key-features)
- [🏛️ Software Engineering & Architecture](#️-software-engineering--architecture)
  - [High Cohesion & Low Coupling](#high-cohesion--low-coupling)
  - [Event-Driven Architecture](#event-driven-architecture)
  - [API Interoperability](#api-interoperability)
  - [Security & Authentication](#security--authentication)
- [💻 Tech Stack](#-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [📡 API Endpoints](#-api-endpoints)
- [🎨 Audio & Visual Experience](#-audio--visual-experience)
- [📜 License](#-license)

---

## ✨ Overview

**Pastel Match Garden** is a cozy, pastel-aesthetic memory card game. Players log into their virtual garden accounts, flip cards to find matching pairs within a countdown timer, progress through increasingly challenging rounds, and compete for high scores on personal and global leaderboards.

When the clock is ticking down, players can use their limited extra chances to summon the **Magic Heart Puzzle**—a visual math challenge fetched live from an external web API—to win extra time and keep their garden adventure blooming! 🌷

---

## 🎮 Gameplay & Rules

1. **Log In or Register:** Create an account to track your high scores and game history.
2. **Select Difficulty:** Choose your preferred level from the home dashboard or in-game menu.
3. **Flip & Match:** Click cards to reveal cute pastel garden symbols. Find matching pairs before the countdown timer runs out!
4. **Advance Rounds:** Clear all pairs on the board to level up. Each subsequent round gives you 10 fewer seconds, testing your memory and reflexes!
5. **Magic Heart Lifeline:** If time is running out, click the Heart button or answer the prompt when the timer hits zero to solve an external arithmetic puzzle and gain **+15 bonus seconds**!

### Difficulty Levels

| Level | Grid Size | Cards | Countdown | Extra Chances | Special Items |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **🌸 Easy** | 3 × 3 | 9 cards | 120 seconds | 3 Hearts | 4 pairs + 1 bonus star ✨ |
| **🌷 Medium** | 4 × 4 | 16 cards | 90 seconds | 5 Hearts | 8 pairs |
| **🎀 Hard** | 5 × 5 | 25 cards | 60 seconds | 7 Hearts | 12 pairs + 1 bonus star ✨ |

> **Bonus Star (✨):** Flipping the special star in odd-numbered card grids instantly awards **+50 bonus points**!

### Scoring System
- **Matching Pair:** `+20 points`
- **Bonus Star (✨):** `+50 points`
- **Magic Heart Puzzle:** `-20 points` (Costs 20 points and 1 chance to earn +15 seconds)

### Magic Heart Puzzle (Bonus Time)
- Fetches real-time visual arithmetic puzzle data from Marc Conrad's external **Heart API**.
- Correct answer: **+15 seconds** added to your timer (costs 20 points and 1 extra chance).
- Incorrect answer: Lifeline lost, game continues or ends if time has expired.

---

## 🌟 Key Features

- **🔐 Virtual Player Identity & Auth:** User registration and login with encrypted passwords using `bcryptjs`.
- **🛡️ Rate-Limiting & Security:** IP-based brute-force protection (blocks IPs after 5 failed login attempts).
- **🍪 Persistent Session Management:** 7-day cookie session storage for seamless page transitions.
- **🖼️ Interactive Home Dashboard:** Animated pastel slideshow, gameplay guide, and personal best score displays.
- **🎵 Rich Audio Experience:** Background music with auto-play handling, customizable volume slider, mute toggle, and interactive sound effects for card flips, matches, errors, level ups, and game over.
- **🏆 Multi-Tier Leaderboards:** Private personal best history and global top-10 leaderboards by difficulty level.
- **🛡️ Defensive UI State Transitions:** Click shielding (`pointer-events`) to prevent race conditions during round transitions, game over states, and modal popups.
- **🌸 Whimsical Visuals:** CSS glassmorphism, floating pastel heart animations, and responsive card layouts.

---

## 🏛️ Software Engineering & Architecture

This project was built to illustrate core software engineering principles:

### High Cohesion & Low Coupling
- **`AudioManager`**: Encapsulates all audio playback, volume controls, mute states, and audio unlock handlers.
- **`API` Layer (`api.js`)**: Decoupled service layer handling all HTTP network communications with the Node backend.
- **`AuthSystem` (`auth.js`)**: Manages identity state, cookie serialization, route protection, and authentication logic.
- **`game.js`**: Focuses purely on board generation, memory matching mechanics, timers, and game state.

### Event-Driven Architecture
- **DOM Event Listeners:** UI interactions triggered through declarative event listeners (`click`, `input`, `change`).
- **Timing Events:** Interval-based timers (`setInterval`, `setTimeout`) managing countdown ticks and round transitions.
- **Asynchronous Events:** Promise-based asynchronous event handling via `fetch` and `async/await`.

### API Interoperability
- Connects to an external RESTful third-party web service (**Marc Conrad's Heart API**) via `https://marcconrad.com/uob/heart/api.php` to fetch dynamic question images and validate puzzle solutions.

### Security & Authentication
- **Password Hashing:** Passwords hashed with salt rounds using `bcryptjs` before persisting to the SQLite database.
- **Anti-Brute Force Protection:** In-memory IP tracking blocks repetitive login spam.
- **Route Guarding:** Client-side route protection redirects unauthenticated guests back to the login portal.

---

## 💻 Tech Stack

- **Frontend:**
  - HTML5 (Semantic Structure)
  - CSS3 (Vanilla styling, Flexbox/Grid, Animations, Glassmorphism)
  - JavaScript (ES6+, Fetch API, Web Audio API)
- **Backend:**
  - Node.js
  - Express.js (REST API framework)
  - SQLite3 (`sqlite3` lightweight file-based database)
  - `bcryptjs` (Password hashing)
  - `cors` (Cross-Origin Resource Sharing)
- **External Services:**
  - Marc Conrad Heart API (`https://marcconrad.com/uob/heart/api.php`)

---

## 📁 Project Structure

```text
pastel-garden-game/
├── backend/
│   ├── game.db               # SQLite database file (users & score history)
│   ├── package.json          # Backend dependencies & configuration
│   └── server.js             # Express API server & SQLite database setup
│
├── frontend/
│   ├── audio/                # Sound effects & background music
│   │   ├── bg-music.mp3      # Cozy pastel background soundtrack
│   │   ├── click.mp3         # Button click sound
│   │   ├── flip.mp3          # Card flip sound
│   │   ├── gameover.mp3      # Game over chime
│   │   ├── match.mp3         # Pair match success sound
│   │   ├── win.mp3           # Round clear fanfare
│   │   └── wrong.mp3         # Mismatch / error sound
│   ├── api.js                # Frontend API client (interacts with backend)
│   ├── auth.js               # Cookie & authentication state management
│   ├── game.html             # Main memory card matching game page
│   ├── game.js               # Game loop, memory logic, & Heart API modal
│   ├── home.html             # User welcome dashboard & slideshow
│   ├── home.js               # Slideshow animation & dashboard statistics
│   ├── index.html            # Login & registration authentication portal
│   ├── slide1.jpg            # Slideshow visual asset
│   ├── slide2.jpg            # Slideshow visual asset
│   ├── slide3.jpg            # Slideshow visual asset
│   └── style.css             # Unified pastel aesthetic stylesheet
│
├── package.json              # Root package configuration
├── .gitignore                # Git ignore rules
└── README.md                 # Project documentation
```

---

## 🚀 Getting Started

Follow the steps below to run the game locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or newer recommended)
- [npm](https://www.npmjs.com/) (installed automatically with Node.js)
- A modern web browser (Google Chrome, Firefox, Edge, Safari)

---

### 1. Backend Setup

1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Start the Express server:
   ```bash
   node server.js
   ```

   You should see:
   ```text
   Connected to SQLite database.
   Backend running on port 3000
   ```

> 💡 The server runs at `http://localhost:3000`. Keep this terminal window open while playing.

---

### 2. Frontend Setup

You can run the frontend in either of two ways:

#### Option A: Direct Browser Launch
Open `frontend/index.html` directly in your favorite web browser (e.g. double-click the file in File Explorer).

#### Option B: Live Server (Recommended)
If using VS Code / IDE:
- Right-click `frontend/index.html` and select **"Open with Live Server"**.
- Or use `npx serve frontend` in another terminal.

---

## 📡 API Endpoints

The backend provides the following RESTful API routes:

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register` | Register a new player account | `{ username, email, password }` |
| `POST` | `/api/login` | Log into an existing account | `{ username, password }` |
| `POST` | `/api/score` | Submit game score and update personal best | `{ username, level, score }` |
| `GET` | `/api/leaderboard/:level` | Fetch global top 10 scores for level (`easy`, `medium`, `hard`) | *None* |
| `GET` | `/api/leaderboard/private/:username/:level` | Fetch player's top 3 personal scores for level | *None* |

---

## 🎨 Audio & Visual Experience

- **Autoplay Handling:** Modern browsers restrict audio autoplay until user interaction. The game listens for the first user click to smoothly fade in the background music.
- **Audio Controls:** Players can mute sound or adjust music and SFX volume dynamically using the volume slider in `game.html`.
- **Pastel Palette:** Designed using soft pinks (`#ffb3d9`), soft purples, creamy whites, and pastel accents with friendly typography.

---

## 📜 License

This project is licensed under the [ISC License](file:///backend/package.json). Feel free to use, customize, and extend it!

🌸 *Happy Matching in the Pastel Garden!* 🌸
