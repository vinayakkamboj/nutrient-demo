import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import copy from "rollup-plugin-copy"

// https://vite.dev/config/
export default defineConfig({
  plugins: [copy({
      targets: [
        {
          // Nutrient Web SDK requires its assets to be in the `public` directory so it can load them at runtime.
          src: "node_modules/@nutrient-sdk/viewer/dist/nutrient-viewer-lib",
          dest: "public/",
        },
      ],
      hook: "buildStart", // Copy assets when build starts.
    }), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})