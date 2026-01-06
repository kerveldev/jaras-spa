// src/lib/daypass/date.ts

/**
 * Formato corto para conceptos / tickets / bancos.
 * Entrada: "YYYY-MM-DD"
 * Salida:  "06 Ene 2026"
 *
 * Nota: usamos T12:00:00 para evitar desfases por timezone (UTC vs local).
 */
export function formatFechaCortaEs(fechaISO: string): string {
  if (!fechaISO) return "";

  const d = new Date(`${fechaISO}T12:00:00`);

  const day = String(d.getDate()).padStart(2, "0");
  const month = d
    .toLocaleString("es-MX", { month: "short" })
    .replace(".", "");

  const year = d.getFullYear();
  const monthCap = month.charAt(0).toUpperCase() + month.slice(1);

  return `${day} ${monthCap} ${year}`;
}
