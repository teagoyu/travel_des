import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import type { DayPlan } from "./types";

const execFileAsync = promisify(execFile);
type FlyHotel = { name?: string; address?: string; price?: string; rate?: string; star?: string; mainPic?: string; detailUrl?: string };

export async function searchHotels(destination: string, checkIn: string, checkOut: string, qualityFirst = true): Promise<NonNullable<DayPlan["hotels"]>> {
  const key = process.env.FLYAI_API_KEY;
  if (!key) return [];
  try {
    const bin = path.join(process.cwd(), "node_modules/.bin/flyai");
    const args = ["search-hotel", "--dest-name", destination, "--check-in-date", checkIn, "--check-out-date", checkOut, "--sort", qualityFirst ? "rate_desc" : "price_asc"];
    if (qualityFirst) args.push("--hotel-stars", "3,4,5", "--hotel-types", "酒店");
    const { stdout } = await execFileAsync(bin, args, {
      env: { ...process.env, FLYAI_API_KEY: key },
      timeout: 25_000,
      maxBuffer: 2 * 1024 * 1024,
    });
    const parsed = JSON.parse(stdout) as { data?: { itemList?: FlyHotel[] } };
    const hotels = (parsed.data?.itemList ?? []).filter((hotel) => hotel.name && hotel.price);
    return hotels.slice(0, 5).map((hotel) => ({
      name: hotel.name!, address: hotel.address, price: hotel.price, rate: hotel.rate, star: hotel.star, imageUrl: hotel.mainPic, bookingUrl: hotel.detailUrl,
      source: { provider: "flyai-fliggy", fetchedAt: new Date().toISOString(), status: "verified" as const },
    }));
  } catch { return []; }
}
