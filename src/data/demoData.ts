import { Village, Institution, Vehicle, TransportRequest, Disruption } from '../types';

export const DEMO_VILLAGES: Village[] = [
  { id: 'vil-1', name: 'Rampur Village', coordinates: { lat: 26.8467, lng: 80.9462 } },
  { id: 'vil-2', name: 'Shivpur Hamlet', coordinates: { lat: 26.8520, lng: 80.9310 } },
  { id: 'vil-3', name: 'Kishanpur Cross', coordinates: { lat: 26.8610, lng: 80.9550 } },
  { id: 'vil-4', name: 'Balarampur Junction', coordinates: { lat: 26.8390, lng: 80.9200 } },
];

export const DEMO_INSTITUTIONS: Institution[] = [
  { id: 'inst-1', name: 'Government Polytechnic Institute', coordinates: { lat: 26.8700, lng: 80.9700 } },
  { id: 'inst-2', name: 'District Higher Secondary School', coordinates: { lat: 26.8650, lng: 80.9820 } },
];

// Baseline alternative fleet (Total seats: 12 + 10 + 4 + 8 = 34 seats)
export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'veh-1',
    vehicleCode: 'UP-32-SV-101',
    name: 'Shared Van A (Mahindra Bolero Maxi)',
    vehicleType: 'Shared Van',
    startingVillageId: 'vil-1',
    destinationId: 'inst-1',
    totalCapacity: 14,
    availableSeats: 12,
    availabilityStatus: 'available',
    operatorConfirmed: true,
    contactNumber: '+91 98765 43210',
    driverName: 'Rameshwar Yadav'
  },
  {
    id: 'veh-2',
    vehicleCode: 'UP-32-SV-102',
    name: 'Shared Van B (Force Trax Cruiser)',
    vehicleType: 'Shared Van',
    startingVillageId: 'vil-1',
    destinationId: 'inst-1',
    totalCapacity: 12,
    availableSeats: 10,
    availabilityStatus: 'available',
    operatorConfirmed: true,
    contactNumber: '+91 98765 43211',
    driverName: 'Gurpal Singh'
  },
  {
    id: 'veh-3',
    vehicleCode: 'UP-32-AU-404',
    name: 'Auto C (Bajaj Maxima Z 6-Seater)',
    vehicleType: 'Auto Rickshaw',
    startingVillageId: 'vil-1',
    destinationId: 'inst-1',
    totalCapacity: 6,
    availableSeats: 4,
    availabilityStatus: 'available',
    operatorConfirmed: true,
    contactNumber: '+91 98765 43212',
    driverName: 'Mohd. Imran'
  },
  {
    id: 'veh-4',
    vehicleCode: 'UP-32-MB-808',
    name: 'Mini Bus D (Eicher Starline 24)',
    vehicleType: 'Mini Bus',
    startingVillageId: 'vil-1',
    destinationId: 'inst-1',
    totalCapacity: 18,
    availableSeats: 8,
    availabilityStatus: 'available',
    operatorConfirmed: true,
    contactNumber: '+91 98765 43213',
    driverName: 'Sanjay Kumar Verma'
  }
];

// Baseline 30 students + realistic examination metadata (Exam Day Crisis)
export const generateDemoStudents = (): TransportRequest[] => {
  const students: TransportRequest[] = [];
  const names = [
    'Aarav Sharma', 'Pooja Verma', 'Vikram Patel', 'Anjali Yadav', 'Rahul Chauhan',
    'Neha Tiwari', 'Rohan Gupta', 'Kavita Singh', 'Amit Mourya', 'Sunita Rawat',
    'Deepak Lodhi', 'Priyanka Pal', 'Suraj Nishad', 'Rekha Bind', 'Arjun Prajapati',
    'Sushma Gautam', 'Manoj Maurya', 'Geeta Yadav', 'Vinod Kushwaha', 'Komal Pandey',
    'Dinesh Kashyap', 'Mamta Devi', 'Rakesh Dubey', 'Seema Shukla', 'Gaurav Mishra',
    'Shalini Saxena', 'Karan Saini', 'Monika Tomar', 'Satish Kumar', 'Anita Rathore'
  ];

  const examSubjects = [
    'Applied Mathematics II (Board Practical)',
    'Mechanical Workshop Practice',
    'Electrical Circuits & Machine Lab',
    'Computer Programming in C++'
  ];

  for (let i = 0; i < 30; i++) {
    // 18 students have scheduled semester examinations starting at 09:00 AM (within 2 hours)
    const hasExam = i < 18;
    const originalBus = i < 16 ? 'bus-govt-01' : 'bus-govt-02';

    students.push({
      id: `req-stu-${i + 1}`,
      studentId: `stu-${i + 1}`,
      studentCode: `RD-2026-${(i + 1).toString().padStart(3, '0')}`,
      displayName: names[i],
      villageId: 'vil-1', // Rampur Village
      destinationId: 'inst-1', // Govt Polytechnic
      passengerCount: 1,
      status: 'pending',
      hasExam,
      examSubject: hasExam ? examSubjects[i % examSubjects.length] : undefined,
      examStartTime: hasExam ? '09:00 AM' : undefined,
      minutesToExam: hasExam ? 105 : undefined, // 7:15 AM to 9:00 AM
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
    'Pradeep Maurya', 'Jyoti Chaurasia', 'Abhishek Soni', 'Swati Bajpai',
    'Santosh Rawat', 'Rani Prajapati', 'Harish Chandra', 'Madhu Lodhi',
    'Tarun Vishwakarma', 'Kiran Pal', 'Brijesh Nishad', 'Preeti Gautam'
  ];

  return surgeNames.map((name, idx) => {
    // 6 of the surge students also have emergency lab examinations
    const hasExam = idx < 6;
    return {
      id: `req-surge-${idx + 1}`,
      studentId: `stu-surge-${idx + 1}`,
      studentCode: `RD-SURGE-${(idx + 1).toString().padStart(3, '0')}`,
      displayName: `${name} (Surge)`,
      villageId: idx % 2 === 0 ? 'vil-1' : 'vil-2',
      destinationId: 'inst-1',
      passengerCount: 1,
      status: 'pending',
      hasExam,
      examSubject: hasExam ? 'Semester Engineering Physics Board Practical' : undefined,
      examStartTime: hasExam ? '09:00 AM' : undefined,
      minutesToExam: hasExam ? 105 : undefined,
      originalBusId: 'bus-govt-02',
      isSurgeStudent: true,
      createdAt: new Date().toISOString()
    };
  });
};

export const INITIAL_DISRUPTION: Disruption = {
  id: 'disrupt-001',
  affectedRoute: 'Route R-14 (Rampur Village ➔ Govt Polytechnic Institute)',
  disruptionType: 'breakdown',
  description: 'Regular State Transport Bus #UP-32-BT-0921 suffered axle breakdown near Rampur Canal Bridge. 30 polytechnic exam students stranded at Rampur bus shelter.',
  affectedStudentCount: 30,
  status: 'active',
  timestamp: new Date().toISOString(),
  startingVillageId: 'vil-1',
  destinationId: 'inst-1'
};
