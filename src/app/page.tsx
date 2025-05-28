"use client";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
      <div className="min-h-screen flex flex-col justify-between items-center bg-gradient-to-b from-[#d2f3f3] via-[#f5fafc] to-[#fff]">
        {/* Header */}
        <header className="w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/image.png" alt="Las Jaras logo" width={44} height={44} />
            <span className="text-xl font-bold text-[#18668b]">Las Jaras</span>
          </div>
          <nav className="flex gap-6 text-sm">
            <Link href="/daypass">Reservar</Link>
            <Link href="/daypass/extras">Buffet</Link>
            <Link href="/daypass/creditos">Masajes y spa</Link>
            <Link href="/daypass/transporte">Transporte</Link>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="flex flex-col items-center gap-8 mt-12 flex-1">
          <Image
              src="/image.png"
              alt="Las Jaras"
              width={100}
              height={100}
              className="rounded-full border shadow-xl"
          />
          <h1 className="text-3xl md:text-5xl font-bold text-[#1e405f] text-center">
            Bienvenido a <span className="text-[#18668b]">Las Jaras</span>
          </h1>
          <p className="max-w-xl text-center text-lg text-gray-700">
            Relájate y vive una experiencia inolvidable en nuestras aguas termales.
            Haz tu reservación de manera fácil y rápida en línea.
          </p>
          <Link
              href="/daypass"
              className="mt-6 px-8 py-3 bg-[#18668b] text-white font-semibold rounded-xl shadow-lg hover:bg-[#14526d] transition"
          >
            Reserva tu Daypass
          </Link>
        </main>

        {/* Footer */}
        <footer className="w-full py-4 mt-8 border-t text-sm text-gray-500 text-center bg-[#f9fbfc]">
          © {new Date().getFullYear()} Las Jaras. Todos los derechos reservados.
        </footer>
      </div>
  );
}
