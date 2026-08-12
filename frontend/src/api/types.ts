export type CardStatus = "PENDING" | "IN_CUSTODY" | "OTP_SENT" | "DELIVERED";

export type Customer = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  address: string;
  city: string | null;
};

export type OtpSession = {
  expiresAt: string;
  sentAt: string;
  attemptsRemaining: number;
  resendAvailableAt: string;
  expired: boolean;
  locked: boolean;
  channel: "EMAIL" | "SMS";
  destination: string;
};

export type LastAction = {
  action: string;
  label: string;
  at: string;
};

export type DeliveryCard = {
  id: string;
  identifier: string;
  qrToken: string;
  last4: string;
  cardType: string;
  status: CardStatus;
  scannedAt: string | null;
  assignedAt?: string | null;
  otpSentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  courier: { id: string; fullName: string; email: string } | null;
  lastAction?: LastAction | null;
  otp?: OtpSession | null;
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
};

export type DashboardData = {
  toBeDelivered: number;
  delivered: number;
  inCustody: number;
  recentActivity: {
    id: string;
    action: string;
    summary: string;
    message: string;
    createdAt: string;
    last4: string;
    identifier?: string;
    customerName: string;
    status: CardStatus;
  }[];
};

export type HistoryEvent = {
  id: string;
  action: string;
  actionLabel: string;
  message: string;
  createdAt: string;
  cardIdentifier: string;
  customerName: string;
  courierName: string;
  status: CardStatus;
  statusLabel: string;
};

export type ProfileData = AuthUser & {
  createdAt: string;
  stats: { inCustody: number; delivered: number };
};
