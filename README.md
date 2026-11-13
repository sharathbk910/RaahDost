# RaahDost — Smart Rural Student Mobility Network

> **Tagline:** Your Journey. Our Responsibility.  
> **Product Category:** AI-Assisted Rural Student Mobility Coordination Platform.

---

## 🚌 What is RaahDost?

In rural India, when a single state transport bus breaks down on an isolated corridor, students miss their examinations, laboratory practicals, and classes. Standard tracking apps only report "Bus Delayed". 

**RaahDost coordinates alternative vehicles.**

When a disruption occurs, RaahDost:
1. Gathers the headcount and destinations of stranded students.
2. Identifies registered alternative local vehicles (Shared Bolero Vans, Auto Rickshaws, Mini-Buses).
3. Executes a **deterministic, capacity-constrained matching algorithm** (zero LLM hallucinations for safety-critical seat capacity).
4. Proposes balanced assignments for administrator review.
5. Issues verified boarding confirmations and highlights unassigned students when capacity falls short.

---

## ⚡ The Centerpiece: ROUTE RESCUE

Under the **Route Rescue** workflow (`/rescue`):
- **Scenario:** 30 students stranded at Rampur Village heading to Government Polytechnic Institute after regular Bus #UP-32-BT-0921 suffered an axle breakdown.
- **Alternative Fleet:** 4 vehicles with 34 total available seats (Van A: 12, Van B: 10, Auto C: 4, Mini-Bus D: 8).
- **Execution:** Instant matching allocating all 30 students across compatible vehicles.
- **Dynamic Reallocation:** Interactive controls allow testing capacity decreases (e.g. Van A losing seats) to observe how the engine calculates shortfall and clearly reports unassigned students.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide React icons
- **Build Tool:** Vite
- **Algorithm:** Deterministic Greedy Capacity-Constrained Matching Engine (`src/algorithms/matchingEngine.ts`)
- **Persistence:** Local Demonstration Sandbox with local storage & Supabase-compatible relational schema (`supabase/schema.sql`)
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

# Run automated algorithmic tests
node src/algorithms/matchingEngine.test.mjs

# Build for production
npm run build
```

---

## 🧪 Acceptance Criteria & Test Verification

| Test Scenario | Expected Outcome | Verification Status |
|---|---|---|
| **Scenario 1:** 30 students stranded, 34 alternative seats | All 30 students allocated to compatible vehicles | ✅ PASS (Verified in engine tests) |
| **Scenario 2:** Capacity reduced from 34 to 24 seats | 24 allocated, exactly 6 students tagged unassigned with clear reasons | ✅ PASS (Verified in engine tests) |
| **Scenario 3:** Route mismatch | Vehicles heading elsewhere are excluded | ✅ PASS (Verified in engine tests) |
| **Scenario 4:** Reset Demo State | Restores initial 30-student incident state instantly | ✅ PASS (UI Action in Top Bar) |
