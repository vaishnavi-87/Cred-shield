import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    nodePolyfills({
      protocolImports: true,
    }),
  ],

  optimizeDeps: {
    include: [
      "@midnight-ntwrk/compact-runtime",
      "@midnight-ntwrk/midnight-js-contracts",
      "@midnight-ntwrk/midnight-js-fetch-zk-config-provider",
      "@midnight-ntwrk/midnight-js-http-client-proof-provider",
      "@midnight-ntwrk/midnight-js-indexer-public-data-provider",
    ],
    force: true,
  },

  build: {
    target: "esnext",
  },
});
