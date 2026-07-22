import axios from "axios";
import { config } from "@/lib/config";
import type { ApiResponse, Dish, RestaurantTable } from "@/types";

// Cliente hacia el sistema de Restaurants (solo lectura pública: menú y
// mesas). No lleva ninguna key: esos endpoints son GET públicos.
const restaurantsApi = axios.create({
  baseURL: config.restaurantsApiUrl,
});

export async function getTables(): Promise<RestaurantTable[]> {
  const { data } = await restaurantsApi.get<ApiResponse<RestaurantTable[]>>(
    `/v1/restaurants/${config.restaurantId}/tables`
  );
  return data.data;
}

export async function getAvailableDishes(): Promise<Dish[]> {
  const { data } = await restaurantsApi.get<ApiResponse<Dish[]>>(
    `/v1/dishes/restaurant/${config.restaurantId}`
  );
  return data.data.filter((d) => d.isAvailable);
}

// Marca la mesa ocupada/libre. Llama a NUESTRA ruta servidor (/api/mesas/...)
// y no directo al sistema de Restaurants: el header secreto
// X-Table-Integration-Key solo puede vivir en el servidor, nunca en el
// navegador del mesero.
export async function setTableOccupied(tableId: string, occupied: boolean): Promise<void> {
  await axios.patch(`/api/mesas/${tableId}/estado`, { occupied });
}
