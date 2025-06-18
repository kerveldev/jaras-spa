// components/Stepper.tsx
import React from "react";

interface StepperProps {
    activeStep: number; // El paso actual (1 o 2)
    steps?: string[]; // Títulos de los pasos, por si quieres personalizar después
    breadcrumb?: React.ReactNode; // Para personalizar la ruta superior
}

export const Stepper: React.FC<StepperProps> = ({
                                                    activeStep = 1,
                                                    steps = ["1", "2"],
                                                    breadcrumb = (
                                                        <div className="text-xs text-gray-400 mb-4">
                                                            Inicio &gt; Reservaciones &gt; <span className="text-black">Fecha y Horario</span>
                                                        </div>
                                                    ),
                                                }) => (
    <div className="max-w-xl w-full mx-auto pt-6 pb-4 px-4 text-center">
        {breadcrumb}
        <div className="flex items-center gap-2 mb-8 justify-center">
            {steps.map((step, idx) => (
                <div className="flex items-center" key={step}>
                    <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-black
              ${activeStep === idx + 1
                            ? "bg-[#18668b] text-white"
                            : "bg-gray-200 text-gray-500"}
            `}
                    >
                        {step}
                    </div>
                    {idx !== steps.length - 1 && (
                        <div className="w-12 h-1 bg-gray-200 mx-1 rounded" />
                    )}
                </div>
            ))}
        </div>
    </div>
);

export default Stepper;
