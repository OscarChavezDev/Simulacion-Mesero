import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meseros — Tingo Restaurants",
  description: "Toma de pedidos en mesa para el personal de sala",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
