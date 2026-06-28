import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const WINDOW_DAYS = 30;

type AlAdhanDay = {
  timings: Record<string, string>;
  date: { gregorian: { date: string } };
};

/**
 * Fetches a rolling 30-day window of prayer times from Al Adhan
 * and upserts them into todays_prayers.
 *
 * Designed to run on a bi-weekly cron (1st and 15th of each month).
 * Each run fetches the next 30 days, so halfway through you still
 * have 2+ weeks of data ahead. Old rows (before today) are cleaned
 * up each run.
 *
 * Body (optional): { mosque_id: string }
 * If no mosque_id provided, syncs all mosques.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let filterMosqueId: string | null = null;
    try {
      const body = await req.json();
      filterMosqueId = body?.mosque_id ?? null;
    } catch {
      // No body — sync all mosques
    }

    // Fetch mosques
    let query = supabase
      .from("mosques")
      .select("id, city, state, calculation_method, school");
    if (filterMosqueId) {
      query = query.eq("id", filterMosqueId);
    }
    const { data: mosques, error: mosqueErr } = await query;
    if (mosqueErr) throw new Error(mosqueErr.message);
    if (!mosques || mosques.length === 0) {
      return new Response(
        JSON.stringify({ message: "No mosques found" }),
        {
          status: 200,
          headers: { ...CORS, "Content-Type": "application/json" },
        },
      );
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + WINDOW_DAYS - 1);
    const endStr = endDate.toISOString().split("T")[0];

    // Figure out which calendar months we need to cover the 30-day window
    const monthsNeeded: { year: number; month: number }[] = [];
    const cursor = new Date(now);
    while (cursor <= endDate) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth() + 1;
      if (!monthsNeeded.find((e) => e.year === y && e.month === m)) {
        monthsNeeded.push({ year: y, month: m });
      }
      cursor.setDate(cursor.getDate() + 15);
    }
    // Ensure the end month is included
    const ey = endDate.getFullYear();
    const em = endDate.getMonth() + 1;
    if (!monthsNeeded.find((e) => e.year === ey && e.month === em)) {
      monthsNeeded.push({ year: ey, month: em });
    }

    let totalUpserted = 0;

    for (const mosque of mosques) {
      const city = mosque.city || "New York";
      const country = "US";
      const method = mosque.calculation_method ?? 2;
      const school = mosque.school ?? 0;

      // Fetch all needed months from Al Adhan calendar API
      const allDays: AlAdhanDay[] = [];
      for (const { year, month } of monthsNeeded) {
        const url =
          `https://api.aladhan.com/v1/calendarByCity/${year}/${month}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}&school=${school}`;
        const res = await fetch(url);
        if (!res.ok) {
          console.error(
            `Al Adhan API error for ${city} ${year}/${month}: ${res.status}`,
          );
          continue;
        }
        const json = await res.json();
        allDays.push(...(json.data as AlAdhanDay[]));
      }

      // Filter to 30-day window and build upsert rows
      const rows: {
        mosque_id: string;
        prayer_name: string;
        athan_time: string;
        date: string;
      }[] = [];

      for (const day of allDays) {
        // Al Adhan date format: DD-MM-YYYY -> YYYY-MM-DD
        const [dd, mm, yyyy] = day.date.gregorian.date.split("-");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        if (dateStr < todayStr || dateStr > endStr) continue;

        for (const prayerName of PRAYER_NAMES) {
          const raw = day.timings[prayerName]?.replace(/\s*\(.*\)/, "") ?? "";
          if (!raw) continue;
          rows.push({
            mosque_id: mosque.id,
            prayer_name: prayerName,
            date: dateStr,
            athan_time: raw,
          });
        }
      }

      // Upsert in batches of 100
      for (let i = 0; i < rows.length; i += 100) {
        const batch = rows.slice(i, i + 100);
        const { error: upsertErr } = await supabase
          .from("todays_prayers")
          .upsert(batch, { onConflict: "mosque_id,prayer_name,date" });
        if (upsertErr) {
          console.error(
            `Upsert error for mosque ${mosque.id}:`,
            upsertErr.message,
          );
        } else {
          totalUpserted += batch.length;
        }
      }
    }

    // Clean up old rows (before today)
    await supabase.from("todays_prayers").delete().lt("date", todayStr);

    return new Response(
      JSON.stringify({
        success: true,
        mosques_synced: mosques.length,
        rows_upserted: totalUpserted,
        window: { from: todayStr, to: endStr },
      }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("sync-prayer-times error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
