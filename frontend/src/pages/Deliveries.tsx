import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { api } from "../api/client";
import type { DeliveryCard as DeliveryCardType } from "../api/types";
import { DeliveryCard } from "../components/ui/DeliveryCard";
import { EmptyState } from "../components/ui/EmptyState";
import styles from "./ListPage.module.css";

const filters = [
  { id: "all", label: "All", status: "" },
  { id: "custody", label: "In Custody", status: "IN_CUSTODY" },
  { id: "otp", label: "OTP Sent", status: "OTP_SENT" },
  { id: "delivered", label: "Delivered", status: "DELIVERED" },
];

const sorts = [
  { id: "assigned-desc", label: "Assigned (newest)", sort: "assignedAt", dir: "desc" },
  { id: "assigned-asc", label: "Assigned (oldest)", sort: "assignedAt", dir: "asc" },
  { id: "customer-asc", label: "Customer A–Z", sort: "customer", dir: "asc" },
  { id: "status-asc", label: "Status", sort: "status", dir: "asc" },
];

export function DeliveriesPage() {
  const [filter, setFilter] = useState(filters[0]);
  const [sort, setSort] = useState(sorts[0]);
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<DeliveryCardType[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.status) params.set("status", filter.status);
    if (query.trim()) params.set("q", query.trim());
    params.set("sort", sort.sort);
    params.set("dir", sort.dir);
    api<DeliveryCardType[]>(`/api/deliveries?${params.toString()}`)
      .then(setCards)
      .catch((err: Error) => setError(err.message));
  }, [filter, query, sort]);

  return (
    <div>
      <header className={styles.header}>
        <h1>Deliveries</h1>
        <p>Your assigned cards and the next step for each one.</p>
      </header>

      <input
        className={styles.search}
        placeholder="Search by customer or card identifier"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              className={filter.id === item.id ? styles.chipActive : styles.chip}
              onClick={() => setFilter(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className={styles.sort}>
          Sort
          <select
            value={sort.id}
            onChange={(e) => setSort(sorts.find((item) => item.id === e.target.value) ?? sorts[0])}
          >
            {sorts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {!cards.length ? (
        <EmptyState
          icon={<Truck size={22} />}
          title="No deliveries"
          text="Scan a QR code to take a card into custody."
        />
      ) : (
        <div className={styles.list}>
          {cards.map((card) => (
            <DeliveryCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
