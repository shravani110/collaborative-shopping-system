# Collaborative Shopping System

A hackathon-ready real-time collaborative shopping app built with a React frontend, Tailwind CSS styling, and a Node.js/Express backend using Socket.io for all shared state updates.

## Project Structure

```text
project collaborative shopping system/
|-- backend/
|   |-- package.json
|   `-- server.js
|-- frontend/
|   |-- package.json
|   |-- index.html
|   |-- postcss.config.js
|   |-- tailwind.config.js
|   |-- vite.config.js
|   `-- src/
|       |-- App.jsx
|       |-- index.css
|       |-- main.jsx
|       |-- components/
|       |   |-- ActivityFeed.jsx
|       |   |-- BudgetTracker.jsx
|       |   |-- Dashboard.jsx
|       |   |-- LandingPage.jsx
|       |   |-- LiveCart.jsx
|       |   `-- ProductList.jsx
|       |-- context/
|       |   `-- SocketContext.jsx
|       `-- data/
|           `-- products.js
`-- README.md
```

## System Architecture

```text
+---------------------------+       WebSocket events via Socket.io       +-----------------------------+
| React + Tailwind Client A | <---------------------------------------> | Node.js + Express + Socket  |
+---------------------------+                                            | In-memory room store        |
                                                                         | - members / roles          |
+---------------------------+       WebSocket events via Socket.io       | - cart / budget / total    |
| React + Tailwind Client B | <---------------------------------------> | - activity feed            |
+---------------------------+                                            | - checkout summary         |
                                                                         | - queued delta operations  |
                                                                         +-------------+---------------+
                                                                                       |
                                                                                       |
                                                                                       v
                                                                         +-----------------------------+
                                                                         | Server-authoritative state  |
                                                                         | broadcast back to each room |
                                                                         +-----------------------------+
```

## Backend Setup and Socket Architecture

### Backend dependencies

```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "socket.io": "^4.8.1"
  }
}
```

### In-memory room model

Each room is stored in a `Map` keyed by a generated 6-character session code. A room contains:

- `ownerSocketId`: socket id that currently owns the room
- `members`: connected users and their roles
- `cart`: authoritative cart items keyed by item id
- `budgetCap`: shared budget limit
- `total`: server-computed total spend
- `activityFeed`: real-time action history
- `pendingOperations`: queued additive/subtractive cart updates
- `isProcessingQueue`: per-room processing lock
- `checkedOut` and `checkoutSummary`: final order state

### Real-time events

The backend implements these Socket.io events:

- `create_room`
- `join_room`
- `add_item`
- `update_quantity`
- `remove_item`
- `change_budget`
- `checkout`
- `remove_member`
- `room_state`
- `activity_feed_updated`
- `conflict_alert`
- `checkout_complete`
- `unauthorized_action`
- `server_error`

### Conflict Resolution strategy

This project uses **Server-Authoritative Additive/Subtractive Merging**.

Why this was chosen:

- Clients never send absolute quantities such as `quantity = 5`, which are prone to stale overwrites.
- Clients only send deltas such as `+1`, `-1`, or `-currentQuantity`.
- The server appends those deltas to a per-room queue.
- The queue is processed one event at a time against the latest server-side cart state.
- That makes the server the single source of truth and avoids race conditions when multiple contributors click quickly.

Example:

1. Item quantity on the server is `2`.
2. Contributor A sends `+1`.
3. Contributor B sends `-1` at almost the same time.
4. The queue applies them sequentially, ending at `2` or `2` depending on order, with no stale overwrite bug.

This is a strong fit for a hackathon demo because it is easy to reason about, deterministic, and works fully in memory without introducing paid infrastructure or external locking systems.

### Server-side role enforcement

Security-sensitive actions are enforced on the backend, not just hidden in the UI.

- Only the socket id matching `ownerSocketId` can execute `change_budget`.
- Only the socket id matching `ownerSocketId` can execute `checkout`.
- Only the socket id matching `ownerSocketId` can execute `remove_member`.
- Unauthorized attempts emit `unauthorized_action` instead of mutating shared state.

This ensures a contributor cannot bypass the interface by manually emitting privileged Socket.io events from browser devtools.

## Frontend Setup and Context

### Frontend dependencies

```json
{
  "dependencies": {
    "lucide-react": "^0.511.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hot-toast": "^2.5.2",
    "socket.io-client": "^4.8.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "vite": "^5.4.10"
  }
}
```

### Global socket state management

The frontend uses a `SocketProvider` in `frontend/src/context/SocketContext.jsx` to manage:

- current socket connection status
- current room code
- current user and role
- cart state
- members list
- budget cap and total
- activity feed
- checkout summary modal state
- all outgoing socket actions through a shared API

This keeps every page and component synchronized from one source of truth and avoids prop-drilling in the dashboard.

## UI Components

The app includes the following polished Tailwind-based components:

- `LandingPage`: create or join a shopping session using a shareable room code
- `Dashboard`: main room layout with session header and checkout modal
- `ProductList`: mock grocery catalog for quick add actions
- `LiveCart`: synchronized cart with quantity controls, contributor badges, and owner-only checkout/remove-member actions
- `BudgetTracker`: live progress bar comparing current spend against the shared cap
- `ActivityFeed`: real-time event log showing who did what

## Known Limitations

- All room data is stored in memory, so sessions are lost when the backend restarts.
- The mock product list is static and not backed by a database.
- Owner reassignment on disconnect is basic and simply promotes the next connected member.
- There is no authentication layer beyond display names and socket-session identity.
- The demo assumes the frontend runs on `http://localhost:5173` and backend on `http://localhost:4000`.

## Run Locally

### Environment variables

Frontend:

```bash
cd frontend
copy .env.example .env
```

Backend:

```bash
cd backend
copy .env.example .env
```

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Start the backend

```bash
cd backend
npm run dev
```

### 4. Start the frontend

```bash
cd frontend
npm run dev
```

### 5. Open the app

Visit `http://localhost:5173` in two or more browser tabs, create a room in one tab, and join it from the others using the generated session code.

### Deployment environment variables

Backend:

- `PORT=4000` locally, or use the host-provided port in production
- `CLIENT_URL=https://your-frontend-domain.vercel.app`

Frontend:

- `VITE_SOCKET_URL=https://your-backend-domain.onrender.com`

## Submission Notes

- All shared cart, budget, activity, and checkout updates are sent over Socket.io with no polling.
- The server is authoritative for totals, role validation, and cart mutation order.
- The UI is responsive and demo-friendly, with toasts, contributor indicators, a live feed, and an owner checkout flow.
