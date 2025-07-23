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
            <Header />
            <main className="max-w-5xl w-full mx-auto px-4 py-12 flex-1">
                {/* Mensaje de confirmación */}
                <div className="text-center mb-10">
                    <div className="text-3xl mb-4 text-black">¡Reserva Confirmada!</div>
                    <div className="text-lg text-gray-700">
                        Gracias por tu reserva en Las Jaras. A continuación encontrarás tus boletos de acceso.
                    </div>
                </div>


                {/* Confirmación de reserva y PDF */}
                <section className="flex justify-center items-center py-16">
                    <div className="bg-white border rounded p-8 max-w-md w-full text-center">
                        <div className="font-bold text-black text-lg mb-4">¡Reserva completada!</div>
                        <div className="text-gray-600 mb-2">
                            Recibirás un <span className="font-semibold">PDF con tus accesos</span> y toda la información de tu reserva en tu correo electrónico.
                        </div>
                        <div className="text-gray-500 text-xs">
                            Revisa tu bandeja de entrada y, si no lo encuentras, verifica en la carpeta de spam o promociones.
                        </div>
                    </div>
                </section>

                {/* Detalles de la reserva */}
                <section className="bg-white border rounded mb-10 p-6">
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-xs border border-gray-200 rounded">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="py-2 px-2 text-left text-black font-bold">#</th>
                                    <th className="py-2 px-2 text-left text-black font-bold">Fecha de Visita</th>
                                    <th className="py-2 px-2 text-left text-black font-bold">Nombre</th>
                                    <th className="py-2 px-2 text-left text-black font-bold">Hora de Llegada</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visitantes.filter(v => v.nombre || v.correo || v.celular).map((v, idx) => (
                                    <tr key={idx} className="border-t border-gray-100 text-black">
                                        <td className="py-2 px-2">{idx + 1}</td>
                                        <td className="py-2 px-2">{fechaLegible(fecha)}</td>
                                        <td className="py-2 px-2">{v.nombre || "-"}</td>
                                        <td className="py-2 px-2">{hora || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                <section className="flex flex-col md:flex-row gap-6 md:gap-8 mb-10 text-sm justify-center items-stretch">
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
                </section>
                <div className="flex justify-center my-8">
                    <button
                        className="bg-[#18668b] hover:bg-[#14526d] text-white font-bold px-6 py-3 rounded-lg shadow transition"
                        onClick={() => {
                            localStorage.clear();
                            router.push("/daypass");
                        }}
                    >
                        Crear nueva venta
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );
}
