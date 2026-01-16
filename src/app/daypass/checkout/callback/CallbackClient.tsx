// src/app/daypass/checkout/callback/CallbackClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

type ConfirmResponse = {
  success: boolean;
  paid?: boolean;
  charge_status?: string;
  reservation?: {
    id: number;
    qr_code_url?: string | null;
  };
  error?: string;
};

const API_BASE = "https://lasjaras-api.kerveldev.com";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [statusMessage, setStatusMessage] = useState(
    "Confirmando tu pago con el servidor..."
  );

  const qp = useMemo(() => {
    const get = (k: string) => searchParams.get(k);
    return {
      status: get("status"), // lo ignoraremos como fuente de verdad
      transactionId: get("transaction_id") ?? get("id") ?? get("charge_id"),
      saleId: get("sale_id") ?? get("saleId"),
    };
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function confirmOpenpay(saleId: string): Promise<ConfirmResponse> {
      const resp = await fetch(`${API_BASE}/api/pagos/openpay-confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ sale_id: Number(saleId) }),
        cache: "no-store",
      });

      const json = (await resp.json().catch(() => ({}))) as ConfirmResponse;

      if (!resp.ok) {
        return {
          success: false,
          paid: false,
          error: json?.error || "No se pudo confirmar el pago.",
        };
      }

      return json;
    }

    async function run() {
      try {
        const saleId =
          qp.saleId ??
          (typeof window !== "undefined"
            ? localStorage.getItem("openpay_sale_id")
            : null);

        if (!saleId) {
          toast.error("No se encontró sale_id para confirmar el pago.");
          router.replace("/daypass");
          return;
        }

        // Polling hasta ~30s (15 intentos x 2s)
        const maxAttempts = 15;

        for (let i = 1; i <= maxAttempts; i++) {
          if (cancelled) return;

          setStatusMessage(
            i === 1
              ? "Validando pago..."
              : `Procesando pago... (${i}/${maxAttempts})`
          );

          const res = await confirmOpenpay(saleId);

          // Si backend responde éxito y pagado => guardamos QR y nos vamos al resumen
          if (res?.success && res?.paid) {
            const qrUrl = res?.reservation?.qr_code_url ?? null;
            if (typeof window !== "undefined" && qrUrl) {
              localStorage.setItem("qr_code_url", qrUrl);
            }
            if (res?.reservation?.id) {
              localStorage.setItem(
                "openpay_reservation_id",
                String(res.reservation.id)
              );
            }

            localStorage.setItem("reservation_status", "paid");

            setStatusMessage("Pago confirmado. Redirigiendo al resumen...");
            router.replace("/daypass/resumen");
            return;
          }

          // Si éxito pero no pagado: seguir esperando
          if (res?.success && !res?.paid) {
            localStorage.setItem("reservation_status", "pending");
            await sleep(2000);
            continue;
          }

          // Si falló: cortar
          toast.error(res?.error || "No se pudo confirmar el pago.");
          localStorage.setItem("reservation_status", "failed");
          localStorage.removeItem("openpay_sale_id");
          localStorage.removeItem("openpay_reservation_id");

          router.replace("/daypass");
          return;
        }

        // Si se acabó el tiempo de polling, igual lo mandamos a resumen (que muestre “en proceso” si quieren)
        toast("Tu pago sigue en proceso. Si no aparece, revisa tu correo.", {
          icon: "⏳",
        });
        localStorage.setItem("reservation_status", "pending");

        router.replace("/daypass/resumen");
      } catch (e) {
        console.error(e);
        toast.error("Error al validar el pago.");
        router.replace("/daypass");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router, qp]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="p-6 rounded-xl bg-white shadow text-center max-w-sm">
        <p className="font-semibold text-slate-700 mb-2">
          Regresando a Las Jaras...
        </p>
        <p className="text-xs text-slate-500">{statusMessage}</p>
      </div>
    </main>
  );
}
