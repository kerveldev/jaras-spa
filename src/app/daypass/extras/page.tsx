"use client";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";

const BUFFET = [
    { key: "basico", nombre: "Buffet Básico", descripcion: "Incluye entrada, plato principal y postre", precio: 350 },
    { key: "premium", nombre: "Buffet Premium", descripcion: "Incluye entrada, plato principal, postre y bebidas ilimitadas", precio: 550 },
    { key: "infantil", nombre: "Buffet Infantil", descripcion: "Menú especial para niños menores de 12 años", precio: 200 },
];

const MASAJES = [
    { key: "relajante", nombre: "Masaje Relajante", descripcion: "60 minutos de masaje con aceites esenciales", precio: 800 },
    { key: "piedras", nombre: "Masaje de Piedras Calientes", descripcion: "90 minutos de masaje terapéutico con piedras calientes", precio: 1200 },
    { key: "parejas", nombre: "Masaje para Parejas", descripcion: "75 minutos de masaje en pareja con champagne", precio: 2000 },
];

// Helpers para recuperar del LS si vuelves atrás
function getDefaultCantidad(key: string, defaultVal: number) {
    if (typeof window === "undefined") return defaultVal;
    try {
        const data = localStorage.getItem("extras_cantidades");
        if (!data) return defaultVal;
        const obj = JSON.parse(data);
        return obj[key] ?? defaultVal;
    } catch {
        return defaultVal;
    }
}

function getDefaultOrden() {
    if (typeof window === "undefined") return [];
    try {
        const data = localStorage.getItem("extras_orden");
        if (!data) return [];
        return JSON.parse(data);
    } catch {
        return [];
    }
}

export default function ExtrasPage() {
    // Estado para cantidades seleccionadas (usando LS si existe)
    const [cantidadesBuffet, setCantidadesBuffet] = useState<{ [key: string]: number }>({
        basico: getDefaultCantidad("basico", 0),
        premium: getDefaultCantidad("premium", 0),
        infantil: getDefaultCantidad("infantil", 0),
    });
    const [cantidadesMasaje, setCantidadesMasaje] = useState<{ [key: string]: number }>({
        relajante: getDefaultCantidad("relajante", 0),
        piedras: getDefaultCantidad("piedras", 0),
        parejas: getDefaultCantidad("parejas", 0),
    });

    // Estado para servicios agregados (usando LS si existe)
    const [orden, setOrden] = useState<{ tipo: string; nombre: string; cantidad: number; total: number }[]>(getDefaultOrden());

    // Si cambian cantidades, limpia el LS para que el usuario no vea basura previa
    useEffect(() => {
        // Guarda cantidades en localStorage (mejor práctica: todos juntos)
        localStorage.setItem(
            "extras_cantidades",
            JSON.stringify({ ...cantidadesBuffet, ...cantidadesMasaje })
        );
    }, [cantidadesBuffet, cantidadesMasaje]);

    useEffect(() => {
        // Guarda la orden (el resumen de extras)
        localStorage.setItem("extras_orden", JSON.stringify(orden));
    }, [orden]);

    // Función para agregar un servicio a la orden
    function agregarServicio(tipo: "buffet" | "masaje", item: any, cantidad: number) {
        if (cantidad < 1) return;
        setOrden((prev) => {
            const idx = prev.findIndex(
                (el) => el.tipo === tipo && el.nombre === item.nombre
            );
            const nuevo = {
                tipo,
                nombre: item.nombre,
                cantidad,
                total: cantidad * item.precio,
            };
            if (idx >= 0) {
                const copia = [...prev];
                copia[idx] = nuevo;
                return copia;
            }
            return [...prev, nuevo];
        });
    }

    // Calcular total de la orden
    const total = orden.reduce((acc, curr) => acc + curr.total, 0);

    // Navegación
    function handleContinuar() {
        // Además de lo anterior, guarda la orden actual (redundante, pero seguro)
        localStorage.setItem("extras_orden", JSON.stringify(orden));
        localStorage.setItem(
            "extras_cantidades",
            JSON.stringify({ ...cantidadesBuffet, ...cantidadesMasaje })
        );
        window.location.href = "/daypass/transporte";
    }

    function handleRegresar() {
        window.location.href = "/daypass/fecha";
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
            <Header />
            {/* Breadcrumbs y Progreso */}
            <div className="max-w-5xl w-full mx-auto pt-6 pb-4 px-4">
                <div className="text-xs text-gray-400 mb-4">
                    Inicio &gt; Selección de Fecha &gt; <span className="text-black">Servicios Adicionales</span>
                </div>
                <div className="flex items-center gap-2 mb-8">
                    {[1, 2, 3, 4].map((n, idx) => (
                        <div className="flex items-center" key={n}>
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                                    n === 3
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
                        <span className="text-gray-400">Fecha</span>
                        <span className="font-bold text-[#B7804F]">Extras</span>
                        <span className="text-gray-400">Transporte</span>
                    </div>
                </div>
            </div>

            {/* Main */}
            <main className="max-w-5xl w-full mx-auto px-4 pb-12 flex-1">
                <h2 className="text-2xl font-bold mb-6">Servicios Adicionales</h2>
                <p className="mb-6 text-gray-700">
                    Mejora tu experiencia en Las Jaras con nuestros servicios adicionales
                </p>
                {/* Opciones */}
                <div className="flex flex-col md:flex-row gap-8 mb-10">
                    {/* Buffet */}
                    <section className="flex-1">
                        <h3 className="font-bold mb-2 text-lg">Buffet Mexicano</h3>
                        <p className="mb-4 text-sm text-gray-600">
                            Disfruta de nuestra amplia selección de platillos tradicionales mexicanos preparados por nuestros chefs expertos. Ideal para grupos.
                        </p>
                        {BUFFET.map((item) => (
                            <div key={item.key} className="mb-4 flex items-end gap-3">
                                <div className="flex-1">
                                    <div className="font-semibold">{item.nombre}</div>
                                    <div className="text-xs text-gray-600 mb-2">{item.descripcion}</div>
                                    <div className="font-semibold text-sm mb-2">${item.precio} MXN <span className="font-normal text-xs text-gray-400">por persona</span></div>
                                    <div className="flex gap-2 items-center">
                                        <span className="text-xs">Cantidad:</span>
                                        <button
                                            onClick={() =>
                                                setCantidadesBuffet((prev) => ({
                                                    ...prev,
                                                    [item.key]: Math.max((prev[item.key] || 0) - 1, 0),
                                                }))
                                            }
                                            className="border px-2 rounded disabled:text-gray-300"
                                            disabled={cantidadesBuffet[item.key] < 1}
                                        >
                                            -
                                        </button>
                                        <span className="w-6 text-center">{cantidadesBuffet[item.key]}</span>
                                        <button
                                            onClick={() =>
                                                setCantidadesBuffet((prev) => ({
                                                    ...prev,
                                                    [item.key]: (prev[item.key] || 0) + 1,
                                                }))
                                            }
                                            className="border px-2 rounded"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <button
                                    className={`px-5 py-2 rounded shadow ${
                                        cantidadesBuffet[item.key] > 0
                                            ? "bg-[#B7804F] text-white hover:bg-[#A06F44] !important"
                                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                                    disabled={cantidadesBuffet[item.key] === 0}
                                    onClick={() =>
                                        agregarServicio(
                                            "buffet",
                                            item,
                                            cantidadesBuffet[item.key]
                                        )
                                    }
                                >
                                    Agregar
                                    {cantidadesBuffet[item.key] > 0
                                        ? ` - $${cantidadesBuffet[item.key] * item.precio} MXN`
                                        : ""}
                                </button>
                            </div>
                        ))}
                    </section>
                    {/* Masajes */}
                    <section className="flex-1">
                        <h3 className="font-bold mb-2 text-lg">Servicios de Masaje</h3>
                        <p className="mb-4 text-sm text-gray-600">
                            Relájate y rejuvenece con nuestros servicios de masaje profesional. Perfectos para parejas o individuales.
                        </p>
                        {MASAJES.map((item) => (
                            <div key={item.key} className="mb-4 flex items-end gap-3">
                                <div className="flex-1">
                                    <div className="font-semibold">{item.nombre}</div>
                                    <div className="text-xs text-gray-600 mb-2">{item.descripcion}</div>
                                    <div className="font-semibold text-sm mb-2">${item.precio} MXN <span className="font-normal text-xs text-gray-400">por persona</span></div>
                                    <div className="flex gap-2 items-center">
                                        <span className="text-xs">Cantidad:</span>
                                        <button
                                            onClick={() =>
                                                setCantidadesMasaje((prev) => ({
                                                    ...prev,
                                                    [item.key]: Math.max((prev[item.key] || 0) - 1, 0),
                                                }))
                                            }
                                            className="border px-2 rounded disabled:text-gray-300"
                                            disabled={cantidadesMasaje[item.key] < 1}
                                        >
                                            -
                                        </button>
                                        <span className="w-6 text-center">{cantidadesMasaje[item.key]}</span>
                                        <button
                                            onClick={() =>
                                                setCantidadesMasaje((prev) => ({
                                                    ...prev,
                                                    [item.key]: (prev[item.key] || 0) + 1,
                                                }))
                                            }
                                            className="border px-2 rounded"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <button
                                    className={`px-5 py-2 rounded  shadow ${
                                        cantidadesMasaje[item.key] > 0
                                            ? "bg-[#B7804F] text-white hover:bg-[#A06F44]"
                                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                                    disabled={cantidadesMasaje[item.key] === 0}
                                    onClick={() =>
                                        agregarServicio(
                                            "masaje",
                                            item,
                                            cantidadesMasaje[item.key]
                                        )
                                    }
                                >
                                    Agregar
                                    {cantidadesMasaje[item.key] > 0
                                        ? ` - $${cantidadesMasaje[item.key] * item.precio} MXN`
                                        : ""}
                                </button>
                            </div>
                        ))}
                    </section>
                </div>
                {/* Resumen de la orden */}
                <div className="max-w-2xl mx-auto mt-12 mb-8 bg-white border rounded p-6">
                    <h4 className="font-bold mb-3">Resumen de tu Orden</h4>
                    <ul className="mb-4">
                        {orden.map(
                            (item) =>
                                item.cantidad > 0 && (
                                    <li key={item.tipo + item.nombre} className="flex justify-between text-sm py-1">
                                        <span>
                                            {item.cantidad} x {item.nombre}
                                        </span>
                                        <span>
                                            ${item.total} MXN
                                        </span>
                                    </li>
                                )
                        )}
                    </ul>
                    <div className="flex justify-between font-bold text-base border-t pt-2">
                        <span>Total</span>
                        <span>${total} MXN</span>
                    </div>
                    <div className="flex justify-end mt-6 gap-3">
                        <button
                            onClick={handleRegresar}
                            className="px-6 py-2 border rounded hover:bg-gray-100 font-semibold"
                        >
                            Regresar
                        </button>
                        <button
                            onClick={handleContinuar}
                            className="px-6 py-2 rounded font-bold text-white bg-[#B7804F] hover:bg-[#A06F44] transition"
                        >
                            Continuar a Transporte
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
