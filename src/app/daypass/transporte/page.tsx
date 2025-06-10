/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";

const HORARIOS = [
    { hora: "6:30 AM", salida: "Plaza del Sol" },
    { hora: "8:00 AM", salida: "Plaza del Sol" },
    { hora: "10:30 AM", salida: "Plaza Patria" },
    { hora: "12:00 PM", salida: "Plaza Patria" },
];

const PUNTOS_SALIDA = [
    { nombre: "Plaza del Sol", direccion: "Av. López Mateos Sur 2375, Guadalajara" },
    { nombre: "Plaza Patria", direccion: "Av. Patria 45, Zapopan" },
];

const PRECIO_PASE = 350;
const PRECIO_TRANSPORTE = 120;

function safeParse<T>(item: string | null, def: T): T {
    try {
        return item ? JSON.parse(item) : def;
    } catch {
        return def;
    }
}

export default function TransportePage() {
    const [cantidad, setCantidad] = useState(1);
    const [visitantes, setVisitantes] = useState<any[]>([]);
    const [extras, setExtras] = useState<any[]>([]);
    const [fecha, setFecha] = useState<string>("");
    const [hora, setHora] = useState<string>("");
    const [usaTransporte, setUsaTransporte] = useState(true);
    const [horario, setHorario] = useState(HORARIOS[0]);
    const [promo, setPromo] = useState<{ aplicado: boolean, valor: number, codigo?: string }>({ aplicado: false, valor: 0, codigo: "" });
    const [subtotal, setSubtotal] = useState(0);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const visitantesLS = safeParse<any[]>(localStorage.getItem("visitantes"), []);
        setVisitantes(visitantesLS);

        const cantidadLS = Number(localStorage.getItem("cantidad") || 1);
        setCantidad(cantidadLS);

        const extrasLS = safeParse<any[]>(localStorage.getItem("extras_orden"), []);
        setExtras(extrasLS);

        // Fecha/hora
        const fechaLS = localStorage.getItem("fechaVisita") || "";
        const horaLS = localStorage.getItem("horaVisita") || "";
        setFecha(fechaLS);
        setHora(horaLS);

        // Promo
        const promoAplicada = localStorage.getItem("promo_aplicada") === "1";
        const promoValor = Number(localStorage.getItem("descuentoPromo") || 0);
        console.log(promoValor);
        const promoCodigo = localStorage.getItem("promo_codigo") || "";
        setPromo({ aplicado: promoAplicada, valor: promoValor, codigo: promoCodigo });

        // Subtotales
        const subtotalBase = cantidadLS * PRECIO_PASE;
        const extrasTotal = extrasLS.reduce((acc: number, curr: any) => acc + (curr?.total || 0), 0);
        setSubtotal(subtotalBase + extrasTotal - (promoAplicada ? promoValor : 0));
    }, []);

    useEffect(() => {
        const subtotalBase = cantidad * PRECIO_PASE;
        const extrasTotal = extras.reduce((acc: number, curr: any) => acc + (curr?.total || 0), 0);
        setSubtotal(subtotalBase + extrasTotal - (promo.aplicado ? promo.valor : 0));
    }, [cantidad, extras, promo]);

    const totalTransporte = usaTransporte ? cantidad * PRECIO_TRANSPORTE : 0;
    const total = subtotal + totalTransporte;

    // Extras como lista
    const extrasList = extras.filter((x: any) => x.cantidad > 0);

    // Fecha legible
    function fechaLegible(fechaStr: string) {
        if (!fechaStr) return "-";
        try {
            // <-- AQUÍ EL CAMBIO
            const safeFecha = fechaStr.includes("T") ? fechaStr : fechaStr + "T12:00:00";
            return new Date(safeFecha).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "2-digit"
            });
        } catch {
            return fechaStr;
        }
    }

    function handleContinuar() {
        localStorage.setItem("transporte_usa", usaTransporte ? "1" : "0");
        localStorage.setItem("transporte_horario", JSON.stringify(horario));
        localStorage.setItem("transporte_cantidad", cantidad.toString());
        window.location.href = "/daypass/resumen";
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
            <Header />

            {/* Breadcrumbs y Progreso */}
            <div className="max-w-5xl w-full mx-auto pt-6 pb-4 px-4">
                <div className="text-xs text-gray-400 mb-4">
                    Inicio &gt; Selección de Fecha &gt; Extras &gt; <span className="text-black">Transporte</span>
                </div>
                <div className="flex items-center gap-2 mb-8">
                    {[1, 2, 3, 4].map((n, idx) => (
                        <div className="flex items-center" key={n}>
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                                    n === 4
                                        ? "bg-[#18668b] text-white"
                                        : "bg-gray-200 text-gray-500"
                                }`}
                            >
                                {n}
                            </div>
                            {idx !== 3 && (
                                <div className="w-10 h-1 bg-gray-200 mx-1 rounded" />
                            )}
                        </div>
                    ))}
                    <div className="flex gap-6 ml-4 text-xs">
                        <span className="text-gray-400">Pases</span>
                        <span className="text-gray-400">Fecha</span>
                        <span className="text-gray-400">Extras</span>
                        <span className="font-bold text-[#18668b]">Transporte</span>
                    </div>
                </div>
            </div>

            <main className="flex flex-col md:flex-row gap-8 max-w-5xl w-full mx-auto px-4 pb-12 flex-1">
                <section className="flex-1">
                    <h2 className="text-2xl font-bold mb-4">Servicio de Transporte</h2>
                    <p className="mb-6 text-gray-700">
                        Selecciona si deseas utilizar nuestro servicio de transporte Las Jaras Bus para llegar cómodamente a nuestras instalaciones. Ofrecemos varias salidas desde la ciudad.
                    </p>
                    {/* Opción de transporte */}
                    <div className="mb-8 space-y-2">
                        <label className={`block p-4 border rounded cursor-pointer ${usaTransporte ? "border-black bg-[#f6fafb]" : "bg-white"}`}>
                            <input
                                type="radio"
                                checked={usaTransporte}
                                onChange={() => setUsaTransporte(true)}
                                className="mr-2"
                            />
                            <span className="font-semibold">Sí, quiero utilizar Las Jaras Bus</span>
                            <div className="text-xs text-gray-600 ml-6">Transporte cómodo y directo a nuestras instalaciones</div>
                        </label>
                        <label className={`block p-4 border rounded cursor-pointer ${!usaTransporte ? "border-black bg-[#f6fafb]" : "bg-white"}`}>
                            <input
                                type="radio"
                                checked={!usaTransporte}
                                onChange={() => setUsaTransporte(false)}
                                className="mr-2"
                            />
                            <span className="font-semibold">No, llegaré por mi cuenta</span>
                            <div className="text-xs text-gray-600 ml-6">Utilizaré mi propio medio de transporte</div>
                        </label>
                    </div>

                    {/* Horarios disponibles */}
                    {usaTransporte && (
                        <>
                            <hr className="mb-6" />
                            <label className="block font-semibold mb-2">Horarios disponibles</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                                {HORARIOS.map((h) => (
                                    <button
                                        key={h.hora + h.salida}
                                        className={`rounded border py-2 font-semibold text-sm ${
                                            horario.hora === h.hora && horario.salida === h.salida
                                                ? "bg-[#18668b] text-white border-[#18668b]"
                                                : "bg-white border-gray-300 hover:bg-gray-100 text-gray-800"
                                        }`}
                                        onClick={() => setHorario(h)}
                                    >
                                        {h.hora} <br />
                                        <span className="text-xs font-normal">{h.salida}</span>
                                    </button>
                                ))}
                            </div>
                            {/* Cantidad de boletos */}
                            <div className="mb-3">
                                <label className="font-semibold text-sm">
                                    Cantidad de boletos
                                </label>
                                <div className="flex gap-2 mt-2">
                                    <input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={cantidad}
                                        onChange={e => setCantidad(Number(e.target.value))}
                                        className="border rounded px-2 py-1 w-20"
                                    />
                                </div>
                                <div className="text-xs text-gray-500 mt-2">
                                    Los niños menores de 3 años no pagan boleto de transporte si viajan en el regazo de un adulto.
                                </div>
                            </div>
                        </>
                    )}

                    {/* Información del servicio */}
                    <div className="mt-8 mb-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <div className="font-semibold mb-2">Puntos de salida</div>
                            <ul className="text-xs text-gray-700">
                                {PUNTOS_SALIDA.map((p) => (
                                    <li key={p.nombre}>
                                        <span className="font-bold">{p.nombre}</span>: {p.direccion}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <div className="font-semibold mb-2">Información adicional</div>
                            <ul className="text-xs text-gray-700 list-disc pl-4">
                                <li>Duración aproximada del viaje: 45 minutos</li>
                                <li>Autobuses con aire acondicionado</li>
                                <li>Espacio para equipaje limitado</li>
                                <li>Accesible para personas con movilidad reducida</li>
                            </ul>
                        </div>
                    </div>

                    {/* Mapa (simulado) */}
                    <div className="bg-white rounded border p-4 mb-8">
                        <div className="font-semibold mb-2">Ubicación de puntos de salida</div>
                        <Image src="/image.png" alt="Mapa" width={100} height={100} className="w-full h-48 object-cover rounded" />
                    </div>
                </section>
                {/* Resumen */}
                <aside className="w-full md:w-80">
                    <div className="bg-white border rounded-lg p-6 shadow-sm mb-6">
                        <h4 className="font-bold mb-3">Resumen de reserva</h4>
                        <div className="text-sm mb-2 space-y-2">
                            <div className="flex justify-between">
                                <span>Fecha de visita:</span>
                                <span>{fechaLegible(fecha)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Horario visita:</span>
                                <span>{hora || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Pases de entrada:</span>
                                <span>{cantidad} x ${PRECIO_PASE} = ${cantidad * PRECIO_PASE} MXN</span>
                            </div>
                            {/* PROMO */}
                            {promo.aplicado && (
                                <div className="flex justify-between text-green-700 font-semibold">
                                    <span>Cupón aplicado ({promo.codigo || "PROMO"}):</span>
                                    <span>- ${promo.valor} MXN</span>
                                </div>
                            )}
                            {/* Extras */}
                            <div className="font-semibold mt-2 mb-1">Extras:</div>
                            {extrasList.length ? (
                                <ul className="pl-3 mb-2 list-disc text-black">
                                    {extrasList.map((x: any, i: number) => (
                                        <li key={x.nombre + i}>
                                            {x.cantidad} x {x.nombre} - ${x.total} MXN
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-xs text-gray-400 mb-2">Sin servicios adicionales</div>
                            )}
                            {/* Subtotal sin transporte */}
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>${subtotal} MXN</span>
                            </div>
                            {/* Transporte */}
                            {usaTransporte && (
                                <>
                                    <div className="flex justify-between">
                                        <span>Transporte ({cantidad} x ${PRECIO_TRANSPORTE}):</span>
                                        <span>${totalTransporte} MXN</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Horario transporte:</span>
                                        <span>{horario.hora} ({horario.salida})</span>
                                    </div>
                                </>
                            )}
                            {/* TOTAL */}
                            <div className="flex justify-between font-bold text-lg mt-2">
                                <span>Total:</span>
                                <span>${total} MXN</span>
                            </div>
                        </div>
                        <button
                            className="mt-6 w-full py-2 rounded font-bold text-white bg-[#18668b] hover:bg-[#14526d] transition"
                            onClick={handleContinuar}
                        >
                            Continuar al resumen
                        </button>
                        <div className="text-xs text-gray-500 mt-4 text-center">
                            Pago 100% seguro
                        </div>
                    </div>
                </aside>
            </main>
            <Footer />
        </div>
    );
}
