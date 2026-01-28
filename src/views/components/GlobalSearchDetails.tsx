import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

interface User {
  _id: string;
  name: string;
  email: string;
  contact_number: string;
  address: string;
  status: string;
  created_at: string;
}

interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  publisher: string;
  loans?: Transaction[]; // We will augment this if needed or fetch separately
}

interface Transaction {
  _id: string; // transaction UUID
  loaned_to: string; // user UUID
  loaned_item: string; // book/inventory UUID
  loaned_at: string;
  due_by: string;
  returned_at?: string;
  book_title?: string; // Augmented
  book_isbn?: string; // Augmented
}

interface InventoryItem {
  bookid: string;
  totalqty: number;
  currentqty: number;
}

interface GlobalSearchDetailsProps {
  type: "user" | "book";
  data: User | Book;
}

const GlobalSearchDetails = ({ type, data }: GlobalSearchDetailsProps) => {
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<Transaction[]>([]);
  const [inventoryDetails, setInventoryDetails] =
    useState<InventoryItem | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        if (type === "user") {
          // Fetch all active loans/transactions for this user
          // Since we don't have a direct "get loans by user" endpoint,
          // we mimic the Transactions.tsx logic: get all books with their loans
          const user = data as User;
          const allBooks = await apiRequest<Book[]>("/books");
          const userTransactions: Transaction[] = [];

          allBooks.forEach((book) => {
            if (book.loans && Array.isArray(book.loans)) {
              // The loan object from API might differ slightly in key names in some versions,
              // but checking Transactions.tsx: loans have transaction_id, user_name, borrowed_by etc.
              // Wait, Transactions.tsx showed `book.loans` returns an array of objects.
              // Let's re-verify the structure from Transactions.tsx.
              // It has: transaction_id, user_name, borrowed_by, due_date.
              // It does NOT seem to have standard schema keys like _id, loaned_to directly exposed?
              // Let's assume the shape from Transactions.tsx for safety,
              // but we also need the *raw* transaction if we want history?
              // Actually the `loans` on book object seems to be "Active" loans usually.

              // Let's trust the Transactions.tsx interface:
              // interface Transaction { transaction_id, user_name, borrowed_by, due_date }
              // So we match `borrowed_by` (which is user ID) to our user._id

              book.loans.forEach((loan: any) => {
                if (loan.borrowed_by === user._id) {
                  userTransactions.push({
                    _id: loan.transaction_id,
                    loaned_to: loan.borrowed_by,
                    loaned_item: book._id, // approximation
                    loaned_at: "Unknown", // API doesn't seem to send this in the short view
                    due_date: loan.due_date, // mapping due_by
                    book_title: book.title,
                    book_isbn: book.isbn,
                    due_by: loan.due_date, // keep both for safety
                  } as any);
                }
              });
            }
          });
          setLoans(userTransactions);
        } else if (type === "book") {
          const book = data as Book;
          // Fetch inventory stock for this book
          const invData = await apiRequest<InventoryItem[]>("/inventory");
          const inv = invData.find((i) => i.bookid === book._id);
          setInventoryDetails(inv || null);
        }
      } catch (e) {
        console.error("Error fetching details", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [type, data]);

  if (loading) {
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        Loading details...
      </div>
    );
  }

  if (type === "user") {
    const user = data as User;
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {user.name}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
            <div className="flex gap-2 mt-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                ID: {user._id}
              </span>
              {user.status && (
                <span
                  className={`px-2 py-1 rounded capitalize ${
                    user.status === "active"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  }`}
                >
                  {user.status}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-slate-500 dark:text-slate-400 block mb-1">
              Email
            </label>
            <div className="font-medium text-slate-800 dark:text-white break-words">
              {user.email || "N/A"}
            </div>
          </div>
          <div>
            <label className="text-slate-500 dark:text-slate-400 block mb-1">
              Member Since
            </label>
            <div className="font-medium text-slate-800 dark:text-white">
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : "N/A"}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-3">
            Active Loans ({loans.length})
          </h3>
          {loans.length > 0 ? (
            <div className="space-y-3">
              {loans.map((loan) => {
                const isOverdue = new Date(loan.due_by) < new Date();
                return (
                  <div
                    key={loan._id}
                    className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {loan.book_title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Due: {new Date(loan.due_by).toLocaleDateString()}
                      </p>
                    </div>
                    {isOverdue && (
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                        Overdue
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              No active book loans.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (type === "book") {
    const book = data as Book;
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {book.title}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            by {book.author}
          </p>
          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 font-mono">
            ID: {book._id} | ISBN: {book.isbn}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
          <div>
            <label className="text-slate-500 dark:text-slate-400 block">
              Genre
            </label>
            <div className="font-medium text-slate-800 dark:text-white">
              {book.genre}
            </div>
          </div>
          <div>
            <label className="text-slate-500 dark:text-slate-400 block">
              Publisher
            </label>
            <div className="font-medium text-slate-800 dark:text-white">
              {book.publisher}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-2">
            Inventory Status
          </h3>
          {inventoryDetails ? (
            <div className="flex gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex-1">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {inventoryDetails.totalqty}
                </div>
                <div className="text-xs text-blue-800 dark:text-blue-300">
                  Total Copies
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex-1">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {inventoryDetails.currentqty}
                </div>
                <div className="text-xs text-green-800 dark:text-green-300">
                  Available
                </div>
              </div>
              <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex-1">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {inventoryDetails.totalqty - inventoryDetails.currentqty}
                </div>
                <div className="text-xs text-amber-800 dark:text-amber-300">
                  Borrowed
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              No inventory records found for this book.
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default GlobalSearchDetails;
