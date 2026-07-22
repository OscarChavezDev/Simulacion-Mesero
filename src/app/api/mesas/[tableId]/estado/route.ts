import { NextRequest, NextResponse } from "next/server";

// Proxy servidor hacia el webhook piloto del sistema de Restaurants
// (TableOrderIntegrationController). El header X-Table-Integration-Key es un
// secreto compartido fijo: por eso esta llamada se hace desde el servidor de
// Next.js y no directo desde el navegador del mesero.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { tableId: string } }
) {
  const apiKey = process.env.TABLE_ORDER_INTEGRATION_API_KEY;
  const apiUrl = process.env.NEXT_PUBLIC_RESTAURANTS_API_URL;

  if (!apiKey || !apiUrl) {
    return NextResponse.json(
      { success: false, message: "Integración con Restaurants no configurada" },
      { status: 500 }
    );
  }

  const body = await request.json();

  const upstream = await fetch(
    `${apiUrl}/v1/table-order-integration/tables/${params.tableId}/order-status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Table-Integration-Key": apiKey,
      },
      body: JSON.stringify({ occupied: body.occupied }),
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
