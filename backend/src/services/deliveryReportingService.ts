import { prisma } from "../lib/prisma.js";
import { CARD_STATUSES } from "../lib/serialize.js";

export type DeliveredCountReport = {
  deliveredCount: number;
  generatedAt: string;
};

/**
 * Future CIB Scanning App integration.
 *
 * The two apps stay separate. This service may later send ONLY the number of
 * successfully delivered cards to the CIB admin dashboard.
 *
 * It must never send customers, cards, couriers, OTPs, or delivery history.
 */
export class DeliveryReportingService {
  async getDeliveredCountReport(): Promise<DeliveredCountReport> {
    const deliveredCount = await prisma.card.count({
      where: { status: CARD_STATUSES.DELIVERED },
    });

    return {
      deliveredCount,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Not connected. Future work: POST `{ deliveredCount }` only.
   */
  async publishDeliveredCount(): Promise<DeliveredCountReport> {
    return this.getDeliveredCountReport();
  }
}

export const deliveryReportingService = new DeliveryReportingService();
