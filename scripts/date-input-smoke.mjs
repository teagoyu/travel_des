import { readFile } from "node:fs/promises";

const form = await readFile(new URL("../src/components/CreateTripForm.tsx", import.meta.url), "utf8");
const picker = await readFile(new URL("../src/components/DatePickerField.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");

for (const marker of ["date-field", "date-field__control", "date-field__icon"]) {
  if (!form.includes(marker) && !styles.includes(marker)) throw new Error(`日期控件缺少标记：${marker}`);
}
if (!picker.includes('type="date"')) throw new Error("日期控件必须保留原生日期选择能力");
console.log("Date input smoke passed");
