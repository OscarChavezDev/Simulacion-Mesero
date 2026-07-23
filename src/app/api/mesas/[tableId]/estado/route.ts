import { NextRequest, NextResponse } from "next/server";

// Proxy servidor hacia el endpoint de estado manual de mesa de Restaurants
// (LayoutController.updateTableStatus), autenticado con la API key del propio
// dueño del restaurante (generada en su dashboard: Restaurants → API Keys).
// Esta llamada se hace desde el servidor de Next.js y no directo desde el
// navegador del mesero para que la key nunca quede expuesta en el cliente.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { tableId: string } }
) {
  const apiKey = process.env.RESTAURANTS_API_KEY;
  const apiUrl = process.env.NEXT_PUBLIC_RESTAURANTS_API_URL;
  const restaurantId = process.env.NEXT_PUBLIC_RESTAURANT_ID;

  if (!apiKey || !apiUrl || !restaurantId) {
    return NextResponse.json(
      { success: false, message: "Integración con Restaurants no configurada" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const status = body.occupied ? "OCCUPIED" : "AVAILABLE";

  const upstream = await fetch(
    `${apiUrl}/v1/restaurants/${restaurantId}/tables/${params.tableId}/status?status=${status}`,
    {
      method: "PATCH",
      headers: { "X-API-Key": apiKey },
    }
  );

  const payload = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json(
      { success: false, message: payload?.message ?? "No se pudo actualizar la mesa" },
      { status: upstream.status }
    );
  }

  return NextResponse.json(payload ?? { success: true });
}
