import Link from "next/link";

export default function Header() {
    return (
        <header className="w-full bg-white border-b  py-4">
            <div className="max-w-6xl mx-auto px-4 flex flex-col items-center">
                <span className="text-3xl font-titles text-[#B7804F] tracking-wide">Las Jaras</span>
                <span className="text-sm text-gray-500 mt-1">
                  Reserva y disfruta una experiencia única de relajación
                </span>
            </div>
        </header>

    );
}
