"use client";
import { useEffect, useState } from "react";
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
function fechaLegible(fechaStr: string) {
    if (!fechaStr) return "-";
    try {
        const safeFecha = fechaStr.includes("T") ? fechaStr : fechaStr + "T12:00:00";
        return new Date(safeFecha).toLocaleDateString("es-MX", {
            year: "numeric",
            month: "long",
            day: "2-digit",
            weekday: "long"
        });
    } catch {
        return fechaStr;
    }
}

export default function ConfirmacionReservaPage() {
    // Estados para info real
    const [visitantes, setVisitantes] = useState<any[]>([]);
    const [cantidad, setCantidad] = useState(1);
    const [fecha, setFecha] = useState<string>("");
    const [hora, setHora] = useState<string>("");
    const [horarioTransporte, setHorarioTransporte] = useState<any>(null);
    const [usaTransporte, setUsaTransporte] = useState(true);
    const [extras, setExtras] = useState<any[]>([]);
    const [promo, setPromo] = useState<{ aplicado: boolean, valor: number, codigo?: string }>({ aplicado: false, valor: 0, codigo: "" });

    useEffect(() => {
        // Cargar info de localStorage
        setVisitantes(safeParse<any[]>(localStorage.getItem("visitantes"), []));
        setCantidad(Number(localStorage.getItem("cantidad") || 1));
        setFecha(localStorage.getItem("fechaVisita") || "");
        setHora(localStorage.getItem("horaVisita") || "");
        setHorarioTransporte(safeParse<any>(localStorage.getItem("transporte_horario"), null));
        setUsaTransporte(localStorage.getItem("transporte_usa") === "1");
        setExtras(safeParse<any[]>(localStorage.getItem("extras_orden"), []));
        setPromo({
            aplicado: localStorage.getItem("promo_aplicada") === "1",
            valor: Number(localStorage.getItem("descuentoPromo") || 0),
            codigo: localStorage.getItem("promo_codigo") || "",
        });
    }, []);

    // Totales y textos
    const totalPases = cantidad;

    const totalExtras = extras.reduce((acc, curr) => acc + (curr?.total || 0), 0);
    const totalBase = totalPases * PRECIO_PASE;
    const totalPromo = promo.aplicado ? promo.valor : 0;
    const totalTransporte = usaTransporte ? totalPases * PRECIO_TRANSPORTE : 0;
    const totalFinal = totalBase + totalExtras + totalTransporte - totalPromo;

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

                {/* Detalles de la reserva */}
                <section className="bg-white border rounded mb-10 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2 text-sm font-semibold">
                        <div>
                            <div className="text-gray-500 font-normal">Fecha de Visita</div>
                            <div>{fechaLegible(fecha)}</div>
                        </div>
                        <div>
                            <div className="text-gray-500 font-normal">Visitantes</div>
                            <div>{nombresVisitantes}</div>
                        </div>
                        <div>
                            <div className="text-gray-500 font-normal">Hora de Llegada</div>
                            <div>{hora || "-"}</div>
                        </div>
                        <div className="text-right md:text-left mt-2 md:mt-0">
                            <div className="text-xs text-gray-500">Confirmación</div>
                            <div className="font-bold text-black">#{qrData}</div>
                        </div>
                    </div>
                </section>

                {/* Boletos de acceso y autobús */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="bg-white border rounded p-6 flex flex-col items-center">
                        <div className="font-bold text-black mb-2">Boletos de Acceso</div>
                        <div className="mb-2 text-xs text-gray-600">Presenta este código QR en la entrada principal</div>
                        <Image
                            src={qrURL}
                            alt="Código QR acceso"
                            width={160}
                            height={160}
                            className="mb-2"
                        />
                        <div className="text-xs text-center text-gray-500">
                            Válido para {tipoBoletos}<br />
                            Incluye acceso a todas las instalaciones
                        </div>
                    </div>
                    <div className="bg-white border rounded p-6 flex flex-col items-center">
                        <div className="font-bold text-black mb-2">Boletos de Autobús</div>
                        <div className="mb-2 text-xs text-gray-600">Presenta este código QR al abordar el autobús</div>
                        <Image
                            src={qrURLMapa}
                            alt="Boleto autobús"
                            width={160}
                            height={160}
                            className="mb-2 w-40 h-40 object-contain"
                        />
                        {usaTransporte ? (
                            <div className="text-xs text-center text-gray-500">
                                Ruta: {horarioTexto}<br />
                                Asientos: General <br />
                                {totalPases} reservados
                            </div>
                        ) : (
                            <div className="text-xs text-center text-gray-400">
                                No reservaste autobús
                            </div>
                        )}
                    </div>
                </section>

                {/* Detalles y extras */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 text-sm">
                    <div className="bg-white border rounded p-4 flex flex-col justify-center">
                        <div className="font-bold text-black mb-2 flex items-center gap-2">⭐ Resumen de Orden</div>
                        <div className="mb-2 text-black">
                            Pases de entrada: {totalPases} x ${PRECIO_PASE} = <b>${totalBase} MXN</b>
                        </div>
                        {promo.aplicado && (
                            <div className="mb-2 text-green-700 font-bold">
                                Descuento ({promo.codigo || "PROMO"}): -${promo.valor} MXN
                            </div>
                        )}
                        <div className="mb-2 text-black">
                            {usaTransporte ? (
                                <>
                                    Transporte: {totalPases} x ${PRECIO_TRANSPORTE} = <b>${totalTransporte} MXN</b>
                                </>
                            ) : "Sin transporte"}
                        </div>
                        <div className="font-bold text-black mt-3">
                            Total: ${totalFinal} MXN
                        </div>
                    </div>
                    <div className="bg-white border rounded p-4 flex flex-col justify-center">
                        <div className="font-bold text-black mb-2 flex items-center gap-2">⭐ Extras Adquiridos</div>
                        {extrasList.length ? (
                            <ul className="list-disc ml-5">
                                {extrasList.map((x: any, i: number) => (
                                    <li className="text-black" key={x.nombre + i}>
                                        {x.cantidad} x {x.nombre} - ${x.total} MXN
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-xs text-gray-400">Sin servicios adicionales</div>
                        )}
                    </div>
                    <div className="bg-white border rounded p-4 flex flex-col justify-center">
                        <div className="font-bold text-black mb-2 flex items-center gap-2">📩 Contacto</div>
                        {visitantes.length > 0 && (
                            <>
                                <div className="mb-1 text-black">Nombre: {visitantes[0]?.nombre}</div>
                                <div className="mb-1 text-black">Email: {visitantes[0]?.correo}</div>
                                <div className="mb-1 text-black">Celular: {visitantes[0]?.celular}</div>
                            </>
                        )}
                        <div className="mt-2 text-xs text-gray-400">
                            Recibirás un correo de confirmación y tu código de acceso.
                        </div>
                    </div>
                </section>

                {/* Botones acción */}
                <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
                    <button className="bg-black text-white px-6 py-2 rounded shadow hover:bg-[#333]">
                        Descargar Boletos (PDF)
                    </button>
                    <button className="border px-6 py-2 rounded font-semibold shadow hover:bg-gray-100">
                        Enviar por Email
                    </button>
                    <button className="border px-6 py-2 rounded font-semibold shadow hover:bg-gray-100">
                        Imprimir Boletos
                    </button>
                </div>

                {/* Progreso de reserva */}
                <section className="mt-12 mb-6">
                    <div className="font-bold text-black mb-2 text-center">Tu proceso de reserva</div>
                    <div className="flex justify-center gap-2 items-center">
                        {["Compra de Boletos", "Selección de Fecha", "Compra de Extras", "Reserva de Transporte", "Resumen de Orden"].map((step, idx, arr) => (
                            <div className="flex items-center" key={step}>
                                <span className="text-xs">{step}</span>
                                {idx < arr.length - 1 && (
                                    <div className="w-8 h-1 bg-gray-400 mx-2 rounded"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
