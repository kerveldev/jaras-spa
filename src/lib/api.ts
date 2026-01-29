export function apiUrl(path: string) {
  // path esperado: "/api/..."
  if (!path.startsWith("/")) path = "/" + path;

  // Forzamos a usar el proxy SIEMPRE
  return `/api/proxy${path}`;
}
