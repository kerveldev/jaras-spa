"use client";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Visitante {
    nombre: string;
    correo: string;
    relacion: string;
}

const RELACIONES = [
    { value: "Tú", label: "Tú" },
    { value: "Novia", label: "Novia" },
    { value: "Amigo", label: "Amigo" },
    { value: "Familiar", label: "Familiar" },
    { value: "Otro", label: "Otro" },
];

export default function DaypassPage() {
    const [cantidad, setCantidad] = useState<number>(4);
    const [visitantes, setVisitantes] = useState<Visitante[]>(
        Array.from({ length: 4 }, (_, i) => ({
            nombre: "",
            correo: "",
            relacion: RELACIONES[i]?.value || "Otro",
        }))
    );
    const [codigoPromo, setCodigoPromo] = useState("");
    const PRECIO_PASE = 350;
    const subtotal = cantidad * PRECIO_PASE;
    const descuento = 0; // Ajusta si implementas descuentos
    const total = subtotal - descuento;

    // Si cambian la cantidad de boletos
    const handleCantidad = (v: number) => {
        setCantidad(v);
        setVisitantes((prev) => {
            if (v > prev.length) {
                return [
                    ...prev,
                    ...Array.from({ length: v - prev.length }, () => ({
                        nombre: "",
                        correo: "",
                        relacion: "Otro",
                    })),
                ];
            }
            return prev.slice(0, v);
        });
    };

    // Cambios por visitante
    const handleVis = (
        idx: number,
        campo: keyof Visitante,
        valor: string
    ) => {
        setVisitantes((prev) => {
            const copia = [...prev];
            copia[idx][campo] = valor;
            return copia;
        });
    };

    // Validación
    const puedeContinuar = visitantes.every((v) => v.nombre.trim().length > 0);

    const handleSiguiente = () => {
        if (!puedeContinuar) {
            alert("Completa los nombres de todos los visitantes.");
            return;
        }
        // Guarda temporal para demo (en producción usar contexto, backend, etc)
        localStorage.setItem("visitantes", JSON.stringify(visitantes));
        localStorage.setItem("cantidad", cantidad.toString());
        window.location.href = "/daypass/fecha";
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
            {/* Header Simulado */}
            <Header />
            {/* Breadcrumbs y Progreso */}
            <div className="max-w-5xl w-full mx-auto pt-6 pb-4 px-4">
                <div className="text-xs text-gray-400 mb-4">
                    Inicio &gt; Reservaciones &gt; <span className="text-black">Compra de Pases</span>
                </div>
                <div className="flex items-center gap-2 mb-8">
                    {[1, 2, 3, 4].map((n, idx) => (
                        <div className="flex items-center" key={n}>
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-black ${
                                    n === 1
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
                        <span className="font-bold text-black text-[#18668b]">Selección de Pases</span>
                        <span className="text-gray-400">Selección de Fecha</span>
                        <span className="text-gray-400">Pago</span>
                        <span className="text-gray-400">Confirmación</span>
                    </div>
                </div>
            </div>
            {/* Main Content */}
            <main className="flex flex-col md:flex-row gap-8 max-w-5xl w-full mx-auto px-4 pb-12 flex-1">
                <section className="flex-1">
                    <h2 className="text-xl font-bold text-black mb-2">Selección de Pases</h2>
                    <p className="mb-4 text-gray-600 text-sm">
                        Selecciona la cantidad de pases que necesitas para tu grupo. Cada pase da acceso completo a todas nuestras instalaciones.
                    </p>
                    {/* Selección cantidad */}
                    <div className="mb-6 flex gap-3 items-center">
                        <label className="font-semibold text-black">Pases de Acceso General</label>
                        <input
                            type="number"
                            min={1}
                            max={10}
                            value={cantidad}
                            onChange={(e) => handleCantidad(Number(e.target.value))}
                            className="border rounded px-2 py-1 w-20"
                        />
                    </div>
                    {/* Visitantes */}
                    <h3 className="font-semibold text-black text-base mb-2 mt-8">Detalles de los Visitantes</h3>
                    <p className="mb-2 text-xs text-gray-500">
                        Por favor, especifica los detalles para cada uno de los {cantidad} pases seleccionados.
                    </p>
                    <form className="space-y-4">
                        {visitantes.slice(0, cantidad).map((vis, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded border p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
                            >
                                <div>
                                    <label className="block text-xs font-medium text-black mb-1 ">
                                        {`Visitante ${idx + 1} ${idx === 0 ? "(Tú)" : ""}`}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nombre"
                                        value={vis.nombre}
                                        onChange={(e) =>
                                            handleVis(idx, "nombre", e.target.value)
                                        }
                                        className="border p-2 rounded w-full"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-black mb-1">
                                        Correo Electrónico {idx === 0 ? <span className="text-[10px]">(Principal)</span> : <span className="text-gray-400">(opcional)</span>}
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="Correo electrónico"
                                        value={vis.correo}
                                        onChange={(e) =>
                                            handleVis(idx, "correo", e.target.value)
                                        }
                                        className="border p-2 rounded w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-black mb-1">
                                        Relación
                                    </label>
                                    <select
                                        value={vis.relacion}
                                        onChange={(e) =>
                                            handleVis(idx, "relacion", e.target.value)
                                        }
                                        className="border p-2 rounded w-full"
                                    >
                                        {RELACIONES.map((rel) => (
                                            <option key={rel.value} value={rel.value}>
                                                {rel.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </form>
                </section>
                {/* Resumen */}
                <aside className="w-full md:w-80">
                    <div className="bg-white border rounded-lg p-6 shadow-sm mb-6">
                        <h4 className="font-bold text-black mb-3">Resumen de Compra</h4>
                        <div className="flex justify-between mb-1 text-sm">
                            <span className="text-black">Pases de Acceso General</span>
                            <span className="text-black">{cantidad} pases</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Precio por pase</span>
                            <span>${PRECIO_PASE} MXN</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>${subtotal} MXN</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="font-bold text-black">Total</span>
                            <span className="font-bold text-black text-lg">${total} MXN</span>
                        </div>
                        <input
                            className="mt-4 w-full border rounded px-2 py-1 text-sm"
                            placeholder="Código promocional"
                            value={codigoPromo}
                            onChange={e => setCodigoPromo(e.target.value)}
                        />
                        <button className="mt-2 w-full text-xs font-semibold text-black py-2 border border-gray-300 rounded hover:bg-gray-100">
                            Aplicar
                        </button>
                        <button
                            onClick={handleSiguiente}
                            disabled={!puedeContinuar}
                            className={`mt-6 w-full py-2 rounded font-bold text-black text-white ${
                                puedeContinuar
                                    ? "bg-[#18668b] hover:bg-[#14526d]"
                                    : "bg-gray-300 cursor-not-allowed"
                            }`}
                        >
                            Continuar a Selección de Fecha
                        </button>
                        <button
                            disabled
                            className="mt-2 w-full py-2 rounded border text-gray-500 bg-gray-100"
                        >
                            Guardar y Continuar Después
                        </button>
                        <div className="mt-4 text-xs text-gray-500">
                            Los pases son válidos para la fecha que selecciones en el siguiente paso.<br />
                            Pago 100% seguro. Puedes cancelar hasta 48 horas antes de tu visita.
                        </div>
                    </div>
                </aside>
            </main>
            {/* Footer */}
            <Footer />
        </div>
    );
}
