export default function Footer() {
    return (
        <footer className="bg-white border-t py-8 mt-auto">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 px-4 text-xs text-gray-500">
                <div>
                    <div className="font-bold mb-1 text-black">Las Jaras</div>
                    Disfruta de una experiencia única en nuestras instalaciones de spa y recreación, con servicios de primera calidad y un entorno natural incomparable.
                </div>
                <div>
                    <div className="font-bold mb-1 text-black">Enlaces Rápidos</div>
                    <ul>
                        <li>Comprar Boletos</li>
                        <li>Nuestras Instalaciones</li>
                        <li>Servicios de Spa</li>
                        <li>Transporte Las Jaras Bus</li>
                        <li>Restaurante y Buffet</li>
                        <li>Tienda de Souvenirs</li>
                    </ul>
                </div>
                <div>
                    <div className="font-bold mb-1 text-black">Soporte</div>
                    <ul>
                        <li>Preguntas Frecuentes</li>
                        <li>Términos y Condiciones</li>
                        <li>Política de Privacidad</li>
                        <li>Política de Cancelación</li>
                        <li>Contacto</li>
                    </ul>
                </div>
                <div>
                    <div className="font-bold mb-1 text-black">Contacto</div>
                    Carretera Tamazula-Guadalajara Km 15, Jalisco, México<br />
                    +52 (33) 1234 5678<br />
                    reservaciones@lasjaras.mx<br />
                    Abierto: 8:00 AM - 8:00 PM
                </div>
            </div>
            <div className="text-center text-xs text-gray-400 mt-6">
                © {new Date().getFullYear()} Las Jaras. Todos los derechos reservados.
            </div>
        </footer>
    );
}
