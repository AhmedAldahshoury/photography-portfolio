import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://t7tfos.com",
  integrations: [sitemap()],
});
