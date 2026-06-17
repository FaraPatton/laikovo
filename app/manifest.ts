import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Лайково Финансы",
    short_name: "Лайково",
    description: "Контроль расходов по ремонту и обустройству квартиры.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f4ee",
    theme_color: "#3f765f",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
