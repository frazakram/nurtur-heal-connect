/**
 * Daily logical backup — free-tier disaster recovery.
 *
 * Reads every important table with the service role and writes one JSON
 * snapshot to the private `backups` Storage bucket, then prunes snapshots
 * older than 30 days. Schema lives in the repo migrations; this covers data.
 *
 * Invoked daily by pg_cron (see 20260520_backups_consent_ratelimit.sql).
 * Deploy with --no-verify-jwt (cron calls it with the anon bearer, same as
 * the reminders function). Uses SUPABASE_SERVICE_ROLE_KEY internally.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TABLES = [
  "doctors", "patients", "appointments", "beds", "staff",
  "expenses", "bills", "inventory", "blog_posts", "hospital_info",
  "messages", "booking_dropoffs",
];

const BUCKET = "backups";
const RETAIN_DAYS = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Supabase env not set");
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dump: Record<string, any[]> = {};
    const counts: Record<string, number> = {};
    for (const t of TABLES) {
      const { data, error } = await sb.from(t).select("*");
      if (error) throw new Error(`${t}: ${error.message}`);
      dump[t] = data || [];
      counts[t] = dump[t].length;
    }

    const today = new Date().toISOString().slice(0, 10);
    const path = `backup-${today}.json`;
    const payload = JSON.stringify(
      { takenAt: new Date().toISOString(), counts, data: dump },
    );

    const up = await sb.storage.from(BUCKET).upload(path, payload, {
      contentType: "application/json",
      upsert: true,
    });
    if (up.error) throw new Error(`upload: ${up.error.message}`);

    // Prune snapshots older than RETAIN_DAYS.
    const cutoff = new Date(Date.now() - RETAIN_DAYS * 864e5)
      .toISOString().slice(0, 10);
    const { data: files } = await sb.storage.from(BUCKET).list();
    const stale = (files || [])
      .map((f) => f.name)
      .filter((n) => /^backup-\d{4}-\d{2}-\d{2}\.json$/.test(n) &&
        n.slice(7, 17) < cutoff);
    if (stale.length) await sb.storage.from(BUCKET).remove(stale);

    return new Response(
      JSON.stringify({ ok: true, file: path, counts, pruned: stale.length }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("db-backup:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
