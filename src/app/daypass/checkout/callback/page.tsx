"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://lasjaras-api.kerveldev.com/api";

export default function CallbackPage() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    const reservationIdFromQuery = search.get("reservation_id");
    const reservationIdFromStorage =
      typeof window !== "undefined"
        ? localStorage.getItem("reservation_id")
        : null;

    const reservationId = reservationIdFromQuery || reservationIdFromStorage;

    if (!reservationId) {
      router.replace("/daypass/resumen");
      return;
    }

    async function syncQr() {
      try {
        const resp = await fetch(
          `${API_URL}/reservations/${reservationId}/qr`,
          { headers: { Accept: "application/json" } }
        );

        const data = await resp.json().catch(() => ({}));

        if (resp.ok && data?.qr_code_url) {
          localStorage.setItem("qr_code_url", data.qr_code_url);
        }
      } catch (error) {
        console.error("Error obteniendo QR:", error);
      } finally {
        router.replace("/daypass/resumen");
      }
    }

    syncQr();
  }, [router, search]);

  return (
    <div className="min-h-screen grid place-items-center">
      <p className="text-lg font-semibold">
        Confirmando tu pago y generando tu acceso...
      </p>
    </div>
  );
}
