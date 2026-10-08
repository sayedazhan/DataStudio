import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Azhan Data Studio",
    short_name: "Data Studio",
    description: "Automated data intelligence for CSV and Excel files.",
    start_url: "/studio",
    display: "standalone",
    background_color: "#f7f9fd",
    theme_color: "#0a1934",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
