import { supabase } from "@/lib/supabase";
import { config } from "@/lib/config";
import type { CartLine, Order, OrderWithItems } from "@/types";

// Pedido abierto (ABIERTO o ENVIADO_COCINA) para una mesa, si existe.
export async function getOpenOrderForTable(tableId: string): Promise<OrderWithItems | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("table_id", tableId)
    .neq("status", "CERRADO")
    .maybeSingle();

  if (error) throw error;
  return data as OrderWithItems | null;
}

export async function getOpenOrdersByTable(): Promise<Record<string, OrderWithItems>> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("restaurant_id", config.restaurantId)
    .neq("status", "CERRADO");

  if (error) throw error;
  const byTable: Record<string, OrderWithItems> = {};
  for (const order of (data ?? []) as OrderWithItems[]) {
    byTable[order.table_id] = order;
  }
  return byTable;
}

// Envía el carrito a cocina: crea el pedido si no existe uno abierto para la
// mesa, o agrega los items al que ya estaba abierto (ej. el mesero vuelve a
// la mesa a agregar más cosas antes de cerrar la cuenta).
export async function sendCartToKitchen(params: {
  tableId: string;
  tableNumber: string;
  waiterName: string;
  cart: CartLine[];
}): Promise<Order> {
  const { tableId, tableNumber, waiterName, cart } = params;

  let order = await getOpenOrderForTable(tableId);

  if (!order) {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        restaurant_id: config.restaurantId,
        table_id: tableId,
        table_number: tableNumber,
        waiter_name: waiterName,
        status: "ENVIADO_COCINA",
        sent_to_kitchen_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    order = { ...(data as Order), order_items: [] };
  } else if (order.status === "ABIERTO") {
    const { error } = await supabase
      .from("orders")
      .update({ status: "ENVIADO_COCINA", sent_to_kitchen_at: new Date().toISOString() })
      .eq("id", order.id);
    if (error) throw error;
  }

  const rows = cart.map((line) => ({
    order_id: order!.id,
    dish_id: line.dish.id,
    dish_name: line.dish.name,
    unit_price: line.dish.price,
    quantity: line.quantity,
    notes: line.notes || null,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(rows);
  if (itemsError) throw itemsError;

  return order;
}

// "Mandar boleta": cierra el pedido de la mesa. La mesa queda libre.
export async function closeOrder(orderId: string): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ status: "CERRADO", closed_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) throw error;
}

export function orderTotal(order: OrderWithItems): number {
  return order.order_items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
}
