import { Village, Institution, Vehicle, TransportRequest, Disruption } from '../types';

/**
 * =====================================================================
 * REALISTIC DEMO DATA SET — MANGALORE (MANGALURU), DAKSHINA KANNADA, KARNATAKA
 * =====================================================================
 * Clearly labeled demo data covering rural taluks, towns, colleges,
 * KSRTC transport routes, and road network around Mangalore.
 */

// 1. 10 VILLAGES & TOWNS AROUND MANGALORE (DAKSHINA KANNADA)
export const DEMO_VILLAGES: Village[] = [
  { id: 'vil-mulki', name: 'Mulki', coordinates: { lat: 13.0906, lng: 74.7925 } },
  { id: 'vil-surathkal', name: 'Surathkal', coordinates: { lat: 13.0076, lng: 74.7958 } },
  { id: 'vil-kinnigoli', name: 'Kinnigoli', coordinates: { lat: 13.1167, lng: 74.8667 } },
  { id: 'vil-kateel', name: 'Kateel', coordinates: { lat: 13.0833, lng: 74.8500 } },
  { id: 'vil-moodbidri', name: 'Moodbidri', coordinates: { lat: 13.0722, lng: 74.9964 } },
  { id: 'vil-bajpe', name: 'Bajpe', coordinates: { lat: 12.9667, lng: 74.8833 } },
  { id: 'vil-vamanjoor', name: 'Vamanjoor', coordinates: { lat: 12.9167, lng: 74.8833 } },
  { id: 'vil-farangipete', name: 'Farangipete', coordinates: { lat: 12.8750, lng: 74.9667 } },
  { id: 'vil-thokkottu', name: 'Thokkottu', coordinates: { lat: 12.8250, lng: 74.8583 } },
  { id: 'vil-ullal', name: 'Ullal', coordinates: { lat: 12.8000, lng: 74.8500 } },
];

// 2. 8 EDUCATIONAL INSTITUTIONS IN MANGALORE AREA
export const DEMO_INSTITUTIONS: Institution[] = [
  { 
    id: 'inst-1', 
    name: 'Government Polytechnic College Mangalore (Kadri Hills)', 
    coordinates: { lat: 12.8875, lng: 74.8562 } 
  },
  { 
    id: 'inst-2', 
    name: 'NITK Surathkal (National Institute of Technology Karnataka)', 
    coordinates: { lat: 13.0108, lng: 74.7925 } 
  },
  { 
    id: 'inst-3', 
    name: 'St. Aloysius College (Autonomous) Mangaluru Central', 
    coordinates: { lat: 12.8733, lng: 74.8436 } 
  },
  { 
    id: 'inst-4', 
    name: 'Canara Engineering College (Benjanapadavu)', 
    coordinates: { lat: 12.8942, lng: 74.9936 } 
  },
  { 
    id: 'inst-5', 
    name: 'Government PU College for Women (Car Street Mangalore)', 
    coordinates: { lat: 12.8680, lng: 74.8380 } 
  },
  { 
    id: 'inst-6', 
    name: 'Alva’s College & Engineering Institute (Moodbidri)', 
    coordinates: { lat: 13.0650, lng: 74.9910 } 
  },
  { 
    id: 'inst-7', 
    name: 'Mangalore University Campus (Konaje / Deralakatte)', 
    coordinates: { lat: 12.8167, lng: 74.9278 } 
  },
  { 
    id: 'inst-8', 
    name: 'University College Mangalore (Hampankatta State School)', 
    coordinates: { lat: 12.8645, lng: 74.8420 } 
  },
];

// 3. 10 GOVERNMENT / REGIONAL BUSES (KSRTC & DAKSHINA KANNADA CITY CORRIDORS)
export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'bus-ksrtc-01',
    vehicleCode: 'KA-19-F-1101',
    name: 'KSRTC Express Bus #1101 (Mulki ➔ Mangalore Central)',
    vehicleType: 'Government Bus',
    startingVillageId: 'vil-mulki',
    destinationId: 'inst-1',
    totalCapacity: 45,
    availableSeats: 0, // Breakdown target in crisis mode
    availabilityStatus: 'unavailable',
    operatorConfirmed: false,
    contactNumber: '+91 98450 12001',
    driverName: 'Shekhar Poojary (KSRTC Mangaluru Depot)',
    stops: ['Mulki Bus Stand', 'Surathkal Junction', 'Kuloor Bridge', 'Lalbagh', 'Kadri Polytechnic'],
    departureTimes: ['06:45 AM', '07:30 AM', '08:15 AM'],
    routeName: 'NH-66 Coastal Corridor'
  },
  {
    id: 'bus-ksrtc-02',
    vehicleCode: 'KA-19-F-1102',
    name: 'KSRTC City Express #1102 (Surathkal ➔ Hampankatta)',
    vehicleType: 'Government Bus',
    startingVillageId: 'vil-surathkal',
    destinationId: 'inst-3',
    totalCapacity: 42,
    availableSeats: 0, // Breakdown target in crisis mode
    availabilityStatus: 'unavailable',
    operatorConfirmed: false,
    contactNumber: '+91 98450 12002',
    driverName: 'Anand Gowda (KSRTC)',
    stops: ['Surathkal NITK', 'Baikampady Industrial Gate', 'Kuloor', 'Ladyhill', 'Hampankatta'],
    departureTimes: ['07:00 AM', '07:45 AM', '08:30 AM'],
    routeName: 'NH-66 Surathkal-Mangalore Trunk'
  },
  {
    id: 'bus-ksrtc-03',
    vehicleCode: 'KA-19-F-1103',
    name: 'KSRTC Route 31 (Moodbidri ➔ Gurupura ➔ Mangalore)',
    vehicleType: 'Government Bus',
    startingVillageId: 'vil-moodbidri',
    destinationId: 'inst-1',
    totalCapacity: 48,
    availableSeats: 26,
    availabilityStatus: 'available',
    operatorConfirmed: true,
    contactNumber: '+91 98450 12003',
    driverName: 'Laxman Kulal (KSRTC)',
    stops: ['Moodbidri Bus Stand', 'Mijar', 'Gurupura Bridge', 'Vamanjoor', 'Kadri Hills'],
    departureTimes: ['07:10 AM', '08:00 AM'],
    routeName: 'NH-169 Moodbidri-Mangalore Highway'
  },
  {
    id: 'bus-ksrtc-04',
    vehicleCode: 'KA-19-F-1104',
    name: 'KSRTC Route 13 (Kateel ➔ Bajpe ➔ Mangalore Central)',
    vehicleType: 'Government Bus',
    startingVillageId: 'vil-kateel',
    destinationId: 'inst-1',
    totalCapacity: 40,
    availableSeats: 22,
    availabilityStatus: 'available',
    operatorConfirmed: true,
    contactNumber: '+91 98450 12004',
    driverName: 'Suresh Rai',
    stops: ['Kateel Temple Gate', 'Bajpe Airport Road', 'Kavoor Junction', 'Kadri Hills'],
    departureTimes: ['07:15 AM', '08:15 AM'],
    routeName: 'Kateel-Bajpe Feeder'
  },
  {
    id: 'bus-ksrtc-05',
    vehicleCode: 'KA-19-F-1105',
    name: 'KSRTC Route 42 (Farangipete ➔ Adyar ➔ St. Aloysius)',
    vehicleType: 'Government Bus',
    startingVillageId: 'vil-farangipete',
    destinationId: 'inst-3',
    totalCapacity: 44,
    availableSeats: 28,
    availabilityStatus: 'available',
    operatorConfirmed: true,
    contactNumber: '+91 98450 12005',
    driverName: 'Umesh Shetty',
    stops: ['Farangipete Market', 'Adyar Sahyadri Gate', 'Pumpwell Circle', 'Hampankatta'],
    departureTimes: ['07:20 AM', '08:10 AM'],
    routeName: 'NH-73 BC Road Corridor'
  },
  {
    id: 'bus-ksrtc-06',
    vehicleCode: 'KA-19-F-1106',
    name: 'KSRTC Coastal Shuttle #1106 (Ullal ➔ Thokkottu ➔ City)',
    vehicleType: 'Government Bus',
    startingVillageId: 'vil-ullal',
    destinationId: 'inst-5',
    totalCapacity: 38,
    availableSeats: 20,
    availabilityStatus: 'available',
    operatorConfirmed: true,
    contactNumber: '+91 98450 12006',
    driverName: 'Praveen Mendon',
    stops: ['Ullal Kodi', 'Thokkottu Overbridge', 'Jeppu', 'Car Street'],
    departureTimes: ['07:30 AM', '08:20 AM'],
    routeName: 'Ullal-Mangaluru Coastal Route'
  },
  {
    id: 'veh-van-01',
    vehicleCode: 'KA-19-SV-401',
    name: 'Dakshina Shared Van A (Force Trax Cruiser)',
    vehicleType: 'Shared Van',
    startingVillageId: 'vil-mulki',
    destinationId: 'inst-1',
    totalCapacity: 14,
    availableSeats: 12,
    availabilityStatus: 'available',
    operatorConfirmed: true,
    contactNumber: '+91 98450 12007',
    driverName: 'Dinesh Acharya (Mulki Operators Guild)',
    stops: ['Mulki Bus Stand', 'Surathkal Bypass', 'Kadri Polytechnic'],
    departureTimes: ['07:15 AM', '08:00 AM'],
    routeName: 'NH-66 Fast Van Feeder'
  },
  {
    id: 'veh-van-02',
    vehicleCode: 'KA-19-SV-402',
    name: 'Dakshina Shared Van B (Mahindra Bolero Maxi)',
    vehicleType: 'Shared Van',
    startingVillageId: 'vil-mulki',
    destinationId: 'inst-1',
    totalCapacity: 12,
    availableSeats: 10,
    availabilityStatus: 'available',
    operatorConfirmed: true,
    contactNumber: '+91 98450 12008',
    driverName: 'Santhosh Suvarna',
    stops: ['Mulki Bus Stand', 'Kinnigoli Cross', 'Kadri Hills'],
    departureTimes: ['07:25 AM', '08:10 AM'],
    routeName: 'Kinnigoli-Mulki Joint Shuttle'
  },
  {
    id: 'veh-auto-01',
    vehicleCode: 'KA-19-AU-501',
    name: 'Mangalore Auto Rickshaw Pool C (Bajaj Maxima 6-Seater)',
    vehicleType: 'Auto Rickshaw',
    startingVillageId: 'vil-mulki',
    destinationId: 'inst-1',
    totalCapacity: 6,
    availableSeats: 4,
    availabilityStatus: 'available',
    operatorConfirmed: true,
    contactNumber: '+91 98450 12009',
    driverName: 'Abdul Khader (Surathkal Auto Union)',
    stops: ['Surathkal Junction', 'Kuloor Bridge', 'Kadri'],
    departureTimes: ['07:30 AM'],
    routeName: 'Surathkal-Kadri Express Auto'
  },
  {
    id: 'veh-mini-01',
    vehicleCode: 'KA-19-MB-601',
    name: 'Kudla Mini Bus D (Eicher Starline 24)',
    vehicleType: 'Mini Bus',
    startingVillageId: 'vil-mulki',
    destinationId: 'inst-1',
    totalCapacity: 18,
    availableSeats: 8,
    availabilityStatus: 'available',
    operatorConfirmed: true,
    contactNumber: '+91 98450 12010',
    driverName: 'Chandrashekar Hegde',
    stops: ['Mulki Stand', 'Surathkal', 'Kuloor Bypass', 'Kadri Polytechnic'],
    departureTimes: ['07:35 AM'],
    routeName: 'Coastal Relief Mini Bus'
  }
];

// 4. 50 REALISTIC DEMO STUDENTS (MANGALORE REGION, DAKSHINA KANNADA)
export const generateDemoStudents = (): TransportRequest[] => {
  const students: TransportRequest[] = [];
  
  // Real Mangalorean student names
  const kannadaNames = [
    'Deeksha Shetty', 'Pawan Kumar Bhat', 'Ananya Poojary', 'Suhas Hegde', 'Keerthana Acharya',
    'Chirag Gowda', 'Navyashree Kulal', 'Prateek Alva', 'Sneha Mendon', 'Karthik Rao',
    'Akshatha Rai', 'Rakshith Suvarna', 'Bhavya Nayak', 'Shravan Kunder', 'Meghana Pai',
    'Naveen D’Souza', 'Lavanya Bangera', 'Darshan Devadiga', 'Ashritha Shenoy', 'Vikas Kotian',
    'Spoorthi Prabhu', 'Ganesh Moolya', 'Deepika Karanth', 'Rishabh Salian', 'Chaithra Gatti',
    'Abhishek Karkera', 'Swathi Bolar', 'Sumanth Kamath', 'Pooja Ullal', 'Rohit Ullal'
  ];

  const examSubjects = [
    'VTU Mechanical Engineering Design Lab (Semester Practical)',
    'DTE Karnataka Applied Electronics Board Exam',
    'Mangalore University Mathematics Honours Paper IV',
    'Karnataka State Board 2nd PUC Physics Practical'
  ];

  for (let i = 0; i < 30; i++) {
    // 18 students have scheduled university/board exams at 09:00 AM / 10:30 AM
    const hasExam = i < 18;
    const originalBus = i < 15 ? 'bus-ksrtc-01' : 'bus-ksrtc-02';
    const examTime = i % 2 === 0 ? '09:00 AM' : '10:30 AM';

    students.push({
      id: `req-stu-${i + 1}`,
      studentId: `stu-${i + 1}`,
      studentCode: `MLR-2026-${(i + 1).toString().padStart(3, '0')}`,
      displayName: kannadaNames[i],
      villageId: 'vil-mulki', // Mulki town on NH-66
      destinationId: 'inst-1', // Govt Polytechnic Kadri Hills Mangalore
      passengerCount: 1,
      status: 'pending',
      hasExam,
      examSubject: hasExam ? examSubjects[i % examSubjects.length] : undefined,
      examStartTime: hasExam ? examTime : undefined,
      minutesToExam: hasExam ? (examTime === '09:00 AM' ? 105 : 195) : undefined,
      originalBusId: originalBus,
      isSurgeStudent: false,
      createdAt: new Date(Date.now() - (30 - i) * 60000).toISOString()
    });
  }
  return students;
};

// Generates 40% surge demand (+12 students over baseline 30 = 42 total students)
export const generateSurgeStudents = (): TransportRequest[] => {
  const surgeNames = [
    'Vinayaka Bhat', 'Pratheeksha Poojary', 'Sudeep Kulal', 'Harshitha Hegde',
    'Gautham Rai', 'Divya Suvarna', 'Mohammed Zayd', 'Rithika D’Almeida',
    'Nithesh Acharya', 'Prajna Shenoy', 'Koushik Mendonca', 'Varshini Ullal'
  ];

  return surgeNames.map((name, idx) => {
    const hasExam = idx < 6;
    return {
      id: `req-surge-${idx + 1}`,
      studentId: `stu-surge-${idx + 1}`,
      studentCode: `MLR-SURGE-${(idx + 1).toString().padStart(3, '0')}`,
      displayName: `${name} (Surge)`,
      villageId: idx % 2 === 0 ? 'vil-mulki' : 'vil-surathkal',
      destinationId: 'inst-1',
      passengerCount: 1,
      status: 'pending',
      hasExam,
      examSubject: hasExam ? 'DTE Karnataka Electrical Machines Board Practical' : undefined,
      examStartTime: hasExam ? '09:00 AM' : undefined,
      minutesToExam: hasExam ? 105 : undefined,
      originalBusId: 'bus-ksrtc-02',
      isSurgeStudent: true,
      createdAt: new Date().toISOString()
    };
  });
};

export const INITIAL_DISRUPTION: Disruption = {
  id: 'disrupt-001',
  affectedRoute: 'Route 1101 (Mulki ➔ Surathkal ➔ Govt Polytechnic Kadri)',
  disruptionType: 'breakdown',
  description: 'Regular KSRTC Coastal Express #KA-19-F-1101 suffered transmission failure near Pavanje Bridge, Mulki. 30 engineering and polytechnic students waiting at Mulki bus shelter.',
  affectedStudentCount: 30,
  status: 'active',
  timestamp: new Date().toISOString(),
  startingVillageId: 'vil-mulki',
  destinationId: 'inst-1'
};
