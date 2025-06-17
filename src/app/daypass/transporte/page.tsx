"use client";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import DetallesReservaAnimado from "@/components/DetallesReservaAnimado";

// --- Leaflet map dinámico ---
const MapLeaflet = dynamic(() => import("@/components/MapLeaflet"), { ssr: false });

// ----------- DATOS -----------

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

// Coordenadas directas por punto de salida
const PUNTOS_COORDS: Record<string, [number, number]> = {
    "Plaza del Sol": [20.6481, -103.4167],
    "Plaza Patria": [20.7084, -103.3965]
};

const PRECIO_PASE = 350;
const PRECIO_TRANSPORTE = 120;

// ----------- FUNCIONES UTILES -----------
function safeParse<T>(item: string | null, def: T): T {
    try {
        return item ? JSON.parse(item) : def;
    } catch {
        return def;
    }
}
function fechaLegible(fechaStr: string) {
    if (!fechaStr) return "-";
    try {
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

    // Tarjeta
    const [card, setCard] = useState({ num: "", exp: "", cvc: "", name: "" });
    const [isPaying, setIsPaying] = useState(false);
    const [paid, setPaid] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        setVisitantes(safeParse<any[]>(localStorage.getItem("visitantes"), []));
        setCantidad(Number(localStorage.getItem("cantidad") || 1));
        setExtras(safeParse<any[]>(localStorage.getItem("extras_orden"), []));
        setFecha(localStorage.getItem("fechaVisita") || "");
        setHora(localStorage.getItem("horaVisita") || "");
        const promoAplicada = localStorage.getItem("promo_aplicada") === "1";
        const promoValor = Number(localStorage.getItem("promo_descuento") || 0);
        const promoCodigo = localStorage.getItem("promo_codigo") || "";
        setPromo({ aplicado: promoAplicada, valor: promoValor, codigo: promoCodigo });
        // Subtotales
        const subtotalBase = Number(localStorage.getItem("cantidad") || 1) * PRECIO_PASE;
        const extrasTotal = safeParse<any[]>(localStorage.getItem("extras_orden"), []).reduce((acc: number, curr: any) => acc + (curr?.total || 0), 0);
        setSubtotal(subtotalBase + extrasTotal - (promoAplicada ? promoValor : 0));
    }, []);

    useEffect(() => {
        const subtotalBase = cantidad * PRECIO_PASE;
        const extrasTotal = extras.reduce((acc: number, curr: any) => acc + (curr?.total || 0), 0);
        setSubtotal(subtotalBase + extrasTotal - (promo.aplicado ? promo.valor : 0));
    }, [cantidad, extras, promo]);

    const totalTransporte = usaTransporte ? cantidad * PRECIO_TRANSPORTE : 0;
    const total = subtotal + totalTransporte;
    const extrasList = extras.filter((x: any) => x.cantidad > 0);

    // ------ MANEJO DE FORMULARIO DE PAGO ------
    function handleExpChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value.replace(/[^\d]/g, "");
        if (value.length === 0) return setCard({ ...card, exp: "" });
        if (value.length <= 2) {
            let month = value;
            if (parseInt(month) > 12) month = "12";
            if (month.length === 2 && value.length === 2) month += "/";
            setCard({ ...card, exp: month });
            return;
        }
        let month = value.slice(0, 2);
        const year = value.slice(2, 4);
        if (parseInt(month) > 12) month = "12";
        const exp = month + "/" + year;
        setCard({ ...card, exp });
    }
    function isExpValid(exp: string) {
        const match = /^(\d{2})\/(\d{2})$/.exec(exp);
        if (!match) return false;
        const mm = parseInt(match[1], 10);
        const aa = parseInt(match[2], 10);
        return mm >= 1 && mm <= 12 && aa >= 0 && aa <= 99;
    }
    const handlePay = (e: React.FormEvent) => {
        e.preventDefault();
        setIsPaying(true);
        setTimeout(() => {
            setIsPaying(false);
            setPaid(true);
        }, 1800);
    };

    function handleContinuar() {
        localStorage.setItem("transporte_usa", usaTransporte ? "1" : "0");
        localStorage.setItem("transporte_horario", JSON.stringify(horario));
        localStorage.setItem("transporte_cantidad", cantidad.toString());
        window.location.href = "/daypass/resumen";
    }

    function getCoords(salida: string): [number, number] {
        const coords = PUNTOS_COORDS[salida];
        if (Array.isArray(coords) && coords.length === 2) {
            return coords as [number, number];
        }
        // Fallback seguro (Plaza del Sol)
        return [20.6481, -103.4167];
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
                    <h2 className="text-2xl font-bold mb-4">Servicio de transporte</h2>
                    <p className="mb-6 text-gray-700">
                        Selecciona si deseas utilizar nuestro servicio de transporte Las Jaras Bus para llegar cómodamente a nuestras instalaciones. Ofrecemos varias salidas desde la ciudad.
                    </p>
                    {/* Opción de transporte */}
                    <div className="mb-8 flex flex-col md:flex-row md:gap-4">
                        <label
                            className={` mr-2 flex-1 block p-4 border rounded cursor-pointer ${
                                usaTransporte ? "border-black bg-[#f6fafb]" : "bg-white"
                            }`}
                        >
                            <input
                                type="radio"
                                checked={usaTransporte}
                                onChange={() => setUsaTransporte(true)}
                                className="mr-2"
                            />
                            <span className="font-semibold">Sí, quiero utilizar Las Jaras Bus</span>
                            <div className="text-xs text-gray-600 ml-6">
                                Transporte cómodo y directo a nuestras instalaciones
                            </div>
                        </label>
                        <label
                            className={`flex-1 block p-4 border rounded cursor-pointer mt-2 md:mt-0 ${
                                !usaTransporte ? "border-black bg-[#f6fafb]" : "bg-white"
                            }`}
                        >
                            <input
                                type="radio"
                                checked={!usaTransporte}
                                onChange={() => setUsaTransporte(false)}
                                className="mr-2"
                            />
                            <span className="font-semibold">No, llegaré por mi cuenta</span>
                            <div className="text-xs text-gray-600 ml-6">
                                Utilizaré mi propio medio de transporte
                            </div>
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
                                        <li>Espacio para equipaje limitado</li>
                                        <li>Accesible para personas con movilidad reducida</li>
                                    </ul>
                                </div>
                            </div>
                            {/* Mapa dinámico con Leaflet */}
                            <div className="bg-white rounded border p-4 mb-8">
                                <div className="font-semibold mb-2">Ubicación de puntos de salida</div>
                                <div className="w-full h-52 rounded overflow-hidden">
                                    <MapLeaflet coords={getCoords(horario.salida)} label={horario.salida} />
                                </div>
                            </div>
                        </>
                    )}

                </section>
                {/* Resumen y pago */}
                <aside className="w-full md:w-80">
                    <div className="bg-white border rounded-lg p-6 shadow-sm mb-6">
                        <h4 className="font-bold mb-3">Resumen de reserva</h4>

                        {/* Total visible siempre */}
                        <div className="flex justify-between font-bold text-lg mb-4">
                            <span>Total:</span>
                            <span>${total} MXN</span>
                        </div>

                        {/* Pago tarjeta visible siempre */}
                        {!paid && (
                            <form
                                className="border-t pt-4 mt-3 flex flex-col gap-2"
                                onSubmit={handlePay}
                                autoComplete="off"
                            >
                                <h5 className="font-semibold mb-2">Paga con tarjeta</h5>
                                <input
                                    className="border rounded px-2 py-2 text-sm"
                                    placeholder="Nombre en la tarjeta"
                                    type="text"
                                    required
                                    value={card.name}
                                    disabled={isPaying}
                                    onChange={e => setCard({ ...card, name: e.target.value })}
                                />
                                <input
                                    className="border rounded px-2 py-2 text-sm"
                                    placeholder="Número de tarjeta"
                                    maxLength={16}
                                    type="text"
                                    inputMode="numeric"
                                    required
                                    value={card.num}
                                    disabled={isPaying}
                                    onChange={e => setCard({ ...card, num: e.target.value.replace(/\D/g, "") })}
                                />
                                    <input
                                        className="border rounded px-2 py-2 text-sm w-2/3"
                                        placeholder="MM/AA"
                                        maxLength={5}
                                        type="text"
                                        required
                                        value={card.exp}
                                        disabled={isPaying}
                                        onChange={handleExpChange}
                                        style={{
                                            borderColor:
                                                card.exp.length === 5 && !isExpValid(card.exp)
                                                    ? "#f87171"
                                                    : undefined,
                                        }}
                                    />
                                    <input
                                        className="border rounded px-2 py-2 text-sm w-1/3"
                                        placeholder="CVC"
                                        maxLength={4}
                                        type="text"
                                        required
                                        value={card.cvc}
                                        disabled={isPaying}
                                        onChange={e => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "") })}
                                    />
                                {card.exp.length === 5 && !isExpValid(card.exp) && (
                                    <span className="text-xs text-red-600">Fecha inválida</span>
                                )}
                                <button
                                    type="submit"
                                    className="w-full py-2 mt-2 rounded font-bold text-white bg-[#18668b] hover:bg-[#14526d] transition"
                                    disabled={isPaying}
                                >
                                    {isPaying ? "Procesando..." : "Pagar con tarjeta"}
                                </button>
                                <div className="text-xs text-gray-400 mt-1">
                                    * Simulación, no se procesa pago real.
                                </div>
                            </form>
                        )}
                        {paid && (
                            <div className="mt-4 text-green-700 text-center font-bold">
                                ¡Pago realizado con éxito!
                            </div>
                        )}

                        <button
                            className={`mt-6 w-full py-2 rounded font-bold text-white ${paid ? "bg-[#18668b] hover:bg-[#14526d]" : "bg-gray-300 cursor-not-allowed"}`}
                            onClick={handleContinuar}
                            disabled={!paid}
                        >
                            Continuar al resumen
                        </button>

                        {/* Mostrar/Ocultar detalles animados */}
                        <DetallesReservaAnimado
                            fecha={fecha}
                            hora={hora}
                            cantidad={cantidad}
                            promo={promo}
                            extrasList={extrasList}
                            subtotal={subtotal}
                            usaTransporte={usaTransporte}
                            totalTransporte={totalTransporte}
                            horario={horario}
                            PRECIO_PASE={PRECIO_PASE}
                            PRECIO_TRANSPORTE={PRECIO_TRANSPORTE}
                            fechaLegible={fechaLegible}
                            total={total}
                        />

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
