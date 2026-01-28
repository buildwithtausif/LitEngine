import { useState, useEffect, useRef } from "react";
import {
  Search,
  Book,
  User as UserIcon,
  Moon,
  Sun,
  Github,
  Menu,
  Receipt,
} from "lucide-react";
import { useSearch } from "../contexts/SearchContext";
import { useTheme } from "../contexts/ThemeContext";
import { apiRequest } from "../services/api";
import { useTutorial } from "../contexts/TutorialContext";
import Modal from "./Modal";
import GlobalSearchDetails from "./GlobalSearchDetails";
import { GraduationCap } from "lucide-react";
import { useSidebar } from "../contexts/SidebarContext";

interface SearchResult {
  type: "user" | "book" | "transaction";
  id: string;
  title: string;
  subtitle: string;
  data: any;
}

const Header = () => {
  const { searchTerm, setSearchTerm } = useSearch();
  const { theme, toggleTheme } = useTheme();
  const { isActive, toggleTutorial } = useTutorial();
  const { toggleSidebar } = useSidebar();
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    type: "user" | "book" | "transaction";
    data: any;
  } | null>(null);

  // Cache for raw data to avoid constant refetching on every keystroke
  const [cachedUsers, setCachedUsers] = useState<any[]>([]);
  const [cachedBooks, setCachedBooks] = useState<any[]>([]);
  const [cachedInventory, setCachedInventory] = useState<any[]>([]);
  const [cachedTransactions, setCachedTransactions] = useState<any[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch data only once when search interaction begins or on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, books, inventory] = await Promise.all([
          apiRequest<any[]>("/users"),
          apiRequest<any[]>("/books"),
          apiRequest<any[]>("/inventory"),
        ]);
        setCachedUsers(users);
        setCachedBooks(books);
        setCachedInventory(inventory);

        // Extract all active transactions from books
        const allTransactions: any[] = [];
        books.forEach((book) => {
          if (book.loans && Array.isArray(book.loans)) {
            book.loans.forEach((loan: any) => {
              allTransactions.push({
                ...loan,
                book_title: book.title,
                book_isbn: book.isbn,
                book_id: book._id,
              });
            });
          }
        });
        setCachedTransactions(allTransactions);
      } catch (e) {
        console.error("Failed to fetch search data", e);
      }
    };
    fetchData();
  }, []);

  // Filter results based on search term
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const results: SearchResult[] = [];

    // Search Users
    cachedUsers.forEach((user) => {
      if (
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user._id.toLowerCase().includes(term)
      ) {
        results.push({
          type: "user",
          id: user._id,
          title: user.name,
          subtitle: `User • ${user.email}`,
          data: user,
        });
      }
    });

    // Search Books (by Title, Author, ISBN, Book ID)
    cachedBooks.forEach((book) => {
      if (
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term) ||
        book.isbn.includes(term) ||
        book._id.toLowerCase().includes(term)
      ) {
        results.push({
          type: "book",
          id: book._id,
          title: book.title,
          subtitle: `Book • ${book.author}`,
          data: book,
        });
      }
    });

    // Search Inventory (by Inventory ID) -> Map to Book
    cachedInventory.forEach((inv) => {
      if (inv._id.toLowerCase().includes(term)) {
        // Find associated book
        const book = cachedBooks.find((b) => b._id === inv.bookid);
        if (book) {
          // Avoid duplicates if already found by book search
          const exists = results.find(
            (r) => r.id === book._id && r.type === "book",
          );
          if (!exists) {
            results.push({
              type: "book",
              id: book._id,
              title: book.title,
              subtitle: `Inventory Match • ID: ${inv._id}`,
              data: book,
            });
          }
        }
      }
    });

    // Search Transactions (by Transaction ID)
    cachedTransactions.forEach((transaction) => {
      if (transaction.transaction_id.toLowerCase().includes(term)) {
        results.push({
          type: "transaction",
          id: transaction.transaction_id,
          title: `Transaction: ${transaction.transaction_id}`,
          subtitle: `${transaction.book_title} • Borrowed by ${transaction.user_name}`,
          data: transaction,
        });
      }
    });

    setSuggestions(results.slice(0, 8)); // Limit to 8 top results
    setShowSuggestions(true);
  }, [
    searchTerm,
    cachedUsers,
    cachedBooks,
    cachedInventory,
    cachedTransactions,
  ]);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 lg:h-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 transition-colors duration-300">
      {/* Hamburger Menu - Mobile Only */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-2"
        aria-label="Toggle menu"
      >
        <Menu size={24} className="text-slate-600 dark:text-slate-300" />
      </button>

      <div className="flex-1 max-w-xl" ref={searchContainerRef}>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full pl-9 lg:pl-10 pr-3 lg:pr-4 py-2 lg:py-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
          />

          {/* Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden max-h-96 overflow-y-auto z-50">
              <div className="p-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900">
                Results
              </div>
              {suggestions.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    setSelectedItem({ type: item.type, data: item.data });
                    setShowSuggestions(false);
                    setSearchTerm("");
                  }}
                  className="w-full text-left px-3 sm:px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 flex items-start gap-3 transition-colors"
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      item.type === "user"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                        : item.type === "book"
                          ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                          : "bg-purple-100 text-purple-600 dark:bg-purple-900/30"
                    }`}
                  >
                    {item.type === "user" ? (
                      <UserIcon size={16} />
                    ) : item.type === "book" ? (
                      <Book size={16} />
                    ) : (
                      <Receipt size={16} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 dark:text-slate-100 text-sm break-words">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 break-words mt-0.5">
                      {item.subtitle}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Actions - Desktop */}
      <div className="hidden lg:flex items-center gap-4">
        {/* Tutorial Toggle */}
        <button
          onClick={toggleTutorial}
          className={`p-2 rounded-lg transition-colors ${
            isActive
              ? "bg-green-100 text-green-600 dark:bg-green-900/30"
              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}
          title={isActive ? "Hide Tutorial" : "Show Tutorial"}
        >
          <GraduationCap size={20} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun size={20} className="text-slate-300" />
          ) : (
            <Moon size={20} className="text-slate-600" />
          )}
        </button>
        
        {/* API Docs Link */}
        <a
          href="/docs"
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          API Docs
        </a>
      </div>

      {/* Right Hamburger Menu - Mobile */}
      <div className="lg:hidden relative">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle actions menu"
        >
          <Menu size={24} className="text-slate-600 dark:text-slate-300" />
        </button>

        {/* Mobile Actions Dropdown */}
        {showMobileMenu && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setShowMobileMenu(false)}
            />

            {/* Menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-[9998]">
              <a
                href="/docs"
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700"
                onClick={() => setShowMobileMenu(false)}
              >
                <Book size={18} />
                <span className="text-sm font-medium">API Docs</span>
              </a>

              <button
                onClick={() => {
                  toggleTutorial();
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700"
              >
                <GraduationCap size={18} />
                <span className="text-sm font-medium">
                  {isActive ? "Hide Tutorial" : "Show Tutorial"}
                </span>
              </button>

              <button
                onClick={() => {
                  toggleTheme();
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                <span className="text-sm font-medium">
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
              </button>

              <a
                href="https://github.com/buildwithtausif/LitEngine"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                onClick={() => setShowMobileMenu(false)}
              >
                <Github size={18} />
                <span className="text-sm font-medium">GitHub</span>
              </a>
            </div>
          </>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={
          selectedItem?.type === "user"
            ? "User Details"
            : selectedItem?.type === "book"
              ? "Book Details"
              : "Transaction Details"
        }
      >
        {selectedItem && selectedItem.type !== "transaction" && (
          <GlobalSearchDetails
            type={selectedItem.type}
            data={selectedItem.data}
          />
        )}
        {selectedItem && selectedItem.type === "transaction" && (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <label className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider">
                Transaction ID
              </label>
              <div className="text-sm font-medium text-slate-800 dark:text-white mt-1 break-all">
                {selectedItem.data.transaction_id}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1">
                  Book
                </label>
                <div className="font-medium text-slate-800 dark:text-white">
                  {selectedItem.data.book_title}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  ISBN: {selectedItem.data.book_isbn}
                </div>
              </div>
              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1">
                  Borrowed By
                </label>
                <div className="font-medium text-slate-800 dark:text-white">
                  {selectedItem.data.user_name}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  ID: {selectedItem.data.borrowed_by}
                </div>
              </div>
              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1">
                  Due Date
                </label>
                <div className="font-medium text-slate-800 dark:text-white">
                  {new Date(selectedItem.data.due_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </header>
  );
};

export default Header;
