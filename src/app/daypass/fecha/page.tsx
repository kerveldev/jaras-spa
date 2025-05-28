"use client";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// --- Utilidades para la demo de calendario ---
const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const diasOctubre = Array.from({ length: 31 }, (_, i) => i + 1);

const horarios = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
];

export default function FechaVisitaPage() {
    // Fecha seleccionada: YYYY-MM-DD
    const [selectedDate, setSelectedDate] = useState<string>("2023-10-20");
    const [selectedTime, setSelectedTime] = useState<string>("11:00 AM");

    // Demo: información de visitantes/total (normalmente tomarías esto de contexto, backend o localStorage)
    const total = 950;
    const personas = 4;

    // --- Funciones para simular cambio de mes ---
    // Demo sólo Octubre 2023, pero puedes expandirlo.

    const handleSelectDate = (dia: number) => {
        setSelectedDate(`2023-10-${dia.toString().padStart(2, "0")}`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
            {/* Header Simulado */}
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
                        <span className="font-bold text-[#18668b]">Fecha</span>
                        <span className="text-gray-400">Extras</span>
                        <span className="text-gray-400">Pago</span>
                    </div>
                </div>
            </div>
            {/* Main */}
            <main className="flex flex-col md:flex-row gap-8 max-w-5xl w-full mx-auto px-4 pb-12 flex-1">
                <section className="flex-1">
                    <h2 className="text-xl font-bold mb-2">Selecciona la fecha de tu visita</h2>
                    {/* Calendario */}
                    <div className="bg-white border rounded p-6 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <button className="text-xs text-gray-400 cursor-not-allowed">Mes anterior</button>
                            <span className="font-semibold">Octubre 2023</span>
                            <button className="text-xs text-gray-400 cursor-not-allowed">Mes siguiente</button>
                        </div>
                        {/* Días de la semana */}
                        <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1">
                            {diasSemana.map((dia) => (
                                <span key={dia}>{dia}</span>
                            ))}
                        </div>
                        {/* Días (rellena para que empiece en domingo 1 de octubre, 2023 inicia en domingo) */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Primer día: domingo, así que 6 espacios vacíos antes del 1 */}
                            {[...Array(6).keys()].map((_, i) => (
                                <div key={"empty-" + i}></div>
                            ))}
                            {diasOctubre.map((dia) => {
                                const fecha = `2023-10-${dia.toString().padStart(2, "0")}`;
                                const isSelected = selectedDate === fecha;
                                return (
                                    <button
                                        key={dia}
                                        onClick={() => handleSelectDate(dia)}
                                        className={`w-9 h-9 rounded flex items-center justify-center border
                      ${
                                            isSelected
                                                ? "bg-[#18668b] text-white border-[#18668b]"
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
                                    className={`rounded border py-2 font-semibold text-sm
                    ${
                                        selectedTime === hora
                                            ? "bg-[#18668b] text-white border-[#18668b]"
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
                        <h4 className="font-bold mb-3">Resumen de tu reserva</h4>
                        <div className="flex items-center gap-2 text-sm mb-2">
                            <span>📅</span>
                            <span>
                {new Date(selectedDate).toLocaleDateString("es-MX", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                })}
              </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm mb-2">
                            <span>⏰</span>
                            <span>{selectedTime}</span>
                        </div>
                        <div className="text-sm text-gray-500 mb-4">
                            Disponibilidad confirmada para {personas} personas
                        </div>
                        <div className="text-sm border-t pt-2 mb-2">
                            <div className="flex justify-between">
                                <span>Adultos (2)</span>
                                <span>$600.00</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Niños (1)</span>
                                <span>$200.00</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Adultos mayores (1)</span>
                                <span>$150.00</span>
                            </div>
                        </div>
                        <div className="flex justify-between font-bold text-base">
                            <span>Total</span>
                            <span>${total}.00 MXN</span>
                        </div>
                        <button
                            className="mt-6 w-full py-2 rounded font-bold text-white bg-[#18668b] hover:bg-[#14526d] transition"
                            onClick={() => (window.location.href = "/daypass/extras")}
                        >
                            Continuar a Extras
                        </button>
                        <button
                            className="mt-2 w-full py-2 rounded border text-gray-500 bg-gray-100"
                            onClick={() => (window.location.href = "/daypass")}
                        >
                            Volver a Selección de Pases
                        </button>
                        <div className="mt-4 text-xs text-gray-500 border-t pt-2">
                            La entrada es válida solo para la fecha y hora seleccionada.<br />
                            Se recomienda llegar 15 minutos antes de la hora reservada.<br />
                            Cancelaciones gratuitas hasta 48 horas antes de la visita.
                        </div>
                    </div>
                </aside>
            </main>
            {/* Footer */}
            <Footer />
        </div>
    );
}
