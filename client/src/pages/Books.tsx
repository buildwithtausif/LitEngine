import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { apiRequest } from "../services/api";
import BookCard from "../components/BookCard";
import Modal from "../components/Modal";
import { useSearch } from "../contexts/SearchContext";
import { Filter, X } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  publisher: string;
  stock: number;
  available?: number;
}

interface InventoryItem {
  _id: string;
  bookid: string;
  totalqty: number;
  currentqty: number;
}

const Books = () => {
  useDocumentTitle("Books | LitEngine");

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [inventoryBook, setInventoryBook] = useState<Book | null>(null);
  const [addStock, setAddStock] = useState(1);
  const { searchTerm } = useSearch();

  // Filters
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [selectedPublisher, setSelectedPublisher] = useState("");

  const fetchBooks = async () => {
    try {
      const [booksData, inventoryData] = await Promise.all([
        apiRequest<Book[]>("/books"),
        apiRequest<InventoryItem[]>("/inventory"),
      ]);

      const mergedBooks = booksData.map((book) => {
        const inv = inventoryData.find((i) => i.bookid === book._id);
        return {
          ...book,
          stock: inv ? inv.totalqty : 0,
          available: inv ? inv.currentqty : 0,
        };
      });

      setBooks(mergedBooks);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Compute unique options for filters based on OTHER active filters
  const filterOptions = useMemo(() => {
    // 1. Available Genres: Filter by Title/Author/Publisher (search) + selected Author + selected Publisher
    const genreBooks = books.filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.isbn.includes(searchTerm);
      const matchesAuthor = selectedAuthor ? b.author === selectedAuthor : true;
      const matchesPublisher = selectedPublisher
        ? b.publisher === selectedPublisher
        : true;
      return matchesSearch && matchesAuthor && matchesPublisher;
    });
    const genres = Array.from(new Set(genreBooks.map((b) => b.genre)))
      .filter(Boolean)
      .sort();

    // 2. Available Authors: Filter by Title/Author/Publisher (search) + selected Genre + selected Publisher
    const authorBooks = books.filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.isbn.includes(searchTerm);
      const matchesGenre = selectedGenre ? b.genre === selectedGenre : true;
      const matchesPublisher = selectedPublisher
        ? b.publisher === selectedPublisher
        : true;
      return matchesSearch && matchesGenre && matchesPublisher;
    });
    const authors = Array.from(new Set(authorBooks.map((b) => b.author)))
      .filter(Boolean)
      .sort();

    // 3. Available Publishers: Filter by Title/Author/Publisher (search) + selected Genre + selected Author
    const publisherBooks = books.filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.isbn.includes(searchTerm);
      const matchesGenre = selectedGenre ? b.genre === selectedGenre : true;
      const matchesAuthor = selectedAuthor ? b.author === selectedAuthor : true;
      return matchesSearch && matchesGenre && matchesAuthor;
    });
    const publishers = Array.from(
      new Set(publisherBooks.map((b) => b.publisher))
    )
      .filter(Boolean)
      .sort();

    return { genres, authors, publishers };
  }, [books, searchTerm, selectedGenre, selectedAuthor, selectedPublisher]);

  // Filter books based on search term and dropdown filters
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.isbn.includes(searchTerm);

      const matchesGenre = selectedGenre ? book.genre === selectedGenre : true;
      const matchesAuthor = selectedAuthor
        ? book.author === selectedAuthor
        : true;
      const matchesPublisher = selectedPublisher
        ? book.publisher === selectedPublisher
        : true;

      return matchesSearch && matchesGenre && matchesAuthor && matchesPublisher;
    });
  }, [books, searchTerm, selectedGenre, selectedAuthor, selectedPublisher]);

  const clearFilters = () => {
    setSelectedGenre("");
    setSelectedAuthor("");
    setSelectedPublisher("");
  };

  const handleEditBook = (book: Book) => {
    setEditingBook({ ...book });
    setIsEditModalOpen(true);
  };

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;

    try {
      // Build edit_book_stack as per API docs: {colName: 'field', value: 'newValue'}
      const editStack: { colName: string; value: string }[] = [];

      // Find original book to compare changes
      const originalBook = books.find((b) => b._id === editingBook._id);
      if (originalBook) {
        if (originalBook.title !== editingBook.title) {
          editStack.push({ colName: "title", value: editingBook.title });
        }
        if (originalBook.author !== editingBook.author) {
          editStack.push({ colName: "author", value: editingBook.author });
        }
        if (originalBook.genre !== editingBook.genre) {
          editStack.push({ colName: "genre", value: editingBook.genre });
        }
        if (originalBook.publisher !== editingBook.publisher) {
          editStack.push({
            colName: "publisher",
            value: editingBook.publisher,
          });
        }
      }

      if (editStack.length === 0) {
        toast("No changes detected.", { icon: "ℹ️" });
        return;
      }

      await apiRequest("/books", "PATCH", {
        _id: editingBook._id,
        edit_book_stack: editStack,
      });

      toast.success("Book updated successfully!");
      setIsEditModalOpen(false);
      setEditingBook(null);
      fetchBooks();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update book.");
    }
  };

  const handleAddToInventory = (book: Book) => {
    setInventoryBook(book);
    setAddStock(1);
    setIsInventoryModalOpen(true);
  };

  const submitAddToInventory = async () => {
    if (!inventoryBook) return;
    try {
      await apiRequest("/inventory", "POST", {
        bookid: inventoryBook._id,
        totalqty: addStock,
        currentqty: addStock,
      });
      toast.success(
        `Added ${addStock} copies of "${inventoryBook.title}" to inventory!`
      );
      setIsInventoryModalOpen(false);
      setInventoryBook(null);
      fetchBooks();
    } catch (e) {
      console.error(e);
      toast.error("Failed to add to inventory.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
            Book Collection
          </h1>
          {(selectedGenre || selectedAuthor || selectedPublisher) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X size={16} />
              Clear Filters
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-3">
            <Filter size={18} />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-transparent dark:bg-slate-700 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="" className="dark:bg-slate-800">
                All Genres
              </option>
              {filterOptions.genres.map((g) => (
                <option key={g} value={g} className="dark:bg-slate-800">
                  {g}
                </option>
              ))}
            </select>

            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-transparent dark:bg-slate-700 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="" className="dark:bg-slate-800">
                All Authors
              </option>
              {filterOptions.authors.map((a) => (
                <option key={a} value={a} className="dark:bg-slate-800">
                  {a}
                </option>
              ))}
            </select>

            <select
              value={selectedPublisher}
              onChange={(e) => setSelectedPublisher(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-transparent dark:bg-slate-700 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="" className="dark:bg-slate-800">
                All Publishers
              </option>
              {filterOptions.publishers.map((p) => (
                <option key={p} value={p} className="dark:bg-slate-800">
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <BookCard
              key={book._id}
              book={book}
              onEdit={handleEditBook}
              onAddToInventory={handleAddToInventory}
            />
          ))}
        </div>
      )}

      {/* Edit Book Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Book"
      >
        <form onSubmit={handleUpdateBook} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={editingBook?.title || ""}
              onChange={(e) =>
                setEditingBook(
                  editingBook ? { ...editingBook, title: e.target.value } : null
                )
              }
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-800 dark:text-white bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Author
            </label>
            <input
              type="text"
              required
              value={editingBook?.author || ""}
              onChange={(e) =>
                setEditingBook(
                  editingBook
                    ? { ...editingBook, author: e.target.value }
                    : null
                )
              }
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-800 dark:text-white bg-white dark:bg-slate-700"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Genre
              </label>
              <input
                type="text"
                value={editingBook?.genre || ""}
                onChange={(e) =>
                  setEditingBook(
                    editingBook
                      ? { ...editingBook, genre: e.target.value }
                      : null
                  )
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-800 dark:text-white bg-white dark:bg-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Publisher
              </label>
              <input
                type="text"
                value={editingBook?.publisher || ""}
                onChange={(e) =>
                  setEditingBook(
                    editingBook
                      ? { ...editingBook, publisher: e.target.value }
                      : null
                  )
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-800 dark:text-white bg-white dark:bg-slate-700"
              />
            </div>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            ISBN: {editingBook?.isbn} | ID: {editingBook?._id}
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Update Book
          </button>
        </form>
      </Modal>

      {/* Add to Inventory Modal */}
      <Modal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        title="Add to Inventory"
      >
        <div className="space-y-4">
          {inventoryBook && (
            <div className="p-4 bg-blue-50 dark:bg-slate-700/50 border border-blue-100 dark:border-slate-600 rounded-lg">
              <p className="font-bold text-slate-800 dark:text-white">
                {inventoryBook.title}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                by {inventoryBook.author}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {inventoryBook.genre} • {inventoryBook.publisher}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Stock Quantity
            </label>
            <input
              type="number"
              min="1"
              value={addStock}
              onChange={(e) => setAddStock(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-800 dark:text-white bg-white dark:bg-slate-700"
            />
          </div>
          <button
            onClick={submitAddToInventory}
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Add to Inventory
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Books;
