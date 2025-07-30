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

function getPrecioPase(fecha: string, categoria: string = "general") {
    // Obtén el día de la semana: 0=Domingo, 1=Lunes, ..., 6=Sábado
    const diaSemana = new Date(fecha).getDay();
    // Lunes a Jueves: 1-4, Viernes a Domingo: 0, 5, 6
    if ([1, 2, 3, 4].includes(diaSemana)) {
        // Lunes a Jueves
        switch (categoria) {
            case "general": return 350;
            case "grupos": return 325;
            case "inapam": return 300;
            case "convenios": return 300;
            case "locales": return 250;
            case "discapacidad": return 250;
            default: return 350;
        }
    } else {
        // Viernes a Domingo
        switch (categoria) {
            case "general": return 420;
            case "grupos": return 390;
            case "inapam": return 360;
            case "convenios": return 360;
            case "locales": return 300;
            case "discapacidad": return 300;
            default: return 420;
        }
    }
}

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const horarios = [
    "10:00 AM", "01:00 PM", "04:00 PM"
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

    const subtotal = visitantes.length * getPrecioPase(fechaSeleccionada, "general");
    const total = Math.max(subtotal - descuento, 0);

    // Prepara los datos del formulario para enviar por correo electrónico
    function prepararDatosParaCorreo() {
        const data = {
            visitantes: visitantes.map((v, idx) => ({
                nombre: v.nombre,
                correo: v.correo,
                celular: v.celular,
                ine_frente: idx === 0 && ineFiles[idx]?.frente ? ineFiles[idx].frente.name : undefined,
                ine_reverso: idx === 0 && ineFiles[idx]?.reverso ? ineFiles[idx].reverso.name : undefined,
            })),
            fecha: fechaSeleccionada,
            fechaDisplay: fechaDisplay,
            horario: selectedTime,
            cantidad: visitantes.length,
            subtotal,
            descuento,
            total,
            promoAplicado,
            codigoPromo,
            metodoPago,
        };
        return data;
    }

    // Genera el cuerpo del correo electrónico en texto plano
    function generarCuerpoCorreo(data: ReturnType<typeof prepararDatosParaCorreo>) {
        const visitantesTxt = data.visitantes.map((v, idx) =>
            `Visitante ${idx + 1}:\n- Nombre: ${v.nombre}\n- Correo: ${v.correo}\n- Celular: ${v.celular}\n`
            + (idx === 0 ? `- INE Frente: ${v.ine_frente || "No adjunto"}\n- INE Reverso: ${v.ine_reverso || "No adjunto"}\n` : "")
        ).join('\n');

        return `
Reserva de DayPass

Fecha de visita: ${data.fechaDisplay}
Hora de llegada: ${data.horario}
Cantidad de personas: ${data.cantidad}

${visitantesTxt}

Subtotal: $${data.subtotal} MXN
${data.promoAplicado ? `Descuento aplicado: -$${data.descuento} MXN\n` : ""}
Total a pagar: $${data.total} MXN

Método de pago: ${data.metodoPago === "tarjeta" ? "Tarjeta" : "Efectivo"}
${data.codigoPromo ? `Código promocional usado: ${data.codigoPromo}\n` : ""}

¡Gracias por reservar!
        `.trim();
    }

    // Guardar y continuar
    const handleSiguiente = () => {
        localStorage.setItem("visitantes", JSON.stringify(visitantes));
        localStorage.setItem("cantidad", visitantes.length.toString());
        localStorage.setItem("fechaVisita", fechaSeleccionada);
        localStorage.setItem("horaVisita", selectedTime);
        window.location.href = "/daypass/extras";
    };

    async function handleContinuar() {
        const datos = prepararDatosParaCorreo();

        // Armado exacto de FormData
        const formData = new FormData();

        // Visitor principal
        const principal = datos.visitantes[0];
        formData.append("visitor[name]", principal.nombre);
        formData.append("visitor[email]", principal.correo);
        formData.append("visitor[phone]", principal.celular);
        formData.append("visitor[type]", "general");

        // INE archivos (si existen)
        if (ineFiles[0]?.frente) formData.append("idcard_front", ineFiles[0].frente, ineFiles[0].frente.name);
        if (ineFiles[0]?.reverso) formData.append("idcard_back", ineFiles[0].reverso, ineFiles[0].reverso.name);

        // Fecha y hora combinada
        const fechaHora = datos.fecha + " " + (datos.horario || "11:00 AM");
        formData.append("reservation_at", fechaHora);

        // Totales
        formData.append("totals[total]", String(datos.total));

        // Promo como JSON vacío o valor real si existe
        formData.append("promo", datos.promoAplicado ? JSON.stringify({ code: datos.codigoPromo }) : "[]");

        // Todos los visitantes
        datos.visitantes.forEach((v, idx) => {
            formData.append(`visitors[${idx}][name]`, v.nombre);
            formData.append(`visitors[${idx}][email]`, v.correo);
            formData.append(`visitors[${idx}][phone]`, v.celular);
            formData.append(`visitors[${idx}][type]`, "general");
        });

        try {
            const response = await fetch("/api/reservations", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Error en el envío de la reservación");
            }

            alert("¡Reservación enviada correctamente!");
            window.location.href = "/daypass/resumen";
        } catch (error) {
            alert("Ocurrió un error al enviar la reservación. Intenta de nuevo.");
            console.error(error);
        }
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

    function renderError(message: ReactNode, show: boolean) {
        return (
            <div style={{ minHeight: "20px" }}>
                {show && (
                    <span className="text-xs text-red-700 font-bold">
                        {message}
                    </span>
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
    
    const [paso, setPaso] = useState(1);
    const pasos = [
        { label: "Huéspedes", paso: 1 },
        { label: "Fecha y Tiempo", paso: 2 },
        { label: "Verificar", paso: 3 },
        
    ];

    const imagenes = [
        "/assets/img-4.webp",      // Paso 1
        "/assets/img-5.webp",        // Paso 2
        "/image.png",   // Paso 3
    ];
    const [adultos, setAdultos] = useState(1);
    const [ninos, setNinos] = useState(0);

    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const prevMonth = mes === 0 ? 11 : mes - 1;
    const prevYear = mes === 0 ? year - 1 : year;
    const lastDayPrevMonth = new Date(prevYear, prevMonth + 1, 0); // último día del mes anterior
    lastDayPrevMonth.setHours(0,0,0,0);

    const puedeIrMesAnterior = lastDayPrevMonth >= hoy;

    return (
        

        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
            <Toaster position="top-center" />
            {/* <Header /> */}

            

            {/* <h1 className="text-2xl font-bold text-center mb-8 text-[#18668b] pt-12">
                Completa tu Reservación y Agenda tu Visita
            </h1> */}
            <main className="flex flex-row w-full min-h-[calc(100vh-120px)] max-w-none">
                
            <section className="w-full md:w-1/2 flex flex-col justify-center px-8 py-12">
                 {/* Stepper visual */}
            <div className="flex items-center justify-center gap-6 mt-0 mb-auto">
              {paso > 1 && (
                <button
                  type="button"
                  onClick={() => setPaso(paso - 1)}
                  className="mr-4 flex items-center justify-center text-[#18668b] hover:text-[#14526d] transition"
                  title="Regresar al paso anterior"
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
              {pasos.map((step, idx) => {
                const completado = paso > step.paso;
                const activo = paso === step.paso;
                return (
                  <div key={step.label} className="flex flex-col items-center min-w-[90px]">
                    <span
                      className={`text-sm font-semibold pb-1 transition
                        ${activo || completado
                          ? "text-[#18668b]"
                          : "text-gray-400"
                        }`}
                    >
                      {step.label}
                    </span>
                    <div
                      className={`w-full h-1 mt-1 rounded
                        ${activo || completado
                          ? "bg-[#18668b]"
                          : "bg-gray-200"
                        }`}
                    />
                  </div>
                );
              })}
            </div>
                {/* paso 1: Huéspedes */}
                {paso === 1 && (
                    <>
                        <div className="text-gray-700 text-5xl font-bold mb-6 ">
                            ¿Cuántos visitantes son?
                        </div>
                        <p className="mb-20 text-gray-600 text-2xl">
                        El precio varía según el horario. Niños menores de 13 años entran gratis.
                        </p>
                        <div className="space-y-6 mb-0 mt-auto">
                            {/* Adultos */}
                            <div className="flex items-center justify-between bg-white rounded shadow p-5 mb-10 ">
                                <span className="font-semibold text-lg">Adultos 14 +</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="px-3 py-1 rounded text-xl font-bold bg-gray-200 hover:bg-[#302f2f] text-black hover:text-white"
                                        onClick={() => {
                                            if (adultos > 1) {
                                                setAdultos(adultos - 1);
                                                setVisitantes((prev) => {
                                                    const nuevo = prev.slice(0, prev.length - 1);
                                                    // Siempre deja al menos un visitante
                                                    return nuevo.length === 0 ? [{ nombre: "", correo: "", celular: "" }] : nuevo;
                                                });
                                                setTouched((prev) => {
                                                    const nuevo = prev.slice(0, prev.length - 1);
                                                    return nuevo.length === 0 ? [{ nombre: false, correo: false, celular: false }] : nuevo;
                                                });
                                                setIneFiles((prev) => {
                                                    const nuevo = prev.slice(0, prev.length - 1);
                                                    return nuevo.length === 0 ? [{ frente: null, reverso: null }] : nuevo;
                                                });
                                                // Si al bajar adultos hay más niños que el nuevo máximo, ajusta niños
                                                if (ninos > (adultos - 1) * 2) setNinos((adultos - 1) * 2);
                                            }
                                        }}
                                        disabled={adultos <= 1}
                                    >-</button>
                                    <span className="text-xl font-bold">{adultos}</span>
                                    <button
                                        type="button"
                                        className="px-3 py-1 rounded text-xl font-bold bg-gray-200 hover:bg-[#302f2f] text-black hover:text-white"
                                        onClick={() => {
                                            if (adultos < 14) {
                                                setAdultos(adultos + 1);
                                                setVisitantes((prev) => [...prev, { nombre: "", correo: "", celular: "" }]);
                                                setTouched((prev) => [...prev, { nombre: false, correo: false, celular: false }]);
                                                setIneFiles((prev) => [...prev, { frente: null, reverso: null }]);
                                            }
                                        }}
                                        disabled={adultos >= 14}
                                    >+</button>
                                </div>
                            </div>
                            {/* Niños */}
                            <div className="flex items-center justify-between bg-white rounded shadow p-5 ">
                                    <span className="font-semibold text-lg">Niños 2 - 13</span>
                                    <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="px-3 py-1 rounded text-xl font-bold bg-gray-200 hover:bg-[#302f2f] text-black hover:text-white"
                                        onClick={() => setNinos(Math.max(0, ninos - 1))}
                                        disabled={ninos <= 0}
                                    >-</button>
                                    <span className="text-xl font-bold">{ninos}</span>
                                    <button
                                        type="button"
                                        className="px-3 py-1 rounded text-xl font-bold bg-gray-200 hover:bg-[#302f2f] text-black hover:text-white"
                                        onClick={() => setNinos(ninos < adultos * 2 ? ninos + 1 : ninos)}
                                        disabled={ninos >= adultos * 2}
                                    >+</button>
                                    </div>
                                </div>
                        </div>
                        {ninos > 0 && (
                        <div className="bg-[#ffff0009] border-l-4 border-yellow-400 p-4 -mb-22 text-sm text-gray-700 mt-4">
                            Los niños de 2 a 13 años deben estar acompañados por un adulto. No incluye bebida ni bata. Niños menores de 8 años deben usar flotadores.
                        </div>
                        )}
                         {adultos >= 14 && (
                        <div className="bg-[#ffff0009] border-l-4 border-yellow-400 p-4 -mb-43 text-sm text-gray-700 mt-25">
                           Si desea reservar para más de 14 adultos, póngase en contacto con nuestro <a href="#" className="text-blue-700"> Servicio de Atención al Cliente</a> para consultar la disponibilidad.
                        </div>
                        )}
                        <button
                        className="w-full py-7 rounded font-bold text-white bg-gradient-to-r bg-[#62a7c7] hover:bg-[#14526d] mt-50"
                        onClick={() => setPaso(2)}
                        >
                        Continuar
                        </button>
                    </>
                )}
        

                {/* Paso 2: Fecha y horario */}
                {paso === 2 && (
                <>
                    <div className=" text-gray-700 text-4xl font-bold mb-6 mt-10">
                        Selecciona la fecha y el horario de tu visita
                    </div>
                     <p className=" mb-20 text-gray-600 text-2xl">
                        Estamos abiertos todos los días del año.
                        </p>

                    <div className="flex flex-col md:flex-row gap-6 -mb-10 ">
                      {/* Calendario*/}
                        <div className="w-full max-w-4xl mx-auto p-0">
                        <div className="bg-white border rounded-lg p-10 shadow-md">
                            {/* Navegación */}
                            <div className="flex items-center justify-between mb-6">
                            <button
                                className={`text-sm font-bold hover:underline ${
                                puedeIrMesAnterior
                                    ? "text-[#688b18] cursor-pointer"
                                    : "text-gray-400 cursor-not-allowed"
                                }`}
                                onClick={handlePrevMonth}
                                type="button"
                                disabled={!puedeIrMesAnterior}
                            >
                                ← Mes anterior
                            </button>
                            <span className="text-lg font-bold capitalize">
                                {new Date(year, mes).toLocaleDateString("es-MX", {
                                month: "long",
                                year: "numeric",
                                })}
                            </span>
                            <button
                                className="text-sm text-[#18668b] font-bold hover:underline"
                                onClick={handleNextMonth}
                                type="button"
                            >
                                Mes siguiente →
                            </button>
                            </div>

                            {/* Días de la semana */}
                            <div className="grid grid-cols-7 text-center text-sm font-semibold mb-2">
                            {diasSemana.map((dia) => (
                                <span key={dia} className="text-gray-600">{dia}</span>
                            ))}
                            </div>

                            {/* Días del mes */}
                            <div className="grid grid-cols-7 gap-2">
                            {[...Array(primerDia).keys()].map((_, i) => (
                                <div key={"empty-" + i}></div>
                            ))}
                            {dias.map((dia) => {
                                // Calcula la fecha completa del día actual en el mes
                                const fechaBtn = new Date(year, mes, dia);
                                const hoy = new Date();
                                hoy.setHours(0,0,0,0); // Ignora la hora

                                const isSelected = selectedDay === dia;
                                const isDisabled = fechaBtn < hoy;

                                return (
                                    <button
                                        key={dia}
                                        type="button"
                                        onClick={() => !isDisabled && setSelectedDay(dia)}
                                        disabled={isDisabled}
                                        className={`w-12 h-12 text-base rounded-full border flex items-center justify-center transition
                                            ${isSelected
                                                ? "bg-[#18668b] text-white border-[#18668b]"
                                                : isDisabled
                                                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                    : "bg-white hover:bg-gray-100 border-gray-300 text-gray-700"
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
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-10">
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
                  
                   <button
                        className="w-full py-7 rounded font-bold text-white bg-gradient-to-r bg-[#62a7c7] hover:bg-[#14526d] mt-30"
                        onClick={() => setPaso(3)}
                        >
                        Continuar
                        </button>
                </>
                )}

                 
                {/* Paso 3:  */}
                {paso === 3 && (
                <>
                    <div className=" text-gray-700 text-4xl font-bold mb-20 mt-10 ">
                            Detalles de la reserva
                    </div>
                    <form className="space-y-4">
                        {/* Solo muestra el primer visitante */}
    {visitantes.length > 0 && (() => {
        const vis = visitantes[0];
        const errorNombre = !validateNombre(vis.nombre) && touched[0]?.nombre;
        const errorCorreo = !validateCorreo(vis.correo, true) && touched[0]?.correo;
        const errorCelular = !validateCelular(vis.celular) && touched[0]?.celular;
        return (
            <div className="p-4 flex flex-col gap-4 relative">
                {/* Nombre */}
                <div className="flex flex-col">
                    <label className="block text-xs font-bold text-black mb-1 ">
                        Visitante 1 (Tú)
                    </label>
                    <input
                        type="text"
                        placeholder="Nombre Completo"
                        value={vis.nombre}
                        onChange={(e) => handleVis(0, "nombre", e.target.value)}
                        onBlur={() => handleBlur(0, "nombre")}
                        className={`border p-2 rounded w-full transition-colors duration-150 h-13 ${errorNombre ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-black "}`}
                        required
                    />
                    {renderError("El nombre es obligatorio.", errorNombre)}
                </div>
                {/* Correo */}
                <div className="flex flex-row gap-6">
                  {/* Correo */}
                  <div className="flex flex-col flex-1">
                    <label className="block text-xs font-bold text-black mb-1">
                      Correo Electrónico <span className="text-[10px]">(Principal)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      value={vis.correo}
                      onChange={(e) => handleVis(0, "correo", e.target.value)}
                      onBlur={() => handleBlur(0, "correo")}
                      className={`border p-2 rounded w-full transition-colors duration-150 h-13 ${errorCorreo ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-black"}`}
                      required
                    />
                    {renderError("El correo es obligatorio y debe ser válido.", errorCorreo)}
                  </div>
                  {/* Celular */}
                  <div className="flex flex-col flex-1">
                    <label className="block text-xs font-bold text-black mb-1">
                      Celular WhatsApp
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="\d{10,}"
                      placeholder="Ej. 3312345678"
                      value={vis.celular}
                      onChange={(e) => handleVis(0, "celular", e.target.value)}
                      onBlur={() => handleBlur(0, "celular")}
                      className={`border p-2 rounded w-full transition-colors duration-150 h-13 ${errorCelular ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-black"}`}
                      required
                    />
                    {renderError("El celular debe tener al menos 10 dígitos numéricos.", errorCelular)}
                  </div>
                </div>
                {/* Archivos INE */}
                <div className="flex flex-col col-span-full">
                    <label className="block text-xs font-bold text-black mb-1 mt-4">
                        INE Frente (Imagen o PDF)
                    </label>
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={e => handleIneFileChange(0, 'frente', e.target.files ? e.target.files[0] : null)}
                        className="border p-1 rounded text-xs h-10"
                    />
                    {ineFiles[0]?.frente && (
                        <span className="text-xs text-green-600 ">Archivo listo: {ineFiles[0].frente.name}</span>
                    )}
                    <label className="block text-xs font-bold text-black mb-1 mt-8">
                        INE Reverso (Imagen o PDF)
                    </label>
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={e => handleIneFileChange(0, 'reverso', e.target.files ? e.target.files[0] : null)}
                        className="border p-1 rounded text-xs h-10"
                    />
                    {ineFiles[0]?.reverso && (
                        <span className="text-xs text-green-600">Archivo listo: {ineFiles[0].reverso.name}</span>
                    )}
                </div>
            </div>
        );
    })()}
                    </form>
                    
                    <button
                        className="mt-20 w-full py-7 rounded font-bold text-[#18668b] bg-white hover:bg-[#d6d3d3] border border-[#18668b]"
                        onClick={() => setPaso(1)}
                    >
                        Volver a datos de huéspedes
                    </button>

                    {/* Resumen solo en mobile */}
                    <div className="md:hidden mt-8 p-6 bg-white rounded shadow">
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
                            Disponibilidad confirmada para {visitantes.length} persona{visitantes.length > 1 ? "s" : ""}<br />
                            {ninos > 0 && (
                              <p className="block mt-1 text-gray-500">
                                {ninos} niño{ninos > 1 ? "s" : ""} agregado{ninos > 1 ? "s" : ""}
                              </p>
                            )}
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
                        <div className="mt-4 text-xs text-gray-500">
                          Los pases son válidos para la fecha y hora seleccionada.<br />
                          Pago 100% seguro. Puedes cancelar hasta 48 horas antes de tu visita.
                        </div>
                        {/* Botón finalizar para pago en efectivo en mobile */}
                        {metodoPago === "efectivo" && (
                          <button
                            className={`mt-6 w-full py-2 rounded font-bold text-white ${
                              puedeFinalizarEfectivo
                                ? "bg-[#18668b] hover:bg-[#14526d]"
                                : "bg-gray-300 cursor-not-allowed"
                            }`}
                            onClick={handleContinuar}
                            disabled={!puedeFinalizarEfectivo}
                          >
                            Finalizar y ver resumen para pago en efectivo
                          </button>
                        )}
                    </div>
                </>
                )}
            </section>
             {/* Columna imagen */}
            <aside className="hidden md:flex w-1/2 h-full items-center justify-center bg-[#f8fafc]">
                <div className="relative w-full h-full flex items-center justify-center">
                <img
                    src={imagenes[paso - 1]}
                    alt={pasos[paso - 1].label}
                    className="object-cover w-full h-[945px]  shadow"
                />
                
                </div>
                {paso === 3 && ( 
                    <>
                        <div className="  p-6 mb-6">
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
                            Disponibilidad confirmada para {visitantes.length} persona{visitantes.length > 1 ? "s" : ""}<br />
                            {ninos > 0 && (
                                <p className="block mt-1 text-gray-500">
                                    {ninos} niño{ninos > 1 ? "s" : ""} agregado{ninos > 1 ? "s" : ""}
                                </p>
                            )}
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
                            
                            {/* <button
                                onClick={handleContinuar}
                                disabled={!puedeContinuar}
                                className={`mt-6 w-full py-2 rounded font-bold text-white ${puedeContinuar
                                    ? "bg-[#18668b] hover:bg-[#14526d]"
                                    : "bg-gray-300 cursor-not-allowed"
                                }`}
                            >
                                Continuar con Transporte
                            </button> */}
                            

                            <h4 className="font-bold mb-3 mt-8">Resumen de reserva</h4>
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
                                {/* <label className="flex items-center cursor-pointer">
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
                                </label> */}
                            </div>

                            {/* Pago tarjeta visible solo si es tarjeta */}
                            {/* {!paid && metodoPago === "tarjeta" && (
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
                            {/* Pago realizado 
                            {paid && metodoPago === "tarjeta" && (
                                <div className="mt-4 text-green-700 text-center font-bold">
                                    ¡Pago realizado con éxito!
                                </div>
                            )} */}
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
                            {/* <button
                                onClick={handleSiguiente}
                                disabled={!puedeContinuar}
                                className={`mt-6 w-full py-2 rounded font-bold text-white ${puedeContinuar
                                    ? "bg-[#18668b] hover:bg-[#14526d]"
                                    : "bg-gray-300 cursor-not-allowed"
                                }`}
                            >
                                Continuar a Extras
                            </button> */}
                            <div className="mt-4 text-xs text-gray-500">
                                Los pases son válidos para la fecha y hora seleccionada.<br />
                                Pago 100% seguro. Puedes cancelar hasta 48 horas antes de tu visita.
                            </div>
                        </div>
                    </>
                    )} 


            </aside>
            </main>
            {/* <Footer /> */}
          </div>
    );
}
