<p align="center">
  <img src="osace-mobile/src/assets/osace.png" alt="O.S.A.C.E. Logo" width="150" />
</p>

<h1 align="center">O.S.A.C.E. — Volunteer Management Platform</h1>

<p align="center">
  A full-stack mobile application for managing volunteers, events, and activities within the <strong>O.S.A.C.E.</strong> student organisation.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Expo_SDK-54-000020?logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-green" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Role-Based Access Control](#-role-based-access-control)
- [Attendance & Time Tracking](#-attendance--time-tracking)
- [Gamification & Badge System](#-gamification--badge-system)
- [Background Workers](#-background-workers)
- [Easter Eggs & Personalisation](#-easter-eggs--personalisation)

---

## 🌐 Overview

O.S.A.C.E. is a comprehensive, modern volunteer management platform designed for student organisations. It solves the logistical nightmare of tracking volunteer hours manually while providing volunteers with an engaging, highly-polished mobile experience that rewards their dedication.

**Production URL:** `https://osace.ro`  
**API URL:** `https://api.osace.ro`  
**Android Package:** `com.osace.mobile`

The platform consists of two main modules:

| Module | Description |
|---|---|
| **`osace-mobile`** | React Native (Expo) mobile app — the main frontend for all users |
| **`osace-api`** | Node.js/Express REST API backend with PostgreSQL database |

---

## ✨ Features

### 👤 For Volunteers
- **Event Discovery** — Browse all upcoming activities, meetings, and projects with rich details.
- **One-Tap Registration** — Sign up for events instantly.
- **QR Code Attendance** — Scan dynamic, TOTP-secured QR codes at events to check-in and check-out.
- **Personal Dashboard** — Track enrolled events, participation history, and total accumulated volunteer hours.
- **News Feed** — Stay updated with organisation announcements, like posts, and engage in comment sections.
- **Leaderboard** — Compete with fellow volunteers in an hours-based ranking system.
- **Achievement Badges** — Unlock 50+ badges through participation milestones, perfect streaks, and social engagement.
- **Public Profiles** — Personalise your avatar and view other volunteers' achievements.
- **Push Notifications** — Receive instant alerts for new events, announcements, and hour approvals.
- **Dynamic Theming** — Full Light/Dark mode support that respects system preferences with seamless UI transitions.
- **Contextual Greetings** — The app greets you differently based on the time of day and specific holidays.

### 🔧 For Coordinators
- **Event Management** — Complete CRUD control over events (location, description, category, max participants).
- **Dynamic QR Generation** — Generate TOTP-based rotating QR codes on-screen for secure attendance verification.
- **Participant Management** — Monitor live check-ins and manually manage event participants.
- **Team Management** — Assign specific team members to events with elevated permissions.
- **Hour Approval Queue** — Review and approve volunteer hour requests (e.g., overtime, forgotten check-outs).
- **Manual Hour Assignment** — Award custom hours to volunteers for off-app tasks.

### 🛡️ For Administrators
- **Unrestricted Access** — Full coordinator rights globally.
- **User Management** — View all registered users, change roles, and assign permissions.
- **Granular Permissions** — Assign specific powers (create events, scan QR anywhere) to individual coordinators.
- **Send Notifications** — Broadcast push notifications to all users or specific roles.
- **Post Management** — Publish rich-content news posts with image attachments.
- **Organisation Statistics** — Dashboard with interactive charts showing attendance rates, total hours, and activity metrics.
- **Badge Management** — Create, edit, and delete achievement badges dynamically.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      MOBILE APP                             │
│              React Native / Expo SDK 54                     │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐          │
│  │ ThemeCtx │  │ AuthCtx  │  │ PermissionCtx    │          │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘          │
│       └──────────────┼────────────────┘                     │
│                      ▼                                      │
│  ┌──────────────────────────────────────┐                   │
│  │       Navigation Layer               │                   │
│  │  Stack → Drawer → Tabs → Stacks      │                   │
│  └──────────────┬───────────────────────┘                   │
│                 ▼                                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Feature Modules                      │ │
│  │  Auth │ Home │ Events │ Feed │ Profile │ Leaderboard   │ │
│  │  History │ BadgeCatalog │ Notifications │ Admin        │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           ▼                                 │
│                  ┌────────────────┐                         │
│                  │  Axios Client  │                         │
│                  │  (api.js)      │                         │
│                  └────────┬───────┘                         │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       API SERVER                            │
│                   Node.js / Express                         │
│                                                             │
│  ┌────────────┐  ┌──────────┐  ┌────────────┐              │
│  │ JWT Auth   │  │  CORS    │  │  Multer    │              │
│  │ Middleware │  │          │  │ (Uploads)  │              │
│  └─────┬──────┘  └──────────┘  └────────────┘              │
│        ▼                                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Route Modules                       │ │
│  │  /auth │ /profile │ /events │ /admin │ /notifications  │ │
│  │  /posts │ /badges │ /leaderboard                       │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           │                                 │
│  ┌────────────────┐  ┌────┴───────┐  ┌──────────────────┐  │
│  │ checkoutWorker │  │ PostgreSQL │  │   Brevo SMTP     │  │
│  │ (every 30 min) │  │  Database  │  │   (Emails)       │  │
│  └────────────────┘  └────────────┘  └──────────────────┘  │
│  ┌────────────────┐  ┌─────────────────────────────┐       │
│  │ badgeWorker    │  │  Expo Push Notification     │       │
│  │ (scheduled)    │  │  Service                    │       │
│  └────────────────┘  └─────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Navigation Hierarchy

```
App.js (Root Stack)
├── [Unauthenticated]
│   ├── LoginScreen
│   ├── RegisterScreen
│   └── ResetPassword Flow
│
└── [Authenticated]
    ├── OnboardingScreen
    └── MainDrawer
        ├── CoreAppNavigator (hidden from drawer)
        │   ├── AppTabs (Bottom Tab Navigator)
        │   │   ├── Noutăți (News Feed)
        │   │   ├── Activități (All Events)
        │   │   ├── Activitățile Mele (My Events)
        │   │   ├── Istoric (History)
        │   │   └── Admin/Coordonare
        │   │       └── ManagementNavigator (Stack)
        │   │           ├── AdminMenuScreen, ManageEvents, etc.
        │   │
        │   ├── EventDetailScreen (overlay)
        │   ├── CommentsScreen (overlay)
        │   ├── PublicProfileScreen (overlay)
        │   └── NotificationHistoryScreen (overlay)
        │
        ├── Profile
        ├── Leaderboard
        ├── Badge Catalog
        └── Footer Actions (Theme Toggle, Logout, App Version)
```

---

## 🧰 Tech Stack

### Frontend (`osace-mobile`)
- **React Native (0.81.5)** — Cross-platform mobile framework
- **Expo (SDK 54)** — Development platform & EAS build service
- **React Navigation (7.x)** — Advanced routing (Drawer, Tabs, Stack)
- **Axios** — HTTP client with JWT interceptors
- **Expo SecureStore** — Secure, encrypted token storage
- **Expo Notifications** — Remote push notification handling
- **Expo Camera / QR Code** — Hardware scanning & dynamic SVG generation
- **Reanimated & Gesture Handler** — Fluid 60fps animations and modal sheets
- **React Native Chart Kit** — Data visualisation

### Backend (`osace-api`)
- **Node.js + Express** — High-performance REST API
- **PostgreSQL (`pg`)** — Relational database for transactional integrity
- **JSON Web Tokens (JWT)** — Stateless authentication
- **Argon2** — State-of-the-art password hashing
- **Nodemailer + Brevo SMTP** — Transactional emails (OTP, password reset)
- **OTPLib** — TOTP algorithm for rotating, un-spoofable QR codes
- **Multer** — Multipart file upload handling

---

## 📁 Project Structure

```
osace-project/
├── osace-mobile/                    # React Native mobile app
│   ├── App.js                       # Entry point & provider hierarchy
│   ├── app.json                     # Expo configuration
│   ├── package.json                 # Dependencies
│   └── src/
│       ├── assets/                  # Local images, icons, easter egg assets
│       ├── components/              # Shared/reusable UI components
│       ├── constants/               # Theming, colors, permission keys
│       ├── features/                # Domain-driven feature modules
│       │   ├── Auth/                # Login, registration, AuthContext
│       │   ├── Home/                # Main dashboard
│       │   ├── Event/               # Event details, QR scanner, My Events
│       │   ├── Feed/                # Posts, comments, likes
│       │   ├── History/             # User's attendance log
│       │   ├── Profile/             # Profile management & public views
│       │   ├── Leaderboard/         # Ranking system
│       │   ├── BadgeCatalog/        # Gamification browser
│       │   ├── Notifications/       # Push notification inbox
│       │   └── Admin/               # 13+ Management & stats screens
│       ├── navigation/              # Navigators (Tabs, Drawers, Stacks)
│       └── services/                # Axios API configuration
│
└── osace-api/
    └── osace-api/                   # Express backend
        ├── index.js                 # Server entry point
        └── src/
            ├── config/              # DB pool, Mailer, Multer
            ├── features/            # API Route controllers & queries
            │   ├── Auth/
            │   ├── Profile/
            │   ├── Event/           # Event logic, Attendance, QR validation
            │   ├── Admin/           # Hour approvals, role mgmt, stats
            │   ├── Posts/
            │   ├── Badge/           # Badge evaluation engine
            │   ├── Leaderboard/
            │   └── Notifications/
            └── scripts/             # Cron jobs and background workers
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** (v15+)
- **Expo CLI** (`npm install -g expo-cli`)

### Backend Setup
```bash
cd osace-api/osace-api
npm install
# Configure your local database and secrets (DB credentials, JWT Secret, SMTP)
node index.js
# Server runs on http://localhost:3000
```

### Frontend Setup
```bash
cd osace-mobile
npm install
# Ensure the API URL in src/services/api.js points to your backend
npx expo start
# Scan the QR code with Expo Go or run on emulator
```

---

## 📡 API Reference

Base URL: `https://api.osace.ro` (Production)

*A brief overview of key endpoints. All protected routes require a valid `Bearer <Token>`.*

- **Auth:** `/api/auth/register`, `/api/auth/login`, `/api/auth/request-reset`
- **Profile:** `/api/profile/me`, `/api/profile/avatar`, `/api/profile/push-token`
- **Events:** `/api/events`, `/api/events/:id/check-in`, `/api/events/:id/check-out`
- **Admin:** `/api/admin/users`, `/api/admin/hour-requests`, `/api/admin/statistics`
- **Social:** `/api/posts`, `/api/posts/:id/like`, `/api/posts/:id/comments`
- **Gamification:** `/api/badges`, `/api/leaderboard`

---

## 🔐 Role-Based Access Control

The platform implements a hybrid permission model combining hierarchical roles with granular capabilities.

1. **ADMIN** — Absolute access to all endpoints, statistics, and user management.
2. **COORDONATOR** — Access depends on granular permissions assigned by an Admin (e.g., `CAN_CREATE_EVENTS`, `CAN_SCAN_QR_ANYWHERE`) or Event-Level assignment (e.g., being added to an event's organising team).
3. **USER** — Standard volunteer access. Can view events, register, check-in, and use social features.

---

## ⏱️ Attendance & Time Tracking

O.S.A.C.E. employs a highly accurate, cheat-proof attendance system:

- **TOTP QR Codes:** Event QR codes regenerate every 10 seconds. Scanning an expired photo of a QR code will fail.
- **30-Minute Tolerance Rule:** 
  - If a volunteer arrives up to 30 minutes early or leaves up to 30 minutes late, the system caps their hours to the event's official bounds.
  - If a volunteer arrives *more* than 30 minutes early or stays *more* than 30 minutes late, the system automatically triggers an **Overtime Request** which must be manually approved by a coordinator.
- **Auto-Absent Protection:** If a volunteer checks in but forgets to check out, a background worker flags them after a 24-hour grace period, setting their awarded hours to 0 and notifying coordinators via the Hour Approvals queue.

---

## 🏆 Gamification & Badge System

The platform features an extensive, fully automated achievement engine with **50+ badges** to keep volunteers motivated.

**Badge Categories:**
- **Milestones:** First Event, 5/10/25/100 Events, 10/100/500 Hours.
- **Category Specific:** "Omul Ședințelor" (Meetings), "Sufletul Petrecerii" (Social).
- **Streaks:** Perfect Attendance (3, 5, 10 events in a row without missing a registered event).
- **Time-Based:** "Night Owl" (Late night events), "Early Bird" (Morning events).
- **Social & Engagement:** "Influencer" (Likes received), "Top Comentator".
- **Easter Eggs:** Hidden badges unlocked through specific undocumented actions.

Badges are evaluated and awarded instantly upon checkout confirmation by the `badge.service.js` engine.

---

## ⚙ Background Workers

1. **Checkout Worker (`checkoutWorker.js`)**
   - Runs every 30 minutes.
   - Scans for "stale" check-ins (events ended > 24 hours ago with no check-out).
   - Automatically closes the attendance with 0 hours and files a manual review request.
2. **Badge Worker (`badgeWorker.js`)**
   - Scheduled cron job script.
   - Awards time-sensitive badges that don't rely on immediate user actions (e.g., 1-Year Anniversary, Weekly Leaderboard Winner).

---

## 👾 Easter Eggs & Personalisation

To make the app feel alive and personal, several hidden features are built-in:
- **Dynamic Greetings:** The top header greeting changes based on the time of day ("Spor la cafeluță", "Pauză de masă?"). It also features special overrides for holidays (Jan 1st, March 8th, Dec 25th, etc.).
- **Dev Credits Meme:** Tapping the App Version number in the sidebar 7 times rapidly triggers a secret modal displaying the "Nerd Emoji" meme and a custom developer message.
- **Cached States:** UI elements are cached heavily to prevent "flickering" during navigation, ensuring a premium feel.

---

<p align="center">
  Built with ❤️ by the <strong>O.S.A.C.E.</strong> team.
</p>
