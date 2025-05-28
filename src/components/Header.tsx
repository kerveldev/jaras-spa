import Link from "next/link";

export default function Header() {
    return (
        <header className="w-full px-6 py-4 border-b bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="font-bold text-lg">Las Jaras</span>
            </div>
            <nav className="flex gap-6 text-sm text-black">
                <Link href="/daypass">Reservar Pases</Link>
                <Link href="/daypass/fecha">Fecha de visita</Link>
                <Link href="/daypass/extras">Extras</Link>
                <Link href="/daypass/transporte">Reserva de transporte</Link>
                <Link href="/daypass/resumen">Confirmación de reserva</Link>
                <Link href="/daypass/creditos">Masajes y spa</Link>
                <Link href="/daypass/transporte">Transporte</Link>
            </nav>
            <div>
                <button className="mr-2 px-4 py-1 border rounded text-black">Iniciar Sesión</button>
                <button className="bg-black text-white px-4 py-1 rounded">Registrarse</button>
            </div>
        </header>
    );
}
