"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";

// Demo QR (puedes actualizar el string con los datos reales de la reserva si lo deseas)
const BASE_QR_URL = "https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=";
const MAPA_BOLETO = "https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=";

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
// Formatea fecha a texto en español
function fechaLegible(fechaStr: string | string[]) {
    if (!fechaStr || (Array.isArray(fechaStr) && fechaStr.length === 0)) return "-";

    // Si es array, usamos el primer valor
    const fecha = Array.isArray(fechaStr) ? fechaStr[0] : fechaStr;

    try {
        const safeFecha = fecha.includes("T") ? fecha : fecha + "T12:00:00";
        return new Date(safeFecha).toLocaleDateString("es-MX", {
            year: "numeric",
            month: "long",
            day: "2-digit",
            weekday: "long"
        });
    } catch {
        return fecha;
    }
}


export default function ConfirmacionReservaPage() {
    const router = useRouter();
    // Estados para info real
    const [visitantes, setVisitantes] = useState<any[]>([]);
    const [cantidad, setCantidad] = useState(1);
    const [fecha, setFecha] = useState<string>("");
    const [linkQr, setLinkQr] = useState<string>("");
    const [hora, setHora] = useState<string>("");
    const [horarioTransporte, setHorarioTransporte] = useState<any>(null);
    const [usaTransporte, setUsaTransporte] = useState(true);
    const [extras, setExtras] = useState<any[]>([]);
    const [promo, setPromo] = useState<{ aplicado: boolean, valor: number, codigo?: string }>({ aplicado: false, valor: 0, codigo: "" });
    const [totalFinal, setTotalFinal] = useState<number>(0);

    useEffect(() => {
        // Lee todo el objeto reserva guardado por la otra página
        const reserva = safeParse<any>(localStorage.getItem("reserva_data"), null);
        const qrCodeUrl = localStorage.getItem("qr_code_url") || qrURL;
        if (reserva) {
            console.log("Cargando datos de reserva desde localStorage:", qrCodeUrl);
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
            console.log("Datos de reserva recuperados del localStorage:", reserva);
        }
    }, []);

    // Totales y textos
    const totalPases = cantidad;

    const totalExtras = extras.reduce((acc, curr) => acc + (curr?.total || 0), 0);
    const totalBase = totalPases * PRECIO_PASE;
    const totalPromo = promo.aplicado ? promo.valor : 0;
    const totalTransporte = usaTransporte ? totalPases * PRECIO_TRANSPORTE : 0;
    // Usar totalFinal del objeto reserva_data si está disponible
    const total = totalFinal || (totalBase + totalExtras + totalTransporte - totalPromo);

    // Para generar QR con datos reales (puedes usar un ID único si tienes uno)
    const qrData = `LJ-RESERVA|${fecha}|${hora}|${totalPases}`;
    const qrURL = BASE_QR_URL + encodeURIComponent(qrData);
    const qrURLMapa = MAPA_BOLETO + encodeURIComponent(qrData);

    // Nombres y tipos de visitantes
    const nombresVisitantes = visitantes.map((v, i) => v?.nombre || `Visitante ${i+1}`).join(", ");
    const tipoBoletos = `${totalPases} ${totalPases === 1 ? "persona" : "personas"}`;

    // Horario de transporte
    const horarioTexto = horarioTransporte
        ? `${horarioTransporte.hora} (${horarioTransporte.salida})`
        : "-";

    // Extras
    const extrasList = extras.filter((x: any) => x.cantidad > 0);

    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
            <main className="max-w-5xl w-full mx-auto px-4 py-12 flex-1">
                {/* Mensaje de confirmación */}
               <div className="mb-10">
          <div className="flex items-center justify-center gap-3">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700">
              {/* Check icon */}
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <h1 className="text-center text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">¡Reserva confirmada!</h1>
          <p className="text-center text-slate-600 mt-2">
            Gracias por tu reserva en <span className="font-semibold text-slate-800">Las Jaras</span>. Aquí tienes tus detalles y accesos.
          </p>
        </div>


                {/* Confirmación + Detalles (side by side) */}
            <section className="py-16">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Confirmación de reserva y PDF */}
            <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Confirmada
              </div>
              <div className="font-bold text-slate-900 text-xl mb-2 text-left">¡Reserva completada!</div>
              <p className="text-slate-700 mb-3">
                Recibirás un <span className="font-semibold">PDF con tus accesos</span> y toda la información de tu reserva en tu correo electrónico.
              </p>
              <p className="text-slate-500 text-xs">
                Revisa tu bandeja de entrada y, si no lo encuentras, verifica en la carpeta de spam o promociones.
              </p>

             
            </div>

                {/* Detalles de la reserva */}
            <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-5 shadow-sm">
            {/* mostrar el link que tengo guardado en localStorage del qr */}
            <div className="text-slate-700 mb-3 flex flex-col items-center">
              <p className="mb-1"><strong>Este es tu código QR de acceso: </strong></p>
              <a href={linkQr} className="flex justify-center">
                <img src={linkQr} alt="Código QR de acceso" width={160} height={160} className="mb-2" />
              </a>
            </div>
            </div>
          </div>    

            </section>


                <div className="flex flex-col items-center my-12 px-4">
                    <div className="text-center mb-6">
                        <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                            Continúa disfrutando la experiencia
                        </h3>
                        <p className="text-gray-600 text-sm md:text-base">
                            Reserva tu próximo day pass con facilidad
                        </p>
                    </div>
                    
                    <button
                        className="group relative bg-white hover:bg-gray-50 text-[#18668b] hover:text-[#14526d] font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out w-full max-w-sm border border-gray-200 hover:border-[#18668b]"
                        onClick={() => {
                            router.push("/daypass");
                        }}
                    >
                        <div className="flex items-center justify-center gap-3">
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                            <span className="text-lg">Nueva reservación</span>
                        </div>
                    </button>
                </div>
            </main>
        </div>
    );
}
