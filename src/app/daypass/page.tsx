// Tipo explícito para archivos INE
"use client";

type IneFiles = { frente: File | null, reverso: File | null };
import { JSXElementConstructor, ReactElement, ReactNode, ReactPortal, useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import toast, {Toaster} from "react-hot-toast";
import {FiPlus, FiTrash2} from "react-icons/fi";
import Stepper from "@/components/Stepper";

const CODIGO_PROMO = "PROMO100";
const DESCUENTO_PROMO = 100;
const PRECIO_PASE = 350;

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const horarios = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
];

function getDiasMes(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay(); // 0=domingo
    const lastDate = new Date(year, month + 1, 0).getDate();
    const primerDia = firstDay === 0 ? 6 : firstDay - 1;
    return {
        dias: Array.from({length: lastDate}, (_, i) => i + 1),
        primerDia,
    };
}

function formatFechaEs(year: number, month: number, day: number) {
    const fecha = new Date(`${year}-${(month + 1).toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}T12:00:00`);
    return fecha.toLocaleDateString("es-MX", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

export default function DaypassUnicaPage() {
    useEffect(() => {
        localStorage.clear();
    }, []);
    const [visitantes, setVisitantes] = useState([
        {nombre: "", correo: "", celular: ""},
    ]);
    const [touched, setTouched] = useState([
        {nombre: false, correo: false, celular: false},
    ]);
    // Estado para archivos INE por visitante
    const [ineFiles, setIneFiles] = useState<IneFiles[]>(
        visitantes.map(() => ({ frente: null, reverso: null }))
    );
    const [codigoPromo, setCodigoPromo] = useState("");
    const [promoAplicado, setPromoAplicado] = useState(false);
    const [msgPromo, setMsgPromo] = useState("");
    const [descuento, setDescuento] = useState(0);

    const today = new Date();
    const [mes, setMes] = useState(today.getMonth());
    const [year, setYear] = useState(today.getFullYear());
    const [selectedDay, setSelectedDay] = useState(today.getDate());
    const [selectedTime, setSelectedTime] = useState("11:00 AM");

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

    const puedeContinuar =
        visitantes.every(
            (v, i) =>
                validateNombre(v.nombre) &&
                validateCelular(v.celular) &&
                validateCorreo(v.correo, i === 0)
        ) &&
        selectedDay > 0 &&
        selectedTime;

    // Agregar visitante
    const handleAddVisitante = () => {
        if (visitantes.length >= 10) return;
        setVisitantes((prev) => [
            ...prev,
            {nombre: "", correo: "", celular: ""},
        ]);
        setTouched((prev) => [
            ...prev,
            {nombre: false, correo: false, celular: false},
        ]);
        setIneFiles((prev) => [
            ...prev,
            { frente: null, reverso: null }
        ]);
    };

    // Cambios por visitante
    const handleVis = (idx: number, campo: 'nombre' | 'correo' | 'celular', valor: string) => {
        setVisitantes((prev) => {
            const copia = [...prev];
            copia[idx][campo] = valor;
            return copia;
        });
    };

    const handleBlur = (idx: number, campo: 'nombre' | 'correo' | 'celular') => {
        setTouched((prev) => {
            const copy = [...prev];
            copy[idx][campo] = true;
            return copy;
        });
    };

    const aplicarPromo = () => {
        if (codigoPromo.trim().toUpperCase() === CODIGO_PROMO) {
            setPromoAplicado(true);
            setMsgPromo(`¡Descuento de $${DESCUENTO_PROMO} aplicado!`);
            setDescuento(DESCUENTO_PROMO);
            toast.success(`¡Descuento de $${DESCUENTO_PROMO} aplicado!`);
            localStorage.setItem("promo_aplicada", "1");
            localStorage.setItem("descuentoPromo", DESCUENTO_PROMO.toString());
            localStorage.setItem("promo_codigo", codigoPromo.trim().toUpperCase());
        } else {
            setPromoAplicado(false);
            setMsgPromo("Código promocional no válido.");
            setDescuento(0);
            toast.error("Código promocional no válido.");
            localStorage.removeItem("promo_aplicada");
            localStorage.removeItem("descuentoPromo");
            localStorage.removeItem("promo_codigo");
        }
    };

    const {dias, primerDia} = getDiasMes(year, mes);
    const fechaSeleccionada = `${year}-${(mes + 1).toString().padStart(2, "0")}-${selectedDay
        .toString()
        .padStart(2, "0")}`;
    const fechaDisplay = formatFechaEs(year, mes, selectedDay);

    const subtotal = visitantes.length * PRECIO_PASE;
    const total = Math.max(subtotal - descuento, 0);

    // Guardar y continuar
    const handleSiguiente = () => {
        localStorage.setItem("visitantes", JSON.stringify(visitantes));
        localStorage.setItem("cantidad", visitantes.length.toString());
        localStorage.setItem("fechaVisita", fechaSeleccionada);
        localStorage.setItem("horaVisita", selectedTime);
        window.location.href = "/daypass/extras";
    };

    function handleContinuar() {
        window.location.href = "/daypass/resumen";
    }

    // Métodos de pago y simulación de pago
    const [metodoPago, setMetodoPago] = useState("efectivo");
    const [paid, setPaid] = useState(true);
    const [card, setCard] = useState({ name: "", num: "", exp: "", cvc: "" });
    const [isPaying, setIsPaying] = useState(false);

    function isExpValid(exp: string) {
        // MM/AA
        if (!/^\d{2}\/\d{2}$/.test(exp)) return false;
        const [mm, aa] = exp.split("/").map(Number);
        if (mm < 1 || mm > 12) return false;
        return true;
    }

    function handleExpChange(e: { target: { value: string; }; }) {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 4) value = value.slice(0, 4);
        if (value.length > 2) value = value.slice(0, 2) + "/" + value.slice(2);
        setCard(card => ({ ...card, exp: value }));
    }

    function handlePay(e: { preventDefault: () => void; }) {
        e.preventDefault();
        if (!isExpValid(card.exp)) return;
        setIsPaying(true);
        setTimeout(() => {
            setPaid(true);
            setIsPaying(false);
        }, 1500);
    }

    function renderError(message: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, show: boolean) {
        return (
            <div style={{ minHeight: "20px" }}>
                {show && (
                    <span className="text-xs text-red-600">{message}</span>
                )}
            </div>
        );
    }

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
    // Para eliminar visitante
    const handleRemoveVisitante = (idx: number) => {
        setVisitantes((prev) => prev.filter((_, i) => i !== idx));
        setTouched((prev) => prev.filter((_, i) => i !== idx));
        setIneFiles((prev) => prev.filter((_, i) => i !== idx));
    };
    // Puede finalizar en efectivo
    const puedeFinalizarEfectivo =
      validateNombre(visitantes[0]?.nombre) &&
      validateCelular(visitantes[0]?.celular) &&
      validateCorreo(visitantes[0]?.correo, true) &&
      ineFiles[0]?.frente &&
      ineFiles[0]?.reverso;

    // Guardar automáticamente visitantes, total, fechaVisita y horaVisita en localStorage
    useEffect(() => {
        const data = {
            visitantes,
            total,
            fechaVisita: fechaSeleccionada,
            horaVisita: selectedTime,
        };
        localStorage.setItem("reserva_data", JSON.stringify(data));
        console.log("Datos de la reserva guardados en localStorage:", data);
    }, [visitantes, total, fechaSeleccionada, selectedTime]);

    // Handler para cambios de archivo INE
    const handleIneFileChange = (idx: number, tipo: 'frente' | 'reverso', file: File | null) => {
        setIneFiles((prev) => {
            const copia = [...prev];
            copia[idx][tipo] = file;
            return copia;
        });
    };


    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
            <Toaster position="top-center" />
            <Header />
            <h1 className="text-2xl font-bold text-center mb-8 text-[#18668b]  pt-12">
                Completa tu Reservación y Agenda tu Visita
            </h1>

            {/* Main Content */}
            <main className="flex flex-col md:flex-row gap-8 max-w-7xl w-full mx-auto px-4 pb-12 flex-1 ">
                {/* Card Visitantes */}
                <section className="flex-1 md:flex md:items-start md:gap-8">
                    <div className="w-full md:w-2/3">
                        <form className="space-y-4">
                            {visitantes.map((vis, idx) => {
                                const errorNombre = !validateNombre(vis.nombre) && touched[idx]?.nombre;
                                const errorCorreo = !validateCorreo(vis.correo, idx === 0) && touched[idx]?.correo;
                                const errorCelular = !validateCelular(vis.celular) && touched[idx]?.celular;
                                return (
                                    <div
                                        key={idx}
                                        className="bg-white rounded border p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-start relative"
                                    >
                                        {/* Botón eliminar visitante */}
                                        {visitantes.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveVisitante(idx)}
                                                className="absolute top-2 right-2 text-red-600 hover:bg-red-100 rounded-full p-1 transition z-10"
                                                title="Eliminar visitante"
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        )}

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
                                        {/* INE SOLO PARA PRIMER VISITANTE */}
                                        {idx === 0 && (
                                            <>
                                                {/* INE Frente */}
                                                <div className="flex flex-col mt-2">
                                                    <label className="block text-xs font-medium text-black mb-1">
                                                        INE Frente (Imagen o PDF)
                                                    </label>
                                                    <input
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        onChange={e =>
                                                            handleIneFileChange(idx, 'frente', e.target.files ? e.target.files[0] : null)
                                                        }
                                                        className="border p-1 rounded text-xs"
                                                    />
                                                    {ineFiles[idx]?.frente && (
                                                        <span className="text-xs text-green-600">Archivo listo: {ineFiles[idx].frente.name}</span>
                                                    )}
                                                </div>
                                                {/* INE Reverso */}
                                                <div className="flex flex-col mt-2">
                                                    <label className="block text-xs font-medium text-black mb-1">
                                                        INE Reverso (Imagen o PDF)
                                                    </label>
                                                    <input
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        onChange={e =>
                                                            handleIneFileChange(idx, 'reverso', e.target.files ? e.target.files[0] : null)
                                                        }
                                                        className="border p-1 rounded text-xs"
                                                    />
                                                    {ineFiles[idx]?.reverso && (
                                                        <span className="text-xs text-green-600">Archivo listo: {ineFiles[idx].reverso.name}</span>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        {/* Botón agregar visitante */}
                                        {idx === visitantes.length - 1 && visitantes.length < 10 && (
                                            <button
                                                type="button"
                                                onClick={handleAddVisitante}
                                                className="absolute top-1/2 right-[-2.6rem] -translate-y-1/2 bg-[#18668b] hover:bg-[#14526d] text-white rounded-full p-2 shadow-lg transition z-10"
                                                title="Agregar visitante"
                                            >
                                                <FiPlus size={22} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </form>

                        <h3 className="font-semibold text-black text-base mt-10 mb-2 text-center">
                            Selecciona la fecha y el horario de tu visita
                        </h3>
                        <div className="flex flex-col md:flex-row gap-6 mb-6">
                            {/* Calendario */}
                            <div className="w-full md:w-1/2">
                                <div className="bg-white border rounded p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <button
                                            className="text-xs text-[#18668b] font-bold"
                                            onClick={handlePrevMonth}
                                            type="button"
                                        >
                                            Mes anterior
                                        </button>
                                        <span className="font-semibold capitalize">
          {new Date(year, mes).toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
        </span>
                                        <button
                                            className="text-xs text-[#18668b] font-bold"
                                            onClick={handleNextMonth}
                                            type="button"
                                        >
                                            Mes siguiente
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1">
                                        {diasSemana.map((dia) => (
                                            <span key={dia}>{dia}</span>
                                        ))}
                                    </div>
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
                ${isSelected
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
                            </div>
                            {/* Horarios */}
                            <div className="w-full md:w-1/2">
                                <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                                    {horarios.map((hora) => (
                                        <button
                                            key={hora}
                                            type="button"
                                            className={`rounded border py-2 font-semibold text-sm w-full
            ${selectedTime === hora
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
                        </div>
                    </div>
                    {/* Card Resumen */}
                    <aside className="w-full md:w-1/3 md:pl-4 mt-10 md:mt-0">
                        <div className="bg-white border rounded-lg p-6 shadow-sm mb-6">
                            <h4 className="font-bold text-black mb-3">Resumen de tu reserva</h4>
                            <div className="flex items-center gap-2 text-sm mb-2">
                                <span>📅</span>
                                <span className="capitalize">{fechaDisplay}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm mb-2">
                                <span>⏰</span>
                                <span>{selectedTime}</span>
                            </div>
                            <div className="text-sm text-gray-500 mb-4">
                                Disponibilidad confirmada para {visitantes.length} persona{visitantes.length > 1 && "s"}
                            </div>
                            <div className="flex justify-between mb-1 text-sm">
                                <span className="text-black">Pases de Acceso General</span>
                                <span className="text-black">{visitantes.length} pases</span>
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
                            <div className="flex justify-between font-bold text-base">
                                <span>Total</span>
                                <span>${total}.00 MXN</span>
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
                            {/*
                            <button
                                onClick={handleContinuar}
                                disabled={!puedeContinuar}
                                className={`mt-6 w-full py-2 rounded font-bold text-white ${puedeContinuar
                                    ? "bg-[#18668b] hover:bg-[#14526d]"
                                    : "bg-gray-300 cursor-not-allowed"
                                }`}
                            >
                                Continuar con Transporte
                            </button>
                            */}

                            <h4 className="font-bold mb-3">Resumen de reserva</h4>
                            {/* Total visible siempre */}
                            <div className="flex justify-between font-bold text-lg mb-4">
                                <span>Total:</span>
                                <span>${total} MXN</span>
                            </div>

                            {/* NUEVO: Método de pago */}
                            <div className="flex gap-3 mb-4">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        className="mr-2"
                                        name="metodoPago"
                                        value="efectivo"
                                        checked={metodoPago === "efectivo"}
                                        onChange={() => {
                                            setMetodoPago("efectivo");
                                            setPaid(true); // Efectivo se considera "pagado"
                                        }}
                                    />
                                    <span>Efectivo</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        className="mr-2"
                                        name="metodoPago"
                                        value="tarjeta"
                                        checked={metodoPago === "tarjeta"}
                                        onChange={() => {
                                            setMetodoPago("tarjeta");
                                            setPaid(false);
                                        }}
                                    />
                                    <span>Tarjeta</span>
                                </label>
                            </div>

                            {/* Pago tarjeta visible solo si es tarjeta */}
                            {!paid && metodoPago === "tarjeta" && (
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
                                    <div className="flex gap-x-3">
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
                                    </div>
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
                            {/* Pago realizado */}
                            {paid && metodoPago === "tarjeta" && (
                                <div className="mt-4 text-green-700 text-center font-bold">
                                    ¡Pago realizado con éxito!
                                </div>
                            )}
                            {paid && metodoPago === "efectivo" && (
                                <div className="mt-4 text-yellow-700 text-center font-bold">
                                    Presenta este resumen y paga en taquilla.
                                </div>
                            )}

                            <button
                              className={`mt-6 w-full py-2 rounded font-bold text-white ${
                                (metodoPago === "efectivo" ? puedeFinalizarEfectivo : paid)
                                  ? "bg-[#18668b] hover:bg-[#14526d]"
                                  : "bg-gray-300 cursor-not-allowed"
                              }`}
                              onClick={handleContinuar}
                              disabled={metodoPago === "efectivo" ? !puedeFinalizarEfectivo : !paid}
                            >
                              {metodoPago === "efectivo"
                                ? "Finalizar y ver resumen para pago en efectivo"
                                : "Continuar al resumen"}
                            </button>
                            {/*<button
                                onClick={handleSiguiente}
                                disabled={!puedeContinuar}
                                className={`mt-6 w-full py-2 rounded font-bold text-white ${puedeContinuar
                                    ? "bg-[#18668b] hover:bg-[#14526d]"
                                    : "bg-gray-300 cursor-not-allowed"
                                }`}
                            >
                                Continuar a Extras
                            </button>*/}
                            <div className="mt-4 text-xs text-gray-500">
                                Los pases son válidos para la fecha y hora seleccionada.<br />
                                Pago 100% seguro. Puedes cancelar hasta 48 horas antes de tu visita.
                            </div>
                        </div>
                    </aside>
                </section>
            </main>
            <Footer />
        </div>
    );
}
