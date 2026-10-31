import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

export type TicketData = {
  bookingReference: string;
  trainNumber: string;
  trainName: string;
  from: string;
  to: string;
  journeyDate: string;
  passengerCount: number;
  coach: string;
  coachClass?: string;
  seats: string[];
  totalFare: number;
  status: "confirmed" | "cancelled";
  createdAt: Date | string;
  passengers: {
    name: string;
    age: number;
    gender: string;
  }[];
};

export async function generateTicketPdf(data: TicketData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // A4 size: 595.28 x 841.89 pt
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const primaryBlue = rgb(0.08, 0.28, 0.72); // #1447b8
  const navyHeader = rgb(0.06, 0.12, 0.33);  // #101e55
  const slateDark = rgb(0.09, 0.13, 0.2);    // #172133
  const slateMuted = rgb(0.4, 0.45, 0.52);   // #667385
  const bgLight = rgb(0.96, 0.97, 0.99);     // #f5f7fc
  const borderLight = rgb(0.86, 0.89, 0.93); // #dbe2ed
  const confirmedGreen = rgb(0.06, 0.58, 0.35); // #0f9459
  const cancelledRed = rgb(0.85, 0.15, 0.18);   // #d9262e

  const isConfirmed = data.status === "confirmed";
  const statusColor = isConfirmed ? confirmedGreen : cancelledRed;
  const statusText = isConfirmed ? "CONFIRMED" : "CANCELLED";

  let y = height - 40;

  // 1. TOP BRANDING BAR
  page.drawRectangle({
    x: 35,
    y: y - 55,
    width: width - 70,
    height: 60,
    color: navyHeader,
  });

  page.drawText("RailConnect", {
    x: 55,
    y: y - 25,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("ELECTRONIC RESERVATION SLIP (ERS) / E-TICKET", {
    x: 55,
    y: y - 43,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.75, 0.85, 1),
  });

  // Reference on top right
  page.drawText("BOOKING REFERENCE (PNR)", {
    x: width - 230,
    y: y - 22,
    size: 8,
    font: fontBold,
    color: rgb(0.75, 0.85, 1),
  });

  page.drawText(data.bookingReference, {
    x: width - 230,
    y: y - 42,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  y -= 75;

  // 2. STATUS & SUMMARY BANNER
  page.drawRectangle({
    x: 35,
    y: y - 40,
    width: width - 70,
    height: 40,
    color: bgLight,
    borderColor: borderLight,
    borderWidth: 1,
  });

  page.drawText("BOOKING STATUS:", {
    x: 55,
    y: y - 24,
    size: 9,
    font: fontBold,
    color: slateMuted,
  });

  page.drawText(statusText, {
    x: 155,
    y: y - 25,
    size: 11,
    font: fontBold,
    color: statusColor,
  });

  const bookedOnText = `Booked: ${new Date(data.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  page.drawText(bookedOnText, {
    x: width - 200,
    y: y - 24,
    size: 9,
    font: fontRegular,
    color: slateMuted,
  });

  y -= 55;

  // 3. JOURNEY & TRAIN DETAILS SECTION
  page.drawRectangle({
    x: 35,
    y: y - 110,
    width: width - 70,
    height: 110,
    color: rgb(1, 1, 1),
    borderColor: borderLight,
    borderWidth: 1,
  });

  // Header banner inside box
  page.drawRectangle({
    x: 35,
    y: y - 24,
    width: width - 70,
    height: 24,
    color: bgLight,
  });

  page.drawText("JOURNEY & TRAIN SPECIFICATIONS", {
    x: 50,
    y: y - 17,
    size: 9,
    font: fontBold,
    color: primaryBlue,
  });

  // Left Column: Train Info
  page.drawText("Train Name & No.", { x: 50, y: y - 42, size: 8, font: fontRegular, color: slateMuted });
  page.drawText(`${data.trainName} (${data.trainNumber})`, { x: 50, y: y - 56, size: 10, font: fontBold, color: slateDark });

  page.drawText("Class & Coach", { x: 50, y: y - 76, size: 8, font: fontRegular, color: slateMuted });
  const coachClassText = data.coachClass ? `${data.coachClass}  |  Coach: ${data.coach}` : `Sleeper (SL)  |  Coach: ${data.coach}`;
  page.drawText(coachClassText, { x: 50, y: y - 90, size: 9.5, font: fontBold, color: slateDark });

  // Center Column: Route
  page.drawText("Route (From -> To)", { x: 235, y: y - 42, size: 8, font: fontRegular, color: slateMuted });
  page.drawText(`${data.from}  ->  ${data.to}`, { x: 235, y: y - 56, size: 10, font: fontBold, color: slateDark });

  page.drawText("Quota", { x: 235, y: y - 76, size: 8, font: fontRegular, color: slateMuted });
  page.drawText("General (GN)", { x: 235, y: y - 90, size: 9.5, font: fontBold, color: slateDark });

  // Right Column: Date & Total Seats
  page.drawText("Journey Date", { x: 415, y: y - 42, size: 8, font: fontRegular, color: slateMuted });
  page.drawText(data.journeyDate, { x: 415, y: y - 56, size: 10, font: fontBold, color: primaryBlue });

  page.drawText("Passengers", { x: 415, y: y - 76, size: 8, font: fontRegular, color: slateMuted });
  page.drawText(`${data.passengerCount} Adult(s)`, { x: 415, y: y - 90, size: 9.5, font: fontBold, color: slateDark });

  y -= 130;

  // 4. PASSENGER DETAILS TABLE
  page.drawText("PASSENGER & SEAT ALLOCATION", {
    x: 40,
    y: y,
    size: 10,
    font: fontBold,
    color: slateDark,
  });

  y -= 14;

  const tableColX = [35, 75, 260, 315, 385, 470];
  const tableWidth = width - 70;
  const headerHeight = 22;
  const rowHeight = 24;

  // Table header bar
  page.drawRectangle({
    x: 35,
    y: y - headerHeight,
    width: tableWidth,
    height: headerHeight,
    color: primaryBlue,
  });

  page.drawText("#", { x: tableColX[0] + 10, y: y - 15, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Passenger Name", { x: tableColX[1] + 5, y: y - 15, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Age", { x: tableColX[2] + 5, y: y - 15, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Gender", { x: tableColX[3] + 5, y: y - 15, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Coach / Seat", { x: tableColX[4] + 5, y: y - 15, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Status", { x: tableColX[5] + 5, y: y - 15, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });

  y -= headerHeight;

  // Table rows
  data.passengers.forEach((passenger, idx) => {
    const rowY = y - rowHeight;
    const isEven = idx % 2 === 0;

    page.drawRectangle({
      x: 35,
      y: rowY,
      width: tableWidth,
      height: rowHeight,
      color: isEven ? rgb(1, 1, 1) : bgLight,
      borderColor: borderLight,
      borderWidth: 0.5,
    });

    const seatAllocated = data.seats[idx] ? `${data.coach} / ${data.seats[idx]}` : data.coach;

    page.drawText(String(idx + 1), { x: tableColX[0] + 10, y: rowY + 7, size: 8.5, font: fontRegular, color: slateDark });
    page.drawText(passenger.name, { x: tableColX[1] + 5, y: rowY + 7, size: 8.5, font: fontBold, color: slateDark });
    page.drawText(String(passenger.age), { x: tableColX[2] + 5, y: rowY + 7, size: 8.5, font: fontRegular, color: slateDark });
    page.drawText(passenger.gender, { x: tableColX[3] + 5, y: rowY + 7, size: 8.5, font: fontRegular, color: slateDark });
    page.drawText(seatAllocated, { x: tableColX[4] + 5, y: rowY + 7, size: 8.5, font: fontBold, color: primaryBlue });
    page.drawText(statusText, { x: tableColX[5] + 5, y: rowY + 7, size: 8.5, font: fontBold, color: statusColor });

    y -= rowHeight;
  });

  y -= 25;

  // 5. FARE PAYMENT SUMMARY BOX
  page.drawRectangle({
    x: 35,
    y: y - 65,
    width: width - 70,
    height: 65,
    color: bgLight,
    borderColor: borderLight,
    borderWidth: 1,
  });

  page.drawText("FARE & PAYMENT BREAKDOWN", {
    x: 50,
    y: y - 18,
    size: 9,
    font: fontBold,
    color: slateDark,
  });

  const baseFarePerPassenger = data.passengerCount > 0 ? (data.totalFare / data.passengerCount).toFixed(2) : "0.00";

  page.drawText(`Base Ticket Fare: Rs. ${baseFarePerPassenger} x ${data.passengerCount} passenger(s)`, {
    x: 50,
    y: y - 36,
    size: 8.5,
    font: fontRegular,
    color: slateMuted,
  });

  page.drawText("Reservation & Superfast Surcharge: Included in demo fare", {
    x: 50,
    y: y - 50,
    size: 8,
    font: fontRegular,
    color: slateMuted,
  });

  page.drawText("TOTAL AMOUNT PAID:", {
    x: width - 240,
    y: y - 26,
    size: 8.5,
    font: fontBold,
    color: slateMuted,
  });

  page.drawText(`INR ${data.totalFare.toLocaleString("en-IN")}.00`, {
    x: width - 240,
    y: y - 46,
    size: 15,
    font: fontBold,
    color: primaryBlue,
  });

  y -= 85;

  // 6. IMPORTANT TRAVEL INSTRUCTIONS
  page.drawRectangle({
    x: 35,
    y: y - 110,
    width: width - 70,
    height: 110,
    color: rgb(1, 1, 1),
    borderColor: borderLight,
    borderWidth: 1,
  });

  page.drawRectangle({
    x: 35,
    y: y - 22,
    width: width - 70,
    height: 22,
    color: bgLight,
  });

  page.drawText("IMPORTANT PASSENGER INSTRUCTIONS", {
    x: 50,
    y: y - 15,
    size: 8.5,
    font: fontBold,
    color: slateDark,
  });

  const instructions = [
    "1. One passenger must carry an original government-issued photo ID (Aadhaar, Passport, Voter ID, Driving License).",
    "2. Please report to the departure station platform at least 30 minutes prior to scheduled departure.",
    "3. Conductor verification: Present this E-Ticket on your mobile screen or as a printed copy upon ticket inspection.",
    "4. Luggage allowance is subject to coach category regulations. Unattended baggage must be avoided.",
    "5. In case of cancellation, status transitions to Cancelled within RailConnect records.",
  ];

  let instructionY = y - 36;
  instructions.forEach((line) => {
    page.drawText(line, {
      x: 50,
      y: instructionY,
      size: 7.5,
      font: fontRegular,
      color: slateMuted,
    });
    instructionY -= 14;
  });

  y -= 125;

  // 7. DEMONSTRATION & ACADEMIC DISCLAIMER BANNER
  page.drawRectangle({
    x: 35,
    y: y - 55,
    width: width - 70,
    height: 55,
    color: rgb(0.99, 0.96, 0.91), // #fef5e7 (amber tint)
    borderColor: rgb(0.95, 0.8, 0.55),
    borderWidth: 1,
  });

  page.drawText("RAILCONNECT DEMONSTRATION NOTICE", {
    x: 50,
    y: y - 17,
    size: 8.5,
    font: fontBold,
    color: rgb(0.7, 0.35, 0.05),
  });

  const disclaimerLines = [
    "This document is an electronic reservation slip generated by the RailConnect academic project demonstration.",
    "It is not an official ticket issued by Indian Railways (IRCTC / CRIS) and is not valid for commercial transit on",
    "national railway coaches. Fares and schedules are simulated for educational software development purposes.",
  ];

  let discY = y - 30;
  disclaimerLines.forEach((text) => {
    page.drawText(text, {
      x: 50,
      y: discY,
      size: 7,
      font: fontRegular,
      color: rgb(0.55, 0.3, 0.1),
    });
    discY -= 10;
  });

  // Footer bar at the bottom
  page.drawLine({
    start: { x: 35, y: 35 },
    end: { x: width - 35, y: 35 },
    thickness: 0.5,
    color: borderLight,
  });

  page.drawText("Generated by RailConnect Railway Reservation System", {
    x: 35,
    y: 22,
    size: 7,
    font: fontRegular,
    color: slateMuted,
  });

  page.drawText("Page 1 of 1", {
    x: width - 85,
    y: 22,
    size: 7,
    font: fontRegular,
    color: slateMuted,
  });

  // Watermark if Cancelled
  if (!isConfirmed) {
    page.drawText("CANCELLED", {
      x: 140,
      y: 430,
      size: 65,
      font: fontBold,
      color: rgb(0.9, 0.2, 0.2),
      opacity: 0.15,
      rotate: degrees(30),
    });
  }

  return await pdfDoc.save();
}
