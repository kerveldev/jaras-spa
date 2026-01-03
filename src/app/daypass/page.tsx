"use client";

type IneFiles = { frente: File | null; reverso: File | null };
import {
  JSXElementConstructor,
  ReactElement,
  ReactNode,
  ReactPortal,
  useState,
  useEffect,
} from "react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import toast, { Toaster } from "react-hot-toast";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import Stepper from "@/components/Stepper";
import axios from "axios";
import { Country, State, City } from "country-state-city";

const CODIGO_PROMO = "PROMO100";
const DESCUENTO_PROMO = 100;
const PRECIO_PASE = 350;

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const horarios = [
  "07:00 AM",
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
  "09:00 PM",
  "10:00 PM",
];

function getDiasMes(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const primerDia = firstDay === 0 ? 6 : firstDay - 1;
  return {
    dias: Array.from({ length: lastDate }, (_, i) => i + 1),
    primerDia,
  };
}

function formatFechaEs(year: number, month: number, day: number) {
  const fecha = new Date(
    `${year}-${(month + 1).toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}T12:00:00`
  );
  return fecha.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function DaypassUnicaPage() {
  const [paises, setPaises] = useState<any[]>([]);
  const [estados, setEstados] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [daypasses, setDaypasses] = useState<any[]>([]);

  useEffect(() => {
    async function cargarPaises() {
      try {
        const res = await fetch(
          "https://lasjaras-api.kerveldev.com/api/catalog/countries"
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setPaises(data);

          // Set Mexico as default if it exists in the list
          const mexico = data.find((p: any) => p.catalog_country_id === 110);
          if (mexico && visitantes.length > 0) {
            setVisitantes((prev) => {
              const copia = [...prev];
              copia[0].pais = mexico.name;
              return copia;
            });
            // Load states for Mexico by default, and try to load Jalisco cities if it exists
            await fetchEstadosDePais(mexico.catalog_country_id, "Jalisco");
          }

          // Call IP detection with the loaded countries data
          detectarUbicacionPorIP(data);
        }
      } catch (error) {
        console.error("Error al cargar países:", error);
      }
    }

    async function detectarUbicacionPorIP(catalogoPaises: any[]) {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();

        const pais = data.country_name;
        const estado = data.region;
        const ciudad = data.city;

        console.log("Detectado por IP:", pais, estado, ciudad);

        // Find country in our catalog by name
        const country = catalogoPaises.find((p: any) => p.name === pais);
        if (country) {
          await fetchEstadosDePais(country.catalog_country_id, estado);
        }

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

    async function cargarDaypasses() {
      try {
        const res = await fetch(
          "https://lasjaras-api.kerveldev.com/api/daypasses"
        );
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          setDaypasses(data.data);
        }
      } catch (error) {
        console.error("Error al cargar daypasses:", error);
      }
    }

    cargarPaises();
    cargarDaypasses();
  }, []);

  const fetchEstadosDePais = async (
    countryId: number,
    estadoParaCargar?: string
  ) => {
    if (!countryId) return;

    try {
      const res = await fetch(
        `https://lasjaras-api.kerveldev.com/api/catalog/states?country_id=${countryId}`
      );
      const data = await res.json();

      if (Array.isArray(data)) {
        setEstados(data);

        // If we have a specific state to load cities for, do it after states are loaded
        if (estadoParaCargar) {
          const stateToLoad = data.find(
            (s: any) => s.name === estadoParaCargar
          );
          if (stateToLoad) {
            // Set the state in visitantes
            setVisitantes((prev) => {
              const copia = [...prev];
              if (copia[0]) {
                copia[0].estado = estadoParaCargar;
              }
              return copia;
            });
            await fetchCiudadesDeEstado(stateToLoad.catalog_state_id);
          }
        }
      } else {
        console.warn("No se encontraron estados para el país ID:", countryId);
        setEstados([]);
      }
    } catch (error) {
      console.error("Error al cargar estados:", error);
      setEstados([]);
    }
  };

  const fetchCiudadesDeEstado = async (stateId: number) => {
    if (!stateId) return;

    try {
      const res = await fetch(
        `https://lasjaras-api.kerveldev.com/api/catalog/cities?state_id=${stateId}`
      );
      const data = await res.json();

      if (Array.isArray(data)) {
        setCiudades(data);
      } else {
        console.warn(
          `No se encontraron ciudades para el estado ID: ${stateId}`
        );
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

    // Find country ID by name
    const country = paises.find((p: any) => p.name === paisNombre);
    if (country) {
      fetchEstadosDePais(country.catalog_country_id);
    }
  };

  const handleEstadoChange = (idx: number, estadoNombre: string) => {
    setVisitantes((prev) => {
      const copia = [...prev];
      copia[idx].estado = estadoNombre;
      copia[idx].ciudad = "";
      return copia;
    });

    // Find state ID by name
    const state = estados.find((s: any) => s.name === estadoNombre);
    if (state) {
      fetchCiudadesDeEstado(state.catalog_state_id);
    }
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
    {
      nombre: "",
      apellido: "",
      correo: "",
      celular: "",
      cumple: "",
      ciudad: "",
      estado: "",
      pais: "",
      tipo: "general",
    },
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
  const [selectedTime, setSelectedTime] = useState("");
  const [errores, setErrores] = useState(
    visitantes.map(() => ({
      nombre: "",
      apellido: "",
      correo: "",
      celular: "",
      cumple: "",
      ciudad: "",
      estado: "",
      pais: "",
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
  const validateCumple = (fecha: string) => {
    if (!fecha.trim()) return false;

    // Check if format is DD/MM/YYYY (10 characters total)
    if (fecha.length !== 10) return false;

    // Extract parts
    const parts = fecha.split("/");
    if (parts.length !== 3) return false;

    const [day, month, year] = parts;

    // Validate year has 4 digits
    if (year.length !== 4) return false;

    // Basic validation of day and month
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (dayNum < 1 || dayNum > 31) return false;
    if (monthNum < 1 || monthNum > 12) return false;
    if (yearNum < 1900 || yearNum > new Date().getFullYear()) return false;

    return true;
  };

  const getCumpleErrorMessage = (fecha: string) => {
    if (!fecha.trim()) return "Este campo es obligatorio.";

    if (fecha.length < 10) {
      const parts = fecha.split("/");
      if (parts.length === 3 && parts[2].length < 4) {
        return "El año debe tener 4 dígitos (ej: 1990, no 90).";
      }
      return "Formato: DD/MM/AAAA (día/mes/año completo).";
    }

    return "Fecha inválida. Use formato DD/MM/AAAA.";
  };
  const validateCiudad = (ciudad: string) => ciudad.trim() !== "";
  const validateEstado = (estado: string) => estado.trim() !== "";
  const validatePais = (pais: string) => pais.trim() !== "";
  const validateIne = (ine: string) => ine.trim() !== "";

  function isHorarioPasado(horario: string): boolean {
    const fechaSeleccionada = new Date(year, mes, selectedDay);
    const hoy = new Date();

    if (fechaSeleccionada.toDateString() !== hoy.toDateString()) {
      return false;
    }

    const [tiempo, periodo] = horario.split(" ");
    const [horas, minutos] = tiempo.split(":").map(Number);

    let horaEn24 = horas;
    if (periodo === "PM" && horas !== 12) {
      horaEn24 += 12;
    } else if (periodo === "AM" && horas === 12) {
      horaEn24 = 0;
    }

    const fechaHorario = new Date(year, mes, selectedDay, horaEn24, minutos);

    return fechaHorario <= hoy;
  }

  function puedeAvanzarPaso2(): boolean {
    console.log("Debug puedeAvanzarPaso2:", {
      selectedDay,
      selectedTime,
      selectedTimeLength: selectedTime?.length,
      isEmpty:
        selectedTime === "" ||
        selectedTime === null ||
        selectedTime === undefined,
      adultos,
      adultos60,
      tieneAdultoOSenior: adultos + adultos60 > 0,
    });

    if (!selectedDay || !selectedTime || selectedTime.trim() === "") {
      return false;
    }

    // Validar que hay al menos un adulto o adulto mayor
    if (adultos + adultos60 === 0) {
      return false;
    }

    return !isHorarioPasado(selectedTime);
  }

  const puedeContinuar =
    visitantes.every(
      (v, i) =>
        validateNombre(v.nombre) &&
        validateApellido(v.apellido) &&
        validateCelular(v.celular) &&
        validateCorreo(v.correo, i === 0)
    ) && puedeAvanzarPaso2();
  type Visitante = {
    nombre: string;
    apellido: string;
    correo: string;
    celular: string;
    cumple: string;
    ciudad: string;
    estado: string;
    pais: string;
    tipo: "adulto" | "nino";
  };

  const handleAddVisitante = () => {
    if (visitantes.length >= 10) return;
    setVisitantes((prev) => [
      ...prev,
      {
        nombre: "",
        apellido: "",
        correo: "",
        celular: "",
        cumple: "",
        ciudad: "",
        estado: "",
        pais: "",
        tipo: "adulto",
      },
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
    setIneFiles((prev) => [...prev, { frente: null, reverso: null }]);
  };

  const handleVis = (
    idx: number,
    campo:
      | "nombre"
      | "apellido"
      | "correo"
      | "celular"
      | "cumple"
      | "ciudad"
      | "estado"
      | "pais",
    valor: string
  ) => {
    setVisitantes((prev) => {
      const copia = [...prev];
      copia[idx][campo] = valor;
      return copia;
    });
  };

  type Campo =
    | "nombre"
    | "apellido"
    | "correo"
    | "celular"
    | "cumple"
    | "ciudad"
    | "estado"
    | "pais"
    | "ine";

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

  const { dias, primerDia } = getDiasMes(year, mes);
  const fechaSeleccionada = `${year}-${(mes + 1)
    .toString()
    .padStart(2, "0")}-${selectedDay.toString().padStart(2, "0")}`;
  const fechaDisplay = formatFechaEs(year, mes, selectedDay);

  const [adultos, setAdultos] = useState(0);
  const [ninos, setNinos] = useState(0);
  const [adultos60, setAdultos60] = useState(0);

  const cantidadAdultos = adultos;
  const cantidadAdultos60 = adultos60;
  const cantidadNinos = ninos;
  const cantidadMenores2 = 0;
  const esGrupo = cantidadAdultos + cantidadAdultos60 >= 12;

  const precioAdulto = getPrecioPorTipo(fechaSeleccionada, "adulto", esGrupo);
  const precioAdulto60 = getPrecioPorTipo(
    fechaSeleccionada,
    "adulto60",
    esGrupo
  );
  const precioNino = getPrecioPorTipo(fechaSeleccionada, "nino", esGrupo);
  const precioMenor2 = getPrecioPorTipo(fechaSeleccionada, "menor2", esGrupo);

  const subtotalAdultos = cantidadAdultos * precioAdulto;
  const subtotalAdultos60 = cantidadAdultos60 * precioAdulto60;
  const subtotalNinos = cantidadNinos * precioNino;
  const subtotalMenores2 = cantidadMenores2 * precioMenor2;

  const subtotal =
    subtotalAdultos + subtotalAdultos60 + subtotalNinos + subtotalMenores2;
  const total = Math.max(subtotal - descuento, 0);
  const porcentajePlataforma = 0;
  const subtotalConDescuento = Math.max(subtotal - descuento, 0);

  const montoPlataforma = subtotalConDescuento * porcentajePlataforma;

  const totalConCargos = subtotalConDescuento + montoPlataforma;
  function calcularCortesias(totalAdultos: number): number {
    if (totalAdultos >= 60) return 4;
    if (totalAdultos >= 45) return 3;
    if (totalAdultos >= 30) return 2;
    if (totalAdultos >= 15) return 1;
    return 0;
  }
  const totalAdultosUnicos = cantidadAdultos + cantidadAdultos60;
  const cortesias = calcularCortesias(totalAdultosUnicos);

  function prepararDatosParaCorreo() {
    const data = {
      visitantes: visitantes.map((v, idx) => ({
        nombre: v.nombre,
        apellido: v.apellido,
        correo: v.correo,
        celular: v.celular,
        ine_frente:
          idx === 0 && ineFiles[idx]?.frente
            ? ineFiles[idx].frente.name
            : undefined,
        ine_reverso:
          idx === 0 && ineFiles[idx]?.reverso
            ? ineFiles[idx].reverso.name
            : undefined,
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

  function generarCuerpoCorreo(
    data: ReturnType<typeof prepararDatosParaCorreo>
  ) {
    const visitantesTxt = data.visitantes
      .map(
        (v, idx) =>
          `Visitante ${idx + 1}:\n- Nombre: ${v.nombre} \n- Apellido: ${
            v.apellido
          }\n- Correo: ${v.correo}\n- Celular: ${v.celular}\n` +
          (idx === 0
            ? `- INE Frente: ${v.ine_frente || "No adjunto"}\n- INE Reverso: ${
                v.ine_reverso || "No adjunto"
              }\n`
            : "")
      )
      .join("\n");

    return `
Reserva de DayPass

Fecha de visita: ${data.fechaDisplay}
Hora de llegada: ${data.horario}
Cantidad de personas: ${data.cantidad}

${visitantesTxt}

Subtotal: $${data.subtotal.toFixed(2)} MXN
${
  data.promoAplicado
    ? `Descuento aplicado: -$${data.descuento.toFixed(2)} MXN\n`
    : ""
}
Total a pagar: $${data.total.toFixed(2)} MXN

Método de pago: ${data.metodoPago === "openpay" ? "Openpay" : "Efectivo"}
${data.codigoPromo ? `Código promocional usado: ${data.codigoPromo}\n` : ""}

¡Gracias por reservar!
        `.trim();
  }

  const handleSiguiente = () => {
    localStorage.setItem("visitantes", JSON.stringify(visitantes));
    localStorage.setItem("cantidad", visitantes.length.toString());
    localStorage.setItem("fechaVisita", fechaSeleccionada);
    localStorage.setItem("horaVisita", selectedTime);
    window.location.href = "/daypass/extras";
  };

  // arriba
  const [metodoPago, setMetodoPago] = useState<"openpay" | "efectivo">(
    "openpay"
  );

  const [paid, setPaid] = useState(true);
  const [card, setCard] = useState({ name: "", num: "", exp: "", cvc: "" });
  const [isPaying, setIsPaying] = useState(false);
  const [isProcessingReservation, setIsProcessingReservation] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [expandedInfo, setExpandedInfo] = useState({
    ninos: false,
    adultos60: false,
    grupos: false,
  });

  function isExpValid(exp: string) {
    if (!/^\d{2}\/\d{2}$/.test(exp)) return false;
    const [mm, aa] = exp.split("/").map(Number);
    if (mm < 1 || mm > 12) return false;
    return true;
  }

  function handleExpChange(e: { target: { value: string } }) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) value = value.slice(0, 2) + "/" + value.slice(2);
    setCard((card) => ({ ...card, exp: value }));
  }

  function handlePay(e: { preventDefault: () => void }) {
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
          <span className="text-xs text-red-700 font-bold">{message}</span>
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
  const handleRemoveVisitante = (idx: number) => {
    setVisitantes((prev) => prev.filter((_, i) => i !== idx));
    setTouched((prev) => prev.filter((_, i) => i !== idx));
    setIneFiles((prev) => prev.filter((_, i) => i !== idx));
  };
  const puedeFinalizarEfectivo =
    validateNombre(visitantes[0]?.nombre) &&
    validateNombre(visitantes[0]?.apellido) &&
    validateCelular(visitantes[0]?.celular) &&
    validateCorreo(visitantes[0]?.correo, true);

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

  const handleIneFileChange = (
    idx: number,
    tipo: "frente" | "reverso",
    file: File | null
  ) => {
    setIneFiles((prev) => {
      const copia = [...prev];
      copia[idx][tipo] = file;
      return copia;
    });
  };

  const [paso, setPaso] = useState(1);
  const pasos = [
    { label: "Visitantes y fechas", paso: 1 },
    { label: "Verificar", paso: 2 },
  ];

  const imagenes = ["/assets/img-4.webp", "/assets/img-5.webp"];

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const prevMonth = mes === 0 ? 11 : mes - 1;
  const prevYear = mes === 0 ? year - 1 : year;
  const lastDayPrevMonth = new Date(prevYear, prevMonth + 1, 0);
  lastDayPrevMonth.setHours(0, 0, 0, 0);

  const puedeIrMesAnterior = lastDayPrevMonth >= hoy;
  function normalizeTimeTo24(label: string) {
    if (!label) return "";
    const [time, meridiem] = label.split(" ");
    if (!time) return "";
    let [hh] = time.split(":").map(Number);
    const [, mm] = time.split(":").map(Number);
    const mer = (meridiem || "").toLowerCase();
    if (mer === "pm" && hh < 12) hh += 12;
    if (mer === "am" && hh === 12) hh = 0;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }

  function buildVisitorsForApi() {
    const list: Array<{
      name: string;
      lastname: string;
      birthdate: string;
      email: string;
      phone: string;
      visitor_type_id: "1" | "2";
      checkin_time: string;
      daypass_id: number;
    }> = [];

    const titular =
      visitantes[0] ||
      ({
        nombre: "",
        apellido: "",
        correo: "",
        celular: "",
        cumple: "",
      } as any);

    const checkin = normalizeTimeTo24(selectedTime);
    const daypassGeneral = getDaypassGeneral();
    const daypassINAPAM = getDaypassINAPAM();

    list.push({
      name: titular.nombre || "Titular",
      lastname: titular.apellido || "Reserva",
      birthdate: titular.cumple || "1990-01-01",
      email: titular.correo || "",
      phone: titular.celular || "",
      visitor_type_id: "1",
      checkin_time: checkin,
      daypass_id: daypassGeneral?.id || 8,
    });

    let consecutivo = 2;

    for (let i = 0; i < Math.max(0, adultos - 1); i++, consecutivo++) {
      list.push({
        name: `Invitado ${consecutivo}`,
        lastname: "Adulto",
        birthdate: "1990-01-01",
        email: "",
        phone: "",
        visitor_type_id: "1",
        checkin_time: checkin,
        daypass_id: daypassGeneral?.id || 8,
      });
    }

    for (let i = 0; i < adultos60; i++, consecutivo++) {
      list.push({
        name: `Invitado ${consecutivo}`,
        lastname: "Adulto 60+",
        birthdate: "1950-01-01",
        email: "",
        phone: "",
        visitor_type_id: "1",
        checkin_time: checkin,
        daypass_id: daypassINAPAM?.id || 9,
      });
    }

    for (let i = 0; i < ninos; i++, consecutivo++) {
      list.push({
        name: `Invitado ${consecutivo}`,
        lastname: "Niño",
        birthdate: "2015-01-01",
        email: "",
        phone: "",
        visitor_type_id: "2",
        checkin_time: checkin,
        daypass_id: daypassGeneral?.id || 8,
      });
    }

    return list;
  }

  async function handleContinuar() {
    setIsProcessingReservation(true);
    toast.loading("Procesando tu reservación...", {
      id: "reservation-processing",
    });

    try {
      // Validate that we have a valid date and time
      if (!selectedDay || !selectedTime || !fechaSeleccionada) {
        toast.dismiss("reservation-processing");
        toast.error("Por favor selecciona una fecha y horario válidos.");
        setIsProcessingReservation(false);
        return;
      }

      // dentro de handleContinuar(), justo antes de armar el FormData de la reservación
      if (metodoPago === "openpay") {
        try {
          // 1) Tomamos datos del titular desde tu array actual (como ya haces más abajo)
          const titular = visitantes?.[0] ?? {};
          const nombre = String(titular?.nombre ?? "").trim();
          const apellido = String(titular?.apellido ?? "").trim();
          const telefono = String(titular?.celular ?? "");
          const email = String(titular?.correo ?? "").trim();

          // 2) Total ya calculado en tu UI
          const total = Number(Number(totalConCargos).toFixed(2));

          // 3) Armamos el body para tu endpoint de redirección
          const body = {
            nombre,
            apellido,
            telefono,
            email,
            monto: total,
            // Si el endpoint está público, podemos omitir user_id y que el backend haga fallback.
            // Si no, y necesitas pasarlo, descomenta la línea:
            // user_id: 1,
            item_id: 0, // por ahora genérico; en el Paso 2 lo amarramos a la reservación real
            item_name: `Reserva Daypass ${fechaSeleccionada || ""}`,
            type: "daypass",
            // order_id: undefined, // opcional
            // Si tu backend ya soporta redirect_url dinámico, pásalo:
            redirect_url: `${window.location.origin}/daypass/checkout/callback`,
          };

          const resp = await fetch(
            "https://lasjaras-api.kerveldev.com/api/pagos/openpay-redirect",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify(body),
            }
          );

          const json = await resp.json().catch(() => ({}));

          if (!resp.ok || !json?.success || !json?.redirect_url) {
            throw new Error(
              json?.error || "No se pudo generar la redirección de pago."
            );
          }

          // 4) (Opcional) guarda el sale_id para el callback del Paso 2
          if (json.sale_id) {
            localStorage.setItem("openpay_sale_id", String(json.sale_id));
          }

          // 5) ¡A 3-D Secure!
          window.location.assign(json.redirect_url);
          return; // importante: no continúes con el flujo de crear reservación aquí
        } catch (e: any) {
          toast.error(e?.message || "Error al iniciar pago con Openpay.");
          return;
        }
      }

      const formData = new FormData();

      formData.append("client[name]", visitantes[0]?.nombre || "Titular");
      formData.append("client[lastname]", visitantes[0]?.apellido || "Reserva");
      formData.append("client[email]", visitantes[0]?.correo || "");
      formData.append("client[phone]", visitantes[0]?.celular || "");
      formData.append(
        "client[birthdate]",
        visitantes[0]?.cumple || "1990-01-01"
      );

      // Ensure proper date format (YYYY-MM-DD)
      const formattedDate = `${year}-${(mes + 1)
        .toString()
        .padStart(2, "0")}-${selectedDay.toString().padStart(2, "0")}`;
      formData.append("visit_date", formattedDate);
      console.log(
        "Date being sent:",
        formattedDate,
        "Original fechaSeleccionada:",
        fechaSeleccionada
      );
      formData.append("origin_city", visitantes[0]?.ciudad || "");
      if (visitantes[0]?.estado)
        formData.append("origin_state", visitantes[0].estado);
      if (visitantes[0]?.pais)
        formData.append("origin_country", visitantes[0].pais);
      formData.append("payment_method", metodoPago || "");
      const normalizeBirthdate = (input?: string | Date | null): string => {
        if (!input) return "";

        if (input instanceof Date) {
          const yyyy = String(input.getFullYear());
          const mm = String(input.getMonth() + 1).padStart(2, "0");
          const dd = String(input.getDate()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}`;
        }

        const s = String(input).trim();

        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

        const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
        if (m) {
          const [, ddRaw, mmRaw, yyyy] = m;
          const dd = ddRaw.padStart(2, "0");
          const mm = mmRaw.padStart(2, "0");

          const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
          if (
            d.getFullYear() === Number(yyyy) &&
            d.getMonth() === Number(mm) - 1 &&
            d.getDate() === Number(dd)
          ) {
            return `${yyyy}-${mm}-${dd}`;
          }
        }

        console.warn(`Formato de fecha no reconocido para birthdate: "${s}"`);
        return s;
      };

      formData.append(
        "totals[total]",
        String(Number(totalConCargos.toFixed(2)))
      );
      formData.append(
        "promo",
        promoAplicado ? JSON.stringify({ code: codigoPromo }) : "[]"
      );

      const visitors = buildVisitorsForApi();

      visitors.forEach((v, i) => {
        formData.append(`visitors[${i}][name]`, v.name);
        formData.append(`visitors[${i}][lastname]`, v.lastname);
        formData.append(
          `visitors[${i}][birthdate]`,
          normalizeBirthdate(v.birthdate)
        );
        formData.append(`visitors[${i}][email]`, v.email);
        formData.append(`visitors[${i}][phone]`, v.phone);
        formData.append(`visitors[${i}][visitor_type_id]`, v.visitor_type_id);
        formData.append(`visitors[${i}][checkin_time]`, v.checkin_time);
        formData.append(`visitors[${i}][daypass_id]`, String(v.daypass_id));
      });

      if (ineFiles?.[0]?.frente) {
        formData.append(`visitors[0][document_type]`, "INE");
        formData.append(
          `visitors[0][document_front]`,
          ineFiles[0].frente,
          ineFiles[0].frente.name
        );
      }
      if (ineFiles?.[0]?.reverso) {
        formData.append(`visitors[0][document_type]`, "INE");
        formData.append(
          `visitors[0][document_back]`,
          ineFiles[0].reverso,
          ineFiles[0].reverso.name
        );
      }

      for (const pair of formData.entries()) {
        console.log(pair[0] + ": ", pair[1]);
      }

      const res = await fetch(
        "https://lasjaras-api.kerveldev.com/api/reservations",
        {
          method: "POST",
          headers: { Accept: "application/json" },
          body: formData,
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.dismiss("reservation-processing");

        let errorMessage =
          "Error al enviar la reservación. Intenta nuevamente.";

        // Handle 422 status code specifically
        if (res.status === 422 && json?.message) {
          errorMessage = json.message;
        } else if (json?.message) {
          errorMessage = json.message;
        } else if (json?.error) {
          errorMessage = json.error;
        } else if (json?.errors) {
          console.table(json.errors);
          errorMessage = "Faltan campos requeridos. Revisa la información.";
        }

        toast.error(errorMessage);
        return;
      }

      // Success case
      console.log("Respuesta de la API:", json.reservation?.qr_code_url);

      if (json.reservation?.qr_code_url) {
        localStorage.setItem("qr_code_url", json.reservation.qr_code_url);
      }

      toast.dismiss("reservation-processing");
      toast.success("¡Reservación enviada exitosamente!");
      setTimeout(() => {
        window.location.href = "/daypass/resumen";
      }, 1000);
    } catch (error: any) {
      console.error("Error inesperado:", error);
      toast.dismiss("reservation-processing");
      toast.error(
        error.message || "Error al procesar la reservación. Intenta nuevamente."
      );
    } finally {
      setIsProcessingReservation(false);
    }
  }

  function getDaypassGeneral() {
    return daypasses.find((dp) => dp.name === "DayPass General Online") || null;
  }

  function getDaypassINAPAM() {
    return daypasses.find((dp) => dp.name === "DayPass INAPAM Online") || null;
  }

  function getPrecioPorTipo(
    _fecha: string,
    tipo: "adulto" | "adulto60" | "nino" | "menor2",
    _esGrupo: boolean = false
  ) {
    if (tipo === "adulto" || tipo === "nino") {
      const daypassGeneral = getDaypassGeneral();
      return daypassGeneral ? daypassGeneral.price : 420;
    }

    if (tipo === "adulto60") {
      const daypassINAPAM = getDaypassINAPAM();
      return daypassINAPAM ? daypassINAPAM.price : 360;
    }

    if (tipo === "menor2") return 0;

    return 0;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Toaster position="top-center" />
      {/* <Header /> */}

      {/* <h1 className="text-2xl font-titles text-center mb-8 text-[#18668b] pt-12">
                Completa tu Reservación y Agenda tu Visita
            </h1> */}
      <main className="flex flex-col md:flex-row w-full min-h-[calc(100vh-120px)] max-w-none isolate">
        <section className="w-full md:w-1/2 flex flex-col justify-center px-8 py-12 relative z-10">
          {/* Stepper visual */}
          <div className="flex items-center justify-center gap-6 mt-0 mb-auto">
            {paso > 1 && (
              <button
                type="button"
                onClick={() => setPaso(paso - 1)}
                className="mr-4 flex items-center justify-center text-[#18668b] hover:text-[#14526d] transition"
                title="Regresar al paso anterior"
              >
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M15 19l-7-7 7-7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            {pasos.map((step, idx) => {
              const completado = paso > step.paso;
              const activo = paso === step.paso;
              return (
                <div
                  key={step.label}
                  className="flex flex-col items-center min-w-[90px]"
                >
                  <span
                    className={`text-sm font-semibold pb-1 transition
                        ${
                          activo || completado
                            ? "text-[#18668b]"
                            : "text-gray-400"
                        }`}
                  >
                    {step.label}
                  </span>
                  <div
                    className={`w-full h-1 mt-1 rounded
                        ${
                          activo || completado ? "bg-[#B7804F]" : "bg-gray-200"
                        }`}
                  />
                </div>
              );
            })}
          </div>
          {/* paso 1: Visitantes */}
          {paso === 1 && (
            <>
              <div>
                <div className="text-[#B7804F] text-3xl font-titles mb-6 mt-2 text-center ">
                  ¿Cuántos visitantes son?
                </div>
                <div className="space-y-6 mb-0 mt-auto">
                  {/* Adultos */}
                  <div className="flex items-center justify-between bg-white rounded shadow p-2 mb-8 rounded-2xl">
                    <div>
                      <span className="font-semibold text-lg">
                        Adultos
                      </span>
                      <div className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-full inline-block mt-1">
                        ${precioAdulto.toFixed(2)} MXN
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="h-10 w-10 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xl font-bold grid place-items-center shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => {
                          if (adultos > 0) {
                            setAdultos(adultos - 1);
                            setVisitantes((prev) => {
                              const nuevo = prev.slice(0, prev.length - 1);
                              return nuevo;
                            });
                            setTouched((prev) => {
                              const nuevo = prev.slice(0, prev.length - 1);
                              return nuevo;
                            });
                            setIneFiles((prev) => {
                              const nuevo = prev.slice(0, prev.length - 1);
                              return nuevo;
                            });
                          }
                        }}
                        disabled={adultos <= 0}
                      >
                        -
                      </button>
                      <span className="text-xl font-bold">{adultos}</span>
                      <button
                        type="button"
                        className="h-10 w-10 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xl font-bold grid place-items-center shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        onClick={() => {
                          setAdultos(adultos + 1);
                          setVisitantes((prev) => [
                            ...prev,
                            {
                              nombre: "",
                              apellido: "",
                              correo: "",
                              celular: "",
                              cumple: "",
                              ciudad: "",
                              estado: "",
                              pais: "",
                              tipo: "adulto",
                            },
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
                            { frente: null, reverso: null },
                          ]);
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {/* Adultos 60+ */}
                  <div className="flex items-center justify-between bg-white rounded shadow p-2 mb-8 rounded-2xl">
                    <div>
                      <span className="font-semibold text-lg">
                        Adultos Mayor de 60 Años
                      </span>
                      <div className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-full inline-block mt-1">
                        ${precioAdulto60.toFixed(2)} MXN
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="h-10 w-10 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xl font-bold grid place-items-center shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => {
                          if (adultos60 > 0) {
                            setAdultos60(adultos60 - 1);
                            setVisitantes((prev) => {
                              const nuevo = prev.slice(0, prev.length - 1);
                              return nuevo;
                            });
                            setTouched((prev) => {
                              const nuevo = prev.slice(0, prev.length - 1);
                              return nuevo;
                            });
                            setIneFiles((prev) => {
                              const nuevo = prev.slice(0, prev.length - 1);
                              return nuevo;
                            });
                          }
                        }}
                        disabled={adultos60 <= 0}
                      >
                        -
                      </button>
                      <span className="text-xl font-bold">{adultos60}</span>
                      <button
                        type="button"
                        className="h-10 w-10 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xl font-bold grid place-items-center shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        onClick={() => {
                          setAdultos60(adultos60 + 1);
                          setVisitantes((prev) => [
                            ...prev,
                            {
                              nombre: "",
                              apellido: "",
                              correo: "",
                              celular: "",
                              cumple: "",
                              ciudad: "",
                              estado: "",
                              pais: "",
                              tipo: "adulto",
                            },
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
                            { frente: null, reverso: null },
                          ]);
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {/* Niños */}
                  <div className="flex items-center justify-between bg-white rounded shadow p-2 rounded-2xl">
                    <div>
                      <span className="font-semibold text-lg">
                        Niños de 2 a 13 años
                      </span>
                      <div className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-full inline-block mt-1">
                        ${precioNino.toFixed(2)} MXN
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="h-10 w-10 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xl font-bold grid place-items-center shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => {
                          if (ninos > 0) {
                            setNinos(ninos - 1);

                            setVisitantes((prev) => {
                              const sinUltimoNino = [...prev];
                              const idxUltimoNino = [...prev]
                                .map((v) => v.tipo)
                                .lastIndexOf("nino");
                              if (idxUltimoNino !== -1)
                                sinUltimoNino.splice(idxUltimoNino, 1);
                              return sinUltimoNino;
                            });
                          }
                        }}
                        disabled={ninos <= 0}
                      >
                        -
                      </button>
                      <span className="text-xl font-bold">{ninos}</span>
                      <button
                        type="button"
                        className="h-10 w-10 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xl font-bold grid place-items-center shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        onClick={() => {
                          setNinos(ninos + 1);
                          setVisitantes((prev) => [
                            ...prev,
                            {
                              nombre: "",
                              apellido: "",
                              correo: "",
                              celular: "",
                              cumple: "",
                              ciudad: "",
                              estado: "",
                              pais: "",
                              tipo: "nino",
                            },
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
                            { frente: null, reverso: null },
                          ]);
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                {/* Acordeón de información */}
                <div className="mt-6 space-y-3">
                  {/* Información sobre niños */}
                  <div className="bg-[#B7804F]/10 border-l-4 border-[#B7804F] rounded-r-lg overflow-hidden">
                    <button
                      onClick={() =>
                        setExpandedInfo((prev) => ({
                          ...prev,
                          ninos: !prev.ninos,
                        }))
                      }
                      className="w-full p-4 text-left hover:bg-[#B7804F]/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <svg
                            className="w-5 h-5 text-[#B7804F] flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <h4 className="font-semibold text-gray-800 text-sm">
                            Información sobre niños
                          </h4>
                        </div>
                        <svg
                          className={`w-5 h-5 text-[#B7804F] transition-transform duration-200 ${
                            expandedInfo.ninos ? "rotate-180" : ""
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </button>
                    {expandedInfo.ninos && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-gray-700 pl-8">
                          Los niños de 2 a 13 años deben estar acompañados por
                          un adulto. No incluye acceso al jardín termal.{" "}
                          <span className="font-semibold text-green-600">
                            Acceso GRATIS para niños menores de 2 años.
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Adultos mayores */}
                  <div className="bg-[#B7804F]/10 border-l-4 border-[#B7804F] rounded-r-lg overflow-hidden">
                    <button
                      onClick={() =>
                        setExpandedInfo((prev) => ({
                          ...prev,
                          adultos60: !prev.adultos60,
                        }))
                      }
                      className="w-full p-4 text-left hover:bg-[#B7804F]/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <svg
                            className="w-5 h-5 text-[#B7804F] flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <h4 className="font-semibold text-gray-800 text-sm">
                            Adultos mayores (60+)
                          </h4>
                        </div>
                        <svg
                          className={`w-5 h-5 text-[#B7804F] transition-transform duration-200 ${
                            expandedInfo.adultos60 ? "rotate-180" : ""
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </button>
                    {expandedInfo.adultos60 && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-gray-700 pl-8">
                          Los adultos mayores de 60 años de edad deberán
                          presentar{" "}
                          <span className="font-semibold">
                            tarjeta del INAPAM actualizada
                          </span>
                          , de lo contrario se cobrará la entrada a precio
                          regular.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                {/* Selección de fecha y horario (debajo de los selectores de visitantes) */}
                <div className="mt-10">
                  <div className="text-[#B7804F] text-3xl font-titles mb-6 mt-2 text-center ">
                    Selecciona la fecha y el horario de tu visita
                  </div>
                  <p className="mb-6 text-gray-600 text-base md:text-xl">
                    Estamos abiertos todos los días del año.
                  </p>
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Calendario */}
                    <div className="w-full md:w-1/2">
                      <div className="bg-white border rounded-lg p-4 md:p-6 shadow-md">
                        {/* Navegación */}
                        <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
                          <button
                            className={`text-xs md:text-sm font-bold hover:underline flex-shrink-0 ${
                              puedeIrMesAnterior
                                ? "text-[#688b18] cursor-pointer"
                                : "text-gray-400 cursor-not-allowed"
                            }`}
                            onClick={handlePrevMonth}
                            type="button"
                            disabled={!puedeIrMesAnterior}
                          >
                            ← Anterior
                          </button>
                          <span className="text-sm md:text-lg font-bold capitalize text-center flex-1 px-2">
                            {new Date(year, mes, 1).toLocaleDateString(
                              "es-MX",
                              {
                                month: "long",
                                year: "numeric",
                                timeZone: "America/Mexico_City",
                              }
                            )}
                          </span>
                          <button
                            className="text-xs md:text-sm text-[#18668b] font-bold hover:underline flex-shrink-0"
                            onClick={handleNextMonth}
                            type="button"
                          >
                            Siguiente →
                          </button>
                        </div>
                        {/* Días de la semana */}
                        <div className="grid grid-cols-7 text-center text-xs md:text-sm font-semibold mb-1 md:mb-2">
                          {diasSemana.map((dia) => (
                            <span key={dia} className="text-gray-600">
                              {dia}
                            </span>
                          ))}
                        </div>
                        {/* Días del mes */}
                        <div className="grid grid-cols-7 gap-1 md:gap-2">
                          {[...Array(primerDia).keys()].map((_, i) => (
                            <div key={"empty-left-" + i}></div>
                          ))}
                          {dias.map((dia) => {
                            const fechaBtn = new Date(year, mes, dia);
                            const hoy = new Date();
                            hoy.setHours(0, 0, 0, 0);
                            const isSelected = selectedDay === dia;
                            const isDisabled = fechaBtn < hoy;
                            return (
                              <button
                                key={dia}
                                type="button"
                                onClick={() =>
                                  !isDisabled && setSelectedDay(dia)
                                }
                                disabled={isDisabled}
                                className={`w-9 h-9 md:w-12 md:h-12 text-sm md:text-base rounded-full border flex items-center justify-center transition ${
                                  isSelected
                                    ? "bg-[#B7804F] text-white border-[#B7804F]"
                                    : isDisabled
                                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                    : "bg-white hover:bg-gray-100 border-gray-300 text-gray-700"
                                }`}
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
                      <p className="mb-3 md:mb-4 text-gray-800 text-sm md:text-base font-bold">
                        Selecciona tu horario de llegada.
                      </p>
                      <div className="space-y-4">
                        <select
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#18668b] focus:border-[#18668b] bg-white shadow-sm"
                        >
                          <option value="">
                            Selecciona tu horario de llegada
                          </option>
                          {horarios.map((hora) => (
                            <option
                              key={hora}
                              value={hora}
                              disabled={isHorarioPasado(hora)}
                            >
                              {hora}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        className={`w-full py-2 mt-4 rounded font-bold transition-all duration-200 ${
                          puedeAvanzarPaso2()
                            ? "text-white bg-[#B7804F] hover:bg-[#A06F44] border border-[#B7804F] cursor-pointer"
                            : "text-gray-400 bg-gray-200 border border-gray-300 cursor-not-allowed"
                        }`}
                        onClick={() => puedeAvanzarPaso2() && setPaso(2)}
                        disabled={!puedeAvanzarPaso2()}
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Paso 2 */}
          {paso === 2 && (
            <div className="relative">
              <div>
                <div className="text-[#B7804F] text-2xl font-titles mb-5 overflow-hidden">
                  Detalles de la reserva
                </div>

                <form className="space-y-4">
                  {(() => {
                    const idx = 0;
                    const vis = visitantes?.[idx] ?? {
                      nombre: "",
                      apellido: "",
                      correo: "",
                      celular: "",
                      cumple: "",
                      ciudad: "",
                      estado: "",
                      pais: "",
                      tipo: "adulto" as const,
                    };

                    const nombreValido = validateNombre(vis.nombre);
                    const apellidoValido = validateApellido(vis.apellido);
                    const correoValido = validateCorreo(vis.correo, true);
                    const celularValido = validateCelular(vis.celular);
                    const cumpleValido = validateCumple(vis.cumple);
                    const ciudadValido = validateCiudad(vis.ciudad);
                    const estadoValido = validateEstado(vis.estado);
                    const paisValido = validatePais(vis.pais);

                    return (
                      <div className="p-4  rounded border">
                        {/* Nombres, Apellidos, Correo, Celular en un solo row */}
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2">
                          <div className="flex flex-col min-w-0">
                            <label
                              htmlFor={`nombre-${idx}`}
                              className="block text-xs font-bold text-black mb-1"
                            >
                              Nombres
                            </label>
                            <input
                              id={`nombre-${idx}`}
                              type="text"
                              placeholder="Nombre/s"
                              autoComplete="given-name"
                              value={vis.nombre}
                              onChange={(e) =>
                                handleVis(idx, "nombre", e.target.value)
                              }
                              onBlur={() => handleBlur(idx, "nombre")}
                              className={`border p-2 rounded w-full h-9 ${
                                touched[idx]?.nombre && !nombreValido
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              aria-invalid={
                                !!touched[idx]?.nombre && !nombreValido
                              }
                            />
                            {renderError(
                              "El nombre es obligatorio.",
                              !!touched[idx]?.nombre && !nombreValido
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <label
                              htmlFor={`apellido-${idx}`}
                              className="block text-xs font-bold text-black mb-1"
                            >
                              Apellidos
                            </label>
                            <input
                              id={`apellido-${idx}`}
                              type="text"
                              placeholder="Apellidos"
                              autoComplete="family-name"
                              value={vis.apellido}
                              onChange={(e) =>
                                handleVis(idx, "apellido", e.target.value)
                              }
                              onBlur={() => handleBlur(idx, "apellido")}
                              className={`border p-2 rounded w-full h-9 ${
                                touched[idx]?.apellido && !apellidoValido
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              aria-invalid={
                                !!touched[idx]?.apellido && !apellidoValido
                              }
                            />
                            {renderError(
                              "Este campo es obligatorio.",
                              !!touched[idx]?.apellido && !apellidoValido
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <label
                              htmlFor={`correo-${idx}`}
                              className="block text-xs font-bold text-black mb-1"
                            >
                              Correo Electrónico{" "}
                              <span className="text-[10px]">(Principal)</span>
                            </label>
                            <input
                              id={`correo-${idx}`}
                              type="email"
                              placeholder="Correo electrónico"
                              autoComplete="email"
                              value={vis.correo}
                              onChange={(e) =>
                                handleVis(idx, "correo", e.target.value)
                              }
                              onBlur={() => handleBlur(idx, "correo")}
                              className={`border p-2 rounded w-full h-9 ${
                                touched[idx]?.correo && !correoValido
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              aria-invalid={
                                !!touched[idx]?.correo && !correoValido
                              }
                            />
                            {renderError(
                              "Correo electrónico inválido.",
                              !!touched[idx]?.correo && !correoValido
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <label
                              htmlFor={`celular-${idx}`}
                              className="block text-xs font-bold text-black mb-1"
                            >
                              Celular WhatsApp
                            </label>
                            <input
                              id={`celular-${idx}`}
                              type="tel"
                              inputMode="numeric"
                              pattern="\d{10,}"
                              placeholder="Ej. 3312345678"
                              autoComplete="tel"
                              value={vis.celular}
                              onChange={(e) =>
                                handleVis(idx, "celular", e.target.value)
                              }
                              onBlur={() => handleBlur(idx, "celular")}
                              className={`border p-2 rounded w-full h-9 ${
                                touched[idx]?.celular && !celularValido
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              aria-invalid={
                                !!touched[idx]?.celular && !celularValido
                              }
                            />
                            {renderError(
                              "Debe tener al menos 10 dígitos.",
                              !!touched[idx]?.celular && !celularValido
                            )}
                          </div>
                        </div>

                        {/* Fecha de nacimiento + País/Estado/Ciudad en un solo row */}
                        <div className="flex flex-wrap gap-6">
                          {/* Fecha de nacimiento */}
                          <div className="flex flex-col flex-1 min-w-[180px]">
                            <label className="block text-xs font-bold text-black mb-1">
                              Fecha de nacimiento
                            </label>
                            <input
                              type="text"
                              placeholder="DD/MM/AAAA"
                              maxLength={10}
                              value={vis.cumple}
                              onChange={(e) => {
                                let v = e.target.value.replace(/[^0-9]/g, "");
                                if (v.length > 8) v = v.slice(0, 8);
                                let formatted = v;
                                if (v.length > 4)
                                  formatted =
                                    v.slice(0, 2) +
                                    "/" +
                                    v.slice(2, 4) +
                                    "/" +
                                    v.slice(4);
                                else if (v.length > 2)
                                  formatted = v.slice(0, 2) + "/" + v.slice(2);
                                handleVis(idx, "cumple", formatted);
                              }}
                              onBlur={() => handleBlur(idx, "cumple")}
                              className={`border p-2 rounded w-full h-9 ${
                                touched[idx]?.cumple && !cumpleValido
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {renderError(
                              getCumpleErrorMessage(vis.cumple),
                              !!touched[idx]?.cumple && !cumpleValido
                            )}
                          </div>

                          {/* País */}
                          <div className="flex flex-col flex-1 min-w-[180px]">
                            <label className="block text-xs font-bold text-black mb-1">
                              País
                            </label>
                            <select
                              value={vis.pais}
                              onChange={(e) =>
                                handlePaisChange(idx, e.target.value)
                              }
                              onBlur={() => handleBlur(idx, "pais")}
                              className={`border p-2 rounded w-full h-9 text-black ${
                                touched[idx]?.pais && !paisValido
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            >
                              <option value="">Selecciona país</option>
                              {(paises ?? []).map((pais) => (
                                <option
                                  key={pais.catalog_country_id}
                                  value={pais.name}
                                >
                                  {pais.name}
                                </option>
                              ))}
                            </select>
                            {renderError(
                              "El país es obligatorio.",
                              !!touched[idx]?.pais && !paisValido
                            )}
                          </div>

                          {/* Estado */}
                          <div className="flex flex-col flex-1 min-w-[180px]">
                            <label className="block text-xs font-bold text-black mb-1">
                              Estado
                            </label>
                            <select
                              value={vis.estado}
                              onChange={(e) =>
                                handleEstadoChange(idx, e.target.value)
                              }
                              onBlur={() => handleBlur(idx, "estado")}
                              disabled={!vis.pais}
                              className={`border p-2 rounded w-full h-9 text-black ${
                                touched[idx]?.estado && !estadoValido
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            >
                              <option value="">Selecciona estado</option>
                              {(estados ?? []).map((estado) => (
                                <option
                                  key={estado.catalog_state_id}
                                  value={estado.name}
                                >
                                  {estado.name}
                                </option>
                              ))}
                            </select>
                            {renderError(
                              "El estado es obligatorio.",
                              !!touched[idx]?.estado && !estadoValido
                            )}
                          </div>

                          {/* Ciudad */}
                          <div className="flex flex-col flex-1 min-w-[180px]">
                            <label className="block text-xs font-bold text-black mb-1">
                              Ciudad
                            </label>
                            <select
                              value={vis.ciudad}
                              onChange={(e) =>
                                handleCiudadChange(idx, e.target.value)
                              }
                              onBlur={() => handleBlur(idx, "ciudad")}
                              disabled={!vis.estado}
                              className={`border p-2 rounded w-full h-9 text-black ${
                                touched[idx]?.ciudad && !ciudadValido
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            >
                              <option value="">Selecciona ciudad</option>
                              {(ciudades ?? []).map((ciudad) => (
                                <option
                                  key={ciudad.catalog_city_id}
                                  value={ciudad.name}
                                >
                                  {ciudad.name}
                                </option>
                              ))}
                            </select>
                            {renderError(
                              "La ciudad es obligatoria.",
                              !!touched[idx]?.ciudad && !ciudadValido
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </form>

                <div className=" mt-8 p-6 bg-white rounded shadow">
                  {/* 1ERA COLUMNA*/}
                  <h4 className="font-bold text-black mb-3">
                    Resumen de tu reserva
                  </h4>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span>📅</span>
                    <span className="capitalize">{fechaDisplay}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span>⏰</span>
                    <span>{selectedTime}</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    Disponibilidad confirmada para {visitantes.length} pase
                    {visitantes.length > 1 ? "s" : ""}
                    <br />
                  </div>
                  {cortesias > 0 && (
                    <div className="text-sm text-gray-500 mb-4">
                      {cortesias} Cortesía{cortesias > 1 ? "s" : ""} agregada
                      {cortesias > 1 ? "s" : ""} gratis
                    </div>
                  )}
                  <div className="flex flex-col gap-3 text-sm mb-2">
                    {cantidadAdultos > 0 && (
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Adultos 14+ ({cantidadAdultos})</span>
                          <span>${subtotalAdultos.toFixed(2)} MXN</span>
                        </div>
                        <div className="text-xs text-gray-500 ml-2">
                          ${precioAdulto.toFixed(2)} MXN c/u
                        </div>
                      </div>
                    )}
                    {cantidadAdultos60 > 0 && (
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Adultos 60+ ({cantidadAdultos60})</span>
                          <span>${subtotalAdultos60.toFixed(2)} MXN</span>
                        </div>
                        <div className="text-xs text-gray-500 ml-2">
                          ${precioAdulto60.toFixed(2)} MXN c/u
                        </div>
                      </div>
                    )}
                    {cantidadNinos > 0 && (
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Niños 2-13 años ({cantidadNinos})</span>
                          <span>${subtotalNinos.toFixed(2)} MXN</span>
                        </div>
                        <div className="text-xs text-gray-500 ml-2">
                          ${precioNino.toFixed(2)} MXN c/u
                        </div>
                      </div>
                    )}
                  </div>

                  {promoAplicado && (
                    <div className="flex justify-between text-sm text-green-700 font-bold">
                      <span>Descuento aplicado</span>
                      <span>-${DESCUENTO_PROMO.toFixed(2)} MXN</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotalConDescuento.toFixed(2)} MXN</span>
                  </div>
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>${totalConCargos.toFixed(2)} MXN</span>
                  </div>
                  {/* Código promocional */}

                  {paid && metodoPago === "efectivo" && (
                    <div className="mt-4 text-yellow-700 text-center font-bold">
                      Presenta este resumen y paga en taquilla.
                    </div>
                  )}

                  {/* METODO DE PAGO */}
                  <div className="mt-4">
                    <label className="block text-sm font-bold text-black mb-2">
                      Método de pago
                    </label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="metodoPago"
                          value="openpay"
                          checked={metodoPago === "openpay"}
                          onChange={() => setMetodoPago("openpay")}
                        />
                        <span>Tarjeta (Openpay)</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="metodoPago"
                          value="efectivo"
                          checked={metodoPago === "efectivo"}
                          onChange={() => setMetodoPago("efectivo")}
                        />
                        <span>Efectivo en taquilla</span>
                      </label>
                    </div>
                  </div>

                  {/* Checkbox términos y condiciones */}
                  <div className="mt-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-1 h-4 w-4 text-[#18668b] focus:ring-[#18668b] border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-600 leading-relaxed">
                        Acepto y confirmo que la información proporcionada es
                        correcta.
                      </span>
                    </label>
                  </div>

                  {/* Botones Finalizar y Volver en el mismo row */}
                  <div className="flex flex-row gap-4 mt-6">
                    <button
                      className={`w-1/2 py-2 rounded font-bold text-white flex items-center justify-center transition-all duration-200 ${
                        (metodoPago === "efectivo"
                          ? puedeFinalizarEfectivo
                          : paid) &&
                        !isProcessingReservation &&
                        acceptedTerms
                          ? "bg-[#B7804F] hover:bg-[#A06F44]"
                          : "bg-gray-300 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (!isProcessingReservation) {
                          handleContinuar();
                        }
                      }}
                      disabled={
                        isProcessingReservation ||
                        !acceptedTerms ||
                        (metodoPago === "efectivo"
                          ? !puedeFinalizarEfectivo
                          : !paid)
                      }
                    >
                      {isProcessingReservation ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Procesando reservación...
                        </>
                      ) : metodoPago === "efectivo" ? (
                        "Generar Reserva"
                      ) : (
                        "Continuar al resumen"
                      )}
                    </button>
                    <button
                      className="w-1/2 py-2 rounded font-bold text-white bg-[#B7804F] hover:bg-[#A06F44] border border-[#B7804F] transition-all duration-200"
                      onClick={() => setPaso(1)}
                    >
                      Volver
                    </button>
                  </div>
                  <div className="mt-4 text-legal text-gray-500">
                    Los pases son válidos para la fecha y hora seleccionada.
                    <br />
                    Pago 100% seguro. Puedes cancelar hasta 48 horas antes de tu
                    visita.
                  </div>
                  {/* Links legales a PDFs */}
                  <div className="mt-3 text-xs text-gray-500">
                    Al continuar, aceptas nuestros{" "}
                    <a
                      href="/pdf/Terms-and-Conditions-Las-Jaras-Aguas-Termales.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Términos y Condiciones
                    </a>{" "}
                    y nuestro{" "}
                    <a
                      href="/pdf/Privacy-Policy-Las-Jaras-Aguas-Termales.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Aviso de Privacidad
                    </a>
                    .
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
        {/* Columna imagen */}
        <aside className="block md:flex w-full md:w-1/2 relative z-0">
          <div className="relative w-full h-full min-h-[320px] md:min-h-0">
            <Image
              src={imagenes[paso - 1]}
              alt={pasos[paso - 1].label}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            {/* Overlay y resumen solo para paso 2 */}
          </div>
        </aside>
      </main>
      {/* <Footer /> */}
    </div>
  );
}
