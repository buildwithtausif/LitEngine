import { AlertTriangle } from "lucide-react";

const Ticker = () => {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/50 px-4 py-2 flex items-center justify-center gap-3 transition-colors duration-300">
      <AlertTriangle
        size={16}
        className="text-amber-600 dark:text-amber-500 flex-shrink-0"
      />
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200 text-center">
        Demo Mode: Database operations are capped at 10 per IP session to
        maintain server stability.
      </p>
    </div>
  );
};

export default Ticker;
