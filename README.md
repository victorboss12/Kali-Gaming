# Kali-Gaming — Social Gaming & Rewards Platform

A modern, responsive, full-stack web application for **Kali-Gaming**, using the authentic visual reference and design system extracted from [kali-gaming.com/support](https://www.kali-gaming.com/support).

---

## 🎮 Core Objectives & Features

- **Kali-Gaming Brand Design**: High-fidelity dark gaming aesthetic matching the original palette:
  - Primary Orange: `#F36E0F`
  - Deep Gradients: `from-[#0D0D2B] to-[#1A1A40]` (Support/Dashboard) and `from-[#401a1d] to-[#0a0221]` (Home/Hero)
  - Card & Chat Surfaces: `#0e1b4d`, `#1b2a7a`, `#2a3c91`, `#17102D`
  - Authentic Footer: *"Made with Love and Kali Gaming"*
- **Authentication & Player Profiles**:
  - Secure bcrypt password hashing and JWT sessions stored in HTTP-only cookies (`kali_session`).
  - Player profiles with display name, bio, avatar selection, creation date, and unlocked badge showcases.
  - 1-click test login presets for rapid evaluation.
- **Real-Time Messaging & Chat Rooms**:
  - Socket.IO transport unified with Next.js on a single port (`server.ts`).
  - 1-on-1 private messaging with live typing indicators, emoji reactions (❤️, 🔥, 🏆, 👍), read timestamps, and active status.
  - Public Community Rooms (General Lobby, Milkyway Lounge, Firekirin Arena, Juwa Champions).
- **Server-Authoritative Spinning Rewards Wheel**:
  - HTML5 Canvas animated wheel with physics-based cubic-bezier deceleration.
  - Cryptographically secure server-selected winning segment with audit seeds.
  - 24-hour cooldown timer and anti-tamper duplicate prevention.
  - Confetti celebration modal upon winning.
  - Strictly non-cash social rewards (VIP Badges, Avatar Frames, Cosmic Titles, Emote Packs, Platform XP).
- **Rewards Hub & Audit History**:
  - Badges shelf with equipped status.
  - Full auditable spin history table with timestamps and server seeds.
- **Customer Support Desk**:
  - Faithful visual replica of `kali-gaming.com/support` including camera/mic icons, rounded chat bubbles, and SVG send button.
  - Automated routing assistant for popular games (*Milkyway, Juwa, Firekirin, Orion Stars*).
- **Staff Administration Console**:
  - Protected admin dashboard (`/admin`) requiring `role === "ADMIN"`.
  - User status controls (Active, Mute, Ban).
  - Moderation queue for player reports.
  - Real-time wheel segment and probability manager.
  - Security audit log tracking all administrative mutations.

---

## 🛠 Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti.
- **Real-Time Server**: Node.js custom HTTP server wrapping Next.js + Socket.IO.
- **Database**: SQLite (via standard Prisma ORM schema, 100% plug-and-play zero-dependency local setup).
- **Security**: bcryptjs, jsonwebtoken, Zod schemas, HTTP-only SameSite cookies.
- **Testing**: Automated integration and unit test suite (`tests/run-tests.ts`).

---

## 🚀 Quick Start Guide

### 1. Installation
```powershell
cd C:\Users\mailt\.gemini\antigravity\scratch\kali-gaming
npm.cmd install
```

### 2. Database Sync & Seeding
```powershell
# Generate Prisma Client & Sync SQLite database
npx.cmd prisma generate
npx.cmd prisma db push

# Seed initial admin, test players, community rooms, and support tickets
npx.cmd tsx prisma/seed.ts
```

### 3. Run Automated Tests
```powershell
npm.cmd test
```

### 4. Start Development Server
```powershell
npm.cmd run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Pre-Seeded Test Credentials

| Account Role | Email | Username | Password |
|---|---|---|---|
| **Admin** | `admin@kali-gaming.com` | `kali_admin` | `KaliAdmin123!` |
| **Player 1** | `player1@kali-gaming.com` | `kali_phoenix` | `Player123!` |
| **Player 2** | `player2@kali-gaming.com` | `cyber_wolf` | `Player123!` |

*(Note: The login page includes 1-click test sign-in buttons for all three accounts).*

---

## 🔒 Security & Fair Play Disclosures

1. **Non-Cash Entertainment**: All rewards, badges, and points are strictly cosmetic and social perks. No monetary deposits, withdrawals, or wager-linked free-play credits exist.
2. **Server-Side Authority**: The client never decides or validates wheel spin outcomes or conversation access rights.
3. **Database Audit Logs**: Every administrative moderation action (user mute, ban, reward definition tweak) is logged to `AdminAuditLog` with staff timestamps and details.
