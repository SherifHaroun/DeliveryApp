import { useEffect, useState } from "react";
import { Package, Search } from "lucide-react";
import { api } from "../api/client";
import type { DeliveryCard as DeliveryCardType } from "../api/types";
import { Button } from "../components/ui/Button";
import { DeliveryCard } from "../components/ui/DeliveryCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import styles from "./ListPage.module.css";

const filters = [
  { id: "all", label: "All", status: "" },
  { id: "custody", label: "Ready", status: "IN_CUSTODY" },
  { id: "otp", label: "OTP Sent", status: "OTP_SENT" },
  { id: "delivered", label: "Delivered", status: "DELIVERED" },
];

export function DeliveriesPage() {
  const [filter, setFilter] = useState(filters[0]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [cards, setCards] = useState<DeliveryCardType[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.status) params.set("status", filter.status);
    if (debouncedQuery) params.set("q", debouncedQuery);
    params.set("sort", "updated");
    params.set("dir", "desc");
    setCards(null);
    setError(null);
    api<DeliveryCardType[]>(`/api/deliveries?${params.toString()}`)
      .then(setCards)
      .catch((err: Error) => setError(err.message));
  }, [filter, debouncedQuery, reload]);

  const searching = Boolean(debouncedQuery);

  return (
    <div>
      <header className={styles.header}>
        <h1>Deliveries</h1>
      </header>

      <label className={styles.search}>
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search card ID or customer"
          aria-label="Search deliveries"
        />
      </label>

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

      {error ? (
        <div className={styles.errorPanel}>
          <p className="banner-error">{error}</p>
          <Button variant="ghost" onClick={() => setReload((value) => value + 1)}>
            Retry
          </Button>
        </div>
      ) : null}

      {cards === null && !error ? (
        <div className={styles.list}>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ) : !error && !cards?.length ? (
        <EmptyState
          icon={<Package size={22} />}
          title={searching ? "No Cards Found" : "No deliveries"}
          text={searching ? "No cards matched your search." : "Scan a card to start a delivery."}
        />
      ) : cards?.length ? (
        <div className={styles.list}>
          {cards.map((card) => (
            <DeliveryCard key={card.id} card={card} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
