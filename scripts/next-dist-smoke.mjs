import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");

if (!source.includes("distDir")) throw new Error("Next.js needs a separate development build directory");
if (!source.includes(".next-dev")) throw new Error("Development builds should use .next-dev");

console.log("Next dist directory smoke passed");
