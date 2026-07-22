"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import type { OrderWithItems, RestaurantTable } from "@/types";
import { orderTotal } from "@/services/ordersService";

export default function TableCard({
  table,
  order,
}: {
  table: RestaurantTable;
  order: OrderWithItems | null;
}) {
  const occupied = table.currentStatus === "OCCUPIED" || !!order;

  return (
    <Link
      href={`/mesas/${table.id}`}
      className={`flex flex-col gap-2 rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${
        occupied
          ? "border-amber-300 bg-amber-50"
          : "border-brand-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-900">Mesa {table.tableNumber}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            occupied ? "bg-amber-200 text-amber-900" : "bg-brand-100 text-brand-800"
          }`}
        >
          {occupied ? "Ocupada" : "Libre"}
        </span>
      </div>
      <div className="flex items-center gap-1 text-sm text-gray-500">
        <Users size={14} />
        <span>{table.capacity} personas</span>
        {table.sectionName && <span>· {table.sectionName}</span>}
      </div>
      {order && (
        <div className="mt-1 text-sm text-gray-600">
          {order.order_items.length} item(s) · S/ {orderTotal(order).toFixed(2)}
        </div>
      )}
    </Link>
  );
}
