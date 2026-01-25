import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { apiRequest } from "../services/api";
import {
  BookPlus,
  Package,
  Search,
  X,
  CheckSquare,
  Square,
  Plus,
  Trash2,
} from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  publisher: string;
}

interface SelectedBook extends Book {
  quantity: number;
}

interface NewBookEntry {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  customGenre: string;
  publisher: string;
  stock: number;
}

const GENRE_OPTIONS = [
  "Fiction",
  "Non-Fiction",
  "Science",
  "History",
  "Technology",
  "Philosophy",
  "Other",
];

const createEmptyBook = (): NewBookEntry => ({
  id: crypto.randomUUID(),
  title: "",
  author: "",
  isbn: "",
  genre: "Fiction",
  customGenre: "",
  publisher: "",
  stock: 1,
});

const AddBook = () => {
  useDocumentTitle("Add Books | LitEngine");
  const [isInventoryMode, setIsInventoryMode] = useState(false);
  const [existingBooks, setExistingBooks] = useState<Book[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<SelectedBook[]>([]);
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // For bulk book collection import
  const [bookEntries, setBookEntries] = useState<NewBookEntry[]>([
    createEmptyBook(),
  ]);
  const [loading, setLoading] = useState(false);

  // Fetch existing books for autocomplete
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const data = await apiRequest<Book[]>("/books");
        setExistingBooks(data);
      } catch (e) {
        console.error("Failed to fetch books", e);
      }
    };
    fetchBooks();
  }, []);

  // Handle search for autocomplete
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const alreadySelectedIds = selectedBooks.map((b) => b._id);
    const matches = existingBooks.filter(
      (b) =>
        !alreadySelectedIds.includes(b._id) &&
        (b.title.toLowerCase().includes(query.toLowerCase()) ||
          b.isbn.includes(query))
    );
    setSuggestions(matches.slice(0, 5));
    setShowSuggestions(matches.length > 0);
  };

  // Add a book to selection (inventory mode)
  const addToSelection = (selected: Book) => {
    setSelectedBooks([...selectedBooks, { ...selected, quantity: 1 }]);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Remove a book from selection
  const removeFromSelection = (bookId: string) => {
    setSelectedBooks(selectedBooks.filter((b) => b._id !== bookId));
  };

  // Update quantity for a selected book
  const updateQuantity = (bookId: string, qty: number) => {
    setSelectedBooks(
      selectedBooks.map((b) =>
        b._id === bookId ? { ...b, quantity: Math.max(1, qty) } : b
      )
    );
  };

  // Add new book row for bulk import
  const addBookRow = () => {
    setBookEntries([...bookEntries, createEmptyBook()]);
  };

  // Remove a book row
  const removeBookRow = (id: string) => {
    if (bookEntries.length > 1) {
      setBookEntries(bookEntries.filter((b) => b.id !== id));
    }
  };

  // Update a book entry field
  const updateBookEntry = (
    id: string,
    field: keyof NewBookEntry,
    value: string | number
  ) => {
    setBookEntries((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isInventoryMode) {
        if (selectedBooks.length === 0) {
          toast.error("Please select at least one book.");
          setLoading(false);
          return;
        }

        // Bulk add to inventory
        const inventoryPayload = {
          inventory: selectedBooks.map((b) => ({
            bookid: b._id,
            totalqty: b.quantity,
          })),
        };

        await apiRequest("/inventory", "POST", inventoryPayload);
        toast.success(`Added ${selectedBooks.length} book(s) to Inventory!`);
        setSelectedBooks([]);
      } else {
        // Validate all entries have required fields
        const validEntries = bookEntries.filter(
          (b) => b.title.trim() && b.author.trim()
        );

        if (validEntries.length === 0) {
          toast.error(
            "Please fill in at least one book with title and author."
          );
          setLoading(false);
          return;
        }

        // Bulk add books to collection
        const booksPayload = validEntries.map((b) => ({
          title: b.title,
          author: b.author,
          isbn: b.isbn || null,
          genre:
            b.genre === "Other" && b.customGenre.trim()
              ? b.customGenre.trim()
              : b.genre,
          publisher: b.publisher || null,
        }));

        const createdBooks = await apiRequest<any[]>(
          "/books",
          "POST",
          booksPayload
        );

        // Add each book to inventory
        const inventoryItems = [];
        const created = Array.isArray(createdBooks)
          ? createdBooks
          : [createdBooks];

        for (let i = 0; i < created.length; i++) {
          const book = created[i];
          const entry = validEntries[i];
          if (book && book._id) {
            inventoryItems.push({
              bookid: book._id,
              totalqty: entry.stock,
            });
          }
        }

        if (inventoryItems.length > 0) {
          await apiRequest("/inventory", "POST", { inventory: inventoryItems });
        }

        toast.success(
          `Added ${created.length} book(s) to Collection and Inventory!`
        );
        setBookEntries([createEmptyBook()]);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        isInventoryMode
          ? "Failed to add to inventory. Some books may already exist."
          : "Failed to add books. Ensure ISBNs are unique."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedBooks([]);
    setSearchQuery("");
    setBookEntries([createEmptyBook()]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
          Add Books
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Bulk import new titles or add existing books to inventory.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-medium text-slate-800 dark:text-white text-sm sm:text-base">
              {isInventoryMode
                ? "Add Existing Books to Inventory"
                : "Add New Books to Collection"}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {isInventoryMode
                ? "Search and select multiple books to add stock (bulk operation)"
                : "Import multiple new book entries at once"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsInventoryMode(!isInventoryMode);
              resetForm();
            }}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              isInventoryMode ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                isInventoryMode ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
        <form onSubmit={handleSubmit} className="space-y-6">
          {isInventoryMode ? (
            <>
              {/* Inventory Mode - Search and Select */}
              <div className="relative" ref={suggestionsRef}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Search Book by Title or ISBN
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white placeholder-slate-400"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search and add multiple books..."
                  />
                </div>

                {showSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((b) => (
                      <button
                        key={b._id}
                        type="button"
                        onClick={() => addToSelection(b)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 flex items-center gap-3 transition-colors"
                      >
                        <Square size={16} className="text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            {b.title}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            by {b.author} • ISBN: {b.isbn || "N/A"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Books List */}
              {selectedBooks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Selected Books ({selectedBooks.length})
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedBooks.map((b) => (
                      <div
                        key={b._id}
                        className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-slate-700/50 border border-blue-100 dark:border-slate-600 rounded-lg"
                      >
                        <CheckSquare
                          size={18}
                          className="text-blue-500 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 dark:text-white truncate">
                            {b.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            by {b.author}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500 dark:text-slate-400">
                            Qty:
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={b.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                b._id,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-16 px-2 py-1 text-center border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromSelection(b._id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedBooks.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Package size={40} className="mx-auto mb-2 opacity-50" />
                  <p>Search and select books to add to inventory</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Collection Mode - Bulk Import Form */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Books to Add ({bookEntries.length})
                  </p>
                  <button
                    type="button"
                    onClick={addBookRow}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border border-transparent dark:border-green-900/50"
                  >
                    <Plus size={16} />
                    Add Another
                  </button>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {bookEntries.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Book {index + 1}
                        </span>
                        {bookEntries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBookRow(entry.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          required
                          type="text"
                          placeholder="Title *"
                          value={entry.title}
                          onChange={(e) =>
                            updateBookEntry(entry.id, "title", e.target.value)
                          }
                          className="px-3 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 text-slate-800 dark:text-white placeholder-slate-400 text-base"
                        />
                        <input
                          required
                          type="text"
                          placeholder="Author *"
                          value={entry.author}
                          onChange={(e) =>
                            updateBookEntry(entry.id, "author", e.target.value)
                          }
                          className="px-3 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 text-slate-800 dark:text-white placeholder-slate-400 text-base"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <input
                          type="text"
                          placeholder="ISBN"
                          value={entry.isbn}
                          onChange={(e) =>
                            updateBookEntry(entry.id, "isbn", e.target.value)
                          }
                          className="px-3 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 text-slate-800 dark:text-white placeholder-slate-400 text-base"
                        />
                        <div className="flex flex-col gap-1">
                          <select
                            value={entry.genre || GENRE_OPTIONS[0]}
                            onChange={(e) => {
                              const newGenre = e.target.value;
                              updateBookEntry(entry.id, "genre", newGenre);
                              if (newGenre !== "Other") {
                                updateBookEntry(entry.id, "customGenre", "");
                              }
                            }}
                            className="px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 text-slate-800 dark:text-white"
                          >
                            {GENRE_OPTIONS.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                          {entry.genre === "Other" && (
                            <input
                              type="text"
                              placeholder="Describe genre"
                              value={entry.customGenre}
                              onChange={(e) =>
                                updateBookEntry(
                                  entry.id,
                                  "customGenre",
                                  e.target.value
                                )
                              }
                              className="px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 text-slate-800 dark:text-white text-sm placeholder-slate-400"
                            />
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Publisher"
                          value={entry.publisher}
                          onChange={(e) =>
                            updateBookEntry(
                              entry.id,
                              "publisher",
                              e.target.value
                            )
                          }
                          className="px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 text-slate-800 dark:text-white placeholder-slate-400"
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            Stock:
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={entry.stock}
                            onChange={(e) =>
                              updateBookEntry(
                                entry.id,
                                "stock",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 text-slate-800 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              (isInventoryMode && selectedBooks.length === 0) ||
              (!isInventoryMode &&
                !bookEntries.some((b) => b.title.trim() && b.author.trim()))
            }
            className={`w-full py-3 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors ${
              isInventoryMode
                ? "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20"
                : "bg-green-500 hover:bg-green-600 text-white shadow-green-500/20"
            }`}
          >
            {isInventoryMode ? <Package size={20} /> : <BookPlus size={20} />}
            {loading
              ? "Processing..."
              : isInventoryMode
              ? `Add ${selectedBooks.length} Book(s) to Inventory`
              : `Add ${
                  bookEntries.filter((b) => b.title && b.author).length
                } Book(s) to Library`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddBook;
