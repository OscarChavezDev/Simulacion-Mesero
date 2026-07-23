/** "20:00" (24h, como lo manda el backend) -> "8:00 PM". */
export function formatTime12h(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export function elapsedSince(isoDate: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000));
  if (minutes < 1) return "recién";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `hace ${hours}h ${rest}min`;
}
