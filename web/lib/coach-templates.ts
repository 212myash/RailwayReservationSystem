export type CoachClass = "SL" | "3A" | "2A" | "1A" | "CC" | "2S";

export type BerthType =
  | "LB" // Lower Berth
  | "MB" // Middle Berth
  | "UB" // Upper Berth
  | "SL" // Side Lower
  | "SU" // Side Upper
  | "CABIN_LB" // AC First Cabin Lower Berth
  | "CABIN_UB" // AC First Cabin Upper Berth
  | "COUPE_LB" // AC First Coupe Lower Berth
  | "COUPE_UB" // AC First Coupe Upper Berth
  | "WINDOW" // Chair Car Window Seat
  | "MIDDLE" // Chair Car Middle Seat
  | "AISLE"; // Chair Car Aisle Seat

export interface BerthDefinition {
  number: number;
  type: BerthType;
  label: string;
  bayNumber?: number;
  compartmentType?: "BAY" | "CABIN" | "COUPE" | "ROW";
  compartmentCode?: string; // e.g. "Bay 1", "Cabin A", "Coupe E", "Row 1"
  isSide?: boolean;
  positionInCompartment?: number;
}

export interface CoachTemplate {
  id: string;
  name: string;
  coachClass: CoachClass;
  totalCapacity: number;
  compartmentCount: number;
  compartmentType: "BAY" | "CABIN_COUPE" | "ROW";
  description: string;
  generateBerths: () => BerthDefinition[];
}

export const BERTH_TYPE_NAMES: Record<BerthType, string> = {
  LB: "Lower Berth",
  MB: "Middle Berth",
  UB: "Upper Berth",
  SL: "Side Lower",
  SU: "Side Upper",
  CABIN_LB: "Cabin Lower Berth",
  CABIN_UB: "Cabin Upper Berth",
  COUPE_LB: "Coupe Lower Berth",
  COUPE_UB: "Coupe Upper Berth",
  WINDOW: "Window Seat",
  MIDDLE: "Middle Seat",
  AISLE: "Aisle Seat",
};

export const COACH_CLASS_NAMES: Record<CoachClass, string> = {
  SL: "Sleeper Class (SL)",
  "3A": "AC 3 Tier (3A)",
  "2A": "AC 2 Tier (2A)",
  "1A": "AC First Class (1A)",
  CC: "AC Chair Car (CC)",
  "2S": "Second Seating (2S)",
};

/**
 * SL-72: Standard Indian Railways Sleeper Layout (72 berths, 9 bays).
 * Each bay has 8 berths: 6 inner (LB, MB, UB, LB, MB, UB) + 2 side (SL, SU).
 */
export function generateSL72Berths(): BerthDefinition[] {
  const berths: BerthDefinition[] = [];
  const totalBays = 9;

  for (let b = 1; b <= totalBays; b++) {
    const start = (b - 1) * 8;
    const compartmentCode = `Bay ${b}`;

    // Inner berths (benches facing each other)
    berths.push({
      number: start + 1,
      type: "LB",
      label: "Lower Berth",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: false,
      positionInCompartment: 1,
    });
    berths.push({
      number: start + 2,
      type: "MB",
      label: "Middle Berth",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: false,
      positionInCompartment: 2,
    });
    berths.push({
      number: start + 3,
      type: "UB",
      label: "Upper Berth",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: false,
      positionInCompartment: 3,
    });
    berths.push({
      number: start + 4,
      type: "LB",
      label: "Lower Berth",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: false,
      positionInCompartment: 4,
    });
    berths.push({
      number: start + 5,
      type: "MB",
      label: "Middle Berth",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: false,
      positionInCompartment: 5,
    });
    berths.push({
      number: start + 6,
      type: "UB",
      label: "Upper Berth",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: false,
      positionInCompartment: 6,
    });

    // Side berths across the aisle
    berths.push({
      number: start + 7,
      type: "SL",
      label: "Side Lower",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: true,
      positionInCompartment: 7,
    });
    berths.push({
      number: start + 8,
      type: "SU",
      label: "Side Upper",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: true,
      positionInCompartment: 8,
    });
  }

  return berths;
}

/**
 * 3A-64: Standard AC 3 Tier Layout (64 berths, 8 bays).
 * Each bay has 8 berths: 6 inner (LB, MB, UB, LB, MB, UB) + 2 side (SL, SU).
 */
export function generate3A64Berths(): BerthDefinition[] {
  const berths: BerthDefinition[] = [];
  const totalBays = 8;

  for (let b = 1; b <= totalBays; b++) {
    const start = (b - 1) * 8;
    const compartmentCode = `Bay ${b}`;

    berths.push({
      number: start + 1,
      type: "LB",
      label: "Lower Berth",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: false,
      positionInCompartment: 1,
    });
    berths.push({
      number: start + 2,
      type: "MB",
      label: "Middle Berth",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: false,
      positionInCompartment: 2,
    });
    berths.push({
      number: start + 3,
      type: "UB",
      label: "Upper Berth",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: false,
      positionInCompartment: 3,
    });
    berths.push({
      number: start + 4,
      type: "LB",
      label: "Lower Berth",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: false,
      positionInCompartment: 4,
    });
    berths.push({
      number: start + 5,
      type: "MB",
      label: "Middle Berth",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: false,
      positionInCompartment: 5,
    });
    berths.push({
      number: start + 6,
      type: "UB",
      label: "Upper Berth",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: false,
      positionInCompartment: 6,
    });

    berths.push({
      number: start + 7,
      type: "SL",
      label: "Side Lower",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: true,
      positionInCompartment: 7,
    });
    berths.push({
      number: start + 8,
      type: "SU",
      label: "Side Upper",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: true,
      positionInCompartment: 8,
    });
  }

  return berths;
}

/**
 * 2A-48: Standard AC 2 Tier Layout (48 berths, 8 bays).
 * Each bay has 6 berths: 4 inner (LB, UB, LB, UB) + 2 side (SL, SU). NO MIDDLE BERTHS!
 */
export function generate2A48Berths(): BerthDefinition[] {
  const berths: BerthDefinition[] = [];
  const totalBays = 8;

  for (let b = 1; b <= totalBays; b++) {
    const start = (b - 1) * 6;
    const compartmentCode = `Bay ${b}`;

    // Inner berths (2 Lower, 2 Upper - NO middle berths)
    berths.push({
      number: start + 1,
      type: "LB",
      label: "Lower Berth",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: false,
      positionInCompartment: 1,
    });
    berths.push({
      number: start + 2,
      type: "UB",
      label: "Upper Berth",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: false,
      positionInCompartment: 2,
    });
    berths.push({
      number: start + 3,
      type: "LB",
      label: "Lower Berth",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: false,
      positionInCompartment: 3,
    });
    berths.push({
      number: start + 4,
      type: "UB",
      label: "Upper Berth",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: false,
      positionInCompartment: 4,
    });

    // Side berths
    berths.push({
      number: start + 5,
      type: "SL",
      label: "Side Lower",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: true,
      positionInCompartment: 5,
    });
    berths.push({
      number: start + 6,
      type: "SU",
      label: "Side Upper",
      bayNumber: b,
      compartmentType: "BAY",
      compartmentCode,
      isSide: true,
      positionInCompartment: 6,
    });
  }

  return berths;
}

/**
 * 1A-22: Standard AC First Class Layout (22 berths).
 * Comprises 4 Cabins (A, B, C, D of 4 berths each = 16 berths)
 * and 3 Coupes (E, F, G of 2 berths each = 6 berths). Total: 22 berths.
 */
export function generate1A22Berths(): BerthDefinition[] {
  const berths: BerthDefinition[] = [];
  let seatNumber = 1;

  // 4 Cabins (A, B, C, D)
  const cabins = ["A", "B", "C", "D"];
  for (const letter of cabins) {
    const compCode = `Cabin ${letter}`;
    berths.push({
      number: seatNumber++,
      type: "CABIN_LB",
      label: "Cabin Lower Berth",
      compartmentType: "CABIN",
      compartmentCode: compCode,
      isSide: false,
      positionInCompartment: 1,
    });
    berths.push({
      number: seatNumber++,
      type: "CABIN_UB",
      label: "Cabin Upper Berth",
      compartmentType: "CABIN",
      compartmentCode: compCode,
      isSide: false,
      positionInCompartment: 2,
    });
    berths.push({
      number: seatNumber++,
      type: "CABIN_LB",
      label: "Cabin Lower Berth",
      compartmentType: "CABIN",
      compartmentCode: compCode,
      isSide: false,
      positionInCompartment: 3,
    });
    berths.push({
      number: seatNumber++,
      type: "CABIN_UB",
      label: "Cabin Upper Berth",
      compartmentType: "CABIN",
      compartmentCode: compCode,
      isSide: false,
      positionInCompartment: 4,
    });
  }

  // 3 Coupes (E, F, G)
  const coupes = ["E", "F", "G"];
  for (const letter of coupes) {
    const compCode = `Coupe ${letter}`;
    berths.push({
      number: seatNumber++,
      type: "COUPE_LB",
      label: "Coupe Lower Berth",
      compartmentType: "COUPE",
      compartmentCode: compCode,
      isSide: false,
      positionInCompartment: 1,
    });
    berths.push({
      number: seatNumber++,
      type: "COUPE_UB",
      label: "Coupe Upper Berth",
      compartmentType: "COUPE",
      compartmentCode: compCode,
      isSide: false,
      positionInCompartment: 2,
    });
  }

  return berths;
}

/**
 * CC-73: Standard AC Chair Car Layout (73 seats).
 * 14 rows of 5 seats (3+2 seating: Window, Middle, Aisle | Aisle, Window) + Row 15 of 3 seats.
 */
export function generateCC73Berths(): BerthDefinition[] {
  const berths: BerthDefinition[] = [];
  let seatNumber = 1;

  for (let r = 1; r <= 14; r++) {
    const compCode = `Row ${r}`;
    berths.push({
      number: seatNumber++,
      type: "WINDOW",
      label: "Window Seat",
      bayNumber: r,
      compartmentType: "ROW",
      compartmentCode: compCode,
      isSide: false,
      positionInCompartment: 1,
    });
    berths.push({
      number: seatNumber++,
      type: "MIDDLE",
      label: "Middle Seat",
      bayNumber: r,
      compartmentType: "ROW",
      compartmentCode: compCode,
      isSide: false,
      positionInCompartment: 2,
    });
    berths.push({
      number: seatNumber++,
      type: "AISLE",
      label: "Aisle Seat",
      bayNumber: r,
      compartmentType: "ROW",
      compartmentCode: compCode,
      isSide: false,
      positionInCompartment: 3,
    });
    berths.push({
      number: seatNumber++,
      type: "AISLE",
      label: "Aisle Seat",
      bayNumber: r,
      compartmentType: "ROW",
      compartmentCode: compCode,
      isSide: true,
      positionInCompartment: 4,
    });
    berths.push({
      number: seatNumber++,
      type: "WINDOW",
      label: "Window Seat",
      bayNumber: r,
      compartmentType: "ROW",
      compartmentCode: compCode,
      isSide: true,
      positionInCompartment: 5,
    });
  }

  // Row 15 has 3 seats
  const row15Code = "Row 15";
  berths.push({
    number: seatNumber++,
    type: "WINDOW",
    label: "Window Seat",
    bayNumber: 15,
    compartmentType: "ROW",
    compartmentCode: row15Code,
    isSide: false,
    positionInCompartment: 1,
  });
  berths.push({
    number: seatNumber++,
    type: "MIDDLE",
    label: "Middle Seat",
    bayNumber: 15,
    compartmentType: "ROW",
    compartmentCode: row15Code,
    isSide: false,
    positionInCompartment: 2,
  });
  berths.push({
    number: seatNumber++,
    type: "AISLE",
    label: "Aisle Seat",
    bayNumber: 15,
    compartmentType: "ROW",
    compartmentCode: row15Code,
    isSide: false,
    positionInCompartment: 3,
  });

  return berths;
}

/**
 * 2S-108: Second Seating Layout (108 seats).
 * 18 rows of 6 seats (3+3 bench seating: Window, Middle, Aisle | Aisle, Middle, Window).
 */
export function generate2S108Berths(): BerthDefinition[] {
  const berths: BerthDefinition[] = [];
  let seatNumber = 1;

  for (let r = 1; r <= 18; r++) {
    const compCode = `Row ${r}`;
    berths.push({
      number: seatNumber++,
      type: "WINDOW",
      label: "Window Seat",
      bayNumber: r,
      compartmentType: "ROW",
      compartmentCode: compCode,
      isSide: false,
      positionInCompartment: 1,
    });
    berths.push({
      number: seatNumber++,
      type: "MIDDLE",
      label: "Middle Seat",
      bayNumber: r,
      compartmentType: "ROW",
      compartmentCode: compCode,
      isSide: false,
      positionInCompartment: 2,
    });
    berths.push({
      number: seatNumber++,
      type: "AISLE",
      label: "Aisle Seat",
      bayNumber: r,
      compartmentType: "ROW",
      compartmentCode: compCode,
      isSide: false,
      positionInCompartment: 3,
    });
    berths.push({
      number: seatNumber++,
      type: "AISLE",
      label: "Aisle Seat",
      bayNumber: r,
      compartmentType: "ROW",
      compartmentCode: compCode,
      isSide: true,
      positionInCompartment: 4,
    });
    berths.push({
      number: seatNumber++,
      type: "MIDDLE",
      label: "Middle Seat",
      bayNumber: r,
      compartmentType: "ROW",
      compartmentCode: compCode,
      isSide: true,
      positionInCompartment: 5,
    });
    berths.push({
      number: seatNumber++,
      type: "WINDOW",
      label: "Window Seat",
      bayNumber: r,
      compartmentType: "ROW",
      compartmentCode: compCode,
      isSide: true,
      positionInCompartment: 6,
    });
  }

  return berths;
}

export const COACH_TEMPLATES: Record<string, CoachTemplate> = {
  "SL-72": {
    id: "SL-72",
    name: "Sleeper Class (72 Berths, 9 Bays)",
    coachClass: "SL",
    totalCapacity: 72,
    compartmentCount: 9,
    compartmentType: "BAY",
    description: "Standard 72-berth sleeper coach with 9 open bays (LB, MB, UB, SL, SU).",
    generateBerths: generateSL72Berths,
  },
  "3A-64": {
    id: "3A-64",
    name: "AC 3 Tier (64 Berths, 8 Bays)",
    coachClass: "3A",
    totalCapacity: 64,
    compartmentCount: 8,
    compartmentType: "BAY",
    description: "Standard 64-berth AC 3-tier coach with 8 open bays (LB, MB, UB, SL, SU).",
    generateBerths: generate3A64Berths,
  },
  "2A-48": {
    id: "2A-48",
    name: "AC 2 Tier (48 Berths, 8 Bays)",
    coachClass: "2A",
    totalCapacity: 48,
    compartmentCount: 8,
    compartmentType: "BAY",
    description: "Spacious 48-berth AC 2-tier coach with 8 bays. Lower, Upper and Side berths only (no middle berths).",
    generateBerths: generate2A48Berths,
  },
  "1A-22": {
    id: "1A-22",
    name: "AC First Class (22 Berths, 4 Cabins + 3 Coupes)",
    coachClass: "1A",
    totalCapacity: 22,
    compartmentCount: 7,
    compartmentType: "CABIN_COUPE",
    description: "Premium AC First Class coach featuring 4 lockable 4-berth cabins (A-D) and 3 lockable 2-berth coupes (E-G).",
    generateBerths: generate1A22Berths,
  },
  "CC-73": {
    id: "CC-73",
    name: "AC Chair Car (73 Seats, 15 Rows)",
    coachClass: "CC",
    totalCapacity: 73,
    compartmentCount: 15,
    compartmentType: "ROW",
    description: "High-density 73-seat air-conditioned chair car with 3+2 seating configuration.",
    generateBerths: generateCC73Berths,
  },
  "2S-108": {
    id: "2S-108",
    name: "Second Seating (108 Seats, 18 Rows)",
    coachClass: "2S",
    totalCapacity: 108,
    compartmentCount: 18,
    compartmentType: "ROW",
    description: "Standard non-AC second seating coach with 18 rows of 3+3 seating.",
    generateBerths: generate2S108Berths,
  },
};

export function getTemplate(templateId: string): CoachTemplate {
  const template = COACH_TEMPLATES[templateId];
  if (template) return template;
  // Fallback to SL-72 if unknown template
  return COACH_TEMPLATES["SL-72"];
}

export function getDefaultTemplateForClass(coachClass: CoachClass): CoachTemplate {
  switch (coachClass) {
    case "1A":
      return COACH_TEMPLATES["1A-22"];
    case "2A":
      return COACH_TEMPLATES["2A-48"];
    case "3A":
      return COACH_TEMPLATES["3A-64"];
    case "CC":
      return COACH_TEMPLATES["CC-73"];
    case "2S":
      return COACH_TEMPLATES["2S-108"];
    case "SL":
    default:
      return COACH_TEMPLATES["SL-72"];
  }
}

export function getAllTemplates(): CoachTemplate[] {
  return Object.values(COACH_TEMPLATES);
}
