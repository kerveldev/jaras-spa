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
    const [hora, setHora] = useState<string>("");
    const [horarioTransporte, setHorarioTransporte] = useState<any>(null);
    const [usaTransporte, setUsaTransporte] = useState(true);
    const [extras, setExtras] = useState<any[]>([]);
    const [promo, setPromo] = useState<{ aplicado: boolean, valor: number, codigo?: string }>({ aplicado: false, valor: 0, codigo: "" });
    const [totalFinal, setTotalFinal] = useState<number>(0);

    useEffect(() => {
        // Lee todo el objeto reserva guardado por la otra página
        const reserva = safeParse<any>(localStorage.getItem("reserva_data"), null);
        if (reserva) {
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

               <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-slate-500">Fecha</div>
                  <div className="font-semibold text-slate-900">{fechaLegible(fecha)}</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-slate-500">Nombre</div>
                  <div className="font-semibold text-slate-900">{visitantes.find((v:any) => v?.nombre || v?.correo || v?.celular)?.nombre || "-"}</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-slate-500">Hora</div>
                  <div className="font-semibold text-slate-900">{hora || "-"}</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-slate-500">Pases</div>
                  <div className="font-semibold text-slate-900">{totalPases}</div>
                </div>
                
              </div>
            </div>
          </div>

            </section>


                {/* Boletos de acceso y autobús */}
                {/*<section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">*/}
                {/*    <div className="bg-white border rounded p-6 flex flex-col items-center">*/}
                {/*        <div className="font-bold text-black mb-2">Boletos de Acceso</div>*/}
                {/*        <div className="mb-2 text-xs text-gray-600">Presenta este código QR en la entrada principal</div>*/}
                {/*        <Image*/}
                {/*            src={qrURL}*/}
                {/*            alt="Código QR acceso"*/}
                {/*            width={160}*/}
                {/*            height={160}*/}
                {/*            className="mb-2"*/}
                {/*        />*/}
                {/*        <div className="text-xs text-center text-gray-500">*/}
                {/*            Válido para {tipoBoletos}<br />*/}
                {/*            Incluye acceso a todas las instalaciones*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*    <div className="bg-white border rounded p-6 flex flex-col items-center">*/}
                {/*        <div className="font-bold text-black mb-2">Boletos de Autobús</div>*/}
                {/*        <div className="mb-2 text-xs text-gray-600">Presenta este código QR al abordar el autobús</div>*/}
                {/*        <Image*/}
                {/*            src={qrURLMapa}*/}
                {/*            alt="Boleto autobús"*/}
                {/*            width={160}*/}
                {/*            height={160}*/}
                {/*            className="mb-2 w-40 h-40 object-contain"*/}
                {/*        />*/}
                {/*        {usaTransporte ? (*/}
                {/*            <div className="text-xs text-center text-gray-500">*/}
                {/*                Ruta: {horarioTexto}<br />*/}
                {/*                Asientos: General <br />*/}
                {/*                {totalPases} reservados*/}
                {/*            </div>*/}
                {/*        ) : (*/}
                {/*            <div className="text-xs text-center text-gray-400">*/}
                {/*                No reservaste autobús*/}
                {/*            </div>*/}
                {/*        )}*/}
                {/*    </div>*/}
                {/*</section>*/}



                {/* Detalles y extras */}
                {/* <section className="flex flex-col md:flex-row gap-6 md:gap-8 mb-10 text-sm justify-center items-stretch">
                    <div className="bg-white border rounded-lg shadow-md p-6 flex-1 min-w-[280px] max-w-md flex flex-col justify-center items-center">
                        <div className="font-bold text-black mb-4 text-lg flex items-center gap-2">⭐ Resumen de Orden</div>
                        <div className="mb-1 text-black">
                            Pases de entrada: {totalPases} x ${PRECIO_PASE} = <b>${totalBase} MXN</b>
                        </div>
                        {promo.aplicado && (
                            <div className="mb-1 text-green-700 font-bold">
                                Descuento ({promo.codigo || "PROMO"}): -${promo.valor} MXN
                            </div>
                        )}
                        <div className="mb-1 text-black">
                            {usaTransporte ? (
                                <>
                                    Transporte: {totalPases} x ${PRECIO_TRANSPORTE} = <b>${totalTransporte} MXN</b>
                                </>
                            ) : "Sin transporte"}
                        </div>
                        <div className="font-bold text-black mt-2 text-base">
                            Total: ${total} MXN
                        </div>
                    </div>
                    <div className="bg-white border rounded-lg shadow-md p-6 flex-1 min-w-[280px] max-w-md flex flex-col justify-center items-center text-center">
                        <div className="font-bold text-black mb-4 text-lg flex items-center gap-2 justify-center">📩 Contacto</div>
                        {visitantes.length > 0 && (
                            <>
                                <div className="mb-1 text-black">Nombre: {visitantes[0]?.nombre}</div>
                                <div className="mb-1 text-black">Email: {visitantes[0]?.correo}</div>
                                <div className="mb-1 text-black">Celular: {visitantes[0]?.celular}</div>
                            </>
                        )}
                        <div className="mt-1 text-xs text-gray-400">
                            Recibirás un correo de confirmación y tu código de acceso.
                        </div>
                    </div>
                </section> */}
                <div className="flex justify-center my-8">
                    <button
                        className="bg-[#18668b] hover:bg-[#14526d] text-white font-bold px-6 py-3 rounded-lg shadow transition"
                        onClick={() => {
                            router.push("/daypass");
                        }}
                    >
                        Crear nueva venta
                    </button>
                </div>
            </main>
        </div>
    );
}
