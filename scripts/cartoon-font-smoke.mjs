import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
for (const marker of ["--font-cartoon-display", "Hannotate SC", "STKaiti", "Arial Rounded MT Bold"]) {
  if (!css.includes(marker)) throw new Error(`missing cartoon font marker: ${marker}`);
}
if (!css.includes("font-family: var(--font-cartoon-display)")) throw new Error("serif headings are not using cartoon display font");
console.log("cartoon font smoke: PASS");
