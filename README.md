<div align="center">

# 🚀 Deep Space

**A professional 2D top-down arcade space shooter built with Phaser 4, TypeScript, and Vite.**

*Created by Abhishek Yaduwanshi (2026)*

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Phaser](https://img.shields.io/badge/Phaser-4.2-8B2FC9?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHBhdGggZD0iTTMyIDRMMTIgMjBsNCA0IDEyLTEwdjMyTDEyIDYwbDQtNCAyMC0xNiAyMCAxNiA0IDQtMjAtMTZWMTRsOSA4IDQtNHoiIGZpbGw9IndoaXRlIi8+PC9zdmc+)](https://phaser.io/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[Play Now](#) &nbsp;·&nbsp; [Report Bug](https://github.com/me-hv/deep-space/issues) &nbsp;·&nbsp; [Request Feature](https://github.com/me-hv/deep-space/issues)

</div>

---

## 📖 Overview

**Deep Space** is a fast-paced, wave-based arcade space shooter where your only objective is to survive as long as possible. Fight through increasingly difficult waves of enemy fighters, collect power-ups, upgrade your weapons, and chase the high score.

Built entirely with **Phaser 4**, **TypeScript**, and **Vite**, Deep Space is architected like a production game — with clean separation of concerns, an event-driven architecture, and systems designed to be extended.

---

## 🎮 Gameplay

```
  START
    ↓
  Move & Aim
    ↓
  Shoot Enemies
    ↓
  Collect Power-Ups
    ↓
  Survive the Wave
    ↓
  Next Wave (harder)
    ↓
  Player Dies → Game Over → Restart
```

- **WASD / Arrow Keys** — Move
- **Mouse / Auto-aim** — Fire
- **ESC** — Pause
- **ENTER** — Restart after Game Over

---

## ✨ Features

### 🕹️ Core Gameplay
- Smooth **WASD** player movement with physics-based velocity and clamped boundaries
- **Continuous auto-fire** weapon system with bullet pooling for zero GC pressure
- **Enemy AI** — scout ships that pursue the player with configurable aggression
- **Object pooling** for bullets and enemies — no runtime garbage collection spikes

### 🌊 Wave System
- Structured **wave-based progression** — enemies spawn in organized waves
- **Difficulty scaling** — each wave increases enemy count, speed, and health
- **Rest phases** between waves with an animated countdown banner
- Foundation ready for **boss waves** and **elite enemy** types

### 💊 Power-Up & Loot System
- Enemies drop **collectible power-ups** on death (probability-based)
- **Rapid Fire** — temporarily doubles fire rate
- **Damage Boost** — temporarily increases bullet damage
- **Speed Boost** — temporarily increases player movement speed
- **Shield** — absorbs the next hit (charges-based)
- **Health Pack** — instantly restores player health
- Extensible `PowerUpConfig` — add new power-up types in a single file

### 🖥️ HUD & Game State
- **Top-Left Health Card** — animated health bar, shield charges, active buff timers
- **Top-Right Score Card** — score with bounce animation on kill, kill count, accuracy %
- **Bottom-Left Weapon Card** — weapon name, level, firing status (READY / RAPID FIRE / OVERCHARGED)
- **Bottom-Right Timer** — survival clock (MM:SS)
- **Wave Banner** — animated slide-in/fade-out banner between waves
- **Toast Notifications** — slide-in pickup confirmations that stack and auto-dismiss
- **Debug Overlay** — FPS, entity count, wave state (dev builds only)

### 📱 Responsive & Cross-Device
- **Phaser Scale.FIT** — consistent gameplay area across all screen sizes
- **Responsive HUD** — breakpoint-aware margins (mobile / tablet / desktop)
- **LayoutManager** — single source of truth for all UI positioning; never hardcoded coordinates
- **Safe Area** support for notched mobile screens

### 🎨 UI / Visual Polish
- Dark arcade aesthetic with translucent card panels and rounded borders
- Health bar color transitions (green → orange → red) with shake on damage
- Score value bounce animation on every kill
- Scale-up bounce animation on Game Over overlay
- Event-driven architecture — game systems never talk to UI directly

---

## 🏗️ Architecture

The project is built with a clear **layered architecture**:

```
src/
├── config/          # Phaser game configuration
├── core/            # Constants, SceneKeys, AssetKeys, Game bootstrap
├── entities/        # Phaser GameObjects: Player, Enemy, Bullet, PowerUp
├── managers/        # InputManager, CameraManager, GameStateManager
├── scenes/          # BootScene, PreloadScene, MenuScene, GameScene
├── systems/         # WeaponSystem, EnemySystem, CollisionSystem,
│                    # WaveSystem, LootSystem, PowerUpSystem
├── effects/         # Explosion effects
├── ui/
│   ├── HUD/         # TopLeftHUD, TopRightHUD, BottomLeftHUD, BottomRightHUD
│   ├── MobileControls/
│   ├── LayoutManager.ts      # Single source of truth for all positioning
│   ├── WaveBanner.ts
│   ├── GameOverOverlay.ts
│   ├── NotificationManager.ts
│   ├── UIAnimator.ts
│   └── PauseMenu.ts
├── theme/           # Colors, Typography, Spacing, UIConstants, UIText
├── types/           # Shared TypeScript type definitions
└── utils/           # Helper utilities
```

### Key Design Decisions

| Pattern | Usage |
|---|---|
| **Event Bus** | All game systems emit events (`GAME_EVENTS`). UI listens. No direct coupling. |
| **Object Pooling** | Bullets and enemies are pooled — reused, never destroyed/created at runtime |
| **LayoutManager** | Every HUD widget asks `LayoutManager` for its position. No hardcoded `x, y`. |
| **System Orchestration** | `GameScene` wires systems together; systems don't know about each other |
| **Phaser Scale.FIT** | All players see the same world — no viewport advantage on ultrawide screens |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/me-hv/deep-space.git
cd deep-space

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

### Other Commands

```bash
npm run lint      # ESLint check
npm run format    # Prettier format
```

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| [Phaser](https://phaser.io/) | 4.2 | Game engine (rendering, physics, input, pooling) |
| [TypeScript](https://www.typescriptlang.org/) | 6.0 | Type-safe game logic |
| [Vite](https://vitejs.dev/) | 8.1 | Dev server & production bundler |
| [ESLint](https://eslint.org/) | 10 | Code quality |
| [Prettier](https://prettier.io/) | 3.9 | Code formatting |

---

## 📁 Project Structure — Scene Flow

```
BootScene
  └─→ PreloadScene (generates textures procedurally)
        └─→ MenuScene (title, play button)
              └─→ GameScene (main gameplay loop)
                    ↑
                    └── GameOverOverlay → restart → GameScene
```

All scene keys are centralized in [`src/core/SceneKeys.ts`](src/core/SceneKeys.ts) and all asset keys in [`src/core/AssetKeys.ts`](src/core/AssetKeys.ts).

---

## 🗺️ Roadmap

- [ ] **Boss Waves** — special boss enemy every 5 waves
- [ ] **Elite Enemies** — shielded, fast, and kamikaze variants
- [ ] **Weapon Upgrade Tree** — collect upgrade tokens to evolve your blaster
- [ ] **High Score Persistence** — localStorage leaderboard
- [ ] **Sound & Music** — procedural SFX and adaptive background music
- [ ] **Particle Effects** — explosion debris, thruster trails, impact sparks
- [ ] **Mobile Touch Controls** — on-screen virtual joystick and fire button
- [ ] **Achievements** — milestone-based unlock system

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/boss-wave`)
3. Commit your changes (`git commit -m 'Add boss wave system'`)
4. Push to the branch (`git push origin feature/boss-wave`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

**Built with ❤️ using Phaser 4 + TypeScript**

⭐ Star this repo if you enjoy the game!

</div>
