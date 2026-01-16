import { useState, useEffect } from "react";
import { BookUp, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiRequest } from "../services/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

interface Book {
  _id: string;
  title: string;
  isbn: string;
  available?: number;
}

interface InventoryItem {
  _id: string;
  bookid: string;
  totalqty: number;
  currentqty: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

const Checkout = () => {
  useDocumentTitle("Check-out | LitEngine");

  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [booksData, inventoryData, usersData] = await Promise.all([
        apiRequest<Book[]>("/books"),
        apiRequest<InventoryItem[]>("/inventory"),
        apiRequest<User[]>("/users"),
      ]);

      const mergedBooks = booksData.map((book) => {
        const inv = inventoryData.find((i) => i.bookid === book._id);
        return {
          ...book,
          available: inv ? inv.currentqty : 0,
        };
      });

      setBooks(mergedBooks.filter((b) => b.available && b.available > 0));
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest("/borrow", "POST", {
        user_id: selectedUser,
        books: [{ bookid: selectedBook }],
      });
      toast.success("Book borrowed successfully!");
      setSelectedBook("");
      setSelectedUser("");

      // Refresh available books
      fetchData();
    } catch (error) {
      toast.error("Failed to borrow book");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          Check-out Books
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Process a new loan for a member.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
        <form onSubmit={handleBorrow} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Select Member
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <select
                required
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/20 appearance-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white transition-colors"
              >
                <option value="">Search member...</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Select Book
            </label>
            <div className="relative">
              <BookUp
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <select
                required
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/20 appearance-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white transition-colors"
              >
                <option value="">Search book by title or ISBN...</option>
                {books.map((book) => (
                  <option key={book._id} value={book._id}>
                    {book.title} (ISBN: {book.isbn}) - {book.available} left
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !selectedBook || !selectedUser}
              className="w-full btn btn-primary py-3 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg font-bold shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Processing..." : "Confirm Check-out"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
