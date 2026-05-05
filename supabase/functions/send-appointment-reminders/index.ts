/**
 * Daily reminder function — invoke via Supabase pg_cron.
 * Sends reminder emails to patients whose appointment is tomorrow.
 *
 * Setup SQL (run once in Supabase SQL Editor):
 *
 *   SELECT cron.schedule(
 *     'daily-appointment-reminders',
 *     '30 14 * * *',   -- 8:00 PM IST = 14:30 UTC  (adjust if needed)
 *     $$
 *     SELECT net.http_post(
 *       url     := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-appointment-reminders',
 *       headers := jsonb_build_object(
 *                    'Authorization', 'Bearer <YOUR_SUPABASE_ANON_KEY>',
 *                    'Content-Type',  'application/json'
 *                  ),
 *       body    := '{}'::jsonb
 *     ) AS request_id;
 *     $$
 *   );
 *
 * Replace <YOUR_PROJECT_REF> and <YOUR_SUPABASE_ANON_KEY> from
 * Supabase dashboard → Project Settings → API.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const fmt12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const fmtDateLong = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_PASS = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!GMAIL_USER || !GMAIL_PASS) throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD not set");

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Tomorrow's date in IST (UTC+5:30)
    const now = new Date();
    const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    ist.setDate(ist.getDate() + 1);
    const tomorrow = ist.toISOString().slice(0, 10);

    // Fetch tomorrow's scheduled appointments that have an email
    const { data: appointments, error } = await sb
      .from("appointments")
      .select("*, doctors(name, precautions, department)")
      .eq("date", tomorrow)
      .eq("status", "Scheduled")
      .not("patient_email", "is", null)
      .neq("patient_email", "");

    if (error) throw error;

    // Hospital info for email footer
    const { data: infoRow } = await sb
      .from("hospital_info")
      .select("name, phone, email")
      .limit(1)
      .single();

    const hospitalName  = infoRow?.name  || "Care Hospital";
    const hospitalPhone = infoRow?.phone || "";
    const hospitalEmail = infoRow?.email || "";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });

    let sent = 0;
    for (const appt of appointments ?? []) {
      try {
        const precautions = appt.doctors?.precautions || "";
        const department  = appt.department || appt.doctors?.department || "";

        await transporter.sendMail({
          from: `"${hospitalName}" <${GMAIL_USER}>`,
          to: appt.patient_email,
          subject: `Reminder: Your appointment tomorrow — ${appt.doctors?.name} at ${fmt12(appt.time)}`,
          html: buildHtml({
            patientName: appt.patient_name,
            doctorName: appt.doctors?.name || "",
            department,
            date: appt.date,
            time: appt.time,
            phone: appt.phone,
            hospitalName,
            hospitalPhone,
            hospitalEmail,
            precautions,
          }),
        });
        sent++;
      } catch (mailErr) {
        console.error(`Failed for ${appt.patient_email}:`, mailErr);
      }
    }

    return new Response(JSON.stringify({ ok: true, sent, date: tomorrow }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

function buildHtml(opts: {
  patientName: string; doctorName: string; department: string;
  date: string; time: string; phone: string;
  hospitalName: string; hospitalPhone: string; hospitalEmail: string;
  precautions: string;
}) {
  const precHtml = opts.precautions
    ? `<div style="background:#fff7ed;border-radius:12px;padding:18px;margin:18px 0;border-left:4px solid #f59e0b;">
         <h3 style="margin:0 0 10px;color:#92400e;font-size:14px;">Before Your Visit — Please Note</h3>
         <div style="color:#78350f;line-height:1.9;white-space:pre-line;font-size:13px;">${opts.precautions}</div>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#0EA5E9,#0369A1);padding:28px;text-align:center;">
    <div style="font-size:26px;margin-bottom:6px;">⏰</div>
    <h1 style="color:#fff;margin:0;font-size:20px;">Appointment Reminder</h1>
    <p style="color:rgba(255,255,255,0.85);margin:5px 0 0;font-size:13px;">Your appointment is <strong>tomorrow</strong></p>
  </div>
  <div style="padding:24px;">
    <p style="color:#334155;font-size:15px;margin:0 0 4px;">Dear <strong>${opts.patientName}</strong>,</p>
    <p style="color:#64748b;font-size:13px;margin:0 0 18px;">Just a friendly reminder for your appointment tomorrow.</p>

    <div style="background:#f8fafc;border-radius:12px;padding:16px;border-left:4px solid #0EA5E9;margin-bottom:16px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#64748b;width:36%;">👨‍⚕️ Doctor</td><td style="padding:6px 0;font-weight:700;color:#0369A1;">${opts.doctorName}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">🏥 Department</td><td style="padding:6px 0;font-weight:600;">${opts.department}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">📅 Date</td><td style="padding:6px 0;font-weight:600;">${fmtDateLong(opts.date)}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">⏰ Time</td><td style="padding:6px 0;font-weight:600;">${fmt12(opts.time)}</td></tr>
      </table>
    </div>

    ${precHtml}

    <div style="background:#f0f9ff;border-radius:12px;padding:13px;margin-bottom:18px;">
      <ul style="margin:0;padding-left:18px;color:#475569;font-size:13px;line-height:1.9;">
        <li>Arrive <strong>10 minutes early</strong></li>
        <li>Carry photo ID and previous records</li>
        <li>Call to cancel at least 2 hours before</li>
      </ul>
    </div>

    <div style="border-top:1px solid #e2e8f0;padding-top:14px;text-align:center;">
      <p style="color:#64748b;font-size:13px;margin:0;">Questions? Call <strong>${opts.hospitalPhone}</strong></p>
      <p style="color:#94a3b8;font-size:11px;margin:8px 0 0;">${opts.hospitalName}</p>
    </div>
  </div>
</div>
</body></html>`;
}
