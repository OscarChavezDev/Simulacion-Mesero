"use client";

import { useEffect, useState } from "react";
import { getWaiterName, setWaiterName } from "@/lib/waiter";

// Pantalla mínima para identificar al mesero antes de usar la app (sin
// contraseña: solo su nombre, para saber quién tomó cada pedido).
export default function WaiterGate({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState<string | null | undefined>(undefined);
  const [input, setInput] = useState("");

  useEffect(() => {
    setName(getWaiterName());
  }, []);

  if (name === undefined) return null;

  if (!name) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <form
          className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            setWaiterName(input);
            setName(input.trim());
          }}
        >
          <h1 className="mb-1 text-lg font-semibold text-gray-900">¿Quién eres?</h1>
          <p className="mb-4 text-sm text-gray-500">
            Ingresa tu nombre para identificar los pedidos que tomes.
          </p>
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nombre del mesero"
            className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Continuar
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
