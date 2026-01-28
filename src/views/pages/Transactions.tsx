import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { Search, Copy, Check } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

interface Transaction {
  transaction_id: string;
  user_name: string;
  borrowed_by: string;
  due_date: string;
  book_title?: string;
  book_isbn?: string;
}

interface Book {
  _id: string;
  title: string;
  isbn: string;
  loans: Transaction[];
}

const Transactions = () => {
  useDocumentTitle("Active Transactions | LitEngine");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [returningId, setReturningId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const booksData = await apiRequest<Book[]>("/books");
      const allTransactions: Transaction[] = [];

      booksData.forEach((book) => {
        if (book.loans && Array.isArray(book.loans)) {
          book.loans.forEach((loan) => {
            allTransactions.push({
              ...loan,
              book_title: book.title,
              book_isbn: book.isbn,
            });
          });
        }
      });

      // Sort by due date ascending (overdue first)
      allTransactions.sort(
        (a, b) =>
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      );
      setTransactions(allTransactions);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleReturn = async (transactionId: string) => {
    if (!transactionId) return;
    if (!confirm("Are you sure you want to return this book?")) return;

    setReturningId(transactionId);
    try {
      await apiRequest("/return", "PATCH", [{ transaction_id: transactionId }]);
      await fetchTransactions(); // Refresh list
    } catch (error) {
      console.error("Return failed", error);
      alert("Failed to return book.");
    } finally {
      setReturningId(null);
    }
  };

  const handleCopy = async (transactionId: string) => {
    try {
      await navigator.clipboard.writeText(transactionId);
      setCopiedId(transactionId);
      setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error("Failed to copy", error);
    }
  };

  const filteredTransactions = transactions.filter(
    (t) =>
      t.transaction_id.toLowerCase().includes(search.toLowerCase()) ||
      t.user_name.toLowerCase().includes(search.toLowerCase()) ||
      (t.book_title &&
        t.book_title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
          Active Transactions
        </h1>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 w-full sm:w-80"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Transaction ID
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Book
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                    User
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Due Date
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Status
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((t) => {
                    const isOverdue = new Date(t.due_date) < new Date();
                    return (
                      <tr
                        key={t.transaction_id}
                        className="border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 break-all">
                              {t.transaction_id}
                            </span>
                            <button
                              onClick={() => handleCopy(t.transaction_id)}
                              className="flex-shrink-0 p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                              title="Copy Transaction ID"
                            >
                              {copiedId === t.transaction_id ? (
                                <Check
                                  size={16}
                                  className="text-green-600 dark:text-green-400"
                                />
                              ) : (
                                <Copy
                                  size={16}
                                  className="text-slate-600 dark:text-slate-400"
                                />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-sm font-medium text-slate-800 dark:text-white">
                          {t.book_title}
                          <br />
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            ISBN: {t.book_isbn}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                          {t.user_name}
                          <br />
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            ID: {t.borrowed_by}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                          {new Date(t.due_date).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              isOverdue
                                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                            }`}
                          >
                            {isOverdue ? "Overdue" : "Active"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleReturn(t.transaction_id)}
                            disabled={returningId === t.transaction_id}
                            className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
                          >
                            {returningId === t.transaction_id
                              ? "..."
                              : "Return"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-slate-400 dark:text-slate-500"
                    >
                      No active transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
