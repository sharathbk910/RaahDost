# RaahDost — Your friend on every road

> **Application Name:** RaahDost (Raah = path, Dost = friend)  
> **Tagline:** Your friend on every road.  
> **Challenge:** ROUTELESS: The Last Mile — AI-Powered Rural Transportation Challenge  
> **Region of Focus:** Mangalore (Mangaluru), Dakshina Kannada, Karnataka  

---

## 🚌 What is RaahDost?

In rural India and coastal Karnataka (Mulki, Surathkal, Moodbidri, Kinnigoli, Kateel, Bajpe, Ullal), students depend on government KSRTC and private buses to reach educational institutions. When regular buses break down, heavy monsoon rain floods arterial river bridges (like the NH-66 Kuloor Bridge), or passenger demand exceeds available seats, students risk missing university semester examinations and laboratory practicals.

**RaahDost (Your friend on every road) coordinates alternative transportation.**

Instead of merely informing students that their bus is delayed, RaahDost:
1. Gathers student headcount and examination deadlines.
2. Identifies registered alternative local vehicles (Shared Vans, Mini-Buses, Auto Rickshaw unions).
3. Executes a **deterministic, capacity-constrained matching algorithm** that enforces zero seat overselling.
4. Employs a **Dijkstra road graph routing engine** to safely detour around flooded bridges.
5. Deploys the **RaahDost Assistant**, a student-friendly AI guide answering questions in English and Kannada.
6. Proposes balanced assignments for administrator review and issues verifiable boarding passes.

---

## ⚡ Key Feature: EXAM DAY CRISIS MODE

Under **Exam Day Crisis Mode** (`/crisis`):
- **Scenario:** 2 KSRTC government buses (#KA-19-F-1101 & #1102) break down on NH-66.
- **Demand Surge:** Baseline 30 students + 40% surge = **42 total students** needing urgent mobility.
- **Flooded Bridge:** NH-66 Kuloor River Bridge is submerged; Dijkstra routing re-routes students through Kinnigoli ➔ Kateel ➔ Bajpe Airport Road bypass (+27 mins detour).
- **Exam Deadlines:** Students with 09:00 AM board practicals are prioritized to ensure on-time gate arrival.
- **Before vs After Matrix:** Shows on-time arrivals, students at risk, and overflow students routed into secondary alternatives (Shared Auto Pools and Staggered Waves).

---

## 🤖 RaahDost Assistant (AI Travel Buddy)

A floating chat assistant available across all pages that greets students warmly:
> *"Namaste! I'm RaahDost, your travel buddy. Tell me your village, your college and your exam time, and I'll find the best bus for you."*  
> *"ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ರಾಹ್ದೋಸ್ತ್ (RaahDost). ನಿಮ್ಮ ಊರು, ಕಾಲೇಜು ಮತ್ತು ಪರೀಕ್ಷೆಯ ಸಮಯ ಹೇಳಿ, ನಾನು ನಿಮಗೆ ಸೂಕ್ತ ಬಸ್ ತಿಳಿಸುತ್ತೇನೆ."*

Students can ask:
- *"I live in Mulki and I have an exam at 10:30 at the college in Mangalore. Which bus should I take?"*
- *"My bus broke down, what now?"*
- *"Is the road to Moodbidri open?"*
- *"When is the next bus from Surathkal to the city?"*

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide React icons
- **Map & GIS:** Leaflet & React-Leaflet with OpenStreetMap tiles
- **Build Tool:** Vite
- **Algorithmic Engine:** Deterministic Capacity Matching & Dijkstra Graph Routing
- **AI Integration:** Google Gemini API with grounded local knowledge fallback
- **Authentication:** Supabase Auth with Google OAuth & role-based profiles
- **Deployment:** Vercel

---

## 🚀 Getting Started

```bash
# Clone repository
git clone https://github.com/<your-username>/raahdost.git
cd raahdost

# Install dependencies
npm install

# Start local development server
npm run dev

# Run automated tests
node src/algorithms/crisisEngine.test.mjs
node src/agents/studentGuide.test.mjs

# Build for production
npm run build
```
