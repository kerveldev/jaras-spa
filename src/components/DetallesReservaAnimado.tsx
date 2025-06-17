import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
    fecha: string;
    hora: string;
    cantidad: number;
    promo: { aplicado: boolean; valor: number; codigo?: string };
    extrasList: any[];
    subtotal: number;
    usaTransporte: boolean;
    totalTransporte: number;
    horario: { hora: string; salida: string };
    PRECIO_PASE: number;
    PRECIO_TRANSPORTE: number;
    fechaLegible: (fecha: string) => string;
    total: number;
}

export default function DetallesReservaAnimado({
                                                   fecha,
                                                   hora,
                                                   cantidad,
                                                   promo,
                                                   extrasList,
                                                   subtotal,
                                                   usaTransporte,
                                                   totalTransporte,
                                                   horario,
                                                   PRECIO_PASE,
                                                   PRECIO_TRANSPORTE,
                                                   fechaLegible,
                                                   total
                                               }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <div className="font-semibold mb-2 text-center pt-2 text-blue-600 cursor-pointer hover:underline"
                 onClick={e => { e.preventDefault(); setOpen(v => !v); }}>
                {open ? "Ocultar resumen" : "Ver más detalles"}
            </div>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="detalles"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="text-sm mt-4 mb-2 space-y-2">
                            <div className="flex justify-between">
                                <span>Fecha de visita:</span>
                                <span>{fechaLegible(fecha)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Horario visita:</span>
                                <span>{hora || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Pases de entrada:</span>
                                <span>
                  {cantidad} x ${PRECIO_PASE} = ${cantidad * PRECIO_PASE} MXN
                </span>
                            </div>
                            {promo.aplicado && (
                                <div className="flex justify-between text-green-700 font-semibold">
                  <span>
                    Cupón aplicado ({promo.codigo || "PROMO"}):
                  </span>
                                    <span>- ${promo.valor} MXN</span>
                                </div>
                            )}
                            <div className="font-semibold mt-2 mb-1">Extras:</div>
                            {extrasList.length ? (
                                <ul className="pl-3 mb-2 list-disc text-black">
                                    {extrasList.map((x: any, i: number) => (
                                        <li key={x.nombre + i}>
                                            {x.cantidad} x {x.nombre} - ${x.total} MXN
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-xs text-gray-400 mb-2">
                                    Sin servicios adicionales
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>${subtotal} MXN</span>
                            </div>
                            {usaTransporte && (
                                <>
                                    <div className="flex justify-between">
                    <span>
                      Transporte ({cantidad} x ${PRECIO_TRANSPORTE}):
                    </span>
                                        <span>${totalTransporte} MXN</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Horario transporte:</span>
                                        <span>
                      {horario.hora} ({horario.salida})
                    </span>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between font-bold text-lg mt-2">
                                <span>Total:</span>
                                <span>${total} MXN</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
