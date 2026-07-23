// ── Tipos que vienen del sistema de Restaurants (API pública) ──

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  capacity: number;
  sectionId: string | null;
  sectionName: string | null;
  isActive: boolean;
  currentStatus: string; // "AVAILABLE" | "OCCUPIED" | ...
  /** Hora (HH:mm) de la próxima reserva de hoy para esta mesa, si tiene. No incluye datos del cliente. */
  nextReservationTime: string | null;
}

export type DishCategory =
  | "ENTRADA"
  | "PLATO_FONDO"
  | "POSTRE"
  | "BEBIDA"
  | "ADICIONAL"
  | string;

export interface Dish {
  id: string;
  name: string;
  description: string;
  category: DishCategory;
  price: number;
  preparationTime: number | null;
  calories: number | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  allergens: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode: string | null;
  timestamp: string;
}

// ── Tipos propios (Supabase: pedidos del mesero) ──

export type OrderStatus = "ABIERTO" | "ENVIADO_COCINA" | "ENTREGADO" | "CERRADO";

export interface OrderItem {
  id: string;
  order_id: string;
  dish_id: string;
  dish_name: string;
  unit_price: number;
  quantity: number;
  notes: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string;
  table_number: string;
  waiter_name: string;
  status: OrderStatus;
  created_at: string;
  sent_to_kitchen_at: string | null;
  closed_at: string | null;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

// Item en el carrito antes de guardarse en Supabase
export interface CartLine {
  dish: Dish;
  quantity: number;
  notes: string;
}
