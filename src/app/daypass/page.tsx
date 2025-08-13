// Tipo explícito para archivos INE
"use client";

type IneFiles = { frente: File | null, reverso: File | null };
import { JSXElementConstructor, ReactElement, ReactNode, ReactPortal, useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import toast, {Toaster} from "react-hot-toast";
import {FiPlus, FiTrash2} from "react-icons/fi";
import Stepper from "@/components/Stepper";
import axios from "axios";
import { Country, State, City } from "country-state-city";

const CODIGO_PROMO = "PROMO100";
const DESCUENTO_PROMO = 100;
const PRECIO_PASE = 350;


// function getPrecioPase(fecha: string, categoria: string = "general") {
//     // Obtén el día de la semana: 0=Domingo, 1=Lunes, ..., 6=Sábado
//     const diaSemana = new Date(fecha).getDay();
//     // Lunes a Jueves: 1-4, Viernes a Niños menores de 13 años entran gratis.Domingo: 0, 5, 6
//     if ([1, 2, 3, 4].includes(diaSemana)) {
//         // Lunes a Jueves
//         switch (categoria) {
//             case "general": return 350;
//             case "grupos": return 325;
//             case "inapam": return 300;
//             case "convenios": return 300;
//             case "locales": return 250;
//             case "discapacidad": return 250;
//             default: return 350;
//         }
//     } else {
//         // Viernes a Domingo
//         switch (categoria) {
//             case "general": return 420;
//             case "grupos": return 390;
//             case "inapam": return 360;
//             case "convenios": return 360;
//             case "locales": return 300;
//             case "discapacidad": return 300;
//             default: return 420;
//         }
//     }
// }

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

    const [paises, setPaises] = useState<string[]>([]);
    const [estados, setEstados] = useState<string[]>([]);
    const [ciudades, setCiudades] = useState<string[]>([]);

useEffect(() => {
  async function cargarPaises() {
    try {
      const res = await fetch("https://countriesnow.space/api/v0.1/countries/positions");
      const data = await res.json();
      const nombres = Array.isArray(data.data)
        ? data.data.map((p: any) => p.name)
        : [];
      setPaises(nombres);
    } catch (error) {
      console.error("Error al cargar países:", error);
    }
  }

  async function detectarUbicacionPorIP() {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();

      const pais = data.country_name;      // ej. "Mexico"
      const estado = data.region;          // ej. "Jalisco"
      const ciudad = data.city;            // ej. "Zapopan"

      console.log("Detectado por IP:", pais, estado, ciudad);

      // Cargamos estados y ciudades según país/estado detectados
      await fetchEstadosDePais(pais);
      await fetchCiudadesDeEstado(pais, estado);

      // Asignamos la ubicación detectada al visitante 0
      setVisitantes((prev) => {
        const copia = [...prev];
        copia[0].pais = pais;
        copia[0].estado = estado;
        copia[0].ciudad = ciudad;
        return copia;
      });
    } catch (error) {
      console.error("Error al detectar ubicación por IP:", error);
    }
  }

  cargarPaises();
  detectarUbicacionPorIP();
}, []);

const fetchEstadosDePais = async (paisNombre: string) => {
  if (!paisNombre) return;

  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: paisNombre }),
    });

    const data = await res.json();

    if (data.data && Array.isArray(data.data.states)) {
      const estados = data.data.states.map((s: any) => s.name);
      setEstados(estados);
    } else {
      console.warn("No se encontraron estados para:", paisNombre);
      setEstados([]);
    }
  } catch (error) {
    console.error("Error al cargar estados:", error);
    setEstados([]);
  }
};

const fetchCiudadesDeEstado = async (paisNombre: string, estadoNombre: string) => {
  if (!paisNombre || !estadoNombre) return;

  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: paisNombre, state: estadoNombre }),
    });

    const data = await res.json();

    if (Array.isArray(data.data)) {
      setCiudades(data.data);
    } else {
      console.warn(`No se encontraron ciudades para ${estadoNombre}, ${paisNombre}`);
      setCiudades([]);
    }
  } catch (error) {
    console.error("Error al cargar ciudades:", error);
    setCiudades([]);
  }
};

const handlePaisChange = (idx: number, paisNombre: string) => {
  setVisitantes((prev) => {
    const copia = [...prev];
    copia[idx].pais = paisNombre;
    copia[idx].estado = "";
    copia[idx].ciudad = "";
    return copia;
  });

  fetchEstadosDePais(paisNombre);
};

const handleEstadoChange = (idx: number, estadoNombre: string) => {
  setVisitantes((prev) => {
    const copia = [...prev];
    const paisActual = copia[idx].pais; // usamos la copia ya actualizada
    copia[idx].estado = estadoNombre;
    copia[idx].ciudad = "";

    fetchCiudadesDeEstado(paisActual, estadoNombre);

    return copia;
  });
};
const handleCiudadChange = (idx: number, ciudadNombre: string) => {
  setVisitantes((prev) => {
    const copia = [...prev];
    copia[idx].ciudad = ciudadNombre;
    return copia;
  });
};





    useEffect(() => {
        localStorage.clear();
    }, []);
    const [visitantes, setVisitantes] = useState([
        {nombre: "", apellido:"", correo: "", celular: "", cumple: "", ciudad: "", estado:"", pais:"",tipo: "general",},
    ]);
    const [touched, setTouched] = useState([
          {
    nombre: false,
    apellido: false,
    correo: false,
    celular: false,
    cumple: false,
    ciudad: false,
    estado: false,
    pais: false,
    ine: false,
  },
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
    const [selectedTime, setSelectedTime] = useState(""); // Inicializar vacío para forzar selección
    const [errores, setErrores] = useState(
    visitantes.map(() => ({
        nombre: "",
        apellido:"",
        correo: "",
        celular: "",
        cumple: "",
        ciudad: "",
        estado: "",
        pais: ""
    }))
    );


    function validateNombre(nombre: string) {
        return nombre.trim().length > 0;
    }
     function validateApellido(apellido: string) {
        return apellido.trim().length > 0;
    }

    function validateCorreo(correo: string, obligatorio: boolean) {
        if (!correo.trim() && !obligatorio) return true;
        return regexEmail.test(correo.trim());
    }

    function validateCelular(celular: string) {
        return /^\d{10,}$/.test(celular.trim());
    }
    const validateCumple = (fecha: string) => fecha.trim() !== "";
    const validateCiudad = (ciudad: string) => ciudad.trim() !== "";
    const validateEstado = (estado: string) => estado.trim() !== "";
    const validatePais = (pais: string) => pais.trim() !== "";
    const validateIne = (ine: string) => ine.trim() !== "";

    // Función para verificar si un horario ya pasó cuando es el día de hoy
    function isHorarioPasado(horario: string): boolean {
        const fechaSeleccionada = new Date(year, mes, selectedDay);
        const hoy = new Date();

        // Si no es el día de hoy, el horario está disponible
        if (fechaSeleccionada.toDateString() !== hoy.toDateString()) {
            return false;
        }

        // Convertir el horario a formato 24 horas para comparar
        const [tiempo, periodo] = horario.split(' ');
        const [horas, minutos] = tiempo.split(':').map(Number);

        let horaEn24 = horas;
        if (periodo === 'PM' && horas !== 12) {
            horaEn24 += 12;
        } else if (periodo === 'AM' && horas === 12) {
            horaEn24 = 0;
        }

        // Crear fecha con el horario seleccionado
        const fechaHorario = new Date(year, mes, selectedDay, horaEn24, minutos);

        // Comparar con la hora actual
        return fechaHorario <= hoy;
    }

    // Función para verificar si se puede continuar al paso 3
    function puedeAvanzarPaso2(): boolean {
        console.log('Debug puedeAvanzarPaso2:', {
            selectedDay,
            selectedTime,
            selectedTimeLength: selectedTime?.length,
            isEmpty: selectedTime === "" || selectedTime === null || selectedTime === undefined
        });

        // Verificar que hay un día y horario seleccionado
        if (!selectedDay || !selectedTime || selectedTime.trim() === "") {
            return false;
        }

        // Verificar que el horario seleccionado no haya pasado
        return !isHorarioPasado(selectedTime);
    }

    const puedeContinuar =
        visitantes.every(
            (v, i) =>
                validateNombre(v.nombre) &&
                validateApellido(v.apellido) &&
                validateCelular(v.celular) &&
                validateCorreo(v.correo, i === 0)
        ) &&
        selectedDay > 0 &&
        selectedTime;
type Visitante = {
  nombre: string;
  apellido: string;
  correo: string;
  celular: string;
  cumple: string;
  ciudad: string;
  estado: string;
  pais: string;
  tipo: "adulto" | "nino"; // ← agrega esto
};

    // Agregar visitante
    const handleAddVisitante = () => {
        if (visitantes.length >= 10) return;
        setVisitantes((prev) => [
            ...prev,
            {nombre: "", apellido:"", correo: "", celular: "", cumple: "", ciudad: "", estado:"", pais:"",tipo: "adulto", },
        ]);
        setTouched((prev) => [
            ...prev,
              {
    nombre: false,
    apellido: false,
    correo: false,
    celular: false,
    cumple: false,
    ciudad: false,
    estado: false,
    pais: false,
    ine: false,
  },
        ]);
        setIneFiles((prev) => [
            ...prev,
            { frente: null, reverso: null }
        ]);
    };

    // Cambios por visitante
    const handleVis = (idx: number, campo: 'nombre' |'apellido'| 'correo' | 'celular'| 'cumple'| 'ciudad' | 'estado'| 'pais', valor: string) => {
        setVisitantes((prev) => {
            const copia = [...prev];
            copia[idx][campo] = valor;
            return copia;
        });
    };

  type Campo =
  | 'nombre'
  |'apellido'
  | 'correo'
  | 'celular'
  | 'cumple'
  | 'ciudad'
  | 'estado'
  | 'pais'
  | 'ine';

const handleBlur = (idx: number, campo: Campo) => {
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
    const fechaSeleccionada = `${year}-${(mes + 1).toString().padStart(2, "0")}-${selectedDay.toString().padStart(2, "0")}`;
    const fechaDisplay = formatFechaEs(year, mes, selectedDay);

    const [adultos, setAdultos] = useState(1);
    const [ninos, setNinos] = useState(0);
    const [adultos60, setAdultos60] = useState(0);

    const cantidadAdultos = adultos;
    const cantidadAdultos60 = adultos60;
    const cantidadNinos = ninos;
    const cantidadMenores2 = 0; // Si manejas menores de 2 años, ajusta aquí
    const esGrupo = (cantidadAdultos + cantidadAdultos60) >= 12;


const precioAdulto = getPrecioPorTipo(fechaSeleccionada, "adulto", esGrupo);
const precioAdulto60 = getPrecioPorTipo(fechaSeleccionada, "adulto60", esGrupo);
const precioNino = getPrecioPorTipo(fechaSeleccionada, "nino", esGrupo);
const precioMenor2 = getPrecioPorTipo(fechaSeleccionada, "menor2", esGrupo);



const subtotalAdultos = cantidadAdultos * precioAdulto;
const subtotalAdultos60 = cantidadAdultos60 * precioAdulto60;
const subtotalNinos = cantidadNinos * precioNino;
const subtotalMenores2 = cantidadMenores2 * precioMenor2;

const subtotal = subtotalAdultos + subtotalAdultos60 + subtotalNinos + subtotalMenores2;
const total = Math.max(subtotal - descuento, 0);
// Porcentajes
const porcentajePlataforma = 0.05;  // 5%
const porcentajeTerminal = 0.05;    // 5% 
// const porcentajeIVA = 0.16;         // 16%

// Descuento aplicado al subtotal
const subtotalConDescuento = Math.max(subtotal - descuento, 0);

// Montos adicionales
const montoPlataforma = subtotalConDescuento * porcentajePlataforma;
const montoTerminal = subtotalConDescuento * porcentajeTerminal;
// const montoIVA = subtotalConDescuento * porcentajeIVA;

// Total final
const totalConCargos = subtotalConDescuento + montoPlataforma + montoTerminal;
function calcularCortesias(totalAdultos: number): number {
  if (totalAdultos >= 60) return 4;
  if (totalAdultos >= 45) return 3;
  if (totalAdultos >= 30) return 2;
  if (totalAdultos >= 15) return 1;
  return 0;
}
const totalAdultosUnicos = cantidadAdultos + cantidadAdultos60;
const cortesias = calcularCortesias(totalAdultosUnicos);


    // Prepara los datos del formulario para enviar por correo electrónico
    function prepararDatosParaCorreo() {
        const data = {
            visitantes: visitantes.map((v, idx) => ({
                nombre: v.nombre,
                apellido: v.apellido,
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
            `Visitante ${idx + 1}:\n- Nombre: ${v.nombre} \n- Apellido: ${v.apellido}\n- Correo: ${v.correo}\n- Celular: ${v.celular}\n`
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

    // async function handleContinuar() {
    //     const datos = prepararDatosParaCorreo();

    //     // Armado exacto de FormData
    //     const formData = new FormData();

    //     // Visitor principal
    //     const principal = datos.visitantes[0];
    //     formData.append("visitor[name]", principal.nombre);
    //     formData.append("visitor[lastname]", principal.apellido);
    //     formData.append("visitor[email]", principal.correo);
    //     formData.append("visitor[phone]", principal.celular);
    //     formData.append("visitor[type]", "general");

    //     // INE archivos (si existen)
    //     if (ineFiles[0]?.frente) formData.append("idcard_front", ineFiles[0].frente, ineFiles[0].frente.name);
    //     if (ineFiles[0]?.reverso) formData.append("idcard_back", ineFiles[0].reverso, ineFiles[0].reverso.name);

    //     // Fecha y hora combinada
    //     const fechaHora = datos.fecha + " " + (datos.horario || "11:00 AM");
    //     formData.append("reservation_at", fechaHora);

    //     // Totales
    //     formData.append("totals[total]", String(datos.total));

    //     // Promo como JSON vacío o valor real si existe
    //     formData.append("promo", datos.promoAplicado ? JSON.stringify({ code: datos.codigoPromo }) : "[]");

    //     // Todos los visitantes
    //     datos.visitantes.forEach((v, idx) => {
    //         formData.append(`visitors[${idx}][name]`, v.nombre);
    //         formData.append(`visitors[${idx}][lastname]`, v.apellido);
    //         formData.append(`visitors[${idx}][email]`, v.correo);
    //         formData.append(`visitors[${idx}][phone]`, v.celular);
    //         formData.append(`visitors[${idx}][type]`, "general");
    //     });

    //     try {
    //         const response = await fetch("/api/reservations", {
    //             method: "POST",
    //             body: formData,
    //         });

    //         if (!response.ok) {
    //             throw new Error("Error en el envío de la reservación");
    //         }

    //         alert("¡Reservación enviada correctamente!");
    //         window.location.href = "/daypass/resumen";
    //     } catch (error) {
    //         alert("Ocurrió un error al enviar la reservación. Intenta de nuevo.");
    //         console.error(error);
    //     }
    // }

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
      validateNombre(visitantes[0]?.apellido) &&
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


    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const prevMonth = mes === 0 ? 11 : mes - 1;
    const prevYear = mes === 0 ? year - 1 : year;
    const lastDayPrevMonth = new Date(prevYear, prevMonth + 1, 0); // último día del mes anterior
    lastDayPrevMonth.setHours(0,0,0,0);

    const puedeIrMesAnterior = lastDayPrevMonth >= hoy;

  async function handleContinuar() {
  const formData = new FormData();

  // Tipado explícito y manejo de nombre completo
  function separarNombreApellido(nombreCompleto: string): [string, string] {
    const partes = nombreCompleto.trim().split(" ");
    const nombre = partes.shift() || "Nombre";
    const apellido = partes.join(" ") || "Apellido";
    return [nombre, apellido];
  }

  const responsable = visitantes[0];
  const [nombre, apellido] = separarNombreApellido(responsable.nombre);

  // Información del cliente principal
  formData.append("client[name]", nombre);
  formData.append("client[lastname]", apellido);
  formData.append("client[email]", responsable.correo || "");
  formData.append("client[phone]", responsable.celular || "");
  formData.append("client[birthdate]", responsable.cumple || "");
  formData.append("visit_date", fechaSeleccionada || "");
  formData.append("origin_city", responsable.ciudad || "");
  formData.append("payment_method", metodoPago || "");

  // Información de cada visitante
  visitantes.forEach((v, idx) => {
    const [n, a] = separarNombreApellido(v.nombre);

    formData.append(`visitors[${idx}][name]`, n);
    formData.append(`visitors[${idx}][lastname]`, a);
    formData.append(`visitors[${idx}][birthdate]`, v.cumple || "");
    formData.append(`visitors[${idx}][email]`, v.correo || "");
    formData.append(`visitors[${idx}][phone]`, v.celular || "");
    formData.append(`visitors[${idx}][visitor_type_id]`, v.tipo === "nino" ? "2" : "1");
    formData.append(`visitors[${idx}][checkin_time]`, selectedTime?.substring(0, 5) || "");

    if (idx === 0) {
      formData.append(`visitors[${idx}][document_type]`, "INE");

      if (ineFiles[idx]?.frente) {
        formData.append(`visitors[${idx}][document_front]`, ineFiles[idx].frente, ineFiles[idx].frente.name);
      }

      if (ineFiles[idx]?.reverso) {
        formData.append(`visitors[${idx}][document_back]`, ineFiles[idx].reverso, ineFiles[idx].reverso.name);
      }
    }
  });

  // Debug: revisar lo que se está enviando
  for (const pair of formData.entries()) {
    console.log(pair[0] + ": ", pair[1]);
  }

  try {
    const res = await fetch("https://lasjaras-api.kerveldev.com/api/reservations", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    const json = await res.json();

    if (!res.ok) {
      console.error("Error al enviar reserva:", json);
      alert("Error al enviar la reservación. Revisa los campos e intenta nuevamente.");
      return;
    }

    console.log("Reserva enviada correctamente:", json);
    window.location.href = "/daypass/resumen";
  } catch (error) {
    console.error("Error inesperado:", error);
    alert("Ocurrió un error al procesar la reservación.");
  }
}


function getPrecioPorTipo(
  fecha: string,
  tipo: "adulto" | "adulto60" | "nino" | "menor2",
  esGrupo: boolean = false
) {
  const [year, month, day] = fecha.split("-");
  const fechaLocal = new Date(Number(year), Number(month) - 1, Number(day));
  const diaSemana = fechaLocal.getDay(); // 0=Domingo, ..., 6=Sábado

  const esLunesAJueves = diaSemana >= 1 && diaSemana <= 4;

  if (tipo === "adulto") {
    if (esGrupo) return esLunesAJueves ? 325 : 390;
    return esLunesAJueves ? 350 : 420;
  }

  if (tipo === "adulto60") {
    if (esGrupo) return esLunesAJueves ? 300 : 360;
    return esLunesAJueves ? 300 : 360;
  }

  if (tipo === "nino") return 70;
  if (tipo === "menor2") return 0;

  return 0;
}



// ------------------------------------------------------------ RETURN --------------------------------------------------------------
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
                        <div className="text-gray-700 text-5xl font-bold mb-6 mt-2">
                            ¿Cuántos visitantes son?
                        </div>
                        <p className="mb-10 text-gray-600 text-2xl">
                        El precio varía según el horario. Niños menores de 2 años entran gratis.
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
                                                    return nuevo.length === 0 ? [{ nombre: "", apellido:"", correo: "", celular: "", cumple: "", ciudad:"", estado:"", pais:"",tipo: "adulto",}] : nuevo;
                                                });
                                                setTouched((prev) => {
                                                    const nuevo = prev.slice(0, prev.length - 1);
                                                    return nuevo.length === 0 ? [ {nombre: false, apellido:false, correo: false, celular: false, cumple: false, ciudad: false, estado: false, pais: false, ine: false,}] : nuevo;
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

                                                setAdultos(adultos + 1);
                                                setVisitantes((prev) => [...prev, { nombre: "", apellido:"", correo: "", celular: "", cumple:"", ciudad:"",estado:"",pais:"",tipo: "adulto",}]);
                                                setTouched((prev) => [...prev, {nombre: false, apellido:false, correo: false, celular: false, cumple: false, ciudad: false, estado: false, pais: false, ine: false,}]);
                                                setIneFiles((prev) => [...prev, { frente: null, reverso: null }]);

                                        }}
                                    >+</button>
                                </div>
                            </div>
                             {/* Adultos 60+ */}
                            <div className="flex items-center justify-between bg-white rounded shadow p-5 mb-10 ">
                                <span className="font-semibold text-lg">Adultos 60 +</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="px-3 py-1 rounded text-xl font-bold bg-gray-200 hover:bg-[#302f2f] text-black hover:text-white"
                                        onClick={() => {
                                            if (adultos60 > 0) {
                                                setAdultos60(adultos60 - 1);
                                                setVisitantes((prev) => {
                                                    const nuevo = prev.slice(0, prev.length - 1);
                                                    return nuevo;
                                                });
                                                setTouched((prev) => {
                                                    const nuevo = prev.slice(0, prev.length - 1);
                                                    return nuevo.length === 0 ? [{nombre: false, apellido: false, correo: false, celular: false, cumple: false, ciudad: false, estado: false, pais: false, ine: false,}] : nuevo;
                                                });
                                                setIneFiles((prev) => {
                                                    const nuevo = prev.slice(0, prev.length - 1);
                                                    return nuevo.length === 0 ? [{ frente: null, reverso: null }] : nuevo;
                                                });

                                            }
                                        }}
                                        disabled={adultos60 <= 0}

                                    >-</button>
                                    <span className="text-xl font-bold">{adultos60}</span>
                                    <button
                                        type="button"
                                        className="px-3 py-1 rounded text-xl font-bold bg-gray-200 hover:bg-[#302f2f] text-black hover:text-white"
                                        onClick={() => {

                                                setAdultos60(adultos60 + 1);
                                                setVisitantes((prev) => [...prev, { nombre: "", apellido:"", correo: "", celular: "" , cumple:"", ciudad:"", estado:"", pais:"",tipo: "adulto", }]);
                                                setTouched((prev) => [...prev, {nombre: false, apellido:false, correo: false, celular: false, cumple: false, ciudad: false, estado: false, pais: false, ine: false,}]);
                                                setIneFiles((prev) => [...prev, { frente: null, reverso: null }]);

                                        }}
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
                                       onClick={() => {
                                        if (ninos > 0) {
                                            setNinos(ninos - 1);

                                            // Filtrar visitantes para eliminar el último niño
                                            setVisitantes((prev) => {
                                                const sinUltimoNino = [...prev];
                                                const idxUltimoNino = [...prev].map(v => v.tipo).lastIndexOf("nino");
                                                if (idxUltimoNino !== -1) sinUltimoNino.splice(idxUltimoNino, 1);
                                                return sinUltimoNino;
                                            });
                                        }
                                    }}
                                        disabled={ninos <= 0}
                                    >-</button>
                                    <span className="text-xl font-bold">{ninos}</span>
                                    <button
                                        type="button"
                                        className="px-3 py-1 rounded text-xl font-bold bg-gray-200 hover:bg-[#302f2f] text-black hover:text-white"
                                        onClick={() => {
                                            if (ninos < adultos * 2) {
                                                setNinos(ninos + 1);
                                                setVisitantes((prev) => [
                                                    ...prev,
                                                    { nombre: "",apellido: "", correo: "", celular: "" , cumple:"", ciudad:"", estado:"", pais:"",tipo: "nino" } // Solo nombre y cumpleaños para niños
                                                ]);
                                                setTouched((prev) => [
                                                    ...prev,
                                                    {nombre: false,apellido: false, correo: false, celular: false, cumple: false, ciudad: false, estado: false, pais: false, ine: false,}
                                                ]);
                                                setIneFiles((prev) => [
                                                    ...prev,
                                                    { frente: null, reverso: null }
                                                ]);
                                            }
                                        }}
                                        disabled={ninos >= adultos * 2}
                                    >+</button>
                                    </div>
                                </div>
                        </div>
                        {ninos > 0 && (
                        <div className="bg-[#ffff0009] border-l-4 border-yellow-400 p-4 -mb-20 text-sm text-gray-700 mt-2">
                            Los niños de 2 a 13 años deben estar acompañados por un adulto. No incluye acceso al jardín termal, acceso GRATIS para niños menores de 2 años.
                        </div>
                        )}

                         {adultos60 > 0 && (
                        <div className="bg-[#ffff0009] border-l-4 border-yellow-400 p-4 -mb-41 text-sm text-gray-700 mt-23">
                           Los adultos mayores de 60 años de edad deberán presentar tarjeda del INAPAM actualizada, de lo contrario se cobrará la entrada a precio regular.
                        </div>
                        )}
                         {adultos + adultos60 >= 12 && (
                        <div className="bg-[#ffff0009] border-l-4 border-yellow-400 p-4 -mb-49 text-sm text-gray-700 mt-44">
                           Al reservar para 12 o más adultos, se aplicará automáticamente una tarifa preferencial. Para grupos de 15 personas o más, se otorgarán cortesías proporcionales según la cantidad total de asistentes (los precios y cortesias se veran reflejados en el calculo final).

                        </div>
                        )}
                        <button
                        className={`w-full py-7 rounded font-bold text-white mt-50 transition-colors ${
                            puedeAvanzarPaso2()
                                ? "bg-gradient-to-r bg-[#62a7c7] hover:bg-[#14526d] cursor-pointer"
                                : "bg-gray-400 cursor-not-allowed"
                        }`}
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
                      <p className=" mb-10 text-gray-800 text-base font-bold">
                        Selecciona tu horario de llegada.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-10">
                            {horarios.map((hora) => {
                                const horarioPasado = isHorarioPasado(hora);
                                return (
                                    <button
                                        key={hora}
                                        type="button"
                                        disabled={horarioPasado}
                                        className={`rounded border py-2 font-semibold text-sm w-full transition
                                            ${horarioPasado
                                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                : selectedTime === hora
                                                    ? "bg-[#18668b] text-white border-[#18668b]"
                                                    : "bg-white border-gray-300 hover:bg-gray-100 text-gray-800"
                                            }
                                        `}
                                        onClick={() => !horarioPasado && setSelectedTime(hora)}
                                    >
                                        {hora} {horarioPasado && "(No disponible)"}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    </div>

                   <button
                        className={`w-full py-7 rounded font-bold text-white mt-30 transition-colors ${
                            puedeAvanzarPaso2()
                                ? "bg-gradient-to-r bg-[#62a7c7] hover:bg-[#14526d] cursor-pointer"
                                : "bg-gray-400 cursor-not-allowed"
                        }`}
                        onClick={() => puedeAvanzarPaso2() && setPaso(3)}
                        disabled={!puedeAvanzarPaso2()}
                        >
                        Continuar
                        </button>
                </>
                )}


                {/* Paso 3:  */}
                {paso === 3 && (
                    <div className="relative h-[800px] overflow-hidden">
                        <div className="overflow-y-auto h-full">

                            <div className="text-gray-700 text-4xl font-bold mb-5 mt-5 overflow-hidden">
                            Detalles de la reserva
                            </div>
                            <form className="space-y-4">
                            {visitantes.map((vis, idx) => {
                                // Es niño si no tiene correo ni celular
                                const esNino = vis.tipo === "nino";
                                const nombreValido = validateNombre(vis.nombre);
                                const apellidoValido = validateNombre(vis.apellido);
                                const correoValido = validateCorreo(vis.correo, idx === 0); // solo obligatorio para el primer visitante
                                const celularValido = validateCelular(vis.celular);
                                const cumpleValido = validateCumple(vis.cumple);
                                const ciudadValido = validateCiudad(vis.ciudad);
                                const estadoValido = validateEstado(vis.estado);
                                const paisValido = validatePais(vis.pais);

                                return (
                                <div key={idx} className="p-4 flex flex-col gap-4 relative  rounded border">
                                     <div className="flex flex-row gap-6">
                                    {/* Nombre */}
                                    <div className="flex flex-col flex-1">
                                   <label className="block text-xs font-bold text-black mb-1">
                                    {`Visitante ${idx + 1} ${esNino ? "(Niño)" : idx === 0 ? "(Tú)" : ""}`}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nombre/s"
                                        value={vis.nombre}
                                        onChange={(e) => handleVis(idx, "nombre", e.target.value)}
                                         onBlur={() => handleBlur(idx, "nombre")}
                                        className={`border p-2 rounded w-full transition-colors duration-150 h-13 ${ touched[idx]?.nombre && !nombreValido ? "border-red-500" : "border-gray-300"}`}
                                        required
                                    />
                                    {touched[idx]?.nombre && !nombreValido && (
                                        <p className="text-red-600 text-sm mt-1">El nombre es obligatorio.</p>
                                    )}
                                    </div>
                                      {/* Apellido */}
                                    <div className="flex flex-col flex-1">
                                   <label className="block text-xs font-bold text-black mb-1">
                                    Apellidos
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Apellidos"
                                        value={vis.apellido}
                                        onChange={(e) => handleVis(idx, "apellido", e.target.value)}
                                         onBlur={() => handleBlur(idx, "apellido")}
                                        className={`border p-2 rounded w-full transition-colors duration-150 h-13 ${ touched[idx]?.apellido && !apellidoValido ? "border-red-500" : "border-gray-300"}`}
                                        required
                                    />
                                    {touched[idx]?.apellido && !apellidoValido && (
                                        <p className="text-red-600 text-sm mt-1">Este campo es obligatorio.</p>
                                    )}
                                    </div>
                                    </div>
                                    {/* Solo adultos: correo y celular */}
                                    {!esNino && (
                                    <div className="flex flex-row gap-6">
                                        {/* Correo */}
                                        <div className="flex flex-col flex-1">
                                        <label className="block text-xs font-bold text-black mb-1">
                                            Correo Electrónico <span className="text-[10px]">{idx === 0 ? "(Principal)" : "(opcional)"}</span>
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="Correo electrónico"
                                            value={vis.correo}
                                            onChange={(e) => handleVis(idx, "correo", e.target.value)}
                                            onBlur={() => handleBlur(idx, "correo")}
                                            className={`border p-2 rounded w-full transition-colors duration-150 h-13 ${
                                            touched[idx]?.correo && !correoValido ? "border-red-500" : "border-gray-300"
                                            }`}
                                        />
                                        {touched[idx]?.correo && !correoValido && (
                                            <p className="text-red-600 text-sm mt-1">Correo electrónico inválido.</p>
                                        )}
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
                                            onChange={(e) => handleVis(idx, "celular", e.target.value)}
                                            onBlur={() => handleBlur(idx, "celular")}
                                            className={`border p-2 rounded w-full transition-colors duration-150 h-13 ${
                                            touched[idx]?.celular && !celularValido ? "border-red-500" : "border-gray-300"
                                            }`}
                                        />
                                        {touched[idx]?.celular && !celularValido && (
                                            <p className="text-red-600 text-sm mt-1">Debe tener al menos 10 dígitos.</p>
                                        )}
                                        </div>
                                    </div>
                                    )}
                                    {/* Cumpleaños */}
                                    <div className="flex flex-col flex-1">
                                    <label className="block text-xs font-bold text-black mb-1">
                                        Fecha de nacimiento
                                    </label>
                                    <input
                                        type="date"
                                        value={vis.cumple}
                                        onChange={(e) => handleVis(idx, "cumple", e.target.value)}
                                        onBlur={() => handleBlur(idx, "cumple")}
                                        className={`border p-2 rounded w-full transition-colors duration-150 h-13 ${
                                        touched[idx]?.cumple && !cumpleValido ? "border-red-500" : "border-gray-300"
                                        }`}
                                    />
                                    {touched[idx]?.cumple && !cumpleValido && (
                                        <p className="text-red-600 text-sm mt-1">Selecciona una fecha válida.</p>
                                    )}
                                    </div>

                                    {/* Solo visitante 1: ciudad, estado, país */}
                                    {idx === 0 && !esNino && (
                                    <>
                                        <div className="flex flex-row gap-6">
                                            {/* Ciudad */}
                                            <div className="flex flex-col flex-1">
                                            <label className="block text-xs font-bold text-black mb-1">Ciudad</label>
                                            <select
                                                value={vis.ciudad}
                                                onChange={(e) => handleCiudadChange(idx, e.target.value)}
                                                onBlur={() => handleBlur(idx, "ciudad")}
                                                className={`border p-2 rounded w-full transition-colors duration-150 h-13 text-black ${
                                                touched[idx]?.ciudad && !ciudadValido ? "border-red-500" : "border-gray-300"
                                                }`}
                                                disabled={!vis.estado}
                                            >
                                                <option value="">Selecciona ciudad</option>
                                                {(ciudades ?? []).map((ciudad) => (
                                                <option key={ciudad} value={ciudad}>
                                                    {ciudad}
                                                </option>
                                                ))}
                                            </select>
                                            {touched[idx]?.ciudad && !ciudadValido && (
                                                <p className="text-red-600 text-sm mt-1">La ciudad es obligatoria.</p>
                                            )}
                                            </div>

                                            {/* Estado */}
                                            <div className="flex flex-col flex-1">
                                            <label className="block text-xs font-bold text-black mb-1">Estado</label>
                                            <select
                                                value={vis.estado}
                                                onChange={(e) => handleEstadoChange(idx, e.target.value)}
                                                onBlur={() => handleBlur(idx, "estado")}
                                                className={`border p-2 rounded w-full transition-colors duration-150 h-13 text-black ${
                                                touched[idx]?.estado && !estadoValido ? "border-red-500" : "border-gray-300"
                                                }`}
                                                disabled={!vis.pais}
                                            >
                                                <option value="">Selecciona estado</option>
                                                {(estados ?? []).map((estado) => (
                                                <option key={estado} value={estado}>
                                                    {estado}
                                                </option>
                                                ))}
                                            </select>
                                            {touched[idx]?.estado && !estadoValido && (
                                                <p className="text-red-600 text-sm mt-1">El estado es obligatorio.</p>
                                            )}
                                            </div>

                                                {/* País */}
                                            <div className="flex flex-col flex-1">
                                            <label className="block text-xs font-bold text-black mb-1">País</label>
                                            <select
                                                value={vis.pais}
                                                onChange={(e) => handlePaisChange(idx, e.target.value)}
                                                onBlur={() => handleBlur(idx, "pais")}
                                                className={`border p-2 rounded w-full transition-colors duration-150 h-13 text-black ${
                                                touched[idx]?.pais && !paisValido ? "border-red-500" : "border-gray-300"
                                                }`}
                                            >
                                                <option value="">Selecciona país</option>
                                                {(paises ?? []).map((pais) => (
                                                <option key={pais} value={pais}>
                                                    {pais}
                                                </option>
                                                ))}
                                            </select>
                                            {touched[idx]?.pais && !paisValido && (
                                                <p className="text-red-600 text-sm mt-1">El país es obligatorio.</p>
                                            )}
                                            </div>
                                        </div>
                                     {/* INE Frente */}
                                        <div className="flex flex-row items-start gap-4 mt-4">
                                        <div className="flex flex-col flex-1">
                                            <label className="block text-xs font-bold text-black mb-1">
                                            INE Frente (Imagen o PDF)
                                            </label>
                                            <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={e =>
                                                handleIneFileChange(idx, 'frente', e.target.files ? e.target.files[0] : null)
                                            }
                                            className="border p-1 rounded text-xs h-10"
                                            />
                                            {ineFiles[idx]?.frente && (
                                            <span className="text-xs text-green-600 mt-1">
                                                Archivo listo: {ineFiles[idx].frente.name}
                                            </span>
                                            )}
                                        </div>

                                        {/* Visualizador a la derecha */}
                                        <div>
                                            {ineFiles[idx]?.frente?.type?.startsWith("image/") && (
                                            <img
                                                src={URL.createObjectURL(ineFiles[idx].frente)}
                                                alt="Previsualización INE Frente"
                                                className="max-w-[350px] rounded border"
                                            />
                                            )}

                                            {ineFiles[idx]?.frente?.type === "application/pdf" && (
                                            <a
                                                href={URL.createObjectURL(ineFiles[idx].frente)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 text-xs underline"
                                            >
                                                Ver PDF INE Frente
                                            </a>
                                            )}
                                        </div>
                                        </div>

                                        {/* INE Reverso */}
                                        <div className="flex flex-row items-start gap-4 mt-4">
                                        <div className="flex flex-col flex-1">
                                            <label className="block text-xs font-bold text-black mb-1">
                                            INE Reverso (Imagen o PDF)
                                            </label>
                                            <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={e =>
                                                handleIneFileChange(idx, 'reverso', e.target.files ? e.target.files[0] : null)
                                            }
                                            className="border p-1 rounded text-xs h-10"
                                            />
                                            {ineFiles[idx]?.reverso && (
                                            <span className="text-xs text-green-600 mt-1">
                                                Archivo listo: {ineFiles[idx].reverso.name}
                                            </span>
                                            )}
                                        </div>

                                        {/* Visualizador a la derecha */}
                                        <div>
                                            {ineFiles[idx]?.reverso?.type?.startsWith("image/") && (
                                            <img
                                                src={URL.createObjectURL(ineFiles[idx].reverso)}
                                                alt="Previsualización INE Reverso"
                                                className="max-w-[350px] rounded border"
                                            />
                                            )}

                                            {ineFiles[idx]?.reverso?.type === "application/pdf" && (
                                            <a
                                                href={URL.createObjectURL(ineFiles[idx].reverso)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 text-xs underline"
                                            >
                                                Ver PDF INE Reverso
                                            </a>
                                            )}
                                        </div>
                                        </div>
                                    </>
                                    )}
                                </div>
                                );
                            })}
                            </form>

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
                                    Disponibilidad confirmada para {visitantes.length} pase{visitantes.length > 1 ? "s" : ""}<br />

                                </div>
                                {cortesias > 0 && (
                                <div className="text-sm text-gray-500 mb-4">
                                    
                                    {cortesias} Cortesía{cortesias > 1 ? "s" : ""} agregada{cortesias > 1 ? "s" : ""} gratis
                                    
                                </div>
                                )}
                                <div className="flex flex-col gap-1 text-sm mb-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Precio Adultos 14+</span>
                                        <span>${precioAdulto} MXN</span>
                                    </div>
                                    {cantidadAdultos60 > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>Precio Adultos 60+</span>
                                        <span>${precioAdulto60} MXN</span>
                                    </div>
                                    )}
                                    {cantidadNinos > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>PrecioNiños 2-13</span>
                                        <span>$70 MXN</span>
                                    </div>
                                    )}
                                </div>
                                 <div className="flex justify-between text-sm mb-2">
                                <span>Plataforma (5%)</span>
                                <span>${montoPlataforma.toFixed(2)} MXN</span>
                            </div> <div className="flex justify-between text-sm mb-2">
                                <span>Terminal e impuestos (5%)</span>
                                <span>${montoTerminal .toFixed(2)} MXN</span>
                            </div> 
                            
                                {promoAplicado && (
                                    <div className="flex justify-between text-sm text-green-700 font-bold">
                                    <span>Descuento aplicado</span>
                                    <span>-${DESCUENTO_PROMO} MXN</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>${subtotalConDescuento} MXN</span>
                            </div>
                            <div className="flex justify-between font-bold text-base">
                                <span>Total</span>
                                <span>${totalConCargos.toFixed(2)} MXN</span>
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
                                 <h4 className="font-bold mb-3 mt-8">Resumen de reserva</h4>
                            {/* Total visible siempre */}
                            <div className="flex justify-between font-bold text-lg mb-4">
                                <span>Total:</span>
                                <span>${totalConCargos.toFixed(2)} MXN</span>
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

                            </div>
                               {paid && metodoPago === "efectivo" && (
                                <div className="mt-4 text-yellow-700 text-center font-bold">
                                    Presenta este resumen y paga en taquilla.
                                </div>
                            )}


                                {/* Botón finalizar para pago en efectivo */}
                                <button
                                    className={`mt-6 w-full py-2 rounded font-bold text-white ${
                                    (metodoPago === "efectivo" ? puedeFinalizarEfectivo : paid)
                                        ? "bg-[#18668b] hover:bg-[#14526d]"
                                        : "bg-gray-300 cursor-not-allowed"
                                    }`}
                                    onClick={() => {
                                        handleContinuar();
                                    }}
                                    disabled={metodoPago === "efectivo" ? !puedeFinalizarEfectivo : !paid}
                                >
                                    {metodoPago === "efectivo"
                                    ? "Finalizar y ver resumen para pago en efectivo"
                                    : "Continuar al resumen"}
                                </button>
                                <div className="mt-4 text-xs text-gray-500">
                                    Los pases son válidos para la fecha y hora seleccionada.<br />
                                    Pago 100% seguro. Puedes cancelar hasta 48 horas antes de tu visita.
                                </div>
                            </div>
                          <button
                                className="mt-20 w-full py-7 rounded font-bold text-[#18668b] bg-white hover:bg-[#d6d3d3] border border-[#18668b]"
                                onClick={() => setPaso(1)}
                            >
                                Volver a datos de huéspedes
                            </button>
                        </div>
                    </div>
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
                            Disponibilidad confirmada para {visitantes.length} pase{visitantes.length > 1 ? "s" : ""}<br />

                        </div>
                        {cortesias > 0 && (
                          <div className="text-sm text-gray-500 mb-4">

                             {cortesias} Cortesía{cortesias > 1 ? "s" : ""} agregada{cortesias > 1 ? "s" : ""} gratis

                        </div>
                        )}
                            <div className="flex justify-between mb-1 text-sm">
                                <span className="text-black">Pases de Acceso General</span>
                                <span className="text-black">{visitantes.length} pases</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Precio Adultos 14+</span>
                                <span>${precioAdulto} MXN</span>
                            </div>
                            {cantidadAdultos60 > 0 && (
                               <div className="flex justify-between text-sm">
                                <span>Precio Adultos 60+</span>
                                <span>${precioAdulto60} MXN</span>
                            </div>
                            )}
                             {cantidadNinos > 0 && (
                              <div className="flex justify-between text-sm">
                                <span>PrecioNiños 2-13</span>
                                <span>$70 MXN</span>
                            </div>
                            )}

                             <div className="flex justify-between text-sm">
                                <span>Plataforma (5%)</span>
                                <span>${montoPlataforma.toFixed(2)} MXN</span>
                            </div> <div className="flex justify-between text-sm">
                                <span>Terminal e impuestos (5%)</span>
                                <span>${montoTerminal .toFixed(2)} MXN</span>
                            </div> 
                            
                            {promoAplicado && (
                                <div className="flex justify-between text-sm text-green-700 font-bold">
                                    <span>Descuento aplicado</span>
                                    <span>-${DESCUENTO_PROMO} MXN</span>
                                </div>
                            )}
                             <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>${subtotalConDescuento} MXN</span>
                            </div>
                            <div className="flex justify-between font-bold text-base">
                                <span>Total</span>
                                <span>${totalConCargos.toFixed(2)} MXN</span>
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

                            <h4 className="font-bold mb-3 mt-8">Resumen de reserva</h4>
                            {/* Total visible siempre */}
                            <div className="flex justify-between font-bold text-lg mb-4">
                                <span>Total:</span>
                                <span>${totalConCargos.toFixed(2)} MXN</span>
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

                            </div>


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
                               onClick={() => {
                                        handleContinuar();
                                    }}
                              disabled={metodoPago === "efectivo" ? !puedeFinalizarEfectivo : !paid}
                            >
                              {metodoPago === "efectivo"
                                ? "Finalizar y ver resumen para pago en efectivo"
                                : "Continuar al resumen"}
                            </button>

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

