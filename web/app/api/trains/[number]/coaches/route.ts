import { NextRequest, NextResponse } from "next/server";
import { getTrainCoachConfiguration } from "@/lib/seat-inventory";
import { COACH_CLASS_NAMES, getTemplate } from "@/lib/coach-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params;
    const trainNumber = number?.trim();

    if (!trainNumber) {
      return NextResponse.json(
        { success: false, message: "Train number is required." },
        { status: 400 }
      );
    }

    const config = await getTrainCoachConfiguration(trainNumber);

    // Group coaches by coachClass for easy UI tab rendering
    const classesMap = new Map<
      string,
      {
        coachClass: string;
        className: string;
        coaches: Array<{
          coachId: string;
          sequence: number;
          layoutTemplateId: string;
          templateName: string;
          totalCapacity: number;
        }>;
      }
    >();

    for (const coach of config.coaches) {
      if (!coach.isActive) continue;

      if (!classesMap.has(coach.coachClass)) {
        classesMap.set(coach.coachClass, {
          coachClass: coach.coachClass,
          className:
            COACH_CLASS_NAMES[coach.coachClass] || coach.coachClass,
          coaches: [],
        });
      }

      const tmpl = getTemplate(coach.layoutTemplateId);
      classesMap.get(coach.coachClass)!.coaches.push({
        coachId: coach.coachId,
        sequence: coach.sequence,
        layoutTemplateId: coach.layoutTemplateId,
        templateName: tmpl.name,
        totalCapacity: coach.totalCapacity,
      });
    }

    const availableClasses = Array.from(classesMap.values());

    return NextResponse.json(
      {
        success: true,
        trainNumber: config.trainNumber,
        totalCoaches: config.totalCoaches,
        totalCapacity: config.totalCapacity,
        configurationSource: config.configurationSource,
        coaches: config.coaches,
        availableClasses,
      },
      {
        status: 200,
        headers: { "Cache-Control": "public, max-age=60" },
      }
    );
  } catch (error) {
    console.error("Fetching train coach configuration failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load coach configuration for this train.",
      },
      { status: 500 }
    );
  }
}
