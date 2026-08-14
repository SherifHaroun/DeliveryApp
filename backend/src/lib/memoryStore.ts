import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";

type UserRow = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

type CustomerRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  address: string;
  city: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CardRow = {
  id: string;
  identifier: string;
  qrToken: string;
  last4: string;
  cardType: string;
  status: string;
  customerId: string;
  courierId: string | null;
  scannedAt: Date | null;
  otpSentAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type OtpRow = {
  id: string;
  cardId: string;
  courierId: string;
  codeHash: string;
  channel: string;
  attempts: number;
  expiresAt: Date;
  verifiedAt: Date | null;
  invalidatedAt: Date | null;
  createdAt: Date;
};

type ActivityRow = {
  id: string;
  cardId: string;
  courierId: string;
  action: string;
  message: string;
  createdAt: Date;
};

const users: UserRow[] = [];
const customers: CustomerRow[] = [];
const cards: CardRow[] = [];
const otps: OtpRow[] = [];
const activities: ActivityRow[] = [];

let seeded = false;

function nowMinus(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function seedMemoryStore() {
  if (seeded) return;
  seeded = true;

  const createdAt = nowMinus(48);
  const courier: UserRow = {
    id: "mem-courier-1",
    email: "courier@gmail.com",
    passwordHash: bcrypt.hashSync("12345678", 10),
    fullName: "Karim Hassan",
    phone: "+20 100 555 0100",
    role: "COURIER",
    createdAt,
    updatedAt: createdAt,
  };
  users.push(courier);

  const customerDefs: Array<Omit<CustomerRow, "createdAt" | "updatedAt">> = [
    {
      id: "mem-cust-1",
      fullName: "Nour Demo",
      email: "sherief.mharoun@gmail.com",
      phone: "+20 100 000 1001",
      address: "12 Demo Street, Maadi",
      city: "Cairo",
    },
    {
      id: "mem-cust-2",
      fullName: "Omar Demo",
      email: "sherief.mharoun@gmail.com",
      phone: "+20 100 000 1002",
      address: "44 Sample Road, Dokki",
      city: "Giza",
    },
    {
      id: "mem-cust-3",
      fullName: "Salma Demo",
      email: "sherief.mharoun@gmail.com",
      phone: "+20 100 000 1003",
      address: "8 Test Lane, Zamalek",
      city: "Cairo",
    },
    {
      id: "mem-cust-4",
      fullName: "Youssef Demo",
      email: "sherief.mharoun@gmail.com",
      phone: "+20 100 000 1004",
      address: "21 Mock Avenue, Nasr City",
      city: "Cairo",
    },
    {
      id: "mem-cust-5",
      fullName: "Laila Demo",
      email: "sherief.mharoun@gmail.com",
      phone: "+20 100 000 1005",
      address: "5 Example Close, Heliopolis",
      city: "Cairo",
    },
    {
      id: "mem-cust-6",
      fullName: "Hana Demo",
      email: "sherief.mharoun@gmail.com",
      phone: "+20 100 000 1006",
      address: "19 Placeholder Blvd, 6th October",
      city: "Giza",
    },
  ];
  for (const def of customerDefs) {
    customers.push({ ...def, createdAt, updatedAt: createdAt });
  }

  const pendingA: CardRow = {
    id: "mem-card-pending-a",
    identifier: "C-MEM-1001",
    qrToken: "CIBDEL-PENDING-A",
    last4: "1001",
    cardType: "Debit",
    status: "PENDING",
    customerId: "mem-cust-1",
    courierId: null,
    scannedAt: null,
    otpSentAt: null,
    deliveredAt: null,
    createdAt,
    updatedAt: createdAt,
  };
  const pendingB: CardRow = {
    id: "mem-card-pending-b",
    identifier: "C-MEM-1002",
    qrToken: "CIBDEL-PENDING-B",
    last4: "1002",
    cardType: "Debit",
    status: "PENDING",
    customerId: "mem-cust-2",
    courierId: null,
    scannedAt: null,
    otpSentAt: null,
    deliveredAt: null,
    createdAt,
    updatedAt: createdAt,
  };
  const custody: CardRow = {
    id: "mem-card-custody",
    identifier: "C-MEM-2001",
    qrToken: "CIBDEL-CUSTODY-1",
    last4: "2001",
    cardType: "Debit",
    status: "IN_CUSTODY",
    customerId: "mem-cust-3",
    courierId: courier.id,
    scannedAt: nowMinus(3),
    otpSentAt: null,
    deliveredAt: null,
    createdAt,
    updatedAt: nowMinus(3),
  };
  const otpSent: CardRow = {
    id: "mem-card-otp",
    identifier: "C-MEM-3001",
    qrToken: "CIBDEL-OTP-1",
    last4: "3001",
    cardType: "Debit",
    status: "OTP_SENT",
    customerId: "mem-cust-4",
    courierId: courier.id,
    scannedAt: nowMinus(5),
    otpSentAt: nowMinus(1),
    deliveredAt: null,
    createdAt,
    updatedAt: nowMinus(1),
  };
  const deliveredA: CardRow = {
    id: "mem-card-delivered-a",
    identifier: "C-MEM-4001",
    qrToken: "CIBDEL-DELIVERED-A",
    last4: "4001",
    cardType: "Debit",
    status: "DELIVERED",
    customerId: "mem-cust-5",
    courierId: courier.id,
    scannedAt: nowMinus(26),
    otpSentAt: nowMinus(25),
    deliveredAt: nowMinus(24),
    createdAt,
    updatedAt: nowMinus(24),
  };
  const deliveredB: CardRow = {
    id: "mem-card-delivered-b",
    identifier: "C-MEM-4002",
    qrToken: "CIBDEL-DELIVERED-B",
    last4: "4002",
    cardType: "Debit",
    status: "DELIVERED",
    customerId: "mem-cust-6",
    courierId: courier.id,
    scannedAt: nowMinus(10),
    otpSentAt: nowMinus(9),
    deliveredAt: nowMinus(8),
    createdAt,
    updatedAt: nowMinus(8),
  };
  cards.push(pendingA, pendingB, custody, otpSent, deliveredA, deliveredB);

  otps.push({
    id: "mem-otp-seed",
    cardId: otpSent.id,
    courierId: courier.id,
    codeHash: "482913",
    channel: "EMAIL",
    attempts: 0,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    verifiedAt: null,
    invalidatedAt: null,
    createdAt: nowMinus(1),
  });

  const activitySeed: Array<Omit<ActivityRow, "id">> = [
    {
      cardId: custody.id,
      courierId: courier.id,
      action: "QR_SCANNED",
      message: "QR scanned for C-MEM-2001",
      createdAt: nowMinus(3.1),
    },
    {
      cardId: custody.id,
      courierId: courier.id,
      action: "TAKEN_INTO_CUSTODY",
      message: "Card C-MEM-2001 taken into custody",
      createdAt: nowMinus(3),
    },
    {
      cardId: otpSent.id,
      courierId: courier.id,
      action: "TAKEN_INTO_CUSTODY",
      message: "Card C-MEM-3001 taken into custody",
      createdAt: nowMinus(5),
    },
    {
      cardId: otpSent.id,
      courierId: courier.id,
      action: "OTP_SENT",
      message: "OTP sent by email to y*****@example.com",
      createdAt: nowMinus(1),
    },
    {
      cardId: deliveredA.id,
      courierId: courier.id,
      action: "OTP_VERIFIED",
      message: "OTP verified for C-MEM-4001",
      createdAt: nowMinus(24.05),
    },
    {
      cardId: deliveredA.id,
      courierId: courier.id,
      action: "DELIVERED",
      message: "Delivery completed for C-MEM-4001",
      createdAt: nowMinus(24),
    },
    {
      cardId: deliveredB.id,
      courierId: courier.id,
      action: "DELIVERED",
      message: "Delivery completed for C-MEM-4002",
      createdAt: nowMinus(8),
    },
  ];
  for (const row of activitySeed) {
    activities.push({ id: randomUUID(), ...row });
  }
}

export function memoryPendingQrTokens() {
  return cards.filter((card) => card.status === "PENDING").map((card) => ({
    identifier: card.identifier,
    qrToken: card.qrToken,
  }));
}

function matchPrimitive(actual: unknown, expected: unknown): boolean {
  if (expected === undefined) return true;
  if (expected === null) return actual == null;
  if (expected instanceof Date) {
    return actual instanceof Date && actual.getTime() === expected.getTime();
  }
  if (typeof expected !== "object") {
    return actual === expected;
  }

  const filter = expected as Record<string, unknown>;
  if ("equals" in filter) {
    const left = String(actual ?? "");
    const right = String(filter.equals ?? "");
    return filter.mode === "insensitive" ? left.toLowerCase() === right.toLowerCase() : left === right;
  }
  if ("contains" in filter) {
    const left = String(actual ?? "");
    const right = String(filter.contains ?? "");
    return filter.mode === "insensitive"
      ? left.toLowerCase().includes(right.toLowerCase())
      : left.includes(right);
  }
  if ("in" in filter && Array.isArray(filter.in)) {
    return filter.in.includes(actual);
  }
  if ("gte" in filter) {
    const left = actual instanceof Date ? actual.getTime() : new Date(actual as string | number).getTime();
    const right = filter.gte instanceof Date ? filter.gte.getTime() : new Date(filter.gte as string | number).getTime();
    return left >= right;
  }
  return false;
}

function getNested(row: Record<string, unknown>, key: string, kind: "card" | "user" | "customer" | "activity") {
  if (kind === "card" && key === "customer") {
    return customers.find((item) => item.id === row.customerId) ?? null;
  }
  if (kind === "card" && key === "courier") {
    return row.courierId ? users.find((item) => item.id === row.courierId) ?? null : null;
  }
  if (kind === "activity" && key === "card") {
    return cards.find((item) => item.id === row.cardId) ?? null;
  }
  if (kind === "activity" && key === "courier") {
    return users.find((item) => item.id === row.courierId) ?? null;
  }
  return null;
}

function matchesWhere(row: Record<string, unknown>, where: Record<string, unknown> | undefined, kind: "card" | "user" | "customer" | "activity" | "otp"): boolean {
  if (!where) return true;

  if (where.AND && Array.isArray(where.AND)) {
    if (!where.AND.every((part) => matchesWhere(row, part as Record<string, unknown>, kind))) return false;
  }
  if (where.OR && Array.isArray(where.OR)) {
    if (!where.OR.some((part) => matchesWhere(row, part as Record<string, unknown>, kind))) return false;
  }
  if (where.NOT) {
    const negated = Array.isArray(where.NOT) ? where.NOT : [where.NOT];
    if (negated.some((part) => matchesWhere(row, part as Record<string, unknown>, kind))) return false;
  }

  for (const [key, expected] of Object.entries(where)) {
    if (key === "AND" || key === "OR" || key === "NOT") continue;
    if (expected && typeof expected === "object" && !("equals" in (expected as object)) && !("contains" in (expected as object)) && !("in" in (expected as object)) && !("gte" in (expected as object)) && !(expected instanceof Date)) {
      const related = getNested(row, key, kind as "card" | "activity");
      if (!related || !matchesWhere(related as unknown as Record<string, unknown>, expected as Record<string, unknown>, key === "customer" ? "customer" : key === "courier" ? "user" : "card")) {
        return false;
      }
      continue;
    }
    if (!matchPrimitive(row[key], expected)) return false;
  }
  return true;
}

function compareValues(a: unknown, b: unknown, dir: "asc" | "desc") {
  const av = a instanceof Date ? a.getTime() : a ?? "";
  const bv = b instanceof Date ? b.getTime() : b ?? "";
  if (av < bv) return dir === "asc" ? -1 : 1;
  if (av > bv) return dir === "asc" ? 1 : -1;
  return 0;
}

function sortRows<T extends Record<string, unknown>>(rows: T[], orderBy: unknown, kind: "card" | "activity" | "otp") {
  const orders = Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : [];
  return [...rows].sort((left, right) => {
    for (const order of orders) {
      const entry = order as Record<string, unknown>;
      const key = Object.keys(entry)[0];
      if (!key) continue;
      const dir = entry[key] === "asc" ? "asc" : "desc";
      if (key === "customer") {
        const leftCust = customers.find((item) => item.id === left.customerId);
        const rightCust = customers.find((item) => item.id === right.customerId);
        const nested = (entry.customer as { fullName?: string } | undefined)?.fullName === "asc" ? "asc" : "desc";
        const result = compareValues(leftCust?.fullName, rightCust?.fullName, nested);
        if (result) return result;
        continue;
      }
      const result = compareValues(left[key], right[key], dir);
      if (result) return result;
    }
    return 0;
  });
}

function applyInclude(row: Record<string, unknown>, include: Record<string, unknown> | undefined, kind: "card" | "activity") {
  const result: Record<string, unknown> = clone(row);
  if (!include) return result;

  if (include.customer) {
    const related = customers.find((item) => item.id === row.customerId) ?? null;
    result.customer = related ? clone(related) : null;
  }
  if (include.courier) {
    result.courier = row.courierId ? clone(users.find((item) => item.id === row.courierId) ?? null) : null;
  }
  if (include.card) {
    const card = cards.find((item) => item.id === row.cardId);
    if (card) {
      const cardCopy: Record<string, unknown> = clone(card);
      const cardInclude = typeof include.card === "object" && include.card && "include" in include.card
        ? (include.card as { include?: Record<string, unknown> }).include
        : undefined;
      if (cardInclude?.customer) {
        cardCopy.customer = clone(customers.find((item) => item.id === card.customerId) ?? null);
      }
      result.card = cardCopy;
    }
  }
  if (include.activities) {
    const spec = include.activities as { take?: number; orderBy?: unknown };
    let rows = activities.filter((item) => item.cardId === row.id);
    rows = sortRows(rows as unknown as Record<string, unknown>[], spec.orderBy ?? { createdAt: "desc" }, "activity") as unknown as ActivityRow[];
    if (typeof spec.take === "number") rows = rows.slice(0, spec.take);
    result.activities = rows.map((item) => clone(item));
  }
  return result;
}

function applyData<T extends Record<string, unknown>>(row: T, data: Record<string, unknown>) {
  Object.assign(row, data);
  if ("updatedAt" in row) {
    (row as unknown as { updatedAt: Date }).updatedAt = new Date();
  }
  return row;
}

function createDelegate<T extends { id: string }>(
  table: T[],
  kind: "card" | "user" | "customer" | "activity" | "otp",
) {
  return {
    async findUnique(args: { where: Record<string, unknown>; include?: Record<string, unknown> }) {
      const row = table.find((item) => matchesWhere(item as unknown as Record<string, unknown>, args.where, kind)) ?? null;
      if (!row) return null;
      return kind === "card" || kind === "activity"
        ? applyInclude(row as unknown as Record<string, unknown>, args.include, kind)
        : clone(row);
    },
    async findUniqueOrThrow(args: { where: Record<string, unknown>; include?: Record<string, unknown> }) {
      const row = await this.findUnique(args);
      if (!row) throw new Error("Record not found");
      return row;
    },
    async findFirst(args: { where?: Record<string, unknown>; include?: Record<string, unknown>; orderBy?: unknown }) {
      const matched = table.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, args.where, kind));
      const sorted = sortRows(matched as unknown as Record<string, unknown>[], args.orderBy, kind === "user" || kind === "customer" ? "activity" : kind);
      const row = sorted[0];
      if (!row) return null;
      return kind === "card" || kind === "activity"
        ? applyInclude(row, args.include, kind)
        : clone(row as unknown as T);
    },
    async findMany(args: { where?: Record<string, unknown>; include?: Record<string, unknown>; orderBy?: unknown; take?: number } = {}) {
      let matched = table.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, args.where, kind));
      matched = sortRows(matched as unknown as Record<string, unknown>[], args.orderBy, kind === "user" || kind === "customer" ? "activity" : kind) as unknown as T[];
      if (typeof args.take === "number") matched = matched.slice(0, args.take);
      return matched.map((row) =>
        kind === "card" || kind === "activity"
          ? applyInclude(row as unknown as Record<string, unknown>, args.include, kind)
          : clone(row),
      );
    },
    async count(args: { where?: Record<string, unknown> } = {}) {
      return table.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, args.where, kind)).length;
    },
    async create(args: { data: Record<string, unknown>; include?: Record<string, unknown> }) {
      const row = {
        id: String(args.data.id ?? randomUUID()),
        createdAt: new Date(),
        attempts: kind === "otp" ? 0 : undefined,
        channel: kind === "otp" ? "EMAIL" : undefined,
        verifiedAt: kind === "otp" ? null : undefined,
        invalidatedAt: kind === "otp" ? null : undefined,
        ...args.data,
      } as unknown as T;
      if ("updatedAt" in (row as object) && !(row as unknown as { updatedAt?: Date }).updatedAt) {
        (row as unknown as { updatedAt: Date }).updatedAt = new Date();
      }
      table.push(row);
      return kind === "card" || kind === "activity"
        ? applyInclude(row as unknown as Record<string, unknown>, args.include, kind)
        : clone(row);
    },
    async update(args: { where: Record<string, unknown>; data: Record<string, unknown>; include?: Record<string, unknown> }) {
      const row = table.find((item) => matchesWhere(item as unknown as Record<string, unknown>, args.where, kind));
      if (!row) throw new Error("Record not found");
      applyData(row as unknown as Record<string, unknown>, args.data);
      return kind === "card" || kind === "activity"
        ? applyInclude(row as unknown as Record<string, unknown>, args.include, kind)
        : clone(row);
    },
    async updateMany(args: { where?: Record<string, unknown>; data: Record<string, unknown> }) {
      const matched = table.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, args.where, kind));
      for (const row of matched) {
        applyData(row as unknown as Record<string, unknown>, args.data);
      }
      return { count: matched.length };
    },
  };
}

export function createMemoryPrisma() {
  seedMemoryStore();
  const delegates = {
    user: createDelegate(users, "user"),
    customer: createDelegate(customers, "customer"),
    card: createDelegate(cards, "card"),
    otp: createDelegate(otps, "otp"),
    activity: createDelegate(activities, "activity"),
  };
  return {
    ...delegates,
    async $transaction<T>(fn: (tx: typeof delegates) => Promise<T>) {
      return fn(delegates);
    },
    async $queryRaw() {
      return [{ ok: 1 }];
    },
    async $disconnect() {
      return;
    },
  };
}

export function logMemoryDevHints() {
  const pending = memoryPendingQrTokens();
  console.log("[memory] BACKEND_DATA_MODE=memory — PostgreSQL is not used");
  console.log("[memory] Courier login: courier@gmail.com / 12345678");
  console.log("[memory] Pending QR tokens to scan:");
  for (const card of pending) {
    console.log(`  ${card.qrToken}  (${card.identifier})`);
  }
  console.log("[memory] Seeded OTP_SENT card C-MEM-3001 development OTP: 482913");
}
