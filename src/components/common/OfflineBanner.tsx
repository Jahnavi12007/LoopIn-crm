import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Shows a subtle banner when the device goes offline. */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-gold-100 px-4 py-1.5 text-xs font-medium text-gold-900"
    >
      <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
      You're offline — changes are saved on this device and will sync when you reconnect.
    </div>
  );
}
