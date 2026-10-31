import { connectDB } from "@/lib/mongodb";
import Train from "@/models/Train";
import Station from "@/models/Station";

const INITIAL_STATIONS = [
  {
    code: "NDLS",
    name: "New Delhi Railway Station",
    city: "New Delhi",
    state: "Delhi",
    zone: "Northern Railway (NR)",
    platforms: 16,
    isActive: true,
  },
  {
    code: "PNBE",
    name: "Patna Junction",
    city: "Patna",
    state: "Bihar",
    zone: "East Central Railway (ECR)",
    platforms: 10,
    isActive: true,
  },
  {
    code: "CDG",
    name: "Chandigarh Junction",
    city: "Chandigarh",
    state: "Punjab / Haryana",
    zone: "Northern Railway (NR)",
    platforms: 6,
    isActive: true,
  },
  {
    code: "ASR",
    name: "Amritsar Junction",
    city: "Amritsar",
    state: "Punjab",
    zone: "Northern Railway (NR)",
    platforms: 8,
    isActive: true,
  },
  {
    code: "BPL",
    name: "Bhopal Junction",
    city: "Bhopal",
    state: "Madhya Pradesh",
    zone: "West Central Railway (WCR)",
    platforms: 6,
    isActive: true,
  },
  {
    code: "HWH",
    name: "Howrah Junction",
    city: "Kolkata",
    state: "West Bengal",
    zone: "Eastern Railway (ER)",
    platforms: 23,
    isActive: true,
  },
  {
    code: "MMCT",
    name: "Mumbai Central",
    city: "Mumbai",
    state: "Maharashtra",
    zone: "Western Railway (WR)",
    platforms: 8,
    isActive: true,
  },
  {
    code: "KLK",
    name: "Kalka Railway Station",
    city: "Kalka",
    state: "Haryana",
    zone: "Northern Railway (NR)",
    platforms: 4,
    isActive: true,
  },
];

const INITIAL_TRAINS = [
  {
    trainNumber: "12002",
    trainName: "Shatabdi Express",
    source: "New Delhi",
    destination: "Chandigarh",
    departure: "07:20",
    arrival: "10:45",
    duration: "3h 25m",
    fare: 850,
    totalSeats: 72,
    availableSeats: 32,
    coachTypes: ["CC", "EC"],
    runsOn: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    isActive: true,
  },
  {
    trainNumber: "12424",
    trainName: "Dibrugarh Rajdhani",
    source: "New Delhi",
    destination: "Patna",
    departure: "16:20",
    arrival: "04:30",
    duration: "12h 10m",
    fare: 1450,
    totalSeats: 72,
    availableSeats: 18,
    coachTypes: ["3A", "2A", "1A"],
    runsOn: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    isActive: true,
  },
  {
    trainNumber: "12310",
    trainName: "Rajendra Nagar Express",
    source: "New Delhi",
    destination: "Patna",
    departure: "17:55",
    arrival: "07:10",
    duration: "13h 15m",
    fare: 720,
    totalSeats: 72,
    availableSeats: 12,
    coachTypes: ["SL", "3A", "2A"],
    runsOn: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    isActive: true,
  },
  {
    trainNumber: "12005",
    trainName: "Kalka Shatabdi",
    source: "New Delhi",
    destination: "Chandigarh",
    departure: "17:15",
    arrival: "20:45",
    duration: "3h 30m",
    fare: 900,
    totalSeats: 72,
    availableSeats: 24,
    coachTypes: ["CC", "EC"],
    runsOn: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    isActive: true,
  },
  {
    trainNumber: "12001",
    trainName: "Bhopal Shatabdi Express",
    source: "New Delhi",
    destination: "Bhopal",
    departure: "06:00",
    arrival: "14:05",
    duration: "8h 05m",
    fare: 1100,
    totalSeats: 72,
    availableSeats: 28,
    coachTypes: ["CC", "EC"],
    runsOn: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    isActive: true,
  },
  {
    trainNumber: "12951",
    trainName: "Mumbai Rajdhani",
    source: "Mumbai",
    destination: "New Delhi",
    departure: "16:00",
    arrival: "08:35",
    duration: "16h 35m",
    fare: 1950,
    totalSeats: 72,
    availableSeats: 20,
    coachTypes: ["3A", "2A", "1A"],
    runsOn: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    isActive: true,
  },
];

/**
 * Ensures MongoDB contains baseline train and station records if collections are empty.
 */
export async function ensureDefaultAdminData() {
  try {
    await connectDB();

    const stationCount = await Station.countDocuments();
    if (stationCount === 0) {
      await Station.insertMany(INITIAL_STATIONS);
      console.log(`[Seed] Seeded ${INITIAL_STATIONS.length} default stations.`);
    }

    const trainCount = await Train.countDocuments();
    if (trainCount === 0) {
      await Train.insertMany(INITIAL_TRAINS);
      console.log(`[Seed] Seeded ${INITIAL_TRAINS.length} default trains.`);
    }
  } catch (err) {
    console.error("[Seed] Failed to seed default train and station data:", err);
  }
}

