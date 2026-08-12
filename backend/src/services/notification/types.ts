export type NotificationChannel = "EMAIL" | "SMS";

export type OtpMessage = {
  channel: NotificationChannel;
  to: string;
  customerName: string;
  code: string;
  cardIdentifier: string;
  last4: string;
  expiresInMinutes: number;
};

export type NotificationResult = {
  channel: NotificationChannel;
  sent: boolean;
};
