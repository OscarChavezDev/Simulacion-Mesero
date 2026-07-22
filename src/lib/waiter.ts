// Identificación mínima del mesero: solo su nombre, guardado en el
// dispositivo. No hay login real — es una app interna de un solo
// restaurante piloto usada en tablets del local.
const STORAGE_KEY = "meseros:nombre";

export function getWaiterName(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setWaiterName(name: string): void {
  window.localStorage.setItem(STORAGE_KEY, name.trim());
}

export function clearWaiterName(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
