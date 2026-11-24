import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eco Salud Digital",
    short_name: "Eco Salud",
    description:
      "Consulta ágil para médicos de primer contacto y app portátil de historial médico para pacientes.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6FAF8",
    theme_color: "#0F2D3D",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
