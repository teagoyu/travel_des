import { access } from "node:fs/promises";

const themes = ["childhood", "detective", "fantasy"];
const assets = ["character.svg", "hero.svg", "sticker.svg", "empty-scenery.svg"];
for (const theme of themes) {
  for (const asset of assets) {
    try { await access(new URL(`../public/themes/${theme}/${asset}`, import.meta.url)); }
    catch { throw new Error(`missing theme asset: ${theme}/${asset}`); }
  }
}
console.log("theme assets smoke: PASS");
