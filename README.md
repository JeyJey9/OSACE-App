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
- [Gamification & Badge System](#-gamification--badge-system)
- [Background Workers](#-background-workers)
- [Contributing](#-contributing)

---

## 🌐 Overview

O.S.A.C.E. is a comprehensive volunteer management platform designed for student organisations. It enables coordinators and administrators to create, manage, and track volunteer events while providing volunteers with an engaging, gamified mobile experience.

**Production URL:** `https://osace.ro`  
**API URL:** `https://api.osace.ro`  
**Android Package:** `com.osace.mobile`

The platform consists of three modules:

| Module | Description |
|---|---|
| **`osace-mobile`** | React Native (Expo) mobile app — the main volunteer-facing frontend |
| **`osace-api`** | Node.js/Express REST API backend with PostgreSQL |
| **`osace-map`** | Design assets for the interactive faculty floor plan feature |

---

## ✨ Features

### 👤 For Volunteers
- **Event Discovery** — Browse all upcoming activities, meetings, and projects
- **One-Tap Registration** — Sign up for events quickly
- **QR Code Attendance** — Scan dynamic QR codes at events to check-in/check-out
- **Personal Dashboard** — View enrolled events, participation history, and accumulated volunteer hours
- **News Feed** — Stay updated with organisation announcements, like and comment on posts
- **Leaderboard** — Compete with fellow volunteers through an hours-based ranking system
- **Achievement Badges** — Unlock 40+ badges through participation, streaks, and milestones
- **Profile & Avatar** — Personalise your profile with a photo and view your stats
- **Public Profiles** — View other volunteers' profiles and achievements
- **Push Notifications** — Receive alerts for new events, announcements, and updates
- **Dark Mode** — Full light/dark theme support with system preference detection
- **Faculty Map** — Interactive SVG-based building floor plan

### 🔧 For Coordinators
- **Event Management** — Create, edit, and delete events with rich detail (location, description, category, duration)
- **Dynamic QR Codes** — Generate TOTP-based rotating QR codes for secure attendance verification
- **Participant Management** — View and manage event participants
- **Team Management** — Assign team members to events with specific permissions
- **Hour Approval** — Review and approve volunteer hour requests (including auto-checkout cases)
- **Manual Hour Assignment** — Manually assign hours to volunteers when needed

### 🛡️ For Administrators
- **Full Coordinator Access** — Everything coordinators can do, plus:
- **User Management** — View all users, change roles, manage permissions
- **Permission System** — Granular permission control per coordinator
- **Badge Management** — Create, edit, and delete achievement badges
- **Send Notifications** — Push notifications to all users or specific groups
- **Create Posts** — Publish rich-content news posts with images
- **Organisation Statistics** — Dashboard with charts and activity metrics
- **Onboarding Flow** — First-launch onboarding screens for new users

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      MOBILE APP                             │
│              React Native / Expo SDK 54                     │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐          │
│  │ ThemeCtx  │  │ AuthCtx  │  │ PermissionCtx    │          │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘          │
│       └──────────────┼────────────────┘                     │
│                      ▼                                      │
│  ┌──────────────────────────────────────┐                   │
│  │       Navigation Layer               │                   │
│  │  Stack → Drawer → Tabs → Stacks     │                   │
│  └──────────────┬───────────────────────┘                   │
│                 ▼                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Feature Modules                      │ │
│  │  Auth │ Home │ Events │ Feed │ Profile │ Leaderboard  │ │
│  │  History │ BadgeCatalog │ Map │ Notifications │ Admin  │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           ▼                                 │
│                  ┌────────────────┐                          │
│                  │  Axios Client  │                          │
│                  │  (api.js)      │                          │
│                  └────────┬───────┘                          │
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
│  │  /auth │ /profile │ /events │ /admin │ /notifications │ │
│  │  /posts │ /badges │ /leaderboard                      │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           │                                 │
│  ┌────────────────┐  ┌────┴───────┐  ┌──────────────────┐  │
│  │ checkoutWorker │  │ PostgreSQL │  │   Brevo SMTP     │  │
│  │ (every 30 min) │  │  Database  │  │   (Emails)       │  │
│  └────────────────┘  └────────────┘  └──────────────────┘  │
│  ┌────────────────┐  ┌─────────────────────────────┐       │
│  │ badgeWorker    │  │  Expo Push Notification      │       │
│  │ (scheduled)    │  │  Service                     │       │
│  └────────────────┘  └─────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Navigation Hierarchy

```
App.js (Root Stack)
├── [Unauthenticated]
│   ├── LoginScreen
│   ├── RegisterScreen
│   ├── ForgotPasswordScreen
│   └── ResetPasswordScreen
│
└── [Authenticated]
    ├── OnboardingScreen (first launch only)
    └── MainDrawer
        ├── CoreAppNavigator (hidden from drawer)
        │   ├── AppTabs (Bottom Tab Navigator)
        │   │   ├── Noutăți (News Feed)
        │   │   ├── Activități (All Events)
        │   │   ├── Activitățile Mele (My Events)
        │   │   ├── Istoric (History)
        │   │   └── Admin/Coordonare (role-conditional)
        │   │       └── ManagementNavigator (Stack)
        │   │           ├── AdminMenuScreen
        │   │           ├── ManageEventsScreen
        │   │           ├── EventFormScreen
        │   │           ├── EventParticipantsScreen
        │   │           ├── HourRequestsScreen
        │   │           ├── AssignHoursScreen
        │   │           ├── UserListScreen
        │   │           ├── UserDetailsScreen
        │   │           ├── SendNotificationScreen
        │   │           ├── PostFormScreen
        │   │           ├── ManageBadgesScreen
        │   │           ├── BadgeFormScreen
        │   │           └── StatisticsScreen
        │   │
        │   ├── EventDetailScreen (overlay)
        │   ├── CommentsScreen (overlay)
        │   ├── PublicProfileScreen (overlay)
        │   └── NotificationHistoryScreen (overlay)
        │
        ├── Profile
        ├── EditProfile (hidden from drawer)
        ├── Leaderboard
        ├── Badge Catalog
        ├── Faculty Map
        ├── Statistics (hidden from drawer)
        └── Management (hidden from drawer)
```

---

## 🧰 Tech Stack

### Frontend (`osace-mobile`)

| Technology | Version | Purpose |
|---|---|---|
| React Native | 0.81.5 | Cross-platform mobile framework |
| Expo | SDK 54 | Development platform & build service |
| React Navigation | 7.x | Drawer, Tabs, Stack navigation |
| Axios | 1.13 | HTTP client with JWT interceptors |
| Expo SecureStore | — | Secure token storage |
| Expo Notifications | — | Push notification handling |
| Expo Camera | — | QR code scanning |
| Expo Image Picker | — | Avatar & image uploads |
| React Native Calendars | — | Calendar views |
| React Native Chart Kit | — | Statistics charts |
| React Native QRCode SVG | — | QR code generation |
| React Native Reanimated | 4.1 | Animations |
| React Native Gesture Handler | 2.28 | Gestures & drawer swipe |
| Gorhom Bottom Sheet | 5.2 | Modal bottom sheets |
| React Native Toast Message | — | In-app toast notifications |
| date-fns | 4.1 | Date formatting & manipulation |
| jwt-decode | 4.0 | Client-side JWT decoding |

### Backend (`osace-api`)

| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| PostgreSQL (pg) | Relational database |
| JSON Web Tokens (jsonwebtoken) | Authentication & authorization |
| Argon2 | Password hashing |
| Nodemailer + Brevo SMTP | Transactional emails (welcome, password reset) |
| Multer | File upload handling (avatars, post images) |
| OTPLib | TOTP-based dynamic QR codes |
| CORS | Cross-origin request handling |
| dotenv | Environment configuration |

---

## 📁 Project Structure

```
osace-project/
├── osace-mobile/                    # React Native mobile app
│   ├── App.js                       # Entry point & provider hierarchy
│   ├── index.js                     # Expo/RN registration
│   ├── app.json                     # Expo configuration
│   ├── package.json                 # Dependencies
│   └── src/
│       ├── assets/                  # Images & icons
│       │   └── osace.png            # App icon/logo
│       ├── components/              # Shared/reusable components
│       │   ├── FilterModal.js       # Event filter modal
│       │   ├── FullScreenLoading.js # Loading overlay
│       │   ├── SkeletonItem.js      # Skeleton loading placeholder
│       │   ├── ThemeToggleSwitch.js  # Dark mode toggle
│       │   ├── forms/               # Form components
│       │   └── layout/              # Layout components (ScreenContainer)
│       ├── constants/
│       │   ├── theme.js             # Light & dark color palettes
│       │   ├── useThemeColor.js     # Theme context & provider
│       │   └── permissions.js       # Permission key constants
│       ├── features/                # Feature-based modules
│       │   ├── Auth/                # Authentication
│       │   │   ├── AuthContext.js    # Auth state & JWT management
│       │   │   ├── PermissionContext.js  # Permission checking
│       │   │   └── screens/         # Login, Register, Onboarding, etc.
│       │   ├── Home/                # Main events listing
│       │   ├── Event/               # Event detail, my events, QR scan
│       │   ├── Feed/                # News feed with likes & comments
│       │   │   ├── components/      # PostCard, FeedSkeleton
│       │   │   └── screens/         # NewsFeedScreen, CommentsScreen
│       │   ├── History/             # Participation history
│       │   ├── Profile/             # User profile
│       │   │   ├── components/      # ProfileHeader, ProfileStats, BadgeList
│       │   │   └── screens/         # ProfileScreen, EditProfile, PublicProfile
│       │   ├── Leaderboard/         # Volunteer rankings
│       │   ├── BadgeCatalog/        # Achievement browser
│       │   ├── Map/                 # Interactive faculty map
│       │   ├── Notifications/       # Notification history
│       │   └── Admin/               # Admin & coordinator panel
│       │       ├── components/      # QrModal, ManageTeamModal, etc.
│       │       └── screens/         # 13 management screens
│       ├── navigation/
│       │   ├── AppTabs.js           # Bottom tab navigator
│       │   ├── CoreAppNavigator.js  # Core stack with overlay screens
│       │   ├── MainDrawer.js        # Side drawer navigator
│       │   ├── ManagementNavigator.js  # Admin/coordinator stack
│       │   └── components/          # CustomDrawerContent
│       └── services/
│           └── api.js               # Axios instance & interceptors
│
├── osace-api/
│   └── osace-api/                   # API server root
│       ├── index.js                 # Express entry point & middleware
│       ├── .env                     # Environment variables
│       └── src/
│           ├── config/
│           │   ├── db.js            # PostgreSQL connection pool
│           │   ├── mailer.js        # Nodemailer transport config
│           │   └── multer.js        # File upload configuration
│           ├── features/            # Feature-based route modules
│           │   ├── Auth/
│           │   │   └── auth.routes.js       # Register, login, password reset
│           │   ├── Profile/
│           │   │   └── profile.routes.js    # Profile CRUD, avatar, push tokens
│           │   ├── Event/
│           │   │   ├── event.routes.js      # Event CRUD, attendance, QR, teams
│           │   │   └── event.queries.js     # Reusable SQL queries
│           │   ├── Admin/
│           │   │   ├── admin.routes.js      # User mgmt, hours, stats, notifications
│           │   │   └── admin.queries.js     # Admin SQL queries
│           │   ├── Posts/
│           │   │   ├── posts.routes.js      # Feed posts, likes, comments
│           │   │   └── components/          # Post-related components
│           │   ├── Badge/
│           │   │   ├── badge.routes.js      # Badge API endpoints
│           │   │   └── badge.service.js     # Badge awarding logic (40+ badges)
│           │   ├── Leaderboard/
│           │   │   └── leaderboard.routes.js  # Rankings endpoint
│           │   └── Notifications/
│           │       └── notifications.routes.js  # Notification endpoints
│           ├── middleware/           # (Reserved for custom middleware)
│           └── scripts/
│               ├── checkoutWorker.js   # Auto-checkout background job
│               └── badgeWorker.js      # Scheduled badge awarding
│
└── osace-map/                       # Faculty map design assets
    └── osace-map/
        ├── plans/                   # Floor plan files
        ├── *.ai                     # Adobe Illustrator source files
        └── harta_test.svg           # SVG test export
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **PostgreSQL** (v15+)
- **Expo CLI** — `npm install -g expo-cli`
- **EAS CLI** (for builds) — `npm install -g eas-cli`
- **Android Studio** or **Xcode** (for native development builds)

### Backend Setup

```bash
# 1. Navigate to the API directory
cd osace-api/osace-api

# 2. Install dependencies
npm install

# 3. Configure environment variables
#    Edit the .env file with your PostgreSQL credentials, JWT secret,
#    and SMTP configuration (Brevo/Sendinblue)

# 4. Ensure PostgreSQL is running with the required database
#    Database: osace_dev_db (or as configured in .env)

# 5. Start the server
node index.js
# Server starts at http://localhost:3000
```

### Frontend Setup

```bash
# 1. Navigate to the mobile app directory
cd osace-mobile

# 2. Install dependencies
npm install

# 3. Update the API URL in src/services/api.js if needed
#    Default: https://api.osace.ro

# 4. Start the Expo development server
npx expo start

# 5. Run on device/emulator
npx expo run:android    # For Android
npx expo run:ios        # For iOS
```

### Environment Variables (`.env`)

| Variable | Description |
|---|---|
| `DB_USER` | PostgreSQL username |
| `DB_HOST` | PostgreSQL host |
| `DB_DATABASE` | Database name |
| `DB_PASSWORD` | Database password |
| `DB_PORT` | PostgreSQL port (default: 5432) |
| `JWT_SECRET` | Secret key for JWT signing |
| `EXPO_ACCESS_TOKEN` | Expo push notification token |
| `SMTP_HOST` | SMTP server host (Brevo) |
| `SMTP_PORT` | SMTP port (587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |

---

## 📡 API Reference

Base URL: `https://api.osace.ro`

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register a new volunteer |
| POST | `/api/auth/login` | — | Login & receive JWT |
| POST | `/api/auth/request-reset` | — | Request password reset (sends 6-digit code via email) |
| POST | `/api/auth/perform-reset` | — | Reset password with verification code |

### Profile

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/profile/me` | 🔒 Token | Get current user profile |
| PUT | `/api/profile/me` | 🔒 Token | Update profile details |
| POST | `/api/profile/avatar` | 🔒 Token | Upload profile avatar |
| POST | `/api/profile/push-token` | 🔒 Token | Register Expo push token |

### Events

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/events` | 🔒 Token | List all events |
| GET | `/api/events/:id` | 🔒 Token | Get event details |
| POST | `/api/events` | 🔒 Manager | Create a new event |
| PUT | `/api/events/:id` | 🔒 Manager | Update an event |
| DELETE | `/api/events/:id` | 🔒 Manager | Delete an event |
| POST | `/api/events/:id/register` | 🔒 Token | Register for an event |
| POST | `/api/events/:id/check-in` | 🔒 Token | Check in via QR scan |
| POST | `/api/events/:id/check-out` | 🔒 Token | Check out via QR scan |
| GET | `/api/events/my-access` | 🔒 Token | Get user's permissions & team events |

### Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/users` | 🔒 Admin | List all users |
| PUT | `/api/admin/users/:id/role` | 🔒 Admin | Change user role |
| GET | `/api/admin/hour-requests` | 🔒 Manager | Get pending hour requests |
| PUT | `/api/admin/hour-requests/:id` | 🔒 Manager | Approve/reject hour request |
| POST | `/api/admin/notifications` | 🔒 Admin | Send push notification |
| GET | `/api/admin/statistics` | 🔒 Manager | Get organisation statistics |

### Posts (Feed)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/posts` | 🔒 Token | Get news feed posts |
| POST | `/api/posts` | 🔒 Manager | Create a new post |
| POST | `/api/posts/:id/like` | 🔒 Token | Like/unlike a post |
| POST | `/api/posts/:id/comments` | 🔒 Token | Add a comment |

### Badges & Leaderboard

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/badges` | 🔒 Token | Get badge catalog |
| GET | `/api/leaderboard` | 🔒 Token | Get volunteer rankings |

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | 🔒 Token | Get notification history |

> **Auth Legend:**  
> — = Public (no auth required)  
> 🔒 Token = Requires valid JWT  
> 🔒 Manager = Requires `admin` or `coordonator` role  
> 🔒 Admin = Requires `admin` role only

---

## 🔐 Role-Based Access Control

The platform implements a three-tier role system with a hybrid permission model:

### Role Hierarchy

```
┌──────────────────────────────────────────────┐
│                   ADMIN                       │
│  Full unrestricted access to everything       │
├──────────────────────────────────────────────┤
│               COORDONATOR                     │
│  Access based on:                             │
│  • Global permissions (set by admin)          │
│  • Event-level permissions (creator/team)     │
├──────────────────────────────────────────────┤
│                   USER                        │
│  Standard volunteer access                    │
│  View events, register, check-in, view feed   │
└──────────────────────────────────────────────┘
```

### Global Permissions (Assigned to Coordinators)

| Key | Description |
|---|---|
| `CAN_CREATE_EVENTS` | Create new events |
| `CAN_EDIT_EVENTS` | Edit any event |
| `CAN_DELETE_EVENTS` | Delete any event |
| `CAN_SCAN_QR_ANYWHERE` | Scan QR codes for any event |
| `CAN_MANAGE_PARTICIPANTS` | Manage participants on any event |
| `CAN_MANAGE_EVENT_TEAMS` | Manage event teams |

### Event-Level Permissions

- **Event Creator** — Full control over their own event (edit, delete, scan, manage participants)
- **Team Members** — Can scan QR, edit event, and manage participants for events they're assigned to

---

## 🏆 Gamification & Badge System

The platform features an extensive badge/achievement system with **40+ badges** to keep volunteers engaged:

### Badge Categories

| Category | Examples | Trigger |
|---|---|---|
| **Event Milestones** | First Event, 25/50/100 Events | On attendance confirmation |
| **Hour Milestones** | 1 Hour, 10/25/50/100/250/500 Hours | On attendance confirmation |
| **Category-Specific** | 5/20 Meetings, Social Events, Projects | On attendance confirmation |
| **Category Hours** | 25 Hours in Meetings/Social/Projects | On attendance confirmation |
| **Streaks** | Perfect Streak 3, Perfect Streak 10 | On attendance confirmation |
| **Time-Based** | Night Owl (events ending 00:00-05:00), Early Bird (before 09:00) | On attendance confirmation |
| **Weekly/Monthly** | 5 Events in a Month, 10/20 Hours in a Week | On attendance confirmation |
| **Speed** | Quick Register (within 1 hour of event creation) | On event registration |
| **Social** | First Like, 25 Likes, First Comment, 25 Comments | On like/comment |
| **Profile** | Avatar Uploaded, Profile Edited, Viewed Profile | On profile actions |
| **Membership** | 1 Year Member, 3 Year Member | Badge worker (scheduled) |
| **Achievement** | Leaderboard Top 1 (weekly winner) | Badge worker (Sunday) |
| **Diversity** | Diversified (participated in all categories) | On attendance confirmation |
| **Special** | First QR Scan (TOTP), Promoted to Coordinator | On specific actions |

---

## ⚙ Background Workers

### Checkout Worker (`checkoutWorker.js`)
- **Schedule:** Runs every 30 minutes (started with the server)
- **Purpose:** Auto-checks out volunteers who forgot to scan out after an event ended more than 48 hours ago
- **Behaviour:**
  1. Finds all `checked_in` attendances where the event ended 48+ hours ago
  2. Closes the attendance with `awarded_hours = 0` and `checkout_method = 'auto'`
  3. Creates an `hour_request` (type: `forgot_checkout`) so coordinators can review and manually award the correct hours

### Badge Worker (`badgeWorker.js`)
- **Schedule:** Standalone script (designed for cron job execution)
- **Purpose:** Awards time-based badges that can't be triggered by user actions
- **Checks:**
  1. **Anniversary badges** — Awards `1_YEAR_MEMBER` and `3_YEAR_MEMBER` based on account age
  2. **Leaderboard winner** — Awards `LEADERBOARD_TOP_1` to the #1 ranked volunteer (runs only on Sundays)

---

## 🗄 Database Schema (Inferred)

Key tables used throughout the application:

| Table | Description |
|---|---|
| `users` | User accounts with roles, credentials, and profile data |
| `events` | Volunteer events/activities with scheduling and metadata |
| `event_attendance` | Tracks registrations, check-ins, check-outs, and awarded hours |
| `hour_requests` | Requests for manual hour review (auto-checkout, manual requests) |
| `badges` | Badge definitions (key, name, description, icon) |
| `user_badges` | Junction table for awarded badges |
| `posts` | News feed posts with content and images |
| `post_likes` | Post like tracking |
| `post_comments` | Post comments |
| `notifications` | Push notification history |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Copyright (c) 2026 O.S.A.C.E. - Organizaţia Studenţilor din Facultatea de Automatică, Calculatoare şi Electronică
Developed and authored by Rece George Cătălin.
All Rights Reserved.

This source code is public strictly for educational and portfolio purposes.
Copying, modifying, distributing, or using this code or any part of it commercially (including publishing on app stores) is not permitted without the explicit, written consent of the author.

---

<p align="center">
  Built with ❤️ by the <strong>O.S.A.C.E.</strong> team
</p>
