import { useState } from "react";
import {
  Book,
  Users,
  Activity,
  AlertCircle,
  Archive,
  Github,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { apiRequest } from "../services/api";

import { useDashboardData } from "../hooks/useDashboardData";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-4">
      <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">
        {title}
      </h3>
      <div
        className={`p-2 rounded-lg ${color} bg-opacity-10 dark:bg-opacity-20`}
      >
        <Icon size={20} className={color.replace("bg-", "text-")} />
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-3xl font-bold text-slate-800 dark:text-white">
        {value}
      </span>
    </div>
  </div>
);

const Dashboard = () => {
  useDocumentTitle("Dashboard | LitEngine");

  const { stats, recentTransactions, overdueList, loading, refresh } =
    useDashboardData();
  const [returningId, setReturningId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleReturn = async (transactionId: string) => {
    if (!transactionId) return;
    setReturningId(transactionId);
    try {
      // PATCH /return expects array of objects with transaction_id
      await apiRequest("/return", "PATCH", [{ transaction_id: transactionId }]);
      toast.success("Book returned successfully!");
      await refresh();
    } catch (error) {
      console.error("Return failed", error);
      toast.error("Failed to return book.");
    } finally {
      setReturningId(null);
    }
  };

  const handleCopy = async (transactionId: string) => {
    try {
      await navigator.clipboard.writeText(transactionId);
      setCopiedId(transactionId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy", error);
    }
  };

  /* Local state for filtering history */
  const [historySearch, setHistorySearch] = useState("");

  const filteredOverdue = overdueList.filter((loan: any) => {
    const term = historySearch.toLowerCase();
    return (
      (loan.bookTitle || "").toLowerCase().includes(term) ||
      (loan.user_name || "").toLowerCase().includes(term) ||
      (loan.book_id || "").toLowerCase().includes(term) ||
      (loan._id || "").toLowerCase().includes(term) ||
      (loan.transaction_id || "").toLowerCase().includes(term)
    );
  });

  const filteredRecent = recentTransactions.filter((loan: any) => {
    const term = historySearch.toLowerCase();
    return (
      (loan.bookTitle || "").toLowerCase().includes(term) ||
      (loan.user_name || "").toLowerCase().includes(term) ||
      (loan.book_id || "").toLowerCase().includes(term) ||
      (loan._id || "").toLowerCase().includes(term) ||
      (loan.transaction_id || "").toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-10">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <StatCard
          title="Total Books"
          value={stats.totalBooks}
          icon={Book}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="bg-purple-500"
        />
        <StatCard
          title="Active Loans"
          value={stats.activeTransactions}
          icon={Activity}
          color="bg-amber-600"
        />
        <StatCard
          title="Overdue Books"
          value={stats.overdueBooks}
          icon={AlertCircle}
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10 items-start">
        {/* Overdue/Recent History Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              Overdue / History
            </h2>
            <input
              type="text"
              placeholder="Filter..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-700 dark:text-slate-300 w-full sm:w-32 sm:focus:w-48 transition-all"
            />
          </div>

          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[320px]">
            {filteredOverdue.length === 0 && filteredRecent.length === 0 && (
              <p className="text-slate-400 dark:text-slate-500 text-center py-8">
                No active transactions found.
              </p>
            )}

            {/* Show Overdue First */}
            {filteredOverdue.map((loan: any) => (
              <div
                key={loan._id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="flex-shrink-0 p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg">
                    <Book size={18} className="sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-slate-800 dark:text-white truncate">
                      {loan.bookTitle || "Unknown Book"}
                    </h4>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Due: {new Date(loan.due_by).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleReturn(loan._id)}
                  disabled={returningId === loan._id}
                  className="w-full sm:w-auto px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors flex-shrink-0"
                >
                  {returningId === loan._id ? "..." : "Return"}
                </button>
              </div>
            ))}

            {/* Then Recent Transactions (filtered) */}
            {filteredRecent.map((loan: any) => (
              <div
                key={loan._id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="flex-shrink-0 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Book size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-slate-800 dark:text-white truncate">
                      {loan.bookTitle || "Unknown Book"}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Issued to:{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {loan.user_name || "Unknown"}
                      </span>{" "}
                      <span className="text-slate-400">
                        ({loan.borrowed_by})
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Borrowed: {new Date(loan.loaned_at).toLocaleDateString()}{" "}
                      •{" "}
                      <span className="text-red-400 dark:text-red-400">
                        Due: {new Date(loan.due_date).toLocaleDateString()}
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex-shrink-0">
                        Transaction ID:
                      </span>
                      <span className="text-xs text-slate-700 dark:text-slate-200 font-medium font-mono break-all">
                        {loan._id || loan.transaction_id}
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(loan._id || loan.transaction_id)
                        }
                        className="flex-shrink-0 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        title="Copy Transaction ID"
                      >
                        {copiedId === (loan._id || loan.transaction_id) ? (
                          <Check
                            size={14}
                            className="text-green-600 dark:text-green-400"
                          />
                        ) : (
                          <Copy
                            size={14}
                            className="text-slate-600 dark:text-slate-400"
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleReturn(loan._id)}
                  disabled={returningId === loan._id}
                  className="w-full sm:w-auto self-end sm:self-auto text-slate-400 hover:text-green-600 transition-colors flex-shrink-0"
                  title="Return Book"
                >
                  {returningId === loan._id ? "..." : <Archive size={18} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Developer Attribution / Project Info */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-green-500 rounded-full blur-[100px] opacity-10"></div>
          <div className="absolute bottom-0 left-0 p-20 bg-blue-500 rounded-full blur-[80px] opacity-10"></div>

          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold">LitEngine</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ALPHA v1
                </span>
              </div>
              <p className="text-slate-300 mb-6 leading-relaxed">
                LitEngine is a robust backend API for a library management
                system, built with Node.js, Express, and PostgreSQL. It follows
                a CQRS-inspired architecture and supports inventory management,
                book lending, and user administration.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium border border-white/5">
                  Node.js
                </span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium border border-white/5">
                  Express
                </span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium border border-white/5">
                  PostgreSQL
                </span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium border border-white/5">
                  React
                </span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium border border-white/5">
                  Tailwind
                </span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 mt-4">
              <div className="flex items-center gap-4">
                <img
                  src="https://avatars.githubusercontent.com/u/55127116?v=4"
                  alt="Tausif Alam"
                  className="w-12 h-12 rounded-full border-2 border-green-500/50"
                />
                <div>
                  <p className="font-semibold">Tausif Alam</p>
                  <p className="text-sm text-slate-400">Full Stack Developer</p>
                </div>
                <a
                  href="https://github.com/buildwithtausif/litengine"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
                >
                  <Github size={16} />
                  View Source
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
