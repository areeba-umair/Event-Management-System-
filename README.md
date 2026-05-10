# 🎪 Event Management System (EMS)

A full-stack **Event Management System** built as a Database Lab Project for **FAST NUCES** — Semester 4. The application allows users to browse events, book tickets, and view live analytics. An admin panel provides management tools powered by Oracle PL/SQL procedures, functions, cursors, and packages.

---

## 📸 Features Overview

### 🌐 Public Website (`index.html`)
- **Hero Section** — Eye-catching landing page with parallax background image
- **Browse Events** — Dynamically loaded event cards from Oracle Database
- **Book Tickets** — Complete booking form that inserts Participant, Ticket, and Payment records
- **Live Dashboard** — Real-time analytics showing total events, tickets, sponsors, staff, and participants
- **Scroll Animations** — Smooth fade-in effects as you scroll through sections
- **Responsive Design** — Works on desktop, tablet, and mobile screens

### 🔐 Admin Panel (`admin.html`)
> **Secret URL** — Not linked anywhere on the public website. Access via direct URL only.

| Page | Description | Oracle Feature |
|------|-------------|---------------|
| **Overview** | Dashboard with live stats and recent bookings | `SELECT COUNT(*)` |
| **Add Event** | Create new events with venue & organizer selection | `INSERT INTO Event` |
| **Bookings** | View all ticket bookings in a sortable table | `vw_ticket_bookings` View |
| **Participants** | Register new participants | `procRegisterParticipant` Procedure |
| **Analytics** | Revenue, profit, and margin analysis per event | `fnCalculateTotalEventRevenue` Function |
| **Venues** | Venue occupancy report with attendee counts | Cursor-Based Query |
| **Bulk Tickets** | Generate multiple tickets at once | Package Procedure |
| **Lookup** | Check how many tickets a participant has booked | `fnGetParticipantTicketCount` Function |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML, CSS, JavaScript (Vanilla) |
| **Backend** | Node.js, Express.js |
| **Database** | Oracle Database 11g Express Edition |
| **DB Driver** | `oracledb` (Thick Mode for Oracle 11g) |
| **Other** | `cors`, `dotenv` |

---

## 📁 Project Structure

```
Event Management/
├── index.html          # Public website (single-page scrolling UI)
├── style.css           # Public website styles
├── script.js           # Public website logic (dashboard, events, booking)
│
├── admin.html          # Admin panel (multi-page with sidebar navigation)
├── admin.css           # Admin panel styles (dark theme, glassmorphism)
├── admin.js            # Admin panel logic (forms, analytics, lookups)
│
├── server.js           # Express backend (API endpoints)
├── db.js               # Oracle database connection module
├── .env                # Database credentials (not committed to git)
│
├── queries.sql         # All SQL: CREATE TABLE, CREATE VIEW, INSERT statements
├── reset.js            # Script to empty all database tables
├── insert.js           # Script to insert sample data
│
├── package.json        # Node.js project config
└── README.md           # This file
```

---

## 🗄 Database Schema

The system uses **9 core tables**, **3 views**, and **4 indexes**:

### Tables
| Table | Description |
|-------|-------------|
| `Venue` | Event locations with capacity and cost |
| `Organizer` | Event organizers with contact info |
| `Event` | Events linked to venues and organizers |
| `Participant` | Registered attendees |
| `Ticket` | Booking records linking participants to events |
| `Payment` | Payment records with method and status |
| `Staff` | Staff members assigned to organizers |
| `Schedule` | Event sessions with speakers and time slots |
| `Sponsor` | Event sponsors with contribution amounts |

### Views
- `vw_event_details` — Events with venue and organizer info (JOIN)
- `vw_ticket_bookings` — Tickets with participant and event details (JOIN)
- `vw_payment_summary` — Payments with participant details (JOIN)

### PL/SQL Objects
- **Procedures:** `procRegisterParticipant`, `procProcessPayment`
- **Functions:** `fnCalculateTotalEventRevenue`, `fnGetEventOrganizerName`, `fnGetParticipantTicketCount`
- **Triggers:** `trgAfterTicketDelete` (audit log on ticket deletion)
- **Audit Tables:** `DeletedTickets`, `AuditLog`

---

## 🚀 How to Run the Project

### Prerequisites
1. **Node.js** (v14 or higher) — [Download](https://nodejs.org/)
2. **Oracle Database 11g XE** — Must be running on your machine
3. **Oracle Instant Client** — Required for `oracledb` Thick Mode ([Download](https://www.oracle.com/database/technologies/instant-client.html))
   - After extracting, add the Instant Client folder to your system `PATH`

### Step 1: Clone the Repository
```bash
git clone https://github.com/ahmed0310/Event-Management.git
cd Event-Management
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Database Connection
Edit the `.env` file with your Oracle credentials:
```env
PORT=3000
DB_USER=your_user_name
DB_PASSWORD=your_password
DB_CONNECTION_STRING=your_connection_string
```

### Step 4: Set Up the Database
Run the SQL in `queries.sql` using SQL*Plus or Oracle APEX to create all tables, views, indexes, and PL/SQL objects:
```bash
sqlplus user_name/password@connection_string @queries.sql
```

### Step 5: Insert Sample Data
```bash
node insert.js
```
This inserts 56 rows of sample data (venues, organizers, events, participants, tickets, payments, staff, schedules, and sponsors).

### Step 6: Start the Server
```bash
node server.js
```
The server will start at **http://localhost:3000**

### Step 7: Open in Browser
| Page | URL |
|------|-----|
| **Public Website** | `http://localhost:3000/index.html` |
| **Admin Panel** | `http://localhost:3000/admin.html` |

> **Admin Password:** `admin`

---

## 🔧 Utility Scripts

| Command | Description |
|---------|-------------|
| `node server.js` | Start the Express backend server |
| `node insert.js` | Insert sample data into all tables |
| `node reset.js` | Delete all data from all tables (clean reset) |

> **Note:** Always run `node reset.js` before `node insert.js` to avoid duplicate key errors.

---

## 📡 API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/events` | Get all events with venue details |
| `GET` | `/dashboard` | Get dashboard statistics |
| `POST` | `/booking` | Create a new booking |

### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/bookings` | Get all ticket bookings |
| `POST` | `/admin/events` | Create a new event |
| `GET` | `/venues` | Get all venues |
| `GET` | `/organizers` | Get all organizers |

### PL/SQL Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/plsql/registerParticipant` | Register a new participant |
| `GET` | `/plsql/eventRevenue/:id` | Get event revenue |
| `GET` | `/plsql/participantTickets/:id` | Get participant ticket count |
| `GET` | `/admin/plsql/eventSummary/:id` | Get event analytics summary |
| `GET` | `/admin/plsql/venueOccupancy/:id` | Get venue occupancy report |
| `POST` | `/admin/plsql/bulkTicketGeneration` | Generate bulk tickets |

---

## 👨‍💻 Author

**FAST NUCES — Database Lab Project (Semester 4)**

---

## 📜 License

This project is for educational purposes only — FAST NUCES Database Lab.
