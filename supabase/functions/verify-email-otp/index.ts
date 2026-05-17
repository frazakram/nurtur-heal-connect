/**
 * Email OTP for the public appointment chatbot.
 *
 * POST { action: "send",   email }            -> emails a 6-digit code
 * POST { action: "verify", email, otp }       -> validates the code
 *
 * Security model:
 *  - Codes are stored only as sha256(lower(email):otp); the plaintext never
 *    leaves this function.
 *  - Uses the service-role key so it can read/write email_otps even though
 *    RLS denies the public anon key (see migration 20260518).
 *  - 10-minute expiry, 5 wrong attempts max, single-use (consumed), and a
 *    send rate-limit of 5 codes per email per hour.
 *
 * Requires migration 20260518_otp_and_booking_ref.sql and the existing
 * GMAIL_USER / GMAIL_APP_PASSWORD secrets (same ones send-appointment-email
 * already uses). SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected by
 * the platform.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OTP_TTL_MIN = 10;
const MAX_ATTEMPTS = 5;
const SEND_LIMIT_PER_HOUR = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const normEmail = (e: string) => String(e || "").trim().toLowerCase();

const maskEmail = (e: string) => {
  const [u, d] = e.split("@");
  if (!d) return e;
  const head = u.length <= 2 ? u[0] ?? "" : u.slice(0, 2);
  return `${head}${"*".repeat(Math.max(3, u.length - 2))}@${d}`;
};

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function retry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts) await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
  throw lastErr;
}

function otpEmailHtml(code: string, hospitalName: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<div style="max-width:480px;margin:28px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#0EA5E9,#0369A1);padding:30px;text-align:center;">
    <div style="font-size:26px;margin-bottom:6px;">🔐</div>
    <h1 style="color:#fff;margin:0;font-size:19px;font-weight:700;">Verify your email</h1>
  </div>
  <div style="padding:28px;text-align:center;">
    <p style="color:#475569;font-size:14px;margin:0 0 18px;">Use this code to confirm your appointment booking:</p>
    <div style="display:inline-block;background:#f0f9ff;border:1px dashed #38bdf8;border-radius:12px;padding:16px 28px;">
      <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0369A1;">${code}</span>
    </div>
    <p style="color:#94a3b8;font-size:12px;margin:18px 0 0;">This code expires in ${OTP_TTL_MIN} minutes. If you didn't request it, you can ignore this email.</p>
    <p style="color:#cbd5e1;font-size:11px;margin:14px 0 0;">${hospitalName}</p>
  </div>
</div></body></html>`;
}

function splitName(full: string) {
  const parts = (full || "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts.shift() || "", lastName: parts.join(" ") };
}

// All appointment PII reads happen here (service role), never in the
// browser, so the public anon key can't enumerate patient records.
async function findByRef(sb: ReturnType<typeof createClient>, ref: string) {
  const { data } = await sb
    .from("appointments")
    .select("patient_name, phone, patient_email, doctor_id, department, booking_ref")
    .eq("booking_ref", ref)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function findByEmail(sb: ReturnType<typeof createClient>, email: string) {
  const { data } = await sb
    .from("appointments")
    .select("patient_name, phone, booking_ref")
    .ilike("patient_email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function prefill(a: any) {
  const { firstName, lastName } = splitName(a.patient_name || "");
  return {
    firstName, lastName,
    phone: a.phone || "",
    doctorId: a.doctor_id || "",
    department: a.department || "",
    bookingRef: a.booking_ref || "",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Supabase env not set");
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;
    let email = normEmail(body.email);
    const bookingRef = String(body.bookingRef || "").trim().toUpperCase();

    // ── send ──────────────────────────────────────────────────────────────
    if (action === "send") {
      // Follow-up flow: caller gives only a booking ref. Resolve the email
      // on file server-side so the booking's contact is never exposed.
      if (!email && bookingRef) {
        const appt = await findByRef(sb, bookingRef);
        if (!appt) return json({ ok: false, reason: "not_found" });
        if (!appt.patient_email) return json({ ok: false, reason: "no_email" });
        email = normEmail(appt.patient_email);
      }

      // Logical failures return HTTP 200 with a reason so the browser client
      // (supabase-js drops the body on non-2xx) can show a specific message.
      if (!EMAIL_RE.test(email)) return json({ ok: false, reason: "bad_email" });

      const sinceISO = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await sb
        .from("email_otps")
        .select("id", { count: "exact", head: true })
        .eq("email", email)
        .gte("created_at", sinceISO);

      if ((count ?? 0) >= SEND_LIMIT_PER_HOUR) {
        return json({ ok: false, reason: "rate_limited" });
      }

      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const otp_hash = await sha256Hex(`${email}:${otp}`);

      // Invalidate any earlier unconsumed codes for this email.
      await sb.from("email_otps").update({ consumed: true })
        .eq("email", email).eq("consumed", false);

      const { error: insErr } = await sb.from("email_otps").insert({
        email,
        otp_hash,
        purpose: "booking",
        expires_at: new Date(Date.now() + OTP_TTL_MIN * 60 * 1000).toISOString(),
        max_attempts: MAX_ATTEMPTS,
      });
      if (insErr) throw insErr;

      const GMAIL_USER = Deno.env.get("GMAIL_USER");
      const GMAIL_PASS = Deno.env.get("GMAIL_APP_PASSWORD");
      if (!GMAIL_USER || !GMAIL_PASS) throw new Error("GMAIL secrets not set");

      const { data: infoRow } = await sb
        .from("hospital_info").select("name").limit(1).single();
      const hospitalName = infoRow?.name || "Care Hospital";

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: GMAIL_USER, pass: GMAIL_PASS },
      });

      await retry(() =>
        transporter.sendMail({
          from: `"${hospitalName}" <${GMAIL_USER}>`,
          to: email,
          subject: `${otp} is your ${hospitalName} verification code`,
          html: otpEmailHtml(otp, hospitalName),
        })
      );

      return json({ ok: true, masked: maskEmail(email), expiresInSec: OTP_TTL_MIN * 60 });
    }

    // ── verify ────────────────────────────────────────────────────────────
    if (action === "verify") {
      if (!EMAIL_RE.test(email)) return json({ ok: false, reason: "bad_email" });
      const otp = String(body.otp || "").replace(/\D/g, "");
      if (otp.length !== 6) return json({ ok: false, reason: "invalid" });

      const { data: row } = await sb
        .from("email_otps")
        .select("*")
        .eq("email", email)
        .eq("consumed", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!row) return json({ ok: false, reason: "expired" });
      if (new Date(row.expires_at).getTime() < Date.now()) {
        await sb.from("email_otps").update({ consumed: true }).eq("id", row.id);
        return json({ ok: false, reason: "expired" });
      }
      if (row.attempts >= row.max_attempts) {
        await sb.from("email_otps").update({ consumed: true }).eq("id", row.id);
        return json({ ok: false, reason: "locked" });
      }

      const match = (await sha256Hex(`${email}:${otp}`)) === row.otp_hash;
      if (!match) {
        const attempts = row.attempts + 1;
        const locked = attempts >= row.max_attempts;
        await sb.from("email_otps")
          .update({ attempts, consumed: locked })
          .eq("id", row.id);
        return json({
          ok: false,
          reason: locked ? "locked" : "invalid",
          attemptsLeft: Math.max(0, row.max_attempts - attempts),
        });
      }

      await sb.from("email_otps").update({ consumed: true }).eq("id", row.id);

      // Identity proven. Release the booking prefill the bot needs WITHOUT
      // the browser ever having read the appointments table.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resp: Record<string, any> = { ok: true };
      if (bookingRef) {
        const appt = await findByRef(sb, bookingRef);
        if (appt) resp.booking = prefill(appt);
      }
      if (!resp.booking) {
        const prior = await findByEmail(sb, email);
        if (prior) {
          resp.returning = {
            name: prior.patient_name || "",
            phone: prior.phone || "",
            bookingRef: prior.booking_ref || "",
          };
        }
      }
      return json(resp);
    }

    return json({ ok: false, reason: "bad_action" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(msg);
    return json({ ok: false, reason: "server_error", error: msg }, 500);
  }
});
