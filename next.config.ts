import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Guarda en el móvil las páginas ya visitadas 30 s: volver atrás o repetir es instantáneo
  experimental: { staleTimes: { dynamic: 30, static: 300 } },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn-images.dzcdn.net" },
      { protocol: "https", hostname: "e-cdns-images.dzcdn.net" },
    ],
  },
};

export default nextConfig;
