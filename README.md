# Fenmo Expense Tracker

A full-stack, highly resilient expense tracking application built for the Fenmo technical assignment. The application emphasizes **real-world reliability**, modern aesthetics, and robust architectural decisions that scale.

## 🛠 Tech Stack

**Backend (API)**
- **Runtime:** Node.js + Express
- **Language:** TypeScript
- **Database:** PostgreSQL (via Docker locally)
- **ORM:** Prisma
- **Validation:** Zod
- **Testing:** Jest + ts-jest

**Frontend (Client)**
- **Framework:** React + Vite
- **Language:** TypeScript
- **Styling:** Vanilla CSS (Modern CSS Grid, Dark Mode)
- **Charting:** Recharts
- **Icons:** Lucide-React

---

## 🏛 Engineering Decisions & Architecture

This application goes beyond basic CRUD operations to handle the chaotic reality of actual production environments (unreliable networks, spam-clicks, huge data sets).

### 1. Network Resiliency (Idempotency)
In the real world, users double-click buttons and mobile networks drop connections, resulting in duplicate `POST` requests. 
- **Solution:** We implemented an **Idempotency-Key** system. The frontend generates a unique key per form submission. The backend intercepts requests, checks the `IdempotencyKey` table in PostgreSQL, and safely drops duplicate executions to ensure a user is never "charged" twice.

### 2. Cursor-Based Pagination (Infinite Scroll)
Loading thousands of expenses at once will crash the browser. Offset pagination (`LIMIT/OFFSET`) gets incredibly slow on large datasets.
- **Solution:** We implemented true **cursor-based pagination**. The backend fetches 20 items and uses the primary key (`id`) of the 21st item as the `nextCursor`. The frontend utilizes an `IntersectionObserver` at the bottom of the list to seamlessly fetch and append the next batch of expenses as the user scrolls.

### 3. Graceful Offline Handling
When the internet dies, standard React apps throw cryptic `Failed to fetch` stack traces.
- **Solution:** The application actively monitors `navigator.onLine` and specifically catches network refusal errors, replacing them with friendly, localized toasts (e.g., *"You appear to be offline. Please check your internet connection."*). The submission button also temporarily locks to prevent aggressive retries while offline.

### 4. URL State Persistence
Single Page Applications (SPAs) often annoy users by erasing their active filters if they hit "Refresh".
- **Solution:** The React state for `filterCategory` and `sortOrder` is directly seeded from and synchronized with the browser's URL using `URLSearchParams` and `window.history.replaceState`. Refreshing the page perfectly restores the user's view.

### 5. Strict Data Integrity
Malicious actors bypass frontend forms.
- **Solution:** The frontend features real-time, inline validation (red borders, localized error text) for a great UX. However, the backend utilizes strict **Zod schemas** to enforce boundaries (e.g., preventing negative amounts, limiting string lengths to 255 chars to prevent database bloat) before data ever touches Prisma.

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js (v18+)
- Docker (for PostgreSQL)

### Step 1: Start the Database
From the root of the project:
```bash
docker-compose up -d
```
*This spins up a PostgreSQL 16 instance on port 5432.*

### Step 2: Run the Backend
Open a terminal in the `backend` folder:
```bash
cd backend
npm install

# Push the schema to the database
npx prisma db push

# Start the development server
npm run dev
```
*The API will run on `http://localhost:3001`.*

### Step 3: Run the Frontend
Open a separate terminal in the `frontend` folder:
```bash
cd frontend
npm install

# Start the Vite development server
npm run dev
```
*The app will run on `http://localhost:5173` or `5174`.*

---

## 🧪 Testing

We implemented a suite of backend unit tests to mathematically verify the core financial and sorting logic, completely isolated from the database using mock repositories.

To run the test suite:
```bash
cd backend
npm run test
```

*For instructions on how to manually stress-test the application's real-world resiliency features (spam clicking, DevTools throttling), please refer to `TESTING.md`.*
