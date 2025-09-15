"use client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";

const QR_IMG = "https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=LJ29384";

export default function LlegadaEstacionPage() {
    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
            <Header />

            <main className="max-w-6xl w-full mx-auto px-4 py-10 flex-1">
                {/* Volver */}
                <div className="mb-6">
                    <a href="/daypass/resumen" className="text-xs text-gray-600 hover:underline">&lt; Volver a Transporte</a>
                </div>

                {/* Título y pasos de reserva */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-2">Instrucciones de Llegada a la Estación</h2>
                    <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
                        <span>Compra</span>
                        <div className="w-10 h-1 bg-gray-200 rounded"></div>
                        <span>Fecha</span>
                        <div className="w-10 h-1 bg-gray-200 rounded"></div>
                        <span>Extras</span>
                        <div className="w-10 h-1 bg-gray-200 rounded"></div>
                        <span>Transporte</span>
                        <div className="w-10 h-1 bg-gray-200 rounded"></div>
                        <span className="text-black">Resumen</span>
                        <div className="w-10 h-1 bg-gray-200 rounded"></div>
                        <span className="text-black">Llegada</span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Instrucciones y ubicación */}
                    <section className="flex-1">
                        {/* Llegada */}
                        <div className="bg-[#f3f6f8] p-4 rounded-lg mb-4 flex items-center gap-3">
                            <span className="text-2xl">🚌</span>
                            <div>
                                <span className="font-bold">Llegada a la Estación de Autobús</span>
                                <div className="text-xs text-gray-700">
                                    Por favor, llegue a la estación de autobús al menos 30 minutos antes de la salida programada a las 6:00 am.
                                </div>
                            </div>
                        </div>
                        {/* Instrucciones importantes */}
                        <div className="mb-8">
                            <div className="font-semibold mb-2">Instrucciones Importantes</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ul className="space-y-2 text-sm">
                                    <li>
                                        <span className="font-bold">Horario de Llegada: </span>
                                        Llegue desde las 5:30 am. El autobús saldrá puntualmente a las 6:00 am.
                                    </li>
                                    <li>
                                        <span className="font-bold">Punto de Encuentro: </span>
                                        Diríjase a la Terminal Central, Andén 8, donde estará el autobús de Las Jaras.
                                    </li>
                                </ul>
                                <ul className="space-y-2 text-sm">
                                    <li>
                                        <span className="font-bold">Código QR: </span>
                                        Tenga listo su código QR para que el chofer lo escanee antes de abordar.
                                    </li>
                                    <li>
                                        <span className="font-bold">Equipaje: </span>
                                        Se permite 1 maleta grande y 1 equipaje de mano por persona.
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-700 flex items-center gap-2">
                                <span className="font-bold text-lg">!</span>
                                El autobús no esperará a los pasajeros que lleguen tarde. En caso de perder el autobús, deberá contactar a servicio al cliente para opciones alternativas.
                            </div>
                        </div>
                        {/* Ubicación de la estación */}
                        <div className="mb-6">
                            <div className="font-semibold mb-2">Ubicación de la Estación</div>
                            <div className="text-sm text-gray-700 mb-2">
                                Terminal Central de Autobuses, Av. Revolución 1234, Col. Centro, Guadalajara, Jalisco.
                            </div>
                        </div>
                        {/* Parada logística */}
                        <div className="mb-6">
                            <div className="font-semibold mb-2">Parada Logística Durante el Trayecto</div>
                            <div className="border rounded p-3 bg-white text-xs text-gray-800 mb-2">
                                <span className="font-bold">Restaurante El Descanso</span><br />
                                Carretera Tamazula-Guadalajara Km 45<br />
                                <span className="font-semibold">Duración:</span> 20 minutos<br />
                                <span className="font-semibold">Aproximadamente a las 7:30 am</span><br />
                                En esta parada podrá utilizar los servicios sanitarios, comprar alimentos y bebidas, o simplemente estirar las piernas.
                            </div>
                        </div>
                        {/* Proceso de Abordaje */}
                        <div className="mb-8">
                            <div className="font-semibold mb-2">Proceso de Abordaje</div>
                            <ul className="text-sm space-y-2 list-disc pl-6">
                                <li>
                                    <span className="font-bold">Presentación en el Andén: </span>
                                    Diríjase al Andén 8 donde estará estacionado el autobús de Las Jaras.
                                </li>
                                <li>
                                    <span className="font-bold">Verificación de Identidad: </span>
                                    Presente su identificación oficial al personal de Las Jaras.
                                </li>
                                <li>
                                    <span className="font-bold">Escaneo de Código QR: </span>
                                    El chofer escaneará su código QR para confirmar su reserva.
                                </li>
                                <li>
                                    <span className="font-bold">Entrega de Equipaje: </span>
                                    Entregue su equipaje grande al personal para guardarlo en el compartimento inferior.
                                </li>
                                <li>
                                    <span className="font-bold">Abordaje: </span>
                                    Suba al autobús y ocupe el asiento asignado en su reserva.
                                </li>
                            </ul>
                        </div>
                    </section>
                    {/* Lateral: QR y detalles */}
                    <aside className="w-full md:w-80">
                        <div className="bg-white border rounded-lg p-6 shadow-sm mb-8">
                            <div className="text-sm text-gray-700 font-semibold mb-2">Reserva #LJ29384 <span className="text-green-700">Confirmado</span></div>
                            <div className="text-center">
                                <div className="mb-2 font-semibold">Su Código QR</div>
                                <Image
                                    src={QR_IMG}
                                    alt="Código QR"
                                    width={140}
                                    height={140}
                                    className="mx-auto mb-2"
                                />

                                <div className="text-xs text-gray-500 mb-2">Muestre este código al chofer</div>
                                <button className="w-full py-2 rounded font-bold text-white bg-[#B7804F] hover:bg-[#A06F44] mb-2">Descargar Código QR</button>
                                <button className="w-full py-2 rounded border text-white bg-[#B7804F] hover:bg-[#A06F44] border-[#B7804F]">Enviar por Email</button>
                            </div>
                        </div>
                        {/* Detalles del viaje */}
                        <div className="bg-white border rounded-lg p-6 shadow-sm mb-8">
                            <div className="font-bold mb-2 text-sm">Detalles del Viaje</div>
                            <div className="text-xs mb-1">
                                <div className="flex justify-between"><span>Fecha:</span><span>15 de Octubre, 2023</span></div>
                                <div className="flex justify-between"><span>Hora de Salida:</span><span>6:00 AM</span></div>
                                <div className="flex justify-between"><span>Llegada Estimada:</span><span>8:30 AM</span></div>
                                <div className="flex justify-between"><span>Asientos:</span><span>12A, 12B</span></div>
                            </div>
                            {/* Ruta */}
                            <div className="mt-3 mb-3">
                                <div className="font-semibold text-xs mb-1">Ruta</div>
                                <ul className="text-xs ml-2 text-gray-700">
                                    <li className="font-bold">Terminal Central</li>
                                    <li>⬇</li>
                                    <li>Parada Logística<br /><span className="text-gray-500">Restaurante El Descanso</span></li>
                                    <li>⬇</li>
                                    <li>Las Jaras <span className="text-gray-500">Tamazula</span></li>
                                </ul>
                            </div>
                        </div>
                        {/* Soporte */}
                        <div className="bg-white border rounded-lg p-6 shadow-sm">
                            <div className="font-bold mb-2 text-sm">¿Necesita Ayuda?</div>
                            <div className="text-xs flex flex-col gap-1">
                                <span>Línea de Ayuda: <a href="tel:+523312345678" className="underline">+52 (33) 1234 5678</a></span>
                                <span>Email de Soporte: <a href="mailto:transporte@lasjaras.mx" className="underline">transporte@lasjaras.mx</a></span>
                                <span>Chat en Vivo <span className="text-green-700">Disponible 24/7</span></span>
                                <span>
                  ¿Quiere comprar créditos para el spa?{" "}
                                    <a href="#" className="underline text-blue-700">Haga clic aquí</a>
                </span>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
}
