import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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

function buildEmailHtml(opts: {
  patientName: string; doctorName: string; department: string;
  date: string; time: string; phone: string;
  hospitalName: string; hospitalPhone: string; hospitalEmail?: string;
  precautions?: string; isReminder?: boolean;
}) {
  const precautionsHtml = opts.precautions
    ? `<div style="background:#fff7ed;border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #f59e0b;">
         <h3 style="margin:0 0 12px;color:#92400e;font-size:15px;">Before Your Visit — Please Note</h3>
         <div style="color:#78350f;line-height:1.9;white-space:pre-line;font-size:14px;">${opts.precautions}</div>
       </div>`
    : "";

  const header = opts.isReminder
    ? `<h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">Appointment Reminder</h1>
       <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">Your appointment is tomorrow!</p>`
    : `<div style="font-size:28px;margin-bottom:8px;">✅</div>
       <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">Appointment Confirmed!</h1>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<div style="max-width:580px;margin:28px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#0EA5E9,#0369A1);padding:32px;text-align:center;">${header}</div>
  <div style="padding:28px;">
    <p style="color:#334155;font-size:15px;margin:0 0 4px;">Dear <strong>${opts.patientName}</strong>,</p>
    <p style="color:#64748b;font-size:13px;margin:0 0 20px;">
      ${opts.isReminder
        ? "This is a friendly reminder for your appointment <strong>tomorrow</strong>."
        : "Your appointment has been successfully booked."}
    </p>

    <div style="background:#f8fafc;border-radius:12px;padding:18px;border-left:4px solid #0EA5E9;margin-bottom:18px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:7px 0;color:#64748b;width:36%;">👨‍⚕️ Doctor</td><td style="padding:7px 0;font-weight:700;color:#0369A1;">${opts.doctorName}</td></tr>
        <tr><td style="padding:7px 0;color:#64748b;">🏥 Department</td><td style="padding:7px 0;font-weight:600;">${opts.department}</td></tr>
        <tr><td style="padding:7px 0;color:#64748b;">📅 Date</td><td style="padding:7px 0;font-weight:600;">${fmtDateLong(opts.date)}</td></tr>
        <tr><td style="padding:7px 0;color:#64748b;">⏰ Time</td><td style="padding:7px 0;font-weight:600;">${fmt12(opts.time)}</td></tr>
        <tr><td style="padding:7px 0;color:#64748b;">📞 Phone</td><td style="padding:7px 0;font-weight:600;">${opts.phone}</td></tr>
      </table>
    </div>

    ${precautionsHtml}

    <div style="background:#f0f9ff;border-radius:12px;padding:14px;margin-bottom:20px;">
      <p style="margin:0;color:#0369A1;font-size:13px;font-weight:600;">ℹ️ Reminders</p>
      <ul style="margin:8px 0 0;padding-left:18px;color:#475569;font-size:13px;line-height:1.9;">
        <li>Arrive <strong>10 minutes early</strong></li>
        <li>Carry a valid photo ID and previous medical records</li>
        <li>For cancellations, call at least 2 hours in advance</li>
      </ul>
    </div>

    <div style="border-top:1px solid #e2e8f0;padding-top:16px;text-align:center;">
      <p style="color:#64748b;font-size:13px;margin:0;">
        Questions? Call <strong>${opts.hospitalPhone}</strong>
        ${opts.hospitalEmail ? ` or email <strong>${opts.hospitalEmail}</strong>` : ""}
      </p>
      <p style="color:#94a3b8;font-size:11px;margin:10px 0 0;">${opts.hospitalName} — Caring for you with compassion.</p>
    </div>
  </div>
</div>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json();
    const {
      to, patientName, doctorName, department, date, time,
      phone, hospitalName, hospitalPhone, hospitalEmail, precautions,
      isReminder = false,
    } = body;

    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_PASS = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!GMAIL_USER || !GMAIL_PASS) throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD secret not set");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });

    const subject = isReminder
      ? `Reminder: Your appointment tomorrow — ${doctorName} at ${fmt12(time)}`
      : `Appointment Confirmed — ${doctorName} on ${fmtDateLong(date)}`;

    await transporter.sendMail({
      from: `"${hospitalName}" <${GMAIL_USER}>`,
      to,
      subject,
      html: buildEmailHtml({ patientName, doctorName, department, date, time, phone, hospitalName, hospitalPhone, hospitalEmail, precautions, isReminder }),
    });

    return new Response(JSON.stringify({ ok: true }), {
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
