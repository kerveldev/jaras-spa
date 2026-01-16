"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Demo QR (fallback)
const BASE_QR_URL =
  "https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=";

const PRECIO_PASE = 350;
const PRECIO_TRANSPORTE = 120;

function safeParse<T>(item: string | null, def: T): T {
  try {
    return item ? JSON.parse(item) : def;
  } catch {
    return def;
  }
}

// Formatea fecha a texto en español
function fechaLegible(fechaStr: string | string[]) {
  if (!fechaStr || (Array.isArray(fechaStr) && fechaStr.length === 0))
    return "-";

  const fecha = Array.isArray(fechaStr) ? fechaStr[0] : fechaStr;

  try {
    const safeFecha = fecha.includes("T") ? fecha : fecha + "T12:00:00";
    return new Date(safeFecha).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      weekday: "long",
    });
  } catch {
    return fecha;
  }
}

function digitsOnly(input: string) {
  return (input || "").replace(/\D/g, "");
}

async function shareQrImage(qrUrl: string, text: string) {
  const res = await fetch(qrUrl, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo descargar el QR.");

  const blob = await res.blob();
  const ext = blob.type === "image/png" ? "png" : "jpg";
  const file = new File([blob], `qr-las-jaras.${ext}`, { type: blob.type });

  const nav: any = navigator as any;

  if (!nav?.share) throw new Error("Compartir no disponible en este navegador.");
  if (nav?.canShare && !nav.canShare({ files: [file] })) {
    throw new Error("Este navegador no permite compartir imágenes.");
  }

  await nav.share({
    title: "Reserva Las Jaras",
    text,
    files: [file],
  });
}

/**
 * Normaliza teléfono a formato wa.me SIN "+"
 * - Si son 10 dígitos => asumimos MX y usamos 521 + número
 * - Si ya viene con 52 o 521 => lo dejamos
 */
function normalizeWhatsAppMx(raw?: string | null) {
  if (!raw) return null;
  const d = digitsOnly(raw);

  if (d.length === 10) return `521${d}`;
  if (d.length >= 11) return d;

  return null;
}

function buildWaUrl(phoneE164: string | null, text: string) {
  const encoded = encodeURIComponent(text);
  const base = phoneE164 ? `https://wa.me/${phoneE164}` : "https://wa.me/";
  return `${base}?text=${encoded}`;
}

async function safeClipboardCopy(text: string) {
  if (!text) return;
  if (navigator?.clipboard?.writeText)
    return navigator.clipboard.writeText(text);

  const el = document.createElement("textarea");
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

function fmtMoney(maybe: any) {
  const n = Number(maybe);
  if (Number.isFinite(n)) {
    return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  }
  return String(maybe ?? "-");
}

function statusUi(status: string) {
  const s = (status || "").toLowerCase();

  if (s === "paid") {
    return {
      code: "paid",
      label: "PAGADA / CONFIRMADA",
      pill: "bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
      hero: "¡Reserva confirmada!",
      heroSubtitle:
        "Gracias por tu reserva en Las Jaras. Aquí tienes tus detalles y accesos.",
      waTitle: "✅ *Reserva confirmada – Las Jaras*",
    };
  }

  if (s === "pending") {
    return {
      code: "pending",
      label: "PENDIENTE DE PAGO",
      pill: "bg-amber-50 text-amber-800",
      dot: "bg-amber-500",
      hero: "Reserva pendiente",
      heroSubtitle:
        "Tu reservación fue registrada, pero el pago aún no está confirmado. Puedes reintentar el pago o esperar confirmación.",
      waTitle: "🟡 *Reserva pendiente – Las Jaras*",
    };
  }

  if (s === "cancelled") {
    return {
      code: "cancelled",
      label: "CANCELADA",
      pill: "bg-red-50 text-red-700",
      dot: "bg-red-500",
      hero: "Reserva cancelada",
      heroSubtitle:
        "Esta reservación está cancelada. Si necesitas ayuda, contáctanos.",
      waTitle: "⛔ *Reserva cancelada – Las Jaras*",
    };
  }

  // failed / unknown
  return {
    code: "failed",
    label: "PAGO NO COMPLETADO",
    pill: "bg-red-50 text-red-700",
    dot: "bg-red-500",
    hero: "Pago no completado",
    heroSubtitle:
      "No se completó el pago. No se realizó ningún cobro. Puedes intentar de nuevo o crear una nueva reservación.",
    waTitle: "❌ *Pago no completado – Las Jaras*",
  };
}

export default function ConfirmacionReservaPage() {
  const router = useRouter();

  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const [visitantes, setVisitantes] = useState<any[]>([]);
  const [cantidad, setCantidad] = useState(1);
  const [fecha, setFecha] = useState<string>("");
  const [linkQr, setLinkQr] = useState<string>("");
  const [hora, setHora] = useState<string>("");
  const [horarioTransporte, setHorarioTransporte] = useState<any>(null);
  const [usaTransporte, setUsaTransporte] = useState(true);
  const [extras, setExtras] = useState<any[]>([]);
  const [promo, setPromo] = useState<{
    aplicado: boolean;
    valor: number;
    codigo?: string;
  }>({ aplicado: false, valor: 0, codigo: "" });
  const [totalFinal, setTotalFinal] = useState<number>(0);

  const [openpayReservationId, setOpenpayReservationId] = useState<string | null>(
    null
  );
  const [openpaySaleId, setOpenpaySaleId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);

  // ✅ default seguro: pending (no "paid")
  const [reservationStatus, setReservationStatus] = useState<string>("pending");

  // Para generar QR con datos reales (fallback)
  const qrData = `LJ-RESERVA|${fecha}|${hora}|${cantidad}`;
  const qrURL = BASE_QR_URL + encodeURIComponent(qrData);

  useEffect(() => {
    const reserva = safeParse<any>(localStorage.getItem("reserva_data"), null);
    const qrCodeUrl = localStorage.getItem("qr_code_url") || qrURL;

    const rId = localStorage.getItem("openpay_reservation_id");
    const sId = localStorage.getItem("openpay_sale_id");

    // ✅ FIX: sin "|| paid || pending" (eso siempre se queda en paid)
    const st =
      (localStorage.getItem("reservation_status") ||
        reserva?.status ||
        "pending") as string;

    setReservationStatus(String(st).toLowerCase());

    setOpenpayReservationId(rId);
    setOpenpaySaleId(sId);

    if (reserva) {
      setLinkQr(qrCodeUrl);
      setVisitantes(reserva.visitantes || []);
      setCantidad(reserva.visitantes?.length || 1);
      setFecha(reserva.fechaVisita || "");
      setHora(reserva.horaVisita || "");
      setHorarioTransporte(reserva.transporte?.horario || null);
      setUsaTransporte(reserva.transporte?.usa ?? true);
      setExtras(reserva.extras || []);
      setPromo(reserva.promo || { aplicado: false, valor: 0, codigo: "" });
      setTotalFinal(reserva.total || 0);
    }
  }, [qrURL]);

  // Totales
  const totalPases = cantidad;
  const totalExtras = extras.reduce((acc, curr) => acc + (curr?.total || 0), 0);
  const totalBase = totalPases * PRECIO_PASE;
  const totalPromo = promo.aplicado ? promo.valor : 0;
  const totalTransporte = usaTransporte ? totalPases * PRECIO_TRANSPORTE : 0;
  const total = totalFinal || totalBase + totalExtras + totalTransporte - totalPromo;

  // Datos UX
  const fechaTexto = fecha ? fechaLegible(fecha) : "-";
  const horarioTexto = horarioTransporte
    ? `${horarioTransporte.hora} (${horarioTransporte.salida})`
    : "-";

  const visitantePrincipal = visitantes?.[0] || null;
  const nombrePrincipal = visitantePrincipal?.nombre || "";
  const celularRaw = visitantePrincipal?.celular || null;
  const phoneE164 = normalizeWhatsAppMx(celularRaw);
  const correoRaw = visitantePrincipal?.correo || null;

  const status = statusUi(reservationStatus);

  const retryUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/daypass`;
  }, []);

  const waText = useMemo(() => {
    const folio = openpayReservationId || "-";
    const sale = openpaySaleId || "-";
    const qrLine = linkQr
      ? `QR de acceso: ${linkQr}`
      : "QR: te llegará en el PDF del correo";
    const APP_CLIENTES_URL = "https://lasjaras-app.kerveldev.com";

    const failedBlock =
      status.code === "failed"
        ? [
            ``,
            `⚠️ *No se completó el pago con tarjeta.*`,
            `No se realizó ningún cobro.`,
            retryUrl ? `Puedes intentar de nuevo aquí: ${retryUrl}` : null,
            `Si necesitas ayuda, comparte este folio con recepción.`,
          ]
        : [];

    const pendingBlock =
      status.code === "pending"
        ? [
            ``,
            `⏳ *Tu pago está en proceso.*`,
            `Si no se confirma en unos minutos, revisa tu correo o intenta nuevamente.`,
          ]
        : [];

    return [
      status.waTitle,
      ``,
      nombrePrincipal ? `Nombre: *${nombrePrincipal}*` : null,
      correoRaw ? `Usuario (email): *${correoRaw}*` : null,
      `Folio: *${folio}*`,
      `Estatus: *${status.label}*`,
      `Pago (sale): *${sale}*`,
      `Fecha: *${fechaTexto}*`,
      `Hora: *${hora || "-"}*`,
      `Visitantes: *${totalPases}*`,
      `Total: *${fmtMoney(total)}*`,
      usaTransporte ? `Transporte: *Sí* (${horarioTexto})` : `Transporte: *No*`,
      ...pendingBlock,
      ...failedBlock,
      ``,
      qrLine,
      ``,
      `👤 *Mi cuenta (app de clientes):* ${APP_CLIENTES_URL}`,
      correoRaw
        ? `Para ingresar usa tu email. Si es tu primera vez, toca *"Olvidé mi contraseña"* para crear una nueva.`
        : `Para ingresar usa tu email. Si es tu primera vez, toca *"Olvidé mi contraseña"*.`,
      ``,
      `🌿 ¡Nos vemos pronto!`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [
    openpayReservationId,
    openpaySaleId,
    nombrePrincipal,
    correoRaw,
    fechaTexto,
    hora,
    totalPases,
    total,
    usaTransporte,
    horarioTexto,
    linkQr,
    status.code,
    status.label,
    status.waTitle,
    retryUrl,
  ]);

  const waUrl = useMemo(() => buildWaUrl(phoneE164, waText), [phoneE164, waText]);

  async function onCopyInfo() {
    await safeClipboardCopy(waText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function onCopyQr() {
    if (!linkQr) return;
    await safeClipboardCopy(linkQr);
    setCopiedQr(true);
    setTimeout(() => setCopiedQr(false), 1500);
  }

  function onWhatsApp() {
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  function onOpenQr() {
    if (!linkQr) return;
    window.open(linkQr, "_blank", "noopener,noreferrer");
  }

  async function onShareQr() {
    setShareNotice(null);

    if (!linkQr) {
      setShareNotice("Aún no tenemos el QR listo para compartir.");
      return;
    }

    const nav: any = navigator as any;

    if (!nav?.share) {
      setShareNotice(
        'Tu navegador no soporta compartir imágenes. Usa "Abrir QR" o "Copiar link QR".'
      );
      return;
    }

    try {
      await shareQrImage(linkQr, waText);
      setShareNotice("Listo ✅ Se abrió el menú para compartir.");
      setTimeout(() => setShareNotice(null), 2000);
    } catch (e: any) {
      console.error(e);
      setShareNotice(
        e?.message ||
          'No se pudo compartir el QR como imagen. Usa "Abrir QR" o "Copiar link QR".'
      );
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <main className="max-w-5xl w-full mx-auto px-4 py-12 flex-1">
        {/* HERO */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700">
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-titles text-[#B7804F] mt-4">
            {status.hero}
          </h1>

          <p className="text-slate-600 mt-2">{status.heroSubtitle}</p>

          {/* Chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs bg-white border text-slate-700">
              Fecha: <strong>{fechaTexto}</strong>
            </span>
            <span className="px-3 py-1 rounded-full text-xs bg-white border text-slate-700">
              Total: <strong>{fmtMoney(total)}</strong>
            </span>
            {openpayReservationId && (
              <span className="px-3 py-1 rounded-full text-xs bg-white border text-slate-700">
                Folio: <strong>{openpayReservationId}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Confirmación + QR */}
        <section className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Confirmación */}
            <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 ${status.pill}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
                    {status.label}
                  </div>

                  <div className="font-titles text-[#B7804F] text-xl mb-2 text-left">
                    {status.code === "paid" ? "¡Reserva completada!" : "Estado de tu reserva"}
                  </div>

                  <p className="text-slate-700 mb-3">
                    {status.code === "paid" ? (
                      <>
                        Recibirás un{" "}
                        <span className="font-semibold">PDF con tus accesos</span> y
                        toda la información de tu reserva en tu correo electrónico.
                      </>
                    ) : (
                      <>
                        Esta pantalla muestra el estatus actual. Si el pago no se completó,
                        puedes reintentar desde <span className="font-semibold">Nueva reservación</span>.
                      </>
                    )}
                  </p>

                  <p className="text-slate-500 text-xs">
                    Revisa tu bandeja de entrada y, si no lo encuentras, verifica en spam o promociones.
                  </p>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onWhatsApp}
                  className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-4 shadow-sm transition"
                >
                  Enviar por WhatsApp
                </button>

                <button
                  onClick={onCopyInfo}
                  className="flex-1 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 py-4 border border-slate-200 shadow-sm transition"
                >
                  {copied ? "Copiado ✅" : "Copiar info"}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 mt-3">
                {phoneE164
                  ? `WhatsApp se enviará al número: ${celularRaw}`
                  : `No detectamos teléfono; WhatsApp se abrirá sin destinatario para que elijas el contacto.`}
              </p>
            </div>

            {/* QR */}
            <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="text-slate-700 mb-3 flex flex-col items-center">
                <p className="mb-1">
                  <strong>Este es tu código QR de acceso:</strong>
                </p>

                {linkQr ? (
                  <>
                    <a
                      href={linkQr}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-center"
                    >
                      <Image
                        src={linkQr}
                        alt="Código QR de acceso"
                        width={220}
                        height={220}
                        className="mb-3 rounded-xl border bg-white p-2"
                        unoptimized
                      />
                    </a>

                    <div className="w-full flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={onOpenQr}
                        className="flex-1 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 border border-slate-200 transition"
                      >
                        Abrir QR
                      </button>

                      <button
                        onClick={onCopyQr}
                        className="flex-1 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 border border-slate-200 transition"
                      >
                        {copiedQr ? "Copiado ✅" : "Copiar link QR"}
                      </button>

                      <button
                        onClick={onShareQr}
                        className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 transition"
                      >
                        Compartir QR (imagen)
                      </button>
                    </div>

                    {shareNotice && (
                      <p className="text-[11px] text-slate-500 mt-3 text-center">
                        {shareNotice}
                      </p>
                    )}

                    <p className="text-[11px] text-slate-500 mt-3 text-center">
                      Preséntalo en acceso/taquilla. También viene en el PDF del correo.
                    </p>
                  </>
                ) : (
                  <div className="w-full rounded-xl border bg-slate-50 p-6 text-center">
                    <p className="text-slate-700 text-sm font-semibold">Generando tu QR…</p>
                    <p className="text-slate-500 text-xs mt-2">
                      Si no aparece aquí, lo recibirás en el correo (PDF de accesos).
                    </p>
                    <button
                      onClick={() => {
                        const qr = localStorage.getItem("qr_code_url");
                        if (qr) setLinkQr(qr);
                      }}
                      className="mt-4 w-full rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 border border-slate-200 transition"
                    >
                      Actualizar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <div className="flex flex-col items-center my-12 px-4">
          <div className="text-center mb-6">
            <h3 className="text-xl md:text-2xl font-titles text-[#B7804F] mb-2">
              Continúa disfrutando la experiencia
            </h3>
            <p className="text-gray-600 text-sm md:text-base">
              Reserva tu próximo day pass con facilidad
            </p>
          </div>

          <button
            className="group relative bg-[#B7804F] hover:bg-[#A06F44] text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out w-full max-w-sm border border-[#B7804F]"
            onClick={() => router.push("/daypass")}
          >
            <div className="flex items-center justify-center gap-3">
              <svg
                className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-lg">Nueva reservación</span>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
