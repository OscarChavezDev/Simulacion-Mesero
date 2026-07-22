"use client";

import { useEffect, useState } from "react";
import { LogOut, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import WaiterGate from "@/components/WaiterGate";
import TableCard from "@/components/TableCard";
import { getTables } from "@/services/restaurantsApi";
import { getOpenOrdersByTable } from "@/services/ordersService";
import { clearWaiterName, getWaiterName } from "@/lib/waiter";
import type { OrderWithItems, RestaurantTable } from "@/types";

export default function MesasPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orders, setOrders] = useState<Record<string, OrderWithItems>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [tablesData, ordersData] = await Promise.all([
        getTables(),
        getOpenOrdersByTable(),
      ]);
      setTables(tablesData);
      setOrders(ordersData);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo cargar el estado de las mesas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <WaiterGate>
      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mesas</h1>
            <p className="text-sm text-gray-500">Hola, {getWaiterName()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100"
              title="Actualizar"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => {
                clearWaiterName();
                window.location.reload();
              }}
              className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100"
              title="Cambiar mesero"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {tables.length === 0 && !loading && (
          <p className="text-sm text-gray-500">
            No hay mesas configuradas. Verifica NEXT_PUBLIC_RESTAURANT_ID en .env.local.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {tables.map((table) => (
            <TableCard key={table.id} table={table} order={orders[table.id] ?? null} />
          ))}
        </div>
      </main>
    </WaiterGate>
  );
}
