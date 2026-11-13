# RaahDost — Your friend on every road

> **Application Name:** RaahDost (Raah = path, Dost = friend)  
> **Tagline:** Your friend on every road.  
> **Challenge:** ROUTELESS: The Last Mile — AI-Powered Rural Transportation Challenge  
> **Region of Focus:** Mangalore (Mangaluru), Dakshina Kannada, Karnataka  

---

## 🚌 What is RaahDost?

In rural India and coastal Karnataka (Mulki, Surathkal, Moodbidri, Kinnigoli, Kateel, Bajpe, Ullal), students depend on limited government buses to reach educational institutions. When regular buses break down, heavy monsoon rains flood arterial bridges (like the NH-66 Kuloor Bridge), or passenger demand exceeds available seats, students get stranded and risk missing semester exams and laboratory practicals.

**RaahDost coordinates rural students, verified community drivers, and institutions into a smart, real-time mobility network.**

---

## 🏛️ The Three Portals

RaahDost provides three dedicated, mobile-first and desktop-optimized portals:

### 1. Student Portal (`/student`)
- **Bottom Navigation (4 tabs):** Home, Map, Help, Profile.
- **Language Switcher:** Instant toggle between English and ಕನ್ನಡ (Kannada).
- **Home Dashboard:**
  - Status card with next bus countdown and seat availability.
  - **"Buses Near Me" (5 km radius):** Real-time GPS bus list with live ETAs, boarding stops, seat color-coding (green/orange/red), and live tracking.
  - **"Drivers Available to Your College":** Live community queue of verified commuters and van owners traveling that way with available seats and 1-tap "Request pickup".
  - **"Need help reaching on time?" Button:** Instant emergency assistance trigger.
  - **"I Have an Exam Today" Toggle:** Automatically prioritizes student seating during peak hours and disruptions.
  - **Automatic Alert Banner:** Pops up immediately when a student's assigned bus breaks down, is full, or delayed.
- **Interactive Map:** Live Leaflet OpenStreetMap displaying student location, bus radar, moving community drivers, OSRM road routes, and flood hazards (100% free, no API keys).
- **Help Screen (RaahDost Assistant):** AI agent that ranks solutions: alternative buses, detour routes around floods, verified community drivers, or emergency auto pools.
- **Safety Features:** Guardian SMS notifications, driver license plate verification, emergency SOS button, and report-a-problem.

### 2. Driver Portal (`/driver`)
- **For Bus Drivers & Community Commuters:** Designed for KSRTC bus drivers as well as daily commuters (cars, vans, autos, tempos, bikes) offering empty seats.
- **"I'm Available Today" Switch:** When turned ON, driver chooses their route, departure time, and free seats.
- **Live Real-Time Queue:** Instantly adds driver to the student radar without manual admin intervention.
- **Live 5-Second GPS Streaming:** Broadcasts real-time vehicle movement to matching students.
- **Dynamic Seats Counter:** `+` and `-` buttons. When seats hit 0, the driver is automatically hidden from new requests.
- **Trip Lifecycle Management:** Accept/decline requests, navigate to boarding points, and mark "Picked Up" and "Dropped at College".
- **KSRTC Bus Driver Mode:** Drivers can pick their assigned bus, press "Start Trip", and set live status (Running, Delayed, Full, Broken Down).

### 3. Main Admin Dashboard (`/dashboard`)
- **Desktop-First Sidebar:** Overview, Buses & Routes, Students & Colleges, Driver Approvals, Crisis Control, and Reports.
- **Fleet & Route CRUD:** Add new buses, update capacity, modify stops, and change status.
- **Driver Verification Queue:** Review license photos, RC books, and Approve, Reject, or Suspend drivers.
- **Student Roster:** Filter by village, college, and exam status.
- **Crisis Control ("The Exam Day Crisis"):** Trigger 2-bus breakdown, 40% passenger surge, Kuloor bridge flood, and 2-hour exam priority. Runs Dijkstra inland rerouting and balances seat allocation.
- **Reports:** Complete audit trail with one-click CSV export.

---

## ⚡ The Surprise Hurdle: "The Exam Day Crisis"

Under **Crisis Control** (`/crisis`):
- **Scenario:** 2 KSRTC coastal buses (#1101 & #1102) suffer transmission breakdown.
- **Demand Surge:** Baseline 30 students + 40% surge = **42 total students** needing urgent mobility.
- **Flooded Bridge:** NH-66 Kuloor River Bridge is submerged; Dijkstra routing re-routes students through Kinnigoli ➔ Kateel ➔ Bajpe Airport Road bypass (+27 mins detour).
- **Exam Deadlines:** Students with 09:00 AM / 10:30 AM board exams are prioritized to ensure on-time gate arrival.
- **Before vs After Matrix:** Demonstrates 0 stranded exam students after AI reallocation.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide React
- **Data & Realtime:** Unified PubSub DataStore with `BroadcastChannel` live tab sync & Supabase Auth/Realtime integration
- **GIS & Maps:** Leaflet & React-Leaflet with OpenStreetMap tiles, Nominatim geocoding, and OSRM road routing (100% Free & Open-Source, zero billing, zero API keys required)
- **AI Integration:** Google Gemini API with grounded local transit heuristics
- **Build Tool:** Vite

---

## 🚀 Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/sharathbk910/RaahDost.git
cd RaahDost

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Run automated test suites
node src/algorithms/crisisEngine.test.mjs
node src/agents/studentGuide.test.mjs

# 5. Build for production
npm run build
```

---

## 🎬 3-Minute Hackathon Demo Script

Follow these steps for a complete demonstration:

### Minute 1: The Student Experience
1. Open `http://localhost:4173/` and click **"I'm a Student"** to enter the Student Portal.
2. Toggle the **"I have an exam today"** switch and set exam time to **10:30 AM**.
3. View **"Buses near me"** showing KSRTC buses with real-time seat counts and ETAs.
4. Click the **Kannada (ಕನ್ನಡ)** toggle at top right to demonstrate regional language accessibility.
5. Notice the **Red Banner Alert**: Bus #1101 has broken down near Pavanje Bridge.
6. Tap the big red button: **"Need help reaching on time?"**. The **RaahDost Assistant** instantly evaluates live data and suggests **Rameshwar Yadav's Bolero Van** or the inland detour bus.
7. Click **"Request pickup"** — notice the guardian SMS toast notification.

### Minute 2: The Driver Portal (Live Availability & GPS)
1. Open a new tab or click **Driver Portal** in the sidebar.
2. Switch ON **"I'm available today"**. Notice the green pulsing GPS beacon (streaming coordinates every 5s).
3. Use the `+` and `-` buttons to change available seats from 5 to 4.
4. Look at the **"Incoming Student Requests"** card: **Aarav Sharma's** pickup request appears in real time.
5. Tap **"Accept Pickup"** ➔ click **"Mark Picked Up"** ➔ click **"Mark Dropped at College"**. Notice the student helped counter increments.

### Minute 3: The Main Admin Dashboard & Exam Day Crisis
1. Click **Admin Dashboard** in the sidebar.
2. View the **Overview KPIs**: live buses running, buses down, available drivers, and student demand chart.
3. Click **Driver Approvals**: show the pending application for **Manjunath K.** with license and RC documents. Click **"Approve Driver ✓"** — he is now live in the student queue!
4. Navigate to **Crisis Control**:
   - Click **"Execute AI Reallocation"**.
   - Show the **Before vs. After Optimization Matrix**: baseline + 40% surge students evaluated, Kuloor bridge flood avoided via Kinnigoli-Bajpe, and **100% of exam students safely delivered on time**.
   - Inspect the **AI Decision Transparency** panel explaining why each student was prioritized.
5. Click **"Download Full CSV Export"** to download the comprehensive mobility audit log.
