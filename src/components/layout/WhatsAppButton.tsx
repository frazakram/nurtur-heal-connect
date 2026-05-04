import { MessageCircle } from "lucide-react";
import { useHospital } from "../../admin/context/HospitalContext";

export const WhatsAppButton = () => {
  const { info } = useHospital();
  
  return (
    <a
      href={`https://wa.me/${info.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(info.name)}%2C%20I%27d%20like%20to%20book%20an%20appointment.`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-green-500 text-white shadow-glow hover:scale-110 transition-transform"
    >
      <MessageCircle className="h-7 w-7 animate-pulse" />
    </a>
  );
};