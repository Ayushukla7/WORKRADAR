# WorkRadar — Predictive Task & Workforce Management Platform

> **Core Value Proposition**: *"Don't tell the manager that a task is late. Tell them that it is likely to become late."*

WorkRadar is a production-quality predictive workforce management platform built on the MERN stack (MongoDB, Express, React, Node.js) and Tailwind CSS. Unlike traditional task boards (Trello/Jira clones), WorkRadar monitors schedule velocity pace, dependency graphs, active blockers, and employee capacity to calculate real-time **Delay Risk Scores (0–100)** and generate actionable diagnostic explanations before deadlines expire.

---

## Key Features

### 1. 🚨 Predictive Delay Risk Engine
- **Mathematical 0-100 Risk Score**: Evaluates pace deficit, time proximity, priority multipliers, blocker status, prerequisite completion, and assignee workload.
- **Human-Readable Explanations**: Generates specific diagnostic reasons (e.g. *"Progress (30%) is 40% behind expected pace (70%)"*, *"API dependency is incomplete"*, *"Assignee is overloaded at 140% capacity"*).
- **Targeted Recommendations**: Advises managers on actionable steps (e.g. *"Resolve API blocker or consider reassigning sub-tasks to Rahul"*).

### 2. 📊 Workload Capacity Analytics
- Calculates active task effort hours against weekly capacity.
- Displays visual workload distribution charts (Recharts) with overload threshold indicators (> 100%).
- Warns managers when assigning a new task would overload an employee beyond capacity.

### 3. 🎯 Manager Executive Command Center & Risk Center
- **Dashboard**: Real-time KPI counters (Total Active, Completed, At-Risk, Active Blockers, Project Health) answering *"What needs my attention?"*.
- **Risk Center**: Dedicated page sorting tasks by highest delay risk score with instant diagnostic inspectors.
- **Projects & Tasks Portfolio**: Full CRUD for projects, tasks, priorities, dependencies, and employee assignment.

### 4. 👩‍💻 Employee Workspace
- **My Tasks & Dashboard**: Quick progress updates via sliders, task status updates, and personal workload overview.
- **Blocker Logging System**: Mark tasks `BLOCKED` with detailed reasons and category classification (Dependency, Technical, Manager Approval, External, etc.).
- **Deadline Extension Requests**: Submit structured extension requests with reasons for manager approval/rejection.

### 5. 🔔 Real-time In-App Notifications & Comments
- Automated alerts for high-risk warnings, blocker events, and deadline extension approvals.
- Task discussion comment threads.

---

## How the Delay Risk Engine Works

The Delay Risk Engine (`server/services/riskEngine.js`) calculates a **Risk Score (0–100)** divided into four severity tiers:
- 🟢 **LOW RISK** (0 – 34): On track with expected schedule velocity.
- 🟡 **MEDIUM RISK** (35 – 64): Minor pace deficit or upcoming deadline.
- 🔴 **HIGH RISK** (65 – 84): Significant schedule delay, dependency block, or overload.
- 🚨 **CRITICAL RISK** (85 – 100): Overdue or severely blocked critical task.

### Scoring Calculation Formula:
$$\text{Expected Progress \%} = \min\left(100, \frac{\text{Time Elapsed}}{\text{Total Allocated Duration}} \times 100\right)$$
$$\text{Pace Deficit} = \max(0, \text{Expected Progress \%} - \text{Current Progress \%})$$
$$\text{Pace Score} = \min(40, \text{Pace Deficit} \times 0.65)$$

1. **Pace Delta (Max 40 pts)**: Penalizes tasks falling behind their expected progress curve.
2. **Active Blockers (Max 25 pts)**: Adds 25 points if task status is `BLOCKED` or flagged by an employee.
3. **Incomplete Dependencies (Max 20 pts)**: Adds 10 points for each prerequisite task still incomplete.
4. **Time Urgency & Overdue (Max 35 pts)**: Adds 35 points if deadline has expired, or 15 points if < 48 hours remain with < 60% progress.
5. **Assignee Overload (Max 10 pts)**: Adds 10 points if assignee active workload > 115% capacity.
6. **Priority Multiplier (Max 10 pts)**: `CRITICAL` (+10 pts), `HIGH` (+7 pts), `MEDIUM` (+3 pts).

---

## Tech Stack & Architecture

- **Frontend**: React 18, Vite, Tailwind CSS v3, Lucide React Icons, Recharts, React Router v6, Axios
- **Backend**: Node.js, Express.js REST API
- **Database**: MongoDB with Mongoose ODM (includes `mongodb-memory-server` automatic fallback for zero-config setup)
- **Security**: JWT (JSON Web Tokens), bcryptjs password hashing, protected route guards, role authorization (`MANAGER`, `EMPLOYEE`)

---

## Project Structure

```
WORKRADAR/
├── server/
│   ├── index.js               # Express application entry point
│   ├── seed.js                # Database seed script with demo data
│   ├── config/
│   │   └── db.js              # Mongoose DB setup + Memory Server fallback
│   ├── models/                # User, Project, Task, Notification, Comment, Extension
│   ├── controllers/           # Auth, Project, Task, Workload, Risk, Extension, Notification
│   ├── services/
│   │   ├── riskEngine.js      # Rules-based Delay Risk Engine formula
│   │   └── workloadEngine.js  # Capacity calculation engine
│   └── routes/                # Express REST API endpoint definitions
│
└── client/
    ├── vite.config.js         # Vite configuration with API proxy
    ├── tailwind.config.js     # Tailwind configuration with SaaS risk palettes
    └── src/
        ├── App.jsx            # React Router & Auth Provider setup
        ├── services/api.js    # Axios client with JWT interceptor
        ├── context/AuthContext.jsx # Global user session & auth state
        ├── components/
        │   ├── common/        # Navbar, Sidebar
        │   ├── layout/        # AppLayout, ProtectedRoute
        │   └── risk/          # RiskScoreBadge, RiskBreakdownCard
        └── pages/
            ├── public/        # LandingPage, Login, Signup
            ├── manager/       # Dashboard, RiskCenter, Projects, Tasks, Workload, Extensions, Team
            └── employee/      # Dashboard, MyTasks, MyWorkload
```

---

## Demo Credentials

You can log in instantly using the demo credentials created by the seed script:

### 1. Manager Account (Sarah Connor - VP of Engineering)
- **Email**: `manager@workradar.io`
- **Password**: `Password123!`

### 2. Employee / Developer Account (Ayush Sharma - Senior Dev)
- **Email**: `ayush@workradar.io`
- **Password**: `Password123!`

### 3. Employee / Developer Account (Rahul Verma - Backend Specialist)
- **Email**: `rahul@workradar.io`
- **Password**: `Password123!`

---

## Getting Started & Running Locally

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Install Dependencies & Seed Database
In the root directory, run:
```powershell
# Install backend dependencies
cd server
npm install

# Run database seed script (populates demo manager, developers, projects & tasks)
node seed.js

# Install frontend dependencies
cd ../client
npm install
```

### 2. Start the Development Servers
Open two terminal windows:

**Terminal 1 (Backend REST Server)**:
```powershell
cd server
npm run dev
```
*Backend runs on `http://localhost:5000`*

**Terminal 2 (Frontend React Client)**:
```powershell
cd client
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## End-to-End Demo Scenario Walkthrough

1. Open `http://localhost:5173/login`.
2. Click **"Sarah Connor (Manager)"** quick login.
3. Observe the **Executive Command Center** highlighting:
   - *"Build Payment Processing Checkout Module — HIGH RISK (84/100)"*
4. Click on the task to inspect the **Risk Diagnostics Breakdown**:
   - Reason 1: *"Progress (30%) is 40% behind expected pace (70%)"*
   - Reason 2: *"Task is actively BLOCKED: Waiting for Stripe Webhook API Integration endpoint"*
   - Reason 3: *"1 incomplete prerequisite task: Stripe Webhook API Integration Endpoint"*
   - Reason 4: *"Assignee Ayush Sharma is overloaded at 120% capacity"*
   - Recommendation: *"Urgent: Resolve active blocker or reassign blocking dependencies."*
5. Open **Team Workload Analytics** to view capacity bars.
6. Open **Extensions** to review and approve Ayush's 3-day deadline extension request.

---

## License
MIT License — WorkRadar Platform
