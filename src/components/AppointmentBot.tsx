import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Mic, MicOff, RotateCcw } from "lucide-react";
import { supabase } from "../lib/supabase";
import { getAvailableSlots, scheduledSlots } from "../lib/slots";
import { useHospital } from "../admin/context/HospitalContext";

type Step =
  | "idle" | "lang" | "category" | "bookingId"
  | "firstName" | "lastName" | "email" | "otp" | "phone"
  | "doctor" | "date" | "time" | "confirm" | "booking" | "done" | "error";

type Lang = "en" | "hi";

interface OtpResponse {
  ok: boolean;
  reason?: "rate_limited" | "expired" | "locked" | "invalid" | "bad_email"
    | "bad_action" | "server_error" | "not_found" | "no_email";
  masked?: string;
  attemptsLeft?: number;
  booking?: {
    firstName: string; lastName: string; phone: string;
    doctorId: string; department: string; bookingRef: string;
  };
  returning?: { name: string; phone: string; bookingRef: string };
}

interface Msg { id: number; from: "bot" | "user"; text: string; }
interface BookingForm {
  firstName: string; lastName: string; email: string; phone: string;
  doctorId: string; doctorName: string; department: string; date: string; time: string;
  bookingRef: string;
}

const fmtTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const fmtDate = (d: string, lang: Lang) =>
  new Date(d + "T12:00:00").toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

const todayISO = () => new Date().toISOString().slice(0, 10);

// ── All UI strings in English and Hindi ─────────────────────────────────────
const T = {
  en: {
    headerTitle: "Appointment Booking",
    floatBtn: "Book Appointment",
    greeting1: (name: string) => `Hello! 👋 Welcome to ${name}.`,
    greeting2: "I'll help you book an appointment in a few easy steps.",
    askFirstName: "What is your first name?",
    afterFirstName: (n: string) => `Nice to meet you, ${n}! What is your last name?`,
    afterLastName: "Please share your email address — we'll email a quick verification code to confirm it's really you.",
    invalidEmail: "That doesn't look like a valid email. Please enter a valid email address.",
    categoryPrompt: "Are you a new patient, or returning for a follow-up?",
    catNew: "🆕 New patient",
    catFollow: "🔁 Follow-up patient",
    askBookingId: "Please enter your Booking ID (looks like CARE-AB12CD). You'll find it in your confirmation email.",
    phBookingId: "e.g. CARE-AB12CD",
    lookingUp: "Looking up your booking…",
    bookingNotFound: "I couldn't find a booking with that ID. Please re-check and type it again — or tap the ↻ button above to book as a new patient.",
    foundBooking: (n: string) => `Found it — welcome back, ${n}! 🎉 To protect your details, I'll email you a verification code.`,
    noEmailOnFile: "There's no email on that booking. Please type your email so I can verify it's you.",
    otpSending: "Sending your verification code…",
    otpSent: (m: string) => `I've emailed a 6-digit code to ${m}. Please enter it below — it's valid for 10 minutes.`,
    otpResent: (m: string) => `A new 6-digit code has been sent to ${m}.`,
    phOtp: "6-digit code",
    otpVerifyBtn: "Verify",
    otpResendBtn: "Resend code",
    otpInvalid: (left: number) => `That code isn't right. ${left} attempt${left === 1 ? "" : "s"} left.`,
    otpExpired: "That code has expired. Tap “Resend code” to get a new one.",
    otpLocked: "Too many wrong attempts. Tap “Resend code” for a fresh code.",
    otpTooMany: "Too many code requests. Please wait a few minutes and try again.",
    otpSendFail: "I couldn't send the code. Please check the email address and try again.",
    otpVerified: "✅ Email verified!",
    welcomeBackAuto: (n: string, r: string) => `Welcome back, ${n}! 👋 I found your records (Booking ID: ${r}). I'll continue this as a follow-up — just choose a doctor, date and time.`,
    afterOtpAskPhone: "✅ Email verified! What is your 10-digit mobile number?",
    followupContinue: "Great — let's book your follow-up. Please choose a doctor:",
    invalidPhone: "Please enter a valid 10-digit mobile number.",
    invalidName: "Please enter a valid name.",
    afterPhone: "Great! Please select your preferred doctor:",
    afterDoctor: "Perfect! Now please choose your preferred date. Appointments are available Monday to Saturday:",
    noSlots: "Sorry, no slots available on that date. Please choose another date.",
    slotsAvailable: "Available time slots — please choose one:",
    confirmSummary: (f: Partial<BookingForm>, lang: Lang) =>
      `Here's a summary of your appointment:\n\n` +
      `👤 ${f.firstName} ${f.lastName}\n` +
      `📞 ${f.phone}` +
      (f.email ? `\n📧 ${f.email}` : "") +
      `\n🏥 ${f.department}\n👨‍⚕️ ${f.doctorName}\n` +
      `📅 ${fmtDate(f.date!, lang)}\n⏰ ${fmtTime(f.time!)}\n\n` +
      `By confirming, you agree to our Privacy Policy (see the link in the website footer).\n\nShall I confirm this booking?`,
    confirmYes: "Yes, confirm!",
    confirmNo: "Start over",
    bookingSpinner: "Confirming your appointment…",
    doneMsg: (f: Partial<BookingForm>, hasEmail: boolean, lang: Lang) =>
      `✅ Your appointment is confirmed!\n\n` +
      (f.bookingRef ? `🔖 Booking ID: ${f.bookingRef}\n` : "") +
      `👨‍⚕️ Doctor: ${f.doctorName}\n` +
      `📅 Date: ${fmtDate(f.date!, lang)}\n` +
      `⏰ Time: ${fmtTime(f.time!)}\n\n` +
      (f.bookingRef ? "Save your Booking ID — quote it next time for a faster follow-up. " : "") +
      (hasEmail ? "A confirmation email with pre-visit instructions has been sent. " : "") +
      "Please arrive 10 minutes early. See you soon! 🏥",
    errorMsg: "Sorry, something went wrong. Please call us directly or try again.",
    dateLabel: "Select a date (Mon – Sat)",
    slotsLabel: "Available slots",
    confirmBtn: "✓ Confirm Booking",
    startOver: "Start Over",
    bookAnother: "Book Another Appointment",
    tryAgain: "Try Again",
    phFirstName: "Your first name…",
    phLastName: "Your last name…",
    phEmail: "you@example.com",
    phPhone: "10-digit mobile number…",
  },
  hi: {
    headerTitle: "अपॉइंटमेंट बुकिंग",
    floatBtn: "अपॉइंटमेंट बुक करें",
    greeting1: (name: string) => `नमस्ते! 👋 ${name} में आपका स्वागत है।`,
    greeting2: "मैं कुछ आसान चरणों में आपकी अपॉइंटमेंट बुक करने में मदद करूँगा।",
    askFirstName: "आपका पहला नाम क्या है?",
    afterFirstName: (n: string) => `${n} जी, मिलकर अच्छा लगा! 😊 आपका अंतिम नाम क्या है?`,
    afterLastName: "कृपया अपना ईमेल पता बताएँ — हम यह पक्का करने के लिए एक छोटा सत्यापन कोड भेजेंगे कि यह वाकई आप हैं।",
    invalidEmail: "यह ईमेल सही नहीं लग रहा। कृपया एक सही ईमेल पता दर्ज करें।",
    categoryPrompt: "आप नए मरीज़ हैं या फ़ॉलो-अप के लिए दोबारा आ रहे हैं?",
    catNew: "🆕 नया मरीज़",
    catFollow: "🔁 फ़ॉलो-अप मरीज़",
    askBookingId: "कृपया अपना बुकिंग आईडी दर्ज करें (जैसे CARE-AB12CD)। यह आपके पुष्टि ईमेल में मिलेगा।",
    phBookingId: "जैसे CARE-AB12CD",
    lookingUp: "आपकी बुकिंग ढूँढ रहे हैं…",
    bookingNotFound: "इस आईडी से कोई बुकिंग नहीं मिली। कृपया दोबारा जाँचें और फिर से लिखें — या नए मरीज़ के रूप में बुक करने के लिए ऊपर ↻ बटन दबाएँ।",
    foundBooking: (n: string) => `मिल गया — वापसी पर स्वागत है, ${n}! 🎉 आपकी जानकारी सुरक्षित रखने के लिए मैं आपको एक सत्यापन कोड ईमेल करूँगा।`,
    noEmailOnFile: "उस बुकिंग पर कोई ईमेल नहीं है। कृपया अपना ईमेल लिखें ताकि मैं पुष्टि कर सकूँ कि यह आप हैं।",
    otpSending: "आपका सत्यापन कोड भेजा जा रहा है…",
    otpSent: (m: string) => `मैंने ${m} पर 6 अंकों का कोड भेजा है। कृपया उसे नीचे दर्ज करें — यह 10 मिनट के लिए वैध है।`,
    otpResent: (m: string) => `${m} पर एक नया 6 अंकों का कोड भेज दिया गया है।`,
    phOtp: "6 अंकों का कोड",
    otpVerifyBtn: "सत्यापित करें",
    otpResendBtn: "कोड फिर भेजें",
    otpInvalid: (left: number) => `यह कोड सही नहीं है। ${left} प्रयास बाकी।`,
    otpExpired: "यह कोड समाप्त हो गया है। नया कोड पाने के लिए “कोड फिर भेजें” दबाएँ।",
    otpLocked: "बहुत अधिक ग़लत प्रयास। नया कोड पाने के लिए “कोड फिर भेजें” दबाएँ।",
    otpTooMany: "बहुत अधिक कोड अनुरोध। कृपया कुछ मिनट रुककर फिर प्रयास करें।",
    otpSendFail: "मैं कोड नहीं भेज सका। कृपया ईमेल पता जाँचें और फिर प्रयास करें।",
    otpVerified: "✅ ईमेल सत्यापित!",
    welcomeBackAuto: (n: string, r: string) => `वापसी पर स्वागत है, ${n}! 👋 मुझे आपका रिकॉर्ड मिल गया (बुकिंग आईडी: ${r})। मैं इसे फ़ॉलो-अप के रूप में जारी रखूँगा — बस डॉक्टर, तारीख और समय चुनें।`,
    afterOtpAskPhone: "✅ ईमेल सत्यापित! आपका 10 अंकों का मोबाइल नंबर क्या है?",
    followupContinue: "बढ़िया — आइए आपका फ़ॉलो-अप बुक करें। कृपया डॉक्टर चुनें:",
    invalidPhone: "कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।",
    invalidName: "कृपया एक सही नाम दर्ज करें।",
    afterPhone: "बढ़िया! कृपया अपने पसंदीदा डॉक्टर चुनें:",
    afterDoctor: "बिल्कुल सही! अब अपनी पसंदीदा तारीख चुनें। (सोमवार से शनिवार)",
    noSlots: "खेद है, इस तारीख पर कोई स्लॉट उपलब्ध नहीं है। कृपया दूसरी तारीख चुनें।",
    slotsAvailable: "उपलब्ध समय स्लॉट — एक चुनें:",
    confirmSummary: (f: Partial<BookingForm>, lang: Lang) =>
      `आपकी अपॉइंटमेंट का सारांश:\n\n` +
      `👤 ${f.firstName} ${f.lastName}\n` +
      `📞 ${f.phone}` +
      (f.email ? `\n📧 ${f.email}` : "") +
      `\n🏥 ${f.department}\n👨‍⚕️ ${f.doctorName}\n` +
      `📅 ${fmtDate(f.date!, lang)}\n⏰ ${fmtTime(f.time!)}\n\n` +
      `कन्फर्म करके आप हमारी प्राइवेसी पॉलिसी से सहमत होते हैं (लिंक वेबसाइट फ़ुटर में)।\n\nक्या मैं यह अपॉइंटमेंट कन्फर्म करूँ?`,
    confirmYes: "हाँ, कन्फर्म करें!",
    confirmNo: "फिर से शुरू करें",
    bookingSpinner: "आपकी अपॉइंटमेंट कन्फर्म हो रही है…",
    doneMsg: (f: Partial<BookingForm>, hasEmail: boolean, lang: Lang) =>
      `✅ आपकी अपॉइंटमेंट कन्फर्म हो गई!\n\n` +
      (f.bookingRef ? `🔖 बुकिंग आईडी: ${f.bookingRef}\n` : "") +
      `👨‍⚕️ डॉक्टर: ${f.doctorName}\n` +
      `📅 तारीख: ${fmtDate(f.date!, lang)}\n` +
      `⏰ समय: ${fmtTime(f.time!)}\n\n` +
      (f.bookingRef ? "अपनी बुकिंग आईडी सहेज लें — अगली बार तेज़ फ़ॉलो-अप के लिए इसे बताएँ। " : "") +
      (hasEmail ? "पुष्टि ईमेल प्री-विज़िट निर्देशों के साथ भेज दिया गया है। " : "") +
      "कृपया 10 मिनट पहले आएँ। जल्द मिलते हैं! 🏥",
    errorMsg: "क्षमा करें, कुछ गड़बड़ हो गई। कृपया हमें सीधे कॉल करें या फिर से प्रयास करें।",
    dateLabel: "तारीख चुनें (सोमवार – शनिवार)",
    slotsLabel: "उपलब्ध समय स्लॉट",
    confirmBtn: "✓ अपॉइंटमेंट कन्फर्म करें",
    startOver: "फिर से शुरू करें",
    bookAnother: "एक और अपॉइंटमेंट बुक करें",
    tryAgain: "फिर से प्रयास करें",
    phFirstName: "पहला नाम लिखें…",
    phLastName: "अंतिम नाम लिखें…",
    phEmail: "you@example.com",
    phPhone: "10 अंकों का मोबाइल नंबर…",
  },
} as const;

let msgId = 0;
const mkMsg = (from: Msg["from"], text: string): Msg => ({ id: ++msgId, from, text });

const LS_KEY = "careHospital.apptBot.v1";
const newId = () => globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
// "otp"/"bookingId" are intentionally NOT resumable: the OTP is short-lived
// and server-side, so a refreshed session must re-request a fresh code.
const SAFE_RESUME = ["lang", "category", "firstName", "lastName", "email", "phone", "doctor", "date"];

interface Persisted {
  sessionId?: string; lang?: Lang; step?: Step;
  form?: Partial<BookingForm>; msgs?: Msg[];
}
const loadPersisted = (): Persisted => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "null") || {}; }
  catch { return {}; }
};

export const AppointmentBot = () => {
  const { doctors, info } = useHospital();

  const initialRef = useRef<Persisted>();
  const initial = (initialRef.current ??= loadPersisted());
  if (Array.isArray(initial.msgs) && initial.msgs.length && msgId === 0) {
    msgId = initial.msgs.reduce((mx: number, m: Msg) => Math.max(mx, m.id || 0), 0);
  }
  const resumeStep: Step = (() => {
    const s = initial.step;
    if (!s || s === "idle" || s === "booking" || s === "done" || s === "error") return "idle";
    if (SAFE_RESUME.includes(s)) return s;
    return initial.form?.doctorId ? "date" : "idle";
  })();

  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>(initial.sessionId || newId());
  const [step, setStep] = useState<Step>(resumeStep);
  const [lang, setLang] = useState<Lang>(initial.lang || "en");
  const [msgs, setMsgs] = useState<Msg[]>(initial.msgs || []);
  const [input, setInput] = useState("");
  const [form, setForm] = useState<Partial<BookingForm>>(initial.form || {});
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [listening, setListening] = useState(false);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [otpMasked, setOtpMasked] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const t = T[lang];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loadingSlots, busy]);

  useEffect(() => {
    if (["firstName", "lastName", "email", "phone", "bookingId", "otp"].includes(step)) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [step]);

  const say  = useCallback((text: string) => setMsgs(p => [...p, mkMsg("bot",  text)]), []);
  const hear = useCallback((text: string) => setMsgs(p => [...p, mkMsg("user", text)]), []);

  // Persist the session so a page refresh resumes an in-progress booking.
  useEffect(() => {
    if (step === "idle") return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ sessionId, lang, step, form, msgs: msgs.slice(-30) }));
    } catch { /* quota / private mode — non-fatal */ }
  }, [sessionId, lang, step, form, msgs]);

  const clearPersist = () => { try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ } };

  // Lead capture: upsert the partial booking so staff can follow up if the
  // patient abandons. Best-effort — never blocks or breaks the chat, and is
  // a no-op until the booking_dropoffs migration is applied.
  const saveDropoff = async (stage: string, extra: Partial<BookingForm> = {}) => {
    const f = { ...form, ...extra };
    if (!f.firstName && !f.phone) return;
    try {
      await supabase.from("booking_dropoffs").upsert({
        session_id: sessionId,
        stage,
        patient_name: [f.firstName, f.lastName].filter(Boolean).join(" ") || null,
        phone: f.phone || null,
        email: f.email || null,
        doctor_name: f.doctorName || null,
        department: f.department || null,
        date: f.date || null,
        time: f.time || null,
        status: "open",
        source: "chatbot",
        updated_at: new Date().toISOString(),
      }, { onConflict: "session_id" });
    } catch { /* table not migrated yet — ignore */ }
  };

  const markBooked = async () => {
    try {
      await supabase.from("booking_dropoffs")
        .update({ status: "booked", updated_at: new Date().toISOString() })
        .eq("session_id", sessionId);
    } catch { /* ignore */ }
  };

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      say(lang === "hi"
        ? "आपका ब्राउज़र वॉयस इनपुट सपोर्ट नहीं करता।"
        : "Your browser doesn't support voice input. Please type instead.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SR();
    recognition.lang = lang === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    setListening(true);

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend   = () => setListening(false);
    recognition.start();
  };

  const openBot = () => {
    setOpen(true);
    if (step === "idle") {
      setStep("lang");
      setMsgs([
        mkMsg("bot", "नमस्ते / Hello! 👋"),
        mkMsg("bot", "कृपया अपनी भाषा चुनें\nPlease select your language:"),
      ]);
    }
  };

  const selectLang = (chosen: Lang) => {
    setLang(chosen);
    hear(chosen === "hi" ? "हिंदी" : "English");
    const tx = T[chosen];
    say(tx.greeting1(info.name));
    say(tx.greeting2);
    say(tx.categoryPrompt);
    setStep("category");
  };

  const restart = () => {
    clearPersist();
    setSessionId(newId());
    setStep("idle"); setMsgs([]); setForm({});
    setSlots([]); setInput(""); setOpen(false);
    setIsFollowUp(false); setOtpMasked(""); setBusy(false);
  };

  // ── patient category ──────────────────────────────────────────────────────
  const selectCategory = (kind: "new" | "follow") => {
    if (kind === "follow") {
      setIsFollowUp(true);
      hear(t.catFollow);
      say(t.askBookingId);
      setStep("bookingId");
    } else {
      setIsFollowUp(false);
      hear(t.catNew);
      say(t.askFirstName);
      setStep("firstName");
    }
  };

  // Normalize loose user input ("ab12cd", "care ab12cd") to CARE-XXXXXX.
  const normRef = (v: string) => {
    const s = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const body = s.replace(/^CARE/, "");
    return "CARE-" + body;
  };

  // ── email OTP ─────────────────────────────────────────────────────────────
  // The OTP function does all appointment PII reads (server-side). The bot
  // only ever sends an email OR a booking ref and gets back a masked address.
  const sendOtp = async (
    opts: { email?: string; bookingRef?: string },
    resend = false,
  ) => {
    setBusy(true);
    say(t.otpSending);
    try {
      const { data, error } = await supabase.functions.invoke<OtpResponse>("verify-email-otp", {
        body: { action: "send", email: opts.email, bookingRef: opts.bookingRef },
      });
      if (error || !data?.ok) {
        if (data?.reason === "not_found") say(t.bookingNotFound);
        else if (data?.reason === "no_email") { say(t.noEmailOnFile); setStep("email"); }
        else if (data?.reason === "rate_limited") say(t.otpTooMany);
        else say(t.otpSendFail);
        if (data?.reason === "not_found") setStep("bookingId");
        else if (data?.reason !== "no_email") setStep(opts.bookingRef ? "bookingId" : "email");
        return;
      }
      const shown = data.masked || opts.email || "";
      setOtpMasked(shown);
      say(resend ? t.otpResent(shown) : t.otpSent(shown));
      setStep("otp");
    } catch {
      say(t.otpSendFail);
      setStep(opts.bookingRef ? "bookingId" : "email");
    } finally {
      setBusy(false);
    }
  };

  const afterVerified = (data: OtpResponse) => {
    say(t.otpVerified);
    if (data.booking) {
      const b = data.booking;
      const doc = doctors.find(d => d.id === b.doctorId);
      setIsFollowUp(true);
      setForm(f => ({
        ...f,
        firstName: b.firstName, lastName: b.lastName,
        phone: b.phone, doctorId: b.doctorId,
        doctorName: doc?.name || "",
        department: b.department || f.department,
        bookingRef: b.bookingRef,
      }));
      say(t.followupContinue);
      setStep("doctor");
      return;
    }
    if (data.returning?.bookingRef) {
      const r = data.returning;
      setIsFollowUp(true);
      setForm(f => ({ ...f, bookingRef: r.bookingRef, phone: f.phone || r.phone }));
      say(t.welcomeBackAuto(r.name || `${form.firstName} ${form.lastName}`.trim(), r.bookingRef));
      say(t.followupContinue);
      setStep("doctor");
      return;
    }
    if (isFollowUp) {
      say(t.followupContinue);
      setStep("doctor");
    } else {
      say(t.afterOtpAskPhone);
      setStep("phone");
    }
  };

  const verifyOtp = async (codeRaw: string) => {
    const code = codeRaw.replace(/\D/g, "");
    if (code.length !== 6) { say(t.otpInvalid(0)); return; }
    hear("••••••");
    setInput("");
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke<OtpResponse>("verify-email-otp", {
        body: {
          action: "verify",
          email: form.email,
          otp: code,
          bookingRef: form.bookingRef || undefined,
        },
      });
      if (error || !data) {
        say(t.otpSendFail);
      } else if (data.ok) {
        afterVerified(data);
      } else if (data.reason === "expired") {
        say(t.otpExpired);
      } else if (data.reason === "locked") {
        say(t.otpLocked);
      } else {
        say(t.otpInvalid(typeof data.attemptsLeft === "number" ? data.attemptsLeft : 0));
      }
    } catch {
      say(t.otpSendFail);
    } finally {
      setBusy(false);
    }
  };

  // ── follow-up: resolve an existing booking by its reference ───────────────
  // No DB read here — the OTP function looks up the booking server-side and
  // sends the code to the email on file. The patient's details are released
  // only after the code is verified (see afterVerified).
  const lookupBooking = async (refRaw: string) => {
    const ref = normRef(refRaw);
    setForm(f => ({ ...f, bookingRef: ref }));
    await sendOtp({ bookingRef: ref });
  };

  // ── fetch slots ───────────────────────────────────────────────────────────
  const fetchSlots = async (doctorId: string, date: string) => {
    setLoadingSlots(true);
    const schedule = doctors.find(d => d.id === doctorId)?.schedule ?? null;
    const available = await getAvailableSlots(doctorId, date, schedule);
    setLoadingSlots(false);
    return available;
  };

  // ── confirm booking ───────────────────────────────────────────────────────
  const confirmBooking = async () => {
    setStep("booking");
    try {
      const patientName = `${form.firstName} ${form.lastName}`.trim();
      const { data: created, error } = await supabase.rpc("public_create_appointment", {
        p_patient_name: patientName,
        p_phone: form.phone,
        p_email: form.email || "",
        p_department: form.department,
        p_doctor_id: form.doctorId,
        p_date: form.date,
        p_time: form.time,
      });
      if (error) throw error;
      const bookingRef = (created as { booking_ref?: string } | null)?.booking_ref || "";

      if (form.email) {
        const doc = doctors.find(d => d.id === form.doctorId);
        await supabase.functions.invoke("send-appointment-email", {
          body: {
            to: form.email,
            patientName,
            doctorName: form.doctorName,
            department: form.department,
            date: form.date,
            time: form.time,
            phone: form.phone,
            hospitalName: info.name,
            hospitalPhone: info.phone,
            hospitalEmail: info.email,
            precautions: doc?.precautions || "",
            bookingRef,
          },
        });
      }

      // DPDP: log the consent shown at the confirm step (best-effort).
      supabase.rpc("record_consent", {
        p_subject: form.email || form.phone || "",
        p_channel: "booking_bot",
      });

      setStep("done");
      markBooked();
      clearPersist();
      say(t.doneMsg({ ...form, bookingRef }, !!form.email, lang));
    } catch {
      setStep("error");
      say(t.errorMsg);
    }
  };

  // ── text input ────────────────────────────────────────────────────────────
  const handleSend = () => {
    const val = input.trim();
    if (!val) return;
    setInput("");

    if (step === "firstName") {
      if (val.length < 2) { say(t.invalidName); return; }
      hear(val);
      setForm(f => ({ ...f, firstName: val }));
      say(t.afterFirstName(val));
      setStep("lastName");
      return;
    }
    if (step === "lastName") {
      if (val.length < 1) { say(t.invalidName); return; }
      hear(val);
      setForm(f => ({ ...f, lastName: val }));
      say(t.afterLastName);
      setStep("email");
      return;
    }
    if (step === "bookingId") {
      hear(val);
      lookupBooking(val);
      return;
    }
    if (step === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { say(t.invalidEmail); return; }
      hear(val);
      const email = val.toLowerCase();
      setForm(f => ({ ...f, email }));
      saveDropoff("contact", { email });
      sendOtp({ email });
      return;
    }
    if (step === "phone") {
      const digits = val.replace(/[^0-9]/g, "");
      if (digits.length !== 10) { say(t.invalidPhone); return; }
      hear(val);
      setForm(f => ({ ...f, phone: digits }));
      say(t.afterPhone);
      setStep("doctor");
      saveDropoff("contact", { phone: digits });
      return;
    }
  };

  const selectDoctor = (doc: typeof doctors[0]) => {
    hear(doc.name);
    const dept = doc.accent === "gyn" ? "Gynecology" : "Pediatrics";
    setForm(f => ({ ...f, doctorId: doc.id, doctorName: doc.name, department: dept }));
    say(t.afterDoctor);
    setStep("date");
    saveDropoff("doctor", { doctorId: doc.id, doctorName: doc.name, department: dept });
  };

  const selectDate = async (date: string) => {
    hear(fmtDate(date, lang));
    setForm(f => ({ ...f, date }));
    setStep("time");
    saveDropoff("date", { date });
    const available = await fetchSlots(form.doctorId!, date);
    setSlots(available);
    if (available.length === 0) { say(t.noSlots); setStep("date"); }
    else say(t.slotsAvailable);
  };

  const selectTime = (time: string) => {
    hear(fmtTime(time));
    const updated = { ...form, time };
    setForm(updated);
    say(t.confirmSummary(updated, lang));
    setStep("confirm");
    saveDropoff("confirm", { time });
  };

  // ── date grid (only days the selected doctor actually works) ──────────────
  const selectedSchedule = doctors.find(d => d.id === form.doctorId)?.schedule ?? null;
  const dateOptions: string[] = [];
  {
    const base = new Date();
    for (let i = 0; i < 60 && dateOptions.length < 28; i++) {
      const d = new Date(base); d.setDate(base.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      if (scheduledSlots(selectedSchedule, iso).length > 0) dateOptions.push(iso);
    }
  }

  const isTextStep = ["firstName", "lastName", "email", "phone", "bookingId"].includes(step);

  return (
    <>
      {/* Floating trigger */}
      {!open && (
        <button onClick={openBot} aria-label={t.floatBtn}
          className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-primary-deep text-white shadow-lg px-5 py-3 font-semibold text-sm hover:scale-105 transition-transform">
          <MessageSquare className="h-5 w-5" />
          {t.floatBtn}
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
          style={{ width: "min(390px, calc(100vw - 3rem))", height: "min(600px, calc(100dvh - 5rem))" }}>

          {/* Header */}
          <div className="gradient-primary text-white px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20 shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-sm leading-tight">{t.headerTitle}</div>
              <div className="text-xs text-white/80 truncate">{info.name}</div>
            </div>
            {!["idle", "lang", "booking", "done", "error"].includes(step) && (
              <button
                onClick={() => { hear(t.startOver); restart(); }}
                title={lang === "hi" ? "फिर से शुरू करें" : "Start over"}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/20 transition-colors shrink-0 text-white/80 hover:text-white">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/20 transition-colors shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/20">
            {msgs.map(m => (
              <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line break-words ${
                  m.from === "bot"
                    ? "bg-background border border-border text-foreground rounded-tl-sm shadow-sm"
                    : "bg-primary text-white rounded-tr-sm"
                }`}>{m.text}</div>
              </div>
            ))}
            {(loadingSlots || busy) && (
              <div className="flex justify-start">
                <div className="bg-background border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            {step === "booking" && (
              <div className="flex justify-center py-4">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin inline-block" />
                  {t.bookingSpinner}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-border bg-background shrink-0">

            {/* Language selection */}
            {step === "lang" && (
              <div className="p-3 flex gap-3">
                <button onClick={() => selectLang("en")}
                  className="flex-1 rounded-xl border-2 border-primary bg-primary-soft text-primary-deep font-bold py-3 text-sm hover:bg-primary hover:text-white transition-colors">
                  🇬🇧 English
                </button>
                <button onClick={() => selectLang("hi")}
                  className="flex-1 rounded-xl border-2 border-primary bg-primary-soft text-primary-deep font-bold py-3 text-sm hover:bg-primary hover:text-white transition-colors">
                  🇮🇳 हिंदी
                </button>
              </div>
            )}

            {/* Patient category */}
            {step === "category" && (
              <div className="p-3 flex flex-col gap-2">
                <button onClick={() => selectCategory("new")}
                  className="w-full rounded-xl border-2 border-primary bg-primary-soft text-primary-deep font-bold py-3 text-sm hover:bg-primary hover:text-white transition-colors">
                  {t.catNew}
                </button>
                <button onClick={() => selectCategory("follow")}
                  className="w-full rounded-xl border-2 border-primary/60 text-primary-deep font-bold py-3 text-sm hover:bg-primary hover:text-white transition-colors">
                  {t.catFollow}
                </button>
              </div>
            )}

            {/* OTP entry */}
            {step === "otp" && (
              <form onSubmit={e => { e.preventDefault(); if (!busy) verifyOtp(input); }} className="p-3 space-y-2">
                <input ref={inputRef} value={input}
                  onChange={e => setInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric" autoComplete="one-time-code" placeholder={t.phOtp}
                  className="w-full text-center tracking-[0.5em] text-lg font-bold rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
                <div className="flex gap-2">
                  <button type="submit" disabled={busy || input.length !== 6}
                    className="flex-1 rounded-xl bg-primary text-white font-semibold py-2.5 text-sm hover:bg-primary-deep transition-colors disabled:opacity-50">
                    {t.otpVerifyBtn}
                  </button>
                  <button type="button" disabled={busy} onClick={() => sendOtp({ email: form.email || undefined, bookingRef: form.bookingRef || undefined }, true)}
                    className="flex-1 rounded-xl border border-border text-sm font-semibold py-2.5 hover:bg-secondary/60 transition-colors disabled:opacity-50">
                    {t.otpResendBtn}
                  </button>
                </div>
              </form>
            )}

            {/* Doctor selection */}
            {step === "doctor" && (
              <div className="p-3 space-y-2 max-h-52 overflow-y-auto">
                {doctors.map(d => (
                  <button key={d.id} onClick={() => selectDoctor(d)}
                    className="w-full flex items-center gap-3 rounded-xl border border-border p-3 hover:border-primary hover:bg-primary-soft/30 transition-colors text-left">
                    <img src={d.img} alt={d.name} className="h-11 w-11 rounded-full object-cover object-[center_35%] shrink-0" />
                    <div>
                      <div className="font-semibold text-primary-deep text-sm">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Date picker */}
            {step === "date" && (
              <div className="p-3">
                <div className="text-xs text-muted-foreground font-medium mb-2">{t.dateLabel}</div>
                <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {dateOptions.map(d => {
                    const dt = new Date(d + "T12:00:00");
                    const isToday = d === todayISO();
                    return (
                      <button key={d} onClick={() => selectDate(d)}
                        className={`rounded-xl border p-2 text-center hover:border-primary hover:bg-primary-soft/40 transition-colors ${isToday ? "border-primary bg-primary-soft/20" : "border-border"}`}>
                        <div className="text-[10px] text-muted-foreground">{dt.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "short" })}</div>
                        <div className="text-sm font-bold text-primary-deep">{dt.getDate()}</div>
                        <div className="text-[10px] text-muted-foreground">{dt.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { month: "short" })}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Time slots */}
            {step === "time" && slots.length > 0 && (
              <div className="p-3">
                <div className="text-xs text-muted-foreground font-medium mb-2">{t.slotsLabel}</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {slots.map(s => (
                    <button key={s} onClick={() => selectTime(s)}
                      className="rounded-lg border border-primary/30 bg-primary-soft text-primary-deep text-xs font-semibold py-2 hover:bg-primary hover:text-white hover:border-primary transition-colors">
                      {fmtTime(s)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm */}
            {step === "confirm" && (
              <div className="p-3 flex gap-2">
                <button onClick={() => { hear(t.confirmYes); confirmBooking(); }}
                  className="flex-1 rounded-xl bg-primary text-white font-semibold py-2.5 text-sm hover:bg-primary-deep transition-colors">
                  {t.confirmBtn}
                </button>
                <button onClick={() => { hear(t.confirmNo); restart(); }}
                  className="flex-1 rounded-xl border border-border text-sm font-semibold py-2.5 hover:bg-secondary/60 transition-colors">
                  {t.startOver}
                </button>
              </div>
            )}

            {/* Done */}
            {step === "done" && (
              <div className="p-3">
                <button onClick={restart}
                  className="w-full rounded-xl border border-border text-sm font-semibold py-2.5 hover:bg-secondary/60 transition-colors">
                  {t.bookAnother}
                </button>
              </div>
            )}

            {/* Error */}
            {step === "error" && (
              <div className="p-3">
                <button onClick={restart}
                  className="w-full rounded-xl bg-primary text-white font-semibold py-2.5 text-sm hover:bg-primary-deep transition-colors">
                  {t.tryAgain}
                </button>
              </div>
            )}

            {/* Text input */}
            {isTextStep && (
              <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2 p-3">
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  type="text"
                  disabled={busy}
                  placeholder={
                    listening
                      ? (lang === "hi" ? "सुन रहा हूँ…" : "Listening…")
                      : step === "firstName" ? t.phFirstName
                      : step === "lastName"  ? t.phLastName
                      : step === "email"     ? t.phEmail
                      : step === "bookingId" ? t.phBookingId
                      : t.phPhone
                  }
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                />
                {/* Mic button */}
                <button type="button" onClick={startVoice} disabled={busy}
                  title={lang === "hi" ? "बोलकर बताएँ" : "Speak your answer"}
                  className={`grid h-10 w-10 place-items-center rounded-xl transition-colors shrink-0 disabled:opacity-50 ${
                    listening
                      ? "bg-red-500 text-white animate-pulse"
                      : "border border-border text-muted-foreground hover:border-primary hover:text-primary"
                  }`}>
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <button type="submit" disabled={busy}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white hover:bg-primary-deep transition-colors shrink-0 disabled:opacity-50">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
