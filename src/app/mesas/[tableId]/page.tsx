"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Clock, Minus, Plus, Receipt, Send, UtensilsCrossed } from "lucide-react";
import toast from "react-hot-toast";
import WaiterGate from "@/components/WaiterGate";
import { getAvailableDishes, getTables, setTableOccupied } from "@/services/restaurantsApi";
import { closeOrder, getOpenOrderForTable, orderTotal, sendCartToKitchen } from "@/services/ordersService";
import { getWaiterName } from "@/lib/waiter";
import { elapsedSince } from "@/lib/time";
import type { CartLine, Dish, OrderWithItems, RestaurantTable } from "@/types";

export default function MesaPage({ params }: { params: { tableId: string } }) {
  const { tableId } = params;
  const router = useRouter();

  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function load(opts: { silent?: boolean } = {}) {
    if (!opts.silent) setLoading(true);
    try {
      const [tables, dishList, currentOrder] = await Promise.all([
        getTables(),
        getAvailableDishes(),
        getOpenOrderForTable(tableId),
      ]);
      setTable(tables.find((t) => t.id === tableId) ?? null);
      setDishes(dishList);
      setOrder(currentOrder);
    } catch (err) {
      console.error(err);
      if (!opts.silent) toast.error("No se pudo cargar la mesa");
    } finally {
      if (!opts.silent) setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Refresco en segundo plano: si otro mesero o el dueño (dashboard de
    // Restaurants) cambia algo mientras esta pantalla está abierta, se
    // refleja solo. Silencioso para no interrumpir al mesero armando el
    // carrito ni mostrarle el loader de pantalla completa cada 10s.
    const interval = setInterval(() => load({ silent: true }), 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId]);

  const categories = useMemo(() => {
    const set = new Set(dishes.map((d) => d.category));
    return Array.from(set);
  }, [dishes]);

  function addToCart(dish: Dish) {
    setCart((prev) => {
      const existing = prev.find((l) => l.dish.id === dish.id);
      if (existing) {
        return prev.map((l) => (l.dish.id === dish.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { dish, quantity: 1, notes: "" }];
    });
  }

  function changeQty(dishId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.dish.id === dishId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  const cartTotal = cart.reduce((sum, l) => sum + l.dish.price * l.quantity, 0);

  async function handleSendToKitchen() {
    if (cart.length === 0 || !table) return;
    const waiterName = getWaiterName();
    if (!waiterName) return;

    setSubmitting(true);
    try {
      await sendCartToKitchen({
        tableId: table.id,
        tableNumber: table.tableNumber,
        waiterName,
        cart,
      });
      await setTableOccupied(table.id, true);
      toast.success("Pedido enviado a cocina");
      setCart([]);
      await load();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo enviar el pedido");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendBill() {
    if (!order || !table) return;
    if (!confirm(`¿Mandar boleta y liberar la mesa ${table.tableNumber}?`)) return;

    setSubmitting(true);
    try {
      await closeOrder(order.id);
      await setTableOccupied(table.id, false);
      toast.success("Mesa liberada");
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo cerrar el pedido");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <WaiterGate>
        <div className="p-6 text-sm text-gray-500">Cargando mesa…</div>
      </WaiterGate>
    );
  }

  if (!table) {
    return (
      <WaiterGate>
        <div className="p-6">
          <p className="text-sm text-gray-500">Mesa no encontrada.</p>
          <Link href="/" className="text-brand-600 underline">
            Volver a mesas
          </Link>
        </div>
      </WaiterGate>
    );
  }

  return (
    <WaiterGate>
      <main className="mx-auto max-w-5xl p-4 pb-40 sm:p-6">
        <header className="mb-4 flex items-center gap-3">
          <Link href="/" className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mesa {table.tableNumber}</h1>
            <p className="text-sm text-gray-500">{table.capacity} personas</p>
          </div>
          {table.nextReservationTime && (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
              <CalendarClock size={14} /> Reservada {table.nextReservationTime}
            </span>
          )}
        </header>

        {table.currentStatus === "UNAVAILABLE" && (
          <div className="mb-6 rounded-2xl border border-gray-300 bg-gray-100 p-3 text-sm text-gray-700">
            Esta mesa está marcada como <strong>no disponible</strong> en Restaurants (fuera de
            servicio). Confirma con el dueño antes de sentar clientes aquí.
          </div>
        )}

        {order && order.order_items.length > 0 && (
          <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-amber-900">Ya en cocina</h2>
              <span className="flex items-center gap-1 text-xs text-amber-700">
                <Clock size={12} /> {elapsedSince(order.sent_to_kitchen_at ?? order.created_at)}
              </span>
            </div>
            <ul className="mb-3 space-y-1 text-sm text-amber-900">
              {order.order_items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>
                    {item.quantity}× {item.dish_name}
                  </span>
                  <span>S/ {(item.unit_price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mb-3 flex justify-between text-sm font-semibold text-amber-900">
              <span>Total</span>
              <span>S/ {orderTotal(order).toFixed(2)}</span>
            </div>
            <button
              onClick={handleSendBill}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              <Receipt size={16} />
              Mandar boleta (libera la mesa)
            </button>
          </section>
        )}

        {categories.map((category) => (
          <section key={category} className="mb-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {category.replace(/_/g, " ")}
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {dishes
                .filter((d) => d.category === category)
                .map((dish) => (
                  <button
                    key={dish.id}
                    onClick={() => addToCart(dish)}
                    className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-brand-400 hover:shadow"
                  >
                    {dish.imageUrl ? (
                      <img
                        src={dish.imageUrl}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-400">
                        <UtensilsCrossed size={18} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{dish.name}</p>
                      <p className="text-xs text-gray-500">S/ {dish.price.toFixed(2)}</p>
                    </div>
                    <Plus
                      size={16}
                      className="shrink-0 text-brand-600 transition group-hover:scale-110"
                    />
                  </button>
                ))}
            </div>
          </section>
        ))}

        {cart.length > 0 && (
          <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white p-4 shadow-lg">
            <div className="mx-auto max-w-5xl">
              <div className="mb-3 max-h-40 space-y-2 overflow-y-auto">
                {cart.map((line) => (
                  <div key={line.dish.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-900">{line.dish.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => changeQty(line.dish.id, -1)}
                        className="rounded-full border border-gray-300 p-1 text-gray-600 hover:bg-gray-100"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-5 text-center">{line.quantity}</span>
                      <button
                        onClick={() => changeQty(line.dish.id, 1)}
                        className="rounded-full border border-gray-300 p-1 text-gray-600 hover:bg-gray-100"
                      >
                        <Plus size={14} />
                      </button>
                      <span className="w-16 text-right text-gray-500">
                        S/ {(line.dish.price * line.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mb-3 flex justify-between text-sm font-semibold">
                <span>Nuevo pedido</span>
                <span>S/ {cartTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={handleSendToKitchen}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                <Send size={16} />
                Enviar a cocina
              </button>
            </div>
          </div>
        )}
      </main>
    </WaiterGate>
  );
}
