import { connectDB } from "./mongodb";
import CoachConfiguration, {
  ICoachConfiguration,
  ICoachEntry,
} from "@/models/CoachConfiguration";
import SeatInventory, {
  ISeatInventory,
  SeatStatus,
} from "@/models/SeatInventory";
import Train from "@/models/Train";
import {
  BerthDefinition,
  CoachTemplate,
  getTemplate,
} from "./coach-templates";
import { generateDefaultCoachConfiguration } from "./coach-composition-generator";

export interface CoachSeatMatrixResult {
  trainNumber: string;
  journeyDate: string;
  coach: ICoachEntry;
  template: CoachTemplate;
  berths: Array<
    BerthDefinition & {
      status: SeatStatus;
      isLockedByMe: boolean;
      lockedUntil?: Date | null;
      bookingReference?: string | null;
    }
  >;
  summary: {
    totalCapacity: number;
    availableCount: number;
    lockedCount: number;
    bookedCount: number;
  };
}

/**
 * Retrieves the coach configuration for a train.
 * If not already present in the database, generates a standard default configuration
 * matching the train's category and coachTypes, saves it, and returns it.
 */
export async function getTrainCoachConfiguration(
  trainNumber: string
): Promise<ICoachConfiguration> {
  await connectDB();
  const normalizedNumber = trainNumber.trim().toUpperCase();

  let config = await CoachConfiguration.findOne({
    trainNumber: normalizedNumber,
  }).lean<ICoachConfiguration | null>();

  if (!config) {
    const train = await Train.findOne({
      $or: [{ trainNumber: normalizedNumber }, { number: normalizedNumber }],
    })
      .select("trainNumber number category coachTypes")
      .lean();

    const defaultConfig = generateDefaultCoachConfiguration({
      trainNumber: normalizedNumber,
      category: train?.category || "Express",
      coachTypes: train?.coachTypes || ["SL", "3A", "2A"],
    });

    try {
      const created = await CoachConfiguration.create(defaultConfig);
      config = created.toObject();
    } catch (err: unknown) {
      // If concurrent request inserted it, fetch again
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: number }).code === 11000
      ) {
        config = await CoachConfiguration.findOne({
          trainNumber: normalizedNumber,
        }).lean<ICoachConfiguration | null>();
      } else {
        throw err;
      }
    }
  }

  if (!config) {
    throw new Error(`Failed to load coach configuration for train ${trainNumber}`);
  }

  return config;
}

/**
 * Returns the full layout and live seat statuses for a specific coach on a specific journey date.
 */
export async function getCoachSeatMatrix(
  trainNumber: string,
  journeyDate: string,
  coachId: string,
  currentUserId?: string
): Promise<CoachSeatMatrixResult> {
  await connectDB();

  const config = await getTrainCoachConfiguration(trainNumber);
  const normalizedCoachId = coachId.trim().toUpperCase();

  const coach = config.coaches.find(
    (c) => c.coachId.toUpperCase() === normalizedCoachId && c.isActive
  );

  if (!coach) {
    throw new Error(
      `Coach ${coachId} not found or inactive on train ${trainNumber}`
    );
  }

  const template = getTemplate(coach.layoutTemplateId);
  const templateBerths = template.generateBerths();

  // Fetch all existing seat inventory records for this coach & date
  const inventoryRecords = await SeatInventory.find({
    trainNumber: config.trainNumber,
    journeyDate,
    coachId: coach.coachId,
  }).lean();

  const recordMap = new Map<number, ISeatInventory>();
  const now = new Date();

  for (const record of inventoryRecords) {
    recordMap.set(record.seatNumber, record);
  }

  let availableCount = 0;
  let lockedCount = 0;
  let bookedCount = 0;

  const berths = templateBerths.map((berth) => {
    const record = recordMap.get(berth.number);
    let status: SeatStatus = "available";
    let isLockedByMe = false;
    let lockedUntil: Date | null = null;
    let bookingReference: string | null = null;

    if (record) {
      if (record.status === "booked") {
        status = "booked";
        bookingReference = record.bookingReference || null;
        bookedCount++;
      } else if (record.status === "locked") {
        const expiresAt = record.lockedUntil ? new Date(record.lockedUntil) : null;
        if (expiresAt && expiresAt > now) {
          status = "locked";
          lockedUntil = expiresAt;
          if (currentUserId && record.lockedBy === currentUserId) {
            isLockedByMe = true;
          }
          lockedCount++;
        } else {
          // Lock expired!
          status = "available";
          availableCount++;
        }
      } else {
        status = "available";
        availableCount++;
      }
    } else {
      status = "available";
      availableCount++;
    }

    return {
      ...berth,
      status,
      isLockedByMe,
      lockedUntil,
      bookingReference,
    };
  });

  return {
    trainNumber: config.trainNumber,
    journeyDate,
    coach,
    template,
    berths,
    summary: {
      totalCapacity: template.totalCapacity,
      availableCount,
      lockedCount,
      bookedCount,
    },
  };
}

export interface LockSeatsParams {
  trainNumber: string;
  journeyDate: string;
  coachId: string;
  coachClass: string;
  seats: Array<{ seatNumber: number; berthType: string }>;
  userId: string;
  durationMinutes?: number;
}

export interface LockSeatsResult {
  success: boolean;
  message?: string;
  lockedUntil?: Date;
  conflictSeats?: number[];
}

/**
 * Atomically locks the specified seats for a user with double-booking prevention.
 * If any seat is unavailable or held by someone else, no locks are acquired and conflict seats are returned.
 */
export async function lockSeats({
  trainNumber,
  journeyDate,
  coachId,
  coachClass,
  seats,
  userId,
  durationMinutes = 10,
}: LockSeatsParams): Promise<LockSeatsResult> {
  await connectDB();

  const normalizedTrain = trainNumber.trim().toUpperCase();
  const normalizedCoach = coachId.trim().toUpperCase();
  const normalizedClass = coachClass.trim().toUpperCase();
  const now = new Date();
  const expiry = new Date(Date.now() + durationMinutes * 60 * 1000);

  const seatNumbers = seats.map((s) => s.seatNumber);

  // 1. Check existing records for conflicts
  const existingRecords = await SeatInventory.find({
    trainNumber: normalizedTrain,
    journeyDate,
    coachId: normalizedCoach,
    seatNumber: { $in: seatNumbers },
  }).lean();

  const conflictSeats: number[] = [];

  for (const rec of existingRecords) {
    if (rec.status === "booked") {
      conflictSeats.push(rec.seatNumber);
    } else if (rec.status === "locked") {
      const expiresAt = rec.lockedUntil ? new Date(rec.lockedUntil) : null;
      if (expiresAt && expiresAt > now && rec.lockedBy !== userId) {
        conflictSeats.push(rec.seatNumber);
      }
    }
  }

  if (conflictSeats.length > 0) {
    return {
      success: false,
      message: `The following seat(s) are no longer available: ${conflictSeats.join(
        ", "
      )}`,
      conflictSeats,
    };
  }

  // 2. Perform atomic locks
  const successfullyLockedSeats: number[] = [];

  for (const seat of seats) {
    try {
      // First attempt: update existing document if available or expired or locked by same user
      const updated = await SeatInventory.findOneAndUpdate(
        {
          trainNumber: normalizedTrain,
          journeyDate,
          coachId: normalizedCoach,
          seatNumber: seat.seatNumber,
          $or: [
            { status: "available" },
            { status: "locked", lockedUntil: { $lt: now } },
            { status: "locked", lockedBy: userId },
          ],
        },
        {
          $set: {
            coachClass: normalizedClass,
            berthType: seat.berthType,
            status: "locked",
            lockedUntil: expiry,
            lockedBy: userId,
            bookingReference: null,
          },
        },
        { new: true }
      );

      if (updated) {
        successfullyLockedSeats.push(seat.seatNumber);
        continue;
      }

      // If document did not exist, try to create it
      const created = await SeatInventory.create({
        trainNumber: normalizedTrain,
        journeyDate,
        coachId: normalizedCoach,
        coachClass: normalizedClass,
        seatNumber: seat.seatNumber,
        berthType: seat.berthType,
        status: "locked",
        lockedUntil: expiry,
        lockedBy: userId,
      });

      if (created) {
        successfullyLockedSeats.push(seat.seatNumber);
      }
    } catch (err: unknown) {
      // If race condition occurred (duplicate key error)
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: number }).code === 11000
      ) {
        // Try atomic update one more time to check if expired or owned
        const retryUpdated = await SeatInventory.findOneAndUpdate(
          {
            trainNumber: normalizedTrain,
            journeyDate,
            coachId: normalizedCoach,
            seatNumber: seat.seatNumber,
            $or: [
              { status: "available" },
              { status: "locked", lockedUntil: { $lt: now } },
              { status: "locked", lockedBy: userId },
            ],
          },
          {
            $set: {
              coachClass: normalizedClass,
              berthType: seat.berthType,
              status: "locked",
              lockedUntil: expiry,
              lockedBy: userId,
              bookingReference: null,
            },
          },
          { new: true }
        );

        if (retryUpdated) {
          successfullyLockedSeats.push(seat.seatNumber);
          continue;
        }
      }

      // Rollback any seats locked in this session
      if (successfullyLockedSeats.length > 0) {
        await SeatInventory.updateMany(
          {
            trainNumber: normalizedTrain,
            journeyDate,
            coachId: normalizedCoach,
            seatNumber: { $in: successfullyLockedSeats },
            lockedBy: userId,
          },
          {
            $set: {
              status: "available",
              lockedBy: null,
              lockedUntil: null,
            },
          }
        );
      }

      return {
        success: false,
        message: `Seat ${seat.seatNumber} could not be reserved due to a concurrency conflict.`,
        conflictSeats: [seat.seatNumber],
      };
    }
  }

  return {
    success: true,
    lockedUntil: expiry,
  };
}

/**
 * Releases seats locked by a user.
 */
export async function unlockSeats(
  trainNumber: string,
  journeyDate: string,
  coachId: string,
  seatNumbers: number[],
  userId: string
): Promise<void> {
  await connectDB();
  await SeatInventory.updateMany(
    {
      trainNumber: trainNumber.trim().toUpperCase(),
      journeyDate,
      coachId: coachId.trim().toUpperCase(),
      seatNumber: { $in: seatNumbers },
      status: "locked",
      lockedBy: userId,
    },
    {
      $set: {
        status: "available",
        lockedBy: null,
        lockedUntil: null,
      },
    }
  );
}

export interface ConfirmBookedSeatsParams {
  trainNumber: string;
  journeyDate: string;
  coachId: string;
  coachClass: string;
  seats: Array<{ seatNumber: number; berthType: string }>;
  bookingReference: string;
  userId: string;
}

/**
 * Atomically marks seats as booked with the given booking reference.
 */
export async function confirmBookedSeats({
  trainNumber,
  journeyDate,
  coachId,
  coachClass,
  seats,
  bookingReference,
  userId,
}: ConfirmBookedSeatsParams): Promise<{ success: boolean; message?: string }> {
  await connectDB();

  const normalizedTrain = trainNumber.trim().toUpperCase();
  const normalizedCoach = coachId.trim().toUpperCase();
  const normalizedClass = coachClass.trim().toUpperCase();
  const now = new Date();

  for (const seat of seats) {
    // Upsert or update to booked
    const updated = await SeatInventory.findOneAndUpdate(
      {
        trainNumber: normalizedTrain,
        journeyDate,
        coachId: normalizedCoach,
        seatNumber: seat.seatNumber,
        $or: [
          { status: "locked", lockedBy: userId },
          { status: "available" },
          { status: "locked", lockedUntil: { $lt: now } },
        ],
      },
      {
        $set: {
          coachClass: normalizedClass,
          berthType: seat.berthType,
          status: "booked",
          bookingReference,
          lockedBy: null,
          lockedUntil: null,
        },
      },
      { new: true }
    );

    if (!updated) {
      // If doc didn't exist at all, create it directly
      try {
        await SeatInventory.create({
          trainNumber: normalizedTrain,
          journeyDate,
          coachId: normalizedCoach,
          coachClass: normalizedClass,
          seatNumber: seat.seatNumber,
          berthType: seat.berthType,
          status: "booked",
          bookingReference,
          lockedBy: null,
          lockedUntil: null,
        });
      } catch (err: unknown) {
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code: number }).code === 11000
        ) {
          // Duplicate key - check if already booked for this bookingReference
          const existing = await SeatInventory.findOne({
            trainNumber: normalizedTrain,
            journeyDate,
            coachId: normalizedCoach,
            seatNumber: seat.seatNumber,
          }).lean();

          if (existing?.bookingReference === bookingReference) {
            continue;
          }
        }
        throw new Error(
          `Failed to allocate seat ${seat.seatNumber} on coach ${coachId}: already reserved.`
        );
      }
    }
  }

  return { success: true };
}

/**
 * Releases seats booked under a booking reference when the ticket is cancelled.
 */
export async function releaseBookedSeats(
  bookingReference: string
): Promise<number> {
  await connectDB();
  const res = await SeatInventory.updateMany(
    { bookingReference: bookingReference.trim() },
    {
      $set: {
        status: "available",
        bookingReference: null,
        lockedBy: null,
        lockedUntil: null,
      },
    }
  );

  return res.modifiedCount;
}
