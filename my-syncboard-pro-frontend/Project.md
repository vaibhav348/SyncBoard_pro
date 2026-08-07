# 🗺️ SyncBoard Pro - Frontend Progress Tracker

This document maintains the live structural progress, architectural decisions, and integration updates of the SyncBoard Pro enterprise-grade frontend workspace.

---

## 🏗️ 1. Core Architecture Blueprint
The project follows a strictly typed, layered, decoupled clean architecture using TypeScript (TS) and modern build boundaries (`verbatimModuleSyntax`) to ensure modularity and compilation speed.

```text
[API Layer (Axios)] ──> [Redux State (RTK)] ──> [Custom Hooks] ──> [UI Pages / Views]
         ▲                                                               │
         └─────────────────── [Local Storage Wrapper] ◄──────────────────┘


🚦 2. Progress Checklist & Status Matrix
⚙️ Phase 1: Foundation & Configurations (TypeScript Engine)
[x] Project Scaffolding: React + Vite + Tailwind CSS initialization.

[x] Vite Absolute Paths Setup: Path aliases configuration (@/, @components, @config, @utils, @api, @features) inside vite.config.js.

[x] Application Config (src/config/app.config.ts): Created immutable system configuration variables utilizing TypeScript's as const structural freeze.

[x] LocalStorage Utility (src/utils/localStorage.ts): Deployed a robust, type-safe JSON wrapper using TypeScript Generics (<T>) for dynamic runtime data cast controls.

[x] Network Instance (src/api/axiosInstance.ts): Established a centralized global Axios client equipped with type-only syntax (import type), automatic JWT request injection tokens, and a 401 Unauthorized self-destruct application guard.

🧠 Phase 2: Global State Management (Redux Toolkit)
[ ] Redux Store Setup: Central store configuration with typed hooks (src/features/store.ts).

[ ] Auth State Engine (src/features/auth/authSlice.ts): Dynamic slice configurations mapping user authentication payloads and user enterprise roles.

🛣️ Phase 3: Enterprise Routing Matrix
[ ] Layout Composition: Sidebar persistent templates (src/layouts/ProjectLayout.tsx).

[ ] Role Guards: Role-Based Access Control (RBAC) conditional route components.

[ ] Route Mapping: Multi-view nested router configuration wiring (src/routes/AppRoutes.tsx).

🎨 Phase 4: Page Modules & UI Composables
[ ] Auth Module: Reactive user onboard panels (Login & Registration views).

[ ] Dashboard Space: Workspace controls and runtime project decks.

[ ] Project Context: Advanced Kanban boards, scrum grids, and issue tracking boards.

📂 3. Verified Repository Folder Tree
Plaintext
src/
├── api/
│   └── axiosInstance.ts      # Global Axios interceptor stack (Strict Types)
├── components/               # Low-level atomic primitives & layout nodes
├── config/
│   └── app.config.ts         # Central read-only application settings constants
├── context/                  # Light state configurations (Theme/UI scopes)
├── features/                 # Redux Toolkit Slices (Business rules layer)
├── hooks/                    # Reusable framework-level custom hooks
├── layouts/                  # Base high-fidelity view wrappers
├── pages/                    # Complete application routed core screens
├── routes/                   # Routing configuration matrices
├── utils/
│   └── localStorage.ts       # Type-safe generic storage utility layer
├── App.tsx                   # Core App viewport routing map
└── main.tsx                  # Master application anchor bootstrap mount
🧠 4. Strategic Architecture Decisions Log
Language Selection: Replaced generic JavaScript files with strict TypeScript (.ts) implementations to ensure robust compile-time checks and eliminate typical run-time data mutations.

Module Compilation Strategy: Enforced import type paradigms on external type layers (e.g., Axios definitions) to align with Vite's tree-shaking models under explicit verbatimModuleSyntax rules, drastically lowering target production build sizing.

- [x] **Redux Store Setup:** Configured central store with structural root states and custom typed hooks inside `src/features/store.ts` and `src/hooks/storeHooks.ts`.
- [x] **Auth State Engine:** Deployed type-safe login session caching and explicit `PayloadAction` role configurations inside `src/features/auth/authSlice.ts`.

- [x] **Redux Engine Connection:** Successfully mounted the central Redux Provider wrapper inside `src/main.tsx` to bind the global state to the viewport ecosystem.

- [x] **Route Mapping (`src/routes/AppRoutes.tsx`):** Engineered integrated nested router architecture mapping public nodes and guarding private dashboard layouts via RBAC routing matrices.

- [x] **Role Guards (`src/routes/ProtectedRoute.tsx`):** Successfully engineered dynamic Role-Based Access Control (RBAC) component leveraging strict type states from the Redux frame hook layer.

### 🎨 Phase 4: Page Modules & UI Composables
- [x] **Auth Module (`src/pages/LoginPage.tsx`):** Deployed a custom slate-themed responsive panel equipped with integrated state controls mapping dynamic user mock tokens to the dispatch queue layer.


SyncBoard — Design System v1

Style: Minimal, premium, restraint-first. No gradients, no glow, no heavy shadows. Hierarchy banai jaati hai sirf whitespace + 1px borders se.
Colors: Sirf index.css ke theme tokens use hote hain — text, text-h, bg, border, accent, accent-bg. Koi hardcoded hex ya external color nahi (light/dark auto-switch ke liye zaroori).
Typography: System sans-serif (ui-sans-serif stack) headings/body ke liye, font-mono sirf labels/tags/eyebrows ke liye (uppercase, tracking-wide).
Layout language: Hairline borders (border-border), divide-x/divide-y for grids, gap-px bg-border trick for seamless grid lines, generous padding (p-6 to p-14), max-width containers (max-w-5xl).
Icons: Hand-coded inline SVG, stroke="currentColor", never external icon packs — keeps color theme-consistent automatically.
Motion: Minimal — subtle fade-up on load only, no scroll-jacking, no parallax. Respect prefers-reduced-motion.
Copy tone: Plain, confident, speaks to teams avoiding "heavy PM tools" without naming competitors. Active voice, no jargon.

chalo poora product map banate hain, taaki tumhe pata ho kahan se kahan jaana hai. Main isse 3 layers mein todunga: Public pages (login se pehle), Post-login flow (login hone ke baad pehli baar kya hota hai), aur Core app pages (jahan roz ka kaam hota hai).

1️⃣ Public Pages (koi login nahi chahiye)
PageRouteKaamHome / Landing/Tumne already bana liya — marketing, USP, pricingAuth (Login + Register)/login, /registerAlready bana liya404 Not Found*Galat URL pe friendly error page

2️⃣ Login/Register ke baad — kahan jaayega (yeh sabse zaroori part hai)
Abhi tumne hardcoded kar diya hai navigate('/dashboard') — yeh theek hai owner ke liye jiska pehle se workspace hai, lekin do situations handle karni padengi:
Login/Register Success
        │
        ▼
  Kya user ka role 'superadmin' hai?
        │
   ┌────┴────┐
  YES        NO
   │          │
   ▼          ▼
/admin   Kya yeh pehli baar register hua hai
         AND koi project nahi bana?
            │
       ┌────┴────┐
      YES        NO
       │          │
       ▼          ▼
  /onboarding  /dashboard
Matlab 3 possible destinations:
ConditionRedirect torole === 'superadmin'/admin (platform control, alag duniya)Naya owner, abhi tak koi project nahi banaya/onboardingNormal returning user/dashboard
Onboarding kyun zaroori hai: Jab koi naya register karta hai, uske paas khaali workspace hota hai — koi project nahi, koi team member nahi. Use seedha empty dashboard pe bhejna confusing hota hai ("yahan kya karu?"). Isliye ek chhota 2-step onboarding dena chahiye:
PageRouteKaamOnboarding — Create first project/onboarding"Apna pehla project banao" — sirf naam + ek default board templateOnboarding — Invite team/onboarding/invite"Team members ko invite karo" (skip option bhi do)
Iske baad seedha /dashboard.

3️⃣ Core App Pages (login ke baad ka asli kaam)
Yeh sab ek shared layout ke andar honge — left sidebar (navigation) + top bar (search, notifications, profile) hamesha fixed rahega, sirf beech ka content area change hoga. (Isko "AppLayout" component banayenge — har page isi ke andar render hoga.)
┌─────────────────────────────────────┐
│  Top bar: Search | Notifications | Profile  │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │     Page Content         │
│  - Dashboard                        │
│  - Projects                         │
│  - My Tasks                         │
│  - Team                             │
│  - Settings                         │
│          │                          │
└──────────┴──────────────────────────┘
PageRouteKaamKaun dekh sakta haiDashboard/dashboard"Mere liye kya important hai" — my open tasks, recent activity, due-soon items, project cardsSab rolesProjects List/projectsSaare projects card-grid mein, naya project create buttonSab (employee ko sirf woh dikhe jin mein woh hai)Single Project — Board view/projects/:projectIdKanban board (Backlog/In Progress/Done jaisa tumhare hero mockup mein hai) — yeh tumhara core product screen haiSab (members)Single Project — Sprint/Backlog view/projects/:projectId/backlogList view, sprint planning, prioritiesManager/Owner zyada control, employee read-mostlySingle Project — Timeline/Calendar/projects/:projectId/timelineGantt-jaisa ya calendar view, deadlinesSabTask DetailModal/drawer (URL: /projects/:projectId/task/:taskId)Task ka title, description, comments, assignee, status change, attachmentsSab (jo task assigned hai, comment kar sakte; assign sirf manager/owner)My Tasks/my-tasksSirf mujhe assign hui tasks, sabhi projects mil ke ek jagahSabTeam / Members/teamSaare members list, role badge, invite button (sirf owner/manager ko visible)Owner/Manager edit kar sakte, employee sirf dekh saktaInvite Member/team/invite ya modalEmail daal ke invite bhejna, role select karnaSirf Owner/ManagerNotifications/notifications"X ne tumhe assign kiya", "Y ne comment kiya" jaisi listSabSettings — Profile/settings/profileNaam, photo, password changeSabSettings — Workspace/settings/workspaceCompany name, logo, billing/plan infoSirf Owner

4️⃣ Superadmin ka alag world (platform-level control)
Tumhare roles mein superadmin hai — yeh workspace-level role nahi hai, yeh platform ka god-mode hai (jaise SyncBoard company ke andar internal team jo saare customers ke workspaces monitor karti hai). Yeh completely alag layout hoga, normal users ko kabhi nahi dikhega.
PageRouteKaamAdmin Dashboard/adminSaare workspaces ka overview — total signups, active usersAll Workspaces/admin/workspacesHar company/workspace list, suspend/activate kar sakteAll Users/admin/usersPlatform ke saare users, support ke liye
(Yeh abhi MVP ke liye low priority hai — pehle core app bana lo, admin baad mein.)

5️⃣ Suggested folder structure (matches your existing pattern)
src/
├── pages/
│   ├── public/
│   │   ├── Home.tsx              ✅ done
│   │   ├── AuthPage.tsx          ✅ done
│   │   └── NotFound.tsx
│   ├── onboarding/
│   │   ├── CreateFirstProject.tsx
│   │   └── InviteTeam.tsx
│   ├── app/
│   │   ├── Dashboard.tsx
│   │   ├── ProjectsList.tsx
│   │   ├── ProjectBoard.tsx
│   │   ├── ProjectBacklog.tsx
│   │   ├── MyTasks.tsx
│   │   ├── Team.tsx
│   │   ├── Notifications.tsx
│   │   ├── SettingsProfile.tsx
│   │   └── SettingsWorkspace.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       └── AdminWorkspaces.tsx
├── layouts/
│   ├── AppLayout.tsx          👈 sidebar + topbar wrapper, sab app/* pages isi mein render
│   └── AdminLayout.tsx
├── components/
│   ├── KanbanBoard/
│   ├── TaskCard.tsx
│   └── ...

6️⃣ Design elements jo har page mein repeat honge (consistency ke liye)
Same theme tokens use karke, yeh reusable components banane padenge — taaki har page alag se design na karna pade:

Sidebar.tsx — navigation links, active route highlight (border-l-2 border-accent)
TopBar.tsx — search input, notification bell icon, profile dropdown
Badge.tsx — role tags (Owner, Manager), status tags (In Progress, Done) — same font-mono uppercase style jo tumne hero mockup mein use kiya
Card.tsx — project cards, task cards — same border border-border rounded-lg pattern
Modal.tsx / Drawer.tsx — task detail kholne ke liye
EmptyState.tsx — jab koi list khaali ho ("Abhi koi project nahi hai" + create button) — design system mein already likha hai "empty screen is an invitation to act"


Suggestion: order mein banane ke liye priority
Agar tum step-by-step banana chahte ho (best learning order):

✅ Home, ✅ Auth (done)
AppLayout (sidebar + topbar) — sabse pehle, kyunki har page isi ke andar render hoga
Dashboard — simple, confidence builder
Projects List + Create Project
Project Board (Kanban) — yeh sabse complex hai (drag-drop), iske liye dnd-kit ya @hello-pangea/dnd library lagegi
Task Detail
Team / Invite
Settings
Onboarding flow (ise last mein bhi bana sakte ho, kyunki logic simple hai)

[Owner/Manager] 
    │ (Enters email & role)
    ▼
[Backend] ───► Generates secure Token ───► Sends Email via Nodemailer (with Link)
                                                    │
                                                    ▼
[User Clicks Link in Email] ◄───────────────────────┘
    │ (Opens Frontend Signup Form with pre-filled Email)
    ▼
[User Fills Password & Name] ───► [Backend Registers User & Burns Token]





-----------------------------------SCRUM_FLOW---------------------------------










Poori Hierarchy (yehi core concept hai)
Project
  └── Sprint (time-box, e.g. "Sprint 1")
        └── User Story (milestone, e.g. "User can login with Google")
              └── Task (chhota kaam, e.g. "Design login button UI")
                    └── Comments / sub-details

Sprint = time ka container (1-4 hafte)
User Story = ek feature/milestone jo user ke liye value deta hai
Task = us feature ko banane ke liye chhote-chhote kaam (ye Kanban board pe move hote hain)
Board pe Task ka status move hota hai (Todo → In-Progress → Review → Done), User Story khud "move" nahi hoti — uska progress uske andar ke tasks ke % completion se derive hota hai.

Ye bilkul waisa hi hai jaisa Jira karta hai (Epic/Story → Sub-task), bas tumne apne scale pe simplify kiya hai — Sprint seedha Story hold karti hai (koi separate Epic layer nahi), jo ek chhoti team ke liye perfect hai.

Step 1 — Scrum button click (Sidebar se)
Tumhara Sidebar.tsx me already Scrum nav item hai. Click karte hi ek dropdown panel khulega (jaisa ProjectDropdown.tsx hai, waisa hi pattern reuse karo):
┌─ Scrum ▾ ──────────────────────┐
│  📋 Backlog                     │  ← hamesha top pe, click = /project/:id/backlog
│  ─────────────────────────      │
│  Sprint 1        [planned]      │  ← agar sprint bani hui hai to yaha list
│  Sprint 2        [active]       │
│  ─────────────────────────      │
│  [+ Create new sprint]          │
└──────────────────────────────────┘
Naye project ka case (jo tumne bola): agar koi sprint nahi hai, to sirf 2 cheezein dikhengi:

Backlog link (click karke empty backlog page khulega)
+ Create new sprint button

Isi tarah tumne ProjectDropdown.tsx me loading/empty state handle kiya tha, yahan bhi wahi pattern chalega — bas data sprints list hoga.

Step 2 — Sprint ke andar kya hota hai (User Stories)
Jab manager + Create new sprint click karta hai — ek modal khulta hai (name, goal, start date, end date poochta hai) → status: 'planned' set hoke create hoti hai.
Sprint create hone ke baad, us Sprint ke andar jaake User Stories add ki jaati hain:
┌─ Sprint 1 (planned) ─────────────────────────────┐
│                                                     │
│  📖 User Story: "User can login with Google"      │
│     3 tasks · 1 done                               │
│     [+ Add task]                                   │
│                                                     │
│  📖 User Story: "Password reset flow"              │
│     0 tasks                                        │
│     [+ Add task]                                   │
│                                                     │
│  [+ Add user story]                                │
│                                                     │
│  [Start Sprint]                                    │
└─────────────────────────────────────────────────┘
Har User Story ka apna:

Title, description
(Optional) Story points, acceptance criteria
Andar list of Tasks


Step 3 — Task create/open, comments add
Task = tumhara existing Issue model hi hai (jo tumne pehle se bana rakha hai — type, priority, severity, status, assignedTo). Bas ab isme ek naya field add hoga: storyId — batata hai ki ye task kis User Story ka hissa hai.
Task pe click karte ho to detail panel/modal khulta hai jisme:

Status change (StatusDropdown — tumhare paas already hai)
Assignee change (AddMembersToIssue — already hai)
Comments section — naya add karna padega
(Optional) Sub-issues / linked bugs


Step 4 — User Story = Milestone (jaisa tumne bola, bilkul sahi)
Story khud kaam nahi karti, wo sirf grouping/tracking unit hai. Uska progress uske tasks se calculate hota hai:
Story progress = (Done tasks / Total tasks) × 100%
UI me story card pe ek chhoti progress bar dikha sakte ho — jaisa tumhare ProgressBar.tsx component already ProjectsOverview/TeamWorkload me use ho raha hai, wahi reuse ho jayega yahan.

Step 5 — Sprint "Start" hone ke baad (Active Board)
Jab manager Start Sprint click karta hai, sprint status: planned → active ho jaati hai. Ab Kanban Board page khulta hai jisme:
Sprint 1 — Active · Ends in 6 days          [Complete Sprint]

┌ Todo ──────┐ ┌ In Progress ─┐ ┌ Review ───┐ ┌ Done ─────┐
│ Task A     │ │ Task C       │ │ Task E    │ │ Task F    │
│ ↳ Story 1  │ │ ↳ Story 1    │ │ ↳ Story 2 │ │ ↳ Story 1 │
│            │ │              │ │           │ │           │
│ Task B     │ │              │ │           │ │ Task G    │
│ ↳ Story 2  │ │              │ │           │ │ ↳ Story 2 │
└────────────┘ └──────────────┘ └───────────┘ └───────────┘

Ye saari active sprint ke tasks dikhata hai (kis story ka hai, wo bhi tag ke roop me dikhta hai)
Card drag ya dropdown se status change hota hai — tumhara existing StatusDropdown logic (IssueTable.tsx) yahan directly reuse ho sakta hai
Top-right Complete Sprint button

Sprint complete hone par:

Jo tasks Done hain → wahi rehte hain (history ke liye)
Jo Done nahi hain → unka sprintId = null ho jata hai → wapas Backlog me chale jaate hain


Backend Design (models)
Naya: UserStory model
jsconst userStorySchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sprintId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', default: null }, // null = backlog story
  title:       { type: String, required: true },
  description: { type: String },
  storyPoints: { type: Number, default: 0 },
}, { timestamps: true });
Sprint model (pehle jaisa hi)
jsconst sprintSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  goal: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ['planned', 'active', 'completed'], default: 'planned' },
}, { timestamps: true });
Issue (Task) model — sirf ek field add karo
js// existing fields: title, type, status, priority, severity, assignedTo...
storyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'UserStory', default: null },
sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', default: null }, // denormalized — fast filtering ke liye

Kyun dono storyId aur sprintId task pe rakhe? Kyunki agar sirf storyId rakho, to Active Board pe tasks fetch karne ke liye tumhe pehle stories fetch karni padegi, phir unke andar tasks — 2 extra queries. sprintId ko task pe bhi denormalize kar dene se GET /task/get_by_sprint/:sprintId seedha ek query me chal jata hai. Story create/move hote waqt bas dono jagah sync kar dena (backend me handle karo).

Naya: Comment model
jsconst commentSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
}, { timestamps: true });
API Endpoints
RouteKaamPOST /sprint/createSprint banaoGET /sprint/get_all/:projectIdSaari sprints listPUT /sprint/start/:sprintIdplanned → activePUT /sprint/complete/:sprintIdactive → completed, incomplete tasks ka sprintId nullPOST /story/createUser Story banao (body: sprintId ya null for backlog)GET /story/get_by_sprint/:sprintIdUs sprint ki saari storiesGET /story/get_backlog/:projectIdsprintId: null wali storiesPOST /task/create(already hai) — bas ab storyId bhi accept karoGET /task/get_by_sprint/:sprintIdActive board ke liye — sirf us sprint ke tasksPOST /comment/createTask pe comment add karoGET /comment/get_by_task/:taskIdTask ke saare comments

Frontend Pages (naye 4 files)

ScrumDropdown.tsx — Sidebar se khulne wala dropdown (sprints list + Backlog + Create button). ProjectDropdown.tsx ka structure copy-paste karke adapt kar sakte ho.
BacklogPage.tsx — Empty state jab kuch nahi hai; jab stories hain to unki list (bina sprint ke), har ek pe "Move to sprint" dropdown.
SprintDetailPage.tsx — Ek specific sprint ke andar User Stories ki accordion list, har story ke andar tasks + "Add task" button. Yahi page "Start Sprint" button bhi dikhayega.
ActiveBoardPage.tsx — Kanban board, columns = status, cards = tasks (story tag ke saath), "Complete Sprint" button.

Aur TaskDetailModal.tsx — task click karne pe khulta hai: status, assignee, description, comments thread.

Redux Slice
tsinterface ScrumState {
  sprints: Sprint[];
  activeSprint: Sprint | null;
  stories: Record<string, UserStory[]>;      // sprintId -> stories (backlog ke liye key = 'backlog')
  tasksByStory: Record<string, Issue[]>;     // storyId -> tasks
  activeSprintTasks: Issue[];                // board ke liye flat list
}

Build Order (tumhare existing code pe based)

Backend: UserStory + Comment models banao, Issue schema me storyId/sprintId add karo. Postman se test.
ScrumDropdown.tsx — Sidebar se link karo, empty/populated state dikhao (jaisa tumne khud describe kiya).
Sprint create modal — chhota form, Modal.tsx reuse karo.
BacklogPage.tsx — pehle sirf list dikhao (empty state jaisa tumne bola).
Story create + andar Task create — SprintDetailPage.tsx me accordion UI.
Task detail modal — status/assignee (already ka logic reuse) + naya comments section.
ActiveBoardPage.tsx — Kanban columns, tumhara existing StatusDropdown/badge styling (IssueTable.tsx) seedha yahan copy ho sakta hai kyunki visual language same hai.
Complete Sprint logic — last me, backend cleanup wala part.











------------------
# Scrum Module — Complete Documentation

> **Project context:** Issue tracking, Project, Members, Team, Auth (login/logout) already built.
> **Missing piece:** Scrum module — Sprints, User Stories, Kanban Board, Comments.
> **Approach:** Backend-first, bottom-to-top. No frontend until Postman returns `200 OK`.

---

## 1. Core Concept — The Hierarchy

```
Project
  └── Sprint            (time-box, e.g. "Sprint 1", 1–4 weeks)
        └── User Story   (milestone, e.g. "User can login with Google")
              └── Task    (existing Issue model — actual work item)
                    └── Comments
```

**Key mental model:**
- **Sprint** = a time container. Only ONE sprint can be `active` per project at a time.
- **User Story** = a feature/milestone. It does NOT move on the board — it's a *grouping unit*.
- **Task** = your existing `Issue` model. THIS is what moves across the Kanban board (Todo → In-Progress → Review → Done).
- **Story progress** is derived, not stored: `(Done tasks / Total tasks) × 100%`.

**Two homes for a Task:**
| Location | Condition |
|---|---|
| Backlog | `sprintId: null` |
| Inside a Sprint | `sprintId: <sprint _id>` |

**Two homes for a User Story:**
| Location | Condition |
|---|---|
| Backlog | `sprintId: null` |
| Inside a Sprint | `sprintId: <sprint _id>` |

---

## 2. Lifecycle (end-to-end flow)

```
1. Task/Story created  →  lands in Backlog (sprintId: null)
2. Manager plans a Sprint  →  moves Stories/Tasks into it (sprintId set)
3. Manager clicks "Start Sprint"  →  status: planned → active
4. Team works on Active Board  →  drags/updates Task status (Todo→Done)
5. Manager clicks "Complete Sprint"  →  status: active → completed
     - Done tasks stay as-is (history preserved)
     - Incomplete tasks → sprintId reset to null → back to Backlog
```

---

## 3. Backend — Data Models

### 3.1 `Sprint.js`
```js
const sprintSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name:      { type: String, required: true },        // "Sprint 1"
  goal:      { type: String },                          // optional objective
  startDate: { type: Date },
  endDate:   { type: Date },
  status:    { type: String, enum: ['planned', 'active', 'completed'], default: 'planned' },
}, { timestamps: true });
```

### 3.2 `UserStory.js` (new)
```js
const userStorySchema = new mongoose.Schema({
  projectId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sprintId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', default: null }, // null = backlog
  title:       { type: String, required: true },
  description: { type: String },
  storyPoints: { type: Number, default: 0 },
  position:    { type: Number, default: 0 },   // for future drag-and-drop ordering
}, { timestamps: true });
```

### 3.3 `Issue.js` (Task) — add these fields to existing schema
```js
// ...existing fields: title, type, status, priority, severity, assignedTo, votes, etc.
storyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'UserStory', default: null },
sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', default: null }, // denormalized
position: { type: Number, default: 0 },   // for future drag-and-drop ordering
```

> **Why `sprintId` on both Task AND Story (denormalization)?**
> If only `UserStory` had `sprintId`, fetching the Active Board would require 2 queries: fetch stories for the sprint → then fetch tasks for each story. By denormalizing `sprintId` onto `Issue` directly, `GET /task/get_by_sprint/:sprintId` becomes a single flat query. Just make sure that whenever a Story's `sprintId` changes, you sync all its child tasks' `sprintId` too (do this in the backend controller, not the frontend).

### 3.4 `Comment.js` (new)
```js
const commentSchema = new mongoose.Schema({
  taskId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:     { type: String, required: true },
}, { timestamps: true });
```

---

## 4. Backend — API Endpoints

### Sprint
| Method | Route | Purpose |
|---|---|---|
| POST | `/sprint/create` | Create sprint (`status: planned`) |
| GET | `/sprint/get_all/:projectId` | All sprints for a project |
| PUT | `/sprint/start/:sprintId` | `planned → active` |
| PUT | `/sprint/complete/:sprintId` | `active → completed` + backlog cleanup |

**`start` route — critical validation:**
```js
// Before setting status: 'active', check:
const existingActive = await Sprint.findOne({ projectId, status: 'active' });
if (existingActive) {
  return res.status(400).json({ message: 'A sprint is already active' });
}
```

**`complete` route — cleanup logic:**
```js
// After setting status: 'completed':
await Issue.updateMany(
  { sprintId, status: { $ne: 'Done' } },
  { $set: { sprintId: null } }
);
// Done issues keep their sprintId (history preserved)
```

### User Story
| Method | Route | Purpose |
|---|---|---|
| POST | `/story/create` | Create story (`sprintId` optional — null = backlog) |
| GET | `/story/get_by_sprint/:sprintId` | Stories inside a specific sprint |
| GET | `/story/get_backlog/:projectId` | Stories with `sprintId: null` |
| PUT | `/story/update/:storyId` | Update story (e.g., move to a sprint) |

### Task (extends existing Issue routes)
| Method | Route | Purpose |
|---|---|---|
| POST | `/task/create` | (already exists) — now also accepts `storyId` |
| GET | `/task/get_by_sprint/:sprintId` | Tasks for Active Board (flat, fast query) |
| GET | `/task/get_by_story/:storyId` | Tasks under one story (for Sprint Detail accordion) |
| PATCH | `/task/update_task/:issueId` | (already exists) — now also accepts `sprintId`, `storyId` |

### Comment
| Method | Route | Purpose |
|---|---|---|
| POST | `/comment/create` | Add comment to a task |
| GET | `/comment/get_by_task/:taskId` | Fetch comments thread |

---

## 5. Frontend — Pages & Components

| File | Purpose |
|---|---|
| `ScrumDropdown.tsx` | Opens from Sidebar "Scrum" link. Lists sprints + "Backlog" link + "Create new sprint" button. Empty state if no sprints exist. |
| `CreateSprintModal.tsx` | Form: name, goal, start date, end date → `POST /sprint/create` |
| `BacklogPage.tsx` | Lists backlog stories (empty state initially). "Add Story" button. |
| `SprintDetailPage.tsx` | Accordion of User Stories inside a sprint, each expandable to show its Tasks. "Add task" per story. "Start Sprint" button here. |
| `ActiveBoardPage.tsx` | Kanban board (Todo/In-Progress/Review/Done columns), fed by `GET /task/get_by_sprint/:activeSprintId`. "Complete Sprint" button. Reuses `StatusDropdown` logic from your existing `IssueTable.tsx`. |
| `TaskDetailModal.tsx` | Opens on task click: status, assignee (reuse `AddMembersToIssue`), description, **Comments thread** (new). |

**Reuse from your existing codebase (don't rebuild):**
- `StatusDropdown` (from `IssueTable.tsx`) → same badge styles work on Kanban cards
- `AddMembersToIssue.tsx` → assignee picker inside `TaskDetailModal`
- `ProgressBar.tsx` (from dashboard) → story completion %
- `Modal.tsx` (from `Invite/`) → wrap `CreateSprintModal`
- `ProjectDropdown.tsx` structure → copy pattern for `ScrumDropdown.tsx`

---

## 6. Frontend — Redux Slice

```ts
interface ScrumState {
  sprints: Sprint[];
  activeSprint: Sprint | null;
  stories: Record<string, UserStory[]>;   // key: sprintId, 'backlog' for null-sprint stories
  tasksByStory: Record<string, Issue[]>;  // key: storyId
  activeSprintTasks: Issue[];             // flat list for Active Board
  loading: boolean;
  error: string | null;
}
```

Follow the same `start/success/failure` action pattern as your existing `activeProjectSlice`.

---

## 7. Two Architecture Enhancements (confirmed good additions)

1. **Only-one-active-sprint rule** — enforced in `PUT /sprint/start/:sprintId` (see §4 above). Returns `400` if another sprint is already active for that project.
2. **`position: Number` field** on both `UserStory` and `Issue` — not used yet, but required later for drag-and-drop reordering (`@hello-pangea/dnd`). Adding it now avoids a migration later.

---

## 8. The 4-Phase Build Plan

### Phase 1 — Backend Foundation (Day 1)
1. Update `Issue.js`: add `storyId`, `sprintId`, `position`.
2. Create `Sprint.js` and `UserStory.js` models.
3. Build 4 basic CRUD APIs only (no start/complete logic yet):
   - `POST /sprint/create`
   - `GET /sprint/get_all/:projectId`
   - `POST /story/create`
   - `GET /story/get_backlog/:projectId`
4. **Test in Postman**: create a dummy Sprint and a dummy Backlog Story inside a real Project. Confirm data saves and fetches correctly.

✅ **Exit criteria:** `200 OK` on all 4 routes with real data in MongoDB.

### Phase 2 — Frontend Redux Setup (Day 2)
1. Create `scrumSlice.ts` with the interface from §6.
2. Set up axios calls (or thunks) to fetch Sprints and Backlog Stories from the Phase 1 APIs.

✅ **Exit criteria:** Redux DevTools shows sprints/stories populated after dispatching fetch actions.

### Phase 3 — Entry Point UI (Day 3)
1. Add "Scrum" link in `Sidebar.tsx` (you likely already have a placeholder for this).
2. Build `ScrumDropdown.tsx` — map Redux sprints list; show empty state ("+ Create new sprint") if none exist.
3. Build `CreateSprintModal.tsx` — form → `POST /sprint/create` → refresh dropdown.

✅ **Exit criteria:** Clicking "Scrum" shows a working dropdown; creating a sprint updates the list live.

### Phase 4 — Core Pages (Day 4+)
1. `BacklogPage.tsx` — full empty state, then "Add Story" button.
2. `SprintDetailPage.tsx` — accordion of stories → tasks inside each.
3. `ActiveBoardPage.tsx` — Kanban board (built last, since it needs an active sprint + tasks to already exist).
4. `TaskDetailModal.tsx` with Comments — build alongside or right after the board.
5. Wire up `PUT /sprint/start` and `PUT /sprint/complete` (with the validation/cleanup logic from §4).

✅ **Exit criteria:** Full loop works — create sprint → add story → add task → start sprint → move task on board → complete sprint → incomplete tasks return to backlog.

---

## 9. Edge Cases to Remember

- **Sprint start**: reject if another sprint in the same project is already `active`.
- **Sprint complete**: only non-`Done` tasks get `sprintId: null`; `Done` tasks keep their sprint reference for historical reporting.
- **New task default**: always create with `sprintId: null` and `storyId: null` unless explicitly assigned — ensures it lands in Backlog by default.
- **Story deletion**: decide policy — either block deletion if it has tasks, or cascade-null the `storyId` on its tasks (recommend the latter for MVP simplicity).
- **Story moved between sprints**: when a Story's `sprintId` changes, sync all its child tasks' `sprintId` in the same backend transaction/call.

---

## 10. What NOT to build yet (defer to "polish" phase)

- Drag-and-drop (`@hello-pangea/dnd`) — dropdowns/selects work fine for MVP.
- Story points velocity charts / burndown charts.
- Real-time sync (sockets) — polling or manual refresh is fine initially.

Build the dropdown-based flow completely first. Drag-and-drop is a UI swap on top of already-working state logic, not a prerequisite for it.

📝 Scrum Module - Backend API DocumentationYeh document tumhare Project Management Tool ke Scrum Engine (Phase 1 to 5) ki poori functional workflow, API endpoints, validations aur critical database logic ko cover karta hai.🏗️ Architecture & Data HierarchyHamara system ek 4-tier deep strict parent-child relational architecture follow karta hai jise MongoDB mein highly performance-efficient banaya gaya hai:$$\text{Project} \longrightarrow \text{Sprint} \longrightarrow \text{User Story} \longrightarrow \text{Task} \longleftrightarrow \text{Comments / Issues}$$🛡️ Global Auth & Multitenancy RulesMultitenancy Isolation: Har Task aur Issue automatic parent elements aur logged-in user se companyId aur projectId inherit karta hai. Ek company ka employee dusri company ka data kabhi nahi dekh sakta.Role Based Access Control (RBAC):owner / manager ke paas full administrative control hai (Create, Delete, Sprint Management).employee sirf unhe assigned tasks ka status change kar sakta hai aur comments add/edit kar sakta hai.🚀 API Endpoints Summary1. Sprint Management (/api/sprint)Sprints lifecycle control karne ka engine hai.PUT /api/sprint/start/:sprintIdRole Restriction: Owner/Manager only.Critical Logic: Check karta hai ki is specific project mein pehle se koi aur sprint active toh nahi hai. Ek samay par ek hi sprint active ho sakti hai.Response (200): Sprint status turns active, sets startDate = new Date().2. User Story Management (/api/story)Backlog aur Sprints ke beech cards grouping handle karta hai.POST /api/story/createZod Payload Validation: projectId, title, description, storyPoints, sprintId (Optional/Null for Backlog).Logic: Agar sprintId diya hai toh validation verify karega ki sprint exist karti hai ya nahi.GET /api/story/get_backlog/:projectIdLogic: Woh saari user stories fetch karta hai jinka sprintId: null hai, indexed by automatic position.GET /api/story/get_by_sprint/:sprintIdDynamic Denormalization Metrics: Sirf story data nahi bhejta, balki runtime par har story ke liye totalTasks aur doneTasks ka count aggregate karke bhejta hai taaki frontend progress bar smoothly render ho sake.PUT /api/story/move_to_sprint/:storyIdPayload: {"sprintId": string | null}Critical Trans-Sync Logic: Jab ek story backlog se sprint mein ya ek sprint se dusre sprint mein jaati hai, toh data leakage bachane ke liye yeh function iske under aane wale saare child Tasks ka sprintId automatically bulk-update (updateMany) kar deta hai.TypeScript Cast: URL param aur body string ko safely strict mongoose.Types.ObjectId mein badalta hai type conflict se bachne ke liye.DELETE /api/story/delete/:storyIdCascade Deletion: Story delete hone par uske saare child Tasks mass-delete ho jaate hain, aur un tasks se link bugs/issues ka taskId un-link (null) ho jata hai.3. Task Kanban Engine (/api/task)Kanban board par cards manipulate karne ka main core controller.POST /api/task/createZod Payload: storyId, title, description, priority, assignedTo.Auto-Inheritance Logic: Developer ko body mein projectId ya companyId bhejne ki zaroorat nahi hai. Controller parent story se projectId aur sprintId, aur user token se companyId nikaal kar task automatically create karta hai.Positioning: Ek story ke andar automatic incremented position index index set karta hai drag-and-drop sorting ke liye.GET /api/task/get_by_sprint/:sprintIdKanban View Query: Pure sprint board par column-wise grid render karne ke liye saare tasks fetch karta hai with fully populated user profiles (name, email, role).PATCH /api/task/update/:taskIdStrict Permission Gatekeeper:Agar user owner/manager hai ➔ Full modification allowed (Title, description, assignee, priority, position).Agar user employee hai aur task use assigned hai ➔ Woh sirf aur sirf status ("Todo" | "In-Progress" | "Review" | "Done") update kar sakta hai. Baki fields touch karne par 403 Forbidden milega.4. Task Collaboration Comments (/api/task-comment)Developers ke beech internal micro-chat/discussions handle karne ke liye.POST /api/task-comment/createPayload: {"taskId": "...", "content": "..."}User Tracking: Auth token se user id utha kar model ke userId field mein track karta hai.GET /api/task-comment/get_by_task/:taskIdSorting: Oldest comments first (createdAt: 1) taaki message history sequential chat format mein dikhe.PATCH /api/task-comment/update/:commentId & DELETE /api/task-comment/delete/:commentIdOwnership Guard: Kisi ka comment koi aur edit nahi kar sakta. Delete sirf comment author ya company manager/owner hi kar sakte hain.5. Issue & Bug Hybrid Tracker (/api/issue)Bugs tracking jo bina kisi task ke (Independent project level) ya fir kisi specific sub-task ke under link ho sakti hain.POST /api/issue/createZod Custom Parsing: Schema ab explicitly taskId aur sprintId ko intercept karta hai.Safe Casting Constraint: Agar Postman se payload mein taskId aur sprintId aa rahe hain, toh unhe Mongoose object IDs mein transform karta hai, aur agar missing hain toh strict validation failures/null checks se bachne ke liye unhe gracefully raw undefined chhod deta hai.GET /api/issue/get_by_task/:taskIdTask details modal kholte hi usse jude saare critical bugs nikaalne ke liye utility query.🛠️ Data Sanitize & Validation Sample (Zod Blueprint)Backend data integrity ko badhane ke liye har input layer ko validate kiya gaya hai. Example Task Schema validation rule:TypeScriptconst UpdateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["Todo", "In-Progress", "Review", "Done"]).optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
  assignedTo: z.string().nullable().optional(),
  position: z.number().optional()
});
Status: Fully Tested & Complete 🚀Backend Dev Note: Sabhi controllers Postman ke zariye data constraints, authorization checks, aur cascade processes ke liye thoroughly verify ho chuke hain. Ready for Frontend Integration Stage!







----------------------frontend for scrum---------------------




## Scrum Module — Complete Frontend UI Plan

Pehle samjho **role se UI kaise alag hogi**:

```
Owner/Manager    → Full control (create sprint, move stories, assign tasks)
Employee         → Sirf assigned tasks ka status change + comments
```

---

## Pages & Components Structure

```
src/
├── pages/app/scrum/
│   ├── BacklogPage.tsx          ← Planning screen
│   ├── ActiveBoardPage.tsx      ← Kanban board
│   └── SprintDetailPage.tsx     ← Sprint ke andar stories
│
├── components/scrum/
│   ├── ScrumDropdown.tsx        ← Sidebar se khulta hai
│   ├── CreateSprintModal.tsx    ← Sprint create form
│   ├── CreateStoryModal.tsx     ← Story create form
│   ├── CreateTaskModal.tsx      ← Task create form
│   ├── TaskDetailDrawer.tsx     ← Right-side sliding panel
│   ├── StoryCard.tsx            ← Backlog/Sprint mein story
│   ├── TaskCard.tsx             ← Kanban board ka card
│   ├── SprintAccordion.tsx      ← Sprint accordion
│   └── CommentThread.tsx        ← Task comments
```

---

## Layer 1 — Sidebar Scrum Dropdown

**`ScrumDropdown.tsx`** — Sidebar "Scrum" link pe click karne se yeh panel khulega:

```
┌─ Scrum ───────────────────────────┐
│  📋 Backlog              → /backlog│
│  ─────────────────────────────    │
│  Sprint 1   [active] ●            │  ← green dot = active
│  Sprint 2   [planned]             │
│  Sprint 3   [completed]           │
│  ─────────────────────────────    │
│  [+ New sprint]  (owner/manager)  │  ← employee ko nahi dikhega
└───────────────────────────────────┘
```

**Role behavior:**
```
Owner/Manager → "+ New sprint" button visible
Employee      → sirf list + Backlog link
```

**APIs:**
```
Mount pe: GET /api/sprint/get_all/:projectId
Button:   POST /api/sprint/create → modal khulega
```

---

## Layer 2A — Backlog Page

**Route:** `/projects/:projectId/backlog`

**Layout — 3 stacked sections:**

```
┌─────────────────────────────────────────────────────┐
│  Backlog                          [+ Create Sprint]  │
│                                   (owner/manager)    │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ▼ ACTIVE SPRINT — Sprint 1 (ends 20 Jul)            │
│  │  ┌─ Story: "User login with Google" ─────────┐   │
│  │  │  ● 3 tasks · 1 done  ████░░░ 33%          │   │
│  │  │  [+ Add task]  (owner/manager)             │   │
│  │  └────────────────────────────────────────────┘   │
│  │  [Complete Sprint]  (owner/manager)                │
│                                                       │
│  ▼ SPRINT 2 — planned                                │
│  │  [Start Sprint]  (owner/manager only)             │
│  │  ┌─ Story: "Password reset" ──────────────────┐  │
│  │  │  ● 0 tasks                                  │  │
│  │  └────────────────────────────────────────────┘  │
│  │  [+ Add story]  (owner/manager)                   │
│                                                       │
│  ▼ BACKLOG                                           │
│  │  ┌─ Story: "Profile settings" ─────────────────┐ │
│  │  │  ● 2 tasks · 0 done  ░░░░░░░ 0%             │ │
│  │  │  [Move to sprint ▾]  (owner/manager)         │ │
│  │  └────────────────────────────────────────────┘ │
│  │  ┌─ Story: "Notifications" ───────────────────┐  │
│  │  └────────────────────────────────────────────┘  │
│  │  [+ Add story]  (owner/manager)                   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

**Story Card (`StoryCard.tsx`) ke andar kya hoga:**

```
┌─────────────────────────────────────────────────────┐
│  📖 User login with Google                    [···] │  ← 3-dot menu: edit/delete
│  ████░░░ 33%   3 tasks · 1 done                     │
│                                                       │
│  ▼ (expand karo)                                     │
│  ┌── Task: "Design login button UI"    [Todo]     ┐  │
│  │   👤 Vaibhav  ·  Low                            │  │
│  └──────────────────────────────────────────────── ┘  │
│  ┌── Task: "Google OAuth integration"  [In-Prog]  ┐  │
│  │   👤 Ananya   ·  High                           │  │
│  └──────────────────────────────────────────────── ┘  │
│  [+ Add task]                                         │
└─────────────────────────────────────────────────────┘
```

**APIs:**
```
Mount:          GET /api/sprint/get_all/:projectId
                GET /api/story/get_backlog/:projectId
Story expand:   GET /api/task/get_by_story/:storyId
Move to sprint: PUT /api/story/move_to_sprint/:storyId
Add story:      POST /api/story/create (modal)
Add task:       POST /api/task/create (inline form)
Start sprint:   PUT /api/sprint/start/:sprintId
Complete sprint:PUT /api/sprint/complete/:sprintId
```

**Role restrictions:**
```
Owner/Manager:
  ✅ Create sprint
  ✅ Create story
  ✅ Create task
  ✅ Move story to sprint
  ✅ Start/Complete sprint
  ✅ Edit/Delete story

Employee:
  ✅ View backlog + stories + tasks
  ✅ Click task → TaskDetailDrawer (sirf assigned tasks)
  ❌ No create/move/sprint controls
```

---

## Layer 2B — Active Kanban Board

**Route:** `/projects/:projectId/board`

```
┌──────────────────────────────────────────────────────────────────┐
│  Sprint 1 — Active · Ends in 6 days              [Complete Sprint]│
│                                        (sirf owner/manager dekhe) │
├──────────────┬───────────────┬──────────────┬────────────────────┤
│    TODO      │  IN PROGRESS  │    REVIEW    │       DONE         │
│──────────────│───────────────│──────────────│────────────────────│
│ ┌──────────┐ │ ┌───────────┐ │ ┌──────────┐ │ ┌────────────────┐ │
│ │Task A    │ │ │Task C     │ │ │Task E    │ │ │Task F          │ │
│ │↳ Story 1 │ │ │↳ Story 1  │ │ │↳ Story 2 │ │ │↳ Story 1       │ │
│ │👤 Vaibhav│ │ │👤 Ananya  │ │ │👤 Rohit  │ │ │✅              │ │
│ │🔴 High   │ │ │🟡 Medium  │ │ │🟢 Low   │ │ │                │ │
│ └──────────┘ │ └───────────┘ │ └──────────┘ │ └────────────────┘ │
│              │               │              │                     │
│ ┌──────────┐ │               │              │                     │
│ │Task B    │ │               │              │                     │
│ │↳ Story 2 │ │               │              │                     │
│ │👤 None   │ │               │              │                     │
│ └──────────┘ │               │              │                     │
└──────────────┴───────────────┴──────────────┴────────────────────┘
```

**Task Card (`TaskCard.tsx`):**

```
┌───────────────────────────┐
│ ↳ User login (story tag)  │  ← mint/subtle badge
│                           │
│ Design login button UI    │  ← title, click → drawer
│                           │
│ 🔴 High  ·  Bug           │  ← priority + type dots
│                           │
│ 👤 VS                     │  ← assignee initials
└───────────────────────────┘
```

**Status change (Employee ke liye):**
```
Card pe right-click ya dropdown → status change
Employee → sirf apne assigned tasks pe yeh option active
Owner/Manager → kisi bhi task pe
```

**APIs:**
```
Mount:         GET /api/task/get_by_sprint/:activeSprintId
Status change: PATCH /api/task/update/:taskId { status }
Task click:    TaskDetailDrawer opens (no new API, data already fetched)
Complete:      PUT /api/sprint/complete/:sprintId
```

---

## Layer 3 — Task Detail Drawer

**Right side se slide hoga** — Jira ka issue detail panel jaisa:

```
┌───────────────────────────────────────────────────────────┐
│                                              [×] Close     │
│                                                            │
│  [Bug]  [High]  [In-Progress ▾]                           │
│                                                            │
│  Design login button UI                                    │
│  (owner/manager = editable inline, employee = read-only)   │
│                                                            │
│  ─────────── Details ───────────                          │
│  Sprint:    Sprint 1                                       │
│  Story:     User login with Google                        │
│  Assignee:  👤 Vaibhav  [Change] (owner/manager only)    │
│  Priority:  🔴 High      [▾]    (owner/manager only)     │
│  Created:   07 Jul 2026                                    │
│                                                            │
│  ─────────── Description ───────────                      │
│  (editable textarea for owner/manager)                    │
│  (read-only for employee)                                 │
│                                                            │
│  ─────────── Linked Issues ───────────                    │
│  🐛 Login button misaligned   [Review]                    │
│  🐛 OAuth token expires early [Todo]                      │
│  [+ Link issue]  (owner/manager)                          │
│                                                            │
│  ─────────── Comments ───────────                         │
│  👤 Vaibhav: "Figma link attached"        2h ago          │
│  👤 Ananya:  "Will review by EOD"         1h ago          │
│                                                            │
│  ┌─────────────────────────────────┐                      │
│  │ Write a comment...              │  ← sab roles         │
│  └─────────────────────────────────┘                      │
│                             [Post comment]                 │
└───────────────────────────────────────────────────────────┘
```

**APIs:**
```
Mount:          task data already in Redux (board se fetch hua)
Linked issues:  GET /api/issue/get_by_task/:taskId
Update task:    PATCH /api/task/update/:taskId (debounced for text fields)
Comments:       GET /api/task-comment/get_by_task/:taskId
Post comment:   POST /api/task-comment/create
Assignee:       AddMembersToIssue component (reuse karo)
```

**Role restrictions in drawer:**
```
Owner/Manager:
  ✅ Edit title, description (debounced auto-save)
  ✅ Change status (dropdown)
  ✅ Change priority, assignee
  ✅ Link/unlink issues
  ✅ Add/edit/delete comments

Employee:
  ✅ Read title, description, details
  ✅ Change status (sirf apna assigned task)
  ✅ Add comment (sirf apna)
  ✅ Edit/delete apna comment
  ❌ Cannot change priority, assignee, title
```

---

## Redux Slice — `scrumSlice.ts`

```ts
interface ScrumState {
  // Sprint
  sprints: ISprint[];
  activeSprint: ISprint | null;
  sprintsLoading: boolean;

  // Stories (key = sprintId | 'backlog')
  storiesByKey: Record<string, IUserStory[]>;
  storiesLoading: boolean;

  // Tasks (key = storyId)
  tasksByStory: Record<string, ITask[]>;

  // Active Board — flat list
  activeSprintTasks: ITask[];
  boardLoading: boolean;

  // Task Detail Drawer
  selectedTask: ITask | null;
  drawerOpen: boolean;
  taskComments: ITaskComment[];
  linkedIssues: IIssue[];

  error: string | null;
}
```

**Actions:**
```ts
// Sprint
fetchSprints(projectId)
createSprint(data) → sprints list mein add
startSprint(sprintId) → status: 'active'
completeSprint(sprintId) → status: 'completed' + backlog cleanup

// Story
fetchBacklogStories(projectId)
fetchSprintStories(sprintId)
createStory(data)
moveStoryToSprint(storyId, sprintId)

// Task
fetchTasksByStory(storyId)
fetchActiveSprintTasks(sprintId)
createTask(data)
updateTaskStatus(taskId, status)  // employee bhi use karega
updateTask(taskId, data)          // owner/manager

// Drawer
openDrawer(task)
closeDrawer()
fetchTaskComments(taskId)
addComment(taskId, content)
fetchLinkedIssues(taskId)
```

---

## Build Order (Frontend)

```
Step 1 — scrumSlice.ts
  Sprint fetch + create actions
  Test: Redux DevTools mein sprints aane chahiye

Step 2 — ScrumDropdown.tsx
  Sidebar se kholna
  Sprint list + Backlog link + Create button

Step 3 — CreateSprintModal.tsx
  Modal.tsx reuse karo
  Form: name, goal, dates

Step 4 — BacklogPage.tsx
  3 sections: active sprint, future sprints, backlog
  SprintAccordion.tsx
  StoryCard.tsx (collapse/expand)
  ProgressBar.tsx reuse (dashboard se)

Step 5 — CreateStoryModal.tsx + CreateTaskModal.tsx
  Story mein task inline bhi add kar sakte hain

Step 6 — ActiveBoardPage.tsx
  4 columns layout
  TaskCard.tsx
  Status dropdown on card (existing logic reuse)

Step 7 — TaskDetailDrawer.tsx
  Right-side slide panel
  CommentThread.tsx (new)
  AddMembersToIssue reuse (assignee ke liye)
  LinkedIssues section

Step 8 — Role guards lagao sab jagah
  canManage = role === 'owner' || role === 'manager'
  Buttons conditionally render karo
```

---

## Summary Table

| Screen | Route | Owner/Manager | Employee |
|---|---|---|---|
| Backlog | `/backlog` | Create sprint/story/task, move stories | View only |
| Kanban Board | `/board` | Change any task status, assign | Change own task status |
| Task Drawer | (modal) | Edit all fields + comments | Add comment + change own task status |
| Sprint Dropdown | (sidebar) | Create sprint | View sprints |

Pehle `scrumSlice.ts` + `ScrumDropdown.tsx` banao — yahi entry point hai. Karo aur batao kaisa gaya, aage ka code likhte hain.