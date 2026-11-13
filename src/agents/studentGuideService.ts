import { STUDENT_GUIDE_SYSTEM_PROMPT } from './studentGuidePrompt';
import { DEMO_VILLAGES, DEMO_INSTITUTIONS, INITIAL_VEHICLES } from '../data/demoData';
import { db } from '../services/dataStore';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  quickActions?: string[];
}

/**
 * Intelligent Responder for RaahDost Student Guide
 * 
 * Hierarchy:
 * 1. Checks if GEMINI_API_KEY / VITE_GEMINI_API_KEY is available for live LLM completion.
 * 2. If no key is set or if offline/network fails, seamlessly executes deterministic
 *    intent + ground-truth Mangalore knowledge graph matching so the agent NEVER fails during demo.
 */
export async function getStudentGuideResponse(
  userQuery: string,
  history: ChatMessage[]
): Promise<string> {
  const query = userQuery.trim().toLowerCase();
  const crisisState = db.getCrisisSimulation();
  const isCrisisActive = Boolean(crisisState?.isActive);

  // Optional: check for Gemini API Key if configured
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;

  if (apiKey && apiKey.length > 10) {
    try {
      const response = await callGeminiAPI(userQuery, history, apiKey, isCrisisActive);
      if (response) return response;
    } catch (err) {
      console.warn('LLM API call failed, switching to ground-truth Mangalore responder:', err);
    }
  }

  // Grounded Deterministic Fallback Responder based strictly on Mangalore demo data
  return generateGroundedMangaloreResponse(query, isCrisisActive);
}

function generateGroundedMangaloreResponse(query: string, isCrisis: boolean): string {
  // Question Type A: "I live in Mulki and I have an exam at 10:30 at the college in Mangalore. Which bus should I take?"
  if (query.includes('mulki') && (query.includes('exam') || query.includes('10:30') || query.includes('college') || query.includes('mangalore'))) {
    if (isCrisis) {
      return (
        `⚠️ **Exam Day Crisis Alert for Mulki:**\n\n` +
        `Regular KSRTC Bus **#KA-19-F-1101** broke down at Pavanje Bridge and **NH-66 Kuloor Bridge** is blocked by flooding.\n\n` +
        `✅ **Recommended Transit:** Take **Dakshina Shared Van A (KA-19-SV-401)**\n` +
        `• **Boarding Point:** Mulki Bus Stand\n` +
        `• **Departure Time:** **07:25 AM**\n` +
        `• **Route:** Rerouted via Kinnigoli ➔ Kateel ➔ Bajpe Airport Road\n` +
        `• **Estimated Arrival (ETA):** **08:30 AM** at Kadri Polytechnic\n` +
        `• **Seats Remaining:** **10 seats available**\n` +
        `• **Exam Buffer:** You will reach **2 hours before** your 10:30 AM exam!\n\n` +
        `🔄 **Backup Option:** **Kudla Mini Bus D (KA-19-MB-601)** departing Mulki at **07:35 AM** (8 seats left).\n\n` +
        `ಕನ್ನಡ: ಮುಲ್ಕಿಯಿಂದ ಕದ್ರಿ ಕಾಲೇಜಿಗೆ ತುರ್ತು ವ್ಯಾನ್ **07:25 AM** ಗೆ ಹೊರಡಲಿದೆ.`
      );
    } else {
      return (
        `Hello! For your 10:30 AM exam from **Mulki** to **Government Polytechnic Kadri Hills / Mangalore Central**:\n\n` +
        `🚌 **Best Option:** **KSRTC Coastal Express #KA-19-F-1101**\n` +
        `• **Boarding Stop:** Mulki Bus Stand (Bay 2)\n` +
        `• **Departure Time:** **08:15 AM** (or earlier **07:30 AM**)\n` +
        `• **Estimated Arrival (ETA):** **08:55 AM** via direct NH-66\n` +
        `• **Available Seats:** **35 seats**\n` +
        `• **Exam Buffer:** **1 hour 35 minutes safety buffer** before 10:30 AM.\n\n` +
        `🔄 **Backup Option:** **Shared Van A (KA-19-SV-401)** departing Mulki at **08:00 AM** (12 seats left).`
      );
    }
  }

  // Question Type B: "My bus broke down, what now?"
  if (query.includes('broke down') || query.includes('breakdown') || query.includes('bus broken')) {
    if (isCrisis) {
      return (
        `🚨 **Emergency Assistance — Bus Breakdown Reported:**\n\n` +
        `Both KSRTC #1101 (Mulki) and #1102 (Surathkal) are currently disabled. Do not panic!\n\n` +
        `1. **If you have an Exam today:** You are automatically tagged **Examination Priority** in RaahDost.\n` +
        `2. **Assigned Relief Vehicles:** Board **Shared Bolero Van A (KA-19-SV-401)** or **Mini Bus D (KA-19-MB-601)** waiting at Mulki & Surathkal shelters.\n` +
        `3. **Overflow Students:** The local **Surathkal Auto Rickshaw Union Pool** has been mobilized for direct transfer.\n` +
        `4. **Helpline:** Call Mangalore District Student Transport Control: **0824-2220000**.`
      );
    } else {
      return (
        `Don't worry! RaahDost has tracked your route incident.\n\n` +
        `• **Nearby Alternative:** **Shared Van A** or **Route 31 KSRTC** is running 10 minutes behind.\n` +
        `• **What to do:** Stand at the nearest verified pickup shelter. Your digital boarding pass has been sent to the **Student Portal**.`
      );
    }
  }

  // Question Type C: "Is the road to Moodbidri open?"
  if (query.includes('moodbidri') || (query.includes('road') && query.includes('moodbidri'))) {
    return (
      `🛣️ **Moodbidri Corridor Road Status (NH-169):**\n\n` +
      `• **Status:** **OPEN & TRAFFIC FLOWING NORMALLY**.\n` +
      `• **Route:** Moodbidri ➔ Mijar ➔ Gurupura Bridge ➔ Vamanjoor ➔ Mangalore.\n` +
      `• **Active Bus:** **KSRTC Route 31 (#KA-19-F-1103)** is running on time from Moodbidri Bus Stand with **26 seats available**.\n` +
      `• **Note:** Only the coastal **NH-66 Kuloor Bridge** has flood restrictions; the Moodbidri Gurupura artery is fully operational.`
    );
  }

  // Question Type D: "When is the next bus from Surathkal to the city?"
  if (query.includes('surathkal') || (query.includes('surathkal') && query.includes('city'))) {
    if (isCrisis) {
      return (
        `⚠️ **Surathkal to Mangalore City Notice (Crisis Mode Active):**\n\n` +
        `Primary KSRTC City Express #1102 is temporarily disabled, and direct NH-66 via Kuloor is closed.\n\n` +
        `✅ **Active Rerouted Transits from Surathkal:**\n` +
        `1. **Auto Rickshaw Pool C (#KA-19-AU-501)**\n` +
        `   • **Departure:** **07:30 AM** from Surathkal Junction\n` +
        `   • **Route:** Rerouted via Kavoor bypass\n` +
        `   • **ETA in City:** **08:15 AM**\n` +
        `2. **Kudla Mini Bus D (#KA-19-MB-601)**\n` +
        `   • **Departure:** **07:45 AM** at NITK Gate (8 seats left)`
      );
    } else {
      return (
        `🚌 **Upcoming Buses from Surathkal to Mangalore City / Hampankatta:**\n\n` +
        `1. **KSRTC City Express #KA-19-F-1102:** Departs **07:45 AM** and **08:30 AM** from Surathkal NITK Junction (28 seats free, 30 min travel time).\n` +
        `2. **Coastal Relief Mini Bus D:** Departs **08:10 AM** (8 seats free).`
      );
    }
  }

  // Question Type E: General Road Status
  if (query.includes('road') || query.includes('flood') || query.includes('blocked') || query.includes('bridge')) {
    if (isCrisis) {
      return (
        `🌧️ **Dakshina Kannada Flood Roadway Advisory:**\n\n` +
        `⛔ **BLOCKED:** **NH-66 Kuloor Bridge over Gurupura River** is underwater due to tidal storm surge. Closed to heavy transit.\n` +
        `✅ **OPEN ALTERNATIVE:** All student transit is actively diverted via **Kinnigoli ➔ Kateel ➔ Bajpe Airport Road Bypass** (+27 mins detour).\n` +
        `✅ **OPEN:** NH-169 (Moodbidri ➔ Vamanjoor) and Netravathi Bridge (Ullal ➔ Thokkottu) are clear.`
      );
    } else {
      return (
        `🛣️ **Current Road Conditions:** All corridors across Dakshina Kannada (NH-66 Coastal, NH-169 Moodbidri, and NH-73 Farangipete) are **OPEN** and running normally.`
      );
    }
  }

  // Question Type F: Exam Support
  if (query.includes('exam')) {
    return (
      `📝 **Exam Day Student Mobility Support:**\n\n` +
      `Please provide:\n` +
      `1. Your starting pickup town (e.g. **Mulki**, **Surathkal**, **Moodbidri**, **Kateel**)\n` +
      `2. Your destination college (e.g. **Govt Polytechnic Kadri**, **St. Aloysius**, **NITK**)\n` +
      `3. Exam start time (e.g. **09:00 AM** or **10:30 AM**)\n\n` +
      `I will instantly calculate the fastest bus with safe gate arrival buffer!`
    );
  }

  // Default Guidance
  return (
    `Hello! I am your **RaahDost Student Guide** for Mangalore & Dakshina Kannada.\n\n` +
    `I can help you find KSRTC buses, check road closures (like Kuloor bridge), or arrange exam emergency transport.\n\n` +
    `Try asking:\n` +
    `• *"I am in Mulki and have an exam at 10:30 AM. Which bus should I take?"*\n` +
    `• *"Is the road to Moodbidri open?"*\n` +
    `• *"When is the next bus from Surathkal to the city?"*`
  );
}

// Live LLM Caller when GEMINI_API_KEY is configured
async function callGeminiAPI(
  userQuery: string,
  history: ChatMessage[],
  apiKey: string,
  isCrisis: boolean
): Promise<string | null> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const promptContext = `
${STUDENT_GUIDE_SYSTEM_PROMPT}

CURRENT SYSTEM STATUS:
- Region: Dakshina Kannada, Mangalore, Karnataka
- Crisis Mode: ${isCrisis ? 'ACTIVE (2 KSRTC buses broken down, NH-66 Kuloor Bridge flooded, +40% student surge, 2-hour exams active)' : 'NORMAL OPERATIONAL BASELINE'}
- Available Towns: Mulki, Surathkal, Kinnigoli, Kateel, Moodbidri, Bajpe, Vamanjoor, Farangipete, Thokkottu, Ullal
- Key Destinations: Govt Polytechnic Kadri, St. Aloysius College, NITK Surathkal, Alva's Moodbidri

User Question: ${userQuery}
`;

  const payload = {
    contents: [
      {
        parts: [{ text: promptContext }]
      }
    ]
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}
