import { AlertTriangle, Clock } from "lucide-react";
import { useEffect, useState } from "react";

const Ticker = () => {
  const [tickerState, setTickerState] = useState<{
    type: "info" | "warning";
    message: string;
  }>({
    type: "info",
    message:
      "Demo Mode: Please use dummy data (no PII) as this environment is public. IP addresses are never stored/shared and are used only for rate limiting. Database operations are capped at 10 per IP session.",
  });

  useEffect(() => {
    const handleRateLimit = (event: Event) => {
      const customEvent = event as CustomEvent;
      setTickerState({
        type: "warning",
        message: customEvent.detail.message,
      });
    };

    window.addEventListener("rate-limit-hit", handleRateLimit);
    return () => window.removeEventListener("rate-limit-hit", handleRateLimit);
  }, []);

  return (
    <div
      className={`border-b px-4 py-2 flex items-center justify-center gap-3 transition-colors duration-300 ${
        tickerState.type === "warning"
          ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50"
          : "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/50"
      }`}
    >
      {tickerState.type === "warning" ? (
        <Clock
          size={16}
          className="text-red-600 dark:text-red-500 flex-shrink-0"
        />
      ) : (
        <AlertTriangle
          size={16}
          className="text-amber-600 dark:text-amber-500 flex-shrink-0"
        />
      )}
      <div className="flex-1 overflow-hidden relative mx-4">
        <p
          className={`text-sm font-medium animate-marquee ${
            tickerState.type === "warning"
              ? "text-red-800 dark:text-red-200"
              : "text-amber-800 dark:text-amber-200"
          }`}
        >
          {tickerState.message}
        </p>
      </div>
    </div>
  );
};

export default Ticker;
