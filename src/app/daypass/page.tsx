"use client";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import toast, { Toaster } from "react-hot-toast";

interface Visitante {
    nombre: string;
    correo: string;
    celular: string;
}

const CODIGO_PROMO = "PROMO100";
const DESCUENTO_PROMO = 100;
const PRECIO_PASE = 350;

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function DaypassPage() {
    const [cantidad, setCantidad] = useState<number>(1);
    const [visitantes, setVisitantes] = useState<Visitante[]>(
        Array.from({ length: 1 }, () => ({
            nombre: "",
            correo: "",
            celular: "",
        }))
    );
    const [touched, setTouched] = useState<{ nombre: boolean; correo: boolean; celular: boolean }[]>(
        Array.from({ length: 1 }, () => ({
            nombre: false,
            correo: false,
            celular: false,
        }))
    );
    const [codigoPromo, setCodigoPromo] = useState("");
    const [promoAplicado, setPromoAplicado] = useState(false);
    const [msgPromo, setMsgPromo] = useState("");

    // --- Helpers de validación campo a campo ---
    function validateNombre(nombre: string) {
        return nombre.trim().length > 0;
    }
    function validateCorreo(correo: string, obligatorio: boolean) {
        if (!correo.trim() && !obligatorio) return true;
        return regexEmail.test(correo.trim());
    }
    function validateCelular(celular: string) {
        return /^\d{10,}$/.test(celular.trim());
    }

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
                        celular: "",
                    })),
                ];
            }
            return prev.slice(0, v);
        });
        setTouched((prev) => {
            if (v > prev.length) {
                return [
                    ...prev,
                    ...Array.from({ length: v - prev.length }, () => ({
                        nombre: false,
                        correo: false,
                        celular: false,
                    })),
                ];
            }
            return prev.slice(0, v);
        });
        setPromoAplicado(false);
        setMsgPromo("");
        setCodigoPromo("");
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

    const handleBlur = (idx: number, campo: keyof Visitante) => {
        setTouched((prev) => {
            const copy = [...prev];
            copy[idx][campo] = true;
            return copy;
        });
    };

    // Validación global para habilitar botón
    const puedeContinuar = visitantes.every(
        (v, i) =>
            validateNombre(v.nombre) &&
            validateCelular(v.celular) &&
            validateCorreo(v.correo, i === 0)
    );

    // Totales y promo
    const subtotal = cantidad * PRECIO_PASE;
    const descuento = promoAplicado ? DESCUENTO_PROMO : 0;
    const total = Math.max(subtotal - descuento, 0);

    // Promo
    const aplicarPromo = () => {
        if (codigoPromo.trim().toUpperCase() === CODIGO_PROMO) {
            setPromoAplicado(true);
            setMsgPromo(`¡Descuento de $${DESCUENTO_PROMO} aplicado!`);
            toast.success(`¡Descuento de $${DESCUENTO_PROMO} aplicado!`);
            // GUARDAR ESTOS EN LOCALSTORAGE
            localStorage.setItem("promo_aplicada", "1");
            localStorage.setItem("promo_descuento", DESCUENTO_PROMO.toString());
            localStorage.setItem("promo_codigo", codigoPromo.trim().toUpperCase());
        } else {
            setPromoAplicado(false);
            setMsgPromo("Código promocional no válido.");
            toast.error("Código promocional no válido.");
            // Si el código es inválido, borra los datos:
            localStorage.removeItem("promo_aplicada");
            localStorage.removeItem("promo_descuento");
            localStorage.removeItem("promo_codigo");
        }
    };

    const handleSiguiente = () => {
        localStorage.setItem("visitantes", JSON.stringify(visitantes));
        localStorage.setItem("cantidad", cantidad.toString());
        window.location.href = "/daypass/fecha";
    };

    // --- Añade esta función para reservar el espacio de error (alineación) ---
    function renderError(message: string, show: boolean) {
        // Si hay error: texto rojo, si no, espacio reservado (misma altura)
        return (
            <div style={{ minHeight: "20px" }}>
                {show && (
                    <span className="text-xs text-red-600">{message}</span>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
            <Toaster position="top-center" />
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
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-black ${n === 1
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
                        {visitantes.slice(0, cantidad).map((vis, idx) => {
                            // Detectar errores de validación
                            const errorNombre = !validateNombre(vis.nombre) && touched[idx]?.nombre;
                            const errorCorreo = !validateCorreo(vis.correo, idx === 0) && touched[idx]?.correo;
                            const errorCelular = !validateCelular(vis.celular) && touched[idx]?.celular;
                            return (
                                <div
                                    key={idx}
                                    className="bg-white rounded border p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-start"
                                >
                                    {/* Nombre */}
                                    <div className="flex flex-col">
                                        <label className="block text-xs font-medium text-black mb-1 ">
                                            {`Visitante ${idx + 1} ${idx === 0 ? "(Tú)" : ""}`}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Nombre"
                                            value={vis.nombre}
                                            onChange={(e) => handleVis(idx, "nombre", e.target.value)}
                                            onBlur={() => handleBlur(idx, "nombre")}
                                            className={`border p-2 rounded w-full transition-colors duration-150 ${errorNombre ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-black"}`}
                                            required
                                        />
                                        {renderError("El nombre es obligatorio.", errorNombre)}
                                    </div>
                                    {/* Correo */}
                                    <div className="flex flex-col">
                                        <label className="block text-xs font-medium text-black mb-1">
                                            Correo Electrónico {idx === 0 ? <span className="text-[10px]">(Principal)</span> : <span className="text-gray-400">(opcional)</span>}
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="Correo electrónico"
                                            value={vis.correo}
                                            onChange={(e) => handleVis(idx, "correo", e.target.value)}
                                            onBlur={() => handleBlur(idx, "correo")}
                                            className={`border p-2 rounded w-full transition-colors duration-150 ${errorCorreo ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-black"}`}
                                            required={idx === 0}
                                        />
                                        {renderError(
                                            idx === 0
                                                ? "El correo es obligatorio y debe ser válido."
                                                : "El correo debe ser válido.",
                                            errorCorreo
                                        )}
                                    </div>
                                    {/* Celular */}
                                    <div className="flex flex-col">
                                        <label className="block text-xs font-medium text-black mb-1">
                                            Celular WhatsApp
                                        </label>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="\d{10,}"
                                            placeholder="Ej. 3312345678"
                                            value={vis.celular}
                                            onChange={(e) => handleVis(idx, "celular", e.target.value)}
                                            onBlur={() => handleBlur(idx, "celular")}
                                            className={`border p-2 rounded w-full transition-colors duration-150 ${errorCelular ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-black"}`}
                                            required
                                        />
                                        {renderError("El celular debe tener al menos 10 dígitos numéricos.", errorCelular)}
                                    </div>
                                </div>
                            );
                        })}
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
                        {promoAplicado && (
                            <div className="flex justify-between text-sm text-green-700 font-bold">
                                <span>Descuento aplicado</span>
                                <span>-${DESCUENTO_PROMO} MXN</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="font-bold text-black">Total</span>
                            <span className="font-bold text-black text-lg">${total} MXN</span>
                        </div>
                        {/* Código promocional */}
                        <input
                            className="mt-4 w-full border rounded px-2 py-1 text-sm"
                            placeholder="Código promocional"
                            value={codigoPromo}
                            onChange={e => setCodigoPromo(e.target.value)}
                            disabled={promoAplicado}
                        />
                        <button
                            type="button"
                            className="mt-2 w-full text-xs font-semibold text-black py-2 border border-gray-300 rounded hover:bg-gray-100"
                            onClick={aplicarPromo}
                            disabled={promoAplicado}
                        >
                            Aplicar
                        </button>
                        {msgPromo && (
                            <div className={`text-xs mt-2 ${promoAplicado ? "text-green-700" : "text-red-600"}`}>
                                {msgPromo}
                            </div>
                        )}
                        <button
                            onClick={handleSiguiente}
                            disabled={!puedeContinuar}
                            className={`mt-6 w-full py-2 rounded font-bold text-white ${puedeContinuar
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
            <Footer />
        </div>
    );
}
