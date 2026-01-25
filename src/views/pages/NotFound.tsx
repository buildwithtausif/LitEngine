import { useNavigate } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const NotFound = () => {
  useDocumentTitle("404: Page Not Found | LitEngine");

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 rounded-full animate-pulse" />
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl relative border border-slate-100 dark:border-slate-700">
              <AlertTriangle className="w-16 h-16 text-red-500" />
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-3">
          Page Not Found
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          Oops! The page you're looking for seems to have wandered off the
          shelves. It might have been moved or deleted.
        </p>

        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-900/20"
        >
          <Home size={20} />
          Back to Library
        </button>
      </div>
    </div>
  );
};

export default NotFound;
