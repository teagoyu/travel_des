import { readFile } from "node:fs/promises";

const component = await readFile(new URL("../src/components/DatePickerField.tsx", import.meta.url), "utf8");
const form = await readFile(new URL("../src/components/CreateTripForm.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");

for (const marker of ["date-picker", "date-picker__calendar", "date-picker__day", "aria-haspopup=\"dialog\""]) {
  if (!component.includes(marker) && !form.includes(marker) && !styles.includes(marker)) throw new Error(`日历组件缺少标记：${marker}`);
}
if (!form.includes("DatePickerField")) throw new Error("表单没有使用自定义日历组件");
console.log("Calendar picker smoke passed");
