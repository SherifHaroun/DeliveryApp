import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { api } from "../api/client";
import type { DeliveryCard as DeliveryCardType } from "../api/types";
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
  const [cards, setCards] = useState<DeliveryCardType[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.status) params.set("status", filter.status);
    params.set("sort", "updated");
    params.set("dir", "desc");
    setCards(null);
    api<DeliveryCardType[]>(`/api/deliveries?${params.toString()}`)
      .then(setCards)
      .catch((err: Error) => setError(err.message));
  }, [filter]);

  return (
    <div>
      <header className={styles.header}>
        <h1>Deliveries</h1>
      </header>

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

      {error ? <p className="banner-error">{error}</p> : null}

      {cards === null && !error ? (
        <div className={styles.list}>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ) : !cards?.length ? (
        <EmptyState
          icon={<Package size={22} />}
          title="No deliveries"
          text="Scan a card to start a delivery."
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
