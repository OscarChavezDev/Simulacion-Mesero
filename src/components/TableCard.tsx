"use client";

import Link from "next/link";
import { CalendarClock, Clock, Users } from "lucide-react";
import type { OrderWithItems, RestaurantTable } from "@/types";
import { orderTotal } from "@/services/ordersService";
import { elapsedSince } from "@/lib/time";

type CardStatus = "LIBRE" | "OCUPADA" | "NO_DISPONIBLE";

function resolveStatus(table: RestaurantTable, hasOrder: boolean): CardStatus {
  if (table.currentStatus === "OCCUPIED" || hasOrder) return "OCUPADA";
  if (table.currentStatus === "UNAVAILABLE") return "NO_DISPONIBLE";
  return "LIBRE";
}

const STYLES: Record<CardStatus, { card: string; badge: string; label: string }> = {
  LIBRE: { card: "border-brand-200 bg-white", badge: "bg-brand-100 text-brand-800", label: "Libre" },
  OCUPADA: { card: "border-amber-300 bg-amber-50", badge: "bg-amber-200 text-amber-900", label: "Ocupada" },
  NO_DISPONIBLE: { card: "border-gray-300 bg-gray-50", badge: "bg-gray-200 text-gray-700", label: "No disponible" },
};

export default function TableCard({
  table,
  order,
}: {
  table: RestaurantTable;
  order: OrderWithItems | null;
}) {
  const status = resolveStatus(table, !!order);
  const s = STYLES[status];
  const since = order ? elapsedSince(order.sent_to_kitchen_at ?? order.created_at) : null;

  return (
    <Link
      href={`/mesas/${table.id}`}
      className={`flex flex-col gap-2 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${s.card}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-900">Mesa {table.tableNumber}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.badge}`}>{s.label}</span>
      </div>
      <div className="flex items-center gap-1 text-sm text-gray-500">
        <Users size={14} />
        <span>{table.capacity} personas</span>
        {table.sectionName && <span>· {table.sectionName}</span>}
      </div>
      {order && (
        <div className="mt-1 flex items-center justify-between text-sm text-gray-600">
          <span>
            {order.order_items.length} item(s) · S/ {orderTotal(order).toFixed(2)}
          </span>
          {since && (
            <span className="flex items-center gap-1 text-xs text-amber-700">
              <Clock size={12} /> {since}
            </span>
          )}
        </div>
      )}
      {table.nextReservationTime && (
        <div className="mt-1 flex items-center gap-1 text-xs font-medium text-indigo-600">
          <CalendarClock size={12} /> Reservada {table.nextReservationTime}
        </div>
      )}
    </Link>
  );
}
