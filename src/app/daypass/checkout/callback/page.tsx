// src/app/daypass/checkout/callback/page.tsx
import { Suspense } from "react";
import { CallbackClient } from "./CallbackClient";

export const dynamic = "force-dynamic"; // evita problemas al prerenderizar

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="p-6 rounded-xl bg-white shadow text-center">
            <p className="font-semibold text-slate-700 mb-2">
              Procesando tu pago...
            </p>
            <p className="text-xs text-slate-500">
              Espera unos segundos mientras confirmamos tu reservación.
            </p>
          </div>
        </main>
      }
    >
      <CallbackClient />
    </Suspense>
  );
}
