import { getTemplate } from "./coach-templates";
import { ICoachEntry, ICoachConfiguration } from "@/models/CoachConfiguration";

interface TrainCompositionInput {
  trainNumber: string;
  category?: string;
  coachTypes?: string[];
}

/**
 * Generates an authentic, standard Indian Railways coach composition for any train
 * based on its train category and supported coach classes.
 */
export function generateDefaultCoachConfiguration(
  input: TrainCompositionInput
): Omit<ICoachConfiguration, "createdAt" | "updatedAt"> {
  const trainNumber = input.trainNumber.trim().toUpperCase();
  const category = (input.category || "").toLowerCase();
  const rawClasses = input.coachTypes || [];

  const coaches: ICoachEntry[] = [];
  let seq = 1;

  // Normalized classes set
  const supportedClasses = new Set<string>(
    rawClasses.map((c) => c.trim().toUpperCase())
  );

  if (category.includes("rajdhani") || category.includes("tejas")) {
    // Premium Rajdhani / Tejas Rake
    // 1A (H1)
    coaches.push({
      coachId: "H1",
      coachClass: "1A",
      sequence: seq++,
      layoutTemplateId: "1A-22",
      totalCapacity: 22,
      isActive: true,
    });

    // 2A (A1, A2)
    for (let i = 1; i <= 2; i++) {
      coaches.push({
        coachId: `A${i}`,
        coachClass: "2A",
        sequence: seq++,
        layoutTemplateId: "2A-48",
        totalCapacity: 48,
        isActive: true,
      });
    }

    // 3A (B1 to B5)
    for (let i = 1; i <= 5; i++) {
      coaches.push({
        coachId: `B${i}`,
        coachClass: "3A",
        sequence: seq++,
        layoutTemplateId: "3A-64",
        totalCapacity: 64,
        isActive: true,
      });
    }
  } else if (category.includes("shatabdi")) {
    if (category.includes("jan")) {
      // Jan Shatabdi Rake (AC Chair Car + Second Seating)
      for (let i = 1; i <= 2; i++) {
        coaches.push({
          coachId: `C${i}`,
          coachClass: "CC",
          sequence: seq++,
          layoutTemplateId: "CC-73",
          totalCapacity: 73,
          isActive: true,
        });
      }
      for (let i = 1; i <= 6; i++) {
        coaches.push({
          coachId: `D${i}`,
          coachClass: "2S",
          sequence: seq++,
          layoutTemplateId: "2S-108",
          totalCapacity: 108,
          isActive: true,
        });
      }
    } else {
      // Regular Shatabdi (Executive 1A/EC + AC Chair Car)
      coaches.push({
        coachId: "E1",
        coachClass: "1A",
        sequence: seq++,
        layoutTemplateId: "1A-22",
        totalCapacity: 22,
        isActive: true,
      });
      for (let i = 1; i <= 6; i++) {
        coaches.push({
          coachId: `C${i}`,
          coachClass: "CC",
          sequence: seq++,
          layoutTemplateId: "CC-73",
          totalCapacity: 73,
          isActive: true,
        });
      }
    }
  } else if (category.includes("garib rath")) {
    // Garib Rath: All 3A
    for (let i = 1; i <= 8; i++) {
      coaches.push({
        coachId: `G${i}`,
        coachClass: "3A",
        sequence: seq++,
        layoutTemplateId: "3A-64",
        totalCapacity: 64,
        isActive: true,
      });
    }
  } else {
    // Standard Superfast / Express / Mail / Passenger Rake
    // If specific coachTypes are present, generate corresponding coaches
    const has1A = supportedClasses.has("1A");
    const has2A = supportedClasses.has("2A");
    const has3A = supportedClasses.has("3A");
    const hasCC = supportedClasses.has("CC");
    const hasSL = supportedClasses.has("SL");
    const has2S = supportedClasses.has("2S");

    if (has1A) {
      coaches.push({
        coachId: "H1",
        coachClass: "1A",
        sequence: seq++,
        layoutTemplateId: "1A-22",
        totalCapacity: 22,
        isActive: true,
      });
    }

    if (has2A) {
      for (let i = 1; i <= 2; i++) {
        coaches.push({
          coachId: `A${i}`,
          coachClass: "2A",
          sequence: seq++,
          layoutTemplateId: "2A-48",
          totalCapacity: 48,
          isActive: true,
        });
      }
    }

    if (has3A) {
      for (let i = 1; i <= 4; i++) {
        coaches.push({
          coachId: `B${i}`,
          coachClass: "3A",
          sequence: seq++,
          layoutTemplateId: "3A-64",
          totalCapacity: 64,
          isActive: true,
        });
      }
    }

    if (hasCC) {
      for (let i = 1; i <= 3; i++) {
        coaches.push({
          coachId: `C${i}`,
          coachClass: "CC",
          sequence: seq++,
          layoutTemplateId: "CC-73",
          totalCapacity: 73,
          isActive: true,
        });
      }
    }

    if (hasSL || (!has1A && !has2A && !has3A && !hasCC && !has2S)) {
      // Default to Sleeper coaches if specified or fallback
      for (let i = 1; i <= 6; i++) {
        coaches.push({
          coachId: `S${i}`,
          coachClass: "SL",
          sequence: seq++,
          layoutTemplateId: "SL-72",
          totalCapacity: 72,
          isActive: true,
        });
      }
    }

    if (has2S) {
      for (let i = 1; i <= 3; i++) {
        coaches.push({
          coachId: `D${i}`,
          coachClass: "2S",
          sequence: seq++,
          layoutTemplateId: "2S-108",
          totalCapacity: 108,
          isActive: true,
        });
      }
    }
  }

  // Fallback safety if no coaches were added
  if (coaches.length === 0) {
    coaches.push({
      coachId: "S1",
      coachClass: "SL",
      sequence: 1,
      layoutTemplateId: "SL-72",
      totalCapacity: 72,
      isActive: true,
    });
  }

  // Verify capacities match templates
  for (const c of coaches) {
    const tmpl = getTemplate(c.layoutTemplateId);
    c.totalCapacity = tmpl.totalCapacity;
  }

  const totalCapacity = coaches.reduce((acc, c) => acc + c.totalCapacity, 0);

  return {
    trainNumber,
    coaches,
    totalCoaches: coaches.length,
    totalCapacity,
    configurationSource: "demo",
    version: 1,
  };
}
