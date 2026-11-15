import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

/** Datos para instalar Rela Music como app en el móvil (y base para la futura app). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.short,
    description: "Puntúa tus discos canción a canción, descubre música de tu nicho y compártela con tu gente.",
    start_url: "/",
    display: "standalone",
    background_color: "#09070c",
    theme_color: "#8b5cf6",
    lang: "es",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
