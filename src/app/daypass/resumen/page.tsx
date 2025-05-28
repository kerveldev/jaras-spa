"use client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Genera un QR falso para demo
const QRCODE_SRC = "https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=EJEMPLO-CODIGO-QR";
const MAPA_BOLETO = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Map_symbol_transport_bus.svg/320px-Map_symbol_transport_bus.svg.png";

export default function ConfirmacionReservaPage() {
    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
            <Header />

            <main className="max-w-5xl w-full mx-auto px-4 py-12 flex-1">
                {/* Mensaje de confirmación */}
                <div className="text-center mb-10">
                    <div className="text-3xl mb-4 text-black">¡Reserva Confirmada!</div>
                    <div className="text-lg text-gray-700">
                        Gracias por tu reserva en Las Jaras. A continuación encontrarás tus boletos de acceso.
                    </div>
                </div>

                {/* Detalles de la reserva */}
                <section className="bg-white border rounded mb-10 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2 text-sm font-semibold">
                        <div>
                            <div className="text-gray-500 font-normal">Fecha de Visita</div>
                            <div>Sábado, 15 de Julio, 2023</div>
                        </div>
                        <div>
                            <div className="text-gray-500 font-normal">Visitantes</div>
                            <div>4 Adultos, 2 Niños</div>
                        </div>
                        <div>
                            <div className="text-gray-500 font-normal">Hora de Llegada</div>
                            <div>10:30 AM</div>
                        </div>
                        <div className="text-right md:text-left mt-2 md:mt-0">
                            <div className="text-xs text-gray-500">Confirmación</div>
                            <div className="font-bold text-black">#LJ-28754</div>
                        </div>
                    </div>
                </section>

                {/* Boletos de acceso y autobús */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="bg-white border rounded p-6 flex flex-col items-center">
                        <div className="font-bold text-black mb-2">Boletos de Acceso</div>
                        <div className="mb-2 text-xs text-gray-600">Presenta este código QR en la entrada principal</div>
                        <img src={QRCODE_SRC} alt="Código QR acceso" className="mb-2" />
                        <div className="text-xs text-center text-gray-500">
                            Válido para 6 personas (4 adultos, 2 niños)<br />
                            Incluye acceso a todas las instalaciones
                        </div>
                    </div>
                    <div className="bg-white border rounded p-6 flex flex-col items-center">
                        <div className="font-bold text-black mb-2">Boletos de Autobús</div>
                        <div className="mb-2 text-xs text-gray-600">Presenta este código QR al abordar el autobús</div>
                        <img src={MAPA_BOLETO} alt="Boleto autobús" className="mb-2 w-40 h-40 object-contain" />
                        <div className="text-xs text-center text-gray-500">
                            Ruta: Centro de Guadalajara &rarr; Las Jaras<br />
                            Salida: 9:00 AM · Llegada: 10:30 AM<br />
                            Asientos: B12, B13, B14, B15, B16, B17
                        </div>
                    </div>
                </section>

                {/* Detalles y extras */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 text-sm">
                    <div className="bg-white border rounded p-4 flex flex-col justify-center">
                        <div className="font-bold text-black mb-2 flex items-center gap-2">🧖‍♀️ Créditos de Spa</div>
                        <div className="mb-2 text-black">Has adquirido 2 créditos para servicios de spa.</div>
                        <div className="text-black">Valor: $1,200 MXN</div>
                        <a className="text-blue-600 underline mt-1 cursor-pointer" href="#">Ver detalles</a>
                    </div>
                    <div className="bg-white border rounded p-4 flex flex-col justify-center">
                        <div className="font-bold text-black mb-2 flex items-center gap-2">🚌 Información del Autobús</div>
                        <div className="text-black">Punto de encuentro: Estación Central de Autobuses.</div>
                        <div className="text-black">Salida: 9:00 AM</div>
                        <a className="text-blue-600 underline mt-1 cursor-pointer" href="#">Ver ubicación</a>
                    </div>
                    <div className="bg-white border rounded p-4 flex flex-col justify-center">
                        <div className="font-bold text-black mb-2 flex items-center gap-2">⭐ Extras Adquiridos</div>
                        <ul className="list-disc ml-5">
                            <li className="text-black">Buffet Mexicano (6 personas)</li>
                            <li className="text-black">Acceso a área VIP</li>
                            <li className="text-black">Toallas (6 unidades)</li>
                        </ul>
                    </div>
                </section>

                {/* Botones acción */}
                <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
                    <button className="bg-black text-white px-6 py-2 rounded shadow hover:bg-[#333]">
                        Descargar Boletos (PDF)
                    </button>
                    <button className="border px-6 py-2 rounded font-semibold shadow hover:bg-gray-100">
                        Enviar por Email
                    </button>
                    <button className="border px-6 py-2 rounded font-semibold shadow hover:bg-gray-100">
                        Imprimir Boletos
                    </button>
                </div>

                {/* Progreso de reserva */}
                <section className="mt-12 mb-6">
                    <div className="font-bold text-black mb-2 text-center">Tu proceso de reserva</div>
                    <div className="flex justify-center gap-2 items-center">
                        {["Compra de Boletos", "Selección de Fecha", "Compra de Extras", "Reserva de Transporte", "Resumen de Orden"].map((step, idx, arr) => (
                            <div className="flex items-center" key={step}>
                                <span className="text-xs">{step}</span>
                                {idx < arr.length - 1 && (
                                    <div className="w-8 h-1 bg-gray-400 mx-2 rounded"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
