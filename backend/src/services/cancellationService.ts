import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/http.js";
import { serializeCard } from "../lib/serialize.js";

export async function cancelDelivery(cardId: string, courierId: string, input: unknown) {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const { latitude, longitude, accuracy, capturedAt } = body;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason || reason.length > 1000) throw new HttpError(400, "Enter a cancellation reason (up to 1,000 characters).");
  if (typeof latitude !== "number" || !Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
      typeof longitude !== "number" || !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
      typeof accuracy !== "number" || !Number.isFinite(accuracy) || accuracy < 0) {
    throw new HttpError(400, "A valid current location and accuracy are required to cancel delivery.");
  }
  const captured = typeof capturedAt === "string" ? Date.parse(capturedAt) : NaN;
  if (!Number.isFinite(captured) || Date.now() - captured > 120000 || captured - Date.now() > 30000) {
    throw new HttpError(400, "Location is out of date. Capture your current location again.");
  }
  return prisma.$transaction(async (tx) => {
    const card = await tx.card.findFirst({ where: { id: cardId, courierId }, include: { customer: true, courier: true } });
    if (!card) throw new HttpError(404, "Delivery not found.");
    const now = new Date();
    await tx.otp.updateMany({ where: { cardId, invalidatedAt: null, verifiedAt: null }, data: { invalidatedAt: now } });
    const result = await tx.card.updateMany({
      where: { id: cardId, courierId, status: { in: ["IN_CUSTODY", "OTP_SENT"] } },
      data: { status: "CANCELLED", cancellation: {
        reason, latitude, longitude, accuracy, capturedAt: new Date(captured).toISOString(),
        cancelledAt: now.toISOString(), courierId, courierName: card.courier?.fullName ?? "",
        customerAddress: card.customer.address, customerCity: card.customer.city,
      } },
    });
    if (!result.count) throw new HttpError(409, "Only active deliveries can be cancelled. Refresh this delivery.");
    await tx.activity.create({ data: { cardId, courierId, action: "CANCELLED", message: `Delivery cancelled: ${reason}`, createdAt: now } });
    return serializeCard(await tx.card.findUniqueOrThrow({ where: { id: cardId }, include: { customer: true, courier: true } }));
  });
}
