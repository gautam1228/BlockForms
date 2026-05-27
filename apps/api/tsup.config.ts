import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["./src/index.ts"],
    noExternal: ["@repo"],
    /** Native driver must load from node_modules at runtime (Docker). */
    external: ["pg", "pg-native"],
    splitting: false,
    bundle: true,
    outDir: "./dist",
    clean: true,
    env: { IS_SERVER_BUILD: "true" },
    loader: { ".json": "copy" },
    minify: true,
    sourcemap: false,
});
