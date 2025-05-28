"use client";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const SPA_MIN = 500;

const serviciosSpa = [
    {
        nombre: "Masaje Relajante",
        desc: "Disfruta de un masaje de 60 minutos que alivia la tensión y el estrés.",
        precio: 800,
        tiempo: "60 minutos"
    },
    {
        nombre: "Circuito Hidrotermal",
        desc: "Acceso completo a piscinas termales, sauna, vapor y área de relajación.",
        precio: 500,
        tiempo: "Acceso por día"
    },
    {
        nombre: "Facial Rejuvenecedor",
        desc: "Tratamiento facial completo con productos naturales y orgánicos.",
        precio: 650,
        tiempo: "45 minutos"
    }
];

export default function CargarCreditosPage() {
    const [tipo, setTipo] = useState<"spa" | "souvenir">("spa");
    const [numBrazalete, setNumBrazalete] = useState("");
    const [nombrePortador, setNombrePortador] = useState("");
    const [monto, setMonto] = useState<number>(1000);
    const [pago, setPago] = useState<"tarjeta" | "paypal" | "oxxo">("tarjeta");
    const [notificar, setNotificar] = useState(false);

    // Lógica de resumen
    const cargoServicio = 50;
    const total = monto + cargoServicio;

    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
            <Header />

            <main className="max-w-5xl w-full mx-auto px-4 py-12 flex-1">
                <h2 className="text-2xl font-bold mb-2 text-black">Agregar Crédito al Brazalete</h2>                <p className="mb-8 text-black">
                    Añade crédito al brazalete de tus amigos para acceder al área de Spa, reservar masajes o comprar souvenirs.
                </p>

                {/* Opciones de tipo de crédito */}
                <div className="flex gap-4 mb-8">
                    <button
                        className={`flex-1 border rounded p-4 flex flex-col items-start ${tipo === "spa" ? "border-black bg-[#f6fafb]" : "bg-white"}`}
                        onClick={() => setTipo("spa")}
                    >
                        <span className="font-bold mb-1 text-black">Crédito para Spa</span>
                        <span className="text-xs text-black">Acceso al área de spa y posibilidad de reservar masajes.<br /><span className="font-semibold">Desde ${SPA_MIN} MXN</span></span>
                    </button>
                    <button
                        className={`flex-1 border rounded p-4 flex flex-col items-start ${tipo === "souvenir" ? "border-black bg-[#f6fafb]" : "bg-white"}`}
                        onClick={() => setTipo("souvenir")}
                    >
                        <span className="font-bold mb-1  text-black">Crédito para Souvenirs</span>
                        <span className="text-xs text-black">Compra anticipada para la tienda de recuerdos.<br /><span className="font-semibold">Cualquier monto</span></span>
                    </button>
                </div>

                {/* Formulario */}
                <form className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <section className="md:col-span-2">
                        <div className="mb-6">
                            <label className="block font-semibold mb-2  text-black">Número de brazalete</label>
                            <input
                                className="border rounded px-3 py-2 w-full mb-2"
                                placeholder="Ej. BR-12345"
                                value={numBrazalete}
                                onChange={e => setNumBrazalete(e.target.value)}
                            />
                            <span className="text-xs text-gray-500">Encuentra el número impreso en la parte posterior del brazalete</span>
                            <span className="text-xs text-gray-500">Encuentra el número impreso en la parte posterior del brazalete</span>
                        </div>
                        <div className="mb-6">
                            <label className="block font-semibold mb-2 text-black">Nombre del portador</label>
                            <input
                                className="border rounded px-3 py-2 w-full"
                                placeholder="Nombre completo"
                                value={nombrePortador}
                                onChange={e => setNombrePortador(e.target.value)}
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block font-semibold mb-2 text-black">Monto a agregar</label>
                            <input
                                type="number"
                                min={tipo === "spa" ? SPA_MIN : 1}
                                className="border rounded px-3 py-2 w-full mb-3"
                                value={monto}
                                onChange={e => setMonto(Number(e.target.value))}
                            />
                            <div className="flex gap-2 mb-2">
                                {[500, 1000, 1500, 2000].map((v) => (
                                    <button
                                        type="button"
                                        key={v}
                                        className={`px-4 py-2 rounded border text-sm font-semibold ${
                                            monto === v ? "bg-[#18668b] text-white border-[#18668b]" : "bg-white border-gray-300"
                                        }`}
                                        onClick={() => setMonto(v)}
                                    >
                                        ${v}
                                    </button>
                                ))}
                            </div>
                            <label className="inline-flex items-center text-xs gap-2 text-black">
                                <input
                                    type="checkbox"
                                    checked={notificar}
                                    onChange={() => setNotificar(!notificar)}
                                />
                                Enviar notificación al portador del brazalete
                            </label>
                        </div>

                        {/* Pago */}
                        <div className="mb-6">
                            <div className="font-semibold mb-2">Método de pago</div>
                            <div className="flex gap-6 mb-4">
                                <label>
                                    <input
                                        type="radio"
                                        name="pago"
                                        checked={pago === "tarjeta"}
                                        onChange={() => setPago("tarjeta")}
                                    /> Tarjeta
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="pago"
                                        checked={pago === "paypal"}
                                        onChange={() => setPago("paypal")}
                                    /> PayPal
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="pago"
                                        checked={pago === "oxxo"}
                                        onChange={() => setPago("oxxo")}
                                    /> OXXO
                                </label>
                            </div>
                            {/* Campos tarjeta */}
                            {pago === "tarjeta" && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <input className="border rounded px-3 py-2 col-span-2" placeholder="1234 5678 9012 3456" maxLength={19} />
                                    <input className="border rounded px-3 py-2" placeholder="MM/AA" maxLength={5} />
                                    <input className="border rounded px-3 py-2" placeholder="123" maxLength={3} />
                                    <input className="border rounded px-3 py-2 col-span-2 mt-2 md:mt-0" placeholder="Nombre como aparece en la tarjeta" />
                                </div>
                            )}
                        </div>
                    </section>
                    {/* Resumen */}
                    <aside className="w-full md:w-72">
                        <div className="bg-white border rounded-lg p-6 shadow-sm mb-4">
                            <h4 className="font-bold mb-3 text-black">Resumen</h4>
                            <div className="flex justify-between mb-1 text-sm">
                                <span>Crédito para {tipo === "spa" ? "Spa" : "Souvenirs"}</span>
                                <span>${monto.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mb-1 text-sm">
                                <span className="text-black">Cargo por servicio</span>
                                <span>${cargoServicio.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-base mt-2 border-t pt-2">
                                <span className="text-black" >Total</span>
                                <span className="text-black" >${total.toFixed(2)}</span>
                            </div>
                            <div className="mt-4 text-xs text-black">
                                <div className="font-semibold mb-2">Beneficios incluidos:</div>
                                <ul className="list-disc pl-4 mb-2">
                                    <li>Acceso ilimitado al área de spa</li>
                                    <li>Reserva prioritaria para masajes</li>
                                    <li>15% de descuento en tratamientos adicionales</li>
                                </ul>
                                <div className="bg-gray-100 p-2 rounded mt-3">
                                    <div className="font-bold mb-1">Información importante</div>
                                    El crédito se activará inmediatamente después de la compra. El portador del brazalete podrá utilizarlo en cualquier momento durante su visita.
                                </div>
                            </div>
                            <button className="w-full mt-4 py-2 rounded font-bold text-white bg-[#18668b] hover:bg-[#14526d] transition">Confirmar y pagar</button>
                            <button className="w-full mt-2 py-2 rounded border text-black bg-gray-100">Cancelar</button>
                        </div>
                    </aside>
                </form>

                {/* Servicios disponibles */}
                <section className="mt-16">
                    <h3 className="font-bold text-lg mb-4">Servicios disponibles con crédito de Spa</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {serviciosSpa.map((s) => (
                            <div key={s.nombre} className="bg-white border rounded-lg p-6 flex flex-col items-start">
                                <div className="font-bold mb-1">{s.nombre}</div>
                                <div className="text-xs text-gray-600 mb-2">{s.desc}</div>
                                <div className="font-semibold text-sm mb-2">${s.precio} MXN</div>
                                <div className="text-xs text-gray-500">{s.tiempo}</div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
