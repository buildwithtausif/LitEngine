import { useState, useEffect, useRef } from "react";
import {
  Search,
  Book,
  User as UserIcon,
  Moon,
  Sun,
  Github,
} from "lucide-react";
import { useSearch } from "../contexts/SearchContext";
import { useTheme } from "../contexts/ThemeContext";
import { apiRequest } from "../services/api";
import { useTutorial } from "../contexts/TutorialContext";
import Modal from "./Modal";
import GlobalSearchDetails from "./GlobalSearchDetails";
import { GraduationCap } from "lucide-react";

interface SearchResult {
  type: "user" | "book";
  id: string;
  title: string;
  subtitle: string;
  data: any;
}

const Header = () => {
  const { searchTerm, setSearchTerm } = useSearch();
  const { theme, toggleTheme } = useTheme();
  const { isActive, toggleTutorial } = useTutorial();
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    type: "user" | "book";
    data: any;
  } | null>(null);

  // Cache for raw data to avoid constant refetching on every keystroke
  const [cachedUsers, setCachedUsers] = useState<any[]>([]);
  const [cachedBooks, setCachedBooks] = useState<any[]>([]);
  const [cachedInventory, setCachedInventory] = useState<any[]>([]);
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
            (r) => r.id === book._id && r.type === "book"
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

    setSuggestions(results.slice(0, 8)); // Limit to 8 top results
    setShowSuggestions(true);
  }, [searchTerm, cachedUsers, cachedBooks, cachedInventory]);

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
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-30 transition-colors duration-300">
      <div className="flex-1 max-w-xl" ref={searchContainerRef}>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search Users, Books, ISBN..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
          />

          {/* Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden max-h-96 overflow-y-auto">
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
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 flex items-center gap-3 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.type === "user"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                        : "bg-green-100 text-green-600 dark:bg-green-900/30"
                    }`}
                  >
                    {item.type === "user" ? (
                      <UserIcon size={16} />
                    ) : (
                      <Book size={16} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <a
          href="/dashboard/docs"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <Book size={16} />
          API Documentation
        </a>

        {/* Tutorial Toggle */}
        <button
          onClick={toggleTutorial}
          className={`p-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
            isActive
              ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 ring-1 ring-purple-500/50"
              : "text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-slate-700"
          }`}
          title={isActive ? "Hide Tutorial" : "Start Tutorial"}
        >
          <GraduationCap size={20} />
          <span className="text-sm font-medium hidden sm:inline">Demo</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <a
          href="https://github.com/buildwithtausif"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 pl-6 border-l border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Github size={18} />
          <span className="hidden sm:inline">@buildwithtausif</span>
        </a>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.type === "user" ? "User Details" : "Book Details"}
      >
        {selectedItem && (
          <GlobalSearchDetails
            type={selectedItem.type}
            data={selectedItem.data}
          />
        )}
      </Modal>
    </header>
  );
};

export default Header;
