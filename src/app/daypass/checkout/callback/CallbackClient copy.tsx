// src/app/daypass/checkout/callback/CallbackClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [statusMessage, setStatusMessage] = useState(
    "Validando información de tu pago..."
  );

  useEffect(() => {
    async function run() {
      try {
        const status = searchParams.get("status"); // ajusta nombres según lo que regrese Openpay
        const transactionId =
          searchParams.get("transaction_id") ?? searchParams.get("id");
        const saleId =
          searchParams.get("sale_id") ??
          (typeof window !== "undefined"
            ? localStorage.getItem("openpay_sale_id")
            : null);

        // Aquí puedes hacer la llamada a tu API para confirmar:
        // await fetch("https://lasjaras-api.kerveldev.com/api/pagos/openpay-callback", { ... })

        console.log("Callback Openpay:", {
          status,
          transactionId,
          saleId,
        });

        if (status === "completed" || status === "success") {
          setStatusMessage("Pago confirmado, generando tu reservación...");
          // Redirigimos al resumen
          router.replace("/daypass/resumen");
        } else if (status === "failed" || status === "cancelled") {
          setStatusMessage("Hubo un problema con tu pago.");
          toast.error("No se pudo completar el pago. Inténtalo de nuevo.");
          router.replace("/daypass");
        } else {
          // Caso raro / sin status claro
          setStatusMessage(
            "No pudimos validar el estado del pago. Por favor revisa tu correo o intenta de nuevo."
          );
          router.replace("/daypass");
        }
      } catch (err) {
        console.error(err);
        setStatusMessage(
          "Ocurrió un error al validar tu pago. Inténtalo de nuevo."
        );
        toast.error("Error al validar el pago.");
        router.replace("/daypass");
      }
    }

    run();
  }, [router, searchParams]);

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
