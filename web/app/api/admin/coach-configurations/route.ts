import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import CoachConfiguration, { ICoachEntry } from "@/models/CoachConfiguration";
import Train from "@/models/Train";
import {
  COACH_TEMPLATES,
  CoachClass,
  getTemplate,
} from "@/lib/coach-templates";
import { generateDefaultCoachConfiguration } from "@/lib/coach-composition-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: Fetch coach configuration for a train or search configured trains
export async function GET(request: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const trainNumber = searchParams.get("trainNumber")?.trim();

    if (trainNumber) {
      let config = await CoachConfiguration.findOne({
        trainNumber: trainNumber.toUpperCase(),
      }).lean();

      if (!config) {
        // Auto-generate default configuration if train exists
        const train = await Train.findOne({
          $or: [{ trainNumber: trainNumber.toUpperCase() }, { number: trainNumber.toUpperCase() }],
        })
          .select("trainNumber number name category coachTypes")
          .lean();

        if (!train) {
          return NextResponse.json(
            { success: false, message: `Train ${trainNumber} not found.` },
            { status: 404 }
          );
        }

        const trainNum = train.trainNumber || (train as unknown as { number: string }).number;

        const defaultConfig = generateDefaultCoachConfiguration({
          trainNumber: trainNum,
          category: train.category,
          coachTypes: train.coachTypes,
        });

        config = await CoachConfiguration.create(defaultConfig);
      }

      // Also get train info
      const trainInfo = await Train.findOne({
        $or: [{ trainNumber: trainNumber.toUpperCase() }, { number: trainNumber.toUpperCase() }],
      })
        .select("trainNumber number name category coachTypes totalSeats")
        .lean();

      return NextResponse.json(
        {
          success: true,
          configuration: config,
          train: trainInfo,
          availableTemplates: Object.values(COACH_TEMPLATES).map((t) => ({
            id: t.id,
            name: t.name,
            coachClass: t.coachClass,
            totalCapacity: t.totalCapacity,
            compartmentCount: t.compartmentCount,
            description: t.description,
          })),
        },
        { status: 200 }
      );
    }

    // List recent configurations or search
    const query = searchParams.get("q")?.trim();
    const filter: Record<string, unknown> = {};

    if (query) {
      filter.$or = [
        { trainNumber: { $regex: query, $options: "i" } },
      ];
    }

    const configs = await CoachConfiguration.find(filter)
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json(
      {
        success: true,
        configurations: configs,
        availableTemplates: Object.values(COACH_TEMPLATES).map((t) => ({
          id: t.id,
          name: t.name,
          coachClass: t.coachClass,
          totalCapacity: t.totalCapacity,
          compartmentCount: t.compartmentCount,
          description: t.description,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin fetch coach configurations failed:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch coach configurations." },
      { status: 500 }
    );
  }
}

// POST: Save or update coach configuration for a train
export async function POST(request: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await request.json();
    const { trainNumber, coaches, configurationSource } = body;

    if (!trainNumber || typeof trainNumber !== "string" || !trainNumber.trim()) {
      return NextResponse.json(
        { success: false, message: "Train number is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(coaches) || coaches.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one coach must be configured." },
        { status: 400 }
      );
    }

    const normalizedTrain = trainNumber.trim().toUpperCase();
    const validatedCoaches: ICoachEntry[] = [];
    const seenCoachIds = new Set<string>();

    for (let i = 0; i < coaches.length; i++) {
      const c = coaches[i];
      const coachId = String(c.coachId || "").trim().toUpperCase();

      if (!coachId || !/^[A-Z0-9-]{1,6}$/.test(coachId)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid coach identifier '${c.coachId}' at position ${
              i + 1
            }.`,
          },
          { status: 400 }
        );
      }

      if (seenCoachIds.has(coachId)) {
        return NextResponse.json(
          {
            success: false,
            message: `Duplicate coach identifier '${coachId}' detected. Coach IDs must be unique.`,
          },
          { status: 400 }
        );
      }
      seenCoachIds.add(coachId);

      const validClasses: CoachClass[] = ["SL", "3A", "2A", "1A", "CC", "2S"];
      if (!validClasses.includes(c.coachClass)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid coach class '${c.coachClass}' for coach ${coachId}.`,
          },
          { status: 400 }
        );
      }

      const template = getTemplate(c.layoutTemplateId);
      const sequence = Number.isInteger(Number(c.sequence))
        ? Number(c.sequence)
        : i + 1;

      validatedCoaches.push({
        coachId,
        coachClass: c.coachClass,
        sequence,
        layoutTemplateId: template.id,
        totalCapacity: template.totalCapacity,
        isActive: c.isActive !== false,
      });
    }

    // Sort by sequence
    validatedCoaches.sort((a, b) => a.sequence - b.sequence);

    const totalCapacity = validatedCoaches
      .filter((c) => c.isActive)
      .reduce((sum, c) => sum + c.totalCapacity, 0);

    const saved = await CoachConfiguration.findOneAndUpdate(
      { trainNumber: normalizedTrain },
      {
        $set: {
          trainNumber: normalizedTrain,
          coaches: validatedCoaches,
          totalCoaches: validatedCoaches.length,
          totalCapacity,
          configurationSource:
            configurationSource === "verified" ? "verified" : "demo",
        },
        $inc: { version: 1 },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: `Coach configuration for train ${normalizedTrain} updated successfully.`,
        configuration: saved,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin save coach configuration failed:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save coach configuration." },
      { status: 500 }
    );
  }
}

// DELETE: Reset coach configuration to standard default generator
export async function DELETE(request: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const trainNumber = searchParams.get("trainNumber")?.trim().toUpperCase();

    if (!trainNumber) {
      return NextResponse.json(
        { success: false, message: "Train number is required." },
        { status: 400 }
      );
    }

    const train = await Train.findOne({
      $or: [{ trainNumber }, { number: trainNumber }],
    })
      .select("trainNumber number category coachTypes")
      .lean();

    const defaultConfig = generateDefaultCoachConfiguration({
      trainNumber,
      category: train?.category || "Express",
      coachTypes: train?.coachTypes || ["SL", "3A", "2A"],
    });

    const resetConfig = await CoachConfiguration.findOneAndUpdate(
      { trainNumber },
      {
        $set: {
          coaches: defaultConfig.coaches,
          totalCoaches: defaultConfig.totalCoaches,
          totalCapacity: defaultConfig.totalCapacity,
          configurationSource: "demo",
        },
        $inc: { version: 1 },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: `Reset coach configuration for train ${trainNumber} to default.`,
        configuration: resetConfig,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin reset coach configuration failed:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reset coach configuration." },
      { status: 500 }
    );
  }
}
