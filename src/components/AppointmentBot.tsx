import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Mic, MicOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import { getAvailableSlots, scheduledSlots } from "../lib/slots";
import { useHospital } from "../admin/context/HospitalContext";

type Step =
  | "idle" | "lang" | "firstName" | "lastName" | "email" | "phone"
  | "doctor" | "date" | "time" | "confirm" | "booking" | "done" | "error";

type Lang = "en" | "hi";

interface Msg { id: number; from: "bot" | "user"; text: string; }
interface BookingForm {
  firstName: string; lastName: string; email: string; phone: string;
  doctorId: string; doctorName: string; department: string; date: string; time: string;
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
    afterLastName: "Can you share your email address? (Type 'skip' to continue without email)",
    invalidEmail: "That doesn't look like a valid email. Please try again or type 'skip'.",
    skipWord: "skip",
    emailSkipped: "No problem! What is your 10-digit mobile number?",
    emailAccepted: "Got it! What is your 10-digit mobile number?",
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
      `📅 ${fmtDate(f.date!, lang)}\n⏰ ${fmtTime(f.time!)}\n\nShall I confirm this booking?`,
    confirmYes: "Yes, confirm!",
    confirmNo: "Start over",
    bookingSpinner: "Confirming your appointment…",
    doneMsg: (f: Partial<BookingForm>, hasEmail: boolean, lang: Lang) =>
      `✅ Your appointment is confirmed!\n\n` +
      `👨‍⚕️ Doctor: ${f.doctorName}\n` +
      `📅 Date: ${fmtDate(f.date!, lang)}\n` +
      `⏰ Time: ${fmtTime(f.time!)}\n\n` +
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
    phEmail: "Email or type skip…",
    phPhone: "10-digit mobile number…",
  },
  hi: {
    headerTitle: "अपॉइंटमेंट बुकिंग",
    floatBtn: "अपॉइंटमेंट बुक करें",
    greeting1: (name: string) => `नमस्ते! 👋 ${name} में आपका स्वागत है।`,
    greeting2: "मैं कुछ आसान चरणों में आपकी अपॉइंटमेंट बुक करने में मदद करूँगा।",
    askFirstName: "आपका पहला नाम क्या है?",
    afterFirstName: (n: string) => `${n} जी, मिलकर अच्छा लगा! 😊 आपका अंतिम नाम क्या है?`,
    afterLastName: "क्या आप अपना ईमेल पता बता सकते हैं? (बिना ईमेल के जारी रखने के लिए 'skip' लिखें)",
    invalidEmail: "यह ईमेल सही नहीं लग रहा। कृपया फिर से लिखें या 'skip' करें।",
    skipWord: "skip",
    emailSkipped: "कोई बात नहीं! आपका 10 अंकों का मोबाइल नंबर क्या है?",
    emailAccepted: "ठीक है! आपका 10 अंकों का मोबाइल नंबर क्या है?",
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
      `📅 ${fmtDate(f.date!, lang)}\n⏰ ${fmtTime(f.time!)}\n\nक्या मैं यह अपॉइंटमेंट कन्फर्म करूँ?`,
    confirmYes: "हाँ, कन्फर्म करें!",
    confirmNo: "फिर से शुरू करें",
    bookingSpinner: "आपकी अपॉइंटमेंट कन्फर्म हो रही है…",
    doneMsg: (f: Partial<BookingForm>, hasEmail: boolean, lang: Lang) =>
      `✅ आपकी अपॉइंटमेंट कन्फर्म हो गई!\n\n` +
      `👨‍⚕️ डॉक्टर: ${f.doctorName}\n` +
      `📅 तारीख: ${fmtDate(f.date!, lang)}\n` +
      `⏰ समय: ${fmtTime(f.time!)}\n\n` +
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
    phEmail: "ईमेल या 'skip' लिखें…",
    phPhone: "10 अंकों का मोबाइल नंबर…",
  },
} as const;

let msgId = 0;
const mkMsg = (from: Msg["from"], text: string): Msg => ({ id: ++msgId, from, text });

export const AppointmentBot = () => {
  const { doctors, info } = useHospital();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [lang, setLang] = useState<Lang>("en");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [form, setForm] = useState<Partial<BookingForm>>({});
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const t = T[lang];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loadingSlots]);

  useEffect(() => {
    if (["firstName", "lastName", "email", "phone"].includes(step)) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [step]);

  const say  = useCallback((text: string) => setMsgs(p => [...p, mkMsg("bot",  text)]), []);
  const hear = useCallback((text: string) => setMsgs(p => [...p, mkMsg("user", text)]), []);

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
    say(tx.askFirstName);
    setStep("firstName");
  };

  const restart = () => {
    setStep("idle"); setMsgs([]); setForm({});
    setSlots([]); setInput(""); setOpen(false);
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
      const { error } = await supabase.from("appointments").insert([{
        patient_name: `${form.firstName} ${form.lastName}`,
        phone: form.phone,
        patient_email: form.email || null,
        department: form.department,
        doctor_id: form.doctorId,
        date: form.date,
        time: form.time,
        status: "Scheduled",
      }]);
      if (error) throw error;

      if (form.email) {
        const doc = doctors.find(d => d.id === form.doctorId);
        await supabase.functions.invoke("send-appointment-email", {
          body: {
            to: form.email,
            patientName: `${form.firstName} ${form.lastName}`,
            doctorName: form.doctorName,
            department: form.department,
            date: form.date,
            time: form.time,
            phone: form.phone,
            hospitalName: info.name,
            hospitalPhone: info.phone,
            hospitalEmail: info.email,
            precautions: doc?.precautions || "",
          },
        });
      }

      setStep("done");
      say(t.doneMsg(form, !!form.email, lang));
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
    if (step === "email") {
      hear(val);
      if (val.toLowerCase() === t.skipWord) {
        setForm(f => ({ ...f, email: "" }));
        say(t.emailSkipped);
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        say(t.invalidEmail); return;
      } else {
        setForm(f => ({ ...f, email: val }));
        say(t.emailAccepted);
      }
      setStep("phone");
      return;
    }
    if (step === "phone") {
      const digits = val.replace(/[^0-9]/g, "");
      if (digits.length !== 10) { say(t.invalidPhone); return; }
      hear(val);
      setForm(f => ({ ...f, phone: digits }));
      say(t.afterPhone);
      setStep("doctor");
      return;
    }
  };

  const selectDoctor = (doc: typeof doctors[0]) => {
    hear(doc.name);
    setForm(f => ({ ...f, doctorId: doc.id, doctorName: doc.name, department: doc.accent === "gyn" ? "Gynecology" : "Pediatrics" }));
    say(t.afterDoctor);
    setStep("date");
  };

  const selectDate = async (date: string) => {
    hear(fmtDate(date, lang));
    setForm(f => ({ ...f, date }));
    setStep("time");
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

  const isTextStep = ["firstName", "lastName", "email", "phone"].includes(step);

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
            {loadingSlots && (
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
                  placeholder={
                    listening
                      ? (lang === "hi" ? "सुन रहा हूँ…" : "Listening…")
                      : step === "firstName" ? t.phFirstName
                      : step === "lastName"  ? t.phLastName
                      : step === "email"     ? t.phEmail
                      : t.phPhone
                  }
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {/* Mic button */}
                <button type="button" onClick={startVoice}
                  title={lang === "hi" ? "बोलकर बताएँ" : "Speak your answer"}
                  className={`grid h-10 w-10 place-items-center rounded-xl transition-colors shrink-0 ${
                    listening
                      ? "bg-red-500 text-white animate-pulse"
                      : "border border-border text-muted-foreground hover:border-primary hover:text-primary"
                  }`}>
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <button type="submit"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white hover:bg-primary-deep transition-colors shrink-0">
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
