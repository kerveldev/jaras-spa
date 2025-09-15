"use client";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// --- Utilidades para el calendario y horarios ---
const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const horarios = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
];

// Devuelve array de días y el primer día del mes (0=lunes, 6=domingo)
function getDiasMes(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay(); // 0=domingo
    const lastDate = new Date(year, month + 1, 0).getDate();
    // Ajuste para que lunes sea 0 y domingo 6
    const primerDia = firstDay === 0 ? 6 : firstDay - 1;
    return {
        dias: Array.from({ length: lastDate }, (_, i) => i + 1),
        primerDia,
    };
}

// Formatea la fecha correctamente sin perder el día seleccionado
function formatFechaEs(year: number, month: number, day: number) {
    const fecha = new Date(`${year}-${(month + 1).toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}T00:00:00`);
    // Forzamos la fecha local con el string, así no hay off-by-one
    return fecha.toLocaleDateString("es-MX", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

export default function FechaVisitaPage() {
    // Fecha inicial: hoy
    const today = new Date();
    const [mes, setMes] = useState(today.getMonth());
    const [year, setYear] = useState(today.getFullYear());
    const [selectedDay, setSelectedDay] = useState(today.getDate());
    const [selectedTime, setSelectedTime] = useState("11:00 AM");

    const [visitantes, setVisitantes] = useState<{ nombre: string; correo: string; celular: string }[]>([]);
    const [cantidad, setCantidad] = useState(1);
    const [descuento, setDescuento] = useState(0);
    const [promoDesc, setPromoDesc] = useState<string | null>(null);

    useEffect(() => {
        try {
            const visitantesLS = localStorage.getItem("visitantes");
            const cantidadLS = localStorage.getItem("cantidad");
            setVisitantes(visitantesLS ? JSON.parse(visitantesLS) : []);
            setCantidad(cantidadLS ? parseInt(cantidadLS) : 1);

            // LEE DESCUENTO SI HAY
            const promo = localStorage.getItem("promoAplicado");
            const codPromo = localStorage.getItem("codigoPromo");
            const descPromo = localStorage.getItem("descuentoPromo");
            if (promo === "1" && descPromo && codPromo) {
                setDescuento(parseInt(descPromo));
                setPromoDesc(codPromo);
            } else {
                setDescuento(0);
                setPromoDesc(null);
            }
        } catch {
            setVisitantes([]);
            setCantidad(1);
            setDescuento(0);
            setPromoDesc(null);
        }
    }, []);

    // Calendario
    const { dias, primerDia } = getDiasMes(year, mes);

    // Total con descuento aplicado si hay
    const PRECIO_PASE = 350;
    const total = Math.max(cantidad * PRECIO_PASE - descuento, 0);
    const personas = cantidad;

    // Fecha completa seleccionada (YYYY-MM-DD)
    const fechaSeleccionada = `${year}-${(mes + 1).toString().padStart(2, "0")}-${selectedDay
        .toString()
        .padStart(2, "0")}`;
    // Muestra el día seleccionado de forma correcta en español
    const fechaDisplay = formatFechaEs(year, mes, selectedDay);

    // Cambiar mes
    const handlePrevMonth = () => {
        if (mes === 0) {
            setMes(11);
            setYear(year - 1);
        } else {
            setMes(mes - 1);
        }
        setSelectedDay(1);
    };
    const handleNextMonth = () => {
        if (mes === 11) {
            setMes(0);
            setYear(year + 1);
        } else {
            setMes(mes + 1);
        }
        setSelectedDay(1);
    };

    // Guardar fecha/hora y continuar
    const handleContinuar = () => {
        localStorage.setItem("fechaVisita", fechaSeleccionada);
        localStorage.setItem("horaVisita", selectedTime);
        window.location.href = "/daypass/extras";
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
            <Header />
            {/* Progreso */}
            <div className="max-w-5xl w-full mx-auto pt-6 pb-4 px-4">
                <div className="text-xs text-gray-400 mb-4">
                    Inicio &gt; Reservaciones &gt; <span className="text-black">Selección de Fecha</span>
                </div>
                <div className="flex items-center gap-2 mb-8">
                    {[1, 2, 3, 4].map((n, idx) => (
                        <div className="flex items-center" key={n}>
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                                    n === 2
                                        ? "bg-[#B7804F] text-white"
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
                        <span className="font-headers text-[#B7804F]">Fecha</span>
                        <span className="text-gray-400">Extras</span>
                        <span className="text-gray-400">Pago</span>
                    </div>
                </div>
            </div>
            {/* Main */}
            <main className="flex flex-col md:flex-row gap-8 max-w-5xl w-full mx-auto px-4 pb-12 flex-1">
                <section className="flex-1">
                    <h2 className="text-xl font-titles mb-2 text-[#B7804F]">Selecciona la fecha de tu visita</h2>
                    {/* Calendario */}
                    <div className="bg-white border rounded p-6 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <button
                                className="text-xs text-[#B7804F] font-bold"
                                onClick={handlePrevMonth}
                                type="button"
                            >
                                Mes anterior
                            </button>
                            <span className="font-semibold capitalize">
                                {new Date(year, mes).toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
                            </span>
                            <button
                                className="text-xs text-[#B7804F] font-bold"
                                onClick={handleNextMonth}
                                type="button"
                            >
                                Mes siguiente
                            </button>
                        </div>
                        {/* Días de la semana */}
                        <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1">
                            {diasSemana.map((dia) => (
                                <span key={dia}>{dia}</span>
                            ))}
                        </div>
                        {/* Días (rellena primer día) */}
                        <div className="grid grid-cols-7 gap-1">
                            {[...Array(primerDia).keys()].map((_, i) => (
                                <div key={"empty-" + i}></div>
                            ))}
                            {dias.map((dia) => {
                                const isSelected = selectedDay === dia;
                                return (
                                    <button
                                        key={dia}
                                        type="button"
                                        onClick={() => setSelectedDay(dia)}
                                        className={`w-9 h-9 rounded flex items-center justify-center border
                      ${
                                            isSelected
                                                ? "bg-[#B7804F] text-white border-[#B7804F]"
                                                : "bg-white hover:bg-gray-100 border-gray-200 text-gray-700"
                                        }
                    `}
                                    >
                                        {dia}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {/* Horarios */}
                    <div className="mb-6">
                        <label className="block font-semibold mb-2">Selecciona el horario</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {horarios.map((hora) => (
                                <button
                                    key={hora}
                                    type="button"
                                    className={`rounded border py-2 font-semibold text-sm
                    ${
                                        selectedTime === hora
                                            ? "bg-[#B7804F] text-white border-[#B7804F]"
                                            : "bg-white border-gray-300 hover:bg-gray-100 text-gray-800"
                                    }
                  `}
                                    onClick={() => setSelectedTime(hora)}
                                >
                                    {hora}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
                {/* Resumen */}
                <aside className="w-full md:w-80">
                    <div className="bg-white border rounded-lg p-6 shadow-sm mb-6">
                        <h4 className="font-headers mb-3 text-[#B7804F]">Resumen de tu reserva</h4>
                        <div className="flex items-center gap-2 text-sm mb-2">
                            <span>📅</span>
                            <span className="capitalize">{fechaDisplay}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm mb-2">
                            <span>⏰</span>
                            <span>{selectedTime}</span>
                        </div>
                        <div className="text-sm text-gray-500 mb-4">
                            Disponibilidad confirmada para {personas} persona{personas > 1 && "s"}
                        </div>
                        <div className="text-sm border-t pt-2 mb-2">
                            <div className="flex justify-between">
                                <span>Total de pases</span>
                                <span>{cantidad}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Precio por pase</span>
                                <span>$350.00</span>
                            </div>
                            {promoDesc && (
                                <div className="flex justify-between text-green-700 font-bold">
                                    <span>Promo aplicada ({promoDesc})</span>
                                    <span>- ${descuento} MXN</span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between font-bold text-base">
                            <span>Total</span>
                            <span>${total}.00 MXN</span>
                        </div>
                        <button
                            className="mt-6 w-full py-2 rounded font-bold text-white bg-[#B7804F] hover:bg-[#A06F44] transition"
                            onClick={handleContinuar}
                        >
                            Continuar a Extras
                        </button>
                        <button
                            className="mt-2 w-full py-2 rounded border text-gray-500 bg-gray-100"
                            onClick={() => (window.location.href = "/daypass")}
                        >
                            Volver a Selección de Pases
                        </button>
                        <div className="mt-4 text-legal text-gray-500 border-t pt-2">
                            La entrada es válida solo para la fecha y hora seleccionada.<br />
                            Se recomienda llegar 15 minutos antes de la hora reservada.<br />
                            Cancelaciones gratuitas hasta 48 horas antes de la visita.
                        </div>
                    </div>
                </aside>
            </main>
            <Footer />
        </div>
    );
}
